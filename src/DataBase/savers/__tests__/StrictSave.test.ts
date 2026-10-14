import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { DatabaseManager } from '../../DatabaseManager';
import { DatabaseHelper } from '../../DatabaseHelper';
import { ItemData } from '../../models/ItemData';
import { PetData } from '../../models/PetData';
import { TaskData } from '../../models/TaskData';
import { Config } from '../../../shared/config/ServerConfig';

describe('opt-in storage error propagation through DatabaseHelper', () => {
  const db = DatabaseManager.Instance;
  const helper = DatabaseHelper.Instance;
  let directory: string;
  let oldDatabase: typeof Config.Config.database;
  const cases = [
    {table: 'player_items', field: 'item_list', save: (uid: number, strict?: boolean) => helper.SaveItemData(new ItemData(uid), strict)},
    {table: 'player_pets', field: 'pet_list', save: (uid: number, strict?: boolean) => helper.SavePetData(new PetData(uid), strict)},
    {table: 'player_tasks', field: 'task_list', save: (uid: number, strict?: boolean) => helper.SaveTaskData(new TaskData(uid), strict)},
  ];
  beforeAll(async () => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'kose-strict-save-'));
    oldDatabase = Config.Config.database;
    Config.Config.database = {type: 'sqlite', path: path.join(directory, 'save.sqlite')};
    await db.Initialize();
    for (const {table, field} of cases) {
      await db.Execute(`CREATE TABLE ${table} (owner_id INTEGER PRIMARY KEY, ${field} TEXT NOT NULL)`);
    }
    await db.Execute("ALTER TABLE player_tasks ADD COLUMN task_buffers TEXT NOT NULL DEFAULT '{}'");
  });
  afterAll(async () => {
    await db.Shutdown();
    Config.Config.database = oldDatabase;
    fs.rmSync(directory, {recursive: true, force: true});
  });
  test.each(cases)('$table strict update rejects a real SQLite write error and can save after recovery', async ({table, field, save}) => {
    await db.Execute(`INSERT INTO ${table} (owner_id, ${field}) VALUES (1, '[]')`);
    await db.Execute(`CREATE TRIGGER fail_update BEFORE UPDATE ON ${table} BEGIN SELECT RAISE(FAIL, 'strict-update-blocked'); END`);
    try {
      await expect(save(1, true)).rejects.toMatchObject({message: 'strict-update-blocked', code: 'SQLITE_CONSTRAINT_TRIGGER'});
      expect(await db.Query(`SELECT ${field} FROM ${table} WHERE owner_id=1`)).toEqual([{[field]: '[]'}]);
    } finally { await db.Execute('DROP TRIGGER fail_update'); }
    await expect(save(1, true)).resolves.toBeUndefined();
  });
  test.each(cases)('$table strict insert propagates failure without creating a row', async ({table, save}) => {
    await db.Execute(`CREATE TRIGGER fail_insert BEFORE INSERT ON ${table} BEGIN SELECT RAISE(FAIL, 'strict-insert-blocked'); END`);
    try {
      await expect(save(2, true)).rejects.toMatchObject({message: 'strict-insert-blocked', code: 'SQLITE_CONSTRAINT_TRIGGER'});
      expect(await db.Query(`SELECT owner_id FROM ${table} WHERE owner_id=2`)).toEqual([]);
    } finally { await db.Execute('DROP TRIGGER fail_insert'); }
    await expect(save(2, true)).resolves.toBeUndefined();
    expect(await db.Query(`SELECT owner_id FROM ${table} WHERE owner_id=2`)).toEqual([{owner_id: 2}]);
  });
  test.each(cases)('$table default contract still logs and resolves on storage failure', async ({table, save}) => {
    await db.Execute(`CREATE TRIGGER fail_legacy BEFORE INSERT ON ${table} BEGIN SELECT RAISE(FAIL, 'legacy-write-blocked'); END`);
    try {
      await expect(save(3)).resolves.toBeUndefined();
      expect(await db.Query(`SELECT owner_id FROM ${table} WHERE owner_id=3`)).toEqual([]);
    } finally { await db.Execute('DROP TRIGGER fail_legacy'); }
  });
});
