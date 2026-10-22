package com.robot.app.mapProcess
{
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;

   /**
    * 炫彩山：点击最高层的圣殿进入山神圣殿（4399 攻略：来到炫彩山神秘洞窟，点击最高层的圣殿进入）。
    * 圣殿入口在 mainMC 里，不是控制层的直接子对象，地图表的门组件接不上，这里单独处理。
    */
   public class MapProcess_449 extends BaseMapProcess
   {
      private var temple:MovieClip;

      public function MapProcess_449()
      {
         super();
      }

      override protected function init() : void
      {
         this.temple = conLevel["mainMC"]["difuteHit"] as MovieClip;
         this.temple.buttonMode = true;
         this.temple.addEventListener(MouseEvent.CLICK,this.onTemple);
      }

      private function onTemple(e:MouseEvent) : void
      {
         MapManager.changeMap(450);
      }

      override public function destroy() : void
      {
         this.temple.removeEventListener(MouseEvent.CLICK,this.onTemple);
         this.temple = null;
      }
   }
}
