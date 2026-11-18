'use strict';
/**
 * classic-polish-v5：下线遗留 learnTimes 学习次数链路（无道具发放、无 learn_times 列、无读取/发布实现）。
 * 学习力加成只保留 player_reward_boosts（十倍学习力卡）。仅改 BattleRewardService.js。
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');

const repoRoot = path.resolve(__dirname, '../../..');
const prevDir = path.join(repoRoot, 'outputs/classic-polish-v3-20261118/build');
const outDir = path.join(repoRoot, 'outputs/classic-polish-v5-20261118/build');
const rel = 'app/dist/GameServer/Game/Battle/services/BattleRewardService.js';
const sha = buf => crypto.createHash('sha256').update(buf).digest('hex');

let js = fs.readFileSync(path.join(prevDir, rel), 'utf8');
const edits = [
  [`                // Snapshot effects at settlement time; the legacy use counter commits with the rewarded pet.
                const boosts = await (0, RewardBoost_1.GetRewardBoostStatus)(userId);
                const learnTimes = this._player.Data.learnTimes;
                if (!Number.isSafeInteger(learnTimes) || learnTimes < 0 || learnTimes > 0xffffffff) {
                    throw new Error('Invalid learning multiplier balance');
                }
`, `                // Snapshot effects at settlement time.
                const boosts = await (0, RewardBoost_1.GetRewardBoostStatus)(userId);
`],
  ['const learningMultiplier = boosts.learning.multiplier * (!expTier && learnTimes > 0 ? 2 : 1);', 'const learningMultiplier = boosts.learning.multiplier;'],
  ['\n                    learningUse: !expTier && learnTimes > 0 ? { expected: learnTimes, remaining: learnTimes - 1 } : undefined,', ''],
];
for (const [from, to] of edits) {
  assert.equal(js.split(from).length, 2, 'Expected one match: ' + from.trim().slice(0, 60));
  js = js.replace(from, to);
}
assert.ok(!js.includes('learnTimes'), 'learnTimes still referenced');

fs.rmSync(outDir, {recursive: true, force: true});
fs.mkdirSync(path.dirname(path.join(outDir, rel)), {recursive: true});
fs.writeFileSync(path.join(outDir, rel), js);
const buf = fs.readFileSync(path.join(outDir, rel));
fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({release: 'classic-polish-v5-20261118', generatedAt: new Date().toISOString(),
  writtenFiles: [{path: rel, sha256: sha(buf), bytes: buf.length}], deletePaths: []}, null, 2) + '\n');
console.log('构建完成 ->', outDir);
