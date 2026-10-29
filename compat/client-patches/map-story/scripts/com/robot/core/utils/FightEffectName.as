package com.robot.core.utils
{
   public class FightEffectName
   {
      
      public function FightEffectName()
      {
         super();
      }
      
      public static function getName(param1:uint) : String
      {
         if(param1 == 1)
         {
            return "无效";
         }
         if(param1 == 2)
         {
            return "微弱";
         }
         if(param1 == 3)
         {
            return "克制";
         }
         return "";
      }
   }
}

