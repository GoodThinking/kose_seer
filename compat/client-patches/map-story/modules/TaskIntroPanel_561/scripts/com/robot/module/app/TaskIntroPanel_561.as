package com.robot.module.app
{
   import com.robot.core.manager.LevelManager;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class TaskIntroPanel_561 extends Sprite implements IModule
   {
      
      private var _closeBTN:SimpleButton;
      
      private var _mainUI:MovieClip;
      
      public function TaskIntroPanel_561()
      {
         super();
      }
      
      public function hide() : void
      {
         DisplayUtil.removeForParent(_mainUI);
         _closeBTN.removeEventListener(MouseEvent.CLICK,onCloseClick);
      }
      
      public function show() : void
      {
         if(!DisplayUtil.hasParent(_mainUI))
         {
            DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
            LevelManager.appLevel.addChild(_mainUI);
            _closeBTN.addEventListener(MouseEvent.CLICK,onCloseClick);
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
         _mainUI = new TaskIntroUI_561();
         _closeBTN = _mainUI["close_btn"];
      }
      
      public function destroy() : void
      {
         hide();
      }
   }
}

