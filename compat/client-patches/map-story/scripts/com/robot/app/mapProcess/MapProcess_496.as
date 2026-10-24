package com.robot.app.mapProcess
{
   import com.robot.app.task.taskscollection.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import com.robot.core.utils.*;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.*;
   import org.taomee.debug.*;
   import org.taomee.manager.*;
   
   public class MapProcess_496 extends BaseMapProcess
   {
      
      private var leftTramMC:MovieClip;
      
      private var rightTramMC:MovieClip;
      
      private var midMC:MovieClip;
      
      private var leftBTN:SimpleButton;
      
      private var rightBTN:SimpleButton;
      
      private var upBTN:SimpleButton;
      
      private var downBTN:SimpleButton;
      
      private var walkFunction:Function;
      
      public function MapProcess_496()
      {
         super();
      }
      
      override protected function init() : void
      {
         this.initForAllTask();
      }
      
      override public function destroy() : void
      {
         this.destroyForAllTask();
      }
      
      private function initForAllTask() : void
      {
         ToolTipManager.add(this.conLevel["lastPointHit"],"麦兹星球");
         this.conLevel["hairMc"].visible = false;
         this.leftTramMC = this.conLevel["tramMC"]["leftMC"];
         this.rightTramMC = this.conLevel["tramMC"]["rightMC"];
         this.midMC = this.conLevel["tramMC"]["midMC"];
         this.leftBTN = this.conLevel["tramMC"]["leftBTN"];
         this.rightBTN = this.conLevel["tramMC"]["rightBTN"];
         this.upBTN = this.conLevel["tramMC"]["upBTN"];
         this.downBTN = this.conLevel["tramMC"]["downBTN"];
         this.leftTramMC.data = {
            "p1":new Point(200,432),
            "p2":new Point(182,215)
         };
         this.rightTramMC.data = {
            "p1":new Point(295,433),
            "p2":new Point(470,480)
         };
         this.upBTN.addEventListener(MouseEvent.CLICK,this.clickHandler);
         this.downBTN.addEventListener(MouseEvent.CLICK,this.clickHandler);
         this.leftBTN.addEventListener(MouseEvent.CLICK,this.clickHandler);
         this.rightBTN.addEventListener(MouseEvent.CLICK,this.clickHandler);
         this.leftTramMC.addEventListener(Event.ENTER_FRAME,this.tramFrameHandler);
         this.rightTramMC.addEventListener(Event.ENTER_FRAME,this.tramFrameHandler);
      }
      
      private function destroyForAllTask() : void
      {
         if(this.walkFunction != null)
         {
            MainManager.actorModel.removeEventListener(RobotEvent.WALK_END,this.walkFunction);
         }
         this.upBTN.removeEventListener(MouseEvent.CLICK,this.clickHandler);
         this.downBTN.removeEventListener(MouseEvent.CLICK,this.clickHandler);
         this.leftBTN.removeEventListener(MouseEvent.CLICK,this.clickHandler);
         this.rightBTN.removeEventListener(MouseEvent.CLICK,this.clickHandler);
         this.leftTramMC.removeEventListener(Event.ENTER_FRAME,this.tramFrameHandler);
         this.rightTramMC.removeEventListener(Event.ENTER_FRAME,this.tramFrameHandler);
         ToolTipManager.remove(this.conLevel["lastPointHit"]);
      }
      
      private function checkDistance(param1:Point) : Boolean
      {
         var _loc2_:Boolean = Point.distance(MainManager.actorModel.pos,param1) < 100 ? true : false;
         if(_loc2_)
         {
            this.walkFunction();
         }
         else
         {
            MainManager.actorModel.walkAction(param1);
            MainManager.actorModel.addEventListener(RobotEvent.WALK_END,this.walkFunction);
         }
         return _loc2_;
      }
      
      private function clickHandler(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         if(this.walkFunction != null)
         {
            MainManager.actorModel.removeEventListener(RobotEvent.WALK_END,this.walkFunction);
         }
         switch(evt.currentTarget.name)
         {
            case "leftBTN":
               if(this.leftTramMC.currentFrame == 1)
               {
                  this.walkFunction = function():void
                  {
                     MainManager.actorModel.removeEventListener(RobotEvent.WALK_END,arguments.callee);
                     leftTramMC.gotoAndPlay("up");
                     midMC.gotoAndPlay("step1");
                     DebugTrace.show(1111);
                  };
                  this.checkDistance(this.leftTramMC.data["p1"]);
                  return;
               }
               break;
            case "rightBTN":
               if(this.leftTramMC.currentFrame == 30)
               {
                  this.walkFunction = function():void
                  {
                     MainManager.actorModel.removeEventListener(RobotEvent.WALK_END,arguments.callee);
                     leftTramMC.gotoAndPlay("down");
                     midMC.gotoAndPlay("step2");
                     DebugTrace.show(2222);
                  };
                  this.checkDistance(this.leftTramMC.data["p2"]);
                  return;
               }
               break;
            case "upBTN":
               if(this.rightTramMC.currentFrame == 30)
               {
                  this.walkFunction = function():void
                  {
                     MainManager.actorModel.removeEventListener(RobotEvent.WALK_END,arguments.callee);
                     rightTramMC.gotoAndPlay("up");
                     midMC.gotoAndPlay("step2");
                     DebugTrace.show(3333);
                  };
                  this.checkDistance(this.rightTramMC.data["p2"]);
                  return;
               }
               break;
            case "downBTN":
               if(this.rightTramMC.currentFrame == 1)
               {
                  this.walkFunction = function():void
                  {
                     MainManager.actorModel.removeEventListener(RobotEvent.WALK_END,arguments.callee);
                     rightTramMC.gotoAndPlay("down");
                     midMC.gotoAndPlay("step1");
                     DebugTrace.show(4444);
                  };
                  this.checkDistance(this.rightTramMC.data["p1"]);
                  return;
               }
         }
         NpcDialog.show(NPC.SEER,["怎么动不了？难道我转错方向了？"],["（仔细看看转动的方向）"]);
      }
      
      private function tramFrameHandler(param1:Event) : void
      {
         var _loc2_:MovieClip = param1.currentTarget as MovieClip;
         if(_loc2_.currentFrame == 1)
         {
            return;
         }
         if(_loc2_.currentFrame == 2 && Boolean(MainManager.actorModel.visible))
         {
            MainManager.actorModel.pos = _loc2_.data["p1"];
            MainManager.actorModel.visible = false;
            if(_loc2_.name == "leftMC")
            {
               this.upBTN.alpha = this.downBTN.alpha = 0.5;
               this.upBTN.mouseEnabled = this.downBTN.mouseEnabled = false;
            }
            else
            {
               this.leftBTN.alpha = this.rightBTN.alpha = 0.5;
               this.leftBTN.mouseEnabled = this.rightBTN.mouseEnabled = false;
            }
         }
         else if(_loc2_.currentFrame == 30 && !MainManager.actorModel.visible)
         {
            MainManager.actorModel.pos = _loc2_.data["p2"];
            MainManager.actorModel.visible = true;
            MainManager.actorModel.direction = _loc2_.name == "leftMC" ? Direction.UP : Direction.RIGHT_DOWN;
            _loc2_.stop();
         }
         else if(_loc2_.currentFrame == 31 && Boolean(MainManager.actorModel.visible))
         {
            MainManager.actorModel.pos = _loc2_.data["p2"];
            MainManager.actorModel.visible = false;
         }
         else if(_loc2_.currentFrame == 60 && !MainManager.actorModel.visible)
         {
            MainManager.actorModel.pos = _loc2_.data["p1"];
            MainManager.actorModel.visible = true;
            MainManager.actorModel.direction = _loc2_.name == "leftMC" ? Direction.DOWN : Direction.LEFT_DOWN;
            if(_loc2_.name == "leftMC")
            {
               this.upBTN.alpha = this.downBTN.alpha = 1;
               this.upBTN.mouseEnabled = this.downBTN.mouseEnabled = true;
            }
            else
            {
               this.leftBTN.alpha = this.rightBTN.alpha = 1;
               this.leftBTN.mouseEnabled = this.rightBTN.mouseEnabled = true;
            }
            _loc2_.gotoAndStop(1);
         }
      }
      
      public function key1ClickHandler() : void
      {
         Task626.key1ClickHandler();
      }
      
      public function key2ClickHandler() : void
      {
         Task626.key2ClickHandler();
      }
      
      public function gotoLastMap() : void
      {
         MapManager.changeMap(494);
      }
   }
}

