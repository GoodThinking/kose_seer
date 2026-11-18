/**
 * 自动保存任务
 * 定期将内存中的数据保存到数据库
 */
/**
 * 自动保存任务
 * 每隔一定时间自动保存所有待保存的数据
 */
export declare class AutoSaveTask {
    private static _instance;
    private _timer;
    private _interval;
    private constructor();
    static get Instance(): AutoSaveTask;
    /**
     * 启动自动保存任务
     * @param intervalMs 保存间隔（毫秒），默认60秒
     */
    Start(intervalMs?: number): void;
    /**
     * 停止自动保存任务
     */
    Stop(): void;
    /**
     * 立即保存所有数据
     */
    SaveAll(): Promise<void>;
}
//# sourceMappingURL=AutoSaveTask.d.ts.map