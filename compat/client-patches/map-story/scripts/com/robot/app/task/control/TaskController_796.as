package com.robot.app.task.control
{
   import com.robot.app.task.taskscollection.Task796;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.mode.AppModel;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;

   public class TaskController_796
   {
      public static const TASK_ID:uint = 796;
      private static var panel:AppModel;

      public static function showPanel() : void
      {
         if(panel == null)
         {
            panel = new AppModel(ClientConfig.getTaskModule("TaskPanel_796"),"正在打开任务信息");
            panel.setup();
         }
         panel.show();
      }

      public static function setup() : void
      {
      }

      public static function start() : void
      {
         var owner:Object = MapManager.currentMap;
         NpcDialog.show(NPC.IRIS,["最近听派特博士说泰若星出现了一个名叫0xff0000暗夜冰狐0xffffff的精灵，不知道还会有哪些精灵受到威胁，怎么办啊！"],["暗夜冰狐！","现在有事！"],[function():void
         {
            if(MapManager.currentMap !== owner) return;
            TasksManager.accept(TASK_ID,function(success:Boolean):void
            {
               if(MapManager.currentMap !== owner || !success) return;
               Task796.acceptTask();
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
