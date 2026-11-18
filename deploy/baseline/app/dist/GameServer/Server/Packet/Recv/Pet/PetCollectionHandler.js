"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetCollectionHandler = exports.PET_COLLECTION = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const DatabaseManager_1 = require("../../../../../DataBase/DatabaseManager");
/** Read-only, self-scoped collection snapshot: uint32 count followed by species IDs. */
exports.PET_COLLECTION = 91001;
class PacketPetCollection extends BaseProto_1.BaseProto {
    constructor(ids) {
        super(exports.PET_COLLECTION);
        this.ids = ids;
    }
    serialize() {
        const body = Buffer.alloc(4 + this.ids.length * 4);
        body.writeUInt32BE(this.ids.length, 0);
        this.ids.forEach((id, index) => body.writeUInt32BE(id, 4 + index * 4));
        return body;
    }
}
let PetCollectionHandler = class PetCollectionHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        if (body.length !== 0)
            throw new Error('Invalid collection snapshot request');
        const rows = await DatabaseManager_1.DatabaseManager.Instance.Query('SELECT pet_id FROM player_pet_collection WHERE owner_id = ? ORDER BY pet_id', [player.Uid]);
        await player.SendPacket(new PacketPetCollection(rows.map(row => row.pet_id)));
    }
};
exports.PetCollectionHandler = PetCollectionHandler;
exports.PetCollectionHandler = PetCollectionHandler = __decorate([
    (0, decorators_1.Opcode)(exports.PET_COLLECTION, decorators_1.InjectType.NONE)
], PetCollectionHandler);
