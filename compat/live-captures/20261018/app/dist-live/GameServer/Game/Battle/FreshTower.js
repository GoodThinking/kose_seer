"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FRESH_TOWER_MAX = void 0;
exports.resolveFreshTowerFloor = resolveFreshTowerFloor;
exports.freshTowerBosses = freshTowerBosses;
exports.freshTowerEnemyLevel = freshTowerEnemyLevel;
exports.saveFreshTowerProgress = saveFreshTowerProgress;
exports.AdvanceFreshTower = AdvanceFreshTower;
exports.GrantFreshTowerStarter = GrantFreshTowerStarter;
const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
/** 试炼之塔 30 层。点「开始挑战」时客户端要这一层的精灵编号，才会切到地图 600。 */
const TOWER_PETS = [
    1, 4, 7, 10, 13, 16, 19, 22, 25, 27,
    30, 33, 35, 38, 43, 51, 53, 65, 89, 105,
    116, 119, 156, 158, 184, 188, 198, 205, 232, 235,
];
exports.FRESH_TOWER_MAX = 30;
function resolveFreshTowerFloor(requested, current, maxReached) {
    const saved = current > 0 && current <= exports.FRESH_TOWER_MAX ? current : 1;
    if (!requested)
        return saved;
    const checkpoint = requested === 1 ? 1 : requested === 2 ? 11 : requested === 3 ? 21 : requested;
    const unlocked = Math.min(exports.FRESH_TOWER_MAX, Math.max(1, (maxReached || 0) + 1));
    return Math.min(Math.max(1, checkpoint), unlocked);
}
function freshTowerBosses(level) {
    const floor = Math.min(exports.FRESH_TOWER_MAX, Math.max(1, level));
    // 地图 600 只有一只怪时才会放到台子中央。两只以上坐标停在 0,0，看起来像没怪。
    return [TOWER_PETS[(floor - 1) % TOWER_PETS.length]];
}
function freshTowerEnemyLevel(level) {
    return Math.min(50, 5 + Math.max(1, level));
}
async function saveFreshTowerProgress(userId, current, maxReached) {
    const db = DatabaseManager_1.DatabaseManager.Instance;
    await db.Execute('ALTER TABLE players ADD COLUMN cur_fresh_stage INTEGER NOT NULL DEFAULT 0').catch(() => undefined);
    await db.Execute('ALTER TABLE players ADD COLUMN max_fresh_stage INTEGER NOT NULL DEFAULT 0').catch(() => undefined);
    await db.Execute('UPDATE players SET cur_fresh_stage = ?, max_fresh_stage = ? WHERE user_id = ?', [current, maxReached, userId]);
}
async function AdvanceFreshTower(userId, data, floor) {
    data.curFreshStage = Math.min(exports.FRESH_TOWER_MAX, floor + 1);
    data.maxFreshStage = Math.max(data.maxFreshStage || 0, floor);
    await saveFreshTowerProgress(userId, data.curFreshStage, data.maxFreshStage);
}
//# sourceMappingURL=FreshTower.js.map
const STARTER_IDS = [1, 4, 7];
async function GrantFreshTowerStarter(player) {
    const data = player.PetManager.PetData;
    const owned = new Set();
    for (const pet of data.GetPetsInBag().concat(data.GetPetsInStorage())) {
        owned.add(pet.petId);
    }
    let offset = 0;
    for (const petId of STARTER_IDS) {
        if (owned.has(petId))
            continue;
        const catchTime = Math.floor(Date.now() / 1000) + offset;
        offset += 1;
        const granted = await player.PetManager.GivePet(petId, 5, catchTime);
        if (granted)
            console.log(`[FreshTower] uid=${player.Uid} floor30 starter=${petId}`);
    }
}
