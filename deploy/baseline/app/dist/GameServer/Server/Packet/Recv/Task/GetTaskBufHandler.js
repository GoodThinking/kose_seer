"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetTaskBufHandler = void 0;
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetTaskBufReqProto_1 = require("../../../../../shared/proto/packets/req/task/GetTaskBufReqProto");
const PacketGetTaskBuf_1 = require("../../../Packet/Send/Task/PacketGetTaskBuf");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * 获取任务缓存处理器
 * CMD 2203: GET_TASK_BUF
 */
let GetTaskBufHandler = class GetTaskBufHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new GetTaskBufReqProto_1.GetTaskBufReqProto();
        req.deserialize(body);
        const taskId = req.taskId;
        try {
            if (player.ClientProtocol === 'xin-20261013' && (body.length !== 4 || taskId === 0)) {
                await player.SendPacket(new PacketGetTaskBuf_1.PacketGetTaskBuf(taskId, [], undefined, 5001));
                return;
            }
            Logger_1.Logger.Debug(`[GetTaskBufHandler] 用户 ${player.Uid} 获取任务 ${taskId} 的缓存`);
            // 获取任务缓存（调用 Manager 方法）
            const bufferValues = player.ClientProtocol === 'xin-20261013'
                ? []
                : player.TaskManager.GetTaskBuffer(taskId);
            const rawBuffer = player.ClientProtocol === 'xin-20261013'
                ? player.TaskManager.GetTaskBufferBytes(taskId, 100)
                : undefined;
            // 发送响应
            await player.SendPacket(new PacketGetTaskBuf_1.PacketGetTaskBuf(taskId, bufferValues, rawBuffer));
            Logger_1.Logger.Debug(`[GetTaskBufHandler] 发送任务 ${taskId} 的缓存成功`);
        }
        catch (error) {
            Logger_1.Logger.Error(`[GetTaskBufHandler] 失败: taskId=${taskId}`, error);
            await player.SendPacket(new PacketGetTaskBuf_1.PacketGetTaskBuf(taskId, [0, 0, 0, 0, 0], undefined, 5000));
        }
    }
};
exports.GetTaskBufHandler = GetTaskBufHandler;
exports.GetTaskBufHandler = GetTaskBufHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.GET_TASK_BUF, Opcode_1.InjectType.NONE)
], GetTaskBufHandler);
//# sourceMappingURL=GetTaskBufHandler.js.map