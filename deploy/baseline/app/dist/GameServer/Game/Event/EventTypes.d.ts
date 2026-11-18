import { BattleType, BattleStatus } from '../../../shared/models/BattleModel';
export { BattleType, BattleStatus };
export declare const BattleEventType: {
    readonly BATTLE_START: "battle:start";
    readonly BATTLE_END: "battle:end";
    readonly ROUND_START: "battle:round_start";
    readonly ROUND_END: "battle:round_end";
    readonly ATTACK_RESULT: "battle:attack_result";
    readonly PET_DEAD: "battle:pet_dead";
    readonly PET_SWITCH: "battle:pet_switch";
    readonly STATUS_CHANGE: "battle:status_change";
    readonly CATCH_RESULT: "battle:catch_result";
    readonly ESCAPE_RESULT: "battle:escape_result";
};
export declare const PlayerEventType: {
    readonly LOGIN: "player:login";
    readonly LOGOUT: "player:logout";
    readonly LEVEL_UP: "player:level_up";
    readonly COIN_CHANGE: "player:coin_change";
};
export declare const PetEventType: {
    readonly PET_OBTAINED: "pet:obtained";
    readonly PET_RELEASED: "pet:released";
    readonly PET_EVOLUTION: "pet:evolution";
    readonly PET_LEVEL_UP: "pet:level_up";
};
export declare const ItemEventType: {
    readonly ITEM_GAINED: "item:gained";
    readonly ITEM_SPENT: "item:spent";
    readonly ITEM_USED: "item:used";
};
export declare const TaskEventType: {
    readonly TASK_ACCEPTED: "task:accepted";
    readonly TASK_COMPLETED: "task:completed";
    readonly TASK_PROGRESS: "task:progress";
};
export declare const SocialEventType: {
    readonly FRIEND_ADDED: "friend:added";
    readonly FRIEND_REMOVED: "friend:removed";
    readonly MAIL_RECEIVED: "mail:received";
    readonly MAIL_READ: "mail:read";
};
export declare const EconomyEventType: {
    readonly PURCHASE: "economy:purchase";
    readonly SELL: "economy:sell";
    readonly TRADE: "economy:trade";
    readonly COIN_CHANGE: "economy:coin_change";
};
export declare const MapEventType: {
    readonly PEOPLE_WALK: "map:people_walk";
    readonly DANCE_ACTION: "map:dance_action";
    readonly PEOPLE_TRANSFORM: "map:people_transform";
    readonly AIMAT: "map:aimat";
    readonly CHAT: "map:chat";
    readonly PET_SHOW: "map:pet_show";
    readonly CHANGE_NICKNAME: "map:change_nickname";
    readonly CHANGE_COLOR: "map:change_color";
    readonly ON_OR_OFF_FLYING: "map:on_or_off_flying";
};
/** Item gain source */
export declare enum ItemGainSource {
    BUY = "buy",
    GIVE = "give",
    DROP = "drop",
    GACHA = "gacha",
    TASK_REWARD = "task_reward",
    GOLD_BUY = "gold_buy"
}
/** Pet obtain source */
export declare enum PetObtainSource {
    GIVE = "give",
    CATCH = "catch",
    TASK_REWARD = "task_reward",
    BATTLE_REWARD = "battle_reward"
}
export interface IBattleStartEvent {
    type: typeof BattleEventType.BATTLE_START;
    timestamp: number;
    playerId?: number;
    battleType: BattleType;
    mapId: number;
    playerPetId: number;
    enemyPetId: number;
    enemyLevel: number;
}
export interface IBattleEndEvent {
    type: typeof BattleEventType.BATTLE_END;
    timestamp: number;
    playerId?: number;
    battleType: BattleType;
    mapId: number;
    isVictory: boolean;
    playerPetId: number;
    enemyPetId: number;
    rounds: number;
    extra: {
        puniDoorIndex?: number;
        sptId?: number;
        dropItems?: Array<{
            itemId: number;
            count: number;
        }>;
    };
}
export interface IBattleRoundStartEvent {
    type: typeof BattleEventType.ROUND_START;
    timestamp: number;
    playerId?: number;
    battleType: BattleType;
    mapId: number;
    round: number;
}
export interface IBattleRoundEndEvent {
    type: typeof BattleEventType.ROUND_END;
    timestamp: number;
    playerId?: number;
    battleType: BattleType;
    mapId: number;
    round: number;
    isOver: boolean;
    winnerId?: number;
}
export interface IAttackResultEvent {
    type: typeof BattleEventType.ATTACK_RESULT;
    timestamp: number;
    playerId?: number;
    attackerId: number;
    targetId: number;
    skillId: number;
    damage: number;
    isCritical: boolean;
    isMissed: boolean;
    hpChange: number;
}
export interface IPetDeadEvent {
    type: typeof BattleEventType.PET_DEAD;
    timestamp: number;
    playerId?: number;
    petId: number;
    catchTime: number;
    killerId: number;
}
export interface IPetSwitchEvent {
    type: typeof BattleEventType.PET_SWITCH;
    timestamp: number;
    playerId?: number;
    oldPetId: number;
    oldCatchTime: number;
    newPetId: number;
    newCatchTime: number;
}
export interface IStatusChangeEvent {
    type: typeof BattleEventType.STATUS_CHANGE;
    timestamp: number;
    playerId?: number;
    petId: number;
    status: BattleStatus;
    statusTurns: number;
    isAdd: boolean;
}
export interface ICatchResultEvent {
    type: typeof BattleEventType.CATCH_RESULT;
    timestamp: number;
    playerId?: number;
    targetPetId: number;
    success: boolean;
    capsuleId: number;
}
export interface IEscapeResultEvent {
    type: typeof BattleEventType.ESCAPE_RESULT;
    timestamp: number;
    playerId?: number;
    success: boolean;
    reason?: string;
}
export interface IItemGainedEvent {
    type: typeof ItemEventType.ITEM_GAINED;
    timestamp: number;
    playerId?: number;
    itemId: number;
    count: number;
    source: ItemGainSource;
}
export interface IItemSpentEvent {
    type: typeof ItemEventType.ITEM_SPENT;
    timestamp: number;
    playerId?: number;
    itemId: number;
    count: number;
    reason: string;
}
export interface IPetObtainedEvent {
    type: typeof PetEventType.PET_OBTAINED;
    timestamp: number;
    playerId?: number;
    petId: number;
    level: number;
    catchTime: number;
    source: PetObtainSource;
}
export interface IPetReleasedEvent {
    type: typeof PetEventType.PET_RELEASED;
    timestamp: number;
    playerId?: number;
    petId: number;
    catchTime: number;
}
export interface IPetEvolutionEvent {
    type: typeof PetEventType.PET_EVOLUTION;
    timestamp: number;
    playerId?: number;
    oldPetId: number;
    newPetId: number;
    level: number;
    catchTime: number;
}
export interface IPetLevelUpEvent {
    type: typeof PetEventType.PET_LEVEL_UP;
    timestamp: number;
    playerId?: number;
    petId: number;
    oldLevel: number;
    newLevel: number;
    catchTime: number;
}
export interface IPlayerLevelUpEvent {
    type: typeof PlayerEventType.LEVEL_UP;
    timestamp: number;
    playerId?: number;
    oldLevel: number;
    newLevel: number;
}
export interface ICoinChangeEvent {
    type: typeof PlayerEventType.COIN_CHANGE;
    timestamp: number;
    playerId?: number;
    oldCoins: number;
    newCoins: number;
    change: number;
    reason: string;
}
export interface IPlayerLoginEvent {
    type: typeof PlayerEventType.LOGIN;
    timestamp: number;
    playerId?: number;
}
export interface IPlayerLogoutEvent {
    type: typeof PlayerEventType.LOGOUT;
    timestamp: number;
    playerId?: number;
}
//# sourceMappingURL=EventTypes.d.ts.map