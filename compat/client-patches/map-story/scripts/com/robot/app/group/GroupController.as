package com.robot.app.group
{
   import com.robot.app.action.GroupActionManager;
   import com.robot.app.group.cmd.GroupFightCmdListener;
   import com.robot.app.group.manager.GroupNoticeManager;
   import com.robot.core.group.cmd.GroupChgMapCmdListener;
   import com.robot.core.group.info.*;
   import flash.utils.Dictionary;
   import flash.utils.ByteArray;
   import org.taomee.tmf.TMF;
   import com.robot.core.CommandID;
   import com.robot.core.group.info.AnswerJoinGpInfo;
   import com.robot.core.group.info.GroupIDInfo;
   import com.robot.core.group.info.GroupInfo;
   import com.robot.core.group.manager.GroupInviteManager;
   import com.robot.core.group.manager.GroupManager;
   import com.robot.core.info.UserInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.TaskIconManager;
   import com.robot.core.manager.UIManager;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.manager.ToolTipManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import flash.utils.Timer;
   import org.taomee.events.SocketEvent;
   
   public class GroupController
   {
      
      public static var gpInfo:GroupInfo;
      
      private static var cancelTimer:Timer;
      
      private static var pendingInvitees:Dictionary = new Dictionary();
      private static var setupDone:Boolean = false;
      
      public static var isInGroup:Boolean = false;
      
      public static var gpStatus:uint = 1;
      
      private static var memberList:Array = [];
      
      public function GroupController()
      {
         super();
      }

      public static function setup() : void
      {
         if(setupDone) return;
         setupDone = true;
         TMF.registerClass(CommandID.STATUS_INOUT_GROUP,GroupIDInfo);
         TMF.registerClass(CommandID.REPLY_JOIN_GROUP,AnswerJoinGpInfo);
         TMF.registerClass(CommandID.QUIT_GROUP_NOTICE,QuitGroupInfo);
         TMF.registerClass(CommandID.MEMB_JOIN_GP_NOTICE,MembJoinGpInfo);
         TMF.registerClass(CommandID.GROUP_INVITE_NOTICE,GpInviteNoticeInfo);
         TMF.registerClass(CommandID.CHG_GROUP_NAME_NOTICE,ChgGroupNameInfo);
         TMF.registerClass(CommandID.APPLY_JOIN_GP_NOTICE,ApplyJoinInfo);
         TMF.registerClass(CommandID.ANSWER_APPLY_JOIN_GP,AnswerJoinGpInfo);
         TMF.registerClass(CommandID.GROUP_CHANGE_MAP,GroupChgMapInfo);
         GroupNoticeManager.setup();
         GroupInviteManager.setup();
         new GroupChgMapCmdListener().setup();
         new GroupFightCmdListener().setup();
         var groupIcon:Sprite = UIManager.getSprite("ComposeMC");
         groupIcon.name = "nativeTrainingParty";
         groupIcon.scaleX = groupIcon.scaleY = 0.5;
         groupIcon.buttonMode = true;
         groupIcon.mouseChildren = false;
         ToolTipManager.add(groupIcon,"小队");
         groupIcon.addEventListener(MouseEvent.CLICK,onGroupIconClick);
         TaskIconManager.addIcon(groupIcon);
      }

      private static function onGroupIconClick(event:MouseEvent) : void
      {
         event.stopImmediatePropagation();
         GroupActionManager.showMenu();
      }
      
      public static function inviteJoin(param1:UserInfo) : void
      {
         pendingInvitees[param1.userID] = param1;
         SocketConnection.addCmdListener(CommandID.INVITE_JOIN_GROUP,onJoinGroup);
         SocketConnection.send(CommandID.INVITE_JOIN_GROUP,param1.userID);
      }
      
      private static function onJoinGroup(param1:SocketEvent) : void
      {
         var userID:uint = ByteArray(param1.data).readUnsignedInt();
         var invitee:UserInfo = pendingInvitees[userID];
         delete pendingInvitees[userID];
         GroupInviteManager.addInvitee(invitee);
      }
      
      public static function cancelInviteGp(param1:uint) : void
      {
         SocketConnection.send(CommandID.CANCEL_INVITE_GROUP,param1);
      }
      
      public static function answerInviteJoin(param1:uint, param2:Boolean) : void
      {
         SocketConnection.addCmdListener(CommandID.REPLY_JOIN_GROUP,onAnswerInviteJoin);
         if(param2)
         {
            SocketConnection.send(CommandID.REPLY_JOIN_GROUP,param1,1);
         }
         else
         {
            SocketConnection.send(CommandID.REPLY_JOIN_GROUP,param1,0);
         }
      }
      
      private static function onAnswerInviteJoin(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.REPLY_JOIN_GROUP,onAnswerInviteJoin);
         memberList = [];
         var _loc2_:AnswerJoinGpInfo = param1.data as AnswerJoinGpInfo;
         if(_loc2_.leaderID == 0 || _loc2_.membList.length == 0)
         {
            return;
         }
         memberList = _loc2_.membList.concat();
         var _loc3_:GroupInfo = new GroupInfo();
         _loc3_.groupIDInfo = _loc2_.groupIDInfo;
         _loc3_.leaderID = _loc2_.leaderID;
         _loc3_.memberList = memberList;
         MainManager.actorInfo.groupInfo = _loc3_;
         GroupManager.isInGroup = true;
         GroupActionManager.setIsInGroup(true);
         Alarm.show("你已经成功加入了小队");
      }
      
      public static function setGroupStatus(param1:Function = null) : void
      {
         var fun:Function = param1;
         SocketConnection.addCmdListener(CommandID.STATUS_INOUT_GROUP,function(param1:SocketEvent):void
         {
            SocketConnection.removeCmdListener(CommandID.STATUS_INOUT_GROUP,arguments.callee);
            var _loc3_:GroupIDInfo = param1.data as GroupIDInfo;
            Alarm.show("你已经光荣的成为<font color=\'#ff0000\'>队长</font>了,你可以邀请别人加入你的小队!");
            memberList = [MainManager.actorID];
            var _loc4_:GroupInfo = new GroupInfo();
            _loc4_.groupIDInfo = _loc3_;
            MainManager.actorInfo.groupInfo = _loc4_;
            GroupManager.isInGroup = true;
            _loc4_.leaderID = MainManager.actorID;
            _loc4_.memberList = memberList;
            GroupActionManager.setIsInGroup(true);
            GroupMembItemList.setup();
            MainManager.actorModel.showGroupLogo();
            if(fun != null)
            {
               fun();
            }
         });
         SocketConnection.send(CommandID.STATUS_INOUT_GROUP,1);
      }
      
      public static function quitGroup() : void
      {
         SocketConnection.send(CommandID.QUIT_GROUP);
      }
      
      private static function onQuitGroup(param1:SocketEvent) : void
      {
         GroupManager.isInGroup = false;
         MainManager.actorInfo.groupInfo = null;
         GroupActionManager.setIsInGroup(false);
         GroupInviteManager.clear();
         GroupMembItemList.setup();
      }
      
      public static function seatPoint(param1:uint, param2:uint) : void
      {
         SocketConnection.send(CommandID.GROUP_SEAT_POINT,param1,param2);
      }
      
      public static function downPoint() : void
      {
         SocketConnection.send(CommandID.GROUP_DOWN_POINT);
      }
      
      public static function seatPointToGroup() : void
      {
         SocketConnection.send(CommandID.SEAT_POINT_TO_GROUP);
      }
      
      public static function applyJoin(param1:uint) : void
      {
         SocketConnection.send(CommandID.APPLY_JOIN_GROUP,param1);
      }
      
      public static function answerApplyJoin(param1:uint, param2:Boolean = false) : void
      {
         if(param2)
         {
            SocketConnection.send(CommandID.ANSWER_APPLY_JOIN_GP,param1,1);
         }
         else
         {
            SocketConnection.send(CommandID.ANSWER_APPLY_JOIN_GP,param1,0);
         }
      }
   }
}

