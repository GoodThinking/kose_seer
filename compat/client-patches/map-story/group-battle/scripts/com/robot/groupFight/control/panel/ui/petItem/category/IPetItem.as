package com.robot.groupFight.control.panel.ui.petItem.category
{
   import com.robot.core.info.userItem.SingleItemInfo;
   import flash.display.MovieClip;
   
   public interface IPetItem
   {
      
      function get sprite() : MovieClip;
      
      function set info(param1:SingleItemInfo) : void;
      
      function destroy() : void;
   }
}

