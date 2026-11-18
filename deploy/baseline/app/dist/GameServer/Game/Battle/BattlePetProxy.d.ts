/**
 * 战斗精灵代理
 * 使用 Proxy 自动同步状态字段，避免 status、statusTurns、statusArray、statusDurations 不一致
 *
 * 自动同步规则：
 * 1. 设置 pet.status 时，自动更新 statusArray 和 statusDurations
 * 2. 设置 pet.statusTurns 时，自动更新对应的 statusArray 和 statusDurations
 * 3. 设置 pet.statusDurations[i] 时，自动更新 statusArray[i]
 * 4. 设置 pet.battleLevels[i] 时，自动同步到 battleLv[i]（协议字段）
 *
 * 使用方法：
 * ```typescript
 * const pet = createBattlePetProxy(rawPet);
 * pet.status = 2;  // 自动同步 statusArray[2] 和 statusDurations[2]
 * ```
 */
import { IBattlePet } from '../../../shared/models/BattleModel';
/**
 * 创建战斗精灵代理
 * 自动同步状态相关字段
 */
export declare function createBattlePetProxy(pet: IBattlePet): IBattlePet;
/**
 * 手动同步状态数组（用于已存在的对象）
 * 如果对象已经是 Proxy，此方法会自动触发同步
 */
export declare function syncBattlePetStatus(pet: IBattlePet): void;
//# sourceMappingURL=BattlePetProxy.d.ts.map