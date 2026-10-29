package com.robot.groupFight.control.panel
{
   import flash.display.Sprite;
   
   public class BasePanelObserver extends Sprite implements IActivePanelObserver
   {
      
      protected var subject:FightToolSubject;
      
      public function BasePanelObserver(s:FightToolSubject)
      {
         super();
         this.subject = s;
         this.subject.registe(this);
      }
      
      public function destroy() : void
      {
         this.subject = null;
      }
      
      public function open() : void
      {
      }
      
      public function close() : void
      {
      }
   }
}

