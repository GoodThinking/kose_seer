import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 9025 GET_DIAMOND] 获取钻石数量响应
 * 响应: diamondCount(4)
 */
export declare class GetDiamondRspProto extends BaseProto {
    diamondCount: number;
    constructor();
    serialize(): Buffer;
    setDiamondCount(count: number): this;
}
//# sourceMappingURL=GetDiamondRspProto.d.ts.map