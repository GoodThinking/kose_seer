package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_38 extends BaseMapProcess
   {
      
      public function MapProcess_38()
      {
         super();
      }
      
      // 剧情动画不再显示
      override protected function init() : void
      {
         depthLevel["task975MC"].visible = false;
      }
   }
}
