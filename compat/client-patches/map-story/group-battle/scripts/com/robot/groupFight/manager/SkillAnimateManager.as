package com.robot.groupFight.manager
{
   import flash.display.MovieClip;
   import flash.events.Event;

   public class SkillAnimateManager
   {
      private static var running:Array = [];
      private var frameFunc:Function;
      private var movie:MovieClip;

      public function SkillAnimateManager()
      {
         super();
      }

      public function playMC(mc:MovieClip, callback:Function = null) : void
      {
         this.frameFunc = callback;
         this.movie = mc;
         running.push(this);
         if(mc.totalFrames > 2) this.playFrameMC(mc);
         else mc.addEventListener(Event.ENTER_FRAME,this.getChildMC);
      }

      private function getChildMC(event:Event) : void
      {
         if(movie.numChildren == 0) return;
         var child:MovieClip = movie.getChildAt(0) as MovieClip;
         if(child != null)
         {
            movie.removeEventListener(Event.ENTER_FRAME,this.getChildMC);
            this.movie = child;
            this.playFrameMC(child);
         }
      }

      private function playFrameMC(mc:MovieClip) : void
      {
         mc.gotoAndPlay(2);
         mc.addEventListener(Event.ENTER_FRAME,this.onEnterFrame);
      }

      private function onEnterFrame(event:Event) : void
      {
         if(movie.currentFrame != movie.totalFrames) return;
         var callback:Function = frameFunc;
         this.destroy();
         if(callback != null) callback();
      }

      private function destroy() : void
      {
         if(movie != null)
         {
            movie.removeEventListener(Event.ENTER_FRAME,this.getChildMC);
            movie.removeEventListener(Event.ENTER_FRAME,this.onEnterFrame);
            movie.stop();
         }
         movie = null;
         frameFunc = null;
         var index:int = running.indexOf(this);
         if(index != -1) running.splice(index,1);
      }

      public static function stopAll() : void
      {
         while(running.length > 0) SkillAnimateManager(running[0]).destroy();
      }
   }
}
