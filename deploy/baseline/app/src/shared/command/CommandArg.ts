/**
 * 命令参数类
 * 参考 DanhengServer 的 CommandArg
 */

export interface ICommandSender {
  sendMsg(msg: string): Promise<void> | void;
  getUid(): number;
  hasPermission(permission: string): boolean;
}

/**
 * 控制台命令发送者
 */
export class ConsoleCommandSender implements ICommandSender {
  async sendMsg(msg: string): Promise<void> {
    console.log(msg);
  }

  getUid(): number {
    return 0; // 控制台没有 UID
  }

  hasPermission(permission: string): boolean {
    return true; // 控制台拥有所有权限
  }
}

/**
 * 命令参数
 */
export class CommandArg {
  public raw: string;
  public args: string[] = [];
  public basicArgs: string[] = [];
  public characterArgs: Map<string, string> = new Map();
  public sender: ICommandSender;
  public targetUid?: number;

  constructor(raw: string, sender: ICommandSender, targetUid?: number) {
    this.raw = raw;
    this.sender = sender;
    this.targetUid = targetUid;
    
    this.parseArgs(raw);
  }

  /**
   * 解析参数
   * 支持：
   * - 基本参数：10001 100 50 give list
   * - 字符参数：x10 l50 r5 (单字母+数字)
   * - 目标参数：@10001
   */
  private parseArgs(raw: string): void {
    const parts = raw.split(/\s+/).filter(s => s.length > 0);
    
    for (const part of parts) {
      if (part.length === 0) continue;
      
      const firstChar = part[0];
      
      // 特殊处理 @target
      if (firstChar === '@') {
        const value = part.substring(1);
        const uid = parseInt(value);
        if (!isNaN(uid)) {
          this.targetUid = uid;
        }
        this.args.push(part);
        continue;
      }
      
      // 检查是否是字符参数（单字母+数字，如 x10, l50）
      // 格式：单个字母 + 至少一个数字
      if (part.length >= 2 && /^[a-zA-Z]$/.test(firstChar) && /^\d+$/.test(part.substring(1))) {
        const key = firstChar;
        const value = part.substring(1);
        this.characterArgs.set(key, value);
        this.args.push(part);
      } else {
        // 其他都是基本参数
        this.basicArgs.push(part);
        this.args.push(part);
      }
    }
  }

  private isDigit(char: string): boolean {
    return /^\d$/.test(char);
  }

  /**
   * 获取整数参数
   */
  public getInt(index: number, defaultValue: number = 0): number {
    if (this.basicArgs.length <= index) return defaultValue;
    const value = parseInt(this.basicArgs[index]);
    return isNaN(value) ? defaultValue : value;
  }

  /**
   * 获取字符串参数
   */
  public getString(index: number, defaultValue: string = ''): string {
    if (this.basicArgs.length <= index) return defaultValue;
    return this.basicArgs[index];
  }

  /**
   * 获取字符参数
   */
  public getCharArg(key: string, defaultValue: string = ''): string {
    return this.characterArgs.get(key) || defaultValue;
  }

  /**
   * 获取字符参数（整数）
   */
  public getCharArgInt(key: string, defaultValue: number = 0): number {
    const value = this.characterArgs.get(key);
    if (!value) return defaultValue;
    const num = parseInt(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * 发送消息
   */
  public async sendMsg(msg: string): Promise<void> {
    await this.sender.sendMsg(msg);
  }

  /**
   * 转换为字符串
   */
  public toString(): string {
    return `BasicArgs: [${this.basicArgs.join(', ')}], CharacterArgs: {${Array.from(this.characterArgs.entries()).map(([k, v]) => `${k}:${v}`).join(', ')}}`;
  }
}
