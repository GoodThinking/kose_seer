package com.robot.groupFight.control.panel.ui.btns
{
   import com.robot.groupFight.control.panel.ControlPanelObserver;
   import flash.display.SimpleButton;
   import flash.events.MouseEvent;
   
   public class ItemBtn extends ControlBtn
   {
      
      public function ItemBtn(b:SimpleButton, ctlPanel:ControlPanelObserver)
      {
         super(b,ctlPanel);
      }
      
      override public function mosClick(evt:MouseEvent = null) : void
      {
         ctlPanelOber.showItem();
      }
   }
}

