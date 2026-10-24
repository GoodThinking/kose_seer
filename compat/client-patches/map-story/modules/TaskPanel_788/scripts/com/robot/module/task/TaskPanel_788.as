package com.robot.module.task
{
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.effect.ColorFilter;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;

   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class TaskPanel_788 extends Sprite implements IModule
   {
      private var _mainUI:MainPanel_788;
      private var _shown:Boolean;
      private var _target:uint;
      private const TASK_ID:uint = 788;

      public function setup() : void
      {
         _mainUI = new MainPanel_788();
         _mainUI["closeBtn"].addEventListener(MouseEvent.CLICK,onClose);
         for(var i:int = 1; i <= 4; ++i)
            _mainUI["mc" + i].addEventListener(MouseEvent.CLICK,onConvey);
      }

      public function init(data:Object = null) : void
      {
      }

      public function show() : void
      {
         _shown = true;
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
         LevelManager.appLevel.addChild(_mainUI);
         ToolTipManager.add(_mainUI["mc1"],"前往晶石峡谷");
         ToolTipManager.add(_mainUI["mc2"],"进入丛林之境");
         ToolTipManager.add(_mainUI["mc3"],"准备渡河");
         ToolTipManager.add(_mainUI["mc4"],"危难的伙伴／冰狐的来意");
         render(-1,false);
         var status:uint = TasksManager.getTaskStatus(TASK_ID);
         if(status == TasksManager.COMPLETE) render(4,false);
         else if(status == TasksManager.UN_ACCEPT)
         {
            _target = 683;
            _mainUI["mc1"].mouseEnabled = true;
         }
         else if(status == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(progress:Array):void
            {
               if(!_shown || _mainUI == null) return;
               var next:int = 0;
               while(next < 5 && progress[next]) ++next;
               render(Math.min(next,3),next < 5);
               _target = next == 0 ? 683 : 684;
            });
         }
      }

      private function render(stage:int, active:Boolean) : void
      {
         for(var i:int = 0; i < 4; ++i)
         {
            _mainUI["mc" + (i + 1)].filters = i <= stage ? [] : [ColorFilter.setGrayscale()];
            _mainUI["mc" + (i + 1)].mouseEnabled = active && i == stage;
            _mainUI["comp" + i].visible = i < stage;
         }
      }

      private function onConvey(event:MouseEvent) : void
      {
         var target:uint = _target;
         hide();
         if(MapManager.currentMap.id != target) MapManager.changeMap(target);
      }

      private function onClose(event:MouseEvent) : void
      {
         hide();
      }

      public function hide() : void
      {
         _shown = false;
         for(var i:int = 1; i <= 4; ++i) ToolTipManager.remove(_mainUI["mc" + i]);
         DisplayUtil.removeForParent(_mainUI);
      }

      public function destroy() : void
      {
         hide();
         for(var i:int = 1; i <= 4; ++i)
            _mainUI["mc" + i].removeEventListener(MouseEvent.CLICK,onConvey);
         _mainUI["closeBtn"].removeEventListener(MouseEvent.CLICK,onClose);
         _mainUI = null;
      }
   }
}
