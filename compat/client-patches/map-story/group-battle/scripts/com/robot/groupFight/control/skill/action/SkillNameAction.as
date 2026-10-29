package com.robot.groupFight.control.skill.action
{
   import com.robot.core.config.xml.SkillXMLInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.groupFight.control.skill.SkillPlayInfo;
   import flash.display.MovieClip;
   
   public class SkillNameAction implements IAction
   {
      
      private static var _instance:SkillNameAction;
      
      private var mc:MovieClip;
      
      public function SkillNameAction()
      {
         super();
      }
      
      public static function instance() : SkillNameAction
      {
         if(_instance == null)
         {
            _instance = new SkillNameAction();
         }
         return _instance;
      }
      
      public function play(info:SkillPlayInfo, fun:Function = null) : void
      {
         if(this.mc == null)
         {
            this.mc = new SkillNameMC();
         }
         this.mc.gotoAndPlay(2);
         this.mc["txt"].htmlText = SkillXMLInfo.getName(info.skillID);
         LevelManager.fightLevel.addChild(this.mc);
         this.mc.x = 480;
         this.mc.y = 80;
      }
   }
}

