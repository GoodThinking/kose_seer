"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketBattleReward = void 0;
const BaseProto_1 = require("../../../../../shared/proto/base/BaseProto");
const CommandID_1 = require("../../../../../shared/protocol/CommandID");
const BattleRewardRspProto_1 = require("../../../../../shared/proto/packets/rsp/battle/BattleRewardRspProto");
/**
 * 战斗奖励包（显示物品奖励弹窗）
 *
 * 客户端会显示 ItemInBagAlert 弹窗：
 * - 如果有物品奖励，逐个显示物品获得弹窗
 * - 如果有精灵奖励，显示精灵获得提示
 *
 * 特殊物品ID：
 * - 1: 赛尔豆（金币）
 * - 3: 积累经验
 * - 500001-600000: 基地仓库物品
 * - 600001-700000: 投掷道具
 * - 其他: 储存箱物品
 */
class PacketBattleReward extends BaseProto_1.BaseProto {
    _data;
    /**
     * @param items 物品奖励列表
     * @param petId 奖励精灵ID（可选）
     * @param captureTm 捕获时间（可选）
     * @param result 结果码（0=成功）
     */
    constructor(items, petId = 0, captureTm = 0, result = 0) {
        super(CommandID_1.CommandID.COMPLETE_TASK);
        const proto = new BattleRewardRspProto_1.BattleRewardRspProto();
        proto.taskId = 0; // 战斗奖励不是任务，设为0
        proto.petId = petId;
        proto.captureTm = captureTm;
        proto.items = items;
        this._data = proto.serialize();
        this.setResult(result);
    }
    serialize() {
        return this._data;
    }
    deserialize(_buffer) {
        throw new Error('PacketBattleReward.deserialize not implemented (response only)');
    }
}
exports.PacketBattleReward = PacketBattleReward;
//# sourceMappingURL=PacketBattleReward.js.map