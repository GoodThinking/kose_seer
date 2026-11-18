"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LogController = void 0;
const LogService_1 = require("../services/LogService");
const Logger_1 = require("../../shared/utils/Logger");
/**
 * 日志管理控制器
 */
class LogController {
    logService;
    constructor() {
        this.logService = new LogService_1.LogService();
    }
    /**
     * 获取操作日志
     */
    getLogs = async (req, res) => {
        try {
            const { page = 1, limit = 50, type, uid } = req.query;
            const logs = await this.logService.getLogs(Number(page), Number(limit), type, uid ? Number(uid) : undefined);
            res.json({ success: true, data: logs });
        }
        catch (error) {
            Logger_1.Logger.Error('[LogController] 获取日志失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 记录操作日志
     */
    addLog = async (req, res) => {
        try {
            const { type, uid, operator, action, details } = req.body;
            await this.logService.addLog(type, uid, operator, action, details);
            res.json({ success: true, message: '日志记录成功' });
        }
        catch (error) {
            Logger_1.Logger.Error('[LogController] 记录日志失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.LogController = LogController;
//# sourceMappingURL=LogController.js.map