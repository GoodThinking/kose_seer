import { Router } from 'express';
import { PlayerController } from '../controllers/PlayerController';
import { whitelistMiddleware } from '../middleware/auth';

export const playerRouter = Router();
const playerController = new PlayerController();

// 玩家列表
playerRouter.get('/', playerController.getPlayers);

// 玩家详情
playerRouter.get('/:uid', playerController.getPlayerDetail);

// 修改玩家数据
playerRouter.patch('/:uid', playerController.updatePlayer);

// 修改账号信息（邮箱、密码）- 需要白名单权限
playerRouter.patch('/:uid/account', whitelistMiddleware('ban'), playerController.updateAccount);

// 封禁/解封玩家（需要白名单）
playerRouter.post('/:uid/ban', whitelistMiddleware('ban'), playerController.banPlayer);

// 踢出玩家（需要白名单）
playerRouter.post('/:uid/kick', whitelistMiddleware('ban'), playerController.kickPlayer);
