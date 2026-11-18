import { ConfigLoader } from '../../../shared/config/ConfigLoader';
import { GameConfig } from '../../../shared/config/game/GameConfig';

interface DisguiseRule { petId: number; level: number; probability: number; hostIds: number[] }
interface AcquisitionConfig { disguises: DisguiseRule[] }

/** Resolve a disguised encounter only after the server has validated a live wild-monster slot. */
export function SelectWildOpponent(mapId: number, petId: number, level: number, originalPetId: number): [number, number] {
  const host = GameConfig.GetMapConfigById(mapId)?.ogres.find((ogre: {petId: number; isBoss?: boolean; catchable?: boolean}) => ogre.petId === petId);
  if (!host || host.isBoss || host.catchable === false || originalPetId !== petId) return [petId, level];
  const config = ConfigLoader.Instance.LoadJson<AcquisitionConfig>('data/json/pet-acquisition.json');
  for (const rule of config?.disguises ?? []) {
    if (rule.hostIds.includes(petId) && Math.random() < rule.probability) return [rule.petId, rule.level];
  }
  return [petId, level];
}
