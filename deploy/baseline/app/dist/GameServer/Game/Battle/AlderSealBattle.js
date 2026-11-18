"use strict";
/**
 * 光明异能王·奥尔德：六重试炼与真身五条命
 *
 * 官方规则（7k7k 2013-01-06 / 4399 攻略）：
 * - 力量试炼：80级，2000体力，天生攻击/特攻+2、必定先制，强化无法清除。
 * - 智慧试炼：10000体力，频繁使用圣洁光芒偷取强化。
 * - 勇气试炼：10000体力，受到的伤害被压低（单次约100）。
 * - 正义试炼：10000体力，技能会让挑战者不断陷入异常状态。
 * - 仁慈试炼：10000体力，攻击造成多少伤害就回复多少体力。
 * - 坚韧试炼：10000体力，每回合回复500体力，会偷强化、使用圣者之心。
 * - 真身：五条命，2000 / 8000 / 20000 / 12000 / 50000。
 *   第一条命攻击+2且必定先手；第二条命偷强化；第三条命每回合附加异常；
 *   第四条命PP无限且造成伤害回血；第五条命PP无限、每次出招消耗2倍PP、
 *   偷强化并免疫瞬杀。
 *
 * 本模块只作用于 668 号地图（异能部落）的 1-7 号挑战，不影响其他Boss。
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitAlder = InitAlder;
exports.ModifyAlderDamage = ModifyAlderDamage;
exports.ResolveAlderSurvival = ResolveAlderSurvival;
exports.OnTurnStart = OnTurnStart;
exports.OnDamageApplied = OnDamageApplied;
exports.IsStatClearImmune = IsStatClearImmune;
exports.IsInstantKillImmune = IsInstantKillImmune;
exports.PPCostMultiplier = PPCostMultiplier;
exports.HealAlder = HealAlder;
const utils_1 = require("../../../shared/utils");
const AlderConfig_1 = require("../../../shared/config/game/AlderConfig");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const BossAbilityManager_1 = require("./BossAbility/BossAbilityManager");
const ALDER_PET_ID = 1000;
const STATUS_POOL = [2, 5, 10]; // 烧伤、冻伤、混乱
function AlderDoorOf(battle) {
    if (!battle || battle.bossMapId !== AlderConfig_1.AlderConfig.Instance.GetMapId())
        return 0;
    const door = battle.bossParam2 || 0;
    return door >= 1 && door <= 7 ? door : 0;
}
function StateOf(battle) {
    return battle?.enemy?.alderState;
}
function TrialOf(battle) {
    const door = AlderDoorOf(battle);
    return door >= 1 && door <= 6 ? AlderConfig_1.AlderConfig.Instance.GetTrial(door) : undefined;
}
function SetSkills(boss, skills) {
    if (!skills || skills.length === 0)
        return;
    boss.skills = [...skills];
    boss.skillPP = skills.map(id => GameConfig_1.GameConfig.GetSkillById(id)?.MaxPP || 20);
}
function SetStages(boss, stages) {
    if (!Array.isArray(boss.battleLevels))
        boss.battleLevels = [0, 0, 0, 0, 0, 0];
    boss.battleLevels.fill(0);
    if (Array.isArray(boss.battleLv))
        boss.battleLv.fill(0);
    (stages || []).forEach((stage, index) => {
        if (!stage)
            return;
        boss.battleLevels[index] = stage;
        if (Array.isArray(boss.battleLv))
            boss.battleLv[index] = stage;
    });
}
function RegisterPassives(boss, priority, infinitePP) {
    const entries = [];
    if (priority)
        entries.push({ id: 2042, args: [priority] });
    if (infinitePP)
        entries.push({ id: 2010 });
    BossAbilityManager_1.BossAbilityManager.InitializeBossAbilities(boss, entries);
}
function StealStats(battle) {
    const boss = battle.enemy, player = battle.player;
    if (!boss || !player || !Array.isArray(player.battleLevels) || !Array.isArray(boss.battleLevels))
        return;
    let stolen = 0;
    for (let i = 0; i < 6; i++) {
        const value = player.battleLevels[i] || 0;
        if (value <= 0)
            continue;
        boss.battleLevels[i] = Math.min(6, (boss.battleLevels[i] || 0) + value);
        if (Array.isArray(boss.battleLv))
            boss.battleLv[i] = boss.battleLevels[i];
        player.battleLevels[i] = 0;
        if (Array.isArray(player.battleLv))
            player.battleLv[i] = 0;
        stolen += value;
    }
    if (stolen > 0)
        utils_1.Logger.Info(`[AlderSeal] 奥尔德偷取强化，总等级=${stolen}`);
}
function ApplyLife(battle, index) {
    const trueForm = AlderConfig_1.AlderConfig.Instance.GetTrueForm();
    const life = trueForm?.lives[index];
    if (!life)
        return;
    const boss = battle.enemy, state = StateOf(battle);
    state.life = index;
    state.statClearImmune = false;
    state.lifesteal = !!life.lifesteal;
    state.turnStatus = !!life.turnStatus;
    state.stealStats = !!life.stealStats;
    state.instantKillImmune = !!life.instantKillImmune;
    state.ppCostMultiplier = life.ppCostMultiplier || 1;
    state.healPerTurn = 0;
    boss.maxHp = life.hp;
    boss.hp = life.hp;
    boss.status = undefined;
    if (Array.isArray(boss.statusDurations))
        boss.statusDurations.fill(0);
    if (Array.isArray(boss.statusArray))
        boss.statusArray.fill(0);
    boss.fatigueTurns = 0;
    boss.flinched = false;
    boss.bound = false;
    boss.encore = false;
    delete boss.effectStates;
    delete boss.passiveStates;
    boss.immuneFlags = {};
    SetStages(boss, life.startStages);
    SetSkills(boss, life.skills);
    RegisterPassives(boss, life.priority, life.infinitePP);
    if (life.stealStats)
        StealStats(battle);
    utils_1.Logger.Info(`[AlderSeal] 奥尔德真身进入第${index + 1}条命: HP=${boss.hp}`);
}
function InitAlder(battle) {
    const door = AlderDoorOf(battle);
    if (!door)
        return;
    const boss = battle.enemy;
    if (!boss || boss.petId !== ALDER_PET_ID)
        return;
    const trial = door <= 6 ? AlderConfig_1.AlderConfig.Instance.GetTrial(door) : undefined;
    const life = door === 7 ? AlderConfig_1.AlderConfig.Instance.GetTrueForm()?.lives[0] : undefined;
    const source = trial || life;
    if (!source) {
        utils_1.Logger.Warn(`[AlderSeal] 缺少奥尔德${door}号挑战配置`);
        return;
    }
    boss.alderState = { door, life: 0 };
    if (door === 7) {
        ApplyLife(battle, 0);
        return;
    }
    const state = boss.alderState;
    state.statClearImmune = !!trial?.statClearImmune;
    state.lifesteal = !!trial?.lifesteal;
    state.turnStatus = !!trial?.turnStatus;
    state.stealStats = !!trial?.stealStats;
    state.instantKillImmune = !!trial?.instantKillImmune;
    state.ppCostMultiplier = trial?.ppCostMultiplier || 1;
    state.healPerTurn = trial?.healPerTurn || 0;
    boss.maxHp = trial.hp;
    boss.hp = trial.hp;
    SetStages(boss, trial?.startStages);
    SetSkills(boss, trial?.skills);
    RegisterPassives(boss, trial?.priority, false);
    utils_1.Logger.Info(`[AlderSeal] 进入${trial?.name}: HP=${boss.hp}, 门=${door}`);
}
/** 对奥尔德造成的伤害修正（勇气试炼压低单次伤害）。 */
function ModifyAlderDamage(battle, defender, damage) {
    if (!battle || defender !== battle.enemy || damage <= 0)
        return damage;
    const trial = TrialOf(battle);
    if (trial?.damageCap && damage > trial.damageCap)
        return trial.damageCap;
    return damage;
}
/** 真身或多命Boss体力归零后的换命处理。 */
function ResolveAlderSurvival(battle, boss) {
    const state = StateOf(battle);
    if (!state || boss !== battle.enemy || boss.hp > 0)
        return;
    if (state.door !== 7)
        return;
    const trueForm = AlderConfig_1.AlderConfig.Instance.GetTrueForm();
    const next = state.life + 1;
    if (trueForm && next < trueForm.lives.length)
        ApplyLife(battle, next);
}
/** 回合开始：正义试炼与真身第三条命附加异常。 */
function OnTurnStart(battle) {
    const state = StateOf(battle);
    if (!state || !battle?.player || battle.player.hp <= 0)
        return;
    const player = battle.player;
    if (state.turnStatus && !player.immuneFlags?.status) {
        const status = STATUS_POOL[Math.floor(Math.random() * STATUS_POOL.length)];
        if (!Array.isArray(player.statusDurations))
            player.statusDurations = new Array(20).fill(0);
        if (!Array.isArray(player.statusArray))
            player.statusArray = new Array(20).fill(0);
        player.status = status;
        player.statusTurns = 2;
        player.statusDurations[status] = 2;
        player.statusArray.fill(0);
        player.statusArray[status] = 1;
        utils_1.Logger.Info(`[AlderSeal] ${battle.enemy.name} 使 ${player.name} 陷入异常状态${status}`);
    }
    if (state.stealStats)
        StealStats(battle);
}
/** 奥尔德对玩家造成伤害后：仁慈试炼与真身第四条命按伤害回血。 */
function OnDamageApplied(battle, attacker, defender, damage) {
    const state = StateOf(battle);
    if (!state || !state.lifesteal || damage <= 0)
        return;
    if (attacker !== battle.enemy || defender !== battle.player || battle.enemy.hp <= 0)
        return;
    const before = battle.enemy.hp;
    battle.enemy.hp = Math.min(battle.enemy.maxHp, battle.enemy.hp + damage);
    if (battle.enemy.hp !== before) {
        utils_1.Logger.Info(`[AlderSeal] 奥尔德吸取体力: ${before} -> ${battle.enemy.hp}`);
    }
}
/** 力量试炼：能力提升无法被消除。 */
function IsStatClearImmune(pet) {
    return !!pet?.alderState?.statClearImmune;
}
/** 真身第五条命免疫瞬杀。 */
function IsInstantKillImmune(pet) {
    return !!pet?.alderState?.instantKillImmune;
}
/** 真身第五条命：每次出招消耗2倍PP。 */
function PPCostMultiplier(battle) {
    const state = StateOf(battle);
    return state?.ppCostMultiplier && state.ppCostMultiplier > 1 ? state.ppCostMultiplier : 1;
}
/** 回合结束：坚韧试炼每回合回复500。 */
function HealAlder(battle) {
    const state = StateOf(battle);
    const boss = battle?.enemy;
    if (!state || !boss || boss.hp <= 0 || !state.healPerTurn)
        return;
    const before = boss.hp;
    boss.hp = Math.min(boss.maxHp, boss.hp + state.healPerTurn);
    if (boss.hp !== before)
        utils_1.Logger.Info(`[AlderSeal] 奥尔德回复${boss.hp - before}体力`);
}
