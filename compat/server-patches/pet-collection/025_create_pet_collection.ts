import { IMigration } from '../../../DataBase/migrations/IMigration';

/** Record committed ownership, including both sides of an evolution or release. */
export class Migration025CreatePetCollection implements IMigration {
  version = 25;
  name = 'create_pet_collection';

  upSQLite(): string[] {
    const capture = (row: string) => `INSERT OR IGNORE INTO player_pet_collection (owner_id, pet_id)
      SELECT ${row}.owner_id, CAST(json_extract(value, '$.petId') AS INTEGER)
      FROM json_each(${row}.pet_list)
      WHERE json_type(value, '$.petId') = 'integer' AND json_extract(value, '$.petId') > 0;`;
    return [
      `CREATE TABLE IF NOT EXISTS player_pet_collection (
        owner_id INTEGER NOT NULL, pet_id INTEGER NOT NULL,
        PRIMARY KEY (owner_id, pet_id),
        FOREIGN KEY (owner_id) REFERENCES players(user_id) ON DELETE CASCADE
      )`,
      `CREATE TRIGGER IF NOT EXISTS pet_collection_insert AFTER INSERT ON player_pets BEGIN ${capture('NEW')} END`,
      `CREATE TRIGGER IF NOT EXISTS pet_collection_update AFTER UPDATE OF pet_list ON player_pets BEGIN ${capture('OLD')} ${capture('NEW')} END`,
      `INSERT OR IGNORE INTO player_pet_collection (owner_id, pet_id)
        SELECT p.owner_id, CAST(json_extract(j.value, '$.petId') AS INTEGER)
        FROM player_pets p, json_each(p.pet_list) j
        WHERE json_type(j.value, '$.petId') = 'integer' AND json_extract(j.value, '$.petId') > 0`
    ];
  }

  upMySQL(): string[] {
    const capture = (row: string) => `INSERT IGNORE INTO player_pet_collection (owner_id, pet_id)
      SELECT ${row}.owner_id, j.pet_id FROM JSON_TABLE(${row}.pet_list, '$[*]'
      COLUMNS (pet_id INT PATH '$.petId')) AS j WHERE j.pet_id > 0;`;
    return [
      `CREATE TABLE IF NOT EXISTS player_pet_collection (
        owner_id INT NOT NULL, pet_id INT NOT NULL, PRIMARY KEY (owner_id, pet_id)
      )`,
      `CREATE TRIGGER pet_collection_insert AFTER INSERT ON player_pets FOR EACH ROW BEGIN ${capture('NEW')} END`,
      `CREATE TRIGGER pet_collection_update AFTER UPDATE ON player_pets FOR EACH ROW BEGIN ${capture('OLD')} ${capture('NEW')} END`,
      `INSERT IGNORE INTO player_pet_collection (owner_id, pet_id)
        SELECT p.owner_id, j.pet_id FROM player_pets p,
        JSON_TABLE(p.pet_list, '$[*]' COLUMNS (pet_id INT PATH '$.petId')) AS j WHERE j.pet_id > 0`
    ];
  }

  downSQLite(): string[] {
    return ['DROP TRIGGER IF EXISTS pet_collection_insert', 'DROP TRIGGER IF EXISTS pet_collection_update', 'DROP TABLE IF EXISTS player_pet_collection'];
  }
  downMySQL(): string[] { return this.downSQLite(); }
}
