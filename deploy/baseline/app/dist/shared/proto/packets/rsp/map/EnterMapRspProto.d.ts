import { BaseProto } from '../../../base/BaseProto';
import { SeerMapUserInfoProto } from '../../../common/SeerMapUserInfoProto';
/**
 * [CMD: 2001 ENTER_MAP] 进入地图响应
 * 返回玩家的完整信息
 */
export declare class EnterMapRspProto extends BaseProto {
    userInfo: SeerMapUserInfoProto;
    constructor(userInfo?: SeerMapUserInfoProto);
    serialize(): Buffer;
    setUserInfo(userInfo: SeerMapUserInfoProto): this;
}
//# sourceMappingURL=EnterMapRspProto.d.ts.map