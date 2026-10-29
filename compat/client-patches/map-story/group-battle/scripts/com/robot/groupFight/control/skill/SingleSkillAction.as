package com.robot.groupFight.control.skill
{
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.groupFight.control.skill.action.AttackAction;
   import com.robot.groupFight.control.skill.action.AttackedAction;
   import com.robot.groupFight.control.skill.action.HpAttackAction;
   import com.robot.groupFight.control.skill.action.IAction;
   import com.robot.groupFight.control.skill.action.PlaySkillMCAction;
   import flash.utils.getTimer;
   import org.taomee.manager.EventManager;
   
   public class SingleSkillAction implements ISkillAction
   {
      
      private var info:SkillPlayInfo;
      
      public function SingleSkillAction(sInfo:SkillPlayInfo)
      {
         super();
         this.info = sInfo;
      }
      
      public function play() : void
      {
         this.attack();
      }
      
      public function attack() : void
      {
         var attackAction:IAction = new AttackAction();
         attackAction.play(this.info,this.playSkill);
      }
      
      public function playSkill() : void
      {
         var playSkillAction:IAction = new PlaySkillMCAction();
         playSkillAction.play(this.info,this.hpPlay);
      }
      
      public function hpPlay() : void
      {
         var hpAction:IAction = new HpAttackAction();
         hpAction.play(this.info,this.attacked);
      }
      
      public function attacked() : void
      {
         var attackedAction:IAction = new AttackedAction();
         attackedAction.play(this.info,this.done);
      }
      
      public function done() : void
      {
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.SKILL_ATTACK_DONE));
         trace(getTimer(),"---->单体攻击动画完成，播放下一攻击动画");
      }
   }
}

