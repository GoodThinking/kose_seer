import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: OPEN_SUPER_NONO (80001)] 开启超级NoNo响应
 *
 * Response Body:
 * - success (uint32): 是否成功 (0=成功, 1=失败)
 */
export declare class OpenSuperNonoRspProto extends BaseProto {
    success: number;
    constructor(success?: number);
    serialize(): Buffer;
}
//# sourceMappingURL=OpenSuperNonoRspProto.d.ts.map