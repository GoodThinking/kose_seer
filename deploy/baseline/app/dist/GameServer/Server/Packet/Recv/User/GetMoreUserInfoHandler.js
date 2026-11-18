"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetMoreUserInfoHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetMoreUserInfoReqProto_1 = require("../../../../../shared/proto/packets/req/user/GetMoreUserInfoReqProto");
const PacketGetMoreUserInfo_1 = require("../../Send/User/PacketGetMoreUserInfo");
const DatabaseHelper_1 = require("../../../../../DataBase/DatabaseHelper");
const Logger_1 = require("../../../../../shared/utils/Logger");
/**
 * [CMD: 2052] 获取更多用户信息
 */
let GetMoreUserInfoHandler = class GetMoreUserInfoHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = GetMoreUserInfoReqProto_1.GetMoreUserInfoReqProto.fromBuffer(body);
        try {
            // 获取目标用户的数据（跟GM一样的逻辑）
            let targetPlayerData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstance_PlayerData(req.userId);
            if (!targetPlayerData) {
                // 如果缓存中没有，从数据库加载
                targetPlayerData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_PlayerData(req.userId);
                if (!targetPlayerData) {
                    Logger_1.Logger.Warn(`[GetMoreUserInfoHandler] 玩家不存在: TargetUserId=${req.userId}`);
                    return;
                }
            }
            // 使用 GetInstanceOrCreateNew 从数据库加载精灵数据
            const petData = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(req.userId);
            // 实时更新精灵统计信息（跟GM一样）
            if (petData) {
                targetPlayerData.petAllNum = petData.PetList.length;
                if (petData.PetList.length > 0) {
                    targetPlayerData.petMaxLev = Math.max(...petData.PetList.map(p => p.level));
                }
                else {
                    targetPlayerData.petMaxLev = 0;
                }
                Logger_1.Logger.Info(`[GetMoreUserInfoHandler] 实时更新精灵统计: userId=${req.userId}, petAllNum=${targetPlayerData.petAllNum}, petMaxLev=${targetPlayerData.petMaxLev}`);
            }
            // 先锋队面板读的是这里的 200 个成就位，不能用玩家表里那份空数组。
            const progress = await DatabaseHelper_1.DatabaseHelper.Instance.GetInstanceOrCreateNew_ChallengeProgressData(req.userId);
            const info = Object.assign({}, targetPlayerData, {
                bossAchievement: progress.bossAchievement.slice(),
            });
            await player.SendPacket(new PacketGetMoreUserInfo_1.PacketGetMoreUserInfo(info));
        }
        catch (error) {
            Logger_1.Logger.Error(`[GetMoreUserInfoHandler] 查询用户信息失败: TargetUserId=${req.userId}`, error);
        }
    }
};
exports.GetMoreUserInfoHandler = GetMoreUserInfoHandler;
exports.GetMoreUserInfoHandler = GetMoreUserInfoHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.GET_MORE_USERINFO, decorators_1.InjectType.NONE)
], GetMoreUserInfoHandler);
//# sourceMappingURL=GetMoreUserInfoHandler.js.map