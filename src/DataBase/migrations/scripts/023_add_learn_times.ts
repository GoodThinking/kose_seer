import { IMigration } from '../IMigration';

/** Persists remaining uses for the legacy learning-power multiplier item. */
export class Migration023AddLearnTimes implements IMigration {
  version = 23;
  name = 'add_learn_times';

  upMySQL(): string[] {
    return [`ALTER TABLE players ADD COLUMN IF NOT EXISTS learn_times INT UNSIGNED NOT NULL DEFAULT 0`];
  }

  upSQLite(): string[] {
    return ['ALTER TABLE players ADD COLUMN learn_times INTEGER NOT NULL DEFAULT 0'];
  }

  downMySQL(): string[] {
    return ['ALTER TABLE players DROP COLUMN IF EXISTS learn_times'];
  }

  downSQLite(): string[] {
    return ['SELECT 1'];
  }
}
