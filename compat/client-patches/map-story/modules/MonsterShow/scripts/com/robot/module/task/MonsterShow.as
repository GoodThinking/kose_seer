package com.robot.module.task
{
   import com.robot.core.manager.LevelManager;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.utils.Timer;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class MonsterShow extends Sprite implements IModule
   {
      
      private var _timer:Timer;
      
      private var _mainPanel:Monster_Show;
      
      public function MonsterShow()
      {
         super();
      }
      
      public function hide() : void
      {
         DisplayUtil.removeForParent(_mainPanel);
         this.loaderInfo.sharedEvents.dispatchEvent(new Event("MONSTERSHOWCLOSE"));
      }
      
      public function show() : void
      {
         LevelManager.topLevel.addChild(_mainPanel);
         DisplayUtil.align(_mainPanel,null,AlignType.MIDDLE_CENTER);
      }
      
      public function init(data:Object = null) : void
      {
      }
      
      private function onCloseHandler(e:MouseEvent = null) : void
      {
         hide();
      }
      
      public function setup() : void
      {
         _mainPanel = new Monster_Show();
         _mainPanel["close_btn"].addEventListener(MouseEvent.CLICK,onCloseHandler);
      }
      
      public function destroy() : void
      {
         if(_mainPanel == null) return;
         this.hide();
         _mainPanel["close_btn"].removeEventListener(MouseEvent.CLICK,onCloseHandler);
         _mainPanel = null;
      }
   }
}

