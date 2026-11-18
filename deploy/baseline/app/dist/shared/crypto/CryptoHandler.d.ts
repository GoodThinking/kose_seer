/**
 * 加密处理器
 * 负责数据包的加密和解密
 *
 * 算法来源: luvit/luvit_version/servers/gameserver/trafficlogger.lua
 */
export declare class CryptoHandler {
    private _key;
    private _enabled;
    /**
     * 初始化加密密钥
     * @param key 加密密钥（10个字符）
     */
    initKey(key: string): void;
    /**
     * 生成加密密钥
     * 算法: key = MD5(keySeed XOR userID).substring(0, 10)
     * @param keySeed 密钥种子
     * @param userID 用户ID
     * @returns 10位加密密钥
     */
    static GenerateKey(keySeed: number, userID: number): string;
    /**
     * 加密数据
     * 算法：解密的逆过程
     * @param data 原始数据
     * @returns 加密后的数据
     */
    encrypt(data: Buffer): Buffer;
    /**
     * 解密数据
     * 算法来源: trafficlogger.lua crypto:decrypt()
     * @param data 加密的数据
     * @returns 解密后的数据
     */
    decrypt(data: Buffer): Buffer;
    /**
     * 获取当前密钥
     */
    get Key(): string;
    /**
     * 检查加密是否已启用
     */
    get Enabled(): boolean;
    /**
     * 启用加密
     */
    enable(): void;
    /**
     * 禁用加密
     */
    disable(): void;
}
//# sourceMappingURL=CryptoHandler.d.ts.map