'use strict';

const crypto = require('node:crypto');
const { BaseProto } = require('../../../shared/proto/base/BaseProto');
const { Handlers, InjectType } = require('../../../shared/decorators/Opcode');
const { GameConfig } = require('../../../shared/config/game/GameConfig');
const { catalog, importDiscovery, store } = require('./discovery');

const COMMANDS = [64000, 64001, 64002, 64003, 64004, 64005];
const LENGTHS = [4, 4, 12, 0, 8, 12];

class StatePacket extends BaseProto {
    constructor(command, state) {
        super(command);
        const a = state.account;
        const words = [2, state.discovered.length, ...state.discovered, a.tracked_id, a.pending_id, a.pending_cycle, a.pending_pet, a.pending_level, a.pending_dv, a.pending_nature, state.progress.length];
        for (const row of state.progress) words.push(row.encounter_id, row.failures, row.cycle_id, row.mechanism_step);
        words.push(state.surveys.length);
        for (const row of state.surveys) words.push(row.map_id, row.landmark_mask, row.cooldown_ms);
        words.push(Number(a.interaction_nonce) + 1);
        this.data = Buffer.alloc(words.length * 4);
        words.forEach((n, i) => {
            n = Number(n);
            if (!Number.isInteger(n) || n < 0 || n > 0xffffffff) throw new RangeError('Invalid state word');
            this.data.writeUInt32BE(n, i * 4);
        });
    }
    serialize() { return this.data; }
}

function individual(encounter) {
    const min = Number(encounter.minLevel ?? encounter.level);
    const max = Number(encounter.maxLevel ?? encounter.level);
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 100 || max < min || !GameConfig.GetPetById(encounter.petId)) throw new Error('Encounter target resources or level unavailable');
    return { level: crypto.randomInt(min, max + 1), dv: crypto.randomInt(32), nature: crypto.randomInt(25) };
}

function sceneFor(config, mapId) { return config.scenes.find(s => Number(s.mapId) === Number(mapId)); }
function encounterFor(config, id, scene) {
    const encounter = config.encounters.find(e => e.id === id);
    if (config.publishable !== true || !encounter || encounter.scene !== scene.key || !['rare', 'rarePlus', 'shiny', 'mechanism'].includes(encounter.kind)) throw new Error('Encounter unavailable');
    return encounter;
}
function validateHotspot(player, scene, hotspot) {
    if (!require('./movement').near(player, scene, hotspot)) throw new Error('Player not near interaction');
}
async function getState(player) {
    const config = catalog();
    return store.transaction(player.Uid, async (driver, account, insert) => {
        await importDiscovery(player, config, driver, insert, Date.now());
        return store.snapshot(driver, player.Uid, account);
    });
}
async function select(player, id) {
    const config = catalog(), scene = sceneFor(config, player.Data.mapID);
    if (!scene) throw new Error('Not in universe scene');
    const encounter = encounterFor(config, id, scene);
    if (!['rare', 'rarePlus', 'shiny'].includes(encounter.kind)) throw new Error('Target not trackable');
    return store.transaction(player.Uid, async (driver, account, insert) => {
        const survey = await driver.query('SELECT completed_at FROM universe_surveys WHERE owner_id = ? AND map_id = ?', [player.Uid, scene.mapId]);
        if (!survey.length || !Number(survey[0].completed_at)) {
            const error = new Error('Observation guide incomplete');
            error.universeSurveyIncomplete = true;
            throw error;
        }
        const progress = await store.ensureProgress(driver, insert, player.Uid, id);
        if (encounter.kind === 'shiny') {
            const list = (scene.interactions || []).filter(x => x.encounterId === id && x.kind === 'trackingPrerequisite');
            const last = list.reduce((n, x) => Math.max(n, x.step), 0);
            if (!last || Number(progress.mechanism_step) < last) {
                const error = new Error('Tracking prerequisite incomplete');
                error.universeTrackingPrerequisiteIncomplete = true;
                throw error;
            }
        }
        await driver.execute('UPDATE universe_accounts SET tracked_id = ? WHERE owner_id = ?', [id, player.Uid]);
        account.tracked_id = id;
        return store.snapshot(driver, player.Uid, account);
    });
}
async function interaction(player, mapId, id, nonce) {
    if (!nonce) throw new Error('Invalid interaction request');
    const config = catalog(), scene = sceneFor(config, mapId);
    if (config.publishable !== true || !scene || !Array.isArray(scene.interactions)) throw new Error('Scene interactions unavailable');
    const hotspot = scene.interactions.find(item => item.id === id);
    if (!hotspot || hotspot.requiresBattle) throw new Error('Invalid interaction');
    const request = { nonce, mapId, id, validate() {
        if (Number(player.Data.mapID) !== mapId) throw new Error('Wrong map');
        const manager = player.BattleManager;
        if (manager._universeEntry || manager._catchInProgress || (manager._currentBattle && !manager._currentBattle.isOver)) throw new Error('Interaction unavailable in battle');
        validateHotspot(player, scene, hotspot);
    } };
    const event = `interaction:${nonce}`;
    if (hotspot.kind === 'survey') {
        const selected = account => config.encounters.find(e => e.id === Number(account.tracked_id) && e.scene === scene.key && ['rare', 'rarePlus', 'shiny'].includes(e.kind) && e.id !== 77);
        return store.survey(player.Uid, mapId, hotspot.step, selected, individual, event, Date.now(), request);
    }
    const encounter = encounterFor(config, hotspot.encounterId, scene);
    return store.mechanism(player.Uid, encounter, hotspot, scene.interactions, () => individual(encounter), event, Date.now(), null, request);
}
async function enter(player, id, cycle, command) {
    const config = catalog(), scene = sceneFor(config, player.Data.mapID), manager = player.BattleManager;
    if (!scene || manager._universeEntry || manager._catchInProgress || manager._battleActionsInProgress || (manager._currentBattle && !manager._currentBattle.isOver)) throw new Error('Cannot enter encounter');
    const encounter = encounterFor(config, id, scene);
    const epoch = manager._battleEpoch;
    manager._universeEntry = true;
    try {
        let battle;
        const state = await store.transaction(player.Uid, async (driver, account) => {
            if (Number(account.pending_id) !== id || Number(account.pending_cycle) !== cycle || Number(account.pending_pet) !== encounter.petId) throw new Error('Pending encounter mismatch');
            battle = await manager._initService.CreatePVEBattle(encounter.petId, Number(account.pending_level), { dv: Number(account.pending_dv), nature: Number(account.pending_nature) });
            if (!battle) {
                const error = new Error('Cannot create private battle');
                if (!player.PetManager.GetPetsInBag().some(pet => pet.hp > 0)) error.universeNoHealthyPet = true;
                throw error;
            }
            battle.universePrivate = { encounterId: id, cycleId: cycle, mapId: scene.mapId, retainMechanism: encounter.kind === 'shiny' };
            return store.snapshot(driver, player.Uid, account);
        });
        if (Number(player.Data.mapID) !== scene.mapId || manager._battleEpoch !== epoch || (manager._currentBattle && !manager._currentBattle.isOver)) throw new Error('Battle context changed');
        manager._currentBattleSlot = -1;
        manager._currentBattleMapId = scene.mapId;
        manager._currentBattleOriginalPetId = encounter.petId;
        manager.InitializeBattle(battle);
        await player.SendPacket(new StatePacket(command, state));
        if (manager._currentBattle === battle && Number(player.Data.mapID) === scene.mapId)
            await manager.SendReadyToFight(battle, encounter.name);
    } finally {
        manager._universeEntry = false;
    }
}

function register() {
    for (let i = 0; i < COMMANDS.length; i++) {
        const command = COMMANDS[i], length = LENGTHS[i];
        if (Handlers.Get(command)) throw new Error(`Universe opcode collision: ${command}`);
        class UniverseHandler {
            async Handle(session, _head, body) {
                const player = session.Player;
                if (!player) return;
                try {
                    if (body.length !== length) throw new Error('Invalid request length');
                    const words = Array.from({ length: body.length / 4 }, (_, j) => body.readUInt32BE(j * 4));
                    let state;
                    switch (command) {
                        case 64000: if (words[0] !== 2) throw new Error('Unsupported version'); state = await getState(player); break;
                        case 64001: state = await select(player, words[0]); break;
                        case 64002: state = await interaction(player, words[0], words[1], words[2]); break;
                        case 64003: state = await getState(player); break;
                        case 64004: await enter(player, words[0], words[1], command); return;
                        case 64005:
                            if (words[2] !== 1 || player.BattleManager._universeEntry || (player.BattleManager._currentBattle && !player.BattleManager._currentBattle.isOver)) throw new Error('Explicit abandon confirmation required');
                            state = await store.abandon(player.Uid, words[0], words[1], catalog().encounters.some(e => e.id === words[0] && e.kind === 'shiny')); break;
                    }
                    await player.SendPacket(new StatePacket(command, state));
                } catch (error) {
                    require('../../../shared/utils/Logger').Logger.Error('[Universe] Request rejected', error);
                    const { PacketEmpty } = require('../../Server/Packet/Send/PacketEmpty');
                    const missing = Number(error.universeMissingPet);
                    const result = command === 64004 && error.universeNoHealthyPet === true ? 59999 :
                        command === 64001 && error.universeSurveyIncomplete === true ? 59998 :
                        command === 64001 && error.universeTrackingPrerequisiteIncomplete === true ? 59997 :
                        command === 64002 && Number.isInteger(missing) && missing > 0 && missing < 10000 ? 60000 + missing : 5001;
                    await player.SendPacket(new PacketEmpty(command).setResult(result));
                }
            }
        }
        Handlers.Register(command, UniverseHandler, InjectType.NONE);
    }
}

module.exports = { register, StatePacket, individual, sceneFor, encounterFor, getState, enter };
