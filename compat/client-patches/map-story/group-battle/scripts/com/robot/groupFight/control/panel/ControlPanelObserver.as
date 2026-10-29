package com.robot.groupFight.control.panel
{
   import com.robot.core.CommandID;
   import com.robot.core.config.xml.SkillXMLInfo;
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.net.SocketConnection;
   import com.robot.groupFight.control.SkillMouseController;
   import com.robot.groupFight.control.panel.ui.fightPanel.BaseControlPanel;
   import com.robot.groupFight.control.panel.ui.fightPanel.FightItemPanel;
   import com.robot.groupFight.control.panel.ui.fightPanel.IAutoActionPanel;
   import com.robot.groupFight.control.panel.ui.fightPanel.IControlPanel;
   import com.robot.groupFight.control.panel.ui.fightPanel.PetSkillPanel;
   import com.robot.groupFight.control.panel.ui.fightPanel.SelectPetPanel;
   import com.robot.groupFight.data.FighterModelFactory;
   import com.robot.groupFight.data.FighterPetInfoFactory;
   import com.robot.groupFight.manager.TimerManager;
   import flash.events.Event;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.EventManager;
   
   [Event(name="onAddPanel",type="com.robot.petFightModule.ui.ControlPanelObserver")]
   public class ControlPanelObserver extends BasePanelObserver
   {
      
      public static var autoAction:IAutoActionPanel;
      
      public static const ON_ADD_PANEL:String = "onAddPanel";
      
      public var skillPanel:PetSkillPanel;
      
      private var itemPanel:FightItemPanel;
      
      private var petPanel:SelectPetPanel;
      
      private var panels:Array = [];
      
      public function ControlPanelObserver(s:FightToolSubject)
      {
         super(s);
      }
      
      public function init() : void
      {
         this.skillPanel = new PetSkillPanel();
         this.itemPanel = new FightItemPanel();
         this.petPanel = new SelectPetPanel();
         this.addPanel(this.skillPanel,this.itemPanel,this.petPanel);
         this.addEvent();
         TimerManager.autoAction = this.skillPanel;
      }
      
      public function addEvent() : void
      {
         SocketConnection.addCmdListener(CommandID.GROUP_FT_USE_SKILL,this.onUseSkillSuc);
         EventManager.addEventListener(GroupFightEvent.USE_SKILL,this.onUseSkill);
         EventManager.addEventListener(GroupFightEvent.USE_SKILL_AUTO,this.onUseSkillAuto);
         EventManager.addEventListener(GroupFightEvent.USE_SKILL_FAIL,this.onUseSkillFail);
         EventManager.addEventListener(GroupFightEvent.SKILL_MOVIE_DONE,this.onSkillDone);
      }
      
      public function removeEvent() : void
      {
         SocketConnection.removeCmdListener(CommandID.GROUP_FT_USE_SKILL,this.onUseSkillSuc);
         EventManager.removeEventListener(GroupFightEvent.USE_SKILL,this.onUseSkill);
         EventManager.removeEventListener(GroupFightEvent.USE_SKILL_AUTO,this.onUseSkillAuto);
         EventManager.removeEventListener(GroupFightEvent.USE_SKILL_FAIL,this.onUseSkillFail);
         EventManager.removeEventListener(GroupFightEvent.SKILL_MOVIE_DONE,this.onSkillDone);
      }
      
      override public function open() : void
      {
         var panel:IControlPanel = null;
         for each(panel in this.panels)
         {
            panel.open();
         }
      }
      
      override public function close() : void
      {
         var panel:IControlPanel = null;
         for each(panel in this.panels)
         {
            panel.close();
         }
      }
      
      override public function destroy() : void
      {
         var i:IControlPanel = null;
         super.destroy();
         this.removeEvent();
         for each(i in this.panels)
         {
            i.destroy();
         }
         this.panels = [];
         this.skillPanel = null;
         this.itemPanel = null;
         this.petPanel = null;
      }
      
      private function onUseSkill(evt:GroupFightEvent) : void
      {
         var id:uint = uint(evt.dataObj);
         var type:uint = uint(SkillXMLInfo.getGpFtSkillType(id));
         SkillMouseController.attack(id,type);
         subject.closePanel();
      }
      
      private function onUseSkillAuto(evt:GroupFightEvent) : void
      {
         var id:uint = uint(evt.dataObj);
         SkillMouseController.auto(id,FighterModelFactory.oppPetWinList);
         subject.closePanel();
      }
      
      private function onUseSkillSuc(evt:SocketEvent) : void
      {
         TimerManager.wait();
      }
      
      private function onUseSkillFail(evt:GroupFightEvent) : void
      {
         subject.openPanel();
      }
      
      private function onSkillDone(evt:GroupFightEvent) : void
      {
         subject.openPanel();
         TimerManager.start();
         trace("#----------一回合的技能动画播放完毕------------------#");
      }
      
      public function showItem() : void
      {
         this.hideAll();
         this.itemPanel.updateItem();
         this.itemPanel.show();
      }
      
      public function showPet(isAuto:Boolean = false) : void
      {
         this.hideAll();
         this.petPanel.show();
         if(isAuto)
         {
            if(FighterPetInfoFactory.checkIsPetAllDie() != 0)
            {
               TimerManager.autoAction = this.petPanel;
               TimerManager.autoChgPet();
               trace("进入自动换宠-----------------");
               subject.openPanel();
            }
         }
      }
      
      public function showFight() : void
      {
         TimerManager.autoAction = this.skillPanel;
         this.hideAll();
         this.skillPanel.show();
      }
      
      private function addPanel(... args) : void
      {
         var i:IControlPanel = null;
         for each(i in args)
         {
            if(this.panels.length > 0)
            {
               i.panel.y = BaseControlPanel.PANEL_HEIGHT;
            }
            this.panels.push(i);
            addChild(i.panel);
         }
         dispatchEvent(new Event(ON_ADD_PANEL));
      }
      
      private function hideAll() : void
      {
         var i:IControlPanel = null;
         for each(i in this.panels)
         {
            i.hide();
         }
      }
   }
}

