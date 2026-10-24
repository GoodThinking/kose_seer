package com.robot.app.task.control
{
   import com.robot.app.task.taskscollection.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   
   public class TaskController_549
   {
      
      private static var panel:AppModel;
      
      public static const TASK_ID:uint = 549;
      
      public function TaskController_549()
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
         NpcDialog.show(NPC.IRIS,["我不知道该怎么说……隐身之匙实在是让我烦恼！"],["你已经有关于隐身之匙的头绪了吗？","我一会再来找你哟！"],[function():void
         {
            TasksManager.accept(TASK_ID,function(param1:Boolean):void
            {
               if(param1)
               {
                  Task549.initTask();
               }
            });
         }]);
      }
      
      public static function startPro() : void
      {
         TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
         {
            var progress:Array = param1;
            if(Boolean(progress[0]) && Boolean(progress[1]) && Boolean(progress[2]) && !progress[3])
            {
               NpcDialog.show(NPC.IRIS,["没想到几千万年以前已经有这样惊人的文明存在了……赫尔卡星宝藏一定会让我们大为吃惊！"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.IRIS,["我需要继续研究赫尔卡星信号的事情了……就让我们一起期待下一次的冒险吧！"],["下一次，会更精彩！"],[function():void
                  {
                     TasksManager.complete(TASK_ID,3);
                  }]);
               });
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

