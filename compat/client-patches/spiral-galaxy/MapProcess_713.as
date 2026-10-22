package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_713 extends BaseMapProcess
   {
      
      public function MapProcess_713()
      {
         super();
      }
      
      // 烟水迷阵活动的宝箱、精灵和入口不再显示
      override protected function init() : void
      {
         conLevel["box"].visible = false;
         conLevel["boss"].visible = false;
         conLevel["activity"].visible = false;
         conLevel["adBtn"].visible = false;
      }
   }
}
