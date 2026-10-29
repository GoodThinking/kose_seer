package com.robot.core.group.manager
{
   import com.robot.core.CommandID;
   import com.robot.core.info.UserInfo;
   import com.robot.app.group.GroupUiLinkage;
   import com.robot.core.net.SocketConnection;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.events.TimerEvent;
   import flash.text.TextField;
   import flash.utils.Timer;
   import org.taomee.events.SocketEvent;
   import org.taomee.utils.DisplayUtil;
   
   public class GroupInviteItem extends Sprite
   {
      
      private var _mc:MovieClip;
      
      private var _closeBtn:SimpleButton;
      
      private var _timeMC:MovieClip;
      
      private var _txt:TextField;
      
      private var _info:UserInfo;
      
      private var _timer:Timer;
      
      private var _count:uint = 0;
      
      public function GroupInviteItem(param1:UserInfo)
      {
         super();
         this._info = param1;
         this.init();
      }
      
      public function destroy() : void
      {
         this.removeEvent();
         if(this._mc)
         {
            DisplayUtil.removeAllChild(this._mc);
            DisplayUtil.removeForParent(this._mc);
         }
         if(this._timer)
         {
            this._timer.stop();
            this._timer = null;
         }
         this._count = 0;
      }
      
      private function init() : void
      {
         this._mc = GroupUiLinkage.getMovieClip("GroupInviteMC");
         this._closeBtn = this._mc["closeBtn"];
         this._timeMC = this._mc["mc"];
         this._timeMC.gotoAndStop(1);
         this._txt = this._mc["txt"];
         this._txt.htmlText = "你正在邀请<font color=\'#ffff00\'>" + this._info.nick + "</font>进行组队";
         this.addChild(this._mc);
         this._timer = new Timer(1000,30);
         this._timer.addEventListener(TimerEvent.TIMER,this.onTimer);
         this._timer.start();
         this.addEvent();
      }
      
      private function addEvent() : void
      {
         this._closeBtn.addEventListener(MouseEvent.CLICK,this.onClose);
      }
      
      private function removeEvent() : void
      {
         this._closeBtn.removeEventListener(MouseEvent.CLICK,this.onClose);
         if(this._timer)
         {
            this._timer.removeEventListener(TimerEvent.TIMER,this.onTimer);
         }
      }
      
      public function onClose(param1:MouseEvent = null) : void
      {
         SocketConnection.addCmdListener(CommandID.CANCEL_INVITE_GROUP,this.onCancelInvite);
         SocketConnection.send(CommandID.CANCEL_INVITE_GROUP,this._info.userID);
      }
      
      private function onCancelInvite(param1:SocketEvent) : void
      {
         GroupInviteManager.removeItem(this);
      }
      
      private function onTimer(param1:TimerEvent) : void
      {
         ++this._count;
         this._timeMC.gotoAndStop(this._count);
         if(this._count == 30)
         {
            this.onClose();
         }
      }
      
      public function get info() : UserInfo
      {
         return this._info;
      }
   }
}

