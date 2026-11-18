"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GMServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const routes_1 = require("./routes");
const Logger_1 = require("../shared/utils/Logger");
const ServerConfig_1 = require("../shared/config/ServerConfig");
/**
 * GM Server - 游戏管理后台服务器
 *
 * 模块化架构：
 * - Controller: 处理 HTTP 请求和响应
 * - Service: 业务逻辑层
 * - Route: 路由定义
 *
 * API 模块：
 * - /api/players - 玩家管理
 * - /api/items - 物品管理
 * - /api/pets - 精灵管理
 * - /api/currency - 货币管理
 * - /api/server - 服务器管理
 * - /api/logs - 日志管理
 * - /api/config - 配置管理
 * - /api/reload - 配置重载
 */
class GMServer {
    app;
    port;
    constructor() {
        this.app = (0, express_1.default)();
        this.port = ServerConfig_1.ServerConfig.Instance.GM?.port || 3002;
        this.setupMiddleware();
        this.setupRoutes();
    }
    /**
     * 配置中间件
     */
    setupMiddleware() {
        // CORS 跨域支持
        this.app.use((0, cors_1.default)());
        // JSON 解析
        this.app.use(express_1.default.json({ limit: '50mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // 请求日志
        this.app.use((req, res, next) => {
            Logger_1.Logger.Debug(`[GMServer] ${req.method} ${req.path}`);
            next();
        });
    }
    /**
     * 配置路由
     */
    setupRoutes() {
        // Web GM 静态文件服务
        const webGmPath = process.pkg
            ? path_1.default.join(path_1.default.dirname(process.execPath), 'web-gm')
            : path_1.default.join(__dirname, '../../web/dist');
        if (fs_1.default.existsSync(webGmPath)) {
            this.app.use(express_1.default.static(webGmPath));
            //Logger.Info(`[GMServer] Web GM 静态文件: ${webGmPath}`);
        }
        else {
            Logger_1.Logger.Warn(`[GMServer] Web GM 目录不存在: ${webGmPath}，跳过静态文件服务`);
        }
        // 健康检查
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'ok',
                service: 'gm-server',
                version: '2.0.0',
                timestamp: Date.now()
            });
        });
        // API 路由（模块化）
        this.app.use('/api', routes_1.apiRouter);
        // SPA fallback: 非 /api 请求返回 index.html
        this.app.use((req, res, next) => {
            if (req.path.startsWith('/api')) {
                res.status(404).json({
                    success: false,
                    error: 'API 不存在',
                    path: req.path
                });
                return;
            }
            const indexPath = path_1.default.join(webGmPath, 'index.html');
            if (fs_1.default.existsSync(indexPath)) {
                res.sendFile(indexPath);
            }
            else {
                res.status(404).json({
                    success: false,
                    error: 'Web GM 未部署',
                    path: req.path
                });
            }
        });
        // 错误处理
        this.app.use((err, req, res, next) => {
            Logger_1.Logger.Error('[GMServer] 请求处理错误', err);
            res.status(500).json({
                success: false,
                error: err.message || '服务器内部错误'
            });
        });
    }
    /**
     * 启动服务器
     */
    start() {
        this.app.listen(this.port, () => {
            Logger_1.Logger.Info(`[GMServer] ========================================`);
            Logger_1.Logger.Info(`[GMServer] GM 服务器启动成功`);
            Logger_1.Logger.Info(`[GMServer] WeB GM 地址: http://localhost:${this.port}`);
            // Logger.Info(`[GMServer] API 文档: http://localhost:${this.port}/api/docs`);
            // Logger.Info(`[GMServer] 健康检查: http://localhost:${this.port}/health`);
            Logger_1.Logger.Info(`[GMServer] ========================================`);
        });
    }
}
exports.GMServer = GMServer;
//# sourceMappingURL=GMServer.js.map