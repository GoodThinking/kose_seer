package com.robot.app.mapProcess
{
   import com.robot.app.task.control.*;
   import com.robot.app.task.taskscollection.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class MapProcess_484 extends BaseMapProcess
   {
      
      private var _task616Inited:Boolean = false;
      
      private var _kaxiusiTasksInited:Boolean = false;
      
      private var _kaxiusiNpc:MovieClip;
      
      private var _kaxiusiBody:MovieClip;
      
      private var _kaxiusiIntro:MovieClip;
      
      public function MapProcess_484()
      {
         super();
      }
      
      private static function npcLuLuClickHandler(param1:MouseEvent) : void
      {
         var _loc2_:Point = new Point(615,410);
         if(Point.distance(MainManager.actorModel.pos,_loc2_) < 10)
         {
            onLuluWalkEnd(null);
            return;
         }
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_END,onLuluWalkEnd);
         MainManager.actorModel.addEventListener(RobotEvent.WALK_END,onLuluWalkEnd);
         MainManager.actorModel.walkAction(_loc2_);
      }
      
      private static function onLuluWalkEnd(param1:RobotEvent) : void
      {
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_END,onLuluWalkEnd);
         NpcDialog.show(NPC.LULU,["我要泡泡，我要抱抱，不要崇拜我，妹妹我只是个传说！"],["璐璐长的真可爱。"]);
      }
      
      private function onDifuteClick(param1:MouseEvent) : void
      {
         ModuleManager.showModule(ClientConfig.getAppModule("KaXiuSiTrainPanel"));
      }
      
      override protected function init() : void
      {
         var _loc1_:MovieClip = null;
         this.topLevel.mouseChildren = this.topLevel.mouseEnabled = false;
         if(Boolean(conLevel["luluMC"]))
         {
            conLevel["luluMC"].mouseChildren = false;
            conLevel["luluMC"].buttonMode = true;
            conLevel["luluMC"].addEventListener(MouseEvent.CLICK,npcLuLuClickHandler);
         }
         if(Boolean(conLevel["difute"]))
         {
            conLevel["difute"].visible = false;
            conLevel["difute"].mouseChildren = false;
            conLevel["difute"].mouseEnabled = false;
            conLevel["difute"].buttonMode = false;
         }
         _loc1_ = conLevel["kxsPP"] as MovieClip;
         if(Boolean(_loc1_))
         {
            _loc1_.buttonMode = false;
         }
         this._task616Inited = true;
         Task616.prepareMap484Game(this);
         if(Boolean(conLevel["npc_619"]))
         {
            conLevel["npc_619"].visible = false;
         }
         if(Boolean(conLevel["arrow_619"]))
         {
            conLevel["arrow_619"].visible = false;
         }
      }
      
      public function initKaxiusiTasksAfterStatus() : void
      {
         if(this._kaxiusiTasksInited)
         {
            return;
         }
         this._kaxiusiTasksInited = true;
         this.loadKaxiusiNpc();
         if(TasksManager.getTaskStatus(616) != TasksManager.COMPLETE)
         {
            Task616.initTask_484(this);
         }
         else
         {
            Task616.prepareMap484Game(this);
         }
         Task619.initTask_484(this);
         Task624.initTask_484(this);
         Task637.initTask_484(this);
      }
      
      private function loadKaxiusiNpc() : void
      {
         if(TasksManager.getTaskStatus(TaskController_658.TASK_ID) == TasksManager.COMPLETE)
         {
            ResourceManager.getResource(ClientConfig.getFullMovie("kaxiusi"),this.onLoadKaxiusiNpc,"kaxiusi");
         }
      }
      
      private function onLoadKaxiusiNpc(param1:DisplayObject) : void
      {
         this._kaxiusiNpc = param1 as MovieClip;
         if(!this._kaxiusiNpc)
         {
            return;
         }
         this._kaxiusiNpc.x = 550;
         this._kaxiusiNpc.y = 200;
         this._kaxiusiNpc.mouseChildren = false;
         this.depthLevel.addChild(this._kaxiusiNpc);
         this.playKaxiusiAnim();
      }
      
      private function playKaxiusiAnim() : void
      {
         this._kaxiusiBody = this._kaxiusiNpc;
         if(!this._kaxiusiBody)
         {
            return;
         }
         this._kaxiusiBody.gotoAndStop(1);
         this._kaxiusiIntro = this._kaxiusiBody.getChildByName("mc") as MovieClip;
         if(!this._kaxiusiIntro)
         {
            this.gotoKaxiusiLoop();
            return;
         }
         this._kaxiusiIntro.removeEventListener(Event.ENTER_FRAME,this.onKaxiusiIntroFrame);
         this._kaxiusiIntro.gotoAndPlay(1);
         this._kaxiusiIntro.addEventListener(Event.ENTER_FRAME,this.onKaxiusiIntroFrame);
      }
      
      private function onKaxiusiIntroFrame(param1:Event) : void
      {
         if(Boolean(this._kaxiusiIntro) && this._kaxiusiIntro.currentFrame >= this._kaxiusiIntro.totalFrames)
         {
            this._kaxiusiIntro.removeEventListener(Event.ENTER_FRAME,this.onKaxiusiIntroFrame);
            this.gotoKaxiusiLoop();
         }
      }
      
      private function gotoKaxiusiLoop() : void
      {
         if(!this._kaxiusiBody)
         {
            return;
         }
         this._kaxiusiBody.gotoAndStop(2);
         if(this._kaxiusiBody.numChildren > 0 && this._kaxiusiBody.getChildAt(0) is MovieClip)
         {
            MovieClip(this._kaxiusiBody.getChildAt(0)).play();
         }
      }
      
      private function onOpenKaXiuSiPanel(param1:MouseEvent) : void
      {
         ModuleManager.showModule(ClientConfig.getAppModule("SPTKaXiuSiPanel"),"正在打开SPT卡修斯面板");
      }
      
      override public function destroy() : void
      {
         var _loc1_:MovieClip = conLevel["kxsPP"] as MovieClip;
         if(this._kaxiusiTasksInited)
         {
            Task637.destroy();
            Task624.destroy();
            Task619.destroy();
         }
         if(this._task616Inited)
         {
            Task616.destroy();
         }
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_END,onLuluWalkEnd);
         if(Boolean(conLevel["luluMC"]))
         {
            conLevel["luluMC"].removeEventListener(MouseEvent.CLICK,npcLuLuClickHandler);
         }
         if(Boolean(_loc1_))
         {
            _loc1_.removeEventListener(MouseEvent.CLICK,this.onOpenKaXiuSiPanel);
         }
         if(Boolean(this._kaxiusiBody))
         {
            this._kaxiusiBody = null;
         }
         if(Boolean(this._kaxiusiIntro))
         {
            this._kaxiusiIntro.removeEventListener(Event.ENTER_FRAME,this.onKaxiusiIntroFrame);
            this._kaxiusiIntro = null;
         }
         DisplayUtil.removeForParent(this._kaxiusiNpc);
         this._kaxiusiNpc = null;
      }
   }
}

