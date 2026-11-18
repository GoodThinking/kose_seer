import { BaseProto } from '../../../base/BaseProto';
import { ServerInfoRaw } from './CommendOnlineRspProto';
/**
 * [CMD: RANGE_ONLINE (106)] 范围服务器查询响应
 * 响应: onlineCnt(4) + servers...
 */
export declare class RangeOnlineRspProto extends BaseProto {
    onlineCnt: number;
    servers: ServerInfoRaw[];
    constructor();
    serialize(): Buffer;
}
//# sourceMappingURL=RangeOnlineRspProto.d.ts.map