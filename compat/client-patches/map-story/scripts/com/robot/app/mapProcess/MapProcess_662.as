package com.robot.app.mapProcess
{
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import com.robot.core.ui.*;
   import flash.display.MovieClip;
   import flash.events.*;
   import flash.ui.*;
   import flash.utils.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class MapProcess_662 extends BaseMapProcess
   {
      
      public static var canPourWater:Boolean;
      
      private var _timer:Timer;
      
      private var startXposi:Number;
      
      private var startYposi:Number;
      
      private var timeoutid:uint;
      
      private var _stage:*;
      
      public function MapProcess_662()
      {
         super();
      }
      
      public static function openDoor() : void
      {
         var _loc1_:MovieClip = null;
         if(MapManager.currentMap.id == 662)
         {
            if(MapManager.currentMap.typeLevel["block"] == null || MapManager.currentMap.controlLevel["wall"] == null)
            {
               return;
            }
            DisplayUtil.removeForParent(MapManager.currentMap.typeLevel["block"]);
            MapManager.currentMap.makeMapArray();
            DisplayUtil.removeForParent(MapManager.currentMap.controlLevel["wall"]);
            _loc1_ = AssetsManager.getMovieClip("HelpUI_Arrow");
            if(Boolean(_loc1_))
            {
               _loc1_.mouseEnabled = _loc1_.mouseChildren = false;
               _loc1_.gotoAndStop(1);
               _loc1_.x = 628;
               _loc1_.y = 140;
               _loc1_.rotation = 200;
               MapManager.currentMap.topLevel.addChild(_loc1_);
            }
         }
      }
      
      override protected function init() : void
      {
         this._timer = new Timer(8000);
         this._timer.addEventListener(TimerEvent.TIMER,this.onTimer);
         this._timer.start();
         typeLevel["block"].visible = false;
         conLevel["wall"].visible = false;
         MapManager.currentMap.makeMapArray();
         ToolTipManager.add(conLevel["eggHit"],"凤凰神兽蛋");
         conLevel["eggHit"].buttonMode = true;
         conLevel["eggHit"].addEventListener(MouseEvent.CLICK,this.onEggClick);
         ToolTipManager.add(conLevel["box"],"塔罗山秘宝");
         conLevel["box"].buttonMode = true;
         conLevel["box"].addEventListener(MouseEvent.CLICK,this.onBoxClick);
         ToolTipManager.add(conLevel["key"],"电子分解器");
         conLevel["key"].buttonMode = true;
         conLevel["key"].addEventListener(MouseEvent.CLICK,this.onKeyClick);
         conLevel["stone"].buttonMode = true;
         conLevel["stone"].addEventListener(MouseEvent.CLICK,this.onStoneClick);
         conLevel["soldier"].buttonMode = true;
         conLevel["soldier"].addEventListener(MouseEvent.CLICK,this.onSoldierClick);
         this.initBucket();
      }
      
      private function onTimer(param1:TimerEvent) : void
      {
         var _loc2_:DialogBox = new DialogBox();
         _loc2_.show("小XIN，快来这里看看吧！",conLevel["soldier"].x,-50,conLevel["soldier"]);
      }
      
      private function onEggClick(param1:MouseEvent) : void
      {
         ModuleManager.showModule(ClientConfig.getAppModule("MoviePetExchangePanel"),"正在打开面板....");
      }
      
      private function onBoxClick(param1:MouseEvent) : void
      {
         ModuleManager.showModule(ClientConfig.getAppModule("MoviePetExamPanel"),"正在打开面板....");
      }
      
      private function onKeyClick(param1:MouseEvent) : void
      {
         ModuleManager.showModule(ClientConfig.getAppModule("MoviePasswordInputPanel"),"正在打开面板....");
      }
      
      private function onStoneClick(param1:MouseEvent) : void
      {
         var event:MouseEvent = param1;
         AnimateManager.playMcAnimate(conLevel["stone"],0,"",function():void
         {
         });
      }
      
      private function onSoldierClick(param1:MouseEvent) : void
      {
         NpcDialog.show(NPC.SOLIDMAN,["咦！这座山好奇怪啊！怎么会有岩石掉落下来呢！难道岩石后面会有什么秘密吗？"]);
      }
      
      public function onChangeMapTo664() : void
      {
         MapManager.changeMap(664);
      }
      
      override public function destroy() : void
      {
         ModuleManager.destroy(ClientConfig.getAppModule("MoviePetExchangePanel"));
         ModuleManager.destroy(ClientConfig.getAppModule("MoviePetExamPanel"));
         ModuleManager.destroy(ClientConfig.getAppModule("MoviePasswordInputPanel"));
         ToolTipManager.remove(conLevel["eggHit"]);
         ToolTipManager.remove(conLevel["box"]);
         ToolTipManager.remove(conLevel["key"]);
         conLevel["eggHit"].removeEventListener(MouseEvent.CLICK,this.onEggClick);
         conLevel["box"].removeEventListener(MouseEvent.CLICK,this.onBoxClick);
         conLevel["key"].removeEventListener(MouseEvent.CLICK,this.onKeyClick);
         conLevel["stone"].removeEventListener(MouseEvent.CLICK,this.onStoneClick);
         conLevel["soldier"].removeEventListener(MouseEvent.CLICK,this.onSoldierClick);
         this._timer.reset();
         this._timer.removeEventListener(TimerEvent.TIMER,this.onTimer);
         this._timer = null;
         super.destroy();
      }
      
      private function initBucket() : void
      {
         this.bucket.mouseChildren = false;
         this.bucket.buttonMode = true;
         this.bucket.addEventListener(MouseEvent.CLICK,this.onBucketClicked);
         this.startXposi = this.bucket.x;
         this.startYposi = this.bucket.y;
         canPourWater = false;
         conLevel.addEventListener(Event.REMOVED_FROM_STAGE,this.destroyBucket);
      }
      
      private function onBucketClicked(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         this.bucket.mouseEnabled = false;
         this.bucket.gotoAndStop(2);
         this.timeoutid = setTimeout(function():void
         {
            bucket.gotoAndStop(3);
            bucket.x = conLevel.mouseX;
            bucket.y = conLevel.mouseY;
            bucket.startDrag();
            Mouse.hide();
            _stage = conLevel.stage;
            _stage.addEventListener(MouseEvent.CLICK,onPouring);
            canPourWater = true;
            clearTimeout(timeoutid);
         },2000);
      }
      
      private function onPouring(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         canPourWater = false;
         this.bucket.stopDrag();
         conLevel.stage.removeEventListener(MouseEvent.CLICK,this.onPouring);
         this.bucket.gotoAndStop(4);
         this.timeoutid = setTimeout(function():void
         {
            bucket.gotoAndStop(1);
            bucket.x = startXposi;
            bucket.y = startYposi;
            bucket.mouseEnabled = true;
            Mouse.show();
            clearTimeout(timeoutid);
         },2000);
      }
      
      private function destroyBucket(param1:Event) : void
      {
         clearTimeout(this.timeoutid);
         Mouse.show();
         this.bucket.removeEventListener(MouseEvent.CLICK,this.onBucketClicked);
         if(Boolean(this._stage))
         {
            this._stage.removeEventListener(MouseEvent.CLICK,this.onPouring);
            this._stage = null;
         }
         conLevel.removeEventListener(Event.REMOVED_FROM_STAGE,this.destroyBucket);
      }
      
      private function get bucket() : MovieClip
      {
         return topLevel["bucket"];
      }
   }
}

