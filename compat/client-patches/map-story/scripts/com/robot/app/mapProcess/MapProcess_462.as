package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task561;
   import com.robot.core.manager.map.config.BaseMapProcess;

   public class MapProcess_462 extends BaseMapProcess
   {
      override protected function init() : void
      {
         var map:MapProcess_462 = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task561.initTask_462(map);
         },this);
      }

      override public function destroy() : void
      {
         Task561.destroy(this);
      }
   }
}
