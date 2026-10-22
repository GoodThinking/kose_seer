package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_926 extends BaseMapProcess
   {
      
      public function MapProcess_926()
      {
         super();
      }
      
      // 剧情触发区不再显示
      override protected function init() : void
      {
         conLevel["task934Trigger_1"].visible = false;
      }
   }
}
