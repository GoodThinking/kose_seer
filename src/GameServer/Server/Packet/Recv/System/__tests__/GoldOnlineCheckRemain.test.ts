import { GoldOnlineCheckRemainHandler } from '../GoldOnlineCheckRemainHandler';
import { PlayerInstance } from '../../../../../Game/Player/PlayerInstance';
import { PacketBuilder } from '../../../../../../shared/protocol/PacketBuilder';

describe('1106 separate gold balance', () => {
  it.each(['kose', 'xin-20261013'])('%s encodes whole gold beans, including zero, independently of coins', async (protocol) => {
    const packets: Buffer[] = [];
    const player: any = {
      Uid: 71001, ClientProtocol: protocol,
      Data: { coins: 50020, gold: 1234 },
      _packetBuilder: new PacketBuilder('1'),
      _session: { Socket: { write: (packet: Buffer) => packets.push(packet) } },
      SendPacket: PlayerInstance.prototype.SendPacket,
    };
    const handler = new GoldOnlineCheckRemainHandler();
    for (const gold of [1234, 0]) {
      player.Data.gold = gold;
      await handler.Handle({ Player: player } as any, {} as any, Buffer.alloc(0));
      const packet = packets.at(-1)!;
      const length = protocol === 'kose' ? 25 : 21;
      expect(packet.length).toBe(length);
      expect(packet.readUInt32BE(0)).toBe(length);
      expect(packet.readUInt32BE(5)).toBe(1106);
      expect(packet.readUInt32BE(13)).toBe(0);
      expect(packet.readUInt32BE(17)).toBe(gold * 100);
      if (protocol === 'kose') expect(packet.readUInt32BE(21)).toBe(50020);
      expect(player.Data.coins).toBe(50020);
    }
    expect(packets).toHaveLength(2);
  });
});
