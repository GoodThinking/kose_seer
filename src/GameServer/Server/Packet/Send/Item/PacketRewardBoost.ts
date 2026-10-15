import { BaseProto } from '../../../../../shared/proto/base/BaseProto';

/** Fixed Nieo private extension: ordered uint32 words, big endian. */
export class PacketRewardBoost extends BaseProto {
  private readonly data: Buffer;
  constructor(command: number, words: readonly number[]) {
    super(command);
    this.data = Buffer.alloc(words.length * 4);
    words.forEach((value, index) => this.data.writeUInt32BE(value, index * 4));
  }
  public serialize(): Buffer { return this.data; }
}
