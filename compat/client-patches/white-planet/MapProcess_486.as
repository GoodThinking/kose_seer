package com.robot.app.mapProcess
{
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.Event;
   import flash.events.MouseEvent;

   /**
    * 怀特矿场：点击德拉萨奶油浴旁的石头，破坏奶油浴后挑战德拉萨（4399 攻略）。
    * 动画分段与 XIN 站客户端一致；它另加的 19:00–20:00 时段限制和原版剧情任务（619、620）没有恢复。
    */
   public class MapProcess_486 extends BaseMapProcess
   {
      private var boss:MovieClip;

      private var btn:SimpleButton;

      public function MapProcess_486()
      {
         super();
      }

      override protected function init() : void
      {
         this.boss = conLevel["bossMc"] as MovieClip;
         this.boss.addEventListener(Event.ENTER_FRAME,this.waitButton);
      }

      private function waitButton(e:Event) : void
      {
         if(Boolean(this.boss["btn"]))
         {
            this.boss.removeEventListener(Event.ENTER_FRAME,this.waitButton);
            this.btn = this.boss["btn"];
            this.btn.addEventListener(MouseEvent.CLICK,this.onClick);
         }
      }

      private function onClick(e:MouseEvent) : void
      {
         var frame:int = this.boss.currentFrame;
         if(frame == this.boss.totalFrames)
         {
            FightInviteManager.fightWithBoss("德拉萨");
         }
         else if(frame == 1 || frame == 6 || frame == 38 || frame == 289)
         {
            if(this.boss["mc"] is MovieClip)
            {
               MovieClip(this.boss["mc"]).gotoAndPlay(2);
            }
            this.boss.gotoAndPlay(frame + 1);
         }
      }

      override public function destroy() : void
      {
         this.boss.removeEventListener(Event.ENTER_FRAME,this.waitButton);
         if(Boolean(this.btn))
         {
            this.btn.removeEventListener(MouseEvent.CLICK,this.onClick);
         }
         this.btn = null;
         this.boss = null;
      }
   }
}
