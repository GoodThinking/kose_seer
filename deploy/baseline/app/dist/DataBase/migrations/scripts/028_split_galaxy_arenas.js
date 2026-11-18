'use strict';
class Migration028SplitGalaxyArenas {
  constructor(){this.version=28;this.name='split_galaxy_arenas';this.atomicSQLite=true;}
  upSQLite(){return [
    `CREATE TABLE star_arena_progress_v28 (
      owner_id INTEGER NOT NULL REFERENCES players(user_id) ON DELETE CASCADE,
      arena_id INTEGER NOT NULL CHECK(arena_id BETWEEN 1 AND 3),
      next_stage INTEGER NOT NULL DEFAULT 0 CHECK(next_stage BETWEEN 0 AND 16),
      claimed INTEGER NOT NULL DEFAULT 0 CHECK(claimed IN (0,1)),
      champion INTEGER NOT NULL DEFAULT 0 CHECK(champion IN (0,1)),
      run_id INTEGER NOT NULL DEFAULT 1 CHECK(run_id>0),
      reward_catch_time INTEGER,
      PRIMARY KEY(owner_id,arena_id),CHECK(claimed=0 OR champion=1)
    )`,
    'INSERT INTO star_arena_progress_v28(owner_id,arena_id,next_stage,claimed,champion,run_id,reward_catch_time) SELECT owner_id,1,next_stage,claimed,champion,run_id,reward_catch_time FROM star_arena_progress',
    'DROP TABLE star_arena_progress',
    'ALTER TABLE star_arena_progress_v28 RENAME TO star_arena_progress'
  ];}
  upMySQL(){return ['ALTER TABLE star_arena_progress ADD arena_id INT NOT NULL DEFAULT 1, DROP PRIMARY KEY, ADD PRIMARY KEY(owner_id,arena_id), ADD CHECK(arena_id BETWEEN 1 AND 3)'];}
  downSQLite(){throw new Error('Per-galaxy championship records require a forward migration; refusing to discard progress or claim history');}
  downMySQL(){return this.downSQLite();}
}
module.exports={Migration028SplitGalaxyArenas};
