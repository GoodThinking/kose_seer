package com.robot.app.mapProcess
{
   import com.robot.app.mapProcess.control.*;
   import com.robot.app.spt.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.ui.*;
   import flash.events.*;
   import flash.geom.*;
   import flash.utils.*;
   
   public class MapProcess_495 extends BaseMapProcess
   {
      
      private var ogre:Array;
      
      private var timer:Timer;
      
      private var dialog:Array = ["只要你有伊迦或者迦勒，就能修炼新一代忍者精灵！","找到秘器，赶紧修炼传说中的忍者精灵吧！","封印即将打开！战斗马上开启！"];
      
      public function MapProcess_495()
      {
         super();
      }
      
      override protected function init() : void
      {
         topLevel.mouseEnabled = false;
         topLevel.mouseChildren = false;
         var _loc1_:Boolean = Boolean(BufferRecordManager.getState(MainManager.actorInfo,153));
         if(_loc1_)
         {
            this.createPet();
            this.showDailog();
         }
         NinjaSpNoNoController_2.init_495(this,_loc1_);
      }
      
      private function createPet() : void
      {
         var _loc1_:OgreModel = null;
         this.ogre = [];
         var _loc2_:Array = [new Point(358,364),new Point(594,364)];
         var _loc3_:int = 0;
         while(_loc3_ < 2)
         {
            _loc1_ = new OgreModel(_loc3_);
            _loc1_.show(673,_loc2_[_loc3_]);
            _loc1_.addEventListener(MouseEvent.CLICK,this.onFightHandler);
            this.ogre.push(_loc1_);
            _loc3_++;
         }
      }
      
      private function onFightHandler(param1:MouseEvent) : void
      {
         FightBossController.fightBoss("伊迦");
      }
      
      private function showDailog() : void
      {
         this.timer = new Timer(1000);
         this.timer.addEventListener(TimerEvent.TIMER,this.onTimer);
         this.timer.start();
      }
      
      private function onTimer(param1:TimerEvent) : void
      {
         var _loc2_:DialogBox = null;
         if(this.timer.currentCount % 13 == 1)
         {
            _loc2_ = new DialogBox(5000);
            _loc2_.show(this.dialog[Math.floor(Math.random() * 3)],0,-74,depthLevel["npc"]);
         }
      }
      
      override public function destroy() : void
      {
         var _loc1_:OgreModel = null;
         for each(_loc1_ in this.ogre)
         {
            _loc1_.removeEventListener(MouseEvent.CLICK,this.onFightHandler);
         }
         if(Boolean(this.timer))
         {
            this.timer.reset();
            this.timer.removeEventListener(TimerEvent.TIMER,this.onTimer);
         }
         NinjaSpNoNoController_2.destroy();
      }
   }
}

