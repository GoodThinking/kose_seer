import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils/BufferWriter';
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
export class ShinyConfigRspProto extends BaseProto {
  public version: number = 0;
  public configs: IShinyConfigItem[] = [];
  public mapOgres: Array<{ index: number; shinyId: number }> = [];

  constructor() {
    super(CommandID.SHINY_CONFIG_GET);
  }

  public deserialize(buffer: Buffer): void {
    // 响应包不需要反序列化
  }

  public serialize(): Buffer {
    const writer = new BufferWriter();

    // 写入版本号
    writer.WriteUInt32(this.version);

    // 写入配置数量
    writer.WriteUInt16(this.configs.length);

    // 写入每个配置
    for (const config of this.configs) {
      // shinyId
      writer.WriteUInt32(config.shinyId);

      // name
      writer.WriteUTF(config.name);

      // enabled
      writer.WriteBoolean(config.enabled);

      // colorMatrix (20 个 float)
      if (config.colorMatrix && config.colorMatrix.length === 20) {
        for (let i = 0; i < 20; i++) {
          writer.WriteFloat(config.colorMatrix[i]);
        }
      } else {
        // 默认矩阵
        const defaultMatrix = [
          0.8, 0.2, 0.0, 0, 20,
          0.0, 0.6, 0.4, 0, 20,
          0.2, 0.0, 0.8, 0, 30,
          0,   0,   0,   1, 0
        ];
        for (let i = 0; i < 20; i++) {
          writer.WriteFloat(defaultMatrix[i]);
        }
      }

      // glow.color (解析为数字)
      const glowColorStr = config.glow?.color || '0xFFD700';
      const glowColor = parseInt(glowColorStr.replace('0x', ''), 16);
      writer.WriteUInt32(glowColor);

      // glow.alpha
      writer.WriteFloat(config.glow?.alpha ?? 0.8);

      // glow.blur
      writer.WriteFloat(config.glow?.blur ?? 12);

      // glow.strength
      writer.WriteFloat(config.glow?.strength ?? 2);
    }

    // 写入当前地图野怪异色信息
    writer.WriteUInt16(this.mapOgres.length);
    for (const ogre of this.mapOgres) {
      writer.WriteUInt8(ogre.index);
      writer.WriteUInt32(ogre.shinyId);
    }

    return writer.ToBuffer();
  }
}
