"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * GameServer服务独立入口
 */
const GameServer_1 = require("./GameServer");
const utils_1 = require("./shared/utils");
const config_1 = require("./shared/config");
// 初始化日志系统
utils_1.Logger.Initialize(config_1.Config.Logging.level);
async function start() {
    // 加载战斗效果系统
    await Promise.resolve().then(() => __importStar(require('./GameServer/Game/Battle/effects')));
    utils_1.Logger.Info('[Startup] 战斗效果系统已加载');
    // 加载游戏配置
    const { SkillConfig, SkillEffectConfig } = await Promise.resolve().then(() => __importStar(require('./shared/config')));
    SkillConfig.Load();
    SkillEffectConfig.Load();
    const gameServer = new GameServer_1.GameServer();
    await gameServer.Start();
    // 处理进程退出
    process.on('SIGINT', async () => {
        utils_1.Logger.Info('收到退出信号...');
        await gameServer.Stop();
        process.exit(0);
    });
    process.on('SIGTERM', async () => {
        utils_1.Logger.Info('收到终止信号...');
        await gameServer.Stop();
        process.exit(0);
    });
}
start().catch((err) => {
    utils_1.Logger.Error('GameServer启动失败', err);
    process.exit(1);
});
//# sourceMappingURL=game-entry.js.map