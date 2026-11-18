"use strict";
const { Opcode, InjectType } = require("../../../../../shared/decorators/Opcode");
const { Logger } = require("../../../../../shared/utils/Logger");
const { DatabaseManager } = require("../../../../../DataBase/DatabaseManager");
const { PacketEmpty } = require("../../Send/PacketEmpty");
const { PacketBattleReward } = require("../../Send/Battle");
const { MaterialPacket } = require("./MaterialHandlers");
const { BroadcastService } = require("../../../../Game/Broadcast/BroadcastService");
const { SendForestAlert } = require("../../../../Game/Map/ForestMechanisms");
const tower = require("../../../../Game/Map/KingTower");
const busy = new WeakSet();
const CHALLENGE = 2482, START = 2483, LEAVE = 2484, SET_TITLE = 3404;

async function notifyAwards(player, result) {
    if (result.rewardItems?.length) await player.SendPacket(new PacketBattleReward(result.rewardItems));
    for (const title of result.titleIds || []) await player.SendPacket(new MaterialPacket(70005, [title]));
    if (result.pendingRewards) await SendForestAlert(player, "通关进度和成就已保存。部分通关物品已达背包上限，整理后再与守卫交谈即可领取，不会丢失。");
}
async function failed(player, command, error) {
    if (!(error instanceof tower.KingTowerError)) Logger.Error("[KingTower] Request failed", error);
    await SendForestAlert(player, error instanceof tower.KingTowerError ? error.message : "挑战操作中断，请重新登录核对已保存进度。");
    await player.SendPacket(new MaterialPacket(command, command === LEAVE ? [0] : [0xffffffff, 0]));
}
async function exclusive(player, command, action) {
    if (busy.has(player)) {
        await failed(player, command, new tower.KingTowerError("正在处理上一次操作，请稍后再试。"));
        return;
    }
    busy.add(player);
    try {
        await action();
    } catch (error) {
        await failed(player, command, error);
    } finally {
        busy.delete(player);
    }
}
class KingTowerChoiceHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        await exclusive(player, CHALLENGE, async () => {
            if (body.length !== 8) throw new tower.KingTowerError("请选择原生面板中的挑战入口。");
            const mode = body.readUInt32BE(0), checkpoint = body.readUInt32BE(4);
            if (mode === 0 && checkpoint === 0) {
                const state = await tower.GetKingTowerProgress(player);
                await player.SendPacket(new MaterialPacket(CHALLENGE, [state.normalMax, state.normalCurrent, state.heroMax, state.heroCurrent, state.activeMode, state.achievementPoints]));
                await notifyAwards(player, state);
                return;
            }
            const state = await tower.EnterKingTower(player, mode, checkpoint);
            await player.SendPacket(new MaterialPacket(CHALLENGE, [state.stage, state.pets.length, ...state.pets]));
        });
    }
}
class KingTowerStartHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        await exclusive(player, START, async () => {
            if (body.length !== 0) throw new tower.KingTowerError("请点击塔内训练师或精灵开始对战。");
            const context = await tower.PrepareKingTowerBattle(player);
            const started = await player.BattleManager.StartKingTowerBattle(context, async () => {
                await player.SendPacket(new MaterialPacket(START, [context.next.stage, context.next.pets.length, ...context.next.pets]));
            });
            if (!started) throw new tower.KingTowerError("战斗或精灵状态已改变，请稍后重新挑战。");
        });
    }
}
class KingTowerLeaveHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        await exclusive(player, LEAVE, async () => {
            if (body.length !== 0) throw new tower.KingTowerError("请通过塔内的原生出口离开。");
            await tower.LeaveKingTower(player);
            await player.SendPacket(new MaterialPacket(LEAVE, [1]));
        });
    }
}
class KingTowerSetTitleHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player) return;
        if (body.length !== 4 || busy.has(player)) {
            await player.SendPacket(new PacketEmpty(SET_TITLE).setResult(5001));
            return;
        }
        busy.add(player);
        try {
            const title = body.readUInt32BE(0);
            const owned = await tower.GetKingTowerTitles(player);
            if (title !== 0 && title !== player.Data.curTitle && !owned.includes(title)) {
                await SendForestAlert(player, "该称号尚未获得，请先完成对应挑战。");
                await player.SendPacket(new PacketEmpty(SET_TITLE).setResult(5001));
                return;
            }
            const result = await DatabaseManager.Instance.Execute("UPDATE players SET cur_title = ? WHERE user_id = ?", [title, player.Uid]);
            if (result.affectedRows !== 1) throw new Error("Player title was not persisted");
            player.Data.curTitle = title;
            const packet = new MaterialPacket(SET_TITLE, [player.Uid, title]);
            await player.SendPacket(packet);
            await BroadcastService.Instance.BroadcastToMap(player.Data.mapID, packet, player.Uid);
        } catch (error) {
            Logger.Error("[KingTower] Title selection failed", error);
            await SendForestAlert(player, "称号操作中断，请重新打开称号栏核对已保存选择。");
            await player.SendPacket(new PacketEmpty(SET_TITLE).setResult(5001));
        } finally {
            busy.delete(player);
        }
    }
}
Opcode(CHALLENGE, InjectType.NONE)(KingTowerChoiceHandler);
Opcode(START, InjectType.NONE)(KingTowerStartHandler);
Opcode(LEAVE, InjectType.NONE)(KingTowerLeaveHandler);
Opcode(SET_TITLE, InjectType.NONE)(KingTowerSetTitleHandler);
module.exports = { KingTowerChoiceHandler, KingTowerStartHandler, KingTowerLeaveHandler, KingTowerSetTitleHandler };
