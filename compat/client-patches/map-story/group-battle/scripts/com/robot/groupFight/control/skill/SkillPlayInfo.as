package com.robot.groupFight.control.skill
{
   import com.robot.core.group.fightInfo.fighting.skill.GpFtSkillHurtInfo;
   import com.robot.groupFight.data.FighterModelFactory;
   import com.robot.groupFight.manager.assetManager.SkillAssetsManager;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   import flash.display.MovieClip;
   
   public class SkillPlayInfo
   {
      
      public var info:GpFtSkillHurtInfo;
      
      public var skillID:uint;
      
      public var skillMC:MovieClip;
      
      public var aModel:BaseGroupFighterModel;
      
      public var aedModel:BaseGroupFighterModel;
      
      public function SkillPlayInfo(gInfo:GpFtSkillHurtInfo)
      {
         super();
         this.info = gInfo;
         this.skillID = this.info.attackSkillHurtInfo.moveID;
         this.skillMC = SkillAssetsManager.getInstance().getAssetsByID(this.skillID);
         var aPos:String = this.info.attackSkillHurtInfo.side + "_" + this.info.attackSkillHurtInfo.pos;
         this.aModel = FighterModelFactory.fighterModelMap.getValue(aPos);
         var aedPos:String = this.info.attackedSkillHurtInfo.side + "_" + this.info.attackedSkillHurtInfo.pos;
         this.aedModel = FighterModelFactory.fighterModelMap.getValue(aedPos);
      }
   }
}

