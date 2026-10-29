package com.robot.app.mapProcess
{
   import com.robot.app.energy.utils.*;
   import com.robot.app.fightNote.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.BossModel;
   import com.robot.core.npc.*;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import flash.utils.setTimeout;
   import org.taomee.manager.ToolTipManager;
   
   public class MapProcess_16 extends BaseMapProcess
   {
      
      private var gasMC:MovieClip;
      
      private var type:uint;
      
      private var _bossMC:BossModel;
      
      public function MapProcess_16()
      {
         super();
      }
      
      override protected function init() : void
      {
         this.gasMC = conLevel["gasEffectMC"];
         this.gasMC.gotoAndStop(3);
         var deepDoor:MovieClip = conLevel["door_0"] as MovieClip;
         ToolTipManager.add(conLevel["stoneMC"],"点击岩石三次，打开火山星深处通道");
         ToolTipManager.add(deepDoor,"前往火山星深处");
      }
      
      override public function destroy() : void
      {
         ToolTipManager.remove(conLevel["door_0"]);
         ToolTipManager.remove(conLevel["stoneMC"]);
         this.gasMC = null;
      }
      
      public function exploitGas() : void
      {
         EnergyController.exploit();
      }
      
      private function initBoss() : void
      {
         if(!this._bossMC)
         {
            this._bossMC = new BossModel(393,0);
            this._bossMC.show(new Point(700,380),0);
            this._bossMC.scaleY = 1.3;
            this._bossMC.scaleX = 1.3;
            setTimeout(function():void
            {
               _bossMC.direction = "left";
            },300);
         }
         this._bossMC.mouseEnabled = true;
         this._bossMC.addEventListener(MouseEvent.CLICK,this.onBossClick);
         ToolTipManager.add(this._bossMC,"上古炎兽");
      }
      
      private function onBossClick(param1:MouseEvent) : void
      {
         var _loc2_:MouseEvent = param1;
         FightInviteManager.fightWithBoss("上古炎兽");
      }
   }
}
