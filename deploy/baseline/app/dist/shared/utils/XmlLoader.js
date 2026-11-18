"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlLoader = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const Logger_1 = require("./Logger");
/**
 * XML加载器
 * 简单的XML解析器，用于加载游戏配置文件
 */
class XmlLoader {
    /**
     * 加载XML文件
     * @param filePath 文件路径（相对于项目根目录）
     */
    static Load(filePath) {
        try {
            const fullPath = path.resolve(process.cwd(), filePath);
            if (!fs.existsSync(fullPath)) {
                Logger_1.Logger.Error(`[XmlLoader] 文件不存在: ${fullPath}`);
                return null;
            }
            const content = fs.readFileSync(fullPath, 'utf-8');
            return this.Parse(content);
        }
        catch (error) {
            Logger_1.Logger.Error(`[XmlLoader] 加载XML失败: ${error}`);
            return null;
        }
    }
    /**
     * 解析XML字符串
     */
    static Parse(xmlContent) {
        try {
            // 移除注释
            xmlContent = xmlContent.replace(/<!--[\s\S]*?-->/g, '');
            // 移除XML声明
            xmlContent = xmlContent.replace(/<\?xml[^?]*\?>/g, '');
            // 解析根节点
            const root = this.ParseNode(xmlContent.trim());
            return root;
        }
        catch (error) {
            Logger_1.Logger.Error(`[XmlLoader] 解析XML失败: ${error}`);
            return null;
        }
    }
    /**
     * 解析单个节点
     */
    static ParseNode(xml) {
        // 匹配开始标签
        const startTagMatch = xml.match(/^<([a-zA-Z0-9_]+)([^>]*)>/);
        if (!startTagMatch)
            return null;
        const tagName = startTagMatch[1];
        const attributesStr = startTagMatch[2];
        // 解析属性
        const attributes = this.ParseAttributes(attributesStr);
        // 检查是否是自闭合标签
        if (attributesStr.trim().endsWith('/')) {
            return {
                name: tagName,
                attributes,
                children: []
            };
        }
        // 查找结束标签
        const endTag = `</${tagName}>`;
        const endTagIndex = xml.lastIndexOf(endTag);
        if (endTagIndex === -1) {
            // 可能是自闭合标签
            return {
                name: tagName,
                attributes,
                children: []
            };
        }
        // 提取内容
        const content = xml.substring(startTagMatch[0].length, endTagIndex).trim();
        // 解析子节点
        const children = this.ParseChildren(content);
        return {
            name: tagName,
            attributes,
            children,
            text: children.length === 0 ? content : undefined
        };
    }
    /**
     * 解析属性
     */
    static ParseAttributes(attrStr) {
        const attributes = {};
        // 匹配所有属性 (key="value" 或 key='value')
        const attrRegex = /([a-zA-Z0-9_]+)\s*=\s*["']([^"']*)["']/g;
        let match;
        while ((match = attrRegex.exec(attrStr)) !== null) {
            attributes[match[1]] = match[2];
        }
        return attributes;
    }
    /**
     * 解析子节点
     */
    static ParseChildren(content) {
        const children = [];
        if (!content || content.trim().length === 0) {
            return children;
        }
        let remaining = content.trim();
        while (remaining.length > 0) {
            // 查找下一个标签
            const tagMatch = remaining.match(/^<([a-zA-Z0-9_]+)([^>]*)>/);
            if (!tagMatch) {
                // 没有更多标签了
                break;
            }
            const tagName = tagMatch[1];
            const attributesStr = tagMatch[2];
            // 检查是否是自闭合标签
            if (attributesStr.trim().endsWith('/')) {
                const attributes = this.ParseAttributes(attributesStr);
                children.push({
                    name: tagName,
                    attributes,
                    children: []
                });
                remaining = remaining.substring(tagMatch[0].length).trim();
                continue;
            }
            // 查找对应的结束标签
            const endTag = `</${tagName}>`;
            let depth = 1;
            let endIndex = tagMatch[0].length;
            while (depth > 0 && endIndex < remaining.length) {
                const nextStart = remaining.indexOf(`<${tagName}`, endIndex);
                const nextEnd = remaining.indexOf(endTag, endIndex);
                if (nextEnd === -1) {
                    break;
                }
                if (nextStart !== -1 && nextStart < nextEnd) {
                    depth++;
                    endIndex = nextStart + tagName.length + 1;
                }
                else {
                    depth--;
                    endIndex = nextEnd + endTag.length;
                }
            }
            if (depth === 0) {
                // 提取完整节点
                const nodeXml = remaining.substring(0, endIndex);
                const node = this.ParseNode(nodeXml);
                if (node) {
                    children.push(node);
                }
                remaining = remaining.substring(endIndex).trim();
            }
            else {
                // 无法找到匹配的结束标签
                break;
            }
        }
        return children;
    }
    /**
     * 查找子节点
     */
    static FindChild(node, childName) {
        for (const child of node.children) {
            if (child.name === childName) {
                return child;
            }
        }
        return null;
    }
    /**
     * 查找所有子节点
     */
    static FindChildren(node, childName) {
        return node.children.filter(child => child.name === childName);
    }
}
exports.XmlLoader = XmlLoader;
//# sourceMappingURL=XmlLoader.js.map