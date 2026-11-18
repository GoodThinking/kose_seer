import { BaseProto } from '../../../base/BaseProto';
/**
 * 获取简单用户信息响应
 * CMD: 2051 GET_SIM_USERINFO
 */
export declare class GetSimUserInfoRspProto extends BaseProto {
    userId: number;
    nick: string;
    color: number;
    texture: number;
    vip: number;
    status: number;
    mapType: number;
    mapId: number;
    isCanBeTeacher: number;
    teacherID: number;
    studentID: number;
    graduationCount: number;
    vipLevel: number;
    teamId: number;
    teamIsShow: number;
    clothes: Array<{
        id: number;
        level: number;
    }>;
    constructor();
    setUserId(value: number): this;
    setNick(value: string): this;
    setColor(value: number): this;
    setTexture(value: number): this;
    setVip(value: number): this;
    setStatus(value: number): this;
    setMapType(value: number): this;
    setMapId(value: number): this;
    setIsCanBeTeacher(value: number): this;
    setTeacherID(value: number): this;
    setStudentID(value: number): this;
    setGraduationCount(value: number): this;
    setVipLevel(value: number): this;
    setTeamId(value: number): this;
    setTeamIsShow(value: number): this;
    setClothes(value: Array<{
        id: number;
        level: number;
    }>): this;
    deserialize(buffer: Buffer): void;
    serialize(): Buffer;
}
//# sourceMappingURL=GetSimUserInfoRspProto.d.ts.map