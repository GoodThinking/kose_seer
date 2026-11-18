import { BaseManager } from '../Base/BaseManager';
import { PeopleWalkReqProto } from '../../../shared/proto/packets/req/map/PeopleWalkReqProto';
import { DanceActionReqProto } from '../../../shared/proto/packets/req/map/DanceActionReqProto';
import { PeopleTransformReqProto } from '../../../shared/proto/packets/req/map/PeopleTransformReqProto';
import { AimatReqProto } from '../../../shared/proto/packets/req/map/AimatReqProto';
import { ChatReqProto } from '../../../shared/proto/packets/req/map/ChatReqProto';
import { PlayerInstance } from '../Player/PlayerInstance';
/**
 * Handles high-frequency map actions (state + self response).
 * Broadcast to other players is handled by MapBroadcastManager via events.
 */
export declare class MapActionManager extends BaseManager {
    private _onlineTracker;
    constructor(player: PlayerInstance);
    HandlePeopleWalk(req: PeopleWalkReqProto): Promise<void>;
    HandleDanceAction(req: DanceActionReqProto): Promise<void>;
    HandlePeopleTransform(req: PeopleTransformReqProto): Promise<void>;
    HandleAimat(req: AimatReqProto): Promise<void>;
    HandleMapChat(req: ChatReqProto): Promise<void>;
    HandleChangeNickName(newNick: string): Promise<void>;
    HandleChangeColor(newColor: number): Promise<void>;
    HandleOnOrOffFlying(flyMode: number): Promise<void>;
}
//# sourceMappingURL=MapActionManager.d.ts.map