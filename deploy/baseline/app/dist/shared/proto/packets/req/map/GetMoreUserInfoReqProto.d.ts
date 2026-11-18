import { BaseProto } from '../../../base/BaseProto';
/**
 * 获取详细用户信息请求
 * CMD: 2052 GET_MORE_USERINFO
 */
export declare class GetMoreUserInfoReqProto extends BaseProto {
    targetId: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=GetMoreUserInfoReqProto.d.ts.map