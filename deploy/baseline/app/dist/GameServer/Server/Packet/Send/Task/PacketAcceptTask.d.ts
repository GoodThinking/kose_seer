import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 接受任务响应包
 * CMD 2201: ACCEPT_TASK
 */
export declare class PacketAcceptTask extends BaseProto {
    private _data;
    constructor(taskId: number, result?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketAcceptTask.d.ts.map