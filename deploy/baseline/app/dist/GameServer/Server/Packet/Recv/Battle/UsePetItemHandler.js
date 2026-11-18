"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsePetItemHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const UsePetItemReqProto_1 = require("../../../../../shared/proto/packets/req/battle/UsePetItemReqProto");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
/**
 * [CMD: 2406 USE_PET_ITEM] 使用精灵道具
 */
let UsePetItemHandler = class UsePetItemHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        let req;
        try {
            req = UsePetItemReqProto_1.UsePetItemReqProto.fromBuffer(body, player.ClientProtocol);
        }
        catch {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.USE_PET_ITEM).setResult(5001));
            return;
        }
        await player.BattleManager.HandleUsePetItem(req.itemId, req.catchTime);
    }
};
exports.UsePetItemHandler = UsePetItemHandler;
exports.UsePetItemHandler = UsePetItemHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.USE_PET_ITEM, decorators_1.InjectType.NONE)
], UsePetItemHandler);
//# sourceMappingURL=UsePetItemHandler.js.map