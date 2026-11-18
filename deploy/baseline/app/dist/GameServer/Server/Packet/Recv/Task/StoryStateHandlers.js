"use strict";
const { Opcode, InjectType } = require("../../../../../shared/decorators/Opcode");
const { BaseProto } = require("../../../../../shared/proto/base/BaseProto");
const { Logger } = require("../../../../../shared/utils/Logger");
const { SaveTaskBuffer } = require("../../../../Game/Task/SaveTaskState");

// Task 0 is not a playable quest (2203 rejects it). Its buffer stores the
// original client's 1600 persistent story-record bits, outside quest stages.
const RECORD_BUFFER_ID = 0;
const RECORD_BYTES = 200;

class StoryStatePacket extends BaseProto {
    constructor(command, payload = Buffer.alloc(0), result = 0) {
        super(command);
        this.payload = payload;
        this.setResult(result);
    }
    serialize() {
        return this.payload;
    }
}

function recordBytes(tasks) {
    const stored = tasks.TaskBuffers.get(RECORD_BUFFER_ID)?.storyRecordBytes;
    return stored === undefined ? Buffer.alloc(RECORD_BYTES) : Buffer.from(stored);
}

class StoryStatusHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        const count = body.length >= 8 ? body.readUInt32BE(4) : 0;
        if (body.length < 8 || body.readUInt32BE(0) !== 5 ||
            count === 0 || count > 256 || body.length !== 8 + count * 4) {
            await player.SendPacket(new StoryStatePacket(50008, undefined, 5001));
            return;
        }
        const tasks = player.TaskManager.TaskData;
        const records = recordBytes(tasks);
        if (records.length !== RECORD_BYTES) {
            Logger.Error(`[StoryStatusHandler] Invalid story record length: uid=${player.Uid}`);
            await player.SendPacket(new StoryStatePacket(50008, undefined, 5000));
            return;
        }
        const payload = Buffer.alloc(8 + count * 8 + RECORD_BYTES);
        payload.writeUInt32BE(5, 0);
        payload.writeUInt32BE(count, 4);
        for (let i = 0; i < count; i++) {
            const taskId = body.readUInt32BE(8 + i * 4);
            const status = tasks.GetTask(taskId)?.status || 0;
            payload.writeUInt32BE(taskId, 8 + i * 8);
            // Native TasksManager uses 1 for both accepted and in-progress.
            payload.writeUInt32BE(status === 2 ? 1 : status, 12 + i * 8);
        }
        records.copy(payload, 8 + count * 8);
        await player.SendPacket(new StoryStatePacket(50008, payload));
    }
}

class StoryBufferRecordHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        const count = body.length >= 4 ? body.readUInt32BE(0) : 0;
        if (count === 0 || count > RECORD_BYTES * 8 || body.length !== 4 + count * 8) {
            await player.SendPacket(new StoryStatePacket(1013, undefined, 5001));
            return;
        }
        for (let i = 0; i < count; i++) {
            if (body.readUInt32BE(4 + i * 8) >= RECORD_BYTES * 8 ||
                body.readUInt32BE(8 + i * 8) > 1) {
                await player.SendPacket(new StoryStatePacket(1013, undefined, 5001));
                return;
            }
        }
        try {
            await SaveTaskBuffer(player.TaskManager.TaskData, RECORD_BUFFER_ID, current => {
                const bytes = current?.storyRecordBytes === undefined
                    ? Buffer.alloc(RECORD_BYTES) : Buffer.from(current.storyRecordBytes);
                if (bytes.length !== RECORD_BYTES) throw new Error("Invalid story record length");
                for (let i = 0; i < count; i++) {
                    const index = body.readUInt32BE(4 + i * 8);
                    const mask = 1 << (index % 8);
                    if (body.readUInt32BE(8 + i * 8) === 1) bytes[index >>> 3] |= mask;
                    else bytes[index >>> 3] &= ~mask;
                }
                return { ...current, storyRecordBytes: Array.from(bytes) };
            });
        } catch (error) {
            Logger.Error(`[StoryBufferRecordHandler] Failed: uid=${player.Uid}`, error);
            await player.SendPacket(new StoryStatePacket(1013, undefined, 5000));
            return;
        }
        await player.SendPacket(new StoryStatePacket(1013));
    }
}

Opcode(50008, InjectType.NONE)(StoryStatusHandler);
Opcode(1013, InjectType.NONE)(StoryBufferRecordHandler);
module.exports = { StoryStatusHandler, StoryBufferRecordHandler };
