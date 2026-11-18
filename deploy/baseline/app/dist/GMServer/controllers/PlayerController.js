"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerController = void 0;
const PlayerService_1 = require("../services/PlayerService");
const Logger_1 = require("../../shared/utils/Logger");
/**
 * 玩家管理控制器
 */
class PlayerController {
    playerService;
    constructor() {
        this.playerService = new PlayerService_1.PlayerService();
    }
    /**
     * 获取玩家列表
     */
    getPlayers = async (req, res) => {
        try {
            const { page = 1, limit = 20, search, onlineOnly } = req.query;
            const result = await this.playerService.getPlayers(Number(page), Number(limit), search, onlineOnly === 'true' || onlineOnly === '1');
            res.json({ success: true, data: result });
        }
        catch (error) {
            Logger_1.Logger.Error('[PlayerController] 获取玩家列表失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 获取玩家详情
     */
    getPlayerDetail = async (req, res) => {
        try {
            const { uid } = req.params;
            const player = await this.playerService.getPlayerDetail(Number(uid));
            res.json({ success: true, data: player });
        }
        catch (error) {
            Logger_1.Logger.Error(`[PlayerController] 获取玩家详情失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 修改玩家数据
     */
    updatePlayer = async (req, res) => {
        try {
            const { uid } = req.params;
            const { field, value } = req.body;
            await this.playerService.updatePlayer(Number(uid), field, value);
            res.json({ success: true, message: '玩家数据修改成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[PlayerController] 修改玩家数据失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 修改账号信息（邮箱、密码）
     */
    updateAccount = async (req, res) => {
        try {
            const { uid } = req.params;
            const { email, password } = req.body;
            if (!email && !password) {
                res.status(400).json({ success: false, error: '请至少提供一项需要修改的内容' });
                return;
            }
            await this.playerService.updateAccount(Number(uid), email, password);
            res.json({ success: true, message: '账号信息修改成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[PlayerController] 修改账号信息失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 封禁/解封玩家
     */
    banPlayer = async (req, res) => {
        try {
            const { uid } = req.params;
            const { banType, reason } = req.body;
            Logger_1.Logger.Info(`[PlayerController] 收到封禁请求: uid=${uid}, banType=${banType}, reason=${reason}`);
            await this.playerService.banPlayer(Number(uid), banType, reason);
            const banTypeNames = {
                0: '解封',
                1: '24小时封停',
                2: '7天封停',
                3: '14天封停',
                4: '永久封停'
            };
            res.json({
                success: true,
                message: `玩家已${banTypeNames[banType] || '处理'}`
            });
        }
        catch (error) {
            Logger_1.Logger.Error(`[PlayerController] 封禁/解封玩家失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 踢出玩家
     */
    kickPlayer = async (req, res) => {
        try {
            const { uid } = req.params;
            const { reason } = req.body;
            await this.playerService.kickPlayer(Number(uid), reason);
            res.json({ success: true, message: '玩家已踢出' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[PlayerController] 踢出玩家失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.PlayerController = PlayerController;
//# sourceMappingURL=PlayerController.js.map