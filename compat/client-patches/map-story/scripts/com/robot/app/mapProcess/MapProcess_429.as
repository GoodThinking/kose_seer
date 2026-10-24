package com.robot.app.mapProcess
{
   import com.robot.app.energy.utils.EnergyController;
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task530;
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_429 extends BaseMapProcess
   {
      
      public function MapProcess_429()
      {
         super();
         depthLevel["weibin"].visible = false;
         depthLevel["change"].visible = false;
         conLevel["petHealMc"].visible = false;
         conLevel["arrowmc"].visible = false;
         conLevel["arrow"].visible = false;
         conLevel["pet"].visible = false;
      }
      
      override protected function init() : void
      {
         var map:BaseMapProcess = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task530.initTask_2(map);
         },this);
      }
      
      public function exploitGas() : void
      {
         EnergyController.exploit(33);
      }
      
      override public function destroy() : void
      {
         Task530.destory();
      }
   }
}

