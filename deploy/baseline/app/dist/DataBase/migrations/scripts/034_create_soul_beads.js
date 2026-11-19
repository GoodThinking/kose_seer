'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.Migration034CreateSoulBeads = void 0;

/**
 * 魂珠表：魂珠列表、孵化、融合都读写 player_soul_beads，但此前没有迁移创建它，
 * 新环境登录时 GET_SOUL_BEAD_List(2354) 查询失败并回 5000。结构与线上现有表一致，已有表时不改动。
 */
class Migration034CreateSoulBeads {
  constructor() {
    this.version = 34;
    this.name = '034_create_soul_beads';
  }
  upMySQL() {
    return [
      `CREATE TABLE IF NOT EXISTS player_soul_beads (
        owner_id BIGINT NOT NULL,
        obtain_time BIGINT NOT NULL,
        item_id INT NOT NULL,
        buf BLOB NOT NULL,
        result_pet INT NOT NULL DEFAULT 0,
        PRIMARY KEY (owner_id, obtain_time)
      )`
    ];
  }
  upSQLite() {
    return [
      `CREATE TABLE IF NOT EXISTS player_soul_beads (
  owner_id INTEGER NOT NULL,
  obtain_time INTEGER NOT NULL,
  item_id INTEGER NOT NULL,
  buf BLOB NOT NULL,
  result_pet INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (owner_id, obtain_time)
)`
    ];
  }
}
exports.Migration034CreateSoulBeads = Migration034CreateSoulBeads;
