import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import '../../../../DataBase/loaders/DataLoader';
import { DatabaseManager } from '../../../../DataBase/DatabaseManager';
import { DatabaseHelper } from '../../../../DataBase/DatabaseHelper';
import { DataSaver } from '../../../../DataBase/savers/DataSaver';
import { Migration012FixAllTables } from '../../../../DataBase/migrations/scripts/012_fix_all_tables';
import { Config } from '../../../../shared/config/ServerConfig';
import { Handlers } from '../../../../shared/decorators/Opcode';
import { PacketBuilder } from '../../../../shared/protocol/PacketBuilder';
import { createDefaultMailInfo } from '../../../../shared/models/MailModel';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { MailManager } from '../MailManager';
import '../../../Server/Packet/Recv/Mail';

describe('registered mailbox list through real SQLite and packet transport', () => {
  const db = DatabaseManager.Instance, helper = DatabaseHelper.Instance, uid = 827510;
  let directory: string, oldDatabase: typeof Config.Config.database, player: PlayerInstance;
  let packets: Buffer[];
  beforeAll(async () => {
    jest.useFakeTimers();
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-mail-list-'));
    oldDatabase = Config.Config.database;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'mail.sqlite')};
    await db.Initialize();
    await db.Execute('CREATE TABLE players (user_id INTEGER PRIMARY KEY)');
    await db.Execute('INSERT INTO players (user_id) VALUES (?)', [uid]);
    await db.Execute(new Migration012FixAllTables().upSQLite().find(sql => sql.includes('CREATE TABLE IF NOT EXISTS player_mails'))!);
    player = Object.create(PlayerInstance.prototype);
    Object.defineProperty(player, 'Uid', {value: uid});
    Object.assign(player, {_packetBuilder: new PacketBuilder(),
      _session: {Socket: {write: (packet: Buffer) => packets.push(Buffer.from(packet))}}});
    player.MailManager = new MailManager(player);
    await player.MailManager.Initialize();
  });
  beforeEach(() => { packets = []; });
  afterAll(async () => {
    jest.clearAllTimers();
    helper.RemoveCache(uid);
    await db.Shutdown();
    Config.Config.database = oldDatabase;
    fs.rmSync(directory, {recursive: true, force: true});
    jest.useRealTimers();
  });
  async function query(): Promise<Buffer> {
    const handler = Handlers.Get(2751);
    expect(handler).toBeDefined();
    await new handler!().Handle({Player: player}, {}, Buffer.alloc(0));
    expect(packets).toHaveLength(1);
    expect(packets[0].readUInt32BE(5)).toBe(2751);
    expect(packets[0].readInt32BE(13)).toBe(0);
    return packets[0].subarray(17);
  }
  test('empty inbox replies with two zero counts', async () => {
    expect(await query()).toEqual(Buffer.alloc(8));
  });
  test('stored inbox uses the fixed client 36-byte record and is not marked read', async () => {
    player.MailManager.MailData.MailList = [Object.assign(createDefaultMailInfo(uid, 17),
      {id: 3, mailType: 1, sendTime: 1700000000, senderNick: 'System'})];
    await DataSaver.Instance.Save('mail', player.MailManager.MailData, true);
    const before = await db.Query('SELECT mail_list FROM player_mails WHERE owner_id=?', [uid]);
    const body = await query();
    expect(body.length).toBe(44);
    expect([0, 4, 8, 12, 16, 20, 40].map(offset => body.readUInt32BE(offset)))
      .toEqual([1, 1, 3, 1, 1700000000, 17, 0]);
    expect(body.subarray(24, 40).toString('utf8').replace(/\0+$/, '')).toBe('System');
    expect(await db.Query('SELECT mail_list FROM player_mails WHERE owner_id=?', [uid])).toEqual(before);
    expect(player.MailManager.MailData.MailList[0].isRead).toBe(false);
  });
});
