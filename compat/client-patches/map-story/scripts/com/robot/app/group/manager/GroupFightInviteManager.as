package com.robot.app.group.manager
{
   import com.robot.core.CommandID;
   import com.robot.core.group.model.GroupFightModel;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.net.SocketConnection;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.events.SocketEvent;
   
   public class GroupFightInviteManager
   {
      
      private static var fightSwitch:Boolean = true;
      
      private static var NUM:Number = 0.08;
      
      public function GroupFightInviteManager()
      {
         super();
      }
      
      public static function fightWithNpc(param1:uint) : void
      {
         var area:uint = param1;
         if(!fightSwitch)
         {
            return;
         }
         GroupFightModel.mode = GroupFightModel.MULTI_MODE;
         GroupFightModel.status = GroupFightModel.FIGHT_WITH_NPC;
         GroupFightModel.enemyName = "野外精灵";
         SocketConnection.send(CommandID.GROUP_FIGHT_NPC_MONSTER,area);
         fightSwitch = false;
         changeSwitch();
      }
      
      public static function fightWithBoss(param1:String = "BOSS", param2:uint = 0, param3:Boolean = true) : void
      {
         var name:String = param1;
         var region:uint = param2;
         var model:Boolean = param3;
         if(!fightSwitch)
         {
            return;
         }
         GroupFightModel.enemyName = name;
         if(model)
         {
            GroupFightModel.mode = GroupFightModel.MULTI_MODE;
         }
         else
         {
            GroupFightModel.mode = GroupFightModel.SINGLE_MODE;
         }
         GroupFightModel.status = GroupFightModel.FIGHT_WITH_BOSS;
         SocketConnection.addCmdListener(CommandID.GP_FT_WITH_BOSS,function(param1:SocketEvent):void
         {
            SocketConnection.removeCmdListener(CommandID.GP_FT_WITH_BOSS,arguments.callee);
            LevelManager.closeMouseEvent();
         });
         SocketConnection.send(CommandID.GP_FT_WITH_BOSS,region);
         fightSwitch = false;
         changeSwitch();
      }
      
      private static function changeSwitch() : void
      {
         var t:uint = 0;
         t = setTimeout(function():void
         {
            clearTimeout(t);
            fightSwitch = true;
         },1000);
      }
      
      public static function fightSpriteBoss(param1:Boolean = true) : void
      {
         var isMultiModel:Boolean = param1;
         if(isMultiModel)
         {
            GroupFightModel.mode = GroupFightModel.MULTI_MODE;
         }
         else
         {
            GroupFightModel.mode = GroupFightModel.SINGLE_MODE;
         }
         GroupFightModel.status = GroupFightModel.FIGHT_WITH_PLAYER;
         SocketConnection.addCmdListener(CommandID.GP_FT_SPRITE_BOSS,function(param1:SocketEvent):void
         {
            SocketConnection.removeCmdListener(CommandID.GP_FT_SPRITE_BOSS,arguments.callee);
            LevelManager.closeMouseEvent();
         });
         SocketConnection.send(CommandID.GP_FT_SPRITE_BOSS,GroupFightModel.mode);
      }
   }
}

