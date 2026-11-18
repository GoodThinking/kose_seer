"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration024CreateEssenceHatches = void 0;
class Migration024CreateEssenceHatches {
    version = 24;
    name = 'create_essence_hatches';
    upSQLite() {
        return [`CREATE TABLE IF NOT EXISTS player_essence_hatches (
      owner_id INTEGER PRIMARY KEY, item_id INTEGER NOT NULL,
      pet_id INTEGER NOT NULL, pet_level INTEGER NOT NULL, ready_at INTEGER NOT NULL
    )`];
    }
    upMySQL() {
        return [`CREATE TABLE IF NOT EXISTS player_essence_hatches (
      owner_id INT NOT NULL PRIMARY KEY, item_id INT NOT NULL,
      pet_id INT NOT NULL, pet_level INT NOT NULL, ready_at BIGINT NOT NULL
    ) ENGINE=InnoDB`];
    }
    downSQLite() { return ['DROP TABLE IF EXISTS player_essence_hatches']; }
    downMySQL() { return ['DROP TABLE IF EXISTS player_essence_hatches']; }
}
exports.Migration024CreateEssenceHatches = Migration024CreateEssenceHatches;
//# sourceMappingURL=024_create_essence_hatches.js.map