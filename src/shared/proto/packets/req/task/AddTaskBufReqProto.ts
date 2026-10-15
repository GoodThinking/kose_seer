import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 添加/更新任务缓存请求
 * CMD 2204: ADD_TASK_BUF
 * 
 * 请求格式：taskId(4) + 旧KOSE index(1)/value(4)，或 fixed Nieo/XIN 完整缓存
 */
export class AddTaskBufReqProto extends BaseProto {
  public taskId: number = 0;
  public bufferIndex: number = 0;
  public bufferValue: number = 0;
  /** taskId 之后的原始任务缓存，由协议处理器按客户端类型解释。 */
  public rawBuffer: Buffer = Buffer.alloc(0);

  constructor() {
    super(CommandID.ADD_TASK_BUF);
  }

  public deserialize(buffer: Buffer): void {
    if (buffer.length >= 4) {
      this.taskId = buffer.readUInt32BE(0);
      this.rawBuffer = Buffer.from(buffer.subarray(4));
    }

    let offset = 0;
    if (buffer.length >= 4) {
      this.taskId = buffer.readUInt32BE(offset);
      offset += 4;
    }
    if (buffer.length >= 5) {
      this.bufferIndex = buffer.readUInt8(offset);
      offset += 1;
    }
    if (buffer.length >= 9) {
      this.bufferValue = buffer.readUInt32BE(offset);
    }
  }

  public serialize(): Buffer {
    return Buffer.alloc(0);
  }
}
