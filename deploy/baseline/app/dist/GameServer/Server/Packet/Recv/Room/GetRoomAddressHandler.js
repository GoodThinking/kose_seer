"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetRoomAddressHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetRoomAddressReqProto_1 = require("../../../../../shared/proto/packets/req/room/GetRoomAddressReqProto");
const GetRoomAddressRspProto_1 = require("../../../../../shared/proto/packets/rsp/room/GetRoomAddressRspProto");
const Logger_1 = require("../../../../../shared/utils/Logger");
const PacketBuilder_1 = require("../../../../../shared/protocol/PacketBuilder");
const RoomTicketBinding_1 = require("./RoomTicketBinding");
/**
 * 获取房间地址处理器
 * CMD 10002
 *
 * 返回房间服务器的连接信息（session、IP、端口）
 * 注意：当前服务端未实现独立的房间服务器，返回主服务器信息
 */
let GetRoomAddressHandler = class GetRoomAddressHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        try {
            const req = GetRoomAddressReqProto_1.GetRoomAddressReqProto.fromBuffer(body);
            // 确定目标用户ID
            let targetUserId = req.targetUserId;
            if (targetUserId === 0 || !targetUserId) {
                targetUserId = player.Uid;
            }
            Logger_1.Logger.Info(`[GetRoomAddressHandler] 玩家 ${player.Uid} 获取房间地址: ` +
                `target=${targetUserId}`);
            // TODO: 实现独立的房间服务器
            // 当前返回主服务器信息，客户端会检测到是同一个服务器（isIlk=true）
            const sessionBuffer = await RoomTicketBinding_1.RoomTicketBinding.Instance.Issue(session, targetUserId);
            // 获取当前服务器IP和端口
            // TODO: 从配置读取
            const serverIp = 0x7F000001; // 127.0.0.1 的十六进制表示
            const serverPort = 9999;
            // 构建响应
            const rsp = new GetRoomAddressRspProto_1.GetRoomAddressRspProto();
            rsp.setAddress(sessionBuffer, serverIp, serverPort);
            await player.SendPacket(rsp);
            Logger_1.Logger.Debug(`[GetRoomAddressHandler] 返回房间地址: target=${targetUserId}, ` +
                `ip=127.0.0.1, port=${serverPort}`);
        }
        catch (error) {
            Logger_1.Logger.Error(`[GetRoomAddressHandler] 处理失败: uid=${player.Uid}`, error);
            session.Socket.write(new PacketBuilder_1.PacketBuilder().Build(CommandID_1.CommandID.GET_ROOM_ADDRES, session.UserID, 5001));
        }
    }
};
exports.GetRoomAddressHandler = GetRoomAddressHandler;
exports.GetRoomAddressHandler = GetRoomAddressHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.GET_ROOM_ADDRES, decorators_1.InjectType.NONE)
], GetRoomAddressHandler);
//# sourceMappingURL=GetRoomAddressHandler.js.map