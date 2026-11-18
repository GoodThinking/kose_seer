import { BaseProto } from '../../../base/BaseProto';
/**
 * 获取简单用户信息请求
 * CMD: 2051 GET_SIM_USERINFO
 */
export declare class GetSimUserInfoReqProto extends BaseProto {
    targetId: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=GetSimUserInfoReqProto.d.ts.map