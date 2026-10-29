package com.robot.groupFight.control.panel.ui.fightPanel
{
   import com.robot.core.config.xml.SkillXMLInfo;
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.info.pet.PetSkillInfo;
   import com.robot.core.manager.UIManager;
   import com.robot.core.ui.skillBtn.SkillInfoTip;
   import com.robot.groupFight.control.SkillMouseController;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import org.taomee.effect.ColorFilter;
   import org.taomee.manager.EventManager;
   import org.taomee.utils.DisplayUtil;
   
   public class SkillBtnView
   {
      
      private var mc:MovieClip;
      
      private var outTF:TextFormat;
      
      private var overTF:TextFormat;
      
      private var _pp:int;
      
      private var maxPP:uint;
      
      private var _skillID:uint;
      
      private var _skillInfo:PetSkillInfo;
      
      public var isOpen:Boolean = true;
      
      public function SkillBtnView(info:PetSkillInfo)
      {
         super();
         this._skillInfo = info;
         this.outTF = new TextFormat();
         this.outTF.color = 11138559;
         this.overTF = new TextFormat();
         this.overTF.color = 16763904;
         this.mc = new ui_gp_skillMC();
         this._skillID = info.id;
         this._pp = info.pp;
         this.maxPP = info.maxPP;
         this.mc["pp_txt"].text = this._pp + "/" + this.maxPP;
         this.mc["name_txt"].text = info.name;
         var damageNum:uint = uint(SkillXMLInfo.getDamage(info.id));
         this.mc["damage_txt"].text = "威力:" + damageNum.toString();
         var typeID:uint = uint(SkillXMLInfo.getTypeID(info.id));
         var skillIcon:SimpleButton = UIManager.getButton("Icon_PetType_" + typeID);
         if(SkillXMLInfo.getCategory(info.id) == 4)
         {
            skillIcon = UIManager.getButton("Icon_PetType_prop");
         }
         if(Boolean(skillIcon))
         {
            DisplayUtil.removeAllChild(this.mc["iconMC"]);
            this.mc["iconMC"].addChild(skillIcon);
         }
         this.mc.addEventListener(MouseEvent.MOUSE_OVER,this.overHandler);
         this.mc.addEventListener(MouseEvent.MOUSE_OUT,this.outHandler);
         this.mc.addEventListener(MouseEvent.CLICK,this.clickHandler);
         this.mc["pp_txt"].mouseEnabled = false;
         this.mc["name_txt"].mouseEnabled = false;
         this.mc.buttonMode = true;
         if(this._pp <= 0)
         {
            this.closeBtns();
         }
      }
      
      public function clear() : void
      {
         this.mc.removeEventListener(MouseEvent.MOUSE_OVER,this.overHandler);
         this.mc.removeEventListener(MouseEvent.MOUSE_OUT,this.outHandler);
         this.mc.removeEventListener(MouseEvent.CLICK,this.clickHandler);
         SkillInfoTip.hide();
         DisplayUtil.removeForParent(this.mc);
         this.mc = null;
      }
      
      public function autoUse() : void
      {
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.USE_SKILL_AUTO,this._skillID));
      }
      
      public function changePP(i:int, isIncrease:Boolean = true) : void
      {
         if(isIncrease)
         {
            this._pp += i;
            if(this._pp > this.maxPP)
            {
               this._pp = this.maxPP;
            }
            else if(this._pp <= 0)
            {
               this._pp = 0;
            }
            this._skillInfo.pp = this._pp;
            SkillMouseController.pp = this._pp;
            if(this._pp > 0)
            {
               this.openBtns();
            }
         }
         else
         {
            if(Boolean(this._skillInfo))
            {
               this._skillInfo.pp = i;
            }
            this._pp = i;
         }
         if(this._pp > 0) this.openBtns();
         if(this._pp <= 0)
         {
            this._pp = 0;
            this.closeBtns();
         }
         this.mc["pp_txt"].text = this._pp + "/" + this.maxPP;
      }
      
      public function get skillID() : uint
      {
         return this._skillID;
      }
      
      public function getMC() : MovieClip
      {
         return this.mc;
      }
      
      public function get pp() : uint
      {
         return this._pp;
      }
      
      private function overHandler(event:MouseEvent) : void
      {
         var mc:MovieClip = event.currentTarget as MovieClip;
         mc["bgMC"].alpha = 0.5;
         var txt:TextField = mc["name_txt"];
         txt.setTextFormat(this.overTF);
         SkillInfoTip.show(this._skillID);
      }
      
      private function outHandler(event:MouseEvent) : void
      {
         var mc:MovieClip = event.currentTarget as MovieClip;
         mc["bgMC"].alpha = 0;
         var txt:TextField = mc["name_txt"];
         txt.setTextFormat(this.outTF);
         SkillInfoTip.hide();
      }
      
      private function clickHandler(event:MouseEvent) : void
      {
         if(this._pp <= 0)
         {
            this._skillID = 0;
            this.closeBtns();
         }
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.USE_SKILL,this._skillID));
      }
      
      public function openBtns() : void
      {
         this.isOpen = true;
         if(this._pp > 0)
         {
            this.mc.mouseChildren = true;
            this.mc.mouseEnabled = true;
            this.mc.enabled = true;
            this.mc.buttonMode = true;
            this.mc.filters = [];
         }
      }
      
      public function closeBtns() : void
      {
         this.isOpen = false;
         this.mc.mouseChildren = false;
         this.mc.mouseEnabled = false;
         this.mc.enabled = false;
         this.mc.buttonMode = false;
         this.mc.filters = [ColorFilter.setGrayscale()];
      }
   }
}

