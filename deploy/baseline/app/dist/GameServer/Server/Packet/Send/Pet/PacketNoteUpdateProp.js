"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketNoteUpdateProp = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoteUpdatePropRspProto_1 = require("../../../../../shared/proto/packets/rsp/pet/NoteUpdatePropRspProto");
/**
 * NOTE_UPDATE_PROP 数据包 (2508)
 * 推送精灵属性更新信息
 */
class PacketNoteUpdateProp extends BaseProto_1.BaseProto {
    _data;
    constructor(addition, pets) {
        super(CommandID_1.CommandID.NOTE_UPDATE_PROP);
        const proto = new NoteUpdatePropRspProto_1.NoteUpdatePropRspProto();
        proto.addition = addition;
        proto.pets = pets;
        this._data = proto.serialize();
    }
    serialize() {
        return this._data;
    }
}
exports.PacketNoteUpdateProp = PacketNoteUpdateProp;
//# sourceMappingURL=PacketNoteUpdateProp.js.map