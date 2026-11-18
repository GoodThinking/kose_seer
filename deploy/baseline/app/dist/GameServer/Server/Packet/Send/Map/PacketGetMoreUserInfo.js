"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketGetMoreUserInfo = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const GetMoreUserInfoRspProto_1 = require("../../../../../shared/proto/packets/rsp/map/GetMoreUserInfoRspProto");
/**
 * 获取详细用户信息响应包
 * CMD 1006
 */
class PacketGetMoreUserInfo extends BaseProto_1.BaseProto {
    _data;
    constructor(userId, nick, regTime = 0, petAllNum = 0, petMaxLev = 0, bossAchievement = '', graduationCount = 0, monKingWin = 0, messWin = 0, maxStage = 0, maxArenaWins = 0, curTitle = 0) {
        super(CommandID_1.CommandID.GET_MORE_USERINFO);
        const proto = new GetMoreUserInfoRspProto_1.GetMoreUserInfoRspProto();
        proto.userId = userId;
        proto.nick = nick;
        proto.regTime = regTime;
        proto.petAllNum = petAllNum;
        proto.petMaxLev = petMaxLev;
        proto.bossAchievement = bossAchievement;
        proto.graduationCount = graduationCount;
        proto.monKingWin = monKingWin;
        proto.messWin = messWin;
        proto.maxStage = maxStage;
        proto.maxArenaWins = maxArenaWins;
        proto.curTitle = curTitle;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketGetMoreUserInfo = PacketGetMoreUserInfo;
//# sourceMappingURL=PacketGetMoreUserInfo.js.map