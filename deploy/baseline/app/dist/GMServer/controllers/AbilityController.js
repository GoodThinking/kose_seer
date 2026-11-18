"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AbilityController = void 0;
const AbilityService_1 = require("../services/AbilityService");
const Logger_1 = require("../../shared/utils/Logger");
/**
 * 精灵特性管理控制器
 */
class AbilityController {
    abilityService;
    constructor() {
        this.abilityService = new AbilityService_1.AbilityService();
    }
    /**
     * 获取所有可用特性列表
     * GET /api/abilities
     */
    getAllAbilities = async (req, res) => {
        try {
            const abilities = this.abilityService.getAllAbilities();
            res.json({ success: true, data: abilities });
        }
        catch (error) {
            Logger_1.Logger.Error('[AbilityController] 获取特性列表失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 获取指定精灵的特性
     * GET /api/abilities/:uid/:catchTime
     */
    getPetAbility = async (req, res) => {
        try {
            const { uid, catchTime } = req.params;
            if (!uid || !catchTime) {
                return res.status(400).json({ success: false, error: '缺少参数: uid, catchTime' });
            }
            const result = await this.abilityService.getPetAbility(Number(uid), Number(catchTime));
            res.json({ success: true, data: result });
        }
        catch (error) {
            Logger_1.Logger.Error(`[AbilityController] 获取精灵特性失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 设置精灵特性（替换现有）
     * POST /api/abilities/:uid
     */
    setAbility = async (req, res) => {
        try {
            const { uid } = req.params;
            const { catchTime, abilityId } = req.body;
            if (!catchTime || !abilityId) {
                return res.status(400).json({ success: false, error: '缺少参数: catchTime, abilityId' });
            }
            await this.abilityService.setAbility(Number(uid), catchTime, abilityId);
            res.json({ success: true, message: '特性设置成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[AbilityController] 设置特性失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 清除精灵特性
     * DELETE /api/abilities/:uid
     */
    clearAbility = async (req, res) => {
        try {
            const { uid } = req.params;
            const { catchTime } = req.body;
            if (!catchTime) {
                return res.status(400).json({ success: false, error: '缺少参数: catchTime' });
            }
            await this.abilityService.clearAbility(Number(uid), catchTime);
            res.json({ success: true, message: '特性已清除' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[AbilityController] 清除特性失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.AbilityController = AbilityController;
//# sourceMappingURL=AbilityController.js.map