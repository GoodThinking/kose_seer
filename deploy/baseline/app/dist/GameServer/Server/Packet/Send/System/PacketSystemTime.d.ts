import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 系统时间响应包
 * CMD 1002
 */
export declare class PacketSystemTime extends BaseProto {
    private _data;
    constructor(timestamp: number, num?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketSystemTime.d.ts.map