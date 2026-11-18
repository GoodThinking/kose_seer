export declare class MigrationRunner {
    private _db;
    constructor();
    /**
     * 初始化迁移表
     */
    private initMigrationTable;
    /**
     * 获取已执行的迁移版本
     */
    private getExecutedVersions;
    /**
     * 记录迁移执行
     */
    private recordMigration;
    /**
     * 删除迁移记录
     */
    private removeMigrationRecord;
    /**
     * 执行所有待执行的迁移
     */
    RunAll(): Promise<void>;
    /**
     * 回滚最后一个迁移
     */
    RollbackLast(): Promise<void>;
    /**
     * 回滚到指定版本
     */
    RollbackTo(targetVersion: number): Promise<void>;
    /**
     * 获取迁移状态
     */
    GetStatus(): Promise<{
        version: number;
        name: string;
        executed: boolean;
    }[]>;
}
//# sourceMappingURL=MigrationRunner.d.ts.map