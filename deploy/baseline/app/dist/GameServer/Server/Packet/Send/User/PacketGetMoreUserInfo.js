"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetMoreUserInfo = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetMoreUserInfoRspProto_1 = require("../../../../../shared/proto/packets/rsp/user/GetMoreUserInfoRspProto");
/**
 * GET_MORE_USERINFO 数据包 (2052)
 * 获取更多用户信息响应
 */
class PacketGetMoreUserInfo extends BaseProto_1.BaseProto {
    _data;
    constructor(playerData) {
        super(CommandID_1.CommandID.GET_MORE_USERINFO);
        const proto = new GetMoreUserInfoRspProto_1.GetMoreUserInfoRspProto();
        // 填充真实数据
        proto.setUserID(playerData.userID);
        proto.setNick(playerData.nick || '');
        proto.setRegTime(playerData.regTime || 0);
        proto.setPetAllNum(playerData.petAllNum || 0);
        proto.setPetMaxLev(playerData.petMaxLev || 0);
        // BOSS成就（从数据库读取）
        proto.setBossAchievement(playerData.bossAchievement || new Array(200).fill(false));
        proto.setGraduationCount(playerData.graduationCount || 0);
        proto.setMonKingWin(playerData.monKingWin || 0);
        proto.setMessWin(playerData.messWin || 0);
        proto.setMaxStage(playerData.maxStage || 0);
        proto.setMaxArenaWins(playerData.maxArenaWins || 0);
        proto.setCurTitle(playerData.curTitle || 0);
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGetMoreUserInfo = PacketGetMoreUserInfo;
//# sourceMappingURL=PacketGetMoreUserInfo.js.map