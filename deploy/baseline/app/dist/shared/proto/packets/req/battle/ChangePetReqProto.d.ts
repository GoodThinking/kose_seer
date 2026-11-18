import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2407 CHANGE_PET] 更换精灵请求
 */
export declare class ChangePetReqProto extends BaseProto {
    catchTime: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): ChangePetReqProto;
}
//# sourceMappingURL=ChangePetReqProto.d.ts.map