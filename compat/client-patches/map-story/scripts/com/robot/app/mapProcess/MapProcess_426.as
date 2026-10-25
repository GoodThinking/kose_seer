package com.robot.app.mapProcess
{
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.utils.CommonUI;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.manager.ToolTipManager;

   public class MapProcess_426 extends BaseMapProcess
   {
      private var _exit:Sprite;

      override protected function init() : void
      {
         animatorLevel["task_811_2"].visible = false;
         _exit = new Sprite();
         _exit.name = "laboratoryReturn";
         _exit.x = 80;
         _exit.y = 440;
         _exit.graphics.beginFill(0xffffff,0.01);
         _exit.graphics.drawEllipse(-35,-30,70,60);
         _exit.graphics.endFill();
         CommonUI.addYellowArrow(_exit);
         _exit.buttonMode = true;
         _exit.mouseChildren = false;
         _exit.addEventListener(MouseEvent.CLICK,onExit);
         ToolTipManager.add(_exit,"返回实验室");
         conLevel.addChild(_exit);
      }

      private function onExit(event:MouseEvent) : void
      {
         MapManager.changeMap(5);
      }

      override public function destroy() : void
      {
         _exit.removeEventListener(MouseEvent.CLICK,onExit);
         ToolTipManager.remove(_exit);
      }
   }
}
