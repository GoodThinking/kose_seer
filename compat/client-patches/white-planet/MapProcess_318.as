package com.robot.app.mapProcess
{
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import org.taomee.manager.ToolTipManager;

   /**
    * 朱雀空间：点击菲尼克斯挑战。三分身是服务端同一场战斗里的三个阶段，这里不单独显示；
    * 德拉萨、卡修斯、迪符特三尊像只作提示，挑战前置条件由服务端检查。
    */
   public class MapProcess_318 extends BaseMapProcess
   {
      private static const STATUES:Array = [["pet_0_0","德拉萨"],["pet_0_1","卡修斯"],["pet_0_2","迪符特"]];

      private var phoenix:MovieClip;

      public function MapProcess_318()
      {
         super();
      }

      override protected function init() : void
      {
         var name:String = null;
         var statue:Array = null;
         for each(name in ["pet_1_0","pet_1_1","pet_1_2"])
         {
            (conLevel[name] as DisplayObject).visible = false;
         }
         (animatorLevel["small"] as DisplayObject).visible = false;
         (animatorLevel["big"] as DisplayObject).visible = false;
         for each(statue in STATUES)
         {
            ToolTipManager.add(conLevel[statue[0]],statue[1]);
         }
         this.phoenix = conLevel["pet_2"] as MovieClip;
         ToolTipManager.add(this.phoenix,"菲尼克斯");
         this.phoenix.buttonMode = true;
         this.phoenix.addEventListener(MouseEvent.CLICK,this.onPhoenix);
      }

      private function onPhoenix(e:MouseEvent) : void
      {
         NpcDialog.show(NPC.ZHUQUE,["我是裂空星系的守护神，你能进到这里说明你已经是个能独挡一面的精英了，但是真正的挑战现在才开始。"],["不管什么挑战我都不怕。","我还是下次再来吧。"],[function():void
         {
            FightInviteManager.fightWithBoss("菲尼克斯");
         }]);
      }

      override public function destroy() : void
      {
         var statue:Array = null;
         for each(statue in STATUES)
         {
            ToolTipManager.remove(conLevel[statue[0]]);
         }
         ToolTipManager.remove(this.phoenix);
         this.phoenix.removeEventListener(MouseEvent.CLICK,this.onPhoenix);
         this.phoenix = null;
      }
   }
}
