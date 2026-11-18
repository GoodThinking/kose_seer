'use strict';
const crypto = require('node:crypto');
const { Opcode, InjectType } = require('../../../../../shared/decorators');
const { BaseProto } = require('../../../../../shared/proto/base/BaseProto');
const { DatabaseManager } = require('../../../../../DataBase/DatabaseManager');
const { DatabaseHelper } = require('../../../../../DataBase/DatabaseHelper');
const { GameConfig } = require('../../../../../shared/config/game/GameConfig');
const { GetPetSkillPP, GetSkillMaxPP } = require('../../../../Game/Pet/PetPP');
const { SptSystem } = require('../../../../Game/Pet/SptSystem');
const { Logger } = require('../../../../../shared/utils');
const COMMAND = 91003;
class PacketTeams extends BaseProto {
  constructor(value, player, bag = []) { super(COMMAND); this.value = value; this.player = player; this.bag = bag; }
  serialize() {
    const json = Buffer.from(JSON.stringify({ version: 2, ...this.value }), 'utf8');
    const header = Buffer.alloc(4); header.writeUInt32BE(json.length);
    const count = Buffer.alloc(4); count.writeUInt32BE(this.bag.length);
    return Buffer.concat([header, json, count, ...this.player.PetManager.GetPetProtoList(this.bag).map(pet => pet.serialize(this.player.ClientProtocol))]);
  }
}
const digest = value => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
class TeamPresets {
  static Decode(row, pets) {
    if (!row) return null;
    const value = JSON.parse(row.members);
    // Convert the old member-only data once; missing pets remain visibly invalid, never substituted.
    if (Array.isArray(value)) return { version: 2, name: '队伍' + row.slot, members: value.map(catchTime => {
      const pet = pets.GetPetByCatchTime(catchTime);
      return { catchTime, petId: pet?.petId || 0, skills: pet?.skillArray.slice() || [] };
    }) };
    if (value.version !== 2 || typeof value.name !== 'string' || !Array.isArray(value.members)) throw new Error('Invalid stored team preset');
    return value;
  }
  static Revision(row, data) {
    return digest({ stored: row?.members || null, pets: data.PetList.map(p => [p.catchTime, p.petId, p.level, p.isInBag, p.isDefault, p.bagOrder, p.skillArray, p.skillPP, p.skillPPArchive]) });
  }
  static Member(entry, data) {
    const pet = data.GetPetByCatchTime(entry.catchTime);
    const label = GameConfig.GetPetById(pet?.petId || entry.petId)?.DefName || '精灵已不在仓库';
    const moves = GameConfig.GetPetById(pet?.petId)?.LearnableMoves?.Move;
    const learnable = new Set((Array.isArray(moves) ? moves : moves ? [moves] : []).filter(move => move.LearningLv <= pet?.level).map(move => move.ID));
    // GivePet and level-up use SPT moves as well as PET_CONFIG; preserve those legitimately granted moves.
    if (pet) for (const move of SptSystem.GetLearnableMovesByLevel(pet.petId, pet.level)) learnable.add(move.id);
    let error = !pet ? '精灵已不在仓库' : pet.petId !== entry.petId ? '精灵形态已变化，请重新保存' : '';
    if (!error && (!Array.isArray(entry.skills) || entry.skills.length < 1 || entry.skills.length > 4 || new Set(entry.skills).size !== entry.skills.length)) error = '配招为空或重复，请重新保存';
    if (!error) {
      const invalid = entry.skills.find(id => !Number.isInteger(id) || !GameConfig.GetSkillById(id) || !learnable.has(id));
      if (invalid !== undefined) error = label + '：当前形态或等级不能学习' + (GameConfig.GetSkillById(invalid)?.Name || '技能' + invalid);
    }
    return { ...entry, label, error, current: pet?.skillArray.slice() || [], skillNames: (entry.skills || []).map(id => GameConfig.GetSkillById(id)?.Name || String(id)) };
  }
  static async Rows(player) {
    const db = DatabaseManager.Instance, data = player.PetManager.PetData;
    const rows = await db.Query('SELECT slot, members FROM player_team_presets WHERE owner_id=? ORDER BY slot', [player.Uid]);
    for (const row of rows) {
      if (Array.isArray(JSON.parse(row.members))) {
        const upgraded = JSON.stringify(this.Decode(row, data));
        const result = await db.Execute('UPDATE player_team_presets SET members=? WHERE owner_id=? AND slot=? AND members=?', [upgraded, player.Uid, row.slot, row.members]);
        if (result.affectedRows !== 1) throw new Error('Concurrent legacy preset update');
        row.members = upgraded;
      }
    }
    return rows;
  }
  static View(row, slot, data) {
    const preset = this.Decode(row, data);
    const members = preset?.members.map(entry => this.Member(entry, data)) || [];
    const invalid = !preset ? '该位置尚未保存队伍' : members.length < 1 || members.length > 6 || new Set(members.map(m => m.catchTime)).size !== members.length ? '成员为空或重复，请重新保存' : members.find(m => m.error)?.error || '';
    return { slot, name: preset?.name || '队伍' + slot, saved: !!preset, members, error: invalid, revision: this.Revision(row, data) };
  }
  static async Reply(player, operation, slot, extra = {}) {
    const rows = await this.Rows(player), data = player.PetManager.PetData;
    const teams = [1, 2, 3].map(index => this.View(rows.find(row => row.slot === index), index, data));
    return player.SendPacket(new PacketTeams({ ok: true, operation, slot, teams, ...extra }, player, operation === 2 && !extra.error ? data.GetPetsInBag() : []));
  }
  static async Handle(player, body) {
    let input;
    try { if (body.length > 1024) throw new Error(); input = JSON.parse(body.toString('utf8')); } catch { return player.SendPacket(new PacketTeams({ ok: false, error: '队伍请求格式错误，请刷新客户端' }, player)); }
    const { version, operation, slot, revision } = input;
    if (version !== 2 || ![0, 1, 2, 3].includes(operation) || (operation !== 0 && ![1, 2, 3].includes(slot))) return player.SendPacket(new PacketTeams({ ok: false, error: '队伍请求无效，请刷新客户端' }, player));
    const recovery = player.BattleManager.BeginOutOfBattleRecovery();
    if (!recovery) return player.SendPacket(new PacketTeams({ ok: false, error: '战斗或其他精灵操作尚未结束，暂时不能操作队伍' }, player));
    let release;
    try {
      const data = player.PetManager.PetData;
      release = await data.AcquireMutation();
      if (!recovery.isCurrent() || data.HasPendingGrant()) return player.SendPacket(new PacketTeams({ ok: false, error: '精灵状态正在变化，请重新打开队伍' }, player));
      const rows = await this.Rows(player), row = rows.find(value => value.slot === slot);
      if (operation === 0 || operation === 3) return this.Reply(player, operation, slot);
      if (revision !== this.Revision(row, data)) return this.Reply(player, operation, slot, { ok: false, error: '预览后队伍或精灵状态已变化，请重新预览，不会自动重试' });
      if (operation === 1) {
        const name = typeof input.name === 'string' ? input.name.trim() : '';
        if (!name || [...name].length > 12 || /[\x00-\x1f\x7f<>]/.test(name)) return this.Reply(player, operation, slot, { ok: false, error: '队伍名需为1至12个字符，不能包含控制字符或尖括号' });
        const bag = data.GetPetsInBag();
        if (!bag.length || bag.length > 6) return this.Reply(player, operation, slot, { ok: false, error: '请先准备1至6只背包精灵' });
        const preset = { version: 2, name, members: bag.map(pet => ({ catchTime: pet.catchTime, petId: pet.petId, skills: pet.skillArray.slice() })) };
        const error = preset.members.map(entry => this.Member(entry, data)).find(entry => entry.error)?.error;
        if (error) return this.Reply(player, operation, slot, { ok: false, error });
        const db = DatabaseManager.Instance;
        const suffix = db.DatabaseType === 'mysql' ? 'ON DUPLICATE KEY UPDATE members=VALUES(members)' : 'ON CONFLICT(owner_id,slot) DO UPDATE SET members=excluded.members';
        await db.Execute('INSERT INTO player_team_presets(owner_id,slot,members) VALUES(?,?,?) ' + suffix, [player.Uid, slot, JSON.stringify(preset)]);
      } else {
        const view = this.View(row, slot, data);
        if (view.error) return this.Reply(player, operation, slot, { ok: false, error: view.error });
        const order = new Map(view.members.map((entry, index) => [entry.catchTime, index]));
        const planned = data.PetList.map(pet => {
          const next = { ...pet, isInBag: order.has(pet.catchTime), isDefault: pet.catchTime === view.members[0].catchTime, bagOrder: order.get(pet.catchTime), isRoomShow: order.has(pet.catchTime) ? false : pet.isRoomShow };
          const entry = view.members.find(member => member.catchTime === pet.catchTime);
          if (entry) {
            const bank = { ...pet.skillPPArchive, ...pet.skillPP };
            next.skillPPArchive = bank;
            next.skillArray = entry.skills.slice();
            next.skillPP = { ...bank };
            for (const skill of next.skillArray) next.skillPP[skill] = bank[skill] === undefined ? GetSkillMaxPP(skill) : GetPetSkillPP({ skillPP: bank }, skill);
          }
          return next;
        });
        const first = data.GetPetByCatchTime(view.members[0].catchTime);
        await data.CommitPetUpdate(first, planned.find(pet => pet.catchTime === first.catchTime), staged => {
          staged.PetList = planned;
          return DatabaseHelper.Instance.SavePetData(staged, true);
        }, () => {
          const nextById = new Map(planned.map(pet => [pet.catchTime, pet]));
          for (const pet of data.PetList) Object.assign(pet, nextById.get(pet.catchTime));
        });
      }
      if (recovery.isCurrent()) return this.Reply(player, operation, slot);
    } finally { release?.(); recovery.release(); }
  }
}
class TeamPresetsHandler {
  async Handle(session, _head, body) {
    if (!session.Player) return;
    try { return await TeamPresets.Handle(session.Player, body); }
    catch (error) {
      Logger.Error('[TeamPresets] Operation failed; never replay an uncertain mutation', error);
      return session.Player.SendPacket(new PacketTeams({ ok: false, error: '队伍操作未完成，请重新读取确认；不会自动重试' }, session.Player));
    }
  }
}
Opcode(COMMAND, InjectType.NONE)(TeamPresetsHandler);
module.exports = { TeamPresets, TeamPresetsHandler, PacketTeams };
