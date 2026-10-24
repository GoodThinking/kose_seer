package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TaskController_658;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   
   public class MapProcess_449 extends BaseMapProcess
   {
      
      private var temple:MovieClip;
      
      public function MapProcess_449()
      {
         super();
      }
      
      override protected function init() : void
      {
         this.temple = conLevel["mainMC"]["difuteHit"] as MovieClip;
         this.temple.buttonMode = true;
         this.temple.addEventListener(MouseEvent.CLICK,this.onTemple);
      }
      
      private function onTemple(e:MouseEvent) : void
      {
         if(TasksManager.getTaskStatus(TaskController_658.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            return;
         }
         MapManager.changeMap(450);
      }
      
      override public function destroy() : void
      {
         this.temple.removeEventListener(MouseEvent.CLICK,this.onTemple);
         this.temple = null;
      }
   }
}
