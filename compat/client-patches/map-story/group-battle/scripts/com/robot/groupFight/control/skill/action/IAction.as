package com.robot.groupFight.control.skill.action
{
   import com.robot.groupFight.control.skill.SkillPlayInfo;
   
   public interface IAction
   {
      
      function play(param1:SkillPlayInfo, param2:Function = null) : void;
   }
}

