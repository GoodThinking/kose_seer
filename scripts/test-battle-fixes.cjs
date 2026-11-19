'use strict';
/**
 * 实机中发现的几处服务端问题的回归，不连数据库、不起服务。
 * 1. 没有野怪配置的 SPT 地图（430 亚伦斯等）仍下发 Boss 表里的站位 BOSS。
 * 2. 地图建好后客户端请求玩家列表时补发 BOSS 列表（直接登录在 SPT 地图上能看到 BOSS）。
 * 3. 回合末效果击倒当前精灵后，客户端超时补位选回这只已倒下的精灵，服务端改换成背包里第一只活着的。
 * 4. 034 迁移创建魂珠表。
 * 用法：node scripts/test-battle-fixes.cjs <app 运行目录（含 node_modules）>
 */
const path = require('node:path');
const assert = require('node:assert/strict');

const app = path.resolve(process.argv[2] || '');
assert.ok(process.argv[2], 'usage: test-battle-fixes.cjs <app>');
process.chdir(app);
const load = f => require(path.join(app, 'dist', f));
const {Logger, LogLevel} = load('shared/utils/Logger'); Logger.SetMinLevel(LogLevel.Error);
const {ConfigLoader} = load('shared/config/ConfigLoader'), {ConfigRegistry} = load('shared/config/ConfigRegistry'), {GetGameConfigRegistrations} = load('shared/config/ConfigDefinitions');
const {BossAbilityConfig} = load('GameServer/Game/Battle/BossAbility/BossAbilityConfig');
const {MapSpawnManager} = load('GameServer/Game/Map/MapSpawnManager');
const {MapManager} = load('GameServer/Game/Map/MapManager');
const {BattleManager} = load('GameServer/Game/Battle/BattleManager');

const tests = {
  async standingBossWithoutMapConfig() {
    const spawn = Object.create(MapSpawnManager.prototype); spawn.Player = {Uid: 1};
    const bosses = spawn.BuildMapBosses(430);
    assert.deepEqual(bosses.map(b => [b.id, b.region]), [[672, 0]], '430 下发亚伦斯');
    assert.equal(spawn.BuildMapBosses(405).length, 2, '405 下发罗德利斯、迪尔科特');
  },
  async bossListResentAfterMapLoad() {
    const sent = [];
    const manager = Object.create(MapManager.prototype);
    const spawn = Object.create(MapSpawnManager.prototype); spawn.Player = {Uid: 1};
    manager._onlineTracker = {GetPlayerMap: () => 430};
    manager.Player = {Uid: 1, Data: {mapID: 430}, MapSpawnManager: {GetMapOgres: () => [], GetMapBosses: id => spawn.BuildMapBosses(id)}, SendPacket: async p => sent.push(p.constructor.name)};
    manager.sendMapPlayerList = async () => sent.push('players');
    await manager.HandleListMapPlayer();
    assert.deepEqual(sent, ['players', 'PacketMapOgreList', 'PacketMapBoss']);
  },
  async replacementRedirectsFromFaintedCurrent() {
    const sent = [];
    const pets = [{catchTime: 1, hp: 0, petId: 3}, {catchTime: 2, hp: 0, petId: 3}, {catchTime: 3, hp: 100, petId: 3}];
    const manager = Object.create(BattleManager.prototype);
    manager._currentBattle = {userId: 1, player: {catchTime: 1, hp: 0}, enemy: {}};
    manager.Player = {Uid: 1, PetManager: {GetPetsInBag: () => pets}, SendPacket: p => sent.push(p)};
    const result = manager.ValidateChangePet(1, false);
    assert.equal(result?.newPet.catchTime, 3, '换成第一只活着的');
    manager._currentBattle.player.hp = 50;
    assert.equal(manager.ValidateChangePet(1, false), null, '当前精灵还活着时照常拒绝');
  },
  async soulBeadMigration() {
    const {Migration034CreateSoulBeads} = load('DataBase/migrations/scripts/034_create_soul_beads');
    const sql = new Migration034CreateSoulBeads().upSQLite().join('\n');
    assert.match(sql, /CREATE TABLE IF NOT EXISTS player_soul_beads/);
    const runner = require('node:fs').readFileSync(path.join(app, 'dist/DataBase/migrations/MigrationRunner.js'), 'utf8');
    assert.match(runner, /new Migration034CreateSoulBeads\(\)/);
  },
};

(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
  await ConfigRegistry.Instance.Initialize();
  BossAbilityConfig.Instance.Load();
  let failed = 0;
  for (const [name, run] of Object.entries(tests)) {
    try { await run(); console.log(`ok   ${name}`); }
    catch (error) { failed++; console.log(`FAIL ${name}: ${error.message}\n${String(error.stack).split('\n').slice(1, 4).join('\n')}`); }
  }
  console.log(failed ? `${failed} failed` : 'all passed');
  process.exitCode = failed ? 1 : 0;
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
