package com.robot.groupFight.control.panel.ui.fightPanel
{
   import com.robot.core.animate.MCStopPlayManager;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.group.fightInfo.startFight.GroupFightPetInfo;
   import com.robot.core.info.pet.PetSkillInfo;
   import com.robot.core.manager.PetManager;
   import com.robot.groupFight.control.SkillMouseController;
   import com.robot.groupFight.data.FighterModelFactory;
   import flash.display.Bitmap;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.text.TextField;
   import org.taomee.component.control.MLoadPane;
   import org.taomee.effect.ColorFilter;
   import org.taomee.manager.EventManager;
   import org.taomee.manager.ResourceManager;
   import org.taomee.utils.DisplayUtil;
   
   [Event(name="useSkill",type="com.robot.core.event.PetFightEvent")]
   public class PetSkillPanel extends BaseControlPanel implements IAutoActionPanel
   {
      
      private var petPrev:Sprite;
      
      private var petNameTxt:TextField;
      
      private var btnContainer:Sprite;
      
      public var skillBtnArray:Array = [];
      
      
      public function PetSkillPanel()
      {
         super();
         _panel = new ui_gp_SkillPanel();
         this.petPrev = new Sprite();
         this.petNameTxt = _panel["nameTxt"];
         this.btnContainer = new Sprite();
         _panel.addChild(this.petPrev);
         _panel.addChild(this.btnContainer);
         this.petPrev.x = 2;
         this.petPrev.y = 32;
         this.addEvent();
         this.createSkillBtns();
      }
      
      public function auto() : void
      {
         for each(var skill:SkillBtnView in this.skillBtnArray)
         {
            if(skill.pp > 0)
            {
               skill.autoUse();
               return;
            }
         }
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.USE_SKILL_AUTO,0));
      }
      
      override public function close() : void
      {
         this.btnContainer.mouseChildren = false;
         this.btnContainer.mouseEnabled = false;
         this.btnContainer.filters = [ColorFilter.setGrayscale()];
      }
      
      override public function open() : void
      {
         this.btnContainer.mouseChildren = true;
         this.btnContainer.mouseEnabled = true;
         this.btnContainer.filters = [];
      }
      
      override public function destroy() : void
      {
         this.removeEvent();
         this.clearOldBtns();
         this.petPrev = null;
         this.petNameTxt = null;
         this.btnContainer = null;
         this.skillBtnArray = [];
      }
      
      override public function show() : void
      {
         super.show();
         this.createSkillBtns();
      }
      
      private function addEvent() : void
      {
         EventManager.addEventListener(GroupFightEvent.USE_SKILL_SUC,this.onUseSkillSuc);
         EventManager.addEventListener(GroupFightEvent.USE_SKILL_SUC_PP,this.onUseSkillSuc2);
      }
      
      private function removeEvent() : void
      {
         EventManager.removeEventListener(GroupFightEvent.USE_SKILL_SUC,this.onUseSkillSuc);
         EventManager.removeEventListener(GroupFightEvent.USE_SKILL_SUC_PP,this.onUseSkillSuc2);
      }
      
      private function onUseSkillSuc(evt:GroupFightEvent) : void
      {
         var view:SkillBtnView = null;
         for each(view in this.skillBtnArray)
         {
            if(view.skillID == uint(evt.dataObj))
            {
               if(SkillMouseController.pp != uint.MAX_VALUE)
               {
                  view.changePP(SkillMouseController.pp,false);
               }
               break;
            }
         }
      }
      
      private function onUseSkillSuc2(evt:GroupFightEvent) : void
      {
         var view:SkillBtnView = null;
         for each(view in this.skillBtnArray)
         {
            if(view.skillID == uint(evt.dataObj[0]))
            {
               view.changePP(evt.dataObj[1],false);
               break;
            }
         }
      }
      
      private function createSkillBtns() : void
      {
         var skillInfoArray:Array = null;
         var i:PetSkillInfo = null;
         var btnView:SkillBtnView = null;
         var mc:MovieClip = null;
         var info:GroupFightPetInfo = FighterModelFactory.playerMode.info;
         var petTime:uint = uint(info.catchTime);
         DisplayUtil.removeAllChild(this.petPrev);
         ResourceManager.getResource(ClientConfig.getPetSwfPath(info.petID),this.onShowComplete,"pet");
         this.petNameTxt.text = PetXMLInfo.getName(info.petID);
         this.clearOldBtns();
         skillInfoArray = PetManager.getPetInfo(petTime).skillArray;
         var count:uint = 0;
         for each(i in skillInfoArray)
         {
            if(i.id != 0)
            {
               btnView = new SkillBtnView(i);
               mc = btnView.getMC();
               mc.x = 132 + (mc.width + 5) * (count % 2);
               mc.y = 28 + (mc.height + 7) * Math.floor(count / 2);
               this.btnContainer.addChild(mc);
               this.skillBtnArray.push(btnView);
               count++;
            }
         }
      }
      
      private function clearOldBtns() : void
      {
         var n:SkillBtnView = null;
         for each(n in this.skillBtnArray)
         {
            n.clear();
         }
         this.skillBtnArray = [];
      }
      
      private function onShowComplete(o:DisplayObject) : void
      {
         var _icon:MLoadPane = null;
         var bitmap:Bitmap = null;
         var _showMc:MovieClip = o as MovieClip;
         if(this.petPrev == null) return;
         if(Boolean(_showMc))
         {
            _showMc.gotoAndStop("rightdown");
            MCStopPlayManager.stopChildMC(_showMc);
            _icon = new MLoadPane(_showMc);
            if(_showMc.width > _showMc.height)
            {
               _icon.fitType = MLoadPane.FIT_WIDTH;
            }
            else
            {
               _icon.fitType = MLoadPane.FIT_HEIGHT;
            }
            _icon.setSizeWH(100,100);
            bitmap = DisplayUtil.copyDisplayAsBmp(_icon);
            this.petPrev.addChild(bitmap);
            DisplayUtil.removeForParent(_showMc);
         }
      }
   }
}

