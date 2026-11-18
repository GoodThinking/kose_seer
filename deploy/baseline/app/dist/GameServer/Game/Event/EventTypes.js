"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PetObtainSource = exports.ItemGainSource = exports.MapEventType = exports.EconomyEventType = exports.SocialEventType = exports.TaskEventType = exports.ItemEventType = exports.PetEventType = exports.PlayerEventType = exports.BattleEventType = exports.BattleStatus = exports.BattleType = void 0;
// Game event constants and payload types.
const BattleModel_1 = require("../../../shared/models/BattleModel");
Object.defineProperty(exports, "BattleType", { enumerable: true, get: function () { return BattleModel_1.BattleType; } });
Object.defineProperty(exports, "BattleStatus", { enumerable: true, get: function () { return BattleModel_1.BattleStatus; } });
exports.BattleEventType = {
    // Battle lifecycle
    BATTLE_START: 'battle:start',
    BATTLE_END: 'battle:end',
    // Round lifecycle
    ROUND_START: 'battle:round_start',
    ROUND_END: 'battle:round_end',
    // Attack result
    ATTACK_RESULT: 'battle:attack_result',
    // Pet state
    PET_DEAD: 'battle:pet_dead',
    PET_SWITCH: 'battle:pet_switch',
    // Status change
    STATUS_CHANGE: 'battle:status_change',
    // Catch
    CATCH_RESULT: 'battle:catch_result',
    // Escape
    ESCAPE_RESULT: 'battle:escape_result',
};
exports.PlayerEventType = {
    LOGIN: 'player:login',
    LOGOUT: 'player:logout',
    LEVEL_UP: 'player:level_up',
    COIN_CHANGE: 'player:coin_change',
};
exports.PetEventType = {
    PET_OBTAINED: 'pet:obtained',
    PET_RELEASED: 'pet:released',
    PET_EVOLUTION: 'pet:evolution',
    PET_LEVEL_UP: 'pet:level_up',
};
exports.ItemEventType = {
    ITEM_GAINED: 'item:gained',
    ITEM_SPENT: 'item:spent',
    ITEM_USED: 'item:used',
};
exports.TaskEventType = {
    TASK_ACCEPTED: 'task:accepted',
    TASK_COMPLETED: 'task:completed',
    TASK_PROGRESS: 'task:progress',
};
exports.SocialEventType = {
    FRIEND_ADDED: 'friend:added',
    FRIEND_REMOVED: 'friend:removed',
    MAIL_RECEIVED: 'mail:received',
    MAIL_READ: 'mail:read',
};
exports.EconomyEventType = {
    PURCHASE: 'economy:purchase',
    SELL: 'economy:sell',
    TRADE: 'economy:trade',
    COIN_CHANGE: 'economy:coin_change',
};
exports.MapEventType = {
    PEOPLE_WALK: 'map:people_walk',
    DANCE_ACTION: 'map:dance_action',
    PEOPLE_TRANSFORM: 'map:people_transform',
    AIMAT: 'map:aimat',
    CHAT: 'map:chat',
    PET_SHOW: 'map:pet_show',
    CHANGE_NICKNAME: 'map:change_nickname',
    CHANGE_COLOR: 'map:change_color',
    ON_OR_OFF_FLYING: 'map:on_or_off_flying',
};
// ==================== Event source enums ====================
/** Item gain source */
var ItemGainSource;
(function (ItemGainSource) {
    ItemGainSource["BUY"] = "buy";
    ItemGainSource["GIVE"] = "give";
    ItemGainSource["DROP"] = "drop";
    ItemGainSource["GACHA"] = "gacha";
    ItemGainSource["TASK_REWARD"] = "task_reward";
    ItemGainSource["GOLD_BUY"] = "gold_buy";
})(ItemGainSource || (exports.ItemGainSource = ItemGainSource = {}));
/** Pet obtain source */
var PetObtainSource;
(function (PetObtainSource) {
    PetObtainSource["GIVE"] = "give";
    PetObtainSource["CATCH"] = "catch";
    PetObtainSource["TASK_REWARD"] = "task_reward";
    PetObtainSource["BATTLE_REWARD"] = "battle_reward";
})(PetObtainSource || (exports.PetObtainSource = PetObtainSource = {}));
//# sourceMappingURL=EventTypes.js.map