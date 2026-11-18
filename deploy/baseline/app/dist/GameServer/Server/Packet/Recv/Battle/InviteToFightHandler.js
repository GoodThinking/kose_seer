"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InviteToFightHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const InviteToFightReqProto_1 = require("../../../../../shared/proto/packets/req/battle/InviteToFightReqProto");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const Battle_1 = require("../../Send/Battle");
const PvpBattleManager_1 = require("../../../../Game/Battle/PvpBattleManager");
const OnlineTracker_1 = require("../../../../Game/Player/OnlineTracker");
const utils_1 = require("../../../../../shared/utils");
/**
 * [CMD: 2401 INVITE_TO_FIGHT] 邀请对战
 */
let InviteToFightHandler = class InviteToFightHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        try {
            const req = InviteToFightReqProto_1.InviteToFightReqProto.fromBuffer(body);
            const targetId = req.targetUserId;
            const mode = req.mode; // 对战模式：1=单挑，2=多精灵
            const inviterId = player.Uid;
            const inviterNick = player.Data.nick || `Player${inviterId}`;
            // 验证目标玩家
            if (targetId === inviterId) {
                await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.INVITE_TO_FIGHT).setResult(5001));
                utils_1.Logger.Warn(`[InviteToFightHandler] 不能邀请自己: userId=${inviterId}`);
                return;
            }
            // 检查目标玩家是否在线
            if (!OnlineTracker_1.OnlineTracker.Instance.IsOnline(targetId)) {
                // 发送成功确认给邀请者
                await player.SendPacket(new Battle_1.PacketInviteToFight());
                // 发送通知：对方不在线 (result=4)
                await player.SendPacket(new Battle_1.PacketNoteHandleFightInvite(targetId, '', 4));
                utils_1.Logger.Warn(`[InviteToFightHandler] 目标玩家不在线: targetId=${targetId}`);
                return;
            }
            // 获取目标玩家信息
            const targetSession = OnlineTracker_1.OnlineTracker.Instance.GetPlayerSession(targetId);
            if (!targetSession?.Player) {
                // 发送成功确认给邀请者
                await player.SendPacket(new Battle_1.PacketInviteToFight());
                // 发送通知：对方不在线 (result=4)
                await player.SendPacket(new Battle_1.PacketNoteHandleFightInvite(targetId, '', 4));
                utils_1.Logger.Warn(`[InviteToFightHandler] 无法获取目标玩家: targetId=${targetId}`);
                return;
            }
            const targetNick = targetSession.Player.Data.nick || `Player${targetId}`;
            // 检查邀请者是否有健康的精灵
            const inviterPets = player.PetManager.GetPetsInBag();
            const inviterHealthyPets = inviterPets.filter((p) => p.hp > 0);
            if (inviterHealthyPets.length === 0) {
                await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.INVITE_TO_FIGHT).setResult(10017));
                utils_1.Logger.Warn(`[InviteToFightHandler] 邀请者没有健康精灵: userId=${inviterId}`);
                return;
            }
            // 检查目标玩家是否有健康的精灵
            const targetPets = targetSession.Player.PetManager.GetPetsInBag();
            const targetHealthyPets = targetPets.filter((p) => p.hp > 0);
            if (targetHealthyPets.length === 0) {
                // 发送成功确认给邀请者
                await player.SendPacket(new Battle_1.PacketInviteToFight());
                // 发送通知：对方没有可出战的精灵 (result=3)
                const notifyPacket = new Battle_1.PacketNoteHandleFightInvite(targetId, targetNick, 3);
                await player.SendPacket(notifyPacket);
                utils_1.Logger.Warn(`[InviteToFightHandler] 目标玩家没有健康精灵: targetId=${targetId}, ` +
                    `targetNick=${targetNick}, 发送result=3`);
                return;
            }
            // 创建邀请
            const success = PvpBattleManager_1.PvpBattleManager.Instance.CreateInvite(inviterId, inviterNick, targetId, targetNick);
            if (!success) {
                await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.INVITE_TO_FIGHT).setResult(5004));
                utils_1.Logger.Warn(`[InviteToFightHandler] 创建邀请失败: inviterId=${inviterId}, targetId=${targetId}`);
                return;
            }
            // 发送确认给邀请者
            await player.SendPacket(new Battle_1.PacketInviteToFight());
            // 推送邀请通知给目标玩家
            await OnlineTracker_1.OnlineTracker.Instance.SendToPlayer(targetId, new Battle_1.PacketNoteInviteToFight(inviterId, inviterNick, mode));
            utils_1.Logger.Info(`[InviteToFightHandler] 邀请对战: inviterId=${inviterId}, inviterNick=${inviterNick}, ` +
                `targetId=${targetId}, targetNick=${targetNick}, mode=${mode}`);
        }
        catch (error) {
            utils_1.Logger.Error(`[InviteToFightHandler] Handle failed`, error);
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.INVITE_TO_FIGHT).setResult(5000));
        }
    }
};
exports.InviteToFightHandler = InviteToFightHandler;
exports.InviteToFightHandler = InviteToFightHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.INVITE_TO_FIGHT, decorators_1.InjectType.NONE)
], InviteToFightHandler);
//# sourceMappingURL=InviteToFightHandler.js.map