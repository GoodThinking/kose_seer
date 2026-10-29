package com.robot.core.group.manager
{
   import com.robot.core.group.point.MapSeatPointConfig;
   import com.robot.core.manager.MapManager;
   
   public class GroupManager
   {
      
      private static var _isInGroup:Boolean = false;
      
      public function GroupManager()
      {
         super();
      }
      
      public static function set isInGroup(param1:Boolean) : void
      {
         _isInGroup = param1;
         if(!param1)
         {
            GroupMouseManager.openMouseEvent();
         }
         MapSeatPointConfig.configMap(MapManager.currentMap.id);
      }
      
      public static function get isInGroup() : Boolean
      {
         return _isInGroup;
      }
   }
}

