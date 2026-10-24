package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task560;
   import com.robot.app.task.taskscollection.Task561;
   import com.robot.core.event.RobotEvent;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import org.taomee.manager.ToolTipManager;

   public class MapProcess_460 extends BaseMapProcess
   {
      private var _inside:MovieClip;
      private var _outside:MovieClip;
      private var _door:MovieClip;

      override protected function init() : void
      {
         _inside = conLevel["mm"];
         _outside = conLevel["mm2"];
         _door = conLevel["doorMc"];
         ToolTipManager.add(_door,"入口");
         _door.buttonMode = true;
         _inside.mouseEnabled = false;
         _inside.mouseChildren = false;
         _outside.mouseEnabled = false;
         _outside.mouseChildren = false;
         _door.addEventListener(MouseEvent.CLICK,onEnterClick);
         MainManager.actorModel.addEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkOutside);
         var map:MapProcess_460 = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task560.initTask_460(map);
            Task561.initTask_460(map,0);
         },this);
      }

      private function onEnterClick(event:MouseEvent) : void
      {
         MainManager.actorModel.walkAction(new Point(800,450));
      }

      private function onExitClick(event:MouseEvent) : void
      {
         MainManager.actorModel.walkAction(new Point(1010,350));
         Task560.OutDoor();
      }

      private function onWalkOutside(event:RobotEvent) : void
      {
         var point:Point = MainManager.actorModel.localToGlobal(new Point());
         if(!_inside.hitTestPoint(point.x,point.y)) return;
         _door.removeEventListener(MouseEvent.CLICK,onEnterClick);
         _door.addEventListener(MouseEvent.CLICK,onExitClick);
         ToolTipManager.add(_door,"出口");
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkOutside);
         MainManager.actorModel.stop();
         MainManager.actorModel.pos = new Point(MainManager.actorModel.pos.x + 350,MainManager.actorModel.pos.y - 50);
         MainManager.actorModel.addEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkInside);
         if(MainManager.actorModel.pet != null)
         {
            MainManager.actorModel.pet.pos = new Point(MainManager.actorModel.pet.pos.x + 350,MainManager.actorModel.pet.pos.y - 50);
         }
         var map:MapProcess_460 = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task560.EnterDoor();
            Task561.initTask_460(map,1);
         },this);
      }

      private function onWalkInside(event:RobotEvent) : void
      {
         var point:Point = MainManager.actorModel.localToGlobal(new Point());
         if(!_outside.hitTestPoint(point.x,point.y)) return;
         _door.removeEventListener(MouseEvent.CLICK,onExitClick);
         _door.addEventListener(MouseEvent.CLICK,onEnterClick);
         ToolTipManager.add(_door,"入口");
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkInside);
         MainManager.actorModel.stop();
         MainManager.actorModel.pos = new Point(MainManager.actorModel.pos.x - 400,MainManager.actorModel.pos.y + 50);
         MainManager.actorModel.addEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkOutside);
         if(MainManager.actorModel.pet != null)
         {
            MainManager.actorModel.pet.pos = new Point(MainManager.actorModel.pet.pos.x - 400,MainManager.actorModel.pet.pos.y + 50);
         }
      }

      override public function destroy() : void
      {
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkOutside);
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_ENTER_FRAME,onWalkInside);
         _door.removeEventListener(MouseEvent.CLICK,onEnterClick);
         _door.removeEventListener(MouseEvent.CLICK,onExitClick);
         ToolTipManager.remove(_door);
         Task560.destroy(this);
         Task561.destroy(this);
      }
   }
}
