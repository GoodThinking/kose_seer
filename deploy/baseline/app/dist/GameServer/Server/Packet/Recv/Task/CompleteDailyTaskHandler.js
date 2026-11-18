"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompleteDailyTaskHandler = void 0;
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const CompleteTaskReqProto_1 = require("../../../../../shared/proto/packets/req/task/CompleteTaskReqProto");
const PacketCompleteTask_1 = require("../../Send/Task/PacketCompleteTask");
let CompleteDailyTaskHandler = class CompleteDailyTaskHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new CompleteTaskReqProto_1.CompleteTaskReqProto();
        req.deserialize(body);
        if (body.length !== 8 || req.taskId === 0) {
            await player.SendPacket(new PacketCompleteTask_1.PacketCompleteTask(req.taskId, 0, 0, [], 5001, CommandID_1.CommandID.COMPLETE_DAILY_TASK));
            return;
        }
        await player.TaskManager.CompleteTask(req.taskId, req.param, true);
    }
};
exports.CompleteDailyTaskHandler = CompleteDailyTaskHandler;
exports.CompleteDailyTaskHandler = CompleteDailyTaskHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.COMPLETE_DAILY_TASK, Opcode_1.InjectType.NONE)
], CompleteDailyTaskHandler);
//# sourceMappingURL=CompleteDailyTaskHandler.js.map