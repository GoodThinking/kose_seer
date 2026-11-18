import { BaseProto } from '../../../base/BaseProto';
/**
 * 开关飞行模式请求
 * CMD: 2112 ON_OR_OFF_FLYING
 */
export declare class OnOrOffFlyingReqProto extends BaseProto {
    flyMode: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=OnOrOffFlyingReqProto.d.ts.map