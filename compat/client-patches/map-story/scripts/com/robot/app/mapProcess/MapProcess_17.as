package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task532;
   import com.robot.app.leiyiTrain.LeiyiTrainController;
   import com.robot.app.task.SeerInstructor.NewInstructorContoller;
   import com.robot.app.task.boss.HuLiAo;
   import com.robot.app.task.taskUtils.taskDialog.NpcTipDialog;
   import com.robot.core.aimat.AimatController;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.event.AimatEvent;
   import com.robot.core.event.RobotEvent;
   import com.robot.core.info.AimatInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.ActorModel;
   import com.robot.core.mode.PetModel;
   import com.robot.core.ui.DialogBox;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.MovieClip;
   import flash.events.Event;
   import flash.events.TimerEvent;
   import flash.utils.Timer;
   import org.taomee.utils.DisplayUtil;
   
   public class MapProcess_17 extends BaseMapProcess
   {
      
      public static var bFight:Boolean;
      
      private var npc:MovieClip;
      
      private var strArray:Array = ["快点来救我，旁边这个大怪物太可怕了","你就不能去找个工具铺条路出来","我这还被火烤着呢？！想办法把火灭了"];
      
      private var index:uint = 0;
      
      private var timer:Timer;
      
      private var stone1:MovieClip;
      
      private var stone2:MovieClip;
      
      private var bShoot1:Boolean;
      
      private var bShoot2:Boolean;
      
      private var bShootFire:Boolean;
      
      private var fire_mc:MovieClip;
      
      private var catchTimer:Timer;
      
      private var isCacthing:Boolean = false;
      private var harvestPending:Boolean = false;
      private var harvestDestroyed:Boolean = false;
      private var harvestToken:uint = 0;
      private var harvestActor:ActorModel;
      private var harvestScaleX:Number;
      private var harvestActorID:uint;
      private var treasureStoryActive:Boolean = false;
      
      public function MapProcess_17()
      {
         super();
      }
      
      override protected function init() : void
      {
         var _loc1_:DialogBox = null;
         NewInstructorContoller.chekWaste();
         if(TasksManager.taskList[302] != 3)
         {
            this.npc = depthLevel["npc"];
            this.fire_mc = depthLevel["fire_mc"];
            this.timer = new Timer(8000);
            this.timer.addEventListener(TimerEvent.TIMER,this.timerEvent);
            this.timer.start();
            _loc1_ = new DialogBox();
            _loc1_.show(this.strArray[this.index],10,-_loc1_.height - 2,this.npc);
            ++this.index;
         }
         this.stone1 = conLevel["s1_mc"];
         this.stone2 = conLevel["s2_mc"];
         AimatController.addEventListener(AimatEvent.PLAY_END,this.onAimat);
         if(TasksManager.taskList[302] == 3)
         {
            depthLevel["npc"].visible = false;
            conLevel["bossHu1"].visible = false;
            DisplayUtil.removeForParent(typeLevel["thirdMC"]);
            depthLevel["fire_mc"].visible = false;
         }
         if(HuLiAo.changeStatus)
         {
            (depthLevel["fire_mc"] as MovieClip).stop();
            depthLevel["fire_mc"].visible = false;
            DisplayUtil.removeForParent(typeLevel["thirdMC"]);
            MapManager.currentMap.makeMapArray();
            this.bShootFire = true;
            HuLiAo.changeStatus = false;
         }
         if(HuLiAo.bFirstWin)
         {
            NpcTipDialog.show("感谢你来营救我，但你别得意，我们海盗和赛尔的事情没完，我们一定会战胜你的。后会有期！",this.getAward,NpcTipDialog.BAD_GUARD);
            HuLiAo.bFirstWin = false;
         }
         if(HuLiAo.bStart)
         {
            HuLiAo.removeListener();
            HuLiAo.bStart = false;
         }
         this.catchTimer = new Timer(10 * 1000,1);
         this.catchTimer.addEventListener(TimerEvent.TIMER,this.onCatchTimer);
         var map:BaseMapProcess = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task532.initMap(map);
         },this);
      }
      
      public function clearWaste() : void
      {
         NewInstructorContoller.setWaste();
      }
      
      override public function destroy() : void
      {
         this.harvestDestroyed = true;
         this.cancelHarvest();
         Task532.destroy(this);
         AimatController.removeEventListener(AimatEvent.PLAY_END,this.onAimat);
         if(Boolean(this.timer))
         {
            this.timer.stop();
            this.timer.removeEventListener(TimerEvent.TIMER,this.timerEvent);
            this.timer = null;
         }
         if(Boolean(this.fire_mc))
         {
            this.fire_mc.removeEventListener(Event.ENTER_FRAME,this.onEnterFire);
            this.fire_mc = null;
         }
         if(Boolean(this.stone1))
         {
            this.stone1.removeEventListener(Event.ENTER_FRAME,this.onEnterStone1);
            this.stone1 = null;
         }
         if(Boolean(this.stone2))
         {
            this.stone2.removeEventListener(Event.ENTER_FRAME,this.onEnterStone2);
            this.stone2 = null;
         }
         this.npc = null;
         this.catchTimer.stop();
         this.catchTimer.removeEventListener(TimerEvent.TIMER,this.onCatchTimer);
         this.catchTimer = null;
      }

      public function setTreasureStoryActive(active:Boolean) : void
      {
         this.treasureStoryActive = active;
         if(this.timer != null)
         {
            if(active) this.timer.stop();
            else this.timer.start();
         }
      }
      
      private function getAward() : void
      {
      }
      
      private function timerEvent(param1:TimerEvent) : void
      {
         var _loc2_:DialogBox = new DialogBox();
         _loc2_.show(this.strArray[this.index],10,-_loc2_.height - 2,this.npc);
         ++this.index;
         if(this.index > this.strArray.length - 1)
         {
            this.index = 0;
         }
      }
      
      private function onAimat(param1:AimatEvent) : void
      {
         if(this.treasureStoryActive) return;
         var _loc2_:AimatInfo = param1.info;
         if(_loc2_.userID != MainManager.actorID)
         {
            return;
         }
         if(_loc2_.id != 10002)
         {
            return;
         }
         if(this.bShoot1 && this.bShoot2 && this.bShootFire)
         {
            return;
         }
         if(this.stone1.hitTestPoint(_loc2_.endPos.x,_loc2_.endPos.y) && !this.bShoot1)
         {
            this.stone1.play();
            this.stone1.addEventListener(Event.ENTER_FRAME,this.onEnterStone1);
         }
         if(this.stone2.hitTestPoint(_loc2_.endPos.x,_loc2_.endPos.y) && !this.bShoot2)
         {
            this.stone2.play();
            this.stone2.addEventListener(Event.ENTER_FRAME,this.onEnterStone2);
         }
         if(this.fire_mc == null)
         {
            return;
         }
         if(this.fire_mc.hitTestPoint(_loc2_.endPos.x,_loc2_.endPos.y) && !this.bShootFire)
         {
            this.fire_mc.gotoAndStop(2);
            this.fire_mc.addEventListener(Event.ENTER_FRAME,this.onEnterFire);
         }
      }
      
      public function changeBoss() : void
      {
         if(Task532.showVolcanoDialogue()) return;
         if(TasksManager.getTaskStatus(121) == TasksManager.ALR_ACCEPT)
         {
            LeiyiTrainController.initTrain_0();
         }
         else if(TasksManager.taskList[302] == 3)
         {
            HuLiAo.startFight();
         }
         else
         {
            NpcTipDialog.show("赛尔机器人" + MainManager.actorInfo.nick + "，你真是好心人前来营救我！快点想办法击败身边这个精灵，我可打不过它，它要再扑过来，咱们都完蛋。",this.startFight,NpcTipDialog.BAD_GUARD);
         }
      }
      
      private function startFight() : void
      {
         HuLiAo.startFight();
      }
      
      private function onEnterFire(param1:Event) : void
      {
         if(this.fire_mc.currentFrame == this.fire_mc.totalFrames)
         {
            this.fire_mc.removeEventListener(Event.ENTER_FRAME,this.onEnterFire);
            this.fire_mc.stop();
            DisplayUtil.removeForParent(typeLevel["thirdMC"]);
            MapManager.currentMap.makeMapArray();
            this.bShootFire = true;
            this.changeWord();
         }
      }
      
      private function changeWord() : void
      {
         if(this.bShoot1 && this.bShoot2 && this.bShootFire)
         {
            this.strArray = ["快点来救我，旁边这个大怪物太可怕了"];
         }
         if(this.bShoot1 && this.bShoot2)
         {
            this.strArray = ["快点来救我，旁边这个大怪物太可怕了","我这还被火烤着呢？！想办法把火灭了"];
         }
         if(this.bShootFire)
         {
            this.strArray = ["快点来救我，旁边这个大怪物太可怕了","你就不能去找个工具铺条路出来"];
         }
         this.index = 0;
      }
      
      private function onEnterStone2(param1:Event) : void
      {
         if(this.stone2.currentFrame == this.stone2.totalFrames)
         {
            this.stone2.removeEventListener(Event.ENTER_FRAME,this.onEnterStone2);
            this.stone2.stop();
            DisplayUtil.removeForParent(typeLevel["secondMC"]);
            MapManager.currentMap.makeMapArray();
            this.bShoot2 = true;
            this.changeWord();
         }
      }
      
      private function onEnterStone1(param1:Event) : void
      {
         if(this.stone1.currentFrame == this.stone1.totalFrames)
         {
            this.stone1.removeEventListener(Event.ENTER_FRAME,this.onEnterStone1);
            this.stone1.stop();
            DisplayUtil.removeForParent(typeLevel["firstMC"]);
            MapManager.currentMap.makeMapArray();
            this.bShoot1 = true;
            this.changeWord();
         }
      }
      
      public function clickBrume() : void
      {
         var mc:MovieClip = null;
         mc = null;
         mc = conLevel["brumeMC"];
         var mode:ActorModel = MainManager.actorModel;
         var petMode:PetModel = mode.pet;
         if(!petMode || PetXMLInfo.getType(petMode.info.petID) != "2")
         {
            Alarm.show("需要让水系精灵跟随，才能驱散雾气。");
            return;
         }
         mc.mouseEnabled = false;
         mc.mouseChildren = false;
         var innerMc:MovieClip = mc["mc"] as MovieClip;
         if(innerMc != null)
         {
            innerMc.gotoAndPlay(3);
            innerMc.addFrameScript(62,function():void
            {
               DisplayUtil.removeForParent(mc);
            });
         }
         else
         {
            DisplayUtil.removeForParent(mc);
         }
      }
      
      public function catchStone() : void
      {
         if(this.harvestDestroyed || this.harvestPending || this.isCacthing) return;
         if(TasksManager.getTaskStatus(7) == TasksManager.COMPLETE)
         {
            Alarm.show("你已经收集过炎晶了");
            return;
         }
         if(TasksManager.getTaskStatus(7) != TasksManager.ALR_ACCEPT)
         {
            Alarm.show("请先领取赛尔号防寒服任务，再来收集炎晶。");
            return;
         }
         if(conLevel["brumeMC"] != null && conLevel["brumeMC"].parent != null && conLevel["brumeMC"].mouseEnabled)
         {
            Alarm.show("这里还有雾气，先让水系精灵跟随并驱散雾气吧。");
            return;
         }
         if(MainManager.actorInfo.clothIDs.indexOf(100014) == -1)
         {
            Alarm.show("矿石挖掘需要专业工具挖矿钻头，若你已从机械室找到它，快把它装备上吧！");
            return;
         }
         this.harvestPending = true;
         this.harvestActor = MainManager.actorModel;
         this.harvestActorID = MainManager.actorID;
         this.harvestActor.addEventListener(RobotEvent.WALK_START,this.onWalkStart);
         var token:uint = ++this.harvestToken;
         TasksManager.getProStatus(7,1,function(done:Boolean):void
         {
            if(harvestDestroyed || token != harvestToken || MainManager.actorID != harvestActorID) return;
            if(TasksManager.getTaskStatus(7) != TasksManager.ALR_ACCEPT)
            {
               cancelHarvest();
               return;
            }
            if(done)
            {
               cancelHarvest();
               Alarm.show("你已经收集过炎晶了");
               return;
            }
            if(MainManager.actorInfo.clothIDs.indexOf(100014) == -1)
            {
               cancelHarvest();
               Alarm.show("矿石挖掘需要专业工具挖矿钻头，若你已从机械室找到它，快把它装备上吧！");
               return;
            }
            harvestPending = false;
            isCacthing = true;
            harvestScaleX = harvestActor.skeleton.getBodyMC().scaleX;
            harvestActor.specialAction(100014);
            if(harvestActor.parent != null) harvestActor.parent.addChild(harvestActor);
            harvestActor.skeleton.getBodyMC().scaleX = -1;
            catchTimer.reset();
            catchTimer.start();
         });
      }

      private function cancelHarvest() : void
      {
         ++this.harvestToken;
         if(this.catchTimer != null) this.catchTimer.stop();
         if(this.harvestActor != null)
         {
            this.harvestActor.removeEventListener(RobotEvent.WALK_START,this.onWalkStart);
            if(this.isCacthing)
            {
               this.harvestActor.stopSpecialAct();
               this.harvestActor.skeleton.getBodyMC().scaleX = this.harvestScaleX;
            }
         }
         this.harvestActor = null;
         this.isCacthing = false;
         this.harvestPending = false;
      }

      private function onCatchTimer(param1:TimerEvent) : void
      {
         if(!this.isCacthing || this.harvestDestroyed) return;
         if(MainManager.actorID != this.harvestActorID || TasksManager.getTaskStatus(7) != TasksManager.ALR_ACCEPT ||
            MainManager.actorInfo.clothIDs.indexOf(100014) == -1)
         {
            this.cancelHarvest();
            return;
         }
         this.harvestActor.stopSpecialAct();
         this.harvestActor.skeleton.getBodyMC().scaleX = this.harvestScaleX;
         this.isCacthing = false;
         this.harvestPending = true;
         var token:uint = this.harvestToken;
         TasksManager.complete(7,1,function(success:Boolean):void
         {
            if(harvestDestroyed || token != harvestToken || MainManager.actorID != harvestActorID) return;
            cancelHarvest();
            if(success) Alarm.show("恭喜你找到了<font color='#ff0000'>炎晶</font>");
            else Alarm.show("这次采集似乎失败了，再尝试一次吧！");
         });
      }

      private function onWalkStart(param1:RobotEvent) : void
      {
         if(this.isCacthing || this.harvestPending)
         {
            this.cancelHarvest();
            Alarm.show("随便走动是无法收集炎晶的哦！");
         }
      }
   }
}

