package com.robot.app.mapProcess
{
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.app.task.taskscollection.Task534;
   import com.robot.app.task.control.TasksController;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.events.MouseEvent;
   
   public class MapProcess_438 extends BaseMapProcess
   {
      
      public function MapProcess_438()
      {
         super();
      }
      
      override protected function init() : void
      {
         conLevel["task534Btn"].visible = false;
         conLevel["fly"].visible = false;
         conLevel["revivePet"].visible = false;
         conLevel["revive"].visible = false;
         conLevel["pet"].visible = false;
         conLevel["petHealth"].visible = false;
         conLevel["stone"].visible = false;
         var map:MapProcess_438 = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task534.initInner(map);
            map.addTask534Btn();
         },this);
      }
      
      private function addTask534Btn() : void
      {
         if(TasksManager.getTaskStatus(534) == TasksManager.ALR_ACCEPT) return;
         conLevel["task534Btn"].visible = true;
         conLevel["task534Btn"].addEventListener(MouseEvent.CLICK,this.onTask534BtnClick);
      }
      
      private function onTask534BtnClick(param1:MouseEvent) : void
      {
         FightInviteManager.fightWithBoss("墨杜萨");
      }
      
      override public function destroy() : void
      {
         conLevel["task534Btn"].removeEventListener(MouseEvent.CLICK,this.onTask534BtnClick);
         Task534.destroy(this);
      }
   }
}

