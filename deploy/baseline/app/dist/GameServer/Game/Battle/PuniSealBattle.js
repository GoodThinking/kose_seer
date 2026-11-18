"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealPuniLifeSeal = exports.ResolvePuniSurvival = exports.ModifyPuniDamage = exports.InitPuniSeal = exports.GetPuniSeal = exports.PuniDoorOf = void 0;
const PuniConfig_1 = require("../../../shared/config/game/PuniConfig");
const utils_1 = require("../../../shared/utils");
function PuniDoorOf(battle) {
    if (battle.bossMapId !== 514) return 0;
    const door = battle.bossParam2 || 0;
    return door >= 1 && door <= 8 ? door : 0;
}
exports.PuniDoorOf = PuniDoorOf;
function GetPuniSeal(battle) {
    const door = PuniDoorOf(battle);
    return door ? PuniConfig_1.PuniConfig.Instance.GetSeal(door) : undefined;
}
exports.GetPuniSeal = GetPuniSeal;
function InitPuniSeal(battle) {
    const seal = GetPuniSeal(battle);
    if (!seal) return;
    if (!battle.player.battleLv || battle.player.battleLv.length < 6) battle.player.battleLv = new Array(6).fill(0);
    if (!battle.enemy.battleLv || battle.enemy.battleLv.length < 6) battle.enemy.battleLv = new Array(6).fill(0);
    if (seal.playerAccuracyMod) battle.player.battleLv[5] = seal.playerAccuracyMod;
    if (seal.enemyAtkMod) battle.enemy.battleLv[0] = seal.enemyAtkMod;
    if (seal.enemySpAtkMod) battle.enemy.battleLv[2] = seal.enemySpAtkMod;
    if (seal.holyStatDropImmune) {
        battle.enemy.immuneFlags = battle.enemy.immuneFlags || {};
        battle.enemy.immuneFlags.statDown = true;
    }
    const counters = battle.enemy.puniState = {};
    counters.puniAutoHealed = 0;
    if (seal.trueFormLives && seal.trueFormLives.length > 0) {
        counters.puniLife = 0;
        battle.enemy.maxHp = seal.trueFormLives[0].hp;
        battle.enemy.hp = seal.trueFormLives[0].hp;
    } else if (seal.cycleHPBars > 1) {
        counters.puniBars = seal.cycleHPBars;
    }
    utils_1.Logger.Info(`[PuniSeal] 进入${seal.name}: HP=${battle.enemy.hp}`);
}
exports.InitPuniSeal = InitPuniSeal;
function ModifyPuniDamage(battle, defender, skillType, damage) {
    if (defender !== battle.enemy) return damage;
    const seal = GetPuniSeal(battle);
    if (!seal) return damage;
    if (seal.elementOnlyTypes && seal.elementOnlyTypes.length > 0 && !seal.elementOnlyTypes.includes(skillType)) return 0;
    if (seal.eternalDamageReduction) damage = Math.max(1, Math.floor(damage / 2));
    if (seal.energyDamageLimit > 0) damage = Math.min(damage, seal.energyDamageLimit);
    return damage;
}
exports.ModifyPuniDamage = ModifyPuniDamage;
function ResolvePuniSurvival(battle, defender) {
    if (defender !== battle.enemy) return;
    const seal = GetPuniSeal(battle);
    if (!seal || !defender.puniState) return;
    const counters = defender.puniState;
    if (defender.hp <= 0) {
        if (seal.trueFormLives && seal.trueFormLives.length > 0) {
            const next = (counters.puniLife || 0) + 1;
            if (next < seal.trueFormLives.length) {
                counters.puniLife = next;
                counters.puniAutoHealed = 0;
                defender.maxHp = seal.trueFormLives[next].hp;
                defender.hp = seal.trueFormLives[next].hp;
                utils_1.Logger.Info(`[PuniSeal] 真身进入第${next + 1}条命: HP=${defender.hp}`);
            }
            return;
        }
        if ((counters.puniBars || 0) > 1) {
            counters.puniBars = (counters.puniBars || 0) - 1;
            defender.hp = defender.maxHp;
            utils_1.Logger.Info(`[PuniSeal] 轮回剩余血条=${counters.puniBars}`);
        }
        return;
    }
    const life = seal.trueFormLives?.[counters.puniLife || 0];
    if (life && life.autoHealThreshold > 0 && !counters.puniAutoHealed && defender.hp <= life.autoHealThreshold) {
        counters.puniAutoHealed = 1;
        defender.hp = defender.maxHp;
        utils_1.Logger.Info(`[PuniSeal] 真身低于${life.autoHealThreshold}，回复满血`);
    }
}
exports.ResolvePuniSurvival = ResolvePuniSurvival;
function HealPuniLifeSeal(battle) {
    const seal = GetPuniSeal(battle);
    if (!seal || seal.lifeHealPerTurn <= 0 || battle.enemy.hp <= 0) return;
    battle.enemy.hp = Math.min(battle.enemy.maxHp, battle.enemy.hp + seal.lifeHealPerTurn);
}
exports.HealPuniLifeSeal = HealPuniLifeSeal;
