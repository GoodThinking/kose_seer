import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import '../../../../DataBase/loaders/DataLoader';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { Config } from '../../../../shared/config/ServerConfig';
import { createDefaultPetInfo, IPetInfo } from '../../../../shared/models/PetModel';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { PetManager } from '../PetManager';

describe('Nieo inventory and persisted room display use separate commands', () => {
  const uid = 191001, peer = 191002, identity = 1700010000;
  const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance;
  let directory: string, oldDatabase: typeof Config.Config.database, manager: PetManager;
  let player: PlayerInstance;
  let sent: Array<{cmd: number; result: number; body: Buffer; stored: IPetInfo[]}>;
  const settle = () => new Promise(resolve => setTimeout(resolve, 160));
  async function stored(owner = uid): Promise<IPetInfo[]> {
    const [row] = await db.Query<{pet_list: string}>('SELECT pet_list FROM player_pets WHERE owner_id = ?', [owner]);
    return JSON.parse(row.pet_list);
  }
  function selection(indices: number[]): Buffer {
    const body = Buffer.alloc(4 + indices.length * 8); body.writeUInt32BE(indices.length);
    indices.forEach((index, i) => { body.writeUInt32BE(identity + index, 4 + i * 8); body.writeUInt32BE(7, 8 + i * 8); });
    return body;
  }
  async function reload() {
    helper.RemoveCache(uid); manager = new PetManager(player); await manager.Initialize();
  }
  beforeAll(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'room-display-'));
    oldDatabase = Config.Config.database;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'room.sqlite')};
    await db.Initialize();
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY)');
    await db.Execute('INSERT INTO players VALUES (?), (?)', [uid, peer]);
    await db.Execute(new Migration012FixAllTables().upSQLite().find(sql => sql.startsWith('CREATE TABLE IF NOT EXISTS player_pets'))!);
  });
  beforeEach(async () => {
    sent = [];
    const pets = Array.from({length: 1518}, (_, index) => Object.assign(createDefaultPetInfo(uid, 7), {
      catchTime: identity + index, isInBag: index < 6, isDefault: index === 0,
    }));
    await db.Execute('INSERT OR REPLACE INTO player_pets (owner_id, pet_list) VALUES (?, ?)', [uid, JSON.stringify(pets)]);
    const foreign = Object.assign(createDefaultPetInfo(peer, 7), {catchTime: identity + 5000, isInBag: false, isRoomShow: true});
    await db.Execute('INSERT OR REPLACE INTO player_pets (owner_id, pet_list) VALUES (?, ?)', [peer, JSON.stringify([foreign])]);
    player = {Uid: uid, ClientProtocol: 'kose', SendPacket: async (packet: any) => {
      sent.push({cmd: packet.getCmdId(), result: packet.getResult(), body: packet.serialize('kose'), stored: await stored()});
    }} as unknown as PlayerInstance;
    await reload();
  });
  afterEach(async () => { await settle(); helper.RemoveCache(uid); });
  afterAll(async () => { await db.Shutdown(); Config.Config.database = oldDatabase; fs.rmSync(directory, {recursive: true, force: true}); });

  test('full inventory remains 1518, while old storage flags do not exhibit pets', async () => {
    await manager.HandleGetPetList(); await manager.HandleGetPetRoomList(uid);
    expect(sent.map(p => p.cmd)).toEqual([2303, 2324]);
    expect(sent[0].body.readUInt32BE(0)).toBe(1518);
    expect(sent[0].body.length).toBe(4 + 1518 * 12);
    expect(sent[1].body).toEqual(Buffer.alloc(4));
    expect(await stored()).toHaveLength(1518);
  });

  test('selection commits before acknowledgement, survives reload, and clears normally', async () => {
    await manager.HandlePetRoomShow(selection([6, 7]));
    expect(sent[0]).toMatchObject({cmd: 2323, result: 0});
    expect(sent[0].body.readUInt32BE(0)).toBe(2);
    expect(sent[0].stored.filter(p => p.isRoomShow).map(p => p.catchTime)).toEqual([identity + 6, identity + 7]);
    await settle(); await reload(); sent = [];
    await manager.HandleGetPetRoomList(uid);
    expect(sent[0].body.readUInt32BE(0)).toBe(2);
    await manager.HandlePetRoomShow(selection([]));
    expect(sent[1].body).toEqual(Buffer.alloc(4));
    expect((await stored()).filter(p => p.isRoomShow)).toHaveLength(0);
  });

  test.each([[0], [6, 6], [6, 7, 8, 9, 10, 11], [2000]])('rejects invalid selection %j without changing storage', async (...indices: number[]) => {
    const before = await stored();
    await manager.HandlePetRoomShow(selection(indices));
    expect(sent[0]).toMatchObject({cmd: 2323, result: 5001});
    expect(await stored()).toEqual(before);
  });

  test('rejects malformed lengths and mismatched pet identity', async () => {
    const before = await stored(); const body = selection([6]); body.writeUInt32BE(8, 8);
    for (const input of [Buffer.alloc(0), Buffer.alloc(5), body]) await manager.HandlePetRoomShow(input);
    expect(sent.map(p => p.result)).toEqual([5001, 5001, 5001]);
    expect(await stored()).toEqual(before);
  });

  test('SQLite write failure cannot publish or autosave rejected room flags', async () => {
    const before = await stored();
    await db.Execute("CREATE TRIGGER fail_room BEFORE UPDATE ON player_pets BEGIN SELECT RAISE(FAIL, 'room-save-blocked'); END");
    try {
      await manager.HandlePetRoomShow(selection([6]));
      expect(sent[0]).toMatchObject({cmd: 2323, result: 5000});
      expect(manager.PetData.PetList.some(p => p.isRoomShow)).toBe(false);
      await settle(); expect(await stored()).toEqual(before);
    } finally { await db.Execute('DROP TRIGGER fail_room'); }
  });

  test('room request reads the named owner exhibition, not requester storage', async () => {
    const before = await stored(peer);
    await manager.HandleGetPetRoomList(peer); await manager.HandleGetPetRoomList(peer + 1);
    expect(sent[0].body.readUInt32BE(0)).toBe(1);
    expect(sent[0].body.readUInt32BE(8)).toBe(identity + 5000);
    expect(sent[1].body).toEqual(Buffer.alloc(4));
    expect(await stored(peer)).toEqual(before);
  });
});
