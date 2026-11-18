import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 1002 SYSTEM_TIME] 系统时间响应
 */
export declare class SystemTimeRspProto extends BaseProto {
    timestamp: number;
    num: number;
    constructor();
    serialize(): Buffer;
    setTimestamp(timestamp: number): this;
}
//# sourceMappingURL=SystemTimeRspProto.d.ts.map