/**
 * 迁移脚本: 添加挑战进度字段到 players 表
 *
 * 注意：这是临时方案，最终这些字段会迁移到 player_challenge_progress 表
 * 但为了向后兼容，先在 players 表中添加这些字段
 */
import { IMigration } from '../IMigration';
export declare class Migration019AddChallengeFieldsToPlayers implements IMigration {
    version: number;
    name: string;
    upMySQL(): string[];
    upSQLite(): string[];
    downMySQL(): string[];
    downSQLite(): string[];
}
//# sourceMappingURL=019_add_challenge_fields_to_players.d.ts.map