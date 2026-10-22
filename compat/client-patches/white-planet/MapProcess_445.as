package com.robot.app.mapProcess
{
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;

   /**
    * 炫彩山山脚：点击卡修斯挑战（地图与对白按原版，脚本参照 XIN 站客户端）。
    * 原版剧情任务（698、707、743、755）和远古契约谜题没有恢复，相关画面隐藏。
    * 地图表里的神秘洞窟入口会调用 gotoHoleFight，洞窟玩法没有恢复，只提示。
    */
   public class MapProcess_445 extends BaseMapProcess
   {
      private var kaxiusi:MovieClip;

      public function MapProcess_445()
      {
         super();
      }

      override protected function init() : void
      {
         var name:String = null;
         for each(name in ["kazi2MC","kaziMC","black1MC","black2MC"])
         {
            (conLevel[name] as DisplayObject).visible = false;
         }
         (topLevel["yuanguPanel"] as DisplayObject).visible = false;
         this.kaxiusi = conLevel["kaxiusiMC"] as MovieClip;
         this.kaxiusi.buttonMode = true;
         this.kaxiusi.addEventListener(MouseEvent.CLICK,this.onKaxiusi);
      }

      private function onKaxiusi(e:MouseEvent) : void
      {
         NpcDialog.show(NPC.KAXIUSI_WHITE,["守护炫彩山是我的使命！"],["我要挑战你！","嗯，你好好站岗吧，我顶你！"],[function():void
         {
            FightInviteManager.fightWithBoss("卡修斯");
         }]);
      }

      public function gotoHoleFight(mc:* = null) : void
      {
         Alarm.show("炫彩山神秘洞窟暂未开放。");
      }

      override public function destroy() : void
      {
         this.kaxiusi.removeEventListener(MouseEvent.CLICK,this.onKaxiusi);
         this.kaxiusi = null;
      }
   }
}
