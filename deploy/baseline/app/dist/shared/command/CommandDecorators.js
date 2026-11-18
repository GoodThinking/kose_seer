"use strict";
/**
 * 命令装饰器系统
 * 参考 DanhengServer 的 Attribute 系统
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandInfo = CommandInfo;
exports.CommandMethod = CommandMethod;
exports.CommandDefault = CommandDefault;
exports.getCommandInfo = getCommandInfo;
exports.getCommandMethods = getCommandMethods;
// 存储命令元数据
const commandMetadata = new Map();
const commandMethodMetadata = new Map();
/**
 * 命令装饰器
 * 类似 [CommandInfo("name", "desc", "usage")]
 */
function CommandInfo(info) {
    return function (target) {
        commandMetadata.set(target, info);
    };
}
/**
 * 命令方法装饰器
 * 类似 [CommandMethod("create")]
 */
function CommandMethod(conditions) {
    return function (target, propertyKey, descriptor) {
        if (!commandMethodMetadata.has(target.constructor)) {
            commandMethodMetadata.set(target.constructor, new Map());
        }
        const methods = commandMethodMetadata.get(target.constructor);
        let parsedConditions = [];
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
            }).filter(c => c !== null);
        }
        else if (Array.isArray(conditions)) {
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
function CommandDefault() {
    return function (target, propertyKey, descriptor) {
        if (!commandMethodMetadata.has(target.constructor)) {
            commandMethodMetadata.set(target.constructor, new Map());
        }
        const methods = commandMethodMetadata.get(target.constructor);
        methods.set(propertyKey, {
            isDefault: true
        });
    };
}
/**
 * 获取命令元数据
 */
function getCommandInfo(target) {
    return commandMetadata.get(target);
}
/**
 * 获取命令方法元数据
 */
function getCommandMethods(target) {
    return commandMethodMetadata.get(target);
}
//# sourceMappingURL=CommandDecorators.js.map