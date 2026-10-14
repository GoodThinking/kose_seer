import baseline from './fixtures/kose-baseline.json';
import captured from './fixtures/xin-skill-results.json';
import { AttackValueProto } from '../common/AttackValueProto';
import { SimplePetInfoProto } from '../common/SimplePetInfoProto';
import { NoteUseSkillRspProto } from '../packets/rsp/battle/NoteUseSkillRspProto';
import { NoteReadyToFightRspProto } from '../packets/rsp/battle/NoteReadyToFightRspProto';
import { PacketNoteUseSkill } from '../../../GameServer/Server/Packet/Send/Battle/PacketNoteUseSkill';
import { PacketNoteReadyToFight } from '../../../GameServer/Server/Packet/Send/Battle/PacketNoteReadyToFight';
import { ResolveClientProtocol } from '../../protocol/ClientProtocol';

const id = (actor: string): number => 1000 + Number(actor.split('_')[1]);
const makeAttack = (value: typeof captured.events[number]['model']['attacks'][number]): AttackValueProto =>
  Object.assign(new AttackValueProto(), {
    userId: id(value.actor), skillId: value.skillId, atkTimes: value.attackTimes,
    lostHP: value.lostHP, gainHP: value.gainHP, remainHp: value.remainHP,
    maxHp: value.maxHP, state: value.state, skillList: value.skills,
    isCrit: value.isCrit, status: value.status, battleLv: value.battleLevels,
  });

function basicAttacks(): [AttackValueProto, AttackValueProto] {
  return [Object.assign(new AttackValueProto(), baseline.attack), Object.assign(new AttackValueProto(), baseline.second)];
}
function basicPets(): [SimplePetInfoProto, SimplePetInfoProto] {
  return [Object.assign(new SimplePetInfoProto(), baseline.pet), Object.assign(new SimplePetInfoProto(), {...baseline.pet, petId: 8})];
}

describe('XIN battle serialization — pinned core snapshot', () => {
  test.each(captured.events)('matches independently recorded 2505 body at event $eventIndex', event => {
    const proto = new NoteUseSkillRspProto()
      .setFirstAttack(makeAttack(event.model.attacks[0]))
      .setSecondAttack(makeAttack(event.model.attacks[1]));
    proto.fieldEffects = event.model.fieldEffects;
    proto.shieldSnapshots = event.model.shields.map(shield => ({
      userId: id(shield.actor), values: shield.snapshots as [number, number, number, number],
    }));
    expect(proto.serialize('xin-20261013').toString('hex')).toBe(event.expectedHex);
  });

  test('preserves exact original KOSE output and packet snapshots by default', () => {
    const [first, second] = basicAttacks();
    const skill = new PacketNoteUseSkill(first, second);
    expect(skill.serialize().toString('hex')).toBe(baseline.skillHex);
    first.lostHP = 999;
    expect(skill.serialize().toString('hex')).toBe(baseline.skillHex);
    const [pet1, pet2] = basicPets();
    const ready = new PacketNoteReadyToFight(1001, 'Player', [pet1], 1002, 'Enemy', [pet2]);
    expect(ready.serialize().toString('hex')).toBe(baseline.readyHex);
    pet1.hp = 1;
    expect(ready.serialize().toString('hex')).toBe(baseline.readyHex);
  });

  test('writes two 32-byte signatures and every extended pet before the next party', () => {
    const [pet1, pet2] = basicPets();
    const packet = new PacketNoteReadyToFight(1001, 'Player', [pet1, pet2], 1002, 'Enemy', [pet2], 'xin-20261013');
    const body = packet.serialize();
    expect(body.length).toBe(4 + 2 * 56 + 3 * 112);
    expect(body.readUInt32BE(0)).toBe(0);
    expect(body.readUInt32BE(4)).toBe(1001);
    expect(body.subarray(24, 56)).toEqual(Buffer.alloc(32));
    expect(body.readUInt32BE(56)).toBe(2);
    expect(body.readUInt32BE(60)).toBe(7);
    expect(body.readUInt32BE(172)).toBe(8);
    expect(body.subarray(132, 172)).toEqual(Buffer.alloc(40));
    expect(body.readUInt32BE(284)).toBe(1002);
    expect(body.readUInt32BE(336)).toBe(1);
    expect(body.readUInt32BE(340)).toBe(8);
    expect(body.readUInt32BE(340 + 16)).toBe(1); // skill count
    expect(body.readUInt32BE(340 + 20)).toBe(10002);
  });

  test('supports empty parties without shifting the second party', () => {
    const proto = new NoteReadyToFightRspProto().setPlayerInfo(1001, 'A', []).setEnemyInfo(0, 'B', []);
    const body = proto.serialize('xin-20261013');
    expect(body.length).toBe(116);
    expect(body.readUInt32BE(56)).toBe(0);
    expect(body.readUInt32BE(60)).toBe(0);
    expect(body.readUInt32BE(112)).toBe(0);
  });

  test('switches Packet 2505 to XIN and pads only the additional state slots', () => {
    const [first, second] = basicAttacks();
    first.status[49] = -1;
    const packet = new PacketNoteUseSkill(first, second, 'xin-20261013');
    const body = packet.serialize();
    // 96 + 2 skills * 8 per attack, plus 12-byte empty v1 extension.
    expect(body.length).toBe(236);
    expect(body.readInt32BE(16)).toBe(-7);
    expect(body.readInt8(56 + 49)).toBe(-1);
    expect(body.readInt8(106)).toBe(-6);
    expect(body.readUInt32BE(112)).toBe(1002);
    expect(body.subarray(224).toString('hex')).toBe('000000010000000000000000');
    expect(new PacketNoteUseSkill(first, second).serialize().toString('hex')).toBe(baseline.skillHex);
  });

  test('encodes nonempty field effects and shield snapshots in the v1 trailer', () => {
    const proto = new NoteUseSkillRspProto();
    proto.fieldEffects = [{id: 7, remainingRounds: 3}];
    proto.shieldSnapshots = [{userId: 1001, values: [80, 60, 40, 20]}];
    const body = proto.serialize('xin-20261013');
    expect(body.length).toBe(232);
    expect(body.subarray(192).toString('hex')).toBe(
      '0000000100000001000000070000000300000001000003e9000000500000003c0000002800000014'
    );
    // XIN trailer must never leak into the default packet.
    expect(proto.serialize().length).toBe(156);
  });

  test('rejects unknown configuration instead of silently selecting a wire format', () => {
    expect(ResolveClientProtocol(undefined)).toBe('kose');
    expect(ResolveClientProtocol('kose')).toBe('kose');
    expect(ResolveClientProtocol('xin-20261013')).toBe('xin-20261013');
    for (const value of ['xin', '', null, 1]) expect(() => ResolveClientProtocol(value)).toThrow('clientProtocol');
  });
});
