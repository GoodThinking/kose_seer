"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UseStudyInjectHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const DatabaseHelper_1 = require("../../../../../DataBase/DatabaseHelper");
const utils_1 = require("../../../../../shared/utils");
const StudyInject_1 = require("../../../../Game/Pet/StudyInject");
const STUDY_ITEMS = new Set([
    300619, 300620, 300621, 300622, 300623, 300624,
    300639, 300640, 300641, 300642, 300643, 300644,
    300651, 300670,
]);
class PacketStudyInject extends BaseProto_1.BaseProto {
    serialize() {
        return Buffer.alloc(0);
    }
}
/**
 * [CMD: 9278 USE_PET_ITEM_FULL_ABILITY_OF_STUDY]
 * Body: catchTime, statIndex, itemId, mode. Sets the chosen effort value to 255.
 */
let UseStudyInjectHandler = class UseStudyInjectHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const fail = () => player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.USE_PET_ITEM_FULL_ABILITY_OF_STUDY).setResult(5001));
        if (body.length < 16) {
            await fail();
            return;
        }
        const catchTime = body.readUInt32BE(0);
        const statIndex = body.readUInt32BE(4);
        const itemId = body.readUInt32BE(8);
        if (!STUDY_ITEMS.has(itemId) || player.ItemManager.GetItemCount(itemId) < 1) {
            await fail();
            return;
        }
        const pet = player.PetManager.PetData.PetList.find(entry => entry.catchTime === catchTime);
        if (!pet || !(0, StudyInject_1.injectFullEffort)(pet, statIndex)) {
            utils_1.Logger.Warn(`[UseStudyInject] rejected uid=${player.Uid} item=${itemId} stat=${statIndex}`);
            await fail();
            return;
        }
        await DatabaseHelper_1.DatabaseHelper.Instance.SavePetData(player.PetManager.PetData);
        if (!player.ItemManager.ConsumeItem(itemId, 1)) {
            await fail();
            return;
        }
        await DatabaseHelper_1.DatabaseHelper.Instance.SaveItemData(player.ItemManager.ItemData);
        utils_1.Logger.Info(`[UseStudyInject] uid=${player.Uid} pet=${pet.petId} stat=${statIndex} ev=${pet.evHp}/${pet.evAtk}/${pet.evDef}/${pet.evSpAtk}/${pet.evSpDef}/${pet.evSpeed}`);
        await player.SendPacket(new PacketStudyInject(CommandID_1.CommandID.USE_PET_ITEM_FULL_ABILITY_OF_STUDY));
    }
};
exports.UseStudyInjectHandler = UseStudyInjectHandler;
exports.UseStudyInjectHandler = UseStudyInjectHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.USE_PET_ITEM_FULL_ABILITY_OF_STUDY, decorators_1.InjectType.NONE)
], UseStudyInjectHandler);
//# sourceMappingURL=UseStudyInjectHandler.js.map