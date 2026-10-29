package com.robot.app.mapProcess
{
   import com.robot.app.fightLevel.FightPetBagController;
   import com.robot.app.task.control.TaskController_131;
   import com.robot.core.event.PetFightEvent;
   import com.robot.core.group.fightInfo.fightOver.GroupFightOverInfo;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import flash.events.MouseEvent;
   import org.taomee.manager.EventManager;
   import org.taomee.manager.ToolTipManager;

   public class MapProcess_337 extends BaseMapProcess
   {
      private var active:Boolean;

      public function MapProcess_337()
      {
         super();
      }

      override protected function init() : void
      {
         active = true;
         EventManager.addEventListener(PetFightEvent.ALARM_CLICK,this.onPetFightHandler);
         ToolTipManager.add(conLevel["door_0"],"离开");
         ToolTipManager.add(conLevel["mosterMc"],"精灵背包");
         conLevel["mosterMc"].addEventListener(MouseEvent.CLICK,this.onMonsterHandler);
      }

      private function onPetFightHandler(event:PetFightEvent) : void
      {
         var result:GroupFightOverInfo = event.dataObj as GroupFightOverInfo;
         if(!active || result == null || result.type != 1 || result.endReason != 1) return;
         if(result.winnerID == 1)
         {
            if(TasksManager.getTaskStatus(TaskController_131.TASK_ID) != TasksManager.ALR_ACCEPT) return;
            TasksManager.getProStatusList(TaskController_131.TASK_ID,function(progress:Array):void
            {
               if(!active || !progress[1] || progress[3]) return;
               if(progress[2]) TaskController_131.showPanel();
               else TasksManager.complete(TaskController_131.TASK_ID,2,null,true);
            });
         }
         else
         {
            NpcDialog.show(NPC.LEGION,["看来你和你的队友还需要再接再厉哦！"],["我会再来挑战的！"]);
         }
      }

      private function onMonsterHandler(event:MouseEvent) : void
      {
         FightPetBagController.show();
      }

      override public function destroy() : void
      {
         active = false;
         ToolTipManager.remove(conLevel["mosterMc"]);
         conLevel["mosterMc"].removeEventListener(MouseEvent.CLICK,this.onMonsterHandler);
         ToolTipManager.remove(conLevel["door_0"]);
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,this.onPetFightHandler);
      }

      public function leaveFight() : void
      {
         MapManager.changeMap(336);
      }
   }
}
