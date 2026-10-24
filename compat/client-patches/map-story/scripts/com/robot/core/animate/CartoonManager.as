package com.robot.core.animate
{
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.newloader.*;
   import flash.display.*;
   import flash.events.*;
   import org.taomee.utils.*;
   
   public class CartoonManager
   {
      
      private static var method:Function;
      
      private static var symbol:Array;
      
      private static var mcloader:MCLoader;
      
      private static var mc:MovieClip;
      
      private static var main:MovieClip;
      
      private static var prev:SimpleButton;
      
      private static var next:SimpleButton;
      
      public function CartoonManager()
      {
         super();
      }
      
      public static function play(param1:String, param2:Function = null, param3:Array = null) : void
      {
         method = param2;
         symbol = param3;
         if(param1 != "")
         {
            if(Boolean(mcloader))
            {
               mcloader.clear();
               mcloader = null;
            }
            mcloader = new MCLoader(param1,LevelManager.appLevel,1,"Loading cartoon...");
            mcloader.addEventListener(MCLoadEvent.SUCCESS,onLoadSuccess);
            mcloader.doLoad(param1);
            return;
         }
         throw new Error("Cartoon url is invalid.");
      }
      
      private static function onLoadSuccess(param1:MCLoadEvent) : void
      {
         LevelManager.closeMouseEvent();
         mcloader.removeEventListener(MCLoadEvent.SUCCESS,onLoadSuccess);
         mc = param1.getContent() as MovieClip;
         if(Boolean(symbol))
         {
            main = mc[symbol[0] as String];
            prev = mc[symbol[1] as String];
            next = mc[symbol[2] as String];
         }
         else
         {
            main = mc["main"];
            prev = mc["prev"];
            next = mc["next"];
         }
         if(Boolean(main) && Boolean(prev) && Boolean(next))
         {
            prev.visible = false;
            main.gotoAndStop(1);
            LevelManager.showOrRemoveMapLevelandToolslevel(false,true);
            LevelManager.appLevel.addChild(mc);
            prev.addEventListener(MouseEvent.CLICK,onPrevClick);
            next.addEventListener(MouseEvent.CLICK,onNextClick);
            return;
         }
         throw new Error("Cartoon components are missing.");
      }
      
      private static function onPrevClick(param1:MouseEvent) : void
      {
         if(main.currentFrame == 1)
         {
            prev.visible = false;
         }
         main.prevFrame();
      }
      
      private static function onNextClick(param1:MouseEvent) : void
      {
         if(main.currentFrame == main.totalFrames)
         {
            destory();
         }
         else
         {
            prev.visible = true;
            main.nextFrame();
         }
      }
      
      private static function destory() : void
      {
         LevelManager.openMouseEvent();
         prev.removeEventListener(MouseEvent.CLICK,onPrevClick);
         next.removeEventListener(MouseEvent.CLICK,onNextClick);
         if(method != null)
         {
            method();
         }
         main = null;
         prev = null;
         next = null;
         method = null;
         symbol = null;
         LevelManager.showOrRemoveMapLevelandToolslevel(true);
         DisplayUtil.removeForParent(mc);
         mc = null;
      }
   }
}

