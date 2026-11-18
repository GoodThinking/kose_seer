import { Router } from 'express';
import { AbilityController } from '../controllers/AbilityController';

export const abilityRouter = Router();
const abilityController = new AbilityController();

// 获取所有可用特性列表
abilityRouter.get('/', abilityController.getAllAbilities);

// 获取指定精灵的特性
abilityRouter.get('/:uid/:catchTime', abilityController.getPetAbility);

// 设置精灵特性（替换现有）
abilityRouter.post('/:uid', abilityController.setAbility);

// 清除精灵特性
abilityRouter.delete('/:uid', abilityController.clearAbility);
