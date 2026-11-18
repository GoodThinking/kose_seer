'use strict';
// User-authorized private-server fallback, not a claim about original reward quantities.
const { DatabaseManager } = require('../../../DataBase/DatabaseManager');
const { ConfigLoader } = require('../../../shared/config/ConfigLoader');
const { GameConfig } = require('../../../shared/config/game/GameConfig');
const { ItemEventType, ItemGainSource } = require('../Event/EventTypes');
const { Logger } = require('../../../shared/utils');
const TYPES = new Set([20,21,22,24,25,2059,2060]);
class MapDayGiftLimit extends Error {}
function dayStart(seconds) { return Math.floor((seconds + 28800) / 86400) * 86400 - 28800; }
function definition(type) {
  if (!TYPES.has(type)) throw new Error('Unsupported map gift');
  const entry=ConfigLoader.Instance.LoadJson('data/json/map-day-gifts.json')?.gifts?.[String(type)];
  if (!entry || !Number.isInteger(entry.mapId) || !Number.isInteger(entry.itemId) || entry.count !== 1 ||
      !Number.isInteger(entry.dailyLimit) || entry.dailyLimit < 1 || entry.dailyLimit > 5 ||
      (entry.requiresFollowingSuperNono !== undefined && entry.requiresFollowingSuperNono !== true)) throw new Error('Invalid map gift configuration');
  const item=GameConfig.GetItemById(entry.itemId);
  if (!item || !Number.isSafeInteger(item.Max) || item.Max < 1) throw new Error('Invalid map gift item');
  return { ...entry, max: item.Max };
}
function validate(player, session, entry) {
  if (!session || session.Player !== player || player.Session !== session || session.Socket.destroyed || player.Data.mapID !== entry.mapId)
    throw new Error('Map gift requires current connected session and map');
  if (entry.requiresFollowingSuperNono && (!player.Data.superNono || !player.Data.hasNono || !(player.Data.nonoState & 2)))
    throw new Error('Map gift requires following Super NoNo');
}
async function Count(player, session, type) {
  const entry=definition(type); validate(player,session,entry);
  return DatabaseManager.Instance.WithConnection(async driver=>{
    validate(player,session,entry);
    const day=dayStart(Math.floor(Date.now()/1000));
    const rows=await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [player.Uid,`map-gift:${type}`,day]);
    validate(player,session,entry);
    if (dayStart(Math.floor(Date.now()/1000)) !== day) throw new Error('Map gift day changed');
    const used=rows.length ? Number(rows[0].amount) : 0;
    if (!Number.isSafeInteger(used) || used < 0 || used > entry.dailyLimit) throw new Error('Invalid map gift count');
    return used;
  });
}
async function Claim(player, session, type) {
  const entry=definition(type); validate(player,session,entry);
  const inventory=player.ItemManager.ItemData, release=await inventory.AcquireReward();
  let reward;
  try {
    validate(player,session,entry);
    await DatabaseManager.Instance.WithConnection(async driver=>{
      await driver.beginTransaction(); let committed=false;
      try {
        validate(player,session,entry);
        const now=Math.floor(Date.now()/1000), day=dayStart(now), key=`map-gift:${type}`;
        const [claim]=await driver.query('SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?', [player.Uid,key,day]);
        const used=claim ? Number(claim.amount) : 0;
        if (!Number.isSafeInteger(used) || used < 0) throw new Error('Invalid map gift count');
        if (used >= entry.dailyLimit) throw new MapDayGiftLimit('Map gift daily limit reached');
        const items=inventory.ItemList.map(item=>({...item}));
        const matches=items.filter(item=>item.itemId===entry.itemId);
        if (matches.length>1 || matches.some(item=>!Number.isSafeInteger(item.count) || item.count<0 || item.count+entry.count>entry.max)) throw new Error('Map gift inventory limit');
        if (matches.length) matches[0].count+=entry.count;
        else items.push({itemId:entry.itemId,count:entry.count,expireTime:0x057E40});
        const quotaWrite=claim
          ? await driver.execute('UPDATE receiver_claims SET amount = ?, claimed_at = ? WHERE owner_id = ? AND reward_key = ? AND period_start = ? AND amount = ?', [used+1,now,player.Uid,key,day,used])
          : await driver.execute('INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)', [player.Uid,key,day,now,1]);
        const itemWrite=await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(items),player.Uid]);
        if (quotaWrite.affectedRows!==1 || itemWrite.affectedRows!==1) throw new Error('Map gift persistence failed');
        validate(player,session,entry);
        if (dayStart(Math.floor(Date.now()/1000)) !== day) throw new Error('Map gift day changed');
        await driver.commit(); committed=true;
        inventory.ItemList=items;
        reward={itemId:entry.itemId,count:entry.count};
      } catch(error) { if (!committed) await driver.rollback(); throw error; }
    });
  } finally { release(); }
  try { await player.EventBus.Emit({type:ItemEventType.ITEM_GAINED,timestamp:Date.now(),playerId:player.Uid,itemId:reward.itemId,count:reward.count,source:ItemGainSource.GIVE}); }
  catch(error) { Logger.Error('[MapDayGifts] Reward committed; event delivery failed',error); }
  return reward;
}
module.exports={ IsType:type=>TYPES.has(type), Count, Claim, MapDayGiftLimit };
