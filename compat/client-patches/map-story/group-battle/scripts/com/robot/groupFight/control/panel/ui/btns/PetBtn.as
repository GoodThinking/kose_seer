package com.robot.groupFight.control.panel.ui.btns
{
   import com.robot.core.group.model.GroupFightModel;
   import com.robot.core.manager.MainManager;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.groupFight.control.panel.ControlPanelObserver;
   import flash.display.SimpleButton;
   import flash.events.MouseEvent;
   
   public class PetBtn extends ControlBtn
   {
      
      public function PetBtn(b:SimpleButton, ctlPanel:ControlPanelObserver)
      {
         super(b,ctlPanel);
         if(GroupFightModel.mode == GroupFightModel.SINGLE_MODE)
         {
            closeBtn();
         }
      }
      
      override public function mosClick(evt:MouseEvent = null) : void
      {
         if(GroupFightModel.mode == GroupFightModel.SINGLE_MODE)
         {
            closeBtn();
            MainManager.getStage().addChild(Alarm.show("单挑模式下不能换宠哦"));
         }
         else
         {
            ctlPanelOber.showPet();
         }
      }
   }
}

