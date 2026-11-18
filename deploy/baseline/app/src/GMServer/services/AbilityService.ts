import { DatabaseHelper } from '../../DataBase/DatabaseHelper';
import { Logger } from '../../shared/utils/Logger';
import { GameConfig } from '../../shared/config/game/GameConfig';

/**
 * 精灵特性管理服务
 * 每个精灵只能拥有一个特性，参数从 pet_abilities.json 读取
 */
export class AbilityService {
  /**
   * 获取所有可用特性列表（从 pet_abilities.json）
   */
  public getAllAbilities(): any[] {
    return GameConfig.GetAllPetAbilities();
  }

  /**
   * 获取指定精灵的特性ID
   */
  public async getPetAbility(uid: number, catchTime: number): Promise<{ abilityId: number }> {
    const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
    if (!petData) {
      throw new Error('玩家精灵数据不存在');
    }

    const pet = petData.PetList.find(p => p.catchTime === catchTime);
    if (!pet) {
      throw new Error('精灵不存在');
    }

    const abilityId = (pet.effectList && pet.effectList.length > 0) ? (pet.effectList[0].itemId || pet.effectList[0].effectID) : 0;
    return { abilityId };
  }

  /**
   * 设置精灵特性（替换现有特性）
   */
  public async setAbility(uid: number, catchTime: number, abilityId: number): Promise<void> {
    const abilityConfig = GameConfig.GetPetAbilityById(abilityId);
    if (!abilityConfig) {
      throw new Error(`特性配置不存在: abilityId=${abilityId}`);
    }

    const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
    if (!petData) {
      throw new Error('玩家精灵数据不存在');
    }

    const pet = petData.PetList.find(p => p.catchTime === catchTime);
    if (!pet) {
      throw new Error('精灵不存在');
    }

    pet.effectList = [{
      itemId: abilityId,
      status: 2,
      leftCount: -1,
      effectID: abilityId,
      args: abilityConfig.args.join(' ')
    }];
    pet.effectCount = 1;

    // 立即保存到数据库
    await petData.save();

    Logger.Info(`[AbilityService] 设置特性: uid=${uid}, catchTime=${catchTime}, abilityId=${abilityId}, name=${abilityConfig.name}`);
  }

  /**
   * 清除精灵特性
   */
  public async clearAbility(uid: number, catchTime: number): Promise<void> {
    const petData = await DatabaseHelper.Instance.GetInstanceOrCreateNew_PetData(uid);
    if (!petData) {
      throw new Error('玩家精灵数据不存在');
    }

    const pet = petData.PetList.find(p => p.catchTime === catchTime);
    if (!pet) {
      throw new Error('精灵不存在');
    }

    pet.effectList = [];
    pet.effectCount = 0;

    // 立即保存到数据库
    await petData.save();

    Logger.Info(`[AbilityService] 清除特性: uid=${uid}, catchTime=${catchTime}`);
  }
}
