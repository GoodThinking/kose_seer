package com.robot.groupFight.control.panel.ui.btns
{
   import com.robot.groupFight.control.panel.ControlPanelObserver;
   import flash.display.SimpleButton;
   import flash.events.MouseEvent;
   import org.taomee.effect.ColorFilter;
   
   public class ControlBtn implements IControlBtns
   {
      
      protected var btn:SimpleButton;
      
      protected var ctlPanelOber:ControlPanelObserver;
      
      public function ControlBtn(b:SimpleButton, ctlPanel:ControlPanelObserver)
      {
         super();
         this.btn = b;
         this.ctlPanelOber = ctlPanel;
         this.btn.addEventListener(MouseEvent.CLICK,this.mosClick);
      }
      
      public function mosClick(evt:MouseEvent = null) : void
      {
      }
      
      public function openBtn() : void
      {
         if(Boolean(this.btn))
         {
            this.btn.mouseEnabled = true;
            this.btn.filters = [];
         }
      }
      
      public function closeBtn() : void
      {
         if(Boolean(this.btn))
         {
            this.btn.mouseEnabled = false;
            this.btn.filters = [ColorFilter.setGrayscale()];
         }
      }
      
      public function destroy() : void
      {
         this.btn.removeEventListener(MouseEvent.CLICK,this.mosClick);
         this.btn = null;
      }
   }
}

