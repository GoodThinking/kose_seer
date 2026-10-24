package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task558;
   import com.robot.app.task.taskscollection.Task560;
   import com.robot.app.task.taskscollection.Task561;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import org.taomee.manager.ToolTipManager;

   public class MapProcess_459 extends BaseMapProcess
   {
      private var _vortex:MovieClip;

      override protected function init() : void
      {
         var map:MapProcess_459 = this;
         conLevel["stoneMaskBtn"].mouseEnabled = false;
         conLevel["stoneMaskBtn"].mouseChildren = false;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task558.initTask_459(map);
            if(TasksManager.getTaskStatus(560) == TasksManager.ALR_ACCEPT)
            {
               Task560.initTask_459(map);
            }
            else if(TasksManager.getTaskStatus(561) == TasksManager.ALR_ACCEPT)
            {
               Task561.initTask_459(map);
            }
            else
            {
               _vortex = conLevel["xuanMc"];
               ToolTipManager.add(_vortex,"赫鲁卡星");
               _vortex.buttonMode = true;
               _vortex.addEventListener(MouseEvent.CLICK,onVortexClick);
            }
         },this);
      }

      private function onVortexClick(event:MouseEvent) : void
      {
         MapManager.changeMap(460);
      }

      override public function destroy() : void
      {
         if(_vortex != null)
         {
            ToolTipManager.remove(_vortex);
            _vortex.removeEventListener(MouseEvent.CLICK,onVortexClick);
            _vortex = null;
         }
         Task558.destroy(this);
         Task560.destroy(this);
         Task561.destroy(this);
      }
   }
}
