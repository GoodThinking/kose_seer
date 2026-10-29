package com.robot.app.group.cmd
{
   import com.robot.app.fightNote.FightWaitPanel;
   import com.robot.app.group.GroupFightWaitPanel;
   import com.robot.core.CommandID;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.event.MCLoadEvent;
   import com.robot.core.event.MapEvent;
   import com.robot.core.event.PetEvent;
   import com.robot.core.group.fightInfo.readyToFight.GroupReadyToFightInfo;
   import com.robot.core.group.fightInfo.fightOver.GroupFightOverInfo;
   import com.robot.core.group.fightInfo.fighting.GpFtRelateNoticeInfo;
   import com.robot.core.group.fightInfo.fighting.GpFtSpriteNoticeInfo;
   import com.robot.core.group.fightInfo.fighting.GroupChgPetInfo;
   import com.robot.core.group.fightInfo.fighting.dieSprite.SpriteDieListInfo;
   import com.robot.core.group.fightInfo.fighting.item.GroupUseItemInfo;
   import com.robot.core.group.fightInfo.fighting.skill.GpFtSkillHurtInfo;
   import com.robot.core.group.fightInfo.startFight.GroupFightStartInfo;
   import com.robot.core.group.model.GroupFightModel;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.manager.bean.BaseBeanController;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.newloader.MCLoader;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.loading.Loading;
   import flash.events.Event;
   import flash.system.ApplicationDomain;
   import flash.utils.ByteArray;
   import flash.utils.getDefinitionByName;
   import org.taomee.events.SocketEvent;
   import org.taomee.tmf.TMF;

   public class GroupFightCmdListener extends BaseBeanController
   {
      private static var setupDone:Boolean = false;
      private static const DLL_PATH:String = "com.robot.groupFight.GroupFightDLL";
      private var readyData:GroupReadyToFightInfo;
      private var loader:MCLoader;

      public function GroupFightCmdListener()
      {
         super();
      }

      override public function start() : void
      {
         setup();
         finish();
      }

      public function setup() : void
      {
         if(setupDone) return;
         setupDone = true;
         TMF.registerClass(CommandID.GROUP_READY_TO_FIGHT,GroupReadyToFightInfo);
         TMF.registerClass(CommandID.GROUP_START_FIGHT,GroupFightStartInfo);
         TMF.registerClass(CommandID.GROUP_FT_SKILL_HURT,GpFtSkillHurtInfo);
         TMF.registerClass(CommandID.GROUP_FT_OVER,GroupFightOverInfo);
         TMF.registerClass(CommandID.GROUP_FT_SPRITE_DIE,SpriteDieListInfo);
         TMF.registerClass(CommandID.GROUP_FT_USE_ITEM,GroupUseItemInfo);
         TMF.registerClass(CommandID.GROUP_FT_CHG_PET_SUC,GroupChgPetInfo);
         TMF.registerClass(CommandID.GROUP_FT_SPRITE_NOTICE,GpFtSpriteNoticeInfo);
         TMF.registerClass(CommandID.GROUP_FT_RELATION_NOTICE,GpFtRelateNoticeInfo);
         SocketConnection.addCmdListener(CommandID.NOTICE_MEMBER_JOIN_FIGHT,this.groupMembJoin);
         SocketConnection.addCmdListener(CommandID.GROUP_READY_TO_FIGHT,this.groupReadyToFight);
      }

      private function groupMembJoin(event:SocketEvent) : void
      {
         var type:uint = (event.data as ByteArray).readUnsignedInt();
         if(type == 3)
         {
            GroupFightModel.status = GroupFightModel.FIGHT_WITH_NPC;
            GroupFightModel.mode = GroupFightModel.MULTI_MODE;
         }
         else if(type == 4) GroupFightModel.status = GroupFightModel.FIGHT_WITH_BOSS;
         else if(type == 5 || type == 6)
         {
            GroupFightModel.status = GroupFightModel.FIGHT_WITH_PLAYER;
            GroupFightModel.mode = type;
            GroupFightWaitPanel.show(false);
         }
         SocketConnection.send(CommandID.GROUP_MEMB_JOIN_FIGHT);
      }

      private function groupReadyToFight(event:SocketEvent) : void
      {
         if(readyData != null) return;
         readyData = event.data as GroupReadyToFightInfo;
         GroupFightModel.mode = readyData.model;
         GroupFightWaitPanel.hide();
         FightWaitPanel.hide();
         MainManager.actorModel.stop();
         LevelManager.closeMouseEvent();
         MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,this.onCancel);
         SocketConnection.mainSocket.addEventListener(Event.CLOSE,this.onCancel);
         SocketConnection.addCmdListener(CommandID.GROUP_FT_OVER,this.onEarlyOver);
         PetManager.addEventListener(PetEvent.UPDATE_INFO,this.onPetsReady);
         PetManager.upDate();
      }

      private function onPetsReady(event:PetEvent) : void
      {
         if(event.catchTime() != 0 || readyData == null) return;
         PetManager.removeEventListener(PetEvent.UPDATE_INFO,this.onPetsReady);
         if(ApplicationDomain.currentDomain.hasDefinition(DLL_PATH))
         {
            this.enterBattle();
            return;
         }
         loader = new MCLoader("dll/GroupFightDLL.swf",LevelManager.topLevel,Loading.TITLE_AND_PERCENT,"正在进入组队对战系统",true,true);
         loader.setIsShowClose(false);
         loader.addEventListener(MCLoadEvent.SUCCESS,this.onLoadDLL);
         loader.addEventListener(MCLoadEvent.ERROR,this.onLoadError);
         loader.doLoad();
      }

      private function onLoadDLL(event:MCLoadEvent) : void
      {
         this.enterBattle();
      }

      private function enterBattle() : void
      {
         var data:GroupReadyToFightInfo = readyData;
         this.clearPending();
         var cls:Class = getDefinitionByName(DLL_PATH) as Class;
         cls.setup(data.readyFtGroupOneInfo,data.readyFtGroupTwoInfo);
      }

      private function onLoadError(event:MCLoadEvent) : void
      {
         this.onCancel(null);
         Alarm.show("组队对战系统未能加载，请稍后重新挑战。");
      }

      private function onEarlyOver(event:SocketEvent) : void
      {
         this.clearPending();
         LevelManager.openMouseEvent();
         PetManager.upDate();
         Alarm.show("本次组队对战已取消，请确认所有队员在线并在同一间训练室后重新挑战。");
      }

      private function onCancel(event:Event) : void
      {
         if(readyData != null && SocketConnection.mainSocket.connected) SocketConnection.send(CommandID.GROUP_FT_TIME_OUT_EXIT);
         this.clearPending();
         LevelManager.openMouseEvent();
      }

      private function clearPending() : void
      {
         PetManager.removeEventListener(PetEvent.UPDATE_INFO,this.onPetsReady);
         MapManager.removeEventListener(MapEvent.MAP_SWITCH_OPEN,this.onCancel);
         SocketConnection.mainSocket.removeEventListener(Event.CLOSE,this.onCancel);
         SocketConnection.removeCmdListener(CommandID.GROUP_FT_OVER,this.onEarlyOver);
         if(loader != null)
         {
            loader.removeEventListener(MCLoadEvent.SUCCESS,this.onLoadDLL);
            loader.removeEventListener(MCLoadEvent.ERROR,this.onLoadError);
            loader.clear();
            loader = null;
         }
         readyData = null;
      }
   }
}
