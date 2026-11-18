import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2310 PET_ONE_CURE] 恢复单个精灵HP响应
 *
 * 客户端只需要 catchTime，会在本地更新精灵HP和PP
 */
export declare class PetOneCureRspProto extends BaseProto {
    private _catchTime;
    constructor();
    setCatchTime(catchTime: number): this;
    serialize(): Buffer;
}
//# sourceMappingURL=PetOneCureRspProto.d.ts.map