import { BaseProto } from '../base/BaseProto';
/**
 * 战斗精灵信息
 * 对应前端: com.robot.core.info.fightInfo.FightPetInfo
 * 用于战斗开始时的精灵信息
 */
export declare class FightPetInfoProto extends BaseProto {
    userID: number;
    petID: number;
    petName: string;
    catchTime: number;
    hp: number;
    maxHP: number;
    level: number;
    catchable: number;
    battleLv: number[];
    constructor();
    serialize(): Buffer;
    setUserID(value: number): this;
    setPetID(value: number): this;
    setPetName(value: string): this;
    setCatchTime(value: number): this;
    setHP(hp: number, maxHP: number): this;
    setLevel(value: number): this;
    setCatchable(value: number): this;
    setBattleLv(value: number[]): this;
}
//# sourceMappingURL=FightPetInfoProto.d.ts.map