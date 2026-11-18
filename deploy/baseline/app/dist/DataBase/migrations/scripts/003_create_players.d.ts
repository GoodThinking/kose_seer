/**
 * 迁移脚本: 创建玩家表
 */
import { IMigration } from '../IMigration';
export declare class Migration003CreatePlayers implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=003_create_players.d.ts.map