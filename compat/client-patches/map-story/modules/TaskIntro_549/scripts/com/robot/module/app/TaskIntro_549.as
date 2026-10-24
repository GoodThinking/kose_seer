package com.robot.module.app
{
   import com.robot.app.task.taskscollection.Task549;
   import com.robot.core.manager.LevelManager;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(width="500", height="375", backgroundColor="#ffffff", frameRate="24")]
   public class TaskIntro_549 extends Sprite implements IModule
   {
      
      private var _mainUI:MovieClip;
      
      private var _closeBTN:SimpleButton;
      
      public function TaskIntro_549()
      {
         super();
      }
      
      public function init(data:Object = null) : void
      {
      }
      
      public function setup() : void
      {
         this._mainUI = new TaskIntroUI_549();
         this._closeBTN = this._mainUI["close_btn"];
      }
      
      public function show() : void
      {
         if(!DisplayUtil.hasParent(this._mainUI))
         {
            DisplayUtil.align(this._mainUI,null,AlignType.MIDDLE_CENTER);
            LevelManager.appLevel.addChild(this._mainUI);
            this._closeBTN.addEventListener(MouseEvent.CLICK,this.onCloseClick);
         }
      }
      
      private function onCloseClick(e:MouseEvent) : void
      {
         this.hide();
      }
      
      public function hide() : void
      {
         DisplayUtil.removeForParent(this._mainUI);
         this._closeBTN.removeEventListener(MouseEvent.CLICK,this.onCloseClick);
         Task549.tipDialog();
      }
      
      public function destroy() : void
      {
         DisplayUtil.removeForParent(this._mainUI);
         this._closeBTN.removeEventListener(MouseEvent.CLICK,this.onCloseClick);
      }
   }
}

