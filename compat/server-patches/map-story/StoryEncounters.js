"use strict";
const definitions = require("../../../../config/data/json/story_encounters.json");
const { DecodeTask96Buffer } = require("../Task/Task96Buffer");
const encounters = new Map(definitions.map(row => [row.mapId + ":" + row.region, row]));

// Original quest and map-activity encounters never use the shared SPT boss balance table.
// undefined leaves an unrelated battle unchanged; null denies a locked encounter.
function GetStoryEncounter(player, mapId, region) {
    const encounter = encounters.get(mapId + ":" + region);
    if (!encounter) return undefined;
    if (player.Data.mapID !== mapId) return null;
    if (encounter.activity === true) {
        if (encounter.requiredCompletedTask && !player.TaskManager.TaskData.IsTaskCompleted(encounter.requiredCompletedTask)) return null;
        if (player.Data.actionType === 1 || player.BattleManager.GetCurrentBattle()) return null;
        if (encounter.requiresSuperNoNo && !player.Data.superNono) return null;
        if (encounter.requiredClothId && !player.Data.clothIds.includes(encounter.requiredClothId)) return null;
        if (encounter.requiredRecord !== undefined) {
            const bytes = player.TaskManager.TaskData.TaskBuffers.get(0)?.storyRecordBytes;
            if (!(bytes?.[encounter.requiredRecord >>> 3] & (1 << (encounter.requiredRecord % 8)))) return null;
        }
        if (encounter.requiredItems?.some(item => player.ItemManager.GetItemCount(item.itemId) < item.count)) return null;
        return encounter;
    }
    const tasks = player.TaskManager.TaskData;
    const status = tasks.GetTask(encounter.taskId)?.status;
    if (status !== 1 && status !== 2) return null;
    const stored = tasks.TaskBuffers.get(encounter.taskId);
    if (!stored && encounter.orderedProgress !== false) return null;
    const progress = stored && (stored.xinBytes ?? DecodeTask96Buffer(stored));
    if (progress?.[encounter.stage] === 1) return null;
    if (encounter.orderedProgress !== false) {
        for (let stage = 0; stage < encounter.stage; stage++) {
            if (progress?.[stage] !== 1) return null;
        }
    }
    return encounter;
}

module.exports = { GetStoryEncounter };
