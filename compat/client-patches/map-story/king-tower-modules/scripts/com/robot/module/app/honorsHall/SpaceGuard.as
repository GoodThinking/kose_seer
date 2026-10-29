package com.robot.module.app.honorsHall
{
   import com.robot.app.mapProcess.MapProcess_465;
   import com.robot.core.config.xml.SpaceGuardXMLInfo;
   import com.robot.core.manager.MapManager;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.events.TimerEvent;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.utils.Timer;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;

   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class SpaceGuard extends Sprite implements IModule
   {
      private var npc:MovieClip;
      private var t:Timer = new Timer(5000);
      private var disposed:Boolean = false;

      public function SpaceGuard()
      {
         super();
      }

      public function setup() : void
      {
         this.npc = new SpaceGuard_panel();
         this.npc.buttonMode = true;
         this.npc.mouseChildren = false;
         this.npc.addEventListener(MouseEvent.CLICK,this.onNpcClicked);
         this.npc["dialog"].visible = false;
         var message:TextField = this.npc["dialog"]["message"] as TextField;
         var format:TextFormat = message.getTextFormat();
         format.font = "Microsoft YaHei";
         message.defaultTextFormat = format;
         this.t.addEventListener(TimerEvent.TIMER,this.onTimer);
      }

      private function onNpcClicked(event:MouseEvent) : void
      {
         event.stopPropagation();
         NpcDialog.show(NPC.SOLIDMAN,["欢迎挑战王者之塔！点击塔侧突起切换模式，走到塔门即可选择楼层。想先了解挑战规则，还是查看自己的记录？"],["挑战规则","查看我的挑战记录","我去准备一下"],[function():void
         {
            if(disposed || MapManager.currentMap.id != 465)
            {
               return;
            }
            NpcDialog.show(NPC.SOLIDMAN,["普通模式至少携带一只100级精灵；极限模式至少三只，并且不能在塔内从仓库调换背包成员，战斗内换宠和药品仍能使用。极限每十层返回入口。打赢整支敌队才会前进，逃跑、断线不跳层，已通关记录不会丢失。后十层是本服综合复习关。"],["明白了"]);
         },function():void
         {
            if(!disposed && MapManager.currentMap.id == 465)
            {
               MapProcess_465.showRecord();
            }
         }]);
      }

      private function onTimer(event:TimerEvent) : void
      {
         if(this.t.currentCount % 4 == 1)
         {
            this.npc["dialog"].visible = true;
            this.npc["dialog"]["message"].text = SpaceGuardXMLInfo.getDialog();
         }
         else if(this.t.currentCount % 4 == 2)
         {
            this.npc["dialog"].visible = false;
         }
      }

      public function hide() : void
      {
         DisplayUtil.removeForParent(this.npc);
         this.t.stop();
         this.t.reset();
      }

      public function show() : void
      {
         MapManager.currentMap.depthLevel.addChild(this.npc);
         this.t.start();
      }

      public function init(data:Object = null) : void
      {
         this.npc.x = data[0];
         this.npc.y = data[1];
      }

      public function destroy() : void
      {
         this.disposed = true;
         this.hide();
         this.t.removeEventListener(TimerEvent.TIMER,this.onTimer);
         this.npc.removeEventListener(MouseEvent.CLICK,this.onNpcClicked);
      }
   }
}
