import { BaseProto } from '../../../base/BaseProto';
/**
 * 获取任务缓存请求
 * CMD 2203: GET_TASK_BUF
 */
export declare class GetTaskBufReqProto extends BaseProto {
    taskId: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=GetTaskBufReqProto.d.ts.map