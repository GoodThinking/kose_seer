'use strict';
// Canonical combat and PetData writes, with in-memory transport/storage boundaries only.
// Run against the integrated app: node scripts/test-native-training-runtime.cjs /absolute/path/to/app
const assert = require('node:assert/strict');
const { mock } = require('node:test');
const path = require('node:path');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const load = name => require(path.join(app, 'dist', name));
const { ConfigRegistry } = load('shared/config/ConfigRegistry');
const { GetGameConfigRegistrations } = load('shared/config/ConfigDefinitions');
const { createDefaultPetInfo } = load('shared/models/PetModel');
const { PetCalculator } = load('GameServer/Game/Pet/PetCalculator');
const { ReconcilePetPP } = load('GameServer/Game/Pet/PetPP');
const { PetData } = load('DataBase/models/PetData');
const { DatabaseHelper } = load('DataBase/DatabaseHelper');
const { GameEventBus } = load('GameServer/Game/Event/GameEventBus');
const { TrainingBattle, Handle, CancelFor, IsReserved, RequestError } = load('GameServer/Game/Battle/TrainingBattleRuntime');
const { GameConfig } = load('shared/config/game/GameConfig');
const { MapSpawnManager } = load('GameServer/Game/Map/MapSpawnManager');
const Packets = load('GameServer/Game/Battle/TrainingBattlePackets');
const { BattleRewardService } = load('GameServer/Game/Battle/services/BattleRewardService');
const persisted = new Map(), writes = [];
const savePets = DatabaseHelper.Instance.SavePetData;
DatabaseHelper.Instance.SavePetData = async (data, strict) => {
    assert.equal(strict, true, 'Native pet writes must request strict persistence');
    const row = data.ToRow();
    persisted.set(data.Uid, JSON.parse(row.pet_list));
    writes.push({ uid: data.Uid, pets: JSON.parse(row.pet_list) });
};
let uid = 900000;
function player(mapID = 337, species = 1) {
    const id = ++uid, packets = [];
    const pets = [0, 1].map(index => {
        const pet = createDefaultPetInfo(id, species);
        pet.level = 100;
        pet.catchTime = id * 10 + index;
        pet.skillArray = [10001];
        pet.isInBag = true;
        pet.isDefault = index === 0;
        PetCalculator.UpdatePetStats(pet);
        pet.hp = pet.maxHp;
        pet.skillPP = ReconcilePetPP(pet);
        return pet;
    });
    const petData = Object.assign(Object.create(PetData.prototype), { Uid: id, PetList: pets,
        _mutationTail: Promise.resolve(), _stagedSave: null, _publishing: false, HasPendingGrant: () => false });
    const result = { Uid: id, ClientProtocol: 'xin-20261013', Data: { mapID, nick: 'Training' + id,
        twoTimes: 7, threeTimes: 6, autoFightTimes: 5, btlDetectTimes: 4, energyTimes: 3, learnTimes: 2 },
        Session: { Socket: { destroyed: false } }, EventBus: new GameEventBus(), packets,
        PetManager: { PetData: petData, GetPetsInBag: () => pets,
            GetPetByCatchTime: catchTime => pets.find(pet => pet.catchTime === catchTime) },
        TaskManager: { TaskData: { IsTaskAccepted: () => false, IsTaskCompleted: () => false } },
        ItemManager: { ItemData: { ItemList: [] } },
        async SendPacket(packet) {
            const body = packet.serialize();
            if (packet.getCmdId() === 7559) {
                // The selected player's current PP must already match durable state before playback is visible.
                for (const saved of persisted.values()) assert(saved.every(pet => Object.values(pet.skillPP).every(Number.isInteger)));
            }
            if (packet.getCmdId() === 2004) {
                assert.equal(IsReserved(result), false, 'Native automatic-fight callbacks must see a released actor');
            }
            packets.push({ command: packet.getCmdId(), result: packet.getResult(), body });
        } };
    let current = null;
    result.BattleManager = { GetCurrentBattle: () => current,
        InitializeBattle: battle => { assert.equal(current, null); current = battle; }, CleanupBattle: () => { current = null; } };
    result.MapSpawnManager = new MapSpawnManager(result);
    result.MapSpawnManager.OnEnterMap(mapID);
    return result;
}
async function battle(players = [player(), player()]) {
    const leader = players[0];
    const party = { leader: leader.Uid, members: new Map(players.map(value => [value.Uid, value])), battle: null };
    const slot = leader.MapSpawnManager.GetMapOgres(leader.Data.mapID).findIndex(value => value.petId > 0);
    assert(slot >= 0, 'Real room spawns must exist');
    const result = new TrainingBattle(party, leader, slot);
    party.battle = result;
    try { await result.initialize(); }
    catch (error) { result.release(); throw error; }
    return result;
}
async function ready(result) {
    for (const actor of result.players) await Handle(actor.player, 7554, Buffer.alloc(0));
    assert.equal(result.phase, 'loading');
    await Handle(result.players[0].player, 7556, Buffer.alloc(0));
    assert.equal(result.phase, 'loading', 'One client cannot fabricate peer readiness');
    for (const actor of result.players.slice(1)) await Handle(actor.player, 7556, Buffer.alloc(0));
    assert.equal(result.phase, 'choosing');
}
function choice(result, actor, skillId = actor.pet.skills[0]) {
    const target = result.npcs.find(value => value.pet.hp > 0);
    const body = Buffer.alloc(6);
    body.writeUInt32BE(skillId); body[4] = 2; body[5] = target.position;
    return Handle(actor.player, 7558, body);
}
(async () => {
    ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
    await ConfigRegistry.Instance.Initialize();
    await load('shared/config/game/SkillEffectsConfig').SkillEffectsConfig.Instance.Load();
    const passed = [];
    {
        const result = await battle();
        const spawns = result.leader.MapSpawnManager.GetMapOgres(337).filter(value => value.petId > 0);
        assert.equal(result.npcs.length, Math.min(5, spawns.length));
        assert.equal(new Set(result.npcs.map(actor => actor.uid)).size, result.npcs.length);
        const config = GameConfig.GetMapConfigById(337);
        for (const actor of result.npcs) {
            const rule = config.ogres.find(value => value.petId === actor.originalSpecies);
            assert(rule);
            assert(actor.pet.level >= (rule.level ?? rule.minLevel) && actor.pet.level <= (rule.level ?? rule.maxLevel));
        }
        assert(result.players.every(actor => IsReserved(actor.player)));
        await ready(result);
        const actor = result.players[0], other = result.players[1];
        actor.pet.fatigueTurns = 1; // Fatigue cannot be invalidated by the canonical sleep-on-hit wake rule.
        const hp = result.npcs[0].pet.hp;
        result.npcs[0].pet.statusDurations[1] = 2;
        const pp = actor.pet.skillPP[0];
        await choice(result, actor);
        await assert.rejects(choice(result, actor), RequestError);
        assert.equal(result.phase, 'choosing', 'Duplicate choice does not cancel another member');
        await choice(result, other);
        assert.equal(result.phase, 'playback');
        const attacks = actor.player.packets.filter(packet => packet.command === 7559);
        assert(attacks.every(packet => packet.body.readUInt32BE(4) !== actor.uid), 'Fatigued member emits no fake attack');
        assert.equal(actor.pet.skillPP[0], pp, 'Fatigued member retains PP');
        assert.equal(result.npcs[0].pet.statusDurations[1], 1, 'Shared NPC poison duration ticks once, not once per ally');
        assert(result.npcs[0].pet.hp < hp);
        assert(writes.some(write => write.uid === other.uid && write.pets[0].skillPP[10001] < pp));
        await Handle(actor.player, 7586, Buffer.alloc(0));
        assert.equal(result.phase, 'playback', 'First animation ACK cannot reopen the turn');
        for (let count = 1; count < result.playbackCount; count++) await Handle(actor.player, 7586, Buffer.alloc(0));
        assert.equal(result.phase, 'playback', 'One member cannot acknowledge its peer animations');
        for (let count = 0; count < result.playbackCount; count++) await Handle(other.player, 7586, Buffer.alloc(0));
        assert.equal(result.phase, 'choosing');
        await assert.rejects(Handle(actor.player, 7586, Buffer.alloc(0)), RequestError);
        assert.equal(result.phase, 'choosing');
        await CancelFor(actor.player, 2);
        assert.equal(result.party.battle, null);
        assert(result.players.every(value => !IsReserved(value.player) && !value.player.BattleManager.GetCurrentBattle()));
        const over = actor.player.packets.find(packet => packet.command === 7560);
        assert.equal(over.body.readUInt32BE(1), 2);
        assert.equal(over.body.readUInt32BE(5), 0);
        passed.push('real spawn teams and stable NPC identities', 'all-client readiness', 'canonical status and PP persistence',
            'duplicate choice rejection without cancellation', 'full native animation acknowledgement barrier', 'disconnect cleanup without victory');
    }
    {
        const result = await battle();
        await ready(result);
        const participants = result.all();
        const ppBefore = new Map(participants.map(actor => [actor, [...actor.pet.skillPP]]));
        // Every participant starts asleep. No first attacker exists to wake a later sleeping actor through a real hit.
        for (const actor of participants) actor.pet.statusDurations[8] = 2;
        for (const actor of result.players) await choice(result, actor);
        assert.equal(result.phase, 'playback');
        assert.equal(result.playbackCount, 1, 'An all-sleep round requires only the genuine queue-drained acknowledgement');
        assert(result.players.every(actor => !actor.player.packets.some(packet => packet.command === 7559)),
            'Still-sleeping participants must not emit dummy skill packets');
        for (const actor of participants) {
            assert.equal(actor.pet.statusDurations[8], 1, 'Each sleeping participant loses exactly one sleep turn');
            assert.deepEqual(actor.pet.skillPP, ppBefore.get(actor), 'Sleep consumes no skill PP');
        }
        await Handle(result.players[0].player, 7586, Buffer.alloc(0));
        assert.equal(result.phase, 'playback');
        await Handle(result.players[1].player, 7586, Buffer.alloc(0));
        assert.equal(result.phase, 'choosing');
        await CancelFor(result.leader, 2);
        passed.push('still-sleeping actors emit no fake attacks or PP loss', 'empty native action queue still waits for every client');
    }
    {
        const result = await battle();
        const actor = result.players[0];
        actor.player.Data.mapID = 336;
        await CancelFor(actor.player, 2);
        assert.equal(result.party.battle, null);
        assert(result.players.every(value => !IsReserved(value.player)));
        passed.push('map invalidation releases every peer');
    }
    {
        const result = await battle();
        await ready(result);
        const actor = result.players[0];
        await assert.rejects(choice(result, actor, 0), RequestError);
        actor.pet.skillPP.fill(0);
        await choice(result, actor, 0);
        await choice(result, result.players[1]);
        assert.equal(result.phase, 'playback');
        assert(actor.player.packets.filter(packet => packet.command === 7559)
            .every(packet => packet.body.readUInt32BE(4) !== actor.uid));
        assert(actor.pet.skillPP.every(pp => pp === 0));
        await CancelFor(actor.player, 6);
        passed.push('exhausted PP permits idle only, never a free attack');
    }
    {
        const result = await battle();
        try {
            await ready(result);
            const actor = result.players[0], peer = result.players[1];
            const next = actor.roster[1], body = Buffer.alloc(4);
            body.writeUInt32BE(next.catchTime);
            await Handle(actor.player, 7563, body);
            await choice(result, peer);
            assert.equal(actor.pet, next);
            assert.equal(actor.player.packets.findLast(packet => packet.command === 7563).body[0], 1,
                'Voluntary replacement consumes this turn and keeps native skill controls waiting');
            for (const member of result.players) for (let count = 0; count < result.playbackCount; count++) {
                await Handle(member.player, 7586, Buffer.alloc(0));
            }
            actor.pet.hp = 0;
            result.setPhase('replacing');
            const countdown = Buffer.alloc(4);
            countdown.writeUInt32BE(10);
            await Handle(actor.player, 7575, countdown);
            assert(result.players.every(member => member.player.packets.some(packet =>
                packet.command === 7576 && packet.result === 0)), 'Replacement countdown reaches every native peer');
            body.writeUInt32BE(actor.roster[0].catchTime);
            await Handle(actor.player, 7563, body);
            assert.equal(result.phase, 'choosing');
            assert.equal(actor.player.packets.findLast(packet => packet.command === 7563).body[0], 0,
                'Forced replacement leaves the native skill controls usable for the next action');
            await choice(result, actor);
            assert.equal(result.phase, 'choosing', 'Replacement does not fabricate the peer action');
            await choice(result, peer);
            assert.equal(result.phase, 'playback', 'Both peers can continue after forced replacement');
            passed.push('voluntary and forced native replacement control states and continuation');
        } finally {
            await CancelFor(result.leader, 2);
        }
    }
    {
        await assert.rejects(battle([player(343), player(343)]), RequestError);
        const result = await battle([player(343, 397), player(343, 398)]);
        await CancelFor(result.leader, 3);
        assert.equal(result.players[0].player.packets.find(packet => packet.command === 7560).body.readUInt32BE(1), 3);
        assert.equal(result.party.battle, null);
        passed.push('343 bag prerequisite and timeout reason');
    }
    {
        const result = await battle();
        await ready(result);
        const [first, second] = result.players;
        const skill = Buffer.alloc(6);
        skill.writeUInt32BE(first.pet.skills[0]); skill[4] = 2; skill[5] = result.npcs[0].position;
        const progress = Buffer.alloc(4); progress.writeUInt32BE(20);
        const item = Buffer.alloc(8); item.writeUInt32BE(first.pet.catchTime);
        const nextPet = Buffer.alloc(4); nextPet.writeUInt32BE(first.roster[1].catchTime);
        const beforeQueue = {
            pets: result.players.map(actor => actor.roster.map(pet => ({ hp: pet.hp, pp: [...pet.skillPP] }))),
            writes: writes.length,
            items: result.players.map(actor => JSON.stringify(actor.player.ItemManager.ItemData.ItemList)),
            packets: result.players.map(actor => actor.player.packets.length)
        };
        let releaseQueue;
        const gate = new Promise(resolve => { releaseQueue = resolve; });
        const blocked = result.enqueue(() => gate);
        const ending = result.enqueue(() => result.finish(6, 0));
        const queuedProgress = Handle(first.player, 7575, progress);
        const queuedSkill = Handle(first.player, 7558, skill);
        releaseQueue();
        await Promise.all([blocked, ending, queuedProgress, queuedSkill]);
        assert.equal(result.phase, 'closed');
        assert(result.players.every(actor => IsReserved(actor.player)), 'Escape remains reserved until each native confirmation');
        assert.equal(result.party.battle, result);
        assert.deepEqual(result.players.map(actor => actor.roster.map(pet => ({ hp: pet.hp, pp: [...pet.skillPP] }))),
            beforeQueue.pets, 'Requests queued before finish cannot change HP or PP after settlement');
        assert.equal(writes.length, beforeQueue.writes);
        assert.deepEqual(result.players.map(actor => JSON.stringify(actor.player.ItemManager.ItemData.ItemList)), beforeQueue.items);
        assert(result.players.every((actor, index) => actor.player.packets.length === beforeQueue.packets[index] + 1),
            'Only the single fight-over packet may be emitted during queued settlement');
        assert(result.players.every(actor => !actor.rewardClaimed && !actor.rewardItems), 'Escape grants no rewards');
        const snapshot = () => ({
            pets: result.players.map(actor => actor.roster.map(pet => ({ hp: pet.hp, pp: [...pet.skillPP] }))),
            writes: writes.length,
            items: result.players.map(actor => JSON.stringify(actor.player.ItemManager.ItemData.ItemList)),
            rewards: result.players.map(actor => actor.rewardItems),
            packets: result.players.map(actor => actor.player.packets.map(packet => packet.command))
        });
        const before = snapshot();
        assert(result.players.every(actor => actor.player.packets.filter(packet => packet.command === 7560).length === 1));
        for (const [command, body] of [[7575, progress], [7558, skill], [7562, item], [7563, nextPet],
            [7565, Buffer.alloc(0)], [7586, Buffer.alloc(0)], [7587, Buffer.alloc(0)]]) {
            await Handle(first.player, command, body);
        }
        assert.deepEqual(snapshot(), before, 'Late actions must not mutate state, persist, reward or emit packets');
        await assert.rejects(Handle(first.player, 7558, Buffer.alloc(5)), RequestError);
        await assert.rejects(Handle(first.player, 7575, Buffer.from([0, 0, 0, 101])), RequestError);
        await assert.rejects(Handle(first.player, 7554, Buffer.alloc(0)), RequestError);
        await assert.rejects(Handle(first.player, 9999, Buffer.alloc(0)), RequestError);
        const session = first.player.Session;
        first.player.Session = { Socket: { destroyed: false } };
        await assert.rejects(Handle(first.player, 7575, progress), RequestError);
        first.player.Session = session;
        assert.deepEqual(snapshot(), before, 'Rejected requests must not change settled state');
        await Handle(first.player, 7574, Buffer.alloc(0));
        assert.equal(IsReserved(first.player), false);
        assert.equal(IsReserved(second.player), true);
        assert.equal(result.party.battle, result);
        await assert.rejects(Handle(first.player, 7558, skill), RequestError);
        await Handle(second.player, 7574, Buffer.alloc(0));
        assert.equal(IsReserved(second.player), false);
        assert.equal(result.party.battle, null);
        assert.equal(writes.length, before.writes);
        passed.push('escape reservation and queued late actions');
    }
    {
        const result = await battle();
        await ready(result);
        await result.finish(6, 0);
        await CancelFor(result.players[0].player, 2);
        assert.equal(IsReserved(result.players[0].player), false);
        assert.equal(IsReserved(result.players[1].player), true);
        await CancelFor(result.players[1].player, 2);
        assert.equal(IsReserved(result.players[1].player), false);
        assert.equal(result.party.battle, null);
        passed.push('escape reservation released on departure');
    }
    {
        // The settlement boundary reports a partial commit. Real canonical combat still decides every HP change and outcome.
        const originalReward = BattleRewardService.prototype.ProcessVictoryReward;
        const calls = [];
        let enterSettlement, releaseSettlement, drainedDuringSettlement = false;
        const settlementStarted = new Promise(resolve => { enterSettlement = resolve; });
        const settlementGate = new Promise(resolve => { releaseSettlement = resolve; });
        BattleRewardService.prototype.ProcessVictoryReward = async function (id, view, mapId, slot, originalSpecies) {
            assert.equal(view.enemy.hp, 0, 'Only genuinely defeated spawns may settle');
            assert.equal(mapId, 337);
            calls.push({ id, slot, originalSpecies });
            if (calls.length === 1) { enterSettlement(); await settlementGate; }
            return { status: 'partial', failedStage: 'coins', rewardItems: [], expGained: 1, coinsGained: 0, droppedItems: [] };
        };
        let result;
        try {
            mock.timers.enable({ apis: ['setTimeout'] });
            result = await battle(Array.from({ length: 5 }, () => player(337, 3406)));
            await ready(result);
            while (result.phase !== 'closed' && result.turn < 120) {
                if (result.phase === 'replacing') {
                    for (const actor of result.players) if (actor.pet.hp <= 0) {
                        const next = actor.roster.find(pet => pet.hp > 0);
                        if (next) {
                            const body = Buffer.alloc(4); body.writeUInt32BE(next.catchTime);
                            await Handle(actor.player, 7563, body);
                        }
                    }
                }
                if (result.phase === 'choosing') {
                    for (const actor of result.players) if (actor.pet.hp > 0) await choice(result, actor);
                }
                if (result.phase === 'playback') {
                    for (const actor of result.players) for (let count = 0; count < result.playbackCount; count++) {
                        if (result.terminalWinner() === 1 && actor === result.players[result.players.length - 1] &&
                            count === result.playbackCount - 1) {
                            const completion = Handle(actor.player, 7586, Buffer.alloc(0));
                            await settlementStarted;
                            assert.equal(result.phase, 'settling');
                            const leaving = result.players[1].player;
                            const cancelled = CancelFor(leaving, 2);
                            assert(IsReserved(leaving), 'Cancellation must drain the claimed settlement, not discard it');
                            releaseSettlement();
                            await Promise.all([completion, cancelled]);
                            assert.equal(IsReserved(leaving), false, 'Map/logout caller releases immediately after settlement drains');
                            assert.equal(leaving.BattleManager.GetCurrentBattle(), null);
                            drainedDuringSettlement = true;
                        } else await Handle(actor.player, 7586, Buffer.alloc(0));
                    }
                }
            }
            assert.equal(result.phase, 'closed', 'Real skills and AI must reach an actual terminal outcome');
            assert.equal(result.winner, 1, 'Five real level100 Champion fixtures must defeat the configured training pool');
            assert.equal(drainedDuringSettlement, true);
            assert(result.players.every(actor => !actor.player.packets.some(packet => packet.command === 2004)),
                'Spawn updates must wait for WIN_CLOSE rather than trigger automatic fighting behind results');
            assert.equal(calls.length, result.players.length * result.npcs.length);
            assert.equal(new Set(calls.map(call => call.id + ':' + call.slot)).size, calls.length);
            const count = calls.length;
            await result.finish(1, 1);
            assert.equal(calls.length, count, 'Replayed finish cannot replay partial settlements');
            mock.timers.tick(60001);
            for (const actor of result.players.filter(value => !value.closed)) {
                assert(IsReserved(actor.player), 'Delayed reward confirmation must retain its settled reservation');
            }
            const finalActor = result.players.at(-1);
            finalActor.rewardItems = [{ itemId: 400001, count: 1 }];
            finalActor.player.SendPacket = async () => { throw new Error('Result delivery failed'); };
            for (const actor of result.players) {
                if (actor === finalActor) {
                    await assert.rejects(Handle(actor.player, 7574, Buffer.alloc(0)), /Result delivery failed/);
                    assert.equal(IsReserved(actor.player), false, 'Failed result delivery still releases its actor');
                } else if (IsReserved(actor.player)) await Handle(actor.player, 7574, Buffer.alloc(0));
                await result.close(actor);
            }
            const leader = result.players[0].player;
            const snapshots = leader.packets.filter(packet => packet.command === 2004);
            assert.equal(snapshots.length, 1, 'Victory must publish the regenerated leader-owned spawn pool');
            const ogres = leader.MapSpawnManager.GetMapOgres(leader.Data.mapID);
            assert.deepEqual(Array.from({ length: 9 }, (_, index) => snapshots[0].body.readUInt32BE(index * 4)),
                ogres.map(ogre => ogre.petId), 'Visible slots must match the actual post-victory pool');
            assert(leader.packets.indexOf(snapshots[0]) > leader.packets.findIndex(packet => packet.command === 7560),
                'The map snapshot must follow the battle-over notification');
            assert(result.players.slice(1).every(actor => !actor.player.packets.some(packet => packet.command === 2004)),
                'A leader-owned spawn pool must not replace another member’s own map pool');
            assert.equal(calls.length, count, 'Repeated WIN_CLOSE cannot call the reward service');
            assert.equal(result.party.battle === null, true, 'Final result delivery failure must not strand the party');
            passed.push('natural canonical multiplayer victory', 'each defeated spawn settles once per member',
                'partial normal settlements and repeated WIN_CLOSE never replay', 'map/logout cancellation drains settlement then releases caller',
                'WIN_CLOSE remains valid after a minute on the result screen', 'final result send failure releases the party without replay');
        } finally {
            BattleRewardService.prototype.ProcessVictoryReward = originalReward;
            result?.release();
            mock.timers.reset();
        }
    }
    {
        const actor = { uid: 3, nick: 'Native', side: 1, position: 2 };
        assert.equal(Packets.Escape(actor).serialize().length, 22);
        const wait = Packets.Progress(7576, actor, 20).serialize();
        assert.equal(wait.length, 10);
        assert.equal(wait[4], 1); assert.equal(wait[5], 2); assert.equal(wait.readUInt32BE(6), 20);
        const p = player();
        const over = Packets.Over(p, 1, 1).serialize();
        assert.deepEqual(Array.from({ length: 6 }, (_, i) => over.readUInt32BE(13 + i * 4)), [7, 6, 5, 4, 3, 2]);
        passed.push('native escape and countdown layouts', 'unchanged real consumable counters');
    }
    console.log(JSON.stringify({ passed, databaseOpened: false, nativeDualClientAcceptance: false }, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { DatabaseHelper.Instance.SavePetData = savePets; });
