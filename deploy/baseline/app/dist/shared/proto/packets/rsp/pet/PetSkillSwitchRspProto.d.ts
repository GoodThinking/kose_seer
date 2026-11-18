import { BaseProto } from '../../../base/BaseProto';
/**
 * [CMD: 2312] 精灵技能切换响应
 */
export declare class PetSkillSwitchRspProto extends BaseProto {
    petId: number;
    constructor();
    serialize(): Buffer;
    setPetId(value: number): this;
}
//# sourceMappingURL=PetSkillSwitchRspProto.d.ts.map