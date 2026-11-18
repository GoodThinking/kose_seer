"use strict";
/**
 * 配置定义
 * 集中管理所有配置的键名和路径
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigTypes = exports.ConfigType = exports.ConfigPaths = exports.ConfigKeys = void 0;
exports.GetGameConfigRegistrations = GetGameConfigRegistrations;
/**
 * 配置键名常量
 */
exports.ConfigKeys = {
    // 服务器配置
    SERVER_CONFIG: 'server_config',
    CLIENT_CONFIG: 'client_config',
    // 游戏配置 (JSON)
    MAP_OGRES: 'map_ogres',
    BATTLE_CONFIG: 'battle_config',
    TASK_CONFIG: 'task_config',
    SHOP_CONFIG: 'shop_config',
    DEFAULT_PLAYER: 'default_player',
    SHINY_CONFIGS: 'shiny_configs',
    // 游戏数据配置 (XML)
    PET_CONFIG: 'pet_config',
    SKILL_CONFIG: 'skill_config',
    ITEM_CONFIG: 'item_config',
    SKILL_EFFECTS_CONFIG: 'skill_effects_config',
    SPT_CONFIG: 'spt_config',
    // 游戏数据配置 (JSON)
    NATURES_CONFIG: 'natures_config',
    ELEMENTS_CONFIG: 'elements_config',
    UNIQUE_ITEMS_CONFIG: 'unique_items_config',
    SKILL_EFFECTS_V2: 'skill_effects_v2',
    PET_ABILITIES: 'pet_abilities',
    BOSS_ABILITIES: 'boss_abilities',
    GACHA_REWARDS: 'gacha_rewards',
};
/**
 * 配置路径映射
 */
exports.ConfigPaths = {
    // 服务器配置
    [exports.ConfigKeys.SERVER_CONFIG]: 'server.json',
    [exports.ConfigKeys.CLIENT_CONFIG]: 'client.json',
    // JSON配置
    [exports.ConfigKeys.MAP_OGRES]: 'data/json/map-ogres.json',
    [exports.ConfigKeys.BATTLE_CONFIG]: 'game/battle-config.json',
    [exports.ConfigKeys.TASK_CONFIG]: 'data/json/tasks.json',
    [exports.ConfigKeys.SHOP_CONFIG]: 'data/json/shop.json',
    [exports.ConfigKeys.DEFAULT_PLAYER]: 'data/json/default-player.json',
    [exports.ConfigKeys.SHINY_CONFIGS]: 'data/json/shiny_configs.json',
    // XML配置
    [exports.ConfigKeys.PET_CONFIG]: 'data/xml/pets.xml',
    [exports.ConfigKeys.SKILL_CONFIG]: 'data/xml/skills.xml',
    [exports.ConfigKeys.ITEM_CONFIG]: 'data/xml/items.xml',
    [exports.ConfigKeys.SKILL_EFFECTS_CONFIG]: 'data/xml/skill_effects.xml',
    [exports.ConfigKeys.SPT_CONFIG]: 'data/xml/spt.xml',
    // JSON数据配置
    [exports.ConfigKeys.NATURES_CONFIG]: 'data/json/natures.json',
    [exports.ConfigKeys.ELEMENTS_CONFIG]: 'data/json/elements.json',
    [exports.ConfigKeys.UNIQUE_ITEMS_CONFIG]: 'data/json/unique-items.json',
    [exports.ConfigKeys.SKILL_EFFECTS_V2]: 'data/json/skill_effects_v2.json',
    [exports.ConfigKeys.PET_ABILITIES]: 'data/json/pet_abilities.json',
    [exports.ConfigKeys.BOSS_ABILITIES]: 'data/json/boss_abilities.json',
    [exports.ConfigKeys.GACHA_REWARDS]: 'data/json/gacha_rewards.json',
};
/**
 * 配置类型：JSON 或 XML
 */
var ConfigType;
(function (ConfigType) {
    ConfigType["JSON"] = "json";
    ConfigType["XML"] = "xml";
})(ConfigType || (exports.ConfigType = ConfigType = {}));
/**
 * 配置类型映射
 */
exports.ConfigTypes = {
    [exports.ConfigKeys.SERVER_CONFIG]: ConfigType.JSON,
    [exports.ConfigKeys.CLIENT_CONFIG]: ConfigType.JSON,
    [exports.ConfigKeys.MAP_OGRES]: ConfigType.JSON,
    [exports.ConfigKeys.BATTLE_CONFIG]: ConfigType.JSON,
    [exports.ConfigKeys.TASK_CONFIG]: ConfigType.JSON,
    [exports.ConfigKeys.SHOP_CONFIG]: ConfigType.JSON,
    [exports.ConfigKeys.DEFAULT_PLAYER]: ConfigType.JSON,
    [exports.ConfigKeys.SHINY_CONFIGS]: ConfigType.JSON,
    [exports.ConfigKeys.PET_CONFIG]: ConfigType.XML,
    [exports.ConfigKeys.SKILL_CONFIG]: ConfigType.XML,
    [exports.ConfigKeys.ITEM_CONFIG]: ConfigType.XML,
    [exports.ConfigKeys.SKILL_EFFECTS_CONFIG]: ConfigType.XML,
    [exports.ConfigKeys.SPT_CONFIG]: ConfigType.XML,
    [exports.ConfigKeys.NATURES_CONFIG]: ConfigType.JSON,
    [exports.ConfigKeys.ELEMENTS_CONFIG]: ConfigType.JSON,
    [exports.ConfigKeys.UNIQUE_ITEMS_CONFIG]: ConfigType.JSON,
    [exports.ConfigKeys.SKILL_EFFECTS_V2]: ConfigType.JSON,
    [exports.ConfigKeys.PET_ABILITIES]: ConfigType.JSON,
    [exports.ConfigKeys.BOSS_ABILITIES]: ConfigType.JSON,
    [exports.ConfigKeys.GACHA_REWARDS]: ConfigType.JSON,
};
/**
 * 获取所有游戏配置的注册信息
 */
function GetGameConfigRegistrations() {
    return [
        { key: exports.ConfigKeys.CLIENT_CONFIG, path: exports.ConfigPaths[exports.ConfigKeys.CLIENT_CONFIG], type: exports.ConfigTypes[exports.ConfigKeys.CLIENT_CONFIG] },
        { key: exports.ConfigKeys.MAP_OGRES, path: exports.ConfigPaths[exports.ConfigKeys.MAP_OGRES], type: exports.ConfigTypes[exports.ConfigKeys.MAP_OGRES] },
        { key: exports.ConfigKeys.DEFAULT_PLAYER, path: exports.ConfigPaths[exports.ConfigKeys.DEFAULT_PLAYER], type: exports.ConfigTypes[exports.ConfigKeys.DEFAULT_PLAYER] },
        { key: exports.ConfigKeys.TASK_CONFIG, path: exports.ConfigPaths[exports.ConfigKeys.TASK_CONFIG], type: exports.ConfigTypes[exports.ConfigKeys.TASK_CONFIG] },
        { key: exports.ConfigKeys.SHOP_CONFIG, path: exports.ConfigPaths[exports.ConfigKeys.SHOP_CONFIG], type: exports.ConfigTypes[exports.ConfigKeys.SHOP_CONFIG] },
        { key: exports.ConfigKeys.SHINY_CONFIGS, path: exports.ConfigPaths[exports.ConfigKeys.SHINY_CONFIGS], type: exports.ConfigTypes[exports.ConfigKeys.SHINY_CONFIGS] },
        { key: exports.ConfigKeys.PET_CONFIG, path: exports.ConfigPaths[exports.ConfigKeys.PET_CONFIG], type: exports.ConfigTypes[exports.ConfigKeys.PET_CONFIG] },
        { key: exports.ConfigKeys.SKILL_CONFIG, path: exports.ConfigPaths[exports.ConfigKeys.SKILL_CONFIG], type: exports.ConfigTypes[exports.ConfigKeys.SKILL_CONFIG] },
        { key: exports.ConfigKeys.ITEM_CONFIG, path: exports.ConfigPaths[exports.ConfigKeys.ITEM_CONFIG], type: exports.ConfigTypes[exports.ConfigKeys.ITEM_CONFIG] },
        { key: exports.ConfigKeys.SKILL_EFFECTS_CONFIG, path: exports.ConfigPaths[exports.ConfigKeys.SKILL_EFFECTS_CONFIG], type: exports.ConfigTypes[exports.ConfigKeys.SKILL_EFFECTS_CONFIG] },
        { key: exports.ConfigKeys.SPT_CONFIG, path: exports.ConfigPaths[exports.ConfigKeys.SPT_CONFIG], type: exports.ConfigTypes[exports.ConfigKeys.SPT_CONFIG] },
        { key: exports.ConfigKeys.NATURES_CONFIG, path: exports.ConfigPaths[exports.ConfigKeys.NATURES_CONFIG], type: exports.ConfigTypes[exports.ConfigKeys.NATURES_CONFIG] },
        { key: exports.ConfigKeys.ELEMENTS_CONFIG, path: exports.ConfigPaths[exports.ConfigKeys.ELEMENTS_CONFIG], type: exports.ConfigTypes[exports.ConfigKeys.ELEMENTS_CONFIG] },
        { key: exports.ConfigKeys.UNIQUE_ITEMS_CONFIG, path: exports.ConfigPaths[exports.ConfigKeys.UNIQUE_ITEMS_CONFIG], type: exports.ConfigTypes[exports.ConfigKeys.UNIQUE_ITEMS_CONFIG] },
        { key: exports.ConfigKeys.SKILL_EFFECTS_V2, path: exports.ConfigPaths[exports.ConfigKeys.SKILL_EFFECTS_V2], type: exports.ConfigTypes[exports.ConfigKeys.SKILL_EFFECTS_V2] },
        { key: exports.ConfigKeys.PET_ABILITIES, path: exports.ConfigPaths[exports.ConfigKeys.PET_ABILITIES], type: exports.ConfigTypes[exports.ConfigKeys.PET_ABILITIES] },
        { key: exports.ConfigKeys.BOSS_ABILITIES, path: exports.ConfigPaths[exports.ConfigKeys.BOSS_ABILITIES], type: exports.ConfigTypes[exports.ConfigKeys.BOSS_ABILITIES] },
        { key: exports.ConfigKeys.GACHA_REWARDS, path: exports.ConfigPaths[exports.ConfigKeys.GACHA_REWARDS], type: exports.ConfigTypes[exports.ConfigKeys.GACHA_REWARDS] }
    ];
}
//# sourceMappingURL=ConfigDefinitions.js.map