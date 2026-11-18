import { BaseProto } from '../../../base/BaseProto';
/**
 * 获取兑换信息响应
 * CMD 70001: GET_EXCHANGE_INFO
 *
 * 响应格式：
 * - honorValue (4 bytes): 荣誉值
 */
export declare class GetExchangeInfoRspProto extends BaseProto {
    private honorValue;
    constructor(honorValue?: number);
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
}
//# sourceMappingURL=GetExchangeInfoRspProto.d.ts.map