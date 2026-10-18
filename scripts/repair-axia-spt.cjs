'use strict';
// Run while the game service is stopped, so cached progress cannot overwrite the repair.
const path = require('node:path'), assert = require('node:assert/strict');
const {parseArgs} = require('node:util');
const {values} = parseArgs({options: {app: {type: 'string'}, database: {type: 'string'}, apply: {type: 'boolean', default: false}}});
assert.ok(values.app && values.database, 'Required: --app runtime-root --database exact-sqlite-path [--apply]');
const Database = require(path.join(path.resolve(values.app), 'node_modules/better-sqlite3'));
const db = new Database(path.resolve(values.database), {readonly: !values.apply, fileMustExist: true});
try {
  const repair = () => {
    const rows = db.prepare("SELECT user_id,boss_achievement FROM player_challenge_progress WHERE substr(boss_achievement,34,1)=x'01'").all();
    const changes = [];
    const update = values.apply && db.prepare('UPDATE player_challenge_progress SET boss_achievement=? WHERE user_id=? AND boss_achievement=?');
    for (const row of rows) {
      assert.ok(Buffer.isBuffer(row.boss_achievement) && row.boss_achievement.length === 200, 'Unexpected achievement data for ' + row.user_id);
      assert.ok([0,1].includes(row.boss_achievement[3]), 'Unexpected SPT flag for ' + row.user_id);
      const corrected = Buffer.from(row.boss_achievement);
      corrected[3] = 1;
      corrected[33] = 0;
      changes.push({userId: row.user_id, from: 34, to: 4, alreadyCorrect: row.boss_achievement[3] === 1});
      if (values.apply) assert.equal(update.run(corrected, row.user_id, row.boss_achievement).changes, 1);
    }
    return changes;
  };
  const changes = values.apply ? db.transaction(repair).immediate() : repair();
  console.log(JSON.stringify({apply: values.apply, changes}));
} finally {
  db.close();
}
