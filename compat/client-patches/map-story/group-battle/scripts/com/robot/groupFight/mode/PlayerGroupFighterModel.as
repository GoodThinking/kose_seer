package com.robot.groupFight.mode
{
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.group.fightInfo.startFight.GroupFightPetInfo;
   import com.robot.groupFight.control.panel.ControlPanelObserver;
   import com.robot.groupFight.control.panel.FightToolSubject;
   import com.robot.groupFight.control.panel.ToolBtnPanelObserver;
   import com.robot.groupFight.manager.TimerManager;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.Event;
   import org.taomee.manager.EventManager;
   import org.taomee.utils.DisplayUtil;
   
   [Event(name="changePet",type="com.robot.core.event.PetFightEvent")]
   public class PlayerGroupFighterModel extends BaseGroupFighterModel
   {
      
      private var controlContainer:Sprite;
      
      private var conPanelObserver:ControlPanelObserver;
      
      private var toolBtnObserver:ToolBtnPanelObserver;
      
      public var subject:FightToolSubject;
      
      private var isNoPetFight:Boolean = false;
      
      public function PlayerGroupFighterModel(info:GroupFightPetInfo, mainPanel:Sprite)
      {
         super(info,mainPanel);
         this.controlContainer = mainPanel["controlMC"];
         this.subject = new FightToolSubject();
         this.subject.closePanel();
         this.addEvent();
      }
      
      override public function destroy() : void
      {
         this.removeEvent();
         if(this.subject != null) this.subject.destroy();
         this.subject = null;
         this.conPanelObserver = null;
         this.toolBtnObserver = null;
         this.controlContainer = null;
         super.destroy();
      }
      
      private function addEvent() : void
      {
         EventManager.addEventListener(GroupFightEvent.ON_OPENNING,this.onOpenning);
         EventManager.addEventListener(GroupFightEvent.USE_PET_ITEM,this.usePetItemHandler);
         EventManager.addEventListener(GroupFightEvent.NO_FIGHT_PET,this.onHasNoFightPet);
      }
      
      private function removeEvent() : void
      {
         EventManager.removeEventListener(GroupFightEvent.ON_OPENNING,this.onOpenning);
         EventManager.removeEventListener(GroupFightEvent.USE_PET_ITEM,this.usePetItemHandler);
         EventManager.removeEventListener(GroupFightEvent.NO_FIGHT_PET,this.onHasNoFightPet);
         if(this.conPanelObserver != null) this.conPanelObserver.removeEventListener(ControlPanelObserver.ON_ADD_PANEL,this.removePanelBG);
      }
      
      private function onOpenning(event:GroupFightEvent) : void
      {
         EventManager.removeEventListener(GroupFightEvent.ON_OPENNING,this.onOpenning);
         trace("开场动画结束，创建技能、战斗倒计时开始");
         this.conPanelObserver = new ControlPanelObserver(this.subject);
         this.conPanelObserver.addEventListener(ControlPanelObserver.ON_ADD_PANEL,this.removePanelBG);
         this.conPanelObserver.init();
         this.controlContainer.addChild(this.conPanelObserver);
         this.toolBtnObserver = new ToolBtnPanelObserver(this.subject,this.controlContainer,this.conPanelObserver);
         TimerManager.start();
      }
      
      private function removePanelBG(event:Event) : void
      {
         var mc:MovieClip = this.controlContainer["panelBgMC"];
         DisplayUtil.removeForParent(mc);
         this.subject.openPanel();
      }
      
      private function usePetItemHandler(event:GroupFightEvent) : void
      {
         TimerManager.wait();
         this.conPanelObserver.showFight();
         this.subject.closePanel();
      }
      
      private function onHasNoFightPet(evt:GroupFightEvent) : void
      {
         this.subject.closePanel();
         TimerManager.clear();
         this.isNoPetFight = true;
         this.conPanelObserver.removeEvent();
      }
      
      public function get skillBtnViews() : Array
      {
         return this.conPanelObserver.skillPanel.skillBtnArray;
      }
      
      public function get ctlPanel() : ControlPanelObserver
      {
         return this.conPanelObserver;
      }
   }
}

