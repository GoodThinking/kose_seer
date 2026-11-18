import { BaseProto } from '../base/BaseProto';
/**
 * 赛尔号地图用户信息
 * 对应前端: com.robot.core.info.UserInfo.setForPeoleInfo
 * 这是一个通用数据结构，用于多个命令的响应中
 */
export declare class SeerMapUserInfoProto extends BaseProto {
    sysTime: number;
    userID: number;
    nick: string;
    color: number;
    texture: number;
    vipFlags: number;
    vipStage: number;
    actionType: number;
    x: number;
    y: number;
    action: number;
    direction: number;
    changeShape: number;
    spiritTime: number;
    spiritID: number;
    petDV: number;
    petSkin: number;
    fightFlag: number;
    teacherID: number;
    studentID: number;
    nonoState: number;
    nonoColor: number;
    superNono: number;
    playerForm: number;
    transTime: number;
    teamId: number;
    teamCoreCount: number;
    teamIsShow: number;
    teamLogoBg: number;
    teamLogoIcon: number;
    teamLogoColor: number;
    teamTxtColor: number;
    teamLogoWord: string;
    clothes: Array<{
        id: number;
        level: number;
    }>;
    curTitle: number;
    constructor();
    serialize(): Buffer;
    setUserID(value: number): this;
    setNick(value: string): this;
    setColor(value: number): this;
    setPosition(x: number, y: number): this;
    setVipFlags(value: number): this;
    setNonoState(value: number): this;
    setClothes(clothes: Array<{
        id: number;
        level: number;
    }>): this;
}
//# sourceMappingURL=SeerMapUserInfoProto.d.ts.map