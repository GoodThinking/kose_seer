"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleRewardService = void 0;
const utils_1 = require("../../../../shared/utils");
const GameConfig_1 = require("../../../../shared/config/game/GameConfig");
const BossAbilityConfig_1 = require("../BossAbility/BossAbilityConfig");
const BossSpecialRules_1 = require("../BossSpecialRules");
const EventTypes_1 = require("../../Event/EventTypes");
const RewardBoost_1 = require("../../Reward/RewardBoost");
const SaveTaskState_1 = require("../../Task/SaveTaskState");
/**
 * 战斗奖励服务
 * 负责处理战斗胜利后的奖励：经验、金币、捕获等
 */
class BattleRewardService {
    _player;
    pendingSPTRewards = new Set();
    constructor(player) {
        this._player = player;
    }
    /**
     * 处理战斗胜利奖励
     * @param userId 玩家ID
     * @param battle 战斗信息
     * @param mapId 地图ID（可选，用于读取配置）
     * @param slot 野怪槽位（可选，用于读取配置）
     * @param originalPetId 原始精灵ID（可选，用于查找配置，闪光精灵需要用原始ID查找）
     */
    async ProcessVictoryReward(userId, battle, mapId, slot, originalPetId) {
        const result = {
            status: 'complete', expGained: 0, coinsGained: 0, levelUp: false,
            newLevel: battle.player.level, droppedItems: [], rewardItems: [], rewardPet: null
        };
        let stage = 'experience';
        let sptRewards = [];
        try {
            stage = "map-progress";
            result.droppedItems.push(...await require("../../Map/GameplayRewards").GrantMapVictory(this._player, battle));
            stage = "experience";
            let expGained = 0;
            let coinsGained = 0;
            const releaseEffect = typeof this._player.Data.AcquireConsumableMutation === 'function'
                ? await this._player.Data.AcquireConsumableMutation()
                : () => undefined;
            try {
                // Snapshot effects at settlement time.
                const boosts = await (0, RewardBoost_1.GetRewardBoostStatus)(userId);
                // 精灵学院训练室：param2 0..4 为学习力靶子（本室单项 初级+5/高级+10），1TL(T=系别,L=阶段1..5) 为经验特训
                const trainRoomEv = { 488: ['evAtk', 5], 489: ['evDef', 5], 490: ['evSpAtk', 5], 491: ['evSpDef', 5], 492: ['evSpeed', 5], 493: ['evHp', 5],
                    470: ['evAtk', 10], 471: ['evDef', 10], 472: ['evSpAtk', 10], 473: ['evSpDef', 10], 474: ['evSpeed', 10], 475: ['evHp', 10] };
                const trainMapId = Number(battle.bossMapId ?? -1);
                const trainParam2 = Number(battle.bossParam2 ?? -1);
                const trainRoom = trainRoomEv[trainMapId];
                const expTier = (trainRoom || trainMapId === 485) && trainParam2 >= 111 && trainParam2 <= 265 && trainParam2 % 10 >= 1 && trainParam2 % 10 <= 5 ? trainParam2 % 10 : 0;
                const evTrain = !expTier && trainRoom && trainParam2 >= 0 && trainParam2 <= 4 ? trainRoom : undefined;
                const learningMultiplier = boosts.learning.multiplier;
                expGained = (expTier ? [0, 1800, 5400, 12000, 24000, 42000][expTier] : this.CalculateExpReward(battle.enemy.level, battle.enemy.id, mapId, slot)) * boosts.experience.multiplier;
                coinsGained = this.CalculateCoinsReward(battle.enemy.level) * boosts.coins.multiplier;
                const catchTime = battle.player.catchTime;
                if (!this._player.PetManager.GetPetByCatchTime(catchTime))
                    throw new Error('Reward pet missing');
                result.levelUp = await this._player.PetManager.HandleAddPetExpByCatchTime(catchTime, expGained, battle.enemy.id, {
                    noEvGain: expTier > 0,
                    fixedEv: evTrain ? { field: evTrain[0], amount: evTrain[1] * learningMultiplier } : undefined,
                    learningMultiplier,
                    storedExperience: boosts.experience.multiplier > 1 ? expGained : Math.floor(expGained * 0.5),
                });
                const rewardedPet = this._player.PetManager.GetPetByCatchTime(catchTime);
                if (!rewardedPet)
                    throw new Error('Reward pet disappeared');
                result.expGained = expGained;
                result.newLevel = rewardedPet.level;
            }
            finally {
                releaseEffect();
            }
            // 4. 给玩家增加金币
            stage = 'coins';
            if (coinsGained > 0 && !await this._player.AddCurrency(undefined, coinsGained)) {
                throw new Error('Currency reward was not persisted');
            }
            result.coinsGained = coinsGained;
            // 5. 处理掉落物品（使用originalPetId查找配置，如果没有则使用当前petId）
            stage = 'items';
            const droppedItems = this.ProcessDropItems(mapId, slot, originalPetId || battle.enemy.id);
droppedItems.push(...require("./BossMaterialDrops").GetBossMaterialDrops(battle, this._player));
            for (const drop of droppedItems) {
                if (!await this._player.ItemManager.GiveItem(drop.itemId, drop.count, EventTypes_1.ItemGainSource.DROP)) {
                    throw new Error(`Drop reward was not persisted: ${drop.itemId}`);
                }
                result.droppedItems.push(drop);
                utils_1.Logger.Info(`[BattleRewardService] 掉落物品已添加到背包: ItemId=${drop.itemId}, Count=${drop.count}`);
            }
            result.droppedItems.push(...await require("../../Map/MysteryMonActivity").GrantMysteryFragments(this._player, battle, mapId, slot));
            // 刻印掉落：须在本场首胜登记（下面 spt 阶段）之前判断是否已首胜
            stage = 'countermarks';
            const markBoss = battle.bossMapId === undefined || battle.universeBoss ? null : BossAbilityConfig_1.BossAbilityConfig.Instance.GetBossConfigByMapAndParam(battle.bossMapId, battle.bossParam2);
            const markSptId = markBoss?.spt?.sptId > 0 && markBoss.spt.sptId <= 200 ? markBoss.spt.sptId : 0;
            const marks = await require("../../Pet/Countermarks").GrantBossDrop(this._player, battle, markSptId, markSptId > 0 && this._player.ChallengeProgressManager.HasDefeatedSPTBoss(markSptId));
            if (marks.length)
                await require("../../Map/ForestMechanisms").SendForestAlert(this._player, `获得刻印：${marks.map(m => m.name).join('、')}。可以在精灵刻印面板中装备。`);
            // 6. 处理SPT首次击败奖励（如果是BOSS战斗）
            stage = 'spt';
            sptRewards = await this.ProcessSPTFirstDefeatReward(battle, mapId, result);
            if (battle.bossMapId === 677 && battle.bossParam2 >= 1 && battle.bossParam2 <= 6) {
                await (0, SaveTaskState_1.SaveFinishedTask)(this._player.TaskManager.TaskData, 757 + battle.bossParam2);
            }
        }
        catch (error) {
            utils_1.Logger.Error(`[BattleRewardService] 处理奖励失败: ${error}`);
            result.failedStage = stage;
            result.status = result.expGained || result.coinsGained || result.droppedItems.length || result.rewardPet ? 'partial' : 'failed';
        }
        // Never erase committed components or announce a calculated-but-uncommitted reward.
        if (result.coinsGained > 0)
            result.rewardItems.push({ itemId: 1, itemCnt: result.coinsGained });
        for (const drop of [...result.droppedItems, ...sptRewards])
            result.rewardItems.push({ itemId: drop.itemId, itemCnt: drop.count });
        utils_1.Logger.Info(`[BattleRewardService] 战斗奖励: UserID=${userId}, Status=${result.status}, Stage=${result.failedStage || '-'}, Exp=${result.expGained}, Coins=${result.coinsGained}`);
        return result;
    }
    /**
     * 处理SPT首次击败奖励
     * @param battle 战斗信息
     * @param mapId 地图ID（用于周几规则验证）
     * @returns 奖励物品列表
     */
    async ProcessSPTFirstDefeatReward(battle, mapId, settlement) {
        const rewards = [];
        // 检查是否是BOSS战斗
        if (battle.bossMapId === undefined || battle.bossParam2 === undefined) {
            return rewards;
        }
        // 获取BOSS配置
        const bossConfig = battle.universeBoss ? { spt: battle.universeBoss.spt, petName: battle.enemy.name } : BossAbilityConfig_1.BossAbilityConfig.Instance.GetBossConfigByMapAndParam(battle.bossMapId, battle.bossParam2);
        if (!bossConfig || !bossConfig.spt) {
            return rewards;
        }
        const sptInfo = bossConfig.spt;
        // 检查是否是SPT BOSS
        if (!sptInfo.sptId || sptInfo.sptId <= 0 || sptInfo.sptId > 200) {
            return rewards;
        }
        // 检查玩家是否已经击败过这个SPT BOSS（通过 ChallengeProgressManager）
        if (this._player.ChallengeProgressManager.HasDefeatedSPTBoss(sptInfo.sptId)) {
            utils_1.Logger.Info(`[BattleRewardService] SPT BOSS已击败过，不发放首次奖励: MapId=${battle.bossMapId}, Param2=${battle.bossParam2}, SPTId=${sptInfo.sptId}`);
            return rewards;
        }
        // 验证周几出现规则（如果适用）
        if (mapId !== undefined && BossAbilityConfig_1.BossAbilityConfig.Instance.IsWeekdayScheduleBoss(battle.enemy.id)) {
            const roundCount = battle.roundCount || 0;
            const isCriticalHit = battle.lastHitWasCritical || false;
            const validation = BossSpecialRules_1.BossSpecialRules.ValidateWeekdayScheduleCondition(battle.enemy.id, mapId, roundCount, isCriticalHit);
            if (!validation.valid) {
                utils_1.Logger.Warn(`[BattleRewardService] 周几规则验证失败，不发放首次奖励: ` +
                    `MapId=${battle.bossMapId}, Param2=${battle.bossParam2}, 条件=${validation.conditionDesc}`);
                return rewards;
            }
            utils_1.Logger.Info(`[BattleRewardService] 周几规则验证通过: ` +
                `MapId=${battle.bossMapId}, Param2=${battle.bossParam2}, 条件=${validation.conditionDesc}`);
        }
        if (sptInfo.rewardItemId > 0 && !(sptInfo.rewardPetId > 0)) {
            const awarded = await require('./AcquisitionRewards').grantFirstItem(this._player, sptInfo.sptId, sptInfo.rewardItemId);
            return awarded ? [{ itemId: sptInfo.rewardItemId, count: 1 }] : rewards;
        }
        // 在首次 await 前占用同实例的首胜发奖；失败后允许下一次显式挑战。
        if (this.pendingSPTRewards.has(sptInfo.sptId))
            return rewards;
        this.pendingSPTRewards.add(sptInfo.sptId);
        try {
            if (sptInfo.rewardPetId && sptInfo.rewardPetId > 0) {
                const catchTime = Math.floor(Date.now() / 1000);
                const success = await this._player.PetManager.GivePet(sptInfo.rewardPetId, 1, catchTime, EventTypes_1.PetObtainSource.BATTLE_REWARD);
                if (!success) {
                    utils_1.Logger.Warn(`[BattleRewardService] SPT发宠拒绝，保留首胜资格: SPTId=${sptInfo.sptId}`);
                    throw new Error('SPT pet reward was rejected');
                }
                // Preserve the committed pet even if a later item reward fails.
                settlement.rewardPet = { petId: sptInfo.rewardPetId, catchTime };
                utils_1.Logger.Info(`[BattleRewardService] SPT奖励精灵已发放: PetId=${sptInfo.rewardPetId}`);
            }
            this._player.ChallengeProgressManager.MarkSPTBossDefeated(sptInfo.sptId);
            if (sptInfo.sptId === 1) {
                await (0, SaveTaskState_1.SaveFinishedTask)(this._player.TaskManager.TaskData, 301);
            }
            utils_1.Logger.Info(`[BattleRewardService] SPT BOSS首次击败: MapId=${battle.bossMapId}, Param2=${battle.bossParam2}, SPTId=${sptInfo.sptId}, PetName=${bossConfig.petName}`);
            if (sptInfo.rewardItemId && sptInfo.rewardItemId > 0) {
                if (!await this._player.ItemManager.GiveItem(sptInfo.rewardItemId, 1, EventTypes_1.ItemGainSource.DROP)) {
                    throw new Error('SPT item reward was not persisted');
                }
                rewards.push({ itemId: sptInfo.rewardItemId, count: 1 });
                utils_1.Logger.Info(`[BattleRewardService] SPT奖励物品已发放: ItemId=${sptInfo.rewardItemId}`);
            }
            return rewards;
        }
        finally {
            this.pendingSPTRewards.delete(sptInfo.sptId);
        }
    }
    /**
     * 处理精灵捕获
     * @param userId 玩家ID
     * @param battle 战斗信息
     * @param catchTime 捕获时间
     * @param mapId 地图ID（可选，用于检查是否可捕获）
     * @param slot 野怪槽位（可选，用于检查是否可捕获）
     */
    async ProcessCatch(userId, battle, catchTime, mapId, slot) {
        try {
            // 检查是否可以捕获（从配置读取）
            const catchable = !battle.universeBoss && this.IsCatchable(battle.enemy.id, mapId, slot);
            if (!catchable) {
                utils_1.Logger.Warn(`[BattleRewardService] 该精灵不可捕获: PetId=${battle.enemy.id}`);
                return false;
            }
            // GivePet owns bag capacity and sends overflow pets to storage.
            const success = await this._player.PetManager.GivePet(battle.enemy.id, battle.enemy.level, catchTime, EventTypes_1.PetObtainSource.CATCH);
            if (success) {
                utils_1.Logger.Info(`[BattleRewardService] 捕获精灵: UserID=${userId}, PetId=${battle.enemy.id}, Level=${battle.enemy.level}, CatchTime=${catchTime}`);
                // 捕获成功后，客户端会自动处理精灵列表刷新（通过 CATCH_SUCCESS 事件）
                // 无需服务器主动推送
            }
            return success;
        }
        catch (error) {
            utils_1.Logger.Error(`[BattleRewardService] 捕获精灵失败: ${error}`);
            return false;
        }
    }
    /**
     * 计算经验奖励
     * 优先从配置读取，否则使用默认计算
     */
    CalculateExpReward(enemyLevel, enemyId, mapId, slot) {
        const yieldExp = GameConfig_1.GameConfig.GetPetById(enemyId)?.YieldingExp;
        const level = Number.isSafeInteger(enemyLevel) && enemyLevel > 0 ? enemyLevel : 1;
        // 图鉴 YieldingExp 是被击败产出。怀旧单机版提升 2 倍经验产出，并默认将 50% 存入经验分配器。
        let reward = typeof yieldExp === 'number' && yieldExp > 0
            ? Math.floor(yieldExp * level * 2 / 7)
            : level * 20;
        if (mapId !== undefined && slot !== undefined) {
            const scale = this.GetOgreConfig(mapId, slot, enemyId)?.expMultiplier;
            if (typeof scale === 'number' && scale > 0 && scale !== 1)
                reward = Math.floor(reward * scale);
        }
        return reward;
    }
    /**
     * 计算金币奖励
     */
    CalculateCoinsReward(enemyLevel) {
        // 怀旧单机版：金币 = 敌人等级 * 15（击败 1 次高阶 BOSS 即可够 1 次精灵融合或基础刻印兑换）
        return enemyLevel * 15;
    }
    /**
     * 处理掉落物品
     */
    ProcessDropItems(mapId, slot, petId) {
        if (mapId === undefined || petId === undefined) {
            utils_1.Logger.Debug(`[BattleRewardService] 无法处理掉落: mapId=${mapId}, petId=${petId}`);
            return [];
        }
        const droppedItems = [];
        // 从配置读取掉落物品
        const mapConfig = GameConfig_1.GameConfig.GetMapOgreConfig();
        if (!mapConfig) {
            utils_1.Logger.Debug(`[BattleRewardService] 地图配置未加载`);
            return droppedItems;
        }
        const map = mapConfig.maps[mapId.toString()];
        if (!map) {
            utils_1.Logger.Debug(`[BattleRewardService] 地图${mapId}配置不存在`);
            return droppedItems;
        }
        // 使用petId查找配置（而不是slot，因为同一地图可能有多个不同精灵）
        const ogre = map.ogres.find(o => o.petId === petId);
        if (!ogre) {
            utils_1.Logger.Debug(`[BattleRewardService] 地图${mapId}精灵${petId}配置不存在`);
            return droppedItems;
        }
        if (!ogre.dropItems || ogre.dropItems.length === 0) {
            utils_1.Logger.Debug(`[BattleRewardService] 地图${mapId}精灵${petId}没有配置掉落物品`);
            return droppedItems;
        }
        utils_1.Logger.Debug(`[BattleRewardService] 处理掉落: mapId=${mapId}, petId=${petId}, slot=${slot}, dropConfigs=${ogre.dropItems.length}`);
        // 处理每个掉落物品
        for (const dropConfig of ogre.dropItems) {
            const roll = Math.random();
            utils_1.Logger.Debug(`[BattleRewardService] 掉落判定: itemId=${dropConfig.itemId}, rate=${dropConfig.dropRate}, roll=${roll.toFixed(3)}`);
            // 掉落概率判定
            if (roll <= dropConfig.dropRate) {
                // 随机掉落数量
                const count = Math.floor(Math.random() * (dropConfig.maxCount - dropConfig.minCount + 1) + dropConfig.minCount);
                droppedItems.push({ itemId: dropConfig.itemId, count });
                utils_1.Logger.Info(`[BattleRewardService] 掉落成功: itemId=${dropConfig.itemId}, count=${count}`);
            }
            else {
                utils_1.Logger.Debug(`[BattleRewardService] 掉落失败: itemId=${dropConfig.itemId}`);
            }
        }
        return droppedItems;
    }
    /**
     * 检查精灵是否可以捕获
     */
    IsCatchable(petId, mapId, slot) {
        // 尝试从配置读取
        if (mapId !== undefined && slot !== undefined) {
            const ogreConfig = this.GetOgreConfig(mapId, slot, petId);
            if (ogreConfig) {
                // 如果配置了 catchable，使用配置值
                if (ogreConfig.catchable !== undefined) {
                    return ogreConfig.catchable;
                }
            }
        }
        // 默认可以捕获
        return true;
    }
    /**
     * 获取野怪配置
     */
    GetOgreConfig(mapId, slot, petId) {
        const mapConfig = GameConfig_1.GameConfig.GetMapOgreConfig();
        if (!mapConfig)
            return null;
        const map = mapConfig.maps[mapId.toString()];
        if (!map)
            return null;
        // 优先使用petId查找，如果找不到再用slot查找
        return map.ogres.find(o => o.petId === petId) || map.ogres.find(o => o.slot === slot);
    }
}
exports.BattleRewardService = BattleRewardService;
//# sourceMappingURL=BattleRewardService.js.map