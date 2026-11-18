"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeopleWalkReqProto = void 0;
const BaseProto_1 = require("../../../base/BaseProto");
/**
 * [CMD: 2101 PEOPLE_WALK] 玩家移动请求
 */
class PeopleWalkReqProto extends BaseProto_1.BaseProto {
    walkType = 0; // 移动类型
    x = 0; // X坐标
    y = 0; // Y坐标
    amfData = Buffer.alloc(0); // AMF数据
    constructor() {
        super(0);
    }
    serialize() {
        return Buffer.alloc(0);
    }
    static fromBuffer(buffer) {
        const proto = new PeopleWalkReqProto();
        if (buffer.length >= 16) {
            proto.walkType = buffer.readUInt32BE(0);
            proto.x = buffer.readUInt32BE(4);
            proto.y = buffer.readUInt32BE(8);
            const amfLen = buffer.readUInt32BE(12);
            if (buffer.length >= 16 + amfLen) {
                proto.amfData = buffer.subarray(16, 16 + amfLen);
            }
        }
        return proto;
    }
}
exports.PeopleWalkReqProto = PeopleWalkReqProto;
//# sourceMappingURL=PeopleWalkReqProto.js.map