package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TaskController_33;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.MovieClip;
   import flash.geom.Rectangle;

   public class MapProcess_50 extends BaseMapProcess
   {
      private var _rescueHit:MovieClip;
      private var _rescueHitX:Number;
      private var _rescueHitY:Number;

      override protected function init() : void
      {
         conLevel["ailixunMC"].gotoAndStop(1);
         conLevel["zogMC"].gotoAndStop(1);
         conLevel["rescueMC"].gotoAndStop(1);
         conLevel["countMC"].gotoAndStop(1);
         conLevel["countMC"].visible = false;
         conLevel["rescueBtn"].visible = false;
         _rescueHit = conLevel["rescueBtnHitMc"];
         _rescueHitX = _rescueHit.x;
         _rescueHitY = _rescueHit.y;
         // The original marker's upper-left origin is blocked by the matching map's road mask.
         // Approach its own center instead; do not change the road mask or the visible switch.
         var approach:Rectangle = _rescueHit.getBounds(conLevel);
         _rescueHit.x = approach.x + approach.width / 2;
         _rescueHit.y = approach.y + approach.height / 2;
      }

      public function onRescueBtnClick() : void
      {
         TaskController_33.onRescueBtnClick(this);
      }

      override public function destroy() : void
      {
         TaskController_33.destroy(this);
         if(_rescueHit)
         {
            _rescueHit.x = _rescueHitX;
            _rescueHit.y = _rescueHitY;
            _rescueHit = null;
         }
      }
   }
}
