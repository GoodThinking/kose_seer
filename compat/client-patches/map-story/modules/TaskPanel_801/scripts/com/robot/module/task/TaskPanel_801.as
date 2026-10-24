package com.robot.module.task
{
   import com.robot.app.task.taskscollection.Task801;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.effect.ColorFilter;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;

   public class TaskPanel_801 extends Sprite implements IModule
   {
      private static const TASK_ID:uint = 801;
      private static const LABELS:Array = ["前往烈焰丛林","最后的任务","前往神兽谷","冰狐的哀鸣","神狐的爆发","阴谋的背后"];
      private static const GRAY:Array = [ColorFilter.setGrayscale()];
      private var _mainUI:MainPanel_801;
      private var _shown:Boolean;
      private var _waiting:Boolean;
      private var _state:uint;
      private var _next:uint;

      public function TaskPanel_801()
      {
         super();
      }

      public function init(data:Object = null) : void
      {
      }

      public function setup() : void
      {
         if(_mainUI != null) return;
         _mainUI = new MainPanel_801();
         _mainUI["closeBtn"].addEventListener(MouseEvent.CLICK,onClose);
         for(var i:uint = 1; i <= 6; i++)
         {
            _mainUI["mc" + i].addEventListener(MouseEvent.CLICK,onConvey);
         }
      }

      public function show() : void
      {
         setup();
         _shown = true;
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
         LevelManager.appLevel.addChild(_mainUI);
         for(var i:uint = 0; i < 6; i++)
         {
            ToolTipManager.add(_mainUI["mc" + (i + 1)],LABELS[i]);
         }
         _state = TasksManager.getTaskStatus(TASK_ID);
         _waiting = _state == TasksManager.ALR_ACCEPT;
         setProgress(_state == TasksManager.COMPLETE ? 6 : 0);
         if(_state == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(progress:Array):void
            {
               if(!_shown || _mainUI == null) return;
               var next:uint = 0;
               _waiting = false;
               while(next < 6 && progress[next]) ++next;
               setProgress(next);
            });
         }
      }

      private function setProgress(next:uint) : void
      {
         _next = next;
         for(var i:uint = 0; i < 6; i++)
         {
            var card:SimpleButton = _mainUI["mc" + (i + 1)] as SimpleButton;
            card.filters = i <= next ? [] : GRAY;
            card.mouseEnabled = !_waiting && i == next && next < 6;
            _mainUI["comp" + i].visible = i < next;
         }
      }

      private function onConvey(event:MouseEvent) : void
      {
         if(!_shown || _waiting || _next >= 6) return;
         var target:uint = _state == TasksManager.UN_ACCEPT ? 685 : (_next < 2 ? 10053 : (_next == 2 ? 685 : 686));
         hide();
         if(MapManager.currentMap != null && MapManager.currentMap.id == target)
         {
            if(_state == TasksManager.UN_ACCEPT) Task801.acceptTask();
            return;
         }
         if(target == 10053) MapManager.changeLocalMap(target);
         else MapManager.changeMap(target);
      }

      private function onClose(event:MouseEvent) : void
      {
         hide();
      }

      public function hide() : void
      {
         _shown = false;
         if(_mainUI == null) return;
         for(var i:uint = 1; i <= 6; i++) ToolTipManager.remove(_mainUI["mc" + i]);
         DisplayUtil.removeForParent(_mainUI);
      }

      public function destroy() : void
      {
         hide();
         if(_mainUI == null) return;
         for(var i:uint = 1; i <= 6; i++)
         {
            _mainUI["mc" + i].removeEventListener(MouseEvent.CLICK,onConvey);
         }
         _mainUI["closeBtn"].removeEventListener(MouseEvent.CLICK,onClose);
         _mainUI = null;
      }
   }
}
