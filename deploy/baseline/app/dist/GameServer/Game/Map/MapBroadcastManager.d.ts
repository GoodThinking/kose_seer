import { BaseManager } from '../Base/BaseManager';
import { GameEventBus } from '../Event/GameEventBus';
/**
 * Listens to map domain events and broadcasts packets to other players in map.
 */
export declare class MapBroadcastManager extends BaseManager {
    private _broadcastService;
    RegisterEvents(eventBus: GameEventBus): void;
    private OnPeopleWalk;
    private OnDanceAction;
    private OnPeopleTransform;
    private OnAimat;
    private OnChat;
    private OnPetShow;
    private OnChangeNickname;
    private OnChangeColor;
    private OnOrOffFlying;
    private BroadcastToMapOthers;
}
//# sourceMappingURL=MapBroadcastManager.d.ts.map