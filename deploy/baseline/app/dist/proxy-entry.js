"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * ProxyServer服务独立入口
 */
const ProxyServer_1 = require("./ProxyServer");
const utils_1 = require("./shared/utils");
const config_1 = require("./shared/config");
// 初始化日志系统
utils_1.Logger.Initialize(config_1.Config.Logging.level);
const proxyServer = new ProxyServer_1.ProxyServer();
proxyServer.Start();
// 处理进程退出
process.on('SIGINT', () => {
    utils_1.Logger.Info('收到退出信号...');
    proxyServer.Stop();
    process.exit(0);
});
process.on('SIGTERM', () => {
    utils_1.Logger.Info('收到终止信号...');
    proxyServer.Stop();
    process.exit(0);
});
//# sourceMappingURL=proxy-entry.js.map