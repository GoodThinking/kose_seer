package com.robot.app.task.control
{
   import com.robot.core.config.*;
   import com.robot.core.mode.*;
   
   public class TaskController_620
   {
      
      private static var panel:AppModel;
      
      public static const TASK_ID:uint = 620;
      
      public function TaskController_620()
      {
         super();
      }
      
      public static function showPanel() : void
      {
         if(panel == null)
         {
            panel = new AppModel(ClientConfig.getTaskModule("TaskPanel_" + TASK_ID),"正在打开任务信息");
            panel.setup();
         }
         panel.show();
      }
      
      public static function setup() : void
      {
      }
      
      public static function start() : void
      {
      }
      
      public static function destroy() : void
      {
         if(Boolean(panel))
         {
            panel.destroy();
            panel = null;
         }
      }
   }
}

