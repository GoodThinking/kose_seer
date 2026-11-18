import { BaseProto } from '../../../base/BaseProto';
/**
 * 获取任务缓存响应
 * CMD 2203: GET_TASK_BUF
 *
 * 响应格式：taskId(4) + flag(4) + buf[0..4] (5个4字节 = 20字节缓存)
 */
export declare class GetTaskBufRspProto extends BaseProto {
    taskId: number;
    flag: number;
    buffers: number[];
    constructor();
    serialize(): Buffer;
    deserialize(buffer: Buffer): void;
    setTaskId(taskId: number): this;
    setBuffers(buffers: number[]): this;
}
//# sourceMappingURL=GetTaskBufRspProto.d.ts.map