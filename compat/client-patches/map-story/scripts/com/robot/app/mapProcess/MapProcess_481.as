package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.InteractiveObject;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;

   public class MapProcess_481 extends BaseMapProcess
   {
      private var ad:MovieClip;
      private var closeButton:InteractiveObject;

      override protected function init() : void
      {
         this.ad = topLevel["adMC"] as MovieClip;
         this.closeButton = this.ad["closeBtn"] as InteractiveObject;
         this.closeButton.addEventListener(MouseEvent.CLICK, this.closeAd);
      }

      private function closeAd(event:MouseEvent) : void
      {
         this.ad.visible = false;
      }

      override public function destroy() : void
      {
         this.closeButton.removeEventListener(MouseEvent.CLICK, this.closeAd);
         this.closeButton = null;
         this.ad = null;
         super.destroy();
      }
   }
}
