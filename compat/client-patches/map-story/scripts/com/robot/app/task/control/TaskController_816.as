package com.robot.app.task.control
{
   import com.robot.app.task.taskscollection.Task816;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.map.config.MapProcessConfig;
   import com.robot.core.mode.AppModel;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.ui.alert.Alarm;

   public class TaskController_816
   {
      public static const TASK_ID:uint = 816;
      private static var panel:AppModel;

      public static function setup() : void
      {
         if(panel != null) return;
         panel = new AppModel(ClientConfig.getTaskModule("TaskPanel_816"),"正在打开任务信息");
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
         if(TasksManager.getTaskStatus(811) != TasksManager.COMPLETE)
         {
            Alarm.show("请先完成前一章任务，再继续这段调查。");
            return;
         }
         var owner:BaseMapProcess = MapProcessConfig.currentProcessInstance;
         NpcDialog.show(NPC.SHIPER,["你和神狐一族守护了泰若星，干得漂亮！博士找到了上古圣战的线索，这次需要你前往菲尼克斯禁地调查。"],["接受任务","以后再来"],[function():void
         {
            if(MapProcessConfig.currentProcessInstance !== owner) return;
            TasksManager.accept(TASK_ID,function(success:Boolean):void
            {
               if(!success || MapProcessConfig.currentProcessInstance !== owner) return;
               if(MapManager.currentMap.id != 4) MapManager.changeMap(4);
               else Task816.initTaskForMap4(owner);
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
