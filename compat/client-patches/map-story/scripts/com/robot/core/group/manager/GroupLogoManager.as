package com.robot.core.group.manager
{
   import com.robot.core.group.info.GroupInfo;
   import com.robot.core.manager.UserManager;
   import com.robot.core.mode.BasePeoleModel;
   
   public class GroupLogoManager
   {
      
      public function GroupLogoManager()
      {
         super();
      }
      
      public static function setGpLogoInfo(param1:uint, param2:GroupInfo) : void
      {
         var _loc3_:BasePeoleModel = UserManager.getUserModel(param1);
         if(_loc3_)
         {
            _loc3_.info.groupInfo = param2;
            _loc3_.showGroupLogo();
         }
      }
   }
}

