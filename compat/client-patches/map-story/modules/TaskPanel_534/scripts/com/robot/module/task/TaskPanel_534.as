package com.robot.module.task
{
   import com.robot.app.task.control.TaskController_534;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class TaskPanel_534 extends Sprite implements IModule
   {
      
      private var _closeBtn:SimpleButton;
      
      private var _mainUI:MainPanel_534;
      
      private var _tipMc:MovieClip;
      
      private var _gotoBtn:SimpleButton;
      
      public function TaskPanel_534()
      {
         super();
      }
      
      public function destroy() : void
      {
         hide();
      }
      
      public function hide() : void
      {
         _mainUI.removeEventListener(Event.FRAME_CONSTRUCTED,onFrameReady);
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
            MapManager.changeMap(437);
         }
         if(_mainUI.currentFrame == 2)
         {
            MapManager.changeMap(438);
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
      
      public function setup() : void
      {
         _mainUI = new MainPanel_534();
         _gotoBtn = _mainUI["goto_btn"];
         _closeBtn = _mainUI["close_btn"];
         _tipMc = _mainUI["tip_mc"];
      }

      private function onFrameReady(event:Event) : void
      {
         _mainUI.removeEventListener(Event.FRAME_CONSTRUCTED,onFrameReady);
         for(var childIndex:int = 0; childIndex < _mainUI.numChildren; childIndex++)
         {
            var description:TextField = _mainUI.getChildAt(childIndex) as TextField;
            if(description != null)
            {
               description.height = Math.max(description.height,description.textHeight + 4);
            }
         }
      }
      
      public function show() : void
      {
         _gotoBtn.addEventListener(MouseEvent.CLICK,onGotoClick);
         _closeBtn.addEventListener(MouseEvent.CLICK,onCloseClick);
         TasksManager.getProStatusList(TaskController_534.TASK_ID,function(array:Array):void
         {
            _mainUI.addEventListener(Event.FRAME_CONSTRUCTED,onFrameReady);
            if(!array[0])
            {
               _mainUI.gotoAndStop(1);
               ToolTipManager.add(_tipMc,"找找四周，可能会有机关哦");
            }
            else if(Boolean(array[0]) && !array[1])
            {
               _mainUI.gotoAndStop(2);
               ToolTipManager.add(_tipMc,"注意躲避她的视线");
            }
            else
            {
               _mainUI.gotoAndStop(3);
               ToolTipManager.add(_tipMc,"去资料室找爱丽丝吧");
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

