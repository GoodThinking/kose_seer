package com.robot.module.task
{
   import com.robot.app.task.taskscollection.Task816;
   import com.robot.core.event.MapEvent;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.map.config.MapProcessConfig;
   import flash.display.DisplayObjectContainer;
   import flash.display.InteractiveObject;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.effect.ColorFilter;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;

   public class TaskPanel_816 extends Sprite implements IModule
   {
      private static const TASK_ID:uint = 816;
      private static const TARGETS:Array = [4,666,666,666,666];
      private static const LABELS:Array = ["向船长报告","唤醒朱雀石像","上古圣战","青龙的真相","神兽与天马的约定"];
      private static const GRAY:Array = [ColorFilter.setGrayscale()];
      private var _mainUI:MovieClip;
      private var _shown:Boolean;
      private var _waiting:Boolean;
      private var _state:uint;
      private var _next:uint;
      private var _generation:uint;

      public function init(data:Object = null) : void
      {
         // IModule has no initialization payload for a fixed chapter panel.
      }

      public function setup() : void
      {
         if(_mainUI != null) return;
         _mainUI = new Task816_UI();
         _mainUI["closeBtn"].addEventListener(MouseEvent.CLICK,onClose);
         for(var i:uint = 1; i <= TARGETS.length; i++)
            _mainUI["btn" + i].addEventListener(MouseEvent.CLICK,onConvey);
      }

      public function show() : void
      {
         setup();
         _shown = true;
         MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,onMapLeave);
         var generation:uint = ++_generation;
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
         LevelManager.appLevel.addChild(_mainUI);
         for(var i:uint = 1; i <= TARGETS.length; i++)
            ToolTipManager.add(_mainUI["btn" + i],LABELS[i - 1]);
         _state = TasksManager.getTaskStatus(TASK_ID);
         _waiting = _state == TasksManager.ALR_ACCEPT;
         setProgress(_state == TasksManager.COMPLETE ? TARGETS.length : 0);
         if(!_waiting) return;
         TasksManager.getProStatusList(TASK_ID,function(progress:Array):void
         {
            if(!_shown || generation != _generation) return;
            _waiting = false;
            var next:uint = 0;
            while(next < TARGETS.length && progress[next]) ++next;
            setProgress(next);
         });
      }

      private function setProgress(next:uint) : void
      {
         _next = next;
         for(var i:uint = 0; i < TARGETS.length; i++)
         {
            var card:InteractiveObject = _mainUI["btn" + (i + 1)] as InteractiveObject;
            var enabled:Boolean = !_waiting && i == next && next < TARGETS.length;
            card.filters = i <= next ? [] : GRAY;
            card.mouseEnabled = enabled;
            if(card is DisplayObjectContainer) DisplayObjectContainer(card).mouseChildren = enabled;
            _mainUI["comp" + (i + 1)].visible = i < next;
         }
      }

      private function onConvey(event:MouseEvent) : void
      {
         if(!_shown || _waiting || _next >= TARGETS.length) return;
         if(_state != TasksManager.UN_ACCEPT)
         {
            navigate(false);
            return;
         }
         var generation:uint = _generation;
         var owner:BaseMapProcess = MapProcessConfig.currentProcessInstance;
         _waiting = true;
         setProgress(_next);
         TasksManager.accept(TASK_ID,function(success:Boolean):void
         {
            if(!_shown || generation != _generation || MapProcessConfig.currentProcessInstance !== owner) return;
            _waiting = false;
            if(!success) { setProgress(_next); return; }
            _state = TasksManager.ALR_ACCEPT;
            navigate(true);
         });
      }

      private function navigate(startedHere:Boolean) : void
      {
         var target:uint = TARGETS[_next];
         hide();
         if(MapManager.currentMap.id != target)
         {
            MapManager.changeMap(target);
            return;
         }
         if(startedHere) Task816.initTaskForMap4(MapProcessConfig.currentProcessInstance);
      }

      private function onClose(event:MouseEvent) : void
      {
         hide();
      }

      private function onMapLeave(event:MapEvent) : void
      {
         hide();
      }

      public function hide() : void
      {
         MapManager.removeEventListener(MapEvent.MAP_SWITCH_OPEN,onMapLeave);
         _shown = false;
         ++_generation;
         if(_mainUI == null) return;
         for(var i:uint = 1; i <= TARGETS.length; i++) ToolTipManager.remove(_mainUI["btn" + i]);
         DisplayUtil.removeForParent(_mainUI);
      }

      public function destroy() : void
      {
         hide();
         if(_mainUI == null) return;
         for(var i:uint = 1; i <= TARGETS.length; i++) _mainUI["btn" + i].removeEventListener(MouseEvent.CLICK,onConvey);
         _mainUI["closeBtn"].removeEventListener(MouseEvent.CLICK,onClose);
         _mainUI = null;
      }
   }
}
