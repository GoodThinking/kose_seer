import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';

/**
 * 家具存储信息
 */
export interface IFitmentStorageInfo {
  id: number;        // 家具ID
  usedCount: number; // 已使用数量
  allCount: number;  // 总数量
}

/**
 * [CMD: 10007 FITMENT_ALL] 获取所有家具响应
 * 
 * 响应格式:
 * - count (uint32) - 家具种类数量
 * - 对于每个家具：
 *   - id (uint32) - 家具ID
 *   - usedCount (uint32) - 已使用数量
 *   - allCount (uint32) - 总数量
 */
export class FitmentAllRspProto extends BaseProto {
  private fitments: IFitmentStorageInfo[] = [];

  constructor() {
    super(CommandID.FITMENT_ALL);
  }

  public setFitments(fitments: IFitmentStorageInfo[]): void {
    this.fitments = fitments;
  }

  serialize(): Buffer {
    const buffers: Buffer[] = [];
    
    // count
    const countBuf = Buffer.allocUnsafe(4);
    countBuf.writeUInt32BE(this.fitments.length, 0);
    buffers.push(countBuf);
    
    // 家具列表
    for (const fitment of this.fitments) {
      const fitmentBuf = Buffer.allocUnsafe(12);
      fitmentBuf.writeUInt32BE(fitment.id, 0);
      fitmentBuf.writeUInt32BE(fitment.usedCount, 4);
      fitmentBuf.writeUInt32BE(fitment.allCount, 8);
      buffers.push(fitmentBuf);
    }
    
    return Buffer.concat(buffers);
  }
}
