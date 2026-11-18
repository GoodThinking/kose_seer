"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetImageAddressHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PacketGetImageAddress_1 = require("../../Send/System/PacketGetImageAddress");
/**
 * [CMD: 1005 GET_IMAGE_ADDRESS] 获取图片服务器地址
 * 简单逻辑，直接在 Handler 中处理
 */
let GetImageAddressHandler = class GetImageAddressHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        await player.SendPacket(new PacketGetImageAddress_1.PacketGetImageAddress('127.0.0.1', 80, ''));
    }
};
exports.GetImageAddressHandler = GetImageAddressHandler;
exports.GetImageAddressHandler = GetImageAddressHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.GET_IMAGE_ADDRESS, decorators_1.InjectType.NONE)
], GetImageAddressHandler);
//# sourceMappingURL=GetImageAddressHandler.js.map