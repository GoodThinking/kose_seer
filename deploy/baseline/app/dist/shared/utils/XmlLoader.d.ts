/**
 * XML节点属性
 */
export interface IXmlAttributes {
    [key: string]: string;
}
/**
 * XML节点
 */
export interface IXmlNode {
    name: string;
    attributes: IXmlAttributes;
    children: IXmlNode[];
    text?: string;
}
/**
 * XML加载器
 * 简单的XML解析器，用于加载游戏配置文件
 */
export declare class XmlLoader {
    /**
     * 加载XML文件
     * @param filePath 文件路径（相对于项目根目录）
     */
    static Load(filePath: string): IXmlNode | null;
    /**
     * 解析XML字符串
     */
    static Parse(xmlContent: string): IXmlNode | null;
    /**
     * 解析单个节点
     */
    private static ParseNode;
    /**
     * 解析属性
     */
    private static ParseAttributes;
    /**
     * 解析子节点
     */
    private static ParseChildren;
    /**
     * 查找子节点
     */
    static FindChild(node: IXmlNode, childName: string): IXmlNode | null;
    /**
     * 查找所有子节点
     */
    static FindChildren(node: IXmlNode, childName: string): IXmlNode[];
}
//# sourceMappingURL=XmlLoader.d.ts.map