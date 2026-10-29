'use strict';
// Session fixtures exercise the real party handler and event bus. They do not
// claim native client or multiplayer battle acceptance and never open a database.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const filename = path.join(app, 'dist/GameServer/Server/Packet/Recv/Map/TrainingPartyHandler.js');
const source = path.join(__dirname, '../compat/server-patches/map-story/TrainingPartyHandler.js');
const compiled = new Module(filename);
compiled.filename = filename;
compiled.paths = Module._nodeModulePaths(path.dirname(filename));
compiled._compile(fs.readFileSync(source, 'utf8'), filename);
const handlers = compiled.exports;
const {PlayerManager} = require(path.join(app, 'dist/GameServer/Game/Player/PlayerManager'));
const {GameEventBus} = require(path.join(app, 'dist/GameServer/Game/Event/GameEventBus'));
const {PlayerEventType} = require(path.join(app, 'dist/GameServer/Game/Event/EventTypes'));
const manager = PlayerManager.GetInstance({});
const players = [];
function fixture(Uid) {
    const player = {Uid, Data: {mapID: 336, nick: '赛尔' + Uid},
        Session: {Socket: {destroyed: false}}, EventBus: new GameEventBus(),
        BattleManager: {GetCurrentBattle: () => null}, packets: [],
        async SendPacket(packet) { this.packets.push(packet); }};
    player.Session.Player = player;
    manager._players.set(Uid, player);
    players.push(player);
    return player;
}
function body(...values) {
    const bytes = Buffer.alloc(values.length * 4);
    values.forEach((value, index) => bytes.writeUInt32BE(value, index * 4));
    return bytes;
}
async function command(player, id, ...values) {
    await new handlers['TrainingParty' + id + 'Handler']().Handle(player.Session, {}, body(...values));
}
function last(player, command) {
    return player.packets.findLast(packet => packet.getCmdId() === command);
}
function nativeInvitation(packet) {
    // Official GroupIDInfo is uint16 + uint32 + uint32; invite notices then read five member slots.
    const bytes = packet.serialize();
    return {sender: bytes.readUInt32BE(26), kind: bytes.readUInt32BE(46),
        data: bytes.readUInt32BE(50), leader: bytes.readUInt32BE(54),
        members: Array.from({length: 5}, (_, index) => bytes.readUInt32BE(58 + 4 * index)).filter(Boolean)};
}
(async () => {
    const [a, b, c, d, e, f] = [1, 2, 3, 4, 5, 6].map(fixture);
    await command(a, 7504, 1);
    await command(a, 7501, b.Uid);
    assert.deepEqual(nativeInvitation(last(b, 7903)), {sender: 1, kind: 0, data: 0, leader: 1, members: [1]});
    await command(b, 7502, a.Uid, 0);
    assert.equal(handlers.GetTrainingParty(b), null);
    assert.equal(nativeInvitation(last(a, 7903)).data, 0);
    for (const member of [b, c, d, e]) {
        await command(a, 7501, member.Uid);
        await command(member, 7502, a.Uid, 1);
        assert.equal(handlers.GetTrainingParty(member), handlers.GetTrainingParty(a));
        const joined = last(member, 7510).serialize();
        assert.equal(joined.readUInt32BE(10), member.Uid);
        assert.equal(joined.toString('utf8', 34, 50).replace(/\0/g, ''), a.Data.nick);
        assert.deepEqual(Array.from({length: 5}, (_, index) => joined.readUInt32BE(50 + 4 * index)).filter(Boolean),
            [...handlers.GetTrainingParty(a).members.keys()]);
    }
    await command(a, 7501, f.Uid);
    assert.equal(last(a, 7501).getResult(), 5001);
    assert.equal(handlers.GetTrainingParty(f), null);
    assert.equal(handlers.GetTrainingParty(a).members.size, 5);
    await command(b, 7507, a.Uid);
    assert.equal(last(b, 7507).getResult(), 5001);
    assert.equal(handlers.GetTrainingParty(a).leader, a.Uid);
    await command(a, 7508, b.Uid);
    assert.equal(handlers.GetTrainingParty(a).leader, b.Uid);
    assert.deepEqual(nativeInvitation(last(a, 7903)), {sender: 2, kind: 4, data: 1, leader: 2, members: [1, 2, 3, 4, 5]});
    await command(b, 7507, c.Uid);
    assert.equal(handlers.GetTrainingParty(c), null);
    const quit = last(c, 7506).serialize();
    assert.equal(quit.readUInt32BE(10), c.Uid);
    assert.equal(quit.readUInt32BE(30), b.Uid);
    assert.equal(quit.toString('utf8', 34, 50).replace(/\0/g, ''), b.Data.nick);
    await command(b, 7501, f.Uid);
    await command(b, 7508, a.Uid);
    await command(f, 7502, b.Uid, 1);
    assert.equal(handlers.GetTrainingParty(f), null);
    assert.equal(last(f, 7502).getResult(), 5001);
    const replacement = fixture(a.Uid);
    assert.equal(handlers.GetTrainingParty(replacement), null);
    await a.EventBus.Emit({type: PlayerEventType.LOGOUT, timestamp: Date.now(), playerId: a.Uid});
    assert.equal(handlers.GetTrainingParty(a), null);
    assert.equal(handlers.GetTrainingParty(b).leader, b.Uid);
    await command(c, 7904, b.Uid);
    assert.equal(last(b, 7905).serialize().readUInt32BE(0), c.Uid);
    await command(b, 7906, c.Uid, 1);
    assert.equal(handlers.GetTrainingParty(c), handlers.GetTrainingParty(b));
    assert.equal(nativeInvitation(last(c, 7903)).kind, 5);
    assert.equal(nativeInvitation(last(c, 7903)).data, 1);
    await command(f, 7904, b.Uid);
    await command(b, 7508, d.Uid);
    await command(d, 7906, f.Uid, 1);
    assert.equal(last(d, 7906).getResult(), 5001);
    assert.equal(handlers.GetTrainingParty(f), null);
    await command(f, 7904, b.Uid);
    await command(d, 7906, f.Uid, 0);
    assert.equal(nativeInvitation(last(f, 7903)).data, 0);
    assert.equal(handlers.GetTrainingParty(f), null);
    await command(b, 7505);
    await command(d, 7505);
    await command(e, 7505);
    await command(c, 7505);
    assert.equal(handlers.GetTrainingParty(e), null);
    console.log(JSON.stringify({passed: ['native invitation and roster decoding', 'decline without membership',
        'five-seat capacity', 'leader-only removal', 'leader transfer and stale invitations',
        'native quit notification', 'session-bound identity and logout succession',
        'join applications accept, reject and expire with leadership'], nativeGameplayClaim: false}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => {
    for (const player of players) if (manager._players.get(player.Uid) === player) manager._players.delete(player.Uid);
});
