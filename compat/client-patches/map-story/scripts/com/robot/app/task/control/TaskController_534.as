package com.robot.app.task.control
{
   import com.robot.app.task.taskscollection.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   
   public class TaskController_534
   {
      
      private static var panel:AppModel;
      
      public static const TASK_ID:uint = 534;
      
      public function TaskController_534()
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
         NpcDialog.show(NPC.IRIS,["我想我已经锁定了石化星球的具体位置……这颗星球被称为墨杜萨星！"],["那还等什么？为什么不快速起航呀！","我一会再来找你哟！"],[function():void
         {
            TasksManager.accept(TASK_ID,function(param1:Boolean):void
            {
               if(param1)
               {
                  Task534.initTask();
               }
            });
         }]);
      }
      
      public static function startPro() : void
      {
         TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
         {
            var arr:Array = param1;
            if(Boolean(arr[0]) && Boolean(arr[1]) && !arr[2])
            {
               NpcDialog.show(NPC.IRIS,["原来那个怪兽不是自己想要这样的……在这颗星球的背后竟然有这么一个凄美的故事……"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.IRIS,["我总觉得赫尔卡星宝藏的背后会有很多故事……哈哈！冒险的爱丽丝越来越兴奋咯！期待我们下一次的冒险吧！"],["终有一天我们会知道赫尔卡星的秘密……"],[function():void
                  {
                     TasksManager.complete(TASK_ID,2);
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

