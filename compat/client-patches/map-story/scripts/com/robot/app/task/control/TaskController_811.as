package com.robot.app.task.control
{
   import com.robot.app.task.taskscollection.Task811;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.map.config.MapProcessConfig;
   import com.robot.core.mode.AppModel;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.ui.alert.Alarm;

   public class TaskController_811
   {
      public static const TASK_ID:uint = 811;
      private static var panel:AppModel;

      public static function setup() : void
      {
         if(panel != null) return;
         panel = new AppModel(ClientConfig.getTaskModule("TaskPanel_811"),"正在打开任务信息");
         panel.setup();
      }

      public static function showPanel() : void
      {
         setup();
         panel.show();
      }

      public static function start() : void
      {
         if(TasksManager.getTaskStatus(TASK_ID) != TasksManager.UN_ACCEPT)
         {
            showPanel();
            return;
         }
         if(TasksManager.getTaskStatus(801) != TasksManager.COMPLETE)
         {
            Alarm.show("请先完成前一章任务，再继续这段调查。");
            return;
         }
         var owner:BaseMapProcess = MapProcessConfig.currentProcessInstance;
         NpcDialog.show(NPC.DOCTOR,["冰狐恢复得不错。关于珀伽索斯的力量，我在秘密基地找到了新的线索，你愿意和我一起调查吗？"],["接受任务","以后再来"],[function():void
         {
            if(MapProcessConfig.currentProcessInstance !== owner) return;
            TasksManager.accept(TASK_ID,function(success:Boolean):void
            {
               if(!success || MapProcessConfig.currentProcessInstance !== owner) return;
               if(MapManager.currentMap.id != 5) MapManager.changeMap(5);
               else Task811.initTaskForMap5(owner);
            });
         }]);
      }

      public static function destroy() : void
      {
         if(panel == null) return;
         panel.destroy();
         panel = null;
      }
   }
}
