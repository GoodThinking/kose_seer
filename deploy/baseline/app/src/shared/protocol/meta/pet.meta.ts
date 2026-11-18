import { CommandID } from '../CommandID';
import { ICommandMeta } from './CommandMetaRegistry';

/**
 * 精灵模块元数据
 * 包含精灵相关的所有命令元数据定义
 */
export const petMeta: ICommandMeta[] = [
  {
    cmdID: CommandID.GET_PET_INFO,
    name: 'GET_PET_INFO',
    desc: '获取精灵信息',
    request: [
      { name: 'catchTime', type: 'uint32', desc: '捕获时间' }
    ],
    response: [
      { name: 'catchTime', type: 'uint32', desc: '捕获时间' },
      { name: 'id', type: 'uint32', desc: '精灵ID' },
      { name: 'level', type: 'uint32', desc: '等级' },
      { name: 'exp', type: 'uint32', desc: '经验值' },
      { name: 'hp', type: 'uint32', desc: '当前HP' },
      { name: 'maxHp', type: 'uint32', desc: '最大HP' },
      { name: 'atk', type: 'uint32', desc: '攻击' },
      { name: 'def', type: 'uint32', desc: '防御' },
      { name: 'spAtk', type: 'uint32', desc: '特攻' },
      { name: 'spDef', type: 'uint32', desc: '特防' },
      { name: 'spd', type: 'uint32', desc: '速度' },
      { name: 'nature', type: 'uint32', desc: '性格' },
      { name: 'skillArray', type: 'bytes', desc: '技能数组' }
    ]
  },
  {
    cmdID: CommandID.GET_PET_LIST,
    name: 'GET_PET_LIST',
    desc: '获取精灵列表',
    request: [],
    response: [
      { name: 'petCount', type: 'uint32', desc: '精灵数量' },
      { name: 'petList', type: 'bytes', desc: '精灵列表数据' }
    ]
  },
  {
    cmdID: CommandID.PET_RELEASE,
    name: 'PET_RELEASE',
    desc: '释放精灵',
    request: [
      { name: 'catchId', type: 'uint32', desc: '捕获ID' },
      { name: 'flag', type: 'uint32', desc: '标志' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果 (0=成功)' }
    ]
  },
  {
    cmdID: CommandID.PET_SHOW,
    name: 'PET_SHOW',
    desc: '展示精灵',
    request: [
      { name: 'catchTime', type: 'uint32', desc: '捕获时间' },
      { name: 'flag', type: 'uint32', desc: '标志' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果 (0=成功)' }
    ]
  },
  {
    cmdID: CommandID.PET_CURE,
    name: 'PET_CURE',
    desc: '治疗精灵',
    request: [
      { name: 'cureType', type: 'uint32', desc: '治疗类型 (0=全部, 1=单个)' },
      { name: 'catchTime', type: 'uint32', desc: '捕获时间 (单个治疗时)' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果 (0=成功)' }
    ]
  },
  {
    cmdID: CommandID.PET_DEFAULT,
    name: 'PET_DEFAULT',
    desc: '设置默认精灵',
    request: [
      { name: 'catchTime', type: 'uint32', desc: '捕获时间' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果 (0=成功)' }
    ]
  },
  {
    cmdID: CommandID.PET_ONE_CURE,
    name: 'PET_ONE_CURE',
    desc: '恢复单个精灵HP',
    request: [
      { name: 'catchTime', type: 'uint32', desc: '捕获时间' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果 (0=成功)' }
    ]
  },
  {
    cmdID: CommandID.PET_EVOLVTION,
    name: 'PET_EVOLVTION',
    desc: '精灵进化',
    request: [
      { name: 'catchTime', type: 'uint32', desc: '捕获时间' }
    ],
    response: [
      { name: 'status', type: 'uint32', desc: '进化状态' }
    ]
  },
  {
    cmdID: CommandID.PET_SET_EXP,
    name: 'PET_SET_EXP',
    desc: '设置精灵经验分配',
    request: [
      { name: 'catchTime', type: 'uint32', desc: '捕获时间' },
      { name: 'exp', type: 'uint32', desc: '分配经验值' }
    ],
    response: [
      { name: 'remainingAllocExp', type: 'uint32', desc: '剩余可分配经验' }
    ]
  },
  {
    cmdID: CommandID.PET_GET_EXP,
    name: 'PET_GET_EXP',
    desc: '获取精灵经验分配信息',
    request: [],
    response: [
      { name: 'allocatableExp', type: 'uint32', desc: '可分配经验' }
    ]
  },
  {
    cmdID: CommandID.PET_ROOM_LIST,
    name: 'PET_ROOM_LIST',
    desc: '获取精灵仓库列表',
    request: [],
    response: [
      { name: 'petCount', type: 'uint32', desc: '精灵数量' },
      { name: 'petList', type: 'bytes', desc: '精灵列表数据' }
    ]
  },
  {
    cmdID: CommandID.Skill_Sort,
    name: 'Skill_Sort',
    desc: '技能排序',
    request: [
      { name: 'catchTime', type: 'uint32', desc: '捕获时间' },
      { name: 'skillIds', type: 'array', desc: '技能ID数组(4个)' }
    ],
    response: [
      { name: 'result', type: 'uint32', desc: '结果 (0=成功)' }
    ]
  }
];
