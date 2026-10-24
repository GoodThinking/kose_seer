package com.robot.app.task.control
{
   import com.robot.app.task.taskscollection.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   
   public class TaskController_560
   {
      
      private static var panel:AppModel;
      
      public static const TASK_ID:uint = 560;
      
      public function TaskController_560()
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
         NpcDialog.show(NPC.IRIS,["时空裂口……那真的就是时空裂口！钥匙可能就在那里！" + MainManager.actorInfo.nick + "，你真的准备前往那里寻找化身之匙 吗？"],["是的！我已经准备好了！","我一会再来找你哟！"],[function():void
         {
            TasksManager.accept(TASK_ID,function(param1:Boolean):void
            {
               if(param1)
               {
                  Task560.initTask();
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
               NpcDialog.show(NPC.IRIS,["精灵是我们最好的朋友，在我们需要帮助的时候他们总能挺身而出……阿哆拉好伟大!"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.IRIS,["55555~~~好伤感！哦对了，你已经拿到最后一把钥匙了吗？赫尔卡星宝藏一定不能被海盗打开！我先去研究一下方位，这是给你的奖赏！"],["任务完成！"],[function():void
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

