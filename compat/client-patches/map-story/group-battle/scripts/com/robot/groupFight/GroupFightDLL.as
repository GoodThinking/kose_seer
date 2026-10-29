package com.robot.groupFight
{
   import com.robot.core.CommandID;
   import com.robot.core.SoundManager;
   import com.robot.core.event.MapEvent;
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.group.fightInfo.fightOver.GroupFightOverInfo;
   import com.robot.core.group.fightInfo.readyToFight.GroupReadyToFtPetInfo;
   import com.robot.core.group.fightInfo.readyToFight.GroupReadyToFtUserInfo;
   import com.robot.core.group.fightInfo.readyToFight.ReadyToFightGroupInfo;
   import com.robot.core.group.fightInfo.startFight.GroupFightStartInfo;
   import com.robot.core.group.model.GroupFightModel;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.UserManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.groupFight.control.GroupFightController;
   import com.robot.groupFight.control.SkillMouseController;
   import com.robot.groupFight.control.SpriteDieController;
   import com.robot.groupFight.data.FighterModelFactory;
   import com.robot.groupFight.manager.GroupFightOverManager;
   import com.robot.groupFight.manager.assetManager.AssetsEvent;
   import com.robot.groupFight.manager.assetManager.AssetsLoadManager;
   import com.robot.groupFight.manager.assetManager.PetAssetsManager;
   import com.robot.groupFight.manager.assetManager.SkillAssetsManager;
   import com.robot.groupFight.view.loading.LoadingItem;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.TimerEvent;
   import flash.media.Sound;
   import flash.media.SoundChannel;
   import flash.utils.ByteArray;
   import flash.utils.Timer;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.EventManager;
   import org.taomee.manager.TaomeeManager;
   import org.taomee.utils.DisplayUtil;

   [SWF(width="500", height="375", backgroundColor="#ffffff", frameRate="24")]
   public class GroupFightDLL extends Sprite
   {
      private static var loadingMC:Sprite;
      private static var assetLoading:AssetsLoadManager;
      private static var gpFtController:GroupFightController;
      private static var sound:Sound;
      private static var soundChannel:SoundChannel;
      private static var percent:uint;
      private static var pctTimer:Timer;
      private static var active:Boolean = false;
      public static var isLoadComplete:Boolean = false;

      public function GroupFightDLL()
      {
         super();
      }

      public static function setup(one:ReadyToFightGroupInfo, two:ReadyToFightGroupInfo) : void
      {
         if(active) return;
         active = true;
         isLoadComplete = false;
         percent = 0;
         GroupFightController.isStartFihgt = false;
         GroupFightController.hasSkill = false;
         sound = GroupFightModel.status == GroupFightModel.FIGHT_WITH_BOSS ? new GpFightBoss_Sound() : new GpFightBg_Sound();
         PetAssetsManager.getInstance().clearAll();
         SkillAssetsManager.getInstance().clearAll();
         assetLoading = new AssetsLoadManager();
         gpFtController = new GroupFightController();
         SpriteDieController.setup();
         EventManager.addEventListener(GroupFightEvent.FIGHT_CLOSE,onCloseFight);
         EventManager.addEventListener(GroupFightEvent.LOAD_ASSETS_TIME_OUT,loadAssetsTimeOut);
         SocketConnection.addCmdListener(CommandID.GROUP_START_FIGHT,onStartGroupFight);
         SocketConnection.addCmdListener(CommandID.GROUP_LOAD_PCT_NOTIECE,onLoadPercent);
         SocketConnection.mainSocket.addEventListener(Event.CLOSE,onDisconnected);
         MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,onMapSwitch);
         loadingMC = new GpFightLoadingMC();
         addGroup(one,50);
         addGroup(two,650);
         LevelManager.root.addChild(loadingMC);
         LevelManager.showOrRemoveMapLevelandToolslevel(false);
         LevelManager.hideAll(LevelManager.appLevel);
         LevelManager.closeMouseEvent();
         assetLoading.addEventListener(AssetsEvent.LOAD_ALL_ASSETS,onLoadAll);
         assetLoading.addEventListener(AssetsEvent.PROGRESS,onProgress);
         pctTimer = new Timer(5000);
         pctTimer.addEventListener(TimerEvent.TIMER,onPctTimer);
         pctTimer.start();
         assetLoading.loadAssets();
      }

      private static function addGroup(group:ReadyToFightGroupInfo, itemX:Number) : void
      {
         var row:uint = 0;
         for each(var user:GroupReadyToFtUserInfo in group.groupList)
         {
            if(user.userID == MainManager.actorID) FighterModelFactory.invitorID = group.invitorID;
            var item:LoadingItem = new LoadingItem(user,group.leaderID);
            item.x = itemX;
            item.y = 25 + (item.height + 4) * row++;
            if(itemX > 480) item.mc.gotoAndStop(2);
            item.name = String(user.userID);
            loadingMC.addChild(item);
            FighterModelFactory.gpRdyToFtUsInfoMap.add(user.userID,user);
            for each(var pet:GroupReadyToFtPetInfo in user.monList)
            {
               assetLoading.addPetID(pet.id);
               for each(var skill:uint in pet.moveList) assetLoading.addSkillID(skill);
            }
         }
      }

      private static function onProgress(event:AssetsEvent) : void
      {
         if(!active || loadingMC == null) return;
         percent = event.percent;
         var item:LoadingItem = loadingMC.getChildByName(String(MainManager.actorID)) as LoadingItem;
         if(item != null) item.txt.text = String(percent);
      }

      private static function onPctTimer(event:TimerEvent) : void
      {
         SocketConnection.send(CommandID.GROUP_LOAD_PERCENT,percent);
      }

      private static function onLoadAll(event:Event) : void
      {
         if(!active) return;
         stopLoading();
         isLoadComplete = true;
         SocketConnection.send(CommandID.GROUP_READY_FIGHT_FINISH);
      }

      private static function onLoadPercent(event:SocketEvent) : void
      {
         if(loadingMC == null) return;
         var bytes:ByteArray = event.data as ByteArray;
         var uid:uint = bytes.readUnsignedInt();
         var value:uint = bytes.readUnsignedInt();
         var item:LoadingItem = loadingMC.getChildByName(String(uid)) as LoadingItem;
         if(item != null) item.txt.text = String(value);
      }

      private static function onStartGroupFight(event:SocketEvent) : void
      {
         if(!active || !isLoadComplete) return;
         SoundManager.stopSound();
         if(SoundManager.isPlay_b) soundChannel = sound.play(0,9999999);
         TaomeeManager.beginBattlePlayback();
         DisplayUtil.removeForParent(loadingMC);
         loadingMC = null;
         gpFtController.setup(event.data as GroupFightStartInfo);
         UserManager.clear();
      }

      private static function onCloseFight(event:GroupFightEvent) : void
      {
         if(!active) return;
         var data:GroupFightOverInfo = event.dataObj["data"] as GroupFightOverInfo;
         GroupFightOverManager.over(data);
         destroy();
      }

      private static function loadAssetsTimeOut(event:GroupFightEvent) : void
      {
         if(!active) return;
         SocketConnection.send(CommandID.GROUP_FT_TIME_OUT_EXIT);
         destroy();
         Alarm.show("对战资源未能完成加载或播放，已退出本次对战，请稍后重新挑战。");
      }

      private static function onDisconnected(event:Event) : void
      {
         destroy();
      }

      private static function onMapSwitch(event:MapEvent) : void
      {
         if(active && SocketConnection.mainSocket.connected) SocketConnection.send(CommandID.GROUP_FT_TIME_OUT_EXIT);
         destroy();
      }

      private static function stopLoading() : void
      {
         if(pctTimer != null)
         {
            pctTimer.stop();
            pctTimer.removeEventListener(TimerEvent.TIMER,onPctTimer);
            pctTimer = null;
         }
         if(assetLoading != null)
         {
            assetLoading.removeEventListener(AssetsEvent.LOAD_ALL_ASSETS,onLoadAll);
            assetLoading.removeEventListener(AssetsEvent.PROGRESS,onProgress);
            assetLoading.destroy();
            assetLoading = null;
         }
      }

      private static function destroy() : void
      {
         if(!active) return;
         active = false;
         stopLoading();
         EventManager.removeEventListener(GroupFightEvent.FIGHT_CLOSE,onCloseFight);
         EventManager.removeEventListener(GroupFightEvent.LOAD_ASSETS_TIME_OUT,loadAssetsTimeOut);
         SocketConnection.removeCmdListener(CommandID.GROUP_START_FIGHT,onStartGroupFight);
         SocketConnection.removeCmdListener(CommandID.GROUP_LOAD_PCT_NOTIECE,onLoadPercent);
         SocketConnection.mainSocket.removeEventListener(Event.CLOSE,onDisconnected);
         MapManager.removeEventListener(MapEvent.MAP_SWITCH_OPEN,onMapSwitch);
         SkillMouseController.undo();
         if(gpFtController != null) gpFtController.destroy();
         gpFtController = null;
         if(soundChannel != null) soundChannel.stop();
         soundChannel = null;
         sound = null;
         DisplayUtil.removeForParent(loadingMC);
         loadingMC = null;
         LevelManager.showOrRemoveMapLevelandToolslevel(true);
         LevelManager.showAll(LevelManager.appLevel);
         LevelManager.root.mouseChildren = true;
         LevelManager.openMouseEvent();
         isLoadComplete = false;
         GroupFightController.isStartFihgt = false;
         GroupFightController.hasSkill = false;
         TaomeeManager.endBattlePlayback();
         SoundManager.playSound();
         PetAssetsManager.getInstance().clearAll();
         SkillAssetsManager.getInstance().clearAll();
      }
   }
}
