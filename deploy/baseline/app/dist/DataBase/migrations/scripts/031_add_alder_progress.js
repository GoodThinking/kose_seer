'use strict';

class Migration031AddAlderProgress {
    constructor() {
        this.version = 31;
        this.name = 'add_alder_progress';
        this.atomicSQLite = true;
    }
    upSQLite() {
        return ['ALTER TABLE player_challenge_progress ADD COLUMN max_alder_lv INTEGER NOT NULL DEFAULT 0'];
    }
    upMySQL() {
        return ['ALTER TABLE player_challenge_progress ADD COLUMN max_alder_lv TINYINT NOT NULL DEFAULT 0'];
    }
    downSQLite() { return []; }
    downMySQL() { return []; }
}

module.exports = { Migration031AddAlderProgress };
