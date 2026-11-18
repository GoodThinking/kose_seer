"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeiyiTrainStatusHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");

class PacketLeiyiTrainStatus extends BaseProto_1.BaseProto {
    data;
    constructor(data) {
        super(CommandID_1.CommandID.LEIYI_TRAIN_GET_STATUS);
        this.data = data;
    }
    serialize() {
        return this.data;
    }
}

let LeiyiTrainStatusHandler = class LeiyiTrainStatusHandler {
    async Handle(session, player, head, body) {
        // 6 training attributes in client order:
        // 0: 体力 (60), 1: 防御 (20), 2: 特防 (20), 3: 攻击 (20), 4: 特攻 (10), 5: 速度 (20)
        const totals = [60, 20, 20, 20, 10, 20];
        const buf = Buffer.alloc(72);
        for (let i = 0; i < 6; i++) {
            buf.writeUInt32BE(0, i * 12);         // today = 0
            buf.writeUInt32BE(0, i * 12 + 4);     // current = 0
            buf.writeUInt32BE(totals[i], i * 12 + 8); // total
        }
        await player.SendPacket(new PacketLeiyiTrainStatus(buf));
    }
};
LeiyiTrainStatusHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.LEIYI_TRAIN_GET_STATUS, decorators_1.InjectType.NONE)
], LeiyiTrainStatusHandler);
exports.LeiyiTrainStatusHandler = LeiyiTrainStatusHandler;
