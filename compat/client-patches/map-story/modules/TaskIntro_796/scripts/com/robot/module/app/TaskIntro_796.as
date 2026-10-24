package com.robot.module.app
{
   import com.robot.app.task.taskscollection.Task796;
   import com.robot.core.manager.LevelManager;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.Event;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;

   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class TaskIntro_796 extends Sprite implements IModule
   {
      private var _mainUI:MovieClip;

      public function setup() : void
      {
      }

      public function init(data:Object = null) : void
      {
      }

      public function show() : void
      {
         if(_mainUI != null) return;
         _mainUI = new TaskIntroUI_796();
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
         LevelManager.appLevel.addChild(_mainUI);
         _mainUI.addEventListener("destroy796",onVideoEnd);
      }

      private function onVideoEnd(event:Event) : void
      {
         hide();
         Task796.onVideoOver();
      }

      public function hide() : void
      {
         if(_mainUI == null) return;
         _mainUI.removeEventListener("destroy796",onVideoEnd);
         _mainUI.stop();
         DisplayUtil.removeForParent(_mainUI);
         _mainUI = null;
      }

      public function destroy() : void
      {
         hide();
      }
   }
}
