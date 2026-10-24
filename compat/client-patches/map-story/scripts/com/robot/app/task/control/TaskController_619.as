package com.robot.app.task.control
{
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   import org.taomee.debug.*;
   
   public class TaskController_619
   {
      
      private static var panel:AppModel;
      
      public static const TASK_ID:uint = 619;
      
      public function TaskController_619()
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
      }
      
      public static function startPro() : void
      {
         TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
         {
            var array:Array = param1;
            if(Boolean(array[0]) && Boolean(array[1]) && Boolean(array[2]) && !array[3])
            {
               NpcDialog.show(NPC.DOCTOR,["这个难道就是传说中的阴阳能力吗？我也从来没有遇见过这样的精灵……"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.DOCTOR,["是善是恶恐怕还不能下定论！但是它很有可能就是咤克斯所说的黑暗之子……不管怎么说，这次辛苦你了！"],["（诅咒之子……诅咒之子……）"],[function():void
                  {
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_619_1"),function():void
                     {
                        TasksManager.complete(TASK_ID,3,function(param1:Boolean):void
                        {
                           if(!param1)
                           {
                              DebugTrace.show("提交任务失败！");
                           }
                        });
                     });
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

