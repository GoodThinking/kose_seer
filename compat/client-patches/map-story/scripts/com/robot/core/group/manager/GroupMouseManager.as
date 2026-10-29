package com.robot.core.group.manager
{
   import com.robot.core.manager.LevelManager;
   
   public class GroupMouseManager
   {
      
      public function GroupMouseManager()
      {
         super();
      }
      
      public static function openMouseEvent() : void
      {
         LevelManager.appLevel.mouseEnabled = true;
         LevelManager.mapLevel.mouseEnabled = true;
         LevelManager.mapLevel.mouseChildren = true;
      }
      
      public static function closeMouseEvent() : void
      {
         LevelManager.appLevel.mouseEnabled = false;
         LevelManager.mapLevel.mouseEnabled = false;
         LevelManager.mapLevel.mouseChildren = false;
      }
   }
}

