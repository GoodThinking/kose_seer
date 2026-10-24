package com.robot.app.mapProcess
{
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.ActorModel;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import gs.TweenLite;

   public class MapProcess_9515 extends BaseMapProcess
   {
      private var _ship:MovieClip;
      private var _actor:ActorModel;
      private var _voyage:TweenLite;
      private var _shipX:Number;
      private var _shipY:Number;
      private var _destroyed:Boolean;

      override protected function init() : void
      {
         conLevel["task836mc"].visible = false;
         _ship = conLevel["ship"];
         _shipX = _ship.x;
         _shipY = _ship.y;
         _ship.buttonMode = true;
         _ship.addEventListener(MouseEvent.CLICK,onShipClick);
      }

      private function onShipClick(event:MouseEvent) : void
      {
         MainManager.actorModel.moveAndAction(new Point(800,400),onBoard);
      }

      private function onBoard() : void
      {
         if(_destroyed || _voyage != null) return;
         _actor = MainManager.actorModel;
         LevelManager.closeMouseEvent();
         _ship.buttonMode = false;
         _ship.removeEventListener(MouseEvent.CLICK,onShipClick);
         _ship.x = 0;
         _ship.y = 0;
         _actor.addChildAt(_ship,0);
         _voyage = TweenLite.to(_actor,4,{
            "x":428,
            "y":296,
            "onComplete":onArrive
         });
      }

      private function onArrive() : void
      {
         if(_destroyed) return;
         _voyage = null;
         _ship.x = 428;
         _ship.y = 296;
         conLevel.addChildAt(_ship,0);
         LevelManager.openMouseEvent();
         MapManager.changeMap(693);
      }

      override public function destroy() : void
      {
         _destroyed = true;
         _ship.removeEventListener(MouseEvent.CLICK,onShipClick);
         if(_voyage != null)
         {
            TweenLite.removeTween(_voyage);
            _voyage = null;
            LevelManager.openMouseEvent();
         }
         if(_actor != null && _ship.parent == _actor)
         {
            _ship.x = _shipX;
            _ship.y = _shipY;
            conLevel.addChildAt(_ship,0);
         }
         _actor = null;
         _ship = null;
      }
   }
}
