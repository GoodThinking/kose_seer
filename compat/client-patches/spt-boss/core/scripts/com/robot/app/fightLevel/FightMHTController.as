package com.robot.app.fightLevel
{
   import com.robot.core.CommandID;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.info.pet.PetListInfo;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import org.taomee.events.SocketEvent;

   public class FightMHTController
   {
      private static var _handler:Function;
      private static var _petInfoA:Array = [];
      private static var _curIndex:uint = 0;

      public function FightMHTController()
      {
         super();
      }

      public static function check() : void
      {
         if(PetManager.getBagMap().length == 0)
         {
            Alarm.show("请携带精灵，并将出战背包中的精灵训练到100级后再挑战神秘领域。");
            return;
         }
         _petInfoA = PetManager.getBagMap();
         _curIndex = 0;
         send1((_petInfoA[_curIndex] as PetListInfo).catchTime);
      }

      public static function checkIsFight(param1:Function) : void
      {
         _handler = param1;
         _petInfoA = PetManager.getBagMap();
         _curIndex = 0;
         send((_petInfoA[_curIndex] as PetListInfo).catchTime);
      }

      private static function send(param1:uint) : void
      {
         SocketConnection.addCmdListener(CommandID.GET_PET_INFO,onCheckComHandler);
         SocketConnection.send(CommandID.GET_PET_INFO,param1);
      }

      private static function send1(param1:uint) : void
      {
         SocketConnection.addCmdListener(CommandID.GET_PET_INFO,onGetComHandler);
         SocketConnection.send(CommandID.GET_PET_INFO,param1);
      }

      private static function onCheckComHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.GET_PET_INFO,onCheckComHandler);
         var _loc2_:PetInfo = param1.data as PetInfo;
         if(_loc2_.level >= 30)
         {
            _handler(true);
            return;
         }
         ++_curIndex;
         if(_curIndex < _petInfoA.length)
         {
            send((_petInfoA[_curIndex] as PetListInfo).catchTime);
         }
         else
         {
            _handler(false);
         }
      }

      private static function onGetComHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.GET_PET_INFO,onGetComHandler);
         var _loc2_:PetInfo = param1.data as PetInfo;
         if(_loc2_.level < 100)
         {
            Alarm.show("请将出战背包中的精灵训练到100级后再挑战神秘领域。");
            destroy();
         }
         else
         {
            ++_curIndex;
            if(_curIndex >= _petInfoA.length)
            {
               destroy();
               MapManager.changeLocalMap(514);
            }
            else
            {
               send1((_petInfoA[_curIndex] as PetListInfo).catchTime);
            }
         }
      }

      public static function destroy() : void
      {
         SocketConnection.removeCmdListener(CommandID.GET_PET_INFO,onGetComHandler);
         _petInfoA = null;
         _curIndex = 0;
      }
   }
}
