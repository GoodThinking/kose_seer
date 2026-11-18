'use strict';
Object.defineProperty(exports, '__esModule', {value: true});
exports.PetBargeListHandler = void 0;
const {Opcode, InjectType} = require('../../../../../shared/decorators');
const {CommandID} = require('../../../../../shared/protocol/CommandID');
const {BaseProto} = require('../../../../../shared/proto/base/BaseProto');
const {GameConfig} = require('../../../../../shared/config/game/GameConfig');
const {DatabaseManager} = require('../../../../../DataBase/DatabaseManager');

class PacketPetBargeList extends BaseProto {
  constructor(data) { super(CommandID.PET_BARGE_LIST); this.data = data; }
  serialize() { return this.data; }
}
class PetBargeListHandler {
  async Handle(session, _head, body) {
    const player = session.Player;
    if (!player) return;
    let startId = 1, endId = 1;
    if (body && body.length >= 8) { startId = body.readUInt32BE(0); endId = body.readUInt32BE(4); }
    else if (body && body.length >= 4) startId = endId = body.readUInt32BE(0);
    if (startId <= 0) startId = 1;
    if (endId < startId) endId = startId;
    if (endId - startId > 200) endId = startId + 200;
    const rows = await DatabaseManager.Instance.Query(
      'SELECT pet_id FROM player_pet_collection WHERE owner_id = ? AND pet_id >= ? AND pet_id <= ?',
      [player.Uid, startId, endId]);
    const captured = new Set(rows.map(row => Number(row.pet_id)));
    const ids = [];
    for (let id = startId; id <= endId; id++) if (GameConfig.GetPetById(id)) ids.push(id);
    const buf = Buffer.alloc(4 + ids.length * 16);
    buf.writeUInt32BE(ids.length, 0);
    ids.forEach((id, index) => {
      const offset = 4 + index * 16;
      buf.writeUInt32BE(id, offset);
      // Row presence denotes public metadata, not an encounter count.
      buf.writeUInt32BE(captured.has(id) ? 1 : 0, offset + 8);
    });
    await player.SendPacket(new PacketPetBargeList(buf));
  }
}
exports.PetBargeListHandler = Opcode(CommandID.PET_BARGE_LIST, InjectType.NONE)(PetBargeListHandler) || PetBargeListHandler;
