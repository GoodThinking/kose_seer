"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandleFightInviteHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const HandleFightInviteReqProto_1 = require("../../../../../shared/proto/packets/req/battle/HandleFightInviteReqProto");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const Battle_1 = require("../../Send/Battle");
const PvpBattleManager_1 = require("../../../../Game/Battle/PvpBattleManager");
const OnlineTracker_1 = require("../../../../Game/Player/OnlineTracker");
const utils_1 = require("../../../../../shared/utils");
/**
 * [CMD: 2403 HANDLE_FIGHT_INVITE] 处理对战邀请
 */
let HandleFightInviteHandler = class HandleFightInviteHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        try {
            const req = HandleFightInviteReqProto_1.HandleFightInviteReqProto.fromBuffer(body);
            const targetId = player.Uid;
            const inviterId = req.inviterUserId;
            const accept = req.accept === 1;
            // 处理邀请
            const invite = PvpBattleManager_1.PvpBattleManager.Instance.HandleInvite(inviterId, targetId, accept);
            if (!invite) {
                await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.HANDLE_FIGHT_INVITE).setResult(5001));
                utils_1.Logger.Warn(`[HandleFightInviteHandler] 邀请不存在: inviterId=${inviterId}, targetId=${targetId}`);
                return;
            }
            // 发送确认给目标玩家
            await player.SendPacket(new Battle_1.PacketHandleFightInvite());
            // 推送处理结果给邀请者
            // result: 0=拒绝, 1=接受
            await OnlineTracker_1.OnlineTracker.Instance.SendToPlayer(inviterId, new Battle_1.PacketNoteHandleFightInvite(targetId, invite.targetNick, accept ? 1 : 0));
            utils_1.Logger.Info(`[HandleFightInviteHandler] 处理邀请: inviterId=${inviterId}, targetId=${targetId}, ` +
                `accept=${accept}`);
            // 如果拒绝邀请，直接返回
            if (!accept) {
                return;
            }
            // 如果接受邀请，创建PVP战斗房间并发送准备通知
            // 创建战斗房间
            const roomKey = PvpBattleManager_1.PvpBattleManager.Instance.CreateBattleRoom(inviterId, targetId);
            // 获取双方玩家实例
            const inviterSession = OnlineTracker_1.OnlineTracker.Instance.GetPlayerSession(inviterId);
            const targetSession = OnlineTracker_1.OnlineTracker.Instance.GetPlayerSession(targetId);
            if (!inviterSession?.Player || !targetSession?.Player) {
                utils_1.Logger.Error(`[HandleFightInviteHandler] 无法获取玩家实例`);
                return;
            }
            // 发送 NOTE_READY_TO_FIGHT 给双方
            const { PacketNoteReadyToFight } = await Promise.resolve().then(() => __importStar(require('../../Send/Battle')));
            // 构建双方精灵信息
            const inviterPets = inviterSession.Player.BattleManager['BuildPlayerPetsInfo']();
            const targetPets = targetSession.Player.BattleManager['BuildPlayerPetsInfo']();
            // 发送给邀请者
            await inviterSession.Player.SendPacket(new PacketNoteReadyToFight(inviterId, invite.inviterNick, inviterPets, targetId, invite.targetNick, targetPets, inviterSession.Player.ClientProtocol));
            // 发送给被邀请者
            await targetSession.Player.SendPacket(new PacketNoteReadyToFight(targetId, invite.targetNick, targetPets, inviterId, invite.inviterNick, inviterPets, targetSession.Player.ClientProtocol));
            utils_1.Logger.Info(`[HandleFightInviteHandler] PVP战斗房间已创建: roomKey=${roomKey}, ` +
                `player1=${inviterId}, player2=${targetId}`);
        }
        catch (error) {
            utils_1.Logger.Error(`[HandleFightInviteHandler] Handle failed`, error);
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.HANDLE_FIGHT_INVITE).setResult(5000));
        }
    }
};
exports.HandleFightInviteHandler = HandleFightInviteHandler;
exports.HandleFightInviteHandler = HandleFightInviteHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.HANDLE_FIGHT_INVITE, decorators_1.InjectType.NONE)
], HandleFightInviteHandler);
//# sourceMappingURL=HandleFightInviteHandler.js.map