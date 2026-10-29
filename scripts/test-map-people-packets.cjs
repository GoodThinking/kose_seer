'use strict';
// Wire contract from the deployed Core's UserInfo.setForPeoleInfo, not a server decoder.
// Two variable-length records must preserve the next player's identity and appearance.
// Usage: node scripts/test-map-people-packets.cjs <isolated runtime app>
const assert = require('node:assert/strict');
const path = require('node:path');
const app = path.resolve(process.argv[2]);
const {SeerMapUserInfoProto} = require(path.join(app, 'dist/shared/proto/common/SeerMapUserInfoProto'));
const {ListMapPlayerRspProto} = require(path.join(app, 'dist/shared/proto/packets/rsp/map/ListMapPlayerRspProto'));
const first = Object.assign(new SeerMapUserInfoProto(), {
    sysTime: 1792985800, userID: 414000, nick: '甲队长', color: 0x123456,
    x: 600, y: 300, spiritTime: 1792985000, spiritID: 309,
    teamId: 17, teamCoreCount: 12, teamIsShow: 1,
    teamLogoBg: 1, teamLogoIcon: 2, teamLogoColor: 3, teamTxtColor: 4,
    teamLogoWord: 'ABCD', clothes: [{id: 100564, level: 0}, {id: 100056, level: 0}], curTitle: 8
});
const second = Object.assign(new SeerMapUserInfoProto(), {
    sysTime: 1792985801, userID: 414001, nick: '乙队员', color: 0xabcdef,
    x: 400, y: 250, spiritTime: 1792985001, spiritID: 413,
    clothes: [], curTitle: 9
});
const packet = new ListMapPlayerRspProto();
packet.players = [first, second];
const bytes = packet.serialize('kose');
let cursor = 0;
const uint = () => { const value = bytes.readUInt32BE(cursor); cursor += 4; return value; };
const short = () => { const value = bytes.readInt16BE(cursor); cursor += 2; return value; };
const text = size => { const value = bytes.toString('utf8', cursor, cursor + size).replace(/\0.*$/s, ''); cursor += size; return value; };
function readClientRecord() {
    const record = {sysTime: uint(), userID: uint(), nick: text(16)};
    for (const field of ['color', 'texture', 'vipFlags', 'vipStage', 'actionType', 'x', 'y', 'action', 'direction', 'changeShape', 'spiritTime', 'spiritID', 'petDV', 'petSkin', 'fightFlag', 'teacherID', 'studentID', 'nonoState', 'nonoColor', 'superNono', 'playerForm', 'transTime', 'teamId', 'teamCoreCount', 'teamIsShow']) record[field] = uint();
    record.teamLogo = [short(), short(), short(), short()];
    record.teamLogoWord = text(4);
    const count = uint();
    assert.ok(count <= 64, 'misaligned clothes count must not allocate an unbounded record');
    record.clothes = Array.from({length: count}, () => ({id: uint(), level: uint()}));
    record.curTitle = uint();
    return record;
}
assert.equal(uint(), 2);
const a = readClientRecord(), b = readClientRecord();
assert.deepEqual({logo: a.teamLogo, word: a.teamLogoWord, clothes: a.clothes, title: a.curTitle}, {
    logo: [1, 2, 3, 4], word: 'ABCD', clothes: first.clothes, title: 8
});
assert.deepEqual({uid: b.userID, nick: b.nick, x: b.x, y: b.y, texture: b.texture, shape: b.changeShape, pet: b.spiritID, clothes: b.clothes, title: b.curTitle}, {
    uid: 414001, nick: '乙队员', x: 400, y: 250, texture: 0, shape: 0, pet: 413, clothes: [], title: 9
});
assert.equal(cursor, bytes.length, 'each client record consumes its exact boundary');
console.log(JSON.stringify({passed: 1, contract: 'current Core kose map list: four 16-bit team fields; second player preserves identity, position, appearance and clothes', playerDatabaseAccessed: false}, null, 2));
