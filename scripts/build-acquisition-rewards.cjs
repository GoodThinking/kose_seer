'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { parseArgs } = require('node:util');
const { values } = parseArgs({ options: { baseline: { type: 'string' }, out: { type: 'string' } } });
assert.ok(values.baseline && values.out, 'Required: --baseline --out');
const base = path.resolve(values.baseline), out = path.resolve(values.out);
assert.ok(!fs.existsSync(out), 'Output directory already exists');
assert.ok(!out.startsWith(base + path.sep) && out !== base, 'Output must not be inside baseline');
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const files = [];
function put(rel, data) {
    const before = path.join(base, rel), target = path.join(out, rel), bytes = Buffer.from(data);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, bytes);
    files.push({ path: rel, before: fs.existsSync(before) ? hash(fs.readFileSync(before)) : null, after: hash(bytes) });
}
function replaceOnce(text, before, after) {
    assert.equal(text.split(before).length, 2, 'Unexpected baseline: ' + before.slice(0, 100));
    return text.replace(before, after);
}
const config = JSON.parse(fs.readFileSync(path.join(base, 'app/config/data/json/boss_abilities.json'), 'utf8'));
function inspect(value) {
    if (!value || typeof value !== 'object') return;
    if (value.spt && value.spt.sptId > 0 && value.spt.rewardPetId > 0 && value.spt.rewardItemId > 0)
        throw new Error('Mixed SPT pet/item rewards require a single pet transaction');
    if (value.spt && value.spt.sptId === 1 && value.spt.rewardItemId > 0)
        throw new Error('SPT 1 item reward requires task 301 transaction handling');
    for (const child of Object.values(value)) inspect(child);
}
inspect(config);
const accessorRel = 'app/dist/DataBase/accessors/ChallengeProgressDataAccessor.js';
let accessor = fs.readFileSync(path.join(base, accessorRel), 'utf8');
const saveStart = accessor.indexOf('    async Save(data) {');
const saveEnd = accessor.indexOf('    /**\n     * 获取缓存的数据', saveStart);
assert.ok(saveStart >= 0 && saveEnd > saveStart, 'Challenge accessor changed');
accessor = accessor.slice(0, saveStart) + '    async Save(data) {\n        return require("./AcquisitionProgress").saveProgress(data);\n    }\n' + accessor.slice(saveEnd);
const rewardRel = 'app/dist/GameServer/Game/Battle/services/BattleRewardService.js';
let reward = fs.readFileSync(path.join(base, rewardRel), 'utf8');
reward = replaceOnce(reward, '        // 在首次 await 前占用同实例的首胜发奖；失败后允许下一次显式挑战。', `        if (sptInfo.rewardItemId > 0 && !(sptInfo.rewardPetId > 0)) {
            const awarded = await require('./AcquisitionRewards').grantFirstItem(this._player, sptInfo.sptId, sptInfo.rewardItemId);
            return awarded ? [{ itemId: sptInfo.rewardItemId, count: 1 }] : rewards;
        }
        // 在首次 await 前占用同实例的首胜发奖；失败后允许下一次显式挑战。`);
const spawnRel = 'app/dist/GameServer/Game/Map/MapSpawnManager.js';
let spawn = fs.readFileSync(path.join(base, spawnRel), 'utf8');
spawn = replaceOnce(spawn, '                    bosses.push({\n                        petId: ogre.petId,', '                    if (ogre.standingOnly !== true) bosses.push({\n                        petId: ogre.petId,');
put(spawnRel, spawn);
const mapUserRel = 'app/dist/shared/proto/common/SeerMapUserInfoProto.js';
let mapUser = fs.readFileSync(path.join(base, mapUserRel), 'utf8');
for (const field of ['teamLogoBg', 'teamLogoIcon', 'teamLogoColor', 'teamTxtColor'])
    mapUser = replaceOnce(mapUser, `writer.WriteUInt32(this.${field});`, `writer.WriteUInt16(this.${field});`);
put(mapUserRel, mapUser);
put(accessorRel, accessor);
put('app/dist/DataBase/accessors/AcquisitionProgress.js', fs.readFileSync(path.join(__dirname, '../compat/server-patches/acquisition-rewards/AcquisitionProgress.js')));
put(rewardRel, reward);
put('app/dist/GameServer/Game/Battle/services/AcquisitionRewards.js', fs.readFileSync(path.join(__dirname, '../compat/server-patches/acquisition-rewards/AcquisitionRewards.js')));
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({ files }, null, 2) + '\n');
