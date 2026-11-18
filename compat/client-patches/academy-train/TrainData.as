package com.robot.app.task.petstory.app.train
{
   public class TrainData
   {
      public static var monList:Array;
      public static var ADMCFrame:uint;
      public static var isHigh:Boolean;
      public static var roomId:uint = 0;
      public static var times:uint = 0;
      public static var totalTimes:uint = 0;
      public static var trainGrade:uint = 0;

      // 0 = 学习力训练模式, 1 = 属性阶段经验特训模式
      public static var mode:uint = 0;
      // 1..16 对应 16 大基础系别（草、水、火、飞行、电、机械、地面、普通、冰、超能、战斗、光、暗影、神秘、龙、圣灵）
      public static var expType:uint = 1;
      // 1..5 对应 5 个阶段等级档位（Lv.20 / Lv.40 / Lv.60 / Lv.80 / Lv.100）
      public static var expTier:uint = 3;

      public static const TYPE_NAMES:Array = [
         "",
         "草系","水系","火系","飞行系",
         "电系","机械系","地面系","普通系",
         "冰系","超能系","战斗系","光系",
         "暗影系","神秘系","龙系","圣灵系"
      ];

      public static const TIER_LEVELS:Array = [0, 20, 40, 60, 80, 100];
      public static const TIER_NAMES:Array = [
         "",
         "一阶 · Lv.20 初阶形态",
         "二阶 · Lv.40 中阶进化",
         "三阶 · Lv.60 高阶完全体",
         "四阶 · Lv.80 精英完全体",
         "五阶 · Lv.100 满级完全体"
      ];
      public static const TIER_EXP_DESC:Array = [
         "",
         "单场 1,800 经验 + 900 经验池（适合 1~25 级起步）",
         "单场 5,400 经验 + 2,700 经验池（适合 25~45 级进化）",
         "单场 12,000 经验 + 6,000 经验池（适合 45~65 级成型）",
         "单场 24,000 经验 + 12,000 经验池（适合 65~85 级冲刺）",
         "单场 42,000 经验 + 21,000 经验池（适合 80~100 级满级）"
      ];

      // 16 属性 × 3 进化阶段代表精灵 ID [一阶(Lv.20), 二阶(Lv.40), 三阶(Lv.60/80/100)]
      public static const EXP_PETS:Array = [
         null,
         [1, 2, 3],         // 1 草系：布布种子 -> 布布草 -> 布布花
         [4, 5, 6],         // 2 水系：伊优 -> 尤里安 -> 巴鲁斯
         [7, 8, 9],         // 3 火系：小火猴 -> 烈火猴 -> 烈焰猩猩
         [10, 11, 12],      // 4 飞行系：皮皮 -> 比波 -> 波克尔
         [13, 14, 15],      // 5 电系：比比鼠 -> 闪电鼠 -> 天雷鼠
         [71, 72, 73],      // 6 机械系：派派 -> 派鲁克 -> 派鲁基达
         [53, 54, 55],      // 7 地面系：莫比 -> 格格尔 -> 鲁加斯
         [119, 120, 121],   // 8 普通系：莱尼 -> 特鲁尼 -> 伊卡罗尼
         [65, 66, 67],      // 9 冰系：林克 -> 林斯奇 -> 布林克斯
         [77, 78, 79],      // 10 超能系：尼尔 -> 菲斯利 -> 艾斯菲亚
         [275, 276, 277],   // 11 战斗系：尹赫 -> 尹泰奇 -> 尹泰拉多
         [237, 238, 239],   // 12 光系：吉宝 -> 吉娜 -> 吉娜斯
         [128, 129, 130],   // 13 暗影系：波古 -> 吉拉 -> 吉古拉
         [313, 314, 315],   // 14 神秘系：卡鲁 -> 卡克拉 -> 卡鲁耶克
         [1326, 1327, 1328],// 15 龙系：兰迪 -> 兰特 -> 索兰特
         [1203, 1204, 1204] // 16 圣灵系：蒙塔 -> 迈尔斯（两段进化）
      ];

      public static function getExpPetId(typeId:uint, tier:uint) : uint
      {
         var t:uint = typeId >= 1 && typeId <= 16 ? typeId : 1;
         var stages:Array = EXP_PETS[t] as Array;
         if(tier <= 1)
         {
            return uint(stages[0]);
         }
         if(tier == 2)
         {
            return uint(stages[1]);
         }
         return uint(stages[2]);
      }

      public static function getExpParam2(typeId:uint, tier:uint) : uint
      {
         var t:uint = typeId >= 1 && typeId <= 16 ? typeId : 1;
         var lv:uint = tier >= 1 && tier <= 5 ? tier : 3;
         return uint(100 + t * 10 + lv);
      }

      // 根据玩家当前首发精灵属性，推荐被其 2 倍克制的陪练属性列表
      public static function getRecommendedTargetsForAttackType(atkType:uint) : Array
      {
         switch(atkType)
         {
            case 1: return [2, 7, 12];      // 草克：水、地面、光
            case 2: return [3, 7];          // 水克：火、地面
            case 3: return [1, 6, 9];       // 火克：草、机械、冰
            case 4: return [1, 11];         // 飞行克：草、战斗
            case 5: return [2, 4, 13];      // 电克：水、飞行、暗影
            case 6: return [9, 11];         // 机械克：冰、战斗
            case 7: return [3, 5, 6];       // 地面克：火、电、机械
            case 8: return [1, 2, 3];       // 普通无克制，默认御三家
            case 9: return [1, 4, 7, 15];   // 冰克：草、飞行、地面、龙
            case 10: return [11, 14];       // 超能克：战斗、神秘
            case 11: return [6, 9, 15];     // 战斗克：机械、冰、龙
            case 12: return [10, 13];       // 光克：超能、暗影
            case 13: return [10, 13];       // 暗影克：超能、暗影
            case 14: return [5, 14, 16];    // 神秘克：电、神秘、圣灵
            case 15: return [9, 15, 16];    // 龙克：冰、龙、圣灵
            case 16: return [1, 2, 3, 5, 9];// 圣灵克：草、水、火、电、冰
            default: return [1, 2, 3];
         }
      }

      public function TrainData()
      {
         super();
      }
   }
}
