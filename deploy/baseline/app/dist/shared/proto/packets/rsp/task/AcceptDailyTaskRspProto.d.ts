import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2231 ACCEPT_DAILY_TASK] 接受每日任务响应
 *
 * 响应包体（Lua端实现：emptyResponse(2231, 4)）：
 * - 4字节的0（占位）
 *
 * 注意：Lua端使用通用空响应，返回4字节的0
 */
export declare class AcceptDailyTaskRspProto extends BaseProto {
    constructor();
    serialize(): Buffer;
    deserialize(_buffer: Buffer): void;
}
//# sourceMappingURL=AcceptDailyTaskRspProto.d.ts.map