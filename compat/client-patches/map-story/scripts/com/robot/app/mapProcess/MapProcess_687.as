package com.robot.app.mapProcess
{
   import com.robot.app.task.taskscollection.Task1143;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.events.MouseEvent;

   public class MapProcess_687 extends BaseMapProcess
   {
      override protected function init() : void
      {
         topLevel.mouseEnabled = false;
         topLevel.mouseChildren = false;
         animatorLevel["task_811_3"].visible = false;
         conLevel["activity"].visible = false;
         conLevel["drag"].visible = false;
         conLevel["blood"].visible = false;
         conLevel["challenge"].visible = false;
         conLevel["vortex"].visible = false;
         conLevel["run"].visible = false;
         conLevel["pk"].visible = false;
         conLevel["poster"].buttonMode = true;
         conLevel["poster"].addEventListener(MouseEvent.CLICK,onPosterClick);
      }

      private function onPosterClick(event:MouseEvent) : void
      {
         Task1143.showPoster(this);
      }

      override public function destroy() : void
      {
         conLevel["poster"].removeEventListener(MouseEvent.CLICK,onPosterClick);
         Task1143.destroy(this);
      }
   }
}
