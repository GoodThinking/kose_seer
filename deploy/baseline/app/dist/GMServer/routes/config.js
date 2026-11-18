"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configRouter = void 0;
const express_1 = require("express");
const ConfigController_1 = require("../controllers/ConfigController");
exports.configRouter = (0, express_1.Router)();
const configController = new ConfigController_1.ConfigController();
// 获取配置元数据
exports.configRouter.get('/metadata', configController.getMetadata);
// 获取精灵名字映射
exports.configRouter.get('/pet-names', configController.getPetNames);
// 获取物品名字映射
exports.configRouter.get('/item-names', configController.getItemNames);
// 获取任务名字映射
exports.configRouter.get('/task-names', configController.getTaskNames);
// 获取技能名字映射
exports.configRouter.get('/skill-names', configController.getSkillNames);
// 获取性格列表
exports.configRouter.get('/natures', configController.getNatures);
// 搜索精灵选项（分页）
exports.configRouter.get('/search/pets', configController.searchPets);
// 搜索物品选项（分页）
exports.configRouter.get('/search/items', configController.searchItems);
// 搜索技能选项（分页）
exports.configRouter.get('/search/skills', configController.searchSkills);
// 搜索指定精灵的技能选项（分页）
exports.configRouter.get('/search/pet-skills/:petId', configController.searchPetSkills);
// 搜索特性选项（分页）
exports.configRouter.get('/search/abilities', configController.searchAbilities);
// 获取配置数据
exports.configRouter.get('/:type', configController.getConfig);
// 保存配置数据
exports.configRouter.post('/:type', configController.saveConfig);
// 重载配置
exports.configRouter.post('/:type/reload', configController.reloadConfig);
// 获取下拉选项
exports.configRouter.get('/options/:type', configController.getOptions);
//# sourceMappingURL=config.js.map