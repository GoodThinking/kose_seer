"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetDiamondHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
/**
 * [CMD: 9025 GET_DIAMOND] 获取钻石数量
 */
let GetDiamondHandler = class GetDiamondHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        await player.NoNoManager.HandleGetDiamond();
    }
};
exports.GetDiamondHandler = GetDiamondHandler;
exports.GetDiamondHandler = GetDiamondHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.GET_DIAMOND, decorators_1.InjectType.NONE)
], GetDiamondHandler);
//# sourceMappingURL=GetDiamondHandler.js.map