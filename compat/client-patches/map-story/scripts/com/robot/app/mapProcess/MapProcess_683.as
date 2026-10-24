package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task788;
   import com.robot.core.manager.map.config.BaseMapProcess;

   public class MapProcess_683 extends BaseMapProcess
   {
      override protected function init() : void
      {
         var map:MapProcess_683 = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task788.initTaskForMap683(map);
         },this);
      }

      override public function destroy() : void
      {
         Task788.destroy(this);
      }
   }
}
