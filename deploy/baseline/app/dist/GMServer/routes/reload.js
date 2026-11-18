"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reloadRouter = void 0;
const express_1 = require("express");
const ConfigRegistry_1 = require("../../shared/config/ConfigRegistry");
const GameConfig_1 = require("../../shared/config/game/GameConfig");
const Logger_1 = require("../../shared/utils/Logger");
exports.reloadRouter = (0, express_1.Router)();
// 重载指定配置
exports.reloadRouter.post('/:type', async (req, res) => {
    try {
        const { type } = req.params;
        Logger_1.Logger.Info(`[ReloadRouter] 收到配置重载请求: ${type}`);
        // 重载配置
        await ConfigRegistry_1.ConfigRegistry.Instance.ReloadConfig(type);
        // 刷新 GameConfig 缓存
        GameConfig_1.GameConfig.ReloadAll();
        Logger_1.Logger.Info(`[ReloadRouter] 配置重载成功: ${type}`);
        res.json({
            success: true,
            message: `配置 ${type} 重载成功`,
            timestamp: Date.now()
        });
    }
    catch (error) {
        Logger_1.Logger.Error(`[ReloadRouter] 配置重载失败: ${req.params.type}`, error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// 重载所有配置
exports.reloadRouter.post('/', async (req, res) => {
    try {
        Logger_1.Logger.Info('[ReloadRouter] 收到全部配置重载请求');
        // 重新初始化所有配置
        await ConfigRegistry_1.ConfigRegistry.Instance.Initialize();
        // 刷新 GameConfig 缓存
        GameConfig_1.GameConfig.ReloadAll();
        Logger_1.Logger.Info('[ReloadRouter] 全部配置重载成功');
        res.json({
            success: true,
            message: '全部配置重载成功',
            timestamp: Date.now()
        });
    }
    catch (error) {
        Logger_1.Logger.Error('[ReloadRouter] 全部配置重载失败', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// 获取配置状态
exports.reloadRouter.get('/status', (req, res) => {
    try {
        const configs = ConfigRegistry_1.ConfigRegistry.Instance.GetAllConfigs();
        const status = Object.keys(configs).map(key => ({
            name: key,
            loaded: configs[key] !== null,
            itemCount: Array.isArray(configs[key]) ? configs[key].length :
                typeof configs[key] === 'object' ? Object.keys(configs[key]).length : 1
        }));
        res.json({
            success: true,
            data: status,
            timestamp: Date.now()
        });
    }
    catch (error) {
        Logger_1.Logger.Error('[ReloadRouter] 获取配置状态失败', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
//# sourceMappingURL=reload.js.map