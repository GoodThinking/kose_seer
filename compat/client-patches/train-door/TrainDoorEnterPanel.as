package com.robot.module.app
{
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;

   // 训练师之门完整版：
   // 1. 左侧单属性之门 15 扇全部开放（补齐第 13 门「战斗系之门·威里特」），支持普通模式（201–215）与勇者模式（301–315）切换；
   // 2. 右侧双属性之门开放「草超能之门·普兰特」（216/316）与「水暗影之门·帕里斯」（217/317），支持普通模式与勇者模式切换；
   // 3. 彻底取消生硬的“只受XX属性伤害”死锁；说明区展示每个守卫的招牌特性（HINTS 表）。
   public class TrainDoorEnterPanel extends Sprite implements IModule
   {
      private static const DOORS:Array = [
         ["草","塔奇多克",201,85,[3,4,9],"塔奇多克的精元"],
         ["火","火噜噜",202,85,[2,7],"火噜噜的精元"],
         ["超能","查德洛",203,85,[12,13,6],"查德洛的精元"],
         ["水","多尔尼",204,85,[1,5],"多尔尼的精元"],
         ["飞行","加耶罗",205,85,[5,9],"加耶罗的精元"],
         ["地面","岩锤怪",206,85,[1,2,9],"岩锤怪的精元"],
         ["机械","LYN",207,85,[3,7,11],"LYN的精元"],
         ["暗影","达克其",208,85,[5,12],"达克其的精元"],
         ["冰","菲尔洛",209,85,[3,6,11],"菲尔洛的精元"],
         ["光","卡莱洛",210,85,[1,13],"卡莱洛的精元"],
         ["龙","哈尼卡",211,85,[9,11,15],"哈尼卡的精元"],
         ["普通","瓦尔普",212,85,[8,11],"瓦尔普的精元"],
         ["战斗","威里特",215,85,[4,10,6],"威里特的精元"],
         ["电","佩吉克",213,85,[7],"佩吉克的精元"],
         ["超能冰","弗洛斯",214,85,[3,6,12],"弗洛斯的精元"]
      ];

      private static const DUAL_DOORS:Array = [
         ["草超能","普兰特",216,88,[3,4,9,12],"普兰特的精元"],
         ["水暗影","帕里斯",217,88,[1,5,12],"帕里斯的精元"]
      ];

      // 每个守卫的招牌特性说明（按 param2，勇者为 3xx），由 scripts/build-boss-signatures.cjs 生成
      private static const HINTS:Object = {"201":"被命中会被藤蔓缠住，每回合降速、被吸1/16体力；先制技能或换精灵挣脱。","202":"每挨一下怒气+1，每层火系伤害+15%，满5层砸出怒焰火锤后清空。","203":"念力屏障：你先出手时伤害-50%，后出手全额，慢速重炮手的舞台。","204":"被命中会中剧毒，毒伤从1/16起每回合翻倍；换下精灵重置倍数，毒不会解。","205":"每4回合放浮空连击，被浮空的精灵2回合内物理技能落空。","206":"每3回合放疯狂连锤，每段让你防御-1，降到-6时下一击必杀；换精灵清除。","207":"每回合要对它打出300伤害，否则下回合被压制：必后手、命中-20%。","208":"每击倒你一只精灵，它回复30%体力、攻击+1；残血精灵要及时撤下。","209":"你用过的技能会被冰封2回合，冰封中使用会落空；至少要有三招可用。","210":"奇数回合强光，你的攻击命中-50%；偶数回合过曝，它受伤+30%。","211":"被致命一击或克制属性命中会激怒2回合：攻击+2、防御-2。","212":"同一属性连续打它，伤害逐次-25%（最低40%），换属性恢复。","213":"电量12格，出招耗电；耗尽后瘫痪2回合，受伤+60%。","214":"每回合点亮你的一个技能位：该位伤害×1.5，其余×0.8。","215":"体力每损失10%，暴击率+10%；压到四成左右后一波带走。","216":"精灵连续在场3回合会混乱；它对身负异常的精灵伤害+50%。","217":"物理打中它变暗影形态（伤害高、怕打），特殊打中变水之形态（耐打、回血）。","301":"被命中会被藤蔓缠住，每回合降速、被吸1/12体力；先制技能或换精灵挣脱。","302":"每挨一下怒气+1，每层火系伤害+20%，满5层砸出怒焰火锤后清空。","303":"念力屏障：你先出手时伤害-60%，后出手全额，慢速重炮手的舞台。","304":"被命中会中剧毒，毒伤从1/12起每回合翻倍；换下精灵重置倍数，毒不会解。","305":"每3回合放浮空连击，被浮空的精灵2回合内物理技能落空。","306":"每3回合放疯狂连锤，每段让你防御-1，降到-5时下一击必杀；换精灵清除。","307":"每回合要对它打出450伤害，否则下回合被压制：必后手、命中-30%。","308":"每击倒你一只精灵，它回复40%体力、攻击+1；残血精灵要及时撤下。","309":"你用过的技能会被冰封3回合，冰封中使用会落空；至少要有三招可用。","310":"奇数回合强光，你的攻击命中-60%；偶数回合过曝，它受伤+25%。","311":"被致命一击或克制属性命中会激怒3回合：攻击+2、防御-1。","312":"同一属性连续打它，伤害逐次-30%（最低40%），换属性恢复。","313":"电量14格，出招耗电；耗尽后瘫痪2回合，受伤+50%。","314":"每回合点亮你的一个技能位：该位伤害×1.4，其余×0.7。","315":"体力每损失10%，暴击率+12%；压到四成左右后一波带走。","316":"精灵连续在场2回合会混乱；它对身负异常的精灵伤害+50%。","317":"物理打中它变暗影形态（伤害高、怕打），特殊打中变水之形态（耐打、回血）。"};

      private static const TYPE_NAMES:Array = ["","草","水","火","飞行","电","机械","地面","普通","冰","超能","战斗","光","暗影","神秘","龙","圣灵"];

      private static const PAGE_INIT_X:int = 63;

      private static const PAGE_END_X:int = -1082;

      private var _box:Sprite;

      private var _ui:TrainDoorEnterUI;

      private var _txt:TextField;

      private var _dualTxt:TextField;

      private var _cards:Array = [];

      private var _dualCards:Array = [];

      private var _index:int = 1;

      private var _dualIndex:int = 1;

      private var _braveMode:Boolean = false;

      private var _dualBraveMode:Boolean = false;

      private var _curX:int = 63;

      public function TrainDoorEnterPanel()
      {
         super();
      }

      public function setup() : void
      {
         var i:int = 0;
         var card:MovieClip = null;
         var child:DisplayObject = null;
         var door:Array = null;
         this._ui = new TrainDoorEnterUI();
         for(i = 0; i < this._ui.numChildren; i++)
         {
            child = this._ui.getChildAt(i);
            if(child.name == "txt" && child.x < 480)
            {
               this._txt = child as TextField;
            }
            else if(child.name == "txt")
            {
               this._dualTxt = child as TextField;
            }
            else if(child.name == "t_2" && child is MovieClip)
            {
               (child as MovieClip).gotoAndStop(1);
            }
         }
         this._ui.misteryTxt.visible = false;
         this._ui.kind.visible = true;
         this._ui.superKind.visible = true;
         this._box = new Sprite();
         this._box.addChild(this._ui);

         for(i = 1; i <= 15; i++)
         {
            card = this._ui.page["t_" + i];
            card.gotoAndStop(1);
            door = DOORS[i - 1];
            card.buttonMode = true;
            card.addEventListener(MouseEvent.CLICK,this.onCard);
            ToolTipManager.add(card,"系列:" + this.doorName(i) + "\n守护精灵:" + door[1] + "\n推荐克制:" + this.typeNames(door[4],"系"));
            this._cards.push(card);
         }

         this._dualCards = [this._ui.s_15,this._ui.s_16];
         for(i = 0; i < this._dualCards.length; i++)
         {
            card = this._dualCards[i];
            if(card)
            {
               card.gotoAndStop(1);
               card.buttonMode = true;
               card.addEventListener(MouseEvent.CLICK,this.onDualCard);
               ToolTipManager.add(card,"系列:" + DUAL_DOORS[i][0] + "系\n守护精灵:" + DUAL_DOORS[i][1] + "\n推荐克制:" + this.typeNames(DUAL_DOORS[i][4],"系"));
            }
         }

         this._ui.page.x = PAGE_INIT_X;
         this._ui.closeBtn.addEventListener(MouseEvent.CLICK,this.onClose);
         this._ui.okBtn.addEventListener(MouseEvent.CLICK,this.onOk);
         this._ui.okBtn2.addEventListener(MouseEvent.CLICK,this.onDualOk);
         this._ui.next.addEventListener(MouseEvent.MOUSE_DOWN,this.onNext);
         this._ui.prev.addEventListener(MouseEvent.MOUSE_DOWN,this.onPrev);

         (this._ui.btns["btn_0"] as SimpleButton).addEventListener(MouseEvent.CLICK,this.onNormalMode);
         (this._ui.btns["btn_1"] as SimpleButton).addEventListener(MouseEvent.CLICK,this.onBraveMode);
         ToolTipManager.add(this._ui.btns["btn_0"],"普通模式：85级守门精灵，首胜奖励专属精元");
         ToolTipManager.add(this._ui.btns["btn_1"],"勇者模式：100级精英，特性加强，挑战成功奖励丰厚经验与赛尔豆");

         (this._ui.btns1["btn_0"] as SimpleButton).addEventListener(MouseEvent.CLICK,this.onDualNormalMode);
         (this._ui.btns1["btn_1"] as SimpleButton).addEventListener(MouseEvent.CLICK,this.onDualBraveMode);
         ToolTipManager.add(this._ui.btns1["btn_0"],"普通模式：88级双属性守门精灵，首胜奖励专属精元");
         ToolTipManager.add(this._ui.btns1["btn_1"],"勇者模式：100级精英，特性加强，挑战成功奖励丰厚经验与赛尔豆");

         this._ui.achieve0.addEventListener(MouseEvent.CLICK,this.onAchieve0);
         this._ui.achieve1.addEventListener(MouseEvent.CLICK,this.onAchieve1);
         ToolTipManager.add(this._ui.achieve0,"查看单属性之门说明");
         ToolTipManager.add(this._ui.achieve1,"查看双属性之门说明");

         this.select(1);
         this.selectDual(1);
      }

      private function doorName(index:int) : String
      {
         return index == 15 ? "迷之门（" + DOORS[14][0] + "系）" : DOORS[index - 1][0] + "系";
      }

      private function typeNames(types:Array, suffix:String) : String
      {
         var names:Array = [];
         for(var i:int = 0; i < types.length; i++)
         {
            names.push(TYPE_NAMES[types[i]] + suffix);
         }
         return names.join("、");
      }

      private function onCard(e:MouseEvent) : void
      {
         this.select(int(String(e.currentTarget.name).split("_")[1]));
      }

      private function onDualCard(e:MouseEvent) : void
      {
         this.selectDual(e.currentTarget == this._ui.s_16 ? 2 : 1);
      }

      private function onNormalMode(e:MouseEvent) : void
      {
         this._braveMode = false;
         this.select(this._index);
      }

      private function onBraveMode(e:MouseEvent) : void
      {
         this._braveMode = true;
         this.select(this._index);
      }

      private function onDualNormalMode(e:MouseEvent) : void
      {
         this._dualBraveMode = false;
         this.selectDual(this._dualIndex);
      }

      private function onDualBraveMode(e:MouseEvent) : void
      {
         this._dualBraveMode = true;
         this.selectDual(this._dualIndex);
      }

      private function onAchieve0(e:MouseEvent) : void
      {
         Alarm.show("单属性之门共开放全部15扇门（含战斗系威里特与迷之门弗洛斯），可在下方自由切换【普通模式】与【勇者模式】挑战！");
      }

      private function onAchieve1(e:MouseEvent) : void
      {
         Alarm.show("双属性之门已开放【草超能·普兰特】与【水暗影·帕里斯】，首胜可获得对应双属性精元，并支持【勇者模式】精英挑战！");
      }

      private function select(index:int) : void
      {
         var i:int = 0;
         var door:Array = DOORS[index - 1];
         this._index = index;
         for(i = 0; i < this._cards.length; i++)
         {
            this._cards[i].gotoAndStop(i + 1 == index ? 2 : 1);
         }
         (this._ui.btns["ballMC"] as MovieClip).gotoAndStop(this._braveMode ? 2 : 1);
         this._ui.picMC.gotoAndStop(index);
         this._ui.kind.gotoAndStop(index);
         if(this._braveMode)
         {
            this._txt.htmlText = "<font color=\'#ffffff\'>勇者守卫：<font color=\'#ff6600\'>" + door[1] + "</font>（100级）<br>通关奖励：<font color=\'#ffff00\'>15000经验、10000赛尔豆</font><br><font color=\'#00ffff\'>【勇者试炼】</font>" + HINTS[door[2] + 100] + "</font>";
         }
         else
         {
            this._txt.htmlText = "<font color=\'#ffffff\'>守护精灵：<font color=\'#00ffff\'>" + door[1] + "</font>（" + door[3] + "级）<br>首胜奖励：<font color=\'#ffff00\'>" + door[5] + "</font><br><br><font color=\'#00ffcc\'>【招牌特性】</font>" + HINTS[door[2]] + "</font>";
         }
      }

      private function selectDual(dualIndex:int) : void
      {
         var door:Array = DUAL_DOORS[dualIndex - 1];
         this._dualIndex = dualIndex;
         if(this._ui.s_15)
         {
            this._ui.s_15.gotoAndStop(dualIndex == 1 ? 2 : 1);
         }
         if(this._ui.s_16)
         {
            this._ui.s_16.gotoAndStop(dualIndex == 2 ? 2 : 1);
         }
         (this._ui.btns1["ballMC"] as MovieClip).gotoAndStop(this._dualBraveMode ? 2 : 1);
         this._ui.superPicMc.gotoAndStop(dualIndex);
         this._ui.superKind.gotoAndStop(dualIndex);
         if(this._dualTxt)
         {
            if(this._dualBraveMode)
            {
               this._dualTxt.htmlText = "<font color=\'#ffffff\'>勇者守卫：<font color=\'#ff6600\'>" + door[1] + "</font>（100级）<br>通关奖励：<font color=\'#ffff00\'>18000经验、12000赛尔豆</font><br><font color=\'#00ffff\'>【勇者试炼】</font>" + HINTS[door[2] + 100] + "</font>";
            }
            else
            {
               this._dualTxt.htmlText = "<font color=\'#ffffff\'>守护精灵：<font color=\'#00ffff\'>" + door[1] + "</font>（" + door[3] + "级）<br>首胜奖励：<font color=\'#ffff00\'>" + door[5] + "</font><br><br><font color=\'#00ffcc\'>【招牌特性】</font>" + HINTS[door[2]] + "</font>";
            }
         }
      }

      private function onNext(e:MouseEvent) : void
      {
         this._curX = Math.max(PAGE_END_X,this._curX - 382);
         this._ui.page.x = this._curX;
      }

      private function onPrev(e:MouseEvent) : void
      {
         this._curX = Math.min(PAGE_INIT_X,this._curX + 382);
         this._ui.page.x = this._curX;
      }

      private function onOk(e:MouseEvent) : void
      {
         var door:Array = DOORS[this._index - 1];
         var param2:uint = uint(door[2]) + (this._braveMode ? 100 : 0);
         this.onClose(null);
         FightInviteManager.fightWithBoss(door[1],param2);
      }

      private function onDualOk(e:MouseEvent) : void
      {
         var door:Array = DUAL_DOORS[this._dualIndex - 1];
         var param2:uint = uint(door[2]) + (this._dualBraveMode ? 100 : 0);
         this.onClose(null);
         FightInviteManager.fightWithBoss(door[1],param2);
      }

      private function onClose(e:MouseEvent) : void
      {
         LevelManager.showOrRemoveMapLevelandToolslevel(true);
         ModuleManager.destroyForInstance(this);
      }

      public function init(data:Object = null) : void
      {
      }

      public function show() : void
      {
         LevelManager.showOrRemoveMapLevelandToolslevel(false);
         LevelManager.appLevel.addChild(this._box);
      }

      public function hide() : void
      {
         DisplayUtil.removeForParent(this._box);
      }

      public function destroy() : void
      {
         var i:int = 0;
         this.hide();
         for(i = 0; i < this._cards.length; i++)
         {
            this._cards[i].removeEventListener(MouseEvent.CLICK,this.onCard);
            ToolTipManager.remove(this._cards[i]);
         }
         this._cards.length = 0;
         for(i = 0; i < this._dualCards.length; i++)
         {
            if(this._dualCards[i])
            {
               this._dualCards[i].removeEventListener(MouseEvent.CLICK,this.onDualCard);
               ToolTipManager.remove(this._dualCards[i]);
            }
         }
         this._dualCards.length = 0;
         this._ui.closeBtn.removeEventListener(MouseEvent.CLICK,this.onClose);
         this._ui.okBtn.removeEventListener(MouseEvent.CLICK,this.onOk);
         this._ui.okBtn2.removeEventListener(MouseEvent.CLICK,this.onDualOk);
         this._ui.next.removeEventListener(MouseEvent.MOUSE_DOWN,this.onNext);
         this._ui.prev.removeEventListener(MouseEvent.MOUSE_DOWN,this.onPrev);
         (this._ui.btns["btn_0"] as SimpleButton).removeEventListener(MouseEvent.CLICK,this.onNormalMode);
         (this._ui.btns["btn_1"] as SimpleButton).removeEventListener(MouseEvent.CLICK,this.onBraveMode);
         (this._ui.btns1["btn_0"] as SimpleButton).removeEventListener(MouseEvent.CLICK,this.onDualNormalMode);
         (this._ui.btns1["btn_1"] as SimpleButton).removeEventListener(MouseEvent.CLICK,this.onDualBraveMode);
         this._ui.achieve0.removeEventListener(MouseEvent.CLICK,this.onAchieve0);
         this._ui.achieve1.removeEventListener(MouseEvent.CLICK,this.onAchieve1);
         ToolTipManager.remove(this._ui.btns["btn_0"]);
         ToolTipManager.remove(this._ui.btns["btn_1"]);
         ToolTipManager.remove(this._ui.btns1["btn_0"]);
         ToolTipManager.remove(this._ui.btns1["btn_1"]);
         ToolTipManager.remove(this._ui.achieve0);
         ToolTipManager.remove(this._ui.achieve1);
         this._box = null;
         this._ui = null;
         this._txt = null;
         this._dualTxt = null;
      }
   }
}
