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
export declare class GMServer {
    private app;
    private port;
    constructor();
    /**
     * 配置中间件
     */
    private setupMiddleware;
    /**
     * 配置路由
     */
    private setupRoutes;
    /**
     * 启动服务器
     */
    start(): void;
}
//# sourceMappingURL=GMServer.d.ts.map