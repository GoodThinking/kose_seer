package com.robot.groupFight.control.panel
{
   public class FightToolSubject
   {
      
      private var array:Array = [];
      
      public function FightToolSubject()
      {
         super();
      }
      
      public function registe(... args) : void
      {
         var i:IActivePanelObserver = null;
         for each(i in args)
         {
            this.array.push(i);
         }
      }
      
      public function del(i:IActivePanelObserver) : void
      {
         var index:int = this.array.indexOf(i);
         if(index != -1)
         {
            this.array.splice(index,1);
         }
      }
      
      public function destroy() : void
      {
         var i:IActivePanelObserver = null;
         for each(i in this.array)
         {
            i.destroy();
         }
         this.array = [];
      }
      
      public function openPanel() : void
      {
         var i:IActivePanelObserver = null;
         for each(i in this.array)
         {
            i.open();
         }
      }
      
      public function closePanel() : void
      {
         var i:IActivePanelObserver = null;
         for each(i in this.array)
         {
            i.close();
         }
      }
   }
}

