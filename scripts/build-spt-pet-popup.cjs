'use strict';
// Patch the captured live runtime; repository TS predates the deployed settlement path.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { parseArgs } = require('node:util');
const { values } = parseArgs({ options: { baseline: { type: 'string' }, out: { type: 'string' } } });
if (!values.baseline || !values.out) throw new Error('Usage: --baseline <captured root> --out <fresh directory>');
const baseline = path.resolve(values.baseline), out = path.resolve(values.out);
if (fs.existsSync(out)) throw new Error('Choose a fresh output directory');
const files = [];
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
function patch(relative, replacements) {
  const source = fs.readFileSync(path.join(baseline, relative), 'utf8');
  let updated = source;
  for (const [before, after] of replacements) {
    if (updated.split(before).length !== 2) throw new Error(`Unexpected settlement baseline: ${relative}: ${before}`);
    updated = updated.replace(before, after);
  }
  new vm.Script(updated, { filename: relative });
  const destination = path.join(out, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, updated);
  files.push({ path: relative, before: digest(source), after: digest(updated) });
}
patch('app/dist/GameServer/Game/Battle/services/BattleRewardService.js', [
  ['newLevel: battle.player.level, droppedItems: [], rewardItems: []',
   'newLevel: battle.player.level, droppedItems: [], rewardItems: [], rewardPet: null'],
  ['this.ProcessSPTFirstDefeatReward(battle, mapId);',
   'this.ProcessSPTFirstDefeatReward(battle, mapId, result);'],
  ['result.expGained || result.coinsGained || result.droppedItems.length ?',
   'result.expGained || result.coinsGained || result.droppedItems.length || result.rewardPet ?'],
  ['async ProcessSPTFirstDefeatReward(battle, mapId) {',
   'async ProcessSPTFirstDefeatReward(battle, mapId, settlement) {'],
  ['                utils_1.Logger.Info(`[BattleRewardService] SPT奖励精灵已发放: PetId=${sptInfo.rewardPetId}`);',
   '                // Preserve the committed pet even if a later item reward fails.\n' +
   '                settlement.rewardPet = { petId: sptInfo.rewardPetId, catchTime };\n' +
   '                utils_1.Logger.Info(`[BattleRewardService] SPT奖励精灵已发放: PetId=${sptInfo.rewardPetId}`);'],
]);
patch('app/dist/GameServer/Game/Battle/BattleManager.js', [
  ['const BattleCaptureSystem_1 = require("./BattleCaptureSystem");',
   'const BattleCaptureSystem_1 = require("./BattleCaptureSystem");\nconst PacketGetBossMonster_1 = require("../../Server/Packet/Send/System/PacketGetBossMonster");'],
  ['        let rewardItems = [];\n        let rewardSettlement;',
   '        let rewardItems = [];\n        let rewardPet;\n        let rewardSettlement;'],
  ['            rewardItems = reward.rewardItems;',
   '            rewardItems = reward.rewardItems;\n            rewardPet = reward.rewardPet;'],
  ['// 延迟推送物品奖励弹窗（仅PVE）', '// 延迟推送战斗奖励弹窗（仅PVE）'],
  ['if (!isPvp && rewardItems.length > 0) {', 'if (!isPvp && (rewardItems.length > 0 || rewardPet)) {'],
  ['                await this.Player.SendPacket(new Battle_1.PacketBattleReward(rewardItems));',
   '                if (rewardItems.length > 0)\n' +
   '                    await this.Player.SendPacket(new Battle_1.PacketBattleReward(rewardItems));\n' +
   '                if (rewardPet)\n' +
   '                    await this.Player.SendPacket(new PacketGetBossMonster_1.PacketGetBossMonster(rewardPet.petId, rewardPet.catchTime));'],
]);
const manifest = { files, databaseMigration: false, playerDataMutation: false, clientPatch: false };
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify(manifest, null, 2));
