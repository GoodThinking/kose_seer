package com.robot.app.mapProcess
{
   import com.robot.app.task.control.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_446 extends BaseMapProcess
   {
      
      public function MapProcess_446()
      {
         super();
      }
      
      override protected function init() : void
      {
      }
      
      override public function destroy() : void
      {
         ModuleManager.destroy(ClientConfig.getAppModule("HolePanel"));
      }
      
      public function gotoHoleFight() : void
      {
         TasksController.showMysteryHolePanel();
      }
   }
}

