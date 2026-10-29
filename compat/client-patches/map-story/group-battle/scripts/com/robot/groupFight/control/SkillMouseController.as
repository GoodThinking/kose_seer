package com.robot.groupFight.control
{
   import com.robot.core.CommandID;
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.group.fightInfo.startFight.GroupFightPetInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.groupFight.data.FighterModelFactory;
   import com.robot.groupFight.view.BaseFighterPetWin;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.Stage;
   import flash.events.MouseEvent;
   import flash.filters.GlowFilter;
   import flash.ui.Mouse;
   import flash.utils.ByteArray;
   import org.taomee.manager.EventManager;
   import org.taomee.utils.DisplayUtil;
   
   public class SkillMouseController
   {
      
      private static var mc:MovieClip;
      
      private static var stg:Stage;
      
      private static var fighterList:Array;
      
      private static var info:GroupFightPetInfo;
      
      private static var skillID:uint;
      
      private static var hitDisO:DisplayObject;
      
      private static var attackType:uint;
      
      private static var isAttackee:Boolean = false;
      
      public static var pp:uint = uint.MAX_VALUE;
      
      public function SkillMouseController()
      {
         super();
      }
      
      public static function get getSkillID() : uint
      {
         return skillID;
      }
      
      public static function attack(skillId:uint, type:uint) : void
      {
         var win:BaseFighterPetWin = null;
         undo();
         attackType = type;
         skillID = skillId;
         switch(attackType)
         {
            case 0:
               fighterList = FighterModelFactory.allPetWinList;
               break;
            case 1:
               fighterList = FighterModelFactory.membPetWinList;
               break;
            case 2:
               fighterList = FighterModelFactory.oppPetWinList;
               break;
            case 3:
               fighterList = [FighterModelFactory.playerMode.petWin];
         }
         if(Boolean(fighterList) && fighterList.length > 0)
         {
            if(!mc)
            {
               mc = new SkillMouseMC();
            }
            mc.mouseEnabled = false;
            mc.gotoAndStop(1);
            Mouse.hide();
            mc.mouseChildren = false;
            stg = MainManager.getStage();
            stg.addChild(mc);
            stg.addEventListener(MouseEvent.MOUSE_MOVE,onMosMove);
            for each(win in FighterModelFactory.allPetWinList)
            {
               if(Boolean(win))
               {
                  win.addEventListener(MouseEvent.MOUSE_OVER,onMosOver);
                  win.addEventListener(MouseEvent.MOUSE_OUT,onMosOut);
               }
            }
         }
      }
      
      public static function undo() : void
      {
         var win:BaseFighterPetWin = null;
         for each(win in FighterModelFactory.allPetWinList)
         {
            if(win == null) continue;
            win.removeEventListener(MouseEvent.MOUSE_OVER,onMosOver);
            win.removeEventListener(MouseEvent.MOUSE_OUT,onMosOut);
            win.filters = [];
         }
         if(Boolean(mc))
         {
            DisplayUtil.removeForParent(mc);
         }
         if(Boolean(stg))
         {
            stg.removeEventListener(MouseEvent.MOUSE_MOVE,onMosMove);
            stg.removeEventListener(MouseEvent.CLICK,onClick);
         }
         fighterList = null;
         Mouse.show();
      }
      
      private static function onMosMove(evt:MouseEvent) : void
      {
         if(Boolean(mc))
         {
            mc.x = stg.mouseX;
            mc.y = stg.mouseY;
         }
         if(Boolean(stg))
         {
            stg.addEventListener(MouseEvent.CLICK,onClick);
         }
         evt.updateAfterEvent();
      }
      
      private static function onMosOver(evt:MouseEvent) : void
      {
         var win:BaseFighterPetWin = evt.currentTarget as BaseFighterPetWin;
         win.filters = [new GlowFilter(65280)];
         checkIsInList(win);
      }
      
      private static function onMosOut(evt:MouseEvent) : void
      {
         var win:BaseFighterPetWin = evt.currentTarget as BaseFighterPetWin;
         win.filters = [];
      }
      
      private static function checkIsInList(o:DisplayObject) : Boolean
      {
         if(fighterList.indexOf(o) != -1)
         {
            mc.gotoAndStop(1);
            return true;
         }
         mc.gotoAndStop(2);
         return false;
      }
      
      private static function onClick(evt:MouseEvent) : void
      {
         var targets:Array = fighterList;
         var mouseX:Number = stg.mouseX;
         var mouseY:Number = stg.mouseY;
         undo();
         for each(var target:BaseFighterPetWin in targets)
         {
            if(target != null && target.hitTestPoint(mouseX,mouseY))
            {
               target.alpha = 1;
               sendSkillToServer(skillID,target);
               return;
            }
         }
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.USE_SKILL_FAIL));
      }
      
      public static function auto(skillId:uint, fighterlist:Array) : void
      {
         undo();
         var view:BaseFighterPetWin = fighterlist[Math.floor(fighterlist.length * Math.random())] as BaseFighterPetWin;
         if(Boolean(view))
         {
            sendSkillToServer(skillId,view);
         }
      }
      
      private static function sendSkillToServer(skillID:uint, view:BaseFighterPetWin) : void
      {
         pp = uint.MAX_VALUE;
         SocketConnection.send(CommandID.GP_SKILL_WAIT_PERT,0);
         var info:GroupFightPetInfo = view.info;
         var by:ByteArray = new ByteArray();
         by.writeUnsignedInt(skillID);
         by.writeByte(info.side);
         by.writeByte(info.pos);
         by.length = 6;
         SocketConnection.send(CommandID.GROUP_FT_USE_SKILL,by);
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.USE_SKILL_SUC,skillID));
      }
   }
}

