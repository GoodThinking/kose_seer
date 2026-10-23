package org.taomee.manager
{
   import com.robot.core.manager.*;
   import com.robot.core.net.SocketConnection;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketEvent;
   import flash.utils.setTimeout;
   import flash.utils.clearTimeout;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.DisplayObjectContainer;
   import flash.display.Stage;
   import flash.events.Event;
   import flash.net.SharedObject;
   
   public class TaomeeManager
   {
      
      private static var _root:DisplayObjectContainer;
      
      public static var stageHeight:int;
      
      public static var stageWidth:int;
      
      private static var _stage:Stage;
      
      public static var fightSpeed:Number = 1;
      public static var battleMultiplier:uint = 1;
      public static var shortTransitions:Boolean = false;
      public static var experienceReady:Boolean = false;
      private static var experienceUser:uint = 0;
      private static var experienceLoading:Boolean = false;
      private static var experienceCallbacks:Array = [];
      private static var experienceTimeout:uint;
      private static var battlePlaying:Boolean = false;
      private static var sceneFrameRate:Number;
      private static var activeMultiplier:uint = 1;
      public static var nextTowerMap:uint = 0;
      private static var towerStart:Function;
      private static var towerLeave:Function;
      private static var towerChoice:uint = 0;
      private static var towerRewardsReady:Boolean = false;

      public static function prepareTower(map:uint):void
      {
         LevelManager.tipLevel.removeEventListener(Event.REMOVED,onTowerAlertRemoved);
         nextTowerMap = map;
         towerChoice = 0;
         towerRewardsReady = false;
      }

      public static function bindTower(map:uint,start:Function,leave:Function):void
      {
         if(nextTowerMap != map) return;
         towerStart = start;
         towerLeave = leave;
         runTowerChoice();
      }

      public static function unbindTower():void
      {
         towerStart = null;
         towerLeave = null;
      }

      public static function chooseTower(continueFight:Boolean):void
      {
         towerChoice = continueFight ? 1 : 2;
         runTowerChoice();
      }

      public static function finishTowerRewards():void
      {
         towerRewardsReady = true;
         runTowerChoice();
      }

      private static function runTowerChoice():void
      {
         if(!towerRewardsReady || towerChoice == 0 || towerStart == null || MapManager.currentMap.id != nextTowerMap) return;
         if(LevelManager.tipLevel.numChildren > 0)
         {
            LevelManager.tipLevel.addEventListener(Event.REMOVED,onTowerAlertRemoved);
            return;
         }
         LevelManager.tipLevel.removeEventListener(Event.REMOVED,onTowerAlertRemoved);
         var action:Function = towerChoice == 1 ? towerStart : towerLeave;
         nextTowerMap = 0;
         towerChoice = 0;
         towerRewardsReady = false;
         unbindTower();
         setTimeout(action,0);
      }

      private static function onTowerAlertRemoved(event:Event):void
      {
         if(event.target.parent == LevelManager.tipLevel) setTimeout(runTowerChoice,0);
      }

      public static function beginBattlePlayback():void
      {
         if(!battlePlaying) sceneFrameRate = stage.frameRate;
         battlePlaying = true;
         applyBattleSpeed();
      }

      public static function applyBattleSpeed():void
      {
         if(!battlePlaying) return;
         activeMultiplier = battleMultiplier;
         fightSpeed = 3;
         stage.frameRate = 24 * fightSpeed * activeMultiplier;
      }


      public static function battleDuration(value:Number):Number
      {
         return value / activeMultiplier;
      }

      public static function endBattlePlayback():void
      {
         if(battlePlaying) stage.frameRate = sceneFrameRate;
         battlePlaying = false;
         activeMultiplier = 1;
         fightSpeed = 3;
      }

      private static function experienceFailed():void
      {
         SocketConnection.removeCmdListener(91002,onExperience);
         experienceLoading = false;
         experienceCallbacks = [];
         Alarm.show("战斗设置未能读取或保存，请重新打开设置。原设置未在客户端改写。");
      }

      public static function loadExperience(callback:Function = null) : void
      {
         if(experienceUser != MainManager.actorID)
         {
            clearTimeout(experienceTimeout);
            experienceUser = MainManager.actorID;
            experienceReady = false;
            experienceLoading = false;
            battleMultiplier = 1;
            shortTransitions = false;
            experienceCallbacks = [];
         }
         if(experienceReady)
         {
            if(callback != null) callback();
            return;
         }
         if(callback != null) experienceCallbacks.push(callback);
         if(experienceLoading) return;
         experienceLoading = true;
         SocketConnection.removeCmdListener(91002,onExperience);
         SocketConnection.addCmdListener(91002,onExperience);
         experienceTimeout = setTimeout(experienceFailed,8000);
         SocketConnection.send(91002,0);
      }

      public static function saveExperience(multiplier:uint, short:Boolean, callback:Function = null) : void
      {
         if([1,2,4].indexOf(multiplier) < 0 || experienceLoading) return;
         if(callback != null) experienceCallbacks.push(callback);
         experienceLoading = true;
         SocketConnection.removeCmdListener(91002,onExperience);
         SocketConnection.addCmdListener(91002,onExperience);
         experienceTimeout = setTimeout(experienceFailed,8000);
         SocketConnection.send(91002,1,multiplier,short ? 1 : 0);
      }

      private static function onExperience(event:SocketEvent) : void
      {
         var bytes:ByteArray = event.data as ByteArray;
         if(bytes == null || bytes.bytesAvailable != 8) return;
         var multiplier:uint = bytes.readUnsignedInt();
         var short:uint = bytes.readUnsignedInt();
         if([1,2,4].indexOf(multiplier) < 0 || short > 1) return;
         battleMultiplier = multiplier;
         shortTransitions = short == 1;
         experienceReady = true;
         experienceLoading = false;
         clearTimeout(experienceTimeout);
         SocketConnection.removeCmdListener(91002,onExperience);
         var callbacks:Array = experienceCallbacks;
         experienceCallbacks = [];
         for each(var callback:Function in callbacks) callback();
      }
      
      public function TaomeeManager()
      {
         super();
      }
      
      public static function set root(param1:DisplayObjectContainer) : void
      {
         _root = param1;
      }
      
      public static function get root() : DisplayObjectContainer
      {
         return _root;
      }
      
      public static function get stage() : Stage
      {
         return _stage;
      }
      
      public static function set stage(param1:Stage) : void
      {
         _stage = param1;
      }
      
      public static function setup(param1:DisplayObjectContainer, param2:Stage) : void
      {
         _root = param1;
         _stage = param2;
      }
      
      public static function initFightSpeed() : void
      {
         loadExperience();
      }
   }
}

