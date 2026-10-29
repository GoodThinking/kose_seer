package com.robot.core.group.transform
{
   import com.robot.core.group.manager.GroupIDInfoManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.UserManager;
   import com.robot.core.mode.ActionSpriteModel;
   import com.robot.core.mode.BasePeoleModel;
   import flash.geom.Point;
   import org.taomee.debug.DebugTrace;
   import org.taomee.utils.DisplayUtil;
   
   public class GpSuitTrsfManager
   {
      
      public function GpSuitTrsfManager()
      {
         super();
      }
      
      public static function transForm(param1:GpSuitTransformInfo) : void
      {
         var _loc4_:BasePeoleModel = null;
         var _loc2_:Array = UserManager.getUserModelList();
         _loc2_.push(MainManager.actorModel);
         var _loc3_:Point = new Point();
         for each(_loc4_ in _loc2_)
         {
            if(Boolean(_loc4_) && Boolean(_loc4_.info) && Boolean(_loc4_.info.groupInfo))
            {
               if(GroupIDInfoManager.checkIsTargetGp(param1.groupIDInfo,_loc4_.info.groupInfo.groupIDInfo))
               {
                  if(_loc4_.info.groupInfo.leaderID == _loc4_.info.userID)
                  {
                     _loc3_.x = _loc4_.x;
                     _loc3_.y = _loc4_.y;
                  }
                  DisplayUtil.removeForParent(_loc4_,false);
                  if(_loc4_.pet)
                  {
                     _loc4_.pet.visible = false;
                  }
                  if(_loc4_.nono)
                  {
                     DisplayUtil.removeForParent(_loc4_.nono as ActionSpriteModel,false);
                  }
               }
            }
         }
         DebugTrace.show("-------------------组队套装变形--------------------------");
      }
      
      public static function cancelTransForm(param1:GpSuitTransformInfo) : void
      {
         var _loc3_:BasePeoleModel = null;
         var _loc2_:Array = UserManager.getUserModelList();
         _loc2_.push(MainManager.actorModel);
         for each(_loc3_ in _loc2_)
         {
            if(Boolean(_loc3_) && Boolean(_loc3_.info) && Boolean(_loc3_.info.groupInfo))
            {
               if(GroupIDInfoManager.checkIsTargetGp(param1.groupIDInfo,_loc3_.info.groupInfo.groupIDInfo))
               {
                  if(_loc3_.pet)
                  {
                     _loc3_.pet.visible = true;
                  }
                  if(_loc3_.nono)
                  {
                     _loc3_.addChildAt(_loc3_.nono as ActionSpriteModel,0);
                  }
                  MapManager.currentMap.depthLevel.addChild(_loc3_);
               }
            }
         }
         DebugTrace.show("-------------------取消组队套装变形--------------------------");
      }
   }
}

