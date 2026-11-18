"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoOpenHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoNoOpenReqProto_1 = require("../../../../../shared/proto/packets/req/nono/NoNoOpenReqProto");
/**
 * [CMD: 9001 NONO_OPEN] 开启NoNo
 */
let NoNoOpenHandler = class NoNoOpenHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = NoNoOpenReqProto_1.NoNoOpenReqProto.fromBuffer(body);
        await player.NoNoManager.HandleNoNoOpen();
    }
};
exports.NoNoOpenHandler = NoNoOpenHandler;
exports.NoNoOpenHandler = NoNoOpenHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.NONO_OPEN, decorators_1.InjectType.NONE)
], NoNoOpenHandler);
//# sourceMappingURL=NoNoOpenHandler.js.map