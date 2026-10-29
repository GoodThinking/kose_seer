package com.robot.app.mapProcess
{
   import com.robot.app.fightLevel.FightLevelModel;
   import com.robot.app.fightLevel.FightPetBagController;
   import com.robot.app.fightLevel.SuccessFightRequestInfo;
   import com.robot.app.fightLevel.ChoiceLevelRequestInfo;
   import com.robot.app.toolBar.ToolBarController;
   import com.robot.core.CommandID;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.event.PetFightEvent;
   import com.robot.core.info.fightInfo.PetFightModel;
   import com.robot.core.info.fightInfo.attack.FightOverInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import flash.utils.clearTimeout;
   import flash.utils.getDefinitionByName;
   import flash.utils.setTimeout;
   import org.taomee.component.control.MLoadPane;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.EventManager;
   import org.taomee.manager.ResourceManager;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.manager.TaomeeManager;
   import org.taomee.utils.DisplayUtil;
   
   public class MapProcess_500 extends BaseMapProcess
   {
      
      private var b1:Boolean = true;
      
      private var _allBossA:Array = [];
      
      private var _curIndex:uint = 0;
      
      private var _bossContainer:Sprite;
      
      private var _allPointA:Array = [new Point(410,296),new Point(490,296),new Point(570,296),new Point(650,296),new Point(730,296),new Point(810,296)];
      
      private var tt:uint;
      
      private var nextBossId:Array;
      
      private var _disposed:Boolean;
      
      private var _restoreTimer:uint;
      
      public function MapProcess_500()
      {
         super();
      }
      
      override protected function init() : void
      {
         this.b1 = true;
         this._disposed = false;
         LevelManager.iconLevel.visible = false;
         ToolBarController.panel.hide();
         SocketConnection.addCmdListener(CommandID.CHOICE_FIGHT_LEVEL,this.onRestoreLevel);
         this._restoreTimer = setTimeout(this.onRestoreFailure,5000);
         SocketConnection.send(CommandID.CHOICE_FIGHT_LEVEL,0);
      }
      
      private function stopRestoreRequest() : void
      {
         if(this._restoreTimer) clearTimeout(this._restoreTimer);
         this._restoreTimer = 0;
         SocketConnection.removeCmdListener(CommandID.CHOICE_FIGHT_LEVEL,this.onRestoreLevel);
      }
      
      private function onRestoreLevel(event:SocketEvent) : void
      {
         this.stopRestoreRequest();
         if(this._disposed) return;
         var info:ChoiceLevelRequestInfo = event.data as ChoiceLevelRequestInfo;
         if(!info || info.getLevel < 1 || info.getLevel > FightLevelModel.maxLevel || !info.getBossId || info.getBossId.length == 0)
         {
            this.onRestoreFailure();
            return;
         }
         FightLevelModel.setBossId = info.getBossId;
         FightLevelModel.setCurLevel = info.getLevel;
         MainManager.actorInfo.curStage = info.getLevel;
         this.upDatahandler();
      }
      
      private function onRestoreFailure() : void
      {
         this.stopRestoreRequest();
         if(this._disposed) return;
         ToolBarController.panel.show();
         LevelManager.iconLevel.visible = true;
         Alarm.show("暂时无法读取勇者之塔进度，确认后返回太空站。已保存的挑战层数不会丢失。",function():void
         {
            if(!_disposed) MapManager.changeMap(101);
         });
      }
      
      private function upDatahandler() : void
      {
         var _loc1_:* = 0;
         var _loc2_:String = null;
         var _loc3_:* = 0;
         var _loc4_:* = 0;
         if(FightLevelModel.getCurLevel > FightLevelModel.maxLevel)
         {
            _loc1_ = FightLevelModel.maxLevel;
         }
         else
         {
            _loc1_ = FightLevelModel.getCurLevel;
         }
         if(_loc1_ > 60)
         {
            _loc1_ = 60;
         }
         if(_loc1_ > 70)
         {
            _loc1_ = 70;
         }
         var _loc5_:int = 1;
         while(_loc5_ <= _loc1_)
         {
            this.conLevel["mc" + _loc5_].alpha = 1;
            _loc5_++;
         }
         if(FightLevelModel.getCurLevel < 10)
         {
            conLevel["lvmc2"].gotoAndStop(FightLevelModel.getCurLevel + 2);
            animatorLevel["floorMc"].gotoAndStop(1);
         }
         else if(FightLevelModel.getCurLevel == 100)
         {
            conLevel["lvmc1"].gotoAndStop(3);
            conLevel["lvmc2"].gotoAndStop(2);
            conLevel["lvmc3"].gotoAndStop(2);
         }
         else if(FightLevelModel.getCurLevel < 100)
         {
            if(FightLevelModel.getCurLevel % 10 == 0)
            {
               animatorLevel["floorMc"].gotoAndStop(int(FightLevelModel.getCurLevel / 10));
            }
            else
            {
               animatorLevel["floorMc"].gotoAndStop(int(FightLevelModel.getCurLevel / 10) + 1);
            }
            conLevel["lvmc1"].gotoAndStop(int(FightLevelModel.getCurLevel % 100 / 10) + 2);
            conLevel["lvmc3"].gotoAndStop(int(FightLevelModel.getCurLevel % 10) + 2);
         }
         else
         {
            if(FightLevelModel.getCurLevel % 10 == 0)
            {
               animatorLevel["floorMc"].gotoAndStop(int(FightLevelModel.getCurLevel / 10));
            }
            else
            {
               animatorLevel["floorMc"].gotoAndStop(int(FightLevelModel.getCurLevel / 10) + 1);
            }
            conLevel["lvmc1"].gotoAndStop(int(FightLevelModel.getCurLevel / 100) + 2);
            conLevel["lvmc2"].gotoAndStop(int(FightLevelModel.getCurLevel % 100 / 10) + 2);
            conLevel["lvmc3"].gotoAndStop(int(FightLevelModel.getCurLevel % 10) + 2);
         }
         ToolTipManager.add(conLevel["door_0"],"离开");
         ToolTipManager.add(conLevel["mosterMc"],"精灵背包");
         conLevel["mosterMc"].addEventListener(MouseEvent.CLICK,this.onMonsterHandler);
         this._allBossA = [];
         this._curIndex = 0;
         this._bossContainer = new Sprite();
         this._bossContainer.y = 240;
         this._bossContainer.buttonMode = true;
         this._bossContainer.addEventListener(MouseEvent.CLICK,this.onFightBtnClickHandler);
         MapManager.currentMap.depthLevel.addChild(this._bossContainer);
         this.loadBoss(FightLevelModel.getBossId[0]);
      }
      
      private function onMonsterHandler(param1:MouseEvent) : void
      {
         FightPetBagController.show();
      }
      
      override public function destroy() : void
      {
         var _loc1_:int = 0;
         this._disposed = true;
         this.stopRestoreRequest();
         clearTimeout(this.tt);
         SocketConnection.removeCmdListener(CommandID.START_FIGHT_LEVEL,this.onSuccessHandler);
         SocketConnection.removeCmdListener(CommandID.LEAVE_FIGHT_LEVEL,this.onLeaveFightHandler);
         EventManager.removeEventListener(PetFightEvent.FIGHT_CLOSE,this.handle);
         TaomeeManager.unbindTower();
         ToolTipManager.remove(conLevel["mosterMc"]);
         conLevel["mosterMc"].removeEventListener(MouseEvent.CLICK,this.onMonsterHandler);
         ToolTipManager.remove(conLevel["door_0"]);
         if(Boolean(this._allBossA))
         {
            _loc1_ = 0;
            while(_loc1_ < this._allBossA.length)
            {
               ToolTipManager.remove(this._allBossA[_loc1_]);
               DisplayUtil.removeForParent(this._allBossA[_loc1_]);
               this._allBossA[_loc1_] = null;
               _loc1_++;
            }
            this._allBossA = null;
         }
         if(Boolean(this._bossContainer))
         {
            this._bossContainer.removeEventListener(MouseEvent.CLICK,this.onFightBtnClickHandler);
            DisplayUtil.removeForParent(this._bossContainer);
            this._bossContainer = null;
         }
      }
      
      private function loadBoss(param1:uint) : void
      {
         var _loc2_:String = ClientConfig.getPetSwfPath(param1);
         ResourceManager.getResource(_loc2_,this.loadComHandler,"pet");
      }
      
      private function loadComHandler(param1:DisplayObject) : void
      {
         if(this._disposed) return;
         var mc:MovieClip = null;
         var dis:DisplayObject = param1;
         mc = null;
         mc = dis as MovieClip;
         if(Boolean(mc))
         {
            mc.gotoAndStop("down");
            mc.addEventListener(Event.ENTER_FRAME,function():void
            {
               var _loc2_:MovieClip = mc.getChildAt(0) as MovieClip;
               if(Boolean(_loc2_))
               {
                  _loc2_.gotoAndStop(1);
                  mc.removeEventListener(Event.ENTER_FRAME,arguments.callee);
               }
            });
            this._allBossA.push(mc);
            if(this._allBossA.length < FightLevelModel.getBossId.length)
            {
               this.loadBoss(FightLevelModel.getBossId[this._allBossA.length]);
            }
            else
            {
               this.addAllBossToMap();
            }
         }
      }
      
      private function addAllBossToMap() : void
      {
         var _loc2_:MovieClip = null;
         var _loc3_:MLoadPane = null;
         var _loc4_:int = 0;
         var _loc5_:String = null;
         while(this._bossContainer.numChildren > 0)
         {
            this._bossContainer.removeChildAt(0);
         }
         var _loc1_:int = 0;
         while(_loc1_ < this._allBossA.length)
         {
            _loc2_ = this._allBossA[_loc1_] as MovieClip;
            _loc3_ = new MLoadPane(_loc2_);
            _loc3_.fitType = _loc2_.width > _loc2_.height ? uint(MLoadPane.FIT_WIDTH) : uint(MLoadPane.FIT_HEIGHT);
            _loc3_.setSizeWH(80,80);
            this._bossContainer.addChild(_loc3_);
            _loc3_.x = 100 * _loc1_;
            _loc4_ = int(FightLevelModel.getBossId[_loc1_]);
            _loc5_ = PetXMLInfo.getName(_loc4_);
            ToolTipManager.add(_loc3_,_loc5_);
            _loc1_++;
         }
         this._bossContainer.x = (960 - this._bossContainer.width) / 2;
         TaomeeManager.bindTower(500,function():void { _bossContainer.dispatchEvent(new MouseEvent(MouseEvent.CLICK)); },leaveFight);
      }
      
      private function onFightBtnClickHandler(param1:MouseEvent) : void
      {
         param1.currentTarget.buttonMode = false;
         param1.currentTarget.removeEventListener(MouseEvent.CLICK,this.onFightBtnClickHandler);
         this.tt = setTimeout(this.timeOutHandler,2000);
         EventManager.addEventListener(PetFightEvent.FIGHT_CLOSE,this.handle);
         PetFightModel.mode = PetFightModel.MULTI_MODE;
         PetFightModel.status = PetFightModel.FIGHT_WITH_BOSS;
         SocketConnection.addCmdListener(CommandID.START_FIGHT_LEVEL,this.onSuccessHandler);
         SocketConnection.send(CommandID.START_FIGHT_LEVEL);
      }
      
      private function timeOutHandler() : void
      {
         clearTimeout(this.tt);
      }
      
      private function onSuccessHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.START_FIGHT_LEVEL,this.onSuccessHandler);
         var _loc2_:SuccessFightRequestInfo = param1.data as SuccessFightRequestInfo;
         this.nextBossId = _loc2_.getBossId;
      }
      
      private function handle(param1:PetFightEvent) : void
      {
         EventManager.removeEventListener(PetFightEvent.FIGHT_CLOSE,this.handle);
         var _loc2_:FightOverInfo = param1.dataObj["data"];
         var _loc3_:* = getDefinitionByName("com.robot.petFightModule.PetFightEntry");
         if(Boolean(_loc3_.fighterCon.isEscape))
         {
            this.b1 = true;
            TaomeeManager.prepareTower(500);
            MapManager.changeMap(500);
            return;
         }
         if(_loc2_.winnerID == MainManager.actorInfo.userID)
         {
            this.b1 = true;
            ++MainManager.actorInfo.curStage;
            if(MainManager.actorInfo.curStage > FightLevelModel.maxLevel)
            {
               this.leaveFight();
            }
            else
            {
               FightLevelModel.setBossId = this.nextBossId;
               FightLevelModel.setCurLevel = MainManager.actorInfo.curStage;
               TaomeeManager.prepareTower(500);
               MapManager.changeMap(500);
            }
         }
         else
         {
            this.b1 = false;
            this.leaveFight();
         }
      }
      
      private function onLeaveFightHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.LEAVE_FIGHT_LEVEL,this.onLeaveFightHandler);
         if(this._disposed) return;
         ToolBarController.panel.show();
         LevelManager.iconLevel.visible = true;
         if(this.b1 == false)
         {
            Alarm.show("很遗憾，刚才的战斗你没有获胜，你需要重新开始挑战，不要气馁，再接再厉。",function():void
            {
               if(!_disposed) MapManager.changeMap(101);
            });
         }
         else
         {
            this.b1 = false;
            MapManager.changeMap(101);
         }
      }
      
      public function leaveFight() : void
      {
         TaomeeManager.prepareTower(0);
         SocketConnection.addCmdListener(CommandID.LEAVE_FIGHT_LEVEL,this.onLeaveFightHandler);
         SocketConnection.send(CommandID.LEAVE_FIGHT_LEVEL);
      }
   }
}

