'use strict';
class Migration027CreateStarArena {
  constructor(){this.version=27;this.name='create_star_arena';}
  upSQLite(){return [`CREATE TABLE star_arena_progress (
    owner_id INTEGER PRIMARY KEY REFERENCES players(user_id) ON DELETE CASCADE,
    next_stage INTEGER NOT NULL DEFAULT 0 CHECK(next_stage BETWEEN 0 AND 16),
    claimed INTEGER NOT NULL DEFAULT 0 CHECK(claimed IN (0,1)),
    champion INTEGER NOT NULL DEFAULT 0 CHECK(champion IN (0,1)),
    run_id INTEGER NOT NULL DEFAULT 1 CHECK(run_id>0),
    reward_catch_time INTEGER,
    CHECK(claimed=0 OR champion=1)
  )`];}
  upMySQL(){return [`CREATE TABLE star_arena_progress (
    owner_id INT PRIMARY KEY,next_stage INT NOT NULL DEFAULT 0,
    claimed INT NOT NULL DEFAULT 0,champion INT NOT NULL DEFAULT 0,
    run_id INT NOT NULL DEFAULT 1,reward_catch_time INT UNSIGNED
  )`];}
  downSQLite(){return ['DROP TABLE star_arena_progress'];}
  downMySQL(){return this.downSQLite();}
}
module.exports={Migration027CreateStarArena};
