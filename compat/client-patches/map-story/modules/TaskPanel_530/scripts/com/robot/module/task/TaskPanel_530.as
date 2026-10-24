package com.robot.module.task
{
   import com.robot.app.task.control.TaskController_530;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class TaskPanel_530 extends Sprite implements IModule
   {
      
      private var _closeBtn:SimpleButton;
      
      private var _mainUI:MainPanel_530;
      
      private var _gotoBtn:SimpleButton;
      
      public function TaskPanel_530()
      {
         super();
      }
      
      public function destroy() : void
      {
         hide();
      }
      
      public function hide() : void
      {
         _gotoBtn.removeEventListener(MouseEvent.CLICK,onGotoClick);
         _closeBtn.removeEventListener(MouseEvent.CLICK,onCloseClick);
         DisplayUtil.removeForParent(_mainUI);
      }
      
      public function setup() : void
      {
         _mainUI = new MainPanel_530();
         _gotoBtn = _mainUI["goto_btn"];
         _closeBtn = _mainUI["close_btn"];
      }
      
      private function onGotoClick(e:MouseEvent) : void
      {
         hide();
         if(_mainUI.currentFrame == 1)
         {
            MapManager.changeMap(429);
         }
         if(_mainUI.currentFrame == 2)
         {
            MapManager.changeMap(430);
         }
         if(_mainUI.currentFrame == 3)
         {
            MapManager.changeMap(9);
         }
      }
      
      private function onCloseClick(e:MouseEvent) : void
      {
         hide();
      }
      
      public function init(data:Object = null) : void
      {
      }
      
      public function show() : void
      {
         _gotoBtn.addEventListener(MouseEvent.CLICK,onGotoClick);
         _closeBtn.addEventListener(MouseEvent.CLICK,onCloseClick);
         TasksManager.getProStatusList(TaskController_530.TASK_ID,function(array:Array):void
         {
            if(!array[0])
            {
               _mainUI.gotoAndStop(1);
            }
            else if(Boolean(array[0]) && !array[1])
            {
               _mainUI.gotoAndStop(2);
            }
            else
            {
               _mainUI.gotoAndStop(3);
            }
         });
         if(DisplayUtil.hasParent(_mainUI))
         {
            return;
         }
         LevelManager.appLevel.addChild(_mainUI);
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
      }
   }
}

