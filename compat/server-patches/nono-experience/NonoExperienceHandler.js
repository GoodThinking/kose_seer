'use strict';
const { Opcode, InjectType } = require('../../../../../shared/decorators');
const { BaseProto } = require('../../../../../shared/proto/base/BaseProto');
const { DatabaseManager } = require('../../../../../DataBase/DatabaseManager');
const { GameConfig } = require('../../../../../shared/config/game/GameConfig');

const SETTINGS = 91002;
class WordsPacket extends BaseProto {
  constructor(command, words, tail = Buffer.alloc(0)) { super(command); this.words = words; this.tail = tail; }
  serialize() {
    const body = Buffer.alloc(this.words.length * 4);
    this.words.forEach((value, index) => body.writeUInt32BE(value, index * 4));
    return this.tail.length ? Buffer.concat([body, this.tail]) : body;
  }
}
const reject = (player, command, result = 5001) => player.SendPacket(new WordsPacket(command, []).setResult(result));
async function settings(player) {
  const rows = await DatabaseManager.Instance.Query('SELECT battle_speed, short_transitions FROM player_experience_settings WHERE owner_id = ?', [player.Uid]);
  return rows[0] || { battle_speed: 1, short_transitions: 0 };
}
class ExperienceSettingsHandler {
  async Handle(session, head, body) {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 4 && body.length !== 12) return reject(player, SETTINGS);
    const operation = body.readUInt32BE(0);
    if (operation === 1 && body.length === 12) {
      const speed = body.readUInt32BE(4), short = body.readUInt32BE(8);
      if (![1, 2, 4].includes(speed) || short > 1) return reject(player, SETTINGS);
      const db = DatabaseManager.Instance;
      const suffix = db.DatabaseType === 'mysql'
        ? 'ON DUPLICATE KEY UPDATE battle_speed = VALUES(battle_speed), short_transitions = VALUES(short_transitions)'
        : 'ON CONFLICT(owner_id) DO UPDATE SET battle_speed = excluded.battle_speed, short_transitions = excluded.short_transitions';
      await db.Execute('INSERT INTO player_experience_settings (owner_id, battle_speed, short_transitions) VALUES (?, ?, ?) ' + suffix, [player.Uid, speed, short]);
    } else if (operation !== 0 || body.length !== 4) return reject(player, SETTINGS);
    const value = await settings(player);
    await player.SendPacket(new WordsPacket(SETTINGS, [value.battle_speed, value.short_transitions]));
  }
}
Opcode(SETTINGS, InjectType.NONE)(ExperienceSettingsHandler);

const { TeamPresetsHandler } = require('./TeamPresets');
class WildPreviewHandler {
  async Handle(session, head, body) {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 4 || body.readUInt32BE(0) !== player.Data.mapID) return reject(player, 91004);
    const mapId = player.Data.mapID;
    const rows = await DatabaseManager.Instance.Query('SELECT pet_id FROM player_pet_collection WHERE owner_id = ?', [player.Uid]);
    if (mapId !== player.Data.mapID) return reject(player, 91004);
    const collected = new Set(rows.map(row => row.pet_id));
    const config = GameConfig.GetMapConfigById(mapId);
    const ogres = player.MapSpawnManager.GetMapOgres(mapId);
    const words = [mapId, 9];
    for (let slot = 0; slot < 9; slot++) {
      const ogre = ogres[slot];
      const entry = config?.ogres.find(row => row.petId === (ogre.originalPetId || ogre.petId));
      words.push(slot, ogre.petId, ogre.shiny, entry?.level || entry?.minLevel || 0,
        entry?.level || entry?.maxLevel || 0, collected.has(ogre.petId) ? 1 : 0);
    }
    await player.SendPacket(new WordsPacket(91004, words));
  }
}
Opcode(91004, InjectType.NONE)(WildPreviewHandler);
module.exports = { ExperienceSettingsHandler, TeamPresetsHandler, WildPreviewHandler };
