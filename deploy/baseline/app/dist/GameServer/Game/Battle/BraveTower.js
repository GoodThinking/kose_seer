"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BRAVE_TOWER_MAX = void 0;
exports.braveTowerFloor = braveTowerFloor;
exports.braveTowerBosses = braveTowerBosses;
exports.braveTowerEnemyLevel = braveTowerEnemyLevel;
exports.resolveBraveTowerFloor = resolveBraveTowerFloor;
exports.saveBraveTowerStage = saveBraveTowerStage;
exports.AdvanceBraveTower = AdvanceBraveTower;
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
const utils_1 = require("../../../shared/utils");
/**
 * 勇者之塔，地图 500。
 * 1–60 层对手和等级来自经典版攻略（7k7k / 4399，2010）。
 * 客户端最高 80 层，61–80 层沿用 51–60 层的阵容，等级 100。
 * 点「开始挑战」发 2414，参数 0 表示当前层。
 * 层数列表发的是十层入口序号：1→1 层，2→11 层，…，8→71 层。
 */
exports.BRAVE_TOWER_MAX = 80;
const EARLY = [
    [15, 30], [18, 32], [40, 34], [32, 36], [26, 38],
    [52, 40], [37, 42], [12, 44], [45, 46], [24, 48],
    [18, 50], [32, 52], [40, 54], [15, 56], [12, 58],
    [61, 60], [58, 62], [32, 64], [26, 66], [37, 68],
    [24, 70], [45, 73], [55, 76], [29, 79], [21, 82],
    [61, 85], [3, 88], [6, 92], [9, 96], [58, 100],
];
const MID_PETS = [40, 26, 45, 52, 15, 32, 37, 18, 64, 67, 73, 107, 24, 101, 99, 110, 104, 90, 85, 76];
const LATE = [
    [29, 18],
    [32, 76],
    [40, 37],
    [45, 21],
    [26, 24],
    [118, 107, 104],
    [127, 79, 121],
    [92, 93, 94],
    [90, 85, 110],
    [138, 140, 142],
];
function buildFloors() {
    const floors = EARLY.map(([petId, level]) => ({ pets: [petId], level }));
    for (const petId of MID_PETS)
        floors.push({ pets: [petId], level: 100 });
    for (let copy = 0; copy < 3; copy++) {
        for (const pets of LATE)
            floors.push({ pets, level: 100 });
    }
    return floors;
}
const FLOORS = buildFloors();
if (FLOORS.length !== exports.BRAVE_TOWER_MAX) {
    throw new Error(`勇者之塔层数应为 ${exports.BRAVE_TOWER_MAX}，实际 ${FLOORS.length}`);
}
function braveTowerFloor(level) {
    const index = Math.min(exports.BRAVE_TOWER_MAX, Math.max(1, level)) - 1;
    return FLOORS[index];
}
function braveTowerBosses(level) {
    return braveTowerFloor(level).pets;
}
function braveTowerEnemyLevel(level) {
    return braveTowerFloor(level).level;
}
/** 列表解锁档数，和客户端 FightLevelModel 的 isOpen 一致。 */
function openCheckpoints(maxCleared) {
    if (maxCleared <= 0)
        return 0;
    if (maxCleared <= 10)
        return 1;
    if (maxCleared >= exports.BRAVE_TOWER_MAX)
        return 8;
    if (maxCleared % 10 === 0)
        return Math.floor(maxCleared / 10);
    return Math.floor(maxCleared / 10) + 1;
}
function resolveBraveTowerFloor(requested, current, maxCleared) {
    if (current > exports.BRAVE_TOWER_MAX && !requested)
        return exports.BRAVE_TOWER_MAX;
    const saved = current >= 1 && current <= exports.BRAVE_TOWER_MAX ? current : 1;
    if (!requested)
        return saved;
    if (requested >= 1 && requested <= 8) {
        const checkpoint = 1 + (requested - 1) * 10;
        if (requested <= openCheckpoints(maxCleared))
            return checkpoint;
    }
    return saved;
}
async function saveBraveTowerStage(userId, current, maxCleared) {
    await DatabaseManager_1.DatabaseManager.Instance.Execute('UPDATE players SET cur_stage = ?, max_stage = ? WHERE user_id = ?', [current, maxCleared, userId]);
}
/** 打赢当前层后进入下一层。首次通关给 层数×10 赛尔豆。重打已过的层不发豆，也不把进度打回去。 */
async function AdvanceBraveTower(userId, data, floor) {
    const cleared = Math.max(0, data.maxStage || 0);
    const next = Math.min(exports.BRAVE_TOWER_MAX + 1, floor + 1);
    data.curStage = next;
    const firstClear = floor > cleared;
    const coins = firstClear ? floor * 10 : 0;
    if (firstClear) {
        data.maxStage = floor;
        data.coins = (data.coins || 0) + coins;
    }
    await DatabaseManager_1.DatabaseManager.Instance.Execute('UPDATE players SET cur_stage = ?, max_stage = ?, coins = coins + ? WHERE user_id = ?', [data.curStage, data.maxStage || 0, coins, userId]);
    utils_1.Logger.Info(`[BraveTower] uid=${userId} cleared=${floor} next=${data.curStage} coins=${coins}`);
}
//# sourceMappingURL=BraveTower.js.map