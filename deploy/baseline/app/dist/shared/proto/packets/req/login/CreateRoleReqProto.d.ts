import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: CREATE_ROLE (108)] 创建角色请求
 * 请求: userID(4) + nickname(16) + color(4) = 24字节
 */
export declare class CreateRoleReqProto extends BaseProto {
    userID: number;
    nickname: string;
    color: number;
    constructor();
    serialize(): Buffer;
    /**
     * 从Buffer快速解析
     */
    static fromBuffer(buffer: Buffer): CreateRoleReqProto;
}
//# sourceMappingURL=CreateRoleReqProto.d.ts.map