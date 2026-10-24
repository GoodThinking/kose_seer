package com.robot.app.mapProcess
{
   import com.robot.app.mapProcess.control.*;
   import com.robot.app.task.control.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.events.MouseEvent;
   
   public class MapProcess_497 extends BaseMapProcess
   {
      
      private var _morraStarted:Boolean = false;
      
      public function MapProcess_497()
      {
         super();
      }
      
      override protected function init() : void
      {
         conLevel["hadesaEnvoMC"].visible = false;
         conLevel["NPCbenzhu"].visible = false;
         conLevel["benzhu"].visible = false;
         conLevel["openPicBtn"].visible = false;
         conLevel["morra"].visible = false;
         TasksController.runAfterTrackedTaskStatus(this.initMorraSweet,this);
      }
      
      private function initMorraSweet() : void
      {
         conLevel["benzhu"].visible = true;
         MorraSweet.getInstance().start(this);
         this._morraStarted = true;
      }
      
      private function onMorraClick(param1:MouseEvent) : void
      {
         ModuleManager.showModule(ClientConfig.getAppModule("MorraSweetGame"),"正在加载面板",true);
      }
      
      override public function destroy() : void
      {
         if(this._morraStarted)
         {
            MorraSweet.getInstance().destory();
            this._morraStarted = false;
         }
      }
      
      private function initForAllTask() : void
      {
         this.topLevel["invertedMc"].mouseEnabled = false;
         this.topLevel["invertedMc"].mouseChildren = false;
         this.conLevel["task633Hit"].mouseEnabled = false;
         this.conLevel["task633Hit"].mouseChildren = false;
      }
      
      public function gotoNextMap() : void
      {
         MapManager.changeMap(476);
      }
   }
}

