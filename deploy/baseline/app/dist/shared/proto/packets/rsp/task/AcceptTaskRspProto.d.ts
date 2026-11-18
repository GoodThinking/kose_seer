import { BaseProto } from '../../../base/BaseProto';
/**
 * 接受任务响应
 * CMD 2201: ACCEPT_TASK
 */
export declare class AcceptTaskRspProto extends BaseProto {
    taskId: number;
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
    setTaskId(taskId: number): this;
}
//# sourceMappingURL=AcceptTaskRspProto.d.ts.map