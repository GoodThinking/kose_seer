'use strict';
// ARENA_GET_INFO answers the 32-byte ArenaInfo the client reads (flag, host ID, 16-byte nick, wins, challenger ID).
// Usage: node scripts/test-arena-info.cjs <runtime app dir with dist/config/node_modules>
const assert = require('node:assert/strict'), path = require('node:path');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
const {Logger, LogLevel} = load('shared/utils/Logger');
Logger.SetMinLevel(LogLevel.Error);
const {ArenaGetInfoHandler} = load('GameServer/Server/Packet/Recv/Battle/ArenaHandlers');
(async () => {
  const packets = [];
  const player = {SendPacket: async packet => { packets.push({command: packet.getCmdId(), body: packet.serialize('xin-20261013')}); }};
  await new ArenaGetInfoHandler().Handle({Player: player}, {}, Buffer.alloc(0));
  assert.equal(packets.length, 1);
  const body = packets[0].body;
  assert.equal(packets[0].command, 2419);
  assert.equal(body.length, 32, 'client ArenaInfo reads 32 bytes');
  // 按客户端 ArenaInfo 的顺序读：flag 为 0 表示擂台空
  let at = 0;
  const u32 = () => { const value = body.readUInt32BE(at); at += 4; return value; };
  const info = {flag: u32(), hostID: u32(), hostNick: body.subarray(at, at += 16).toString('utf8').replace(/\0+$/, ''), hostWins: u32(), challengerID: u32()};
  assert.deepEqual(info, {flag: 0, hostID: 0, hostNick: '', hostWins: 0, challengerID: 0});
  assert.equal(at, body.length, 'nothing left over');
  console.log(JSON.stringify({passed: 1, results: ['ARENA_GET_INFO is the 32-byte empty-arena ArenaInfo the client reads'], database: 'none'}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
