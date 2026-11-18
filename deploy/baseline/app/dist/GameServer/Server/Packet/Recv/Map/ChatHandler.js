"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const ChatReqProto_1 = require("../../../../../shared/proto/packets/req/map/ChatReqProto");
/**
 * 聊天处理器
 * CMD 1014
 */
let ChatHandler = class ChatHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = ChatReqProto_1.ChatReqProto.fromBuffer(body);
        await player.MapActionManager.HandleMapChat(req);
    }
};
exports.ChatHandler = ChatHandler;
exports.ChatHandler = ChatHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.CHAT, decorators_1.InjectType.NONE)
], ChatHandler);
//# sourceMappingURL=ChatHandler.js.map