'use strict';
// Fix ARENA_GET_INFO (2419) from a captured live root (app/): the dist-only stub added on 10-21 answers 12 bytes, but the
// client's ArenaInfo reads 32 (flag, host ID, 16-byte host nick, host wins, challenger ID). The short read throws inside
// SocketImpl.onData before it resets to the next header, so after entering 精灵太空站 the client misreads every later
// packet: no fight starts and nothing else from the server arrives. All zeros keep the arena empty (flag 0).
// Usage: node build-arena-info-fix.cjs --baseline <live root> --out <dir>
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const assert = require('node:assert/strict');
const {parseArgs} = require('node:util');
const {values: v} = parseArgs({options: {baseline: {type: 'string'}, out: {type: 'string'}}});
for (const n of ['baseline', 'out']) if (!v[n]) throw Error('Missing --' + n);
const baseline = path.resolve(v.baseline), out = path.resolve(v.out);
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const rel = 'app/dist/GameServer/Server/Packet/Recv/Battle/ArenaHandlers.js';
const before = fs.readFileSync(path.join(baseline, rel), 'utf8');
const from = `        const buf = Buffer.alloc(12);
        await player.SendPacket(new PacketArenaInfo(buf));`;
assert.equal(before.split(from).length, 2, 'ARENA_GET_INFO stub changed; reconcile before building');
const after = before.replace(from, `        // 客户端 ArenaInfo 读 32 字节：flag、擂主ID、擂主昵称16字节、连胜数、挑战者ID；全 0 表示擂台空
        const buf = Buffer.alloc(32);
        await player.SendPacket(new PacketArenaInfo(buf));`);
fs.mkdirSync(path.dirname(path.join(out, rel)), {recursive: true});
fs.writeFileSync(path.join(out, rel), after);
const files = [{path: rel, before: sha(before), after: sha(after)}];
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify({files, restartGame: true, restartWeb: false, databaseMigration: false}, null, 2) + '\n');
console.log(JSON.stringify({out, files: files.length}));
