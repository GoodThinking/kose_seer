"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SaveAcceptedTask = SaveAcceptedTask;
exports.SaveFinishedTask = SaveFinishedTask;
exports.SaveCompletedTask = SaveCompletedTask;
exports.SaveTaskBuffer = SaveTaskBuffer;
exports.EnsureDailyTaskDay = EnsureDailyTaskDay;
exports.SaveAcceptedDailyTask = SaveAcceptedDailyTask;
exports.DeleteDailyTask = DeleteDailyTask;
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
const TaskData_1 = require("../../../DataBase/models/TaskData");
async function SaveTaskColumn(tasks, column, stage) {
    await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
        const candidate = stage();
        await driver.beginTransaction();
        let committed = false;
        try {
            const result = await driver.execute(`UPDATE player_tasks SET ${column} = ? WHERE owner_id = ?`, [candidate.value, tasks.Uid]);
            if (result.affectedRows !== 1)
                throw new Error('Task data missing');
            await driver.commit();
            committed = true;
            // Publish before releasing the connection; queued saves see only committed state.
            candidate.publish();
        }
        catch (error) {
            if (!committed)
                await driver.rollback();
            throw error;
        }
    });
}
/** Accept without exposing an unpersisted task to readers or queued auto-saves. */
async function SaveAcceptedTask(tasks, taskId) {
    await SaveTaskColumn(tasks, 'task_list', () => {
        // The handler's check may precede another queued acceptance.
        if (tasks.IsTaskAccepted(taskId))
            throw new Error('Task already accepted');
        const accepted = {
            taskId, status: TaskData_1.TaskStatus.ACCEPTED,
            acceptTime: Math.floor(Date.now() / 1000), completeTime: 0
        };
        const staged = { ...JSON.parse(tasks.ToRow().task_list), [taskId]: accepted };
        return { value: JSON.stringify(staged), publish: () => { tasks.TaskList.set(taskId, accepted); } };
    });
}
/** Mark a task finished even if it was never accepted. The pioneer panel reads task 301 this way. */
async function SaveFinishedTask(tasks, taskId) {
    if (tasks.GetTask(taskId)?.status === TaskData_1.TaskStatus.COMPLETED)
        return;
    await SaveTaskColumn(tasks, 'task_list', () => {
        const existing = tasks.GetTask(taskId);
        const completed = {
            taskId,
            status: TaskData_1.TaskStatus.COMPLETED,
            acceptTime: existing?.acceptTime || Math.floor(Date.now() / 1000),
            completeTime: Math.floor(Date.now() / 1000),
        };
        const staged = { ...JSON.parse(tasks.ToRow().task_list), [taskId]: completed };
        return { value: JSON.stringify(staged), publish: () => { tasks.TaskList.set(taskId, completed); } };
    });
}
/** Complete a task with no rewards; publish only the committed task entry. */
async function SaveCompletedTask(tasks, taskId) {
    await SaveTaskColumn(tasks, 'task_list', () => {
        const task = tasks.GetTask(taskId);
        if (!task || (task.status !== TaskData_1.TaskStatus.ACCEPTED && task.status !== TaskData_1.TaskStatus.IN_PROGRESS)) {
            throw new Error('Task is not pending completion');
        }
        const completed = {
            ...task, status: TaskData_1.TaskStatus.COMPLETED, completeTime: Math.floor(Date.now() / 1000)
        };
        const staged = { ...JSON.parse(tasks.ToRow().task_list), [taskId]: completed };
        return { value: JSON.stringify(staged), publish: () => { tasks.TaskList.set(taskId, completed); } };
    });
}
/** Build the next buffer only after entering the shared connection queue. */
async function SaveTaskBuffer(tasks, taskId, update) {
    await SaveTaskColumn(tasks, 'task_buffers', () => {
        const buffer = update(tasks.TaskBuffers.get(taskId));
        const staged = { ...JSON.parse(tasks.ToRow().task_buffers), [taskId]: buffer };
        return { value: JSON.stringify(staged), publish: () => { tasks.TaskBuffers.set(taskId, buffer); } };
    });
}
/** Reset one daily task at the China Standard Time calendar-day boundary. */
async function EnsureDailyTaskDay(tasks, taskId, day) {
    if (tasks.TaskBuffers.get(taskId)?.dailyDay === day)
        return;
    await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
        let committed = false;
        await driver.beginTransaction();
        try {
            const rows = await driver.query('SELECT task_list, task_buffers FROM player_tasks WHERE owner_id = ?', [tasks.Uid]);
            if (!rows[0])
                throw new Error('Daily task data missing');
            const list = JSON.parse(rows[0].task_list);
            const buffers = JSON.parse(rows[0].task_buffers);
            if (buffers[taskId]?.dailyDay !== day) {
                delete list[taskId];
                buffers[taskId] = { dailyDay: day };
                const write = await driver.execute('UPDATE player_tasks SET task_list = ?, task_buffers = ? WHERE owner_id = ?', [JSON.stringify(list), JSON.stringify(buffers), tasks.Uid]);
                if (write.affectedRows !== 1)
                    throw new Error('Daily task data disappeared');
            }
            await driver.commit();
            committed = true;
            tasks.TaskList.delete(taskId);
            tasks.TaskBuffers.set(taskId, buffers[taskId]);
        }
        catch (error) {
            if (!committed)
                await driver.rollback();
            throw error;
        }
    });
}
async function SaveAcceptedDailyTask(tasks, taskId, day) {
    await EnsureDailyTaskDay(tasks, taskId, day);
    await SaveAcceptedTask(tasks, taskId);
}
async function DeleteDailyTask(tasks, taskId, day) {
    await EnsureDailyTaskDay(tasks, taskId, day);
    await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
        let committed = false;
        await driver.beginTransaction();
        try {
            const rows = await driver.query('SELECT task_list, task_buffers FROM player_tasks WHERE owner_id = ?', [tasks.Uid]);
            if (!rows[0])
                throw new Error('Daily task data missing');
            const list = JSON.parse(rows[0].task_list);
            const buffers = JSON.parse(rows[0].task_buffers);
            const task = list[taskId];
            if (!task || task.status === TaskData_1.TaskStatus.COMPLETED)
                throw new Error('Daily task is not active');
            delete list[taskId];
            buffers[taskId] = { dailyDay: day };
            const write = await driver.execute('UPDATE player_tasks SET task_list = ?, task_buffers = ? WHERE owner_id = ?', [JSON.stringify(list), JSON.stringify(buffers), tasks.Uid]);
            if (write.affectedRows !== 1)
                throw new Error('Daily task data disappeared');
            await driver.commit();
            committed = true;
            tasks.TaskList.delete(taskId);
            tasks.TaskBuffers.set(taskId, buffers[taskId]);
        }
        catch (error) {
            if (!committed)
                await driver.rollback();
            throw error;
        }
    });
}
//# sourceMappingURL=SaveTaskState.js.map