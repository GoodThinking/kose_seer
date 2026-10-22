package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_718 extends BaseMapProcess
   {
      
      public function MapProcess_718()
      {
         super();
      }
      
      // 活动精灵不再显示
      override protected function init() : void
      {
         conLevel["activity"].visible = false;
      }
   }
}
