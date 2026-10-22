package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_708 extends BaseMapProcess
   {
      
      public function MapProcess_708()
      {
         super();
      }
      
      // 剧情人物和森普特超进化活动入口不再显示
      override protected function init() : void
      {
         conLevel["task913mc"].visible = false;
         conLevel["mcTask1721"].visible = false;
         btnLevel["quipmentMC1721"].visible = false;
         btnLevel["btnTask1721"].visible = false;
      }
   }
}
