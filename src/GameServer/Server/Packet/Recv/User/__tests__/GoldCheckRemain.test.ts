import { GoldCheckRemainHandler } from '../GoldCheckRemainHandler';
import { PlayerInstance } from '../../../../../Game/Player/PlayerInstance';
import { PacketBuilder } from '../../../../../../shared/protocol/PacketBuilder';

function fixture(protocol: string, data: object) {
  const packets: Buffer[] = [];
  const player: any = {
    Uid: 870023, ClientProtocol: protocol, Data: data,
    _packetBuilder: new PacketBuilder('1'),
    _session: { Socket: { write: (packet: Buffer) => packets.push(Buffer.from(packet)) } },
    SendPacket: PlayerInstance.prototype.SendPacket,
  };
  return { player, packets, handler: new GoldCheckRemainHandler() };
}

describe('1105 independent whole-bean account encoded as hundredths', () => {
  it.each(['kose', 'xin-20261013'].flatMap(protocol =>
    [0, 1234, Math.floor(0xFFFFFFFF / 100)].map(gold => ({ protocol, gold }))
  ))('$protocol encodes gold=$gold without changing balances', async ({ protocol, gold }) => {
    const data = Object.freeze({ userID: 870023, coins: 50020, gold });
    const { player, packets, handler } = fixture(protocol, data);
    await handler.Handle({ Player: player } as any, {} as any, Buffer.alloc(0));
    expect(packets).toHaveLength(1);
    const packet = packets[0];
    expect(packet.length).toBe(21);
    expect(packet.readUInt32BE(0)).toBe(21);
    expect(packet.readUInt32BE(5)).toBe(1105);
    expect(packet.readUInt32BE(9)).toBe(870023);
    expect(packet.readUInt32BE(13)).toBe(0);
    expect(packet.readUInt32BE(17)).toBe(gold * 100);
    expect(player.Data).toEqual({ userID: 870023, coins: 50020, gold });
  });

  it.each(['kose', 'xin-20261013'])('%s never reads coins and follows only changing gold', async protocol => {
    let gold = 1234;
    const data = {
      userID: 870023,
      get gold() { return gold; },
      get coins(): number { throw new Error('1105 must not read coins'); },
    };
    const { player, packets, handler } = fixture(protocol, data);
    for (const balance of [1234, 0, 5678]) {
      gold = balance;
      await handler.Handle({ Player: player } as any, {} as any, Buffer.alloc(0));
    }
    expect(packets.map(packet => packet.readUInt32BE(17))).toEqual([123400, 0, 567800]);
  });

  it('ignores a session without a player', async () => {
    await expect(new GoldCheckRemainHandler().Handle({} as any, {} as any, Buffer.alloc(0))).resolves.toBeUndefined();
  });
});
