"use strict";
const { Migration030CreateUniverseEncounters } = require("./scripts/030_create_universe_encounters");
const { Migration031AddAlderProgress } = require("./scripts/031_add_alder_progress");
const { Migration032ClassicCleanup } = require("./scripts/032_classic_cleanup");
const { Migration033ClassicPolishV2 } = require("./scripts/033_classic_polish_v2");
const { Migration029CompleteEvolutionCollection } = require("./scripts/029_complete_evolution_collection");

const { Migration025CreatePetCollection } = require("./scripts/025_create_pet_collection");

Object.defineProperty(exports, "__esModule", { value: true });
exports.MigrationRunner = void 0;
/**
 * 数据库迁移执行器
 */
const DatabaseManager_1 = require("../DatabaseManager");
const utils_1 = require("../../shared/utils");
// 导入所有迁移脚本
const _001_create_accounts_1 = require("./scripts/001_create_accounts");
const _002_create_sessions_1 = require("./scripts/002_create_sessions");
const _003_create_players_1 = require("./scripts/003_create_players");
const _004_create_pets_1 = require("./scripts/004_create_pets");
const _005_create_email_codes_1 = require("./scripts/005_create_email_codes");
const _006_create_items_1 = require("./scripts/006_create_items");
const _009_create_friends_tables_1 = require("./scripts/009_create_friends_tables");
const _010_create_tasks_tables_1 = require("./scripts/010_create_tasks_tables");
const _006_create_mails_1 = require("./scripts/006_create_mails");
const _012_fix_all_tables_1 = require("./scripts/012_fix_all_tables");
const _013_add_allocatable_exp_1 = require("./scripts/013_add_allocatable_exp");
const _008_align_nono_fields_with_official_1 = require("./scripts/008_align_nono_fields_with_official");
const _014_add_mess_win_and_cur_title_1 = require("./scripts/014_add_mess_win_and_cur_title");
const _016_add_gold_field_1 = require("./scripts/016_add_gold_field");
const _017_add_cloth_ids_1 = require("./scripts/017_add_cloth_ids");
const _018_create_challenge_progress_table_1 = require("./scripts/018_create_challenge_progress_table");
const _019_add_challenge_fields_to_players_1 = require("./scripts/019_add_challenge_fields_to_players");
const _020_create_invitations_1 = require("./scripts/020_create_invitations");
const _021_create_receiver_claims_1 = require("./scripts/021_create_receiver_claims");
const _022_create_reward_boosts_1 = require("./scripts/022_create_reward_boosts");
const _024_create_essence_hatches_1 = require("./scripts/024_create_essence_hatches");
/**
 * 所有迁移脚本（按版本号排序）
 */
const { Migration026CreateExperienceSettings } = require("./scripts/026_create_experience_settings");
const { Migration027CreateStarArena } = require("./scripts/027_create_star_arena");
const { Migration028SplitGalaxyArenas } = require("./scripts/028_split_galaxy_arenas");
const AllMigrations = [
    new _001_create_accounts_1.Migration001CreateAccounts(),
    new _002_create_sessions_1.Migration002CreateSessions(),
    new _003_create_players_1.Migration003CreatePlayers(),
    new _004_create_pets_1.Migration004CreatePets(),
    new _005_create_email_codes_1.Migration005CreateEmailCodes(),
    new _006_create_items_1.Migration006CreateItems(),
    new _009_create_friends_tables_1.Migration009CreateFriendsTables(),
    new _010_create_tasks_tables_1.Migration010CreateTasksTables(),
    new _006_create_mails_1.Migration011CreateMails(),
    new _012_fix_all_tables_1.Migration012FixAllTables(),
    new _013_add_allocatable_exp_1.Migration013AddAllocatableExp(),
    new _008_align_nono_fields_with_official_1.Migration008AlignNoNoFieldsWithOfficial(),
    new _014_add_mess_win_and_cur_title_1.Migration014AddMessWinAndCurTitle(),
    new _016_add_gold_field_1.Migration016AddGoldField(),
    new _017_add_cloth_ids_1.Migration017AddClothIds(),
    new _018_create_challenge_progress_table_1.Migration018CreateChallengeProgressTable(),
    new _019_add_challenge_fields_to_players_1.Migration019AddChallengeFieldsToPlayers(),
    new _020_create_invitations_1.Migration020CreateInvitations(),
    new _021_create_receiver_claims_1.Migration021CreateReceiverClaims(),
    new _022_create_reward_boosts_1.Migration022CreateRewardBoosts(),
    new _024_create_essence_hatches_1.Migration024CreateEssenceHatches(),
  new Migration025CreatePetCollection(),
  new Migration026CreateExperienceSettings(),
  new Migration027CreateStarArena(),
  new Migration028SplitGalaxyArenas(),
  new Migration029CompleteEvolutionCollection(),
  new Migration030CreateUniverseEncounters(),
  new Migration031AddAlderProgress(),
  new Migration032ClassicCleanup(),
  new Migration033ClassicPolishV2(),
];
class MigrationRunner {
    _db;
    constructor() {
        this._db = DatabaseManager_1.DatabaseManager.Instance;
    }
    /**
     * 初始化迁移表
     */
    async initMigrationTable() {
        const dbType = this._db.DatabaseType;
        if (dbType === 'mysql') {
            await this._db.Execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INT PRIMARY KEY AUTO_INCREMENT,
          version INT NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
        }
        else {
            await this._db.Execute(`
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          version INTEGER NOT NULL UNIQUE,
          name TEXT NOT NULL,
          executed_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `);
        }
    }
    /**
     * 获取已执行的迁移版本
     */
    async getExecutedVersions() {
        const rows = await this._db.Query('SELECT version FROM migrations ORDER BY version');
        return rows.map(r => r.version);
    }
    /**
     * 记录迁移执行
     */
    async recordMigration(migration) {
        await this._db.Execute('INSERT INTO migrations (version, name) VALUES (?, ?)', [migration.version, migration.name]);
    }
    /**
     * 删除迁移记录
     */
    async removeMigrationRecord(version) {
        await this._db.Execute('DELETE FROM migrations WHERE version = ?', [version]);
    }
    /**
     * 执行所有待执行的迁移
     */
    async RunAll() {
        await this.initMigrationTable();
        const executedVersions = await this.getExecutedVersions();
        const dbType = this._db.DatabaseType;
        for (const migration of AllMigrations) {
            if (executedVersions.includes(migration.version)) {
                continue;
            }
            utils_1.Logger.Info(`[Migration] 执行迁移: ${migration.version}_${migration.name}`);
            try {
                const sqls = dbType === 'mysql' ? migration.upMySQL() : migration.upSQLite();
                if (dbType === 'sqlite' && migration.atomicSQLite) {
                    await this._db.WithConnection(async driver => {
                        await driver.beginTransaction();
                        try {
                            for (const sql of sqls) await driver.execute(sql);
                            await driver.execute('INSERT INTO migrations (version, name) VALUES (?, ?)', [migration.version, migration.name]);
                            await driver.commit();
                        } catch (error) { await driver.rollback(); throw error; }
                    });
                } else {
                    for (const sql of sqls) await this._db.Execute(sql);
                    await this.recordMigration(migration);
                }
                utils_1.Logger.Info(`[Migration] 迁移完成: ${migration.version}_${migration.name}`);
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                utils_1.Logger.Error(`[Migration] 迁移失败: ${migration.version}_${migration.name}`, error);
                throw err;
            }
        }
        utils_1.Logger.Info('[Migration] 所有迁移执行完成');
    }
    /**
     * 回滚最后一个迁移
     */
    async RollbackLast() {
        await this.initMigrationTable();
        const executedVersions = await this.getExecutedVersions();
        if (executedVersions.length === 0) {
            utils_1.Logger.Info('[Migration] 没有可回滚的迁移');
            return;
        }
        const lastVersion = Math.max(...executedVersions);
        const migration = AllMigrations.find(m => m.version === lastVersion);
        if (!migration) {
            utils_1.Logger.Error(`[Migration] 找不到版本 ${lastVersion} 的迁移脚本`);
            return;
        }
        const dbType = this._db.DatabaseType;
        utils_1.Logger.Info(`[Migration] 回滚迁移: ${migration.version}_${migration.name}`);
        try {
            const sqls = dbType === 'mysql' ? migration.downMySQL() : migration.downSQLite();
            for (const sql of sqls) {
                await this._db.Execute(sql);
            }
            await this.removeMigrationRecord(migration.version);
            utils_1.Logger.Info(`[Migration] 回滚完成: ${migration.version}_${migration.name}`);
        }
        catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            utils_1.Logger.Error(`[Migration] 回滚失败: ${migration.version}_${migration.name}`, error);
            throw err;
        }
    }
    /**
     * 回滚到指定版本
     */
    async RollbackTo(targetVersion) {
        await this.initMigrationTable();
        const executedVersions = await this.getExecutedVersions();
        const versionsToRollback = executedVersions
            .filter(v => v > targetVersion)
            .sort((a, b) => b - a);
        for (const version of versionsToRollback) {
            const migration = AllMigrations.find(m => m.version === version);
            if (!migration)
                continue;
            const dbType = this._db.DatabaseType;
            utils_1.Logger.Info(`[Migration] 回滚迁移: ${migration.version}_${migration.name}`);
            try {
                const sqls = dbType === 'mysql' ? migration.downMySQL() : migration.downSQLite();
                for (const sql of sqls) {
                    await this._db.Execute(sql);
                }
                await this.removeMigrationRecord(migration.version);
                utils_1.Logger.Info(`[Migration] 回滚完成: ${migration.version}_${migration.name}`);
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error(String(err));
                utils_1.Logger.Error(`[Migration] 回滚失败: ${migration.version}_${migration.name}`, error);
                throw err;
            }
        }
    }
    /**
     * 获取迁移状态
     */
    async GetStatus() {
        await this.initMigrationTable();
        const executedVersions = await this.getExecutedVersions();
        return AllMigrations.map(m => ({
            version: m.version,
            name: m.name,
            executed: executedVersions.includes(m.version)
        }));
    }
}
exports.MigrationRunner = MigrationRunner;
//# sourceMappingURL=MigrationRunner.js.map