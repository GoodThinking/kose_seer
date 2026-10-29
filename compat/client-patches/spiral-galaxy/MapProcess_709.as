package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_709 extends BaseMapProcess
   {
      
      public function MapProcess_709()
      {
         super();
      }
      
      // 带任务标记的安洛斯和剧情人物不再显示
      override protected function init() : void
      {
         conLevel["anluosi"].visible = false;
         conLevel["task925mc"].visible = false;
         conLevel["task925Trigger"].visible = false;
         // The two foreground effect clips are decorative, not input surfaces.
         topLevel.mouseChildren = false;
      }
   }
}
