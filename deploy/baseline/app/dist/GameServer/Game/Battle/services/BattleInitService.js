"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleInitService = void 0;
const PetPP_1 = require("../../Pet/PetPP");
const ElementSystem_1 = require("../ElementSystem");
const utils_1 = require("../../../../shared/utils");
const BattleModel_1 = require("../../../../shared/models/BattleModel");
const GameConfig_1 = require("../../../../shared/config/game/GameConfig");
const BattlePetProxy_1 = require("../BattlePetProxy");
const SptSystem_1 = require("../../Pet/SptSystem");
const BossAbilityConfig_1 = require("../BossAbility/BossAbilityConfig");
const PassiveAbilitySystem_1 = require("../PassiveAbilitySystem");
const BattleAlgorithm_1 = require("../BattleAlgorithm");
const PuniSealBattle_1 = require("../PuniSealBattle");
/**
 * 战斗初始化服务
 * 负责创建战斗实例、初始化精灵数据
 */
class BattleInitService {
    _player;
    constructor(player) {
        this._player = player;
    }
    /**
     * 获取玩家首发精灵（必须是健康的）
     * 优先选择首发精灵，如果首发精灵死亡则选择第一个健康的精灵
     */
    GetPlayerPet() {
        const playerPets = this._player.PetManager.GetPetsInBag();
        const healthyPets = playerPets.filter(p => p.hp > 0);
        if (healthyPets.length === 0) {
            utils_1.Logger.Warn(`[BattleInitService] 玩家没有健康的精灵: UserID=${this._player.Uid}`);
            return null;
        }
        const playerPet = healthyPets.find(p => p.isDefault) || healthyPets[0];
        const playerPetConfig = GameConfig_1.GameConfig.GetPetById(playerPet.petId);
        const playerType = playerPetConfig?.Type || 0;
        let playerSkills = require("../ChampionPetRuntime").ChampionPetRuntime.Skills(playerPet);
        if (playerSkills.length === 0) {
            playerSkills = [10001];
            utils_1.Logger.Warn(`[BattleInitService] 玩家精灵没有技能，使用默认技能: UserID=${this._player.Uid}, PetId=${playerPet.petId}`);
        }
        return {
            pet: playerPet,
            config: playerPetConfig,
            type: playerType,
            skills: playerSkills
        };
    }
    /**
     * 构建玩家战斗精灵数据
     */
    BuildPlayerBattlePet(playerData) {
    if (require("../../Pet/Countermarks").IsMutating(this._player)) throw new Error("Countermark mutation pending");
    playerData = {...playerData, pet: require("../../Pet/Countermarks").BattlePet(playerData.pet)};

        const battlePet = this.BuildBattlePet(playerData.pet.petId, playerData.pet.nick || playerData.config?.DefName || 'Player', playerData.pet.level, playerData.pet.hp, playerData.pet.maxHp, playerData.pet.atk, playerData.pet.def, playerData.pet.spAtk, playerData.pet.spDef, playerData.pet.speed, playerData.type, playerData.skills, playerData.pet.catchTime, 0);
        battlePet.effectList = playerData.pet.effectList || [];
        // 个体值取六项平均，与面板一致（按个体计算威力的技能使用）
        battlePet.dv = Math.floor((playerData.pet.dvHp + playerData.pet.dvAtk + playerData.pet.dvDef + playerData.pet.dvSpAtk + playerData.pet.dvSpDef + playerData.pet.dvSpeed) / 6);
        battlePet.skillPP = playerData.skills.map(id => (0, PetPP_1.GetPetSkillPP)(playerData.pet, id));
        Object.assign(battlePet, {countermarks: require("../../Pet/Countermarks").Slots(playerData.pet)});
    return battlePet;
    }
    /**
     * 构建敌人战斗精灵数据
     */
    BuildEnemyBattlePet(enemyPetId, enemyPetConfig, enemyLevel) {
        const enemyStats = this.CalculateEnemyStats(enemyPetConfig, enemyLevel);
        let enemySkills = this.GetEnemySkills(enemyPetId, enemyLevel);
        if (enemySkills.length === 0)
            enemySkills = [10001];
        return this.BuildBattlePet(enemyPetId, enemyPetConfig.DefName || 'Enemy', enemyLevel, enemyStats.hp, enemyStats.maxHp, enemyStats.attack, enemyStats.defence, enemyStats.spAtk, enemyStats.spDef, enemyStats.speed, enemyPetConfig.Type || 0, enemySkills, 0, 0);
    }
    /**
     * 触发战斗被动能力
     */
    async TriggerPassiveAbilities(player, enemy) {
        const playerPassiveResults = PassiveAbilitySystem_1.PassiveAbilitySystem.TriggerPassiveAbilities(player, enemy);
        if (playerPassiveResults.length > 0) {
            utils_1.Logger.Info(`[BattleInitService] 玩家精灵被动能力触发: ${player.name}, 结果数: ${playerPassiveResults.length}`);
        }
        const enemyPassiveResults = PassiveAbilitySystem_1.PassiveAbilitySystem.TriggerPassiveAbilities(enemy, player);
        if (enemyPassiveResults.length > 0) {
            utils_1.Logger.Info(`[BattleInitService] 敌人精灵被动能力触发: ${enemy.name}, 结果数: ${enemyPassiveResults.length}`);
        }
    }
    /**
     * 创建PVE战斗（玩家 vs BOSS/野怪）
     */
    async CreatePVEBattle(enemyId, enemyLevel, universeIndividual) {
        try {
            // 1. 获取玩家精灵
            const playerData = this.GetPlayerPet();
            if (!playerData)
                return null;
            // 2. 构建玩家精灵数据
            const playerBattlePet = this.BuildPlayerBattlePet(playerData);
            // 3. 获取敌人精灵配置
            const enemyPetConfig = GameConfig_1.GameConfig.GetPetById(enemyId);
            if (!enemyPetConfig) {
                utils_1.Logger.Warn(`[BattleInitService] 找不到精灵配置: PetId=${enemyId}`);
                return null;
            }
            // 4. 构建敌人精灵数据
            const enemyBattlePet = this.BuildEnemyBattlePet(enemyId, enemyPetConfig, enemyLevel);
            if (universeIndividual) {
                const stats = this.CalculateBossStats(enemyPetConfig, enemyLevel, universeIndividual.dv, 0, universeIndividual.nature);
                Object.assign(enemyBattlePet, stats, { dv: universeIndividual.dv });
            }
            // 5. 创建战斗实例
            const battle = {
                userId: this._player.Uid,
                player: playerBattlePet,
                enemy: enemyBattlePet,
                turn: 0,
                isOver: false,
                battleType: BattleModel_1.BattleType.PVE,
                startTime: Math.floor(Date.now() / 1000),
                roundCount: 0,
                lastHitWasCritical: false
            };
            // 6. 触发被动能力
            await this.TriggerPassiveAbilities(playerBattlePet, enemyBattlePet);
            utils_1.Logger.Info(`[BattleInitService] 创建PVE战斗: UserID=${this._player.Uid}, Pet=${playerData.pet.petId}(Lv${playerData.pet.level}) vs Enemy=${enemyId}(Lv${enemyLevel})`);
            return battle;
        }
        catch (error) {
            utils_1.Logger.Error(`[BattleInitService] 创建PVE战斗失败`, error);
            return null;
        }
    }
    /**
     * 构建BOSS战斗精灵数据
     */
    BuildBossBattlePet(bossConfig, bossPetConfig) {
        // 计算BOSS属性
        const bossStats = this.CalculateBossStats(bossPetConfig, bossConfig.level, bossConfig.dv, bossConfig.ev, bossConfig.nature);
        if (bossConfig.customHP !== undefined && bossConfig.customHP > 0) {
            bossStats.hp = bossConfig.customHP;
            bossStats.maxHp = bossConfig.customHP;
        }
        // 获取BOSS技能
        let bossSkills = bossConfig.skills && bossConfig.skills.length > 0
            ? bossConfig.skills
            : this.GetEnemySkills(bossConfig.petId, bossConfig.level);
        if (bossSkills.length === 0)
            bossSkills = [10001];
        return require("../BossSpecialRules").BossSpecialRules.DecorateBoss(this.BuildBattlePet(bossConfig.petId, bossConfig.petName, bossConfig.level, bossStats.hp, bossStats.maxHp, bossStats.attack, bossStats.defence, bossStats.spAtk, bossStats.spDef, bossStats.speed, bossPetConfig.Type || 0, bossSkills, 0, 0), bossConfig);
    }
    /**
     * 创建BOSS战斗（使用mapId和param2从配置读取完整信息）
     */
    async CreateBossBattle(mapId, param2) {
        try {
            // 新手战斗(mapId=515)：根据玩家精灵属性生成克制对手
            if (mapId === 515) {
                return this.CreateFreshBattle(this._player.Uid);
            }
            // 1. 从配置读取BOSS信息
            const bossConfig = BossAbilityConfig_1.BossAbilityConfig.Instance.GetBossConfigByMapAndParam(mapId, param2);
            if (!bossConfig) {
                utils_1.Logger.Warn(`[BattleInitService] 找不到BOSS配置: MapId=${mapId}, Param2=${param2}`);
                return null;
            }
            utils_1.Logger.Info(`[BattleInitService] 创建BOSS战斗: MapId=${mapId}, Param2=${param2}, PetId=${bossConfig.petId}, Level=${bossConfig.level}`);
            // 2. 获取玩家精灵
            const playerData = this.GetPlayerPet();
            if (!playerData)
                return null;
            // 3. 构建玩家精灵数据
            const playerBattlePet = this.BuildPlayerBattlePet(playerData);
            // 4. 获取BOSS精灵配置
            const bossPetConfig = GameConfig_1.GameConfig.GetPetById(bossConfig.petId);
            if (!bossPetConfig) {
                utils_1.Logger.Warn(`[BattleInitService] 找不到BOSS精灵配置: PetId=${bossConfig.petId}`);
                return null;
            }
            // 5. 构建BOSS精灵数据
            const bossBattlePet = this.BuildBossBattlePet(bossConfig, bossPetConfig);
            // 6. 创建战斗实例
            const battle = {
                userId: this._player.Uid,
                player: playerBattlePet,
                enemy: bossBattlePet,
                turn: 0,
                isOver: false,
                battleType: BattleModel_1.BattleType.BOSS,
                startTime: Math.floor(Date.now() / 1000),
                bossMapId: mapId,
                bossParam2: param2,
                universeBoss: bossConfig.universeBossKey ? Object.freeze({
                    key: bossConfig.universeBossKey,
                    sceneKey: bossConfig.universeSceneKey,
                    mapId, region: param2, petId: bossConfig.petId, tier: bossConfig.universeTier,
                    spt: Object.freeze({ ...bossConfig.spt })
                }) : undefined,
                roundCount: 0,
                lastHitWasCritical: false
            };
            // 7. 触发被动能力
            (0, PuniSealBattle_1.InitPuniSeal)(battle);
            await this.TriggerPassiveAbilities(playerBattlePet, bossBattlePet);
            require("../AlderSealBattle").InitAlder(battle);
            utils_1.Logger.Info(`[BattleInitService] 创建BOSS战斗成功: UserID=${this._player.Uid}, Pet=${playerData.pet.petId} vs ${bossConfig.petName}`);
            return battle;
        }
        catch (error) {
            utils_1.Logger.Error(`[BattleInitService] 创建BOSS战斗失败`, error);
            return null;
        }
    }
    /**
     * 构建战斗精灵数据
     */
    BuildBattlePet(id, name, level, hp, maxHp, attack, defence, spAtk, spDef, speed, type, skills, catchTime, skinID = 0) {
        // 过滤无效技能，但确保至少有一个技能
        const validSkills = skills.filter(s => s > 0);
        const finalSkills = validSkills.length > 0 ? validSkills : [10001]; // 默认撞击
        // 从技能配置中获取每个技能的最大PP
        const skillPPs = finalSkills.map(skillId => {
            const skillConfig = GameConfig_1.GameConfig.GetSkillById(skillId);
            const maxPP = skillConfig?.MaxPP || 20;
            utils_1.Logger.Debug(`[BattleInitService] BuildBattlePet: SkillId=${skillId}, MaxPP=${maxPP}, SkillName=${skillConfig?.Name || 'Unknown'}`);
            return maxPP;
        });
        utils_1.Logger.Debug(`[BattleInitService] BuildBattlePet: Skills=${JSON.stringify(finalSkills)}, PPs=${JSON.stringify(skillPPs)}`);
        const pet = {
            petId: id,
            id,
            name,
            level,
            hp,
            maxHp,
            attack,
            defence,
            spAtk,
            spDef,
            speed,
            type,
            skills: finalSkills,
            catchTime,
            skinID, // 设置皮肤ID
            statusArray: new Array(20).fill(0),
            battleLv: new Array(6).fill(0),
            status: BattleModel_1.BattleStatus.NONE,
            statusTurns: 0,
            statusDurations: new Array(20).fill(0),
            flinched: false,
            bound: false,
            boundTurns: 0,
            fatigue: false,
            fatigueTurns: 0,
            battleLevels: [0, 0, 0, 0, 0, 0],
            effectCounters: {},
            skillPP: skillPPs, // 使用从配置读取的PP值
            lastMove: 0,
            encore: false,
            encoreTurns: 0
        };
        // 使用 Proxy 包装，自动同步状态字段
        return (0, BattlePetProxy_1.createBattlePetProxy)(pet);
    }
    /**
     * 计算敌人属性（使用BattleAlgorithm）
     */
    CalculateEnemyStats(petConfig, level) {
        const baseStats = {
            hp: petConfig.HP || 50,
            attack: petConfig.Atk || 40,
            defence: petConfig.Def || 35,
            spAtk: petConfig.SpAtk || 40,
            spDef: petConfig.SpDef || 35,
            speed: petConfig.Spd || 30
        };
        const stats = BattleAlgorithm_1.BattleAlgorithm.CalculateStats(baseStats, level, 24);
        return {
            hp: stats.hp,
            maxHp: stats.maxHp,
            attack: stats.attack,
            defence: stats.defence,
            spAtk: stats.spAtk,
            spDef: stats.spDef,
            speed: stats.speed
        };
    }
    /**
     * 计算BOSS属性
     */
    CalculateBossStats(petConfig, level, dv, ev, nature) {
        const baseStats = {
            hp: petConfig.HP || 50,
            attack: petConfig.Atk || 40,
            defence: petConfig.Def || 35,
            spAtk: petConfig.SpAtk || 40,
            spDef: petConfig.SpDef || 35,
            speed: petConfig.Spd || 30
        };
        const stats = BattleAlgorithm_1.BattleAlgorithm.CalculateStats(baseStats, level, dv, undefined, nature);
        return {
            hp: stats.hp,
            maxHp: stats.maxHp,
            attack: stats.attack,
            defence: stats.defence,
            spAtk: stats.spAtk,
            spDef: stats.spDef,
            speed: stats.speed
        };
    }
    /**
     * 获取敌人技能列表
     */
    GetEnemySkills(petId, level) {
        // 使用 SptSystem 获取精灵的可学习技能
        const learnableMoves = SptSystem_1.SptSystem.GetLearnableMovesByLevel(petId, level);
        if (learnableMoves.length === 0) {
            return [10001]; // 默认撞击
        }
        // 如果技能数量 <= 4，直接返回所有技能
        if (learnableMoves.length <= 4) {
            return learnableMoves.map(move => move.id);
        }
        // 随机选择4个技能
        const shuffled = [...learnableMoves].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, 4).map(move => move.id);
    }
    /**
     * 验证战斗是否有效
     */
    ValidateBattle(battle) {
        if (!battle) {
            utils_1.Logger.Debug(`[BattleInitService] ValidateBattle: battle is null`);
            return false;
        }
        if (battle.isOver) {
            utils_1.Logger.Debug(`[BattleInitService] ValidateBattle: battle.isOver = true`);
            return false;
        }
        if (battle.player.hp <= 0) {
            utils_1.Logger.Debug(`[BattleInitService] ValidateBattle: player.hp = ${battle.player.hp}`);
            return false;
        }
        if (battle.enemy.hp <= 0) {
            utils_1.Logger.Debug(`[BattleInitService] ValidateBattle: enemy.hp = ${battle.enemy.hp}`);
            return false;
        }
        utils_1.Logger.Debug(`[BattleInitService] ValidateBattle: 战斗有效`);
        return true;
    }
    /**
     * 创建新手战斗（mapId=515）
     * 根据玩家精灵属性生成克制对手：草系→火系→水系→草系
     */
    async CreateFreshBattle(userId) {
        try {
            // 1. 获取玩家精灵
            const playerData = this.GetPlayerPet();
            if (!playerData)
                return null;
            // 2. 根据玩家精灵属性生成克制对手
            // 属性枚举来自 elements.json：草=1、水=2、火=3。
            let enemyPetId;
            switch (playerData.type) {
                case ElementSystem_1.ElementType.GRASS: // 草系 -> 火系
                    enemyPetId = 7; // 小火猴
                    break;
                case ElementSystem_1.ElementType.FIRE: // 火系 -> 水系
                    enemyPetId = 4; // 伊优
                    break;
                case ElementSystem_1.ElementType.WATER: // 水系 -> 草系
                    enemyPetId = 1; // 布布种子
                    break;
                default:
                    enemyPetId = 7; // 默认火系
            }
            const enemyLevel = 3;
            const enemyPetConfig = GameConfig_1.GameConfig.GetPetById(enemyPetId);
            if (!enemyPetConfig) {
                utils_1.Logger.Warn(`[BattleInitService] 新手战斗：找不到敌人精灵配置: PetId=${enemyPetId}`);
                return null;
            }
            // 3. 构建玩家精灵数据
            const playerBattlePet = this.BuildPlayerBattlePet(playerData);
            // 4. 构建敌人精灵数据
            const enemyBattlePet = this.BuildEnemyBattlePet(enemyPetId, enemyPetConfig, enemyLevel);
            // 5. 创建战斗实例
            const battle = {
                userId: userId,
                player: playerBattlePet,
                enemy: enemyBattlePet,
                turn: 0,
                isOver: false,
                startTime: Date.now(),
                battleType: BattleModel_1.BattleType.FRESH,
            };
            utils_1.Logger.Info(`[BattleInitService] 新手战斗创建: UserID=${userId}, ` +
                `玩家精灵=${playerData.pet.petId}(type=${playerData.type}), 敌人精灵=${enemyPetId}(type=${enemyPetConfig.Type})`);
            return battle;
        }
        catch (error) {
            utils_1.Logger.Error(`[BattleInitService] 新手战斗创建失败`, error);
            return null;
        }
    }
}
exports.BattleInitService = BattleInitService;
//# sourceMappingURL=BattleInitService.js.map