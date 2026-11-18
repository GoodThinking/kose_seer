"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AchieveTitleListHandler = exports.ArenaGetInfoHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");

class PacketArenaInfo extends BaseProto_1.BaseProto {
    data;
    constructor(data) {
        super(CommandID_1.CommandID.ARENA_GET_INFO);
        this.data = data;
    }
    serialize() {
        return this.data;
    }
}

let ArenaGetInfoHandler = class ArenaGetInfoHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        // 客户端 ArenaInfo 读 32 字节：flag、擂主ID、擂主昵称16字节、连胜数、挑战者ID；全 0 表示擂台空
        const buf = Buffer.alloc(32);
        await player.SendPacket(new PacketArenaInfo(buf));
    }
};
exports.ArenaGetInfoHandler = ArenaGetInfoHandler;
exports.ArenaGetInfoHandler = ArenaGetInfoHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.ARENA_GET_INFO, decorators_1.InjectType.NONE)
], ArenaGetInfoHandler);

class PacketAchieveTitleList extends BaseProto_1.BaseProto {
    data;
    constructor(data) {
        super(CommandID_1.CommandID.ACHIEVETITLELIST);
        this.data = data;
    }
    serialize() {
        return this.data;
    }
}

let AchieveTitleListHandler = class AchieveTitleListHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        const buf = Buffer.alloc(4);
        await player.SendPacket(new PacketAchieveTitleList(buf));
    }
};
exports.AchieveTitleListHandler = AchieveTitleListHandler;
exports.AchieveTitleListHandler = AchieveTitleListHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.ACHIEVETITLELIST, decorators_1.InjectType.NONE)
], AchieveTitleListHandler);
