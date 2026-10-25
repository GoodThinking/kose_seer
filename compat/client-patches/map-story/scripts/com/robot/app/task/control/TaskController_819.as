package com.robot.app.task.control
{
   import com.robot.app.task.taskscollection.Task819;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.map.config.MapProcessConfig;
   import com.robot.core.mode.AppModel;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.ui.alert.Alarm;

   public class TaskController_819
   {
      public static const TASK_ID:uint = 819;
      private static var panel:AppModel;

      public static function setup() : void
      {
         if(panel != null) return;
         panel = new AppModel(ClientConfig.getTaskModule("TaskPanel_819"),"正在打开任务信息");
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
         if(TasksManager.getTaskStatus(816) != TasksManager.COMPLETE)
         {
            Alarm.show("请先完成前一章任务，再继续这段调查。");
            return;
         }
         var owner:BaseMapProcess = MapProcessConfig.currentProcessInstance;
         NpcDialog.show(NPC.SHIPER,["朱雀希望我们找到更多关于天马的线索。尼古尔星的米洛尼知道上古圣战的往事，你准备好出发了吗？"],["接受任务","以后再来"],[function():void
         {
            if(MapProcessConfig.currentProcessInstance !== owner) return;
            TasksManager.accept(TASK_ID,function(success:Boolean):void
            {
               if(!success || MapProcessConfig.currentProcessInstance !== owner) return;
               if(MapManager.currentMap.id != 4) MapManager.changeMap(4);
               else Task819.initTaskForMap4(owner);
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
