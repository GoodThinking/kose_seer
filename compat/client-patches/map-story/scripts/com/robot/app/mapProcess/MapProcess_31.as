package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TaskController_28;
   import com.robot.core.manager.map.config.BaseMapProcess;

   public class MapProcess_31 extends BaseMapProcess
   {
      override protected function init() : void
      {
         conLevel["ear"].gotoAndStop(1);
         conLevel["picture"].visible = false;
         conLevel["picture"].mouseEnabled = false;
      }

      public function onClickEar() : void
      {
         TaskController_28.onEar(this);
      }

      override public function destroy() : void
      {
         TaskController_28.destroy(this);
      }
   }
}
