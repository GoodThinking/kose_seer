import { BaseProto } from '../../../base/BaseProto';
/**
 * 家具信息
 */
export interface IFitmentInfo {
    id: number;
    x: number;
    y: number;
    dir: number;
    status: number;
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
export declare class FitmentUseringRspProto extends BaseProto {
    ownerId: number;
    roomId: number;
    fitments: IFitmentInfo[];
    constructor();
    serialize(): Buffer;
    setOwner(ownerId: number, roomId: number): this;
    setFitments(fitments: IFitmentInfo[]): this;
}
//# sourceMappingURL=FitmentUseringRspProto.d.ts.map