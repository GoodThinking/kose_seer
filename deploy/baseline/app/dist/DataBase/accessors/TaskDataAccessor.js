"use strict";
/**
 * TaskData 访问器
 * 提供 TaskData 的便捷访问接口
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskDataAccessor = void 0;
const DataLoader_1 = require("../loaders/DataLoader");
const DataSaver_1 = require("../savers/DataSaver");
/**
 * TaskData 访问器
 */
class TaskDataAccessor {
    static _instance;
    constructor() { }
    static get Instance() {
        if (!TaskDataAccessor._instance) {
            TaskDataAccessor._instance = new TaskDataAccessor();
        }
        return TaskDataAccessor._instance;
    }
    /**
     * 获取或创建 TaskData
     */
    async GetOrCreate(uid) {
        return DataLoader_1.DataLoader.Instance.GetOrCreate('task', uid);
    }
    /**
     * 获取 TaskData（不创建）
     */
    Get(uid) {
        return DataLoader_1.DataLoader.Instance.Get('task', uid);
    }
    /**
     * 保存 TaskData
     */
    async Save(data, throwOnError = false) {
        return DataSaver_1.DataSaver.Instance.Save('task', data, throwOnError);
    }
}
exports.TaskDataAccessor = TaskDataAccessor;
//# sourceMappingURL=TaskDataAccessor.js.map