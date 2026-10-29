'use strict';
const { SaveTaskBuffer } = require('../Task/SaveTaskState');
const { DecodeTask96Buffer } = require('../Task/Task96Buffer');

function stages(buffer) {
    return Array.from(buffer?.xinBytes ?? DecodeTask96Buffer(buffer || {}));
}
function pending(player) {
    const tasks = player.TaskManager.TaskData;
    if (!tasks.IsTaskAccepted(131) || tasks.IsTaskCompleted(131)) throw new Error('Training quest is not active');
    return tasks;
}
function merge(buffer, bytes) {
    const next = { ...buffer, xinBytes: bytes };
    bytes.forEach((value, index) => { next[index] = value; });
    return next;
}
async function writeProgress(player, bytes) {
    const tasks = pending(player), submitted = Array.from(bytes);
    if (submitted.length < 4 || submitted.some(value => value !== 0 && value !== 1)) throw new Error('Invalid training quest stages');
    await SaveTaskBuffer(tasks, 131, buffer => {
        pending(player);
        const current = stages(buffer), next = current.slice();
        while (next.length < submitted.length) next.push(0);
        let changed = 0;
        for (let i = 0; i < submitted.length; i++) {
            if (submitted[i] === (current[i] || 0)) continue;
            if (i >= 3 || current[i] === 1 || submitted[i] !== 1 || ++changed > 1) throw new Error('Training stages must advance once in order');
            for (let prior = 0; prior < i; prior++) if (current[prior] !== 1) throw new Error('Previous training stage incomplete');
            if (i === 0 && player.Data.mapID !== 100) throw new Error('Meet the training AI in map100');
            if (i === 1 && player.Data.mapID !== 336) throw new Error('Read the original training panel in map336');
            // Stage two is written only by RecordVictory. A client may echo its already earned bit.
            if (i === 2) throw new Error('Win a native training battle first');
            next[i] = 1;
        }
        return merge(buffer, next);
    });
}
async function writeValue(player, index, value) {
    const buffer = stages(player.TaskManager.TaskData.TaskBuffers.get(131));
    while (buffer.length < 5) buffer.push(0);
    buffer[index] = value;
    return writeProgress(player, buffer);
}
async function recordVictory(player, battle) {
    const tasks = player.TaskManager.TaskData;
    if (battle.mapId !== 337 || battle.phase !== 'settling' || battle.winner !== 1 || battle.cancelReason ||
        !tasks.IsTaskAccepted(131) || tasks.IsTaskCompleted(131)) return;
    await SaveTaskBuffer(tasks, 131, buffer => {
        const current = stages(buffer);
        if (current[0] !== 1 || current[1] !== 1 || tasks.IsTaskCompleted(131)) return buffer || {};
        while (current.length < 100) current.push(0);
        current[2] = 1;
        return { ...merge(buffer, current), nativeTrainingVictory: true };
    });
}
function validateCompletion(player, buffers) {
    const buffer = buffers[131], bytes = stages(buffer);
    if (player.Data.mapID !== 102 || buffer?.nativeTrainingVictory !== true || bytes[0] !== 1 || bytes[1] !== 1 || bytes[2] !== 1) {
        throw new Error('Finish native training, then report to Justin');
    }
}
module.exports = { ReadProgress: player => stages(player.TaskManager.TaskData.TaskBuffers.get(131)).slice(0, 20),
    WriteProgress: writeProgress, WriteValue: writeValue, RecordVictory: recordVictory,
    ValidateCompletion: validateCompletion };
