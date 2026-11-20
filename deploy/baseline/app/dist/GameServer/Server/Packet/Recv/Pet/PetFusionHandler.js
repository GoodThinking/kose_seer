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
const DatabaseHelper_1 = require("../../../../../DataBase/DatabaseHelper");
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
    { main: [79], sub: [164, 165, 166], soul: 1000008, pet: 310, essence: 400008, rare: { soul: 1000009, pet: 313, numerator: 25, denominator: 100 } },
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
    { main: [481], sub: [560, 561], soul: 1000004, pet: 578, essence: 400039, rare: { soul: 1000009, pet: 639, numerator: 25, denominator: 100 } },
    { main: [67], sub: [604, 605, 606], soul: 1000005, pet: 607, essence: 400003 },
    { main: [717], sub: [378, 379, 380], soul: 1000005, pet: 849, essence: 400003 },
    { main: [554], sub: [203, 204], soul: 1000004, pet: 627, essence: 400031 },
    { main: [511], sub: [463, 464, 465], soul: 1000019, pet: 632, essence: 400039 },
    { main: [473], sub: [480, 481], soul: 1000015, pet: 571, essence: 400005, rare: { soul: 1000009, pet: 639, numerator: 25, denominator: 100 } },
    { main: [577], sub: [618, 619], soul: 1000019, pet: 625, essence: 400040, rare: { soul: 1000009, pet: 639, numerator: 25, denominator: 100 } },
    { main: [559], sub: [83, 84, 85], soul: 1000001, pet: 629, essence: 400037 },
    { main: [561], sub: [576, 577], soul: 1000018, pet: 623, essence: 400031, rare: { soul: 1000009, pet: 639, numerator: 25, denominator: 100 } },
    { main: [234], sub: [310, 311, 312], soul: 1000012, pet: 948, essence: 400008 },
    { main: [393], sub: [526, 527], soul: 1000003, pet: 760, essence: 400007 },
    { main: [597], sub: [598, 599], soul: 1000003, pet: 600, essence: 400037 },
];
const PROTECTED_UNIQUE_PARENTS = new Set([
    1, 2, 3, 4, 5, 6, 7, 8, 9,
    83, 84, 85,
    190, 191, 192,
    310, 311, 312,
    392, 393,
    472, 473,
]);
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
    { main: 135, type: 3, soul: 1000003, essence: 400007, weights: [[677, 18], [364, 17], [526, 17], [598, 16], [635, 16], [701, 16]] },
    { main: 239, type: 12, soul: 1000006, essence: 400028, weights: [[281, 23], [370, 23], [219, 20], [461, 20], [505, 14]] },
    { main: 292, type: 7, soul: 1000004, essence: 400031, weights: [[62, 18], [406, 17], [409, 17], [298, 16], [376, 16], [482, 16]] },
    { main: 55, type: 7, soul: 1000004, essence: 400031, weights: [[662, 18], [822, 18], [560, 16], [653, 16], [775, 16], [789, 16]] },
    { main: 256, type: 8, soul: 1000007, essence: 400028, weights: [[150, 19], [205, 18], [325, 18], [230, 17], [328, 17], [269, 11]] },
    { main: 242, type: 13, soul: 1000011, essence: 400039, weights: [[506, 18], [509, 18], [217, 16], [667, 16], [749, 16], [794, 16]] },
    { main: 29, type: 1, soul: 1000001, essence: 400005, weights: [[243, 21], [387, 21], [442, 21], [682, 19], [688, 18]] },
    { main: 18, type: 1, soul: 1000001, essence: 400005, weights: [[722, 17], [799, 17], [809, 17], [840, 17], [859, 16], [876, 16]] },
    { main: 212, type: 1, soul: 1000001, essence: 400005, weights: [[919, 21], [941, 21], [1132, 21], [1060, 19], [1144, 18]] },
    { main: 295, type: 1, soul: 1000001, essence: 400005, weights: [[1146, 23], [1172, 23], [1198, 23], [1192, 16], [1202, 15]] },
    { main: 739, type: 1, soul: 1000001, essence: 400005, weights: [[1233, 18], [1271, 18], [1299, 18], [1344, 17], [1374, 17], [1216, 12]] },
    { main: 768, type: 1, soul: 1000001, essence: 400005, weights: [[1495, 25], [1468, 23], [1476, 22], [1428, 15], [1429, 15]] },
    { main: 32, type: 2, soul: 1000002, essence: 400006, weights: [[108, 19], [528, 18], [544, 18], [289, 17], [497, 17], [502, 11]] },
    { main: 34, type: 2, soul: 1000002, essence: 400006, weights: [[703, 18], [761, 18], [642, 16], [684, 16], [744, 16], [847, 16]] },
    { main: 200, type: 2, soul: 1000002, essence: 400006, weights: [[872, 19], [905, 18], [960, 18], [866, 17], [899, 17], [858, 11]] },
    { main: 575, type: 2, soul: 1000002, essence: 400006, weights: [[988, 22], [975, 20], [1046, 20], [1072, 19], [1116, 19]] },
    { main: 786, type: 2, soul: 1000002, essence: 400006, weights: [[1128, 19], [1130, 19], [1218, 19], [1283, 19], [1200, 12], [1230, 12]] },
    { main: 815, type: 2, soul: 1000002, essence: 400006, weights: [[1478, 19], [1338, 18], [1415, 17], [1438, 17], [1491, 17], [1297, 12]] },
    { main: 37, type: 3, soul: 1000003, essence: 400007, weights: [[861, 22], [740, 20], [820, 20], [854, 19], [889, 19]] },
    { main: 40, type: 3, soul: 1000003, essence: 400007, weights: [[963, 22], [922, 20], [926, 19], [1017, 13], [1018, 13], [1019, 13]] },
    { main: 90, type: 3, soul: 1000003, essence: 400007, weights: [[1152, 19], [1088, 18], [1174, 17], [1178, 17], [1205, 17], [1201, 12]] },
    { main: 774, type: 3, soul: 1000003, essence: 400007, weights: [[1259, 25], [1293, 25], [1237, 17], [1238, 17], [1298, 16]] },
    { main: 1095, type: 3, soul: 1000003, essence: 400007, weights: [[1425, 18], [1454, 18], [1322, 16], [1376, 16], [1386, 16], [1485, 16]] },
    { main: 12, type: 4, soul: 1000014, essence: 400004, weights: [[612, 22], [521, 20], [583, 20], [618, 19], [680, 19]] },
    { main: 24, type: 4, soul: 1000014, essence: 400004, weights: [[751, 18], [692, 17], [805, 17], [818, 16], [864, 16], [882, 16]] },
    { main: 26, type: 4, soul: 1000014, essence: 400004, weights: [[993, 22], [911, 20], [939, 20], [969, 19], [1013, 19]] },
    { main: 166, type: 4, soul: 1000014, essence: 400004, weights: [[1165, 22], [1070, 20], [1141, 20], [1157, 19], [1231, 19]] },
    { main: 268, type: 4, soul: 1000014, essence: 400004, weights: [[1261, 18], [1362, 18], [1257, 16], [1269, 16], [1305, 16], [1309, 16]] },
    { main: 345, type: 4, soul: 1000014, essence: 400004, weights: [[1401, 22], [1370, 20], [1406, 20], [1446, 19], [1487, 19]] },
    { main: 21, type: 5, soul: 1000012, essence: 400008, weights: [[360, 15], [454, 15], [486, 15], [531, 15], [602, 15], [644, 15], [503, 10]] },
    { main: 45, type: 5, soul: 1000012, essence: 400008, weights: [[908, 16], [686, 14], [708, 14], [734, 14], [816, 14], [984, 14], [1108, 14]] },
    { main: 99, type: 5, soul: 1000012, essence: 400008, weights: [[1211, 15], [1285, 15], [1295, 15], [1355, 15], [1380, 15], [1448, 15], [1462, 10]] },
    { main: 101, type: 6, soul: 1000005, essence: 400037, weights: [[143, 20], [201, 20], [213, 20], [80, 14], [287, 13], [362, 13]] },
    { main: 104, type: 6, soul: 1000005, essence: 400037, weights: [[459, 17], [539, 17], [541, 17], [610, 17], [724, 16], [807, 16]] },
    { main: 374, type: 6, soul: 1000005, essence: 400037, weights: [[897, 25], [1054, 25], [887, 17], [1074, 17], [1195, 16]] },
    { main: 375, type: 6, soul: 1000005, essence: 400037, weights: [[1209, 17], [1220, 17], [1273, 17], [1277, 17], [1318, 16], [1329, 16]] },
    { main: 496, type: 6, soul: 1000005, essence: 400037, weights: [[1483, 23], [1337, 16], [1388, 16], [1392, 15], [1421, 15], [1423, 15]] },
    { main: 107, type: 7, soul: 1000004, essence: 400031, weights: [[884, 19], [924, 18], [951, 17], [1024, 17], [1056, 17], [856, 12]] },
    { main: 204, type: 7, soul: 1000004, essence: 400031, weights: [[1096, 19], [1159, 19], [1193, 19], [1228, 19], [1121, 12], [1143, 12]] },
    { main: 236, type: 7, soul: 1000004, essence: 400031, weights: [[1235, 17], [1246, 17], [1255, 17], [1267, 17], [1307, 16], [1311, 16]] },
    { main: 259, type: 7, soul: 1000004, essence: 400031, weights: [[1367, 19], [1324, 18], [1340, 17], [1349, 17], [1359, 17], [1346, 12]] },
    { main: 700, type: 7, soul: 1000004, essence: 400031, weights: [[1465, 18], [1394, 17], [1430, 17], [1440, 16], [1457, 16], [1481, 16]] },
    { main: 121, type: 8, soul: 1000007, essence: 400028, weights: [[456, 23], [330, 21], [383, 21], [484, 21], [366, 14]] },
    { main: 185, type: 8, soul: 1000007, essence: 400028, weights: [[604, 19], [746, 19], [567, 17], [650, 17], [718, 17], [756, 11]] },
    { main: 266, type: 8, soul: 1000007, essence: 400028, weights: [[878, 18], [953, 18], [870, 16], [901, 16], [986, 16], [1028, 16]] },
    { main: 691, type: 8, soul: 1000007, essence: 400028, weights: [[1103, 22], [1123, 21], [1067, 19], [1203, 19], [1241, 19]] },
    { main: 1151, type: 8, soul: 1000007, essence: 400028, weights: [[1301, 18], [1333, 18], [1347, 18], [1378, 17], [1417, 17], [1461, 12]] },
    { main: 157, type: 9, soul: 1000005, essence: 400003, weights: [[378, 18], [445, 17], [448, 17], [476, 16], [555, 16], [562, 16]] },
    { main: 160, type: 9, soul: 1000005, essence: 400003, weights: [[936, 18], [588, 17], [592, 17], [637, 16], [845, 16], [893, 16]] },
    { main: 386, type: 9, soul: 1000005, essence: 400003, weights: [[973, 17], [1020, 17], [1026, 17], [1032, 17], [1034, 16], [1036, 16]] },
    { main: 431, type: 9, soul: 1000005, essence: 400003, weights: [[1062, 19], [1038, 18], [1040, 17], [1176, 17], [1213, 17], [1215, 12]] },
    { main: 707, type: 9, soul: 1000005, essence: 400003, weights: [[1470, 19], [1342, 18], [1353, 17], [1432, 17], [1442, 17], [1361, 12]] },
    { main: 731, type: 9, soul: 1000005, essence: 400003, weights: [[1251, 20], [1275, 20], [1291, 20], [1315, 14], [1316, 13], [1317, 13]] },
    { main: 396, type: 10, soul: 1000008, essence: 400008, weights: [[1434, 22], [1474, 22], [1459, 14], [1473, 14], [4149, 14], [4150, 14]] },
    { main: 493, type: 10, soul: 1000008, essence: 400008, weights: [[351, 18], [416, 18], [139, 16], [196, 16], [381, 16], [594, 16]] },
    { main: 765, type: 10, soul: 1000008, essence: 400008, weights: [[829, 17], [852, 17], [891, 17], [895, 17], [913, 16], [930, 16]] },
    { main: 802, type: 10, soul: 1000008, essence: 400008, weights: [[696, 18], [710, 18], [646, 16], [694, 16], [720, 16], [769, 16]] },
    { main: 832, type: 10, soul: 1000008, essence: 400008, weights: [[1243, 19], [1161, 18], [1224, 17], [1239, 17], [1253, 17], [1278, 12]] },
    { main: 1102, type: 10, soul: 1000008, essence: 400008, weights: [[1280, 19], [1398, 19], [1320, 17], [1331, 17], [1390, 17], [1279, 11]] },
    { main: 1136, type: 10, soul: 1000008, essence: 400008, weights: [[977, 18], [932, 17], [1015, 17], [1042, 16], [1052, 16], [1080, 16]] },
    { main: 147, type: 11, soul: 1000013, essence: 400037, weights: [[1444, 22], [1452, 22], [1489, 21], [1498, 21], [1460, 14]] },
    { main: 229, type: 11, soul: 1000013, essence: 400037, weights: [[122, 20], [126, 20], [141, 20], [148, 20], [397, 20]] },
    { main: 743, type: 11, soul: 1000013, essence: 400037, weights: [[673, 20], [675, 20], [736, 20], [771, 20], [812, 20]] },
    { main: 828, type: 11, soul: 1000013, essence: 400037, weights: [[842, 18], [868, 17], [928, 17], [956, 16], [958, 16], [1002, 16]] },
    { main: 1049, type: 11, soul: 1000013, essence: 400037, weights: [[1009, 20], [1044, 20], [1084, 20], [1106, 20], [1114, 20]] },
    { main: 1091, type: 11, soul: 1000013, essence: 400037, weights: [[451, 17], [488, 17], [580, 17], [620, 17], [596, 16], [648, 16]] },
    { main: 1113, type: 11, soul: 1000013, essence: 400037, weights: [[1170, 17], [1226, 17], [1313, 17], [1351, 17], [1396, 16], [1419, 16]] },
    { main: 286, type: 12, soul: 1000006, essence: 400028, weights: [[934, 22], [971, 22], [998, 21], [1065, 21], [1069, 14]] },
    { main: 733, type: 12, soul: 1000006, essence: 400028, weights: [[564, 19], [590, 18], [665, 17], [833, 17], [903, 17], [857, 12]] },
    { main: 793, type: 12, soul: 1000006, essence: 400028, weights: [[1092, 18], [1222, 18], [1264, 18], [1289, 17], [1372, 17], [1122, 12]] },
    { main: 1006, type: 12, soul: 1000006, essence: 400028, weights: [[1408, 25], [1450, 23], [1493, 22], [1463, 15], [1464, 15]] },
    { main: 130, type: 13, soul: 1000011, essence: 400039, weights: [[966, 18], [915, 17], [944, 17], [1022, 16], [1058, 16], [1076, 16]] },
    { main: 280, type: 13, soul: 1000011, essence: 400039, weights: [[1086, 18], [1188, 18], [1287, 18], [1335, 17], [1357, 17], [1217, 12]] },
    { main: 465, type: 13, soul: 1000011, essence: 400039, weights: [[1365, 17], [1384, 17], [1404, 17], [1411, 17], [1413, 16], [1436, 16]] },
    { main: 400, type: 15, soul: 1000019, essence: 400040, weights: [[414, 17], [469, 17], [515, 17], [576, 17], [787, 16], [825, 16]] },
    { main: 1140, type: 15, soul: 1000019, essence: 400040, weights: [[1326, 23], [917, 21], [1163, 21], [1168, 21], [1266, 14]] },
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
        return { kind: 'miracle', poolKey: `miracle:${miracle.main}`, soul: miracle.soul, weights: miracle.weights, pet: pickWeighted(miracle.weights), essence: miracle.essence };
    const fixed = RECIPES.find(item => item.main.includes(main.petId) && item.sub.includes(sub.petId));
    if (fixed)
        return { kind: 'fixed', poolKey: `fixed:${fixed.pet}`, ...fixed };
    const mainInfo = petConfig(main.petId);
    const essence = ESSENCE_BY_TYPE[Number(mainInfo && mainInfo.Type)] || 0;
    if (subInfo && Number(subInfo.FuseSub || 0) === 1 && essence) {
        return { kind: 'beige', poolKey: 'beige', soul: BEIGE.soul, pets: BEIGE.pets, pet: BEIGE.pets[Math.floor(Math.random() * BEIGE.pets.length)], essence };
    }
    return null;
}
function collectFamilyIds(seedIds) {
    const out = new Set();
    for (const rawId of seedIds) {
        let cur = Number(rawId) || 0;
        const seen = new Set();
        while (cur > 0 && !seen.has(cur)) {
            seen.add(cur);
            out.add(cur);
            const info = petConfig(cur);
            cur = Number(info && info.EvolvesFrom) || 0;
        }
        cur = Number(rawId) || 0;
        seen.clear();
        while (cur > 0 && !seen.has(cur)) {
            seen.add(cur);
            out.add(cur);
            const info = petConfig(cur);
            cur = Number(info && info.EvolvesTo) || 0;
        }
    }
    return out;
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
const PITY_TABLE = `CREATE TABLE IF NOT EXISTS player_fusion_pity (
  owner_id INTEGER NOT NULL,
  pool_key TEXT NOT NULL,
  streak INTEGER NOT NULL DEFAULT 0,
  last_pet INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (owner_id, pool_key)
)`;
let tableReady = false;
function makeChargedBuf(selected = false) {
    const b = Buffer.alloc(20, 1);
    b[19] = selected ? 2 : 0;
    return b;
}
async function ensureTable() {
    if (tableReady)
        return;
    await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
        await driver.execute(TABLE);
        await driver.execute(PITY_TABLE);
        const cols = await driver.query('PRAGMA table_info(player_soul_beads)');
        if (Array.isArray(cols) && !cols.some(c => c && c.name === 'result_pet')) {
            await driver.execute('ALTER TABLE player_soul_beads ADD COLUMN result_pet INTEGER NOT NULL DEFAULT 0');
        }
    });
    tableReady = true;
}
async function resolvePityOutcome(player, recipe) {
    await ensureTable();
    return DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
        const beadRows = await driver.query('SELECT result_pet FROM player_soul_beads WHERE owner_id = ?', [player.Uid]);
        const pityRows = await driver.query('SELECT streak, last_pet FROM player_fusion_pity WHERE owner_id = ? AND pool_key = ?', [player.Uid, recipe.poolKey]);
        const streak = Number(pityRows[0]?.streak || 0);
        const lastPet = Number(pityRows[0]?.last_pet || 0);
        const ownedSeeds = [
            ...(player.PetManager.PetData.PetList || []).map(p => p.petId),
            ...beadRows.map(r => Number(r.result_pet) || 0),
        ];
        const ownedFamilies = collectFamilyIds(ownedSeeds);
        const savePity = async (nextStreak, nextLastPet) => {
            await driver.execute('INSERT INTO player_fusion_pity (owner_id, pool_key, streak, last_pet) VALUES (?, ?, ?, ?) ON CONFLICT(owner_id, pool_key) DO UPDATE SET streak = excluded.streak, last_pet = excluded.last_pet', [player.Uid, recipe.poolKey, nextStreak, nextLastPet]);
        };

        if (recipe.kind === 'miracle') {
            const weights = recipe.weights;
            const unowned = weights.filter(([pid]) => !ownedFamilies.has(pid));
            const minW = Math.min(...weights.map(([, w]) => w));
            const rarePool = weights.filter(([, w]) => w <= minW);
            let chosenId = recipe.pet;
            if (unowned.length > 0) {
                if (streak >= 1) {
                    // 硬保底：上一发出了已拥有精灵，本发 100% 从尚未拥有的绝版精灵中产出
                    chosenId = pickWeighted(unowned);
                }
                else {
                    // 未拥有精灵权重 ×4，且排除与上一发完全相同的精灵
                    const nonRepeat = weights.filter(([pid]) => pid !== lastPet);
                    const basePool = nonRepeat.length > 0 ? nonRepeat : weights;
                    const boosted = basePool.map(([pid, w]) => [pid, ownedFamilies.has(pid) ? w : w * 4]);
                    chosenId = pickWeighted(boosted);
                }
                const nextStreak = ownedFamilies.has(chosenId) ? streak + 1 : 0;
                await savePity(nextStreak, chosenId);
            }
            else {
                // 该池已全收集：若连续 weights.length 发未出最低权重大奖则硬保底必出大奖，且不连续两发重复同一只
                if (streak >= weights.length - 1 && rarePool.length > 0) {
                    const nonRepeatRare = rarePool.filter(([pid]) => pid !== lastPet);
                    chosenId = pickWeighted(nonRepeatRare.length > 0 ? nonRepeatRare : rarePool);
                }
                else {
                    const nonRepeat = weights.filter(([pid]) => pid !== lastPet);
                    chosenId = pickWeighted(nonRepeat.length > 0 ? nonRepeat : weights);
                }
                const isRare = rarePool.some(([pid]) => pid === chosenId);
                await savePity(isRare ? 0 : streak + 1, chosenId);
            }
            return { soul: recipe.soul, petId: chosenId };
        }

        if (recipe.kind === 'fixed' && recipe.rare) {
            const needRareOnly = ownedFamilies.has(recipe.pet) && !ownedFamilies.has(recipe.rare.pet);
            const forceRare = (needRareOnly && streak >= 1) || streak >= 2;
            const hitRare = forceRare || (Math.random() * recipe.rare.denominator < recipe.rare.numerator);
            const soul = hitRare ? recipe.rare.soul : recipe.soul;
            const petId = hitRare ? recipe.rare.pet : recipe.pet;
            await savePity(hitRare ? 0 : streak + 1, petId);
            return { soul, petId };
        }

        if (recipe.kind === 'beige') {
            const unowned = recipe.pets.filter(pid => !ownedFamilies.has(pid));
            const pool = unowned.length > 0 ? unowned : recipe.pets.filter(pid => pid !== lastPet);
            const finalPool = pool.length > 0 ? pool : recipe.pets;
            const chosenId = finalPool[Math.floor(Math.random() * finalPool.length)];
            await savePity(0, chosenId);
            return { soul: recipe.soul, petId: chosenId };
        }

        return { soul: recipe.soul, petId: recipe.pet };
    });
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
        const preserveMain = PROTECTED_UNIQUE_PARENTS.has(main.petId);
        const preserveSub = PROTECTED_UNIQUE_PARENTS.has(sub.petId);
        let removedMain = true;
        let removedSub = true;
        if (preserveMain) {
            main.isInBag = false;
            main.isDefault = false;
        }
        else {
            removedMain = await player.PetManager.PetData.RemovePetByCatchTime(mainTime);
        }
        if (preserveSub) {
            sub.isInBag = false;
            sub.isDefault = false;
        }
        else {
            removedSub = await player.PetManager.PetData.RemovePetByCatchTime(subTime);
        }
        if (!removedMain || !removedSub) {
            await fail(5000);
            return;
        }
        const { soul, petId } = await resolvePityOutcome(player, recipe);
        const obtainTime = Math.floor(Date.now() / 1000);
        await ensureTable();
        await DatabaseManager_1.DatabaseManager.Instance.WithConnection(driver => driver.execute('INSERT INTO player_soul_beads (owner_id, obtain_time, item_id, buf, result_pet) VALUES (?, ?, ?, ?, ?)', [player.Uid, obtainTime, soul, makeChargedBuf(false), petId]));
        await player.ItemManager.GiveItem(soul, 1);
        utils_1.Logger.Info(`[PetFusion] uid=${player.Uid} main=${main.petId}(preserve=${preserveMain}) sub=${sub.petId}(preserve=${preserveSub}) soul=${soul} pet=${petId}`);
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
        const fixed = makeChargedBuf(false);
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
        const buf = makeChargedBuf(false);
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
        if (!row) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.SOULBEAD_TO_PET).setResult(103547));
            return;
        }
        const petId = Number(row.result_pet) || STARTER_BEAD_PET[row.item_id] || 0;
        if (!petId) {
            await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.SOULBEAD_TO_PET).setResult(103547));
            return;
        }
        let hatched = player.PetManager.GetPetByCatchTime(obtainTime);
        if (!hatched) {
            const granted = await player.PetManager.GivePet(petId, 1, obtainTime);
            if (!granted) {
                await player.SendPacket(new PacketEmpty_1.PacketEmpty(CommandID_1.CommandID.SOULBEAD_TO_PET).setResult(5000));
                return;
            }
            hatched = player.PetManager.GetPetByCatchTime(obtainTime);
        }
        if (hatched) {
            try {
                const playModes = require("../../../../Game/Progression/PlayModes");
                const aura = await playModes.GetDexAura(player.Uid);
                playModes.InvalidateDexCache(player.Uid);
                const dv31Rate = aura?.dv31Rate || 0.15;
                const minDv = Math.random() < dv31Rate ? 31 : (20 + Math.floor(Math.random() * 12));
                const dvKeys = ["dvHp", "dvAtk", "dvDef", "dvSpAtk", "dvSpDef", "dvSpeed"];
                if (dvKeys.some(k => (hatched[k] || 0) < minDv)) {
                    for (const k of dvKeys) hatched[k] = Math.max(hatched[k] || 0, minDv);
                    const { PetCalculator } = require("../../../../Game/Pet/PetCalculator");
                    PetCalculator.UpdatePetStats(hatched);
                    await DatabaseHelper_1.DatabaseHelper.Instance.SavePetData(player.PetManager.PetData);
                }
            } catch (e) {
                utils_1.Logger.Warn("[SoulBeadToPet] DV floor bonus skipped:", e?.message || e);
            }
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
        if (buf.length >= 20 && buf[19] === 2)
            return row;
    }
    for (const row of rows) {
        const buf = row.buf ? Buffer.from(row.buf) : Buffer.alloc(0);
        if (buf.length > 0 && buf[0] === 1)
            return row;
    }
    return rows[0] || null;
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
        await DatabaseManager_1.DatabaseManager.Instance.WithConnection(async (driver) => {
            await driver.execute('UPDATE player_soul_beads SET buf = ? WHERE owner_id = ?', [makeChargedBuf(false), player.Uid]);
            await driver.execute('UPDATE player_soul_beads SET buf = ? WHERE owner_id = ? AND obtain_time = ?', [makeChargedBuf(true), player.Uid, obtainTime]);
        });
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
