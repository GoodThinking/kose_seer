package com.robot.core.config.xml
{
   import com.robot.core.manager.MapManager;

   public class SpaceGuardXMLInfo
   {
      private static const MESSAGES:Array = ["荣誉大厅的克罗和小克会推荐最适合的玩法给你!","不知道该玩什么就去荣誉大厅问问克罗和小克!","汇聚各种挑战难度的太空站是展现精灵能力的最佳场所!","想了解军阶、徽章、成就等信息，快去荣誉大厅看看吧!"];
      private static const KING_MESSAGES:Array = ["点击塔侧的突起，可以切换普通与极限模式。","普通模式需要一只满级精灵，极限模式需要三只。","极限模式每十层返回入口，整理背包后再挑战下一段。","断线会保留当前挑战；与我交谈可查看通关记录。"];
      private static const POSITIONS:Object = {
         108:[360,490],
         465:[325,208],
         111:[688,222],
         405:[330,450],
         503:[710,435]
      };

      public function SpaceGuardXMLInfo()
      {
         super();
      }

      public static function getDialog() : String
      {
         var messages:Array = MapManager.currentMap.id == 465 ? KING_MESSAGES : MESSAGES;
         return messages[int(Math.random() * messages.length)];
      }

      public static function getPosi(mapId:uint) : Array
      {
         return POSITIONS[mapId] as Array;
      }
   }
}
