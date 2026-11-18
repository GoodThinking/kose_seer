"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketSkillSort = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const SkillSortRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/SkillSortRspProto");
/**
 * [CMD: 2328 Skill_Sort] 技能排序响应包
 */
class PacketSkillSort extends BaseProto_1.BaseProto {
    _data;
    constructor() {
        const proto = new SkillSortRspProto_1.SkillSortRspProto();
        super(proto.getCmdId());
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketSkillSort = PacketSkillSort;
//# sourceMappingURL=PacketSkillSort.js.map