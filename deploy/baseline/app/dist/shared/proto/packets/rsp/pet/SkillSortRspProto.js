"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SkillSortRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2328 Skill_Sort] 技能排序响应
 *
 * 响应格式：空包（只有result）
 */
class SkillSortRspProto extends BaseProto_1.BaseProto {
    constructor() {
        super(CommandID_1.CommandID.Skill_Sort);
    }
    serialize() {
        return Buffer.alloc(0);
    }
}
exports.SkillSortRspProto = SkillSortRspProto;
//# sourceMappingURL=SkillSortRspProto.js.map