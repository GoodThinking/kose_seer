package com.robot.module.task
{
   import com.robot.app.task.control.TaskController_616;
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
   public class TaskPanel_616 extends Sprite implements IModule
   {
      
      private var num:uint = 0;
      
      private var _tipMc:MovieClip;
      
      private var over2_mc:MovieClip;
      
      private var _closeBtn:SimpleButton;
      
      private var tip2_mc:MovieClip;
      
      private var _mainUI:MovieClip;
      
      private var tipInitX:Number;
      
      private var over1_mc:MovieClip;
      
      private var _gotoBtn:SimpleButton;
      
      public function TaskPanel_616()
      {
         super();
      }
      
      public function destroy() : void
      {
         hide();
         _tipMc = null;
         tip2_mc = null;
         _closeBtn = null;
         _gotoBtn = null;
         _mainUI = null;
      }
      
      public function hide() : void
      {
         ToolTipManager.remove(_tipMc);
         ToolTipManager.remove(tip2_mc);
         if(_gotoBtn)
         {
            _gotoBtn.removeEventListener(MouseEvent.CLICK,onGotoClick);
         }
         if(_closeBtn)
         {
            _closeBtn.removeEventListener(MouseEvent.CLICK,onCloseClick);
         }
         DisplayUtil.removeForParent(_mainUI);
      }
      
      public function init(data:Object = null) : void
      {
         num = uint(data);
      }
      
      public function show() : void
      {
         over1_mc.visible = over2_mc.visible = false;
         _gotoBtn.addEventListener(MouseEvent.CLICK,onGotoClick);
         _closeBtn.addEventListener(MouseEvent.CLICK,onCloseClick);
         TasksManager.getProStatusList(TaskController_616.TASK_ID,function(array:Array):void
         {
            if(!array[0])
            {
               _mainUI.gotoAndStop(1);
               _tipMc.x = tipInitX;
               ToolTipManager.add(_tipMc,"居住在裂空星系的怀特星球");
            }
            else if(Boolean(array[0]) && !array[1])
            {
               _mainUI.gotoAndStop(2);
               tip2_mc.visible = true;
               _tipMc.x -= 80;
               ToolTipManager.add(_tipMc,"1桶奶油水");
               ToolTipManager.add(tip2_mc,"3片艾叶草");
               if(num == 1)
               {
                  over1_mc.visible = true;
               }
               else if(num == 2)
               {
                  over2_mc.visible = true;
               }
               else if(num == 3)
               {
                  over1_mc.visible = over2_mc.visible = true;
               }
               else
               {
                  over1_mc.visible = over2_mc.visible = false;
               }
            }
            else if(Boolean(array[1]) && !array[2])
            {
               _tipMc.x = tipInitX;
               _mainUI.gotoAndStop(3);
               ToolTipManager.add(_tipMc,"轻轻点击精元哦");
            }
            else if(Boolean(array[2]) && !array[3])
            {
               _tipMc.x = tipInitX;
               _mainUI.gotoAndStop(4);
               ToolTipManager.add(_tipMc,"走进看看吧");
            }
         });
         if(DisplayUtil.hasParent(_mainUI))
         {
            return;
         }
         LevelManager.appLevel.addChild(_mainUI);
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
      }
      
      public function setup() : void
      {
         _mainUI = new MainPanel_616();
         _gotoBtn = _mainUI["go_btn"];
         _closeBtn = _mainUI["close_btn"];
         _tipMc = _mainUI["tip_mc"];
         tipInitX = _tipMc.x;
         tip2_mc = _mainUI["tip2_mc"];
         tip2_mc.visible = false;
         over1_mc = _mainUI["over2_mc"];
         over2_mc = _mainUI["over1_mc"];
      }
      
      private function onGotoClick(e:MouseEvent) : void
      {
         if(_mainUI.currentFrame == 1)
         {
            if(MapManager.currentMap.id == 484)
            {
               destroy();
               TasksRecordController.hideListPanel();
            }
            else
            {
               MapManager.changeMap(484);
            }
         }
         else if(_mainUI.currentFrame == 2)
         {
            if(MapManager.currentMap.id == 484)
            {
               destroy();
               TasksRecordController.hideListPanel();
            }
            else
            {
               MapManager.changeMap(484);
            }
         }
         else if(_mainUI.currentFrame == 3)
         {
            if(MapManager.currentMap.id == 484)
            {
               destroy();
               TasksRecordController.hideListPanel();
            }
            else
            {
               MapManager.changeMap(484);
            }
         }
         else if(_mainUI.currentFrame == 4)
         {
            if(MapManager.currentMap.id == 484)
            {
               destroy();
               TasksRecordController.hideListPanel();
            }
            else
            {
               MapManager.changeMap(484);
            }
         }
      }
      
      private function onCloseClick(e:MouseEvent) : void
      {
         hide();
      }
   }
}

