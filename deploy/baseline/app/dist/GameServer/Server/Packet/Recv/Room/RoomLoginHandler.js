"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomLoginHandler = void 0;
const IHandler_1 = require("../../IHandler");
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const RoomLoginReqProto_1 = require("../../../../../shared/proto/packets/req/room/RoomLoginReqProto");
const RoomLoginRspProto_1 = require("../../../../../shared/proto/packets/rsp/room/RoomLoginRspProto");
const EnterMapReqProto_1 = require("../../../../../shared/proto/packets/req/map/EnterMapReqProto");
const Logger_1 = require("../../../../../shared/utils/Logger");
const PacketBuilder_1 = require("../../../../../shared/protocol/PacketBuilder");
const RoomTicketBinding_1 = require("./RoomTicketBinding");
/**
 * 房间登录处理器
 * CMD 10001
 *
 * 玩家进入房间时的登录验证
 * 注意：房间连接是新的TCP连接，需要通过session关联到已有的Player
 *
 * 客户端流程：
 * 1. 连接roomSocket → 发送ROOM_LOGIN
 * 2. 收到ROOM_LOGIN响应后，客户端代码中缺少发送ENTER_MAP的逻辑
 * 3. 因此服务端在ROOM_LOGIN成功后，自动触发ENTER_MAP处理
 */
let RoomLoginHandler = class RoomLoginHandler {
    async Handle(session, head, body) {
        try {
            if (body.length !== 44) {
                session.Socket.write(new PacketBuilder_1.PacketBuilder().Build(CommandID_1.CommandID.ROOM_LOGIN, head.UserID, 5001));
                return;
            }
            const req = RoomLoginReqProto_1.RoomLoginReqProto.fromBuffer(body);
            // 从session中读取userId（前4字节）
            const userId = req.session.readUInt32BE(0);
            Logger_1.Logger.Info(`[RoomLoginHandler] 房间登录请求: userId=${userId}, roomId=${req.roomId}, ` +
                `mapType=${req.param1}, pos=(${req.param2}, ${req.param3})`);
            // Authenticate the whole ticket before binding the room connection or entering a map.
            const player = await RoomTicketBinding_1.RoomTicketBinding.Instance.Validate(session, head.UserID, req.roomId, req.session);
            if (!player || !RoomTicketBinding_1.RoomTicketBinding.Instance.CanBind(session, player, req.roomId, req.session)) {
                Logger_1.Logger.Warn(`[RoomLoginHandler] 房间认证未通过: userId=${userId}, roomId=${req.roomId}`);
                session.Socket.write(new PacketBuilder_1.PacketBuilder().Build(CommandID_1.CommandID.ROOM_LOGIN, head.UserID, 5001));
                return;
            }
            // 关联session到Player，并标记为ROOM类型
            session.UserID = userId;
            session.Player = player;
            session.Type = IHandler_1.SessionType.ROOM; // 标记为房间连接
            Logger_1.Logger.Info(`[RoomLoginHandler] 房间登录成功: userId=${userId}, roomId=${req.roomId}`);
            // 返回成功响应（空响应）
            const rsp = new RoomLoginRspProto_1.RoomLoginRspProto();
            session.Socket.write(new PacketBuilder_1.PacketBuilder().Build(CommandID_1.CommandID.ROOM_LOGIN, userId, rsp.getResult(), rsp.serialize()));
            // 自动触发ENTER_MAP处理
            // 因为客户端在ROOM_LOGIN后没有发送ENTER_MAP，服务端主动触发
            Logger_1.Logger.Info(`[RoomLoginHandler] 自动触发ENTER_MAP: mapType=${req.param1}, ` +
                `mapId=${req.roomId}, pos=(${req.param2}, ${req.param3})`);
            const enterMapReq = new EnterMapReqProto_1.EnterMapReqProto();
            enterMapReq.mapType = req.param1;
            enterMapReq.mapId = req.roomId;
            enterMapReq.x = req.param2;
            enterMapReq.y = req.param3;
            await player.MapManager.HandleEnterMap(enterMapReq);
        }
        catch (error) {
            Logger_1.Logger.Error(`[RoomLoginHandler] 处理失败`, error);
            session.Socket.write(new PacketBuilder_1.PacketBuilder().Build(CommandID_1.CommandID.ROOM_LOGIN, head.UserID, 5001));
        }
    }
};
exports.RoomLoginHandler = RoomLoginHandler;
exports.RoomLoginHandler = RoomLoginHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.ROOM_LOGIN, decorators_1.InjectType.NONE)
], RoomLoginHandler);
//# sourceMappingURL=RoomLoginHandler.js.map