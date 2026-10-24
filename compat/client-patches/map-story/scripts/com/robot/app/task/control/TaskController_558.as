package com.robot.app.task.control
{
   import com.robot.app.task.taskscollection.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   
   public class TaskController_558
   {
      
      private static var panel:AppModel;
      
      public static const TASK_ID:uint = 558;
      
      public function TaskController_558()
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
         NpcDialog.show(NPC.IRIS,["啊哈！我终于找到化身之匙的行踪了！原来赫尔卡星人早已经留下了线索！"],["我找你正是为了这个事呢！","我一会再来找你哟！"],[function():void
         {
            TasksManager.accept(TASK_ID,function(param1:Boolean):void
            {
               if(param1)
               {
                  Task558.initTask();
               }
            });
         }]);
      }
      
      public static function startPro() : void
      {
         TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
         {
            var progress:Array = param1;
            if(Boolean(progress[0]) && Boolean(progress[1]) && !progress[2])
            {
               NpcDialog.show(NPC.IRIS,["你不可以轻举妄动！这个事情事关严重，我需要立即禀报船长！随时听后船长命令！"],["……爱丽丝为什么如此紧张，到底发生了什么！"],[function():void
               {
                  AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_558_3"),function():void
                  {
                     NpcDialog.show(NPC.IRIS,["那两个精灵绝对不简单！也不是你和我所能够懂的！它可能就是传说中的时光裂口……先不说了！我去研究下！"],["……时光裂口！"],[function():void
                     {
                        TasksManager.complete(TASK_ID,2);
                     }]);
                  });
               }]);
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

