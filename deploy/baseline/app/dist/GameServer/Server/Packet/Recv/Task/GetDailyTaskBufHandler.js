"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDailyTaskBufHandler = void 0;
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketGetDailyTaskBuf_1 = require("../../../Packet/Send/Task/PacketGetDailyTaskBuf");
const GetTaskBufReqProto_1 = require("../../../../../shared/proto/packets/req/task/GetTaskBufReqProto");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * 获取每日任务缓存处理器
 * CMD 2234: GET_DAILY_TASK_BUF
 */
let GetDailyTaskBufHandler = class GetDailyTaskBufHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new GetTaskBufReqProto_1.GetTaskBufReqProto();
        req.deserialize(body);
        try {
            if (body.length !== 4 || req.taskId === 0) {
                await player.SendPacket(new PacketGetDailyTaskBuf_1.PacketGetDailyTaskBuf(req.taskId, new Array(20).fill(0), 5001));
                return;
            }
            await player.TaskManager.EnsureDailyTaskDay(req.taskId);
            const buffers = player.TaskManager.GetTaskBuffer(req.taskId);
            await player.SendPacket(new PacketGetDailyTaskBuf_1.PacketGetDailyTaskBuf(req.taskId, buffers));
        }
        catch (error) {
            Logger_1.Logger.Error(`[GetDailyTaskBufHandler] 失败: taskId=${req.taskId}`, error);
            await player.SendPacket(new PacketGetDailyTaskBuf_1.PacketGetDailyTaskBuf(req.taskId, new Array(20).fill(0), 5000));
        }
    }
};
exports.GetDailyTaskBufHandler = GetDailyTaskBufHandler;
exports.GetDailyTaskBufHandler = GetDailyTaskBufHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.GET_DAILY_TASK_BUF, Opcode_1.InjectType.NONE)
], GetDailyTaskBufHandler);
//# sourceMappingURL=GetDailyTaskBufHandler.js.map