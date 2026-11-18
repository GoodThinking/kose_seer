import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2410 ESCAPE_FIGHT] 逃跑响应
 */
export declare class EscapeFightRspProto extends BaseProto {
    success: number;
    constructor();
    serialize(): Buffer;
    setSuccess(value: number): this;
}
//# sourceMappingURL=EscapeFightRspProto.d.ts.map