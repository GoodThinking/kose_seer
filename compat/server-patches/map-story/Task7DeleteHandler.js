'use strict';
const { Opcode, InjectType } = require('../../../../../shared/decorators/Opcode');
const { CommandID } = require('../../../../../shared/protocol/CommandID');
const { BaseProto } = require('../../../../../shared/proto/base/BaseProto');
const { Logger } = require('../../../../../shared/utils/Logger');
const { Abandon } = require('../../../../Game/Task/Task7');
class DeleteResponse extends BaseProto {
    constructor(taskId, result = 0) { super(CommandID.DELETE_TASK); this.taskId = taskId; this.setResult(result); }
    serialize() { const data = Buffer.alloc(4); data.writeUInt32BE(this.taskId); return data; }
}
class Task7DeleteHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        const taskId = body.length === 4 ? body.readUInt32BE(0) : 0;
        if (body.length !== 4) { await player.SendPacket(new DeleteResponse(0, 5001)); return; }
        if (taskId !== 7) return;
        try {
            await Abandon(player);
            await player.SendPacket(new DeleteResponse(taskId));
        } catch (error) {
            Logger.Error('[Task7DeleteHandler] failed', error);
            await player.SendPacket(new DeleteResponse(taskId, 5000));
        }
    }
}
Opcode(CommandID.DELETE_TASK, InjectType.NONE)(Task7DeleteHandler);
exports.Task7DeleteHandler = Task7DeleteHandler;
