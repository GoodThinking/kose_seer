package com.robot.app.fight
{
   import com.robot.app.fightNote.*;
   import com.robot.core.*;
   import org.taomee.manager.EventManager;
   import com.robot.core.event.*;
   import com.robot.core.info.fightInfo.*;
   import com.robot.core.info.fightInfo.attack.*;
   import com.robot.core.manager.*;
   import com.robot.core.net.*;
   import com.robot.core.ui.alert.*;
   import flash.utils.*;
   
   public class FightManager extends FightInviteManager
   {
      
      private static var noMapFightCallback:Function;
      
      public static var isWin:Boolean = false;
      
      private static var noMapFightSwitch:Boolean = true;
      
      public function FightManager()
      {
         super();
      }
      
      public static function fightWithBoss(param1:String, param2:uint = 0, param3:Boolean = false) : void
      {
         isWin = false;
         EventManager.removeEventListener(PetFightEvent.FIGHT_RESULT,onFightResult);
         EventManager.addEventListener(PetFightEvent.FIGHT_RESULT,onFightResult);
         FightInviteManager.fightWithBoss(param1,param2);
      }
      
      public static function fightNoMapBoss(param1:String, param2:uint = 0, param3:Boolean = false, param4:Boolean = true, param5:Function = null) : void
      {
         var name:String = param1;
         var region:uint = param2;
         var skipKillPlugin:Boolean = param3;
         var multiMode:Boolean = param4;
         var callback:Function = param5;
         if(!noMapFightSwitch)
         {
            return;
         }
         if(PetManager.length == 0 || PetManager.getPetInfo(PetManager.defaultTime) == null)
         {
            Alarm.show("你没有可出战的精灵！");
            return;
         }
         isWin = false;
         EventManager.removeEventListener(PetFightEvent.FIGHT_RESULT,onFightResult);
         EventManager.addEventListener(PetFightEvent.FIGHT_RESULT,onFightResult);
         PetFightModel.enemyName = name;
         PetFightModel.mode = multiMode ? uint(PetFightModel.MULTI_MODE) : uint(PetFightModel.SINGLE_MODE);
         PetFightModel.status = PetFightModel.FIGHT_WITH_BOSS;
         noMapFightCallback = callback;
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onNoMapFightAlarm);
         if(noMapFightCallback != null)
         {
            EventManager.addEventListener(PetFightEvent.ALARM_CLICK,onNoMapFightAlarm);
         }
         SocketConnection.send(CommandID.MIBAO_FIGHT,region);
         noMapFightSwitch = false;
         setTimeout(function():void
         {
            noMapFightSwitch = true;
         },1000);
      }
      
      private static function onNoMapFightAlarm(param1:PetFightEvent) : void
      {
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onNoMapFightAlarm);
         var _loc2_:Function = noMapFightCallback;
         noMapFightCallback = null;
         if(_loc2_ != null)
         {
            _loc2_(param1.dataObj as FightOverInfo);
         }
      }
      
      private static function onFightResult(param1:PetFightEvent) : void
      {
         var _loc2_:FightOverInfo = param1.dataObj as FightOverInfo;
         EventManager.removeEventListener(PetFightEvent.FIGHT_RESULT,onFightResult);
         isWin = _loc2_ != null && _loc2_.winnerID == MainManager.actorID;
      }
   }
}

