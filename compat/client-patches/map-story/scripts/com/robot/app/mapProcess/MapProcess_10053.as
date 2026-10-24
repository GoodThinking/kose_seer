package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task796;
   import com.robot.app.task.taskscollection.Task801;
   import com.robot.core.manager.map.config.BaseMapProcess;

   public class MapProcess_10053 extends BaseMapProcess
   {
      override protected function init() : void
      {
         animatorLevel["task_801_1"].visible = false;
         animatorLevel["task_796_3"].visible = false;
         var map:MapProcess_10053 = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task796.initTaskForMap10053(map);
            Task801.initTaskForMap10053(map);
         },this);
      }

      override public function destroy() : void
      {
         Task796.destroy(this);
         Task801.destroy(this);
      }
   }
}
