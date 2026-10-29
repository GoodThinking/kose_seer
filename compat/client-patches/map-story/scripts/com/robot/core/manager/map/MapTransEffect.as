package com.robot.core.manager.map
{
   import com.robot.core.event.MapEvent;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.mode.MapModel;
   import flash.display.Bitmap;
   import flash.display.BitmapData;
   import flash.display.DisplayObject;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.EventDispatcher;
   import flash.geom.Point;
   import gs.TweenMax;
   import gs.easing.Sine;
   import gs.events.TweenEvent;
   import org.taomee.utils.DisplayUtil;

   public class MapTransEffect extends EventDispatcher
   {
      public static const NONE:int = 0;
      public static const TOP:int = 1;
      public static const LEFT:int = 2;
      public static const DOWN:int = 3;
      public static const RIGHT:int = 4;

      private var _mapModel:MapModel;
      private var _root:DisplayObject;
      private var _dir:int = 0;
      private var _sprite:Sprite;
      private var _tween:TweenMax;

      public function MapTransEffect(map:MapModel, direction:int)
      {
         super();
         this._mapModel = map;
         this._root = map.root;
         this._dir = direction;
      }

      public function star() : void
      {
         if(this._dir == NONE)
         {
            dispatchEvent(new MapEvent(MapEvent.MAP_EFFECT_COMPLETE));
            return;
         }
         var offset:Point = this.getNewMapXY();
         this._sprite = new Sprite();
         var previous:BitmapData = new BitmapData(MainManager.getStageWidth(),MainManager.getStageHeight());
         previous.draw(LevelManager.mapLevel.getChildAt(0));
         this._sprite.addChild(new Bitmap(previous));
         var next:BitmapData = new BitmapData(MainManager.getStageWidth(),MainManager.getStageHeight());
         next.draw(this._root);
         var nextImage:Bitmap = new Bitmap(next);
         nextImage.x = offset.x;
         nextImage.y = offset.y;
         this._sprite.addChild(nextImage);
         DisplayUtil.removeAllChild(LevelManager.mapLevel);
         LevelManager.mapLevel.addChild(this._sprite);
         this._tween = new TweenMax(this._sprite,1,{
            "x":-offset.x,
            "y":-offset.y,
            "ease":Sine.easeOut
         });
         this._tween.addEventListener(TweenEvent.COMPLETE,this.onTweenComplete);
      }

      private function onTweenComplete(event:TweenEvent) : void
      {
         this._tween.removeEventListener(TweenEvent.COMPLETE,this.onTweenComplete);
         this._tween = null;
         this._root.addEventListener(Event.ADDED_TO_STAGE,this.onAddHandler);
         dispatchEvent(new MapEvent(MapEvent.MAP_EFFECT_COMPLETE));
      }

      private function onAddHandler(event:Event) : void
      {
         this.cancel();
      }

      public function cancel() : void
      {
         if(this._tween)
         {
            this._tween.removeEventListener(TweenEvent.COMPLETE,this.onTweenComplete);
            TweenMax.killTweensOf(this._sprite);
            this._tween = null;
         }
         if(this._root)
         {
            this._root.removeEventListener(Event.ADDED_TO_STAGE,this.onAddHandler);
         }
         if(this._sprite)
         {
            DisplayUtil.removeForParent(this._sprite);
            while(this._sprite.numChildren)
            {
               var image:Bitmap = this._sprite.removeChildAt(0) as Bitmap;
               if(image && image.bitmapData)
               {
                  image.bitmapData.dispose();
                  image.bitmapData = null;
               }
            }
         }
         this._sprite = null;
         this._root = null;
         this._mapModel = null;
      }

      private function getNewMapXY() : Point
      {
         switch(this._dir)
         {
            case TOP:
               return new Point(0,-MainManager.getStageHeight());
            case LEFT:
               return new Point(-MainManager.getStageWidth(),0);
            case DOWN:
               return new Point(0,MainManager.getStageHeight());
            case RIGHT:
               return new Point(MainManager.getStageWidth(),0);
            default:
               return new Point(0,-MainManager.getStageHeight());
         }
      }
   }
}
