package com.robot.app.mapProcess
{
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.utils.CommonUI;
   import flash.display.InteractiveObject;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.manager.ToolTipManager;

   public class MapProcess_666 extends BaseMapProcess
   {
      private var _exit:Sprite;
      private var _destroyed:Boolean;

      override protected function init() : void
      {
         conLevel["task_811_1"].visible = false;
         conLevel["task816tig"].visible = false;
         conLevel["bloodMc"].visible = false;
         for(var i:uint = 0; i < 4; i++)
         {
            var stone:InteractiveObject = conLevel["stone_" + i] as InteractiveObject;
            if(stone is Sprite) Sprite(stone).buttonMode = true;
            stone.addEventListener(MouseEvent.CLICK,onStatue);
            ToolTipManager.add(stone,"守护神：查看禁地线索");
         }
         _exit = new Sprite();
         _exit.name = "captainReturn";
         _exit.x = 840;
         _exit.y = 425;
         _exit.graphics.beginFill(0xffffff,0.01);
         _exit.graphics.drawEllipse(-35,-28,70,56);
         _exit.graphics.endFill();
         CommonUI.addYellowArrow(_exit);
         _exit.buttonMode = true;
         _exit.mouseChildren = false;
         _exit.addEventListener(MouseEvent.CLICK,onExit);
         ToolTipManager.add(_exit,"返回船长室");
         topLevel.addChild(_exit);
      }

      private function onStatue(event:MouseEvent) : void
      {
         var message:String = TasksManager.getTaskStatus(816) == TasksManager.COMPLETE
            ? "禁地记录着守护神与珀伽索斯的约定。下一步去船长室汇报，再沿着任务档案追查尼古尔星的线索。"
            : "这里是菲尼克斯禁地。四座石像记录着上古圣战的往事；向船长汇报泰若星的调查后，就能继续追寻这些线索。";
         NpcDialog.show(NPC.SEER,[message],["返回船长室","继续观察"],[function():void
         {
            if(!_destroyed) MapManager.changeMap(4);
         }]);
      }

      private function onExit(event:MouseEvent) : void
      {
         MapManager.changeMap(4);
      }

      override public function destroy() : void
      {
         _destroyed = true;
         for(var i:uint = 0; i < 4; i++)
         {
            var stone:InteractiveObject = conLevel["stone_" + i] as InteractiveObject;
            stone.removeEventListener(MouseEvent.CLICK,onStatue);
            ToolTipManager.remove(stone);
         }
         _exit.removeEventListener(MouseEvent.CLICK,onExit);
         ToolTipManager.remove(_exit);
      }
   }
}
