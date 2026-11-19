'use strict';
/**
 * BOSS 招牌特性配置：把下表写进 deploy/baseline/app/config/data/json/boss_abilities.json。
 * 每个条目整体替换该 BOSS 的 mechanics 与 hint，可重复执行；abilities、hp（customHP）只在表里给出时替换。
 * signature.might 是 BOSS 攻击技能的伤害百分比；数值用 spt-boss-lab.cjs 的校准模式（LAB_CALIBRATE）按同级队伍标定。
 * 规则实现在 dist/GameServer/Game/Battle/BossSignatures.js，signature.id 必须在那里有定义。
 * 训练师之门的短说明写进入口面板 compat/client-patches/train-door/TrainDoorEnterPanel.as 的 HINTS 表（改后用 build-train-door-hints.cjs 重编）。
 * 同时把同一段 hint 和体力写进 SPT 面板源码 compat/client-patches/spt-all-bosses/SptPanel.as 的 BOSSES 表（改后用 build-spt-panel.cjs 重编面板）。
 * 用法：node scripts/build-boss-signatures.cjs [--check]
 */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const file = path.join(root, 'deploy/baseline/app/config/data/json/boss_abilities.json');
const signatureSource = fs.readFileSync(path.join(root, 'deploy/baseline/app/dist/GameServer/Game/Battle/BossSignatures.js'), 'utf8');

const LIFE = ['sameLifeDeath'];
const BOSSES = {
  // ---------- 第一批：早期 SPT ----------
  '40/0': {
    name: '阿克希亚',
    mechanics: {signature: {id: 'coldSnap', threshold: 3, might: 120}, tacticalAI: true, immune: LIFE, ohkoImmune: true},
    hint: '【寒意】每回合寒意+1，满3层时出战精灵被冻住一回合并冻伤。火系技能命中或更换精灵可清空寒意。',
  },
  '27/0': {
    name: '提亚斯',
    mechanics: {signature: {id: 'gale', dodge: 50, bonus: 20, might: 150}, startStages: [0, 0, 0, 0, 2, 0], tacticalAI: true, immune: LIFE},
    hint: '【疾风对决】出场速度+2。它先出手的回合有50%几率闪开你的攻击（必中技能除外）；你先出手的回合它不闪避，受到的伤害+20%。',
  },
  '32/0': {
    name: '雷伊',
    hp: 4500,
    mechanics: {signature: {id: 'thunderCharge', max: 5, perLayer: 20, skillId: 10176, might: 120}, lowHpCritPercent: 40, tacticalAI: true, statusImmune: true, immune: LIFE},
    hint: '【蓄雷】每回合蓄1层雷电，满5层放出瞬雷天闪，每层伤害+20%。先制技能命中减1层，地面系技能命中清空。技能先制+2，体力低于40%时必定致命一击，免疫异常。',
  },
  '106/0': {
    name: '纳多雷',
    abilities: [{id: 2041, args: [100]}],
    mechanics: {signature: {id: 'sandArmor', max: 4, perLayer: 10, might: 200}, tacticalAI: true, immune: LIFE},
    hint: '【沙甲】每回合加1层沙甲，最多4层，每层让它受到的伤害-10%。连击技能每段剥1层，致命一击清空全部。每回合恢复100体力。',
  },
  '49/0': {
    name: '雷纳多',
    mechanics: {signature: {id: 'statCopy', every: 3, burn: 5, might: 115}, tacticalAI: true, immune: LIFE},
    hint: '【属性复制】每3回合复制你出战精灵的全部能力提升。体力降到一半后进入过载：每回合特攻+1，同时自损5%体力。',
  },
  '325/0': {
    name: '奈尼芬多',
    mechanics: {signature: {id: 'mindMirror', reduce: 70, might: 120}, startStages: [0, 0, 1, 1, 1, 0], tacticalAI: true, immune: LIFE},
    hint: '【念力镜】记住上一次受到的是物理还是特殊攻击，再受到同一类攻击时伤害-70%。物理、特殊交替出手。出场特攻、特防、速度+1。',
  },
  '59/0': {
    name: '远古鱼龙',
    hp: 7000,
    abilities: [2010, {id: 1905}],
    mechanics: {signature: {id: 'tide', heal: 300, ebbBonus: 50, skillId: 10848, might: 80}, tacticalAI: true, statusImmune: [1, 2, 5], immune: LIFE},
    hint: '【潮汐】三回合一循环：涨潮回合末回复300体力；满潮必定放出必中的滔天龙汲水；退潮不回血，受到的伤害+50%。免疫中毒、烧伤、冻伤。',
  },
  '16/0': {
    name: '上古炎兽',
    hp: 6500,
    abilities: [2010],
    mechanics: {signature: {id: 'furnace', max: 5, scorch: 3, blastPercent: 160, skillId: 10984, might: 85}, tacticalAI: true, statusImmune: [2], immune: LIFE},
    hint: '【熔炉】温度每回合+1。到3级后每回合灼伤出战精灵1/8体力；到5级放出伤害+60%的苍炎日无极，然后归零。水系技能命中降2级，冰系技能命中或致命一击降1级。',
  },
  '13/0': {
    name: '始祖灵兽',
    hp: 7500,
    mechanics: {signature: {id: 'roots', replant: 3, healPercent: 5}, tacticalAI: true, statusImmune: [1, 3], immune: LIFE},
    hint: '【共生根须】根须缠住出战精灵，每回合吸取它1/8体力，自己回复5%体力。更换精灵或火系技能命中可摆脱，3回合后根须重新缠上。',
  },
};

// ---------- 第二批：训练师之门 ----------
// 普通 102/2xx 与勇者 102/3xx 用同一条规则，勇者参数加码一档；勇者取消原来的「双命 + 全能力+1 + 先制」模板。
// door 是入口面板 TrainDoorEnterPanel 的短说明，hint 是 SPT 面板与挑战提示的完整说明。
const GATES = [
  {param2: 201, name: '塔奇多克', id: 'vines', normal: {drainDiv: 16, speedDown: 1}, brave: {drainDiv: 12, speedDown: 1},
    door: c => `被命中会被藤蔓缠住，每回合降速、被吸1/${c.drainDiv}体力；先制技能或换精灵挣脱。`,
    hint: c => `【藤蔓缠绕】被它命中的精灵会被藤蔓缠住，每回合速度-${c.speedDown}、被吸取1/${c.drainDiv}体力给它回血。先制技能命中或更换精灵可以挣脱。`},
  {param2: 202, name: '火噜噜', id: 'rage', normal: {max: 5, perLayer: 15, skillId: 12359}, brave: {max: 5, perLayer: 20, skillId: 12359},
    door: c => `每挨一下怒气+1，每层火系伤害+${c.perLayer}%，满5层砸出怒焰火锤后清空。`,
    hint: c => `【怒焰】每受到一次攻击怒气+1（最多5层），每层让它的火系伤害+${c.perLayer}%；怒气满时放出怒焰火锤并清空。出手次数少、单发高更划算。`},
  {param2: 203, name: '查德洛', id: 'barrier', normal: {reduce: 50}, brave: {reduce: 60},
    door: c => `念力屏障：你先出手时伤害-${c.reduce}%，后出手全额，慢速重炮手的舞台。`,
    hint: c => `【念力屏障】你先出手打它时伤害-${c.reduce}%，后出手时全额。慢速高攻的精灵更好打。`},
  {param2: 204, name: '多尔尼', id: 'toxin', normal: {stages: [16, 8, 4]}, brave: {stages: [12, 6, 3]},
    door: c => `被命中会中剧毒，毒伤从1/${c.stages[0]}起每回合翻倍；换下精灵重置倍数，毒不会解。`,
    hint: c => `【剧毒】被它命中的精灵身中剧毒，毒伤从1/${c.stages[0]}体力起每回合翻倍，最高1/${c.stages[c.stages.length - 1]}；剧毒不会致死。更换精灵会重置倍数，但毒不会解。`},
  {param2: 205, name: '加耶罗', id: 'float', normal: {skillId: 12464, every: 4, turns: 2}, brave: {skillId: 12464, every: 3, turns: 2},
    door: c => `每${c.every}回合放浮空连击，被浮空的精灵${c.turns}回合内物理技能落空。`,
    hint: c => `【浮空】第1回合起每${c.every}回合放出浮空连击，被击中的精灵${c.turns}回合内物理技能都会落空。带特殊技能，或在它放招前换下精灵。`},
  {param2: 206, name: '岩锤怪', id: 'smash', normal: {skillId: 12532, every: 3, maxPerHammer: 3, lethalAt: -6}, brave: {skillId: 12532, every: 3, maxPerHammer: 3, lethalAt: -5},
    door: c => `每${c.every}回合放疯狂连锤，每段让你防御-1，降到${c.lethalAt}时下一击必杀；换精灵清除。`,
    hint: c => `【碎甲连锤】每${c.every}回合使出疯狂连锤，每命中一段让出战精灵防御-1（每次最多-${c.maxPerHammer}）；防御降到${c.lethalAt}时它的下一击必定击倒。更换精灵即可清除。`},
  {param2: 207, name: 'LYN', id: 'suppress', normal: {threshold: 300, accDown: 20}, brave: {threshold: 450, accDown: 30},
    door: c => `每回合要对它打出${c.threshold}伤害，否则下回合被压制：必后手、命中-${c.accDown}%。`,
    hint: c => `【火力压制】某回合你对它造成的伤害不足${c.threshold}，下回合你必定后出手、攻击命中-${c.accDown}%。不要空过回合。`},
  {param2: 208, name: '达克其', id: 'abyss', normal: {healPercent: 30, atk: 1}, brave: {healPercent: 40, atk: 1},
    door: c => `每击倒你一只精灵，它回复${c.healPercent}%体力、攻击+${c.atk}；残血精灵要及时撤下。`,
    hint: c => `【灵魂深渊】每击倒你一只精灵，它回复${c.healPercent}%体力、攻击+${c.atk}。残血精灵及时撤下，不要送。`},
  {param2: 209, name: '菲尔洛', id: 'iceLock', normal: {turns: 2}, brave: {turns: 3},
    door: c => `你用过的技能会被冰封${c.turns}回合，冰封中使用会落空；至少要有三招可用。`,
    hint: c => `【冰封技能】你刚用过的技能会被冰封${c.turns}回合，冰封中使用会落空。需要轮换着用技能。`},
  {param2: 210, name: '卡莱洛', id: 'blind', normal: {miss: 50, bonus: 30}, brave: {miss: 60, bonus: 25},
    door: c => `奇数回合强光，你的攻击命中-${c.miss}%；偶数回合过曝，它受伤+${c.bonus}%。`,
    hint: c => `【致盲闪光】奇数回合强光刺眼，你的攻击命中-${c.miss}%（必中技能除外）；偶数回合它过曝，受到的伤害+${c.bonus}%。强化、回复放在奇数回合。`},
  {param2: 211, name: '哈尼卡', id: 'scaleRage', normal: {turns: 2, atk: 2, def: 2}, brave: {turns: 3, atk: 2, def: 1},
    door: c => `被致命一击或克制属性命中会激怒${c.turns}回合：攻击+${c.atk}、防御-${c.def}。`,
    hint: c => `【逆鳞】被致命一击或克制属性命中后激怒${c.turns}回合，攻击+${c.atk}、防御-${c.def}。可以趁它防御下降猛攻，也可以避开它的暴怒期。`},
  {param2: 212, name: '瓦尔普', id: 'formless', normal: {step: 25, floor: 40}, brave: {step: 30, floor: 40},
    door: c => `同一属性连续打它，伤害逐次-${c.step}%（最低${c.floor}%），换属性恢复。`,
    hint: c => `【无相】同一属性的技能连续命中它，伤害逐次-${c.step}%（最低${c.floor}%）；换一种属性立即恢复全额。配招要覆盖多种属性。`},
  {param2: 213, name: '佩吉克', id: 'battery', normal: {capacity: 12, down: 2, downBonus: 60}, brave: {capacity: 14, down: 2, downBonus: 50},
    door: c => `电量${c.capacity}格，出招耗电；耗尽后瘫痪${c.down}回合，受伤+${c.downBonus}%。`,
    hint: c => `【蓄电池】电量${c.capacity}格，大招耗4、中招耗2、小招耗1。电量耗尽后瘫痪${c.down}回合，不能行动、受到的伤害+${c.downBonus}%，之后重新充满。前几回合稳住，瘫痪时集火。`},
  {param2: 214, name: '弗洛斯', id: 'starSlot', normal: {boost: 150, other: 80}, brave: {boost: 140, other: 70},
    door: c => `每回合点亮你的一个技能位：该位伤害×${c.boost / 100}，其余×${c.other / 100}。`,
    hint: c => `【星光位】每回合预告你技能栏的一个位置：该位技能对它的伤害×${c.boost / 100}，其余×${c.other / 100}。看战报里的预告选招，四个技能都要有用。`},
  {param2: 215, name: '威里特', id: 'bloodlust', normal: {perTenth: 10}, brave: {perTenth: 12},
    door: c => `体力每损失10%，暴击率+${c.perTenth}%；压到四成左右后一波带走。`,
    hint: c => `【喋血】体力每损失10%，它的暴击率+${c.perTenth}%。越打越危险，留好爆发，压低后一口气打完。`},
  {param2: 216, name: '普兰特', id: 'chaosGreen', normal: {fieldTurns: 3, confuseTurns: 2, bonus: 50}, brave: {fieldTurns: 2, confuseTurns: 2, bonus: 50},
    door: c => `精灵连续在场${c.fieldTurns}回合会混乱；它对身负异常的精灵伤害+${c.bonus}%。`,
    hint: c => `【混沌绿光】你的精灵连续在场${c.fieldTurns}回合就会陷入混乱${c.confuseTurns}回合；它对身负异常的精灵伤害+${c.bonus}%。勤换精灵，或带解除异常的手段。`},
  {param2: 217, name: '帕里斯', id: 'beastForm', normal: {shadowOut: 140, shadowIn: 125, waterIn: 75, regen: 4}, brave: {shadowOut: 150, shadowIn: 125, waterIn: 65, regen: 3},
    door: c => `物理打中它变暗影形态（伤害高、怕打），特殊打中变水之形态（耐打、回血）。`,
    hint: c => `【兽神双形态】被物理攻击打中后化为暗影形态：伤害+${c.shadowOut - 100}%、受伤+${c.shadowIn - 100}%；被特殊攻击打中后化为水之形态：受伤-${100 - c.waterIn}%、每回合回复${c.regen}%体力。形态由你的出招决定。`},
];
// 难度：might 为 BOSS 攻击伤害百分比，hp 为体力；用 spt-boss-lab.cjs 校准模式标定
// 普通门按「同级、每项学习力 128、六只、12 瓶药」标定；勇者按「100 级、满学习力」标定
const GATE_TUNING = {normal: {might: 100}, brave: {might: 100, hp: 8000, dualHp: 8000}};
const GATE_MIGHT = {
  201: [65, 45], 202: [100, 85], 203: [150, 190], 204: [70, 60], 205: [100, 115], 206: [50, 40], 207: [50, 55], 208: [115, 85],
  209: [115, 85], 210: [95, 98], 211: [80, 90], 212: [38, 35], 213: [170, 120], 214: [110, 95], 215: [45, 80], 216: [50, 35], 217: [60, 55],
};
for (const gate of GATES) gate.tuning = {normal: {might: GATE_MIGHT[gate.param2][0]}, brave: {might: GATE_MIGHT[gate.param2][1]}};
const doorHints = {};
for (const gate of GATES) {
  for (const brave of [false, true]) {
    const c = brave ? gate.brave : gate.normal, param2 = gate.param2 + (brave ? 100 : 0);
    const tuning = {...(brave ? GATE_TUNING.brave : GATE_TUNING.normal), ...(gate.tuning?.[brave ? 'brave' : 'normal'] || {})};
    const dual = gate.param2 >= 216;
    BOSSES['102/' + param2] = {
      name: gate.name,
      abilities: [2010],
      ...(brave ? {hp: tuning.hp ? (dual ? tuning.dualHp : tuning.hp) : undefined} : {}),
      mechanics: {signature: {id: gate.id, ...c, ...(tuning.might !== 100 ? {might: tuning.might} : {})}, tacticalAI: true, immune: LIFE, ...(brave ? {ohkoImmune: true} : {})},
      hint: brave ? gate.hint(c).replace(/^【/, '【勇者·') : gate.hint(c),
    };
    doorHints[param2] = gate.door(c);
  }
}

// ---------- 第三批：暗黑武斗场（110/…） ----------
// 去掉通用的护体、暗黑侵蚀光环、回血、半血觉醒和开场强化；终阶保留两条命，第二条命由 signature 的 s.second 切换规则。
const DARK_BASE = {tacticalAI: true, statusImmune: [1, 2, 3, 5], immune: LIFE, ohkoImmune: true};
const DARK = {
  0: {name: '卡特斯', sig: {id: 'sacrifice', selfPercent: 10, bonus: 50, finalAt: 20},
    hint: '【舍身】每次攻击自损10%当前体力，伤害+50%。体力低于20%后，下一击必中并必定击倒出战精灵，之后它只剩1体力。可以在它跌破20%前一口气打完，或换上替身接这一击。'},
  1000: {name: '魔牙鲨', sig: {id: 'bloodScent', below: 50, bonus: 30},
    hint: '【血腥味】你的出战精灵体力低于50%时，它必定先手、伤害+30%。及时回血，或换上满血的精灵。'},
  1006: {name: '贝鲁基德', hp: 5000, sig: {id: 'overheat', max: 4, coolBonus: 50},
    hint: '【过热】每用一次火系技能过热+1，满4层后下回合冷却：不行动，受到的伤害+50%。冷却回合集中爆发。'},
  1012: {name: '巴弗洛', sig: {id: 'requiem', every: 3, delay: 3, skillId: 20215},
    hint: '【镇魂歌】第1回合起每3回合给出战精灵唱镇魂歌，3回合后的回合结束时它会倒下；在那之前换下精灵即可解除。'},
  1013: {name: '奇拉塔顿', sig: {id: 'quake', div: 8},
    hint: '【震波】它的地面技能命中后再震伤出战精灵1/8体力，速度-1。飞行系精灵不受影响；换精灵可清除降速。'},
  1018: {name: '西萨拉斯', sig: {id: 'staticCharge', max: 3, blastPercent: 200, skillId: 10111},
    hint: '【电荷】你每用一次特殊攻击，它充能1层；满3层放出必中、伤害翻倍的雷神。多用物理攻击，或在满层时换上抗电的精灵。'},
  1019: {name: '克林卡修', sig: {id: 'gems', defCut: 30, atkBonus: 40},
    hint: '【宝石】带着防御（受伤-30%）、速度（必定先手）、攻击（伤害+40%）三颗宝石，按这个顺序碎裂：体力每降25%碎一颗，被致命一击也碎一颗。'},
  1024: {name: '卡库', sig: {id: 'allIn', bonus: 50, lowAt: 30},
    hint: '【破釜沉舟】双方造成的伤害都+50%。体力低于30%时，下回合放出一次先手必暴的绝招。拼输出，留一只精灵接绝招。'},
  1025: {name: '赫德卡', sig: {id: 'turret', every: 2, cannonOut: 40, cannonIn: 30, wallCut: 60},
    hint: '【攻防切换】每2回合切换形态：炮台形态伤害+40%、受到的伤害+30%；铁壁形态不攻击，受到的伤害-60%。铁壁回合回血、强化，炮台回合猛攻。'},
  1026: {name: '伊兰罗尼', sig: {id: 'hexagram', max: 6, percent: 50, breakType: 11},
    hint: '【六芒星】每回合点亮一颗星，满6颗时对出战精灵造成50%最大体力的伤害后重置。致命一击或战斗系技能命中熄灭一颗；爆发前也可以换上体力多的精灵。'},
  1030: {name: '斯加尔卡', sig: {id: 'timeBomb', delay: 2, percent: 40, fixed: 600},
    hint: '【定时炸弹】给出战精灵挂上炸弹，2回合后爆炸，扣40%最大体力。爆炸前换精灵，炸弹会转到换上的精灵身上，改为固定600伤害。体力多的精灵扛百分比，体力少的扛固定伤害更亏。'},
  1031: {name: '艾尔伊洛', sig: {id: 'dissociate'},
    hint: '【星体解离】你出战精灵的攻击与特攻、防御与特防互相对调，换上的精灵同样对调。带两种攻击都有的精灵，或改用另一类招式。'},
  1032: {name: '布林克克', panelLoc: '暗黑武斗场·第6门', sig: {id: 'acidRain', max: 4},
    hint: '【酸雨】每回合交替腐蚀双方的防御、特防，每级让对应伤害+50%（最多4级），不受强化、消强影响。越拖双方越脆，比的是爆发。'},
  1036: {name: '魔花使者', sig: {id: 'bloom', heal: 150, breakAt: 800},
    hint: '【魔花绽放】体力降到75%、50%、25%时各开一朵花，每朵每回合回复150体力。单次伤害达到800击碎一朵。'},
  1037: {name: '莫尔加斯', sig: {id: 'sandstorm', miss: 25},
    hint: '【沙尘暴】你的攻击命中-25%。必中技能和地面系精灵不受影响。'},
  1038: {name: '萨诺拉斯', sig: {id: 'wildfire', max: 4, div: 16},
    hint: '【燎原】被它的火系攻击命中会留下火种，每层每回合扣1/16体力，最多4层，不会自己熄灭。水系精灵不会着火，上场时熄灭全队的火种。'},
  1042: {name: '帕多尼', sig: {id: 'concert', program: [10730, 10729, 11634, 10726], encoreSkillId: 10729, encoreTurns: 2},
    hint: '【演奏会】按固定曲目循环出招：摇篮曲→安可曲→黑暗狂响曲→十万分贝。被安可曲命中后，接下来2回合只能重复上一招（换精灵摆脱），所以安可曲前一回合要用对招。'},
  1043: {name: '加洛德', sig: {id: 'overgrowth', hp: 300, atk: 5, max: 8},
    hint: '【超能生长】每回合最大体力+300并回复300、伤害+5%，最多8档。被降低能力的回合不生长，并缩回一档。'},
  1044: {name: '萨多拉尼', sig: {id: 'mirrors', max: 2, every: 4},
    hint: '【镜影】带着2个镜像，你的攻击有一定几率打中镜像（2个时三分之二，1个时一半），打中一次碎一个；连击技能打碎全部镜像并命中本体。每4回合补满。'},
  1066: {name: '布林克克', panelLoc: '暗黑武斗场·第12门', lives: true, sig: {id: 'acidTide', max: 4},
    hint: '【酸雨·暴走】两条命。第一条命：每回合交替腐蚀双方的防御、特防，每级让对应伤害+50%（最多4级）。第二条命：混沌潮汐，每回合结束时双方的能力等级正负反转，强化会变成削弱。'},
  1048: {name: '迪普利德', lives: true, sig: {id: 'belt', skillId: 11892, turns: 3, drain: 5},
    hint: '【黑色束带】两条命。被黑色束带命中的精灵3回合内不能换下，每回合特防-1。第二条命起，束带还会每回合吸取5%体力。'},
  1049: {name: '拜洛亚斯', lives: true, sig: {id: 'breakBlade', cut: 20, floor: 40},
    hint: '【破兵】两条命。它每命中一次，你刚用的攻击技能本场威力-20（最低四成）。轮换技能。第二条命起，它每回合必定先手。'},
  1050: {name: '阿克诺亚', lives: true, sig: {id: 'frostRule', freezeChance: 30, stormChance: 30},
    hint: '【冰冷支配】两条命。它的冰系攻击命中时30%几率冻伤，被冻伤的精灵每回合使出的技能随机。第二条命起，每回合结束时还有30%几率冻伤出战精灵。带解冻手段，或技能栏只放好招。'},
  1054: {name: '鳞甲魔鱼', lives: true, sig: {id: 'scales', percent: 8},
    hint: '【鳞甲】两条命。第一条命：单次伤害低于它最大体力8%会被弹开，要用高威力、克制或致命一击打穿。第二条命鳞甲剥落：门槛消失，它的攻击、速度+2。'},
  1055: {name: '艾斯德克', lives: true, sig: {id: 'echo', secondPercent: 200},
    hint: '【念刃回响】两条命。它会在下回合用自己的能力回放你上回合用的攻击技能。用属性技能或它抗性的招式过渡。第二条命起回放伤害加倍。'},
  1056: {name: '狂狮迪卡', lives: true, sig: {id: 'meteor', every: 3, every2: 2, percent: 50},
    hint: '【陨星】两条命。每3回合结束时陨星落地，扣出战精灵50%最大体力；那回合使用属性技能伤害减半。第二条命起每2回合一次，它的攻击、特攻+2。'},
};
// 难度：BOSS 攻击伤害百分比，用 spt-boss-lab.cjs 校准模式标定
// 按「同级、每项学习力 128、六只、12 瓶药」标定到胜率 87~100%、平均阵亡 1~3；巴弗洛实验室不会躲镇魂歌，取偏高值
const DARK_MIGHT = {
  0: 58, 1000: 129, 1006: 193, 1012: 58, 1013: 153, 1018: 105, 1019: 58, 1024: 105, 1025: 105, 1026: 58, 1030: 105, 1031: 105, 1032: 34,
  1066: 34, 1036: 105, 1037: 129, 1038: 129, 1042: 46, 1043: 82, 1044: 46, 1048: 22, 1049: 82, 1050: 58, 1054: 82, 1055: 105, 1056: 29,
};
for (const [param2, spec] of Object.entries(DARK)) {
  const might = DARK_MIGHT[param2] ?? 100;
  BOSSES['110/' + param2] = {
    name: spec.name,
    panelLoc: spec.panelLoc,
    hp: spec.hp,
    mechanics: {signature: {...spec.sig, ...(might !== 100 ? {might} : {})}, ...(spec.lives ? {extraLives: 1} : {}), ...DARK_BASE},
    hint: spec.hint,
  };
}

// ---------- 第四批：星系霸主 ----------
// 去掉通用的护体、领域光环、半血觉醒、开场强化、闪避和低血必暴；保留异常免疫、同生共死免疫、秒杀免疫，罗德利斯保留两条命，布莱克保留单挑。
const STAR_BASE = {tacticalAI: true, statusImmune: [1, 2, 3, 5], immune: LIFE, ohkoImmune: true};
const STAR = {
  '348/0': {name: '塔克林', sig: {id: 'dragonAwe', down: 1},
    hint: '【龙威】每回合结束时，出战精灵的攻击、特攻中较高的一项-1。换精灵重置，也可以用解除弱化的技能。'},
  '348/3': {name: '塞维尔', sig: {id: 'undying', turns: 3, atk: 2, healPercent: 20},
    hint: '【不灭意志】第一次被打到濒死时撑住：3回合内攻击伤害无效、攻击+2。这3回合没击倒任何精灵，它就力竭倒下；击倒了则回复20%体力继续战斗。'},
  '331/0': {name: '冰洛伏特', sig: {id: 'dimensionIce', every: 4, skillId: 11255},
    hint: '【次元冰魄】每4回合使出次元冰魄，伤害等于出战精灵已损失的体力，命中后冻住一回合。放招前把体力回满，或换上满血的精灵。'},
  '405/0': {name: '罗德利斯', lives: true, sig: {id: 'rebirth', stages: 2, burn: 8},
    hint: '【浴火】两条命。第一条命被击倒后浴火重生，攻击、特攻+2，之后每回合结束时自焚8%最大体力。第二条命可以猛攻，也可以守住等它烧尽。'},
  '405/1': {name: '迪尔科特', sig: {id: 'combo', perLayer: 25, max: 6},
    hint: '【连段】连续命中会叠连段，每层伤害+25%（最多6层）。被你先出手命中，或它的攻击落空时连段中断。速度快的精灵更好打。'},
  '438/0': {name: '墨杜萨', sig: {id: 'petrify', turns: 1},
    hint: '【石化凝视】连续两回合使用同一个技能，出战精灵会被石化，下回合无法行动。每回合换着用技能，换精灵也会重新计算。'},
  '401/1': {name: '巴斯特', sig: {id: 'dualArmor', layers: 3, perLayer: 20, regen: 4},
    hint: '【双层装甲】物理、特殊各3层装甲，每层让对应伤害-20%；同类攻击每命中一次剥1层。每4回合结束时各长回1层。集中一种攻击先打穿。'},
  '430/0': {name: '亚伦斯', sig: {id: 'absoluteZero', delay: 5, breakAt: 1200, bonus: 30},
    hint: '【绝对零度】读条5回合，到点冻结出战精灵，直接倒下。读条期间累计造成1200伤害可打断：它下回合被冻住不行动，受到的伤害+30%。'},
  '415/0': {name: '该伊', sig: {id: 'underdog', power: 120, percent: 50},
    hint: '【以小搏大】威力120以上的技能对它伤害减半。多用中等威力、克制属性的技能。'},
  '411/0': {name: '该伊', sig: {id: 'underdog', power: 120, percent: 50},
    hint: '【以小搏大】威力120以上的技能对它伤害减半。多用中等威力、克制属性的技能。'},
  '414/0': {name: '伊特', hp: 8000, sig: {id: 'taproot', heal: 300, step: 100, max: 800}, statusImmune: false,
    hint: '【扎根】每回合结束时回复300体力，之后每回合多回100，最多800。身上有异常时扎根中断，回复量重置。带上能让它中毒、麻痹、睡眠的技能。'},
  '445/0': {name: '卡修斯', sig: {id: 'peakShadow', every: 3, at: 4, loss: 15},
    hint: '【万山绝影】每3回合结束时全能力+1，强化合计达到4级后攻击必中、必定致命一击。每被消除一次强化，它损失15%当前体力。'},
  '486/0': {name: '德拉萨', sig: {id: 'havoc', percent: 6},
    hint: '【浩劫】每回合结束时双方各损失6%最大体力。拖得越久越亏，轮换精灵分摊损失。'},
  '450/0': {name: '迪符特', sig: {id: 'tireless', perLayer: 10},
    hint: '【不知疲倦】每回合攻势+1层，每层伤害+10%，没有上限。体力每降25%清空一次层数和强化。持续压血线，别让它攒层。'},
  '495/0': {name: '斯普林特', sig: {id: 'spinDodge', every: 3, skillId: 10755, bonus: 50},
    hint: '【回旋闪避】每3回合有一个回旋闪避回合，你的攻击全部落空，那回合用强化、回复。你的攻击打空后，它的下一击用破绽打击，伤害+50%。'},
  '9507/0': {name: '布莱克', singlePet: true, sig: {id: 'duel', perTier: 15},
    hint: '【决斗】只接受单挑。双方每损失20%体力，伤害+15%。残血时双方都很危险，先压低它的体力。'},
  '441/0': {name: '肯佩德', sig: {id: 'vortex', drainDiv: 10},
    hint: '【漩涡】每回合结束时卷走出战精灵最高的一级强化转给自己；没有强化时吸取1/10体力。别堆强化，或用消强技能清掉它卷走的。'},
  // 剧情 BOSS：没有 SPT 面板，不加异常免疫
  '684/0': {name: '皮特萨罗', story: true, sig: {id: 'screech', max: 3, breakHits: 3, blastPercent: 180, skillId: 12373},
    hint: '【破空长鸣】怒鸣蓄力3回合后放出必中、伤害×1.8的破空长鸣。蓄力期间被命中3次就会打断。首次战胜皮特萨罗可获得它的精元；重复挑战不重复发放精元。'},
  '686/0': {name: '暗夜冰狐', story: true, sig: {id: 'nightVeil', start: 40, step: 10, max: 40},
    hint: '【夜幕】开场闪避40%（必中技能除外），每被命中一次-10%，没被打中的回合+10%。持有火之果后可挑战弱化形态；两种形态共享一次首胜精元。'},
  '686/1': {name: '暗夜冰狐', story: true, sig: {id: 'nightVeil', start: 0, step: 10, max: 40},
    hint: '【夜幕】火之果驱散了夜幕：开场没有闪避，但没被打中的回合闪避+10%（最高40%），每被命中一次-10%。需要持有火之果；两种形态共享一次首胜精元。'},
};
// 难度：BOSS 攻击伤害百分比，用 spt-boss-lab.cjs 校准模式按「同级、每项学习力 128、六只、12 瓶药」标定到胜率 70~97%、平均阵亡 1~3
// 该伊倍率到 247 仍全胜（阵亡 2.2），取 240；暗夜冰狐倍率一高平均阵亡就超过 4，保持 100
const STAR_MIGHT = {
  '348/0': 78, '348/3': 78, '331/0': 35, '405/0': 85, '405/1': 70, '438/0': 130, '401/1': 57, '430/0': 55, '415/0': 240, '411/0': 240,
  '414/0': 220, '445/0': 40, '486/0': 115, '450/0': 100, '495/0': 70, '9507/0': 48, '441/0': 18, '684/0': 190,
};
for (const [key, spec] of Object.entries(STAR)) {
  const might = STAR_MIGHT[key] ?? 100;
  const base = spec.story ? {immune: LIFE} : {...STAR_BASE, ...(spec.statusImmune === false ? {statusImmune: undefined} : {})};
  BOSSES[key] = {
    name: spec.name,
    hp: spec.hp,
    mechanics: JSON.parse(JSON.stringify({signature: {...spec.sig, ...(might !== 100 ? {might} : {})}, ...(spec.lives ? {extraLives: 1} : {}), ...(spec.singlePet ? {singlePet: true} : {}), ...base})),
    hint: spec.hint,
  };
}

const panelFile = path.join(root, 'compat/client-patches/spt-all-bosses/SptPanel.as');
const panelText = fs.readFileSync(panelFile, 'utf8');
const panelMatch = panelText.match(/private const BOSSES:Array = (\[[^\n]*\]);/);
assert.ok(panelMatch, 'SptPanel.as lacks the BOSSES table');
const panelBosses = JSON.parse(panelMatch[1]);
assert.equal('[' + panelBosses.map(b => JSON.stringify(b)).join(',') + ']', panelMatch[1], 'SptPanel BOSSES formatting changed');

const doorFile = path.join(root, 'compat/client-patches/train-door/TrainDoorEnterPanel.as');
const doorText = fs.readFileSync(doorFile, 'utf8');
const doorLine = /private static const HINTS:Object = \{[^\n]*\};/;
assert.match(doorText, doorLine, 'TrainDoorEnterPanel.as lacks the HINTS table');
const nextDoor = doorText.replace(doorLine, () => 'private static const HINTS:Object = ' + JSON.stringify(doorHints) + ';');

const text = fs.readFileSync(file, 'utf8');
const data = JSON.parse(text);
assert.equal(JSON.stringify(data, null, 2) + '\n', text, 'boss_abilities.json formatting changed');
for (const [key, spec] of Object.entries(BOSSES)) {
  const [mapId, param2] = key.split('/').map(Number);
  const matches = data.bossConfigs.filter(b => b.mapId === mapId && b.param2 === param2);
  assert.equal(matches.length, 1, `Expected one boss at ${key}`);
  const boss = matches[0];
  assert.equal(boss.petName, spec.name, `Boss at ${key} is ${boss.petName}`);
  assert.ok(signatureSource.includes(`\n    ${spec.mechanics.signature.id}: {`), `Signature not implemented: ${spec.mechanics.signature.id}`);
  const skillId = spec.mechanics.signature.skillId;
  if (skillId) assert.ok(boss.skills.includes(skillId), `${spec.name} does not have skill ${skillId}`);
  if (spec.abilities) boss.abilities = spec.abilities;
  if (spec.hp) boss.customHP = spec.hp;
  boss.mechanics = spec.mechanics;
  boss.hint = spec.hint;
  if (boss.spt) {
    // 同一只精灵在面板里出现多行时（暗黑门第6、12门的布林克克）按 panelLoc 区分
    const rows = panelBosses.filter(b => b.id === boss.petId && b.sptId === boss.spt.sptId && (!spec.panelLoc || b.loc === spec.panelLoc));
    assert.equal(rows.length, 1, `Expected one SPT panel row for ${spec.name}`);
    rows[0].hp = boss.customHP || 0;
    rows[0].lv = boss.level;
    rows[0].mech = spec.hint;
  }
}
// 奥尔德七个挑战是同一只精灵，面板里七行原来都套用了力量试炼的说明和等级体力；按 sptId 逐行同步 boss_abilities.json 里各自的 hint 与数值
// 真身的完整说明放不下面板，面板用短版
const ALDER_PANEL = {7: '【奥尔德真身】五条命（2千/8千/2万/1.2万/5万）：攻击+2必先手；偷强化；每回合附加异常；PP无限并吸血；PP无限、2倍耗PP、偷强化、免疫瞬杀。'};
for (const boss of data.bossConfigs.filter(b => b.mapId === 677 && b.spt)) {
  const rows = panelBosses.filter(b => b.sptId === boss.spt.sptId);
  assert.equal(rows.length, 1, `Expected one SPT panel row for ${boss.petName}`);
  Object.assign(rows[0], {lv: boss.level, hp: boss.customHP || 0, mech: ALDER_PANEL[boss.param2] || boss.hint});
}
const nextPanel = panelText.replace(panelMatch[1], () => '[' + panelBosses.map(b => JSON.stringify(b)).join(',') + ']');
const next = JSON.stringify(data, null, 2) + '\n';
if (process.argv.includes('--check')) {
  assert.equal(next, text, 'boss_abilities.json is not up to date');
  assert.equal(nextPanel, panelText, 'SptPanel.as BOSSES is not up to date');
  assert.equal(nextDoor, doorText, 'TrainDoorEnterPanel.as HINTS is not up to date');
  console.log(`OK: ${Object.keys(BOSSES).length} boss signatures up to date`);
} else {
  fs.writeFileSync(file, next);
  fs.writeFileSync(panelFile, nextPanel);
  fs.writeFileSync(doorFile, nextDoor);
  console.log(`${next === text && nextPanel === panelText && nextDoor === doorText ? 'Unchanged' : 'Updated'}: ${Object.keys(BOSSES).length} boss signatures`);
}
