import { IMigration } from '../IMigration';

export class Migration024CreateEssenceHatches implements IMigration {
  version = 24;
  name = 'create_essence_hatches';
  upSQLite(): string[] {
    return [`CREATE TABLE IF NOT EXISTS player_essence_hatches (
      owner_id INTEGER PRIMARY KEY, item_id INTEGER NOT NULL,
      pet_id INTEGER NOT NULL, pet_level INTEGER NOT NULL, ready_at INTEGER NOT NULL
    )`];
  }
  upMySQL(): string[] {
    return [`CREATE TABLE IF NOT EXISTS player_essence_hatches (
      owner_id INT NOT NULL PRIMARY KEY, item_id INT NOT NULL,
      pet_id INT NOT NULL, pet_level INT NOT NULL, ready_at BIGINT NOT NULL
    ) ENGINE=InnoDB`];
  }
  downSQLite(): string[] {return ['DROP TABLE IF EXISTS player_essence_hatches'];}
  downMySQL(): string[] {return ['DROP TABLE IF EXISTS player_essence_hatches'];}
}
