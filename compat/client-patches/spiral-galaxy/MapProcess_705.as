package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   
   public class MapProcess_705 extends BaseMapProcess
   {
      
      public function MapProcess_705()
      {
         super();
      }
      
      // 熔岩历险活动入口、海盗和剧情动画不再显示
      override protected function init() : void
      {
         animatorLevel["task_705"].visible = false;
         conLevel["huodong"].visible = false;
         conLevel["dao"].visible = false;
         conLevel["adventureInLava"].visible = false;
      }
   }
}
