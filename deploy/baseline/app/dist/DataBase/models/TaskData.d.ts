/**
 * 任务数据类
 * 直接映射数据库表，通过 DatabaseHelper 自动保存
 *
 * 特性：继承 BaseData，使用深度 Proxy 实现属性修改时自动保存到数据库
 */
import { BaseData } from './BaseData';
/**
 * 任务状态枚举
 */
export declare enum TaskStatus {
    NOT_ACCEPTED = 0,// 未接受
    ACCEPTED = 1,// 已接受
    IN_PROGRESS = 2,// 进行中
    COMPLETED = 3
}
/**
 * 单个任务信息
 */
export interface ITaskInfo {
    taskId: number;
    status: TaskStatus;
    acceptTime: number;
    completeTime: number;
}
/**
 * 任务缓存（每个任务5个缓存值）
 */
export interface ITaskBuffer {
    [index: number]: number;
}
/**
 * 任务数据（对应数据库表 tasks）
 *
 * 架构说明：
 * - 继承 BaseData，自动获得深度 Proxy 自动保存功能
 * - 通过 DatabaseHelper 统一管理加载和保存
 * - Map 类型不需要配置为数组字段，因为 Map 的 set/delete 操作会触发顶层属性变化
 */
export declare class TaskData extends BaseData {
    /** 用户ID（主键） */
    Uid: number;
    /** 任务列表（key: taskId） */
    TaskList: Map<number, ITaskInfo>;
    /** 任务缓存（key: taskId） */
    TaskBuffers: Map<number, ITaskBuffer>;
    constructor(uid: number);
    /**
     * 立即保存到数据库
     */
    save(): Promise<void>;
    /**
     * 从数据库行创建 TaskData
     */
    static FromRow(row: any): TaskData;
    /**
     * 转换为数据库行
     */
    ToRow(): any;
    /**
     * 获取任务信息
     */
    GetTask(taskId: number): ITaskInfo | undefined;
    /**
     * 接受任务
     */
    AcceptTask(taskId: number): void;
    /**
     * 完成任务
     */
    CompleteTask(taskId: number): void;
    /**
     * 检查任务是否已接受
     */
    IsTaskAccepted(taskId: number): boolean;
    /**
     * 检查任务是否已完成
     */
    IsTaskCompleted(taskId: number): boolean;
    /**
     * 获取任务缓存
     */
    GetTaskBuffer(taskId: number): ITaskBuffer;
    /**
     * 设置任务缓存值
     */
    SetTaskBufferValue(taskId: number, index: number, value: number): void;
    /**
     * 获取任务缓存值
     */
    GetTaskBufferValue(taskId: number, index: number): number;
    /**
     * 获取任务状态数组（用于登录响应）
     * 返回长度为 500 的数组，每个元素是任务状态（0=未接受, 1=已接受, 3=已完成）
     */
    GetTaskStatusArray(): number[];
}
//# sourceMappingURL=TaskData.d.ts.map