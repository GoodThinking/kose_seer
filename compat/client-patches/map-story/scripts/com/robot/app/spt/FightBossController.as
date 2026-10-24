package com.robot.app.spt
{
   import com.robot.app.fightNote.*;
   
   public class FightBossController extends FightInviteManager
   {
      
      public function FightBossController()
      {
         super();
      }
      
      public static function fightBoss(param1:String, param2:uint = 0) : void
      {
         FightInviteManager.fightWithBoss(param1,param2);
      }
   }
}

