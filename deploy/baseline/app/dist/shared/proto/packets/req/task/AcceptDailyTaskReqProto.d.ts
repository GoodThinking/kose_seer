import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2231 ACCEPT_DAILY_TASK] 接受每日任务请求
 *
 * 请求包体：
 * - taskId (4) - 每日任务ID
 */
export declare class AcceptDailyTaskReqProto extends BaseProto {
    taskId: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=AcceptDailyTaskReqProto.d.ts.map