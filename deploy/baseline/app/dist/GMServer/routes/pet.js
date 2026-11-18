"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.petRouter = void 0;
const express_1 = require("express");
const PetController_1 = require("../controllers/PetController");
exports.petRouter = (0, express_1.Router)();
const petController = new PetController_1.PetController();
// 获取玩家精灵列表
exports.petRouter.get('/:uid', petController.getPlayerPets);
// 发送精灵
exports.petRouter.post('/:uid', petController.givePet);
// 修改精灵属性
exports.petRouter.patch('/:uid', petController.updatePet);
// 删除精灵
exports.petRouter.delete('/:uid', petController.removePet);
// 治疗精灵
exports.petRouter.post('/:uid/cure', petController.curePet);
// 治疗所有精灵
exports.petRouter.post('/:uid/cure-all', petController.cureAllPets);
// 设置精灵等级
exports.petRouter.post('/:uid/level', petController.setPetLevel);
//# sourceMappingURL=pet.js.map