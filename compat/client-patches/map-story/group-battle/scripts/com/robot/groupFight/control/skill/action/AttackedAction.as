package com.robot.groupFight.control.skill.action
{
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.groupFight.control.skill.SkillPlayInfo;
   import com.robot.groupFight.manager.GroupFightMsgManager;
   import flash.display.MovieClip;
   
   public class AttackedAction implements IAction
   {
      
      public function AttackedAction()
      {
         super();
      }
      
      public function play(info:SkillPlayInfo, fun:Function = null) : void
      {
         var mc:MovieClip = info.aedModel.petWin.petMC;
         if(Boolean(mc))
         {
            info.aedModel.hpView.hurtHpTxt(info.info.attackSkillHurtInfo);
            info.aedModel.bloodWin.resetBar(info.info.attackedSkillHurtInfo.hp,info.info.attackedSkillHurtInfo.maxHp);
            info.aedModel.petWin.playAttacked(function():void
            {
               if(fun != null)
               {
                  fun();
               }
            });
            GroupFightMsgManager.getInstance().showText(info);
         }
         trace("【" + info.aModel.info.userID + "】--" + PetXMLInfo.getName(info.aModel.info.petID) + "--当前血量 : " + info.aModel.info.hp + "/总血量 : " + info.aModel.info.maxHP);
         trace("【" + info.aedModel.info.userID + "】--" + PetXMLInfo.getName(info.aedModel.info.petID) + "--当前血量 : " + info.aedModel.info.hp + "/总血量 : " + info.aedModel.info.maxHP);
      }
   }
}

