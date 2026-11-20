"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const DatabaseManager_1 = require("../../../DataBase/DatabaseManager");
const GameConfig_1 = require("../../../shared/config/game/GameConfig");
const utils_1 = require("../../../shared/utils");
const PetCalculator_1 = require("../Pet/PetCalculator");
const PetPP_1 = require("../Pet/PetPP");
const PetTrait_1 = require("../Pet/PetTrait");
const SptSystem_1 = require("../Pet/SptSystem");

// ============================================================================
// 1. 图鉴里程碑永久光环 (Dex Milestones & Permanent Account Auras)
// ============================================================================
const DEX_MILESTONES = [
    { count: 50, title: "星际见习生", desc: "野外捕捉率 +20%", catchBonus: 0.20, evMult: 1, dv31Rate: 0.15, alphaRate: 0.05, alphaPity: 15, coinExpBonus: 0, dmgBonus: 0 },
    { count: 150, title: "精灵猎手", desc: "战斗学习力获取 ×2", catchBonus: 0.20, evMult: 2, dv31Rate: 0.15, alphaRate: 0.05, alphaPity: 15, coinExpBonus: 0, dmgBonus: 0 },
    { count: 300, title: "融合大师", desc: "元神珠孵化 31 满个体概率翻倍 (30%)", catchBonus: 0.25, evMult: 2, dv31Rate: 0.30, alphaRate: 0.05, alphaPity: 15, coinExpBonus: 0, dmgBonus: 0 },
    { count: 500, title: "霸主克星", desc: "野外31满个体霸主概率翻倍 (10% / 8场保底)", catchBonus: 0.30, evMult: 2, dv31Rate: 0.30, alphaRate: 0.10, alphaPity: 8, coinExpBonus: 0, dmgBonus: 0 },
    { count: 800, title: "星海霸主", desc: "战斗赛尔豆与经验额外 +30%", catchBonus: 0.35, evMult: 2, dv31Rate: 0.35, alphaRate: 0.10, alphaPity: 8, coinExpBonus: 0.30, dmgBonus: 0 },
    { count: 1200, title: "全图鉴传奇", desc: "捕捉+40% / 满个体45% / 全队PVE伤害+10%", catchBonus: 0.40, evMult: 2, dv31Rate: 0.45, alphaRate: 0.12, alphaPity: 6, coinExpBonus: 0.30, dmgBonus: 0.10 },
];

const dexCountCache = new Map(); // userId -> { count, ts }

function ComputeDexAuraFromCount(count) {
    let active = {
        count,
        tier: 0,
        title: "新手赛尔",
        catchBonus: 0,
        evMult: 1,
        dv31Rate: 0.15,
        alphaRate: 0.05,
        alphaPity: 15,
        coinExpBonus: 0,
        dmgBonus: 0,
        unlocked: [],
        next: DEX_MILESTONES[0],
    };
    for (let i = 0; i < DEX_MILESTONES.length; i++) {
        const m = DEX_MILESTONES[i];
        if (count >= m.count) {
            active.tier = i + 1;
            active.title = m.title;
            active.catchBonus = m.catchBonus;
            active.evMult = m.evMult;
            active.dv31Rate = m.dv31Rate;
            active.alphaRate = m.alphaRate;
            active.alphaPity = m.alphaPity;
            active.coinExpBonus = m.coinExpBonus;
            active.dmgBonus = m.dmgBonus;
            active.unlocked.push({ count: m.count, title: m.title, desc: m.desc });
            active.next = DEX_MILESTONES[i + 1] || null;
        }
    }
    return active;
}

async function GetDexCount(userId) {
    const cached = dexCountCache.get(userId);
    const now = Date.now();
    if (cached && now - cached.ts < 30000) return cached.count;
    try {
        const rows = await DatabaseManager_1.DatabaseManager.Instance.Query(
            "SELECT COUNT(*) AS c FROM player_pet_collection WHERE owner_id = ?",
            [userId]
        );
        const count = Number(rows?.[0]?.c || 0);
        dexCountCache.set(userId, { count, ts: now });
        return count;
    } catch {
        return cached?.count || 0;
    }
}

function InvalidateDexCache(userId) {
    dexCountCache.delete(userId);
}

async function GetDexAura(userId) {
    const count = await GetDexCount(userId);
    return ComputeDexAuraFromCount(count);
}

// ============================================================================
// 2. 野外 31 满个体霸主精灵奇遇 (Wild Alpha Encounters)
// ============================================================================
const alphaPityStreak = new Map(); // userId -> number
const PHYS_NATURES = [3, 13]; // 固执 / 开朗 (赛尔号常用物攻极品性格: 3固执/13开朗)
const SPEC_NATURES = [15, 10]; // 保守 / 胆小 (赛尔号常用特攻极品性格: 15保守/10胆小)

async function MaybeMarkWildAlpha(userId, battle) {
    if (!battle || battle.isPvp || battle.bossMapId !== undefined || battle.universeBoss) return false;
    const aura = await GetDexAura(userId);
    const streak = alphaPityStreak.get(userId) || 0;
    const hit = streak + 1 >= aura.alphaPity || Math.random() < aura.alphaRate;
    if (!hit) {
        alphaPityStreak.set(userId, streak + 1);
        return false;
    }
    alphaPityStreak.set(userId, 0);
    battle.isWildAlpha = true;
    battle.enemy.maxHp = Math.max(battle.enemy.maxHp + 10, Math.floor(battle.enemy.maxHp * 1.35));
    battle.enemy.hp = battle.enemy.maxHp;
    battle.alphaNotice = "⚡ 遭遇【31满个体霸主野怪】！捕获必得 31 满个体 + 极品性格 + 先天特性！";
    utils_1.Logger.Info(`[PlayModes] Wild Alpha triggered uid=${userId} petId=${battle.enemy.id} streak=${streak}`);
    return true;
}

async function ApplyWildAlphaCatchBonus(player, catchTime) {
    try {
        const pet = player.PetManager.GetPetByCatchTime(catchTime);
        if (!pet) return null;
        const cfg = GameConfig_1.GameConfig.GetPetById(pet.petId);
        const isPhys = Number(cfg?.Atk || 0) >= Number(cfg?.SpAtk || 0);
        const naturePool = isPhys ? PHYS_NATURES : SPEC_NATURES;
        pet.dv = 31;
        pet.nature = naturePool[Math.floor(Math.random() * naturePool.length)];
        PetCalculator_1.PetCalculator.UpdatePetStats(pet);
        pet.hp = pet.maxHp;
        PetTrait_1.assignInnateTrait(pet);
        await player.PetManager.SavePetData();
        InvalidateDexCache(player.Uid);
        const petName = cfg?.DefName || `#${pet.petId}`;
        const traitId = PetTrait_1.currentTraitId(pet);
        const traitName = traitId ? (GameConfig_1.GameConfig.GetPetAbilityById(traitId)?.name || `#${traitId}`) : "先天特性";
        await sendAlert(player, `⚡ 霸主捕获成功！【${petName}】已自动强化为 31 满个体 + 极品性格 + 特性「${traitName}」！`);
        return pet;
    } catch (e) {
        utils_1.Logger.Error("[PlayModes] ApplyWildAlphaCatchBonus error:", e);
        return null;
    }
}

// ============================================================================
// 3. 持久化表初始化 (Rogue Tower / Trait Crystals / Boss Bounties)
// ============================================================================
let tablesReady = false;
async function ensureTables() {
    if (tablesReady) return;
    const db = DatabaseManager_1.DatabaseManager.Instance;
    await db.Execute(`CREATE TABLE IF NOT EXISTS player_rogue_tower (
        owner_id INTEGER PRIMARY KEY,
        current_floor INTEGER NOT NULL DEFAULT 1,
        best_floor INTEGER NOT NULL DEFAULT 0,
        buffs TEXT NOT NULL DEFAULT '[]',
        pending_choices TEXT NOT NULL DEFAULT '[]',
        updated_at INTEGER NOT NULL DEFAULT 0
    )`);
    await db.Execute(`CREATE TABLE IF NOT EXISTS player_trait_crystals (
        owner_id INTEGER PRIMARY KEY,
        crystals INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
    )`);
    await db.Execute(`CREATE TABLE IF NOT EXISTS player_bounty_clears (
        owner_id INTEGER NOT NULL,
        bounty_id TEXT NOT NULL,
        cleared_at INTEGER NOT NULL,
        PRIMARY KEY (owner_id, bounty_id)
    )`);
    tablesReady = true;
}

async function sendAlert(player, msg) {
    try {
        await require("../Map/ForestMechanisms").SendForestAlert(player, msg);
    } catch (e) {
        utils_1.Logger.Warn("[PlayModes] sendAlert failed:", e?.message || e);
    }
}

async function AddTraitCrystals(userId, amount) {
    if (!amount || amount <= 0) return 0;
    await ensureTables();
    const now = Math.floor(Date.now() / 1000);
    await DatabaseManager_1.DatabaseManager.Instance.Execute(
        `INSERT INTO player_trait_crystals (owner_id, crystals, updated_at) VALUES (?, ?, ?)
         ON CONFLICT(owner_id) DO UPDATE SET crystals = crystals + excluded.crystals, updated_at = excluded.updated_at`,
        [userId, amount, now]
    );
    return GetTraitCrystals(userId);
}

async function SpendTraitCrystals(userId, cost) {
    await ensureTables();
    const cur = await GetTraitCrystals(userId);
    if (cur < cost) return false;
    const now = Math.floor(Date.now() / 1000);
    await DatabaseManager_1.DatabaseManager.Instance.Execute(
        "UPDATE player_trait_crystals SET crystals = crystals - ?, updated_at = ? WHERE owner_id = ?",
        [cost, now, userId]
    );
    return true;
}

async function GetTraitCrystals(userId) {
    await ensureTables();
    const rows = await DatabaseManager_1.DatabaseManager.Instance.Query(
        "SELECT crystals FROM player_trait_crystals WHERE owner_id = ?",
        [userId]
    );
    return Number(rows?.[0]?.crystals || 0);
}

// ============================================================================
// 4. 无尽星际爬塔肉鸽模式 (Endless Rogue Tower)
// ============================================================================
const ROGUE_BUFFS = [
    { id: "atk20", name: "⚡ 疾风突袭", desc: "我方伤害 +20%" },
    { id: "def15", name: "🛡️ 星际护盾", desc: "受到伤害 -15%" },
    { id: "regen12", name: "💚 生命源泉", desc: "每回合末回复 12% 最大HP" },
    { id: "lifesteal20", name: "🌟 吸血寄生", desc: "造成伤害的 20% 回复自身HP" },
    { id: "berserk45", name: "🔥 狂暴输出", desc: "HP低于50%时伤害 +45%" },
    { id: "opener35", name: "🚀 先声夺人", desc: "前2回合我方伤害 +35%" },
    { id: "thorns15", name: "❄️ 铁壁反伤", desc: "受击反弹 15% 伤害给对手" },
    { id: "execute30", name: "💥 斩杀渴望", desc: "对手HP低于40%时伤害 +35%" },
];

const ROGUE_BUFF_MAP = new Map(ROGUE_BUFFS.map(b => [b.id, b]));
let rogueEnemyPool = null;
function getRogueEnemyPool() {
    if (rogueEnemyPool) return rogueEnemyPool;
    const all = GameConfig_1.GameConfig.GetAllPets ? GameConfig_1.GameConfig.GetAllPets() : [];
    const pool = [];
    for (const p of all) {
        const id = Number(p?.ID || p?.id || 0);
        if (id <= 0 || id > 1505) continue;
        const total = Number(p.HP || 0) + Number(p.Atk || 0) + Number(p.Def || 0) + Number(p.SpAtk || 0) + Number(p.SpDef || 0) + Number(p.Spd || 0);
        if (total >= 500 && Number(p.EvolvesTo || 0) === 0) {
            pool.push(id);
        }
    }
    rogueEnemyPool = pool.length ? pool : [70, 261, 216, 300, 348, 392, 419, 450, 502, 587];
    return rogueEnemyPool;
}

async function GetRogueState(userId) {
    await ensureTables();
    const rows = await DatabaseManager_1.DatabaseManager.Instance.Query(
        "SELECT current_floor, best_floor, buffs, pending_choices FROM player_rogue_tower WHERE owner_id = ?",
        [userId]
    );
    if (!rows || !rows[0]) {
        return { currentFloor: 1, bestFloor: 0, buffs: [], pendingChoices: [] };
    }
    let buffs = [];
    let pendingChoices = [];
    try { buffs = JSON.parse(rows[0].buffs || "[]"); } catch {}
    try { pendingChoices = JSON.parse(rows[0].pending_choices || "[]"); } catch {}
    return {
        currentFloor: Math.max(1, Number(rows[0].current_floor || 1)),
        bestFloor: Math.max(0, Number(rows[0].best_floor || 0)),
        buffs: Array.isArray(buffs) ? buffs : [],
        pendingChoices: Array.isArray(pendingChoices) ? pendingChoices : [],
    };
}

async function SaveRogueState(userId, st) {
    await ensureTables();
    const now = Math.floor(Date.now() / 1000);
    await DatabaseManager_1.DatabaseManager.Instance.Execute(
        `INSERT INTO player_rogue_tower (owner_id, current_floor, best_floor, buffs, pending_choices, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(owner_id) DO UPDATE SET
            current_floor = excluded.current_floor,
            best_floor = excluded.best_floor,
            buffs = excluded.buffs,
            pending_choices = excluded.pending_choices,
            updated_at = excluded.updated_at`,
        [userId, st.currentFloor, st.bestFloor, JSON.stringify(st.buffs), JSON.stringify(st.pendingChoices), now]
    );
}

function roll3Choices() {
    const shuffled = [...ROGUE_BUFFS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3).map(b => b.id);
}

async function StartRogueTowerBattle(player) {
    const st = await GetRogueState(player.Uid);
    if (st.pendingChoices.length > 0) {
        // 如果玩家没手动选词条直接开下一层，自动帮选第 1 个，丝滑不卡壳
        st.buffs.push(st.pendingChoices[0]);
        st.pendingChoices = [];
        await SaveRogueState(player.Uid, st);
    }
    const pool = getRogueEnemyPool();
    const enemyId = pool[Math.floor(Math.random() * pool.length)];
    const floor = st.currentFloor;
    const enemyLevel = Math.min(100, 65 + floor * 5);
    const bm = player.BattleManager;
    if (bm._currentBattle) bm.CleanupBattle();
    const battle = await bm._initService.CreatePVEBattle(enemyId, enemyLevel);
    if (!battle) {
        await sendAlert(player, "无法开启无尽爬塔：请确保背包内至少有 1 只存活精灵。");
        return false;
    }
    const hpScale = 1 + (floor - 1) * 0.14;
    battle.enemy.maxHp = Math.floor(battle.enemy.maxHp * hpScale);
    battle.enemy.hp = battle.enemy.maxHp;
    battle.battleType = "BOSS";
    battle.rogueTowerFloor = floor;
    battle.rogueBuffs = [...st.buffs];
    const aura = await GetDexAura(player.Uid);
    battle.dexDmgBonus = aura.dmgBonus || 0;
    const buffDesc = st.buffs.length
        ? st.buffs.map(id => ROGUE_BUFF_MAP.get(id)?.name || id).join(" + ")
        : "暂无词条（首层通过后3选1）";
    battle.alphaNotice = `🌌【无尽星际爬塔 · 第 ${floor} 层】当前词条：${buffDesc}`;
    bm.InitializeBattle(battle);
    await bm.SendReadyToFight(battle, `无尽塔第${floor}层`);
    return true;
}

async function HandleRogueTowerResult(player, battle, won) {
    const floor = Number(battle.rogueTowerFloor || 0);
    if (!floor) return;
    const st = await GetRogueState(player.Uid);
    if (won) {
        const newBest = Math.max(st.bestFloor, floor);
        const choices = roll3Choices();
        st.currentFloor = floor + 1;
        st.bestFloor = newBest;
        st.pendingChoices = choices;
        await SaveRogueState(player.Uid, st);
        const crystals = 2 + Math.floor(floor / 5);
        const coins = 800 + floor * 250;
        const totalCrystals = await AddTraitCrystals(player.Uid, crystals);
        await player.AddCurrency(undefined, coins);
        if (floor >= 10) {
            await UnlockBounty(player, "rogue_10");
        }
        const choiceLines = choices.map((id, idx) => {
            const b = ROGUE_BUFF_MAP.get(id);
            return `${idx + 1}. ${b.name}（${b.desc}）`;
        }).join("  |  ");
        await sendAlert(
            player,
            `🎉 无尽爬塔第 ${floor} 层通关！获得 ${coins} 赛尔豆 + ${crystals} 特性晶石（现有 ${totalCrystals} 颗）。\n请聊天输入 /pick 1 或 2 或 3 选择肉鸽词条，再输入 /tower 挑战第 ${floor + 1} 层：\n${choiceLines}`
        );
    } else {
        const reached = Math.max(0, floor - 1);
        st.bestFloor = Math.max(st.bestFloor, reached);
        st.currentFloor = 1;
        st.buffs = [];
        st.pendingChoices = [];
        await SaveRogueState(player.Uid, st);
        await sendAlert(
            player,
            `💀 无尽爬塔止步于第 ${floor} 层（历史最高：第 ${st.bestFloor} 层）。本轮肉鸽词条已重置，随时输入 /tower 重新开爬！`
        );
    }
}

// ============================================================================
// 5. 战斗伤害与回合末词条/光环计算钩子 (Battle Hooks)
// ============================================================================
function ModifyBattleDamage(battle, attacker, defender, _skill, damage) {
    if (!battle || battle.isPvp || !Number.isFinite(damage) || damage <= 0) return damage;
    let dmg = damage;
    const isPlayerAtk = attacker === battle.player;
    const buffs = Array.isArray(battle.rogueBuffs) ? battle.rogueBuffs : [];
    const countBuff = (id) => buffs.filter(b => b === id).length;

    if (isPlayerAtk) {
        let mult = 1 + (Number(battle.dexDmgBonus || 0));
        mult += countBuff("atk20") * 0.20;
        if (countBuff("berserk45") > 0 && attacker.hp < attacker.maxHp * 0.5) {
            mult += countBuff("berserk45") * 0.45;
        }
        if (countBuff("opener35") > 0 && (battle.roundCount || 0) < 2) {
            mult += countBuff("opener35") * 0.35;
        }
        if (countBuff("execute30") > 0 && defender.hp < defender.maxHp * 0.4) {
            mult += countBuff("execute30") * 0.35;
        }
        dmg = Math.floor(dmg * mult);
        const ls = countBuff("lifesteal20");
        if (ls > 0 && attacker.hp > 0 && attacker.hp < attacker.maxHp) {
            const heal = Math.max(1, Math.floor(dmg * 0.20 * ls));
            attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
        }
    } else if (defender === battle.player) {
        const defCnt = countBuff("def15");
        if (defCnt > 0) {
            dmg = Math.max(1, Math.floor(dmg * Math.pow(0.85, defCnt)));
        }
        const thorns = countBuff("thorns15");
        if (thorns > 0 && attacker.hp > 0) {
            const reflect = Math.max(1, Math.floor(dmg * 0.15 * thorns));
            attacker.hp = Math.max(1, attacker.hp - reflect);
        }
    }
    return Math.max(1, dmg);
}

function OnBattleTurnEnd(battle) {
    if (!battle || battle.isPvp || battle.isOver) return;
    const buffs = Array.isArray(battle.rogueBuffs) ? battle.rogueBuffs : [];
    const regen = buffs.filter(b => b === "regen12").length;
    if (regen > 0 && battle.player && battle.player.hp > 0 && battle.player.hp < battle.player.maxHp) {
        const heal = Math.max(1, Math.floor(battle.player.maxHp * 0.12 * regen));
        battle.player.hp = Math.min(battle.player.maxHp, battle.player.hp + heal);
    }
}

// ============================================================================
// 6. 经典 BOSS 极限赏金挑战 (10 Boss Bounties)
// ============================================================================
const BOUNTIES = [
    { id: "speed_3", name: "⚡ 闪电斩杀", desc: "3回合内击败任意 Lv.60+ BOSS", crystals: 10, coins: 3000 },
    { id: "grass_win", name: "🌿 草木克星", desc: "首发草系精灵击败阿克希亚/纳多雷/里奥斯", crystals: 10, coins: 3000 },
    { id: "solo_boss", name: "🔥 烈焰孤狼", desc: "单宠无阵亡击败任意 Lv.75+ BOSS", crystals: 15, coins: 5000 },
    { id: "full_hp", name: "🛡️ 铜墙铁壁", desc: "胜利时出战精灵剩余HP≥95%击败任意BOSS", crystals: 10, coins: 3000 },
    { id: "underdog", name: "🎯 以弱胜强", desc: "用种族值≤500的精灵击败 Lv.70+ BOSS", crystals: 15, coins: 5000 },
    { id: "hamo_6", name: "💎 龙族试炼", desc: "6回合内击败哈莫雷特", crystals: 20, coins: 8000 },
    { id: "leiyi_pure", name: "⚡ 雷神降临", desc: "不使用瞬杀特性击败雷伊", crystals: 15, coins: 5000 },
    { id: "gaiya_clean", name: "🥊 战神无双", desc: "全队无阵亡击败盖亚", crystals: 15, coins: 5000 },
    { id: "puni_pure", name: "👑 圣灵破壁", desc: "不使用瞬杀特性击败任意谱尼封印/真身", crystals: 25, coins: 10000 },
    { id: "rogue_10", name: "🌌 无尽征服者", desc: "无尽星际爬塔突破第 10 层", crystals: 25, coins: 10000 },
];
const BOUNTY_MAP = new Map(BOUNTIES.map(b => [b.id, b]));

async function GetClearedBounties(userId) {
    await ensureTables();
    const rows = await DatabaseManager_1.DatabaseManager.Instance.Query(
        "SELECT bounty_id, cleared_at FROM player_bounty_clears WHERE owner_id = ?",
        [userId]
    );
    return (rows || []).map(r => ({ id: r.bounty_id, clearedAt: Number(r.cleared_at || 0) }));
}

async function UnlockBounty(player, bountyId) {
    const cfg = BOUNTY_MAP.get(bountyId);
    if (!cfg) return false;
    await ensureTables();
    const existing = await DatabaseManager_1.DatabaseManager.Instance.Query(
        "SELECT 1 FROM player_bounty_clears WHERE owner_id = ? AND bounty_id = ?",
        [player.Uid, bountyId]
    );
    if (existing && existing.length > 0) return false;
    const now = Math.floor(Date.now() / 1000);
    await DatabaseManager_1.DatabaseManager.Instance.Execute(
        "INSERT OR IGNORE INTO player_bounty_clears (owner_id, bounty_id, cleared_at) VALUES (?, ?, ?)",
        [player.Uid, bountyId, now]
    );
    await AddTraitCrystals(player.Uid, cfg.crystals);
    await player.AddCurrency(undefined, cfg.coins);
    await sendAlert(player, `🏅 极限赏金达成！【${cfg.name}】(${cfg.desc}) → 奖励 ${cfg.crystals} 特性晶石 + ${cfg.coins} 赛尔豆！`);
    return true;
}

async function EvaluateBossVictoryBounties(player, battle) {
    if (!battle || battle.isPvp || battle.battleType !== "BOSS" || battle.rogueTowerFloor) return;
    try {
        // 击败任意高阶 BOSS (Lv>=60) 固定奖励 +2 特性晶石
        const enemyLv = Number(battle.enemy?.level || 0);
        if (enemyLv >= 60) {
            await AddTraitCrystals(player.Uid, 2);
        }
        const rounds = Number(battle.roundCount || 0);
        const enemyId = Number(battle.enemy?.id || 0);
        const pPet = battle.player;
        const pCfg = GameConfig_1.GameConfig.GetPetById(pPet?.id || 0);
        const pTotal = pCfg ? (Number(pCfg.HP || 0) + Number(pCfg.Atk || 0) + Number(pCfg.Def || 0) + Number(pCfg.SpAtk || 0) + Number(pCfg.SpDef || 0) + Number(pCfg.Spd || 0)) : 999;
        const bagPets = player.PetManager.GetPetsInBag ? player.PetManager.GetPetsInBag() : [];
        const anyDead = bagPets.some(p => p.hp <= 0);
        const activeModel = player.PetManager.GetPetByCatchTime(pPet?.catchTime || 0);
        const traitId = activeModel ? PetTrait_1.currentTraitId(activeModel) : 0;
        const usedInstantKill = traitId === 1030 || traitId === 1031 || String(GameConfig_1.GameConfig.GetPetAbilityById(traitId)?.name || "").includes("瞬杀");

        if (enemyLv >= 60 && rounds <= 3) await UnlockBounty(player, "speed_3");
        if (Number(pCfg?.Type || 0) === 1 && [67, 113, 34].includes(enemyId)) await UnlockBounty(player, "grass_win");
        if (enemyLv >= 75 && !anyDead) await UnlockBounty(player, "solo_boss");
        if (pPet && pPet.maxHp > 0 && pPet.hp / pPet.maxHp >= 0.95) await UnlockBounty(player, "full_hp");
        if (enemyLv >= 70 && pTotal <= 500) await UnlockBounty(player, "underdog");
        if (enemyId === 216 && rounds <= 6) await UnlockBounty(player, "hamo_6");
        if (enemyId === 70 && !usedInstantKill) await UnlockBounty(player, "leiyi_pure");
        if (enemyId === 261 && !anyDead) await UnlockBounty(player, "gaiya_clean");
        if ((enemyId === 300 || battle.bossMapId === 514) && !usedInstantKill) await UnlockBounty(player, "puni_pure");
    } catch (e) {
        utils_1.Logger.Error("[PlayModes] EvaluateBossVictoryBounties error:", e);
    }
}

// ============================================================================
// 7. 精灵定向特训：免费技能回忆 & 特性晶石定向觉醒 (Chat Commands)
// ============================================================================
function getEvolutionChainLearnSkills(petId) {
    const chain = [];
    const visited = new Set();
    let cur = Number(petId);
    while (cur > 0 && !visited.has(cur)) {
        visited.add(cur);
        chain.push(cur);
        const info = GameConfig_1.GameConfig.GetPetById(cur);
        cur = Number(info?.EvolvesFrom || 0);
    }
    const skillMap = new Map();
    for (const id of chain) {
        const list = SptSystem_1.SptSystem.GetDefaultSkills ? SptSystem_1.SptSystem.GetDefaultSkills(id, 100) : [];
        for (const s of list) {
            const sid = Number(s?.id || s?.ID || 0);
            if (sid > 0 && !skillMap.has(sid)) {
                const cfg = GameConfig_1.GameConfig.GetSkillById(sid);
                skillMap.set(sid, {
                    id: sid,
                    name: cfg?.Name || s?.name || `#${sid}`,
                    power: Number(cfg?.Power || 0),
                });
            }
        }
    }
    return [...skillMap.values()].sort((a, b) => b.power - a.power);
}

function getAllTraits() {
    const list = GameConfig_1.GameConfig.GetAllPetAbilities ? GameConfig_1.GameConfig.GetAllPetAbilities() : [];
    return list.filter(a => {
        const id = Number(a?.abilityId || 0);
        return id >= 1006 && id <= 1045;
    });
}

async function HandleChatCommand(player, rawMsg) {
    const msg = String(rawMsg || "").trim();
    if (!msg.startsWith("/") && !msg.startsWith("／")) return false;
    const normalized = msg.replace(/^／/, "/");
    const parts = normalized.slice(1).trim().split(/\s+/);
    const cmd = (parts[0] || "").toLowerCase();
    const arg1 = parts[1] || "";
    const arg2 = parts[2] || "";

    if (cmd === "help" || cmd === "菜单" || cmd === "帮助") {
        await sendAlert(
            player,
            "🌟【星际创新玩法快捷指令】\n" +
            "• /tower（或 /爬塔）：开启/继续无尽星际爬塔\n" +
            "• /pick 1~3（或 /选 1~3）：选择战后3选1肉鸽词条\n" +
            "• /skills（或 /技能）：查看首发精灵全部可回忆历史技能\n" +
            "• /learn 技能ID [槽位1-4]：免费回忆/替换首发精灵技能\n" +
            "• /trait [特性名或ID]（或 /特性）：花5颗晶石定向觉醒特性\n" +
            "• /aura（或 /光环）：查看图鉴永久光环与晶石/赏金进度"
        );
        return true;
    }

    if (cmd === "aura" || cmd === "光环" || cmd === "bounty" || cmd === "赏金") {
        const aura = await GetDexAura(player.Uid);
        const crystals = await GetTraitCrystals(player.Uid);
        const rogue = await GetRogueState(player.Uid);
        const cleared = await GetClearedBounties(player.Uid);
        const nextStr = aura.next ? `下一档需 ${aura.next.count} 只（${aura.next.desc}）` : "已达全图鉴传奇满档！";
        await sendAlert(
            player,
            `🏆 称号【${aura.title}】｜图鉴 ${aura.count} 只（${nextStr}）\n` +
            `✨ 当前光环：捕捉+${Math.round(aura.catchBonus * 100)}%｜学习力×${aura.evMult}｜满个体孵化${Math.round(aura.dv31Rate * 100)}%｜豆/经验+${Math.round(aura.coinExpBonus * 100)}%\n` +
            `🌌 无尽爬塔：当前第 ${rogue.currentFloor} 层 / 历史最高第 ${rogue.bestFloor} 层\n` +
            `💎 特性晶石：${crystals} 颗｜🏅 极限赏金已达成：${cleared.length} / ${BOUNTIES.length}`
        );
        return true;
    }

    if (cmd === "tower" || cmd === "爬塔") {
        await StartRogueTowerBattle(player);
        return true;
    }

    if (cmd === "pick" || cmd === "选") {
        const idx = Number(arg1) - 1;
        const st = await GetRogueState(player.Uid);
        if (!st.pendingChoices.length) {
            await sendAlert(player, "当前没有待选词条，请先输入 /tower 挑战下一层！");
            return true;
        }
        if (!Number.isInteger(idx) || idx < 0 || idx >= st.pendingChoices.length) {
            await sendAlert(player, "请输入 /pick 1、/pick 2 或 /pick 3 选择词条！");
            return true;
        }
        const chosenId = st.pendingChoices[idx];
        st.buffs.push(chosenId);
        st.pendingChoices = [];
        await SaveRogueState(player.Uid, st);
        const b = ROGUE_BUFF_MAP.get(chosenId);
        await sendAlert(player, `✅ 已装备肉鸽词条：${b?.name || chosenId}（${b?.desc || ""}）！输入 /tower 立即挑战第 ${st.currentFloor} 层！`);
        return true;
    }

    if (cmd === "skills" || cmd === "技能") {
        const lead = player.PetManager.GetDefaultPet ? player.PetManager.GetDefaultPet() : player.PetManager.GetPetsInBag()?.[0];
        if (!lead) {
            await sendAlert(player, "请先将需要回忆技能的精灵设为背包首发！");
            return true;
        }
        const cfg = GameConfig_1.GameConfig.GetPetById(lead.petId);
        const skills = getEvolutionChainLearnSkills(lead.petId);
        const preview = skills.slice(0, 14).map(s => `${s.id}:${s.name}(${s.power})`).join("，");
        await sendAlert(
            player,
            `🧬【${cfg?.DefName || "#" + lead.petId}】全进化链可回忆技能（共${skills.length}个，按威力排序）：\n${preview}\n输入 /learn 技能ID [槽位1-4] 即可免费学习！`
        );
        return true;
    }

    if (cmd === "learn" || cmd === "回忆") {
        const lead = player.PetManager.GetDefaultPet ? player.PetManager.GetDefaultPet() : player.PetManager.GetPetsInBag()?.[0];
        if (!lead) {
            await sendAlert(player, "请先将需要回忆技能的精灵设为背包首发！");
            return true;
        }
        const skillId = Number(arg1);
        const skills = getEvolutionChainLearnSkills(lead.petId);
        const target = skills.find(s => s.id === skillId);
        if (!target) {
            await sendAlert(player, `技能 #${arg1 || "?"} 不在该精灵进化链学习池中，请先输入 /skills 查看可用技能ID。`);
            return true;
        }
        if (!Array.isArray(lead.skillArray)) lead.skillArray = [];
        if (lead.skillArray.includes(skillId)) {
            await sendAlert(player, `首发精灵已经装备了「${target.name}」！`);
            return true;
        }
        const slot = arg2 ? Math.max(1, Math.min(4, Number(arg2) || 4)) - 1 : (lead.skillArray.length < 4 ? lead.skillArray.length : 3);
        lead.skillArray[slot] = skillId;
        lead.skillPP = PetPP_1.ReconcilePetPP(lead);
        await player.PetManager.SavePetData();
        const cfg = GameConfig_1.GameConfig.GetPetById(lead.petId);
        await sendAlert(player, `✅【${cfg?.DefName || "#" + lead.petId}】已免费回忆技能「${target.name}」至第 ${slot + 1} 技能格！（重开精灵背包可见）`);
        return true;
    }

    if (cmd === "trait" || cmd === "特性") {
        const crystals = await GetTraitCrystals(player.Uid);
        const traits = getAllTraits();
        if (!arg1) {
            const topNames = traits.slice(0, 16).map(t => `${t.abilityId}:${t.name}`).join("、");
            await sendAlert(
                player,
                `💎 当前特性晶石：${crystals} 颗（每次定向觉醒消耗 5 颗；打 Lv.60+ BOSS 与无尽爬塔掉落）\n常用特性：${topNames}\n输入 /trait 特性名或ID（如 /trait 瞬杀 或 /trait 会心）即可给首发精灵定向觉醒！`
            );
            return true;
        }
        const lead = player.PetManager.GetDefaultPet ? player.PetManager.GetDefaultPet() : player.PetManager.GetPetsInBag()?.[0];
        if (!lead) {
            await sendAlert(player, "请先将目标精灵设为背包首发！");
            return true;
        }
        const match = traits.find(t => String(t.abilityId) === arg1 || String(t.name || "").includes(arg1));
        if (!match) {
            await sendAlert(player, `未找到特性「${arg1}」，请输入 /trait 查看可用特性名称或 ID。`);
            return true;
        }
        if (crystals < 5) {
            await sendAlert(player, `特性晶石不足（当前 ${crystals}/5 颗），去打高阶 BOSS、完成赏金挑战或输入 /tower 爬塔即可快速获取！`);
            return true;
        }
        const spent = await SpendTraitCrystals(player.Uid, 5);
        if (!spent) return true;
        PetTrait_1.applyTrait(lead, match);
        await player.PetManager.SavePetData();
        const cfg = GameConfig_1.GameConfig.GetPetById(lead.petId);
        await sendAlert(player, `✨ 定向觉醒成功！【${cfg?.DefName || "#" + lead.petId}】已获得特性「${match.name}」！剩余晶石：${crystals - 5} 颗。`);
        return true;
    }

    return false;
}

module.exports = {
    DEX_MILESTONES,
    ROGUE_BUFFS,
    BOUNTIES,
    ComputeDexAuraFromCount,
    GetDexAura,
    InvalidateDexCache,
    MaybeMarkWildAlpha,
    ApplyWildAlphaCatchBonus,
    StartRogueTowerBattle,
    HandleRogueTowerResult,
    ModifyBattleDamage,
    OnBattleTurnEnd,
    EvaluateBossVictoryBounties,
    HandleChatCommand,
    GetRogueState,
    GetTraitCrystals,
    GetClearedBounties,
};
