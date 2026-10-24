package com.robot.app.task.control
{
   import com.robot.app.task.taskscollection.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   
   public class TaskController_535
   {
      
      private static var panel:AppModel;
      
      public static const TASK_ID:uint = 535;
      
      public function TaskController_535()
      {
         super();
      }
      
      public static function start() : void
      {
         NpcDialog.show(NPC.IRIS,[MainManager.actorInfo.nick + "，你知道吗！我终于找到了关于死亡星球的信息！嘿嘿！你等等，我这就拿给你看！"],["真的吗？快给我看看！","我一会再来找你哟！"],[function():void
         {
            TasksManager.accept(TASK_ID,function(param1:Boolean):void
            {
               if(param1)
               {
                  Task535.initTask_1();
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
               NpcDialog.show(NPC.IRIS,["石化之城？生锈的生命之匙……说实话，我也不知道这究竟是怎么一回事……"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.IRIS,["没有什么能难倒爱冒险的爱丽丝的！等我好消息吧！就算翻阅所有资料，我也一定要找到赫尔卡星宝藏！"],null,null,false,function():void
                  {
                     NpcDialog.show(NPC.IRIS,["哦对了，差点忘记了，这是给你的奖励！辛苦你啦！"],["下一个冒险又会是什么呢？"],[function():void
                     {
                        TasksManager.complete(TASK_ID,3);
                     }]);
                  });
               });
            }
         });
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

