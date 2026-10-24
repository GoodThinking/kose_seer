package com.robot.app.task
{
   import com.robot.app.automaticFight.AutomaticFightManager;
   import com.robot.app.petItem.StudyUpManager;
   import com.robot.app.spt.PioneerTaskIconController;
   import com.robot.app.sptGalaxy.*;
   import com.robot.app.task.SeerInstructor.NewInstructorContoller;
   import com.robot.app.task.conscribeTeam.ConscribeTeam;
   import com.robot.app.task.control.TaskController_25;
   import com.robot.app.task.control.TasksController;
   import com.robot.app.task.dailyTask.DailyTaskController;
   import com.robot.app.task.newNovice.NewNoviceGuideTaskController;
   import com.robot.app.task.publicizeenvoy.PublicizeEnvoyIconControl;
   import com.robot.app.tasksRecord.TasksRecordController;
   import com.robot.core.CommandID;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.info.ExchangeInfo;
   import com.robot.core.manager.HatchTaskMapManager;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.TaskIconManager;
   import com.robot.core.manager.bean.BaseBeanController;
   import com.robot.core.mode.AppModel;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.npc.NpcController;
   import com.robot.core.teamPK.TeamPKManager;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.DisplayObject;
   import flash.display.Loader;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.IOErrorEvent;
   import flash.events.MouseEvent;
   import flash.events.SecurityErrorEvent;
   import flash.net.URLRequest;
   import flash.system.ApplicationDomain;
   import flash.system.LoaderContext;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.utils.ByteArray;
   import org.taomee.events.DynamicEvent;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.EventManager;
   import org.taomee.manager.ToolTipManager;
   
   public class TaskMain extends BaseBeanController
   {
      
      private var _iconMc:MovieClip;
      
      private var _panel:AppModel;
      
      private var _achieveIconMc:MovieClip;
      
      private var _achievePanel:AppModel;
      
      private var collectionIcon:MovieClip;
      
      private var collectionBook:Sprite;
      
      private var collectionSparkle:Sprite;
      
      private var collectionFrame:uint = 0;
      
      private var collectionLoader:Loader;
      
      private var collectionPanel:DisplayObject;
      
      public function TaskMain()
      {
         super();
      }
      
      override public function start() : void
      {
         PioneerTaskIconController.createIcon();
         DailyTaskController.setup();
         TasksRecordController.setup();
         NewInstructorContoller.setup();
         ConscribeTeam.setup();
         TaskController_25.start();
         EventManager.addEventListener("DS_TASK",this.onDsTask);
         if(MainManager.actorInfo.teamPKInfo.homeTeamID > 50000)
         {
            TeamPKManager.showIcon();
         }
         this.CreateDailySignIcon();
         this.createCollectionIcon();
         finish();
         AutomaticFightManager.setup();
         StudyUpManager.setup();
         HatchTaskMapManager.setup();
         NewNoviceGuideTaskController.setup();
         NpcController.setup();
         TasksController.setUp();
         XuanWuController.setup();
         SocketConnection.addCmdListener(CommandID.GET_EXCHANGE_INFO,this.getExchangeInfo);
         SocketConnection.send(CommandID.GET_EXCHANGE_INFO);
      }
      
      public function getExchangeInfo(param1:SocketEvent) : void
      {
         var _loc4_:ExchangeInfo = null;
         SocketConnection.removeCmdListener(CommandID.GET_EXCHANGE_INFO,this.getExchangeInfo);
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:uint = _loc2_.readUnsignedInt();
         var _loc5_:int = 0;
         while(_loc5_ < _loc3_)
         {
            _loc4_ = new ExchangeInfo(_loc2_);
            if(_loc4_._exchangeNum >= 999)
            {
               _loc4_._exchangeNum = 999;
            }
            MainManager.ExchangeInfoList.push(_loc4_);
            _loc5_++;
         }
      }
      
      private function onDsTask(param1:DynamicEvent) : void
      {
         MainManager.actorInfo.newInviteeCnt = uint(param1.paramObject);
         if(MainManager.actorInfo.newInviteeCnt >= 2)
         {
            PublicizeEnvoyIconControl.lightIcon();
         }
      }
      
      private function CreateAchievePanel() : void
      {
         this._achieveIconMc = TaskIconManager.getIcon("PublicizeEnloy_ICON") as MovieClip;
         ToolTipManager.add(this._achieveIconMc,"赛尔成就档案");
         TaskIconManager.addIcon(this._achieveIconMc);
         this._achieveIconMc.addEventListener(MouseEvent.CLICK,function(param1:MouseEvent):void
         {
            if(!_achievePanel)
            {
               _achievePanel = new AppModel(ClientConfig.getAppModule("AchieveNewPanel"),"正在加载赛尔成就档案....");
               _achievePanel.setup();
            }
            _achievePanel.show();
         });
      }
      
      private function createCollectionIcon() : void
      {
         this.collectionIcon = new MovieClip();
         this.collectionIcon.name = "petCollectionIcon";
         this.collectionIcon.graphics.beginFill(0,0);
         this.collectionIcon.graphics.drawRect(0,0,64,68);
         this.collectionIcon.graphics.endFill();
         this.collectionBook = new Sprite();
         this.collectionBook.x = 32;
         this.collectionBook.y = 31;
         this.collectionBook.rotation = -8;
         this.collectionBook.graphics.lineStyle(2,478328);
         this.collectionBook.graphics.beginFill(16055295);
         this.collectionBook.graphics.drawRoundRect(-23,-25,47,49,7,7);
         this.collectionBook.graphics.endFill();
         this.collectionBook.graphics.lineStyle(1,7780569);
         this.collectionBook.graphics.moveTo(-15,17);
         this.collectionBook.graphics.lineTo(20,17);
         this.collectionBook.graphics.moveTo(-15,20);
         this.collectionBook.graphics.lineTo(20,20);
         this.collectionBook.graphics.lineStyle(2,482453);
         this.collectionBook.graphics.beginFill(2338288);
         this.collectionBook.graphics.drawRoundRect(-24,-27,45,45,6,6);
         this.collectionBook.graphics.endFill();
         this.collectionBook.graphics.lineStyle(2,11923711);
         this.collectionBook.graphics.moveTo(-17,-24);
         this.collectionBook.graphics.lineTo(-17,14);
         this.collectionBook.graphics.lineStyle(2,11102729);
         this.collectionBook.graphics.beginFill(16769389);
         this.collectionBook.graphics.moveTo(-9,-6);
         this.collectionBook.graphics.lineTo(-10,-17);
         this.collectionBook.graphics.lineTo(-2,-12);
         this.collectionBook.graphics.lineTo(8,-17);
         this.collectionBook.graphics.lineTo(9,-6);
         this.collectionBook.graphics.drawEllipse(-10,-13,20,23);
         this.collectionBook.graphics.endFill();
         this.collectionBook.graphics.lineStyle();
         this.collectionBook.graphics.beginFill(1068917);
         this.collectionBook.graphics.drawEllipse(-6,-5,4,7);
         this.collectionBook.graphics.drawEllipse(3,-5,4,7);
         this.collectionBook.graphics.endFill();
         this.collectionBook.graphics.beginFill(16777215);
         this.collectionBook.graphics.drawCircle(-4,-3,1);
         this.collectionBook.graphics.drawCircle(5,-3,1);
         this.collectionBook.graphics.endFill();
         this.collectionIcon.addChild(this.collectionBook);
         this.collectionSparkle = new Sprite();
         this.collectionSparkle.x = 52;
         this.collectionSparkle.y = 10;
         this.collectionSparkle.graphics.lineStyle(1,11037193);
         this.collectionSparkle.graphics.beginFill(16771448);
         this.collectionSparkle.graphics.moveTo(0,-8);
         this.collectionSparkle.graphics.lineTo(2,-2);
         this.collectionSparkle.graphics.lineTo(8,0);
         this.collectionSparkle.graphics.lineTo(2,2);
         this.collectionSparkle.graphics.lineTo(0,8);
         this.collectionSparkle.graphics.lineTo(-2,2);
         this.collectionSparkle.graphics.lineTo(-8,0);
         this.collectionSparkle.graphics.lineTo(-2,-2);
         this.collectionSparkle.graphics.lineTo(0,-8);
         this.collectionSparkle.graphics.endFill();
         this.collectionIcon.addChild(this.collectionSparkle);
         var label:TextField = new TextField();
         label.defaultTextFormat = new TextFormat("Microsoft YaHei",11,16777215,true,null,null,null,null,"center");
         label.text = "收藏馆";
         label.width = 64;
         label.height = 20;
         label.y = 48;
         label.selectable = false;
         this.collectionIcon.addChild(label);
         this.collectionIcon.buttonMode = true;
         this.collectionIcon.mouseChildren = false;
         this.collectionIcon.addEventListener(MouseEvent.CLICK,this.openCollectionGallery);
         this.collectionIcon.addEventListener(MouseEvent.MOUSE_OVER,this.onCollectionOver);
         this.collectionIcon.addEventListener(MouseEvent.MOUSE_OUT,this.onCollectionOut);
         this.collectionIcon.addEventListener(Event.ADDED_TO_STAGE,this.onCollectionAdded);
         this.collectionIcon.addEventListener(Event.REMOVED_FROM_STAGE,this.onCollectionRemoved);
         TaskIconManager.addIcon(this.collectionIcon);
      }
      
      private function onCollectionAdded(event:Event) : void
      {
         if(event.target != this.collectionIcon)
         {
            return;
         }
         ToolTipManager.add(this.collectionIcon,"精灵收藏馆");
         this.collectionIcon.addEventListener(Event.ENTER_FRAME,this.onCollectionFrame);
      }
      
      private function onCollectionRemoved(event:Event) : void
      {
         if(event.target != this.collectionIcon)
         {
            return;
         }
         this.collectionIcon.removeEventListener(Event.ENTER_FRAME,this.onCollectionFrame);
         ToolTipManager.remove(this.collectionIcon);
         this.clearCollectionGallery();
      }
      
      private function onCollectionFrame(event:Event) : void
      {
         var _loc2_:TaskMain = this;
         var _loc3_:Number = _loc2_.collectionFrame + 1;
         _loc2_.collectionFrame = _loc3_;
         this.collectionBook.y = 31 + Math.sin(this.collectionFrame * 0.065) * 1.4;
         this.collectionSparkle.alpha = 0.65 + Math.sin(this.collectionFrame * 0.09) * 0.35;
      }
      
      private function onCollectionOver(event:MouseEvent) : void
      {
         this.collectionBook.rotation = -3;
      }
      
      private function onCollectionOut(event:MouseEvent) : void
      {
         this.collectionBook.rotation = -8;
      }
      
      private function CreateDailySignIcon() : void
      {
         this._iconMc = TaskIconManager.getIcon("ReadyForWar_Icon") as MovieClip;
         if(this._iconMc)
         {
            ToolTipManager.add(this._iconMc,"绝版神宠每日签到");
            TaskIconManager.addIcon(this._iconMc);
            if(this._iconMc["light_mc"])
            {
               (this._iconMc["light_mc"] as MovieClip).visible = true;
            }
            this._iconMc.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
            {
               if(!_panel)
               {
                  _panel = new AppModel(ClientConfig.getAppModule("FightExchangePanel"),"正在加载每日签到...");
                  _panel.setup();
               }
               _panel.show();
            });
         }
      }
      
      private function openCollectionGallery(event:MouseEvent) : void
      {
         if(this.collectionLoader)
         {
            return;
         }
         this.collectionLoader = new Loader();
         this.collectionLoader.contentLoaderInfo.addEventListener(Event.COMPLETE,this.onCollectionLoaded);
         this.collectionLoader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,this.onCollectionLoadError);
         this.collectionLoader.contentLoaderInfo.addEventListener(SecurityErrorEvent.SECURITY_ERROR,this.onCollectionLoadError);
         this.collectionLoader.load(new URLRequest("/resource/book/petCollection.swf"),new LoaderContext(false,new ApplicationDomain(ApplicationDomain.currentDomain)));
      }
      
      private function onCollectionLoaded(event:Event) : void
      {
         var symbol:Class = this.collectionLoader.contentLoaderInfo.applicationDomain.getDefinition("PetCollectionGallery") as Class;
         this.collectionPanel = new symbol() as DisplayObject;
         this.collectionPanel.addEventListener(Event.REMOVED_FROM_STAGE,this.onCollectionClosed);
         LevelManager.appLevel.addChild(this.collectionPanel);
      }
      
      private function onCollectionLoadError(event:Event) : void
      {
         this.clearCollectionGallery();
         Alarm.show("收藏馆加载失败，请稍后重试。");
      }
      
      private function onCollectionClosed(event:Event) : void
      {
         if(event.target == this.collectionPanel)
         {
            this.clearCollectionGallery();
         }
      }
      
      private function clearCollectionGallery() : void
      {
         if(this.collectionPanel)
         {
            this.collectionPanel.removeEventListener(Event.REMOVED_FROM_STAGE,this.onCollectionClosed);
            if(this.collectionPanel.parent)
            {
               this.collectionPanel.parent.removeChild(this.collectionPanel);
            }
            this.collectionPanel = null;
         }
         if(this.collectionLoader)
         {
            this.collectionLoader.contentLoaderInfo.removeEventListener(Event.COMPLETE,this.onCollectionLoaded);
            this.collectionLoader.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR,this.onCollectionLoadError);
            this.collectionLoader.contentLoaderInfo.removeEventListener(SecurityErrorEvent.SECURITY_ERROR,this.onCollectionLoadError);
            try
            {
               this.collectionLoader.close();
            }
            catch(error:Error)
            {
            }
            this.collectionLoader.unloadAndStop(true);
            this.collectionLoader = null;
         }
      }
   }
}

