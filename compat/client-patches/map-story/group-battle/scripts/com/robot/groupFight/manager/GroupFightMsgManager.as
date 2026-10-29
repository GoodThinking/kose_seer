package com.robot.groupFight.manager
{
   import com.robot.core.config.PetStatusEffectConfig;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.config.xml.SkillXMLInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.uic.TextScrollBar;
   import com.robot.groupFight.control.skill.SkillPlayInfo;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   import flash.display.MovieClip;
   import flash.text.TextField;
   
   public class GroupFightMsgManager
   {
      
      private static var _instance:GroupFightMsgManager;
      
      private var gpMsgMC:MovieClip;
      
      private var _txt:TextField;
      
      private var scrollBar:TextScrollBar;
      
      private var critEffect:MovieClip = new gp_attack_crit_effect();
      
      private var str:String;
      
      public function GroupFightMsgManager()
      {
         super();
      }
      
      public static function getInstance() : GroupFightMsgManager
      {
         if(!_instance)
         {
            _instance = new GroupFightMsgManager();
         }
         return _instance;
      }
      
      public function destroy() : void
      {
         this.gpMsgMC = null;
         this.scrollBar = null;
      }
      
      public function setup(msgMC:MovieClip) : void
      {
         this.gpMsgMC = msgMC;
         this._txt = this.gpMsgMC["fightMsgTxt"];
         this._txt.text = "";
         this.scrollBar = new TextScrollBar(this.gpMsgMC,this._txt,this.gpMsgMC["upBtn"],this.gpMsgMC["downBtn"]);
      }
      
      public function showText(info:SkillPlayInfo) : void
      {
         var aPetID:uint = uint(info.aModel.info.petID);
         var aPetName:String = PetXMLInfo.getName(aPetID);
         var aedPetID:uint = uint(info.aedModel.info.petID);
         var aedPetName:String = PetXMLInfo.getName(aedPetID);
         var skillName:String = SkillXMLInfo.getName(info.skillID);
         this.str = "<font color=\'#00ff00\'>" + aPetName + "</font>使用了" + "<font color=\'#ffff00\'>" + skillName + "</font>,";
         if(info.info.attackSkillHurtInfo.isCrit)
         {
            this.critEffect.gotoAndPlay(2);
            this.critEffect.x = info.aedModel.petWin.x;
            this.critEffect.y = info.aedModel.petWin.y;
            LevelManager.fightLevel.addChild(this.critEffect);
            this.str += "<font color=\'#ff0000\'>打出了致命一击</font>;";
         }
         this.str += aPetName + "<font color=\'#66FF00\'>〖状态〗:</font>" + this.addStatus(info.aModel,info) + ",";
         this.str += aedPetName + "<font color=\'#66FF00\'>〖状态〗:</font>" + this.addStatus(info.aedModel,info,true);
         this._txt.htmlText += this.str;
         this.scrollBar.checkScroll();
      }
      
      private function addStatus(model:BaseGroupFighterModel, info:SkillPlayInfo, isAedModel:Boolean = false) : String
      {
         var i:uint = 0;
         var count:uint = 0;
         var statusBoolean:Boolean = false;
         var arr:Array = info.info.attackSkillHurtInfo.statusList;
         var str:String = "";
         if(isAedModel)
         {
            arr = info.info.attackedSkillHurtInfo.statusList;
         }
         for each(i in arr)
         {
            if(i != 0)
            {
               str = PetStatusEffectConfig.getName(0,count) + " ";
               statusBoolean = true;
            }
            count++;
         }
         if(!statusBoolean)
         {
            str = "正常";
         }
         return str;
      }
   }
}

