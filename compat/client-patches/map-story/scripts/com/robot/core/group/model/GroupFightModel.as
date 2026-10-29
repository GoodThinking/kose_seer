package com.robot.core.group.model
{
   public class GroupFightModel
   {
      
      public static var status:uint;
      
      public static var defaultNpcID:uint;
      
      public static const SINGLE_MODE:uint = 5;
      
      public static const MULTI_MODE:uint = 6;
      
      public static const FIGHT_WITH_NPC:uint = 0;
      
      public static const FIGHT_WITH_BOSS:uint = 1;
      
      public static const FIGHT_WITH_PLAYER:uint = 2;
      
      private static var _mode:uint = MULTI_MODE;
      
      public static var enemyName:String = "";
      
      public static var isInit:Boolean = true;
      
      public function GroupFightModel()
      {
         super();
      }
      
      public static function set mode(param1:uint) : void
      {
         _mode = param1;
      }
      
      public static function get mode() : uint
      {
         return _mode;
      }
   }
}

