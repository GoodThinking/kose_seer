import { IMigration } from '../../../DataBase/migrations/IMigration';
import { ConfigLoader } from '../../../shared/config/ConfigLoader';

/** Expand only reciprocal, level-based evolution ancestry; never other branches or special forms. */
export class Migration029CompleteEvolutionCollection implements IMigration {
  version = 29;
  name = 'complete_evolution_collection';
  atomicSQLite = true;

  private ancestrySql(): string {
    const config = ConfigLoader.Instance.LoadXmlSync<any>('data/xml/spt.xml');
    const rows = config?.Monsters?.Monster;
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('Pet configuration unavailable for collection migration');
    const pets = new Map<number, any>(rows.filter(row => Number.isSafeInteger(Number(row.ID)) && Number(row.HP) > 0)
      .map(row => [Number(row.ID), row]));
    const ancestry: Record<string, number[]> = {};
    for (const [id, pet] of pets) {
      const ancestors: number[] = [];
      const seen = new Set([id]);
      let current = pet;
      while (Number(current.EvolvesFrom) > 0) {
        const parentId = Number(current.EvolvesFrom), parent = pets.get(parentId);
        if (!parent || Number(parent.EvolvesTo) !== Number(current.ID) ||
            !Number.isInteger(Number(parent.EvolvingLv)) || Number(parent.EvolvingLv) <= 0 ||
            Number(parent.EvolvingLv) > 100 || Number(parent.EvolvFlag || 0) !== 0) break;
        if (seen.has(parentId)) throw new Error('Cyclic ordinary evolution chain: ' + id);
        seen.add(parentId);
        ancestors.push(parentId);
        current = parent;
      }
      if (ancestors.length) ancestry[id] = ancestors;
    }
    return "'" + JSON.stringify(ancestry).replace(/'/g, "''") + "'";
  }

  upSQLite(): string[] {
    const ancestry = this.ancestrySql();
    const capture = (row: string) => `INSERT OR IGNORE INTO player_pet_collection (owner_id, pet_id)
      SELECT ${row}.owner_id, CAST(json_extract(p.value, '$.petId') AS INTEGER)
      FROM json_each(${row}.pet_list) p
      WHERE json_type(p.value, '$.petId') = 'integer' AND json_extract(p.value, '$.petId') > 0
      UNION
      SELECT ${row}.owner_id, CAST(a.value AS INTEGER)
      FROM json_each(${row}.pet_list) p,
        json_each(json_extract(${ancestry}, '$."' || CAST(json_extract(p.value, '$.petId') AS INTEGER) || '"')) a;`;
    return [
      'DROP TRIGGER IF EXISTS pet_collection_insert',
      'DROP TRIGGER IF EXISTS pet_collection_update',
      `CREATE TRIGGER pet_collection_insert AFTER INSERT ON player_pets BEGIN ${capture('NEW')} END`,
      `CREATE TRIGGER pet_collection_update AFTER UPDATE OF pet_list ON player_pets BEGIN ${capture('OLD')} ${capture('NEW')} END`,
      `INSERT OR IGNORE INTO player_pet_collection (owner_id, pet_id)
        SELECT p.owner_id, CAST(json_extract(j.value, '$.petId') AS INTEGER)
        FROM player_pets p, json_each(p.pet_list) j
        WHERE json_type(j.value, '$.petId') = 'integer' AND json_extract(j.value, '$.petId') > 0`,
      `INSERT OR IGNORE INTO player_pet_collection (owner_id, pet_id)
        SELECT c.owner_id, CAST(a.value AS INTEGER)
        FROM player_pet_collection c, json_each(json_extract(${ancestry}, '$."' || c.pet_id || '"')) a`,
    ];
  }

  upMySQL(): string[] {
    const ancestry = this.ancestrySql();
    const capture = (row: string) => `INSERT IGNORE INTO player_pet_collection (owner_id, pet_id)
      SELECT ${row}.owner_id, p.pet_id FROM JSON_TABLE(${row}.pet_list, '$[*]'
        COLUMNS (pet_id INT PATH '$.petId')) p WHERE p.pet_id > 0
      UNION
      SELECT ${row}.owner_id, a.pet_id FROM JSON_TABLE(${row}.pet_list, '$[*]'
        COLUMNS (pet_id INT PATH '$.petId')) p,
        JSON_TABLE(JSON_EXTRACT(${ancestry}, CONCAT('$."', p.pet_id, '"')), '$[*]'
          COLUMNS (pet_id INT PATH '$')) a;`;
    return [
      'DROP TRIGGER IF EXISTS pet_collection_insert',
      'DROP TRIGGER IF EXISTS pet_collection_update',
      `CREATE TRIGGER pet_collection_insert AFTER INSERT ON player_pets FOR EACH ROW BEGIN ${capture('NEW')} END`,
      `CREATE TRIGGER pet_collection_update AFTER UPDATE ON player_pets FOR EACH ROW BEGIN ${capture('OLD')} ${capture('NEW')} END`,
      `INSERT IGNORE INTO player_pet_collection (owner_id, pet_id)
        SELECT p.owner_id, j.pet_id FROM player_pets p,
        JSON_TABLE(p.pet_list, '$[*]' COLUMNS (pet_id INT PATH '$.petId')) j WHERE j.pet_id > 0`,
      `INSERT IGNORE INTO player_pet_collection (owner_id, pet_id)
        SELECT c.owner_id, a.pet_id FROM player_pet_collection c,
        JSON_TABLE(JSON_EXTRACT(${ancestry}, CONCAT('$."', c.pet_id, '"')), '$[*]'
          COLUMNS (pet_id INT PATH '$')) a`,
    ];
  }

  downSQLite(): string[] {
    const { Migration025CreatePetCollection } = require('./025_create_pet_collection');
    return ['DROP TRIGGER IF EXISTS pet_collection_insert', 'DROP TRIGGER IF EXISTS pet_collection_update',
      ...new Migration025CreatePetCollection().upSQLite().filter((sql: string) => sql.startsWith('CREATE TRIGGER'))];
  }

  downMySQL(): string[] {
    const { Migration025CreatePetCollection } = require('./025_create_pet_collection');
    return ['DROP TRIGGER IF EXISTS pet_collection_insert', 'DROP TRIGGER IF EXISTS pet_collection_update',
      ...new Migration025CreatePetCollection().upMySQL().filter((sql: string) => sql.startsWith('CREATE TRIGGER'))];
  }
}
