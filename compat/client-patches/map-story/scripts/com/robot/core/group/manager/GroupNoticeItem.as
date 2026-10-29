package com.robot.core.group.manager
{
   import com.robot.core.manager.LevelManager;
   import com.robot.app.group.GroupUiLinkage;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import org.taomee.utils.DisplayUtil;
   
   public class GroupNoticeItem extends Sprite
   {
      
      private static var instance:GroupNoticeItem;
      
      private var _mc:MovieClip;
      
      private var _closeBtn:SimpleButton;
      
      private var _timeMC:MovieClip;
      
      private var _txt:TextField;
      
      public function GroupNoticeItem()
      {
         super();
      }
      
      public static function getInstance() : GroupNoticeItem
      {
         if(instance == null)
         {
            instance = new GroupNoticeItem();
         }
         return instance;
      }
      
      public function destroy() : void
      {
         this.removeEvent();
         if(this._mc)
         {
            DisplayUtil.removeForParent(this._mc);
         }
      }
      
      public function show(param1:String) : void
      {
         if(!this._mc)
         {
            this._mc = GroupUiLinkage.getMovieClip("GroupInviteMC");
         }
         this._closeBtn = this._mc["closeBtn"];
         this._timeMC = this._mc["mc"];
         this._timeMC.gotoAndStop(1);
         this._txt = this._mc["txt"];
         this._txt.textColor = 16776960;
         this._txt.htmlText = param1;
         LevelManager.topLevel.addChild(this._mc);
         this._mc.x = 400;
         this._mc.y = 50;
         this.addEvent();
      }
      
      private function addEvent() : void
      {
         this._closeBtn.addEventListener(MouseEvent.CLICK,this.onClose);
      }
      
      private function removeEvent() : void
      {
         this._closeBtn.removeEventListener(MouseEvent.CLICK,this.onClose);
      }
      
      public function onClose(param1:MouseEvent = null) : void
      {
         this.destroy();
      }
   }
}

