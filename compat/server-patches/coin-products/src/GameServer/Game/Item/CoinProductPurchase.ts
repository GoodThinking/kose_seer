import type { PlayerInstance } from '../Player/PlayerInstance';
import type { BalanceRewardGate } from '../../../DataBase/models/PlayerData';
import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import { ConfigLoader } from '../../../shared/config/ConfigLoader';
import { ItemSystem } from './ItemSystem';

interface CoinProduct {
  productId: number;
  name: string;
  itemIds: number[];
  coins: number;
  vipCoins: number;
  goldReward: number;
  vipOnly: boolean;
  once?: boolean;
}
export class CoinProductError extends Error {
  constructor(public readonly code: number, message: string) { super(message); }
}

function CoinProducts(): CoinProduct[] {
  const catalog = ConfigLoader.Instance.LoadJson<{currency: string; products: CoinProduct[]}>('data/json/money-products.json');
  if (!catalog || catalog.currency !== 'coins') throw new Error('Missing coin product catalog');
  return catalog.products;
}

export function GetCoinProductForItem(itemId: number): number | undefined {
  return CoinProducts().find(product => product.itemIds.length === 1 && product.itemIds[0] === itemId)?.productId;
}

/** Original MONEY_BUY_PRODUCT catalog, now priced and paid entirely in Seer coins. */
export async function BuyCoinProduct(player: PlayerInstance, productId: number, count: number): Promise<{ spentCoins: number; coins: number }> {
  const product = CoinProducts().find(item => item.productId === productId);
  if (!product || !Number.isInteger(count) || count < 1 || count > 65535) throw new CoinProductError(5001, 'Invalid product or quantity');
  const inventory = player.ItemManager.ItemData;
  const release = await inventory.AcquireReward();
  let gate: BalanceRewardGate | undefined;
  try {
    await player.Data.WaitForExpAllocation();
    await player.Data.WaitForCurrencyOperations();
    if (player.Session.Socket.destroyed || player.Session.Player !== player) throw new CoinProductError(5001, 'Session ended');
    const vip = player.Data.vip > 0;
    if (product.vipOnly && !vip) throw new CoinProductError(5001, 'Super NoNo required');
    if (product.once && count !== 1) throw new CoinProductError(103203, 'One-time product');
    const spentCoins = (vip ? product.vipCoins : product.coins) * count;
    const goldReward = product.goldReward * count;
    if (!Number.isSafeInteger(spentCoins) || spentCoins <= 0 || spentCoins > 0x7fffffff || !Number.isSafeInteger(goldReward) || goldReward < 0) throw new Error('Invalid coin product price');
    gate = player.Data.BeginBalanceReward();
    const wallet = gate;
    const staged = inventory.ItemList.map(item => ({...item}));
    for (const itemId of product.itemIds) {
      if (!ItemSystem.Exists(itemId)) throw new Error(`Missing product item ${itemId}`);
      const existing = staged.find(item => item.itemId === itemId);
      const previous = existing?.count ?? 0;
      if (ItemSystem.IsUniqueItem(itemId) && (previous > 0 || count > 1)) throw new CoinProductError(103203, 'Unique item already owned');
      if (!Number.isSafeInteger(previous) || previous < 0 || previous + count > ItemSystem.GetMaxStack(itemId)) throw new CoinProductError(5001, 'Inventory full');
      if (existing) existing.count += count;
      else staged.push({itemId, count, expireTime: 0x057E40});
    }
    return await DatabaseManager.Instance.WithConnection(async driver => {
      await driver.beginTransaction();
      let committed = false;
      try {
        const [row] = await driver.query<{coins: number; gold: number; allocatable_exp: number}>('SELECT coins, gold, allocatable_exp FROM players WHERE user_id = ?', [player.Uid]);
        if (!row) throw new Error('Product buyer missing');
        const dirty = player.Data.GetDirtyFields();
        const keys = ['coins', 'gold', 'allocatableExp'] as const;
        const stored = [row.coins, row.gold, row.allocatable_exp];
        const balances = keys.map((key, i) => {
          const cached = player.Data[key];
          if (!dirty.includes(key) && cached !== stored[i]) throw new Error('Product wallet cache stale');
          const balance = dirty.includes(key) ? cached : stored[i];
          if (!Number.isSafeInteger(balance) || balance < 0 || balance > 0x7fffffff) throw new Error('Invalid product wallet');
          return balance;
        });
                if (product.once) {
                  await driver.execute(`CREATE TABLE IF NOT EXISTS player_once_products (
                    user_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    bought_at INTEGER NOT NULL,
                    PRIMARY KEY (user_id, product_id)
                  )`);
                  const mark = await driver.execute(
                    'INSERT OR IGNORE INTO player_once_products (user_id, product_id, bought_at) VALUES (?, ?, ?)',
                    [player.Uid, product.productId, Math.floor(Date.now() / 1000)]
                  );
                  if (mark.affectedRows !== 1) throw new CoinProductError(103203, 'Already purchased');
                }
                if (balances[0] < spentCoins) throw new CoinProductError(10016, 'Insufficient Seer coins');
        balances[0] -= spentCoins;
        balances[1] += goldReward;
        if (!Number.isSafeInteger(balances[1]) || balances[1] > 0x7fffffff) throw new CoinProductError(5001, 'Gold balance full');
        const items = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?', [JSON.stringify(staged), player.Uid]);
        const money = await driver.execute('UPDATE players SET coins = ?, gold = ?, allocatable_exp = ? WHERE user_id = ?', [...balances, player.Uid]);
        if (items.affectedRows !== 1 || money.affectedRows !== 1) throw new Error('Coin product purchase was not saved');
        await driver.commit(); committed = true;
        wallet.publish(balances[0], balances[1], balances[2]);
        inventory.ItemList = staged;
        return {spentCoins, coins: balances[0]};
      } catch (error) {
        if (!committed) await driver.rollback();
        throw error;
      }
    });
  } finally { gate?.release(); release(); }
}
