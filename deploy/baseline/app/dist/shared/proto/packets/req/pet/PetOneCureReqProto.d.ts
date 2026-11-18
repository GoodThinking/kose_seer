import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2310 PET_ONE_CURE] 恢复单个精灵HP请求
 */
export declare class PetOneCureReqProto extends BaseProto {
    catchTime: number;
    coins: number;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=PetOneCureReqProto.d.ts.map