'use strict';
const { Opcode, InjectType } = require('../../../../../shared/decorators');
const { BaseProto } = require('../../../../../shared/proto/base/BaseProto');
const { DatabaseManager } = require('../../../../../DataBase/DatabaseManager');
const { DatabaseHelper } = require('../../../../../DataBase/DatabaseHelper');
const { GameConfig } = require('../../../../../shared/config/game/GameConfig');

const SETTINGS = 91002;
const TEAMS = 91003;
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

async function sendTeams(player, operation, slot) {
  const rows = await DatabaseManager.Instance.Query('SELECT slot, members FROM player_team_presets WHERE owner_id = ? ORDER BY slot', [player.Uid]);
  const words = [operation, slot, rows.length];
  for (const row of rows) {
    const members = JSON.parse(row.members);
    words.push(row.slot, members.length);
    for (const catchTime of members) {
      const pet = player.PetManager.PetData.GetPetByCatchTime(catchTime);
      words.push(catchTime, pet ? pet.petId : 0);
    }
  }
  const bag = operation === 2 ? player.PetManager.PetData.GetPetsInBag() : [];
  if (operation === 2) words.push(bag.length);
  const tail = Buffer.concat(player.PetManager.GetPetProtoList(bag).map(pet => pet.serialize(player.ClientProtocol)));
  await player.SendPacket(new WordsPacket(TEAMS, words, tail));
}
class TeamPresetsHandler {
  async Handle(session, head, body) {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 8) return reject(player, TEAMS);
    const operation = body.readUInt32BE(0), slot = body.readUInt32BE(4);
    if (operation === 0) return sendTeams(player, operation, slot);
    if (![1, 2].includes(operation) || slot < 1 || slot > 3) return reject(player, TEAMS);
    const recovery = player.BattleManager.BeginOutOfBattleRecovery();
    if (!recovery) return reject(player, TEAMS);
    const data = player.PetManager.PetData;
    let release;
    try {
      release = await data.AcquireMutation();
      if (!recovery.isCurrent()) return reject(player, TEAMS);
      if (data.HasPendingGrant()) return reject(player, TEAMS);
      if (operation === 1) {
        const bag = data.GetPetsInBag();
        if (!bag.length || bag.length > 6) return reject(player, TEAMS);
        const members = JSON.stringify(bag.map(pet => pet.catchTime));
        const db = DatabaseManager.Instance;
        const suffix = db.DatabaseType === 'mysql'
          ? 'ON DUPLICATE KEY UPDATE members = VALUES(members)'
          : 'ON CONFLICT(owner_id, slot) DO UPDATE SET members = excluded.members';
        await db.Execute('INSERT INTO player_team_presets (owner_id, slot, members) VALUES (?, ?, ?) ' + suffix, [player.Uid, slot, members]);
      } else {
        const [row] = await DatabaseManager.Instance.Query('SELECT members FROM player_team_presets WHERE owner_id = ? AND slot = ?', [player.Uid, slot]);
        if (!row) return reject(player, TEAMS);
        const members = JSON.parse(row.members);
        if (!members.length || members.length > 6 || new Set(members).size !== members.length || members.some(id => !data.GetPetByCatchTime(id))) return reject(player, TEAMS);
        const order = new Map(members.map((id, index) => [id, index]));
        const planned = data.PetList.map(pet => ({ ...pet, isInBag: order.has(pet.catchTime), isDefault: pet.catchTime === members[0], bagOrder: order.has(pet.catchTime) ? order.get(pet.catchTime) : undefined, isRoomShow: order.has(pet.catchTime) ? false : pet.isRoomShow }));
        const first = data.GetPetByCatchTime(members[0]);
        await data.CommitPetUpdate(first, planned.find(pet => pet.catchTime === first.catchTime), staged => {
          staged.PetList = planned;
          return DatabaseHelper.Instance.SavePetData(staged, true);
        }, () => {
          const byId = new Map(planned.map(pet => [pet.catchTime, pet]));
          for (const pet of data.PetList) {
            const next = byId.get(pet.catchTime);
            pet.isInBag = next.isInBag;
            pet.isDefault = next.isDefault;
            pet.isRoomShow = next.isRoomShow;
            pet.bagOrder = next.bagOrder;
          }
        });
      }
      if (recovery.isCurrent()) await sendTeams(player, operation, slot);
    } finally {
      if (release) release();
      recovery.release();
    }
  }
}
Opcode(TEAMS, InjectType.NONE)(TeamPresetsHandler);
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
