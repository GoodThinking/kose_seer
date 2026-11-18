"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangeClothHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const ChangeClothReqProto_1 = require("../../../../../shared/proto/packets/req/item/ChangeClothReqProto");
/**
 * 更换服装处理器
 * CMD 2604
 *
 * 重构说明：
 * - 不再需要依赖注入 ItemManager
 * - 直接使用 player.ItemManager
 */
let ChangeClothHandler = class ChangeClothHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = new ChangeClothReqProto_1.ChangeClothReqProto();
        req.deserialize(body);
        // 直接调用 player.ItemManager
        await player.ItemManager.HandleChangeCloth(req.clothIds);
    }
};
exports.ChangeClothHandler = ChangeClothHandler;
exports.ChangeClothHandler = ChangeClothHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.CHANGE_CLOTH, decorators_1.InjectType.NONE)
], ChangeClothHandler);
//# sourceMappingURL=ChangeClothHandler.js.map