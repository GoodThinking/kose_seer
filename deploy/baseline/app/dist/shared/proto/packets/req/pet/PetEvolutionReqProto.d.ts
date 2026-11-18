import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2314 PET_EVOLVTION] 精灵进化请求
 *
 * 请求格式: catchTime(4) + evolveIndex(4)
 */
export declare class PetEvolutionReqProto extends BaseProto {
    catchTime: number;
    evolveIndex: number;
    constructor();
    serialize(): Buffer;
    static fromBuffer(buffer: Buffer): PetEvolutionReqProto;
}
//# sourceMappingURL=PetEvolutionReqProto.d.ts.map