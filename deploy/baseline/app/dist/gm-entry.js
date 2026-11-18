"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const GMServer_1 = require("./GMServer/GMServer");
const Logger_1 = require("./shared/utils/Logger");
const config_1 = require("./shared/config");
const ConfigRegistry_1 = require("./shared/config/ConfigRegistry");
const ConfigDefinitions_1 = require("./shared/config/ConfigDefinitions");
const DatabaseManager_1 = require("./DataBase/DatabaseManager");
// 初始化日志系统
Logger_1.Logger.Initialize(config_1.Config.Logging.level);
async function main() {
    try {
        Logger_1.Logger.Info('[GM Entry] ========================================');
        Logger_1.Logger.Info('[GM Entry] 启动 GM Server（独立模式）');
        Logger_1.Logger.Info('[GM Entry] ========================================');
        // 1. 加载游戏配置（GM 需要访问游戏数据）
        Logger_1.Logger.Info('[GM Entry] 加载游戏配置...');
        ConfigRegistry_1.ConfigRegistry.Instance.RegisterBatch((0, ConfigDefinitions_1.GetGameConfigRegistrations)());
        await ConfigRegistry_1.ConfigRegistry.Instance.Initialize();
        Logger_1.Logger.Info('[GM Entry] 游戏配置加载完成');
        // 2. 初始化数据库
        Logger_1.Logger.Info('[GM Entry] 初始化数据库...');
        await DatabaseManager_1.DatabaseManager.Instance.Initialize();
        Logger_1.Logger.Info('[GM Entry] 数据库初始化完成');
        // 3. 启动 GM Server
        Logger_1.Logger.Info('[GM Entry] 启动 GM HTTP 服务...');
        const gmServer = new GMServer_1.GMServer();
        gmServer.start();
        Logger_1.Logger.Info('[GM Entry] ========================================');
        Logger_1.Logger.Info('[GM Entry] GM Server 启动成功');
        Logger_1.Logger.Info('[GM Entry] ========================================');
    }
    catch (error) {
        Logger_1.Logger.Error('[GM Entry] GM Server 启动失败', error);
        process.exit(1);
    }
}
// 优雅退出处理
process.on('SIGINT', async () => {
    Logger_1.Logger.Info('[GM Entry] 收到 SIGINT 信号，正在关闭...');
    await DatabaseManager_1.DatabaseManager.Instance.Shutdown();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    Logger_1.Logger.Info('[GM Entry] 收到 SIGTERM 信号，正在关闭...');
    await DatabaseManager_1.DatabaseManager.Instance.Shutdown();
    process.exit(0);
});
main();
//# sourceMappingURL=gm-entry.js.map