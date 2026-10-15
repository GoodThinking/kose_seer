import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import { GameConfig } from '../../../shared/config/game/GameConfig';
import { PlayerInstance } from '../Player/PlayerInstance';
import type { BalanceRewardGate } from '../../../DataBase/models/PlayerData';

export type RewardBoostKind = 'experience' | 'learning' | 'coins';
export interface RewardBoostItem {
  itemId: number;
  kind: RewardBoostKind;
  multiplier: number;
  durationSeconds: number;
  price: number;
  maxCount: number;
}
export interface RewardBoostEffect { multiplier: number; expiresAt: number; }
export interface RewardBoostStatus {
  now: number;
  experience: RewardBoostEffect;
  learning: RewardBoostEffect;
  coins: RewardBoostEffect;
}
export interface RewardBoostUseReceipt { itemId: number; remainingCount: number; expiresAt: number; now: number; }
export interface RewardBoostBuyReceipt { itemId: number; count: number; coins: number; }
export class RewardBoostError extends Error {
  constructor(public readonly code: number, message: string) { super(message); }
}
function isKind(value: unknown): value is RewardBoostKind {
  return value === 'experience' || value === 'learning' || value === 'coins';
}
function isUInt32(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 0xffffffff;
}
export function GetRewardBoostItem(itemId: number): RewardBoostItem | undefined {
  const item = GameConfig.GetItemById(itemId);
  if (item?.type !== 'reward_boost') return undefined;
  if (!isKind(item.RewardBoostKind) || !isUInt32(item.RewardMultiplier) || item.RewardMultiplier < 2 ||
      !isUInt32(item.RewardDurationSeconds) || !item.RewardDurationSeconds ||
      !isUInt32(item.Price) || !item.Price || !isUInt32(item.Max) || !item.Max) {
    throw new Error(`Invalid reward boost item configuration: ${itemId}`);
  }
  return {itemId, kind: item.RewardBoostKind, multiplier: item.RewardMultiplier,
    durationSeconds: item.RewardDurationSeconds, price: item.Price, maxCount: item.Max};
}
export async function GetRewardBoostStatus(userId: number, now = Math.floor(Date.now() / 1000)): Promise<RewardBoostStatus> {
  const status: RewardBoostStatus = {now, experience: {multiplier: 1, expiresAt: 0},
    learning: {multiplier: 1, expiresAt: 0}, coins: {multiplier: 1, expiresAt: 0}};
  const rows = await DatabaseManager.Instance.Query<{kind: unknown; multiplier: unknown; expires_at: unknown}>(
    'SELECT kind, multiplier, expires_at FROM player_reward_boosts WHERE owner_id = ?', [userId]);
  for (const row of rows) {
    if (!isKind(row.kind) || !isUInt32(row.multiplier) || row.multiplier < 2 || !isUInt32(row.expires_at)) {
      throw new Error('Invalid persisted reward boost');
    }
    if (row.expires_at > now) status[row.kind] = {multiplier: row.multiplier, expiresAt: row.expires_at};
  }
  return status;
}
export async function UseRewardBoost(player: PlayerInstance, itemId: number): Promise<RewardBoostUseReceipt> {
  const config = GetRewardBoostItem(itemId);
  if (!config) throw new RewardBoostError(5001, 'Not a reward boost item');
  const inventory = player.ItemManager.ItemData;
  const release = await inventory.AcquireReward();
  try {
    if (player.Session.Socket.destroyed || player.Session.Player !== player) throw new RewardBoostError(5001, 'Session ended');
    const staged = inventory.ItemList.map(item => ({...item}));
    const item = staged.find(entry => entry.itemId === itemId);
    if (!item || !isUInt32(item.count) || item.count < 1) throw new RewardBoostError(5001, 'Reward boost item missing');
    item.count--;
    const remainingCount = item.count;
    const items = remainingCount ? staged : staged.filter(entry => entry !== item);
    return await DatabaseManager.Instance.WithConnection(async driver => {
      await driver.beginTransaction();
      let committed = false;
      try {
        const now = Math.floor(Date.now() / 1000);
        const [active] = await driver.query<{expires_at: unknown}>(
          'SELECT expires_at FROM player_reward_boosts WHERE owner_id = ? AND kind = ?', [player.Uid, config.kind]);
        if (active && !isUInt32(active.expires_at)) throw new Error('Invalid reward boost expiry');
        const expiresAt = Math.max(now, active ? Number(active.expires_at) : 0) + config.durationSeconds;
        if (!isUInt32(expiresAt)) throw new RewardBoostError(5001, 'Reward boost duration out of range');
        const boostWrite = active
          ? await driver.execute('UPDATE player_reward_boosts SET multiplier = ?, expires_at = ? WHERE owner_id = ? AND kind = ?',
            [config.multiplier, expiresAt, player.Uid, config.kind])
          : await driver.execute('INSERT INTO player_reward_boosts (owner_id, kind, multiplier, expires_at) VALUES (?, ?, ?, ?)',
            [player.Uid, config.kind, config.multiplier, expiresAt]);
        const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?',
          [JSON.stringify(items), player.Uid]);
        if (boostWrite.affectedRows !== 1 || itemWrite.affectedRows !== 1) throw new Error('Reward boost was not saved');
        await driver.commit();
        committed = true;
        inventory.ItemList = items;
        return {itemId, remainingCount, expiresAt, now};
      } catch (error) {
        if (!committed) await driver.rollback();
        throw error;
      }
    });
  } finally { release(); }
}
export async function BuyRewardBoost(player: PlayerInstance, config: RewardBoostItem, count: number): Promise<RewardBoostBuyReceipt> {
  if (!Number.isSafeInteger(count) || count < 1 || count > config.maxCount) throw new RewardBoostError(5001, 'Invalid purchase count');
  const inventory = player.ItemManager.ItemData;
  const release = await inventory.AcquireReward();
  let gate: BalanceRewardGate | undefined;
  try {
    await player.Data.WaitForExpAllocation();
    await player.Data.WaitForCurrencyOperations();
    if (player.Session.Socket.destroyed || player.Session.Player !== player) throw new RewardBoostError(5001, 'Session ended');
    gate = player.Data.BeginBalanceReward();
    const wallet = gate;
    const staged = inventory.ItemList.map(item => ({...item}));
    const existing = staged.find(item => item.itemId === config.itemId);
    const previousCount = existing?.count ?? 0;
    if (!isUInt32(previousCount) || previousCount + count > config.maxCount) throw new RewardBoostError(5001, 'Reward boost inventory full');
    if (existing) existing.count += count;
    else staged.push({itemId: config.itemId, count, expireTime: 0});
    const cost = config.price * count;
    if (!Number.isSafeInteger(cost)) throw new RewardBoostError(5001, 'Invalid reward boost price');
    return await DatabaseManager.Instance.WithConnection(async driver => {
      await driver.beginTransaction();
      let committed = false;
      try {
        const [row] = await driver.query<{coins: number; gold: number; allocatable_exp: number}>(
          'SELECT coins, gold, allocatable_exp FROM players WHERE user_id = ?', [player.Uid]);
        if (!row) throw new Error('Reward boost buyer missing');
        const keys = ['coins', 'gold', 'allocatableExp'] as const;
        const stored = [row.coins, row.gold, row.allocatable_exp];
        const dirty = player.Data.GetDirtyFields();
        const balances = keys.map((key, index) => {
          const cached = player.Data[key];
          if (!dirty.includes(key) && cached !== stored[index]) throw new Error('Reward boost wallet cache stale');
          const value = dirty.includes(key) ? cached : stored[index];
          if (!isUInt32(value)) throw new Error('Invalid reward boost wallet');
          return value;
        });
        if (balances[0] < cost) throw new RewardBoostError(10016, 'Insufficient coins');
        balances[0] -= cost;
        const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?',
          [JSON.stringify(staged), player.Uid]);
        const walletWrite = await driver.execute('UPDATE players SET coins = ?, gold = ?, allocatable_exp = ? WHERE user_id = ?',
          [...balances, player.Uid]);
        if (itemWrite.affectedRows !== 1 || walletWrite.affectedRows !== 1) throw new Error('Reward boost purchase was not saved');
        await driver.commit();
        committed = true;
        wallet.publish(balances[0], balances[1], balances[2]);
        inventory.ItemList = staged;
        return {itemId: config.itemId, count, coins: balances[0]};
      } catch (error) {
        if (!committed) await driver.rollback();
        throw error;
      }
    });
  } finally { gate?.release(); release(); }
}
