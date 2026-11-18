'use strict';

const { DatabaseManager } = require('../../../DataBase/DatabaseManager');
const { ConfigLoader } = require('../../../shared/config/ConfigLoader');
const { EncounterStore } = require('./store');
const store = new EncounterStore(DatabaseManager.Instance);

function catalog() {
    const config = ConfigLoader.Instance.LoadJson('data/json/universe.json');
    if (!config || config.version !== 1 || !Array.isArray(config.scenes) || !Array.isArray(config.bossEncounters)) throw new Error('Universe configuration unavailable');
    return config;
}

function shortestPath(config, target) {
    const scenes = new Map(config.scenes.map(s => [s.key, s]));
    const root = config.scenes.find(s => s.key === 'HUB');
    if (!root || !scenes.has(target)) throw new Error('Universe path endpoint missing');
    const queue = [root.key], previous = new Map([[root.key, null]]);
    for (let i = 0; i < queue.length && !previous.has(target); i++) {
        for (const key of scenes.get(queue[i]).neighbours || []) {
            if (scenes.has(key) && !previous.has(key)) {
                previous.set(key, queue[i]);
                queue.push(key);
            }
        }
    }
    if (!previous.has(target)) throw new Error('Universe scene unreachable');
    const path = [];
    for (let key = target; key !== null; key = previous.get(key)) path.push(scenes.get(key));
    return path.reverse();
}

async function importDiscovery(player, config, driver, insert, now) {
    if (!player.ChallengeProgressManager) throw new Error('Challenge progress unavailable');
    for (const boss of config.bossEncounters) {
        if (boss.kind !== 'relocatedBoss' || !Number.isInteger(boss.sptId) || boss.sptId <= 0 || !player.ChallengeProgressManager.HasDefeatedSPTBoss(boss.sptId)) continue;
        for (const scene of shortestPath(config, boss.arenaScene)) {
            await driver.execute(`${insert} INTO universe_discovery (owner_id, map_id, discovered_at, source) VALUES (?, ?, ?, ?)`, [player.Uid, scene.mapId, now, `spt:${boss.sptId}`]);
            await driver.execute(`${insert} INTO universe_discovery_imports (owner_id, spt_id, map_id, imported_at) VALUES (?, ?, ?, ?)`, [player.Uid, boss.sptId, scene.mapId, now]);
        }
    }
}

async function enter(player, request) {
    const config = catalog();
    const destination = config.scenes.find(scene => scene.mapId === Number(request.mapId));
    if (!destination) return false;
    if (destination.resourceBuilt !== true) throw new Error('Universe scene resource unavailable');
    if (!destination.spawn || !Number.isFinite(destination.spawn.x) || !Number.isFinite(destination.spawn.y)) throw new Error('Universe spawn unavailable');
    if (!require('./movement').walkable(destination, destination.spawn.x, destination.spawn.y)) throw new Error('Universe spawn is not walkable');
    let entry = destination.spawn;
    await store.transaction(player.Uid, async (driver, account, insert) => {
        const now = Date.now();
        await importDiscovery(player, config, driver, insert, now);
        const previous = config.scenes.find(scene => scene.mapId === Number(player.Data.mapID));
        const found = await driver.query('SELECT map_id FROM universe_discovery WHERE owner_id = ? AND map_id = ?', [player.Uid, destination.mapId]);
        const landing = (config.planets || []).some(planet => planet.landingKey === destination.key);
        const exit = previous?.exits?.find(item => item.to === destination.key);
        const physical = !!previous && !!exit && (previous.neighbours || []).includes(destination.key) && require('./movement').near(player, previous, exit);
        if (destination.key !== 'HUB' && !landing && !found.length && !physical) throw new Error('Universe map not reachable from current exit');
        if (physical) {
            if (!exit.arrival || !require('./movement').walkable(destination, exit.arrival.x, exit.arrival.y)) throw new Error('Invalid universe exit arrival');
            entry = exit.arrival;
        }
        await driver.execute(`${insert} INTO universe_discovery (owner_id, map_id, discovered_at, source) VALUES (?, ?, ?, ?)`, [player.Uid, destination.mapId, now, 'visit']);
    });
    request.x = entry.x;
    request.y = entry.y;
    require('./movement').reset(player, destination, request.x, request.y);
    return true;
}

module.exports = { catalog, shortestPath, importDiscovery, enter, store };
