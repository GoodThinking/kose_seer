"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetHatchGetHandler = exports.PetHatchHandler = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const Opcode_1 = require("../../../../../shared/decorators/Opcode");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const Logger_1 = require("../../../../../shared/utils/Logger");
const EssenceHatching_1 = require("../../../../Game/Pet/EssenceHatching");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
class PacketEssenceHatchState extends BaseProto_1.BaseProto {
    state;
    constructor(state) {
        super(CommandID_1.CommandID.PET_HATCH_GET);
        this.state = state;
    }
    serialize() {
        const body = Buffer.alloc(16);
        body.writeUInt32BE(this.state.active ? 1 : 0, 0);
        body.writeUInt32BE(this.state.remaining, 4);
        body.writeUInt32BE(this.state.petId, 8);
        body.writeUInt32BE(this.state.catchTime, 12);
        return body;
    }
}
class PacketEssenceHatchStarted extends BaseProto_1.BaseProto {
    seconds;
    constructor(seconds) {
        super(CommandID_1.CommandID.PET_HATCH);
        this.seconds = seconds;
    }
    serialize() { const body = Buffer.alloc(4); body.writeUInt32BE(this.seconds); return body; }
}
let PetHatchHandler = class PetHatchHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        if (body.length !== 4) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_HATCH).setResult(5001));
            return;
        }
        let seconds;
        try {
            seconds = await new EssenceHatching_1.EssenceHatching(player).Start(body.readUInt32BE(0));
        }
        catch (error) {
            const code = error instanceof EssenceHatching_1.InvalidEssenceHatch ? 5001 : error instanceof EssenceHatching_1.EssenceIncubatorBusy ? 5002 : 5000;
            if (code === 5000)
                Logger_1.Logger.Error('[PetHatch] Failed to start incubation', error);
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_HATCH).setResult(code));
            return;
        }
        try {
            await player.SendPacket(new PacketEssenceHatchStarted(seconds));
        }
        catch (error) {
            Logger_1.Logger.Error('[PetHatch] Incubation saved; response delivery failed', error);
        }
    }
};
exports.PetHatchHandler = PetHatchHandler;
exports.PetHatchHandler = PetHatchHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.PET_HATCH, Opcode_1.InjectType.NONE)
], PetHatchHandler);
let PetHatchGetHandler = class PetHatchGetHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        if (body.length !== 0) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_HATCH_GET).setResult(5001));
            return;
        }
        let state;
        try {
            state = await new EssenceHatching_1.EssenceHatching(player).Get();
        }
        catch (error) {
            if (!(error instanceof EssenceHatching_1.InvalidEssenceHatch))
                Logger_1.Logger.Error('[PetHatchGet] Failed to read incubation', error);
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_HATCH_GET).setResult(error instanceof EssenceHatching_1.InvalidEssenceHatch ? 5001 : 5000));
            return;
        }
        try {
            await player.SendPacket(new PacketEssenceHatchState(state));
        }
        catch (error) {
            Logger_1.Logger.Error('[PetHatchGet] State committed; response delivery failed', error);
        }
    }
};
exports.PetHatchGetHandler = PetHatchGetHandler;
exports.PetHatchGetHandler = PetHatchGetHandler = __decorate([
    (0, Opcode_1.Opcode)(CommandID_1.CommandID.PET_HATCH_GET, Opcode_1.InjectType.NONE)
], PetHatchGetHandler);
//# sourceMappingURL=PetHatchHandlers.js.map