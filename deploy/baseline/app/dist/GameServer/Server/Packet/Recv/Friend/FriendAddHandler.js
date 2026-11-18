"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendAddHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const FriendAddReqProto_1 = require("../../../../../shared/proto/packets/req/friend/FriendAddReqProto");
/**
 * 添加好友处理器
 * CMD 2151
 */
let FriendAddHandler = class FriendAddHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        // 使用 ReqProto 解析请求
        const req = new FriendAddReqProto_1.FriendAddReqProto();
        req.deserialize(body);
        // 调用 FriendManager 处理
        await player.FriendManager.HandleAddFriend(req.targetId);
    }
};
exports.FriendAddHandler = FriendAddHandler;
exports.FriendAddHandler = FriendAddHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.FRIEND_ADD, decorators_1.InjectType.NONE)
], FriendAddHandler);
//# sourceMappingURL=FriendAddHandler.js.map