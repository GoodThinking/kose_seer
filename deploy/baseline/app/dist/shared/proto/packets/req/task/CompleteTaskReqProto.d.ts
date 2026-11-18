import { BaseProto } from '../../../base/BaseProto';
/**
 * 完成任务请求
 * CMD 2202: COMPLETE_TASK
 */
export declare class CompleteTaskReqProto extends BaseProto {
    taskId: number;
    param: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=CompleteTaskReqProto.d.ts.map