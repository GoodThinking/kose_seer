import { GameConfig } from '../../../shared/config/game/GameConfig';
import { Config } from '../../../shared/config/ServerConfig';
import { IPetInfo } from '../../../shared/models/PetModel';
import { ClientProtocol } from '../../../shared/protocol/ClientProtocol';
import { PetCalculator } from './PetCalculator';

/** 数据库存等级内经验；固定XIN及显式启用的旧Nieo以累计差值显示增量。 */
export function GetPetExperienceFields(
  pet: Pick<IPetInfo, 'petId' | 'level' | 'exp'>,
  protocol: ClientProtocol
): { exp: number; currentLvExp: number; nextLvExp: number } {
  if (protocol !== 'xin-20261013' && Config.Game.cumulativePetExperience !== true) {
    return { exp: pet.exp, currentLvExp: 0,
      nextLvExp: PetCalculator.CalculateExpForLevel(pet.level + 1, pet.petId) };
  }
  if (!Number.isInteger(pet.level) || pet.level < 1 || pet.level > 100 ||
      !Number.isSafeInteger(pet.exp) || pet.exp < 0) {
    throw new Error('Invalid pet experience state');
  }
  const configs = GameConfig.GetAllPets();
  const config = configs.find(item => item.ID === pet.petId);
  if (!config) throw new Error(`Missing experience config: ${pet.petId}`);
  // 当前升级实际执行 EvolvesTo；EvolvesFrom 的历史来源不是可执行进化边。
  // 检查实际正向及入向边，避免跨成本曲线投影。
  const pending = [pet.petId], visited = new Set<number>();
  while (pending.length) {
    const id = pending.pop()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const current = configs.find(item => item.ID === id)!;
    if ((current.GrowthType ?? 1) !== (config.GrowthType ?? 1)) {
      throw new Error(`Unsupported cross-GrowthType experience projection: ${pet.petId}`);
    }
    for (const other of configs) {
      if (other.ID === current.EvolvesTo || other.EvolvesTo === id) {
        if (!visited.has(other.ID)) pending.push(other.ID);
      }
    }
  }
  let base = 0;
  for (let level = 2; level <= pet.level; level++) {
    base += PetCalculator.CalculateExpForLevel(level, pet.petId);
  }
  const exp = base + pet.exp;
  const nextLvExp = base + PetCalculator.CalculateExpForLevel(pet.level + 1, pet.petId);
  if (![base, exp, nextLvExp].every(value => Number.isSafeInteger(value) && value <= 0xffffffff)) {
    throw new Error('Pet experience projection exceeds uint32');
  }
  return { exp, currentLvExp: base, nextLvExp };
}
