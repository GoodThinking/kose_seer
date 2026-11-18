export declare class ConfigService {
    private configPath;
    /**
     * 将前端配置键名（连字符）转换为后端配置键名（下划线）
     * 例如: map-ogres -> map_ogres
     */
    private normalizeConfigKey;
    private metadata;
    getMetadata(): Promise<any>;
    getConfig(type: string): Promise<any>;
    saveConfig(type: string, data: any): Promise<void>;
    reloadConfig(type: string): Promise<void>;
    getOptions(type: string): Promise<any[]>;
    private getPetOptions;
    searchPetOptions(query?: string, page?: number, pageSize?: number): Promise<{
        items: any[];
        total: number;
    }>;
    private getSkillOptions;
    searchSkillOptions(query?: string, page?: number, pageSize?: number): Promise<{
        items: any[];
        total: number;
    }>;
    searchPetSkillOptions(petId: number, query?: string, page?: number, pageSize?: number): Promise<{
        items: any[];
        total: number;
    }>;
    private getItemOptions;
    searchItemOptions(query?: string, page?: number, pageSize?: number): Promise<{
        items: any[];
        total: number;
    }>;
    getPetNames(): Promise<Record<number, string>>;
    getItemNames(): Promise<Record<number, string>>;
    getTaskNames(): Promise<Record<number, string>>;
    getSkillNames(): Promise<Record<number, string>>;
    getNatures(): Promise<any[]>;
    private getAbilityOptions;
    searchAbilityOptions(query?: string, page?: number, pageSize?: number): Promise<{
        items: any[];
        total: number;
    }>;
}
//# sourceMappingURL=ConfigService.d.ts.map