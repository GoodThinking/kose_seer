'use strict';
const { BaseProto } = require('../../../shared/proto/base/BaseProto');

class GroupPacket extends BaseProto {
    constructor(command, body) { super(command); this.body = body; }
    serialize() { return this.body; }
}
class Writer {
    constructor(size) { this.bytes = Buffer.alloc(size); this.offset = 0; }
    byte(value) { this.bytes.writeUInt8(value, this.offset++); }
    uint(value) { this.bytes.writeUInt32BE(value, this.offset); this.offset += 4; }
    int(value) { this.bytes.writeInt32BE(value, this.offset); this.offset += 4; }
    name(value) { this.bytes.write(value, this.offset, 16, 'utf8'); this.offset += 16; }
    packet(command) {
        if (this.offset !== this.bytes.length) throw new Error('Incomplete native group packet');
        return new GroupPacket(command, this.bytes);
    }
}
function readyUserSize(actor) {
    let size = 24;
    for (const pet of actor.roster) size += 8 + 4 * pet.skills.length;
    return size;
}
function readyGroup(writer, side, actors, leader) {
    writer.byte(side);
    writer.uint(leader);
    writer.byte(actors.length);
    for (const actor of actors) {
        writer.uint(actor.uid);
        writer.name(actor.nick);
        writer.uint(actor.roster.length);
        for (const pet of actor.roster) {
            writer.uint(pet.id);
            writer.uint(pet.skills.length);
            for (const skill of pet.skills) writer.uint(skill);
        }
    }
}
function ready(players, opponents, leader) {
    const writer = new Writer(16 + players.reduce((n, actor) => n + readyUserSize(actor), 0)
        + opponents.reduce((n, actor) => n + readyUserSize(actor), 0));
    writer.uint(6);
    readyGroup(writer, 1, players, leader);
    readyGroup(writer, 2, opponents, opponents[0].uid);
    return writer.packet(7555);
}
function startActor(writer, actor) {
    const pet = actor.pet;
    writer.byte(actor.side);
    writer.byte(actor.position);
    writer.uint(actor.uid);
    writer.byte(0);
    for (const value of [pet.id, pet.catchTime, pet.hp, pet.maxHp, pet.level, 0, 0]) writer.uint(value);
}
function start(players, opponents) {
    const writer = new Writer(3 + 35 * (players.length + opponents.length));
    writer.byte(1);
    writer.byte(players.length);
    for (const actor of players) startActor(writer, actor);
    writer.byte(opponents.length);
    for (const actor of opponents) startActor(writer, actor);
    return writer.packet(7557);
}
function hurtSize(actor, attacker) { return (attacker ? 83 : 63) + actor.pet.skills.length * 8; }
function hurtActor(writer, actor, skillId, result) {
    const pet = actor.pet, attacker = result !== undefined;
    writer.byte(attacker ? 0 : 1);
    writer.byte(actor.side);
    writer.byte(actor.position);
    writer.uint(actor.uid);
    for (let i = 0; i < 22; i++) writer.byte(pet.statusDurations?.[i] > 0 ? 1 : 0);
    for (let i = 0; i < 6; i++) writer.byte((pet.battleLevels?.[i] || 0) & 255);
    writer.uint(pet.id);
    writer.uint(attacker ? skillId : 0);
    writer.uint(pet.hp);
    writer.uint(pet.maxHp);
    writer.uint(pet.skills.length);
    for (let i = 0; i < pet.skills.length; i++) {
        writer.uint(pet.skills[i]);
        writer.uint(pet.skillPP[i]);
    }
    writer.uint(result?.missed ? 1 : 0);
    if (attacker) {
        writer.uint(result.isCrit ? 1 : 0);
        writer.uint(0);
        writer.uint(result.atkTimes);
        writer.int(result.damage);
        writer.int(result.gainHp);
    }
    writer.uint(0);
}
function attack(actor, target, result) {
    const writer = new Writer(1 + hurtSize(actor, true) + hurtSize(target, false));
    writer.byte(0);
    hurtActor(writer, actor, result.skillId, result);
    hurtActor(writer, target, 0);
    return writer.packet(7559);
}
function word(command, value) {
    const writer = new Writer(4);
    writer.uint(value);
    return writer.packet(command);
}
function change(actor) {
    const writer = new Writer(28), pet = actor.pet;
    for (const value of [actor.uid, pet.id, pet.catchTime, pet.level, pet.hp, pet.maxHp, pet.skinID || 0]) writer.uint(value);
    return writer.packet(7567);
}
function over(player, reason, winner) {
    const data = player.Data, writer = new Writer(37);
    writer.byte(0);
    for (const value of [reason, winner, 0, data.twoTimes || 0, data.threeTimes || 0,
        data.autoFightTimes || 0, data.btlDetectTimes || 0, data.energyTimes || 0, data.learnTimes || 0]) writer.uint(value);
    return writer.packet(7560);
}
function notice(actor, turn, previousHp) {
    const writer = new Writer(32), pet = actor.pet;
    writer.uint(turn);
    writer.byte(actor.side);
    writer.byte(actor.position);
    for (let i = 0; i < 6; i++) writer.byte((pet.battleLevels[i] || 0) & 255);
    writer.uint(pet.catchTime);
    writer.uint(pet.id);
    writer.int(pet.hp);
    writer.int(pet.maxHp);
    writer.int(pet.hp - previousHp);
    return writer.packet(7573);
}
function died(actors) {
    const writer = new Writer(1 + actors.length * 7);
    writer.byte(actors.length);
    for (const actor of actors) {
        writer.byte(actor.side);
        writer.byte(actor.position);
        writer.byte(1);
        writer.uint(actor.roster.some(pet => pet.hp > 0) ? 1 : 0);
    }
    return writer.packet(7561);
}
function medicine(actor, itemId, previousHp) {
    const writer = new Writer(18);
    writer.uint(actor.uid);
    writer.byte(actor.side);
    writer.byte(actor.position);
    writer.uint(itemId);
    writer.uint(actor.pet.hp);
    writer.uint(actor.pet.hp - previousHp);
    return writer.packet(7562);
}
function progress(command, actor, percent) {
    const writer = new Writer(command === 7576 ? 10 : 8);
    writer.uint(actor.uid);
    if (command === 7576) { writer.byte(actor.side); writer.byte(actor.position); }
    writer.uint(percent);
    return writer.packet(command);
}
function escape(actor) {
    const writer = new Writer(22);
    writer.uint(actor.uid);
    writer.name(actor.nick);
    writer.byte(actor.side);
    writer.byte(actor.position);
    return writer.packet(7568);
}
module.exports = { GroupPacket, Ready: ready, Start: start, Attack: attack, Word: word,
    Change: change, Over: over, Notice: notice, Died: died, Medicine: medicine, Progress: progress, Escape: escape };
