package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.MapManager;
   import flash.display.MovieClip;
   
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
         topLevel.mouseChildren = false;
         // This scene is post-story; use the authored completed bridge and its open path.
         var bridge:MovieClip = animatorLevel["pathMc"];
         bridge.gotoAndStop(bridge.totalFrames);
         typeLevel["pathMc"].visible = false;
         MapManager.currentMap.makeMapArray();
      }
   }
}
