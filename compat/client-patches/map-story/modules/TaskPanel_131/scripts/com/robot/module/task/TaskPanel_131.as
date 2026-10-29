package com.robot.module.task
{
   import com.robot.app.task.control.TaskController_131;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.TasksManager;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class TaskPanel_131 extends Sprite implements IModule
   {
      
      private var _closeBtn:SimpleButton;
      
      private var _introTxt:TextField;
      
      private var _mainUI:MovieClip;
      
      private var _iconMc:Sprite;
      
      public function TaskPanel_131()
      {
         super();
      }
      
      public function hide() : void
      {
         DisplayUtil.removeForParent(_mainUI);
      }
      
      private function tasksStates(arr:Array) : void
      {
         if(_mainUI == null || !DisplayUtil.hasParent(_mainUI)) return;
         var infoStr:String = "";
         if(!arr[0])
         {
            infoStr = "    与<font color=\'#ff0000\'>英佩恩堡垒</font>上的智能AI：军团对话，取得编队训练项目的下一步指示。";
            changeTaskInfo(infoStr,[{
               "icon":task_131_0,
               "state":arr[0],
               "tip":"AI就在英佩恩堡垒第一层的主控制室里"
            }]);
            return;
         }
         if(Boolean(arr[0]) && !arr[1])
         {
            infoStr = "    从“军团”旁边进入训练室，你会在那里接到编队训练的下一步指示。";
            changeTaskInfo(infoStr,[{
               "icon":task_131_1,
               "state":arr[1],
               "tip":"从旁边进入训练室"
            }]);
            return;
         }
         if(Boolean(arr[1]) && !arr[2])
         {
            infoStr = "    组成队伍后，合力击败寄生岩完成编队训练（必须组成队伍才能开启对战）";
            changeTaskInfo(infoStr,[{
               "icon":task_131_2,
               "state":arr[2],
               "tip":"组成队伍后击败寄生岩"
            }]);
            return;
         }
         if(Boolean(arr[2]) && !arr[3])
         {
            infoStr = "    你已经完成了初级编队训练项目，快回到精灵太空站去向贾斯汀站长回报吧。";
            changeTaskInfo(infoStr,[{
               "icon":task_131_3,
               "state":arr[3],
               "tip":"我在太空站里等你"
            }]);
            return;
         }
      }
      
      public function init(data:Object = null) : void
      {
      }
      
      private function changeTaskInfo(str:String, tasks:Array) : void
      {
         var i:uint = 0;
         var _icon:MovieClip = null;
         removeIcon();
         _introTxt.htmlText = str;
         if(tasks)
         {
            for(i = 0; i < tasks.length; i++)
            {
               _icon = new (tasks[i].icon as Class)() as MovieClip;
               _icon.x = 10 + (_icon.width + 5) * i;
               _iconMc.addChild(_icon);
               ToolTipManager.add(_icon,tasks[i].tip);
               if(tasks[i].state)
               {
               }
               _iconMc.x = (_mainUI.width - _iconMc.width) / 2 - 20;
            }
         }
      }
      
      private function checkTask() : void
      {
         TasksManager.getProStatusList(TaskController_131.TASK_ID,tasksStates);
      }
      
      public function show() : void
      {
         if(DisplayUtil.hasParent(_mainUI))
         {
            return;
         }
         LevelManager.appLevel.addChild(_mainUI);
         _mainUI.addChild(_iconMc);
         _iconMc.x = 20;
         _iconMc.y = 135;
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
         checkTask();
      }
      
      private function removeIcon() : void
      {
         while(_iconMc.numChildren > 0)
         {
            ToolTipManager.remove(_iconMc.getChildAt(0));
            _iconMc.removeChildAt(0);
         }
      }
      
      private function onClose(e:MouseEvent) : void
      {
         this.hide();
      }
      
      public function destroy() : void
      {
         this.hide();
         this.removeIcon();
         _closeBtn.removeEventListener(MouseEvent.CLICK,onClose);
         _closeBtn = null;
         _introTxt = null;
         _iconMc = null;
         _mainUI = null;
      }
      
      public function setup() : void
      {
         _mainUI = new MainPanel_131();
         _introTxt = _mainUI["task_txt"];
         _closeBtn = _mainUI["close_btn"];
         _iconMc = new Sprite();
         _closeBtn.addEventListener(MouseEvent.CLICK,onClose);
      }
   }
}

