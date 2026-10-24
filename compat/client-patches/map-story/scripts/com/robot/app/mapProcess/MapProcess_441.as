package com.robot.app.mapProcess
{
   import com.robot.app.buyItem.ItemAction;
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.taskscollection.Task549;
   import com.robot.core.event.ItemEvent;
   import com.robot.core.event.UserEvent;
   import com.robot.core.info.clothInfo.PeopleItemInfo;
   import com.robot.core.manager.ItemManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import org.taomee.manager.EventManager;

   public class MapProcess_441 extends BaseMapProcess
   {
      private var _isInitTask:Boolean;
      private var _taskStatusReady:Boolean;
      private var _destroyed:Boolean;
      private var sptBtn:MovieClip;

      override protected function init() : void
      {
         conLevel["jump"].stop();
         topLevel["camera"].visible = false;
         conLevel["jump"].visible = false;
         conLevel["shadow"].visible = false;
         conLevel["mud"].visible = false;
         conLevel["animate"].visible = false;
         conLevel["key"].visible = false;
         topLevel["fog"].mouseEnabled = false;
         topLevel["fog"].mouseChildren = false;
         ItemManager.addEventListener(ItemEvent.CLOTH_LIST,this.onClothList);
         ItemManager.getCloth();
         EventManager.addEventListener(UserEvent.INFO_CHANGE,this.onClothChange);
         this.checkCloth();
         var map:MapProcess_441 = this;
         TasksController.runAfterTrackedTaskStatus(function():void
         {
            if(map._destroyed) return;
            map._taskStatusReady = true;
            map.checkCloth();
         },this);
         this.sptBtn = conLevel["sptBtn"];
         this.sptBtn.mouseChildren = false;
         this.sptBtn.mc1.gotoAndPlay(1);
         this.sptBtn.mc2.gotoAndStop(1);
         this.sptBtn.mc1.visible = true;
         this.sptBtn.mc2.visible = false;
         this.sptBtn.buttonMode = true;
         this.sptBtn.addEventListener(MouseEvent.CLICK,this.sptBtnClick);
      }

      private function onClothList(event:ItemEvent) : void
      {
         ItemManager.removeEventListener(ItemEvent.CLOTH_LIST,this.onClothList);
         if(!this._destroyed && ItemManager.getClothIDs().indexOf(100564) == -1)
         {
            ItemAction.buyItem(100564,false);
         }
      }

      private function onClothChange(event:UserEvent) : void
      {
         if(event.userInfo && event.userInfo.userID == MainManager.actorID)
         {
            this.checkCloth();
         }
      }

      private function checkCloth() : void
      {
         var equipped:Boolean = false;
         for each(var cloth:PeopleItemInfo in MainManager.actorInfo.clothes)
         {
            if(cloth.id == 100564)
            {
               equipped = true;
               break;
            }
         }
         topLevel["fog"].visible = !equipped;
         if(equipped && this._taskStatusReady && !this._isInitTask)
         {
            this._isInitTask = true;
            conLevel["key"].visible = true;
            Task549.initTask_441(this);
         }
      }

      private function sptBtnClick(event:MouseEvent) : void
      {
         this.sptBtn.removeEventListener(MouseEvent.CLICK,this.sptBtnClick);
         this.sptBtn.mc1.visible = false;
         this.sptBtn.mc2.visible = true;
         this.sptBtn.mc1.gotoAndStop(1);
         this.sptBtn.mc2.gotoAndPlay(1);
         this.sptBtn.addEventListener(MouseEvent.CLICK,this.sptClick);
      }

      private function sptClick(event:MouseEvent) : void
      {
         if(this.sptBtn.mc2.currentFrame == this.sptBtn.mc2.totalFrames)
         {
            this.sptBtn.removeEventListener(MouseEvent.CLICK,this.sptClick);
            this.sptBtn.addEventListener(MouseEvent.CLICK,this.sptBtnClick);
            FightInviteManager.fightWithBoss("肯佩德");
            this.sptBtn.mc1.visible = true;
            this.sptBtn.mc1.gotoAndPlay(1);
            this.sptBtn.mc2.visible = false;
         }
      }

      override public function destroy() : void
      {
         this._destroyed = true;
         ItemManager.removeEventListener(ItemEvent.CLOTH_LIST,this.onClothList);
         EventManager.removeEventListener(UserEvent.INFO_CHANGE,this.onClothChange);
         this.sptBtn.removeEventListener(MouseEvent.CLICK,this.sptBtnClick);
         this.sptBtn.removeEventListener(MouseEvent.CLICK,this.sptClick);
         Task549.destroy(this);
      }
   }
}
