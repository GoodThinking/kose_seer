"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const Logger_1 = require("../../shared/utils/Logger");
const ConfigRegistry_1 = require("../../shared/config/ConfigRegistry");
const GameConfig_1 = require("../../shared/config/game/GameConfig");
class ConfigService {
    configPath = path_1.default.join(process.pkg ? path_1.default.dirname(process.execPath) : process.cwd(), 'config');
    /**
     * 将前端配置键名（连字符）转换为后端配置键名（下划线）
     * 例如: map-ogres -> map_ogres
     */
    normalizeConfigKey(key) {
        return key.replace(/-/g, '_');
    }
    // 配置元数据定义
    metadata = {
        'map-ogres': {
            name: '地图怪物配置',
            fields: [
                { key: 'mapId', label: '地图ID', type: 'number', required: true },
                { key: 'name', label: '地图名称', type: 'text', required: true },
                { key: 'slot', label: '槽位', type: 'number', required: true },
                { key: 'petId', label: '精灵ID', type: 'select', options: 'pets', required: true },
                { key: 'minLevel', label: '最小等级', type: 'number', required: true, min: 1, max: 100 },
                { key: 'maxLevel', label: '最大等级', type: 'number', required: true, min: 1, max: 100 },
                { key: 'expReward', label: '经验奖励', type: 'number', required: true },
                { key: 'catchRate', label: '捕捉率', type: 'number', required: true, min: 0, max: 1, step: 0.01 },
                { key: 'expMultiplier', label: '经验倍率', type: 'number', required: true, min: 0.1, max: 10, step: 0.1 },
                { key: 'catchable', label: '可捕捉', type: 'boolean', required: true },
                { key: 'isBoss', label: 'BOSS', type: 'boolean', required: true },
                { key: 'refreshInterval', label: '刷新间隔(秒)', type: 'number', required: true },
                { key: 'shinyRate', label: '闪光率', type: 'number', required: true, min: 0, max: 1, step: 0.01 },
                { key: 'weight', label: '权重', type: 'number', required: true }
            ]
        },
        'tasks': {
            name: '任务配置',
            fields: [
                { key: 'id', label: '任务ID', type: 'number', required: true },
                { key: 'name', label: '任务名称', type: 'text', required: true },
                { key: 'description', label: '任务描述', type: 'textarea', required: true },
                { key: 'type', label: '任务类型', type: 'select', options: ['daily', 'weekly', 'main', 'side'], required: true },
                { key: 'rewardCoins', label: '金币奖励', type: 'number', required: false },
                { key: 'rewardExp', label: '经验奖励', type: 'number', required: false },
                { key: 'rewardItems', label: '物品奖励', type: 'select', options: 'items', multiple: true, required: false }
            ]
        },
        'unique-items': {
            name: '特殊物品配置',
            fields: [
                { key: 'itemId', label: '物品ID', type: 'select', options: 'items', required: true },
                { key: 'effectType', label: '效果类型', type: 'select', options: ['heal', 'buff', 'capture', 'evolution'], required: true },
                { key: 'effectValue', label: '效果值', type: 'number', required: true },
                { key: 'duration', label: '持续时间(秒)', type: 'number', required: false }
            ]
        }
    };
    // 获取配置元数据
    async getMetadata() {
        return this.metadata;
    }
    // 获取配置数据
    async getConfig(type) {
        const filePath = path_1.default.join(this.configPath, 'data/json', `${type}.json`);
        const content = await promises_1.default.readFile(filePath, 'utf-8');
        const rawData = JSON.parse(content);
        // 直接返回原始数据，保持层级结构
        return rawData;
    }
    // 保存配置数据
    async saveConfig(type, data) {
        const filePath = path_1.default.join(this.configPath, 'data/json', `${type}.json`);
        Logger_1.Logger.Info(`[ConfigService] 开始保存配置: ${type}`);
        Logger_1.Logger.Debug(`[ConfigService] 配置路径: ${filePath}`);
        // 备份原配置
        const backupPath = `${filePath}.backup.${Date.now()}`;
        try {
            await promises_1.default.copyFile(filePath, backupPath);
            Logger_1.Logger.Info(`[ConfigService] 配置已备份: ${backupPath}`);
        }
        catch (error) {
            Logger_1.Logger.Warn(`[ConfigService] 备份配置失败: ${error}`);
        }
        // 保存新配置
        const jsonContent = JSON.stringify(data, null, 2);
        await promises_1.default.writeFile(filePath, jsonContent, 'utf-8');
        Logger_1.Logger.Info(`[ConfigService] 配置已保存: ${type}, 大小: ${jsonContent.length} 字节`);
    }
    // 重载配置（通知游戏服务器）
    async reloadConfig(type) {
        try {
            Logger_1.Logger.Info(`[ConfigService] 开始重载配置: ${type}`);
            // 转换配置键名（连字符 -> 下划线）
            const normalizedKey = this.normalizeConfigKey(type);
            Logger_1.Logger.Debug(`[ConfigService] 配置键名转换: ${type} -> ${normalizedKey}`);
            // 重载配置（只重载指定配置，不重启服务器）
            const success = await ConfigRegistry_1.ConfigRegistry.Instance.ReloadConfig(normalizedKey);
            if (!success) {
                throw new Error('配置重载失败');
            }
            // 刷新 GameConfig 缓存
            GameConfig_1.GameConfig.ReloadAll();
            Logger_1.Logger.Info(`[ConfigService] 配置重载成功: ${type} (仅重载配置文件，服务器继续运行)`);
        }
        catch (error) {
            Logger_1.Logger.Error(`[ConfigService] 配置重载失败: ${type}`, error);
            throw error;
        }
    }
    // 获取下拉选项数据
    async getOptions(type) {
        switch (type) {
            case 'pets':
                return await this.getPetOptions();
            case 'skills':
                return await this.getSkillOptions();
            case 'items':
                return await this.getItemOptions();
            default:
                return [];
        }
    }
    // 获取精灵选项
    async getPetOptions() {
        const pets = GameConfig_1.GameConfig.GetAllPets();
        return pets.map((pet) => ({
            value: pet.ID,
            label: `${pet.ID} - ${pet.DefName || '未知'}`
        }));
    }
    // 搜索精灵选项（支持分页和搜索）
    async searchPetOptions(query = '', page = 1, pageSize = 50) {
        const allOptions = await this.getPetOptions();
        // 搜索过滤
        let filtered = allOptions;
        if (query) {
            const lowerQuery = query.toLowerCase();
            filtered = allOptions.filter(opt => opt.label.toLowerCase().includes(lowerQuery) ||
                opt.value.toString().includes(query));
        }
        // 分页
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const items = filtered.slice(start, end);
        return {
            items,
            total: filtered.length
        };
    }
    // 获取技能选项
    async getSkillOptions() {
        const skills = GameConfig_1.GameConfig.GetAllSkills();
        return skills.map((skill) => ({
            value: skill.ID,
            label: `${skill.ID} - ${skill.Name || '未知'}`
        }));
    }
    // 搜索技能选项（支持分页和搜索）
    async searchSkillOptions(query = '', page = 1, pageSize = 50) {
        const allOptions = await this.getSkillOptions();
        // 搜索过滤
        let filtered = allOptions;
        if (query) {
            const lowerQuery = query.toLowerCase();
            filtered = allOptions.filter(opt => opt.label.toLowerCase().includes(lowerQuery) ||
                opt.value.toString().includes(query));
        }
        // 分页
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const items = filtered.slice(start, end);
        return {
            items,
            total: filtered.length
        };
    }
    // 搜索指定精灵的技能选项（支持分页和搜索）
    async searchPetSkillOptions(petId, query = '', page = 1, pageSize = 50) {
        Logger_1.Logger.Debug(`[ConfigService] searchPetSkillOptions 调用: petId=${petId}, query="${query}", page=${page}, pageSize=${pageSize}`);
        // 获取精灵配置
        const petConfig = GameConfig_1.GameConfig.GetPetById(petId);
        if (!petConfig) {
            Logger_1.Logger.Warn(`[ConfigService] 精灵 ${petId} 配置不存在`);
            return { items: [], total: 0 };
        }
        Logger_1.Logger.Debug(`[ConfigService] 找到精灵配置: ${petConfig.DefName} (ID: ${petId})`);
        // 获取精灵可学习的技能ID列表
        const learnableSkillIds = new Set();
        // 从 LearnableMoves 中获取技能
        // LearnableMoves 是一个对象，包含 Move 属性，Move 可以是单个对象或数组
        if (petConfig.LearnableMoves && petConfig.LearnableMoves.Move) {
            const moves = petConfig.LearnableMoves.Move;
            const moveArray = Array.isArray(moves) ? moves : [moves];
            Logger_1.Logger.Debug(`[ConfigService] LearnableMoves.Move 类型: ${Array.isArray(moves) ? 'Array' : 'Object'}, 数量: ${moveArray.length}`);
            moveArray.forEach((move) => {
                if (move.ID) {
                    learnableSkillIds.add(move.ID);
                }
            });
        }
        else {
            Logger_1.Logger.Warn(`[ConfigService] 精灵 ${petId} (${petConfig.DefName}) 没有 LearnableMoves 或 LearnableMoves.Move`);
        }
        // 如果没有可学习的技能，返回空
        if (learnableSkillIds.size === 0) {
            Logger_1.Logger.Warn(`[ConfigService] 精灵 ${petId} (${petConfig.DefName}) 没有可学习的技能`);
            return { items: [], total: 0 };
        }
        Logger_1.Logger.Debug(`[ConfigService] 精灵 ${petId} 可学习技能ID列表: [${Array.from(learnableSkillIds).slice(0, 10).join(', ')}${learnableSkillIds.size > 10 ? '...' : ''}]`);
        // 获取所有技能
        const allSkills = GameConfig_1.GameConfig.GetAllSkills();
        Logger_1.Logger.Debug(`[ConfigService] 所有技能总数: ${allSkills.length}`);
        // 过滤出该精灵可学习的技能
        let petSkills = allSkills
            .filter((skill) => learnableSkillIds.has(skill.ID))
            .map((skill) => ({
            value: skill.ID,
            label: `${skill.ID} - ${skill.Name || '未知'}`
        }));
        Logger_1.Logger.Debug(`[ConfigService] 过滤后精灵可学习技能数: ${petSkills.length}`);
        // 搜索过滤
        if (query) {
            const lowerQuery = query.toLowerCase();
            petSkills = petSkills.filter(opt => opt.label.toLowerCase().includes(lowerQuery) ||
                opt.value.toString().includes(query));
            Logger_1.Logger.Debug(`[ConfigService] 搜索 "${query}" 后技能数: ${petSkills.length}`);
        }
        // 分页
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const items = petSkills.slice(start, end);
        Logger_1.Logger.Info(`[ConfigService] 精灵 ${petId} (${petConfig.DefName}) 可学习技能数: ${learnableSkillIds.size}, 搜索后: ${petSkills.length}, 返回: ${items.length}`);
        return {
            items,
            total: petSkills.length
        };
    }
    // 获取物品选项
    async getItemOptions() {
        const items = GameConfig_1.GameConfig.GetAllItems();
        return items.map((item) => ({
            value: item.ID,
            label: `${item.ID} - ${item.Name || '未知'}`
        }));
    }
    // 搜索物品选项（支持分页和搜索）
    async searchItemOptions(query = '', page = 1, pageSize = 50) {
        const allOptions = await this.getItemOptions();
        // 搜索过滤
        let filtered = allOptions;
        if (query) {
            const lowerQuery = query.toLowerCase();
            filtered = allOptions.filter(opt => opt.label.toLowerCase().includes(lowerQuery) ||
                opt.value.toString().includes(query));
        }
        // 分页
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const items = filtered.slice(start, end);
        return {
            items,
            total: filtered.length
        };
    }
    // 获取精灵名字映射（ID -> 名字）
    async getPetNames() {
        const pets = GameConfig_1.GameConfig.GetAllPets();
        const nameMap = {};
        pets.forEach((pet) => {
            nameMap[pet.ID] = pet.DefName || '未知';
        });
        Logger_1.Logger.Info(`[ConfigService] 加载精灵名字: ${Object.keys(nameMap).length} 个精灵`);
        return nameMap;
    }
    // 获取物品名字映射（ID -> 名字）
    async getItemNames() {
        const items = GameConfig_1.GameConfig.GetAllItems();
        const nameMap = {};
        items.forEach((item) => {
            nameMap[item.ID] = item.Name || '未知';
        });
        Logger_1.Logger.Info(`[ConfigService] 加载物品名字: ${Object.keys(nameMap).length} 个物品`);
        return nameMap;
    }
    // 获取任务名字映射（ID -> 名字）
    async getTaskNames() {
        const config = GameConfig_1.GameConfig.GetTaskConfig();
        const nameMap = {};
        if (!config || !config.tasks) {
            Logger_1.Logger.Warn('[ConfigService] 任务配置不存在或为空');
            return nameMap;
        }
        const tasks = config.tasks;
        Object.keys(tasks).forEach((taskId) => {
            const id = parseInt(taskId);
            const name = tasks[taskId].name || '未知任务';
            nameMap[id] = name;
        });
        Logger_1.Logger.Info(`[ConfigService] 加载任务名字: ${Object.keys(nameMap).length} 个任务`);
        return nameMap;
    }
    // 获取技能名字映射（ID -> 名字）
    async getSkillNames() {
        const skills = GameConfig_1.GameConfig.GetAllSkills();
        const nameMap = {};
        skills.forEach((skill) => {
            nameMap[skill.ID] = skill.Name || '未知技能';
        });
        Logger_1.Logger.Info(`[ConfigService] 加载技能名字: ${Object.keys(nameMap).length} 个技能`);
        return nameMap;
    }
    // 获取性格列表
    async getNatures() {
        const config = GameConfig_1.GameConfig.GetNatureConfig();
        if (!config || !config.natures) {
            Logger_1.Logger.Warn('[ConfigService] 性格配置未加载');
            return [];
        }
        Logger_1.Logger.Info(`[ConfigService] 加载性格列表: ${config.natures.length} 种性格`);
        return config.natures;
    }
    // 获取特性选项
    async getAbilityOptions() {
        const abilities = GameConfig_1.GameConfig.GetAllPetAbilities();
        return abilities.map((ability) => ({
            value: ability.abilityId,
            label: `${ability.abilityId} - ${ability.name}`,
            description: ability.description,
            effectId: ability.effectId,
            args: ability.args
        }));
    }
    // 搜索特性选项（支持分页和搜索）
    async searchAbilityOptions(query = '', page = 1, pageSize = 50) {
        const allOptions = await this.getAbilityOptions();
        // 搜索过滤
        let filtered = allOptions;
        if (query) {
            const lowerQuery = query.toLowerCase();
            filtered = allOptions.filter(opt => opt.label.toLowerCase().includes(lowerQuery) ||
                opt.value.toString().includes(query) ||
                (opt.description && opt.description.toLowerCase().includes(lowerQuery)));
        }
        // 分页
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const items = filtered.slice(start, end);
        return {
            items,
            total: filtered.length
        };
    }
}
exports.ConfigService = ConfigService;
//# sourceMappingURL=ConfigService.js.map