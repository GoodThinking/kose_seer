"use strict";
/**
 * 任务数据类
 * 直接映射数据库表，通过 DatabaseHelper 自动保存
 *
 * 特性：继承 BaseData，使用深度 Proxy 实现属性修改时自动保存到数据库
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskData = exports.TaskStatus = void 0;
const DatabaseHelper_1 = require("../DatabaseHelper");
const Logger_1 = require("../../shared/utils/Logger");
const BaseData_1 = require("./BaseData");
/**
 * 任务状态枚举
 */
var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["NOT_ACCEPTED"] = 0] = "NOT_ACCEPTED";
    TaskStatus[TaskStatus["ACCEPTED"] = 1] = "ACCEPTED";
    TaskStatus[TaskStatus["IN_PROGRESS"] = 2] = "IN_PROGRESS";
    TaskStatus[TaskStatus["COMPLETED"] = 3] = "COMPLETED";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
/**
 * 任务数据（对应数据库表 tasks）
 *
 * 架构说明：
 * - 继承 BaseData，自动获得深度 Proxy 自动保存功能
 * - 通过 DatabaseHelper 统一管理加载和保存
 * - Map 类型不需要配置为数组字段，因为 Map 的 set/delete 操作会触发顶层属性变化
 */
class TaskData extends BaseData_1.BaseData {
    /** 用户ID（主键） */
    Uid;
    /** 任务列表（key: taskId） */
    TaskList = new Map();
    /** 任务缓存（key: taskId） */
    TaskBuffers = new Map();
    constructor(uid) {
        if (!uid || uid === 0) {
            throw new Error(`[TaskData] Invalid uid: ${uid}`);
        }
        // 调用父类构造函数
        // Map 类型不需要配置为数组字段
        super(uid, [], // 额外的黑名单字段
        [] // 数组字段（Map 不需要深度监听）
        );
        this.Uid = uid;
        // 返回 Proxy 包装的对象，实现自动保存
        return this.createProxy(this);
    }
    /**
     * 立即保存到数据库
     */
    async save() {
        try {
            await DatabaseHelper_1.DatabaseHelper.Instance.SaveTaskData(this);
            Logger_1.Logger.Debug(`[TaskData] 自动保存成功: uid=${this.Uid}`);
        }
        catch (error) {
            Logger_1.Logger.Error(`[TaskData] 自动保存失败: uid=${this.Uid}`, error);
        }
    }
    /**
     * 从数据库行创建 TaskData
     */
    static FromRow(row) {
        const data = new TaskData(row.owner_id);
        // 解析 JSON 字段
        if (row.task_list) {
            const taskListObj = JSON.parse(row.task_list);
            data.TaskList = new Map(Object.entries(taskListObj).map(([k, v]) => [parseInt(k), v]));
        }
        if (row.task_buffers) {
            const buffersObj = JSON.parse(row.task_buffers);
            data.TaskBuffers = new Map(Object.entries(buffersObj).map(([k, v]) => [parseInt(k), v]));
        }
        return data;
    }
    /**
     * 转换为数据库行
     */
    ToRow() {
        // 将 Map 转换为普通对象
        const taskListObj = {};
        this.TaskList.forEach((value, key) => {
            taskListObj[key] = value;
        });
        const buffersObj = {};
        this.TaskBuffers.forEach((value, key) => {
            buffersObj[key] = value;
        });
        return {
            owner_id: this.Uid,
            task_list: JSON.stringify(taskListObj),
            task_buffers: JSON.stringify(buffersObj)
        };
    }
    /**
     * 获取任务信息
     */
    GetTask(taskId) {
        return this.TaskList.get(taskId);
    }
    /**
     * 接受任务
     */
    AcceptTask(taskId) {
        const task = {
            taskId,
            status: TaskStatus.ACCEPTED,
            acceptTime: Math.floor(Date.now() / 1000),
            completeTime: 0
        };
        this.TaskList.set(taskId, task);
        // 自动触发保存（通过 Proxy）
    }
    /**
     * 完成任务
     */
    CompleteTask(taskId) {
        const task = this.TaskList.get(taskId);
        if (task) {
            task.status = TaskStatus.COMPLETED;
            task.completeTime = Math.floor(Date.now() / 1000);
            // 自动触发保存（通过 Proxy）
        }
    }
    /**
     * 检查任务是否已接受
     */
    IsTaskAccepted(taskId) {
        const task = this.TaskList.get(taskId);
        return task !== undefined && task.status !== TaskStatus.NOT_ACCEPTED;
    }
    /**
     * 检查任务是否已完成
     */
    IsTaskCompleted(taskId) {
        const task = this.TaskList.get(taskId);
        return task !== undefined && task.status === TaskStatus.COMPLETED;
    }
    /**
     * 获取任务缓存
     */
    GetTaskBuffer(taskId) {
        let buffer = this.TaskBuffers.get(taskId);
        if (!buffer) {
            buffer = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
            this.TaskBuffers.set(taskId, buffer);
        }
        return buffer;
    }
    /**
     * 设置任务缓存值
     */
    SetTaskBufferValue(taskId, index, value) {
        const buffer = this.GetTaskBuffer(taskId);
        buffer[index] = value;
        // 自动触发保存（通过 Proxy）
    }
    /**
     * 保存 XIN 客户端传来的原始任务缓存区。
     *
     * XIN 的 2204 请求以 taskId 后的整个 ByteArray 为缓存内容；不能把它
     * 拆成 KOSE 旧路径中的 index/value。仍使用既有 JSON 列来持久化每个字节，
     * 因而不需要数据库结构迁移。
     */
    SetTaskBufferBytes(taskId, bytes) {
        const buffer = { ...this.TaskBuffers.get(taskId), xinBytes: Array.from(bytes) };
        this.TaskBuffers.set(taskId, buffer);
    }
    /**
     * 读取 XIN 原始任务缓存区。旧的五个 UInt32 缓存不具备逐字节语义，
     * 因此不会被猜测性迁移到 XIN 格式。
     */
    GetTaskBufferBytes(taskId, length) {
        const buffer = this.TaskBuffers.get(taskId);
        if (!buffer?.xinBytes) {
            return Buffer.alloc(length);
        }
        if (buffer.xinBytes.length !== length ||
            buffer.xinBytes.some(value => !Number.isInteger(value) || value < 0 || value > 0xff)) {
            throw new Error('Invalid persisted XIN task buffer');
        }
        return Buffer.from(buffer.xinBytes);
    }
    /**
     * 获取任务缓存值
     */
    GetTaskBufferValue(taskId, index) {
        const buffer = this.GetTaskBuffer(taskId);
        return buffer[index] || 0;
    }
    /**
     * 获取任务状态数组（用于登录响应）
     * 返回长度为 500 的数组，每个元素是任务状态（0=未接受, 1=已接受, 3=已完成）
     */
    GetTaskStatusArray() {
        const statusArray = new Array(500).fill(0);
        this.TaskList.forEach((task, taskId) => {
            if (taskId > 0 && taskId <= 500) {
                // 客户端任务状态: 0=未接受, 1=已接受, 3=已完成
                if (task.status === TaskStatus.COMPLETED) {
                    statusArray[taskId - 1] = 3;
                }
                else if (task.status >= TaskStatus.ACCEPTED) {
                    statusArray[taskId - 1] = 1; // 客户端期望的是 1，不是 2
                }
            }
        });
        return statusArray;
    }
}
exports.TaskData = TaskData;
//# sourceMappingURL=TaskData.js.map