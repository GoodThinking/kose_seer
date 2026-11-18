"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoNoFollowOrHoomHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const NoNoFollowOrHoomReqProto_1 = require("../../../../../shared/proto/packets/req/nono/NoNoFollowOrHoomReqProto");
/**
 * [CMD: 9019 NONO_FOLLOW_OR_HOOM] NoNo 跟随或回家
 * 简单逻辑：设置 NoNo 的跟随状态（会话级别）
 */
let NoNoFollowOrHoomHandler = class NoNoFollowOrHoomHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = NoNoFollowOrHoomReqProto_1.NoNoFollowOrHoomReqProto.fromBuffer(body);
        await player.NoNoManager.HandleNoNoFollowOrHoom(req.action);
    }
};
exports.NoNoFollowOrHoomHandler = NoNoFollowOrHoomHandler;
exports.NoNoFollowOrHoomHandler = NoNoFollowOrHoomHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.NONO_FOLLOW_OR_HOOM, decorators_1.InjectType.NONE)
], NoNoFollowOrHoomHandler);
//# sourceMappingURL=NoNoFollowOrHoomHandler.js.map