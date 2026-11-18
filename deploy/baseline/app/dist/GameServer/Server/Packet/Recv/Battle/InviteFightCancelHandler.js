"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteFightCancelHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const InviteFightCancelReqProto_1 = require("../../../../../shared/proto/packets/req/battle/InviteFightCancelReqProto");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const Battle_1 = require("../../Send/Battle");
const PvpBattleManager_1 = require("../../../../Game/Battle/PvpBattleManager");
const utils_1 = require("../../../../../shared/utils");
/**
 * [CMD: 2402 INVITE_FIGHT_CANCEL] 取消邀请
 */
let InviteFightCancelHandler = class InviteFightCancelHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        try {
            const req = InviteFightCancelReqProto_1.InviteFightCancelReqProto.fromBuffer(body);
            const inviterId = player.Uid;
            const targetId = req.targetUserId;
            // 取消邀请
            const success = PvpBattleManager_1.PvpBattleManager.Instance.CancelInvite(inviterId, targetId);
            if (!success) {
                await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.INVITE_FIGHT_CANCEL).setResult(5001));
                utils_1.Logger.Warn(`[InviteFightCancelHandler] 邀请不存在: inviterId=${inviterId}, targetId=${targetId}`);
                return;
            }
            // 发送确认
            await player.SendPacket(new Battle_1.PacketInviteFightCancel());
            utils_1.Logger.Info(`[InviteFightCancelHandler] 取消邀请: inviterId=${inviterId}, targetId=${targetId}`);
        }
        catch (error) {
            utils_1.Logger.Error(`[InviteFightCancelHandler] Handle failed`, error);
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.INVITE_FIGHT_CANCEL).setResult(5000));
        }
    }
};
exports.InviteFightCancelHandler = InviteFightCancelHandler;
exports.InviteFightCancelHandler = InviteFightCancelHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.INVITE_FIGHT_CANCEL, decorators_1.InjectType.NONE)
], InviteFightCancelHandler);
//# sourceMappingURL=InviteFightCancelHandler.js.map