package com.robot.app.action
{
   import com.robot.app.group.GroupController;
   import com.robot.app.group.GroupListController;
   import com.robot.app.group.GroupUiLinkage;
   import com.robot.core.event.MapEvent;
   import com.robot.core.manager.MapManager;
   import com.robot.core.mode.MapModel;
   import com.robot.core.group.manager.GroupManager;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.UserManager;
   import com.robot.core.mode.BasePeoleModel;
   import com.robot.core.net.SocketConnection;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.ui.Mouse;
   import org.taomee.effect.ColorFilter;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.DisplayUtil;
   
   public class GroupActionManager
   {
      
      private static var subMenu:MovieClip;
      
      private static var inviteJoinBtn:SimpleButton;
      
      private static var createGroupBtn:SimpleButton;
      
      private static var groupListBtn:SimpleButton;
      
      private static var applyBtn:SimpleButton;
      
      private static var curtMC:MovieClip;
      private static var setupDone:Boolean = false;
      
      public function GroupActionManager()
      {
         super();
      }
      
      public static function setEnable(param1:Boolean = true) : void
      {
         if(subMenu == null)
         {
            return;
         }
         if(param1)
         {
            subMenu.mouseChildren = true;
            subMenu.mouseEnabled = true;
            subMenu.filters = [];
         }
         else
         {
            subMenu.mouseChildren = false;
            subMenu.mouseEnabled = false;
            subMenu.filters = [ColorFilter.setGrayscale()];
         }
      }
      
      public static function showMenu() : void
      {
         cancelTargeting();
         if(!setupDone)
         {
            setupDone = true;
            MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,onMapLeave);
         }
         var owner:MapModel = MapManager.currentMap;
         GroupUiLinkage.load(function():void
         {
            if(MapManager.currentMap === owner)
            {
               openMenu();
            }
         });
      }

      private static function onMapLeave(event:MapEvent) : void
      {
         if(subMenu != null)
         {
            hide();
         }
         cancelTargeting();
      }

      private static function cancelTargeting() : void
      {
         if(curtMC == null) return;
         curtMC.removeEventListener(MouseEvent.CLICK,onMcClick);
         curtMC.removeEventListener(Event.ENTER_FRAME,onMcEntFrame);
         DisplayUtil.removeForParent(curtMC);
         curtMC = null;
         Mouse.show();
      }

      private static function openMenu() : void
      {
         if(subMenu == null)
         {
            subMenu = GroupUiLinkage.getMovieClip(GroupUiLinkage.LIB_GROUP_MENU);
            subMenu.x = 430;
            subMenu.y = 410;
            inviteJoinBtn = subMenu["inviteJoinBtn"];
            applyBtn = subMenu["applyJoinBtn"];
            createGroupBtn = subMenu["createGroupBtn"];
            groupListBtn = subMenu["groupListBtn"];
            ToolTipManager.add(inviteJoinBtn,"邀请加入小队");
            ToolTipManager.add(applyBtn,"申请加入小队");
            ToolTipManager.add(createGroupBtn,"我要当队长");
            ToolTipManager.add(groupListBtn,"小队列表");
            inviteJoinBtn.addEventListener(MouseEvent.CLICK,onJoin);
            applyBtn.addEventListener(MouseEvent.CLICK,onJoin);
            createGroupBtn.addEventListener(MouseEvent.CLICK,onSetGroupStatus);
            groupListBtn.addEventListener(MouseEvent.CLICK,showGroupList);
         }
         if(Boolean(GroupManager.isInGroup) && Boolean(MainManager.actorInfo.groupInfo))
         {
            inviteJoinBtn.visible = true;
            applyBtn.visible = false;
            if(MainManager.actorInfo.groupInfo.leaderID != MainManager.actorID)
            {
               inviteJoinBtn.mouseEnabled = false;
               inviteJoinBtn.filters = [ColorFilter.setGrayscale()];
            }
            else
            {
               inviteJoinBtn.mouseEnabled = true;
               inviteJoinBtn.filters = [];
            }
         }
         else
         {
            applyBtn.visible = true;
            inviteJoinBtn.visible = false;
         }
         setIsInGroup(checkIsInGroup());
         if(DisplayUtil.hasParent(subMenu))
         {
            hide();
         }
         else
         {
            LevelManager.toolsLevel.addChild(subMenu);
            MainManager.getStage().addEventListener(MouseEvent.CLICK,onStageClick);
         }
      }
      
      private static function onStageClick(param1:MouseEvent) : void
      {
         if(subMenu.hitTestPoint(param1.stageX,param1.stageY,true) == false)
         {
            hide();
         }
      }
      
      private static function hide() : void
      {
         DisplayUtil.removeForParent(subMenu);
         MainManager.getStage().removeEventListener(MouseEvent.CLICK,onStageClick);
      }
      
      public static function setIsInGroup(param1:Boolean) : void
      {
         if(Boolean(createGroupBtn) && Boolean(groupListBtn))
         {
            if(param1)
            {
               createGroupBtn.visible = false;
               groupListBtn.visible = true;
            }
            else
            {
               createGroupBtn.visible = true;
               groupListBtn.visible = false;
            }
         }
      }
      
      private static function checkIsInGroup() : Boolean
      {
         if(MainManager.actorInfo.groupInfo != null && Boolean(GroupManager.isInGroup))
         {
            return true;
         }
         return false;
      }
      
      private static function onJoin(param1:MouseEvent) : void
      {
         cancelTargeting();
         SocketConnection.send(1020,172);
         hide();
         var _loc2_:SimpleButton = param1.currentTarget as SimpleButton;
         if(_loc2_.name == "inviteJoinBtn")
         {
            curtMC = GroupUiLinkage.getMovieClip(GroupUiLinkage.LIB_GROUP_INVITE_MC);
         }
         else
         {
            curtMC = GroupUiLinkage.getMovieClip(GroupUiLinkage.LIB_GROUP_APPLY_MC);
         }
         LevelManager.appLevel.addChild(curtMC);
         Mouse.hide();
         curtMC.addEventListener(Event.ENTER_FRAME,onMcEntFrame);
         curtMC.addEventListener(MouseEvent.CLICK,onMcClick);
      }
      
      private static function onMcEntFrame(param1:Event) : void
      {
         curtMC.x = MainManager.getStage().mouseX;
         curtMC.y = MainManager.getStage().mouseY;
      }
      
      private static function onMcClick(param1:MouseEvent) : void
      {
         var _loc2_:BasePeoleModel = null;
         curtMC.removeEventListener(MouseEvent.CLICK,onMcClick);
         curtMC.removeEventListener(Event.ENTER_FRAME,onMcEntFrame);
         for each(_loc2_ in UserManager.getUserModelList())
         {
            if(_loc2_)
            {
               if(curtMC.hitTestObject(_loc2_))
               {
                  if(curtMC.name == GroupUiLinkage.LIB_GROUP_INVITE_MC)
                  {
                     GroupController.inviteJoin(_loc2_.info);
                  }
                  else
                  {
                     GroupController.applyJoin(_loc2_.info.userID);
                  }
                  break;
               }
            }
         }
         cancelTargeting();
      }
      
      private static function onSetGroupStatus(param1:MouseEvent) : void
      {
         SocketConnection.send(1020,171);
         hide();
         GroupController.setGroupStatus();
      }
      
      private static function showGroupList(param1:MouseEvent) : void
      {
         hide();
         GroupListController.showGroupList();
      }
   }
}

