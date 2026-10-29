package com.robot.groupFight.manager
{
   import com.robot.core.group.fightInfo.fighting.GpFtSpriteNoticeInfo;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.groupFight.data.FighterModelFactory;
   import com.robot.groupFight.data.FighterPetInfoFactory;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   import com.robot.groupFight.mode.PlayerGroupFighterModel;
   
   public class GpFtSpriteNoticeManager
   {
      
      public function GpFtSpriteNoticeManager()
      {
         super();
      }
      
      public static function chgFtPetInfo(info:GpFtSpriteNoticeInfo) : void
      {
         var pInfo:PetInfo = null;
         var sidePos:String = info.side + "_" + info.pos;
         var model:BaseGroupFighterModel = FighterModelFactory.fighterModelMap.getValue(sidePos);
         if(Boolean(model))
         {
            model.info.hp = info.curtHp;
            model.info.maxHP = info.maxHp;
            model.bloodWin.resetBar(info.curtHp,info.maxHp);
            model.hpView.changeTxt(info.chgHp);
            if(model is PlayerGroupFighterModel)
            {
               pInfo = FighterPetInfoFactory.gfUserInfo.monInfoMap.getValue(info.capTm);
               pInfo.hp = model.info.hp;
               FighterPetInfoFactory.playerFtPetInfo = model.info;
            }
         }
      }
   }
}

