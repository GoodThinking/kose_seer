package com.robot.groupFight.control.skill.action
{
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.groupFight.control.skill.SkillPlayInfo;
   import com.robot.groupFight.data.FighterPetInfoFactory;
   
   public class HpAttackAction implements IAction
   {
      
      public function HpAttackAction()
      {
         super();
      }
      
      public function play(info:SkillPlayInfo, fun:Function = null) : void
      {
         this.changeHp(info);
         fun();
      }
      
      private function changeHp(info:SkillPlayInfo) : void
      {
         var pInfo:PetInfo = null;
         info.aModel.info.hp = info.info.attackSkillHurtInfo.hp;
         info.aedModel.info.hp = info.info.attackedSkillHurtInfo.hp;
         if(info.aedModel.info.userID == MainManager.actorID)
         {
            pInfo = FighterPetInfoFactory.gfUserInfo.monInfoMap.getValue(info.aedModel.info.catchTime);
            pInfo.hp = info.aedModel.info.hp;
            FighterPetInfoFactory.playerFtPetInfo = info.aedModel.info;
         }
         if(info.aModel.info.userID == MainManager.actorID)
         {
            pInfo = FighterPetInfoFactory.gfUserInfo.monInfoMap.getValue(info.aModel.info.catchTime);
            pInfo.hp = info.aModel.info.hp;
            FighterPetInfoFactory.playerFtPetInfo = info.aModel.info;
         }
      }
   }
}

