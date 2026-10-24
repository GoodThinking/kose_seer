package com.robot.core.mode
{
   import com.robot.core.event.MapEvent;
   import com.robot.core.event.RobotEvent;
   import com.robot.core.info.UserInfo;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.UIManager;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.geom.Point;
   import org.taomee.utils.DisplayUtil;
   
   public class ActorModel extends BasePeoleModel
   {
      
      private var radius:Sprite;
      
      private var _footMC:MovieClip;
      
      private var _moveActionTarget:Point;
      
      private var _moveActionCallback:Function;
      
      public function ActorModel(param1:UserInfo)
      {
         super(param1);
         this._footMC = UIManager.getMovieClip("q_mc");
         addChildAt(this._footMC,0);
      }
      
      public function get footMC() : MovieClip
      {
         return this._footMC;
      }
      
      public function showShotRadius(param1:uint) : void
      {
         if(!this.radius)
         {
            this.radius = new Sprite();
            this.radius.mouseEnabled = false;
         }
         this.radius.graphics.clear();
         this.radius.graphics.lineStyle(2,16776960,0.6);
         this.radius.graphics.beginFill(16776960,0.2);
         this.radius.graphics.drawCircle(0,0,param1);
         addChildAt(this.radius,0);
      }
      
      public function hideRadius() : void
      {
         DisplayUtil.removeForParent(this.radius);
      }
      
      public function moveAndAction(param1:Point, param2:Function) : void
      {
         this.clearMoveAction();
         if(param1 == null || param2 == null)
         {
            return;
         }
         if(Point.distance(pos,param1) < 30)
         {
            param2();
            return;
         }
         this._moveActionTarget = param1.clone();
         this._moveActionCallback = param2;
         addEventListener(RobotEvent.WALK_ENTER_FRAME,this.onMoveActionWalk);
         addEventListener(RobotEvent.WALK_END,this.onMoveActionWalk);
         MapManager.addEventListener(MapEvent.MAP_MOUSE_DOWN,this.cancelMoveAction);
         MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,this.cancelMoveAction);
         MapManager.addEventListener(MapEvent.MAP_DESTROY,this.cancelMoveAction);
         walkAction(this._moveActionTarget);
         if(!walk.isPlaying)
         {
            this.clearMoveAction();
         }
      }
      
      private function onMoveActionWalk(param1:Event) : void
      {
         var callback:Function = null;
         if(this._moveActionTarget == null)
         {
            return;
         }
         if(Point.distance(pos,this._moveActionTarget) < 30)
         {
            callback = this._moveActionCallback;
            this.clearMoveAction();
            stop();
            callback();
         }
         else if(param1.type == RobotEvent.WALK_END)
         {
            this.clearMoveAction();
         }
      }
      
      private function cancelMoveAction(param1:MapEvent) : void
      {
         this.clearMoveAction();
      }
      
      private function clearMoveAction() : void
      {
         removeEventListener(RobotEvent.WALK_ENTER_FRAME,this.onMoveActionWalk);
         removeEventListener(RobotEvent.WALK_END,this.onMoveActionWalk);
         MapManager.removeEventListener(MapEvent.MAP_MOUSE_DOWN,this.cancelMoveAction);
         MapManager.removeEventListener(MapEvent.MAP_SWITCH_OPEN,this.cancelMoveAction);
         MapManager.removeEventListener(MapEvent.MAP_DESTROY,this.cancelMoveAction);
         this._moveActionTarget = null;
         this._moveActionCallback = null;
      }
      
      override public function destroy() : void
      {
         this.clearMoveAction();
         super.destroy();
      }
      
      public function getIsPetFollw(param1:uint) : Boolean
      {
         if(Boolean(pet))
         {
            if(pet.info.petID == param1)
            {
               return true;
            }
            return false;
         }
         return false;
      }
   }
}
