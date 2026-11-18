/**
 * 配置定义
 * 集中管理所有配置的键名和路径
 */
/**
 * 配置键名常量
 */
export declare const ConfigKeys: {
    readonly SERVER_CONFIG: "server_config";
    readonly CLIENT_CONFIG: "client_config";
    readonly MAP_OGRES: "map_ogres";
    readonly BATTLE_CONFIG: "battle_config";
    readonly TASK_CONFIG: "task_config";
    readonly SHOP_CONFIG: "shop_config";
    readonly DEFAULT_PLAYER: "default_player";
    readonly SHINY_CONFIGS: "shiny_configs";
    readonly PET_CONFIG: "pet_config";
    readonly SKILL_CONFIG: "skill_config";
    readonly ITEM_CONFIG: "item_config";
    readonly SKILL_EFFECTS_CONFIG: "skill_effects_config";
    readonly SPT_CONFIG: "spt_config";
    readonly NATURES_CONFIG: "natures_config";
    readonly ELEMENTS_CONFIG: "elements_config";
    readonly UNIQUE_ITEMS_CONFIG: "unique_items_config";
    readonly SKILL_EFFECTS_V2: "skill_effects_v2";
    readonly PET_ABILITIES: "pet_abilities";
    readonly BOSS_ABILITIES: "boss_abilities";
    readonly GACHA_REWARDS: "gacha_rewards";
};
/**
 * 配置路径映射
 */
export declare const ConfigPaths: Record<string, string>;
/**
 * 配置类型：JSON 或 XML
 */
export declare enum ConfigType {
    JSON = "json",
    XML = "xml"
}
/**
 * 配置类型映射
 */
export declare const ConfigTypes: Record<string, ConfigType>;
/**
 * 获取所有游戏配置的注册信息
 */
export declare function GetGameConfigRegistrations(): Array<{
    key: string;
    path: string;
    type: ConfigType;
}>;
//# sourceMappingURL=ConfigDefinitions.d.ts.map