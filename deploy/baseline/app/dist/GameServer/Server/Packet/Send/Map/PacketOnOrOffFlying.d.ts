import { BaseProto } from '../../../../../shared/proto/base/BaseProto';
/**
 * 开关飞行模式响应包
 * CMD 1012
 */
export declare class PacketOnOrOffFlying extends BaseProto {
    private _data;
    constructor(userId: number, flyMode: number);
    serialize(): Buffer;
}
//# sourceMappingURL=PacketOnOrOffFlying.d.ts.map