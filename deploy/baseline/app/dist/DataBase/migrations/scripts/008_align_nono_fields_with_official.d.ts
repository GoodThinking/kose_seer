import { IMigration } from '../IMigration';
/**
 * 迁移008: 对齐NoNo字段与官方服务器
 *
 * 官方NoNo字段：
 * - flag, state, nick, superNono, color, power, mate, iq, ai
 * - birth, chargeTime, func (160位), superEnergy, superLevel, superStage
 *
 * 移除字段：
 * - nono_bio, nono_expire, nono_chip, nono_grow (官方包中没有这些字段)
 *
 * 添加字段：
 * - nono_super_energy, nono_super_stage (官方包中有这些字段)
 */
export declare class Migration008AlignNoNoFieldsWithOfficial implements IMigration {
    name: string;
    version: number;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=008_align_nono_fields_with_official.d.ts.map