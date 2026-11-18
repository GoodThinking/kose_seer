import { BaseProto } from '../../../base/BaseProto';
import { CommandID } from '../../../../protocol/CommandID';
import { BufferWriter } from '../../../../utils';

/**
 * [CMD: 2052] 获取更多用户信息响应
 * 
 * 客户端格式（UserInfo.setForMoreInfo）：
 * - userID: uint32
 * - nick: string (16字节，UTF-8)
 * - regTime: uint32 (注册时间)
 * - petAllNum: uint32 (精灵总数)
 * - petMaxLev: uint32 (精灵最高等级)
 * - bossAchievement: byte[200] (BOSS成就，200个字节)
 * - graduationCount: uint32 (毕业次数)
 * - monKingWin: uint32 (怪物王胜利次数)
 * - messWin: uint32 (混战胜利次数)
 * - maxStage: uint32 (最高关卡)
 * - maxArenaWins: uint32 (竞技场最高连胜)
 * - curTitle: uint32 (当前称号)
 */
export class GetMoreUserInfoRspProto extends BaseProto {
  userID: number = 0;
  nick: string = '';
  regTime: number = 0;
  petAllNum: number = 0;
  petMaxLev: number = 0;
  bossAchievement: boolean[] = [];  // 200个BOSS成就
  graduationCount: number = 0;
  monKingWin: number = 0;
  messWin: number = 0;
  maxStage: number = 0;
  maxArenaWins: number = 0;
  curTitle: number = 0;

  constructor() {
    super(CommandID.GET_MORE_USERINFO);
    // 初始化200个BOSS成就为false
    this.bossAchievement = new Array(200).fill(false);
  }

  serialize(): Buffer {
    const writer = new BufferWriter(512);
    
    // userID
    writer.WriteUInt32(this.userID);
    
    // nick (16字节，UTF-8编码，不足补0)
    const nickBuffer = Buffer.alloc(16);
    const nickBytes = Buffer.from(this.nick, 'utf8');
    nickBytes.copy(nickBuffer, 0, 0, Math.min(nickBytes.length, 16));
    writer.WriteBytes(nickBuffer);
    
    // regTime
    writer.WriteUInt32(this.regTime);
    
    // petAllNum
    writer.WriteUInt32(this.petAllNum);
    
    // petMaxLev
    writer.WriteUInt32(this.petMaxLev);
    
    // bossAchievement (200个字节)
    for (let i = 0; i < 200; i++) {
      const byte = this.bossAchievement[i] ? 1 : 0;
      writer.WriteBytes(Buffer.from([byte]));
    }
    
    // graduationCount
    writer.WriteUInt32(this.graduationCount);
    
    // monKingWin
    writer.WriteUInt32(this.monKingWin);
    
    // messWin
    writer.WriteUInt32(this.messWin);
    
    // maxStage
    writer.WriteUInt32(this.maxStage);
    
    // maxArenaWins
    writer.WriteUInt32(this.maxArenaWins);
    
    // curTitle
    writer.WriteUInt32(this.curTitle);
    
    return writer.ToBuffer();
  }

  // 链式调用方法
  setUserID(value: number): this {
    this.userID = value;
    return this;
  }

  setNick(value: string): this {
    this.nick = value;
    return this;
  }

  setRegTime(value: number): this {
    this.regTime = value;
    return this;
  }

  setPetAllNum(value: number): this {
    this.petAllNum = value;
    return this;
  }

  setPetMaxLev(value: number): this {
    this.petMaxLev = value;
    return this;
  }

  setBossAchievement(value: boolean[]): this {
    // 确保数组长度为200
    this.bossAchievement = new Array(200).fill(false);
    for (let i = 0; i < Math.min(value.length, 200); i++) {
      this.bossAchievement[i] = value[i];
    }
    return this;
  }

  setGraduationCount(value: number): this {
    this.graduationCount = value;
    return this;
  }

  setMonKingWin(value: number): this {
    this.monKingWin = value;
    return this;
  }

  setMessWin(value: number): this {
    this.messWin = value;
    return this;
  }

  setMaxStage(value: number): this {
    this.maxStage = value;
    return this;
  }

  setMaxArenaWins(value: number): this {
    this.maxArenaWins = value;
    return this;
  }

  setCurTitle(value: number): this {
    this.curTitle = value;
    return this;
  }
}
