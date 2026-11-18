"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeopleWalkRspProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
const utils_1 = require("../../../../utils");
const CommandID_1 = require("../../../../protocol/CommandID");
/**
 * [CMD: 2101 PEOPLE_WALK] 玩家移动响应
 */
class PeopleWalkRspProto extends BaseProto_1.BaseProto {
    walkType = 0; // 移动类型
    userId = 0; // 用户ID
    x = 0; // X坐标
    y = 0; // Y坐标
    amfData = Buffer.alloc(0); // AMF数据
    constructor(walkType = 0, userId = 0, x = 0, y = 0, amfData = Buffer.alloc(0)) {
        super(CommandID_1.CommandID.PEOPLE_WALK);
        this.walkType = walkType;
        this.userId = userId;
        this.x = x;
        this.y = y;
        this.amfData = amfData;
    }
    serialize() {
        const writer = new utils_1.BufferWriter(256);
        writer.WriteUInt32(this.walkType);
        writer.WriteUInt32(this.userId);
        writer.WriteUInt32(this.x);
        writer.WriteUInt32(this.y);
        writer.WriteUInt32(this.amfData.length);
        writer.WriteBytes(this.amfData);
        return writer.ToBuffer();
    }
    // 链式调用辅助方法
    setWalkType(value) {
        this.walkType = value;
        return this;
    }
    setUserId(value) {
        this.userId = value;
        return this;
    }
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }
    setAmfData(data) {
        this.amfData = data;
        return this;
    }
}
exports.PeopleWalkRspProto = PeopleWalkRspProto;
//# sourceMappingURL=PeopleWalkRspProto.js.map