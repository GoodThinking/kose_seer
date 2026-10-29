package com.robot.groupFight.data
{
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.PetManager;
   import org.taomee.ds.HashMap;
   
   public class GroupFightUserInfo
   {
      
      public var userID:uint;
      
      public var membIDList:Array;
      
      public var monInfoMap:HashMap = new HashMap();
      
      public function GroupFightUserInfo()
      {
         var t:uint = 0;
         var info:PetInfo = null;
         super();
         this.userID = MainManager.actorID;
         for each(t in PetManager.catchTimes)
         {
            info = PetManager.getPetInfo(t);
            if(Boolean(info))
            {
               this.monInfoMap.add(t,info);
            }
         }
      }
   }
}

