package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_715 extends BaseMapProcess
   {
      
      public function MapProcess_715()
      {
         super();
      }
      
      // 剧情人物和石像不再显示；动画层的水晶保留
      override protected function init() : void
      {
         conLevel["task961mc"].visible = false;
         conLevel["task961shoot"].visible = false;
      }
   }
}
