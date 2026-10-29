package com.robot.app.mapProcess
{
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.DisplayObjectContainer;
   
   public class MapProcess_704 extends BaseMapProcess
   {
      
      public function MapProcess_704()
      {
         super();
      }
      
      // 剧情结束后的样子：拉妮、拉琪已回飞船，剧情动画和触发区不再显示
      override protected function init() : void
      {
         animatorLevel["task899mc"].visible = false;
         conLevel["trigger1"].visible = false;
         conLevel["trigger2"].visible = false;
         conLevel["NPClani"].visible = false;
         conLevel["NPClaqi"].visible = false;
         // The foreground lighting is decoration, not a scene input surface.
         var effect:DisplayObjectContainer = MapManager.currentMap.root["effect"];
         effect.mouseEnabled = false;
         effect.mouseChildren = false;
      }
   }
}
