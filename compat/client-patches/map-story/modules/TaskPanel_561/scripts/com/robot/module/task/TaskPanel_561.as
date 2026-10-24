package com.robot.module.task
{
   import com.robot.app.task.control.TaskController_561;
   import com.robot.app.task.taskscollection.Task561;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.geom.Rectangle;
   import flash.text.TextField;
   import org.taomee.effect.ColorFilter;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class TaskPanel_561 extends Sprite implements IModule
   {
      
      private var _tipMc_1:MovieClip;
      
      private var _tipMc_2:MovieClip;
      
      private var _tipMc_3:MovieClip;
      
      private var _tipMc:MovieClip;
      
      private var _closeBtn:SimpleButton;
      
      private var _mainUI:MainPanel_561;
      
      private var _gotoBtn:SimpleButton;
      private var _layoutFrame:int;
      private var _previewObjects:Array = [];
      private var _previewShift:Number = 0;
      private var _gotoShift:Number = 0;
      
      public function TaskPanel_561()
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
         for each(var preview:DisplayObject in _previewObjects)
         {
            preview.y -= _previewShift;
         }
         _previewObjects.length = 0;
         _previewShift = 0;
         _gotoBtn.y -= _gotoShift;
         _gotoShift = 0;
         ToolTipManager.remove(_tipMc);
         ToolTipManager.remove(_tipMc_1);
         ToolTipManager.remove(_tipMc_2);
         ToolTipManager.remove(_tipMc_3);
         _gotoBtn.removeEventListener(MouseEvent.CLICK,onGotoClick);
         _closeBtn.removeEventListener(MouseEvent.CLICK,onCloseClick);
         DisplayUtil.removeForParent(_mainUI);
      }
      
      public function init(data:Object = null) : void
      {
      }
      
      private function onGotoClick(e:MouseEvent) : void
      {
         hide();
         if(_mainUI.currentFrame == 1)
         {
            MapManager.changeMap(460);
         }
         else if(_mainUI.currentFrame == 2)
         {
            MapManager.changeMap(461);
         }
         else if(_mainUI.currentFrame == 3)
         {
            MapManager.changeMap(461);
         }
         else if(_mainUI.currentFrame == 4)
         {
            MapManager.changeMap(462);
         }
         else if(_mainUI.currentFrame == 5)
         {
            MapManager.changeMap(9);
         }
      }

      private function onFrameConstructed(event:Event) : void
      {
         if(_layoutFrame == _mainUI.currentFrame) return;
         if(_mainUI.currentFrame == 2)
         {
            if(!_mainUI["item_1"] || !_mainUI["item_2"] || !_mainUI["item_3"]) return;
            for(var card:int = 1; card <= 3; card++)
            {
               _mainUI["item_" + card].filters = Task561._num[card - 1] ? [] : [ColorFilter.setGrayscale()];
            }
         }
         var textBottom:Number = 0;
         for(var i:int = 0; i < _mainUI.numChildren; i++)
         {
            var text:TextField = _mainUI.getChildAt(i) as TextField;
            if(text)
            {
               text.height = Math.max(text.height,text.textHeight + 4);
               textBottom = Math.max(textBottom,text.y + text.height);
            }
         }
         if(_mainUI.currentFrame == 2 && _previewObjects.length == 0)
         {
            var previewBounds:Rectangle = _tipMc_1.getBounds(_mainUI);
            _previewShift = Math.max(0,textBottom + 4 - previewBounds.y);
            if(_previewShift > 0)
            {
               // Move preview artwork, card icons and matching hit regions together.
               for(i = 0; i < _mainUI.numChildren; i++)
               {
                  var child:DisplayObject = _mainUI.getChildAt(i);
                  if(child is TextField) continue;
                  var bounds:Rectangle = child.getBounds(_mainUI);
                  if(bounds.y >= previewBounds.y && bounds.bottom <= previewBounds.bottom + 1)
                  {
                     child.y += _previewShift;
                     _previewObjects.push(child);
                  }
               }
               _gotoShift = Math.max(0,previewBounds.bottom + _previewShift + 6 - _gotoBtn.getBounds(_mainUI).y);
               _gotoBtn.y += _gotoShift;
            }
         }
         _layoutFrame = _mainUI.currentFrame;
      }
      
      public function setup() : void
      {
         _mainUI = new MainPanel_561();
         _gotoBtn = _mainUI["goto_btn"];
         _closeBtn = _mainUI["close_btn"];
         _tipMc = _mainUI["tip_mc"];
         _tipMc_1 = _mainUI["tip_mc_1"];
         _tipMc_2 = _mainUI["tip_mc_2"];
         _tipMc_3 = _mainUI["tip_mc_3"];
      }
      
      public function show() : void
      {
         _layoutFrame = 0;
         _mainUI.addEventListener(Event.FRAME_CONSTRUCTED,onFrameConstructed);
         _gotoBtn.addEventListener(MouseEvent.CLICK,onGotoClick);
         _closeBtn.addEventListener(MouseEvent.CLICK,onCloseClick);
         _tipMc.mouseEnabled = true;
         _tipMc_1.mouseEnabled = false;
         _tipMc_2.mouseEnabled = false;
         _tipMc_3.mouseEnabled = false;
         TasksManager.getProStatusList(TaskController_561.TASK_ID,function(array:Array):void
         {
            if(!array[0])
            {
               _mainUI.gotoAndStop(1);
               ToolTipManager.add(_tipMc,"通过时空裂口进入");
            }
            else if(Boolean(array[0]) && !array[1])
            {
               _tipMc.mouseEnabled = false;
               _tipMc_1.mouseEnabled = true;
               _tipMc_2.mouseEnabled = true;
               _tipMc_3.mouseEnabled = true;
               _mainUI.gotoAndStop(2);
               ToolTipManager.add(_tipMc_1,"金碧辉煌的堡垒");
               ToolTipManager.add(_tipMc_2,"冰晶暗藏玄机");
               ToolTipManager.add(_tipMc_3,"五颜六色的大树");
            }
            else if(Boolean(array[1]) && !array[2])
            {
               _mainUI.gotoAndStop(3);
               ToolTipManager.add(_tipMc,"右下角地穴入口");
            }
            else if(Boolean(array[2]) && !array[3])
            {
               _mainUI.gotoAndStop(4);
               ToolTipManager.add(_tipMc,"布谷鸟机械钟嘴里的珠子");
            }
            else if(Boolean(array[3]) && !array[4])
            {
               _mainUI.gotoAndStop(5);
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
      
      private function onCloseClick(e:MouseEvent) : void
      {
         hide();
      }
   }
}

