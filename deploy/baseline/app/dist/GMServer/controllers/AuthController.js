"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
const Logger_1 = require("../../shared/utils/Logger");
/**
 * 认证控制器
 */
class AuthController {
    authService;
    constructor() {
        this.authService = new AuthService_1.AuthService();
    }
    /**
     * 登录
     */
    login = async (req, res) => {
        try {
            const { email, password } = req.body;
            if (!email || !password) {
                res.status(400).json({ success: false, error: '邮箱和密码不能为空' });
                return;
            }
            const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
            const token = await this.authService.login(email, password, ipAddress);
            if (!token) {
                res.status(401).json({ success: false, error: '邮箱或密码错误' });
                return;
            }
            res.json({ success: true, data: { token } });
        }
        catch (error) {
            Logger_1.Logger.Error('[AuthController] 登录失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 登出
     */
    logout = async (req, res) => {
        try {
            const token = req.headers['authorization']?.replace('Bearer ', '') || req.query.token;
            if (token) {
                await this.authService.logout(token);
            }
            res.json({ success: true, message: '登出成功' });
        }
        catch (error) {
            Logger_1.Logger.Error('[AuthController] 登出失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 获取当前用户信息
     */
    getCurrentUser = async (req, res) => {
        try {
            const userId = req.userId;
            const email = req.email;
            const isLocal = req.isLocal;
            // 获取权限
            let permissions = [];
            if (isLocal) {
                permissions = ['*']; // 本地访问拥有所有权限
            }
            else {
                const isInWhitelist = await this.authService.isInWhitelist(userId);
                if (isInWhitelist) {
                    // 获取具体权限
                    const whitelist = await this.authService.getWhitelist();
                    const entry = whitelist.find(e => e.userId === userId);
                    permissions = entry?.permissions || [];
                }
            }
            res.json({
                success: true,
                data: {
                    userId,
                    email,
                    isLocal,
                    permissions
                }
            });
        }
        catch (error) {
            Logger_1.Logger.Error('[AuthController] 获取用户信息失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 获取白名单列表
     */
    getWhitelist = async (req, res) => {
        try {
            const whitelist = await this.authService.getWhitelist();
            res.json({ success: true, data: whitelist });
        }
        catch (error) {
            Logger_1.Logger.Error('[AuthController] 获取白名单失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 添加白名单
     */
    addToWhitelist = async (req, res) => {
        try {
            const { userId, email, permissions, note } = req.body;
            const createdBy = req.userId;
            if (!userId || !email || !permissions) {
                res.status(400).json({ success: false, error: '缺少必要参数' });
                return;
            }
            await this.authService.addToWhitelist(userId, email, permissions, createdBy, note);
            res.json({ success: true, message: '添加白名单成功' });
        }
        catch (error) {
            Logger_1.Logger.Error('[AuthController] 添加白名单失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 移除白名单
     */
    removeFromWhitelist = async (req, res) => {
        try {
            const { userId } = req.body;
            if (!userId) {
                res.status(400).json({ success: false, error: '缺少userId参数' });
                return;
            }
            await this.authService.removeFromWhitelist(userId);
            res.json({ success: true, message: '移除白名单成功' });
        }
        catch (error) {
            Logger_1.Logger.Error('[AuthController] 移除白名单失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map