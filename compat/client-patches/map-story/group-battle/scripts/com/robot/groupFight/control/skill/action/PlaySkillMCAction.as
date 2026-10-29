package com.robot.groupFight.control.skill.action
{
   import com.robot.core.manager.LevelManager;
   import com.robot.groupFight.control.skill.SkillPlayInfo;
   import com.robot.groupFight.manager.SkillAnimateManager;
   import flash.display.MovieClip;
   import org.taomee.utils.DisplayUtil;
   
   public class PlaySkillMCAction implements IAction
   {
      
      public function PlaySkillMCAction()
      {
         super();
      }
      
      public function play(info:SkillPlayInfo, fun:Function = null) : void
      {
         var skillAnimate:SkillAnimateManager;
         var skillMC:MovieClip = null;
         skillMC = info.skillMC;
         skillMC.x = info.aedModel.info.point.x;
         skillMC.y = info.aedModel.info.point.y;
         skillMC.scaleX = 1.5;
         skillMC.scaleY = 1.5;
         LevelManager.fightLevel.addChild(skillMC);
         skillAnimate = new SkillAnimateManager();
         skillAnimate.playMC(skillMC,function():void
         {
            DisplayUtil.removeForParent(skillMC);
            skillMC = null;
            fun();
         });
         SkillNameAction.instance().play(info);
      }
   }
}

