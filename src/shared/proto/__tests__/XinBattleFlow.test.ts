import { BattleManager } from '../../../GameServer/Game/Battle/BattleManager';
import { PlayerInstance } from '../../../GameServer/Game/Player/PlayerInstance';
import { PetManager } from '../../../GameServer/Game/Pet/PetManager';
import { SptSystem } from '../../../GameServer/Game/Pet/SptSystem';
import { PetData } from '../../../DataBase/models/PetData';
import { DatabaseHelper } from '../../../DataBase/DatabaseHelper';
import { FightNpcMonsterHandler } from '../../../GameServer/Server/Packet/Recv/Battle/FightNpcMonsterHandler';
import { ReadyToFightHandler } from '../../../GameServer/Server/Packet/Recv/Battle/ReadyToFightHandler';
import { UseSkillHandler } from '../../../GameServer/Server/Packet/Recv/Battle/UseSkillHandler';
import { IClientSession } from '../../../GameServer/Server/Packet/IHandler';
import { HeadInfo } from '../../protocol/HeadInfo';
import { GameConfig } from '../../config/game/GameConfig';
import { createDefaultPetInfo, IPetInfo } from '../../models/PetModel';
import { BaseProto } from '../base/BaseProto';
import { ClientProtocol } from '../../protocol/ClientProtocol';

// Independent readers follow pinned core PetInfo(false), FighetUserInfo and AttackValue.
class Input {
  offset = 0;
  constructor(readonly data: Buffer) {}
  bytes(n: number): Buffer {
    if (this.offset + n > this.data.length) throw new Error('truncated');
    const b = this.data.subarray(this.offset, this.offset + n); this.offset += n; return b;
  }
  u32(): number { return this.bytes(4).readUInt32BE(); }
  i32(): number { return this.bytes(4).readInt32BE(); }
  words(names: string): Record<string, number> {
    return Object.fromEntries(names.split(' ').map(n => [n, this.u32()]));
  }
  end(): void { expect(this.offset).toBe(this.data.length); }
}
function ready(body: Buffer, xin = true) {
  const r = new Input(body), mode = r.u32();
  const parties = Array.from({length: 2}, () => {
    const userId = r.u32(), nick = r.bytes(16);
    if (xin) expect(r.bytes(32)).toEqual(Buffer.alloc(32));
    const pets = Array.from({length: r.u32()}, () => {
      const stats = r.words('id level hp maxHp skillCount');
      const skills = Array.from({length: 4}, () => r.words('id pp'));
      const caught = r.words('catchTime catchMap catchRect catchLevel skinID');
      const extra = xin ? r.words('shiny freeForbidden boss ornament skillProton skillProtonCount abilityMark skillMark commonMark commonMarkActived') : {};
      return {...stats, ...caught, ...extra, skinID: caught.skinID, shiny: extra.shiny, skills};
    });
    return {userId, nick, pets};
  });
  r.end(); return {mode, parties};
}
function skill(body: Buffer) {
  const r = new Input(body);
  const attacks = Array.from({length: 2}, () => {
    const fields = r.words('userId skillId atkTimes lostHP');
    const gainHP = r.i32(), remainHP = r.i32(), maxHP = r.u32(), state = r.u32();
    const skills = Array.from({length: r.u32()}, () => r.words('id pp'));
    const crit = r.u32();
    const status = Array.from({length: 50}, () => r.bytes(1).readInt8());
    const levels = Array.from({length: 6}, () => r.bytes(1).readInt8());
    return {...fields, lostHP: fields.lostHP, gainHP, remainHP, maxHP, state, skills, crit, status, levels};
  });
  expect(r.words('version fields shields')).toEqual({version: 1, fields: 0, shields: 0});
  r.end(); return attacks;
}
function fixture(protocol: ClientProtocol = 'xin-20261013') {
  const pets: IPetInfo[] = [
    Object.assign(createDefaultPetInfo(1001, 7), {catchTime: 1700000001, level: 50, hp: 500, maxHp: 500,
      atk: 500, speed: 500, isDefault: true, skillArray: [10001], skinId: 42, shiny: 3}),
    Object.assign(createDefaultPetInfo(1001, 8), {catchTime: 1700000002, skinId: 43, shiny: 10}),
  ];
  const packets: BaseProto[] = [];
  const player = {Uid: 1001, ClientProtocol: protocol, Data: {nick: 'Tester', mapID: 301},
    SendPacket: async (p: BaseProto) => { packets.push(p); },
    EventBus: {Emit: jest.fn(async () => {})},
    MapSpawnManager: {GetMapOgres: () => [{petId: 9, shiny: 0, originalPetId: 9}], OnBattleEnd: jest.fn()},
    AddCurrency: jest.fn(async () => true), ItemManager: {GiveItem: jest.fn()},
  } as unknown as PlayerInstance;
  player.PetManager = new PetManager(player);
  player.PetManager.PetData = Object.assign(Object.create(PetData.prototype), {PetList: pets});
  player.BattleManager = new BattleManager(player);
  const session = {Player: player} as IClientSession;
  return {player, pets, packets, session};
}
describe('XIN battle manager flow', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    jest.spyOn(GameConfig, 'GetPetById').mockImplementation(id => ({ID: id, DefName: 'TestPet', Type: 8,
      HP: 50, Atk: 40, Def: 35, SpAtk: 40, SpDef: 35, Spd: 30} as any));
    jest.spyOn(GameConfig, 'GetSkillById').mockImplementation(id => ({ID: id, Name: 'TestSkill', Category: 1,
      Type: 8, Power: 40, MaxPP: 20, Accuracy: 100, MustHit: 1} as any));
    jest.spyOn(GameConfig, 'GetMapConfigById').mockReturnValue({ogres: [{petId: 9, slot: 0, level: 5, expReward: 50}]} as any);
    jest.spyOn(GameConfig, 'GetMapOgreConfig').mockReturnValue({maps: {}} as any);
    jest.spyOn(SptSystem, 'GetLearnableMovesByLevel').mockReturnValue([{id: 10001}] as any);
  });
  afterEach(() => { jest.useRealTimers(); jest.restoreAllMocks(); });

  test('2408 handler sends persisted cosmetics for multiple pets, keeps enemy boundary and packet snapshot', async () => {
    const f = fixture();
    await new FightNpcMonsterHandler().Handle(f.session, new HeadInfo(), Buffer.alloc(4));
    expect(f.packets.map(p => p.getCmdId())).toEqual([2408, 2503]);
    const packet = f.packets[1], before = packet.serialize();
    const decoded = ready(before);
    expect(decoded.parties[0].pets).toMatchObject([{id: 7, skinID: 42, shiny: 3}, {id: 8, skinID: 43, shiny: 10}]);
    expect(decoded.parties[1]).toMatchObject({userId: 0, pets: [{id: 9, skinID: 0, shiny: 0}]});
    f.pets[0].skinId = 999; f.pets[0].shiny = 1;
    expect(packet.serialize()).toEqual(before);
  });

  test.each(['kose', 'xin-20261013'] as ClientProtocol[])('missing cosmetics default to zero and %s keeps its layout', async protocol => {
    const f = fixture(protocol);
    delete f.pets[1].skinId; delete f.pets[1].shiny;
    await f.player.BattleManager.HandleFightNpcMonster(0);
    const body = f.packets[1].serialize(), decoded = ready(body, protocol !== 'kose');
    expect(decoded.parties[0].pets[1].skinID).toBe(0);
    if (protocol === 'kose') {
      expect(body.length).toBe(4 + 2 * 24 + 3 * 72);
      expect(decoded.parties[0].pets[0].skinID).toBe(0);
    } else expect(decoded.parties[0].pets[1].shiny).toBe(0);
  });

  test('real PVE turn reaches victory, PP result, HP sync, reward handoff and cleanup', async () => {
    jest.useFakeTimers();
    const f = fixture();
    // Persistence belongs to the pet task; assert the real reward service's handoff here.
    jest.spyOn(DatabaseHelper.Instance, 'SavePetData').mockResolvedValue();
    const exp = jest.spyOn(f.player.PetManager, 'HandleAddPetExpByCatchTime').mockResolvedValue(false);
    await new FightNpcMonsterHandler().Handle(f.session, new HeadInfo(), Buffer.alloc(4));
    await new ReadyToFightHandler().Handle(f.session, new HeadInfo(), Buffer.alloc(0));
    const start = new Input(f.packets.find(p => p.getCmdId() === 2504)!.serialize());
    expect(start.u32()).toBe(0);
    const fighters = Array.from({length: 2}, () => {
      const identity = start.words('userId petId'); start.bytes(16);
      const stats = start.words('catchTime hp maxHP level catchable');
      expect(start.bytes(6)).toEqual(Buffer.alloc(6));
      return {...identity, ...stats};
    });
    expect(fighters).toMatchObject([{userId: 1001, petId: 7, catchTime: 1700000001, hp: 500}, {userId: 0, petId: 9, catchable: 1}]);
    start.end();
    const battle = f.player.BattleManager.GetCurrentBattle()!;
    const request = Buffer.alloc(4); request.writeUInt32BE(10001);
    await new UseSkillHandler().Handle(f.session, new HeadInfo(), request);
    const attacks = skill(f.packets.find(p => p.getCmdId() === 2505)!.serialize());
    expect(attacks[0]).toMatchObject({userId: 1001, skillId: 10001, skills: [{id: 10001, pp: 19}]});
    expect(attacks[0].lostHP).toBeGreaterThan(0);
    expect(attacks[0].status).toEqual(Array(50).fill(0));
    expect(battle.enemy.hp).toBe(0);
    expect(f.pets[0].hp).toBe(battle.player.hp);
    expect(exp).toHaveBeenCalledWith(1700000001, 50, battle.enemy.id);
    expect(f.player.AddCurrency).toHaveBeenCalledWith(undefined, 25);
    const over = new Input(f.packets.find(p => p.getCmdId() === 2506)!.serialize());
    expect(over.words('reason winner two three auto energy learn')).toEqual({reason: 0, winner: 1001, two: 0, three: 0, auto: 0, energy: 0, learn: 0}); over.end();
    expect(f.player.MapSpawnManager.OnBattleEnd).toHaveBeenCalledWith(0);
    expect(f.player.BattleManager.GetCurrentBattle()).toBeNull();
    await jest.advanceTimersByTimeAsync(1200);
    const reward = f.packets[f.packets.length - 1];
    expect(reward.getCmdId()).toBe(2202);
    const rewards = new Input(reward.serialize());
    expect(rewards.words('task pet caught count')).toEqual({task: 0, pet: 0, caught: 0, count: 1});
    expect(rewards.words('item count')).toEqual({item: 1, count: 25});
    rewards.end();
  });
});
