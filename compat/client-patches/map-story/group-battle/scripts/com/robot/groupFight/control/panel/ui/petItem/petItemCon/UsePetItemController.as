package com.robot.groupFight.control.panel.ui.petItem.petItemCon
{
   import com.robot.core.group.fightInfo.fighting.item.GroupUseItemInfo;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   
   public class UsePetItemController
   {
      
      public function UsePetItemController()
      {
         super();
      }
      
      public static function useItem(mode:BaseGroupFighterModel, data:GroupUseItemInfo) : void
      {
         var itemID:uint = uint(data.itemID);
         if(itemID <= 300015 || itemID == 300020 || itemID == 300021 || itemID == 300022)
         {
            new RenewBloodEffect(mode,data);
         }
         else if(itemID <= 300020 || itemID == 300023)
         {
            new RenewPPEffect(mode,data);
         }
      }
   }
}

