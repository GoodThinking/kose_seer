import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { ClientProtocol } from '../../../../protocol/ClientProtocol';

/**
 * 获取任务缓存响应
 * CMD 2203: GET_TASK_BUF
 * 
 * 响应格式：taskId(4) + flag(4) + 20字节任务缓存
 */
export class GetTaskBufRspProto extends BaseProto {
  public taskId: number = 0;
  public flag: number = 1;  // 1 表示有缓存数据
  public buffers: number[] = [0, 0, 0, 0, 0];
  /** XIN 客户端读取 taskId/flag 后将余下内容作为不透明 ByteArray。 */
  public rawBuffer?: Buffer;

  constructor() {
    super(CommandID.GET_TASK_BUF);
  }

  public serialize(protocol: ClientProtocol = 'kose'): Buffer {
    if (protocol === 'xin-20261013') {
      const rawBuffer = this.rawBuffer ?? Buffer.alloc(100);
      if (rawBuffer.length !== 100) throw new Error('XIN task buffer must contain 100 bytes');
      const buffer = Buffer.alloc(8 + rawBuffer.length);
      buffer.writeUInt32BE(this.taskId, 0);
      buffer.writeUInt32BE(this.flag, 4);
      rawBuffer.copy(buffer, 8);
      return buffer;
    }

    const buffer = Buffer.alloc(28); // taskId(4) + flag(4) + 5*4(20)

    let offset = 0;
    buffer.writeUInt32BE(this.taskId, offset);
    offset += 4;
    buffer.writeUInt32BE(this.flag, offset);
    offset += 4;

    if (this.taskId === 94 || this.taskId === 96) {
      this.buffers.forEach((value, i) => {
        if (i >= 20 || !Number.isInteger(value) || value < 0 || value > 255) {
          throw new Error(`Invalid KOSE task ${this.taskId} progress byte`);
        }
        buffer.writeUInt8(value, offset + i);
      });
      return buffer;
    }

    for (let i = 0; i < 5; i++) {
      buffer.writeUInt32BE(this.buffers[i] || 0, offset);
      offset += 4;
    }

    return buffer;
  }

  public deserialize(buffer: Buffer): void {
    let offset = 0;
    if (buffer.length >= 4) {
      this.taskId = buffer.readUInt32BE(offset);
      offset += 4;
    }
    if (buffer.length >= 8) {
      this.flag = buffer.readUInt32BE(offset);
      offset += 4;
    }
    if (buffer.length === 108) {
      this.rawBuffer = Buffer.from(buffer.subarray(offset));
      return;
    }
    if (buffer.length === 28 && (this.taskId === 94 || this.taskId === 96)) {
      this.buffers = Array.from(buffer.subarray(offset));
      return;
    }
    if (buffer.length >= 28) {
      this.buffers = [];
      for (let i = 0; i < 5; i++) {
        this.buffers.push(buffer.readUInt32BE(offset));
        offset += 4;
      }
    }
  }

  public setTaskId(taskId: number): this {
    this.taskId = taskId;
    return this;
  }

  public setBuffers(buffers: number[]): this {
    const length = this.taskId === 94 || this.taskId === 96 ? 20 : 5;
    this.buffers = buffers.slice(0, length);
    while (this.buffers.length < length) {
      this.buffers.push(0);
    }
    return this;
  }
}
