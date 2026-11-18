import { BaseProto } from '../../../../shared/proto/base/BaseProto';
/**
 * 通用空响应包
 * 用于只返回 result 的简单命令
 */
export declare class PacketEmpty extends BaseProto {
    private _data;
    constructor(cmdId: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketEmpty.d.ts.map