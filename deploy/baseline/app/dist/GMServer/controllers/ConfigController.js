"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigController = void 0;
const ConfigService_1 = require("../services/ConfigService");
const Logger_1 = require("../../shared/utils/Logger");
class ConfigController {
    configService;
    constructor() {
        this.configService = new ConfigService_1.ConfigService();
    }
    // 获取配置元数据
    getMetadata = async (req, res) => {
        try {
            const metadata = await this.configService.getMetadata();
            res.json({ success: true, data: metadata });
        }
        catch (error) {
            Logger_1.Logger.Error('[ConfigController] 获取元数据失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 获取配置数据
    getConfig = async (req, res) => {
        try {
            const { type } = req.params;
            const data = await this.configService.getConfig(type);
            res.json({ success: true, data });
        }
        catch (error) {
            Logger_1.Logger.Error(`[ConfigController] 获取配置失败: ${req.params.type}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 保存配置数据
    saveConfig = async (req, res) => {
        try {
            const { type } = req.params;
            const { data } = req.body;
            Logger_1.Logger.Info(`[ConfigController] 收到保存配置请求: ${type}`);
            Logger_1.Logger.Debug(`[ConfigController] 数据大小: ${JSON.stringify(data).length} 字节`);
            if (!data) {
                res.status(400).json({ success: false, error: '缺少配置数据' });
                return;
            }
            await this.configService.saveConfig(type, data);
            res.json({ success: true, message: '配置保存成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[ConfigController] 保存配置失败: ${req.params.type}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 重载配置
    reloadConfig = async (req, res) => {
        try {
            const { type } = req.params;
            await this.configService.reloadConfig(type);
            res.json({ success: true, message: '配置重载成功' });
        }
        catch (error) {
            Logger_1.Logger.Error(`[ConfigController] 重载配置失败: ${req.params.type}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 获取下拉选项
    getOptions = async (req, res) => {
        try {
            const { type } = req.params;
            const options = await this.configService.getOptions(type);
            res.json({ success: true, data: options });
        }
        catch (error) {
            Logger_1.Logger.Error(`[ConfigController] 获取选项失败: ${req.params.type}`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 搜索精灵选项（分页）
    searchPets = async (req, res) => {
        try {
            const { query = '', page = 1, pageSize = 50 } = req.query;
            const result = await this.configService.searchPetOptions(query, parseInt(page), parseInt(pageSize));
            res.json({ success: true, data: result });
        }
        catch (error) {
            Logger_1.Logger.Error('[ConfigController] 搜索精灵失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 搜索物品选项（分页）
    searchItems = async (req, res) => {
        try {
            const { query = '', page = 1, pageSize = 50 } = req.query;
            const result = await this.configService.searchItemOptions(query, parseInt(page), parseInt(pageSize));
            res.json({ success: true, data: result });
        }
        catch (error) {
            Logger_1.Logger.Error('[ConfigController] 搜索物品失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 搜索技能选项（分页）
    searchSkills = async (req, res) => {
        try {
            const { query = '', page = 1, pageSize = 50 } = req.query;
            const result = await this.configService.searchSkillOptions(query, parseInt(page), parseInt(pageSize));
            res.json({ success: true, data: result });
        }
        catch (error) {
            Logger_1.Logger.Error('[ConfigController] 搜索技能失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 搜索指定精灵的技能选项（分页）
    searchPetSkills = async (req, res) => {
        try {
            const { petId } = req.params;
            const { query = '', page = 1, pageSize = 50 } = req.query;
            Logger_1.Logger.Debug(`[ConfigController] searchPetSkills 请求: petId=${petId}, query="${query}", page=${page}, pageSize=${pageSize}`);
            if (!petId) {
                res.status(400).json({ success: false, error: '缺少参数: petId' });
                return;
            }
            const result = await this.configService.searchPetSkillOptions(parseInt(petId), query, parseInt(page), parseInt(pageSize));
            Logger_1.Logger.Debug(`[ConfigController] searchPetSkills 返回: items=${result.items.length}, total=${result.total}`);
            res.json({ success: true, data: result });
        }
        catch (error) {
            Logger_1.Logger.Error('[ConfigController] 搜索精灵技能失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 获取精灵名字映射
    getPetNames = async (req, res) => {
        try {
            const petNames = await this.configService.getPetNames();
            res.json({ success: true, data: petNames });
        }
        catch (error) {
            Logger_1.Logger.Error('[ConfigController] 获取精灵名字失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 获取物品名字映射
    getItemNames = async (req, res) => {
        try {
            const itemNames = await this.configService.getItemNames();
            res.json({ success: true, data: itemNames });
        }
        catch (error) {
            Logger_1.Logger.Error('[ConfigController] 获取物品名字失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 获取任务名字映射
    getTaskNames = async (req, res) => {
        try {
            const taskNames = await this.configService.getTaskNames();
            res.json({ success: true, data: taskNames });
        }
        catch (error) {
            Logger_1.Logger.Error('[ConfigController] 获取任务名字失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 获取技能名字映射
    getSkillNames = async (req, res) => {
        try {
            const skillNames = await this.configService.getSkillNames();
            res.json({ success: true, data: skillNames });
        }
        catch (error) {
            Logger_1.Logger.Error('[ConfigController] 获取技能名字失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 获取性格列表
    getNatures = async (req, res) => {
        try {
            const natures = await this.configService.getNatures();
            res.json({ success: true, data: natures });
        }
        catch (error) {
            Logger_1.Logger.Error('[ConfigController] 获取性格列表失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
    // 搜索特性选项（分页）
    searchAbilities = async (req, res) => {
        try {
            const { query = '', page = 1, pageSize = 50 } = req.query;
            const result = await this.configService.searchAbilityOptions(query, parseInt(page), parseInt(pageSize));
            res.json({ success: true, data: result });
        }
        catch (error) {
            Logger_1.Logger.Error('[ConfigController] 搜索特性失败', error);
            res.status(500).json({ success: false, error: error.message });
        }
    };
}
exports.ConfigController = ConfigController;
//# sourceMappingURL=ConfigController.js.map