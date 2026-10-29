package com.robot.app.task.tc
{
   import com.robot.app.task.skeeClothTask.SkeeClothTaskController;
   import com.robot.core.info.task.novice.NoviceFinishInfo;
   import com.robot.core.manager.TasksManager;

   public class TaskClass_7
   {
      public function TaskClass_7(param1:NoviceFinishInfo)
      {
         super();
         TasksManager.setTaskStatus(7,TasksManager.COMPLETE);
         SkeeClothTaskController.delIcon();
      }
   }
}
