package com.robot.module.task
{
   import com.robot.app.task.control.TaskController_549;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.text.TextField;
   import flash.events.MouseEvent;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class TaskPanel_549 extends Sprite implements IModule
   {
      
      private var _closeBtn:SimpleButton;
      
      private var _mainUI:MainPanel_549;
      
      private var _tipMc:MovieClip;
      
      private var _gotoBtn:SimpleButton;
      
      public function TaskPanel_549()
      {
         super();
      }
      
      public function destroy() : void
      {
         hide();
      }
      
      public function hide() : void
      {
         _mainUI.removeEventListener(Event.FRAME_CONSTRUCTED,onFrameConstructed);
         ToolTipManager.remove(_tipMc);
         _gotoBtn.removeEventListener(MouseEvent.CLICK,onGotoClick);
         _closeBtn.removeEventListener(MouseEvent.CLICK,onCloseClick);
         DisplayUtil.removeForParent(_mainUI);
      }
      
      private function onGotoClick(e:MouseEvent) : void
      {
         hide();
         if(_mainUI.currentFrame == 1)
         {
            MapManager.changeMap(441);
         }
         if(_mainUI.currentFrame == 2)
         {
            MapManager.changeMap(441);
         }
         if(_mainUI.currentFrame == 3)
         {
            MapManager.changeMap(441);
         }
         if(_mainUI.currentFrame == 4)
         {
            MapManager.changeMap(9);
         }
      }
      
      private function onFrameConstructed(event:Event) : void
      {
         for(var i:int = 0; i < _mainUI.numChildren; i++)
         {
            var text:TextField = _mainUI.getChildAt(i) as TextField;
            if(text) text.height = Math.max(text.height,text.textHeight + 4);
         }
      }

      private function onCloseClick(e:MouseEvent) : void
      {
         hide();
      }
      
      public function init(data:Object = null) : void
      {
      }
      
      public function setup() : void
      {
         _mainUI = new MainPanel_549();
         _gotoBtn = _mainUI["goto_btn"];
         _closeBtn = _mainUI["close_btn"];
         _tipMc = _mainUI["tip_mc"];
      }
      
      public function show() : void
      {
         _mainUI.addEventListener(Event.FRAME_CONSTRUCTED,onFrameConstructed);
         _gotoBtn.addEventListener(MouseEvent.CLICK,onGotoClick);
         _closeBtn.addEventListener(MouseEvent.CLICK,onCloseClick);
         TasksManager.getProStatusList(TaskController_549.TASK_ID,function(array:Array):void
         {
            if(!array[0])
            {
               _mainUI.gotoAndStop(1);
               ToolTipManager.add(_tipMc,"捕捉黑影画面");
            }
            else if(Boolean(array[0]) && !array[1])
            {
               _mainUI.gotoAndStop(2);
               ToolTipManager.add(_tipMc,"放置对应的位置");
            }
            else if(Boolean(array[1]) && !array[2])
            {
               _mainUI.gotoAndStop(3);
               ToolTipManager.add(_tipMc,"看看周围吧");
            }
            else
            {
               _mainUI.gotoAndStop(4);
               ToolTipManager.add(_tipMc,"我正在资料室等你");
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

