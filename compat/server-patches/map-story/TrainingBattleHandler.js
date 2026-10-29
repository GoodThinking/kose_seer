'use strict';
const { Opcode, InjectType } = require('../../../../../shared/decorators/Opcode');
const { PacketEmpty } = require('../../Send/PacketEmpty');
const { Logger } = require('../../../../../shared/utils/Logger');
const { SendForestAlert } = require('../../../../Game/Map/ForestMechanisms');
const Runtime = require('../../../../Game/Battle/TrainingBattleRuntime');
const exported = {};
for (const command of [7511, 7554, 7556, 7558, 7562, 7563, 7565, 7571, 7574, 7575, 7586, 7587]) {
    const Handler = class {
        async Handle(session, _head, body) {
            const player = session.Player;
            if (!player) return;
            try { await Runtime.Handle(player, command, body); }
            catch (error) {
                if (!(error instanceof Runtime.RequestError)) Logger.Error('[TrainingBattle] Request failed', error);
                // Delayed duplicate animation acknowledgements are stale data, not a new battle action.
                if (command === 7586) return;
                await player.SendPacket(new PacketEmpty(command).setResult(5001));
                await SendForestAlert(player, error instanceof Runtime.RequestError ? error.message :
                    '小队战斗中断，请返回训练入口核对精灵和奖励；已经保存的奖励不会重复发放。');
            }
        }
    };
    Opcode(command, InjectType.NONE)(Handler);
    exported['TrainingBattle' + command + 'Handler'] = Handler;
}
module.exports = exported;
