"use strict";
/**
 * BOSS 招牌特性：每个 BOSS 一条独有规则。
 * 配置在 boss_abilities.json 的 mechanics.signature = { id, ...参数 }，状态挂在 boss.bossState.sig。
 * 提示文字进 battle.bossNotices，由 BattleManager 在每回合结果之后下发到客户端战斗日志。
 * 只作用于 BOSS 战里的 BOSS 本体（battle.enemy）和玩家当前出战精灵（battle.player）。
 */
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../../shared/utils");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const effects = () => require("./SkillEffectRuntime").SkillEffectRuntime;
const isAttack = (skill) => skill?.category === 1 || skill?.category === 2;
function say(battle, text) {
    (battle.bossNotices || (battle.bossNotices = [])).push(text);
    utils_1.Logger.Info(`[BossSignatures] ${text}`);
}
/** 扣玩家出战精灵体力，不致死 */
function chip(player, amount) {
    const loss = Math.min(player.hp - 1, Math.max(1, Math.floor(amount)));
    if (loss > 0)
        player.hp -= loss;
    return Math.max(0, loss);
}
function heal(boss, amount) {
    if (boss.hp <= 0)
        return 0;
    const gain = Math.min(boss.maxHp - boss.hp, Math.max(0, Math.floor(amount)));
    boss.hp += gain;
    return gain;
}
function hasPP(boss, skillId) {
    const index = boss.skills.indexOf(skillId);
    return index >= 0 && (boss.skillPP?.[index] ?? 1) > 0;
}
/** 除指定技能外威力最高的可用攻击技能 */
function otherAttack(boss, excluded) {
    let best = 0, bestPower = -1;
    boss.skills.forEach((id, index) => {
        const raw = GameConfig_1.GameConfig.GetSkillById(id);
        if (id === excluded || !raw || (boss.skillPP?.[index] ?? 1) <= 0 || (raw.Category !== 1 && raw.Category !== 2))
            return;
        if ((raw.Power || 0) > bestPower) {
            bestPower = raw.Power || 0;
            best = id;
        }
    });
    return best;
}
/** 连击技能（附加效果 31） */
const isMulti = (skill) => String(skill?.sideEffect ?? GameConfig_1.GameConfig.GetSkillById(skill?.id)?.SideEffect ?? '').split(/\s+/).includes('31');
const scale = (damage, percent) => Math.max(1, Math.floor(damage * percent / 100));
const skillName = (id) => GameConfig_1.GameConfig.GetSkillById(id)?.Name || String(id);
const clampStage = (value) => Math.max(-6, Math.min(6, value));
/** 下一个满足 turn % every === phase 的回合（严格大于 after） */
function nextCycleTurn(after, every, phase) {
    let turn = after + 1;
    while (turn % every !== phase)
        turn++;
    return turn;
}
/**
 * 每个特性可实现：
 * init(c,s) 开战；status(b,c,s) 每回合的状态行；onSwitch(b,c,s) 玩家换上精灵后；
 * select(b,c,s,id) BOSS 选招；hit(b,c,s,attacker,skill) 命中修正（true/false/undefined）；
 * incoming(b,c,s,skill,damage) 玩家攻击技能对 BOSS 的伤害；outgoing(b,c,s,skill,damage) BOSS 攻击技能对玩家的伤害；
 * playerHit(b,c,s,skill,x) 玩家攻击技能命中并结算后；playerActed(b,c,s,skill,x) 玩家每次出手后（命中与否）；
 * bossActed(b,c,s,skill,x) BOSS 出手后（命中与否）；crit(b,c,s,skill) BOSS 攻击是否强制暴击；playerLast(b,c,s) 本回合玩家是否必定后手；turnEnd(b,c,s) 回合结束；
 * playerSkill(b,c,s,id) 改写玩家本回合所选技能；blockSwitch(b,c,s) 返回非空文字时玩家不能主动换精灵；revive(b,c,s) BOSS 用掉额外一条命复活后（s.second 已置为 true）。
 */
const DEFS = {
    // 阿克希亚：寒意满层冻结出战精灵，火系命中或换精灵清零
    coldSnap: {
        init(c, s) { s.chill = 0; },
        status(b, c, s) { return `寒意 ${s.chill}/${c.threshold}` + (s.chill === c.threshold - 1 ? '，下回合结束时冻结' : ''); },
        onSwitch(b, c, s) {
            b.player.fatigueTurns = 0;
            if (s.chill) {
                s.chill = 0;
                say(b, '换上的精灵没有沾上寒意。');
            }
        },
        playerHit(b, c, s, skill) {
            if (skill.type === 3 && s.chill) {
                s.chill = 0;
                say(b, '火焰驱散了寒意。');
            }
        },
        turnEnd(b, c, s) {
            if (++s.chill < c.threshold)
                return;
            s.chill = 0;
            effects().Inflict(b.player, 5, 2);
            b.player.fatigueTurns = 1;
            say(b, `寒意满了，${b.player.name}被冻住，下回合无法行动。`);
        },
    },
    // 提亚斯：它先手的回合容易闪开，玩家先手的回合它不闪避且更怕打
    gale: {
        status(b, c) { return `疾风：它先手时闪避${c.dodge}%，你先手时它受伤+${c.bonus}%`; },
        hit(b, c, s, attacker, skill) {
            if (attacker !== b.player || !isAttack(skill) || skill.mustHit || b.sigPlayerFirst)
                return undefined;
            if (Math.random() * 100 >= c.dodge)
                return undefined;
            say(b, `${b.enemy.name}抢先一步，闪开了攻击。`);
            return false;
        },
        incoming(b, c, s, skill, damage) {
            return b.sigPlayerFirst ? scale(damage, 100 + c.bonus) : damage;
        },
    },
    // 雷伊：蓄雷满层放出加成的招牌技能；先制技能命中减一层，地面系命中清空
    thunderCharge: {
        init(c, s) { s.charge = 0; },
        status(b, c, s) { return `蓄雷 ${s.charge}/${c.max}` + (s.charge >= c.max ? '，下回合释放' : ''); },
        select(b, c, s, id) {
            if (s.charge >= c.max && hasPP(b.enemy, c.skillId))
                return c.skillId;
            return id === c.skillId ? (otherAttack(b.enemy, c.skillId) || id) : id;
        },
        outgoing(b, c, s, skill, damage) {
            return skill.id === c.skillId ? scale(damage, 100 + c.perLayer * s.charge) : damage;
        },
        bossActed(b, c, s, skill) {
            if (skill.id !== c.skillId)
                return;
            if (s.charge)
                say(b, `${skill.name}带着${s.charge}层雷电落下。`);
            s.charge = 0;
            s.released = true;
        },
        playerHit(b, c, s, skill) {
            if (!s.charge)
                return;
            if (skill.type === 7) {
                s.charge = 0;
                say(b, '地面系招式把雷电导入了大地。');
            }
            else if ((skill.priority || 0) > 0) {
                s.charge--;
                say(b, '先制招式打断了蓄雷。');
            }
        },
        turnEnd(b, c, s) {
            if (s.released)
                s.released = false;
            else
                s.charge = Math.min(c.max, s.charge + 1);
        },
    },
    // 纳多雷：沙甲逐回合加厚，多段技能逐段剥落，暴击清空
    sandArmor: {
        init(c, s) { s.layers = 0; },
        status(b, c, s) { return `沙甲 ${s.layers}/${c.max}（受伤-${s.layers * c.perLayer}%）`; },
        incoming(b, c, s, skill, damage) {
            return s.layers ? scale(damage, 100 - s.layers * c.perLayer) : damage;
        },
        playerHit(b, c, s, skill, x) {
            if (!s.layers)
                return;
            if (x.isCrit) {
                s.layers = 0;
                say(b, '致命一击震碎了全部沙甲。');
            }
            else if (x.hits > 1) {
                s.layers = Math.max(0, s.layers - x.hits);
                say(b, `连击剥掉了${x.hits}层沙甲。`);
            }
        },
        turnEnd(b, c, s) { s.layers = Math.min(c.max, s.layers + 1); },
    },
    // 雷纳多：定期复制玩家出战精灵的强化；半血后过载，每回合特攻+1并自损
    statCopy: {
        status(b, c, s) {
            const left = c.every - b.turn % c.every;
            return `属性复制：${left}回合后复制你的强化` + (s.overload ? `；过载中，每回合自损${c.burn}%体力` : '');
        },
        turnEnd(b, c, s) {
            const boss = b.enemy;
            if (b.turn % c.every === 0) {
                let copied = 0;
                (b.player.battleLevels || []).forEach((level, index) => {
                    if (level > (boss.battleLevels[index] || 0)) {
                        boss.battleLevels[index] = level;
                        copied++;
                    }
                });
                say(b, copied ? `${boss.name}复制了你的强化。` : `${boss.name}扫描了你，没有可复制的强化。`);
            }
            if (boss.hp * 2 > boss.maxHp)
                return;
            if (!s.overload) {
                s.overload = true;
                say(b, `${boss.name}进入过载。`);
            }
            boss.battleLevels[2] = Math.min(6, (boss.battleLevels[2] || 0) + 1);
            boss.hp = Math.max(1, boss.hp - Math.floor(boss.maxHp * c.burn / 100));
        },
    },
    // 奈尼芬多：记住上一次受到的攻击类别，同类别再打伤害大减
    mindMirror: {
        init(c, s) { s.last = 0; },
        status(b, c, s) { return s.last ? `念力镜：${s.last === 1 ? '物理' : '特殊'}攻击伤害-${c.reduce}%` : '念力镜：尚未记录'; },
        incoming(b, c, s, skill, damage) {
            return skill.category === s.last ? scale(damage, 100 - c.reduce) : damage;
        },
        playerHit(b, c, s, skill) { s.last = skill.category; },
    },
    // 远古鱼龙：涨潮回血、满潮必中大招、退潮易伤，三回合一循环
    tide: {
        phase(turn) { return (turn - 1) % 3; },
        status(b, c) {
            return ['下回合涨潮：它回合末回复' + c.heal + '体力', '下回合满潮：必中的' + (GameConfig_1.GameConfig.GetSkillById(c.skillId)?.Name || '大招'), '下回合退潮：它不回血，受伤+' + c.ebbBonus + '%'][this.phase(b.turn + 1)];
        },
        select(b, c, s, id) {
            return this.phase(b.turn) === 1 && hasPP(b.enemy, c.skillId) ? c.skillId : id;
        },
        hit(b, c, s, attacker, skill) {
            return attacker === b.enemy && skill.id === c.skillId && this.phase(b.turn) === 1 ? true : undefined;
        },
        incoming(b, c, s, skill, damage) {
            return this.phase(b.turn) === 2 ? scale(damage, 100 + c.ebbBonus) : damage;
        },
        turnEnd(b, c) {
            if (this.phase(b.turn) === 0 && heal(b.enemy, c.heal))
                say(b, `涨潮，${b.enemy.name}回复了体力。`);
        },
    },
    // 上古炎兽：温度逐回合上升，高温灼伤出战精灵，满温放出加倍大招后归零；水、冰、暴击降温
    furnace: {
        init(c, s) { s.heat = 0; },
        status(b, c, s) { return `熔炉温度 ${s.heat}/${c.max}` + (s.heat >= c.max ? '，下回合爆发' : s.heat >= c.scorch ? '，灼伤中' : ''); },
        select(b, c, s, id) {
            s.blast = s.heat >= c.max && hasPP(b.enemy, c.skillId);
            return s.blast ? c.skillId : id;
        },
        outgoing(b, c, s, skill, damage) {
            return s.blast && skill.id === c.skillId ? scale(damage, c.blastPercent) : damage;
        },
        bossActed(b, c, s, skill) {
            if (!s.blast || skill.id !== c.skillId)
                return;
            s.blast = false;
            s.heat = 0;
            s.cooled = true;
            say(b, `熔炉爆发，${skill.name}威力大增。温度归零。`);
        },
        playerHit(b, c, s, skill, x) {
            const drop = (skill.type === 2 ? 2 : skill.type === 9 ? 1 : 0) + (x.isCrit ? 1 : 0);
            if (!drop || !s.heat)
                return;
            s.heat = Math.max(0, s.heat - drop);
            say(b, `熔炉降温${drop}级。`);
        },
        turnEnd(b, c, s) {
            if (s.cooled)
                s.cooled = false;
            else
                s.heat = Math.min(c.max, s.heat + 1);
            if (s.heat >= c.scorch && b.player.hp > 1 && chip(b.player, b.player.maxHp / 8))
                say(b, `高温灼伤了${b.player.name}。`);
        },
    },
    // 始祖灵兽：给出战精灵种下根须，每回合吸取体力并回复自身；换精灵摆脱，火系命中烧断，过几回合重新种下
    roots: {
        init(c, s) { s.rooted = true; s.replantTurn = 0; },
        status(b, c, s) { return s.rooted ? `根须缠着${b.player.name}，每回合吸取体力` : `根须已断，第${s.replantTurn}回合重新种下`; },
        cut(b, c, s, text) {
            if (!s.rooted)
                return;
            s.rooted = false;
            s.replantTurn = b.turn + c.replant;
            say(b, text);
        },
        onSwitch(b, c, s) { this.cut(b, c, s, '换下精灵，摆脱了根须。'); },
        playerHit(b, c, s, skill) {
            if (skill.type === 3)
                this.cut(b, c, s, '火焰烧断了根须。');
        },
        turnEnd(b, c, s) {
            if (!s.rooted) {
                if (b.turn >= s.replantTurn) {
                    s.rooted = true;
                    say(b, `根须重新缠上了${b.player.name}。`);
                }
                return;
            }
            if (b.player.hp > 1)
                chip(b.player, b.player.maxHp / 8);
            heal(b.enemy, b.enemy.maxHp * c.healPercent / 100);
        },
    },
    // ---------- 训练师之门 ----------
    // 塔奇多克：命中后藤蔓缠住出战精灵，每回合降速并吸血；先制技能命中或换精灵挣脱
    vines: {
        status(b, c, s) { return s.bound ? `藤蔓缠着${b.player.name}：每回合速度-${c.speedDown}、被吸取1/${c.drainDiv}体力（先制技能命中或换精灵挣脱）` : '藤蔓缠绕：被它命中后会被缠住'; },
        // 挣脱后本回合和下回合不会再被缠上
        free(b, s, text) {
            if (!s.bound)
                return;
            s.bound = false;
            s.guard = b.turn + 1;
            say(b, text);
        },
        bossActed(b, c, s, skill, x) {
            if (x.hit && x.damage > 0 && b.player.hp > 0 && !s.bound && !(s.guard >= b.turn)) {
                s.bound = true;
                say(b, `藤蔓缠住了${b.player.name}。`);
            }
        },
        playerHit(b, c, s, skill) {
            if ((skill.priority || 0) > 0)
                this.free(b, s, '先制招式挣断了藤蔓。');
        },
        onSwitch(b, c, s) { this.free(b, s, '换下精灵，挣脱了藤蔓。'); },
        turnEnd(b, c, s) {
            if (!s.bound)
                return;
            effects().Stage(b.player, 4, -c.speedDown);
            heal(b.enemy, chip(b.player, b.player.maxHp / c.drainDiv));
        },
    },
    // 火噜噜：每被打一次怒气+1，怒气加成火系伤害；怒焰火锤放出后清空
    rage: {
        init(c, s) { s.rage = 0; },
        status(b, c, s) { return `怒气 ${s.rage}/${c.max}（火系伤害+${s.rage * c.perLayer}%）` + (s.rage >= c.max ? '，下回合怒焰火锤' : ''); },
        select(b, c, s, id) {
            if (s.rage >= c.max && hasPP(b.enemy, c.skillId))
                return c.skillId;
            return id === c.skillId && s.rage < c.max ? (otherAttack(b.enemy, c.skillId) || id) : id;
        },
        outgoing(b, c, s, skill, damage) {
            return skill.type === 3 && s.rage ? scale(damage, 100 + s.rage * c.perLayer) : damage;
        },
        bossActed(b, c, s, skill) {
            if (skill.id === c.skillId && s.rage) {
                say(b, `${skill.name}带着${s.rage}层怒气砸下，怒气清空。`);
                s.rage = 0;
            }
        },
        playerHit(b, c, s) { s.rage = Math.min(c.max, s.rage + 1); },
    },
    // 查德洛：玩家先出手时伤害大减
    barrier: {
        status(b, c) { return `念力屏障：你先出手时对它的伤害-${c.reduce}%，后出手全额`; },
        incoming(b, c, s, skill, damage) { return b.sigPlayerFirst ? scale(damage, 100 - c.reduce) : damage; },
    },
    // 多尔尼：被它命中的精灵中剧毒，毒伤每回合翻倍；换下精灵重置倍数，毒不会解
    toxin: {
        init(c, s) { s.toxic = {}; },
        status(b, c, s) {
            const stage = s.toxic[b.player.catchTime];
            if (stage === undefined)
                return '剧毒：被它命中的精灵中剧毒，毒伤每回合翻倍';
            return `${b.player.name}身中剧毒：本回合末扣1/${c.stages[Math.min(stage, c.stages.length - 1)]}体力，之后翻倍（换下精灵重置）`;
        },
        bossActed(b, c, s, skill, x) {
            const key = b.player.catchTime;
            if (x.hit && x.damage > 0 && b.player.hp > 0 && s.toxic[key] === undefined) {
                s.toxic[key] = 0;
                say(b, `${b.player.name}中了剧毒。`);
            }
        },
        onSwitch(b, c, s) {
            for (const key of Object.keys(s.toxic))
                s.toxic[key] = 0;
        },
        turnEnd(b, c, s) {
            const key = b.player.catchTime, stage = s.toxic[key];
            if (stage === undefined)
                return;
            chip(b.player, b.player.maxHp / c.stages[Math.min(stage, c.stages.length - 1)]);
            s.toxic[key] = stage + 1;
        },
    },
    // 加耶罗：定期放浮空连击，被浮空的精灵几回合内物理技能落空
    float: {
        init(c, s) { s.until = 0; },
        status(b, c, s) {
            if (s.until > b.turn)
                return `${b.player.name}浮在半空：第${s.until}回合结束前物理技能会落空`;
            return `浮空：第${nextCycleTurn(b.turn, c.every, 1)}回合将使出${skillName(c.skillId)}`;
        },
        select(b, c, s, id) {
            return b.turn % c.every === 1 && hasPP(b.enemy, c.skillId) ? c.skillId : id;
        },
        hit(b, c, s, attacker, skill) {
            if (attacker !== b.player || skill.category !== 1 || b.turn > s.until)
                return undefined;
            say(b, `${b.player.name}浮在半空，物理招式够不着。`);
            return false;
        },
        bossActed(b, c, s, skill, x) {
            if (skill.id === c.skillId && x.hit && b.player.hp > 0) {
                s.until = b.turn + c.turns;
                say(b, `${b.player.name}被卷上半空，${c.turns}回合内无法使用物理技能。`);
            }
        },
        onSwitch(b, c, s) { s.until = 0; },
    },
    // 岩锤怪：定期放连锤，每段命中让出战精灵防御-1，防御降到底时下一击必杀；换精灵清除
    smash: {
        status(b, c) {
            const level = b.player.battleLevels?.[1] || 0;
            if (level <= c.lethalAt)
                return `${b.player.name}防御已碎（${level}），它的下一击必定击倒！`;
            return `碎甲连锤：${b.player.name}防御${level}，降到${c.lethalAt}时下一击必杀（换精灵清除）；第${nextCycleTurn(b.turn, c.every, 0)}回合使出${skillName(c.skillId)}`;
        },
        select(b, c, s, id) {
            if (b.turn % c.every === 0 && hasPP(b.enemy, c.skillId))
                return c.skillId;
            return id === c.skillId ? (otherAttack(b.enemy, c.skillId) || id) : id;
        },
        outgoing(b, c, s, skill, damage) {
            if ((b.player.battleLevels?.[1] || 0) > c.lethalAt)
                return damage;
            say(b, `${skill.name}砸穿了碎裂的护甲。`);
            return Math.max(damage, b.player.hp);
        },
        bossActed(b, c, s, skill, x) {
            if (skill.id === c.skillId && x.hit && x.damage > 0 && b.player.hp > 0)
                effects().Stage(b.player, 1, -Math.min(c.maxPerHammer, Math.max(1, x.hits)));
        },
    },
    // LYN：某回合对它的伤害不足门槛，下回合玩家必定后手且命中下降
    suppress: {
        init(c, s) { s.dealt = 0; s.turn = 0; },
        status(b, c, s) {
            if (s.turn === b.turn + 1)
                return `下回合火力压制：你必定后出手，命中-${c.accDown}%`;
            return `火力压制：每回合对它至少造成${c.threshold}伤害，否则下回合被压制`;
        },
        playerLast(b, c, s) { return s.turn === b.turn; },
        hit(b, c, s, attacker, skill) {
            if (attacker !== b.player || !isAttack(skill) || skill.mustHit || s.turn !== b.turn || Math.random() * 100 >= c.accDown)
                return undefined;
            say(b, '火力压制下，攻击打偏了。');
            return false;
        },
        playerHit(b, c, s, skill, x) { s.dealt += x.damage; },
        turnEnd(b, c, s) {
            if (s.dealt < c.threshold) {
                s.turn = b.turn + 1;
                say(b, `本回合只造成${s.dealt}伤害，${b.enemy.name}展开火力压制。`);
            }
            s.dealt = 0;
        },
    },
    // 达克其：玩家每倒下一只精灵，它回血并永久攻击+1
    abyss: {
        init(c, s) { s.souls = 0; },
        status(b, c, s) {
            return s.souls ? `灵魂深渊：已吞噬${s.souls}只精灵` : `灵魂深渊：每有一只精灵被它击倒，它回复${c.healPercent}%体力、攻击+${c.atk}`;
        },
        bossActed(b, c, s, skill, x) {
            if (!x.hit || b.player.hp > 0)
                return;
            s.souls++;
            heal(b.enemy, b.enemy.maxHp * c.healPercent / 100);
            b.enemy.battleLevels[0] = clampStage((b.enemy.battleLevels[0] || 0) + c.atk);
            say(b, `${b.enemy.name}吞噬了${b.player.name}的灵魂，回复体力、攻击提升。`);
        },
    },
    // 菲尔洛：玩家刚用过的技能被冰封几回合，冰封中使用会落空
    iceLock: {
        init(c, s) { s.frozen = {}; },
        status(b, c, s) {
            const list = Object.entries(s.frozen).filter(([, until]) => until > b.turn).map(([id, until]) => `${skillName(+id)}(到第${until}回合)`);
            return list.length ? '冰封：' + list.join('、') : '冰封：你用过的技能会被冰封' + c.turns + '回合';
        },
        hit(b, c, s, attacker, skill) {
            if (attacker !== b.player || !(s.frozen[skill.id] >= b.turn) || s.usedTurn === b.turn)
                return undefined;
            s.blockedTurn = b.turn;
            say(b, `${skill.name}被冰封了，没能使出。`);
            return false;
        },
        playerActed(b, c, s, skill) {
            if (skill.id > 0 && s.blockedTurn !== b.turn) {
                s.frozen[skill.id] = b.turn + c.turns;
                s.usedTurn = b.turn;
            }
        },
    },
    // 卡莱洛：奇数回合强光致盲（玩家攻击命中大降），偶数回合过曝（它受伤增加）
    blind: {
        status(b, c) {
            return (b.turn + 1) % 2 === 1 ? `下回合强光：你的攻击命中-${c.miss}%（必中除外）` : `下回合过曝：它受到的伤害+${c.bonus}%`;
        },
        hit(b, c, s, attacker, skill) {
            if (attacker !== b.player || !isAttack(skill) || skill.mustHit || b.turn % 2 !== 1 || Math.random() * 100 >= c.miss)
                return undefined;
            say(b, '强光刺眼，攻击落空了。');
            return false;
        },
        incoming(b, c, s, skill, damage) { return b.turn % 2 === 0 ? scale(damage, 100 + c.bonus) : damage; },
    },
    // 哈尼卡：被致命一击或克制属性命中后激怒几回合，攻击上升、防御下降
    scaleRage: {
        init(c, s) { s.until = 0; },
        status(b, c, s) {
            return s.until ? `逆鳞激怒：攻击+${c.atk}、防御-${c.def}，第${s.until}回合结束后平息` : `逆鳞：被致命一击或克制属性命中会激怒${c.turns}回合`;
        },
        playerHit(b, c, s, skill, x) {
            const eff = require('./ElementSystem').ElementSystem.GetEffectiveness(skill.type || 8, b.enemy.type);
            if (!x.isCrit && !(eff > 1))
                return;
            if (!s.until) {
                b.enemy.battleLevels[0] = clampStage((b.enemy.battleLevels[0] || 0) + c.atk);
                b.enemy.battleLevels[1] = clampStage((b.enemy.battleLevels[1] || 0) - c.def);
                say(b, `触到逆鳞，${b.enemy.name}暴怒了。`);
            }
            s.until = b.turn + c.turns;
        },
        turnEnd(b, c, s) {
            if (!s.until || b.turn < s.until)
                return;
            s.until = 0;
            b.enemy.battleLevels[0] = clampStage((b.enemy.battleLevels[0] || 0) - c.atk);
            b.enemy.battleLevels[1] = clampStage((b.enemy.battleLevels[1] || 0) + c.def);
            say(b, `${b.enemy.name}平息了怒气。`);
        },
    },
    // 瓦尔普：同一属性的技能连续命中，伤害逐次递减；换属性重置
    formless: {
        init(c, s) { s.type = 0; s.streak = 0; },
        factor(c, s, type) { return type === s.type ? Math.max(c.floor, 100 - c.step * s.streak) : 100; },
        status(b, c, s) {
            return s.streak ? `无相：下次再用同一属性伤害${this.factor(c, s, s.type)}%（换属性恢复）` : '无相：同一属性连续打它伤害逐次递减';
        },
        incoming(b, c, s, skill, damage) { return scale(damage, this.factor(c, s, skill.type || 8)); },
        playerHit(b, c, s, skill) {
            const type = skill.type || 8;
            s.streak = type === s.type ? s.streak + 1 : 1;
            s.type = type;
        },
    },
    // 佩吉克：出招耗电，电量耗尽后瘫痪几回合，期间受伤大增
    battery: {
        init(c, s) { s.energy = c.capacity; s.down = 0; },
        cost(skill) { return (skill.power || 0) >= 150 ? 4 : (skill.power || 0) >= 130 ? 2 : 1; },
        status(b, c, s) {
            if (s.down >= b.turn + 1)
                return `电量耗尽：瘫痪到第${s.down}回合，受到的伤害+${c.downBonus}%`;
            return `电量 ${s.energy}/${c.capacity}（大招耗4、中招耗2、小招耗1）`;
        },
        select(b, c, s, id) { return s.down >= b.turn ? 0 : id; },
        incoming(b, c, s, skill, damage) { return s.down >= b.turn ? scale(damage, 100 + c.downBonus) : damage; },
        bossActed(b, c, s, skill) {
            if (!skill.id || s.down >= b.turn)
                return;
            s.energy -= this.cost(skill);
            if (s.energy > 0)
                return;
            s.energy = 0;
            s.down = b.turn + c.down;
            say(b, `${b.enemy.name}电量耗尽，瘫痪${c.down}回合。`);
        },
        turnEnd(b, c, s) {
            if (s.down && b.turn >= s.down) {
                s.down = 0;
                s.energy = c.capacity;
                say(b, `${b.enemy.name}重新充满了电。`);
            }
        },
    },
    // 弗洛斯：每回合点亮玩家技能栏的一个位置，该位技能威力提升，其余下降
    starSlot: {
        pick(b, s) { s.slot = Math.floor(Math.random() * Math.max(1, b.player.skills.length)); },
        status(b, c, s) {
            if (s.slot === undefined)
                this.pick(b, s);
            return `星光位：下回合第${s.slot + 1}个技能「${skillName(b.player.skills[s.slot])}」伤害×${c.boost / 100}，其余×${c.other / 100}`;
        },
        incoming(b, c, s, skill, damage) {
            if (s.slot === undefined)
                this.pick(b, s);
            return scale(damage, b.player.skills.indexOf(skill.id) === s.slot ? c.boost : c.other);
        },
        onSwitch(b, c, s) { this.pick(b, s); },
        turnEnd(b, c, s) { this.pick(b, s); },
    },
    // 威里特：体力每损失10%，暴击率上升
    bloodlust: {
        chance(b, c) { return Math.floor((1 - b.enemy.hp / b.enemy.maxHp) * 10) * c.perTenth; },
        status(b, c) { return `喋血：暴击率+${this.chance(b, c)}%（体力每损失10%再+${c.perTenth}%）`; },
        crit(b, c) { return Math.random() * 100 < this.chance(b, c); },
    },
    // 普兰特：出战精灵在场太久会陷入混乱；它对身负异常的精灵伤害更高
    chaosGreen: {
        init(c, s) { s.field = 0; },
        status(b, c, s) {
            return `混沌绿光：${b.player.name}再在场${c.fieldTurns - s.field}回合将陷入混乱；对有异常的精灵伤害+${c.bonus}%`;
        },
        outgoing(b, c, s, skill, damage) {
            return (b.player.statusDurations || []).slice(0, 17).some(turns => turns > 0) ? scale(damage, 100 + c.bonus) : damage;
        },
        onSwitch(b, c, s) { s.field = 0; },
        turnEnd(b, c, s) {
            if (++s.field < c.fieldTurns)
                return;
            s.field = 0;
            if (effects().Inflict(b.player, 10, c.confuseTurns))
                say(b, `混沌绿光笼罩，${b.player.name}陷入混乱。`);
        },
    },
    // 帕里斯：被物理攻击打中切暗影形态（伤害高、怕打），被特殊攻击打中切水形态（耐打、回血）
    beastForm: {
        init(c, s) { s.form = ''; },
        status(b, c, s) {
            if (s.form === 'shadow')
                return `暗影形态：它的伤害+${c.shadowOut - 100}%，受到的伤害+${c.shadowIn - 100}%`;
            if (s.form === 'water')
                return `水之形态：它受到的伤害-${100 - c.waterIn}%，每回合回复${c.regen}%体力`;
            return '兽神双形态：物理攻击打中它切换暗影形态，特殊攻击打中切换水之形态';
        },
        incoming(b, c, s, skill, damage) {
            return s.form === 'shadow' ? scale(damage, c.shadowIn) : s.form === 'water' ? scale(damage, c.waterIn) : damage;
        },
        outgoing(b, c, s, skill, damage) { return s.form === 'shadow' ? scale(damage, c.shadowOut) : damage; },
        playerHit(b, c, s, skill) {
            const form = skill.category === 1 ? 'shadow' : 'water';
            if (form !== s.form)
                say(b, `${b.enemy.name}化为${form === 'shadow' ? '暗影' : '水之'}形态。`);
            s.form = form;
        },
        turnEnd(b, c, s) {
            if (s.form === 'water')
                heal(b.enemy, b.enemy.maxHp * c.regen / 100);
        },
    },
    // ---------- 暗黑武斗场 ----------
    // 卡特斯：每次攻击自损当前体力换取高伤害；体力过低后的下一击必定击倒出战精灵，自己只剩 1 血
    sacrifice: {
        status(b, c, s) {
            if (s.final)
                return `舍身：下回合同归于尽，必定击倒${b.player.name}，之后它只剩1体力`;
            return `舍身：它每次攻击自损${c.selfPercent}%当前体力、伤害+${c.bonus}%；体力低于${c.finalAt}%时放出同归于尽的一击`;
        },
        select(b, c, s, id) { return s.final ? (otherAttack(b.enemy, 0) || id) : id; },
        hit(b, c, s, attacker, skill) { return attacker === b.enemy && s.final && isAttack(skill) ? true : undefined; },
        outgoing(b, c, s, skill, damage) { return s.final ? Math.max(damage, b.player.hp) : scale(damage, 100 + c.bonus); },
        bossActed(b, c, s, skill, x) {
            const boss = b.enemy;
            if (!isAttack(skill) || boss.hp <= 0)
                return;
            if (s.final) {
                s.final = false;
                boss.hp = 1;
                say(b, `${boss.name}拼上全部体力，与${b.player.name}同归于尽。`);
                return;
            }
            boss.hp = Math.max(1, boss.hp - Math.floor(boss.hp * c.selfPercent / 100));
        },
        turnEnd(b, c, s) {
            if (s.done || b.enemy.hp * 100 >= b.enemy.maxHp * c.finalAt)
                return;
            s.done = s.final = true;
            say(b, `${b.enemy.name}体力不足${c.finalAt}%，准备同归于尽。`);
        },
    },
    // 魔牙鲨：闻到血腥味，对体力过半受损的精灵必定先手、伤害更高
    bloodScent: {
        wounded(b, c) { return b.player.hp * 100 < b.player.maxHp * c.below; },
        status(b, c) {
            return this.wounded(b, c) ? `血腥味：${b.player.name}体力低于${c.below}%，它必定先手、伤害+${c.bonus}%` : `血腥味：你的精灵体力低于${c.below}%时，它必定先手、伤害+${c.bonus}%`;
        },
        playerLast(b, c) { return this.wounded(b, c); },
        outgoing(b, c, s, skill, damage) { return this.wounded(b, c) ? scale(damage, 100 + c.bonus) : damage; },
    },
    // 贝鲁基德：火系技能用满几次就过热，冷却一回合不行动且更怕打
    overheat: {
        init(c, s) { s.heat = 0; s.cool = 0; },
        status(b, c, s) {
            return s.cool === b.turn + 1 ? `过热：下回合冷却，它不行动、受到的伤害+${c.coolBonus}%` : `过热 ${s.heat}/${c.max}：每用一次火系技能+1，满了冷却一回合`;
        },
        select(b, c, s, id) { return s.cool === b.turn ? 0 : id; },
        incoming(b, c, s, skill, damage) { return s.cool === b.turn ? scale(damage, 100 + c.coolBonus) : damage; },
        bossActed(b, c, s, skill) {
            if (skill.type !== 3 || s.cool === b.turn || ++s.heat < c.max)
                return;
            s.heat = 0;
            s.cool = b.turn + 1;
            say(b, `${b.enemy.name}过热了，下回合需要冷却。`);
        },
    },
    // 巴弗洛：定期给出战精灵唱镇魂歌，几回合后倒下；换下精灵解除
    requiem: {
        status(b, c, s) {
            if (s.mark && s.mark.ct === b.player.catchTime)
                return `镇魂歌：${b.player.name}将在第${s.mark.turn}回合结束时倒下（换下精灵解除）`;
            return `镇魂歌：第${nextCycleTurn(b.turn, c.every, 1)}回合结束时唱给出战精灵，${c.delay}回合后倒下`;
        },
        // 原技能镇魂歌会锁定任何在场的精灵，由这条规则代替
        select(b, c, s, id) { return id === c.skillId ? (otherAttack(b.enemy, c.skillId) || id) : id; },
        onSwitch(b, c, s) {
            if (!s.mark)
                return;
            s.mark = null;
            say(b, '换下精灵，镇魂歌的标记消散了。');
        },
        turnEnd(b, c, s) {
            if (s.mark) {
                if (b.turn < s.mark.turn)
                    return;
                s.mark = null;
                b.player.hp = 0;
                say(b, `镇魂歌唱完，${b.player.name}倒下了。`);
                return;
            }
            if (b.turn % c.every !== 1)
                return;
            s.mark = { ct: b.player.catchTime, turn: b.turn + c.delay };
            say(b, `${b.enemy.name}唱起镇魂歌，${b.player.name}将在第${s.mark.turn}回合结束时倒下。`);
        },
    },
    // 奇拉塔顿：地面技能命中后震波再伤出战精灵并降速；飞行系不受影响
    quake: {
        status(b, c) {
            return b.player.type === 4 ? `震波：${b.player.name}是飞行系，不受震波影响` : `震波：它的地面技能命中后再震伤你1/${c.div}体力、速度-1（飞行系不受影响）`;
        },
        bossActed(b, c, s, skill, x) {
            if (skill.type !== 7 || !x.hit || b.player.hp <= 1 || b.player.type === 4)
                return;
            chip(b.player, b.player.maxHp / c.div);
            effects().Stage(b.player, 4, -1);
            say(b, `震波扩散，${b.player.name}被震伤、速度下降。`);
        },
    },
    // 西萨拉斯：玩家每用一次特殊攻击积一层电荷，满了它放出必中加倍的招牌技能
    staticCharge: {
        init(c, s) { s.charge = 0; },
        status(b, c, s) {
            return `电荷 ${s.charge}/${c.max}：你每用一次特殊攻击+1，满了它放出必中、伤害×${c.blastPercent / 100}的${skillName(c.skillId)}` + (s.charge >= c.max ? '（下回合）' : '');
        },
        select(b, c, s, id) {
            s.blast = s.charge >= c.max && hasPP(b.enemy, c.skillId);
            return s.blast ? c.skillId : id;
        },
        hit(b, c, s, attacker, skill) { return attacker === b.enemy && s.blast && skill.id === c.skillId ? true : undefined; },
        outgoing(b, c, s, skill, damage) { return s.blast && skill.id === c.skillId ? scale(damage, c.blastPercent) : damage; },
        bossActed(b, c, s, skill) {
            if (!s.blast || skill.id !== c.skillId)
                return;
            s.blast = false;
            s.charge = 0;
            say(b, `电荷全部释放，${skill.name}威力加倍。`);
        },
        playerActed(b, c, s, skill) {
            if (skill.category === 2)
                s.charge = Math.min(c.max, s.charge + 1);
        },
    },
    // 克林卡修：防御、速度、攻击三颗宝石依次碎裂；体力每降 25% 或被致命一击碎一颗
    gems: {
        NAMES: { def: '防御', speed: '速度', atk: '攻击' },
        init(c, s) { s.gems = ['def', 'speed', 'atk']; s.hpBroken = 0; },
        status(b, c, s) {
            if (!s.gems.length)
                return '宝石已全部碎裂';
            const effect = { def: `受伤-${c.defCut}%`, speed: '必定先手', atk: `伤害+${c.atkBonus}%` };
            return `宝石：${s.gems.map(g => `${this.NAMES[g]}（${effect[g]}）`).join('、')}；体力每降25%或被致命一击碎一颗`;
        },
        playerLast(b, c, s) { return s.gems.includes('speed'); },
        incoming(b, c, s, skill, damage) { return s.gems.includes('def') ? scale(damage, 100 - c.defCut) : damage; },
        outgoing(b, c, s, skill, damage) { return s.gems.includes('atk') ? scale(damage, 100 + c.atkBonus) : damage; },
        shatter(b, s, why) {
            const gem = s.gems.shift();
            if (gem)
                say(b, `${why}，${this.NAMES[gem]}宝石碎了。`);
        },
        playerHit(b, c, s, skill, x) {
            const boss = b.enemy, due = Math.min(3, Math.floor((boss.maxHp - boss.hp) * 4 / boss.maxHp));
            while (s.hpBroken < due) {
                s.hpBroken++;
                this.shatter(b, s, '体力下降');
            }
            if (x.isCrit)
                this.shatter(b, s, '致命一击');
        },
    },
    // 卡库：双方伤害都更高；体力过低时放出一次先手必暴的绝招
    allIn: {
        status(b, c, s) {
            if (s.ready)
                return `破釜沉舟：双方伤害+${c.bonus}%；下回合它必定先手、致命一击`;
            return `破釜沉舟：双方伤害+${c.bonus}%` + (s.used ? '' : `；它体力低于${c.lowAt}%时放出一次先手必暴的绝招`);
        },
        select(b, c, s, id) { return s.ready ? (otherAttack(b.enemy, 0) || id) : id; },
        playerLast(b, c, s) { return !!s.ready; },
        crit(b, c, s) { return !!s.ready; },
        incoming(b, c, s, skill, damage) { return scale(damage, 100 + c.bonus); },
        outgoing(b, c, s, skill, damage) { return scale(damage, 100 + c.bonus); },
        bossActed(b, c, s, skill) {
            if (!s.ready || !isAttack(skill))
                return;
            s.ready = false;
            s.used = true;
            say(b, `${b.enemy.name}破釜沉舟，放出了绝招。`);
        },
        turnEnd(b, c, s) {
            if (s.used || s.ready || b.enemy.hp * 100 >= b.enemy.maxHp * c.lowAt)
                return;
            s.ready = true;
            say(b, `${b.enemy.name}背水一战，下回合将放出绝招。`);
        },
    },
    // 赫德卡：每几回合在炮台（伤害高、怕打）和铁壁（几乎打不动、不攻击）之间切换
    turret: {
        mode(turn, c) { return Math.floor((turn - 1) / c.every) % 2 ? 'wall' : 'cannon'; },
        status(b, c) {
            const next = this.mode(b.turn + 1, c);
            return next === 'cannon' ? `下回合炮台形态：它的伤害+${c.cannonOut}%，受到的伤害+${c.cannonIn}%` : `下回合铁壁形态：它不攻击，受到的伤害-${c.wallCut}%`;
        },
        select(b, c, s, id) { return this.mode(b.turn, c) === 'wall' ? 0 : id; },
        incoming(b, c, s, skill, damage) { return scale(damage, this.mode(b.turn, c) === 'wall' ? 100 - c.wallCut : 100 + c.cannonIn); },
        outgoing(b, c, s, skill, damage) { return this.mode(b.turn, c) === 'cannon' ? scale(damage, 100 + c.cannonOut) : damage; },
        turnEnd(b, c) {
            const next = this.mode(b.turn + 1, c);
            if (next !== this.mode(b.turn, c))
                say(b, `${b.enemy.name}切换为${next === 'cannon' ? '炮台' : '铁壁'}形态。`);
        },
    },
    // 伊兰罗尼：每回合亮一颗星，六星齐亮时重创出战精灵；致命一击或战斗系命中熄灭一颗
    hexagram: {
        init(c, s) { s.stars = 0; },
        status(b, c, s) {
            return `六芒星 ${s.stars}/${c.max}：满了对出战精灵造成${c.percent}%最大体力的伤害；致命一击或战斗系技能命中熄灭一颗` + (s.stars === c.max - 1 ? '。本回合结束时爆发！' : '');
        },
        playerHit(b, c, s, skill, x) {
            if (!s.stars || !(x.isCrit || skill.type === c.breakType))
                return;
            s.stars--;
            say(b, '一颗星被打灭了。');
        },
        turnEnd(b, c, s) {
            if (++s.stars < c.max)
                return;
            s.stars = 0;
            chip(b.player, b.player.maxHp * c.percent / 100);
            say(b, `六芒星完成，星光贯穿了${b.player.name}。`);
        },
    },
    // 斯加尔卡：给出战精灵挂定时炸弹；爆炸前换精灵，炸弹转到换上的精灵身上，改为固定伤害
    timeBomb: {
        init(c, s) { s.at = 0; s.moved = false; s.next = 1; },
        status(b, c, s) {
            if (!s.at)
                return `定时炸弹：第${s.next}回合结束时挂上，${c.delay}回合后爆炸`;
            return `定时炸弹在${b.player.name}身上，第${s.at}回合结束时爆炸：` + (s.moved ? `固定${c.fixed}伤害` : `${c.percent}%最大体力（爆炸前换精灵，炸弹转移，改为固定${c.fixed}伤害）`);
        },
        onSwitch(b, c, s) {
            if (!s.at || s.moved)
                return;
            s.moved = true;
            say(b, `炸弹转到了${b.player.name}身上，爆炸改为固定${c.fixed}伤害。`);
        },
        turnEnd(b, c, s) {
            if (s.at && b.turn >= s.at) {
                chip(b.player, s.moved ? c.fixed : b.player.maxHp * c.percent / 100);
                say(b, `炸弹在${b.player.name}身上爆炸了。`);
                s.at = 0;
                s.moved = false;
                s.next = b.turn + 1;
            }
            else if (!s.at && b.turn >= s.next) {
                s.at = b.turn + c.delay;
                say(b, `${b.enemy.name}在${b.player.name}身上挂了定时炸弹，第${s.at}回合结束时爆炸。`);
            }
        },
    },
    // 艾尔伊洛：出战精灵的攻击与特攻、防御与特防对调
    dissociate: {
        apply(b, s) {
            const p = b.player;
            if (s.ct === p.catchTime)
                return;
            s.ct = p.catchTime;
            [p.attack, p.spAtk] = [p.spAtk, p.attack];
            [p.defence, p.spDef] = [p.spDef, p.defence];
        },
        status(b, c, s) {
            this.apply(b, s);
            return `星体解离：${b.player.name}的攻击与特攻、防御与特防已对调（换上的精灵同样对调）`;
        },
        select(b, c, s, id) { this.apply(b, s); return id; },
        onSwitch(b, c, s) { this.apply(b, s); },
    },
    // 布林克克：酸雨每回合交替腐蚀双方的防御、特防，伤害越打越高；不受能力变化影响
    acidRain: {
        init(c, s) { s.def = 0; s.spDef = 0; },
        factor(s, category) { return 100 + 50 * (category === 1 ? s.def : s.spDef); },
        status(b, c, s) {
            return `酸雨：双方防御腐蚀${s.def}级、特防腐蚀${s.spDef}级（物理伤害×${this.factor(s, 1) / 100}、特殊伤害×${this.factor(s, 2) / 100}），下回合腐蚀${(b.turn + 1) % 2 ? '防御' : '特防'}`;
        },
        incoming(b, c, s, skill, damage) { return scale(damage, this.factor(s, skill.category)); },
        outgoing(b, c, s, skill, damage) { return scale(damage, this.factor(s, skill.category)); },
        turnEnd(b, c, s) {
            if (b.turn % 2)
                s.def = Math.min(c.max, s.def + 1);
            else
                s.spDef = Math.min(c.max, s.spDef + 1);
        },
    },
    // 布林克克（终阶）：第一条命酸雨，第二条命混沌潮汐：每回合双方能力等级正负反转
    acidTide: {
        init(c, s) { DEFS.acidRain.init(c, s); },
        status(b, c, s) {
            return s.second ? '混沌潮汐：每回合结束时双方的能力等级正负反转' : DEFS.acidRain.status(b, c, s);
        },
        incoming(b, c, s, skill, damage) { return s.second ? damage : DEFS.acidRain.incoming(b, c, s, skill, damage); },
        outgoing(b, c, s, skill, damage) { return s.second ? damage : DEFS.acidRain.outgoing(b, c, s, skill, damage); },
        revive(b) { say(b, `${b.enemy.name}暴走，酸雨化作混沌潮汐。`); },
        turnEnd(b, c, s) {
            if (!s.second)
                return DEFS.acidRain.turnEnd(b, c, s);
            for (const pet of [b.player, b.enemy])
                pet.battleLevels.forEach((level, i) => { pet.battleLevels[i] = level ? -level : 0; });
            say(b, '混沌潮汐翻转了双方的能力变化。');
        },
    },
    // 魔花使者：体力到 75/50/25% 各开一朵花，每朵每回合回血；单次重击击碎一朵
    bloom: {
        init(c, s) { s.opened = 0; s.flowers = 0; },
        status(b, c, s) {
            return s.flowers ? `魔花 ${s.flowers}朵：每回合每朵回复${c.heal}体力；单次伤害≥${c.breakAt}击碎一朵` : `魔花：它体力降到75%、50%、25%时各开一朵花，每朵每回合回复${c.heal}体力`;
        },
        playerHit(b, c, s, skill, x) {
            if (s.flowers && x.damage >= c.breakAt) {
                s.flowers--;
                say(b, '重击震碎了一朵魔花。');
            }
            const boss = b.enemy, due = Math.min(3, Math.floor((boss.maxHp - boss.hp) * 4 / boss.maxHp));
            while (s.opened < due) {
                s.opened++;
                s.flowers++;
                say(b, `${boss.name}身上绽开了一朵魔花。`);
            }
        },
        turnEnd(b, c, s) {
            if (s.flowers)
                heal(b.enemy, c.heal * s.flowers);
        },
    },
    // 莫尔加斯：沙尘暴让玩家攻击命中下降；必中技能和地面系精灵不受影响
    sandstorm: {
        status(b, c) {
            return b.player.type === 7 ? `沙尘暴：${b.player.name}是地面系，不受影响` : `沙尘暴：你的攻击命中-${c.miss}%（必中技能和地面系精灵不受影响）`;
        },
        hit(b, c, s, attacker, skill) {
            if (attacker !== b.player || !isAttack(skill) || skill.mustHit || b.player.type === 7 || Math.random() * 100 >= c.miss)
                return undefined;
            say(b, '沙尘遮住了视线，攻击落空了。');
            return false;
        },
    },
    // 萨诺拉斯：火系技能命中留下不会熄灭的火种，层层叠加；水系精灵上场熄灭全队火种
    wildfire: {
        init(c, s) { s.layers = {}; },
        count(b, s) { return s.layers[b.player.catchTime] || 0; },
        status(b, c, s) {
            const n = this.count(b, s);
            return n ? `燎原：${b.player.name}身上${n}层火种，每回合扣${n}/${c.div}体力（水系精灵上场熄灭全队火种）` : `燎原：被它的火系技能命中会留下火种（最多${c.max}层），火种不会自己熄灭；水系精灵不会着火`;
        },
        bossActed(b, c, s, skill, x) {
            if (skill.type !== 3 || !x.hit || x.damage <= 0 || b.player.hp <= 0 || b.player.type === 2)
                return;
            const key = b.player.catchTime;
            s.layers[key] = Math.min(c.max, (s.layers[key] || 0) + 1);
        },
        onSwitch(b, c, s) {
            if (b.player.type !== 2 || !Object.values(s.layers).some(n => n > 0))
                return;
            s.layers = {};
            say(b, `${b.player.name}上场，熄灭了全队的火种。`);
        },
        turnEnd(b, c, s) {
            const n = this.count(b, s);
            if (n && b.player.hp > 1)
                chip(b.player, b.player.maxHp * n / c.div);
        },
    },
    // 帕多尼：按固定曲目循环出招；安可曲命中后，玩家几回合内只能重复上一招
    concert: {
        status(b, c, s) {
            const next = c.program[b.turn % c.program.length];
            return `演奏会：下回合「${skillName(next)}」` + (s.encore > b.turn ? `；安可中，到第${s.encore}回合只能使用${skillName(s.encoreSkill)}（换精灵摆脱）` : '');
        },
        select(b, c, s, id) {
            const want = c.program[(b.turn - 1) % c.program.length];
            return hasPP(b.enemy, want) ? want : id;
        },
        playerSkill(b, c, s, id) {
            return s.encore >= b.turn && b.player.skills.includes(s.encoreSkill) ? s.encoreSkill : id;
        },
        playerActed(b, c, s, skill) {
            if (skill.id > 0)
                s.last = skill.id;
        },
        bossActed(b, c, s, skill, x) {
            if (skill.id !== c.encoreSkillId || !x.hit || !s.last || b.player.hp <= 0)
                return;
            s.encoreSkill = s.last;
            s.encore = b.turn + c.encoreTurns;
            say(b, `安可曲响起，${b.player.name}接下来${c.encoreTurns}回合只能重复${skillName(s.last)}。`);
        },
        onSwitch(b, c, s) {
            s.last = 0;
            if (!(s.encore > b.turn))
                return;
            s.encore = 0;
            say(b, '换下精灵，摆脱了安可曲。');
        },
    },
    // 加洛德：每回合长大一档（最大体力、回血、伤害）；被降能力的回合不生长并缩回一档
    overgrowth: {
        init(c, s) { s.stage = 0; },
        status(b, c, s) {
            return `超能生长 ${s.stage}/${c.max}档：最大体力+${s.stage * c.hp}、伤害+${s.stage * c.atk}%；被降低能力的回合不生长并缩回一档`;
        },
        // 回合开始记下能力等级，回合末比较是否被降过
        select(b, c, s, id) { s.levels = [...b.enemy.battleLevels]; return id; },
        outgoing(b, c, s, skill, damage) { return s.stage ? scale(damage, 100 + s.stage * c.atk) : damage; },
        turnEnd(b, c, s) {
            const boss = b.enemy;
            if (s.levels && boss.battleLevels.some((level, i) => level < (s.levels[i] || 0))) {
                if (s.stage) {
                    s.stage--;
                    boss.maxHp -= c.hp;
                    boss.hp = Math.min(boss.hp, boss.maxHp);
                }
                say(b, `${boss.name}的能力被削弱，没能生长` + (s.stage ? '，缩回了一档。' : '。'));
                return;
            }
            if (s.stage >= c.max)
                return;
            s.stage++;
            boss.maxHp += c.hp;
            heal(boss, c.hp);
        },
    },
    // 萨多拉尼：带着镜像，单体攻击可能打中镜像；连击技能打碎全部镜像；定期补满
    mirrors: {
        init(c, s) { s.images = c.max; },
        status(b, c, s) {
            const chance = Math.round(s.images * 100 / (s.images + 1));
            return `镜影 ${s.images}/${c.max}：你的攻击有${chance}%几率打中镜像，连击技能打碎全部镜像；第${nextCycleTurn(b.turn, c.every, 0)}回合结束时补满`;
        },
        hit(b, c, s, attacker, skill) {
            if (attacker !== b.player || !isAttack(skill) || !s.images)
                return undefined;
            if (isMulti(skill)) {
                s.images = 0;
                say(b, '连击打碎了全部镜像。');
                return undefined;
            }
            if (Math.random() * (s.images + 1) >= s.images)
                return undefined;
            s.images--;
            say(b, `${skill.name}打中了镜像，镜像碎了一个。`);
            return false;
        },
        turnEnd(b, c, s) {
            if (b.turn % c.every !== 0 || s.images >= c.max)
                return;
            s.images = c.max;
            say(b, `${b.enemy.name}的镜像重新补满了。`);
        },
    },
    // ---------- 暗黑武斗场终阶：两条命，第二条命暴走（s.second） ----------
    // 迪普利德：黑色束带缠住出战精灵，不能换下、每回合特防下降；暴走后还会吸血
    belt: {
        status(b, c, s) {
            if (s.until >= b.turn + 1 && s.ct === b.player.catchTime)
                return `黑色束带缠着${b.player.name}到第${s.until}回合：不能换下，每回合特防-1` + (s.second ? `、被吸取${c.drain}%体力` : '');
            return `黑色束带：被${skillName(c.skillId)}命中的精灵${c.turns}回合内不能换下、每回合特防-1` + (s.second ? `、被吸取${c.drain}%体力` : '');
        },
        select(b, c, s, id) {
            return !(s.until >= b.turn && s.ct === b.player.catchTime) && hasPP(b.enemy, c.skillId) ? c.skillId : id;
        },
        bossActed(b, c, s, skill, x) {
            if (skill.id !== c.skillId || !x.hit || b.player.hp <= 0)
                return;
            s.until = b.turn + c.turns;
            s.ct = b.player.catchTime;
            say(b, `黑色束带缠住了${b.player.name}，${c.turns}回合内不能换下。`);
        },
        blockSwitch(b, c, s) {
            return s.until >= b.turn + 1 && s.ct === b.player.catchTime && b.player.hp > 0 ? `${b.player.name}被黑色束带缠住，到第${s.until}回合前不能换下！` : '';
        },
        revive(b) { say(b, `${b.enemy.name}暴走，束带开始吸取体力。`); },
        turnEnd(b, c, s) {
            if (!(s.until >= b.turn) || s.ct !== b.player.catchTime)
                return;
            effects().Stage(b.player, 3, -1);
            if (s.second)
                heal(b.enemy, chip(b.player, b.player.maxHp * c.drain / 100));
        },
    },
    // 拜洛亚斯：每次命中削弱玩家刚用过的技能；暴走后每回合必定先手
    breakBlade: {
        init(c, s) { s.cut = {}; s.last = 0; },
        status(b, c, s) {
            const list = b.player.skills.filter(id => s.cut[id]).map(id => `${skillName(id)}-${s.cut[id]}`);
            return `破兵：它每命中一次，你刚用的攻击技能本场威力-${c.cut}` + (list.length ? `（${list.join('、')}）` : '') + (s.second ? '；暴走中，它每回合必定先手' : '');
        },
        playerActed(b, c, s, skill) {
            if (isAttack(skill))
                s.last = skill.id;
        },
        bossActed(b, c, s, skill, x) {
            if (!isAttack(skill) || !x.hit || !s.last || b.player.hp <= 0)
                return;
            s.cut[s.last] = (s.cut[s.last] || 0) + c.cut;
            say(b, `${skillName(s.last)}被破兵刃削弱，威力-${c.cut}。`);
        },
        incoming(b, c, s, skill, damage) {
            const cut = s.cut[skill.id], power = skill.power || 0;
            return cut && power ? scale(damage, Math.max(c.floor, Math.round((power - cut) * 100 / power))) : damage;
        },
        playerLast(b, c, s) { return !!s.second; },
        onSwitch(b, c, s) { s.last = 0; },
        revive(b) { say(b, `${b.enemy.name}暴走，之后每回合必定先手。`); },
    },
    // 阿克诺亚：冰系攻击更容易冻伤，被冻伤的精灵每回合技能随机；暴走后每回合判定冻伤
    frostRule: {
        frozen(b) { return effects().HasStatus(b.player, 5); },
        status(b, c, s) {
            return (s.second ? `极冰风暴：每回合结束时${c.stormChance}%几率冻伤出战精灵；` : `冰冷支配：它的冰系攻击命中时${c.freezeChance}%几率冻伤；`) + '被冻伤的精灵每回合使出的技能随机';
        },
        playerSkill(b, c, s, id) {
            if (!this.frozen(b) || b.player.skills.length < 2)
                return id;
            const pick = b.player.skills[Math.floor(Math.random() * b.player.skills.length)];
            if (pick !== id)
                say(b, `${b.player.name}被冰冷支配，使出了${skillName(pick)}。`);
            return pick;
        },
        bossActed(b, c, s, skill, x) {
            if (skill.type === 9 && x.hit && b.player.hp > 0 && Math.random() * 100 < c.freezeChance && effects().Inflict(b.player, 5, 2))
                say(b, `${b.player.name}被冻伤了，技能将不受控制。`);
        },
        revive(b) { say(b, `${b.enemy.name}暴走，掀起了极冰风暴。`); },
        turnEnd(b, c, s) {
            if (s.second && !this.frozen(b) && Math.random() * 100 < c.stormChance && effects().Inflict(b.player, 5, 2))
                say(b, `极冰风暴冻伤了${b.player.name}。`);
        },
    },
    // 鳞甲魔鱼：伤害不够高的攻击被鳞甲弹开；暴走后鳞甲剥落，攻击、速度提升
    scales: {
        threshold(b, c) { return Math.floor(b.enemy.maxHp * c.percent / 100); },
        status(b, c, s) {
            return s.second ? '鳞甲剥落：伤害门槛消失，它的攻击、速度+2' : `鳞甲：单次伤害低于${this.threshold(b, c)}会被弹开（致命一击、克制属性更容易打穿）`;
        },
        incoming(b, c, s, skill, damage) {
            if (s.second || damage >= this.threshold(b, c))
                return damage;
            say(b, `${damage}点伤害被鳞甲弹开了。`);
            return 0;
        },
        revive(b) {
            effects().Stage(b.enemy, 0, 2);
            effects().Stage(b.enemy, 4, 2);
            say(b, `${b.enemy.name}暴走，鳞甲剥落，攻击、速度+2。`);
        },
    },
    // 艾斯德克：下回合用自己的攻击力回放玩家上回合的攻击技能；暴走后回放伤害加倍
    echo: {
        init(c, s) { s.last = 0; s.next = 0; },
        status(b, c, s) {
            const id = s.last;
            return id ? `念刃回响：下回合它会用自己的能力回放你的${skillName(id)}` + (s.second ? '，伤害加倍' : '') : '念刃回响：它会在下回合回放你用过的攻击技能';
        },
        select(b, c, s, id) {
            s.echo = s.last;
            s.last = 0;
            return s.echo || id;
        },
        outgoing(b, c, s, skill, damage) { return s.second && s.echo && skill.id === s.echo ? scale(damage, c.secondPercent) : damage; },
        bossActed(b, c, s, skill) {
            if (s.echo && skill.id === s.echo)
                say(b, `${b.enemy.name}回放了你的${skill.name}。`);
            s.echo = 0;
        },
        playerActed(b, c, s, skill) { s.next = isAttack(skill) ? skill.id : 0; },
        onSwitch(b, c, s) { s.next = 0; },
        revive(b) { say(b, `${b.enemy.name}暴走，回放的伤害加倍。`); },
        turnEnd(b, c, s) {
            s.last = s.next;
            s.next = 0;
        },
    },
    // 狂狮迪卡：定期落下陨星重创出战精灵，那回合用属性技能可减半；暴走后间隔缩短、攻击特攻提升
    meteor: {
        init(c, s) { s.at = c.every; },
        status(b, c, s) {
            return `陨星：第${s.at}回合结束时落地，扣出战精灵${c.percent}%最大体力；那回合使用属性技能伤害减半` + (s.second ? '（暴走中）' : '');
        },
        playerActed(b, c, s, skill) {
            if (b.turn === s.at)
                s.braced = skill.category === 4;
        },
        turnEnd(b, c, s) {
            if (b.turn < s.at)
                return;
            chip(b.player, b.player.maxHp * (s.braced ? c.percent / 2 : c.percent) / 100);
            say(b, `陨星落地` + (s.braced ? `，${b.player.name}做好了防备，伤害减半。` : `，重创了${b.player.name}。`));
            s.braced = false;
            s.at = b.turn + (s.second ? c.every2 : c.every);
        },
        revive(b, c, s) {
            effects().Stage(b.enemy, 0, 2);
            effects().Stage(b.enemy, 2, 2);
            s.at = b.turn + c.every2;
            say(b, `${b.enemy.name}暴走，攻击、特攻+2，陨星落得更快了。`);
        },
    },
    // ---------- 星系霸主 ----------
    // 塔克林：龙威每回合压低出战精灵攻击、特攻中较高的一项；换精灵重置
    dragonAwe: {
        stat(b) { return b.player.attack >= b.player.spAtk ? 0 : 2; },
        status(b, c) {
            const stat = this.stat(b);
            return `龙威：${b.player.name}的${stat ? '特攻' : '攻击'}${b.player.battleLevels?.[stat] || 0}，每回合结束时再-${c.down}（换精灵重置）`;
        },
        turnEnd(b, c) { effects().Stage(b.player, this.stat(b), -c.down); },
    },
    // 塞维尔：第一次被打到濒死时撑住，几回合内免疫攻击伤害、攻击提升；这几回合没击倒精灵就力竭倒下
    undying: {
        status(b, c, s) {
            if (s.until && s.until < b.turn + 1)
                return '不灭意志：期限已到，本回合结束时结算';
            if (s.until >= b.turn + 1)
                return `不灭意志：攻击伤害无效，到第${s.until}回合结束` + (s.kills ? `，已击倒${s.kills}只，之后回复${c.healPercent}%体力继续战斗` : '前没击倒任何精灵就会力竭倒下');
            return s.used ? '不灭意志已用尽' : `不灭意志：第一次被打到濒死时撑住${c.turns}回合，期间免疫攻击伤害、攻击+${c.atk}`;
        },
        incoming(b, c, s, skill, damage) {
            const boss = b.enemy;
            if (s.until >= b.turn) {
                say(b, '不灭意志挡下了攻击。');
                return 0;
            }
            if (s.used || damage < boss.hp)
                return damage;
            s.used = true;
            s.until = b.turn + c.turns;
            s.kills = 0;
            boss.battleLevels[0] = clampStage((boss.battleLevels[0] || 0) + c.atk);
            say(b, `${boss.name}以不灭意志撑住了，${c.turns}回合内攻击伤害无效、攻击+${c.atk}。`);
            return Math.max(0, boss.hp - 1);
        },
        bossActed(b, c, s, skill, x) {
            if (s.until >= b.turn && x.hit && b.player.hp <= 0)
                s.kills++;
        },
        turnEnd(b, c, s) {
            if (!s.until || b.turn < s.until)
                return;
            s.until = 0;
            if (s.kills) {
                heal(b.enemy, b.enemy.maxHp * c.healPercent / 100);
                say(b, `${b.enemy.name}拖走了对手，重新站了起来。`);
                return;
            }
            b.enemy.hp = 0;
            say(b, `${b.enemy.name}的意志耗尽，力竭倒下。`);
        },
    },
    // 冰洛伏特：定期放出次元冰魄，伤害等于出战精灵已损失的体力，命中后冻住一回合
    dimensionIce: {
        due(b, c) { return b.turn % c.every === 0; },
        status(b, c) {
            return `次元冰魄：第${nextCycleTurn(b.turn, c.every, 0)}回合使出，伤害等于出战精灵已损失的体力，命中后冻住一回合`;
        },
        select(b, c, s, id) {
            if (this.due(b, c) && hasPP(b.enemy, c.skillId))
                return c.skillId;
            return id === c.skillId ? (otherAttack(b.enemy, c.skillId) || id) : id;
        },
        outgoing(b, c, s, skill, damage) {
            return skill.id === c.skillId && this.due(b, c) ? Math.max(1, b.player.maxHp - b.player.hp) : damage;
        },
        bossActed(b, c, s, skill, x) {
            if (skill.id !== c.skillId || !this.due(b, c) || !x.hit || b.player.hp <= 0)
                return;
            b.player.fatigueTurns = 1;
            say(b, `次元冰魄冻住了${b.player.name}，下回合无法行动。`);
        },
    },
    // 罗德利斯：两条命，第二条命浴火重生，攻击、特攻提升但每回合自焚
    rebirth: {
        status(b, c, s) {
            return s.second ? `浴火：攻击、特攻+${c.stages}，每回合结束时自焚${c.burn}%最大体力` : `浴火：被击倒后浴火重生，攻击、特攻+${c.stages}，之后每回合自焚${c.burn}%最大体力`;
        },
        revive(b, c) {
            effects().Stage(b.enemy, 0, c.stages);
            effects().Stage(b.enemy, 2, c.stages);
            say(b, `${b.enemy.name}浴火重生，攻击、特攻+${c.stages}。`);
        },
        turnEnd(b, c, s) {
            if (!s.second)
                return;
            const boss = b.enemy;
            boss.hp = Math.max(0, boss.hp - Math.floor(boss.maxHp * c.burn / 100));
            if (!boss.hp)
                say(b, `${boss.name}燃尽了自己。`);
        },
    },
    // 迪尔科特：连续命中叠连段，每层伤害提升；被玩家先手命中或它打空时中断
    combo: {
        init(c, s) { s.combo = 0; },
        status(b, c, s) { return `连段 ${s.combo}/${c.max}（伤害+${s.combo * c.perLayer}%）：你先出手命中它，或它打空时中断`; },
        outgoing(b, c, s, skill, damage) { return s.combo ? scale(damage, 100 + s.combo * c.perLayer) : damage; },
        bossActed(b, c, s, skill, x) {
            if (!isAttack(skill))
                return;
            if (x.hit) {
                s.combo = Math.min(c.max, s.combo + 1);
                return;
            }
            if (s.combo)
                say(b, `${b.enemy.name}打空了，连段中断。`);
            s.combo = 0;
        },
        playerHit(b, c, s) {
            if (!b.sigPlayerFirst || !s.combo)
                return;
            s.combo = 0;
            say(b, '抢先命中，打断了连段。');
        },
    },
    // 墨杜萨：玩家连续两回合用同一招，出战精灵被石化一回合
    petrify: {
        status(b, c, s) {
            return s.last && s.lastTurn === b.turn ? `石化凝视：下回合再用${skillName(s.last)}会被石化${c.turns}回合` : '石化凝视：连续两回合使用同一个技能会被石化';
        },
        playerActed(b, c, s, skill) {
            if (!(skill.id > 0))
                return;
            if (s.last === skill.id && s.lastTurn === b.turn - 1) {
                s.last = 0;
                b.player.fatigueTurns = Math.max(b.player.fatigueTurns || 0, c.turns);
                say(b, `${b.player.name}连续使用${skill.name}，被石化凝视定住了。`);
                return;
            }
            s.last = skill.id;
            s.lastTurn = b.turn;
        },
        onSwitch(b, c, s) { s.last = 0; },
    },
    // 巴斯特：物理、特殊两套装甲，同类攻击每命中剥一层；每几回合各长回一层
    dualArmor: {
        init(c, s) { s.phys = c.layers; s.spec = c.layers; },
        status(b, c, s) {
            return `双层装甲：物理${s.phys}层（受伤-${s.phys * c.perLayer}%）、特殊${s.spec}层（受伤-${s.spec * c.perLayer}%），同类攻击命中剥1层；第${nextCycleTurn(b.turn, c.regen, 0)}回合结束时各长回1层`;
        },
        incoming(b, c, s, skill, damage) {
            const layers = skill.category === 1 ? s.phys : s.spec;
            return layers ? scale(damage, 100 - layers * c.perLayer) : damage;
        },
        playerHit(b, c, s, skill) {
            const key = skill.category === 1 ? 'phys' : 'spec';
            if (s[key])
                s[key]--;
        },
        turnEnd(b, c, s) {
            if (b.turn % c.regen !== 0 || (s.phys >= c.layers && s.spec >= c.layers))
                return;
            s.phys = Math.min(c.layers, s.phys + 1);
            s.spec = Math.min(c.layers, s.spec + 1);
            say(b, `${b.enemy.name}的装甲长回了一层。`);
        },
    },
    // 亚伦斯：绝对零度读条，到点冻结出战精灵（直接倒下）；读条期间累计伤害够多可打断，它反被冻住一回合
    absoluteZero: {
        init(c, s) { s.at = c.delay; s.dealt = 0; s.stun = 0; },
        status(b, c, s) {
            if (s.stun === b.turn + 1)
                return `下回合${b.enemy.name}被自己的寒气冻住：不行动，受到的伤害+${c.bonus}%`;
            return `绝对零度：第${s.at}回合结束时冻结出战精灵，直接倒下；再造成${Math.max(0, c.breakAt - s.dealt)}伤害可打断`;
        },
        select(b, c, s, id) { return s.stun === b.turn ? 0 : id; },
        incoming(b, c, s, skill, damage) { return s.stun === b.turn ? scale(damage, 100 + c.bonus) : damage; },
        playerHit(b, c, s, skill, x) {
            if (s.stun && s.stun >= b.turn)
                return;
            s.dealt += x.damage;
            if (s.dealt < c.breakAt)
                return;
            s.stun = b.turn + 1;
            s.at = s.stun + c.delay;
            s.dealt = 0;
            say(b, `读条被打断，${b.enemy.name}下回合会被自己的寒气冻住。`);
        },
        turnEnd(b, c, s) {
            if (b.turn < s.at)
                return;
            b.player.hp = 0;
            s.at = b.turn + c.delay;
            s.dealt = 0;
            say(b, `绝对零度，${b.player.name}被冻结，倒下了。`);
        },
    },
    // 该伊：以小搏大，高威力技能打它伤害减半
    underdog: {
        status(b, c) { return `以小搏大：威力${c.power}以上的技能对它伤害-${100 - c.percent}%`; },
        incoming(b, c, s, skill, damage) { return (skill.power || 0) >= c.power ? scale(damage, c.percent) : damage; },
    },
    // 伊特：扎根回血，回复量逐回合增加；身上有异常时扎根中断，回复量重置
    taproot: {
        init(c, s) { s.heal = c.heal; },
        status(b, c, s) {
            return effects().HasStatus(b.enemy) ? '扎根：异常中，不回血' : `扎根：本回合结束时回复${s.heal}体力，之后每回合+${c.step}（最多${c.max}）；身上有异常时中断并重置`;
        },
        turnEnd(b, c, s) {
            if (effects().HasStatus(b.enemy)) {
                if (s.heal > c.heal)
                    say(b, `异常打断了扎根，${b.enemy.name}的回复量重置。`);
                s.heal = c.heal;
                return;
            }
            heal(b.enemy, s.heal);
            s.heal = Math.min(c.max, s.heal + c.step);
        },
    },
    // 卡修斯：定期全能力+1，强化累计够高后攻击必中必暴；每被消除一次强化损失当前体力
    peakShadow: {
        buffs(pet) { return (pet.battleLevels || []).slice(0, 5).reduce((n, v) => n + Math.max(0, v), 0); },
        peak(b, c) { return this.buffs(b.enemy) >= c.at; },
        status(b, c) {
            return `万山绝影：强化合计${this.buffs(b.enemy)}级` + (this.peak(b, c) ? '，攻击必中、必定致命一击' : `，达到${c.at}级后攻击必中必暴`) + `；第${nextCycleTurn(b.turn, c.every, 0)}回合结束时全能力+1；每被消除一次强化损失${c.loss}%当前体力`;
        },
        select(b, c, s, id) { s.buffs = this.buffs(b.enemy); return id; },
        hit(b, c, s, attacker, skill) { return attacker === b.enemy && isAttack(skill) && this.peak(b, c) ? true : undefined; },
        crit(b, c) { return this.peak(b, c); },
        bossActed(b, c, s) { s.buffs = this.buffs(b.enemy); },
        playerActed(b, c, s) {
            const boss = b.enemy, now = this.buffs(boss);
            if (s.buffs > 0 && now === 0 && boss.hp > 0) {
                boss.hp = Math.max(1, boss.hp - Math.floor(boss.hp * c.loss / 100));
                say(b, `强化被消除，${boss.name}损失了${c.loss}%体力。`);
            }
            s.buffs = now;
        },
        turnEnd(b, c) {
            if (b.turn % c.every !== 0)
                return;
            for (let i = 0; i < 5; i++)
                effects().Stage(b.enemy, i, 1);
            say(b, `${b.enemy.name}施展万山绝影，全能力+1。`);
        },
    },
    // 德拉萨：浩劫，双方每回合结束时各扣最大体力的一部分
    havoc: {
        status(b, c) { return `浩劫：每回合结束时双方各损失${c.percent}%最大体力`; },
        turnEnd(b, c) {
            chip(b.player, b.player.maxHp * c.percent / 100);
            const boss = b.enemy;
            boss.hp = Math.max(1, boss.hp - Math.floor(boss.maxHp * c.percent / 100));
        },
    },
    // 迪符特：每回合攻势叠一层，没有上限；体力每降 25% 清空一次自身强化
    tireless: {
        init(c, s) { s.stacks = 0; s.broken = 0; },
        status(b, c, s) { return `不知疲倦 ${s.stacks}层（伤害+${s.stacks * c.perLayer}%），每回合+1；体力每降25%清空一次层数和强化`; },
        outgoing(b, c, s, skill, damage) { return s.stacks ? scale(damage, 100 + s.stacks * c.perLayer) : damage; },
        playerHit(b, c, s) {
            const boss = b.enemy, due = Math.min(3, Math.floor((boss.maxHp - boss.hp) * 4 / boss.maxHp));
            if (s.broken >= due)
                return;
            s.broken = due;
            s.stacks = 0;
            boss.battleLevels.forEach((level, i) => { if (level > 0) boss.battleLevels[i] = 0; });
            say(b, `${boss.name}体力下降，攻势和强化被打散了。`);
        },
        turnEnd(b, c, s) { s.stacks++; },
    },
    // 斯普林特：定期预告回旋闪避回合，那回合攻击全部落空；玩家打空后它的下一击用破绽打击加重
    spinDodge: {
        dodging(b, c, turn) { return turn % c.every === 0; },
        status(b, c, s) {
            return (this.dodging(b, c, b.turn + 1) ? '下回合回旋闪避：你的攻击全部落空' : `回旋闪避：第${nextCycleTurn(b.turn, c.every, 0)}回合你的攻击全部落空`) + `；你打空后它下一击用${skillName(c.skillId)}，伤害+${c.bonus}%` + (s.punish ? '（已露破绽）' : '');
        },
        select(b, c, s, id) { return s.punish && hasPP(b.enemy, c.skillId) ? c.skillId : id; },
        hit(b, c, s, attacker, skill) {
            if (attacker !== b.player || !isAttack(skill) || !this.dodging(b, c, b.turn))
                return undefined;
            say(b, `${b.enemy.name}回旋闪开了攻击。`);
            return false;
        },
        outgoing(b, c, s, skill, damage) { return s.punish ? scale(damage, 100 + c.bonus) : damage; },
        playerActed(b, c, s, skill, x) {
            if (isAttack(skill) && !x.hit && !s.punish) {
                s.punish = true;
                say(b, `${b.player.name}打空了，露出破绽。`);
            }
        },
        bossActed(b, c, s, skill) {
            if (s.punish && isAttack(skill))
                s.punish = false;
        },
    },
    // 布莱克：一对一决斗，双方每损失 20% 体力伤害提升
    duel: {
        tiers(pet) { return Math.min(4, Math.floor((pet.maxHp - pet.hp) * 5 / pet.maxHp)); },
        status(b, c) {
            return `决斗：每损失20%体力伤害+${c.perTier}%（它+${this.tiers(b.enemy) * c.perTier}%，你+${this.tiers(b.player) * c.perTier}%）`;
        },
        incoming(b, c, s, skill, damage) { return scale(damage, 100 + this.tiers(b.player) * c.perTier); },
        outgoing(b, c, s, skill, damage) { return scale(damage, 100 + this.tiers(b.enemy) * c.perTier); },
    },
    // 肯佩德：漩涡每回合卷走出战精灵最高的一级强化转给自己；没有强化时吸取体力
    vortex: {
        NAMES: ['攻击', '防御', '特攻', '特防', '速度', '命中'],
        status(b, c) { return `漩涡：每回合结束时卷走${b.player.name}最高的一级强化转给自己；没有强化时吸取1/${c.drainDiv}体力`; },
        turnEnd(b, c) {
            const levels = b.player.battleLevels || [];
            let best = -1;
            levels.forEach((level, i) => { if (level > 0 && (best < 0 || level > levels[best])) best = i; });
            if (best < 0) {
                heal(b.enemy, chip(b.player, b.player.maxHp / c.drainDiv));
                return;
            }
            levels[best]--;
            b.enemy.battleLevels[best] = clampStage((b.enemy.battleLevels[best] || 0) + 1);
            say(b, `漩涡卷走了${b.player.name}的一级${this.NAMES[best]}强化。`);
        },
    },
    // ---------- 剧情 BOSS ----------
    // 皮特萨罗：怒鸣蓄力满了放出加重的破空长鸣；蓄力期间被命中几次就被打断
    screech: {
        init(c, s) { s.charge = 0; s.hits = 0; },
        status(b, c, s) {
            return `怒鸣蓄力 ${s.charge}/${c.max}` + (s.charge >= c.max ? `，下回合放出必中、伤害×${c.blastPercent / 100}的${skillName(c.skillId)}` : '') + `；蓄力中被命中${c.breakHits}次打断（${s.hits}/${c.breakHits}）`;
        },
        select(b, c, s, id) {
            s.blast = s.charge >= c.max && hasPP(b.enemy, c.skillId);
            if (s.blast)
                return c.skillId;
            return id === c.skillId ? (otherAttack(b.enemy, c.skillId) || id) : id;
        },
        hit(b, c, s, attacker, skill) { return attacker === b.enemy && s.blast && skill.id === c.skillId ? true : undefined; },
        outgoing(b, c, s, skill, damage) { return s.blast && skill.id === c.skillId ? scale(damage, c.blastPercent) : damage; },
        bossActed(b, c, s, skill) {
            if (!s.blast || skill.id !== c.skillId)
                return;
            s.blast = false;
            s.charge = 0;
            s.hits = 0;
            s.released = true;
            say(b, `蓄满的${skill.name}撕裂了天空。`);
        },
        playerHit(b, c, s) {
            if (!s.charge || ++s.hits < c.breakHits)
                return;
            s.charge = 0;
            s.hits = 0;
            say(b, `${b.enemy.name}的蓄力被打断了。`);
        },
        turnEnd(b, c, s) {
            if (s.released)
                s.released = false;
            else
                s.charge = Math.min(c.max, s.charge + 1);
        },
    },
    // 暗夜冰狐：隐在夜幕里闪避攻击，每被命中一次闪避下降；没被打中的回合闪避回升
    nightVeil: {
        init(c, s) { s.dodge = c.start; },
        status(b, c, s) { return `夜幕：闪避${s.dodge}%（必中技能除外）；每被命中一次-${c.step}%，没被打中的回合+${c.step}%（最高${c.max}%）`; },
        hit(b, c, s, attacker, skill) {
            if (attacker !== b.player || !isAttack(skill) || skill.mustHit || Math.random() * 100 >= s.dodge)
                return undefined;
            say(b, `${b.enemy.name}隐入夜幕，闪开了攻击。`);
            return false;
        },
        playerHit(b, c, s) {
            s.dodge = Math.max(0, s.dodge - c.step);
            s.hitTurn = b.turn;
        },
        turnEnd(b, c, s) {
            if (s.hitTurn !== b.turn)
                s.dodge = Math.min(c.max, s.dodge + c.step);
        },
    },
};
function of(battle) {
    const boss = battle?.enemy, config = boss?.bossMechanics?.signature;
    if (!config || battle.universeBoss)
        return null;
    const def = DEFS[config.id];
    if (!def)
        return null;
    const state = boss.bossState.sig || (boss.bossState.sig = {});
    return { def, config, state };
}
/** 开战或进入新形态时初始化 */
function init(boss) {
    const config = boss?.bossMechanics?.signature;
    if (!config)
        return;
    const def = DEFS[config.id];
    if (!def)
        throw new Error(`Unknown boss signature: ${config.id}`);
    boss.bossState.sig = {};
    def.init?.(config, boss.bossState.sig);
}
exports.init = init;
function setOrder(battle, playerFirst) {
    battle.sigPlayerFirst = playerFirst;
}
exports.setOrder = setOrder;
function onPlayerSwitch(battle) {
    const sig = of(battle);
    sig?.def.onSwitch?.(battle, sig.config, sig.state);
}
exports.onPlayerSwitch = onPlayerSwitch;
function selectSkill(battle, skillId) {
    const sig = of(battle);
    return sig?.def.select ? sig.def.select(battle, sig.config, sig.state, skillId) : skillId;
}
exports.selectSkill = selectSkill;
function checkHit(battle, attacker, skill) {
    const sig = of(battle);
    return sig?.def.hit ? sig.def.hit(battle, sig.config, sig.state, attacker, skill) : undefined;
}
exports.checkHit = checkHit;
/** 攻击技能的直接伤害修正；固定伤害、秒杀不经过这里 */
function modifyDamage(battle, attacker, defender, skill, damage, kind) {
    const sig = of(battle);
    if (!sig || kind !== 'attack' || damage <= 0)
        return damage;
    if (defender === battle.enemy && attacker === battle.player)
        return sig.def.incoming ? sig.def.incoming(battle, sig.config, sig.state, skill, damage) : damage;
    if (attacker === battle.enemy && defender === battle.player) {
        // might：BOSS 攻击技能的伤害百分比，用来按同级队伍校准难度
        if (sig.config.might)
            damage = scale(damage, sig.config.might);
        return sig.def.outgoing ? sig.def.outgoing(battle, sig.config, sig.state, skill, damage) : damage;
    }
    return damage;
}
exports.modifyDamage = modifyDamage;
/**
 * 一次出手结束后
 * @param x { hit, damage, isCrit, hits }
 */
function afterAttack(battle, attacker, skill, x) {
    const sig = of(battle);
    if (!sig)
        return;
    if (attacker === battle.enemy)
        sig.def.bossActed?.(battle, sig.config, sig.state, skill, x);
    else if (attacker === battle.player) {
        sig.def.playerActed?.(battle, sig.config, sig.state, skill, x);
        if (x.hit && x.damage > 0 && isAttack(skill) && battle.enemy.hp > 0)
            sig.def.playerHit?.(battle, sig.config, sig.state, skill, x);
    }
}
exports.afterAttack = afterAttack;
/** BOSS 的攻击是否强制暴击 */
function forceCrit(battle, attacker, skill) {
    const sig = of(battle);
    return !!(sig?.def.crit && attacker === battle.enemy && isAttack(skill) && sig.def.crit(battle, sig.config, sig.state, skill));
}
exports.forceCrit = forceCrit;
/** 本回合玩家是否必定后手 */
function playerLast(battle) {
    const sig = of(battle);
    return !!sig?.def.playerLast?.(battle, sig.config, sig.state);
}
exports.playerLast = playerLast;
/** 玩家本回合实际使出的技能 */
function playerSkill(battle, skillId) {
    const sig = of(battle);
    return sig?.def.playerSkill ? sig.def.playerSkill(battle, sig.config, sig.state, skillId) : skillId;
}
exports.playerSkill = playerSkill;
/** 不允许玩家主动换精灵时返回提示文字 */
function blockSwitch(battle) {
    const sig = of(battle);
    return sig?.def.blockSwitch?.(battle, sig.config, sig.state) || '';
}
exports.blockSwitch = blockSwitch;
/** BOSS 用掉额外一条命复活后：进入第二条命的规则 */
function revive(battle) {
    const sig = of(battle);
    if (!sig)
        return;
    sig.state.second = true;
    sig.def.revive?.(battle, sig.config, sig.state);
}
exports.revive = revive;
function turnEnd(battle) {
    const sig = of(battle);
    if (sig && battle.enemy.hp > 0 && battle.player.hp > 0)
        sig.def.turnEnd?.(battle, sig.config, sig.state);
}
exports.turnEnd = turnEnd;
/** 取走待下发的提示：本回合的事件加一行当前状态 */
function drainNotices(battle) {
    const sig = of(battle);
    if (!sig)
        return '';
    const lines = battle.bossNotices || [];
    battle.bossNotices = [];
    const status = battle.enemy.hp > 0 ? sig.def.status?.(battle, sig.config, sig.state) : '';
    // 补位换精灵时回合结果后和换上后各下发一次：同一回合里没有新事件、状态也没变就不再重复
    if (!lines.length && status === battle.bossStatusSent && battle.turn === battle.bossStatusTurn)
        return '';
    battle.bossStatusSent = status;
    battle.bossStatusTurn = battle.turn;
    if (status)
        lines.push(status);
    return lines.join('\n');
}
exports.drainNotices = drainNotices;
exports.DEFS = DEFS;
