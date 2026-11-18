import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 9001 NONO_OPEN] 开启NoNo
 * 请求: 无参数
 */
export declare class NoNoOpenReqProto extends BaseProto {
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): NoNoOpenReqProto;
}
//# sourceMappingURL=NoNoOpenReqProto.d.ts.map