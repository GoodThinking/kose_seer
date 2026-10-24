package com.robot.app.mapProcess
{
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task620;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import org.taomee.utils.DisplayUtil;

   /** 怀特矿场：保留全天 Boss 入口，按原任务状态切换剧情和解救康康。 */
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
         TasksController.runAfterTrackedTaskStatus(this.initAfterStatus,this);
      }

      private function initAfterStatus() : void
      {
         if(TasksManager.getTaskStatus(619) == TasksManager.ALR_ACCEPT)
         {
            Task620.delAll(this);
            DisplayUtil.removeForParent(conLevel["bossMc"]);
            return;
         }
         Task620.initTask(this);
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

      public function getKeyHandler() : void
      {
         Task620.getKeyHandler();
      }

      public function npcClickHandler() : void
      {
         Task620.npcClickHandler();
      }

      override public function destroy() : void
      {
         Task620.destroy();
         if(this.boss)
         {
            this.boss.removeEventListener(Event.ENTER_FRAME,this.waitButton);
         }
         if(this.btn)
         {
            this.btn.removeEventListener(MouseEvent.CLICK,this.onClick);
         }
         this.btn = null;
         this.boss = null;
      }
   }
}
