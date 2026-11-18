/**
 * 精灵序列化系统
 * 负责将精灵数据序列化为客户端期望的二进制格式
 *
 * 移植自: luvit/luvit_version/game/seer_pet_serializer.lua
 *
 * 序列化格式：
 * - 使用大端序（Big-Endian）
 * - 固定长度字段
 * - 支持完整信息和简化信息两种模式
 */
import { IPetInfo } from '../../../shared/models/PetModel';
/**
 * 技能信息接口
 */
export interface ISkillInfo {
    id: number;
    pp: number;
    maxPP: number;
}
/**
 * 精灵序列化器
 */
export declare class PetSerializer {
    /**
     * 写入32位无符号整数（大端序 Big-Endian）
     *
     * @param value 数值
     * @returns Buffer
     */
    private static WriteUInt32BE;
    /**
     * 写入16位无符号整数（大端序 Big-Endian）
     *
     * @param value 数值
     * @returns Buffer
     */
    private static WriteUInt16BE;
    /**
     * 写入字符串（固定长度，不足补0）
     *
     * @param str 字符串
     * @param length 固定长度
     * @returns Buffer
     */
    private static WriteString;
    /**
     * 获取精灵的默认技能
     *
     * 根据精灵种类和等级，获取最后学会的4个技能
     *
     * @param petId 精灵种类ID
     * @param level 等级
     * @returns 技能列表
     */
    private static GetDefaultSkills;
    /**
     * 从技能ID数组构建技能信息
     *
     * @param skillIds 技能ID数组
     * @returns 技能信息列表
     */
    private static BuildSkillsFromIds;
    /**
     * 序列化单个精灵的完整信息
     *
     * @param pet 精灵数据
     * @param fullInfo 是否包含完整信息（默认true）
     * @returns Buffer
     */
    static SerializePetInfo(pet: IPetInfo, fullInfo?: boolean): Buffer;
    /**
     * 序列化多个精灵
     *
     * @param pets 精灵数据数组
     * @param fullInfo 是否包含完整信息（默认true）
     * @returns Buffer
     */
    static SerializePets(pets: IPetInfo[], fullInfo?: boolean): Buffer;
    /**
     * 计算序列化后的单个精灵数据大小
     *
     * @param fullInfo 是否包含完整信息
     * @returns 字节数
     */
    static GetSerializedSize(fullInfo?: boolean): number;
    /**
     * 序列化精灵列表（带数量前缀）
     *
     * 格式：petCount(4 bytes) + pets data
     *
     * @param pets 精灵数据数组
     * @param fullInfo 是否包含完整信息（默认true）
     * @returns Buffer
     */
    static SerializePetList(pets: IPetInfo[], fullInfo?: boolean): Buffer;
    /**
     * 序列化精灵背包信息
     *
     * 格式：bagCount(4 bytes) + pets data
     *
     * @param pets 背包中的精灵数据数组
     * @returns Buffer
     */
    static SerializePetBag(pets: IPetInfo[]): Buffer;
    /**
     * 序列化精灵仓库信息
     *
     * 格式：storageCount(4 bytes) + pets data
     *
     * @param pets 仓库中的精灵数据数组
     * @returns Buffer
     */
    static SerializePetStorage(pets: IPetInfo[]): Buffer;
    /**
     * 序列化战斗精灵信息
     *
     * 用于战斗中的精灵数据传输
     *
     * @param pet 精灵数据
     * @returns Buffer
     */
    static SerializeBattlePet(pet: IPetInfo): Buffer;
    /**
     * 调试：打印序列化后的数据（十六进制）
     *
     * @param buffer Buffer数据
     * @param label 标签
     */
    static DebugPrintBuffer(buffer: Buffer, label?: string): void;
}
//# sourceMappingURL=PetSerializer.d.ts.map