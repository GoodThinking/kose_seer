"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logRouter = void 0;
const express_1 = require("express");
const LogController_1 = require("../controllers/LogController");
exports.logRouter = (0, express_1.Router)();
const logController = new LogController_1.LogController();
// 获取操作日志
exports.logRouter.get('/', logController.getLogs);
// 记录操作日志
exports.logRouter.post('/', logController.addLog);
//# sourceMappingURL=log.js.map