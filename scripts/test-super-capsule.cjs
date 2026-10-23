'use strict';
// Usage: node scripts/test-super-capsule.cjs <runtime app dir with dist/config/node_modules>
const assert = require('node:assert/strict');
const path = require('node:path');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
const {BattleTurnService} = load('GameServer/Game/Battle/services/BattleTurnService');
const {BattleType} = load('shared/models/BattleModel');
const service = new BattleTurnService();
const battle = () => ({
  userId: 1, battleType: BattleType.PVE, isOver: false,
  enemy: {id: 10, level: 100, hp: 1000, maxHp: 1000, statusDurations: []},
});
const random = Math.random;
try {
  Math.random = () => 0.99;
  const caught = service.Catch(battle(), 300007);
  assert.equal(caught.success, true, '超能胶囊 must catch a full-health eligible pet');
  assert.equal(caught.catchRate, 100, 'Bonus=256 must guarantee capture');
  const boss = battle();
  boss.battleType = BattleType.BOSS;
  assert.equal(service.Catch(boss, 300007).success, false, 'Protected bosses remain uncatchable');
  const fainted = battle();
  fainted.enemy.hp = 0;
  assert.equal(service.Catch(fainted, 300007).success, false, 'Fainted pets remain uncatchable');
  assert.equal(service.Catch(battle(), 0).success, false, 'Unsupported items remain rejected');
  assert.equal(service.Catch(battle(), 300006).success, true, 'Existing guaranteed capsules still work');
  console.log('SUPER_CAPSULE_PASS: full-health capture; boss/fainted/invalid-item rejection; existing capsule');
} finally {
  Math.random = random;
}
