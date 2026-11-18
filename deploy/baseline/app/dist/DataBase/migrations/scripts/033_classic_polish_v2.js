'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration033ClassicPolishV2 = void 0;

class Migration033ClassicPolishV2 {
  constructor() {
    this.version = 33;
    this.name = '033_classic_polish_v2';
    this.atomicSQLite = true;
  }
  upMySQL() {
    return [
      'UPDATE players SET map_id = 5, pos_x = 300, pos_y = 300 WHERE map_id IN (550, 733)',
      'DROP TABLE IF EXISTS universe_encounters',
      'DROP TABLE IF EXISTS universe_progress'
    ];
  }
  upSQLite() {
    return [
      'UPDATE players SET map_id = 5, pos_x = 300, pos_y = 300 WHERE map_id IN (550, 733)',
      'DROP TABLE IF EXISTS universe_encounters',
      'DROP TABLE IF EXISTS universe_progress'
    ];
  }
}
exports.Migration033ClassicPolishV2 = Migration033ClassicPolishV2;
