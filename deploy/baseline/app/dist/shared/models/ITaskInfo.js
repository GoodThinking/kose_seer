"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskStatus = void 0;
exports.createDefaultTaskInfo = createDefaultTaskInfo;
exports.createDefaultTaskBuffer = createDefaultTaskBuffer;
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
 * 创建默认任务信息
 */
function createDefaultTaskInfo(userId, taskId) {
    return {
        userId,
        taskId,
        status: TaskStatus.NOT_ACCEPTED,
        acceptTime: 0,
        completeTime: 0,
    };
}
/**
 * 创建默认任务缓存
 */
function createDefaultTaskBuffer(userId, taskId, bufferIndex) {
    return {
        userId,
        taskId,
        bufferIndex,
        bufferValue: 0,
    };
}
//# sourceMappingURL=ITaskInfo.js.map