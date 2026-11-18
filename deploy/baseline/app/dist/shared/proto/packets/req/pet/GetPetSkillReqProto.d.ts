import { BaseProto } from '../../../base/BaseProto';
/**
 * 获取精灵技能请求
 * CMD: 2336
 */
export declare class GetPetSkillReqProto extends BaseProto {
    catchTime: number;
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=GetPetSkillReqProto.d.ts.map