package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task535;
   
   public class MapProcess_436 extends BaseMapProcess
   {
      
      public function MapProcess_436()
      {
         super();
      }
      
      override protected function init() : void
      {
         var map:BaseMapProcess = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task535.initMap(map,436);
         },this);
      }
      
      override public function destroy() : void
      {
         Task535.destroy(this);
      }
   }
}

