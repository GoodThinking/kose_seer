"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetRoomListHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const PetRoomListReqProto_1 = require("../../../../../shared/proto/packets/req/pet/PetRoomListReqProto");
const utils_1 = require("../../../../../shared/utils");
/**
 * [CMD: 2324 PET_ROOM_LIST] 获取精灵仓库列表处理器
 */
let PetRoomListHandler = class PetRoomListHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const req = PetRoomListReqProto_1.PetRoomListReqProto.fromBuffer(body);
        utils_1.Logger.Debug(`[PetRoomListHandler] 获取精灵仓库列表: UserID=${player.Data.userID}, RoomType=${req.roomType}`);
        await player.PetManager.HandleGetPetRoomList(req.roomType);
    }
};
exports.PetRoomListHandler = PetRoomListHandler;
exports.PetRoomListHandler = PetRoomListHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_ROOM_LIST, decorators_1.InjectType.NONE)
], PetRoomListHandler);
//# sourceMappingURL=PetRoomListHandler.js.map