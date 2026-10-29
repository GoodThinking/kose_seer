'use strict';
// Exercise actual battle effect code, without a database, socket or forced fight result.
const assert = require('node:assert/strict');
const path = require('node:path');
const app = path.resolve(process.argv[2]);
process.chdir(app);
const { BattleInitService } = require(path.join(app, 'dist/GameServer/Game/Battle/services/BattleInitService'));
const { SkillEffectRuntime: R } = require(path.join(app, 'dist/GameServer/Game/Battle/SkillEffectRuntime'));
const init = new BattleInitService({Uid: 1});
let serial = 1;
function pet(hp = 80) {
    return init.BuildBattlePet(100, 'Actor ' + serial, 50, hp, 80, 60, 60, 60, 60, 60, 0, [10001], serial++, 0);
}
function group() {
    const a = pet(40), b = pet(20), x = pet(), y = pet();
    const battle = {player: a, enemy: x, userId: 1, turn: 1, battleType: 'PVE',
        a, b, x, y, groupActors: {sides: ['a', 'b', 'x', 'y'],
            keys: new Map([[a, 'a'], [b, 'b'], [x, 'x'], [y, 'y']]),
            opponents: new Map([[a, x], [b, y], [x, a], [y, b]])}};
    return {battle, a, b, x, y};
}
const skill = {id: 20007, type: 0, category: 4};
(async () => {
const { ConfigRegistry } = require(path.join(app, 'dist/shared/config/ConfigRegistry'));
const { GetGameConfigRegistrations } = require(path.join(app, 'dist/shared/config/ConfigDefinitions'));
ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations());
await ConfigRegistry.Instance.Initialize();
{
    const {battle, a, b, x, y} = group();
    R.Apply(battle, a, x, skill, 13, [3], 0, true);
    // A different participant acts next; the seed must not heal that participant.
    battle.player = b;
    battle.enemy = x;
    R.TurnEnd(battle);
    assert.equal(a.hp, 50, 'Seed heals its original source');
    assert.equal(b.hp, 20, 'Current attacker does not steal seed healing');
    assert.equal(x.hp, 70, 'Original target loses one eighth of maximum HP');
    assert.equal(y.hp, 80, 'Other opponents take no seed damage');
    assert.equal(R.Get(x, 'seeded').turns, 2, 'Group effect expires once per full round');
}
{
    const {battle, a, b, x, y} = group();
    R.Apply(battle, a, x, skill, 60, [3, 7], 0, true);
    battle.player = b;
    battle.enemy = y;
    R.TurnEnd(battle);
    assert.equal(x.hp, 73, 'Damage-over-time remains on the original actor');
    assert.equal(y.hp, 80);
    assert.equal(R.Get(x, 'dot').turns, 2);
}
{
    const {battle, a, b, x, y} = group();
    R.Apply(battle, a, x, skill, 62, [1], 0, true);
    battle.groupActors.opponents.set(a, y);
    battle.player = b;
    battle.enemy = y;
    R.TurnEnd(battle);
    battle.turn++;
    R.TurnEnd(battle);
    assert.equal(x.hp, 0, 'Delayed knockout keeps its original target after target selection changes');
    assert.equal(y.hp, 80);
    assert.equal(a.hp, 40);
    assert.equal(b.hp, 20);
}
{
    const {battle, a, b, x, y} = group();
    R.Apply(battle, a, x, skill, 91, [3], 0, true);
    battle.groupActors.opponents.set(a, y);
    battle.player = b;
    battle.enemy = y;
    x.battleLevels[0] = 2;
    battle._actor = x;
    R.CloseSegment(battle);
    assert.equal(a.battleLevels[0], 2, 'Stat mirroring follows the bound opponent, not a later attack pair');
    assert.equal(b.battleLevels[0], 0);
    assert.equal(y.battleLevels[0], 0);
}
{
    const a = pet(40), x = pet();
    const battle = {player: a, enemy: x, userId: 1, turn: 1, battleType: 'PVE'};
    R.Apply(battle, a, x, skill, 13, [3], 0, true);
    R.TurnEnd(battle);
    assert.equal(a.hp, 50, 'Existing two-actor seed behavior remains unchanged');
    assert.equal(x.hp, 70);
    assert.equal(R.Get(x, 'seeded').turns, 2);
}
console.log(JSON.stringify({passed: ['seed ownership across attack pairs', 'damage-over-time actor ownership',
    'delayed knockout target ownership', 'bound stat mirror opponent', 'unchanged two-actor seed behavior'],
    databaseOpened: false, nativeMultiplayerBattleAcceptance: false}, null, 2));
})().catch(error => { console.error(error); process.exitCode = 1; });
