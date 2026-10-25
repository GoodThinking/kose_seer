package com.robot.module.app
{
   import com.robot.app.task.taskscollection.Task816;
   import com.robot.core.event.MapEvent;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.map.config.MapProcessConfig;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.Event;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;

   public class TaskIntro_816 extends Sprite implements IModule
   {
      private var _mainUI:MovieClip;
      private var _owner:BaseMapProcess;

      public function init(data:Object = null) : void
      {
         // The original communication movie has no initialization payload.
      }

      public function setup() : void
      {
         if(_mainUI == null) _mainUI = new TaskIntroUI_816();
      }

      public function show() : void
      {
         setup();
         if(DisplayUtil.hasParent(_mainUI)) return;
         _owner = MapProcessConfig.currentProcessInstance;
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
         LevelManager.appLevel.addChild(_mainUI);
         _mainUI.addEventListener("destroy816",onComplete);
         MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,onLeave);
         _mainUI.gotoAndPlay(1);
      }

      private function onComplete(event:Event) : void
      {
         var owner:BaseMapProcess = _owner;
         hide();
         if(owner != null && MapProcessConfig.currentProcessInstance === owner) Task816.onVideoOver();
      }

      private function onLeave(event:MapEvent) : void
      {
         hide();
      }

      public function hide() : void
      {
         MapManager.removeEventListener(MapEvent.MAP_SWITCH_OPEN,onLeave);
         _owner = null;
         if(_mainUI == null) return;
         _mainUI.removeEventListener("destroy816",onComplete);
         DisplayUtil.stopAllMovieClip(_mainUI);
         DisplayUtil.removeForParent(_mainUI);
         _mainUI = null;
      }

      public function destroy() : void
      {
         hide();
      }
   }
}
