import { ItemManager } from '../ItemManager';
import { ItemListHandler } from '../../../Server/Packet/Recv/Item/ItemListHandler';
import { PlayerInstance } from '../../Player/PlayerInstance';
import { PacketBuilder } from '../../../../shared/protocol/PacketBuilder';
import { IItemInfo } from '../../../../DataBase/models/ItemData';

const inventory: readonly IItemInfo[] = Object.freeze([
  {itemId: 100001, count: 1, expireTime: 0},
  {itemId: 101000, count: 2, expireTime: 9},
  {itemId: 101001, count: 3, expireTime: 10},
  {itemId: 300001, count: 7, expireTime: 0xFFFFFFFF},
  {itemId: 300011, count: 8, expireTime: 54321},
  {itemId: 400001, count: 9, expireTime: 11},
  {itemId: 1000001, count: 4, expireTime: 12345},
  {itemId: 300001, count: 99, expireTime: 88},
].map(item => Object.freeze(item)));

function fixture(protocol: string) {
  const packets: Buffer[] = [];
  const player: any = {
    Uid: 190707, ClientProtocol: protocol,
    _packetBuilder: new PacketBuilder('1'),
    _session: {Socket: {write: (packet: Buffer) => packets.push(Buffer.from(packet))}},
    SendPacket: PlayerInstance.prototype.SendPacket,
  };
  player.ItemManager = new ItemManager(player);
  // Listing has no persistence operation. Freeze the authoritative inventory to reject any mutation.
  player.ItemManager.ItemData = Object.freeze({ItemList: inventory});
  return {player, packets};
}

function decodeClientItems(packet: Buffer) {
  expect(packet.readUInt32BE(0)).toBe(packet.length);
  expect(packet.readUInt32BE(5)).toBe(2605);
  expect(packet.readInt32BE(13)).toBe(0);
  const count = packet.readUInt32BE(17);
  expect(packet.length).toBe(21 + count * 16);
  return Array.from({length: count}, (_, i) => {
    const offset = 21 + i * 16;
    // Actual SingleItemInfo client contract: ID, quantity, expiry, itemLevel.
    return {itemId: packet.readUInt32BE(offset), count: packet.readUInt32BE(offset + 4),
      expireTime: packet.readUInt32BE(offset + 8), itemLevel: packet.readUInt32BE(offset + 12)};
  });
}

async function request(protocol: string, range: number[], ids: number[]) {
  const {player, packets} = fixture(protocol);
  const before = JSON.stringify(player.ItemManager.ItemData.ItemList);
  const body = Buffer.alloc(12); range.forEach((value, i) => body.writeUInt32BE(value, i * 4));
  await new ItemListHandler().Handle({Player: player} as any, {} as any, body);
  expect(packets).toHaveLength(1);
  const items = decodeClientItems(packets[0]);
  expect(items.map(item => item.itemId)).toEqual(ids);
  for (const item of items) {
    const original = inventory.find(entry => entry.itemId === item.itemId)!;
    expect(item).toEqual({...original, itemLevel: 0});
    // Actual ItemXMLInfo.getSwfURL treats 0/1 as basic; >=2 adds _level.
    const icon = item.itemLevel === 0 || item.itemLevel === 1 ? `${item.itemId}.swf` : `${item.itemId}_${item.itemLevel}.swf`;
    expect(icon).toBe(`${item.itemId}.swf`);
    expect(icon).not.toMatch(/_[23]\.swf$/);
  }
  expect(JSON.stringify(player.ItemManager.ItemData.ItemList)).toBe(before);
}

describe('UAT-007 actual 2605 handler sends base icon level independently of requested category', () => {
  test.each(['kose', 'xin-20261013'])('%s collection formerly flag2 preserves capsule/potion/essence identity', async protocol => {
    await request(protocol, [300001, 500000, 1000001], [300001, 300011, 400001, 1000001]);
  });
  test.each(['kose', 'xin-20261013'])('%s supernono formerly flag3 preserves equipment and consumables', async protocol => {
    await request(protocol, [100001, 500000, 0], [100001, 101000, 101001, 300001, 300011, 400001]);
  });
  test.each(['kose', 'xin-20261013'])('%s ordinary equipment keeps base level0 and single-ID OR filtering', async protocol => {
    await request(protocol, [100001, 101000, 1000001], [100001, 101000, 1000001]);
  });
  test.each(['kose', 'xin-20261013'])('%s mapped 1300001 range retains exact 100001..101000 bounds', async protocol => {
    await request(protocol, [1300001, 1400000, 0], [100001, 101000]);
  });
  test.each(['kose', 'xin-20261013'])('%s all-range retains first duplicate and every stored quantity/expiry', async protocol => {
    await request(protocol, [0, 0, 0], [100001, 101000, 101001, 300001, 300011, 400001, 1000001]);
  });
  test.each(['kose', 'xin-20261013'])('%s unmatched range still returns an empty success packet', async protocol => {
    await request(protocol, [700001, 700100, 0], []);
  });
});
