package com.robot.groupFight.manager
{
   import com.robot.core.CommandID;
   import com.robot.core.net.SocketConnection;
   import com.robot.groupFight.data.FighterModelFactory;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketEvent;
   
   public class GpSkillWaiteManager
   {
      
      public function GpSkillWaiteManager()
      {
         super();
      }
      
      public static function setup() : void
      {
         SocketConnection.addCmdListener(CommandID.GP_SKILL_WAIT_NOTICE,onSkillWaitNotice);
      }

      public static function destroy() : void
      {
         SocketConnection.removeCmdListener(CommandID.GP_SKILL_WAIT_NOTICE,onSkillWaitNotice);
      }
      
      public static function onSkillWaitNotice(evt:SocketEvent) : void
      {
         var by:ByteArray = evt.data as ByteArray;
         var userID:uint = by.readUnsignedInt();
         var side:uint = by.readUnsignedByte();
         var pos:uint = by.readUnsignedByte();
         var timePert:uint = by.readUnsignedInt();
         var model:BaseGroupFighterModel = FighterModelFactory.fighterModelMap.getValue(side + "_" + pos);
         if(Boolean(model))
         {
            model.petWin.addWaitClock(timePert);
         }
      }
   }
}

