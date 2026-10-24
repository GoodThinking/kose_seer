package com.robot.app.task.control
{
   import com.robot.app.task.taskscollection.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   
   public class TaskController_530
   {
      
      private static var panel:AppModel;
      
      public static const TASK_ID:uint = 530;
      
      public function TaskController_530()
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
         NpcDialog.show(NPC.IRIS,["根据赫尔卡星档案中所说，打开赫尔卡星宝藏需要6把具有独特意义的机械钥匙……"],["嗯……"],[function():void
         {
            NpcDialog.show(NPC.IRIS,["每一把钥匙都是这颗星球的守护物，它们之间一定有所关联！哦，对了，我前面做了一些分析……"],["我对赫尔卡星宝藏的事情很感兴趣，你多告诉我点吧！","我一会再来找你哟！"],[function():void
            {
               TasksManager.accept(TASK_ID,function(param1:Boolean):void
               {
                  if(param1)
                  {
                     Task530.initTask_1();
                  }
               });
            }]);
         }]);
      }
      
      public static function startPro() : void
      {
         TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
         {
            var progress:Array = param1;
            if(Boolean(progress[1]) && !progress[2])
            {
               NpcDialog.show(NPC.IRIS,["真的吗？你真的已经拿到了第一把钥匙？不对啊！它怎么失去光彩了？这实在是太不可思议了……"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.IRIS,["我想肯定是有谁动过手脚了！我需要研究一下！至于传言中的死亡星球！等我的好消息吧！"],["嗯！我等你消息！"],[function():void
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
