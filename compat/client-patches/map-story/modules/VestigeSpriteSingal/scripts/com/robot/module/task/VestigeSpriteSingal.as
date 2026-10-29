package com.robot.module.task
{
   import com.robot.app.task.control.TaskController_28;
   import com.robot.core.config.xml.TasksXMLInfo;
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
   public class VestigeSpriteSingal extends Sprite implements IModule
   {
      
      private var _introTxt:TextField;
      
      private var complete_icon0:MovieClip;
      
      private var complete_icon1:MovieClip;
      
      private var _iconMCArr:Array = [];
      
      private var _closeBtn:SimpleButton;
      
      private var icon_0:MovieClip;
      
      private var icon_1:MovieClip;
      
      private var _mainUI:MovieClip;
      
      public function VestigeSpriteSingal()
      {
         super();
      }
      
      public function hide() : void
      {
         DisplayUtil.removeForParent(_mainUI);
      }
      
      public function setup() : void
      {
         var i:MovieClip = null;
         _mainUI = new ui_VestigeSpriteSingal_main();
         _closeBtn = _mainUI["closeBtn"];
         _closeBtn.addEventListener(MouseEvent.CLICK,onClose);
         _introTxt = _mainUI["introTxt"];
         _introTxt.wordWrap = true;
         icon_0 = _mainUI["icon_0"];
         icon_1 = _mainUI["icon_1"];
         icon_1.visible = false;
         complete_icon0 = icon_0["complete_icon"];
         complete_icon0.visible = false;
         complete_icon1 = icon_1["complete_icon"];
         complete_icon1.visible = false;
         _iconMCArr = [icon_0,icon_1];
         var count:uint = 0;
         for each(i in _iconMCArr)
         {
            ToolTipManager.add(i,TasksXMLInfo.getProName(TaskController_28.TASK_ID,count));
            count++;
         }
      }
      
      public function init(data:Object = null) : void
      {
      }
      
      private function onClose(evt:MouseEvent) : void
      {
         hide();
      }
      
      private function changeTaskStatus(arr:Array) : void
      {
         if(!_mainUI || !DisplayUtil.hasParent(_mainUI)) return;
         icon_1.visible = false;
         _introTxt.htmlText = "    根据精灵探测仪信号表明，在<font color=\'#ff0000\'>赫尔卡星</font>可能会有精灵存在，由于信号实在很异常，无法确定具体位置能不能找到它就靠你自己了。";
         if(arr[0])
         {
            icon_1.visible = true;
            complete_icon0.visible = true;
            icon_0.x = 72;
            _introTxt.htmlText = "    传说在<font color=\'#ff0000\'>赫尔卡星</font>的某个地方藏有机械精灵的拼装图纸，快去找找看，可能对我们拼装精灵有所帮助！";
         }
         if(arr[1])
         {
            icon_1.visible = true;
            complete_icon0.visible = true;
            complete_icon1.visible = true;
            icon_0.x = 72;
            _introTxt.htmlText = "    万事俱备了，快回<font color=\'#ff0000\'>实验室</font>吧，这个拥有悠久历史的机械精灵即将揭开它神秘的面纱。";
         }
      }
      
      private function initEvent() : void
      {
         TasksManager.getProStatusList(TaskController_28.TASK_ID,changeTaskStatus);
      }
      
      public function destroy() : void
      {
         if(!_mainUI) return;
         hide();
         _closeBtn.removeEventListener(MouseEvent.CLICK,onClose);
         for each(var icon:MovieClip in _iconMCArr) ToolTipManager.remove(icon);
         _iconMCArr.length = 0;
         _mainUI = null;
         _closeBtn = null;
         _introTxt = null;
         icon_0 = null;
         icon_1 = null;
         complete_icon0 = null;
         complete_icon1 = null;
      }
      
      public function show() : void
      {
         if(DisplayUtil.hasParent(_mainUI))
         {
            return;
         }
         LevelManager.appLevel.addChild(_mainUI);
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
         initEvent();
      }
   }
}

