import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2409 CATCH_MONSTER] 捕捉精灵响应
 */
export declare class CatchMonsterRspProto extends BaseProto {
    catchTime: number;
    petId: number;
    constructor();
    serialize(): Buffer;
    setCatchTime(value: number): this;
    setPetId(value: number): this;
}
//# sourceMappingURL=CatchMonsterRspProto.d.ts.map