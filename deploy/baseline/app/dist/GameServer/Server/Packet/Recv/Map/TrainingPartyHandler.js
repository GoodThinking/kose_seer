'use strict';
const { Opcode, InjectType } = require('../../../../../shared/decorators/Opcode');
const { BaseProto } = require('../../../../../shared/proto/base/BaseProto');
const { PacketEmpty } = require('../../Send/PacketEmpty');
const { PlayerManager } = require('../../../../Game/Player/PlayerManager');
const { PlayerEventType } = require('../../../../Game/Event/EventTypes');
const { SendForestAlert } = require('../../../../Game/Map/ForestMechanisms');
const { Logger } = require('../../../../../shared/utils/Logger');
const membership = new Map();
const invitations = new Map();
const applications = new Map();
const watched = new WeakSet();
let sequence = 0;

class PartyError extends Error {}
class PartyPacket extends BaseProto {
    constructor(command, body) { super(command); this.body = body; }
    serialize() { return this.body; }
}
function uint(value) { const bytes = Buffer.alloc(4); bytes.writeUInt32BE(value); return bytes; }
function text(value) { const bytes = Buffer.alloc(16); bytes.write(value || '', 0, 16, 'utf8'); return bytes; }
function identity(party) {
    const bytes = Buffer.alloc(10);
    // This service has no cross-server party transport. Namespace zero is local.
    bytes.writeUInt32BE(party.sequence, 2);
    bytes.writeUInt32BE(party.time, 6);
    return bytes;
}
function roster(party) {
    return Buffer.concat([identity(party), text(party.name), uint(party.leader),
        Buffer.from([party.members.size]), ...[...party.members.keys()].map(uint)]);
}
function fixedRoster(party) {
    const bytes = Buffer.alloc(20);
    let offset = 0;
    for (const uid of party.members.keys()) { bytes.writeUInt32BE(uid, offset); offset += 4; }
    return bytes;
}
function inviteNotice(party, sender, kind, value = 0) {
    return Buffer.concat([identity(party), text(party.name), uint(sender.Uid), text(sender.Data.nick),
        uint(kind), uint(value), uint(party.leader), fixedRoster(party)]);
}
function getParty(player) {
    const party = membership.get(player.Uid);
    return party && party.members.get(player.Uid) === player ? party : null;
}
function requireParty(player, leader = false) {
    const party = getParty(player);
    if (!party) throw new PartyError('请先创建或加入小队。');
    if (leader && party.leader !== player.Uid) throw new PartyError('只有队长可以进行这项操作。');
    if (party.battle) throw new PartyError('小队正在战斗，请先完成当前战斗。');
    return party;
}
function invalidate(party) {
    for (const [target, pending] of invitations) {
        for (const [sender, invite] of pending) if (invite.party === party) pending.delete(sender);
        if (!pending.size) invitations.delete(target);
    }
    for (const [applicant, request] of applications) if (request.party === party) applications.delete(applicant);
}
async function deliver(players, packet) {
    const results = await Promise.allSettled(players.filter(player => !player.Session.Socket.destroyed)
        .map(player => player.SendPacket(packet)));
    for (const result of results) if (result.status === 'rejected') {
        Logger.Error('[TrainingParty] Membership committed; notice delivery failed', result.reason);
    }
}
async function leave(player, targetId = player.Uid, disconnect = false) {
    const party = getParty(player);
    invitations.delete(player);
    applications.delete(player);
    if (!party) return;
    if (party.battle && (disconnect || targetId === player.Uid)) {
        await require('../../../../Game/Battle/TrainingBattleRuntime').CancelFor(player, disconnect ? 2 : 6);
    }
    if (!disconnect) requireParty(player, targetId !== player.Uid);
    const target = party.members.get(targetId);
    if (!target) throw new PartyError('这名赛尔已经离开了小队。');
    party.members.delete(targetId);
    membership.delete(targetId);
    invitations.delete(target);
    applications.delete(target);
    if (party.leader === targetId) party.leader = party.members.keys().next().value || 0;
    invalidate(party);
    const notice = Buffer.concat([identity(party), uint(targetId), text(target.Data.nick),
        uint(party.leader), text(party.members.get(party.leader)?.Data.nick)]);
    await deliver([...party.members.values(), target], new PartyPacket(7506, notice));
}
function watch(player) {
    if (watched.has(player)) return;
    watched.add(player);
    player.EventBus.On(PlayerEventType.LOGOUT, () => leave(player, player.Uid, true));
}
function peer(player, uid) {
    const target = PlayerManager.GetInstance().GetPlayer(uid);
    if (!target || target === player || target.Session.Socket.destroyed || player.Session.Socket.destroyed ||
        player.Data.mapID <= 0 || player.Data.mapID !== target.Data.mapID) {
        throw new PartyError('请选择同一地图中的在线赛尔。');
    }
    return target;
}
function words(body, count) {
    if (body.length !== count * 4) throw new PartyError('小队操作数据不完整，请重新打开小队菜单。');
    return Array.from({length: count}, (_, index) => body.readUInt32BE(index * 4));
}
function addMember(party, player) {
    if (membership.has(player.Uid)) throw new PartyError('你已经加入了小队。');
    if (party.members.size >= 5) throw new PartyError('小队已经满员。');
    if (player.BattleManager.GetCurrentBattle()) throw new PartyError('请结束当前战斗后加入小队。');
    party.members.set(player.Uid, player);
    membership.set(player.Uid, party);
    invitations.delete(player);
    applications.delete(player);
}
function joinedNotice(party, player) {
    return new PartyPacket(7510, Buffer.concat([identity(party), uint(player.Uid), text(player.Data.nick),
        uint(party.leader), text(party.members.get(party.leader).Data.nick), fixedRoster(party)]));
}
async function handle(player, command, body) {
    if (command === 7504) {
        const [status] = words(body, 1);
        if (status !== 1) throw new PartyError('请通过小队菜单创建小队。');
        if (membership.has(player.Uid)) throw new PartyError('你已经加入了小队。');
        if (player.BattleManager.GetCurrentBattle()) throw new PartyError('请结束当前战斗后创建小队。');
        sequence = sequence % 0xffffffff + 1;
        const party = {sequence, time: Math.floor(Date.now() / 1000), name: '', leader: player.Uid,
            members: new Map([[player.Uid, player]]), battle: null};
        membership.set(player.Uid, party);
        invitations.delete(player);
        applications.delete(player);
        watch(player);
        await player.SendPacket(new PartyPacket(command, identity(party)));
        return;
    }
    if (command === 7501) {
        const [uid] = words(body, 1), party = requireParty(player, true), target = peer(player, uid);
        if (membership.has(uid)) throw new PartyError('对方已经加入了小队。');
        if (party.members.size >= 5) throw new PartyError('小队最多只能容纳五名赛尔。');
        if (target.BattleManager.GetCurrentBattle()) throw new PartyError('对方正在战斗。');
        let pending = invitations.get(target);
        if (!pending) invitations.set(target, pending = new Map());
        pending.set(player.Uid, {party, sender: player});
        watch(target);
        await player.SendPacket(new PartyPacket(command, uint(uid)));
        await deliver([target], new PartyPacket(7903, inviteNotice(party, player, 0)));
        return;
    }
    if (command === 7502) {
        const [uid, accepted] = words(body, 2);
        if (accepted > 1) throw new PartyError('请确认或取消这次小队邀请。');
        const pending = invitations.get(player), invite = pending && pending.get(uid);
        if (!invite) throw new PartyError('这次邀请已经失效，请让队长重新邀请。');
        pending.delete(uid);
        if (!pending.size) invitations.delete(player);
        const {party, sender} = invite;
        if (accepted) {
            peer(sender, player.Uid);
            if (getParty(sender) !== party || party.leader !== uid) throw new PartyError('队长已经离队，请重新邀请。');
            requireParty(sender, true);
            addMember(party, player);
            await player.SendPacket(new PartyPacket(command, roster(party)));
            await deliver([...party.members.values()], joinedNotice(party, player));
        } else {
            await player.SendPacket(new PartyPacket(command, Buffer.alloc(31)));
        }
        await deliver([sender], new PartyPacket(7903, inviteNotice(party, player, 2, accepted)));
        return;
    }
    if (command === 7503) {
        const [uid] = words(body, 1), target = PlayerManager.GetInstance().GetPlayer(uid);
        const pending = target && invitations.get(target), invite = pending && pending.get(player.Uid);
        if (invite && invite.sender === player) {
            pending.delete(player.Uid);
            if (!pending.size) invitations.delete(target);
            await deliver([target], new PartyPacket(7903, inviteNotice(invite.party, player, 1)));
        }
    } else if (command === 7505) {
        words(body, 0);
        await leave(player);
    } else if (command === 7507) {
        const [uid] = words(body, 1);
        if (uid === player.Uid) throw new PartyError('请使用离队按钮退出小队。');
        await leave(player, uid);
    } else if (command === 7508) {
        const [uid] = words(body, 1), party = requireParty(player, true);
        const target = party.members.get(uid);
        if (!target || target === player) throw new PartyError('请选择另一名队员担任队长。');
        party.leader = uid;
        invalidate(party);
        await deliver([...party.members.values()], new PartyPacket(7903, inviteNotice(party, target, 4, player.Uid)));
    } else if (command === 7904) {
        const [uid] = words(body, 1);
        if (membership.has(player.Uid)) throw new PartyError('你已经加入了小队。');
        const party = requireParty(peer(player, uid));
        if (party.members.size >= 5) throw new PartyError('小队已经满员。');
        const leader = party.members.get(party.leader);
        peer(player, leader.Uid);
        applications.set(player, {party, leader});
        watch(player);
        await deliver([leader], new PartyPacket(7905, Buffer.concat([uint(player.Uid), text(player.Data.nick)])));
    } else if (command === 7906) {
        const [uid, accepted] = words(body, 2), party = requireParty(player, true);
        if (accepted > 1) throw new PartyError('请确认或取消这次入队申请。');
        const applicant = peer(player, uid), request = applications.get(applicant);
        if (!request || request.party !== party || request.leader !== player) throw new PartyError('这次入队申请已经失效。');
        applications.delete(applicant);
        if (accepted) {
            addMember(party, applicant);
            await deliver([...party.members.values()], joinedNotice(party, applicant));
        }
        await deliver([applicant], new PartyPacket(7903, inviteNotice(party, player, 5, accepted)));
    } else if (command === 7901) {
        const party = requireParty(player, true);
        if (body.length !== 16) throw new PartyError('小队名称数据不完整。');
        const name = body.toString('utf8').replace(/\0+$/, '').trim();
        if (!name || name.includes('\ufffd') || /[\x00-\x1f\x7f]/.test(name)) throw new PartyError('请输入完整的小队名称。');
        party.name = name;
        await deliver([...party.members.values()], new PartyPacket(7902,
            Buffer.concat([identity(party), uint(party.leader), text(name)])));
    }
    await player.SendPacket(new PacketEmpty(command));
}
const exported = {GetTrainingParty: getParty, LeaveTrainingParty: leave};
for (const command of [7501, 7502, 7503, 7504, 7505, 7507, 7508, 7901, 7904, 7906]) {
    const Handler = class {
        async Handle(session, _head, body) {
            const player = session.Player;
            if (!player) return;
            try { await handle(player, command, body); }
            catch (error) {
                if (!(error instanceof PartyError)) Logger.Error('[TrainingParty] Request failed', error);
                await SendForestAlert(player, error instanceof PartyError ? error.message : '小队操作中断，请重新登录核对当前状态。');
                await player.SendPacket(new PacketEmpty(command).setResult(5001));
            }
        }
    };
    Opcode(command, InjectType.NONE)(Handler);
    exported['TrainingParty' + command + 'Handler'] = Handler;
}
module.exports = exported;
