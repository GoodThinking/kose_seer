"use strict";
/**
 * BOSS特殊规则系统
 * 从配置文件读取并应用BOSS特殊规则，只作用于BOSS战里的BOSS本体：
 * 顺序破防、破防与击杀条件、免疫、闪避、减伤、PP耗尽、周几规则、谱尼封印等。
 * 规则状态保存在本场BOSS精灵对象上，玩家自己的同种精灵和野怪不受影响。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BossSpecialRules = void 0;
const utils_1 = require("../../../shared/utils");
const BossAbilityConfig_1 = require("./BossAbility/BossAbilityConfig");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
// 技能附加效果 → 让对方陷入的异常（麻痹、中毒、烧伤、冻伤、害怕、睡眠）
const STATUS_EFFECTS = { 10: 0, 11: 1, 12: 2, 14: 5, 15: 6, 16: 8 };
/**
 * BOSS特殊规则管理器
 */
class BossSpecialRules {
    // ==================== BOSS标记 ====================
    /**
     * 为BOSS战的BOSS精灵挂上本场的特性、规则和状态（按当天星期解析周几规则）
     */
    static DecorateBoss(pet, bossConfig) {
        const weekday = new Date().getDay();
        const abilities = bossConfig.weekdayAbilities?.[weekday] ?? bossConfig.abilities ?? [];
        pet.bossAbilityEntries = abilities.map((a) => typeof a === 'number' ? { id: a } : { id: a.id, args: a.args });
        const mechanics = { ...(bossConfig.mechanics || {}), ...(bossConfig.weekdayMechanics?.[weekday] || {}) };
        const phases = mechanics.phases || [];
        delete mechanics.phases;
        pet.bossMechanics = mechanics;
        pet.bossState = { sequencePhase: 0, shieldBroken: false, livesLeft: mechanics.extraLives || 0, phases, phase: 0, opened: false, layers: mechanics.layers || 0 };
        (mechanics.startStages || []).forEach((stage, index) => {
            if (stage)
                pet.battleLevels[index] = stage;
        });
        utils_1.Logger.Info(`[BossSpecialRules] BOSS规则: ${pet.name} Map=${bossConfig.mapId}/${bossConfig.param2}, ` +
            `特性=[${pet.bossAbilityEntries.map((e) => e.id).join(',')}], 规则=${JSON.stringify(mechanics)}`);
        return pet;
    }
    static Mechanics(pet) {
        return pet?.bossMechanics;
    }
    // ==================== 免疫 ====================
    /**
     * 检查BOSS是否免疫同生共死
     */
    static IsSameLifeDeathImmune(pet) {
        return !!this.Mechanics(pet)?.immune?.includes('sameLifeDeath');
    }
    /**
     * 检查目标是否免疫某个异常状态（被动免疫标记、BOSS规则或技能的持续免疫）
     * @param skillId 施加异常的技能，用于判断是否为属性技能
     */
    static IsStatusImmune(pet, status, skillId) {
        if (pet?.immuneFlags?.status || require('./SkillEffectRuntime').SkillEffectRuntime.IsStatusImmune(pet || {}))
            return true;
        const mechanics = this.Mechanics(pet);
        if (require("./UniverseBossBudget").battleFor(pet)?.enemy === pet) return false;
        if (!mechanics)
            return false;
        if (mechanics.statusImmune === true)
            return true;
        // 异常破绽：钥匙异常还在时不能续上，刚结束的那一回合也不会再陷入
        if (mechanics.reviveUnlessStatus?.includes?.(status) && (pet.bossState?.keyGuard > 0 || (pet.statusDurations || [])[status] > 0))
            return true;
        if (Array.isArray(mechanics.statusImmune) && mechanics.statusImmune.includes(status))
            return true;
        return !!mechanics.statusFromAttacksOnly && !!skillId && GameConfig_1.GameConfig.GetSkillById(skillId)?.Category === 4;
    }
    /**
     * 低血必定致命一击（lowHpCritPercent）
     */
    static IsForcedCrit(pet) {
        const percent = this.Mechanics(pet)?.lowHpCritPercent;
        return !!percent && pet.hp > 0 && (this.Mechanics(pet)?.universeRequiemImmune ? pet.hp * 100 <= pet.maxHp * percent : pet.hp * 100 < pet.maxHp * percent);
    }
    /**
     * 镇魂歌等延迟致死效果：完全免疫异常的目标不受影响（经典版塞维尔镇魂歌无效，魔狮迪露有效）
     */
    static IsRequiemImmune(pet) {
        return !!(pet?.immuneFlags?.status || this.Mechanics(pet)?.statusImmune === true || this.Mechanics(pet)?.universeRequiemImmune);
    }
    /**
     * 检查目标是否免疫能力下降（被动免疫标记、BOSS规则或技能的持续免疫）
     */
    static IsStatDownImmune(pet) {
        if (require("./UniverseBossBudget").battleFor(pet)?.enemy === pet) return !!(pet?.immuneFlags?.statDown || require("./SkillEffectRuntime").SkillEffectRuntime.IsStatDownImmune(pet || {}));
        return !!(pet?.immuneFlags?.statDown || this.Mechanics(pet)?.statDownImmune ||
            require('./SkillEffectRuntime').SkillEffectRuntime.IsStatDownImmune(pet || {}));
    }
    // ==================== 命中 ====================
    /**
     * BOSS受击命中修正（必中技能已在调用前放行，作用于自身的技能不受影响）
     * @returns false=本次未命中；undefined=按常规命中判定
     */
    static CheckBossHit(defender, skill) {
        if (require("./UniverseBossBudget").battleFor(defender)?.enemy === defender) return undefined;
        const mechanics = this.Mechanics(defender);
        const skillConfig = GameConfig_1.GameConfig.GetSkillById(skill.id);
        if (!mechanics || Number(skillConfig?.AtkType) === 3)
            return undefined;
        // 异常破绽：能让它陷入钥匙异常的技能必定命中
        const keys = mechanics.reviveUnlessStatus;
        if (Array.isArray(keys) && String(skillConfig?.SideEffect || '').split(/s+/).some((id) => keys.includes(STATUS_EFFECTS[id]))) {
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 对${skill.name}毫无防备, 必定命中`);
            return true;
        }
        if (mechanics.onlyMustHit) {
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 只会被必中技能命中`);
            return false;
        }
        if (mechanics.dodgePercent && Math.random() * 100 < mechanics.dodgePercent) {
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 闪避了攻击 (${mechanics.dodgePercent}%)`);
            return false;
        }
        return undefined;
    }
    /**
     * 攻击未命中：顺序破防BOSS按原版规则，正确属性的攻击落空也会消耗当前顺序
     */
    static OnAttackMissed(defender, skill) {
        if (require("./UniverseBossBudget").battleFor(defender)?.enemy === defender) return;
        if (!this.Mechanics(defender) || (skill.category !== 1 && skill.category !== 2))
            return;
        const required = this.RequiredSequenceType(defender);
        if (required !== undefined && (skill.type || 8) === required) {
            this.AdvanceSequence(defender, required, '落空');
        }
    }
    // ==================== 伤害 ====================
    /**
     * 修正对BOSS造成的伤害；普通攻击、固定伤害和秒杀都经过这里
     * @param info.mode 固定伤害模式（hp_difference/percent/fixed）
     * @param info.effectiveness 属性克制倍率
     */
    static ModifyDamageToBoss(battle, attacker, defender, skill, damage, kind, info = {}) {
        if (battle?.universeBoss && defender === battle.enemy) return kind === "ohko" ? 0 : damage;
        const mechanics = this.Mechanics(defender);
        if (!mechanics || defender !== battle.enemy || damage <= 0)
            return damage;
        // 属性护盾：只受指定属性技能的伤害（直接、固定、比例和秒杀都算）
        if (mechanics.onlyTypes?.length && !mechanics.onlyTypes.includes(skill.type || 8)) {
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 只受属性${mechanics.onlyTypes.join('/')}的伤害, 技能属性=${skill.type || 8}, 伤害归零`);
            return 0;
        }
        // 坚甲：防御或特防（armorBreak 为 both 时两项都）处于下降状态才会受伤
        if (mechanics.armorBreak) {
            const levels = defender.battleLevels || [];
            const broken = mechanics.armorBreak === 'both' ? levels[1] < 0 && levels[3] < 0 : levels[1] < 0 || levels[3] < 0;
            if (!broken) {
                utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 防御没有被降低, 伤害归零`);
                return 0;
            }
        }
        // 多层护甲：每段攻击打掉一层，被挡住的那几段不造成伤害；护甲没打光时固定伤害也无效
        if (mechanics.layers && defender.bossState.layers > 0) {
            if (kind === 'fixed') {
                utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 护甲还有${defender.bossState.layers}层, 固定伤害无效`);
                return 0;
            }
            const hits = kind === 'attack' ? Math.max(1, attacker.effectStates?._hits || 1) : 1;
            const absorbed = Math.min(defender.bossState.layers, hits);
            defender.bossState.layers -= absorbed;
            damage = Math.floor(damage * (hits - absorbed) / hits);
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 护甲挡下${absorbed}段攻击, 还剩${defender.bossState.layers}层, 伤害=${damage}`);
            if (damage <= 0)
                return 0;
        }
        if (kind === 'ohko' && mechanics.ohkoImmune) {
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 免疫秒杀`);
            return 0;
        }
        if (kind === 'fixed') {
            if (info.mode === 'hp_difference' && mechanics.immune?.includes('sameLifeDeath')) {
                utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 免疫同生共死`);
                return 0;
            }
            if (info.mode === 'percent' && mechanics.immune?.includes('percentDamage')) {
                utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 免疫百分比伤害`);
                return 0;
            }
        }
        // 秒杀同样受谱尼封印、顺序破防的限制，只是不吃减伤
        if (mechanics.directDamageImmune) {
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 只受攻击技能附加异常的伤害`);
            return 0;
        }
        damage = require('./PuniSealBattle').ModifyPuniDamage(battle, defender, skill.type || 8, damage);
        damage = require('./AlderSealBattle').ModifyAlderDamage(battle, defender, damage);
        const required = this.RequiredSequenceType(defender);
        if (required !== undefined) {
            if ((skill.type || 8) !== required) {
                utils_1.Logger.Info(`[BossSpecialRules] 顺序破防失败: ${defender.name} 需要属性${required}, 技能属性=${skill.type || 8}, 伤害归零`);
                return 0;
            }
            this.AdvanceSequence(defender, required, '命中');
        }
        if (kind !== 'ohko') {
            if (kind === 'attack' && mechanics.typeNeutral && info.effectiveness && info.effectiveness !== 1) {
                damage = Math.floor(damage / info.effectiveness);
            }
            if (mechanics.damageReductionPercent) {
                damage = Math.max(1, Math.floor(damage * (100 - mechanics.damageReductionPercent) / 100));
            }
        }
        damage = this.ApplyTacticalDamageModifier(battle, attacker, defender, skill, damage, kind, info);
        return this.ApplyKillCondition(attacker, defender, skill, damage);
    }
    /**
     * 破防/击杀条件：破防前免疫伤害；只能由指定精灵的指定技能击杀，其他致死伤害保留1血
     */
    static ApplyKillCondition(attacker, defender, skill, damage) {
        const rule = BossAbilityConfig_1.BossAbilityConfig.Instance.GetSpecialKillConditionRule(defender.petId);
        if (!rule)
            return damage;
        const state = defender.bossState;
        if (skill.id === rule.breakSkillId && !state.shieldBroken) {
            state.shieldBroken = true;
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 被${rule.breakSkillName || rule.breakSkillId}破防`);
        }
        else if (rule.shieldUntilBreak && !state.shieldBroken) {
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 未破防，伤害归零`);
            return 0;
        }
        if (damage >= defender.hp && !(state.shieldBroken && skill.id === rule.killSkillId && attacker.petId === rule.requiredPetId)) {
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 只能被${rule.requiredPetName || rule.requiredPetId}的${rule.killSkillName || rule.killSkillId}击败，保留1血`);
            return Math.max(0, defender.hp - 1);
        }
        return damage;
    }
    static RequiredSequenceType(defender) {
        // BOSS 自己配了 typeSequence 时优先：同一只精灵在不同 BOSS 位可以不同
        const sequence = this.Mechanics(defender)?.typeSequence || BossAbilityConfig_1.BossAbilityConfig.Instance.GetSequentialTypeBreakRule(defender.petId)?.typeSequence;
        if (!sequence?.length)
            return undefined;
        return sequence[defender.bossState.sequencePhase % sequence.length];
    }
    static AdvanceSequence(defender, required, reason) {
        defender.bossState.sequencePhase++;
        utils_1.Logger.Info(`[BossSpecialRules] 顺序破防${reason}: ${defender.name} 属性${required}，进入第${defender.bossState.sequencePhase}步`);
    }
    /**
     * BOSS受到直接攻击并结算体力后：能量反杀、物理受击异常、体力结算
     */
    static AfterBossDamaged(battle, attacker, defender, skill, damage) {
        if (battle?.universeBoss && defender === battle.enemy) return;
        const mechanics = this.Mechanics(defender);
        if (!mechanics || defender !== battle.enemy)
            return;
        const attack = skill.category === 1 || skill.category === 2;
        // 强化压制：每受到一次攻击伤害，指定能力再提升一级
        const boost = mechanics.boostOnHit;
        if (boost && attack && damage > 0 && defender.hp > 0) {
            for (const stat of boost.stats)
                defender.battleLevels[stat] = Math.min(boost.max || 6, (defender.battleLevels[stat] || 0) + 1);
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 受到攻击, 能力等级=${JSON.stringify([...defender.battleLevels])}`);
        }
        if (mechanics.counterKillThreshold && attack && damage > mechanics.counterKillThreshold && attacker.hp > 0) {
            attacker.hp = 0;
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 受到${damage}点伤害，反杀${attacker.name}`);
        }
        const onHit = mechanics.onPhysicalHitStatus;
        if (onHit && skill.category === 1 && damage > 0 && attacker.hp > 0 &&
            !(attacker.status > 0) && !this.IsStatusImmune(attacker, onHit.status) && Math.random() * 100 < onHit.chance) {
            attacker.statusTurns = onHit.turns;
            attacker.status = onHit.status;
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 受到物理攻击，${attacker.name} 陷入异常${onHit.status}`);
        }
        this.SettleBossHp(battle, 'attack');
        this.CheckHalfHpAwaken(battle, defender);
        this.ProcessDarkErosionOnHit(battle, attacker, defender, skill, damage);
    }
    /**
     * 结算BOSS体力归零：谱尼多命/轮回、额外命数、持续伤害不能致死、无异常时复活
     * @param source 'attack'=直接攻击后；'dot'=回合开始/结束的持续伤害等
     */
    static SettleBossHp(battle, source) {
        if (battle?.universeBoss) return;
        const boss = battle?.enemy;
        const mechanics = this.Mechanics(boss);
        if (!mechanics || boss.hp > 0)
            return;
        require('./PuniSealBattle').ResolvePuniSurvival(battle, boss);
        require('./AlderSealBattle').ResolveAlderSurvival(battle, boss);
        if (boss.hp <= 0 && boss.bossState.livesLeft > 0) {
            boss.bossState.livesLeft--;
            boss.hp = boss.maxHp;
            utils_1.Logger.Info(`[BossSpecialRules] ${boss.name} 复活，剩余额外命数=${boss.bossState.livesLeft}`);
            this.EnterNextPhase(boss);
        }
        if (boss.hp > 0) {
            this.RestorePP(boss);
            return;
        }
        const rule = BossAbilityConfig_1.BossAbilityConfig.Instance.GetSpecialKillConditionRule(boss.petId);
        if (source === 'dot' && rule?.dotCannotKill) {
            boss.hp = 1;
            utils_1.Logger.Info(`[BossSpecialRules] ${boss.name} 持续伤害无法致死，保留1血`);
            return;
        }
        // 异常破绽：为数组时只认这几种异常，不处在其中任何一种时被击倒就回满
        const revive = mechanics.reviveUnlessStatus;
        const durations = boss.statusDurations || [];
        if (revive && !(Array.isArray(revive) ? revive.some((status) => durations[status] > 0) : durations.some((turns) => turns > 0))) {
            boss.hp = boss.maxHp;
            utils_1.Logger.Info(`[BossSpecialRules] ${boss.name} 没有${Array.isArray(revive) ? '指定的' : ''}异常状态，体力回满`);
        }
    }
    /**
     * 复活后切换到下一形态：异常、能力等级和回合类效果清空，规则、特性、技能换成新形态的
     */
    static EnterNextPhase(boss) {
        const phases = boss.bossState.phases || [];
        if (!phases.length)
            return;
        const phase = phases[Math.min(boss.bossState.phase, phases.length - 1)];
        boss.bossState.phase++;
        boss.bossState.awakened = false;
        boss.bossMechanics = { ...(phase.mechanics || {}) };
        boss.status = undefined;
        boss.statusDurations.fill(0);
        boss.battleLevels.fill(0);
        (phase.mechanics?.startStages || []).forEach((stage, index) => {
            if (stage)
                boss.battleLevels[index] = stage;
        });
        delete boss.effectStates;
        delete boss.passiveStates;
        if (phase.skills?.length) {
            boss.skills = [...phase.skills];
            boss.skillPP = phase.skills.map((id) => GameConfig_1.GameConfig.GetSkillById(id)?.MaxPP || 0);
        }
        boss.bossAbilityEntries = (phase.abilities || []).map((a) => typeof a === 'number' ? { id: a } : { id: a.id, args: a.args });
        boss.immuneFlags = {};
        require('./BossAbility/BossAbilityManager').BossAbilityManager.InitializeBossAbilities(boss, boss.bossAbilityEntries);
        utils_1.Logger.Info(`[BossSpecialRules] ${boss.name} 进入形态: ${phase.name || boss.bossState.phase}`);
    }
    /**
     * 回合结束：谱尼生命封印回血
     */
    static OnTurnEnd(battle) {
        const boss = battle?.enemy, mechanics = this.Mechanics(boss);
        if (mechanics)
            require('./PuniSealBattle').HealPuniLifeSeal(battle);
        require('./AlderSealBattle').HealAlder(battle);
        this.ProcessFieldAuraTurnEnd(battle);
        // 多层护甲：每回合结束恢复一层
        if (mechanics?.layers && boss.hp > 0 && boss.bossState.layers < mechanics.layers) {
            boss.bossState.layers++;
            utils_1.Logger.Info(`[BossSpecialRules] ${boss.name} 护甲恢复到${boss.bossState.layers}层`);
        }
        // 异常破绽：钥匙异常结束后，下一回合它不会再陷入这种异常
        const keys = mechanics?.reviveUnlessStatus;
        if (Array.isArray(keys) && boss.hp > 0) {
            const state = boss.bossState, active = keys.some((status) => (boss.statusDurations || [])[status] > 0);
            if (state.keyGuard > 0)
                state.keyGuard--;
            else if (state.keyActive && !active) {
                state.keyGuard = 1;
                utils_1.Logger.Info(`[BossSpecialRules] ${boss.name} 从异常中恢复，下一回合不会再陷入`);
            }
            state.keyActive = active;
        }
    }
    // ==================== PP ====================
    /**
     * BOSS战里BOSS选技能：全部技能PP耗尽时本回合不行动（返回0）；低血秒杀阶段只用攻击技能
     */
    static SelectBossSkill(battle, skillId) {
        const boss = battle?.enemy;
        if (!this.Mechanics(boss) || !Array.isArray(boss.skillPP))
            return skillId;
        if (!boss.skillPP.some((pp) => pp > 0)) {
            utils_1.Logger.Info(`[BossSpecialRules] ${boss.name} 技能PP耗尽，无法行动`);
            return 0;
        }
        const opening = boss.bossMechanics.openingSkill;
        if (opening && !boss.bossState.opened) {
            boss.bossState.opened = true;
            const index = boss.skills.indexOf(opening.skillId);
            if (index >= 0 && boss.skillPP[index] > 0 && (battle.player?.level || 0) >= (opening.minFoeLevel || 0))
                return opening.skillId;
        }
        skillId = this.ChooseTacticalSkill(battle, skillId);
        const lowHp = boss.bossMechanics.lowHpAttackPercent;
        if (lowHp && boss.hp * 100 < boss.maxHp * lowHp && GameConfig_1.GameConfig.GetSkillById(skillId)?.Category === 4) {
            const attack = boss.skills.find((id, i) => boss.skillPP[i] > 0 && GameConfig_1.GameConfig.GetSkillById(id)?.Category !== 4);
            if (attack)
                skillId = attack;
        }
        return skillId;
    }
    /**
     * BOSS真正出手时消耗PP（睡眠、麻痹等无法行动的回合不消耗）
     */
    static SpendBossPP(battle, attacker, skill) {
        if (attacker !== battle?.enemy || !this.Mechanics(attacker) || !Array.isArray(attacker.skillPP))
            return;
        const index = attacker.skills.indexOf(skill.id);
        if (index >= 0 && attacker.skillPP[index] > 0)
            attacker.skillPP[index]--;
    }
    static RestorePP(boss) {
        if (!Array.isArray(boss.skillPP))
            return;
        boss.skills.forEach((skillId, index) => {
            boss.skillPP[index] = GameConfig_1.GameConfig.GetSkillById(skillId)?.MaxPP || boss.skillPP[index];
        });
    }
    // ==================== 周几规则 ====================
    /**
     * 验证周几出现规则的挑战条件（在战斗结束时调用）
     * @param defenderId 防御方精灵ID
     * @param mapId 当前地图ID
     * @param roundCount 战斗回合数
     * @param isCriticalHit 是否致命一击击败
     * @returns 是否满足挑战条件
     */
    static ValidateWeekdayScheduleCondition(defenderId, mapId, roundCount, isCriticalHit) {
        // 检查是否为周几出现规则BOSS
        if (!BossAbilityConfig_1.BossAbilityConfig.Instance.IsWeekdayScheduleBoss(defenderId)) {
            return { valid: true }; // 不是周几规则BOSS，默认通过
        }
        // 获取当前周几
        const now = new Date();
        const weekday = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
        // 获取当前周几的规则
        const schedule = BossAbilityConfig_1.BossAbilityConfig.Instance.GetWeekdayScheduleByWeekday(defenderId, weekday);
        if (!schedule) {
            utils_1.Logger.Warn(`[BossSpecialRules] 周几出现规则: BOSS=${defenderId}, ` +
                `周几=${weekday}, 未找到对应规则`);
            return { valid: false };
        }
        // 检查地图是否匹配
        if (schedule.mapId !== mapId) {
            utils_1.Logger.Info(`[BossSpecialRules] 周几出现规则-地图不匹配: BOSS=${defenderId}, ` +
                `周几=${weekday}, 期望地图=${schedule.mapId}(${schedule.mapName}), ` +
                `实际地图=${mapId}`);
            return { valid: false, condition: schedule.condition, conditionDesc: schedule.conditionDesc };
        }
        // 验证挑战条件
        let conditionMet = false;
        switch (schedule.condition) {
            case 'criticalHit':
                // 致命一击击败
                conditionMet = isCriticalHit;
                break;
            case 'withinRounds':
                // N回合内击败
                conditionMet = roundCount <= (schedule.conditionValue || 2);
                break;
            case 'afterRounds':
                // N回合后击败
                conditionMet = roundCount > (schedule.conditionValue || 10);
                break;
            default:
                utils_1.Logger.Warn(`[BossSpecialRules] 周几出现规则-未知条件类型: ${schedule.condition}`);
                conditionMet = false;
        }
        utils_1.Logger.Info(`[BossSpecialRules] 周几出现规则验证: BOSS=${defenderId}, ` +
            `周几=${weekday}, 地图=${schedule.mapName}, ` +
            `条件=${schedule.conditionDesc}, 回合数=${roundCount}, ` +
            `致命一击=${isCriticalHit}, 结果=${conditionMet ? '通过' : '失败'}`);
        return {
            valid: conditionMet,
            condition: schedule.condition,
            conditionDesc: schedule.conditionDesc
        };
    }

    // ==================== 四阶战术 Boss 扩展逻辑 ====================
    static ApplyTacticalDamageModifier(battle, attacker, defender, skill, damage, kind, info = {}) {
        const mechanics = this.Mechanics(defender);
        if (!mechanics || defender !== battle.enemy || damage <= 0 || kind !== 'attack') return damage;
        if (mechanics.typeHomeTurf) {
            const eff = typeof info.effectiveness === 'number' ? info.effectiveness : 1;
            if (eff > 1) {
                damage = Math.floor(damage * 1.25);
                defender.bossState.auraSuppressedTurn = battle.turn;
                utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 受到克制属性攻击(x${eff})，护体破碎，伤害提升至${damage}并压制当回合光环`);
            } else {
                damage = Math.max(1, Math.floor(damage * 0.68));
            }
        }
        return damage;
    }

    static CheckHalfHpAwaken(battle, defender) {
        const mechanics = this.Mechanics(defender);
        const awaken = mechanics?.halfHpAwaken;
        if (!awaken || !defender || defender.hp <= 0 || defender.hp * 2 > defender.maxHp) return;
        if (defender.bossState.awakened) return;
        defender.bossState.awakened = true;
        if (Array.isArray(defender.battleLevels)) {
            for (let i = 0; i < defender.battleLevels.length; i++) {
                if (defender.battleLevels[i] < 0) defender.battleLevels[i] = 0;
            }
            if (Array.isArray(awaken.stages)) {
                for (let i = 0; i < Math.min(6, awaken.stages.length); i++) {
                    if (awaken.stages[i]) {
                        defender.battleLevels[i] = Math.max(-6, Math.min(6, (defender.battleLevels[i] || 0) + awaken.stages[i]));
                    }
                }
            }
        }
        if (awaken.healPercent && awaken.healPercent > 0) {
            const heal = Math.max(1, Math.floor(defender.maxHp * awaken.healPercent / 100));
            defender.hp = Math.min(defender.maxHp, defender.hp + heal);
        }
        utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 触发半血二阶段觉醒！当前HP=${defender.hp}/${defender.maxHp}`);
    }

    static ProcessDarkErosionOnHit(battle, attacker, defender, skill, damage) {
        const mechanics = this.Mechanics(defender);
        if (mechanics?.fieldAura !== 'darkErosion' || defender.hp <= 0 || damage <= 0) return;
        defender.bossState.hitCount = (defender.bossState.hitCount || 0) + 1;
        if ((mechanics.darkTier || 1) >= 2 && defender.bossState.hitCount % 2 === 0 && attacker && attacker.hp > 1) {
            const shock = Math.min(attacker.hp - 1, Math.max(1, Math.floor(attacker.maxHp / 8)));
            if (shock > 0) attacker.hp -= shock;
            if (Array.isArray(attacker.battleLevels)) {
                attacker.battleLevels[1] = Math.max(-6, (attacker.battleLevels[1] || 0) - 1);
                attacker.battleLevels[3] = Math.max(-6, (attacker.battleLevels[3] || 0) - 1);
            }
            utils_1.Logger.Info(`[BossSpecialRules] ${defender.name} 触发暗黑反震，反伤${shock}并削弱双防`);
        }
    }

    static ProcessFieldAuraTurnEnd(battle) {
        const boss = battle?.enemy;
        const player = battle?.player;
        const mechanics = this.Mechanics(boss);
        if (!mechanics?.fieldAura || !boss || boss.hp <= 0) return;
        if (boss.bossState?.auraSuppressedTurn === battle.turn) {
            utils_1.Logger.Info(`[BossSpecialRules] ${boss.name} 本回合领域光环已被克制攻击压制`);
            return;
        }
        const aura = mechanics.fieldAura;
        if (aura === 'deepSea') {
            boss.hp = Math.min(boss.maxHp, boss.hp + 400);
        } else if (aura === 'magma') {
            if (player && player.hp > 1 && Number(player.type) !== 3) {
                const chip = Math.min(player.hp - 1, Math.max(1, Math.floor(player.maxHp / 10)));
                player.hp -= chip;
            }
        } else if (aura === 'lifeBlessing') {
            boss.hp = Math.min(boss.maxHp, boss.hp + 350);
            if (Array.isArray(boss.battleLevels)) {
                const neg = boss.battleLevels.findIndex(v => v < 0);
                if (neg >= 0) boss.battleLevels[neg] = 0;
            }
        } else if (aura === 'iceDomain') {
            if (player && player.hp > 1 && Number(player.type) !== 9) {
                const chip = Math.min(player.hp - 1, Math.max(1, Math.floor(player.maxHp / 14)));
                player.hp -= chip;
            }
        } else if (aura === 'darkErosion') {
            const regen = mechanics.auraRegen ?? ((mechanics.darkTier || 1) >= 3 ? 350 : 200);
            boss.hp = Math.min(boss.maxHp, boss.hp + regen);
        }
    }

    static ChooseTacticalSkill(battle, fallbackSkillId) {
        const boss = battle?.enemy;
        const foe = battle?.player;
        const mechanics = this.Mechanics(boss);
        if (!mechanics?.tacticalAI || !boss || !foe || !Array.isArray(boss.skills)) return fallbackSkillId;
        const { ElementSystem } = require('./ElementSystem');
        const ratio = s => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
        const foeBuffSum = (foe.battleLevels || []).reduce((acc, v) => acc + (v > 0 ? v : 0), 0);
        const ownBuffSum = (boss.battleLevels || []).reduce((acc, v) => acc + (v > 0 ? v : 0), 0);
        let bestId = fallbackSkillId;
        let bestScore = -Infinity;
        for (let i = 0; i < boss.skills.length; i++) {
            if ((boss.skillPP?.[i] ?? 1) <= 0) continue;
            const id = boss.skills[i];
            const raw = GameConfig_1.GameConfig.GetSkillById(id);
            if (!raw) continue;
            const cat = Number(raw.Category || 1);
            const power = Number(raw.Power || 0);
            const type = Number(raw.Type || 8);
            const prio = Number(raw.Priority || 0);
            const sideEffects = String(raw.SideEffect || '').trim().split(/\s+/).map(Number).filter(Boolean);
            let score = 0;
            if (cat === 1 || cat === 2) {
                const atk = (cat === 2 ? boss.spAtk : boss.attack) * ratio(boss.battleLevels?.[cat === 2 ? 2 : 0] || 0);
                const def = Math.max(1, (cat === 2 ? foe.spDef : foe.defence) * ratio(foe.battleLevels?.[cat === 2 ? 3 : 1] || 0));
                const eff = ElementSystem.GetEffectiveness(type, foe.type);
                const stab = Number(type) === Number(boss.type) ? 1.35 : 1;
                const est = ((42 * Math.max(40, power) * atk / def / 50) + 2) * stab * eff;
                score += est;
                if (est >= foe.hp) score += prio > 0 ? 400 : 200;
                if (prio > 0 && foe.hp * 3 <= foe.maxHp) score += 90;
                if (foeBuffSum >= 2 && (sideEffects.includes(26) || sideEffects.includes(31))) score += 260;
            } else {
                score = 20;
                if (ownBuffSum < 2 && boss.hp * 2 > boss.maxHp && sideEffects.includes(4)) score += 140;
                else score -= 80;
            }
            // Add slight jitter so AI is smart but not 100% robotic
            score += Math.random() * 18;
            if (score > bestScore) {
                bestScore = score;
                bestId = id;
            }
        }
        return bestId;
    }

}
exports.BossSpecialRules = BossSpecialRules;
