package com.robot.groupFight.control.panel.ui.fightPanel
{
   import flash.display.Sprite;
   
   public interface IControlPanel
   {
      
      function show() : void;
      
      function hide() : void;
      
      function open() : void;
      
      function close() : void;
      
      function get panel() : Sprite;
      
      function destroy() : void;
   }
}

