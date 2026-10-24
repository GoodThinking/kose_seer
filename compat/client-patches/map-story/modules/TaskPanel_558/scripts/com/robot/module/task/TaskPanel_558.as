package com.robot.module.task
{
   import com.robot.app.task.control.TasksController;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import org.taomee.manager.EventManager;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class TaskPanel_558 extends Sprite implements IModule
   {
      
      private var _introTxt:TextField;
      
      private var _status:uint;
      
      private var _goBtn:SimpleButton;
      
      private var _closeBtn:SimpleButton;
      
      private var _mainUI:MovieClip;
      
      public function TaskPanel_558()
      {
         super();
      }
      
      private function goHandler(e:MouseEvent) : void
      {
         hide();
         switch(_status)
         {
            case 0:
               MapManager.changeMap(459);
               break;
            case 1:
               MapManager.changeMap(459);
               break;
            case 2:
               MapManager.changeMap(9);
         }
      }
      
      public function setup() : void
      {
         _mainUI = new TaskPanel_558_ui();
         _introTxt = _mainUI["introTxt"];
         _closeBtn = _mainUI["closeBtn"];
         _goBtn = _mainUI["goBtn"];
         ToolTipManager.add(_mainUI["icon_0"],"达尔花粉会让迪达打喷嚏");
         ToolTipManager.add(_mainUI["icon_1"],"快解开左右两个锁扣");
         ToolTipManager.add(_mainUI["icon_2"],"我正在资料室呢");
      }
      
      public function init(data:Object = null) : void
      {
      }
      
      private function onClose(evt:MouseEvent) : void
      {
         hide();
         EventManager.dispatchEvent(new Event(TasksController.TASKPANEL_CLOSE));
      }
      
      public function hide() : void
      {
         DisplayUtil.removeForParent(_mainUI);
         _closeBtn.removeEventListener(MouseEvent.CLICK,onClose);
         _goBtn.removeEventListener(MouseEvent.CLICK,goHandler);
      }
      
      private function taskStatus(arr:Array) : void
      {
         if(!arr[0])
         {
            _status = 0;
            _introTxt.htmlText = "     菲尔纳星上那个被锁扣困住的精灵到底怎么了？是谁发出来的声音？迪达和塔姆拉是不是能帮到我们呢？";
            setVisible([0]);
         }
         else if(Boolean(arr[0]) && !arr[1])
         {
            _status = 1;
            _introTxt.htmlText = "     根据小精灵的提示，我们需要解开它左右的锁扣才可以！还等什么，快用鼠标点击吧！";
            setVisible([1]);
         }
         else if(Boolean(arr[1]) && !arr[2])
         {
            _status = 2;
            setVisible([2]);
            _introTxt.htmlText = "     神秘的黑白精灵！那条通往深渊的入口又通往哪里？传言中的化身之匙又在哪里呢？先去资料室禀报爱丽丝吧！";
         }
         _introTxt.height = Math.max(_introTxt.height,_introTxt.textHeight + 4);
      }
      
      public function show() : void
      {
         if(DisplayUtil.hasParent(_mainUI))
         {
            return;
         }
         LevelManager.appLevel.addChild(_mainUI);
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
         _closeBtn.addEventListener(MouseEvent.CLICK,onClose);
         _goBtn.addEventListener(MouseEvent.CLICK,goHandler);
         checkTask();
      }
      
      private function checkTask() : void
      {
         TasksManager.getProStatusList(558,taskStatus);
      }
      
      private function setVisible(arr:Array) : void
      {
         var i:uint = 0;
         var nameStr:String = null;
         var name:String = null;
         var mc:MovieClip = null;
         for(var j:uint = 0; j < 4; j++)
         {
            nameStr = "icon_" + j;
            if(_mainUI[nameStr])
            {
               _mainUI[nameStr].visible = false;
            }
         }
         for each(i in arr)
         {
            name = "icon_" + i;
            mc = _mainUI[name];
            if(mc)
            {
               mc.visible = true;
            }
         }
      }
      
      public function destroy() : void
      {
         hide();
         ToolTipManager.remove(_mainUI["icon_0"]);
         ToolTipManager.remove(_mainUI["icon_1"]);
         ToolTipManager.remove(_mainUI["icon_2"]);
      }
   }
}

