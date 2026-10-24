package com.robot.module.task
{
   import com.robot.app.task.control.TaskController_535;
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
   public class TaskPanel_535 extends Sprite implements IModule
   {
      
      private static const strArr:Array = ["找找四周，可能会有机关哦！","它们到底有什么作用呢？","它会不会是操控宝箱方向的机关呢？","我在资料室等你的好消息"];
      
      private var _closeBtn:SimpleButton;
      
      private var _mainUI:MovieClip;
      
      private var _tipsMC:MovieClip;
      
      private var _goBtn:SimpleButton;
      
      public function TaskPanel_535()
      {
         super();
      }
      
      public function destroy() : void
      {
         hide();
         ToolTipManager.remove(_tipsMC);
         _goBtn.removeEventListener(MouseEvent.CLICK,onGoBtn);
         _closeBtn.removeEventListener(MouseEvent.CLICK,onCloseBtn);
      }
      
      public function hide() : void
      {
         _mainUI.removeEventListener(Event.FRAME_CONSTRUCTED,onFrameReady);
         DisplayUtil.removeForParent(_mainUI);
      }
      
      public function init(data:Object = null) : void
      {
      }
      
      private function onCloseBtn(e:MouseEvent) : void
      {
         hide();
      }
      
      private function onGoBtn(e:MouseEvent) : void
      {
         var mapID:uint = 0;
         switch(_mainUI.currentFrame)
         {
            case 1:
            case 2:
               mapID = 435;
               break;
            case 3:
               mapID = 436;
               break;
            case 4:
               mapID = 9;
         }
         hide();
         MapManager.changeMap(mapID);
      }
      
      public function setup() : void
      {
         _mainUI = new UI_TaskPanel_535();
         _goBtn = _mainUI["goBtn"];
         _closeBtn = _mainUI["closeBtn"];
         _tipsMC = _mainUI["tipsMC"];
         _goBtn.addEventListener(MouseEvent.CLICK,onGoBtn);
         _closeBtn.addEventListener(MouseEvent.CLICK,onCloseBtn);
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
               _tipsMC.y += Math.max(0,description.y + description.height + 8 - _tipsMC.getBounds(_mainUI).y);
            }
         }
      }
      
      public function show() : void
      {
         TasksManager.getProStatusList(TaskController_535.TASK_ID,function(arr:Array):void
         {
            var frameID:uint = 0;
            if(!arr[0])
            {
               frameID = 1;
            }
            else if(!arr[1])
            {
               frameID = 2;
            }
            else if(!arr[2])
            {
               frameID = 3;
            }
            else
            {
               frameID = 4;
            }
            _mainUI.addEventListener(Event.FRAME_CONSTRUCTED,onFrameReady);
            _mainUI.gotoAndStop(frameID);
            _tipsMC.gotoAndStop(frameID);
            ToolTipManager.add(_tipsMC,strArr[frameID - 1]);
            DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
            LevelManager.appLevel.addChild(_mainUI);
         });
      }
   }
}

