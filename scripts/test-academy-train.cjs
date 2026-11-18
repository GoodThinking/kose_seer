'use strict';
// 精灵学院训练室与野怪一阶化：隔离 SQLite + 真实 PlayerInstance/BattleManager/MapSpawnManager。
// 用法：node scripts/test-academy-train.cjs <完整 app 目录> [证据 json]
const assert = require('node:assert/strict');
const fs = require('node:fs'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const app = path.resolve(process.argv[2]);
const evidence = process.argv[3] && path.resolve(process.argv[3]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
load('DataBase/loaders/DataLoader');
const { Logger } = load('shared/utils');
for (const name of ['Info', 'Debug', 'Warn']) Logger[name] = () => {};
const { Config } = load('shared/config/ServerConfig');
const { ConfigLoader } = load('shared/config/ConfigLoader');
const { ConfigRegistry } = load('shared/config/ConfigRegistry');
const { GetGameConfigRegistrations } = load('shared/config/ConfigDefinitions');
const { DatabaseManager } = load('DataBase/DatabaseManager');
const { MigrationRunner } = load('DataBase/migrations/MigrationRunner');
const { DataSaver } = load('DataBase/savers/DataSaver');
const { AccountRepository } = load('DataBase/repositories/Player/AccountRepository');
const { PlayerRepository } = load('DataBase/repositories/Player/PlayerRepository');
const { PlayerInstance } = load('GameServer/Game/Player/PlayerInstance');
const { PetCalculator } = load('GameServer/Game/Pet/PetCalculator');
const { GameConfig } = load('shared/config/game/GameConfig');
const db = DatabaseManager.Instance;
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'seer-academy-train-'));
const players = [], results = [];
const EV = ['evHp', 'evAtk', 'evDef', 'evSpAtk', 'evSpDef', 'evSpeed'];
let identity = 1840000000;

async function account(name, petId, level) {
  const uid = await new AccountRepository().CreateAccount(name + crypto.randomBytes(5).toString('hex') + '@train.invalid', crypto.createHash('md5').update('TrainFixtureOnly!').digest('hex'));
  await new PlayerRepository().CreatePlayer(uid, name, 0x3399cc);
  await new AccountRepository().UpdateRoleCreated(uid, true);
  const session = { Socket: { destroyed: false, write: () => true } };
  const player = new PlayerInstance(session, uid, {}); session.Player = player;
  player.SendPacket = async () => {};
  await player.Initialize(); players.push(player);
  for (const pet of [...player.PetManager.GetPetsInBag()]) pet.isDefault = false;
  assert.equal(await player.PetManager.GivePet(petId, level, identity++), true);
  const lead = player.PetManager.GetPetsInBag().find(p => p.petId === petId);
  for (const pet of player.PetManager.GetPetsInBag()) pet.isDefault = pet === lead;
  return { player, lead };
}
const lead = ctx => ctx.player.PetManager.GetPetByCatchTime(ctx.lead.catchTime);
const evOf = pet => Object.fromEntries(EV.map(k => [k, pet[k]]));
const totalExp = pet => PetCalculator.CalculateExpForLevel(pet.level, pet.petId) + pet.exp;
async function victory(ctx, map, param) {
  const manager = ctx.player.BattleManager;
  ctx.player.Data.mapID = map;
  await manager.HandleChallengeBoss(map, param);
  const battle = manager.GetCurrentBattle();
  assert.ok(battle, `Boss battle ${map}/${param} must start`);
  const enemy = { id: battle.enemy.id, level: battle.enemy.level };
  await manager.HandleReadyToFight();
  battle.enemy.hp = 0;
  await manager.HandleFightOver(ctx.player.Uid, 0);
  await new Promise(resolve => setTimeout(resolve, 1400));
  return enemy;
}
function diff(before, after) { return Object.fromEntries(EV.map(k => [k, after[k] - before[k]]).filter(([, v]) => v)); }

(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  Config.Config.database = { type: 'sqlite', path: path.join(temporary, 'test.sqlite') };
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations()); await ConfigRegistry.Instance.Initialize();
  await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load();
  await db.Initialize(); await new MigrationRunner().RunAll();

  // 1. 学习力训练室：只加本室单项，初级 +5 / 高级 +10
  for (const [map, field, gain] of [[488, 'evAtk', 5], [489, 'evDef', 5], [490, 'evSpAtk', 5], [491, 'evSpDef', 5], [492, 'evSpeed', 5], [493, 'evHp', 5],
    [470, 'evAtk', 10], [471, 'evDef', 10], [472, 'evSpAtk', 10], [473, 'evSpDef', 10], [474, 'evSpeed', 10], [475, 'evHp', 10]]) {
    const ctx = await account('Ev' + map, 7, 30);
    const before = evOf(lead(ctx));
    const enemy = await victory(ctx, map, 3);
    const d = diff(before, evOf(lead(ctx)));
    assert.deepEqual(d, { [field]: gain }, `Room ${map} EV gain`);
    results.push({ case: 'ev-room', map, enemy: enemy.id, gain: d });
  }
  // 2. 十倍学习力卡（player_reward_boosts）：训练室定向加点同样 ×10，普通首领按产出 ×10
  {
    const ctx = await account('EvCard', 7, 30);
    await db.Execute('INSERT INTO player_reward_boosts (owner_id, kind, multiplier, expires_at) VALUES (?, ?, ?, ?)', [ctx.player.Uid, 'learning', 10, Math.floor(Date.now() / 1000) + 3600]);
    let before = evOf(lead(ctx));
    await victory(ctx, 474, 0);
    assert.deepEqual(diff(before, evOf(lead(ctx))), { evSpeed: 100 });
    before = evOf(lead(ctx));
    const enemy = await victory(ctx, 12, 0);
    const yields = String(GameConfig.GetPetById(enemy.id).YieldingEV).trim().split(/\s+/).map(Number);
    assert.deepEqual(diff(before, evOf(lead(ctx))), Object.fromEntries(EV.map((k, i) => [k, yields[i] * 10]).filter(([, v]) => v)));
    results.push({ case: 'learning-card-x10', room474: 100, spt: enemy.id });
  }
  // 2b. 遗留 learnTimes（仅 GM 可设）不再参与结算：不翻倍、不扣次数、不导致结算失败
  {
    const ctx = await account('LegacyLearn', 7, 30);
    ctx.player.Data.learnTimes = 3;
    const before = evOf(lead(ctx));
    await victory(ctx, 470, 0);
    assert.deepEqual(diff(before, evOf(lead(ctx))), { evAtk: 10 });
    assert.equal(ctx.player.Data.learnTimes, 3);
    results.push({ case: 'legacy-learn-times-ignored', gain: 10 });
  }
  // 3. 上限：单项 255 截断，不转移到其他项
  {
    const ctx = await account('EvCap', 7, 30);
    lead(ctx).evAtk = 252;
    await victory(ctx, 470, 1);
    assert.equal(lead(ctx).evAtk, 255);
    assert.equal(EV.reduce((s, k) => s + lead(ctx)[k], 0), 255);
    results.push({ case: 'ev-room-cap', evAtkAfter: 255 });
  }
  // 4. 经验特训：16 系 × 5 阶段，陪练属性与阶段等级正确，经验按档位且不加学习力
  const EXP = [0, 1800, 5400, 12000, 24000, 42000];
  const LV = [0, 20, 40, 60, 80, 100];
  for (let type = 1; type <= 16; type++) {
    for (let tier = 1; tier <= 5; tier++) {
      const ctx = await account(`Exp${type}_${tier}`, 7, 10);
      const pet = lead(ctx);
      const ev0 = evOf(pet), exp0 = totalExp(pet), pool0 = ctx.player.Data.allocatableExp, learn0 = ctx.player.Data.learnTimes;
      const enemy = await victory(ctx, 488, 100 + type * 10 + tier);
      const after = lead(ctx);
      assert.equal(GameConfig.GetPetById(enemy.id).Type, type, `Exp dummy type ${type}`);
      assert.equal(enemy.level, LV[tier], `Exp dummy level tier ${tier}`);
      assert.deepEqual(evOf(after), ev0, 'Exp training must not add EV');
      assert.equal(ctx.player.Data.allocatableExp - pool0, EXP[tier] / 2, 'Exp pool share');
      assert.equal(ctx.player.Data.learnTimes, learn0);
      const gained = Math.min(totalExp(after) - exp0, EXP[tier]);
      if (after.level < 100) assert.equal(totalExp(after) - exp0, EXP[tier], 'Exp gain');
      if (tier === 3) results.push({ case: 'exp-train', type, tier, enemy: enemy.id, enemyLevel: enemy.level, gained, pool: EXP[tier] / 2, levelAfter: after.level, petIdAfter: after.petId });
    }
  }
  // 5. 对照：普通 SPT 首领仍按被击败精灵产出学习力
  {
    const ctx = await account('Spt', 7, 30);
    const before = evOf(lead(ctx));
    const enemy = await victory(ctx, 12, 0);
    const yields = String(GameConfig.GetPetById(enemy.id).YieldingEV).trim().split(/\s+/).map(Number);
    const expect = Object.fromEntries(EV.map((k, i) => [k, yields[i]]).filter(([, v]) => v));
    assert.deepEqual(diff(before, evOf(lead(ctx))), expect);
    results.push({ case: 'spt-control', enemy: enemy.id, gain: expect });
  }
  // 6. 野外刷怪：全部一阶，等级落在配置窗口内且 < 进化后无路可走
  {
    const ctx = await account('Wild', 7, 30);
    const ogres = JSON.parse(fs.readFileSync(path.join(app, 'config/data/json/map-ogres.json'), 'utf8')).maps;
    const keep = new Set(['337', '343', '495', '673', '679']);
    let rolls = 0;
    for (const [mapId, m] of Object.entries(ogres)) {
      if (keep.has(mapId) || !(m.ogres || []).length) continue;
      for (let i = 0; i < 20; i++) {
        ctx.player.MapSpawnManager.OnEnterMap(Number(mapId));
        for (const o of ctx.player.MapSpawnManager.GetMapOgres(Number(mapId))) {
          if (!o.petId) continue;
          const cfg = GameConfig.GetPetById(o.petId);
          assert.ok(!Number(cfg.EvolvesFrom), `Map ${mapId} spawned evolved ${o.petId}`);
          rolls++;
        }
      }
    }
    results.push({ case: 'wild-base-forms', maps: Object.keys(ogres).length, spawnedChecked: rolls });
  }
  const report = { results, scope: 'isolated SQLite; real boss entry and settlement for training rooms; real MapSpawnManager rolls; no client' };
  if (evidence) fs.writeFileSync(evidence, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report.results.filter(r => r.case !== 'ev-room').slice(0, 6), null, 1));
  console.log('PASS', results.length, 'records');
})().catch(error => { console.error(error.stack); process.exitCode = 1; }).finally(async () => {
  for (const p of players) { p.BattleManager.CleanupBattle(); await p.OnLogout(); }
  await new Promise(resolve => setTimeout(resolve, 300));
  await DataSaver.Instance.WaitForSaves(); await db.Shutdown();
  fs.rmSync(temporary, { recursive: true, force: true });
  process.exit(process.exitCode || 0);
});
