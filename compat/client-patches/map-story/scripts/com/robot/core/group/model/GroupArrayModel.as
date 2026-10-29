package com.robot.core.group.model
{
   public class GroupArrayModel
   {
      
      public static const NORMAL:uint = 0;
      
      public static const FISH:uint = 1;
      
      public static const DIDI:uint = 2;
      
      public static const PAPA:uint = 3;
      
      private static var _mode:uint = NORMAL;
      
      public function GroupArrayModel()
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

