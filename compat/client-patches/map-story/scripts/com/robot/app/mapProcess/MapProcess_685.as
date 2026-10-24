package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task796;
   import com.robot.app.task.taskscollection.Task801;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.utils.CommonUI;
   import com.robot.core.aimat.AimatController;
   import com.robot.core.animate.AnimateManager;
   import com.robot.core.event.AimatEvent;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.geom.Point;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.DisplayUtil;

   public class MapProcess_685 extends BaseMapProcess
   {
      private var _destroyed:Boolean;

      override protected function init() : void
      {
         animatorLevel["task_811_5"].visible = false;
         animatorLevel["task_801_2"].visible = false;
         animatorLevel["task_796_2"].visible = false;
         ToolTipManager.add(conLevel["iceBridge"],"冰锥");
         AimatController.addEventListener(AimatEvent.PLAY_END,onShootIce);
         var map:MapProcess_685 = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task796.initTaskForMap685(map);
            if(TasksManager.getTaskStatus(796) == TasksManager.COMPLETE) Task801.initTaskForMap685(map);
         },this);
      }

      private function onShootIce(event:AimatEvent) : void
      {
         if(_destroyed || event.info.userID != MainManager.actorID) return;
         var point:Point = event.info.endPos;
         if(!conLevel["iceBridge"].hitTestPoint(point.x,point.y)) return;
         ToolTipManager.remove(conLevel["iceBridge"]);
         AimatController.removeEventListener(AimatEvent.PLAY_END,onShootIce);
         CommonUI.removeYellowArrow(conLevel["iceBridge"]);
         AnimateManager.playMcAnimate(conLevel["iceBridge"],1,"",function():void
         {
            if(_destroyed) return;
            DisplayUtil.removeForParent(typeLevel["barrier"]);
            MapManager.currentMap.makeMapArray();
            if(TasksManager.getTaskStatus(796) == TasksManager.ALR_ACCEPT)
            {
               TasksManager.getProStatusList(796,function(progress:Array):void
               {
                  if(_destroyed) return;
                  if(progress[0] && progress[1] && !progress[2]) Task796.onShootIceOver();
               });
            }
         });
      }

      override public function destroy() : void
      {
         _destroyed = true;
         Task796.destroy(this);
         Task801.destroy(this);
         ToolTipManager.remove(conLevel["iceBridge"]);
         AimatController.removeEventListener(AimatEvent.PLAY_END,onShootIce);
      }
   }
}
