import baseline from './fixtures/kose-map-baseline.json';
import { SeerMapUserInfoProto } from '../common/SeerMapUserInfoProto';
import { EnterMapRspProto } from '../packets/rsp/map/EnterMapRspProto';
import { ListMapPlayerRspProto } from '../packets/rsp/map/ListMapPlayerRspProto';
import { PacketEnterMap } from '../../../GameServer/Server/Packet/Send/Map/PacketEnterMap';
import { PacketListMapPlayer } from '../../../GameServer/Server/Packet/Send/Map/PacketListMapPlayer';
import { MapManager } from '../../../GameServer/Game/Map/MapManager';
import { PlayerInstance } from '../../../GameServer/Game/Player/PlayerInstance';
import { createDefaultPlayerInfo } from '../../models/PlayerModel';
import { PacketBuilder } from '../../protocol/PacketBuilder';
import { Config } from '../../config/ServerConfig';

// Independent reader follows pinned core.swf UserInfo.setForPeoleInfo with
// both optional tails enabled, as preferred by UserListCmdListener.
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
function readUser(r: Input) {
  const userID = r.u32(), nick = r.bytes(16).toString('utf8').replace(/\0/g, '');
  const fields = r.words('color texture vipFlags vipStage actionType x y action direction changeShape spiritTime spiritID petDV petShiny petSkin achievementsId petRide petOrnament petAbilityType fightFlag teacherID studentID nonoState nonoColor superNono playerForm transTime teamId teamCoreCount teamIsShow');
  const logo = Array.from({length: 4}, () => r.bytes(2).readInt16BE());
  const logoWord = r.bytes(4).toString('utf8');
  const clothes = Array.from({length: r.u32()}, () => r.words('id level'));
  const tail = r.words('goldenName nonoChangeToPet');
  return {userID, nick, ...fields, logo, logoWord, clothes, ...tail};
}
function readList(body: Buffer) {
  const r = new Input(body);
  const users = Array.from({length: r.u32()}, () => readUser(r));
  r.end();
  return users;
}
const user = () => Object.assign(new SeerMapUserInfoProto(), structuredClone(baseline.user));

describe('XIN map user boundaries', () => {
  beforeAll(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
  afterAll(() => jest.restoreAllMocks());

  test('preserves original default body and cached map packets byte for byte', () => {
    const p = user();
    expect(p.serialize().toString('hex')).toBe(baseline.hex);
    expect(p.serialize('kose').toString('hex')).toBe(baseline.hex);
    expect(new EnterMapRspProto(p).serialize().toString('hex')).toBe(baseline.hex);
    expect(new PacketEnterMap(p).serialize().toString('hex')).toBe(baseline.hex);
    expect(new PacketListMapPlayer([p]).serialize().toString('hex')).toBe('00000001' + baseline.hex);
  });

  test('reads userID first, new pet fields, signed team shorts and the complete tail', () => {
    const p = Object.assign(user(), {petShiny:3, teamLogoBg:-32768, teamLogoIcon:32767,
      teamLogoColor:-1, teamTxtColor:256});
    const body = new EnterMapRspProto(p).serialize('xin-20261013');
    const r = new Input(body);
    expect(readUser(r)).toMatchObject({userID:1001, nick:'地图测试', petShiny:3, petSkin:29,
      achievementsId:0, petRide:0, petOrnament:0, petAbilityType:0, fightFlag:30,
      teacherID:31, studentID:32, transTime:37, teamId:38, teamCoreCount:39,
      logo:[-32768,32767,-1,256], logoWord:'ABCD', clothes:baseline.user.clothes,
      goldenName:0, nonoChangeToPet:0});
    r.end();
    expect(body.length).toBe(180);
  });

  test('multiple users with different clothing counts consume exactly the full list', () => {
    const second = Object.assign(user(), {userID:1002, nick:'Second', clothes:[]});
    const list = new ListMapPlayerRspProto().setPlayers([user(), second]);
    expect(readList(list.serialize('xin-20261013')).map(p => [p.userID,p.clothes.length]))
      .toEqual([[1001,2],[1002,0]]);
    expect(readList(new ListMapPlayerRspProto().serialize('xin-20261013'))).toEqual([]);
  });

  test('cached map packets retain the selected profile and snapshot', () => {
    const p = user();
    const enter = new PacketEnterMap(p, 0, 'xin-20261013');
    const list = new PacketListMapPlayer([p], 'xin-20261013');
    const expected = p.serialize('xin-20261013');
    p.userID = 9999; p.clothes.length = 0;
    expect(enter.getCmdId()).toBe(2001);
    expect(list.getCmdId()).toBe(2003);
    expect(enter.serialize()).toEqual(expected);
    expect(readList(list.serialize())[0].userID).toBe(1001);
  });

  test('MapManager uses persisted pet appearance and current position/clothing', () => {
    const data = createDefaultPlayerInfo(1001, 'MapUser');
    data.clothIds = [10002,10003];
    data.curTitle = 123;
    const player = {Uid:1001, PetManager:{GetDefaultPet:() => ({
      petId:7, catchTime:1700000001, dvHp:31, skinId:42, shiny:3,
    })}} as unknown as PlayerInstance;
    const manager = new MapManager(player);
    const p = manager.buildUserInfo(1001, data, 321, 456, player);
    const r = new Input(p.serialize('xin-20261013'));
    expect(readUser(r)).toMatchObject({userID:1001, x:321,y:456,spiritID:7,
      spiritTime:1700000001,petSkin:42,petShiny:3,achievementsId:0,
      clothes:[{id:10002,level:0},{id:10003,level:0}]});
    r.end();
  });

  test('real Player.SendPacket carries map bodies through v1 framing', async () => {
    const writes: Buffer[] = [];
    const player = Object.create(PlayerInstance.prototype);
    player._session = {Socket:{write:(p:Buffer) => writes.push(p)}};
    player._packetBuilder = new PacketBuilder();
    Object.defineProperty(player, 'Uid', {value:1001});
    const old = Config.Game.clientProtocol;
    try {
      Config.Game.clientProtocol = 'xin-20261013';
      await player.SendPacket(new PacketEnterMap(user(), 0, player.ClientProtocol));
      await player.SendPacket(new ListMapPlayerRspProto().setPlayers([user()]));
      expect(writes.map(b => b.readUInt32BE(5))).toEqual([2001,2003]);
      for (const frame of writes) expect(frame.readUInt32BE(0)).toBe(frame.length);
      const r = new Input(writes[0].subarray(17));
      expect(readUser(r).userID).toBe(1001); r.end();
      expect(readList(writes[1].subarray(17))[0].userID).toBe(1001);
    } finally { Config.Game.clientProtocol = old; }
  });

  test('rejects truncated required fields and out-of-range team shorts', () => {
    const body = user().serialize('xin-20261013');
    for (const length of [0,19,100,148]) {
      expect(() => readUser(new Input(body.subarray(0,length)))).toThrow('truncated');
    }
    expect(() => Object.assign(user(), {teamLogoBg:32768}).serialize('xin-20261013')).toThrow(/out of range/);
    expect(() => Object.assign(user(), {teamLogoBg:-32769}).serialize('xin-20261013')).toThrow(/out of range/);
  });
});
