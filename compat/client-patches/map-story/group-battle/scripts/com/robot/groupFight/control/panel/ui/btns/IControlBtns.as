package com.robot.groupFight.control.panel.ui.btns
{
   import flash.events.MouseEvent;
   
   public interface IControlBtns
   {
      
      function mosClick(param1:MouseEvent = null) : void;
      
      function openBtn() : void;
      
      function closeBtn() : void;
      
      function destroy() : void;
   }
}

