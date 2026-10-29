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
   
   public class MassSkillAction implements ISkillAction
   {
      
      private var _massInfoArr:Array;
      
      private var cnt:uint = 0;
      
      public function MassSkillAction(sInfo:SkillPlayInfo, massArr:Array)
      {
         super();
         if(Boolean(massArr))
         {
            this._massInfoArr = massArr;
         }
      }
      
      public function play() : void
      {
         this.attack();
      }
      
      public function attack() : void
      {
         var attackAction:IAction = new AttackAction();
         attackAction.play(this._massInfoArr[0],this.playSkill);
      }
      
      public function playSkill() : void
      {
         var playSkillAction:IAction = new PlaySkillMCAction();
         this.playAction(playSkillAction,this._massInfoArr,this.hpPlay);
      }
      
      public function hpPlay() : void
      {
         var hpAction:IAction = new HpAttackAction();
         this.playAction(hpAction,this._massInfoArr,this.attacked);
      }
      
      public function attacked() : void
      {
         var attackedAction:IAction = new AttackedAction();
         this.playAction(attackedAction,this._massInfoArr,this.done);
      }
      
      public function done() : void
      {
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.SKILL_ATTACK_DONE));
         trace(getTimer(),"---->【群攻】动画完成，播放下一攻击动画");
      }
      
      private function playAction(a:IAction, arr:Array, nextFun:Function) : void
      {
         var cnt:uint = 0;
         var info:SkillPlayInfo = null;
         cnt = 0;
         for each(info in arr)
         {
            a.play(info,function():void
            {
               ++cnt;
               if(cnt == arr.length)
               {
                  nextFun();
               }
            });
         }
      }
   }
}

