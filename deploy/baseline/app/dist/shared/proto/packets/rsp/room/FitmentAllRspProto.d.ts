import { BaseProto } from '../../../base/BaseProto';
/**
 * 家具存储信息
 */
export interface IFitmentStorageInfo {
    id: number;
    usedCount: number;
    allCount: number;
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
export declare class FitmentAllRspProto extends BaseProto {
    private fitments;
    constructor();
    setFitments(fitments: IFitmentStorageInfo[]): void;
    serialize(): Buffer;
}
//# sourceMappingURL=FitmentAllRspProto.d.ts.map