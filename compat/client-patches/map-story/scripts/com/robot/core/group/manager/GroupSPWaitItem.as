package com.robot.core.group.manager
{
   import com.robot.core.CommandID;
   import com.robot.core.event.MapEvent;
   import com.robot.core.event.RobotEvent;
   import com.robot.core.info.UserInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
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
   
   public class GroupSPWaitItem extends Sprite
   {
      
      private static var instance:GroupSPWaitItem;
      
      private var _mc:MovieClip;
      
      private var _closeBtn:SimpleButton;
      
      private var _timeMC:MovieClip;
      
      private var _txt:TextField;
      
      private var _info:UserInfo;
      
      private var _timer:Timer;
      
      private var _count:uint = 0;
      
      public function GroupSPWaitItem()
      {
         super();
      }
      
      public static function getInstance() : GroupSPWaitItem
      {
         if(instance == null)
         {
            instance = new GroupSPWaitItem();
         }
         return instance;
      }
      
      public function destroy() : void
      {
         this.removeEvent();
         if(this._mc)
         {
            DisplayUtil.removeAllChild(this._mc);
            DisplayUtil.removeForParent(this._mc);
            DisplayUtil.removeAllChild(this);
         }
         if(this._timer)
         {
            this._timer.stop();
            this._timer = null;
         }
         this._count = 0;
      }
      
      public function setup() : void
      {
         LevelManager.closeMouseEvent();
         this._mc = GroupUiLinkage.getMovieClip("GroupInviteMC");
         this._closeBtn = this._mc["closeBtn"];
         this._timeMC = this._mc["mc"];
         this._timeMC.gotoAndStop(1);
         this._txt = this._mc["txt"];
         this._txt.htmlText = "<font color=\'#ffff00\'>请等待他人一起进行组队</font>";
         this.addChild(this._mc);
         LevelManager.appLevel.addChild(this);
         this.x = 400;
         this.y = 100;
         this._timer = new Timer(1000,15);
         this.addEvent();
      }
      
      private function addEvent() : void
      {
         this._closeBtn.addEventListener(MouseEvent.CLICK,this.onClose);
         MainManager.actorModel.addEventListener(RobotEvent.WALK_START,this.onStartWalk);
         MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,this.onStartChgMap);
      }
      
      private function removeEvent() : void
      {
         this._closeBtn.removeEventListener(MouseEvent.CLICK,this.onClose);
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_START,this.onStartWalk);
         MapManager.removeEventListener(MapEvent.MAP_SWITCH_OPEN,this.onStartChgMap);
         if(this._timer)
         {
            this._timer.removeEventListener(TimerEvent.TIMER,this.onTimer);
         }
      }
      
      public function onClose(param1:MouseEvent = null) : void
      {
         var evt:MouseEvent = param1;
         SocketConnection.addCmdListener(CommandID.GROUP_DOWN_POINT,function(param1:SocketEvent):void
         {
            SocketConnection.removeCmdListener(CommandID.GROUP_DOWN_POINT,arguments.callee);
            LevelManager.openMouseEvent();
            destroy();
         });
         SocketConnection.send(CommandID.GROUP_DOWN_POINT);
      }
      
      private function onTimer(param1:TimerEvent) : void
      {
         ++this._count;
         this._timeMC.gotoAndStop(this._count * 2);
         if(this._count == 15)
         {
            this.onClose();
         }
      }
      
      private function onStartWalk(param1:RobotEvent) : void
      {
         this.onClose();
      }
      
      private function onStartChgMap(param1:MapEvent) : void
      {
         this.onClose();
      }
   }
}

