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
/**
 * 命令装饰器
 * 类似 [CommandInfo("name", "desc", "usage")]
 */
export declare function CommandInfo(info: CommandInfo): (target: Function) => void;
/**
 * 命令方法装饰器
 * 类似 [CommandMethod("create")]
 */
export declare function CommandMethod(conditions?: string | CommandCondition[]): (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => void;
/**
 * 默认命令方法装饰器
 * 类似 [CommandDefault]
 */
export declare function CommandDefault(): (target: any, propertyKey: string, descriptor?: PropertyDescriptor) => void;
/**
 * 获取命令元数据
 */
export declare function getCommandInfo(target: Function): CommandInfo | undefined;
/**
 * 获取命令方法元数据
 */
export declare function getCommandMethods(target: Function): Map<string, CommandMethodInfo> | undefined;
//# sourceMappingURL=CommandDecorators.d.ts.map