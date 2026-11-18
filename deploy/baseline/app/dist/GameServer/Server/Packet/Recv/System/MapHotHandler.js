"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapHotHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
/**
 * [CMD: 1004 MAP_HOT] 获取地图热度
 */
let MapHotHandler = class MapHotHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        await player.SystemManager.HandleMapHot();
    }
};
exports.MapHotHandler = MapHotHandler;
exports.MapHotHandler = MapHotHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.MAP_HOT, decorators_1.InjectType.NONE)
], MapHotHandler);
//# sourceMappingURL=MapHotHandler.js.map