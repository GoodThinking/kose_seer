package com.robot.core.animate
{
   import flash.display.MovieClip;
   import flash.events.Event;
   import flash.utils.Dictionary;

   public class MCStopPlayManager
   {
      private static var pending:Dictionary = new Dictionary(true);

      public function MCStopPlayManager()
      {
         super();
      }

      public static function stopChildMC(movie:MovieClip, frame:Object = null) : void
      {
         setChildPlayback(movie,frame,false);
      }

      public static function playChildMC(movie:MovieClip, frame:Object = null) : void
      {
         setChildPlayback(movie,frame,true);
      }

      private static function setChildPlayback(movie:MovieClip, frame:Object, playing:Boolean) : void
      {
         clear(movie);
         if(frame != null) movie.gotoAndStop(frame);
         pending[movie] = playing;
         movie.addEventListener(Event.ENTER_FRAME,onFrame);
         movie.addEventListener(Event.REMOVED_FROM_STAGE,onRemoved);
      }

      private static function onFrame(event:Event) : void
      {
         var movie:MovieClip = event.currentTarget as MovieClip;
         if(movie.numChildren == 0) return;
         var child:MovieClip = movie.getChildAt(0) as MovieClip;
         if(child == null) return;
         var playing:Boolean = Boolean(pending[movie]);
         clear(movie);
         if(playing) child.gotoAndPlay(2);
         else child.gotoAndStop(1);
      }

      private static function onRemoved(event:Event) : void
      {
         if(event.target == event.currentTarget) clear(event.currentTarget as MovieClip);
      }

      public static function clear(movie:MovieClip) : void
      {
         if(movie == null) return;
         movie.removeEventListener(Event.ENTER_FRAME,onFrame);
         movie.removeEventListener(Event.REMOVED_FROM_STAGE,onRemoved);
         delete pending[movie];
      }
   }
}
