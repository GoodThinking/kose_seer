package com.robot.app.mapProcess
{
   import com.robot.app.fightLevel.FightPetBagController;
   import com.robot.app.freshFightLevel.FightLevelModel;
   import com.robot.app.freshFightLevel.FreshSuccessFightRequestInfo;
   import com.robot.app.freshFightLevel.FreshChoiceLevelRequestInfo;
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
   import com.robot.core.manager.TasksManager;
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
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.EventManager;
   import org.taomee.manager.ResourceManager;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.manager.TaomeeManager;
   import org.taomee.utils.DisplayUtil;
   
   public class MapProcess_600 extends BaseMapProcess
   {
      
      private var b1:Boolean = true;
      
      private var _allBossA:Array = [];
      
      private var _curIndex:uint = 0;
      
      private var _bossContainer:Sprite;
      
      private var _allPointA:Array = [new Point(410,296),new Point(490,296),new Point(570,296)];
      
      private var tt:uint;
      
      private var nextBossId:Array;
      
      private var _disposed:Boolean;
      
      private var _restoreTimer:uint;
      
      public function MapProcess_600()
      {
         super();
      }
      
      override protected function init() : void
      {
         this.b1 = true;
         this._disposed = false;
         LevelManager.iconLevel.visible = false;
         ToolBarController.panel.hide();
         SocketConnection.addCmdListener(CommandID.FRESH_CHOICE_FIGHT_LEVEL,this.onRestoreLevel);
         this._restoreTimer = setTimeout(this.onRestoreFailure,5000);
         SocketConnection.send(CommandID.FRESH_CHOICE_FIGHT_LEVEL,0);
      }
      
      private function stopRestoreRequest() : void
      {
         if(this._restoreTimer) clearTimeout(this._restoreTimer);
         this._restoreTimer = 0;
         SocketConnection.removeCmdListener(CommandID.FRESH_CHOICE_FIGHT_LEVEL,this.onRestoreLevel);
      }
      
      private function onRestoreLevel(event:SocketEvent) : void
      {
         this.stopRestoreRequest();
         if(this._disposed) return;
         var info:FreshChoiceLevelRequestInfo = event.data as FreshChoiceLevelRequestInfo;
         if(!info || info.getLevel < 1 || info.getLevel > FightLevelModel.maxLevel || !info.getBossId || info.getBossId.length == 0)
         {
            this.onRestoreFailure();
            return;
         }
         FightLevelModel.setBossId = info.getBossId;
         FightLevelModel.setCurLevel = info.getLevel;
         MainManager.actorInfo.curFreshStage = info.getLevel;
         this.upDatahandler();
      }
      
      private function onRestoreFailure() : void
      {
         this.stopRestoreRequest();
         if(this._disposed) return;
         ToolBarController.panel.show();
         LevelManager.iconLevel.visible = true;
         Alarm.show("暂时无法读取试炼进度，确认后返回太空站。已保存的挑战层数不会丢失。",function():void
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
         if(FightLevelModel.getCurLevel < 10)
         {
            conLevel["tens_mc"].gotoAndStop(2);
            conLevel["units_mc"].gotoAndStop(FightLevelModel.getCurLevel + 2);
         }
         else if(FightLevelModel.getCurLevel == 30)
         {
            conLevel["tens_mc"].gotoAndStop(5);
            conLevel["units_mc"].gotoAndStop(2);
         }
         else
         {
            _loc2_ = String(FightLevelModel.getCurLevel);
            _loc3_ = uint(_loc2_.slice(0,1));
            _loc4_ = uint(_loc2_.slice(1,2));
            conLevel["tens_mc"].gotoAndStop(_loc3_ + 2);
            conLevel["units_mc"].gotoAndStop(_loc4_ + 2);
         }
         ToolTipManager.add(conLevel["door_0"],"离开");
         conLevel["door_0"].buttonMode = true;
         conLevel["door_0"].addEventListener(MouseEvent.CLICK,this.onDoorHandler);
         ToolTipManager.add(conLevel["mosterMc"],"精灵背包");
         conLevel["mosterMc"].addEventListener(MouseEvent.CLICK,this.onMonsterHandler);
         this._allBossA = [];
         this._curIndex = 0;
         this.loadBoss(FightLevelModel.getBossId[0]);
      }
      
      private function onMonsterHandler(param1:MouseEvent) : void
      {
         FightPetBagController.show();
      }
      
      private function onDoorHandler(param1:MouseEvent) : void
      {
         conLevel["door_0"].removeEventListener(MouseEvent.CLICK,this.onDoorHandler);
         this.b1 = true;
         this.leaveFight();
      }
      
      override public function destroy() : void
      {
         var _loc1_:int = 0;
         this._disposed = true;
         this.stopRestoreRequest();
         clearTimeout(this.tt);
         SocketConnection.removeCmdListener(CommandID.FRESH_START_FIGHT_LEVEL,this.onSuccessHandler);
         SocketConnection.removeCmdListener(CommandID.FRESH_LEAVE_FIGHT_LEVEL,this.onLeaveFightHandler);
         EventManager.removeEventListener(PetFightEvent.FIGHT_CLOSE,this.handle);
         TaomeeManager.unbindTower();
         ToolTipManager.remove(conLevel["mosterMc"]);
         conLevel["mosterMc"].removeEventListener(MouseEvent.CLICK,this.onMonsterHandler);
         ToolTipManager.remove(conLevel["door_0"]);
         conLevel["door_0"].removeEventListener(MouseEvent.CLICK,this.onDoorHandler);
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
         var _loc1_:Number = Number(NaN);
         this._bossContainer = new Sprite();
         var _loc2_:int = 0;
         while(_loc2_ < this._allBossA.length)
         {
            this._bossContainer.addChild(this._allBossA[_loc2_] as MovieClip);
            _loc1_ = this._allBossA[_loc2_].width * 1.5;
            this._allBossA[_loc2_].width *= 1.6;
            this._allBossA[_loc2_].height *= 1.6;
            ToolTipManager.add(this._allBossA[_loc2_],PetXMLInfo.getName(FightLevelModel.getBossId[_loc2_]));
            _loc2_++;
         }
         if(this._allBossA.length == 1)
         {
            this._allBossA[0].x = this._allPointA[1].x;
            this._allBossA[0].y = this._allPointA[1].y;
            this._allBossA[0].scaleX *= 1.2;
            this._allBossA[0].scaleY *= 1.2;
         }
         MapManager.currentMap.depthLevel.addChild(this._bossContainer);
         this._bossContainer.buttonMode = true;
         this._bossContainer.addEventListener(MouseEvent.CLICK,this.onFightBtnClickHandler);
         TaomeeManager.bindTower(600,function():void { _bossContainer.dispatchEvent(new MouseEvent(MouseEvent.CLICK)); },leaveFight);
      }
      
      private function onFightBtnClickHandler(param1:MouseEvent) : void
      {
         param1.currentTarget.buttonMode = false;
         param1.currentTarget.removeEventListener(MouseEvent.CLICK,this.onFightBtnClickHandler);
         this.tt = setTimeout(this.timeOutHandler,2000);
         EventManager.addEventListener(PetFightEvent.FIGHT_CLOSE,this.handle);
         PetFightModel.mode = PetFightModel.MULTI_MODE;
         PetFightModel.status = PetFightModel.FIGHT_WITH_BOSS;
         SocketConnection.addCmdListener(CommandID.FRESH_START_FIGHT_LEVEL,this.onSuccessHandler);
         SocketConnection.send(CommandID.FRESH_START_FIGHT_LEVEL);
      }
      
      private function timeOutHandler() : void
      {
         clearTimeout(this.tt);
      }
      
      private function onSuccessHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.FRESH_START_FIGHT_LEVEL,this.onSuccessHandler);
         var _loc2_:FreshSuccessFightRequestInfo = param1.data as FreshSuccessFightRequestInfo;
         this.nextBossId = _loc2_.getBossId;
      }
      
      private function handle(param1:PetFightEvent) : void
      {
         var data:FightOverInfo = null;
         var cls:* = undefined;
         var e:PetFightEvent = param1;
         EventManager.removeEventListener(PetFightEvent.FIGHT_CLOSE,this.handle);
         data = e.dataObj["data"];
         cls = getDefinitionByName("com.robot.petFightModule.PetFightEntry");
         if(Boolean(cls.fighterCon.isEscape))
         {
            this.b1 = true;
            TaomeeManager.prepareTower(600);
            MapManager.changeMap(600);
            return;
         }
         if(data.winnerID == MainManager.actorInfo.userID)
         {
            this.b1 = true;
            ++MainManager.actorInfo.curFreshStage;
            ++MainManager.actorInfo.maxFreshStage;
            if(MainManager.actorInfo.curFreshStage > FightLevelModel.maxLevel)
            {
               this.leaveFight();
            }
            else
            {
               FightLevelModel.setBossId = this.nextBossId;
               FightLevelModel.setCurLevel = MainManager.actorInfo.curFreshStage;
               if(MainManager.actorInfo.curFreshStage >= 10)
               {
                  if(TasksManager.getTaskStatus(89) == TasksManager.ALR_ACCEPT)
                  {
                     TasksManager.getProStatusList(89,function(param1:Array):void
                     {
                        if(Boolean(param1[0]) && !param1[1])
                        {
                           TasksManager.complete(89,1,null,true);
                        }
                     });
                  }
               }
               TaomeeManager.prepareTower(600);
               MapManager.changeMap(600);
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
         SocketConnection.removeCmdListener(CommandID.FRESH_LEAVE_FIGHT_LEVEL,this.onLeaveFightHandler);
         if(this._disposed) return;
         ToolBarController.panel.show();
         LevelManager.iconLevel.visible = true;
         if(this.b1 == false)
         {
            Alarm.show("很遗憾，刚才的战斗你没有获胜，你需要重新开始挑战，不要气馁，再接再厉。",function():void
            {
               if(!_disposed) MapManager.changeMap(101);
            },false,true);
            LevelManager.openMouseEvent();
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
         SocketConnection.addCmdListener(CommandID.FRESH_LEAVE_FIGHT_LEVEL,this.onLeaveFightHandler);
         SocketConnection.send(CommandID.FRESH_LEAVE_FIGHT_LEVEL);
      }
   }
}

