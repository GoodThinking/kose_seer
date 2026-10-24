package com.robot.app.mapProcess
{
   import com.robot.app.task.control.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_448 extends BaseMapProcess
   {
      
      public function MapProcess_448()
      {
         super();
      }
      
      override protected function init() : void
      {
         topLevel["lightMC"].mouseEnabled = false;
         topLevel["lightMC"].mouseChildren = false;
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

