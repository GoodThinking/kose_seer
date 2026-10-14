/**
 * 数据库管理器
 * 统一管理数据库连接和操作
 */
import { IDriver } from './drivers/IDriver';
import { MySQLDriver } from './drivers/MySQLDriver';
import { SQLiteDriver } from './drivers/SQLiteDriver';
import { Config } from '../shared/config';
import { Logger } from '../shared/utils';

export class DatabaseManager {
  private static _instance: DatabaseManager | null = null;
  private _driver: IDriver | null = null;
  private operationTail: Promise<void> = Promise.resolve();
  private closing = false;
  private shutdownPromise: Promise<void> | null = null;

  /** Serializes access to the driver, whose transaction connection is shared.
   * Callbacks must use the supplied driver, not re-enter this manager. */
  public async WithConnection<T>(callback: (driver: IDriver) => Promise<T>): Promise<T> {
    if (this.closing) throw new Error('数据库正在关闭');
    return this.Enqueue(callback);
  }

  private async Enqueue<T>(callback: (driver: IDriver) => Promise<T>): Promise<T> {
    const previous = this.operationTail;
    let release!: () => void;
    this.operationTail = new Promise<void>(resolve => { release = resolve; });
    await previous;
    try { return await callback(this.Driver); } finally { release(); }
  }

  private constructor() {
    // 使用统一配置
  }

  /**
   * 获取单例实例
   */
  public static get Instance(): DatabaseManager {
    if (!DatabaseManager._instance) {
      DatabaseManager._instance = new DatabaseManager();
    }
    return DatabaseManager._instance;
  }

  /**
   * 初始化数据库连接
   */
  public async Initialize(): Promise<void> {
    if (this.shutdownPromise) await this.shutdownPromise;
    if (this._driver?.isConnected()) {
      Logger.Warn('[DatabaseManager] 数据库已连接');
      return;
    }

    const dbConfig = Config.Database;
    Logger.Info(`[DatabaseManager] 使用 ${dbConfig.type} 数据库`);

    // 根据配置创建驱动
    if (dbConfig.type === 'mysql') {
      if (!dbConfig.host || !dbConfig.database) {
        throw new Error('MySQL 配置缺失');
      }
      this._driver = new MySQLDriver({
        host: dbConfig.host,
        port: dbConfig.port || 3306,
        user: dbConfig.username || 'root',
        password: dbConfig.password || '',
        database: dbConfig.database,
        connectionLimit: 10,
      });
    } else if (dbConfig.type === 'sqlite') {
      if (!dbConfig.path) {
        throw new Error('SQLite 配置缺失');
      }
      this._driver = new SQLiteDriver({
        filename: dbConfig.path,
      });
    } else {
      throw new Error(`不支持的数据库类型: ${dbConfig.type}`);
    }

    await this._driver.connect();
    this.closing = false;
    this.shutdownPromise = null;
    Logger.Info('[DatabaseManager] 数据库连接成功');
  }

  /**
   * 关闭数据库连接
   */
  public async Shutdown(): Promise<void> {
    if (this.shutdownPromise) return this.shutdownPromise;
    if (!this._driver) return;
    this.closing = true;
    this.shutdownPromise = this.Enqueue(async driver => {
      await driver.disconnect();
      this._driver = null;
    });
    return this.shutdownPromise;
  }

  /**
   * 获取数据库驱动
   */
  public get Driver(): IDriver {
    if (!this._driver) {
      throw new Error('数据库未初始化');
    }
    return this._driver;
  }

  /**
   * 获取数据库类型
   */
  public get DatabaseType(): 'mysql' | 'sqlite' | 'postgresql' {
    return Config.Database.type;
  }

  /**
   * 查询数据
   */
  public async Query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    return this.WithConnection(driver => driver.query<T>(sql, params));
  }

  /**
   * 执行SQL
   */
  public async Execute(sql: string, params?: any[]): Promise<{ affectedRows: number; insertId: number }> {
    return this.WithConnection(driver => driver.execute(sql, params));
  }

  /**
   * 执行事务
   * @param callback 事务回调函数
   */
  public async Transaction<T>(callback: (driver: IDriver) => Promise<T>): Promise<T> {
    return this.WithConnection(async driver => {
      await driver.beginTransaction();
      try {
        const result = await callback(driver);
        await driver.commit();
        return result;
      } catch (err) {
        await driver.rollback();
        throw err;
      }
    });
  }
}
