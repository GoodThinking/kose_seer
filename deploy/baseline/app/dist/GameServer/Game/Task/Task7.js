'use strict';
const { DatabaseManager } = require('../../../DataBase/DatabaseManager');
const { TaskStatus } = require('../../../DataBase/models/TaskData');
const { SaveTaskBuffer } = require('./SaveTaskState');
const { DecodeTask96Buffer } = require('./Task96Buffer');

function bytes(buffer) {
    if (!buffer) return new Array(20).fill(0);
    if (buffer.xinBytes !== undefined) {
        if (!Array.isArray(buffer.xinBytes) || buffer.xinBytes.length !== 100 || buffer.xinBytes.some(n => !Number.isInteger(n) || n < 0 || n > 255)) throw new Error('Invalid persisted task buffer');
        return buffer.xinBytes.slice();
    }
    return DecodeTask96Buffer(buffer);
}
function write(player, incoming, xin) {
    if (incoming.length !== (xin ? 100 : 20)) throw new Error('Invalid task 7 buffer length');
    const tasks = player.TaskManager.TaskData;
    return SaveTaskBuffer(tasks, 7, current => {
        const task = tasks.GetTask(7);
        if (!task || (task.status !== TaskStatus.ACCEPTED && task.status !== TaskStatus.IN_PROGRESS)) throw new Error('Task 7 is not active');
        const previous = bytes(current);
        for (let i = 0; i < 2; i++) {
            if ((previous[i] !== 0 && previous[i] !== 1) || (incoming[i] !== 0 && incoming[i] !== 1))
                throw new Error('Invalid task 7 material progress');
        }
        const newlyCollected = [0, 1].filter(i => previous[i] === 0 && incoming[i] === 1);
        if (newlyCollected.length > 1) throw new Error('Collect task 7 materials separately');
        if (newlyCollected[0] === 0 && player.Data.mapID !== 12)
            throw new Error('Plant fibre must be collected on map 12');
        if (newlyCollected[0] === 1 &&
            (player.Data.mapID !== 17 || !player.Data.clothIds.includes(100014)))
            throw new Error('Fire crystal requires map 17 and the equipped drill');
        const next = Array.from(incoming);
        if (current) for (let i = 2; i < Math.min(previous.length, next.length); i++) next[i] = previous[i];
        for (let i = 0; i < 2; i++) if (previous[i] === 1) next[i] = 1;
        // Stage two is awarded only in the completion transaction.
        next[2] = previous[2] || 0;
        if (xin) return { ...current, xinBytes: next };
        const result = { ...current, ...next };
        if (current?.xinBytes) result.xinBytes = [...next, ...current.xinBytes.slice(20)];
        return result;
    });
}
function validateCompletion(player, buffers) {
    const stage = bytes(buffers[7]);
    if (player.Data.mapID !== 8 || stage[0] !== 1 || stage[1] !== 1) throw new Error('Task 7 requires both materials and Xixi in map 8');
    const buffer = buffers[7];
    if (buffer.xinBytes) buffer.xinBytes[2] = 1;
    else {
        stage[2] = 1;
        buffers[7] = { ...buffer, ...stage };
    }
}
async function abandon(player) {
    const tasks = player.TaskManager.TaskData;
    await DatabaseManager.Instance.WithConnection(async driver => {
        let committed = false;
        await driver.beginTransaction();
        try {
            const lock = DatabaseManager.Instance.DatabaseType === 'mysql' ? ' FOR UPDATE' : '';
            const rows = await driver.query('SELECT task_list, task_buffers FROM player_tasks WHERE owner_id = ?' + lock, [player.Uid]);
            if (!rows[0]) throw new Error('Task data missing');
            const list = JSON.parse(rows[0].task_list), buffers = JSON.parse(rows[0].task_buffers);
            const task = list[7];
            if (!task || (task.status !== TaskStatus.ACCEPTED && task.status !== TaskStatus.IN_PROGRESS)) throw new Error('Task 7 is not active');
            delete list[7];
            delete buffers[7];
            const result = await driver.execute('UPDATE player_tasks SET task_list = ?, task_buffers = ? WHERE owner_id = ?', [JSON.stringify(list), JSON.stringify(buffers), player.Uid]);
            if (result.affectedRows !== 1) throw new Error('Task data disappeared');
            await driver.commit();
            committed = true;
            tasks.TaskList.delete(7);
            tasks.TaskBuffers.delete(7);
        } catch (error) {
            if (!committed) await driver.rollback();
            throw error;
        }
    });
}
module.exports = {
    WriteProgress: (player, data) => write(player, data, false),
    WriteBuffer: (player, data) => write(player, data, true),
    ReadProgress: player => bytes(player.TaskManager.TaskData.TaskBuffers.get(7)).slice(0, 20),
    ReadBuffer: (player, length) => {
        const result = Buffer.alloc(length);
        Buffer.from(bytes(player.TaskManager.TaskData.TaskBuffers.get(7))).copy(result, 0, 0, length);
        return result;
    },
    ValidateCompletion: validateCompletion,
    Abandon: abandon,
};
