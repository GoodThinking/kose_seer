/**
 * 命令装饰器系统
 * 参考 DanhengServer 的 Attribute 系统
 */

export interface CommandInfo {
  name: string;
  description: string;
  usage: string;
  alias?: string[];
  permission?: string;
}

export interface CommandMethodInfo {
  conditions?: CommandCondition[];
  isDefault?: boolean;
}

export interface CommandCondition {
  index: number;
  shouldBe: string;
}

// 存储命令元数据
const commandMetadata = new Map<Function, CommandInfo>();
const commandMethodMetadata = new Map<Function, Map<string, CommandMethodInfo>>();

/**
 * 命令装饰器
 * 类似 [CommandInfo("name", "desc", "usage")]
 */
export function CommandInfo(info: CommandInfo) {
  return function (target: Function) {
    commandMetadata.set(target, info);
  };
}

/**
 * 命令方法装饰器
 * 类似 [CommandMethod("create")]
 */
export function CommandMethod(conditions?: string | CommandCondition[]) {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    if (!commandMethodMetadata.has(target.constructor)) {
      commandMethodMetadata.set(target.constructor, new Map());
    }
    
    const methods = commandMethodMetadata.get(target.constructor)!;
    
    let parsedConditions: CommandCondition[] = [];
    
    if (typeof conditions === 'string') {
      // 解析条件字符串，如 "0 create" 表示第0个参数必须是 "create"
      const parts = conditions.split(' ');
      parsedConditions = parts.map((part, index) => {
        if (index % 2 === 0) {
          const condIndex = parseInt(part);
          const shouldBe = parts[index + 1];
          return { index: condIndex, shouldBe };
        }
        return null;
      }).filter(c => c !== null) as CommandCondition[];
    } else if (Array.isArray(conditions)) {
      parsedConditions = conditions;
    }
    
    methods.set(propertyKey, {
      conditions: parsedConditions,
      isDefault: false
    });
  };
}

/**
 * 默认命令方法装饰器
 * 类似 [CommandDefault]
 */
export function CommandDefault() {
  return function (target: any, propertyKey: string, descriptor?: PropertyDescriptor) {
    if (!commandMethodMetadata.has(target.constructor)) {
      commandMethodMetadata.set(target.constructor, new Map());
    }
    
    const methods = commandMethodMetadata.get(target.constructor)!;
    methods.set(propertyKey, {
      isDefault: true
    });
  };
}

/**
 * 获取命令元数据
 */
export function getCommandInfo(target: Function): CommandInfo | undefined {
  return commandMetadata.get(target);
}

/**
 * 获取命令方法元数据
 */
export function getCommandMethods(target: Function): Map<string, CommandMethodInfo> | undefined {
  return commandMethodMetadata.get(target);
}
