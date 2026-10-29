package com.robot.groupFight.control.skill
{
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.manager.LevelManager;
   import com.robot.groupFight.control.skill.action.AttackAction;
   import com.robot.groupFight.control.skill.action.AttackedAction;
   import com.robot.groupFight.control.skill.action.HpAttackAction;
   import com.robot.groupFight.control.skill.action.IAction;
   import com.robot.groupFight.control.skill.action.PlaySkillMCAction;
   import com.robot.groupFight.manager.SkillAnimateManager;
   import flash.display.MovieClip;
   import flash.utils.getTimer;
   import org.taomee.manager.EventManager;
   import org.taomee.utils.DisplayUtil;
   
   public class GankSkillAction implements ISkillAction
   {
      
      private var gankMC:MovieClip;
      
      private var list:Array;
      
      private var cnt:uint = 0;
      
      public function GankSkillAction(sInfo:SkillPlayInfo, sInfoList:Array = null)
      {
         super();
         if(Boolean(sInfoList))
         {
            this.list = sInfoList;
         }
      }
      
      public function play() : void
      {
         this.attack();
      }
      
      public function attack() : void
      {
         var attackAction:IAction = new AttackAction();
         this.playAction(attackAction,this.list,this.playSkill);
      }
      
      public function playSkill() : void
      {
         var skillAnimate:SkillAnimateManager;
         var playSkillAction:IAction = new PlaySkillMCAction();
         this.playAction(playSkillAction,this.list,this.hpPlay);
         if(this.gankMC == null)
         {
            this.gankMC = new GpSkillGankMC();
         }
         this.gankMC.x = (this.list[0] as SkillPlayInfo).aedModel.petWin.x;
         this.gankMC.y = (this.list[0] as SkillPlayInfo).aedModel.petWin.y;
         skillAnimate = new SkillAnimateManager();
         skillAnimate.playMC(this.gankMC,function():void
         {
            DisplayUtil.removeForParent(gankMC);
            gankMC = null;
         });
         LevelManager.fightLevel.addChild(this.gankMC);
      }
      
      public function hpPlay() : void
      {
         var hpAction:IAction = new HpAttackAction();
         this.playAction(hpAction,this.list,this.attacked);
      }
      
      public function attacked() : void
      {
         var attackedAction:IAction = new AttackedAction();
         attackedAction.play(this.list[0],this.done);
      }
      
      public function done() : void
      {
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.SKILL_ATTACK_DONE));
         trace(getTimer(),"---->合击攻击动画完成，播放下一攻击动画");
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

