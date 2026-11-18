"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetReleaseHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const utils_1 = require("../../../../../shared/utils");
/**
 * [CMD: 2304 PET_RELEASE] 精灵操作（放入仓库/取回背包）
 *
 * 请求格式：catchTime(4) + flag(4)
 * - flag=0: 将精灵放入仓库（从背包移到仓库）
 * - flag=1: 将精灵取回背包（从仓库移到背包，或确认获得新精灵）
 */
let PetReleaseHandler = class PetReleaseHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        // 解析请求
        let catchTime = 0;
        let flag = 0;
        if (body.length >= 4) {
            catchTime = body.readUInt32BE(0);
        }
        if (body.length >= 8) {
            flag = body.readUInt32BE(4);
        }
        utils_1.Logger.Info(`[PetReleaseHandler] 用户 ${player.Uid} 精灵操作: catchTime=${catchTime}, flag=${flag}`);
        if (flag === 0) {
            // 将精灵放入仓库
            await player.PetManager.HandlePetRelease(catchTime);
        }
        else if (flag === 1) {
            // 将精灵取回背包（从仓库取出，或确认获得新精灵）
            await player.PetManager.HandlePetTakeOut(catchTime);
        }
        else {
            utils_1.Logger.Warn(`[PetReleaseHandler] 未知的 flag 值: ${flag}`);
        }
    }
};
exports.PetReleaseHandler = PetReleaseHandler;
exports.PetReleaseHandler = PetReleaseHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_RELEASE, decorators_1.InjectType.NONE)
], PetReleaseHandler);
//# sourceMappingURL=PetReleaseHandler.js.map