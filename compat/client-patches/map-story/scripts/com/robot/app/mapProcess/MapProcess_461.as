package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task561;
   import com.robot.app.toolBar.ToolBarController;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.MovieClip;
   import flash.events.Event;

   public class MapProcess_461 extends BaseMapProcess
   {
      private var _tree:MovieClip;

      override protected function init() : void
      {
         ToolBarController.showOrHideAllUser(false);
         depthLevel["erdangjia"].visible = false;
         conLevel["dumpLightMc0"].visible = false;
         conLevel["dumpLightMc1"].visible = false;
         conLevel["dumpLightMc2"].visible = false;
         conLevel["dumpLightMc3"].visible = false;
         conLevel["dumpLightMc4"].visible = false;
         _tree = topLevel["tree"];
         _tree.stop();
         _tree.addEventListener(Event.ENTER_FRAME,onTreeFrame);
         _tree.gotoAndPlay(1);
         var bossAnimation:MovieClip = conLevel.getChildByName("taskMC") as MovieClip;
         if(bossAnimation != null)
         {
            bossAnimation.stop();
            bossAnimation.visible = false;
            bossAnimation.mouseEnabled = false;
            bossAnimation.mouseChildren = false;
         }
         var map:MapProcess_461 = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task561.initTask_461(map);
         },this);
      }

      private function onTreeFrame(event:Event) : void
      {
         var tree:MovieClip = event.currentTarget as MovieClip;
         if(tree.currentFrame == tree.totalFrames || tree.currentFrame == 3)
         {
            tree.gotoAndPlay(1);
         }
      }

      override public function destroy() : void
      {
         ToolBarController.showOrHideAllUser(true);
         _tree.removeEventListener(Event.ENTER_FRAME,onTreeFrame);
         _tree = null;
         Task561.destroy(this);
      }
   }
}
