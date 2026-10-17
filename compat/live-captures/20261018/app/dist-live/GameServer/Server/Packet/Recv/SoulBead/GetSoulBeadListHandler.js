"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetSoulBeadListHandler = void 0;
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const DatabaseManager_1 = require("../../../../../DataBase/DatabaseManager");
const Logger_1 = require("../../../../../shared/utils/Logger");
function u32(value) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value >>> 0, 0);
    return buffer;
}
class PacketSoulList extends BaseProto_1.BaseProto {
    constructor(body) {
        super(CommandID_1.CommandID.GET_SOUL_BEAD_List);
        this._body = body;
    }
    serialize() { return this._body; }
}
let GetSoulBeadListHandler = class GetSoulBeadListHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        try {
            const rows = await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.query('SELECT obtain_time, item_id FROM player_soul_beads WHERE owner_id = ? ORDER BY obtain_time', [player.Uid]));
            const parts = [u32(rows.length)];
            for (const row of rows)
                parts.push(u32(row.obtain_time), u32(row.item_id));
            Logger_1.Logger.Info(`[GetSoulBeadListHandler] uid=${player.Uid} count=${rows.length}`);
            await player.SendPacket(new PacketSoulList(Buffer.concat(parts)));
        }
        catch (error) {
            Logger_1.Logger.Error(`[GetSoulBeadListHandler] 失败`, error);
            await player.SendPacket(new PacketSoulList(u32(0)).setResult(5000));
        }
    }
};
exports.GetSoulBeadListHandler = GetSoulBeadListHandler;
exports.GetSoulBeadListHandler = GetSoulBeadListHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.GET_SOUL_BEAD_List, Opcode_1.InjectType.NONE)
], GetSoulBeadListHandler);
