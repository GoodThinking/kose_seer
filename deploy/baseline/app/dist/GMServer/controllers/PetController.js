"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetController = void 0;
const PetService_1 = require("../services/PetService");
const Logger_1 = require("../../shared/utils/Logger");
/**
 * 精灵管理控制器
 */
class PetController {
    petService;
    constructor() {
        this.petService = new PetService_1.PetService();
    }
    /**
     * 发送精灵
     */
    givePet = async (req, res) => {
        try {
            const { uid } = req.params;
            const { petId, level = 1, shiny = false, customStats } = req.body;
            if (!petId) {
                return res.status(400).json({ success: false, error: '缺少参数: petId' });
            }
            await this.petService.givePet(Number(uid), petId, level, shiny, customStats);
            res.json({ success: true, message: '精灵发送成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[PetController] 发送精灵失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 删除精灵
     */
    removePet = async (req, res) => {
        try {
            const { uid } = req.params;
            const { catchTime } = req.body;
            if (!catchTime) {
                return res.status(400).json({ success: false, error: '缺少参数: catchTime' });
            }
            await this.petService.removePet(Number(uid), catchTime);
            res.json({ success: true, message: '精灵删除成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[PetController] 删除精灵失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 修改精灵属性（批量更新）
     */
    updatePet = async (req, res) => {
        try {
            const { uid } = req.params;
            const updateData = req.body;
            if (!updateData.catchTime) {
                return res.status(400).json({ success: false, error: '缺少参数: catchTime' });
            }
            // 支持两种模式：
            // 1. 旧模式：{ catchTime, field, value }
            // 2. 新模式：{ catchTime, level, nature, exp, evXxx, dvXxx, skills }
            if (updateData.field && updateData.value !== undefined) {
                // 旧模式：单字段更新
                await this.petService.updatePet(Number(uid), updateData.catchTime, updateData.field, updateData.value);
            }
            else {
                // 新模式：批量更新
                await this.petService.updatePetBatch(Number(uid), updateData);
            }
            res.json({ success: true, message: '精灵属性修改成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[PetController] 修改精灵属性失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 获取玩家精灵列表
     */
    getPlayerPets = async (req, res) => {
        try {
            const { uid } = req.params;
            const pets = await this.petService.getPlayerPets(Number(uid));
            res.json({ success: true, data: pets });
        }
        catch (error) {
            Logger_1.Logger.Error(`[PetController] 获取玩家精灵失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 治疗精灵
     */
    curePet = async (req, res) => {
        try {
            const { uid } = req.params;
            const { catchTime } = req.body;
            if (!catchTime) {
                return res.status(400).json({ success: false, error: '缺少参数: catchTime' });
            }
            await this.petService.curePet(Number(uid), catchTime);
            res.json({ success: true, message: '精灵治疗成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[PetController] 治疗精灵失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 治疗所有精灵
     */
    cureAllPets = async (req, res) => {
        try {
            const { uid } = req.params;
            await this.petService.cureAllPets(Number(uid));
            res.json({ success: true, message: '所有精灵治疗成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[PetController] 治疗所有精灵失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    /**
     * 设置精灵等级
     */
    setPetLevel = async (req, res) => {
        try {
            const { uid } = req.params;
            const { catchTime, level } = req.body;
            if (!catchTime || !level) {
                return res.status(400).json({ success: false, error: '缺少参数: catchTime, level' });
            }
            await this.petService.setPetLevel(Number(uid), catchTime, level);
            res.json({ success: true, message: '精灵等级设置成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[PetController] 设置精灵等级失败: ${req.params.uid}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.PetController = PetController;
//# sourceMappingURL=PetController.js.map