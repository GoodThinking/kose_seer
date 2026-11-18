package com.robot.app.mapProcess
{
   import com.robot.app.energy.utils.*;
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.app.spacesurvey.*;
   import com.robot.app.task.control.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.BossModel;
   import com.robot.core.mode.OgreModel;
   import com.robot.core.npc.*;
   import com.robot.core.ui.alert.Answer;
   import com.robot.core.utils.CommonUI;
   import flash.filters.GlowFilter;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.*;
   import flash.geom.Point;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.utils.setTimeout;
   import org.taomee.manager.ToolTipManager;
   
   public class MapProcess_10 extends BaseMapProcess
   {
      
      private var pipi_npc:OgreModel;
      
      private var _pipi_mc:MovieClip;
      
      private var _pipi_pic:MovieClip;
      
      private var _bossMC:BossModel;
      
      private var wetlandButton:Sprite;
      
      public function MapProcess_10()
      {
         super();
      }
      
      override protected function init() : void
      {
         SpaceSurveyTool.getInstance().show("克洛斯星");
         this._pipi_mc = topLevel["pipi_mc"];
         this._pipi_mc.gotoAndStop(1);
         this._pipi_mc.visible = false;
         if(TasksManager.getTaskStatus(TaskController_90.TASK_ID) == TasksManager.COMPLETE)
         {
            if(Boolean(NpcController.curNpc))
            {
               this.addEventNpc();
            }
            return;
         }
         this._pipi_pic = MapLibManager.getMovieClip("Pipipic");
         topLevel.addChild(this._pipi_pic);
         this._pipi_pic.x = 2000;
         this._pipi_pic.y = 97;
         TasksManager.getProStatusList(TaskController_90.TASK_ID,function(param1:Array):void
         {
            TaskController_90.initFun(delAdd,_pipi_mc,_pipi_pic);
            if(Boolean(param1[0]))
            {
               addEventNpc();
            }
         });
      }
      
      private function addEventNpc() : void
      {
         this._pipi_mc.addEventListener(Event.ENTER_FRAME,this.enterFrameHandler);
      }
      
      private function enterFrameHandler(param1:Event) : void
      {
         if(Boolean(NpcController.curNpc))
         {
            this._pipi_mc.removeEventListener(Event.ENTER_FRAME,this.enterFrameHandler);
            NpcController.curNpc.npc.npc.visible = false;
         }
      }
      
      private function clickPIPIHandler(param1:MouseEvent) : void
      {
         TaskController_90.clickPIPI();
      }
      
      public function exploitOre() : void
      {
         EnergyController.exploit();
      }
      
      private function clickHandler(param1:MouseEvent) : void
      {
      }
      
      private function delAdd() : void
      {
      }
      
      override public function destroy() : void
      {
         if(this._pipi_mc)
         {
            this._pipi_mc.removeEventListener(Event.ENTER_FRAME,this.enterFrameHandler);
         }
      }
   }
}

