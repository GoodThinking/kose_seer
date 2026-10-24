package com.robot.app.npc
{
   import com.robot.app.task.control.TaskController_642;
   import com.robot.app.task.control.TaskController_530;
   import com.robot.app.task.control.TaskController_532;
   import com.robot.app.task.control.TaskController_535;
   import com.robot.app.task.control.TaskController_534;
   import com.robot.app.task.control.TaskController_540;
   import com.robot.app.task.control.TaskController_549;
   import com.robot.app.task.control.TaskController_558;
   import com.robot.app.task.control.TaskController_560;
   import com.robot.app.task.control.TaskController_561;
   import com.robot.app.task.control.TaskController_796;
   import com.robot.app.task.taskscollection.Task796;
   import com.robot.app.task.control.TasksController;
   import com.robot.app.taskPanel.TaskPanelController;
   import com.robot.core.CommandID;
   import com.robot.core.config.xml.TasksXMLInfo;
   import com.robot.core.event.NpcEvent;
   import com.robot.core.info.task.novice.NoviceFinishInfo;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.bean.BaseBeanController;
   import com.robot.core.mode.NpcModel;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcController;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.ui.alert.Alarm;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.EventManager;
   
   public class NpcInfoController extends BaseBeanController
   {
      private static const TREASURE_TASKS:Array = [TaskController_530,TaskController_532,TaskController_535,TaskController_534,TaskController_540,TaskController_549,TaskController_558,TaskController_560,TaskController_561];
      
      public function NpcInfoController()
      {
         super();
      }
      
      private static function onDelTask(param1:SocketEvent) : void
      {
         var _loc2_:uint = (param1.data as ByteArray).readUnsignedInt();
         TasksManager.setTaskStatus(_loc2_,TasksManager.UN_ACCEPT);
         NpcController.refreshTaskInfo();
      }
      
      private static function onAddBuf(param1:SocketEvent) : void
      {
         NpcController.refreshTaskInfo();
      }
      
      private static function onCompTask(param1:SocketEvent) : void
      {
         var _loc2_:NoviceFinishInfo = param1.data as NoviceFinishInfo;
         TasksManager.setTaskStatus(_loc2_.taskID,TasksManager.COMPLETE);
         NpcController.refreshTaskInfo();
      }
      
      override public function start() : void
      {
         EventManager.addEventListener(NpcEvent.SHOW_TASK_LIST,this.npcClickHandler);
         EventManager.addEventListener(NpcEvent.COMPLETE_TASK,this.completeTaskHandler);
         SocketConnection.addCmdListener(CommandID.ADD_TASK_BUF,onAddBuf);
         SocketConnection.addCmdListener(CommandID.COMPLETE_TASK,onCompTask);
         SocketConnection.addCmdListener(CommandID.DELETE_TASK,onDelTask);
         finish();
      }
      
      private function npcClickHandler(param1:NpcEvent) : void
      {
         var model:NpcModel = param1.model;
         if(this.showIrisTasks(model))
         {
            return;
         }
         if(model.npcInfo.npcId == NPC.SHIPER && MapManager.currentMap.id == 4 && TasksManager.getTaskStatus(TaskController_642.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TaskController_642.resumeCaptainReport(function(handled:Boolean):void
            {
               if(!handled && model.taskInfo != null)
               {
                  showNpcTasks(model);
               }
            });
            return;
         }
         this.showNpcTasks(model);
      }
      
      private function showIrisTasks(model:NpcModel) : Boolean
      {
         if(model.npcInfo.npcId != NPC.IRIS || MapManager.currentMap.id != 9)
         {
            return false;
         }
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            if(model.taskInfo == null || MapManager.currentMap == null || MapManager.currentMap.id != 9)
            {
               return;
            }
            if(TasksManager.getTaskStatus(788) == TasksManager.COMPLETE &&
               TasksManager.getTaskStatus(796) != TasksManager.COMPLETE)
            {
               TaskPanelController.show(model);
               return;
            }
            for each(var controller:Class in TREASURE_TASKS)
            {
               if(TasksManager.getTaskStatus(controller.TASK_ID) == TasksManager.COMPLETE) continue;
               if(!startIrisTask(model,controller.TASK_ID)) showNpcTasks(model);
               return;
            }
            showNpcTasks(model);
         });
         return true;
      }
      public static function startIrisTask(model:NpcModel, taskId:uint) : Boolean
      {
         if(model == null || model.taskInfo == null || model.npcInfo.npcId != NPC.IRIS ||
            MapManager.currentMap == null || MapManager.currentMap.id != 9) return false;
         var controller:Class;
         if(taskId == TaskController_796.TASK_ID) controller = TaskController_796;
         else
         {
            for each(var candidate:Class in TREASURE_TASKS)
            {
               if(candidate.TASK_ID == taskId)
               {
                  controller = candidate;
                  break;
               }
            }
         }
         if(controller == null) return false;
         var status:uint = TasksManager.getTaskStatus(taskId);
         if(status == TasksManager.UN_ACCEPT) controller.start();
         else if(status == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(taskId,function(progress:Array):void
            {
               if(model.taskInfo == null || MapManager.currentMap == null || MapManager.currentMap.id != 9) return;
               if(taskId == TaskController_796.TASK_ID)
               {
                  if(!progress[0]) Task796.acceptTask();
                  else TaskController_796.showPanel();
                  return;
               }
               var finalStage:int = TasksXMLInfo.getTaskPorCount(taskId) - 1;
               for(var stage:int = 0; stage < finalStage; stage++)
               {
                  if(!progress[stage])
                  {
                     controller.showPanel();
                     return;
                  }
               }
               controller.startPro();
            });
         }
         else return false;
         return true;
      }


      private function showNpcTasks(model:NpcModel) : void
      {
         if(model.taskInfo.acceptList.length > 0)
         {
            TaskPanelController.show(model);
         }
         else if(model.des != "")
         {
            NpcDialog.show(model.npcInfo.npcId,[model.des],model.npcInfo.questionA);
         }
         else
         {
            model.dispatchEvent(new NpcEvent(NpcEvent.NPC_CLICK,model));
         }
      }
      
      private function completeTaskHandler(param1:NpcEvent) : void
      {
         var model:NpcModel = null;
         var id:uint = 0;
         var event:NpcEvent = param1;
         model = null;
         id = 0;
         model = event.model;
         if(this.showIrisTasks(model))
         {
            return;
         }
         if(model.taskInfo.completeList.length > 0)
         {
            id = uint(model.taskInfo.completeList.slice().shift());
            TasksManager.complete(id,TasksXMLInfo.getTaskPorCount(id) - 1,function(param1:Boolean):void
            {
               if(param1)
               {
                  TasksManager.setTaskStatus(id,TasksManager.COMPLETE);
                  model.refreshTask();
               }
               else
               {
                  Alarm.show("提交任务失败，请稍后再试");
               }
            });
         }
      }
   }
}
