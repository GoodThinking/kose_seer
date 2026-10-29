package com.robot.groupFight.manager
{
   import com.robot.core.group.model.GroupArrayModel;
   
   public class GroupArrayManager
   {
      
      public static const rightNormalArr:Array = [[11,3],[10,3],[9,4],[8,4],[7,5]];
      
      public static const leftNormalArr:Array = [[7,1],[6,1],[5,2],[4,2],[3,3]];
      
      public function GroupArrayManager()
      {
         super();
      }
      
      public static function groupArray() : Array
      {
         switch(GroupArrayModel.mode)
         {
            case GroupArrayModel.NORMAL:
            case GroupArrayModel.FISH:
            case GroupArrayModel.DIDI:
            case GroupArrayModel.PAPA:
         }
         return null;
      }
   }
}

