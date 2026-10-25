'use strict';
const { Opcode, InjectType } = require('../../../../../shared/decorators');
const { BattleManager } = require('../../../../Game/Battle/BattleManager');
const { BattleExperience, PacketExperience } = require('../../../../Game/Battle/BattleExperience');
BattleExperience.Install(BattleManager);
class BattleExperienceHandler {
  async Handle(session, _head, body) {
    const player = session.Player;
    if (!player) return;
    if (body.length !== 4 || body.readUInt32BE(0) > 1) return player.SendPacket(new PacketExperience({ ok: false, error: '战况请求无效' }));
    const operation = body.readUInt32BE(0);
    if (operation === 1) return player.SendPacket(new PacketExperience({ ok: true, operation, active: false, report: player.lastBattleExperience || null }));
    return player.SendPacket(new PacketExperience(BattleExperience.View(player.BattleManager, operation)));
  }
}
exports.BattleExperienceHandler = Opcode(91013, InjectType.NONE)(BattleExperienceHandler) || BattleExperienceHandler;
