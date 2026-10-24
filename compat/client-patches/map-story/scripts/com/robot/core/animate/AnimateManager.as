package com.robot.core.animate
{
   import com.robot.core.SoundManager;
   import com.robot.core.event.MCLoadEvent;
   import com.robot.core.event.MapEvent;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.newloader.MCLoader;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.media.Sound;
   import flash.media.SoundChannel;
   import flash.system.ApplicationDomain;
   import org.taomee.utils.DisplayUtil;

   public class AnimateManager
   {
      private static var url:String;
      private static var name:String;
      private static var soundName:String;
      private static var func:Function;
      private static var mcloader:MCLoader;
      private static var loadOwnsMap:Boolean = false;
      private static var soundChal:SoundChannel;
      private static var classicMode:Boolean = false;
      private static var stopMapSound:Boolean = true;
      public static const MC_NOT_FIND:String = "mcIsNotFind";

      public static function playFullScreenAnimate(movieURL:String = "", callback:Function = null, symbolName:String = null, soundSymbol:String = null) : void
      {
         loadFullScreenAnimate(movieURL,callback,symbolName,soundSymbol,false,true);
      }

      // Classic story timelines use a sound flag, not an exported symbol name.
      public static function playClassicFullScreenAnimate(movieURL:String, callback:Function = null, stopSound:Boolean = true) : void
      {
         loadFullScreenAnimate(movieURL,callback,null,null,true,stopSound);
      }

      private static function loadFullScreenAnimate(movieURL:String, callback:Function, symbolName:String, soundSymbol:String, classic:Boolean, stopSound:Boolean) : void
      {
         if(movieURL == "" || movieURL == null)
         {
            throw new Error("加载的动画路径不对哟!");
         }
         MapManager.removeEventListener(MapEvent.MAP_SWITCH_OPEN,onLoadMapChange);
         if(mcloader != null)
         {
            mcloader.removeEventListener(MCLoadEvent.SUCCESS,onLoadAnimateSuccess);
            mcloader.clear();
         }
         url = movieURL;
         name = symbolName;
         soundName = soundSymbol;
         func = callback;
         classicMode = classic;
         stopMapSound = stopSound;
         loadOwnsMap = MapManager.currentMap != null;
         if(loadOwnsMap)
         {
            MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,onLoadMapChange);
         }
         mcloader = new MCLoader(url,LevelManager.appLevel,1,"正在加载动画..");
         mcloader.addEventListener(MCLoadEvent.SUCCESS,onLoadAnimateSuccess);
         mcloader.doLoad(url);
      }

      private static function onLoadMapChange(event:MapEvent) : void
      {
         MapManager.removeEventListener(MapEvent.MAP_SWITCH_OPEN,onLoadMapChange);
         mcloader.removeEventListener(MCLoadEvent.SUCCESS,onLoadAnimateSuccess);
         mcloader.clear();
         mcloader = null;
         func = null;
         loadOwnsMap = false;
      }

      private static function onLoadAnimateSuccess(event:MCLoadEvent) : void
      {
         mcloader.removeEventListener(MCLoadEvent.SUCCESS,onLoadAnimateSuccess);
         MapManager.removeEventListener(MapEvent.MAP_SWITCH_OPEN,onLoadMapChange);
         var mapBound:Boolean = loadOwnsMap;
         loadOwnsMap = false;
         var domain:ApplicationDomain = event.getApplicationDomain();
         var movie:MovieClip;
         if(name != "" && name != null)
         {
            var movieClass:Class = domain.getDefinition(name) as Class;
            movie = new movieClass() as MovieClip;
         }
         else
         {
            movie = event.getContent() as MovieClip;
         }
         if(movie == null)
         {
            throw new Error("加载的动画出错!");
         }
         LevelManager.closeMouseEvent();
         if(stopMapSound)
         {
            SoundManager.stopSound();
         }
         if(soundName != "" && soundName != null)
         {
            var soundClass:Class = domain.getDefinition(soundName) as Class;
            var sound:Sound = new soundClass() as Sound;
            if(soundChal != null)
            {
               soundChal.stop();
            }
            soundChal = sound.play(10);
         }
         if(classicMode)
         {
            LevelManager.showOrRemoveMapLevelandToolslevel(false,true);
         }
         MainManager.getStage().addChild(movie);
         var callback:Function = func;
         func = null;
         playMovieClip(movie,callback,classicMode,stopMapSound,soundChal,mapBound);
      }

      private static function playMovieClip(movie:MovieClip, callback:Function, classic:Boolean, restoreSound:Boolean, channel:SoundChannel, mapBound:Boolean) : void
      {
         var started:Boolean = !classic;
         var ended:Boolean = false;
         var closeButton:DisplayObject = classic ? movie.getChildByName("close_btn") : null;
         var onMapChange:Function;
         var onEvent:Function = function(event:Event):void
         {
            if(ended)
            {
               return;
            }
            if(event.type == Event.ENTER_FRAME)
            {
               if(!started)
               {
                  started = true;
                  movie.gotoAndPlay(2);
                  return;
               }
               if(movie.currentFrame != movie.totalFrames)
               {
                  return;
               }
            }
            ended = true;
            movie.removeEventListener(Event.ENTER_FRAME,onEvent);
            movie.removeEventListener(Event.REMOVED_FROM_STAGE,onEvent);
            if(onMapChange != null)
            {
               MapManager.removeEventListener(MapEvent.MAP_SWITCH_OPEN,onMapChange);
            }
            if(closeButton != null)
            {
               closeButton.removeEventListener(MouseEvent.CLICK,onEvent);
            }
            movie.stop();
            DisplayUtil.removeForParent(movie);
            if(channel != null)
            {
               channel.stop();
            }
            if(restoreSound)
            {
               SoundManager.playSound();
            }
            if(classic)
            {
               LevelManager.showOrRemoveMapLevelandToolslevel(true);
            }
            LevelManager.openMouseEvent();
            if(event.type != Event.REMOVED_FROM_STAGE && callback != null)
            {
               callback();
            }
         };
         movie.addEventListener(Event.ENTER_FRAME,onEvent);
         movie.addEventListener(Event.REMOVED_FROM_STAGE,onEvent);
         if(mapBound)
         {
            onMapChange = function(event:MapEvent):void
            {
               DisplayUtil.removeForParent(movie);
            };
            MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,onMapChange);
         }
         if(closeButton != null)
         {
            closeButton.addEventListener(MouseEvent.CLICK,onEvent,false,int.MAX_VALUE);
         }
         movie.gotoAndPlay(2);
      }

      public static function playMcAnimate(movie:MovieClip, frame:Object = 0, name:String = "", callback:Function = null, toLastFrame:Boolean = false, closeMouseEvent:Boolean = true) : void
      {
         if(movie == null)
         {
            throw new Error("影片剪辑为空对象！");
         }
         if(closeMouseEvent)
         {
            LevelManager.closeMouseEvent();
         }
         if(frame == 0 || name == "" || name == null)
         {
            playFrameMC(movie,callback,toLastFrame,closeMouseEvent);
            return;
         }
         var onFrame:Function = function(event:Event):void
         {
            if(event.type == Event.REMOVED_FROM_STAGE)
            {
               movie.removeEventListener(Event.ENTER_FRAME,onFrame);
               movie.removeEventListener(Event.REMOVED_FROM_STAGE,onFrame);
               if(closeMouseEvent)
               {
                  LevelManager.openMouseEvent();
               }
               return;
            }
            var child:MovieClip = movie.getChildByName(name) as MovieClip;
            if(child != null)
            {
               movie.removeEventListener(Event.ENTER_FRAME,onFrame);
               movie.removeEventListener(Event.REMOVED_FROM_STAGE,onFrame);
               playFrameMC(child,callback,toLastFrame,closeMouseEvent);
            }
         };
         movie.addEventListener(Event.ENTER_FRAME,onFrame);
         movie.addEventListener(Event.REMOVED_FROM_STAGE,onFrame);
         movie.gotoAndStop(frame);
      }

      private static function playFrameMC(movie:MovieClip, callback:Function, toLastFrame:Boolean, restoreMouse:Boolean) : void
      {
         var onFrame:Function = function(event:Event):void
         {
            if(event.type != Event.REMOVED_FROM_STAGE && movie.currentFrame != movie.totalFrames)
            {
               return;
            }
            movie.removeEventListener(Event.ENTER_FRAME,onFrame);
            movie.removeEventListener(Event.REMOVED_FROM_STAGE,onFrame);
            if(restoreMouse)
            {
               LevelManager.openMouseEvent();
            }
            if(event.type != Event.REMOVED_FROM_STAGE && callback != null)
            {
               callback();
            }
         };
         movie.addEventListener(Event.ENTER_FRAME,onFrame);
         movie.addEventListener(Event.REMOVED_FROM_STAGE,onFrame);
         if(toLastFrame)
         {
            movie.gotoAndStop(movie.totalFrames);
         }
         else
         {
            movie.gotoAndPlay(2);
         }
      }
   }
}
