package com.robot.module.app
{
   import com.robot.app.task.taskscollection.Task811;
   import com.robot.core.event.MapEvent;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.map.config.MapProcessConfig;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;

   public class TaskCartoon extends Sprite implements IModule
   {
      private var _mainUI:Task811_Cartoon_UI;
      private var _owner:BaseMapProcess;

      public function init(data:Object = null) : void
      {
         // The original cartoon has no initialization payload.
      }

      public function setup() : void
      {
         if(_mainUI == null) _mainUI = new Task811_Cartoon_UI();
      }

      public function show() : void
      {
         setup();
         _owner = MapProcessConfig.currentProcessInstance;
         _mainUI["closeBtn"].addEventListener(MouseEvent.CLICK,onClose);
         _mainUI["prevBtn"].addEventListener(MouseEvent.CLICK,onPrev);
         _mainUI["nextBtn"].addEventListener(MouseEvent.CLICK,onNext);
         MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,onLeave);
         _mainUI.gotoAndStop(1);
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
         LevelManager.appLevel.addChild(_mainUI);
         setVisible();
      }

      private function onNext(event:Event) : void
      {
         _mainUI.nextFrame();
         setVisible();
      }

      private function onPrev(event:Event) : void
      {
         _mainUI.prevFrame();
         setVisible();
      }

      private function setVisible() : void
      {
         _mainUI["prevBtn"].visible = _mainUI.currentFrame > 1;
         _mainUI["nextBtn"].visible = _mainUI.currentFrame < _mainUI.totalFrames;
      }

      private function onClose(event:Event) : void
      {
         var owner:BaseMapProcess = _owner;
         hide();
         if(owner != null && MapProcessConfig.currentProcessInstance === owner) Task811.cartoonOver();
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
         _mainUI["closeBtn"].removeEventListener(MouseEvent.CLICK,onClose);
         _mainUI["prevBtn"].removeEventListener(MouseEvent.CLICK,onPrev);
         _mainUI["nextBtn"].removeEventListener(MouseEvent.CLICK,onNext);
         DisplayUtil.removeForParent(_mainUI);
      }

      public function destroy() : void
      {
         hide();
         _mainUI = null;
      }
   }
}
