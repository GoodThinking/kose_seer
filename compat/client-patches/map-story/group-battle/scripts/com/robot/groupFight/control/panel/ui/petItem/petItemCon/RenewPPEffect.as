package com.robot.groupFight.control.panel.ui.petItem.petItemCon
{
   import com.robot.core.CommandID;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.group.fightInfo.fighting.item.GroupUseItemInfo;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   import com.robot.groupFight.mode.PlayerGroupFighterModel;
   
   public class RenewPPEffect extends UseItemEffect
   {
      
      public function RenewPPEffect(mode:BaseGroupFighterModel, data:GroupUseItemInfo)
      {
         super(mode,data);
      }
      
      override public function updateData() : void
      {
         if(model is PlayerGroupFighterModel)
         {
            SocketConnection.send(CommandID.GET_PET_INFO,model.info.catchTime);
         }
      }
   }
}

