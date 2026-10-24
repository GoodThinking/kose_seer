package com.robot.module.task
{
   import com.robot.app.task.control.TaskController_532;
   import com.robot.app.task.taskscollection.Task532;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class TaskPanel_532 extends Sprite implements IModule
   {
      
      private var _closeBtn:SimpleButton;
      
      private var _mainUI:MainPanel_532;
      
      private var _gotoBtn:SimpleButton;
      
      public function TaskPanel_532()
      {
         super();
      }
      
      public function destroy() : void
      {
         hide();
      }
      
      public function hide() : void
      {
         _gotoBtn.removeEventListener(MouseEvent.CLICK,onGotoClick);
         _closeBtn.removeEventListener(MouseEvent.CLICK,onCloseClick);
         if(_mainUI["image_0"])
         {
            _mainUI["image_0"].removeEventListener(MouseEvent.CLICK,onImageClick);
         }
         if(_mainUI["image_1"])
         {
            _mainUI["image_1"].removeEventListener(MouseEvent.CLICK,onImageClick);
         }
         if(_mainUI["image_2"])
         {
            _mainUI["image_2"].removeEventListener(MouseEvent.CLICK,onImageClick);
         }
         DisplayUtil.removeForParent(_mainUI);
      }
      
      public function setup() : void
      {
         _mainUI = new MainPanel_532();
         _gotoBtn = _mainUI["goto_btn"];
         _closeBtn = _mainUI["close_btn"];
      }
      
      private function onGotoClick(e:MouseEvent) : void
      {
         hide();
         if(_mainUI.currentFrame == 5)
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
      
      public function show() : void
      {
         _gotoBtn.visible = false;
         _gotoBtn.addEventListener(MouseEvent.CLICK,onGotoClick);
         _closeBtn.addEventListener(MouseEvent.CLICK,onCloseClick);
         TasksManager.getProStatusList(TaskController_532.TASK_ID,function(array:Array):void
         {
            if(!array[0] || !array[1] || !array[2])
            {
               if(!array[0] && (MapManager.currentMap.id == 10 || MapManager.currentMap.id == 11 || MapManager.currentMap.id == 12))
               {
                  _mainUI.addEventListener(Event.ENTER_FRAME,function():void
                  {
                     if(_mainUI["image_3"])
                     {
                        _mainUI.removeEventListener(Event.ENTER_FRAME,arguments.callee);
                        _mainUI["image_3"]["num_text"].text = Task532._mushroomNum + "/5";
                     }
                  });
                  _mainUI.gotoAndStop(2);
               }
               else if(!array[1] && MapManager.currentMap.id == 22)
               {
                  _mainUI.gotoAndStop(3);
               }
               else if(!array[2] && MapManager.currentMap.id == 17)
               {
                  _mainUI.addEventListener(Event.ENTER_FRAME,function():void
                  {
                     if(_mainUI["image_5"])
                     {
                        _mainUI.removeEventListener(Event.ENTER_FRAME,arguments.callee);
                        _mainUI["image_5"]["num_text"].text = Task532._pirateNum + "/3";
                     }
                  });
                  _mainUI.gotoAndStop(4);
               }
               else
               {
                  _mainUI.addEventListener(Event.ENTER_FRAME,function():void
                  {
                     if(Boolean(_mainUI["image_0"]) && Boolean(_mainUI["image_1"]) && Boolean(_mainUI["image_2"]))
                     {
                        _mainUI.removeEventListener(Event.ENTER_FRAME,arguments.callee);
                        for(var childIndex:int = 0; childIndex < _mainUI.numChildren; childIndex++)
                        {
                           var description:TextField = _mainUI.getChildAt(childIndex) as TextField;
                           if(description != null)
                           {
                              description.height = Math.max(description.height,description.textHeight + 4);
                           }
                        }
                        _mainUI["image_0"]["icon"].visible = false;
                        _mainUI["image_1"]["icon"].visible = false;
                        _mainUI["image_2"]["icon"].visible = false;
                        if(array[0])
                        {
                           _mainUI["image_0"]["icon"].visible = true;
                        }
                        else
                        {
                           _mainUI["image_0"].buttonMode = true;
                           _mainUI["image_0"].mouseChildren = false;
                           _mainUI["image_0"].addEventListener(MouseEvent.CLICK,onImageClick);
                        }
                        if(array[1])
                        {
                           _mainUI["image_1"]["icon"].visible = true;
                        }
                        else
                        {
                           _mainUI["image_1"].buttonMode = true;
                           _mainUI["image_1"].mouseChildren = false;
                           _mainUI["image_1"].addEventListener(MouseEvent.CLICK,onImageClick);
                        }
                        if(array[2])
                        {
                           _mainUI["image_2"]["icon"].visible = true;
                        }
                        else
                        {
                           _mainUI["image_2"].buttonMode = true;
                           _mainUI["image_2"].mouseChildren = false;
                           _mainUI["image_2"].addEventListener(MouseEvent.CLICK,onImageClick);
                        }
                     }
                  });
                  _mainUI.gotoAndStop(1);
               }
            }
            else
            {
               _gotoBtn.visible = true;
               _mainUI.gotoAndStop(5);
            }
         });
         if(DisplayUtil.hasParent(_mainUI))
         {
            return;
         }
         LevelManager.appLevel.addChild(_mainUI);
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
      }
      
      private function onImageClick(e:MouseEvent) : void
      {
         hide();
         switch(e.target.name)
         {
            case "image_0":
               MapManager.changeMap(12);
               break;
            case "image_1":
               MapManager.changeMap(22);
               break;
            case "image_2":
               MapManager.changeMap(17);
         }
      }
   }
}

