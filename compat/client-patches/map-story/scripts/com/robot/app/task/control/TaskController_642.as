package com.robot.app.task.control
{
   import com.robot.app.task.taskscollection.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.mode.*;
   
   public class TaskController_642
   {
      
      private static var panel:AppModel;
      
      public static const TASK_ID:uint = 642;
      
      public function TaskController_642()
      {
         super();
      }
      
      public static function showPanel() : void
      {
         var _loc1_:String = "TaskPanel_" + TASK_ID;
         if(panel == null)
         {
            panel = new AppModel(ClientConfig.getTaskModule(_loc1_),"正在打开任务信息");
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
      
      public static function startPro() : void
      {
         Task642.checkTask();
      }
      
      public static function resumeCaptainReport(param1:Function = null) : void
      {
         var callback:Function = param1;
         if(TasksManager.getTaskStatus(TASK_ID) != TasksManager.ALR_ACCEPT)
         {
            if(callback != null)
            {
               callback(false);
            }
            return;
         }
         TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
         {
            if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && Boolean(param1[4]) && !Boolean(param1[5]))
            {
               Task642.checkTask();
               if(callback != null)
               {
                  callback(true);
               }
               return;
            }
            if(callback != null)
            {
               callback(false);
            }
         });
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

