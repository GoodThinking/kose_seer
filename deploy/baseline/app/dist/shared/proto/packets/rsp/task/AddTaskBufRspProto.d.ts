import { BaseProto } from '../../../base/BaseProto';
/**
 * 添加/更新任务缓存响应
 * CMD 2204: ADD_TASK_BUF
 *
 * 响应格式：空（成功时）
 */
export declare class AddTaskBufRspProto extends BaseProto {
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
}
//# sourceMappingURL=AddTaskBufRspProto.d.ts.map