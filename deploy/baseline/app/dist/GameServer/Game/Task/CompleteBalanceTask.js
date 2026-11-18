"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteBalanceTask = CompleteBalanceTask;
const CommitBalanceReward_1 = require("../Reward/CommitBalanceReward");
const TaskData_1 = require("../../../DataBase/models/TaskData");
const GoldCurrency_1 = require("../../../shared/protocol/GoldCurrency");
const Task96Buffer_1 = require("./Task96Buffer");
async function CompleteBalanceTask(player, taskId, reward) {
    await (0, CommitBalanceReward_1.CommitBalanceReward)(player, reward, async (driver, now) => {
        const rows = await driver.query('SELECT task_list, task_buffers FROM player_tasks WHERE owner_id = ?', [player.Uid]);
        if (!rows[0])
            throw new Error('Reward tasks missing');
        const list = JSON.parse(rows[0].task_list);
        const task = list[taskId];
        if (!task || (task.status !== TaskData_1.TaskStatus.ACCEPTED && task.status !== TaskData_1.TaskStatus.IN_PROGRESS)) {
            throw new Error('Balance task is not accepted');
        }
        const buffers = JSON.parse(rows[0].task_buffers);
        const buffer = buffers[taskId];
        if (taskId === 88 && ![85, 86, 87].every(id => list[id]?.status === TaskData_1.TaskStatus.COMPLETED)) {
            throw new Error('Task 88 requires completed onboarding steps');
        }
        if (taskId === 88)
            (0, GoldCurrency_1.GoldToWire)(player.Data.gold + (reward.gold ?? 0));
        if (taskId === 96) {
            const xinBytes = buffer?.xinBytes;
            let stages;
            if (xinBytes !== undefined) {
                if (!Array.isArray(xinBytes) || xinBytes.length !== 100 ||
                    xinBytes.some((n) => !Number.isInteger(n) || n < 0 || n > 0xff)) {
                    throw new Error('Invalid task 96 progress bytes');
                }
                stages = xinBytes;
            }
            else {
                stages = (0, Task96Buffer_1.DecodeKoseTaskBuffer)(buffer, 96);
            }
            if (![0, 1, 2].every(i => stages[i] === 1))
                throw new Error('Task 96 progress incomplete');
            if (!player.Data.hasNono || !(player.Data.nonoState & 2))
                throw new Error('Task 96 requires following NoNo');
            if (xinBytes !== undefined) {
                buffers[taskId] = { ...buffer, xinBytes: xinBytes.map((n, i) => i === 3 ? 1 : n) };
            }
            else {
                const normalized = { ...buffer };
                stages.forEach((byte, i) => { normalized[i] = byte; });
                normalized[3] = 1;
                buffers[taskId] = normalized;
            }
        }
        const completed = { ...task, status: TaskData_1.TaskStatus.COMPLETED, completeTime: now };
        list[taskId] = completed;
        const write = await driver.execute('UPDATE player_tasks SET task_list = ?, task_buffers = ? WHERE owner_id = ?', [JSON.stringify(list), JSON.stringify(buffers), player.Uid]);
        if (write.affectedRows !== 1)
            throw new Error('Reward tasks disappeared');
        return () => {
            player.TaskManager.TaskData.TaskList.set(taskId, completed);
            if (buffers[taskId])
                player.TaskManager.TaskData.TaskBuffers.set(taskId, buffers[taskId]);
        };
    });
}
//# sourceMappingURL=CompleteBalanceTask.js.map