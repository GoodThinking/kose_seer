import { GrantMaterials } from './MaterialRewards';
import { ConfigLoader } from '../../../shared/config/ConfigLoader';
import type { PlayerInstance } from '../Player/PlayerInstance';

interface MiningSite {
  type: number;
  mapId: number;
  itemId: number;
  toolId?: number;
  nono?: 'normal' | 'super';
  byHand?: boolean;
  superOnly?: boolean;
  count: number;
}

/** Fixed Nieo collection types share TALK_COUNT/TALK_CATE with experience receivers. */
export class Mining {
  constructor(private readonly player: PlayerInstance) {}

  private Site(type: number, collecting: boolean = false): MiningSite {
    const config = ConfigLoader.Instance.LoadJson<{ sites: MiningSite[] }>('data/json/mining.json');
    const site = config?.sites.find(entry => entry.type === type && entry.mapId === this.player.Data.mapID);
    if (!site || ![site.mapId, site.itemId, site.count]
      .every(value => Number.isSafeInteger(value) && value > 0 && value <= 0xffffffff)) {
      throw new Error('Unsupported mining type');
    }
    if (this.player.Data.actionType === 1) throw new Error('Cannot collect while flying');
    if (site.superOnly && !this.player.Data.superNono) throw new Error('Super NoNo required');
    if (site.nono) {
      if (site.nono !== 'normal' && site.nono !== 'super') throw new Error('Unsupported NoNo collector');
      if (collecting && site.nono === 'super' && !this.player.Data.superNono) throw new Error('Super NoNo required');
      // Map entry queries quota before deciding whether NoNo must be brought out.
      if (collecting && (!this.player.Data.hasNono || !(this.player.Data.nonoState & 2))) {
        throw new Error('Following NoNo required');
      }
    } else if (!site.byHand && (typeof site.toolId !== 'number' || !Number.isSafeInteger(site.toolId) || site.toolId <= 0 || site.toolId > 0xffffffff ||
      !this.player.Data.clothIds.some(id => id === site.toolId || id === 100717))) {
      throw new Error('Mining requires the equipped tool');
    }
    return site;
  }

  public async Count(type: number): Promise<number> {
    this.Site(type);
    // The native UI treats this field as quota consumed, not lifetime collection statistics.
    return 0;
  }

  public async Claim(type: number): Promise<{ itemId: number; count: number }[]> {
    this.Site(type, true);
    return GrantMaterials(this.player, () => {
      const site = this.Site(type, true);
      const rewards = [{ itemId: site.itemId, count: site.count }];
      const config = ConfigLoader.Instance.LoadJson<{ energyStone: { itemId: number; probability: number; count: number } }>('data/json/material-sources.json');
      if (!config) throw new Error('Material source configuration missing');
      if (site.toolId && this.player.Data.superNono && this.player.Data.hasNono &&
        (this.player.Data.nonoState & 2) && this.player.Data.clothIds.includes(100717) &&
        Math.random() < config.energyStone.probability) {
        rewards.push({ itemId: config.energyStone.itemId, count: config.energyStone.count });
      }
      return rewards;
    });
  }
}
