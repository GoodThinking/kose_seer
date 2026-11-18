'use strict';
class Migration026CreateExperienceSettings {
  constructor() { this.version = 26; this.name = 'create_experience_settings'; }
  upSQLite() {
    return [
      `CREATE TABLE player_experience_settings (
        owner_id INTEGER PRIMARY KEY REFERENCES players(user_id) ON DELETE CASCADE,
        battle_speed INTEGER NOT NULL DEFAULT 1 CHECK(battle_speed IN (1,2,4)),
        short_transitions INTEGER NOT NULL DEFAULT 0 CHECK(short_transitions IN (0,1))
      )`,
      `CREATE TABLE player_team_presets (
        owner_id INTEGER NOT NULL REFERENCES players(user_id) ON DELETE CASCADE,
        slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 3), members TEXT NOT NULL,
        PRIMARY KEY(owner_id, slot)
      )`
    ];
  }
  upMySQL() {
    return [
      `CREATE TABLE player_experience_settings (
        owner_id INT PRIMARY KEY, battle_speed INT NOT NULL DEFAULT 1,
        short_transitions INT NOT NULL DEFAULT 0
      )`,
      `CREATE TABLE player_team_presets (
        owner_id INT NOT NULL, slot INT NOT NULL, members TEXT NOT NULL,
        PRIMARY KEY(owner_id, slot)
      )`
    ];
  }
  downSQLite() { return ['DROP TABLE player_team_presets', 'DROP TABLE player_experience_settings']; }
  downMySQL() { return this.downSQLite(); }
}
module.exports = { Migration026CreateExperienceSettings };
