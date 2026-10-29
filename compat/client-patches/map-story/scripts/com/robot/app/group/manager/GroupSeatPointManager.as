package com.robot.app.group.manager
{
   import com.robot.app.group.GroupController;
   import com.robot.core.config.xml.SeatPointXMLInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.UserManager;
   import com.robot.core.mode.BasePeoleModel;
   
   public class GroupSeatPointManager
   {
      
      public function GroupSeatPointManager()
      {
         super();
      }
      
      public static function checkIsToGroup(param1:uint) : void
      {
         var _loc4_:BasePeoleModel = null;
         var _loc5_:uint = 0;
         var _loc2_:Array = UserManager.getUserModelList();
         _loc2_.push(MainManager.actorModel);
         var _loc3_:uint = 0;
         for each(_loc4_ in _loc2_)
         {
            if(_loc4_.info.groupInfo)
            {
               if(_loc4_.info.groupInfo.sctID == param1)
               {
                  _loc3_++;
               }
            }
         }
         _loc5_ = uint(SeatPointXMLInfo.getSctMaxPoint(MapManager.currentMap.id,param1));
         if(_loc3_ == _loc5_)
         {
            if(MainManager.actorInfo.groupInfo)
            {
               if(MainManager.actorInfo.groupInfo.sctID == param1 && MainManager.actorInfo.groupInfo.pointID == 0)
               {
                  GroupController.seatPointToGroup();
               }
            }
         }
      }
   }
}

