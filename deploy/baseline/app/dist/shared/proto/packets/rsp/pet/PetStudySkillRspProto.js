"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetStudySkillRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2307] 精灵学习技能响应
 * 客户端不读取响应数据，只需要知道成功与否
 */
class PetStudySkillRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.PET_STUDY_SKILL);
    }
    serialize() {
        // 返回空buffer，客户端不需要数据
        return Buffer.alloc(0);
    }
}
exports.PetStudySkillRspProto = PetStudySkillRspProto;
//# sourceMappingURL=PetStudySkillRspProto.js.map