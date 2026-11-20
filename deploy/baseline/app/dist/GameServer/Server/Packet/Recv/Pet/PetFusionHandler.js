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
const NEIL = [310, 311, 312];
const ESSENCE_BY_TYPE = {
    1: 400005, 2: 400006, 3: 400007, 4: 400004, 5: 400008, 6: 400037,
    7: 400031, 8: 400028, 9: 400003, 10: 400008, 11: 400037, 12: 400028,
    13: 400039, 14: 400028, 15: 400040,
};
const BEIGE = { soul: 1000007, pets: [325, 328, 330] };
const MIRACLES = [
    { main: 135, type: 3, soul: 1000003, essence: 400007, weights: [[677, 10], [861, 10], [364, 9], [526, 9], [598, 9], [635, 9], [701, 9], [740, 9], [820, 9], [854, 9], [1237, 4], [1298, 4]] },
    { main: 239, type: 12, soul: 1000006, essence: 400028, weights: [[281, 11], [370, 11], [564, 11], [219, 9], [461, 9], [590, 9], [592, 9], [665, 9], [833, 9], [1464, 5], [505, 4], [857, 4]] },
    { main: 144, type: 6, soul: 1000005, essence: 400037, weights: [[201, 15], [213, 15], [80, 7], [287, 7], [362, 7], [459, 7], [539, 7], [541, 7], [610, 7], [724, 7], [807, 7], [1277, 7]] },
    { main: 292, type: 7, soul: 1000006, essence: 400031, weights: [[62, 10], [406, 10], [662, 10], [822, 10], [298, 8], [376, 8], [482, 8], [560, 8], [653, 8], [775, 8], [789, 8], [1346, 4]] },
    { main: 55, type: 7, soul: 1000004, essence: 400031, weights: [[409, 11], [884, 11], [924, 9], [951, 9], [1024, 9], [1056, 9], [1096, 9], [1159, 9], [1193, 9], [856, 5], [1121, 5], [1143, 5]] },
    { main: 256, type: 8, soul: 1000007, essence: 400028, weights: [[150, 10], [205, 10], [325, 10], [456, 10], [143, 9], [230, 9], [328, 9], [330, 9], [383, 8], [484, 8], [269, 4], [366, 4]] },
    { main: 110, type: 2, soul: 1000002, essence: 400006, weights: [[872, 11], [905, 11], [960, 11], [988, 10], [289, 9], [866, 9], [899, 9], [975, 9], [1046, 9], [729, 4], [1230, 4], [1297, 4]] },
    { main: 96, type: 2, soul: 1000002, essence: 400006, weights: [[108, 10], [528, 10], [544, 10], [703, 10], [761, 10], [497, 9], [642, 9], [684, 8], [744, 8], [847, 8], [502, 4], [858, 4]] },
    { main: 242, type: 13, soul: 1000004, essence: 400039, weights: [[509, 10], [506, 9], [966, 9], [217, 8], [667, 8], [749, 8], [794, 8], [915, 8], [944, 8], [1022, 8], [1058, 8], [1076, 8]] },
    { main: 619, type: 4, soul: 1000014, essence: 400004, weights: [[612, 10], [751, 10], [521, 8], [583, 8], [680, 8], [692, 8], [805, 8], [818, 8], [864, 8], [882, 8], [911, 8], [939, 8]] },
    { main: 29, type: 1, soul: 1000001, essence: 400005, weights: [[243, 10], [387, 10], [442, 10], [682, 9], [688, 9], [722, 9], [809, 9], [840, 9], [876, 9], [799, 8], [1192, 4], [1216, 4]] },
    { main: 649, type: 11, soul: 1000013, essence: 400037, weights: [[580, 10], [842, 10], [122, 9], [126, 9], [141, 9], [736, 9], [771, 9], [812, 9], [868, 9], [1106, 9], [124, 4], [125, 4]] },
    { main: 1102, type: 1, soul: 1000001, essence: 400005, weights: [[919, 10], [941, 10], [1132, 10], [859, 9], [1060, 9], [1144, 8], [1146, 8], [1172, 8], [1198, 8], [1233, 8], [1271, 8], [1202, 4]] },
    { main: 739, type: 1, soul: 1000001, essence: 400005, weights: [[1495, 16], [1299, 14], [1344, 14], [1374, 14], [1468, 14], [1476, 14], [1428, 7], [1429, 7]] },
    { main: 1250, type: 2, soul: 1000002, essence: 400006, weights: [[1478, 10], [1072, 9], [1116, 9], [1128, 9], [1130, 9], [1218, 9], [1283, 9], [1338, 8], [1415, 8], [1438, 8], [1491, 8], [1200, 4]] },
    { main: 1151, type: 3, soul: 1000003, essence: 400007, weights: [[963, 11], [1152, 11], [889, 10], [922, 10], [926, 10], [1088, 10], [1174, 9], [1178, 9], [1017, 5], [1018, 5], [1019, 5], [1201, 5]] },
    { main: 1095, type: 3, soul: 1000003, essence: 400007, weights: [[1425, 13], [1454, 12], [1205, 10], [1259, 10], [1293, 10], [1322, 10], [1376, 10], [1386, 10], [1485, 10], [1238, 5]] },
    { main: 1113, type: 4, soul: 1000014, essence: 400004, weights: [[993, 10], [1165, 9], [1261, 9], [618, 8], [969, 8], [1013, 8], [1070, 8], [1141, 8], [1157, 8], [1231, 8], [1257, 8], [1269, 8]] },
    { main: 828, type: 4, soul: 1000014, essence: 400004, weights: [[1362, 14], [1401, 14], [1305, 12], [1309, 12], [1370, 12], [1406, 12], [1446, 12], [1487, 12]] },
    { main: 793, type: 5, soul: 1000012, essence: 400008, weights: [[908, 10], [360, 9], [454, 9], [486, 9], [531, 9], [602, 9], [644, 9], [686, 8], [708, 8], [734, 8], [816, 8], [503, 4]] },
    { main: 99, type: 5, soul: 1000012, essence: 400008, weights: [[984, 12], [1108, 12], [1211, 12], [1285, 12], [1295, 12], [1355, 12], [1380, 11], [1448, 11], [1462, 6]] },
    { main: 496, type: 6, soul: 1000005, essence: 400037, weights: [[897, 15], [1054, 15], [887, 7], [1074, 7], [1195, 7], [1209, 7], [1220, 7], [1273, 7], [1318, 7], [1329, 7], [1337, 7], [1388, 7]] },
    { main: 374, type: 6, soul: 1000005, essence: 400037, weights: [[1483, 40], [1392, 20], [1421, 20], [1423, 20]] },
    { main: 1136, type: 7, soul: 1000004, essence: 400031, weights: [[1367, 10], [1228, 9], [1235, 9], [1246, 8], [1255, 8], [1267, 8], [1307, 8], [1311, 8], [1324, 8], [1340, 8], [1349, 8], [1359, 8]] },
    { main: 271, type: 7, soul: 1000004, essence: 400031, weights: [[1465, 20], [1394, 16], [1430, 16], [1440, 16], [1457, 16], [1481, 16]] },
    { main: 266, type: 8, soul: 1000007, essence: 400028, weights: [[604, 10], [746, 10], [878, 10], [953, 10], [567, 9], [650, 9], [718, 9], [870, 9], [901, 8], [986, 8], [652, 4], [756, 4]] },
    { main: 691, type: 8, soul: 1000007, essence: 400028, weights: [[1103, 10], [1123, 10], [1028, 9], [1067, 9], [1203, 9], [1241, 9], [1301, 8], [1333, 8], [1347, 8], [1378, 8], [1417, 8], [1461, 4]] },
    { main: 386, type: 9, soul: 1000005, essence: 400003, weights: [[378, 9], [445, 9], [448, 9], [936, 9], [476, 8], [555, 8], [562, 8], [588, 8], [637, 8], [845, 8], [893, 8], [973, 8]] },
    { main: 163, type: 9, soul: 1000005, essence: 400003, weights: [[1062, 10], [1020, 9], [1026, 9], [1032, 9], [1034, 9], [1036, 9], [1038, 9], [1040, 8], [1176, 8], [1213, 8], [1251, 8], [1215, 4]] },
    { main: 94, type: 9, soul: 1000005, essence: 400003, weights: [[1470, 13], [1275, 11], [1291, 11], [1342, 11], [1353, 11], [1432, 11], [1442, 11], [1315, 6], [1316, 5], [1317, 5], [1361, 5]] },
    { main: 950, type: 10, soul: 1000008, essence: 400008, weights: [[351, 9], [416, 9], [696, 9], [710, 9], [139, 8], [196, 8], [381, 8], [594, 8], [646, 8], [694, 8], [720, 8], [769, 8]] },
    { main: 270, type: 10, soul: 1000008, essence: 400008, weights: [[977, 10], [829, 9], [852, 9], [891, 8], [895, 8], [913, 8], [930, 8], [932, 8], [1015, 8], [1042, 8], [1052, 8], [1080, 8]] },
    { main: 802, type: 10, soul: 1000008, essence: 400008, weights: [[1243, 10], [1280, 10], [1398, 10], [1161, 9], [1224, 9], [1239, 9], [1253, 9], [1320, 9], [1331, 9], [1390, 8], [1278, 4], [1279, 4]] },
    { main: 248, type: 10, soul: 1000008, essence: 400008, weights: [[1434, 25], [1474, 25], [1459, 13], [1473, 13], [4149, 12], [4150, 12]] },
    { main: 272, type: 11, soul: 1000013, essence: 400037, weights: [[451, 10], [488, 10], [620, 10], [148, 9], [397, 9], [596, 9], [648, 9], [673, 9], [675, 9], [928, 8], [432, 4], [881, 4]] },
    { main: 1091, type: 11, soul: 1000013, essence: 400037, weights: [[956, 9], [958, 9], [1002, 9], [1009, 9], [1044, 8], [1084, 8], [1114, 8], [1170, 8], [1226, 8], [1313, 8], [1351, 8], [1396, 8]] },
    { main: 229, type: 11, soul: 1000013, essence: 400037, weights: [[1419, 19], [1444, 18], [1452, 18], [1489, 18], [1498, 18], [1460, 9]] },
    { main: 981, type: 12, soul: 1000006, essence: 400028, weights: [[903, 9], [934, 9], [971, 9], [998, 9], [1065, 9], [1092, 9], [1222, 9], [1264, 9], [1289, 9], [1372, 9], [1069, 5], [1122, 5]] },
    { main: 733, type: 12, soul: 1000006, essence: 400028, weights: [[1408, 32], [1450, 27], [1493, 27], [1463, 14]] },
    { main: 832, type: 13, soul: 1000011, essence: 400039, weights: [[1086, 9], [1188, 9], [1287, 9], [1335, 9], [1357, 9], [1365, 9], [1384, 9], [1404, 9], [1411, 8], [1413, 8], [1436, 8], [1217, 4]] },
    { main: 400, type: 15, soul: 1000019, essence: 400040, weights: [[1326, 11], [414, 10], [469, 10], [515, 10], [576, 9], [787, 9], [825, 9], [917, 9], [1163, 9], [1168, 9], [1266, 5]] },
];
function petConfig(petId) {
    return GameConfig_1.GameConfig.GetPetById(petId);
}
function pickWeighted(weights) {
    const total = weights.reduce((sum, item) => sum + item[1], 0);
    let roll = Math.random() * total;
    for (const [petId, weight] of weights) {
        roll -= weight;
        if (roll < 0)
            return petId;
    }
    return weights[weights.length - 1][0];
}
function resolveFusion(main, sub) {
    const miracle = MIRACLES.find(item => item.main === main.petId);
    const subInfo = petConfig(sub.petId);
    if (miracle && subInfo && (Number(subInfo.Type) === miracle.type || NEIL.includes(sub.petId)))
        return { soul: miracle.soul, pet: pickWeighted(miracle.weights), essence: miracle.essence };
    const fixed = RECIPES.find(item => item.main.includes(main.petId) && item.sub.includes(sub.petId));
    if (fixed)
        return fixed;
    const mainInfo = petConfig(main.petId);
    const essence = ESSENCE_BY_TYPE[Number(mainInfo && mainInfo.Type)] || 0;
    if (subInfo && Number(subInfo.FuseSub || 0) === 1 && essence) {
        return { soul: BEIGE.soul, pet: BEIGE.pets[Math.floor(Math.random() * BEIGE.pets.length)], essence };
    }
    return null;
}
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
        const recipe = resolveFusion(main, sub);
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
