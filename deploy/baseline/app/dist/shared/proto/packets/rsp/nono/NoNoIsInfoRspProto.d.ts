import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 9027 NONO_IS_INFO] NoNo是否有信息响应
 * 响应: hasNono(4) - 1=有NoNo, 0=无NoNo
 */
export declare class NoNoIsInfoRspProto extends BaseProto {
    hasNono: number;
    constructor();
    serialize(): Buffer;
    setHasNono(hasNono: number): this;
}
//# sourceMappingURL=NoNoIsInfoRspProto.d.ts.map