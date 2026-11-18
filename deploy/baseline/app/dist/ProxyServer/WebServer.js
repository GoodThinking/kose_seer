"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebServer = void 0;
const http_1 = require("http");
const ws_1 = require("ws");
const fs_1 = require("fs");
const path_1 = require("path");
const utils_1 = require("../shared/utils");
// MIME 类型映射
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
};
/**
 * Web GUI 服务器
 */
class WebServer {
    _httpServer;
    _wsServer = null;
    _clients = new Set();
    _proxyServer;
    _running = false;
    _publicDir;
    _webPort;
    constructor(proxyServer, webPort = 8080) {
        this._proxyServer = proxyServer;
        this._webPort = webPort;
        // 查找 public 目录
        // 开发环境: src/ProxyServer/public
        // 生产环境(npm start): dist/ProxyServer/public 或 src/ProxyServer/public
        // 打包环境(pkg): 可执行文件同级的 public 目录
        const possiblePaths = [
            (0, path_1.join)(__dirname, 'public'), // dist/ProxyServer/public
            (0, path_1.join)(__dirname, '../../src/ProxyServer/public'), // 从 dist 回到 src
            (0, path_1.join)(process.cwd(), 'src/ProxyServer/public'), // 从工作目录
            (0, path_1.join)(process.cwd(), 'public'), // 打包后：可执行文件同级
            (0, path_1.join)((0, path_1.dirname)(process.execPath), 'public'), // 打包后：exe 同级
        ];
        this._publicDir = '';
        for (const testPath of possiblePaths) {
            if ((0, fs_1.existsSync)(testPath)) {
                this._publicDir = testPath;
                utils_1.Logger.Info(`[WebServer] 找到 public 目录: ${testPath}`);
                break;
            }
        }
        if (!this._publicDir) {
            utils_1.Logger.Warn('[WebServer] 未找到 public 目录，Web GUI 将不可用');
            utils_1.Logger.Warn(`[WebServer] 尝试的路径:`);
            possiblePaths.forEach(p => utils_1.Logger.Warn(`  - ${p}`));
        }
        this._httpServer = (0, http_1.createServer)((req, res) => this.HandleRequest(req, res));
    }
    /**
     * 处理 HTTP 请求
     */
    HandleRequest(req, res) {
        const url = req.url || '/';
        // API 路由
        if (url.startsWith('/api/')) {
            this.HandleAPI(url, req, res);
            return;
        }
        // 检查 public 目录是否存在
        if (!this._publicDir) {
            res.writeHead(503);
            res.end('Web GUI not available - public directory not found');
            return;
        }
        // 静态文件
        let filePath = url === '/' ? '/index.html' : url;
        filePath = (0, path_1.join)(this._publicDir, filePath);
        // 检查文件是否存在
        if (!(0, fs_1.existsSync)(filePath)) {
            res.writeHead(404);
            res.end('Not Found');
            utils_1.Logger.Warn(`[WebServer] 文件不存在: ${filePath}`);
            return;
        }
        // 读取并返回文件
        try {
            const content = (0, fs_1.readFileSync)(filePath);
            const ext = (0, path_1.extname)(filePath);
            const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content);
        }
        catch (err) {
            utils_1.Logger.Error('[WebServer] 读取文件失败', err);
            res.writeHead(500);
            res.end('Internal Server Error');
        }
    }
    /**
     * 处理 API 请求
     */
    HandleAPI(url, _req, res) {
        res.setHeader('Content-Type', 'application/json');
        if (url === '/api/packets') {
            // 获取所有数据包
            const packets = this._proxyServer.GetCapturedPackets();
            res.writeHead(200);
            res.end(JSON.stringify(packets));
        }
        else if (url === '/api/clear') {
            // 清空数据包
            this._proxyServer.ClearPackets();
            res.writeHead(200);
            res.end(JSON.stringify({ success: true }));
        }
        else {
            res.writeHead(404);
            res.end(JSON.stringify({ error: 'Not Found' }));
        }
    }
    /**
     * 广播数据包到所有 WebSocket 客户端
     */
    BroadcastPacket(packet) {
        const message = JSON.stringify({ type: 'packet', data: packet });
        for (const client of this._clients) {
            if (client.readyState === ws_1.WebSocket.OPEN) {
                client.send(message);
            }
        }
    }
    /**
     * 启动服务器
     */
    Start() {
        if (this._running)
            return;
        this._httpServer.listen(this._webPort, () => {
            this._running = true;
            utils_1.Logger.Info(`[WebServer] GUI 启动 http://127.0.0.1:${this._webPort}`);
        });
        // 创建 WebSocket 服务器
        this._wsServer = new ws_1.WebSocketServer({ server: this._httpServer });
        this._wsServer.on('connection', (ws) => {
            this._clients.add(ws);
            utils_1.Logger.Info(`[WebServer] WebSocket 客户端连接, 当前: ${this._clients.size}`);
            ws.on('close', () => {
                this._clients.delete(ws);
                utils_1.Logger.Info(`[WebServer] WebSocket 客户端断开, 当前: ${this._clients.size}`);
            });
            ws.on('error', (err) => {
                utils_1.Logger.Error('[WebServer] WebSocket 错误', err);
                this._clients.delete(ws);
            });
        });
    }
    /**
     * 停止服务器
     */
    async Stop() {
        if (!this._running)
            return;
        utils_1.Logger.Info('[WebServer] 正在停止...');
        // 关闭所有 WebSocket 连接
        for (const client of this._clients) {
            try {
                client.close();
            }
            catch (err) {
                // 忽略关闭错误
            }
        }
        this._clients.clear();
        // 关闭 WebSocket 服务器
        if (this._wsServer) {
            await new Promise((resolve) => {
                this._wsServer.close(() => {
                    utils_1.Logger.Info('[WebServer] WebSocket 服务器已关闭');
                    resolve();
                });
                // 设置超时，防止卡住
                setTimeout(() => {
                    utils_1.Logger.Warn('[WebServer] 关闭 WebSocket 服务器超时，强制继续');
                    resolve();
                }, 3000);
            });
        }
        // 关闭 HTTP 服务器
        await new Promise((resolve) => {
            this._httpServer.close(() => {
                this._running = false;
                utils_1.Logger.Info('[WebServer] HTTP 服务器已关闭');
                resolve();
            });
            // 设置超时，防止卡住
            setTimeout(() => {
                utils_1.Logger.Warn('[WebServer] 关闭 HTTP 服务器超时，强制继续');
                this._running = false;
                resolve();
            }, 3000);
        });
    }
    /**
     * 是否正在运行
     */
    get IsRunning() {
        return this._running;
    }
}
exports.WebServer = WebServer;
//# sourceMappingURL=WebServer.js.map