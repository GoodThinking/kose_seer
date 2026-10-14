import baseline from './fixtures/kose-login-pet-baseline.json';
import { PetInfoProto } from '../common/PetInfoProto';
import { LoginRspProto } from '../packets/rsp/login/LoginRspProto';
import { PacketGetPetInfo } from '../../../GameServer/Server/Packet/Send/Pet/PacketGetPetInfo';
import { PacketGetPetList } from '../../../GameServer/Server/Packet/Send/Pet/PacketGetPetList';
import { PacketPetRelease } from '../../../GameServer/Server/Packet/Send/Pet/PacketPetRelease';
import { PacketBuilder } from '../../protocol/PacketBuilder';
import { PetManager } from '../../../GameServer/Game/Pet/PetManager';
import { PlayerInstance } from '../../../GameServer/Game/Player/PlayerInstance';
import { PetData } from '../../../DataBase/models/PetData';
import { createDefaultPetInfo } from '../../models/PetModel';
import { Config } from '../../config/ServerConfig';
import { BaseProto } from '../base/BaseProto';
import { ConfigRegistry } from '../../config/ConfigRegistry';
import { ConfigKeys, ConfigPaths, ConfigType } from '../../config/ConfigDefinitions';

// Reader follows pinned core.swf UserInfo/PetInfo/PetEffectInfo/PetListInfo.
// Deliberately independent of BufferWriter and the serializers' field helpers.
class Input {
  offset = 0;
  constructor(readonly data: Buffer) {}
  bytes(n: number): Buffer {
    if (this.offset + n > this.data.length) throw new Error('truncated');
    const value = this.data.subarray(this.offset, this.offset + n);
    this.offset += n;
    return value;
  }
  u32(): number { return this.bytes(4).readUInt32BE(); }
  words(names: string): Record<string, number> {
    return Object.fromEntries(names.split(' ').map(name => [name, this.u32()]));
  }
  end(): void { expect(this.offset).toBe(this.data.length); }
}
function readPet(r: Input) {
  const id = r.u32(), name = r.bytes(16).toString('utf8').replace(/\0/g, '');
  const stats = r.words('dv nature abilityType level exp lvExp nextLvExp hp maxHp attack defence sa sd speed addMaxHP addMoreMaxHP addAttack addDefence addSA addSD addSpeed evHp evAtk evDef evSA evSD evSpeed');
  const skillCount = r.u32();
  const skills = Array.from({length: 4}, () => r.words('id pp'));
  const caught = r.words('catchTime catchMap catchRect catchLevel');
  const effectCount = r.bytes(2).readUInt16BE();
  const effects = Array.from({length: effectCount}, () => ({
    itemId: r.u32(), status: r.bytes(1)[0], leftCount: r.bytes(1)[0],
    effectID: r.bytes(2).readUInt16BE(), args: Array.from({length: 8}, () => r.bytes(2).readUInt16LE()),
  }));
  const extra = r.words('peteffect skinID shiny freeForbidden boss ornament skillProton skillProtonCount');
  const protons = Array.from({length: extra.skillProtonCount}, () => r.words('skillID visualID'));
  const marks = r.words('abilityMark skillMark commonMark commonMarkActived');
  return {id, name, ...stats, skillCount, skills, ...caught, catchTime: caught.catchTime, effects, ...extra, protons, ...marks};
}
function readLogin(r: Input) {
  const userId = r.u32(), regTime = r.u32(), nickname = r.bytes(16);
  const appearance = r.words('vipFlags dsFlag color texture energy coins fightBadge mapId posX posY timeToday timeLimit');
  r.bytes(4);
  r.words('loginCnt inviter newInviteeCnt vipLevel vipValue vipStage autoCharge vipEndTime freshManBonus');
  r.bytes(80); r.bytes(50);
  const records = r.bytes(200);
  const progress = r.words('teacherID studentID graduationCount maxPuniLv petMaxLev petAllNum monKingWin curStage maxStage curFreshStage maxFreshStage curKingStage maxKingStage maxKingHeroStage maxArenaWins');
  r.words('twoTimes threeTimes autoFight autoFightTimes energyTimes learnTimes monBtlMedal recordCnt obtainTm soulBeadItemID expireTm fuseTimes hasNono superNono nonoState nonoColor');
  r.bytes(16); r.bytes(24); r.bytes(8); r.bytes(1);
  const badge = r.u32(); r.bytes(27);
  const tasks = r.bytes(500);
  const pets = Array.from({length: r.u32()}, () => readPet(r));
  const clothes = Array.from({length: r.u32()}, () => r.words('id level'));
  const tail = r.words('achievementsId serverID ignored goldenName totalAchieve achieRank nonoChangeToPet');
  r.end();
  return {userId, regTime, nickname, ...appearance, records, ...progress, badge, tasks, pets, clothes, ...tail};
}
const pet = () => Object.assign(new PetInfoProto(), structuredClone(baseline.pet));

describe('XIN login and pet boundaries', () => {
  beforeAll(async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    ConfigRegistry.Instance.Register(ConfigKeys.PET_CONFIG, ConfigPaths[ConfigKeys.PET_CONFIG], ConfigType.XML);
    await ConfigRegistry.Instance.Initialize();
  });
  afterAll(() => jest.restoreAllMocks());

  test('keeps original login, full pet, list and release bytes in default mode', () => {
    const p = pet();
    expect(p.serialize().toString('hex')).toBe(baseline.petHex);
    const login = Object.assign(new LoginRspProto(), baseline.login, {petList: [p]});
    expect(login.serialize().toString('hex')).toBe(baseline.loginHex);
    expect(new PacketGetPetInfo(p).serialize().toString('hex')).toBe(baseline.petHex);
    expect(new PacketGetPetList([p]).serialize().toString('hex')).toBe(baseline.listHex);
    expect(new PacketPetRelease(0, p.catchTime, 1, p).serialize().toString('hex')).toBe(baseline.releaseHex);
  });

  test('reads multi-pet login through records, progress, effects, clothes and final tail', () => {
    const p = pet();
    Object.assign(p, {abilityType: 13, addMoreMaxHP: 256, shiny: 3, peteffect: 27});
    p.effects[0].args = [256, 513, 0, 65535, 5, 6, 7, 8];
    const second = Object.assign(pet(), {id: 8, catchTime: 1700000002, effects: [], skills: []});
    const login = Object.assign(new LoginRspProto(), baseline.login, {petList: [p, second], serverID: 77,
      curKingStage: 8, maxKingStage: 10, maxKingHeroStage: 12});
    login.bufferRecordArr[199] = 0x80;
    login.taskList[499] = 3;
    const decoded = readLogin(new Input(login.serialize('xin-20261013')));
    expect(decoded).toMatchObject({userId: 1001, teacherID: 1234, curFreshStage: 3, maxArenaWins: 9,
      curKingStage: 8, maxKingStage: 10, maxKingHeroStage: 12, badge: 13, serverID: 77,
      achievementsId: 0, goldenName: 0, totalAchieve: 0, nonoChangeToPet: 0});
    expect(decoded.records[199]).toBe(128);
    expect(decoded.tasks[499]).toBe(3);
    expect(decoded.clothes).toEqual(baseline.login.clothList);
    expect(decoded.pets.map(p => [p.id, p.catchTime])).toEqual([[7, 1700000001], [8, 1700000002]]);
    expect(decoded.pets[0]).toMatchObject({name: '测试', abilityType: 13, addMoreMaxHP: 256,
      hp: 61, maxHp: 110, skinID: 42, shiny: 3, peteffect: 27, skillCount: 1,
      effects: [{args: [256, 513, 0, 65535, 5, 6, 7, 8]}]});
    expect(decoded.pets[1].skillCount).toBe(0);
  });

  test('empty login still has complete task and tail boundaries', () => {
    const decoded = readLogin(new Input(new LoginRspProto().serialize('xin-20261013')));
    expect(decoded.pets).toEqual([]);
    expect(decoded.clothes).toEqual([]);
  });

  test('full-pet detail and release packets preserve snapshot semantics', () => {
    const p = pet();
    const detail = new PacketGetPetInfo(p, 0, 'xin-20261013');
    const release = new PacketPetRelease(0, p.catchTime, 1, p, 'xin-20261013');
    p.id = 999;
    const detailReader = new Input(detail.serialize());
    expect(readPet(detailReader).id).toBe(7); detailReader.end();
    const releaseReader = new Input(release.serialize());
    expect(releaseReader.words('homeEnergy firstPetTime flag')).toEqual({homeEnergy: 0, firstPetTime:1700000001, flag:1});
    expect(readPet(releaseReader).id).toBe(7); releaseReader.end();
    expect(new PacketPetRelease(0, 1700000001, 0, undefined, 'xin-20261013').serialize().length).toBe(12);
  });

  test('2303 has only 20-byte summaries, including zero and multiple pets', () => {
    const p = pet(); p.shiny = 3;
    const body = new PacketGetPetList([p, Object.assign(pet(), {id: 8})], 'xin-20261013').serialize();
    const r = new Input(body);
    expect(r.u32()).toBe(2);
    expect(r.words('id catchTime level skinID shiny')).toEqual({id:7, catchTime:1700000001, level:16, skinID:42, shiny:3});
    expect(r.words('id catchTime level skinID shiny').id).toBe(8); r.end();
    expect(new PacketGetPetList([], 'xin-20261013').serialize()).toEqual(Buffer.alloc(4));
  });

  test('actual GET_PET_LIST manager replies with 2303, keeps sorting and persisted cosmetic data', async () => {
    const packets: BaseProto[] = [];
    const player = {Uid:1001, ClientProtocol:'xin-20261013', SendPacket:async (p:BaseProto) => {packets.push(p);}} as unknown as PlayerInstance;
    const manager = new PetManager(player);
    const first = Object.assign(createDefaultPetInfo(1001, 7), {level:16, catchTime:1700000001, skinId:42, shiny:3});
    const second = Object.assign(createDefaultPetInfo(1001, 8), {level:20, catchTime:1700000002, isDefault:true});
    manager.PetData = {PetList:[first,second]} as PetData;
    await manager.HandleGetPetList();
    expect(packets[0].getCmdId()).toBe(2303);
    const r = new Input(packets[0].serialize());
    expect(r.u32()).toBe(2);
    expect(r.words('id catchTime level skinID shiny').id).toBe(8);
    expect(r.words('id catchTime level skinID shiny')).toMatchObject({id:7, level:16, skinID:42, shiny:3}); r.end();
    const details = manager.GetPetProtoList([first])[0];
    const decoded = readPet(new Input(details.serialize('xin-20261013')));
    expect(decoded).toMatchObject({skinID:42, shiny:3});
    Object.defineProperty(player, 'ClientProtocol', {value:'kose'});
    await manager.HandleGetPetList();
    expect(packets[1].getCmdId()).toBe(2324);
    expect(packets[1].serialize().length).toBe(4 + 2 * 12);
    expect(manager.GetPetProtoList([first])[0].skinID).toBe(0);
  });

  test('Player.SendPacket forwards the configured profile through a real KOSE packet header', async () => {
    const writes: Buffer[] = [];
    const player = Object.create(PlayerInstance.prototype);
    player._session = {Socket:{write:(p:Buffer) => writes.push(p)}};
    player._packetBuilder = new PacketBuilder();
    Object.defineProperty(player, 'Uid', {value:1001});
    const old = Config.Game.clientProtocol;
    try {
      Config.Game.clientProtocol = 'xin-20261013';
      await player.SendPacket(Object.assign(new LoginRspProto(), {userId:1001, petList:[pet()]}));
      expect(writes).toHaveLength(1);
      expect(writes[0].readUInt32BE(0)).toBe(writes[0].length);
      expect(writes[0].readUInt32BE(5)).toBe(1001);
      expect(readLogin(new Input(writes[0].subarray(17))).pets[0].id).toBe(7);
    } finally { Config.Game.clientProtocol = old; }
  });

  test('client reader detects truncated pet fields instead of accepting shifted boundaries', () => {
    const body = pet().serialize('xin-20261013');
    for (const cut of [1,16,40,76]) expect(() => readPet(new Input(body.subarray(0, body.length - cut)))).toThrow('truncated');
  });
});
