package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task540;
   import com.robot.core.animate.AnimateManager;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.AppModel;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import org.taomee.manager.ToolTipManager;

   public class MapProcess_439 extends BaseMapProcess
   {
      private var _red:int = 0;
      private var _green:int = 3;
      private const _point:Array = [220,245,252,230,294,235,320,255];
      private var _story:AppModel;
      private var _intro:AppModel;
      private var _deviceOpen:Boolean;
      private var _destroyed:Boolean;

      public function MapProcess_439()
      {
         super();
      }

      override protected function init() : void
      {
         conLevel["arrow"].visible = false;
         conLevel["door_0"].visible = false;
         ToolTipManager.add(conLevel["foot_1"],"脚印");
         conLevel["foot_1"].buttonMode = true;
         conLevel["foot_1"].addEventListener(MouseEvent.CLICK,onStoryClick);
         ToolTipManager.add(conLevel["foot_2"],"脚印");
         conLevel["foot_2"].buttonMode = true;
         conLevel["foot_2"].addEventListener(MouseEvent.CLICK,onIntroClick);
         conLevel["light_1"].buttonMode = true;
         conLevel["light_1"].mouseChildren = false;
         conLevel["light_1"].addEventListener(MouseEvent.CLICK,onLightClick);
         conLevel["light_2"].buttonMode = true;
         conLevel["light_2"].mouseChildren = false;
         conLevel["light_2"].addEventListener(MouseEvent.CLICK,onLightClick);
         var map:MapProcess_439 = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            Task540.initTask_0(map);
         },this);
      }

      private function onStoryClick(event:MouseEvent) : void
      {
         if(!_story)
         {
            _story = new AppModel(ClientConfig.getAppModule("StoneBook_540"),"正在加载面板");
            _story.setup();
         }
         _story.show();
      }

      private function onIntroClick(event:MouseEvent) : void
      {
         if(!_intro)
         {
            _intro = new AppModel(ClientConfig.getAppModule("StoneIntro_540"),"正在加载面板");
            _intro.setup();
         }
         _intro.show();
      }

      private function onLightClick(event:MouseEvent) : void
      {
         if(_deviceOpen) return;
         var light:MovieClip = event.currentTarget as MovieClip;
         if(light.name == "light_1")
         {
            if(_red == 0) _red = 2;
            else if(_red == 2 && _green != 3) _red = 3;
            light.x = _point[_red * 2];
            light.y = _point[_red * 2 + 1];
         }
         else
         {
            if(_green == 3) _green = 1;
            else if(_green == 1 && _red != 0) _green = 0;
            light.x = _point[_green * 2];
            light.y = _point[_green * 2 + 1];
         }
         if(_red == 3 && _green == 0)
         {
            _deviceOpen = true;
            conLevel["light_1"].buttonMode = false;
            conLevel["light_2"].buttonMode = false;
            conLevel["light_1"].removeEventListener(MouseEvent.CLICK,onLightClick);
            conLevel["light_2"].removeEventListener(MouseEvent.CLICK,onLightClick);
            var map:MapProcess_439 = this;
            AnimateManager.playMcAnimate(conLevel["door"],2,"mc",function():void
            {
               if(map._destroyed) return;
               map.typeLevel["path"].y = 0;
               MapManager.currentMap.makeMapArray();
               Task540.completeTask_0(map);
               map.conLevel["door_0"].visible = true;
            });
         }
      }

      override public function destroy() : void
      {
         _destroyed = true;
         Task540.destroy(this);
         ToolTipManager.remove(conLevel["foot_1"]);
         ToolTipManager.remove(conLevel["foot_2"]);
         conLevel["foot_1"].removeEventListener(MouseEvent.CLICK,onStoryClick);
         conLevel["foot_2"].removeEventListener(MouseEvent.CLICK,onIntroClick);
         conLevel["light_1"].removeEventListener(MouseEvent.CLICK,onLightClick);
         conLevel["light_2"].removeEventListener(MouseEvent.CLICK,onLightClick);
         if(_story) _story.destroy();
         if(_intro) _intro.destroy();
      }
   }
}
