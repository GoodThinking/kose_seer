package com.robot.app.mapProcess
{
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.core.animate.AnimateManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;

   /**
    * 山神圣殿：点击山神迪符特解开封印，然后挑战（4399 攻略）。
    * 原版之后加入的「4枚灵魂残片」解封条件没有恢复。
    */
   public class MapProcess_450 extends BaseMapProcess
   {
      private var npc:MovieClip;

      private var hit:MovieClip;

      public function MapProcess_450()
      {
         super();
      }

      override protected function init() : void
      {
         this.npc = conLevel["npc"] as MovieClip;
         this.npc.gotoAndStop(4);
         this.hit = conLevel["hit"] as MovieClip;
         this.hit.buttonMode = true;
         this.hit.addEventListener(MouseEvent.CLICK,this.onHit);
      }

      private function onHit(e:MouseEvent) : void
      {
         if(this.npc.currentFrame == 5)
         {
            this.challenge();
            return;
         }
         AnimateManager.playMcAnimate(this.npc,2,"mc_2",function():void
         {
            npc.gotoAndStop(5);
            challenge();
         });
      }

      private function challenge() : void
      {
         NpcDialog.show(NPC.DIFUTE,["不错，万年来，我还没见过如此清澈的眼神。可是，如果你不展示一下实力的话，我无法确信是否可以真正托付于你，让我看看你的实力吧！"],["来吧！我对自己有信心！","让我再准备一下！"],[function():void
         {
            FightInviteManager.fightWithBoss("迪符特");
         }]);
      }

      override public function destroy() : void
      {
         this.hit.removeEventListener(MouseEvent.CLICK,this.onHit);
         this.hit = null;
         this.npc = null;
      }
   }
}
