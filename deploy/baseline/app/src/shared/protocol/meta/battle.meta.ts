import { CommandID } from '../CommandID';
import { ICommandMeta } from './CommandMetaRegistry';

/**
 * battle 模块协议元数据
 */
export const battleMeta: ICommandMeta[] = [
  /**
   * 邀请对战请求
   */
  {
    cmdID: CommandID.INVITE_TO_FIGHT,
    name: 'INVITE_TO_FIGHT',
    desc: '邀请对战请求',
    request: [
      { name: 'targetUserId', type: 'uint32', desc: '被邀请玩家的ID' },
      { name: 'mode', type: 'uint32', desc: '对战模式（1=单挑，2=多精灵）' }
    ]
  },
  /**
   * 取消邀请请求
   */
  {
    cmdID: CommandID.INVITE_FIGHT_CANCEL,
    name: 'INVITE_FIGHT_CANCEL',
    desc: '取消邀请请求',
    request: [
      { name: 'targetUserId', type: 'uint32', desc: '被邀请玩家的ID' }
    ]
  },
  /**
   * 处理对战邀请请求
   */
  {
    cmdID: CommandID.HANDLE_FIGHT_INVITE,
    name: 'HANDLE_FIGHT_INVITE',
    desc: '处理对战邀请请求',
    request: [
      { name: 'inviterUserId', type: 'uint32', desc: '邀请者的ID' },
      { name: 'accept', type: 'uint32', desc: '是否接受（1=接受，0=拒绝）' },
      { name: 'mode', type: 'uint32', desc: '对战模式（1=单挑，2=多精灵）' }
    ]
  },
  /**
   * 使用技能请求
   */
  {
    cmdID: CommandID.USE_SKILL,
    name: 'USE_SKILL',
    desc: '使用技能请求',
    request: [
      { name: 'skillId', type: 'uint32', desc: '技能ID' }
    ],
    response: [
      { name: 'skillId', type: 'uint32', desc: '技能ID' },
    ]
  },
  /**
   * 使用精灵道具请求
   */
  {
    cmdID: CommandID.USE_PET_ITEM,
    name: 'USE_PET_ITEM',
    desc: '使用精灵道具请求',
    request: [
      { name: 'itemId', type: 'uint32', desc: '道具ID' }
    ],
    response: [
      { name: 'userId', type: 'uint32', desc: '用户ID' },
      { name: 'itemId', type: 'uint32', desc: '道具ID' },
      { name: 'hp', type: 'uint32', desc: '当前HP' },
      { name: 'change', type: 'uint32', desc: '变化量' },
    ]
  },
  /**
   * 更换精灵请求
   */
  {
    cmdID: CommandID.CHANGE_PET,
    name: 'CHANGE_PET',
    desc: '更换精灵请求',
    request: [
      { name: 'catchTime', type: 'uint32', desc: '精灵捕获时间' }
    ],
    response: [
      { name: 'userId', type: 'uint32', desc: '用户ID' },
      { name: 'petId', type: 'uint32', desc: '精灵ID' },
      { name: 'petName', type: 'string', desc: '精灵名称 (16字节)' },
      { name: 'level', type: 'uint32', desc: '等级' },
      { name: 'hp', type: 'uint32', desc: '当前HP' },
      { name: 'maxHp', type: 'uint32', desc: '最大HP' },
      { name: 'catchTime', type: 'uint32', desc: '捕获时间' },
    ]
  },
  /**
   * 捕捉精灵响应
   */
  {
    cmdID: CommandID.CATCH_MONSTER,
    name: 'CATCH_MONSTER',
    desc: '捕捉精灵响应',
    response: [
      { name: 'catchTime', type: 'uint32', desc: '捕获时间' },
      { name: 'petId', type: 'uint32', desc: '精灵ID' },
    ]
  },
  /**
   * 逃跑响应
   */
  {
    cmdID: CommandID.ESCAPE_FIGHT,
    name: 'ESCAPE_FIGHT',
    desc: '逃跑响应',
    response: [
      { name: 'success', type: 'uint32', desc: '是否成功 (0=失败, 1=成功)' },
    ]
  },
  /**
   * 挑战BOSS请求
   */
  {
    cmdID: CommandID.CHALLENGE_BOSS,
    name: 'CHALLENGE_BOSS',
    desc: '挑战BOSS请求',
    request: [
      { name: 'bossId', type: 'uint32', desc: 'BOSS ID' }
    ]
  },
  /**
   * 挑战野外精灵请求
   */
  {
    cmdID: CommandID.FIGHT_NPC_MONSTER,
    name: 'FIGHT_NPC_MONSTER',
    desc: '挑战野外精灵',
    request: [
      { name: 'monsterIndex', type: 'uint32', desc: '怪物索引 (0-8)' }
    ],
    response: []
  },
  /**
   * 对战邀请通知
   */
  {
    cmdID: CommandID.NOTE_INVITE_TO_FIGHT,
    name: 'NOTE_INVITE_TO_FIGHT',
    desc: '对战邀请通知',
    response: [
      { name: 'inviterUserId', type: 'uint32', desc: '' },
      { name: 'inviterNick', type: 'string', desc: '' },
      { name: 'mode', type: 'uint32', desc: '' },
    ]
  },
  /**
   * 处理邀请通知
   */
  {
    cmdID: CommandID.NOTE_HANDLE_FIGHT_INVITE,
    name: 'NOTE_HANDLE_FIGHT_INVITE',
    desc: '处理邀请通知',
    response: [
      { name: 'targetUserId', type: 'uint32', desc: '' },
      { name: 'targetNick', type: 'string', desc: '' },
      { name: 'accept', type: 'uint32', desc: '' },
    ]
  },
  /**
   * 准备战斗通知响应
   */
  {
    cmdID: CommandID.NOTE_READY_TO_FIGHT,
    name: 'NOTE_READY_TO_FIGHT',
    desc: '准备战斗通知响应',
    response: [
      { name: 'playerUserId', type: 'uint32', desc: '' },
      { name: 'playerNick', type: 'string', desc: '' },
      { name: 'playerPets', type: 'array', desc: '敌人信息' },
      { name: 'enemyUserId', type: 'uint32', desc: '' },
      { name: 'enemyNick', type: 'string', desc: '' },
      { name: 'enemyPets', type: 'array', desc: '' },
    ]
  },
  /**
   * 开始战斗通知响应
   */
  {
    cmdID: CommandID.NOTE_START_FIGHT,
    name: 'NOTE_START_FIGHT',
    desc: '开始战斗通知响应',
    response: [
      { name: 'isCanAuto', type: 'uint32', desc: '是否可以自动战斗' },
    ]
  },
  /**
   * 使用技能通知响应
   */
  {
    cmdID: CommandID.NOTE_USE_SKILL,
    name: 'NOTE_USE_SKILL',
    desc: '使用技能通知响应',
  },
  /**
   * 战斗结束响应
   */
  {
    cmdID: CommandID.FIGHT_OVER,
    name: 'FIGHT_OVER',
    desc: '战斗结束响应',
    response: [
      { name: 'reason', type: 'uint32', desc: '结束原因 (0=正常结束, 1=对方逃跑, 2=超时, 3=平局, 4=系统错误, 5=NPC逃跑)' },
      { name: 'winnerId', type: 'uint32', desc: '获胜者ID (玩家ID=胜利, 0=失败)' },
      { name: 'twoTimes', type: 'uint32', desc: '双倍经验次数' },
      { name: 'threeTimes', type: 'uint32', desc: '三倍经验次数' },
      { name: 'autoFightTimes', type: 'uint32', desc: '自动战斗次数' },
      { name: 'energyTimes', type: 'uint32', desc: '能源采集次数' },
      { name: 'learnTimes', type: 'uint32', desc: '学习次数' },
    ]
  },
  /**
   * 战斗奖励响应（物品奖励弹窗）
   */
  {
    cmdID: CommandID.COMPLETE_TASK,
    name: 'COMPLETE_TASK',
    desc: '战斗奖励响应',
    response: [
      { name: 'taskId', type: 'uint32', desc: '任务ID（战斗奖励时设为0）' },
      { name: 'petId', type: 'uint32', desc: '奖励精灵ID（无精灵奖励时为0）' },
      { name: 'captureTm', type: 'uint32', desc: '捕获时间（无精灵奖励时为0）' },
      { name: 'itemCount', type: 'uint32', desc: '物品数量' },
      {
        name: 'items',
        type: 'array',
        arrayCountField: 'itemCount',
        arrayFields: [
          { name: 'itemId', type: 'uint32', desc: '物品ID' },
          { name: 'itemCnt', type: 'uint32', desc: '物品数量' }
        ],
        desc: '物品奖励列表'
      }
    ]
  }
];
