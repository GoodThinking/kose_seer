"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsePetItemOutOfFightHandler = void 0;
exports.encodeUsePetItemOutOfFight = encodeUsePetItemOutOfFight;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const DatabaseHelper_1 = require("../../../../../DataBase/DatabaseHelper");
const GameConfig_1 = require("../../../../../shared/config/game/GameConfig");
const utils_1 = require("../../../../../shared/utils");
const RandomDv_1 = require("../../../../Game/Pet/RandomDv");
const MISSING = 5001;
const NO_ITEM = 10016;
function u32(value) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value >>> 0, 0);
    return buffer;
}
/** Body read by UsePetItemOutOfFightInfo. Skill list is empty; the client reloads the pet afterwards. */
function encodeUsePetItemOutOfFight(pet) {
    const nick = Buffer.alloc(16);
    Buffer.from(pet.nick || '', 'utf8').copy(nick, 0, 0, 16);
    const dv = Math.floor((pet.dvHp + pet.dvAtk + pet.dvDef + pet.dvSpAtk + pet.dvSpDef + pet.dvSpeed) / 6);
    return Buffer.concat([
        u32(pet.catchTime), u32(pet.petId), nick, u32(pet.nature), u32(dv), u32(pet.level),
        u32(pet.hp), u32(pet.maxHp), u32(pet.exp),
        u32(pet.evHp), u32(pet.evAtk), u32(pet.evDef), u32(pet.evSpAtk), u32(pet.evSpDef), u32(pet.evSpeed),
        u32(pet.atk), u32(pet.spAtk), u32(pet.def), u32(pet.spDef), u32(pet.speed), u32(0),
    ]);
}
class PacketUsePetItemOutOfFight extends BaseProto_1.BaseProto {
    body;
    constructor(body) {
        super(CommandID_1.CommandID.USE_PET_ITEM_OUT_OF_FIGHT);
        this.body = body;
    }
    serialize() {
        return this.body;
    }
}

const NATURE_BY_ITEM = {
    300081: 1, 300082: 18, 300083: 4, 300084: 5, 300085: 8, 300086: 16,
    300933: 0, 300934: 2, 300935: 3, 300936: 6, 300937: 7, 300938: 9, 300939: 10,
    300940: 11, 300941: 12, 300942: 13, 300943: 14, 300944: 15, 300945: 17, 300946: 19,
    300947: 20, 300948: 21, 300949: 22, 300950: 23, 300951: 24,
};
const RANDOM_NATURE_ITEMS = new Set([300025, 300070, 300660, 300728]);
/**
 * [CMD: 2326 USE_PET_ITEM_OUT_OF_FIGHT]
 * RandomDv items reroll the six individual values. Other out-of-fight items stay rejected.
 */
let UsePetItemOutOfFightHandler = class UsePetItemOutOfFightHandler {
    async Handle(session, head, body) {
        const player = session.Player;
        if (!player)
            return;
        const fail = (code) => player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.USE_PET_ITEM_OUT_OF_FIGHT).setResult(code));
        if (body.length < 8) {
            await fail(MISSING);
            return;
        }
        const catchTime = body.readUInt32BE(0);
        const itemId = body.readUInt32BE(4);
        const item = GameConfig_1.GameConfig.GetItemById(itemId);
        const pet = player.PetManager.PetData.PetList.find(entry => entry.catchTime === catchTime);
        if (!pet || player.ItemManager.GetItemCount(itemId) < 1) {
            await fail(pet ? NO_ITEM : MISSING);
            return;
        }
        const fixedNature = NATURE_BY_ITEM[itemId];
        const randomNature = RANDOM_NATURE_ITEMS.has(itemId);
        if (item && item.RandomDv === 1) {
            (0, RandomDv_1.applyRandomIndividualValues)(pet);
        }
        else if (fixedNature !== undefined || randomNature) {
            let nature = fixedNature;
            if (nature === undefined) {
                do {
                    nature = Math.floor(Math.random() * 25);
                } while (nature === pet.nature);
            }
            pet.nature = nature;
            const { PetCalculator } = require('../../../../Game/Pet/PetCalculator');
            PetCalculator.UpdatePetStats(pet);
            utils_1.Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} pet=${pet.petId} nature=${nature}`);
        }
        else {
            utils_1.Logger.Warn(`[UsePetItemOutOfFight] unsupported item ${itemId}`);
            await fail(MISSING);
            return;
        }
        await DatabaseHelper_1.DatabaseHelper.Instance.SavePetData(player.PetManager.PetData);
        if (!player.ItemManager.ConsumeItem(itemId, 1)) {
            await fail(NO_ITEM);
            return;
        }
        await DatabaseHelper_1.DatabaseHelper.Instance.SaveItemData(player.ItemManager.ItemData);
        utils_1.Logger.Info(`[UsePetItemOutOfFight] uid=${player.Uid} pet=${pet.petId} catch=${catchTime} dv=${pet.dvHp}/${pet.dvAtk}/${pet.dvDef}/${pet.dvSpAtk}/${pet.dvSpDef}/${pet.dvSpeed}`);
        await player.SendPacket(new PacketUsePetItemOutOfFight(encodeUsePetItemOutOfFight(pet)));
    }
};
exports.UsePetItemOutOfFightHandler = UsePetItemOutOfFightHandler;
exports.UsePetItemOutOfFightHandler = UsePetItemOutOfFightHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.USE_PET_ITEM_OUT_OF_FIGHT, decorators_1.InjectType.NONE)
], UsePetItemOutOfFightHandler);
//# sourceMappingURL=UsePetItemOutOfFightHandler.js.map