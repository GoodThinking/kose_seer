"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeaveRoomHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const LeaveRoomReqProto_1 = require("../../../../../shared/proto/packets/req/room/LeaveRoomReqProto");
const LeaveRoomRspProto_1 = require("../../../../../shared/proto/packets/rsp/room/LeaveRoomRspProto");
const EnterMapReqProto_1 = require("../../../../../shared/proto/packets/req/map/EnterMapReqProto");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * 离开房间处理器
 * CMD 10003
 *
 * 玩家从房间地图离开，返回普通地图
 *
 * 客户端流程：
 * 1. 通过mainSocket发送LEAVE_ROOM
 * 2. 收到LEAVE_ROOM响应后，关闭roomSocket
 * 3. 客户端期望自动进入目标地图，但代码中缺少发送ENTER_MAP的逻辑
 * 4. 因此服务端在LEAVE_ROOM成功后，自动触发ENTER_MAP处理
 */
let LeaveRoomHandler = class LeaveRoomHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        try {
            const req = LeaveRoomReqProto_1.LeaveRoomReqProto.fromBuffer(body);
            Logger_1.Logger.Info(`[LeaveRoomHandler] 玩家 ${player.Uid} 离开房间: ` +
                `targetMapId=${req.mapId}, catchTime=${req.catchTime}`);
            // 返回空响应
            const rsp = new LeaveRoomRspProto_1.LeaveRoomRspProto();
            await player.SendPacket(rsp);
            Logger_1.Logger.Info(`[LeaveRoomHandler] 离开房间成功: uid=${player.Uid}`);
            // 自动触发ENTER_MAP处理
            // 因为客户端在LEAVE_ROOM后没有发送ENTER_MAP，服务端主动触发
            if (req.mapId > 0) {
                Logger_1.Logger.Info(`[LeaveRoomHandler] 自动触发ENTER_MAP: mapId=${req.mapId}`);
                const enterMapReq = new EnterMapReqProto_1.EnterMapReqProto();
                enterMapReq.mapType = 0; // 普通地图类型
                enterMapReq.mapId = req.mapId;
                enterMapReq.x = 500; // 默认坐标
                enterMapReq.y = 300;
                await player.MapManager.HandleEnterMap(enterMapReq);
            }
        }
        catch (error) {
            Logger_1.Logger.Error(`[LeaveRoomHandler] 处理失败: uid=${player.Uid}`, error);
            // 发生错误时也返回空响应
            const rsp = new LeaveRoomRspProto_1.LeaveRoomRspProto();
            await player.SendPacket(rsp);
        }
    }
};
exports.LeaveRoomHandler = LeaveRoomHandler;
exports.LeaveRoomHandler = LeaveRoomHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.LEAVE_ROOM, decorators_1.InjectType.NONE)
], LeaveRoomHandler);
//# sourceMappingURL=LeaveRoomHandler.js.map