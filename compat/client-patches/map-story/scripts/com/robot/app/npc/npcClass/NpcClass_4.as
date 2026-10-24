package com.robot.app.npc.npcClass
{
   import com.robot.app.npc.NpcInfoController;
   import com.robot.core.event.NpcEvent;
   import com.robot.core.mode.NpcModel;
   import com.robot.core.npc.INpc;
   import com.robot.core.npc.NpcInfo;
   import flash.display.DisplayObject;
   import flash.display.Sprite;

   public class NpcClass_4 implements INpc
   {
      private var _curNpcModel:NpcModel;

      public function NpcClass_4(info:NpcInfo, content:DisplayObject)
      {
         _curNpcModel = new NpcModel(info,content as Sprite);
         _curNpcModel.addEventListener(NpcEvent.NPC_CLICK,onClickNpc);
         _curNpcModel.addEventListener(NpcEvent.TASK_WITHOUT_DES,onClickNpc);
      }

      private function onClickNpc(event:NpcEvent) : void
      {
         if(_curNpcModel == null) return;
         if(!NpcInfoController.startIrisTask(_curNpcModel,event.taskID)) _curNpcModel.refreshTask();
      }

      public function destroy() : void
      {
         if(_curNpcModel == null) return;
         _curNpcModel.removeEventListener(NpcEvent.NPC_CLICK,onClickNpc);
         _curNpcModel.removeEventListener(NpcEvent.TASK_WITHOUT_DES,onClickNpc);
         _curNpcModel.destroy();
         _curNpcModel = null;
      }

      public function get npc() : NpcModel
      {
         return _curNpcModel;
      }
   }
}
