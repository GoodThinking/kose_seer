"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.abilityRouter = void 0;
const express_1 = require("express");
const AbilityController_1 = require("../controllers/AbilityController");
exports.abilityRouter = (0, express_1.Router)();
const abilityController = new AbilityController_1.AbilityController();
// 获取所有可用特性列表
exports.abilityRouter.get('/', abilityController.getAllAbilities);
// 获取指定精灵的特性
exports.abilityRouter.get('/:uid/:catchTime', abilityController.getPetAbility);
// 设置精灵特性（替换现有）
exports.abilityRouter.post('/:uid', abilityController.setAbility);
// 清除精灵特性
exports.abilityRouter.delete('/:uid', abilityController.clearAbility);
//# sourceMappingURL=ability.js.map