import { BaseProto } from '../../../base/BaseProto';
import { IShinyConfigItem } from '../../../../config/game/interfaces/IShinyConfig';
/**
 * 异色配置响应
 * CMD 109001
 *
 * 协议格式：
 * - uint32: version (配置版本号)
 * - uint16: count (配置数量)
 * - 对于每个配置：
 *   - uint32: shinyId
 *   - UTF: name
 *   - boolean: enabled
 *   - 20 个 float: colorMatrix
 *   - uint32: glowColor (颜色值，如 0xFFD700)
 *   - float: glowAlpha
 *   - float: glowBlur
 *   - float: glowStrength
 * - uint16: mapOgreCount (当前地图野怪数量，最多 9 个)
 * - 对于每个野怪：
 *   - uint8: index (槽位索引 0-8)
 *   - uint32: shinyId (异色ID，0=无异色)
 */
export declare class ShinyConfigRspProto extends BaseProto {
    version: number;
    configs: IShinyConfigItem[];
    mapOgres: Array<{
        index: number;
        shinyId: number;
    }>;
    constructor();
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=ShinyConfigRspProto.d.ts.map