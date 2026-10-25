package com.robot.app.mapProcess
{
   import com.robot.app.spt.*;
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task801;
   import com.robot.core.animate.*;
   import com.robot.core.event.*;
   import com.robot.core.info.fightInfo.attack.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.net.*;
   import com.robot.core.npc.*;
   import com.robot.core.ui.alert.*;
   import flash.events.*;
   import flash.utils.*;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class MapProcess_686 extends BaseMapProcess
   {
      
      private static const GET_FIREFRUIT:uint = 2277;
      private static const ANYEBINHU_LEVEL:uint = 2278;
      private var _destroyed:Boolean;
      private var _bridgeAnimating:Boolean;
      private var _bridgeClickCount:uint = 0;
      
      private var _fruitTimer1:Timer;
      
      private var _fruitTimer2:Timer;
      private var _foxRegion:uint;
      
      public function MapProcess_686()
      {
         super();
      }
      
      private function onFinishFight(param1:PetFightEvent) : void
      {
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFinishFight);
         var _loc2_:FightOverInfo = param1.dataObj as FightOverInfo;
         if(_loc2_.winnerID != MainManager.actorID)
         {
            NpcDialog.show(NPC.ANYEBINGFU,[_foxRegion == 1 ? "火之果已经削弱了我的力量，不过想战胜我，还是得认真准备哦！先恢复精灵体力，再试试克制我的属性吧！" : "哈哈！你也太弱了吧！不过呢？如果你拥有0xff0000火之果0xffffff，可能我还会怕你三分！0xff0000不过火之果很难获得，不信你可以去我周围的冰洞中找找！0xffffff"],["好，我等等再来挑战你！"]);
         }
      }
      
      override protected function init() : void
      {
         var _loc1_:BaseMapProcess = null;
         _loc1_ = this;
         animatorLevel["task_801_3"].visible = false;
         animatorLevel["task_811_6"].visible = false;
         this._fruitTimer1 = new Timer(2000,1);
         this._fruitTimer1.addEventListener(TimerEvent.TIMER,this.onTimer1);
         this._fruitTimer2 = new Timer(2000,1);
         this._fruitTimer2.addEventListener(TimerEvent.TIMER,this.onTimer2);
         this.initBridge();
         this.initSptAnyebinghu();
         this.initFireFruit();
         EventManager.addEventListener(RobotEvent.NO_PET_CAN_FIGHT,onFightEntryRejected);
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task801.initTaskForMap686(_loc1_);
         },this);
      }
      
      private function initFireFruit() : void
      {
         ToolTipManager.add(conLevel["fireFruit"],"火之果：点击采集，有概率获得；持有即可削弱暗夜冰狐");
         conLevel["fireFruit"].buttonMode = true;
         conLevel["fireFruit"].addEventListener(MouseEvent.CLICK,this.onFireFruitClick);
      }
      
      private function onFireFruitClick(param1:MouseEvent) : void
      {
         conLevel["fireFruit"].buttonMode = false;
         conLevel["fireFruit"].removeEventListener(MouseEvent.CLICK,this.onFireFruitClick);
         SocketConnection.addCmdListener(GET_FIREFRUIT,this.onFruitHandler);
         SocketConnection.send(GET_FIREFRUIT);
      }
      
      private function onFruitHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(GET_FIREFRUIT,this.onFruitHandler);
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:uint = _loc2_.readUnsignedInt();
         if(_loc3_ == 300451)
         {
            ItemManager.upDateCollection(300451);
            conLevel["fireFruit"].gotoAndStop(2);
            this._fruitTimer1.start();
         }
         else if(_loc3_ == 0)
         {
            conLevel["fireFruit"].gotoAndStop(3);
            this._fruitTimer2.start();
         }
      }
      
      private function onTimer1(param1:TimerEvent) : void
      {
         this.alarmGetFruit();
         this._fruitTimer1.reset();
      }
      
      private function onTimer2(param1:TimerEvent) : void
      {
         conLevel["fireFruit"].gotoAndStop(1);
         conLevel["fireFruit"].buttonMode = true;
         conLevel["fireFruit"].addEventListener(MouseEvent.CLICK,this.onFireFruitClick);
         ToolTipManager.remove(conLevel["fireFruit"]);
         ToolTipManager.add(conLevel["fireFruit"],"这次未获得火之果，可以再次采集（有概率获得）");
         this._fruitTimer2.reset();
      }
      
      private function alarmGetFruit() : void
      {
         Alarm.show("恭喜获得一个火之果！",function():void
         {
            if(_destroyed) return;
            conLevel["fireFruit"].gotoAndStop(1);
            conLevel["fireFruit"].buttonMode = true;
            conLevel["fireFruit"].addEventListener(MouseEvent.CLICK,onFireFruitClick);
         });
      }
      
      private function initSptAnyebinghu() : void
      {
         ToolTipManager.add(conLevel["sptAnyebinghu"],"暗夜冰狐：持有火之果可挑战弱化形态，不消耗果实");
         conLevel["sptAnyebinghu"].buttonMode = true;
         conLevel["sptAnyebinghu"].addEventListener(MouseEvent.CLICK,this.onSptClick);
      }
      
      private function onSptClick(param1:MouseEvent) : void
      {
         var event:MouseEvent = param1;
         AnimateManager.playMcAnimate(conLevel["sptAnyebinghu"],2,"mc",function():void
         {
            if(_destroyed) return;
            NpcDialog.show(NPC.ANYEBINGFU,["快看，那边可是四大神兽的石像哦！我也想早日成为神兽级的精灵！那样火狐就一定会以为为傲的！嘿嘿！"],["我要向你挑战！","我随便说说的！"],[function():void
            {
            if(_destroyed) return;
               SocketConnection.addCmdListener(ANYEBINHU_LEVEL,onLevelHandler);
               SocketConnection.send(ANYEBINHU_LEVEL);
            }]);
         });
      }
      
      private function onLevelHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(ANYEBINHU_LEVEL,this.onLevelHandler);
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:uint = _loc2_.readUnsignedInt();
         if(_loc3_ > 1) return;
         _foxRegion = _loc3_;
         EventManager.addEventListener(PetFightEvent.ALARM_CLICK,onFinishFight);
         if(_loc3_ == 0)
         {
            FightBossController.fightBoss("暗夜冰狐");
         }
         else
         {
            FightBossController.fightBoss("暗夜冰狐",1);
         }
      }
      
      private function initBridge() : void
      {
         ToolTipManager.add(conLevel["bridge"],"吊桥木板：需要操作两步才能铺好吊桥");
         conLevel["bridge"].buttonMode = true;
         conLevel["bridge"].addEventListener(MouseEvent.CLICK,this.onBridgeClick);
      }
      
      private function onBridgeClick(param1:MouseEvent) : void
      {
         var event:MouseEvent = param1;
         if(_bridgeAnimating || _bridgeClickCount >= 2) return;
         _bridgeAnimating = true;
         ++this._bridgeClickCount;
         AnimateManager.playMcAnimate(conLevel["bridge"],this._bridgeClickCount,"mc",function():void
         {
            if(_destroyed) return;
            _bridgeAnimating = false;
            if(_bridgeClickCount == 2)
            {
               conLevel["bridge"].buttonMode = false;
               conLevel["bridge"].removeEventListener(MouseEvent.CLICK,onBridgeClick);
               DisplayUtil.removeForParent(typeLevel["barrier"]);
               MapManager.currentMap.makeMapArray();
               ToolTipManager.remove(conLevel["bridge"]);
               Task801.onBridge();

            }
            else
            {
               ToolTipManager.remove(conLevel["bridge"]);
               ToolTipManager.add(conLevel["bridge"],"吊桥尚未完成：再点击一次木板");
            }
         });
      }
      
      private function onFightEntryRejected(event:RobotEvent) : void
      {
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFinishFight);
      }

      override public function destroy() : void
      {
         _destroyed = true;
         Task801.destroy(this);
         _fruitTimer1.stop();
         _fruitTimer2.stop();
         _fruitTimer1.removeEventListener(TimerEvent.TIMER,onTimer1);
         _fruitTimer2.removeEventListener(TimerEvent.TIMER,onTimer2);
         SocketConnection.removeCmdListener(GET_FIREFRUIT,onFruitHandler);
         SocketConnection.removeCmdListener(ANYEBINHU_LEVEL,onLevelHandler);
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFinishFight);
         EventManager.removeEventListener(RobotEvent.NO_PET_CAN_FIGHT,onFightEntryRejected);
         conLevel["bridge"].removeEventListener(MouseEvent.CLICK,onBridgeClick);
         conLevel["fireFruit"].removeEventListener(MouseEvent.CLICK,onFireFruitClick);
         conLevel["sptAnyebinghu"].removeEventListener(MouseEvent.CLICK,onSptClick);
         ToolTipManager.remove(conLevel["bridge"]);
         ToolTipManager.remove(conLevel["fireFruit"]);
         ToolTipManager.remove(conLevel["sptAnyebinghu"]);
      }
   }
}
