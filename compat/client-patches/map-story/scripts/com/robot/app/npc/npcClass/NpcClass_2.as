package com.robot.app.npc.npcClass
{
   import com.robot.app.task.noviceGuide.XixiDialog;
   import com.robot.app.task.skeeClothTask.SkeeClothTaskController;
   import com.robot.core.event.NpcEvent;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.mode.NpcModel;
   import com.robot.core.npc.INpc;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.npc.NpcInfo;
   import flash.display.DisplayObject;
   import flash.display.Sprite;

   public class NpcClass_2 implements INpc
   {
      private var _curNpcModel:NpcModel;
      private var _busy:Boolean = false;
      private var _dialogVersion:uint = 0;

      public function NpcClass_2(param1:NpcInfo, param2:DisplayObject)
      {
         super();
         this._curNpcModel = new NpcModel(param1,param2 as Sprite);
         this._curNpcModel.addEventListener(NpcEvent.NPC_CLICK,this.onClickNpc);
      }

      private function onClickNpc(param1:NpcEvent) : void
      {
         if(this._busy) return;
         ++this._dialogVersion;
         this._curNpcModel.refreshTask();
         if(param1.taskID == 7)
         {
            this.showTask7();
            return;
         }
         XixiDialog.show(param1.taskID);
      }

      private function showTask7() : void
      {
         var version:uint = this._dialogVersion;
         var status:uint = TasksManager.getTaskStatus(7);
         if(status == TasksManager.COMPLETE)
         {
            NpcDialog.show(NPC.CICI,["防寒材料可在动力室的物质转换仪通过配方2转换成防寒服。"],["知道了。"]);
            return;
         }
         if(status != TasksManager.ALR_ACCEPT)
         {
            NpcDialog.show(NPC.CICI,["请先接取防寒服任务，再收集材料。"],["知道了。"]);
            return;
         }
         this._busy = true;
         TasksManager.getProStatusList(7,function(progress:Array):void
         {
            if(_curNpcModel == null || version != _dialogVersion) return;
            _busy = false;
            if(progress == null || progress.length < 2)
            {
               NpcDialog.show(NPC.CICI,["暂时无法读取材料进度，请稍后再试。"],["知道了。"]);
               return;
            }
            var missing:String = "";
            if(!progress[0]) missing += "植物纤维在克洛斯草原深处获取。";
            if(!progress[1]) missing += "炎晶在火山星深处获取，需要水系精灵帮助。";
            if(missing != "")
            {
               NpcDialog.show(NPC.CICI,[missing],["我去收集。"]);
               return;
            }
            NpcDialog.show(NPC.CICI,["植物纤维和炎晶都收集好了，要交给我合成防寒材料吗？"],["确认交付。","暂不交付。"],[function():void
            {
               if(_curNpcModel == null || version != _dialogVersion || _busy) return;
               _busy = true;
               TasksManager.complete(7,2,function(success:Boolean):void
               {
                  if(success) SkeeClothTaskController.delIcon();
                  if(_curNpcModel == null || version != _dialogVersion) return;
                  _busy = false;
                  ++_dialogVersion;
                  if(success)
                  {
                     _curNpcModel.refreshTask();
                     NpcDialog.show(NPC.CICI,["防寒材料已取得或已持有。去动力室的物质转换仪使用配方2，可以转换成防寒服。"],["知道了。"]);
                  }
                  else
                  {
                     NpcDialog.show(NPC.CICI,["交付未成功，请稍后再试。"],["知道了。"]);
                  }
               });
            },function():void
            {
               if(_curNpcModel == null || version != _dialogVersion) return;
               ++_dialogVersion;
            }]);
         });
      }

      public function destroy() : void
      {
         ++this._dialogVersion;
         if(Boolean(this._curNpcModel))
         {
            this._curNpcModel.removeEventListener(NpcEvent.NPC_CLICK,this.onClickNpc);
            this._curNpcModel.destroy();
            this._curNpcModel = null;
         }
      }

      public function get npc() : NpcModel
      {
         return this._curNpcModel;
      }
   }
}
