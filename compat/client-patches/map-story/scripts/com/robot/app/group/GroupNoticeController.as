package com.robot.app.group
{
   import com.robot.core.CommandID;
   import com.robot.core.manager.MainManager;
   import com.robot.core.ui.alert.SimpleAlarm;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   
   public class GroupNoticeController
   {
      
      public static var groupNoticeList:Array = [];
      
      private static var isShow:Boolean = false;
      
      public function GroupNoticeController()
      {
         super();
      }
      
      public static function addMsg(param1:uint, param2:*) : void
      {
         GroupMembItemList.setup();
         groupNoticeList.push({
            "cmdID":param1,
            "info":param2
         });
         if(!isShow)
         {
            show();
         }
      }
      
      private static function show() : void
      {
         var t:uint = 0;
         var msg:String = "";
         var o:Object = groupNoticeList.shift();
         var cmdID:uint = uint(o.cmdID);
         var info:* = o.info;
         switch(cmdID)
         {
            case CommandID.GROUP_INVITE_NOTICE:
               if(info == null)
               {
                  return;
               }
               switch(info.evtType)
               {
                  case 0:
                     break;
                  case 1:
                     msg = "<font color=\'#ffff00\'>" + info.fromUserNick + "</font>取消了对你的邀请";
                     break;
                  case 2:
                     if(info.data == 1)
                     {
                        msg = "<font color=\'#ffff00\'>" + info.fromUserNick + "</font>加入了你的小队";
                     }
                     else
                     {
                        msg = "<font color=\'#ffff00\'>" + info.fromUserNick + "</font>拒绝加入小队";
                     }
                     break;
                  case 5:
                     if(info.data == 1)
                     {
                        msg = "你加入了<font color=\'#ffff00\'>" + info.leaderID + "</font>的小队";
                     }
                     else
                     {
                        msg = "<font color=\'#ffff00\'>" + info.leaderID + "</font>拒绝了你的申请";
                     }
               }
               break;
            case CommandID.MEMB_JOIN_GP_NOTICE:
               if(info.userID == MainManager.actorID)
               {
                  info.userNick = "你";
               }
               msg = "<font color=\'#ffff00\'>" + info.userNick + "</font>加入了小队";
               break;
            case CommandID.QUIT_GROUP_NOTICE:
               if(info.userID == MainManager.actorID)
               {
                  info.userNick = "你";
               }
               msg = "<font color=\'#ffff00\'>" + info.userNick + "</font>退出了小队";
               break;
            case CommandID.New_GROUP_LEADER_NOTICE:
               if(info.leaderID == MainManager.actorID)
               {
                  info.leaderNick = "你";
               }
               msg = "<font color=\'#ffff00\'>" + info.leaderNick + "</font>成为了小队队长";
               break;
            case CommandID.CHG_GROUP_NAME_NOTICE:
               if(info.leaderID == MainManager.actorID)
               {
                  msg = "你已更换队名为<font color=\'#ffff00\'>" + info.groupName + "</font>";
               }
               else
               {
                  msg = "队长已更换队名为<font color=\'#ffff00\'>" + info.groupName + "</font>";
               }
         }
         isShow = true;
         SimpleAlarm.show(msg);
         t = setTimeout(function():void
         {
            clearTimeout(t);
            if(groupNoticeList.length > 0)
            {
               show();
            }
            else
            {
               isShow = false;
            }
         },3000);
      }
   }
}

