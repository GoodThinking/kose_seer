"use strict";
/**
 * 战斗捕获系统
 * 实现精灵捕获逻辑，包括捕获率计算、精灵球效果等
 *
 * 移植自: luvit/luvit_version/game/seer_battle.lua (捕获相关逻辑)
 * 参考: 前端 CatchPetController.as
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BattleCaptureSystem = exports.PokeBallType = void 0;
const utils_1 = require("../../../shared/utils");
const BattleModel_1 = require("../../../shared/models/BattleModel");
const BossAbilityConfig_1 = require("./BossAbility/BossAbilityConfig");
/**
 * 精灵球类型枚举
 */
var PokeBallType;
(function (PokeBallType) {
    PokeBallType[PokeBallType["NORMAL"] = 1] = "NORMAL";
    PokeBallType[PokeBallType["INTERMEDIATE"] = 2] = "INTERMEDIATE";
    PokeBallType[PokeBallType["ADVANCED"] = 3] = "ADVANCED";
    PokeBallType[PokeBallType["SUPER"] = 4] = "SUPER";
    PokeBallType[PokeBallType["MASTER"] = 5] = "MASTER"; // 大师球 (100%捕获)
})(PokeBallType || (exports.PokeBallType = PokeBallType = {}));
/**
 * 捕获系统类
 */
class BattleCaptureSystem {
    /**
     * 尝试捕获精灵
     *
     * 捕获率公式 (参考赛尔号):
     * - 基础捕获率 = 精灵捕获难度系数
     * - HP修正 = (1 - 当前HP/最大HP) * 0.5 + 0.5
     * - 状态修正 = 有异常状态 ? 1.5 : 1.0
     * - 精灵球修正 = 精灵球倍率
     * - 最终捕获率 = 基础捕获率 * HP修正 * 状态修正 * 精灵球修正
     *
     * @param target 目标精灵
     * @param ballType 精灵球类型
     * @param baseCatchRate 基础捕获率 (0-100)
     * @returns 捕获结果
     */
    static AttemptCapture(target, ballType = PokeBallType.NORMAL, baseCatchRate = 50) {
        // 大师球100%捕获
        if (ballType === PokeBallType.MASTER) {
            return {
                success: true,
                catchTime: Math.floor(Date.now() / 1000),
                catchRate: 100,
                shakeCount: 3,
                isCriticalCapture: true,
                message: '大师球！必定捕获成功！'
            };
        }
        // 计算HP修正
        const hpRatio = target.hp / target.maxHp;
        const hpModifier = (1 - hpRatio) * 0.5 + 0.5; // 0.5 - 1.0
        // 计算状态修正
        let statusModifier = 1.0;
        if (target.statusDurations && target.statusDurations.some(duration => duration > 0)) {
            statusModifier = 1.5; // 异常状态增加50%捕获率
        }
        // 精灵球修正
        const ballModifier = this.GetBallModifier(ballType);
        // 等级修正 (高等级精灵更难捕获)
        const levelModifier = Math.max(0.5, 1 - (target.level - 1) / 200); // 1级=1.0, 100级=0.505
        // 计算最终捕获率
        let finalCatchRate = baseCatchRate * hpModifier * statusModifier * ballModifier * levelModifier;
        finalCatchRate = Math.min(100, Math.max(1, finalCatchRate)); // 限制在1-100之间
        // 暴击捕获判定 (5%几率，直接成功)
        const isCriticalCapture = Math.random() < 0.05;
        if (isCriticalCapture) {
            utils_1.Logger.Info(`[捕获系统] 暴击捕获！捕获率: ${finalCatchRate.toFixed(2)}%`);
            return {
                success: true,
                catchTime: Math.floor(Date.now() / 1000),
                catchRate: finalCatchRate,
                shakeCount: 3,
                isCriticalCapture: true,
                message: '暴击捕获！'
            };
        }
        // 摇晃判定 (最多3次)
        let shakeCount = 0;
        const shakeThreshold = Math.sqrt(finalCatchRate / 100);
        for (let i = 0; i < 3; i++) {
            if (Math.random() < shakeThreshold) {
                shakeCount++;
            }
            else {
                break;
            }
        }
        // 最终判定
        const success = shakeCount === 3;
        const catchTime = success ? Math.floor(Date.now() / 1000) : 0;
        utils_1.Logger.Info(`[捕获系统] 捕获${success ? '成功' : '失败'}: ` +
            `捕获率=${finalCatchRate.toFixed(2)}%, ` +
            `HP=${(hpRatio * 100).toFixed(1)}%, ` +
            `状态修正=${statusModifier}, ` +
            `摇晃次数=${shakeCount}/3`);
        return {
            success,
            catchTime,
            catchRate: finalCatchRate,
            shakeCount,
            isCriticalCapture: false,
            message: success ? '捕获成功！' : `捕获失败！摇晃了${shakeCount}次`
        };
    }
    /**
     * 获取精灵球修正倍率
     */
    static GetBallModifier(ballType) {
        const modifiers = {
            [PokeBallType.NORMAL]: 1.0, // 普通球 1x
            [PokeBallType.INTERMEDIATE]: 1.5, // 中级球 1.5x
            [PokeBallType.ADVANCED]: 2.0, // 高级球 2x
            [PokeBallType.SUPER]: 3.0, // 超级球 3x
            [PokeBallType.MASTER]: 100.0 // 大师球 100x (实际上直接成功)
        };
        return modifiers[ballType] || 1.0;
    }
    /**
     * 计算推荐精灵球类型
     * 根据目标精灵状态推荐最合适的精灵球
     */
    static RecommendBall(target, baseCatchRate = 50) {
        const hpRatio = target.hp / target.maxHp;
        const hasStatus = target.statusDurations && target.statusDurations.some(d => d > 0);
        // 计算当前捕获率
        const hpModifier = (1 - hpRatio) * 0.5 + 0.5;
        const statusModifier = hasStatus ? 1.5 : 1.0;
        const levelModifier = Math.max(0.5, 1 - (target.level - 1) / 200);
        const currentRate = baseCatchRate * hpModifier * statusModifier * levelModifier;
        // 根据捕获率推荐精灵球
        if (currentRate >= 80) {
            return PokeBallType.NORMAL; // 捕获率很高，用普通球即可
        }
        else if (currentRate >= 50) {
            return PokeBallType.INTERMEDIATE; // 捕获率中等，用中级球
        }
        else if (currentRate >= 30) {
            return PokeBallType.ADVANCED; // 捕获率较低，用高级球
        }
        else {
            return PokeBallType.SUPER; // 捕获率很低，用超级球
        }
    }
    /**
     * 获取捕获难度描述
     */
    static GetDifficultyDescription(catchRate) {
        if (catchRate >= 80) {
            return '非常容易';
        }
        else if (catchRate >= 60) {
            return '容易';
        }
        else if (catchRate >= 40) {
            return '普通';
        }
        else if (catchRate >= 20) {
            return '困难';
        }
        else {
            return '非常困难';
        }
    }
    /**
     * 检查是否可以捕获
     * 某些特殊精灵（如BOSS）可能无法捕获
     */
    /** SPT bosses stay uncatchable. Story fights such as 依依 have no SPT record. */
    static BossBlocksCapture(battle) {
        if (battle.universeBoss) return true;
        if (battle.battleType !== BattleModel_1.BattleType.BOSS)
            return false;
        if (battle.bossMapId === undefined || battle.bossParam2 === undefined)
            return true;
        const config = BossAbilityConfig_1.BossAbilityConfig.Instance.GetBossConfigByMapAndParam(battle.bossMapId, battle.bossParam2);
        return !config || !!config.spt;
    }
    static CanCapture(target, isBoss = false) {
        // BOSS精灵无法捕获
        if (isBoss) {
            return {
                canCapture: false,
                reason: 'BOSS精灵无法捕获'
            };
        }
        // 精灵必须还活着
        if (target.hp <= 0) {
            return {
                canCapture: false,
                reason: '精灵已失去战斗能力'
            };
        }
        // 满血也可以扔胶囊。血量只影响捕获率，拒绝会让客户端把这一回合跳过。
        return {
            canCapture: true
        };
    }
    /**
     * 模拟捕获动画时间
     * 返回摇晃动画应该持续的时间（毫秒）
     */
    static GetCaptureAnimationDuration(shakeCount) {
        // 每次摇晃约1秒，加上初始和结束动画
        return 500 + shakeCount * 1000 + 500;
    }
    /**
     * 计算捕获经验奖励
     * 捕获精灵可以获得额外经验
     */
    static CalculateCaptureExpBonus(target) {
        // 基础经验 = 目标等级 * 10
        const baseExp = target.level * 10;
        // 稀有度修正（可以根据精灵ID判断稀有度）
        const rarityModifier = 1.0; // 暂时固定为1.0
        return Math.floor(baseExp * rarityModifier);
    }
    /**
     * 生成捕获时间戳
     * 用于唯一标识捕获的精灵
     */
    static GenerateCatchTime() {
        return Math.floor(Date.now() / 1000);
    }
    /**
     * 验证捕获时间戳
     * 检查捕获时间是否合法
     */
    static ValidateCatchTime(catchTime) {
        const now = Math.floor(Date.now() / 1000);
        const minTime = 1609459200; // 2021-01-01 00:00:00
        const maxTime = now + 86400; // 当前时间+1天
        return catchTime >= minTime && catchTime <= maxTime;
    }
}
exports.BattleCaptureSystem = BattleCaptureSystem;
//# sourceMappingURL=BattleCaptureSystem.js.map