import { BaseProto } from '../../../base/BaseProto';
/**
 * 添加/更新任务缓存请求
 * CMD 2204: ADD_TASK_BUF
 *
 * 请求格式：taskId(4) + index(1) + value(4)
 */
export declare class AddTaskBufReqProto extends BaseProto {
    taskId: number;
    bufferIndex: number;
    bufferValue: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=AddTaskBufReqProto.d.ts.map