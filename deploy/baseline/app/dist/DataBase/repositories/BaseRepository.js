"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
/**
 * 基础仓库类
 * 提供通用的数据库访问功能
 *
 * 注意：仅用于 Player 相关的 Repository（Account/Session/EmailCode/Player）
 * 游戏数据（Item/Pet/Task/Friend/Mail）使用 DatabaseHelper + Data 模式
 */
const DatabaseManager_1 = require("../DatabaseManager");
class BaseRepository {
    _db;
    constructor() {
        this._db = DatabaseManager_1.DatabaseManager.Instance;
    }
    /**
     * 根据ID查询
     */
    async FindById(id) {
        const rows = await this._db.Query(`SELECT * FROM ${this._tableName} WHERE id = ?`, [id]);
        return rows.length > 0 ? rows[0] : null;
    }
    /**
     * 查询所有
     */
    async FindAll() {
        return this._db.Query(`SELECT * FROM ${this._tableName}`);
    }
    /**
     * 根据条件查询
     */
    async FindBy(conditions) {
        const keys = Object.keys(conditions);
        if (keys.length === 0) {
            return this.FindAll();
        }
        const whereClauses = keys.map(k => `${this.toSnakeCase(k)} = ?`).join(' AND ');
        const values = Object.values(conditions);
        return this._db.Query(`SELECT * FROM ${this._tableName} WHERE ${whereClauses}`, values);
    }
    /**
     * 根据条件查询单条
     */
    async FindOneBy(conditions) {
        const rows = await this.FindBy(conditions);
        return rows.length > 0 ? rows[0] : null;
    }
    /**
     * 插入数据
     */
    async Insert(data) {
        const keys = Object.keys(data);
        const columns = keys.map(k => this.toSnakeCase(k)).join(', ');
        const placeholders = keys.map(() => '?').join(', ');
        const values = Object.values(data);
        const result = await this._db.Execute(`INSERT INTO ${this._tableName} (${columns}) VALUES (${placeholders})`, values);
        return result.insertId;
    }
    /**
     * 更新数据
     */
    async Update(id, data) {
        const keys = Object.keys(data);
        if (keys.length === 0)
            return false;
        const setClauses = keys.map(k => `${this.toSnakeCase(k)} = ?`).join(', ');
        const values = [...Object.values(data), id];
        const result = await this._db.Execute(`UPDATE ${this._tableName} SET ${setClauses} WHERE id = ?`, values);
        return result.affectedRows > 0;
    }
    /**
     * 删除数据
     */
    async Delete(id) {
        const result = await this._db.Execute(`DELETE FROM ${this._tableName} WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    /**
     * 统计数量
     */
    async Count(conditions) {
        let sql = `SELECT COUNT(*) as count FROM ${this._tableName}`;
        let values = [];
        if (conditions) {
            const keys = Object.keys(conditions);
            if (keys.length > 0) {
                const whereClauses = keys.map(k => `${this.toSnakeCase(k)} = ?`).join(' AND ');
                sql += ` WHERE ${whereClauses}`;
                values = Object.values(conditions);
            }
        }
        const rows = await this._db.Query(sql, values);
        return rows[0]?.count || 0;
    }
    /**
     * 检查是否存在
     */
    async Exists(conditions) {
        const count = await this.Count(conditions);
        return count > 0;
    }
    /**
     * 驼峰转蛇形
     */
    toSnakeCase(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    /**
     * 蛇形转驼峰
     */
    toCamelCase(str) {
        return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    }
    /**
     * 将数据库行转换为实体对象
     */
    rowToEntity(row) {
        const entity = {};
        for (const key of Object.keys(row)) {
            entity[this.toCamelCase(key)] = row[key];
        }
        return entity;
    }
    /**
     * 将实体对象转换为数据库行
     */
    entityToRow(entity) {
        const row = {};
        for (const key of Object.keys(entity)) {
            row[this.toSnakeCase(key)] = entity[key];
        }
        return row;
    }
}
exports.BaseRepository = BaseRepository;
//# sourceMappingURL=BaseRepository.js.map