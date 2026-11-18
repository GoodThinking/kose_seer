"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serverRouter = void 0;
const express_1 = require("express");
const ServerController_1 = require("../controllers/ServerController");
exports.serverRouter = (0, express_1.Router)();
const serverController = new ServerController_1.ServerController();
// 获取服务器状态
exports.serverRouter.get('/status', serverController.getStatus);
// 全服公告
exports.serverRouter.post('/announcement', serverController.sendAnnouncement);
// 维护模式
exports.serverRouter.post('/maintenance', serverController.maintenance);
//# sourceMappingURL=server.js.map