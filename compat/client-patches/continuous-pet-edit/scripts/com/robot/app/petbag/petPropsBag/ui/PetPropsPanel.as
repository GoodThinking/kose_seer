package com.robot.app.petbag.petPropsBag.ui
{
   import com.robot.app.bag.BagListItem;
   import com.robot.app.petbag.PetBagController;
   import com.robot.app.petbag.PetPropInfo;
   import com.robot.core.CommandID;
   import com.robot.core.config.xml.ItemXMLInfo;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.config.xml.NatureXMLInfo;
   import com.robot.core.config.xml.PetEffectXMLInfo;
   import com.robot.core.event.ItemEvent;
   import com.robot.core.event.PetEvent;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.info.userItem.SingleItemInfo;
   import com.robot.core.manager.ItemManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.manager.UIManager;
   import com.robot.core.net.SocketConnection;
   import org.taomee.net.SocketDispatcher;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.alert.Alert;
   import com.robot.core.ui.itemTip.ItemInfoTip;
   import com.robot.core.utils.TextFormatUtil;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.events.EventDispatcher;
   import flash.filters.GlowFilter;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import flash.utils.getDefinitionByName;
   import org.taomee.events.SocketEvent;
   import org.taomee.events.SocketErrorEvent;
   import org.taomee.utils.DisplayUtil;
   
   public class PetPropsPanel extends Sprite
   {
      
      public static const PREV_PAGE:String = "prevPage";
      
      public static const NEXT_PAGE:String = "nextPage";
      
      public static const SHOW_COLLECTION:String = "showCollection";
      private static const REROLL_TYPES:Object = {}; // @REROLL_TYPES@
      private static var owner:PetPropsPanel;
      private static var busyOwner:PetPropsPanel;

      private var disposed:Boolean = false;
      private var confirmedKey:String = "";
      private var repeatItem:uint;
      private var repeatPet:uint;
      private var lastResult:String = "";
      private var phase:String = "";
      private var requestItem:uint;
      private var requestPet:uint;
      private var requestName:String;
      private var requestBefore:String;
      private var outcome:String;
      private var stockReady:Boolean;
      private var petReady:Boolean;
      private var requestTimer:uint;
      private var errorDispatcher:EventDispatcher;
      private var repeatPanel:Sprite;
      private var repeatText:TextField;
      private var stockText:TextField;
      private var repeatButton:Sprite;
      private var repeatLabel:TextField;
      
      private var _clickItemID:uint;
      
      private var petPropsPanel:Sprite;
      
      private var _listCon:Sprite;
      
      private var _itemArr:Array = [];
      
      private var _currentBagItem:BagListItem;
      
      private var _petInfo:PetInfo;
      
      private var itemID:uint;
      
      private var itemName:String;
      
      private var _propInfo:PetPropInfo;
      
      public function PetPropsPanel(param1:Sprite)
      {
         super();
         if(owner != null)owner.dispose();
         owner = this;
         this.petPropsPanel = param1;
         this.show();
         this.addEvent();
      }
      
      public function hide() : void
      {
         this.petPropsPanel.visible = false;
         this.confirmedKey = "";
         dispatchEvent(new Event(Event.CLOSE));
      }
      
      public function addEvent() : void
      {
      }
      
      public function showItem(param1:Array) : void
      {
         var _loc2_:* = 0;
         var _loc3_:BagListItem = null;
         var _loc4_:SingleItemInfo = null;
         var _loc5_:Boolean = false;
         this.clearItemPanel();
         var _loc6_:int = int(param1.length);
         var _loc7_:int = 0;
         while(_loc7_ < _loc6_)
         {
            _loc2_ = uint(param1[_loc7_]);
            _loc3_ = this._listCon.getChildAt(_loc7_) as BagListItem;
            _loc4_ = ItemManager.getPetItemInfo(_loc2_);
            _loc5_ = false;
            _loc3_.buttonMode = true;
            _loc3_.setInfo(_loc4_,_loc5_);
            _loc3_.addEventListener(MouseEvent.ROLL_OVER,this.onShowItemInfo);
            _loc3_.addEventListener(MouseEvent.ROLL_OUT,this.onHideItemInfo);
            _loc3_.addEventListener(MouseEvent.CLICK,this.onPetPropsUsed);
            _loc7_++;
         }
      }
      
      public function show() : void
      {
         this._listCon = new Sprite();
         this._listCon.x = 50;
         this._listCon.y = 20;
         this.petPropsPanel.addChild(this._listCon);
         this.createItemPanel();
         this._listCon.addEventListener(Event.REMOVED_FROM_STAGE,this.onVisualRemoved);
         this.createRepeatControls();
         var _loc1_:SimpleButton = this.petPropsPanel["prev_btn"];
         var _loc2_:SimpleButton = this.petPropsPanel["next_btn"];
         _loc1_.addEventListener(MouseEvent.CLICK,this.prevHandler);
         _loc2_.addEventListener(MouseEvent.CLICK,this.nextHandler);
      }
      
      private function createItemPanel() : void
      {
         var _loc1_:BagListItem = null;
         _loc1_ = null;
         var _loc2_:int = 0;
         while(_loc2_ < 9)
         {
            _loc1_ = new BagListItem(UIManager.getSprite("itemPanel"));
            _loc1_.x = (_loc1_.width + 10) * (int(_loc2_ % 3));
            _loc1_.y = (_loc1_.height + 10) * (int(_loc2_ / 3));
            this._listCon.addChild(_loc1_);
            _loc2_++;
         }
      }
      
      private function clearItemPanel() : void
      {
         var _loc1_:BagListItem = null;
         var _loc2_:int = this._listCon.numChildren;
         var _loc3_:int = 0;
         while(_loc3_ < _loc2_)
         {
            _loc1_ = this._listCon.getChildAt(_loc3_) as BagListItem;
            _loc1_.clear();
            _loc1_.removeEventListener(MouseEvent.ROLL_OVER,this.onShowItemInfo);
            _loc1_.removeEventListener(MouseEvent.ROLL_OUT,this.onHideItemInfo);
            _loc1_.removeEventListener(MouseEvent.CLICK,this.onPetPropsUsed);
            _loc1_.buttonMode = false;
            _loc3_++;
         }
      }
      
      private function prevHandler(param1:MouseEvent) : void
      {
         dispatchEvent(new Event(PREV_PAGE));
      }
      
      private function nextHandler(param1:MouseEvent) : void
      {
         dispatchEvent(new Event(NEXT_PAGE));
      }
      
      public function setPageNum(param1:uint, param2:uint) : void
      {
         this.petPropsPanel["page_txt"].text = param1 + "/" + param2;
      }
      
      public function onPetPropsUsed(param1:MouseEvent) : void
      {
         var _loc2_:String = null;
         if(busyOwner != null)return;
         ItemInfoTip.hide();
         if(this._petInfo == null)
         {
            Alarm.show("你要先选择一个精灵噢");
            return;
         }
         this._currentBagItem = param1.currentTarget as BagListItem;
         if(this._currentBagItem.info == null)
         {
            return;
         }
         this.itemID = this._currentBagItem.info.itemID;
         this.itemName = ItemXMLInfo.getName(this.itemID);
         if(this.itemID == 300028 || this.itemID == 300035)
         {
            _loc2_ = "你确定要使用" + TextFormatUtil.getRedTxt(this.itemName) + "吗?";
         }
         else
         {
            _loc2_ = "你确定要为你的<font color=\'#ff0000\'>" + PetXMLInfo.getName(this._petInfo.id) + "</font>使用" + TextFormatUtil.getRedTxt(this.itemName) + "吗?";
            PetManager.handleCatchTime = this._petInfo.catchTime;
         }
         this._propInfo = new PetPropInfo();
         this._propInfo.petInfo = this._petInfo;
         this._propInfo.itemId = this.itemID;
         if(REROLL_TYPES[this.itemID] != null)
         {
            if(this.repeatItem != this.itemID || this.repeatPet != this._petInfo.catchTime)this.confirmedKey = "";
            this.repeatItem = this.itemID;
            this.repeatPet = this._petInfo.catchTime;
            this.lastResult = "";
            this.renderRepeat();
         }
         else
         {
            this.repeatItem = 0;
            this.confirmedKey = "";
            this.renderRepeat();
         }
         this._propInfo.itemName = this.itemName;
         if(REROLL_TYPES[this.itemID] != null && this.confirmedKey == this.repeatPet + ":" + this.repeatItem)this.onsureHandler();
         else Alert.show(_loc2_,this.onsureHandler);
      }
      
      private function onsureHandler() : void
      {
         if(this.disposed || busyOwner != null || this._petInfo == null)return;
         var current:PetInfo = PetManager.getPetInfo(this._propInfo.petInfo.catchTime);
         if(current == null || current.catchTime != this._petInfo.catchTime)return;
         this._propInfo.petInfo = current;
         this.requestItem = this._propInfo.itemId;
         this.requestPet = current.catchTime;
         if(this.requestItem != 300028 && this.requestItem != 300035)PetManager.handleCatchTime = this.requestPet;
         this.requestName = PetXMLInfo.getName(current.id);
         var reroll:Boolean = REROLL_TYPES[this.requestItem] != null;
         this.requestBefore = reroll ? this.describe(current,String(REROLL_TYPES[this.requestItem])) : "";
         if(reroll)this.confirmedKey = this.requestPet + ":" + this.requestItem;
         busyOwner = this;
         this.phase = reroll ? "using" : "legacy";
         this.errorDispatcher = SocketDispatcher.getInstance();
         this.errorDispatcher.addEventListener(SocketErrorEvent.ERROR,this.onUseError);
         SocketConnection.addCmdListener(CommandID.USE_PET_ITEM_FULL_ABILITY_OF_STUDY,this.onUpDate);
         SocketConnection.addCmdListener(CommandID.USE_PET_ITEM_OUT_OF_FIGHT,this.onUpDate);
         this.requestTimer = setTimeout(this.onRequestTimeout,8000);
         this.renderRepeat();
         try
         {
            var definition:Object = getDefinitionByName("com.robot.app.petbag.petPropsBag.petPropClass.PetPropClass_" + this.requestItem);
            if(!reroll)this.hide();
            new definition(this._propInfo);
         }
         catch(error:Error)
         {
            if(!reroll && this.requestItem == 300700)
            {
               this.hide();
               SocketConnection.send(CommandID.USE_PET_ITEM_OUT_OF_FIGHT,this.requestPet,this.requestItem);
               return;
            }
            this.releaseRequest();
            this.confirmedKey = "";
            this.lastResult = "当前客户端无法使用这瓶药水，请重新选择。";
            this.renderRepeat();
         }
      }
      
      private function onUpDate(param1:SocketEvent) : void
      {
         if(busyOwner != this || this.phase != "using" && this.phase != "legacy")return;
         if(this.phase == "using")
         {
            this.beginSync("success");
            return;
         }
         this.releaseRequest();
         if(owner == this && !this.disposed)this.hide();
         PetManager.upDate();
         this.refreshStock();
         if(this.requestItem >= 300037 && this.requestItem <= 300042 &&
            PetBagController.panel.curretItem.info.catchTime == this.requestPet)
         {
            PetBagController.panel.curretItem.showClear();
         }
      }
      
      private function onShowItemInfo(param1:MouseEvent) : void
      {
         var _loc2_:BagListItem = param1.currentTarget as BagListItem;
         if(_loc2_.info == null)
         {
            return;
         }
         this._clickItemID = _loc2_.info.itemID;
         ItemInfoTip.show(_loc2_.info);
      }
      
      private function onHideItemInfo(param1:MouseEvent) : void
      {
         ItemInfoTip.hide();
      }
      
      public function getPetInfo(param1:PetInfo) : PetInfo
      {
         if(this._petInfo != null && param1 != null && this._petInfo.catchTime != param1.catchTime)
         {
            this.confirmedKey = "";
            this.repeatPet = param1.catchTime;
            this.lastResult = "目标已切换，下次使用需重新确认。";
         }
         this._petInfo = param1;
         this.renderRepeat();
         return this._petInfo;
      }
      
      public function get clickItemID() : uint
      {
         return this._clickItemID;
      }

      private function createRepeatControls():void
      {
         var width:Number = this._listCon.width;
         this.repeatPanel = new Sprite();
         this.repeatPanel.x = this._listCon.x;
         this.repeatPanel.y = this._listCon.y + this._listCon.height + 8;
         this.repeatPanel.graphics.lineStyle(1,0x6CDFFF);
         this.repeatPanel.graphics.beginFill(0x103F68);
         this.repeatPanel.graphics.drawRoundRect(0,0,width,66,10,10);
         this.repeatPanel.graphics.endFill();
         this.petPropsPanel.addChild(this.repeatPanel);
         this.repeatText = this.footerText(8,3,width-16,30,11);
         this.repeatText.multiline = true;
         this.repeatText.wordWrap = true;
         this.stockText = this.footerText(8,42,width-138,20,11);
         this.repeatButton = new Sprite();
         this.repeatButton.x = width-122;
         this.repeatButton.y = 34;
         var up:* = UIManager.getDisplayObject("Button_upSkin");
         var over:* = UIManager.getDisplayObject("Button_overSkin");
         var down:* = UIManager.getDisplayObject("Button_downSkin");
         up.width = over.width = down.width = 114;
         up.height = over.height = down.height = 28;
         this.repeatButton.addChild(new SimpleButton(up,over,down,up));
         this.repeatLabel = new TextField();
         this.repeatLabel.defaultTextFormat = new TextFormat("宋体",12,0xFFFFFF,true);
         this.repeatLabel.width = 114;
         this.repeatLabel.height = 24;
         this.repeatLabel.y = 4;
         this.repeatLabel.mouseEnabled = false;
         this.repeatLabel.selectable = false;
         var centered:TextFormat = this.repeatLabel.defaultTextFormat;
         centered.align = "center";
         this.repeatLabel.defaultTextFormat = centered;
         this.repeatLabel.filters = [new GlowFilter(0x0A5287,0.8,3,3,8)];
         this.repeatButton.addChild(this.repeatLabel);
         this.repeatButton.addEventListener(MouseEvent.CLICK,this.onRepeat);
         this.repeatPanel.addChild(this.repeatButton);
         this.renderRepeat();
      }

      private function footerText(x:Number,y:Number,width:Number,height:Number,size:int):TextField
      {
         var field:TextField = new TextField();
         field.defaultTextFormat = new TextFormat("宋体",size,0xFFFFFF);
         field.x = x;field.y = y;field.width = width;field.height = height;
         field.mouseEnabled = false;field.selectable = false;
         this.repeatPanel.addChild(field);
         return field;
      }

      private function renderRepeat():void
      {
         if(this.disposed || this.repeatPanel == null)return;
         this.repeatPanel.visible = this.repeatItem != 0 && this._petInfo != null;
         if(!this.repeatPanel.visible)return;
         var stock:SingleItemInfo = ItemManager.getPetItemInfo(this.repeatItem);
         var count:uint = stock == null ? 0 : stock.itemNum;
         var currentKey:String = this.repeatPet + ":" + this.repeatItem;
         var message:String = this.lastResult;
         if(this.phase == "using")message = "正在为" + this.requestName + "使用，请稍候…";
         else if(this.phase == "sync")message = "正在同步实际结果与药水余量…";
         else if(this.phase == "sync-error")message = "同步超时；点刷新，不会用药。";
         else if(message == "")message = "每次一瓶，不满意可手动继续。";
         this.repeatText.text = PetXMLInfo.getName(this._petInfo.id) + " · " + ItemXMLInfo.getName(this.repeatItem) + "\n" + message;
         this.stockText.text = this.phase == "sync-error" ? "余量未同步" : this.phase == "using" || this.phase == "sync" ? "余量同步中" : "余量 " + count;
         this.repeatLabel.text = this.phase == "sync-error" ? "刷新结果" : this.phase == "using" ? "使用中…" : this.phase == "sync" ? "同步中…" : count == 0 ? "已用尽" : this.confirmedKey == currentKey ? "继续使用" : "使用药水";
         var enabled:Boolean = busyOwner == null && (this.phase == "sync-error" || count > 0 && PetManager.getPetInfo(this.repeatPet) != null);
         this.repeatButton.mouseEnabled = enabled;
         this.repeatButton.mouseChildren = enabled;
         this.repeatButton.buttonMode = enabled;
         this.repeatButton.alpha = enabled ? 1 : 0.45;
      }

      private function onRepeat(event:MouseEvent):void
      {
         if(this.disposed || busyOwner != null)return;
         if(this.phase == "sync-error")
         {
            busyOwner = this;
            this.beginSync(this.outcome);
            return;
         }
         var pet:PetInfo = PetManager.getPetInfo(this.repeatPet);
         var stock:SingleItemInfo = ItemManager.getPetItemInfo(this.repeatItem);
         if(pet == null || this._petInfo == null || pet.catchTime != this._petInfo.catchTime || stock == null || stock.itemNum == 0)return;
         this.itemID = this.repeatItem;
         this.itemName = ItemXMLInfo.getName(this.itemID);
         this._propInfo = new PetPropInfo();
         this._propInfo.petInfo = pet;
         this._propInfo.itemId = this.itemID;
         this._propInfo.itemName = this.itemName;
         if(this.confirmedKey == this.repeatPet + ":" + this.repeatItem)this.onsureHandler();
         else Alert.show("你确定要为你的" + TextFormatUtil.getRedTxt(PetXMLInfo.getName(pet.id)) + "使用" + TextFormatUtil.getRedTxt(this.itemName) + "吗？",this.onsureHandler);
      }

      private function describe(pet:PetInfo,kind:String):String
      {
         if(kind == "dv")return String(pet.dv);
         if(kind == "nature")return NatureXMLInfo.getName(pet.nature);
         if(kind == "trait" && pet.effectList != null && pet.effectList.length > 0)
         {
            var id:uint = pet.effectList[0].itemId;
            if(id > 1005 && id <= 1045)return PetEffectXMLInfo.getEffect(id);
         }
         return "无特性";
      }

      private function beginSync(result:String):void
      {
         this.removeUseListeners();
         this.outcome = result;
         this.phase = "sync";
         this.stockReady = this.petReady = false;
         ItemManager.addEventListener(ItemEvent.PET_ITEM_LIST,this.onStockReady);
         PetManager.addEventListener(PetEvent.UPDATE_INFO,this.onPetReady);
         this.requestTimer = setTimeout(this.onRequestTimeout,8000);
         this.refreshStock();
         PetManager.upDate();
         this.renderRepeat();
      }

      private function refreshStock():void
      {
         if(owner != null && !owner.disposed && owner.petPropsPanel.visible)
            owner.dispatchEvent(new Event(SHOW_COLLECTION));
         else ItemManager.getPetItem();
      }

      private function onStockReady(event:ItemEvent):void
      {
         this.stockReady = true;
         this.finishSync();
      }

      private function onPetReady(event:PetEvent):void
      {
         this.petReady = true;
         this.finishSync();
      }

      private function finishSync():void
      {
         if(!this.stockReady || !this.petReady)return;
         var pet:PetInfo = PetManager.getPetInfo(this.requestPet);
         var kind:String = String(REROLL_TYPES[this.requestItem]);
         var label:String = kind == "dv" ? "个体" : kind == "nature" ? "性格" : "特性";
         if(this.repeatPet != this.requestPet || this.repeatItem != this.requestItem)
            this.lastResult = "上一瓶已处理，当前目标尚未使用。";
         else if(pet == null)this.lastResult = "目标已不在背包，请在仓库查看结果。";
         else if(this.outcome == "success")this.lastResult = label + " " + this.requestBefore + " → " + this.describe(pet,kind);
         else this.lastResult = (this.outcome == "unknown" ? "回包未确认；" : "未成功；") + label + " " + this.describe(pet,kind);
         if(this.outcome != "success")this.confirmedKey = "";
         this.releaseRequest();
         this.renderRepeat();
      }

      private function onUseError(event:SocketErrorEvent):void
      {
         if(busyOwner != this || event.headInfo == null || event.headInfo.cmdID != CommandID.USE_PET_ITEM_OUT_OF_FIGHT && event.headInfo.cmdID != CommandID.USE_PET_ITEM_FULL_ABILITY_OF_STUDY)return;
         if(this.phase == "using")this.beginSync("error");
         else if(this.phase == "legacy")
         {
            this.releaseRequest();
            PetManager.upDate();
            this.refreshStock();
         }
      }

      private function onRequestTimeout():void
      {
         if(this.phase == "using")this.beginSync("unknown");
         else if(this.phase == "legacy")
         {
            this.releaseRequest();
            PetManager.upDate();
            this.refreshStock();
         }
         else if(this.phase == "sync")
         {
            this.releaseRequest();
            this.phase = "sync-error";
            this.renderRepeat();
         }
      }

      private function removeUseListeners():void
      {
         clearTimeout(this.requestTimer);
         SocketConnection.removeCmdListener(CommandID.USE_PET_ITEM_FULL_ABILITY_OF_STUDY,this.onUpDate);
         SocketConnection.removeCmdListener(CommandID.USE_PET_ITEM_OUT_OF_FIGHT,this.onUpDate);
         if(this.errorDispatcher != null)this.errorDispatcher.removeEventListener(SocketErrorEvent.ERROR,this.onUseError);
         this.errorDispatcher = null;
      }

      private function releaseRequest():void
      {
         this.removeUseListeners();
         ItemManager.removeEventListener(ItemEvent.PET_ITEM_LIST,this.onStockReady);
         PetManager.removeEventListener(PetEvent.UPDATE_INFO,this.onPetReady);
         if(busyOwner == this)busyOwner = null;
         this.phase = "";
      }

      private function onVisualRemoved(event:Event):void
      {
         if(event.target == this._listCon)this.dispose();
      }

      private function dispose():void
      {
         if(this.disposed)return;
         this.disposed = true;
         this.confirmedKey = "";
         if(owner == this)owner = null;
         this.petPropsPanel["prev_btn"].removeEventListener(MouseEvent.CLICK,this.prevHandler);
         this.petPropsPanel["next_btn"].removeEventListener(MouseEvent.CLICK,this.nextHandler);
         this._listCon.removeEventListener(Event.REMOVED_FROM_STAGE,this.onVisualRemoved);
         this.clearItemPanel();
         DisplayUtil.removeForParent(this._listCon);
         if(this.repeatButton != null)this.repeatButton.removeEventListener(MouseEvent.CLICK,this.onRepeat);
         DisplayUtil.removeForParent(this.repeatPanel);
         dispatchEvent(new Event(Event.CLOSE));
         if(busyOwner != this)this.releaseRequest();
         ItemInfoTip.hide();
      }
   }
}

