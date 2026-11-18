import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
export declare class PacketGetTaskBuf extends BaseProto {
    private _data;
    constructor(taskId: number, buffers: number[]);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketGetTaskBuf.d.ts.map