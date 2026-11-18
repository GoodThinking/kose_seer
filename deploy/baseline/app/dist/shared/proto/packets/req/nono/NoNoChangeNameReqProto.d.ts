import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 9002 NONO_CHANGE_NAME] 修改NoNo昵称
 * 请求: newName(16 bytes)
 */
export declare class NoNoChangeNameReqProto extends BaseProto {
    newName: string;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): NoNoChangeNameReqProto;
}
//# sourceMappingURL=NoNoChangeNameReqProto.d.ts.map