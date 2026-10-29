'use strict';
// Exercise the built game lifecycle with real configuration and an isolated currency boundary.
const assert = require('node:assert/strict');
const path = require('node:path');
if (!process.argv[2]) throw new Error('Usage: node test-native-material-games.cjs <app>');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = name => require(path.join(app, 'dist', name));
const { MaterialGames } = load('GameServer/Game/Map/MaterialGames');
const { MaterialGameOverHandler } = load('GameServer/Server/Packet/Recv/Map/MaterialHandlers');
const { ConfigLoader } = load('shared/config/ConfigLoader');
const config = ConfigLoader.Instance.LoadJson('data/json/material-sources.json');
assert.equal(config.lookoutGame.pointsPerCoin, 100);
assert.equal(config.lookoutGame.maxCoins, 350);
assert.deepEqual(config.standardGames.mapIds, [4, 6, 9]);
assert.equal(config.standardGames.coinsPerPercent, 1);
assert.equal(config.standardGames.maxCoins, 100);
function fixture() {
  return { Data: { mapID: 7 }, grants: [], async AddCurrency(energy, coins) {
    assert.equal(energy, undefined); this.grants.push(coins); return true;
  } };
}
function join(player) { MaterialGames.Join(player, 1); }
function percentage(raw) { return Math.floor(raw / 35000 * 100); }
async function finish(player, raw) { return MaterialGames.Finish(player, percentage(raw), raw); }
(async () => {
  for (const [raw, expected] of [[0, 0], [99, 0], [100, 1], [35000, 350], [49000, 350]]) {
    const player = fixture(); join(player);
    assert.deepEqual(await finish(player, raw), expected ? [{ itemId: 1, count: expected }] : []);
    assert.deepEqual(player.grants, expected ? [expected] : []);
    await assert.rejects(finish(player, raw));
  }
  let player = fixture(); join(player);
  await assert.rejects(MaterialGames.Finish(player, 1, 100), /lookout/i);
  assert.deepEqual(player.grants, []);
  player = fixture(); join(player); player.Data.mapID = 8;
  await assert.rejects(finish(player, 100), /lookout/i);
  assert.deepEqual(player.grants, []);
  for (const outcome of [false, new Error('storage failed')]) {
    player = fixture(); player.AddCurrency = async () => { if (outcome instanceof Error) throw outcome; return outcome; };
    const packets = []; player.SendPacket = async packet => packets.push(packet);
    join(player);
    const body = Buffer.alloc(8); body.writeUInt32BE(100, 4);
    await new MaterialGameOverHandler().Handle({ Player: player }, {}, body);
    assert.equal(packets.length, 1);
    assert.equal(packets[0].getResult(), 5001);
    await assert.rejects(finish(player, 100));
  }
  player = fixture(); let release;
  const pending = new Promise(resolve => { release = resolve; });
  player.AddCurrency = async (_, coins) => { player.grants.push(coins); await pending; return true; };
  join(player);
  const first = finish(player, 100);
  await assert.rejects(finish(player, 100));
  release();
  assert.deepEqual(await first, [{ itemId: 1, count: 1 }]);
  assert.deepEqual(player.grants, [1]);
  for (const [mapId, score, raw, expected] of [
    [4, 0, 0, 0], [4, 10, 300, 10], [4, 133, 4000, 100],
    [6, 0, 0, 0], [6, 40, 40, 40], [6, 80, 80, 80], [6, 100, 100, 100],
    [9, 0, 0, 0], [9, 7, 50, 7], [9, 71, 490, 71], [9, 85, 590, 85], [9, 100, 690, 100]
  ]) {
    player = fixture(); player.Data.mapID = mapId; join(player);
    assert.deepEqual(await MaterialGames.Finish(player, score, raw), expected ? [{ itemId: 1, count: expected }] : []);
    assert.deepEqual(player.grants, expected ? [expected] : []);
    await assert.rejects(MaterialGames.Finish(player, score, raw));
  }
  for (const [mapId, score, raw] of [[4, 9, 300], [6, 41, 41], [9, 14, 51]]) {
    player = fixture(); player.Data.mapID = mapId; join(player);
    await assert.rejects(MaterialGames.Finish(player, score, raw), /invalid/i);
    assert.deepEqual(player.grants, []);
  }
  for (const mapId of [4, 6, 9]) {
    player = fixture(); player.Data.mapID = mapId; join(player); player.Data.mapID = 2;
    await assert.rejects(MaterialGames.Finish(player, 0, 0), /map/i);
    const [score, raw] = mapId === 4 ? [10, 300] : mapId === 6 ? [40, 40] : [7, 50];
    for (const outcome of [false, new Error('storage failed')]) {
      player = fixture(); player.Data.mapID = mapId;
      player.AddCurrency = async () => { if (outcome instanceof Error) throw outcome; return outcome; };
      join(player);
      const packets = []; player.SendPacket = async packet => packets.push(packet);
      const body = Buffer.alloc(8); body.writeUInt32BE(score); body.writeUInt32BE(raw, 4);
      await new MaterialGameOverHandler().Handle({ Player: player }, {}, body);
      assert.equal(packets.length, 1);
      assert.equal(packets[0].getResult(), 5001);
      await assert.rejects(MaterialGames.Finish(player, score, raw));
    }
    player = fixture(); player.Data.mapID = mapId;
    let releaseStandard;
    const standardPending = new Promise(resolve => { releaseStandard = resolve; });
    player.AddCurrency = async (_, coins) => { player.grants.push(coins); await standardPending; return true; };
    join(player);
    const standardFirst = MaterialGames.Finish(player, score, raw);
    await assert.rejects(MaterialGames.Finish(player, score, raw));
    releaseStandard();
    assert.deepEqual(await standardFirst, [{ itemId: 1, count: score }]);
    assert.deepEqual(player.grants, [score]);
  }
  player = fixture(); player.Data.mapID = 13; join(player);
  assert.deepEqual(await MaterialGames.Finish(player, 0, 0), []);
  assert.deepEqual(player.grants, []);
  console.log('Native material game lifecycle boundaries passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
