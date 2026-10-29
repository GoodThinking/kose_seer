'use strict';
const { GameConfig } = require('../../../shared/config/game/GameConfig');
const { Logger } = require('../../../shared/utils/Logger');
const { BattleInitService } = require('./services/BattleInitService');
const { BattleTurnService } = require('./services/BattleTurnService');
const { BattleRewardService } = require('./services/BattleRewardService');
const { BattleCore } = require('./BattleCore');
const { BattleTurnExecutor } = require('./BattleTurnExecutor');
const { BattleEffectIntegration: Effects } = require('./BattleEffectIntegration');
const { PassiveAbilitySystem } = require('./PassiveAbilitySystem');
const { PassiveEffectRunner } = require('./PassiveEffectRunner');
const { EffectTrigger } = require('./EffectTrigger');
const { EffectTiming } = require('./effects/core/EffectContext');
const { SkillEffectRuntime: Skills } = require('./SkillEffectRuntime');
const { ChampionPetRuntime: Champion } = require('./ChampionPetRuntime');
const { BattleEscapeSystem } = require('./BattleEscapeSystem');
const { BattleAlgorithm } = require('./BattleAlgorithm');
const Countermarks = require('../Pet/Countermarks');
const { SelectWildOpponent } = require('./RareEncounters');
const { BattleEventType, PlayerEventType } = require('../Event/EventTypes');
const { PacketEmpty } = require('../../Server/Packet/Send/PacketEmpty');
const { PacketBattleReward } = require('../../Server/Packet/Send/Battle');
const { PacketMapOgreList } = require('../../Server/Packet/Send/Map/PacketMapOgreList');
const { SendForestAlert } = require('../Map/ForestMechanisms');
const Packets = require('./TrainingBattlePackets');
const Storage = require('./TrainingBattleStorage');
const Task = require('./TrainingBattleTask');
const reservations = new WeakMap();
const watched = new WeakSet();
let npcSequence = 0xf0000000;
const TIMEOUT = Object.freeze({ inviting: 60000, loading: 120000, choosing: 60000, playback: 180000, replacing: 60000 });
class RequestError extends Error {}
function requireRequest(condition, message = '小队战斗操作已经失效，请等待当前回合结束。') {
    if (!condition) throw new RequestError(message);
}
function online(player) { return !player.Session.Socket.destroyed; }
function partyOf(player) { return require('../../Server/Packet/Recv/Map/TrainingPartyHandler').GetTrainingParty(player); }
function current(player) { return reservations.get(player) || null; }
function requireBody(body, length) { requireRequest(body.length === length, '小队战斗请求数据不完整。'); }
function watchPlayer(player) {
    if (watched.has(player)) return;
    watched.add(player);
    player.EventBus.On(PlayerEventType.LOGOUT, () => cancelFor(player, 2));
}
function npcUID(players) {
    do { npcSequence = npcSequence === 0xffffffff ? 0xf0000000 : npcSequence + 1; }
    while (players.some(actor => actor.uid === npcSequence));
    return npcSequence;
}
function playerActor(player, position) {
    const init = new BattleInitService(player), first = init.GetPlayerPet();
    requireRequest(first, '每名队员都需要至少一只体力充足的精灵。');
    const roster = player.PetManager.GetPetsInBag().map(pet => {
        const config = GameConfig.GetPetById(pet.petId);
        requireRequest(config, '精灵资料缺失，无法开始小队战斗。');
        return init.BuildPlayerBattlePet({ pet, config, type: config.Type || 0, skills: Champion.Skills(pet) });
    });
    const pet = roster.find(value => value.catchTime === first.pet.catchTime);
    requireRequest(pet);
    return { uid: player.Uid, nick: player.Data.nick, player, session: player.Session, side: 1, position,
        key: 'trainingPlayer' + position, roster, pet, init, ready: false, joined: false,
        action: null, ack: 0, escapeAttempts: 0, dead: false, rewardClaimed: false, entered: new Set() };
}
function npcActors(leader, slot, players) {
    const mapId = leader.Data.mapID, spawns = leader.MapSpawnManager.GetMapOgres(mapId);
    requireRequest(Number.isInteger(slot) && slot >= 0 && slot < spawns.length && spawns[slot].petId > 0,
        '这只训练精灵已经离开，请重新选择。');
    const config = GameConfig.GetMapConfigById(mapId);
    requireRequest(config?.ogres, '训练场怪物配置缺失。');
    // The clicked spawn anchors the encounter. Every other visible spawn joins it, up to the native five-seat grid.
    const slots = [slot, ...spawns.map((_, i) => i).filter(i => i !== slot && spawns[i].petId > 0)].slice(0, 5);
    const init = new BattleInitService(leader);
    return slots.map((spawnSlot, position) => {
        const spawn = spawns[spawnSlot];
        const rule = config.ogres.find(value => value.petId === spawn.petId) ||
            config.ogres.find(value => value.petId === spawn.originalPetId);
        requireRequest(rule, '训练精灵等级配置缺失。');
        let level;
        if (Number.isInteger(rule.level)) level = rule.level;
        else {
            requireRequest(Number.isInteger(rule.minLevel) && Number.isInteger(rule.maxLevel) && rule.maxLevel >= rule.minLevel,
                '训练精灵等级范围无效。');
            level = Math.floor(Math.random() * (rule.maxLevel - rule.minLevel + 1)) + rule.minLevel;
        }
        const [species, selectedLevel] = SelectWildOpponent(mapId, spawn.petId, Math.max(1, Math.min(100, level)), spawn.originalPetId);
        const petConfig = GameConfig.GetPetById(species);
        requireRequest(petConfig, '训练精灵资料缺失。');
        const pet = init.BuildEnemyBattlePet(species, petConfig, selectedLevel);
        return { uid: npcUID(players), nick: pet.name, side: 2, position, key: 'trainingNpc' + position,
            roster: [pet], pet, slot: spawnSlot, originalSpecies: species !== spawn.petId ? species : spawn.originalPetId || spawn.petId,
            dead: false, entered: new Set() };
    });
}
class TrainingBattle {
    constructor(party, leader, slot) {
        this.party = party;
        this.leader = leader;
        this.mapId = leader.Data.mapID;
        this.slot = slot;
        this.phase = 'reserving';
        this.players = [];
        this.npcs = [];
        this.turn = 0;
        this.winner = 0;
        this.cancelReason = 0;
        this.serial = Promise.resolve();
        this.turnService = new BattleTurnService();
        this.combat = { userId: leader.Uid, turn: 0, roundCount: 0, isOver: false, battleType: 'PVE',
            startTime: Math.floor(Date.now() / 1000), groupActors: { sides: [], keys: new Map(), opponents: new Map() } };
    }
    enqueue(action) {
        const next = this.serial.then(action);
        this.serial = next.catch(error => {
            if (error instanceof RequestError) return;
            Logger.Error('[TrainingBattle] Serialized operation failed', error);
            return this.fail(error);
        });
        return next;
    }
    membersValid() {
        return !this.cancelReason && this.party.battle === this && this.players.every(actor =>
            reservations.get(actor.player) === this && actor.session === actor.player.Session && online(actor.player) &&
            actor.player.Data.mapID === this.mapId && this.party.members.get(actor.uid) === actor.player &&
            actor.player.BattleManager.GetCurrentBattle() === actor.view);
    }
    setPhase(phase) {
        clearTimeout(this.timer);
        this.phase = phase;
        const timeout = TIMEOUT[phase];
        if (timeout) {
            this.timer = setTimeout(() => {
                if (this.phase !== phase) return;
                this.cancel(3);
            }, timeout);
            this.timer.unref?.();
        }
    }
    async send(packet, actors = this.players) {
        const results = await Promise.allSettled(actors.filter(actor => online(actor.player)).map(actor => actor.player.SendPacket(packet)));
        if (results.some(result => result.status === 'rejected') && this.phase !== 'closed') this.cancel(2);
    }
    all() { return [...this.players, ...this.npcs]; }
    living(side) { return (side === 1 ? this.players : this.npcs).filter(actor => actor.pet.hp > 0); }
    foe(actor) {
        const candidates = this.living(actor.side === 1 ? 2 : 1);
        return candidates[actor.position % Math.max(1, candidates.length)] ||
            (actor.side === 1 ? this.npcs : this.players)[0];
    }
    bind() {
        const group = this.combat.groupActors;
        group.sides = this.all().map(actor => actor.key);
        for (const actor of this.all()) {
            this.combat[actor.key] = actor.pet;
            // Keep old pets registered: pending entry and delayed effects retain stable seat identities.
            for (const pet of actor.roster) group.keys.set(pet, actor.key);
            group.opponents.set(actor.pet, this.foe(actor).pet);
        }
        this.combat.player = this.players[0].pet;
        this.combat.enemy = this.npcs[0].pet;
        for (const actor of this.players) if (actor.view) {
            actor.view.player = actor.pet;
            actor.view.enemy = this.foe(actor).pet;
        }
    }
    pair(actor, target) {
        this.combat.player = actor.pet;
        this.combat.enemy = target.pet;
        this.combat.userId = actor.uid;
        this.combat.groupActors.opponents.set(actor.pet, target.pet);
        // The current defender's source ownership stays untouched. Counter-effects use the current explicit attacker.
        this.combat.groupActors.opponents.set(target.pet, actor.pet);
    }
    passive(actor, timing, skill) {
        const target = this.foe(actor);
        const results = PassiveEffectRunner.TriggerAtTiming(actor.pet, target.pet, timing,
            { attacker: actor.pet, defender: target.pet, skill, turn: this.turn });
        EffectTrigger.ApplyEffectResults(results, actor.pet, target.pet);
    }
    enter(actor) {
        if (actor.entered.has(actor.pet)) return;
        actor.entered.add(actor.pet);
        const target = this.foe(actor);
        PassiveAbilitySystem.TriggerPassiveAbilities(actor.pet, target.pet);
        this.passive(actor, EffectTiming.BATTLE_START);
    }
    async initialize() {
        const members = [...this.party.members.values()];
        requireRequest(members.length >= 2 && members.length <= 5, '训练对战需要至少两名同地图队员。');
        requireRequest(members.every(player => online(player) && player.Data.mapID === this.mapId &&
            !player.BattleManager.GetCurrentBattle() && !reservations.has(player) &&
            !player.BattleManager._battleActionsInProgress && !player.BattleManager._petItemInProgress &&
            !player.BattleManager._ppSaveInProgress && !player.BattleManager._petRecoveryInProgress),
            '请所有队员到同一训练场，并结束其他战斗和精灵操作。');
        requireRequest(this.mapId !== 343 || members.every(player =>
            player.PetManager.GetPetsInBag().some(pet => [397, 398, 432].includes(pet.petId))),
            '进入这间训练场的每名队员都需要携带嘟噜噜或闪光嘟噜噜。');
        for (const player of members) reservations.set(player, this);
        this.players = members.map(playerActor);
        this.npcs = npcActors(this.leader, this.slot, this.players);
        this.bind();
        for (const actor of this.players) {
            actor.view = { nativeTraining: this, player: actor.pet, enemy: this.foe(actor).pet,
                userId: actor.uid, battleType: 'PVE', turn: 0, isOver: false, startTime: this.combat.startTime };
            actor.player.BattleManager.InitializeBattle(actor.view);
            watchPlayer(actor.player);
        }
        this.setPhase('inviting');
        await this.leader.SendPacket(new PacketEmpty(7511));
        await this.send(Packets.Word(7553, 3));
    }
    async join(actor) {
        requireRequest(this.phase === 'inviting' && this.membersValid());
        requireRequest(!actor.joined);
        actor.joined = true;
        if (this.players.every(value => value.joined)) {
            this.setPhase('loading');
            await this.send(Packets.Ready(this.players, this.npcs, this.party.leader));
        }
    }
    async ready(actor) {
        requireRequest(this.phase === 'loading' && this.membersValid() && !actor.ready);
        actor.ready = true;
        if (!this.players.every(value => value.ready)) return;
        for (const value of this.all()) this.enter(value);
        Skills.OnEntry(this.combat);
        await this.persist();
        if (!this.membersValid()) return this.finish(this.cancelReason || 2, 0);
        this.setPhase('choosing');
        await this.send(Packets.Start(this.players, this.npcs));
        for (const value of this.players) await value.player.EventBus.Emit({ type: BattleEventType.BATTLE_START,
            timestamp: Date.now(), playerId: value.uid, battleType: 'PVE', mapId: this.mapId,
            playerPetId: value.pet.id, enemyPetId: this.npcs[0].pet.id, extra: { nativeTraining: true } });
    }
    async persist() {
        for (const actor of this.players) for (const pet of actor.roster) await Storage.Save(actor, pet);
    }
    choose(actor, action) {
        requireRequest(this.phase === 'choosing' && this.membersValid() && actor.pet.hp > 0 && !actor.action);
        actor.action = { ...action, pet: actor.pet, turn: this.turn + 1 };
        if (this.players.filter(value => value.pet.hp > 0).every(value => value.action)) return this.round();
    }
    skill(actor, id, side, position) {
        requireRequest(side === 2, '请选择对面的训练精灵。');
        const target = this.npcs.find(value => value.position === position && value.pet.hp > 0);
        requireRequest(target, '目标精灵已经倒下，请重新选择。');
        // There is no canonical Struggle rule. Exhausted actors may spend a real idle turn, never receive a free attack.
        if (id === 0 && actor.pet.skillPP.every(pp => pp === 0)) return this.choose(actor, { type: 'idle', target });
        const index = actor.pet.skills.indexOf(id);
        requireRequest(index >= 0 && actor.pet.skillPP[index] > 0 && GameConfig.GetSkillById(id), '这个技能无法使用。');
        if (actor.pet.encore && actor.pet.encoreTurns > 0 && actor.pet.lastMove > 0) requireRequest(id === actor.pet.lastMove, '当前状态必须继续使用上次技能。');
        return this.choose(actor, { type: 'skill', id, target });
    }
    async switch(actor, catchTime) {
        const next = actor.roster.find(pet => pet.catchTime === catchTime && pet.hp > 0 && pet !== actor.pet);
        requireRequest(next, '请选择背包中另一只健康的精灵。');
        if (this.phase === 'replacing') {
            requireRequest(this.membersValid() && actor.pet.hp <= 0);
            await this.change(actor, next, true);
            if (!this.players.some(value => value.pet.hp <= 0 && value.roster.some(pet => pet.hp > 0))) {
                if (this.terminalWinner() !== undefined) return this.finish(1, this.terminalWinner());
                this.setPhase('choosing');
            }
            return;
        }
        requireRequest(!actor.pet.bound && !actor.pet.boundTurns, '被束缚时无法切换精灵。');
        return this.choose(actor, { type: 'switch', next });
    }
    async change(actor, next, free, queue) {
        Champion.BeforeSwitch(this.combat, actor.pet, actor.key);
        Effects.CleanupBattleEffects(actor.pet);
        actor.pet.effectStates = {};
        actor.pet.flinched = false;
        actor.pet.bound = false;
        actor.pet.boundTurns = 0;
        actor.pet.fatigue = false;
        actor.pet.fatigueTurns = 0;
        actor.pet.encore = false;
        actor.pet.encoreTurns = 0;
        actor.pet = next;
        actor.dead = false;
        this.bind();
        actor.entered.delete(next);
        this.enter(actor);
        const sides = this.combat.groupActors.sides;
        this.combat.groupActors.sides = [actor.key];
        try { Skills.OnEntry(this.combat); }
        finally { this.combat.groupActors.sides = sides; }
        await this.persist();
        const ack = new Packets.GroupPacket(7563, Buffer.from([free ? 0 : 1]));
        if (queue) { queue.push({ packet: ack, actors: [actor] }, { packet: Packets.Change(actor) }); }
        else { await actor.player.SendPacket(ack); await this.send(Packets.Change(actor)); }
    }
    terminalWinner() {
        const allies = this.players.some(actor => actor.roster.some(pet => pet.hp > 0));
        const enemies = this.npcs.some(actor => actor.pet.hp > 0);
        if (!enemies && allies) return 1;
        if (!allies) return 2;
        return undefined;
    }
    loadSkill(actor, id) {
        const configs = new Map();
        this.turnService.LoadSkillConfig(id, configs);
        const skill = configs.get(id);
        requireRequest(skill, '技能配置缺失。');
        return Countermarks.Skill(actor.pet, skill);
    }
    speed(actor, target, skill) {
        // Run each actor's speed timing once. Pairwise sorting must never retrigger random passives.
        const results = EffectTrigger.TriggerSkillEffect(skill, actor.pet, target.pet, 0, EffectTiming.BEFORE_SPEED_CHECK);
        EffectTrigger.ApplyEffectResults(results, actor.pet, target.pet);
        const passive = PassiveEffectRunner.TriggerAtTiming(actor.pet, target.pet, EffectTiming.BEFORE_SPEED_CHECK,
            { attacker: actor.pet, defender: target.pet, skill });
        EffectTrigger.ApplyEffectResults(passive, actor.pet, target.pet);
        const mods = Effects.CollectSpeedModifiers(passive);
        const delta = results.reduce((sum, result) => sum + (result.success && result.type === 'priority_modifier' && result.data
            ? result.data.newPriority - result.data.oldPriority : 0), 0);
        return { always: mods.alwaysFirst, priority: Math.max(-128, Math.min(127,
            (skill.priority || 0) + mods.priorityMod + delta + Skills.Priority(this.combat, actor.pet, skill))),
            speed: BattleAlgorithm.ApplyStageModifier(actor.pet.speed, actor.pet.battleLv[4] || 0) *
                (actor.pet.statusDurations[0] > 0 ? 0.5 : 1) };
    }
    async round() {
        this.setPhase('resolving');
        this.turn++;
        this.combat.turn = this.turn;
        this.combat.roundCount = this.turn;
        const previous = new Map(this.all().map(actor => [actor, actor.pet.hp]));
        const queue = [];
        // Switching and medicines consume the member's action before skill ordering, as existing single-player battle commands do.
        for (const actor of this.players) {
            if (!this.membersValid()) return this.finish(this.cancelReason || 2, 0);
            if (actor.pet.hp <= 0) continue;
            const action = actor.action;
            if (action?.type === 'switch') await this.change(actor, action.next, false, queue);
            else if (action?.type === 'medicine') {
                if (!Storage.CanUseMedicine(actor, action.itemId)) {
                    queue.push({ packet: new PacketEmpty(7562).setResult(5001), actors: [actor] });
                    await SendForestAlert(actor.player, '当前精灵已经不需要这件药剂，药剂没有消耗。');
                } else {
                    const hp = actor.pet.hp;
                    await Storage.Medicine(actor, action.itemId, () => this.membersValid());
                    queue.push(Packets.Medicine(actor, action.itemId, hp));
                }
            } else if (action?.type === 'escape') {
                const target = this.foe(actor);
                const escape = BattleEscapeSystem.AttemptEscape({ player: actor.pet, enemy: target.pet, battleType: 'PVE' }, actor.escapeAttempts);
                actor.escapeAttempts = escape.attempts;
                if (escape.success) {
                    await this.persist();
                    if (!this.membersValid()) return this.finish(this.cancelReason || 2, 0);
                    await this.send(Packets.Escape(actor));
                    return this.finish(6, 0);
                }
                await SendForestAlert(actor.player, escape.message);
            }
        }
        const turnActors = this.all().filter(actor => actor.pet.hp > 0);
        const configs = new Map();
        for (const actor of turnActors) for (const id of actor.pet.skills) this.turnService.LoadSkillConfig(id, configs);
        for (const actor of this.npcs.filter(value => value.pet.hp > 0)) {
            const target = this.foe(actor), available = actor.pet.skills.filter((_, i) => actor.pet.skillPP[i] > 0);
            const id = available.length ? BattleCore.AISelectSkill(actor.pet, target.pet, available, configs) : 0;
            actor.action = { type: id > 0 ? 'skill' : 'idle', id, target, pet: actor.pet, turn: this.turn };
        }
        this.bind();
        Champion.BeginTurn(this.combat);
        for (const actor of turnActors) {
            const target = this.foe(actor);
            Effects.ProcessTurnStartEffects(actor.pet, target.pet);
            this.passive(actor, EffectTiming.TURN_START);
            Effects.DecrementStatusDurations(actor.pet);
            Effects.DecrementEffectCounters(actor.pet);
        }
        Skills.OnEntry(this.combat);
        for (const actor of turnActors) {
            const action = actor.action;
            if (actor.pet.encoreTurns > 0 && --actor.pet.encoreTurns <= 0) actor.pet.encore = false;
            if (action?.type === 'skill') {
                action.skill = this.loadSkill(actor, action.id);
                const results = EffectTrigger.TriggerSkillEffect(action.skill, actor.pet, action.target.pet, 0, EffectTiming.TURN_START);
                EffectTrigger.ApplyEffectResults(results, actor.pet, action.target.pet);
                action.order = this.speed(actor, action.target, action.skill);
            }
        }
        const ordered = turnActors.filter(actor => actor.action?.type === 'skill').sort((a, b) => {
            const x = a.action.order, y = b.action.order;
            return Number(y.always) - Number(x.always) || y.priority - x.priority || y.speed - x.speed || a.side - b.side || a.position - b.position;
        });
        let attacks = 0;
        for (const actor of ordered) {
            if (!this.membersValid()) return this.finish(this.cancelReason || 2, 0);
            const action = actor.action;
            if (action.turn !== this.turn || actor.pet !== action.pet || actor.pet.hp <= 0 || action.target.pet.hp <= 0) continue;
            this.pair(actor, action.target);
            const canAct = Skills.CanAct(this.combat, actor.pet, action.skill) ?? BattleCore.CanAct(actor.pet);
            if (!canAct.canAct) continue;
            const index = actor.pet.skills.indexOf(action.id);
            if (index < 0 || actor.pet.skillPP[index] <= 0) continue;
            actor.pet.skillPP[index] = Math.max(0, actor.pet.skillPP[index] - Champion.PPCost(actor.pet));
            if (actor.player) await Storage.Save(actor);
            if (!this.membersValid()) return this.finish(this.cancelReason || 2, 0);
            const result = BattleTurnExecutor.ExecuteAttack(this.combat, actor.pet, action.target.pet,
                action.skill, actor.uid, canAct, attacks === 0);
            await this.persist();
            queue.push(Packets.Attack(actor, action.target, result));
            attacks++;
        }
        // Idle/item/switch members still pass control-state timers once, never emit dummy skill attacks.
        for (const actor of turnActors) if (actor.pet.hp > 0 && actor.action?.type !== 'skill') {
            Skills.CanAct(this.combat, actor.pet, BattleTurnExecutor.GetNoActionSkill());
            BattleCore.CanAct(actor.pet);
        }
        this.bind();
        for (const actor of turnActors) {
            if (actor.pet.hp <= 0) continue;
            this.passive(actor, EffectTiming.AFTER_ATTACK_END);
            Effects.ApplyTurnStartStatusDamage(actor.pet);
            Effects.ProcessTurnEndEffects(actor.pet, this.foe(actor).pet);
            this.passive(actor, EffectTiming.TURN_END);
        }
        Skills.TurnEnd(this.combat);
        await this.persist();
        if (!this.membersValid()) return this.finish(this.cancelReason || 2, 0);
        const deaths = this.all().filter(actor => actor.pet.hp <= 0 && !actor.dead);
        for (const actor of deaths) actor.dead = true;
        if (deaths.length) queue.push(Packets.Died(deaths));
        for (const actor of this.all()) queue.push(Packets.Notice(actor, this.turn, previous.get(actor)));
        queue.push(Packets.Word(7566, this.turn));
        this.playbackCount = attacks + 1;
        for (const actor of this.players) { actor.ack = 0; actor.action = null; actor.view.turn = this.turn; }
        this.setPhase('playback');
        for (const entry of queue) await this.send(entry.packet || entry, entry.actors);
    }
    async acknowledge(actor) {
        requireRequest(this.phase === 'playback' && this.membersValid());
        actor.ack = Math.min(this.playbackCount, actor.ack + 1);
        if (!this.players.every(value => value.ack >= this.playbackCount)) return;
        const winner = this.terminalWinner();
        if (winner !== undefined) return this.finish(1, winner);
        if (this.players.some(value => value.pet.hp <= 0 && value.roster.some(pet => pet.hp > 0))) this.setPhase('replacing');
        else this.setPhase('choosing');
    }
    cancel(reason) {
        if (this.phase === 'closed' || this.phase === 'settling' || this.cancelReason) return this.serial;
        this.cancelReason = reason;
        clearTimeout(this.timer);
        return this.enqueue(() => this.finish(reason, 0));
    }
    async fail(error) {
        if (this.phase === 'closed') return;
        this.cancelReason = 5;
        Logger.Error('[TrainingBattle] Storage/combat failure; no automatic reward replay', error);
        await this.finish(5, 0);
    }
    async finish(reason, winner) {
        if (this.phase === 'closed' || this.finishing) return;
        this.finishing = true;
        clearTimeout(this.timer);
        this.phase = 'settling';
        this.winner = winner;
        // Every mutation was persisted before its native result. Cancellation never replays an uncertain write.
        const validVictory = reason === 1 && winner === 1 && this.membersValid();
        for (const actor of this.players) {
            actor.view.isOver = true;
            if (validVictory && !actor.rewardClaimed) {
                actor.rewardClaimed = true;
                try {
                    const rewardItems = [];
                    const reward = new BattleRewardService(actor.player);
                    // User-authorized project multiplayer rule: each member receives canonical rewards for each defeated spawn once.
                    for (const enemy of this.npcs) {
                        const battle = { ...actor.view, player: actor.pet, enemy: enemy.pet, roundCount: this.turn };
                        const result = await reward.ProcessVictoryReward(actor.uid, battle, this.mapId, enemy.slot, enemy.originalSpecies);
                        rewardItems.push(...result.rewardItems);
                        if (result.status !== 'complete') Logger.Error('[TrainingBattle] Partial reward retained; replay disabled', result);
                    }
                    await Task.RecordVictory(actor.player, this);
                    actor.rewardItems = rewardItems;
                } catch (error) { Logger.Error('[TrainingBattle] Settlement interrupted; replay disabled', error); }
            }
            for (const pet of actor.roster) Effects.CleanupBattleEffects(pet);
            await actor.player.EventBus.Emit({ type: BattleEventType.BATTLE_END, timestamp: Date.now(), playerId: actor.uid,
                battleType: 'PVE', mapId: this.mapId, isVictory: validVictory, playerPetId: actor.pet.id,
                enemyPetId: this.npcs[0]?.pet.id || 0, rounds: this.turn, extra: { nativeTraining: true, reason } }).catch(error =>
                    Logger.Error('[TrainingBattle] End event failed', error));
        }
        if (validVictory && online(this.leader) && this.leader.Data.mapID === this.mapId) this.leader.MapSpawnManager.OnBattleEnd(this.slot);
        this.setPhase('closed');
        for (const actor of this.players) {
            if (online(actor.player)) {
                await actor.player.SendPacket(Packets.Over(actor.player, reason, winner)).catch(error => Logger.Error('[TrainingBattle] End delivery failed', error));
            }
        }
        // Victory and successful escape have native result confirmations; other cancellations may have none.
        if (reason !== 1 && reason !== 6) this.release();
    }
    async close(actor) {
        requireRequest(this.phase === 'closed');
        if (actor.closed) return;
        actor.closed = true;
        try {
            if (online(actor.player) && actor.rewardItems?.length) await actor.player.SendPacket(new PacketBattleReward(actor.rewardItems));
        } finally {
            this.releaseActor(actor);
            if (this.players.every(value => value.closed || !online(value.player))) this.release();
            // MAP_OGRE_LIST can trigger native automatic fighting; publish only after WIN_CLOSE releases this actor.
            if (actor.player === this.leader && actor.rewardClaimed && online(this.leader) && this.leader.Data.mapID === this.mapId) {
                await this.leader.SendPacket(new PacketMapOgreList(this.leader.MapSpawnManager.GetMapOgres(this.mapId)))
                    .catch(error => Logger.Error('[TrainingBattle] Spawn update delivery failed', error));
            }
        }
    }
    releaseActor(actor) {
        if (reservations.get(actor.player) === this) reservations.delete(actor.player);
        if (actor.player.BattleManager.GetCurrentBattle() === actor.view) actor.player.BattleManager.CleanupBattle();
    }
    release() {
        clearTimeout(this.timer);
        this.phase = 'closed';
        for (const actor of this.players) this.releaseActor(actor);
        if (this.party.battle === this) this.party.battle = null;
    }
}
async function begin(player, slot) {
    const party = partyOf(player);
    requireRequest(party && party.leader === player.Uid && !party.battle && [337, 343].includes(player.Data.mapID),
        '请由队长在小队训练场发起对战。');
    const battle = new TrainingBattle(party, player, slot);
    // Reservation is synchronous and precedes initialization and every await boundary.
    party.battle = battle;
    try { await battle.initialize(); }
    catch (error) {
        for (const member of party.members.values()) if (reservations.get(member) === battle) reservations.delete(member);
        battle.release();
        throw error;
    }
}
async function handle(player, command, body) {
    if (command === 7511) { requireBody(body, 4); return begin(player, body.readUInt32BE(0)); }
    const battle = current(player);
    requireRequest(battle);
    const actor = battle.players.find(value => value.player === player && value.session === player.Session);
    requireRequest(actor);
    // Parse and reserve through one serial queue. Commands received before their phase cannot become valid while queued.
    const phase = battle.phase, turn = battle.turn;
    return battle.enqueue(async () => {
        // A request queued while active may arrive after settlement. Ignore only well-formed
        // in-flight actions belonging to a still-reserved, unconfirmed actor.
        if (battle.phase === 'closed' && [7558, 7562, 7563, 7565, 7575, 7586, 7587].includes(command)) {
            requireRequest(reservations.get(player) === battle && !actor.closed && actor.session === player.Session &&
                online(player) && player.Data.mapID === battle.mapId && battle.party.battle === battle &&
                battle.party.members.get(actor.uid) === player && player.BattleManager.GetCurrentBattle() === actor.view);
            const length = { 7558: 6, 7562: 8, 7563: 4, 7565: 0, 7575: 4, 7586: 0, 7587: 0 }[command];
            requireBody(body, length);
            if (command === 7575) requireRequest(body.readUInt32BE(0) <= 100);
            return;
        }
        requireRequest(battle.phase === phase && battle.turn === turn);
        if (command === 7554) { requireBody(body, 0); return battle.join(actor); }
        if (command === 7556) { requireBody(body, 0); return battle.ready(actor); }
        if (command === 7558) { requireBody(body, 6); return battle.skill(actor, body.readUInt32BE(0), body[4], body[5]); }
        if (command === 7562) {
            requireBody(body, 8);
            const itemId = body.readUInt32BE(4);
            requireRequest(body.readUInt32BE(0) === actor.pet.catchTime && Storage.CanUseMedicine(actor, itemId),
                '这件药剂无法用于当前精灵，请核对体力、技能次数和背包。');
            return battle.choose(actor, { type: 'medicine', itemId });
        }
        if (command === 7563) { requireBody(body, 4); return battle.switch(actor, body.readUInt32BE(0)); }
        if (command === 7565) { requireBody(body, 0); return battle.choose(actor, { type: 'escape' }); }
        if (command === 7586) { requireBody(body, 0); return battle.acknowledge(actor); }
        if (command === 7587) { requireBody(body, 0); battle.cancelReason = 3; return battle.finish(3, 0); }
        if (command === 7574) { requireBody(body, 0); return battle.close(actor); }
        if (command === 7571 || command === 7575) {
            requireBody(body, 4);
            requireRequest((command === 7571 ? battle.phase === 'loading' :
                battle.phase === 'choosing' || battle.phase === 'replacing') && battle.membersValid());
            const value = body.readUInt32BE(0);
            requireRequest(value <= 100);
            if (command === 7571) requireRequest(value >= (actor.loadPercent || 0));
            if (command === 7571) actor.loadPercent = value;
            return battle.send(Packets.Progress(command === 7571 ? 7572 : 7576, actor, value));
        }
        throw new RequestError('不支持的小队战斗请求。');
    });
}
async function cancelFor(player, reason = 2) {
    const battle = current(player);
    if (!battle) return;
    // A claimed victory finishes its existing settlement; map/logout still releases its caller after that drain.
    await battle.cancel(reason);
    if (battle.phase === 'closed') {
        const actor = battle.players.find(value => value.player === player);
        if (actor) { actor.closed = true; battle.releaseActor(actor); }
        if (battle.players.every(value => value.closed || !online(value.player))) battle.release();
    }
}
module.exports = { Handle: handle, CancelFor: cancelFor, GetTrainingBattle: current,
    IsReserved: player => reservations.has(player), RequestError, TrainingBattle };
