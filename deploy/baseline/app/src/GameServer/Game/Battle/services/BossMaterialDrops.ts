import { ConfigLoader } from '../../../../shared/config/ConfigLoader';
import type { IBattleInfo } from '../../../../shared/models/BattleModel';

export function GetBossMaterialDrops(battle: IBattleInfo): { itemId: number; count: number }[] {
  if (battle.bossMapId === undefined) return [];
  const config = ConfigLoader.Instance.LoadJson<{
    bossDrops: { mapId: number; petId: number; itemId: number; probability: number; count: number }[];
  }>('data/json/material-sources.json');
  if (!config) throw new Error('Material source configuration missing');
  const rewards: { itemId: number; count: number }[] = [];
  for (const drop of config.bossDrops) {
    if (drop.mapId === battle.bossMapId && drop.petId === battle.enemy.id && Math.random() < drop.probability) {
      rewards.push({ itemId: drop.itemId, count: drop.count });
    }
  }
  return rewards;
}
