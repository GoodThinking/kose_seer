import { IPlayerInfo } from '../../../shared/models/PlayerModel';
import { Config } from '../../../shared/config/ServerConfig';

/** Personal-server entitlement. Preserve cosmetics, energy, and follow preference. */
export function ApplyDefaultSuperNono(player: IPlayerInfo, enabled = Config.Game.defaultSuperNono === true): boolean {
  if (!enabled) return false;
  const values = {
    hasNono: true, superNono: true, vip: player.vip | 1, viped: player.viped | 1,
    vipLevel: Math.max(player.vipLevel, 1), vipEndTime: Math.max(player.vipEndTime, 0x7FFFFFFF),
    nonoSuperLevel: Math.max(player.nonoSuperLevel, 1), nonoFlag: Math.max(player.nonoFlag, 1),
    nonoState: player.nonoState | 1,
    ...(!player.hasNono ? {
      nonoPower: 10000, nonoMate: 10000,
      nonoBirth: Math.floor(Date.now() / 1000)
    } : {})
  };
  const changed = Object.entries(values).some(([key, value]) => (player as any)[key] !== value);
  if (changed) Object.assign(player, values);
  return changed;
}
