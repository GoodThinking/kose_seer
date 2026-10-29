package com.robot.app.mapProcess
{
   import com.robot.app.ogre.*;
   import com.robot.core.config.xml.*;
   import com.robot.core.effect.*;
   import com.robot.core.event.MapEvent;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.PetModel;
   import com.robot.core.ui.alert.*;
   import flash.display.MovieClip;
   import flash.geom.*;
   import flash.utils.*;
   
   public class MapProcess_36 extends BaseMapProcess
   {
      
      private static var _activatedPillars:Array = [];
      
      private static var _owner:uint = 0;
      
      private var _activationTimers:Array = [];
      
      public function MapProcess_36()
      {
         super();
      }
      
      override protected function init() : void
      {
         var _loc1_:uint = 0;
         var pillar:MovieClip = null;
         var activated:Boolean = false;
         if(_owner != MainManager.actorID)
         {
            _activatedPillars.length = 0;
            _owner = MainManager.actorID;
         }
         // Keep the native top row left of the temple's electrical pillars.
         TaskIconManager.rightInset = 300;
         MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,this.onLeaveMap);
         while(_loc1_ < 4)
         {
            pillar = conLevel["pillar_" + _loc1_] as MovieClip;
            activated = _activatedPillars.indexOf(pillar.name) >= 0;
            pillar.gotoAndStop(activated ? 2 : 1);
            pillar.mouseEnabled = !activated;
            _loc1_++;
         }
         animatorLevel["lightMC"].gotoAndStop(1);
         OgreController.isShow = _activatedPillars.length == 4;
      }
      
      override public function destroy() : void
      {
         MapManager.removeEventListener(MapEvent.MAP_SWITCH_OPEN,this.onLeaveMap);
         for each(var timeout:uint in this._activationTimers)
         {
            clearTimeout(timeout);
         }
         this._activationTimers.length = 0;
         TaskIconManager.rightInset = 0;
         OgreController.isShow = true;
      }
      
      private function onLeaveMap(param1:MapEvent) : void
      {
         // Battle teardown does not end this visit; a real map switch does.
         _activatedPillars.length = 0;
      }
      
      public function hitPillar(param1:MovieClip) : void
      {
         var effect:LightEffect = null;
         var model:PetModel = null;
         var id:uint = 0;
         var mc:MovieClip = param1;
         if(_activatedPillars.indexOf(mc.name) >= 0)
         {
            return;
         }
         model = MainManager.actorModel.pet;
         var b:Boolean = true;
         if(!model)
         {
            b = false;
         }
         else
         {
            id = uint(model.info.petID);
            if(PetXMLInfo.getType(id) != "5")
            {
               b = false;
            }
         }
         if(!b)
         {
            Alarm.show("这根柱子缺少启动电能，带上<font color=\'#ff0000\'>电系精灵</font>或许能激活它。");
            return;
         }
         mc.mouseEnabled = false;
         _activatedPillars.push(mc.name);
         model.stop();
         effect = new LightEffect();
         effect.show(new Point(model.x,model.y - model.height + 2),new Point(mc.x + mc.width / 2,mc.y + mc.height - 5),false);
         this._activationTimers.push(setTimeout(function():void
         {
            mc.gotoAndStop(2);
         },1000));
         if(_activatedPillars.length == 4)
         {
            OgreController.isShow = true;
         }
      }
   }
}
