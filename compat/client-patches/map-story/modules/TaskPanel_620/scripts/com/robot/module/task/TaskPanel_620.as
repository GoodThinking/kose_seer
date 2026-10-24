package com.robot.module.task
{
   import com.robot.app.task.control.TaskController_620;
   import com.robot.app.tasksRecord.TasksRecordController;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class TaskPanel_620 extends Sprite implements IModule
   {
      
      private var _gotoBtn:SimpleButton;
      
      private var _closeBtn:SimpleButton;
      
      private var _mc1:MovieClip;
      
      private var _mainUI:MovieClip;
      
      private var _mc2:MovieClip;
      
      private var _mc3:MovieClip;
      
      public function TaskPanel_620()
      {
         super();
      }
      
      public function hide() : void
      {
         _gotoBtn.removeEventListener(MouseEvent.CLICK,goHandler);
         _closeBtn.removeEventListener(MouseEvent.CLICK,closeHandler);
         ToolTipManager.remove(_mc1);
         ToolTipManager.remove(_mc2);
         ToolTipManager.remove(_mc3);
         DisplayUtil.removeForParent(_mainUI);
      }
      
      public function setup() : void
      {
         _mainUI = new MainPanel_620();
         _gotoBtn = _mainUI["go"];
         _closeBtn = _mainUI["close"];
         _mc1 = _mainUI["mc_1"];
         _mc2 = _mainUI["mc_2"];
         _mc3 = _mainUI["mc_3"];
      }
      
      public function show() : void
      {
         if(DisplayUtil.hasParent(_mainUI))
         {
            return;
         }
         _mc1.visible = _mc2.visible = _mc3.visible = false;
         TasksManager.getProStatusList(TaskController_620.TASK_ID,function(arr:Array):void
         {
            if(!arr[0])
            {
               _mc1.visible = true;
            }
            else if(Boolean(arr[0]) && !arr[1])
            {
               _mc2.visible = true;
            }
            else if(Boolean(arr[0]) && Boolean(arr[1]) && !arr[2])
            {
               _mc3.visible = true;
            }
            else
            {
               trace("任务完成了");
            }
         });
         ToolTipManager.add(_mc1,"快跳到奶油湾泡个澡吧");
         ToolTipManager.add(_mc2,"解除密码");
         ToolTipManager.add(_mc3,"逃离魔窟");
         _gotoBtn.addEventListener(MouseEvent.CLICK,goHandler);
         _closeBtn.addEventListener(MouseEvent.CLICK,closeHandler);
         LevelManager.appLevel.addChild(_mainUI);
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
      }
      
      public function init(data:Object = null) : void
      {
      }
      
      private function goHandler(e:MouseEvent) : void
      {
         if(MapManager.currentMap.id == 486)
         {
            hide();
            TasksRecordController.hideListPanel();
         }
         else
         {
            MapManager.changeMap(486);
         }
      }
      
      public function destroy() : void
      {
         hide();
      }
      
      private function closeHandler(e:MouseEvent) : void
      {
         destroy();
      }
   }
}

