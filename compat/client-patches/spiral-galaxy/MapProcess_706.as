package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_706 extends BaseMapProcess
   {
      
      public function MapProcess_706()
      {
         super();
      }
      
      // 剧情人物不再显示
      override protected function init() : void
      {
         conLevel["task902mc"].visible = false;
         conLevel["task913mc"].visible = false;
      }
   }
}
