package com.robot.module.task
{
   import com.robot.app.task.control.TasksController;
   import com.robot.core.manager.LevelManager;
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
   public class TaskPanel_94 extends Sprite implements IModule
   {
      
      private var _closeBtn:SimpleButton;
      
      private var _introTxt:TextField;
      
      private var _mainUI:MovieClip;
      
      private var _shown:Boolean;
      
      private var _destroyed:Boolean;
      
      public function TaskPanel_94()
      {
         super();
      }
      
      public function hide() : void
      {
         _shown = false;
         if(_mainUI) DisplayUtil.removeForParent(_mainUI);
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
      
      public function init(data:Object = null) : void
      {
      }
      
      private function checkTask() : void
      {
         TasksManager.getProStatusList(94,taskStatus);
      }
      
      public function show() : void
      {
         if(_destroyed) return;
         _shown = true;
         if(DisplayUtil.hasParent(_mainUI))
         {
            return;
         }
         LevelManager.appLevel.addChild(_mainUI);
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
         checkTask();
      }
      
      private function onClose(evt:MouseEvent) : void
      {
         hide();
         EventManager.dispatchEvent(new Event(TasksController.TASKPANEL_CLOSE));
      }
      
      public function destroy() : void
      {
         if(_destroyed) return;
         _destroyed = true;
         hide();
         if(_closeBtn) _closeBtn.removeEventListener(MouseEvent.CLICK,onClose);
         if(_mainUI)
         {
            for(var i:uint = 0; i < 4; i++) ToolTipManager.remove(_mainUI["icon_" + i]);
         }
         _closeBtn = null;
         _introTxt = null;
         _mainUI = null;
      }
      
      public function setup() : void
      {
         if(_destroyed || _mainUI) return;
         _mainUI = new TaskPanel_94_ui();
         _introTxt = _mainUI["introTxt"];
         _closeBtn = _mainUI["closeBtn"];
         _closeBtn.addEventListener(MouseEvent.CLICK,onClose);
         ToolTipManager.add(_mainUI["icon_0"],"我在机械室等你哦");
         ToolTipManager.add(_mainUI["icon_1"],"我在机械室等你哦");
         ToolTipManager.add(_mainUI["icon_2"],"在火山星、克洛斯星或海洋星深水区采集5块黄晶矿");
         ToolTipManager.add(_mainUI["icon_3"],"在火山星山洞、海洋星或云霄星收集5罐甲烷燃气");
      }
      
      private function taskStatus(arr:Array) : void
      {
         if(_destroyed || !_shown) return;
         _introTxt.htmlText = "    在机械室的赛尔工厂购买“气体收集器”后去找机械师茜茜！";
         if(!arr[0])
         {
            setVisible([0]);
         }
         if(Boolean(arr[0]) && !arr[1])
         {
            setVisible([1]);
         }
         if(Boolean(arr[1]) && !arr[2])
         {
            _introTxt.htmlText = "    装备<font color=\'#ff0000\'>挖矿钻头</font>，前往帕诺星系<font color=\'#ff0000\'>火山星</font>、" + "<font color=\'#ff0000\'>克洛斯星</font>或<font color=\'#ff0000\'>海洋星深水区</font>采集5块黄晶矿，回机械室向机械师茜茜汇报！";
            setVisible([2]);
         }
         if(Boolean(arr[2]) && !arr[3])
         {
            _introTxt.htmlText = "    装备<font color=\'#ff0000\'>气体收集器</font>，前往帕诺星系<font color=\'#ff0000\'>火山星山洞</font>、<font color=\'#ff0000\'>海洋星</font>" + "或<font color=\'#ff0000\'>云霄星</font>收集<font color=\'#ff0000\'>5罐甲烷燃气</font>，回机械室向机械师茜茜汇报！";
            setVisible([3]);
         }
      }
   }
}

