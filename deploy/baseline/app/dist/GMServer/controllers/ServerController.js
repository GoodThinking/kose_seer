"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerController = void 0;
const ServerService_1 = require("../services/ServerService");
const Logger_1 = require("../../shared/utils/Logger");
/**
 * 服务器管理控制器
 */
class ServerController {
    serverService;
    constructor() {
        this.serverService = new ServerService_1.ServerService();
    }
    /**
     * 获取服务器状态
     */
    getStatus = async (req, res) => {
        try {
            const status = await this.serverService.getServerStatus();
            res.json({ success: true, data: status });
        }
        catch (error) {
            Logger_1.Logger.Error('[ServerController] 获取服务器状态失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 全服公告
     */
    sendAnnouncement = async (req, res) => {
        try {
            const { message, type } = req.body;
            await this.serverService.sendAnnouncement(message, type);
            res.json({ success: true, message: '公告发送成功' });
        }
        catch (error) {
            Logger_1.Logger.Error('[ServerController] 发送公告失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 服务器维护
     */
    maintenance = async (req, res) => {
        try {
            const { enabled, message } = req.body;
            await this.serverService.setMaintenance(enabled, message);
            res.json({ success: true, message: enabled ? '维护模式已开启' : '维护模式已关闭' });
        }
        catch (error) {
            Logger_1.Logger.Error('[ServerController] 设置维护模式失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.ServerController = ServerController;
//# sourceMappingURL=ServerController.js.map