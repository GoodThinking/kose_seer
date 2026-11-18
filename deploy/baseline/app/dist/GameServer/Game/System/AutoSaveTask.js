"use strict";
/**
 * 自动保存任务
 * 定期将内存中的数据保存到数据库
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoSaveTask = void 0;
const DatabaseHelper_1 = require("../../../DataBase/DatabaseHelper");
const utils_1 = require("../../../shared/utils");
/**
 * 自动保存任务
 * 每隔一定时间自动保存所有待保存的数据
 */
class AutoSaveTask {
    static _instance;
    _timer = null;
    _interval = 60000; // 默认60秒保存一次
    constructor() { }
    static get Instance() {
        if (!AutoSaveTask._instance) {
            AutoSaveTask._instance = new AutoSaveTask();
        }
        return AutoSaveTask._instance;
    }
    /**
     * 启动自动保存任务
     * @param intervalMs 保存间隔（毫秒），默认60秒
     */
    Start(intervalMs = 60000) {
        if (this._timer) {
            utils_1.Logger.Warn('[AutoSaveTask] 自动保存任务已经在运行');
            return;
        }
        this._interval = intervalMs;
        this._timer = setInterval(async () => {
            await this.SaveAll();
        }, this._interval);
        utils_1.Logger.Info(`[AutoSaveTask] 自动保存任务已启动，间隔: ${intervalMs}ms`);
    }
    /**
     * 停止自动保存任务
     */
    Stop() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
            utils_1.Logger.Info('[AutoSaveTask] 自动保存任务已停止');
        }
    }
    /**
     * 立即保存所有数据
     */
    async SaveAll() {
        try {
            const startTime = Date.now();
            await DatabaseHelper_1.DatabaseHelper.Instance.SaveAll();
            const elapsed = Date.now() - startTime;
            if (elapsed > 1000) {
                utils_1.Logger.Warn(`[AutoSaveTask] 保存耗时较长: ${elapsed}ms`);
            }
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error('[AutoSaveTask] 自动保存失败', error);
        }
    }
}
exports.AutoSaveTask = AutoSaveTask;
//# sourceMappingURL=AutoSaveTask.js.map