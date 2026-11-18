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
 * 任务信息接口
 */
export interface ITaskInfo {
    id?: number;
    userId: number;
    taskId: number;
    status: TaskStatus;
    acceptTime: number;
    completeTime: number;
}
/**
 * 任务缓存接口
 */
export interface ITaskBuffer {
    id?: number;
    userId: number;
    taskId: number;
    bufferIndex: number;
    bufferValue: number;
}
/**
 * 任务数据库行接口
 */
export interface ITaskRow {
    id: number;
    userId: number;
    taskId: number;
    status: number;
    acceptTime: number;
    completeTime: number;
}
/**
 * 任务缓存数据库行接口
 */
export interface ITaskBufferRow {
    id: number;
    userId: number;
    taskId: number;
    bufferIndex: number;
    bufferValue: number;
}
/**
 * 创建默认任务信息
 */
export declare function createDefaultTaskInfo(userId: number, taskId: number): ITaskInfo;
/**
 * 创建默认任务缓存
 */
export declare function createDefaultTaskBuffer(userId: number, taskId: number, bufferIndex: number): ITaskBuffer;
//# sourceMappingURL=ITaskInfo.d.ts.map