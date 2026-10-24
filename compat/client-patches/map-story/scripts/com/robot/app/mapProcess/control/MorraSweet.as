package com.robot.app.mapProcess.control
{
   import com.robot.app.fight.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.info.fightInfo.attack.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import com.robot.core.ui.alert.*;
   import flash.events.*;
   import flash.utils.*;
   import org.taomee.manager.*;
   
   public class MorraSweet
   {
      
      private static var _numItem:int;
      
      private static var _isBoss:Boolean;
      
      private static var _hasTalk:Boolean;
      
      private static var _hasPass:Boolean;
      
      private static var _instance:MorraSweet;
      
      private static var _lastFightOver:FightOverInfo;
      
      private static const TASK_ID:uint = 643;
      
      private var _map:BaseMapProcess;
      
      private var _passResolved:Boolean;
      
      private var _passReading:Boolean;
      
      private var _passSaving:Boolean;
      
      private var _queuedClick:Boolean;
      
      private var _passReadToken:uint;
      
      private var _passSaveToken:uint;
      
      public function MorraSweet()
      {
         super();
      }
      
      public static function getInstance() : MorraSweet
      {
         if(!_instance)
         {
            _instance = new MorraSweet();
         }
         return _instance;
      }
      
      public function start(param1:BaseMapProcess) : void
      {
         this._map = param1;
         var _loc2_:uint = uint(TasksManager.getTaskStatus(TASK_ID));
         _hasTalk = _loc2_ != TasksManager.UN_ACCEPT;
         _hasPass = _loc2_ == TasksManager.COMPLETE;
         this._passResolved = _loc2_ != TasksManager.ALR_ACCEPT;
         this._passReading = false;
         this._passSaving = false;
         this._queuedClick = false;
         this._passReadToken = 0;
         this._passSaveToken = 0;
         if(!this._passResolved)
         {
            this.loadPass();
         }
         ToolTipManager.add(this._map.conLevel["benzhu"],"本竺");
         this._map.conLevel["benzhu"].buttonMode = true;
         this._map.conLevel["benzhu"].addEventListener(MouseEvent.CLICK,this.onBenzhuClick);
         EventManager.addEventListener(RobotEvent.NO_PET_CAN_FIGHT,this.onFightError);
         EventManager.addEventListener(PetFightEvent.ALARM_CLICK,this.onFightComplete);
      }
      
      private function loadPass() : void
      {
         var token:uint = 0;
         var actorID:uint = 0;
         var self:MorraSweet = null;
         if(Boolean(this._passReading) || this._map == null)
         {
            return;
         }
         this._passReading = true;
         token = ++this._passReadToken;
         actorID = uint(MainManager.actorID);
         self = this;
         setTimeout(function():void
         {
            if(_instance != self || self._map == null || MainManager.actorID != actorID || self._passReadToken != token || !self._passReading)
            {
               return;
            }
            self._passReading = false;
            ++self._passReadToken;
            if(self._queuedClick)
            {
               self._queuedClick = false;
               SimpleAlarm.show("本竺进度读取超时，请再点一次本竺。");
            }
         },10000);
         TasksManager.getProStatus(TASK_ID,0,function(param1:Boolean):void
         {
            if(_instance != self || self._map == null || MainManager.actorID != actorID || self._passReadToken != token)
            {
               return;
            }
            self._passReading = false;
            self._passResolved = true;
            _hasPass = param1 || TasksManager.getTaskStatus(TASK_ID) == TasksManager.COMPLETE;
            if(self._queuedClick)
            {
               self._queuedClick = false;
               self.onBenzhuClick(null);
            }
         });
      }
      
      public function onBenzhuClick(param1:MouseEvent) : void
      {
         if(this._map == null || MapManager.currentMap == null || MapManager.currentMap.id != 497)
         {
            return;
         }
         if(this._passSaving)
         {
            return;
         }
         if(!this._passResolved)
         {
            this._queuedClick = true;
            this.loadPass();
            return;
         }
         if(_hasPass)
         {
            _isBoss = true;
            FightManager.fightWithBoss("本竺",2);
            return;
         }
         if(_hasTalk)
         {
            if(_numItem < 3)
            {
               NpcDialog.show(NPC.BENZHU,["活力能量收集好了吗？击败附近的哈喽和哈德萨，有机会获得活力能量。你已经收集了0xff0000" + _numItem + "/3瓶0xffffff！"],["我这就去收集！"]);
            }
            else
            {
               NpcDialog.show(NPC.BENZHU,["活力能量果然让人精神，来吧，我们猜拳吧，等不急了！"],["我会让你输的心服口服的！开始吧！"],[function():void
               {
                  ModuleManager.showModule(ClientConfig.getAppModule("MorraSweetGame"),"正在加载游戏",false);
               }]);
            }
            return;
         }
         NpcDialog.show(NPC.BENZHU,["来猜拳吗？和我猜拳可以让你变得更加聪明哦！不过我可从来没输过，你得有输的心理准备，哈哈！"],["没输过？你吹牛吧！怎么个猜法？","我还有事，下次再玩。"],[function():void
         {
            NpcDialog.show(NPC.BENZHU,["规则很简单，我出剪刀，那么你会选择出什么？"],["当然是石头了（传说中的猜拳达人也就这点本事……）。"],[function():void
            {
               NpcDialog.show(NPC.BENZHU,["哎呀，看来你也是高手啊！不过猜拳很费脑力，我得补充0xff0000三瓶活力能量0xffffff，你那里有吗？"],["活力能量？怎么才能得到这种能量呢？"],[function():void
               {
                  NpcDialog.show(NPC.BENZHU,["听说附近的0xff0000哈喽和哈德萨0xffffff身上有这种能量哦！快点吧，我等不急要跟你切磋一下了！"],["好的，等着，我马上去收集活力能量！"],[function():void
                  {
                     TasksManager.accept(TASK_ID,function(param1:Boolean):void
                     {
                        if(param1)
                        {
                           _hasTalk = true;
                        }
                     });
                  }]);
               }]);
            }]);
         }]);
      }
      
      public function onGameClose() : void
      {
         _numItem = 0;
         _isBoss = false;
      }
      
      public function onGameWin() : void
      {
         var token:uint = 0;
         var actorID:uint = 0;
         var self:MorraSweet = null;
         _numItem = 0;
         if(this._passSaving)
         {
            return;
         }
         if(Boolean(_hasPass) || TasksManager.getTaskStatus(TASK_ID) == TasksManager.COMPLETE)
         {
            _hasPass = true;
            this.showWinFight();
            return;
         }
         this._passSaving = true;
         token = ++this._passSaveToken;
         actorID = uint(MainManager.actorID);
         self = this;
         setTimeout(function():void
         {
            if(_instance != self || self._map == null || MainManager.actorID != actorID || self._passSaveToken != token || !self._passSaving)
            {
               return;
            }
            self._passSaving = false;
            ++self._passSaveToken;
            self._passResolved = false;
            self.loadPass();
            SimpleAlarm.show("本竺挑战资格保存超时，正在重新读取进度。");
         },10000);
         TasksManager.setProStatus(TASK_ID,0,true,function(param1:Boolean):void
         {
            if(_instance != self || self._map == null || MainManager.actorID != actorID || self._passSaveToken != token)
            {
               return;
            }
            self._passSaving = false;
            if(!param1)
            {
               SimpleAlarm.show("本竺挑战资格保存失败，请重新猜拳。");
               return;
            }
            _hasPass = true;
            self._passResolved = true;
            self.showWinFight();
         });
      }
      
      private function showWinFight() : void
      {
         var self:MorraSweet = null;
         self = this;
         NpcDialog.show(NPC.BENZHU,["不会的，我怎么可能输呢！可恶，我要和你对战！"],null,null,false,function():void
         {
            if(self._map == null || MapManager.currentMap == null || MapManager.currentMap.id != 497)
            {
               return;
            }
            _isBoss = true;
            FightManager.fightWithBoss("本竺",2);
         });
      }
      
      public function onGameLose() : void
      {
         _numItem = 0;
         _isBoss = false;
         NpcDialog.show(NPC.BENZHU,["我就说我不会输啦，哈哈哈！猜拳达人非我莫属！"],["别高兴太早，我还会回来的！"]);
      }
      
      public function onFightError(param1:RobotEvent) : void
      {
         if(_isBoss)
         {
            _isBoss = false;
         }
      }
      
      public function onFightComplete(param1:PetFightEvent) : void
      {
         var _loc2_:FightOverInfo = param1.dataObj as FightOverInfo;
         if(_loc2_ == null || _loc2_ == _lastFightOver)
         {
            return;
         }
         _lastFightOver = _loc2_;
         if(_isBoss)
         {
            _isBoss = false;
            return;
         }
         if(_numItem == 3)
         {
            return;
         }
         if(!_hasTalk)
         {
            return;
         }
         if(_loc2_.winnerID == MainManager.actorID)
         {
            if(Math.random() < 0.5)
            {
               ++_numItem;
               if(_numItem < 3)
               {
                  SimpleAlarm.show("你获得一个活力能量！");
               }
               else
               {
                  SimpleAlarm.show("你获得一个活力能量！（已收集满3个活力能量）");
               }
            }
         }
      }
      
      public function destory() : void
      {
         if(this._map != null)
         {
            ToolTipManager.remove(this._map.conLevel["benzhu"]);
            this._map.conLevel["benzhu"].removeEventListener(MouseEvent.CLICK,this.onBenzhuClick);
         }
         EventManager.removeEventListener(RobotEvent.NO_PET_CAN_FIGHT,this.onFightError);
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,this.onFightComplete);
         this._map = null;
         _instance = null;
      }
   }
}

