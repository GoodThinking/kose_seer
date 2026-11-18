import { BaseProto } from '../../../base/BaseProto';
/**
 * 接受任务请求
 * CMD 2201: ACCEPT_TASK
 */
export declare class AcceptTaskReqProto extends BaseProto {
    taskId: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=AcceptTaskReqProto.d.ts.map