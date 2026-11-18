import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2409 CATCH_MONSTER] 捕捉精灵请求
 */
export declare class CatchMonsterReqProto extends BaseProto {
    itemId: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): CatchMonsterReqProto;
}
//# sourceMappingURL=CatchMonsterReqProto.d.ts.map