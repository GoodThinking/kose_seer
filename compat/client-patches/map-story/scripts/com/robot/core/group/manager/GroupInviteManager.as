package com.robot.core.group.manager
{
   import com.robot.core.CommandID;
   import com.robot.core.event.MapEvent;
   import com.robot.core.group.info.GpInviteNoticeInfo;
   import com.robot.core.info.UserInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.utils.ArrayUtils;
   import flash.display.Sprite;
   import org.taomee.events.SocketEvent;
   import org.taomee.utils.DisplayUtil;
   
   public class GroupInviteManager
   {
      
      private static var itemContainer:Sprite;
      
      private static var gap:Number = 2;
      
      private static var inviteeList:Array = [];
      
      public function GroupInviteManager()
      {
         super();
      }
      
      public static function setup() : void
      {
         if(itemContainer != null) return;
         itemContainer = new Sprite();
         LevelManager.iconLevel.addChild(itemContainer);
         itemContainer.x = 355;
         itemContainer.y = 70;
         MapManager.addEventListener(MapEvent.MAP_SWITCH_COMPLETE,onChgMap);
         SocketConnection.addCmdListener(CommandID.GROUP_INVITE_NOTICE,onInviteNotice);
      }
      
      public static function clear() : void
      {
         var _loc1_:GroupInviteItem = null;
         while(itemContainer.numChildren > 0)
         {
            _loc1_ = itemContainer.getChildAt(0) as GroupInviteItem;
            if(_loc1_)
            {
               removeItem(_loc1_);
            }
         }
      }
      
      public static function addInvitee(param1:UserInfo) : void
      {
         if(ArrayUtils.contains(inviteeList,param1.userID))
         {
            Alarm.show("你不能多次邀请同一个人！");
            return;
         }
         if(inviteeList.length >= 4)
         {
            Alarm.show("不能再同时邀请更多人了！");
            return;
         }
         var _loc2_:GroupInviteItem = new GroupInviteItem(param1);
         _loc2_.name = String(param1.userID);
         addItem(_loc2_);
      }
      
      public static function addItem(param1:GroupInviteItem) : void
      {
         itemContainer.addChild(param1);
         resetChildY();
         inviteeList.push(param1.info.userID);
      }
      
      public static function removeItem(param1:GroupInviteItem) : void
      {
         ArrayUtils.remove(inviteeList,param1.info.userID);
         DisplayUtil.removeForParent(param1);
         param1.destroy();
         resetChildY();
      }
      
      private static function resetChildY() : void
      {
         var _loc2_:GroupInviteItem = null;
         var _loc1_:uint = 0;
         while(_loc1_ < itemContainer.numChildren)
         {
            _loc2_ = itemContainer.getChildAt(_loc1_) as GroupInviteItem;
            if(_loc2_)
            {
               _loc2_.y = _loc1_ * (_loc2_.height + gap);
            }
            _loc1_++;
         }
      }
      
      private static function onInviteNotice(param1:SocketEvent) : void
      {
         var _loc2_:GpInviteNoticeInfo = null;
         var _loc3_:GroupInviteItem = null;
         _loc2_ = param1.data as GpInviteNoticeInfo;
         switch(_loc2_.evtType)
         {
            case 0:
            case 1:
            case 2:
               _loc3_ = itemContainer.getChildByName(_loc2_.fromUserID.toString()) as GroupInviteItem;
               if(_loc3_)
               {
                  removeItem(_loc3_);
               }
         }
      }
      
      private static function onChgMap(param1:MapEvent) : void
      {
         var _loc2_:GroupInviteItem = null;
         while(itemContainer.numChildren > 0)
         {
            _loc2_ = itemContainer.getChildAt(0) as GroupInviteItem;
            if(_loc2_)
            {
               removeItem(_loc2_);
            }
         }
         inviteeList = [];
      }
   }
}

