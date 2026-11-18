'use strict';

const crypto = require('node:crypto');
const { catalog, store } = require('./discovery');
const { individual, sceneFor } = require('./protocol');
const { capture } = require('./capture');

function freezeWild(manager, battle, mapId, originalPetId, slot) {
    if (mapId < 9700 || mapId > 9794 || slot < 0 || slot > 3) return;
    const config = catalog();
    if (config.publishable !== true || !sceneFor(config, mapId)) return;
    battle.universeEventId = crypto.randomUUID();
    battle.universeWild = { eventId: battle.universeEventId, mapId, originalPetId, slot };
}

async function ordinaryResult(manager, battle, outcome) {
    const wild = battle.universeWild;
    if (!wild || battle.universePrivate || !['victory', 'capture'].includes(outcome) || Number(manager.Player.Data.mapID) !== Number(wild.mapId)) return;
    const epoch = manager._battleEpoch;
    const valid = () => manager._currentBattle === battle && manager._battleEpoch === epoch && Number(manager.Player.Data.mapID) === Number(wild.mapId);
    if (!valid()) return;
    const config = catalog(), scene = sceneFor(config, wild.mapId);
    if (!scene) return;
    const state = await store.state(manager.UserID);
    for (const hotspot of (scene.interactions || []).filter(x => x.requiresBattle && x.battlePetId === wild.originalPetId)) {
        const row = state.progress.find(p => Number(p.encounter_id) === hotspot.encounterId);
        if (!row || Number(row.mechanism_step) + 1 !== hotspot.step || (hotspot.victoryOnly && outcome !== 'victory')) {
            await store.transaction(manager.UserID, async (driver, _account, insert) => {
                if (!valid()) throw new Error('Battle context changed');
                const result = await store.recordEvent(driver, insert, manager.UserID, `battle-mechanism:${wild.eventId}:${hotspot.encounterId}`, Date.now());
                if (!valid()) throw new Error('Battle context changed');
                return result;
            });
            continue;
        }
        const encounter = config.encounters.find(e => e.id === hotspot.encounterId && e.scene === scene.key);
        if (!encounter) throw new Error('Battle mechanism target missing');
        await store.mechanism(manager.UserID, encounter, hotspot, scene.interactions, () => individual(encounter), `battle-mechanism:${wild.eventId}:${encounter.id}`, Date.now(), { originalPetId: wild.originalPetId, outcome, validate: valid });
    }
    await store.transaction(manager.UserID, async (driver, account, insert) => {
        if (!valid()) throw new Error('Battle context changed');
        const target = config.encounters.find(e => e.id === Number(account.tracked_id) && e.scene === scene.key && ['rare', 'rarePlus', 'shiny'].includes(e.kind) && e.id !== 79);
        const result = target
            ? await store.roll(driver, account, insert, manager.UserID, target, individual(target), `battle-roll:${wild.eventId}`, Date.now())
            : await store.recordEvent(driver, insert, manager.UserID, `battle-roll:${wild.eventId}`, Date.now());
        if (!valid()) throw new Error('Battle context changed');
        return result;
    });
}

async function privateCatch(manager, battle, catchTime) {
    const identity = battle.universePrivate;
    const epoch = manager._battleEpoch;
    const valid = () => !!identity && manager._currentBattle === battle && manager._battleEpoch === epoch && Number(manager.Player.Data.mapID) === Number(identity.mapId);
    if (!valid()) throw new Error('Private battle context mismatch');
    return capture(store, manager.Player, identity.encounterId, identity.cycleId, catchTime, identity.retainMechanism, valid);
}

module.exports = { freezeWild, ordinaryResult, privateCatch };
