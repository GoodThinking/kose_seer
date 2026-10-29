package com.robot.groupFight.control.skill.action
{
   import com.robot.core.config.xml.SkillXMLInfo;
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.groupFight.control.skill.SkillPlayInfo;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   import flash.display.DisplayObjectContainer;
   import flash.geom.Point;
   import org.taomee.manager.EventManager;
   
   public class AttackAction implements IAction
   {
      
      private var _aModel:BaseGroupFighterModel;
      
      private var _aedModel:BaseGroupFighterModel;
      
      private var _info:SkillPlayInfo;
      
      public function AttackAction()
      {
         super();
      }
      
      public function play(info:SkillPlayInfo, fun:Function = null) : void
      {
         var aIndex:int = 0;
         var aedIndex:int = 0;
         var p:Point = null;
         this._aModel = info.aModel;
         this._aedModel = info.aedModel;
         this._info = info;
         if(this._aModel == null || this._aedModel == null)
         {
            EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.SKILL_ATTACK_DONE));
            return;
         }
         var o:DisplayObjectContainer = this._aModel.petWin.parent as DisplayObjectContainer;
         if(Boolean(o))
         {
            aIndex = o.getChildIndex(this._aModel.petWin);
            aedIndex = o.getChildIndex(this._aedModel.petWin);
            if(aedIndex > aIndex && Boolean(this._aModel.info.isMember))
            {
               o.swapChildrenAt(aIndex,aedIndex);
            }
         }
         switch(SkillXMLInfo.getCategory(this._info.skillID))
         {
            case 1:
               p = new Point(this._aedModel.petWin.x,this._aedModel.petWin.y);
               this._aModel.petWin.playPhyAttack(p,fun);
               break;
            case 2:
               this._aModel.petWin.playAttack(fun);
               break;
            default:
               this._aModel.petWin.playAttack(fun);
         }
      }
   }
}

