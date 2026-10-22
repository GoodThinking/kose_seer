package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_712 extends BaseMapProcess
   {
      
      public function MapProcess_712()
      {
         super();
      }
      
      // 剧情人物不再显示；动画层的水晶保留
      override protected function init() : void
      {
         conLevel["task947mc"].visible = false;
      }
   }
}
