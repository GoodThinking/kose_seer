"use strict";
// Only the original free, unique map pickups; no general furniture shop or room-placement rules.
const { DatabaseManager } = require('../../../DataBase/DatabaseManager');
const { GameConfig } = require('../../../shared/config/game/GameConfig');
const { ItemEventType, ItemGainSource } = require('../Event/EventTypes');
const { Logger } = require('../../../shared/utils');

const MAP_ITEMS = new Map([[500640, 344], [500641, 344], [500824, 334]]);
class MapFitmentAlreadyOwned extends Error {
    constructor() { super('Map furniture already owned'); }
}

async function Grant(player, itemId, count) {
    const mapId = MAP_ITEMS.get(itemId);
    const item = mapId && GameConfig.GetItemById(itemId);
    if (!item || item.Price !== 0 || item.Max !== 1 || count !== 1)
        throw new Error('Invalid map furniture reward');
    const session = player.Session;
    const valid = () => player.Data.mapID === mapId && player.Session === session && session?.Player === player && !session.Socket.destroyed;
    if (!valid()) throw new Error('Map furniture reward unavailable');
    const inventory = player.ItemManager.ItemData;
    const release = await inventory.AcquireReward();
    let committed = false;
    try {
        if (!valid()) throw new Error('Map furniture reward unavailable');
        const staged = inventory.ItemList.map(entry => ({ ...entry }));
        const matches = staged.filter(entry => entry.itemId === itemId);
        if (matches.length > 1 || matches.some(entry => !Number.isSafeInteger(entry.count) || entry.count < 0))
            throw new Error('Invalid map furniture inventory');
        if (matches[0]?.count > 0) throw new MapFitmentAlreadyOwned();
        if (matches.length) matches[0].count = 1;
        else staged.push({ itemId, count: 1, expireTime: 0x057E40 });
        await DatabaseManager.Instance.WithConnection(async driver => {
            await driver.beginTransaction();
            try {
                if (!valid()) throw new Error('Map furniture reward unavailable');
                const result = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(staged), player.Uid]);
                if (result.affectedRows !== 1 || !valid()) throw new Error('Map furniture inventory unavailable');
                await driver.commit();
                committed = true;
                inventory.ItemList = staged;
            } catch (error) {
                if (!committed) await driver.rollback();
                throw error;
            }
        });
    } finally {
        release();
    }
    try {
        await player.EventBus.Emit({ type: ItemEventType.ITEM_GAINED, timestamp: Date.now(), playerId: player.Uid,
            itemId, count: 1, source: ItemGainSource.GIVE });
    } catch (error) { Logger.Error('[MapFitmentRewards] Item committed; event failed', error); }
    return { itemId, count: 1 };
}

module.exports = { Grant, MapFitmentAlreadyOwned };
