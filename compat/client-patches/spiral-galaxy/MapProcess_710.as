package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_710 extends BaseMapProcess
   {
      
      public function MapProcess_710()
      {
         super();
      }
      
      // 剧情人物和触发区不再显示
      override protected function init() : void
      {
         conLevel["task945mc"].visible = false;
         conLevel["task945Trigger_1"].visible = false;
         conLevel["task945Trigger_2"].visible = false;
      }
   }
}
