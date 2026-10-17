"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SoulBeadToPetHandler = exports.SetSoulBeadBufHandler = exports.GetSoulBeadBufHandler = exports.GetSoulBeadListHandler = exports.PetFusionHandler = void 0;
const decorators_1 = require("../../../../../shared/decorators");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const PacketEmpty_1 = require("../../Send/PacketEmpty");
const DatabaseManager_1 = require("../../../../../DataBase/DatabaseManager");
const utils_1 = require("../../../../../shared/utils");
const GameConfig_1 = require("../../../../../shared/config/game/GameConfig");
const TABLE = `CREATE TABLE IF NOT EXISTS player_soul_beads (
  owner_id INTEGER NOT NULL,
  obtain_time INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  buf BLOB NOT NULL,
  result_pet INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (owner_id, obtain_time)
)`;
/**
 * 主宠最终形态 + 副宠一族 + 对应材料 → 元神珠。
 * 同色珠子会孵出不同精灵，结果记在 result_pet，不看珠子默认孵化。
 * 材料按主精灵属性对上背包里已有的融合道具。
 */
const RECIPES = [
    { main: [3], sub: [27, 28, 29, 1216], soul: 1000001, pet: 301, essence: 400005 },
    { main: [6], sub: [198, 199, 200], soul: 1000002, pet: 304, essence: 400006 },
    { main: [9], sub: [35, 36, 37, 1237, 1238], soul: 1000003, pet: 307, essence: 400007 },
    { main: [79], sub: [164, 165, 166], soul: 1000008, pet: 310, essence: 400008, rare: { soul: 1000009, pet: 313, numerator: 5, denominator: 100 } },
    { main: [76], sub: [310, 311, 312], soul: 1000008, pet: 1248, essence: 400006 },
    { main: [207], sub: [310, 311, 312], soul: 1000008, pet: 1500, essence: 400028 },
    { main: [683], sub: [677, 678, 679], soul: 1000001, pet: 946, essence: 400005 },
    { main: [180], sub: [53, 54, 55, 1143], soul: 1000004, pet: 316, essence: 400031 },
    { main: [155], sub: [25, 26], soul: 1000006, pet: 319, essence: 400004 },
    { main: [118], sub: [190, 191, 192], soul: 1000005, pet: 322, essence: 400003 },
    { main: [210], sub: [38, 39, 40], soul: 1000003, pet: 332, essence: 400007 },
    { main: [61], sub: [102, 103, 104], soul: 1000010, pet: 338, essence: 400037 },
    { main: [138], sub: [128, 129, 130], soul: 1000011, pet: 341, essence: 400039 },
    { main: [15], sub: [97, 98, 99], soul: 1000012, pet: 401, essence: 400008 },
    { main: [189], sub: [228, 229], soul: 1000013, pet: 404, essence: 400037 },
    { main: [251], sub: [232, 233, 234], soul: 1000014, pet: 427, essence: 400004 },
    { main: [253], sub: [254, 255, 256], soul: 1000007, pet: 519, essence: 400028 },
    { main: [450], sub: [445, 446, 447], soul: 1000005, pet: 512, essence: 400028 },
    { main: [525], sub: [293, 294, 295], soul: 1000001, pet: 533, essence: 400005 },
    { main: [337], sub: [547, 548, 549], soul: 1000003, pet: 550, essence: 400007 },
    { main: [516], sub: [469, 470], soul: 1000001, pet: 517, essence: 400040 },
    { main: [481], sub: [560, 561], soul: 1000004, pet: 578, essence: 400039, rare: { soul: 1000009, pet: 639, numerator: 5, denominator: 100 } },
    { main: [67], sub: [604, 605, 606], soul: 1000005, pet: 607, essence: 400003 },
    { main: [717], sub: [378, 379, 380], soul: 1000005, pet: 849, essence: 400003 },
    { main: [554], sub: [203, 204], soul: 1000004, pet: 627, essence: 400031 },
    { main: [511], sub: [463, 464, 465], soul: 1000019, pet: 632, essence: 400039 },
    { main: [473], sub: [480, 481], soul: 1000015, pet: 571, essence: 400005, rare: { soul: 1000009, pet: 639, numerator: 5, denominator: 100 } },
    { main: [577], sub: [618, 619], soul: 1000019, pet: 625, essence: 400040, rare: { soul: 1000009, pet: 639, numerator: 5, denominator: 100 } },
    { main: [559], sub: [83, 84, 85], soul: 1000001, pet: 629, essence: 400037 },
    { main: [561], sub: [576, 577], soul: 1000018, pet: 623, essence: 400031, rare: { soul: 1000009, pet: 639, numerator: 5, denominator: 100 } },
    { main: [234], sub: [310, 311, 312], soul: 1000012, pet: 948, essence: 400008 },
    { main: [393], sub: [526, 527], soul: 1000003, pet: 760, essence: 400007 },
    { main: [597], sub: [598, 599], soul: 1000003, pet: 600, essence: 400037 },
];
const STARTER_BEAD_PET = {
    1000001: 301,
    1000002: 304,
    1000003: 307,
};
function u32(value) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value >>> 0, 0);
    return buffer;
}
function readU32(body, offset) {
    return body.readUInt32BE(offset);
}
class PacketFusion extends BaseProto_1.BaseProto {
    constructor(body) { super(CommandID_1.CommandID.PET_FUSION); this._body = body; }
    _body;
    serialize() { return this._body; }
}
class PacketBytes extends BaseProto_1.BaseProto {
    body;
    constructor(cmd, body) {
        super(cmd);
        this.body = body;
    }
    serialize() { return this.body; }
}
let tableReady = false;
async function ensureTable() {
    if (tableReady)
        return;
    await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
        await driver.execute(TABLE);
        try {
            await driver.execute('ALTER TABLE player_soul_beads ADD COLUMN result_pet INTEGER NOT NULL DEFAULT 0');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            if (!message.includes('duplicate column'))
                throw error;
        }
    });
    tableReady = true;
}
let PetFusionHandler = class PetFusionHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const fail = (code) => player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.PET_FUSION).setResult(code));
        if (body.length < 32) {
            await fail(13028);
            return;
        }
        const mainTime = readU32(body, 0);
        const subTime = readU32(body, 4);
        const slotted = [8, 12, 16, 20].map(offset => readU32(body, offset)).filter(id => id > 0);
        const main = player.PetManager.GetPetByCatchTime(mainTime);
        const sub = player.PetManager.GetPetByCatchTime(subTime);
        if (!main || !sub || mainTime === subTime) {
            await fail(13028);
            return;
        }
        const mainConfig = GameConfig_1.GameConfig.GetPetById(main.petId);
        if (!mainConfig || Number(mainConfig.EvolvesTo || 0) !== 0) {
            await fail(13028);
            return;
        }
        const recipe = RECIPES.find(item => item.main.includes(main.petId) && item.sub.includes(sub.petId));
        if (!recipe) {
            await fail(13028);
            return;
        }
        if (!slotted.includes(recipe.essence) || player.ItemManager.ItemData.GetItemCount(recipe.essence) < 1) {
            await fail(13028);
            return;
        }
        const paid = await player.AddCurrency(undefined, -1000);
        if (!paid) {
            utils_1.Logger.Warn(`[PetFusion] uid=${player.Uid} 赛尔豆不足 coins=${player.Data.coins}`);
            await fail(10016);
            return;
        }
        for (const itemId of slotted) {
            if (itemId < 400001 || itemId > 400049)
                continue;
            if (!player.ItemManager.ItemData.RemoveItem(itemId, 1)) {
                await player.AddCurrency(undefined, 1000);
                await fail(13028);
                return;
            }
        }
        const removedMain = await player.PetManager.PetData.RemovePetByCatchTime(mainTime);
        const removedSub = await player.PetManager.PetData.RemovePetByCatchTime(subTime);
        if (!removedMain || !removedSub) {
            await fail(5000);
            return;
        }
        let soul = recipe.soul;
        let petId = recipe.pet;
        if (recipe.rare && Math.random() * recipe.rare.denominator < recipe.rare.numerator) {
            soul = recipe.rare.soul;
            petId = recipe.rare.pet;
        }
        const obtainTime = Math.floor(Date.now() / 1000);
        await ensureTable();
        await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.execute('INSERT INTO player_soul_beads (owner_id, obtain_time, item_id, buf, result_pet) VALUES (?, ?, ?, ?, ?)', [player.Uid, obtainTime, soul, Buffer.alloc(20), petId]));
        await player.ItemManager.GiveItem(soul, 1);
        utils_1.Logger.Info(`[PetFusion] uid=${player.Uid} main=${main.petId} sub=${sub.petId} soul=${soul} pet=${petId}`);
        await player.SendPacket(new PacketFusion(Buffer.concat([
            u32(obtainTime), u32(soul), u32(mainTime), u32(0),
        ])));
    }
};
exports.PetFusionHandler = PetFusionHandler;
exports.PetFusionHandler = PetFusionHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.PET_FUSION, decorators_1.InjectType.NONE)
], PetFusionHandler);
let GetSoulBeadListHandler = class GetSoulBeadListHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        await ensureTable();
        const rows = await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.query('SELECT obtain_time, item_id FROM player_soul_beads WHERE owner_id = ? ORDER BY obtain_time', [player.Uid]));
        const parts = [u32(rows.length)];
        for (const row of rows)
            parts.push(u32(row.obtain_time), u32(row.item_id));
        await player.SendPacket(new PacketBytes(CommandID_1.CommandID.GET_SOUL_BEAD_List, Buffer.concat(parts)));
    }
};
exports.GetSoulBeadListHandler = GetSoulBeadListHandler;
exports.GetSoulBeadListHandler = GetSoulBeadListHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.GET_SOUL_BEAD_List, decorators_1.InjectType.NONE)
], GetSoulBeadListHandler);
let GetSoulBeadBufHandler = class GetSoulBeadBufHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player || body.length < 4)
            return;
        const obtainTime = readU32(body, 0);
        await ensureTable();
        const rows = await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.query('SELECT buf FROM player_soul_beads WHERE owner_id = ? AND obtain_time = ?', [player.Uid, obtainTime]));
        const buf = rows[0]?.buf ? Buffer.from(rows[0].buf) : Buffer.alloc(20);
        const fixed = Buffer.alloc(20);
        buf.copy(fixed, 0, 0, Math.min(20, buf.length));
        await player.SendPacket(new PacketBytes(CommandID_1.CommandID.GET_SOUL_BEAD_BUF, Buffer.concat([u32(obtainTime), fixed])));
    }
};
exports.GetSoulBeadBufHandler = GetSoulBeadBufHandler;
exports.GetSoulBeadBufHandler = GetSoulBeadBufHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.GET_SOUL_BEAD_BUF, decorators_1.InjectType.NONE)
], GetSoulBeadBufHandler);
let SetSoulBeadBufHandler = class SetSoulBeadBufHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player || body.length < 24) {
            if (player)
                await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.SET_SOUL_BEAD_BUF).setResult(5000));
            return;
        }
        const obtainTime = readU32(body, 0);
        const buf = Buffer.alloc(20);
        body.copy(buf, 0, 4, 24);
        await ensureTable();
        await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.execute('UPDATE player_soul_beads SET buf = ? WHERE owner_id = ? AND obtain_time = ?', [buf, player.Uid, obtainTime]));
        await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.SET_SOUL_BEAD_BUF));
    }
};
exports.SetSoulBeadBufHandler = SetSoulBeadBufHandler;
exports.SetSoulBeadBufHandler = SetSoulBeadBufHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.SET_SOUL_BEAD_BUF, decorators_1.InjectType.NONE)
], SetSoulBeadBufHandler);
let SoulBeadToPetHandler = class SoulBeadToPetHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player || body.length < 4)
            return;
        const obtainTime = readU32(body, 0);
        await ensureTable();
        const rows = await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.query('SELECT item_id, buf, result_pet FROM player_soul_beads WHERE owner_id = ? AND obtain_time = ?', [player.Uid, obtainTime]));
        const row = rows[0];
        const buf = row ? Buffer.from(row.buf) : Buffer.alloc(0);
        if (!row || buf[0] !== 1) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.SOULBEAD_TO_PET).setResult(103547));
            return;
        }
        const petId = Number(row.result_pet) || STARTER_BEAD_PET[row.item_id] || 0;
        if (!petId) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.SOULBEAD_TO_PET).setResult(103547));
            return;
        }
        const granted = await player.PetManager.GivePet(petId, 1, obtainTime);
        if (!granted) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.SOULBEAD_TO_PET).setResult(5000));
            return;
        }
        await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.execute('DELETE FROM player_soul_beads WHERE owner_id = ? AND obtain_time = ?', [player.Uid, obtainTime]));
        await player.ItemManager.ItemData.RemoveItem(row.item_id, 1);
        await player.SendPacket(new PacketBytes(CommandID_1.CommandID.SOULBEAD_TO_PET, Buffer.concat([u32(petId), u32(obtainTime)])));
    }
};
exports.SoulBeadToPetHandler = SoulBeadToPetHandler;
exports.SoulBeadToPetHandler = SoulBeadToPetHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.SOULBEAD_TO_PET, decorators_1.InjectType.NONE)
], SoulBeadToPetHandler);

class PacketSoulStatus extends BaseProto_1.BaseProto {
    constructor(body) {
        super(CommandID_1.CommandID.GET_SOULBEAD_STATUS);
        this._body = body;
    }
    serialize() { return this._body; }
}
function u32be(value) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(value >>> 0, 0);
    return buffer;
}
async function activeSoulBead(ownerId) {
    const rows = await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.query('SELECT obtain_time, item_id, buf FROM player_soul_beads WHERE owner_id = ? ORDER BY obtain_time DESC', [ownerId]));
    for (const row of rows) {
        const buf = row.buf ? Buffer.from(row.buf) : Buffer.alloc(0);
        if (buf.length > 0 && buf[0] === 1)
            return row;
    }
    return null;
}
let TransformSoulBeadHandler = class TransformSoulBeadHandler {
    async Handle(session, _head, body) {
        const player = session.Player;
        if (!player)
            return;
        const fail = (code) => player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.TRANSFORM_SOULBEAD).setResult(code));
        if (!body || body.length < 4) {
            await fail(5001);
            return;
        }
        const obtainTime = body.readUInt32BE(0);
        const rows = await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.query('SELECT item_id FROM player_soul_beads WHERE owner_id = ? AND obtain_time = ?', [player.Uid, obtainTime]));
        if (!rows.length) {
            await fail(103547);
            return;
        }
        const charged = Buffer.alloc(20, 1);
        await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.execute('UPDATE player_soul_beads SET buf = ? WHERE owner_id = ? AND obtain_time = ?', [charged, player.Uid, obtainTime]));
        utils_1.Logger.Info(`[SoulTransform] uid=${player.Uid} obtain=${obtainTime} item=${rows[0].item_id}`);
        await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.TRANSFORM_SOULBEAD));
    }
};
exports.TransformSoulBeadHandler = TransformSoulBeadHandler;
exports.TransformSoulBeadHandler = TransformSoulBeadHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.TRANSFORM_SOULBEAD, decorators_1.InjectType.NONE)
], TransformSoulBeadHandler);
let GetSoulBeadStatusHandler = class GetSoulBeadStatusHandler {
    async Handle(session, _head, _body) {
        const player = session.Player;
        if (!player)
            return;
        const row = await activeSoulBead(player.Uid);
        const obtainTime = row ? row.obtain_time : 0;
        const itemId = row ? row.item_id : 0;
        await player.SendPacket(new PacketSoulStatus(Buffer.concat([
            u32be(obtainTime), u32be(itemId), u32be(0),
        ])));
    }
};
exports.GetSoulBeadStatusHandler = GetSoulBeadStatusHandler;
exports.GetSoulBeadStatusHandler = GetSoulBeadStatusHandler = __decorate([
    (0, decorators_1.Opcode)(CommandID_1.CommandID.GET_SOULBEAD_STATUS, decorators_1.InjectType.NONE)
], GetSoulBeadStatusHandler);
