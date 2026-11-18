"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoGetChipHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoNoGetChipReqProto_1 = require("../../../../../shared/proto/packets/req/nono/NoNoGetChipReqProto");
/**
 * [CMD: 9023 NONO_GET_CHIP] 获取NoNo芯片
 */
let NoNoGetChipHandler = class NoNoGetChipHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = NoNoGetChipReqProto_1.NoNoGetChipReqProto.fromBuffer(body);
        await player.NoNoManager.HandleNoNoGetChip(req.chipType);
    }
};
exports.NoNoGetChipHandler = NoNoGetChipHandler;
exports.NoNoGetChipHandler = NoNoGetChipHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.NONO_GET_CHIP, decorators_1.InjectType.NONE)
], NoNoGetChipHandler);
//# sourceMappingURL=NoNoGetChipHandler.js.map