package com.robot.app.mapProcess
{
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.DisplayObjectContainer;
   import flash.display.InteractiveObject;
   
   public class MapProcess_926 extends BaseMapProcess
   {
      
      public function MapProcess_926()
      {
         super();
      }
      
      // 剧情触发区不再显示
      override protected function init() : void
      {
         conLevel["task934Trigger_1"].visible = false;
         // Preserve named story clips; only authored foreground scenery ignores input.
         for(var index:int = 0; index < topLevel.numChildren; index++)
         {
            var scenery:InteractiveObject = topLevel.getChildAt(index) as InteractiveObject;
            if(scenery && /^instance[0-9]+$/.test(scenery.name))
            {
               scenery.mouseEnabled = false;
               if(scenery is DisplayObjectContainer)
               {
                  DisplayObjectContainer(scenery).mouseChildren = false;
               }
            }
         }
      }
   }
}
