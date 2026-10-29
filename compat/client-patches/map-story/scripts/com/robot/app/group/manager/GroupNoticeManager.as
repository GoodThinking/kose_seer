package com.robot.app.group.manager
{
   import com.robot.app.action.GroupActionManager;
   import com.robot.app.group.GroupController;
   import com.robot.core.ui.alert.Answer;
   import com.robot.app.group.GroupNoticeController;
   import com.robot.core.CommandID;
   import com.robot.core.config.xml.MapXMLInfo;
   import com.robot.core.config.xml.SeatPointXMLInfo;
   import com.robot.core.event.RobotEvent;
   import com.robot.core.group.info.ApplyJoinInfo;
   import com.robot.core.group.info.ChgGroupNameInfo;
   import com.robot.core.group.info.ChgLeaderInfo;
   import com.robot.core.group.info.GpInviteNoticeInfo;
   import com.robot.core.group.info.GroupInfo;
   import com.robot.core.group.info.MembJoinGpInfo;
   import com.robot.core.group.info.QuitGroupInfo;
   import com.robot.core.group.manager.GroupIDInfoManager;
   import com.robot.core.group.manager.GroupInviteManager;
   import com.robot.core.group.manager.GroupLogoManager;
   import com.robot.core.group.manager.GroupManager;
   import com.robot.core.group.manager.GroupMouseManager;
   import com.robot.core.group.manager.GroupSPWaitItem;
   import com.robot.core.group.point.GroupPointInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.UserManager;
   import com.robot.core.mode.BasePeoleModel;
   import com.robot.core.net.SocketConnection;
   import flash.display.MovieClip;
   import flash.events.Event;
   import flash.events.EventDispatcher;
   import flash.geom.Point;
   import org.taomee.debug.DebugTrace;
   import org.taomee.events.SocketEvent;
   
   public class GroupNoticeManager
   {
      
      public static var membJoinInfo:MembJoinGpInfo;
      
      public static var quitGroupInfo:QuitGroupInfo;
      
      public static var chgLeaderInfo:ChgLeaderInfo;
      
      public static var chgGpNameInfo:GroupInfo;
      
      public static var ivtNoticeInfo:GpInviteNoticeInfo;
      
      public static var newLeaderID:uint;
      
      private static var instance:EventDispatcher;
      private static var setupDone:Boolean = false;
      
      public function GroupNoticeManager()
      {
         super();
      }
      
      public static function setup() : void
      {
         if(setupDone) return;
         setupDone = true;
         SocketConnection.addCmdListener(CommandID.GROUP_INVITE_NOTICE,onInviteNotice);
         SocketConnection.addCmdListener(CommandID.MEMB_JOIN_GP_NOTICE,onMembJoinNotice);
         SocketConnection.addCmdListener(CommandID.QUIT_GROUP_NOTICE,onQuitNotice);
         SocketConnection.addCmdListener(CommandID.CHG_GROUP_NAME_NOTICE,onChgGpNameNotice);
         SocketConnection.addCmdListener(CommandID.GROUP_SEAT_POINT_NOTICE,onStPointNotice);
         SocketConnection.addCmdListener(CommandID.GROUP_DOWN_POINT_NOTICE,onDnPointNotice);
         SocketConnection.addCmdListener(CommandID.APPLY_JOIN_GP_NOTICE,onApplyJoinNotice);
      }
      
      private static function onInviteNotice(param1:SocketEvent) : void
      {
         var _loc3_:GroupInfo = null;
         var _loc2_:GpInviteNoticeInfo = param1.data as GpInviteNoticeInfo;
         ivtNoticeInfo = _loc2_;
         switch(_loc2_.evtType)
         {
            case 0:
               dispatchEvent(new RobotEvent(RobotEvent.INVITE_JOIN_GROUP));
               Answer.show(_loc2_.fromUserNick + "邀请你加入小队，你同意吗？",
                  function():void { GroupController.answerInviteJoin(_loc2_.fromUserID,true); },
                  function():void { GroupController.answerInviteJoin(_loc2_.fromUserID,false); });
               break;
            case 1:
               dispatchEvent(new RobotEvent(RobotEvent.CANCEL_INVITE_GROUP));
               GroupNoticeController.addMsg(CommandID.GROUP_INVITE_NOTICE,_loc2_);
               break;
            case 2:
               if(Boolean(_loc2_.data))
               {
                  if(MainManager.actorInfo.groupInfo.memberList.indexOf(_loc2_.fromUserID) == -1)
                  {
                     MainManager.actorInfo.groupInfo.memberList.push(_loc2_.fromUserID);
                  }
               }
               dispatchEvent(new RobotEvent(RobotEvent.ANSWER_JOIN_GROUP));
               GroupNoticeController.addMsg(CommandID.GROUP_INVITE_NOTICE,_loc2_);
               break;
            case 3:
               _loc3_ = new GroupInfo();
               _loc3_.groupIDInfo = _loc2_.groupIDInfo;
               _loc3_.leaderID = _loc2_.fromUserID;
               _loc3_.memberList = _loc2_.membList;
               GroupLogoManager.setGpLogoInfo(_loc2_.fromUserID,_loc3_);
               break;
            case 4:
               chgLeaderInfo = new ChgLeaderInfo();
               chgLeaderInfo.groupIDInfo = _loc2_.groupIDInfo;
               chgLeaderInfo.leaderID = _loc2_.fromUserID;
               chgLeaderInfo.leaderNick = _loc2_.fromUserNick;
               chgLeaderInfo.oldLeaderID = uint(_loc2_.data);
               onNewLeaderNotice(chgLeaderInfo);
               break;
            case 5:
               applicantJoinGroup(_loc2_);
               GroupNoticeController.addMsg(CommandID.GROUP_INVITE_NOTICE,_loc2_);
         }
      }
      
      private static function onMembJoinNotice(param1:SocketEvent) : void
      {
         var _loc2_:uint = 0;
         var _loc4_:GroupInfo = null;
         var _loc5_:Array = null;
         membJoinInfo = param1.data as MembJoinGpInfo;
         for each(_loc2_ in membJoinInfo.membList)
         {
            if(_loc2_ == MainManager.actorID)
            {
               if(MainManager.actorInfo.groupInfo == null)
               {
                  _loc4_ = new GroupInfo();
                  MainManager.actorInfo.groupInfo = _loc4_;
               }
               GroupManager.isInGroup = true;
               GroupActionManager.setIsInGroup(true);
               MainManager.actorInfo.groupInfo.groupIDInfo = membJoinInfo.groupIDInfo;
               MainManager.actorInfo.groupInfo.leaderID = membJoinInfo.leaderID;
               MainManager.actorInfo.groupInfo.memberList = membJoinInfo.membList;
            }
         }
         if(GroupIDInfoManager.checkIsSelfGp(membJoinInfo.groupIDInfo))
         {
            if(MainManager.actorInfo.groupInfo)
            {
               MainManager.actorInfo.groupInfo.memberList = membJoinInfo.membList;
            }
            GroupNoticeController.addMsg(CommandID.MEMB_JOIN_GP_NOTICE,membJoinInfo);
         }
         var _loc3_:GroupInfo = new GroupInfo();
         _loc3_.groupIDInfo = membJoinInfo.groupIDInfo;
         _loc3_.leaderID = membJoinInfo.leaderID;
         _loc3_.memberList = membJoinInfo.membList;
         GroupLogoManager.setGpLogoInfo(membJoinInfo.userID,_loc3_);
      }
      
      private static function onQuitNotice(param1:SocketEvent) : void
      {
         var _loc3_:int = 0;
         quitGroupInfo = param1.data as QuitGroupInfo;
         if(GroupIDInfoManager.checkIsSelfGp(quitGroupInfo.groupIDInfo))
         {
            if(quitGroupInfo.userID == MainManager.actorID)
            {
               GroupActionManager.setIsInGroup(false);
               GroupManager.isInGroup = false;
               MainManager.actorInfo.groupInfo = null;
               GroupInviteManager.clear();
               GroupMouseManager.openMouseEvent();
            }
            else
            {
               MainManager.actorInfo.groupInfo.leaderID = quitGroupInfo.leaderID;
               _loc3_ = int(MainManager.actorInfo.groupInfo.memberList.indexOf(quitGroupInfo.userID));
               if(_loc3_ != -1)
               {
                  MainManager.actorInfo.groupInfo.memberList.splice(_loc3_,1);
               }
               MainManager.actorModel.showGroupLogo();
            }
            dispatchEvent(new RobotEvent(RobotEvent.QUIT_GROUP));
            GroupNoticeController.addMsg(CommandID.QUIT_GROUP_NOTICE,quitGroupInfo);
         }
         var _loc2_:GroupInfo = new GroupInfo();
         _loc2_.leaderID = quitGroupInfo.leaderID;
         GroupLogoManager.setGpLogoInfo(quitGroupInfo.userID,new GroupInfo());
      }
      
      private static function onNewLeaderNotice(param1:ChgLeaderInfo) : void
      {
         if(GroupIDInfoManager.checkIsSelfGp(chgLeaderInfo.groupIDInfo))
         {
            MainManager.actorInfo.groupInfo.leaderID = chgLeaderInfo.leaderID;
            MainManager.actorInfo.groupInfo.memberList = MainManager.actorInfo.groupInfo.memberList;
            dispatchEvent(new RobotEvent(RobotEvent.NEW_LEADER_GROUP));
            GroupNoticeController.addMsg(CommandID.New_GROUP_LEADER_NOTICE,param1);
         }
         var _loc2_:GroupInfo = new GroupInfo();
         _loc2_.groupIDInfo = chgLeaderInfo.groupIDInfo;
         _loc2_.leaderID = chgLeaderInfo.leaderID;
         var _loc3_:BasePeoleModel = UserManager.getUserModel(chgLeaderInfo.leaderID);
         if(!_loc3_)
         {
            _loc3_ = UserManager.getUserModel(chgLeaderInfo.oldLeaderID);
         }
         if(_loc3_ != null && _loc3_.info.groupInfo != null)
         {
            _loc2_.memberList = _loc3_.info.groupInfo.memberList;
            GroupLogoManager.setGpLogoInfo(chgLeaderInfo.oldLeaderID,_loc2_);
            GroupLogoManager.setGpLogoInfo(chgLeaderInfo.leaderID,_loc2_);
         }
      }
      
      private static function onChgGpNameNotice(param1:SocketEvent) : void
      {
         var _loc2_:ChgGroupNameInfo = param1.data as ChgGroupNameInfo;
         chgGpNameInfo = new GroupInfo();
         chgGpNameInfo.leaderID = _loc2_.leaderID;
         chgGpNameInfo.groupName = _loc2_.groupName;
         if(GroupIDInfoManager.checkIsSelfGp(_loc2_.groupIDInfo))
         {
            dispatchEvent(new RobotEvent(RobotEvent.NEW_GROUP_NAME));
            GroupNoticeController.addMsg(CommandID.CHG_GROUP_NAME_NOTICE,_loc2_);
         }
         GroupLogoManager.setGpLogoInfo(MainManager.actorID,chgGpNameInfo);
         GroupLogoManager.setGpLogoInfo(_loc2_.leaderID,chgGpNameInfo);
      }
      
      private static function applicantJoinGroup(param1:GpInviteNoticeInfo) : void
      {
         if(param1.data == 1)
         {
            GroupManager.isInGroup = true;
            GroupActionManager.setIsInGroup(true);
            MainManager.actorInfo.groupInfo.groupIDInfo = param1.groupIDInfo;
            MainManager.actorInfo.groupInfo.leaderID = param1.leaderID;
            MainManager.actorInfo.groupInfo.memberList = param1.membList;
         }
      }
      
      private static function onStPointNotice(param1:SocketEvent) : void
      {
         var _loc4_:MovieClip = null;
         var _loc2_:GroupPointInfo = param1.data as GroupPointInfo;
         var _loc3_:BasePeoleModel = UserManager.getUserModel(_loc2_.userID);
         DebugTrace.show("stPointInfo.userID---->" + _loc2_.userID);
         if(_loc3_)
         {
            if(_loc3_.info.groupInfo)
            {
               _loc3_.info.groupInfo.sctID = _loc2_.sctID;
               _loc3_.info.groupInfo.pointID = _loc2_.pointID;
            }
            else
            {
               _loc3_.info.groupInfo = new GroupInfo();
               _loc3_.info.groupInfo.sctID = _loc2_.sctID;
               _loc3_.info.groupInfo.pointID = _loc2_.pointID;
            }
            _loc4_ = SeatPointXMLInfo.getSeatPointMC(MapManager.currentMap.id,_loc2_.sctID,_loc2_.pointID);
            if(_loc4_)
            {
               _loc4_.buttonMode = false;
               _loc4_.mouseEnabled = false;
            }
            _loc3_.walkAction(new Point(_loc4_.x,_loc4_.y),false);
         }
         if(_loc2_.userID == MainManager.actorID && _loc2_.sctID != 0)
         {
            GroupSPWaitItem.getInstance().setup();
         }
         GroupSeatPointManager.checkIsToGroup(_loc2_.sctID);
      }
      
      private static function onDnPointNotice(param1:SocketEvent) : void
      {
         var _loc2_:GroupPointInfo = param1.data as GroupPointInfo;
         var _loc3_:MovieClip = SeatPointXMLInfo.getSeatPointMC(MapManager.currentMap.id,_loc2_.sctID,_loc2_.pointID);
         if(_loc3_)
         {
            _loc3_.buttonMode = true;
            _loc3_.mouseEnabled = true;
         }
         var _loc4_:BasePeoleModel = UserManager.getUserModel(_loc2_.userID);
         if(_loc4_)
         {
            if(_loc4_.info.groupInfo)
            {
               _loc4_.info.groupInfo.sctID = 0;
               _loc4_.info.groupInfo.pointID = 0;
            }
            else
            {
               _loc4_.info.groupInfo = new GroupInfo();
               _loc4_.info.groupInfo.sctID = 0;
               _loc4_.info.groupInfo.pointID = 0;
            }
            _loc4_.walkAction(MapXMLInfo.getDefaultPos(MapManager.currentMap.id),false);
         }
         if(_loc2_.userID == MainManager.actorID)
         {
            GroupSPWaitItem.getInstance().destroy();
            LevelManager.openMouseEvent();
         }
      }
      
      private static function onApplyJoinNotice(param1:SocketEvent) : void
      {
         var _loc2_:ApplyJoinInfo = param1.data as ApplyJoinInfo;
         Answer.show(_loc2_.applierNick + "申请加入你的小队，你同意吗？",
            function():void { GroupController.answerApplyJoin(_loc2_.applierID,true); },
            function():void { GroupController.answerApplyJoin(_loc2_.applierID,false); });
      }
      
      private static function getInstance() : EventDispatcher
      {
         if(instance == null)
         {
            instance = new EventDispatcher();
         }
         return instance;
      }
      
      public static function addEventListener(param1:String, param2:Function, param3:Boolean = false, param4:int = 0, param5:Boolean = false) : void
      {
         getInstance().addEventListener(param1,param2,param3,param4,param5);
      }
      
      public static function removeEventListener(param1:String, param2:Function, param3:Boolean = false) : void
      {
         getInstance().removeEventListener(param1,param2,param3);
      }
      
      public static function dispatchEvent(param1:Event) : void
      {
         getInstance().dispatchEvent(param1);
      }
      
      public static function hasEventListener(param1:String) : Boolean
      {
         return getInstance().hasEventListener(param1);
      }
      
      public static function willTrigger(param1:String) : Boolean
      {
         return getInstance().willTrigger(param1);
      }
   }
}

