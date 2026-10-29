package com.robot.app.mapProcess
{
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import org.taomee.manager.ToolTipManager;
   
   public class MapProcess_343 extends BaseMapProcess
   {
      
      public function MapProcess_343()
      {
         super();
      }
      
      override protected function init() : void
      {
         ToolTipManager.add(conLevel["door_0"],"离开");
      }
      
      override public function destroy() : void
      {
      }
      
      public function leaveFight() : void
      {
         MapManager.changeMap(336);
      }
   }
}

