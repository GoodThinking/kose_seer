package com.robot.petFightModule.ui.controlPanel.petItem.category
{
   import com.robot.core.CommandID;
   import com.robot.core.net.SocketConnection;
   import com.robot.petFightModule.control.FighterModeFactory;
   import flash.events.MouseEvent;

   public class RenewPPItemCategory extends AbstractPetItemCategory implements IPetItemCategory
   {

      public function RenewPPItemCategory(param1:uint)
      {
         super(param1);
      }

      override public function destroy() : void
      {
         super.destroy();
      }

      override protected function useItem(param1:MouseEvent) : void
      {
         if(!beginMedicineUse())
         {
            return;
         }
         super.useItem(param1);
         SocketConnection.send(CommandID.USE_PET_ITEM,FighterModeFactory.playerMode.catchTime,_itemID,0);
      }
   }
}
