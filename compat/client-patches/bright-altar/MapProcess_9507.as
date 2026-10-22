package com.robot.app.mapProcess
{
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;

   /**
    * 光明圣坛（地图取自 XIN 站 9507，原版编号 507）：点击布莱克，对白后一对一对战。
    * 原版剧情任务（698 等）没有恢复，任务路障和任务标记按任务完成后的样子隐藏。
    */
   public class MapProcess_9507 extends BaseMapProcess
   {
      private var bulaike:MovieClip;

      public function MapProcess_9507()
      {
         super();
      }

      override protected function init() : void
      {
         var name:String = null;
         var block:MovieClip = null;
         for each(name in ["block1MC","block2MC","block3MC","block4MC"])
         {
            block = conLevel[name] as MovieClip;
            if(block)
            {
               block.gotoAndStop(1);
               block.visible = false;
            }
         }
         this.bulaike = conLevel["bulaikeNPC"] as MovieClip;
         this.bulaike["signMC"].visible = false;
         this.bulaike.buttonMode = true;
         this.bulaike.addEventListener(MouseEvent.CLICK,this.onBulaike);
      }

      private function onBulaike(e:MouseEvent) : void
      {
         NpcDialog.show(NPC.BULAIKE_NEW,["作为光明圣坛守护者，我不畏惧任何挑战！但我认为只有一对一的决斗才能证明谁是真正的强者！你有这个胆量吗？"],["OK，我会让你心服口服的！","嘿嘿！让哥哥我再考虑考虑。"],[function():void
         {
            FightInviteManager.fightWithBoss("布莱克");
         }]);
      }

      override public function destroy() : void
      {
         this.bulaike.removeEventListener(MouseEvent.CLICK,this.onBulaike);
         this.bulaike = null;
      }
   }
}
