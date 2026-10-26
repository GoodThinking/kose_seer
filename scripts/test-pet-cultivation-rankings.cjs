'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const { buildCatalogue } = require('./pet-boss-handbook-data.cjs');
const baseline = path.resolve(process.argv[2]), app = path.resolve(process.argv[3]);
process.chdir(app);
const load = file => require(path.join(app, 'dist', file));
const { Logger } = load('shared/utils');
for (const name of ['Info', 'Debug', 'Warn']) Logger[name] = () => {};
const { ConfigLoader } = load('shared/config/ConfigLoader');
const { ConfigRegistry } = load('shared/config/ConfigRegistry');
const { GetGameConfigRegistrations } = load('shared/config/ConfigDefinitions');
const { GameConfig } = load('shared/config/game/GameConfig');
const { SptSystem } = load('GameServer/Game/Pet/SptSystem');
const { ChampionPetRuntime } = load('GameServer/Game/Battle/ChampionPetRuntime');
(async () => {
  ConfigLoader.Instance._configDir = path.join(app, 'config');
  ConfigRegistry.Instance.RegisterBatch(GetGameConfigRegistrations()); await ConfigRegistry.Instance.Initialize();
  const catalogue = buildCatalogue({ base: baseline, fusionBase: baseline });
  const byId = new Map(catalogue.pets.map(pet => [pet.id, pet]));
  let checkedMoves = 0;
  for (const pet of catalogue.pets) {
    const source = GameConfig.GetPetById(pet.id);
    assert.ok(source, 'Unknown handbook species ' + pet.id);
    const legal = new Set(SptSystem.GetLearnableMovesByLevel(pet.id, 100).map(move => move.id));
    const native = source.LearnableMoves?.Move;
    for (const move of Array.isArray(native) ? native : native ? [native] : []) if (Number(move.LearningLv) <= 100) legal.add(Number(move.ID));
    for (const mode of ['overall', 'arena', 'boss']) {
      const rating = pet.ratings[mode];
      assert.ok(Number.isInteger(rating.score) && rating.score >= 0 && rating.score <= 100, 'Invalid rating for ' + pet.id + ':' + mode);
      assert.ok(Number.isInteger(rating.tier) && rating.tier >= 0 && rating.tier <= 4, 'Invalid tier for ' + pet.id + ':' + mode);
      assert.ok(rating.moves.length <= 4, 'A fifth skill occupied a normal slot for ' + pet.id);
      assert.equal(new Set(rating.moves.map(move => move.id)).size, rating.moves.length, 'Duplicate recommended skill for ' + pet.id);
      for (const move of rating.moves) {
        assert.ok(legal.has(move.id), 'Unlearnable recommendation ' + pet.id + ':' + move.id + ':' + mode);
        assert.ok(move.level >= 1 && move.level <= 100, 'Unreachable skill level for ' + pet.id + ':' + move.id);
        assert.notEqual(move.id, ChampionPetRuntime.Fifth(pet.id), 'Fifth skill consumed normal slot for ' + pet.id);
        checkedMoves++;
      }
      if (rating.fifth) assert.equal(rating.fifth.id, ChampionPetRuntime.Fifth(pet.id), 'Unregistered fifth skill for ' + pet.id);
    }
  }
  for (const id of [3022, 3406, 3481]) {
    for (const mode of ['overall', 'arena', 'boss']) {
      const rating = byId.get(id).ratings[mode];
      assert.equal(rating.moves.length, 4, 'Champion lost a legal normal skill slot');
      assert.equal(rating.fifth.id, ChampionPetRuntime.Fifth(id));
    }
  }
  assert.equal(byId.get(1).finalForm, false); assert.equal(byId.get(303).finalForm, true);
  assert.ok(byId.get(3022).ratings.overall.score > byId.get(303).ratings.overall.score, 'Default rating reverted to Boss-only specialization');
  assert.ok(byId.get(303).ratings.boss.score > byId.get(303).ratings.overall.score, 'Boss specialization was flattened into a single score');
  assert.ok(byId.get(3406).ratings.overall.score > byId.get(70).ratings.overall.score, 'High-stat, stronger-skill form lost its comprehensive value');
  console.log(JSON.stringify({ passed: ['all recommended skills are natively learnable at level 100', 'normal slots remain separate from registered fifth skills', 'all three champion rewards retain four normal skills and an independent fifth', 'scores and tiers stay within displayed bounds', 'default final-form filter distinguishes starters from final forms', 'comprehensive value differs from Boss specialization'], species: catalogue.pets.length, checkedMoves }, null, 2));
})().catch(error => { console.error(error.stack); process.exitCode = 1; });
