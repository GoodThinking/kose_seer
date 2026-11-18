import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 家具信息
 */
export interface IFitmentInfo {
  id: number;      // 家具ID
  x: number;       // X坐标
  y: number;       // Y坐标
  dir: number;     // 方向
  status: number;  // 状态
}

/**
 * [CMD: 10006 FITMENT_USERING] 使用家具响应
 * 
 * 响应格式:
 * - ownerId: uint32 (房主ID)
 * - roomId: uint32 (房间ID)
 * - count: uint32 (家具数量)
 * - fitments: IFitmentInfo[] (家具列表)
 */
export class FitmentUseringRspProto extends BaseProto {
  ownerId: number = 0;
  roomId: number = 0;
  fitments: IFitmentInfo[] = [];

  constructor() {
    super(CommandID.FITMENT_USERING);
  }

  serialize(): Buffer {
    const bufferSize = 12 + this.fitments.length * 20;
    const buffer = Buffer.alloc(bufferSize);
    let offset = 0;

    // 写入房主ID
    buffer.writeUInt32BE(this.ownerId, offset);
    offset += 4;

    // 写入房间ID
    buffer.writeUInt32BE(this.roomId, offset);
    offset += 4;

    // 写入家具数量
    buffer.writeUInt32BE(this.fitments.length, offset);
    offset += 4;

    // 写入家具列表
    for (const fitment of this.fitments) {
      buffer.writeUInt32BE(fitment.id, offset);
      offset += 4;
      buffer.writeUInt32BE(fitment.x, offset);
      offset += 4;
      buffer.writeUInt32BE(fitment.y, offset);
      offset += 4;
      buffer.writeUInt32BE(fitment.dir, offset);
      offset += 4;
      buffer.writeUInt32BE(fitment.status, offset);
      offset += 4;
    }

    return buffer;
  }

  setOwner(ownerId: number, roomId: number): this {
    this.ownerId = ownerId;
    this.roomId = roomId;
    return this;
  }

  setFitments(fitments: IFitmentInfo[]): this {
    this.fitments = fitments;
    return this;
  }
}
