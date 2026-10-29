package com.robot.groupFight.control.panel.ui.petItem.petItemCon
{
   import com.robot.core.group.fightInfo.fighting.item.GroupUseItemInfo;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   
   public class RenewBloodEffect extends UseItemEffect
   {
      
      public function RenewBloodEffect(mode:BaseGroupFighterModel, data:GroupUseItemInfo)
      {
         super(mode,data);
      }
      
      override public function updateData() : void
      {
         model.hpView.gainTxt(data.chgHp);
         model.bloodWin.resetBar(data.monHp,model.info.maxHP);
      }
   }
}

