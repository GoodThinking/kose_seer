import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 获取兑换信息响应包
 * CMD 70001: GET_EXCHANGE_INFO
 */
export declare class PacketGetExchangeInfo extends BaseProto {
    private _data;
    constructor(honorValue: number, result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGetExchangeInfo.d.ts.map