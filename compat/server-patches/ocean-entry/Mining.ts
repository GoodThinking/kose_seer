import { DatabaseManager } from '../../../DataBase/DatabaseManager';
import type { IItemInfo } from '../../../DataBase/models/ItemData';
import { ConfigLoader } from '../../../shared/config/ConfigLoader';
import type { PlayerInstance } from '../Player/PlayerInstance';

interface MiningSite {
  type: number;
  mapId: number;
  itemId: number;
  toolId?: number;
  nono?: 'normal' | 'super';
  rewardKey?: string;
  dailyLimit: number;
  count: number;
}

export class MiningLimitReached extends Error {}

/** Fixed Nieo collection types share TALK_COUNT/TALK_CATE with experience receivers. */
export class Mining {
  constructor(private readonly player: PlayerInstance) {}

  private Site(type: number, collecting: boolean = false): MiningSite {
    const config = ConfigLoader.Instance.LoadJson<{ sites: MiningSite[] }>('data/json/mining.json');
    const site = config?.sites.find(entry => entry.type === type && entry.mapId === this.player.Data.mapID);
    if (!site || ![site.mapId, site.itemId, site.dailyLimit, site.count]
      .every(value => Number.isSafeInteger(value) && value > 0 && value <= 0xffffffff)) {
      throw new Error('Unsupported mining type');
    }
    if (this.player.Data.actionType === 1) throw new Error('Cannot collect while flying');
    if (site.nono) {
      if (site.nono !== 'normal' && site.nono !== 'super') throw new Error('Unsupported NoNo collector');
      if (site.nono === 'super' && !this.player.Data.superNono) throw new Error('Super NoNo required');
      // Map entry queries quota before deciding whether NoNo must be brought out.
      if (collecting && (!this.player.Data.hasNono || !(this.player.Data.nonoState & 2))) {
        throw new Error('Following NoNo required');
      }
    } else if (typeof site.toolId !== 'number' || !Number.isSafeInteger(site.toolId) || site.toolId <= 0 || site.toolId > 0xffffffff ||
      !this.player.Data.clothIds.some(id => id === site.toolId || id === 100717)) {
      throw new Error('Mining requires the equipped tool');
    }
    return site;
  }

  private Day(): number {
    const now = Math.floor(Date.now() / 1000);
    return Math.floor((now + 28800) / 86400) * 86400 - 28800;
  }

  public async Count(type: number): Promise<number> {
    const site = this.Site(type);
    return DatabaseManager.Instance.WithConnection(async driver => {
      const [row] = await driver.query<{ amount: number }>(
        'SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?',
        [this.player.Uid, site.rewardKey ?? `mining:${type}`, this.Day()]
      );
      return row?.amount ?? 0;
    });
  }

  public async Claim(type: number): Promise<{ itemId: number; count: number }> {
    this.Site(type, true);
    const inventory = this.player.ItemManager.ItemData;
    const release = await inventory.AcquireReward();
    try {
      const site = this.Site(type, true);
      return await DatabaseManager.Instance.WithConnection(async driver => {
        await driver.beginTransaction();
        let committed = false;
        try {
          const day = this.Day();
          const key = site.rewardKey ?? `mining:${type}`;
          const [claim] = await driver.query<{ amount: number }>(
            'SELECT amount FROM receiver_claims WHERE owner_id = ? AND reward_key = ? AND period_start = ?',
            [this.player.Uid, key, day]
          );
          if (claim && claim.amount >= site.dailyLimit) throw new MiningLimitReached('Mining daily limit reached');
          const [row] = await driver.query<{ item_list: string }>(
            'SELECT item_list FROM player_items WHERE owner_id = ?', [this.player.Uid]
          );
          if (!row) throw new Error('Mining inventory missing');
          const items: IItemInfo[] = JSON.parse(row.item_list);
          const item = items.find(entry => entry.itemId === site.itemId);
          if (item) {
            if (!Number.isSafeInteger(item.count) || item.count < 0 || item.count + site.count > 0xffffffff) {
              throw new Error('Mining inventory count out of range');
            }
            item.count += site.count;
          } else items.push({ itemId: site.itemId, count: site.count, expireTime: 0x057E40 });
          const quotaWrite = claim
            ? await driver.execute(
              'UPDATE receiver_claims SET amount = ?, claimed_at = ? WHERE owner_id = ? AND reward_key = ? AND period_start = ? AND amount = ?',
              [claim.amount + 1, Math.floor(Date.now() / 1000), this.player.Uid, key, day, claim.amount])
            : await driver.execute(
              'INSERT INTO receiver_claims (owner_id, reward_key, period_start, claimed_at, amount) VALUES (?, ?, ?, ?, ?)',
              [this.player.Uid, key, day, Math.floor(Date.now() / 1000), 1]);
          const itemWrite = await driver.execute('UPDATE player_items SET item_list = ? WHERE owner_id = ?',
            [JSON.stringify(items), this.player.Uid]);
          if (quotaWrite.affectedRows !== 1 || itemWrite.affectedRows !== 1) throw new Error('Mining reward was not saved');
          await driver.commit();
          committed = true;
          inventory.ItemList = items;
          return { itemId: site.itemId, count: site.count };
        } catch (error) {
          if (!committed) await driver.rollback();
          throw error;
        }
      });
    } finally { release(); }
  }
}
