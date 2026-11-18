"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playerRouter = void 0;
const express_1 = require("express");
const PlayerController_1 = require("../controllers/PlayerController");
const auth_1 = require("../middleware/auth");
exports.playerRouter = (0, express_1.Router)();
const playerController = new PlayerController_1.PlayerController();
// 玩家列表
exports.playerRouter.get('/', playerController.getPlayers);
// 玩家详情
exports.playerRouter.get('/:uid', playerController.getPlayerDetail);
// 修改玩家数据
exports.playerRouter.patch('/:uid', playerController.updatePlayer);
// 修改账号信息（邮箱、密码）- 需要白名单权限
exports.playerRouter.patch('/:uid/account', (0, auth_1.whitelistMiddleware)('ban'), playerController.updateAccount);
// 封禁/解封玩家（需要白名单）
exports.playerRouter.post('/:uid/ban', (0, auth_1.whitelistMiddleware)('ban'), playerController.banPlayer);
// 踢出玩家（需要白名单）
exports.playerRouter.post('/:uid/kick', (0, auth_1.whitelistMiddleware)('ban'), playerController.kickPlayer);
//# sourceMappingURL=player.js.map