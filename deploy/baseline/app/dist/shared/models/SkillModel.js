"use strict";
/**
 * 技能数据模型
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElementType = exports.SkillCategory = void 0;
exports.createDefaultSkill = createDefaultSkill;
/**
 * 创建默认技能
 */
function createDefaultSkill(skillId) {
    return {
        skillId,
        pp: 20,
        maxPP: 20
    };
}
/**
 * 技能类别枚举
 *
 * 注意：XML中的Category值：
 * - 1 = 物理攻击
 * - 2 = 特殊攻击
 * - 4 = 变化技能（STATUS）
 */
var SkillCategory;
(function (SkillCategory) {
    SkillCategory[SkillCategory["PHYSICAL"] = 1] = "PHYSICAL";
    SkillCategory[SkillCategory["SPECIAL"] = 2] = "SPECIAL";
    SkillCategory[SkillCategory["STATUS"] = 4] = "STATUS"; // 变化（XML中为4，不是3）
})(SkillCategory || (exports.SkillCategory = SkillCategory = {}));
/**
 * 属性类型枚举
 */
var ElementType;
(function (ElementType) {
    ElementType[ElementType["NORMAL"] = 0] = "NORMAL";
    ElementType[ElementType["FIRE"] = 1] = "FIRE";
    ElementType[ElementType["WATER"] = 2] = "WATER";
    ElementType[ElementType["GRASS"] = 3] = "GRASS";
    ElementType[ElementType["ELECTRIC"] = 4] = "ELECTRIC";
    ElementType[ElementType["ICE"] = 5] = "ICE";
    ElementType[ElementType["FIGHTING"] = 6] = "FIGHTING";
    ElementType[ElementType["POISON"] = 7] = "POISON";
    ElementType[ElementType["GROUND"] = 8] = "GROUND";
    ElementType[ElementType["FLYING"] = 9] = "FLYING";
    ElementType[ElementType["PSYCHIC"] = 10] = "PSYCHIC";
    ElementType[ElementType["BUG"] = 11] = "BUG";
    ElementType[ElementType["ROCK"] = 12] = "ROCK";
    ElementType[ElementType["GHOST"] = 13] = "GHOST";
    ElementType[ElementType["DRAGON"] = 14] = "DRAGON";
    ElementType[ElementType["DARK"] = 15] = "DARK";
    ElementType[ElementType["STEEL"] = 16] = "STEEL";
    ElementType[ElementType["LIGHT"] = 17] = "LIGHT"; // 光
})(ElementType || (exports.ElementType = ElementType = {}));
//# sourceMappingURL=SkillModel.js.map