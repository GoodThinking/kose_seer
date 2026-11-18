/**
 * 发光效果配置
 */
export interface IGlowConfig {
    color: string;
    alpha: number;
    blur: number;
    strength: number;
}
/**
 * 精灵特定覆盖配置
 */
export interface IPetOverride {
    comment?: string;
    colorMatrix?: number[];
    glow?: IGlowConfig;
}
/**
 * 单个异色方案配置
 */
export interface IShinyConfigItem {
    shinyId: number;
    name: string;
    description: string;
    enabled: boolean;
    colorMatrix: number[];
    glow: IGlowConfig;
    petOverrides: {
        [petId: string]: IPetOverride;
    };
}
/**
 * 异色配置文件结构
 */
export interface IShinyConfigFile {
    description: string;
    version: number;
    configs: IShinyConfigItem[];
    comment?: string;
}
/**
 * 异色配置响应（发送给 Mod）
 */
export interface IShinyConfigResponse {
    configs: IShinyConfigItem[];
    version: number;
}
//# sourceMappingURL=IShinyConfig.d.ts.map