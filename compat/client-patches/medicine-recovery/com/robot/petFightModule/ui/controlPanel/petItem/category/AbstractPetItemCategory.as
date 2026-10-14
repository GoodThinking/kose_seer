package com.robot.petFightModule.ui.controlPanel.petItem.category
{
   import com.robot.core.CommandID;
   import com.robot.core.event.ItemEvent;
   import com.robot.core.config.xml.ItemXMLInfo;
   import com.robot.core.info.fightInfo.UsePetItemInfo;
   import com.robot.core.net.SocketConnection;
   import com.robot.petFightModule.PetFightEntry;
   import com.robot.petFightModule.TimerManager;
   import com.robot.petFightModule.control.FighterModeFactory;
   import com.robot.petFightModule.mode.PlayerMode;
   import org.taomee.events.SocketErrorEvent;
   import org.taomee.events.SocketEvent;
   import org.taomee.net.SocketDispatcher;
   import flash.events.Event;
   import com.robot.core.event.PetFightEvent;
   import com.robot.core.info.userItem.SingleItemInfo;
   import com.robot.core.manager.ItemManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.ui.itemTip.ItemInfoTip;
   import flash.display.Loader;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.filters.GlowFilter;
   import flash.net.URLRequest;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.text.TextFormatAlign;
   import org.taomee.manager.EventManager;
   import org.taomee.utils.DisplayUtil;

   public class AbstractPetItemCategory implements IPetItemCategory
   {

      protected var glowFilter:GlowFilter = new GlowFilter(16777215,1,2,2,50,3);

      protected var _sprite:Sprite;

      protected var _itemID:uint;

      protected var _txt:TextField;

      private var tf:TextFormat;

      protected var _itemNum:uint;

      private static var activeMedicine:AbstractPetItemCategory;

      private var medicinePending:Boolean = false;

      private var medicineReadback:Boolean = false;

      public function AbstractPetItemCategory(param1:uint)
      {
         super();
         this._itemID = param1;
         this.tf = new TextFormat();
         this.tf.size = 12;
         this.tf.color = 16777215;
         this.tf.align = TextFormatAlign.CENTER;
         this._sprite = new Sprite();
         this._sprite.graphics.beginFill(0,0);
         this._sprite.graphics.drawRect(0,0,50,50);
         this._sprite.mouseChildren = false;
         this._sprite.buttonMode = true;
         this._txt = new TextField();
         this._txt.name = "numTxt";
         this._txt.width = 28;
         this._txt.height = 20;
         this._txt.filters = [this.glowFilter];
         this._txt.x = 38;
         this._txt.y = 30;
         this._txt.setTextFormat(this.tf);
         this._itemNum = ItemManager.getCollectionInfo(this._itemID).itemNum;
         this._txt.text = this._itemNum.toString();
         this._sprite.addChild(this._txt);
         this._sprite.addEventListener(MouseEvent.CLICK,this.useItem);
         this._sprite.addEventListener(MouseEvent.MOUSE_OVER,this.overHandler);
         this._sprite.addEventListener(MouseEvent.MOUSE_OUT,this.outHandler);
         var _loc2_:Loader = new Loader();
         _loc2_.load(new URLRequest(ItemXMLInfo.getIconURL(this._itemID)));
         this._sprite.addChild(_loc2_);
      }

      public static function dispatchOnUsePetItem() : void
      {
         EventManager.dispatchEvent(new PetFightEvent(PetFightEvent.ON_USE_PET_ITEM));
      }

      protected function useItem(param1:MouseEvent) : void
      {
         EventManager.dispatchEvent(new PetFightEvent(PetFightEvent.USE_PET_ITEM));
      }

      protected function beginMedicineUse() : Boolean
      {
         if(activeMedicine != null)
         {
            return false;
         }
         activeMedicine = this;
         this.medicinePending = true;
         SocketConnection.addCmdListener(CommandID.USE_PET_ITEM,this.onMedicineResponse,false,1);
         SocketDispatcher.getInstance().addEventListener(SocketErrorEvent.ERROR,this.onMedicineRejected,false,2);
         return true;
      }

      private function onMedicineResponse(param1:SocketEvent) : void
      {
         var info:UsePetItemInfo = param1.data as UsePetItemInfo;
         if(!this.medicinePending || !info || info.userID != MainManager.actorID || info.itemID != this._itemID)
         {
            return;
         }
         this.medicinePending = false;
         SocketConnection.removeCmdListener(CommandID.USE_PET_ITEM,this.onMedicineResponse);
         SocketDispatcher.getInstance().removeEventListener(SocketErrorEvent.ERROR,this.onMedicineRejected);
         EventManager.addEventListener(PetFightEvent.ON_USE_PET_ITEM,this.onMedicineAnimationOver,false,-1);
         --_itemNum;
         --ItemManager.getCollectionInfo(_itemID).itemNum;
         refreshInfo();
      }

      private function onMedicineAnimationOver(param1:PetFightEvent) : void
      {
         this.clearMedicineListeners();
      }

      private function onMedicineRejected(param1:SocketErrorEvent) : void
      {
         if(!param1.headInfo)
         {
            return;
         }
         if(this.medicineReadback && param1.headInfo.cmdID == CommandID.ITEM_LIST)
         {
            param1.stopImmediatePropagation();
            this.finishMedicineRejection(false);
            return;
         }
         if(!this.medicinePending || param1.headInfo.cmdID != CommandID.USE_PET_ITEM)
         {
            return;
         }
         param1.stopImmediatePropagation();
         this.medicinePending = false;
         SocketConnection.removeCmdListener(CommandID.USE_PET_ITEM,this.onMedicineResponse);
         this.medicineReadback = true;
         ItemManager.addEventListener(ItemEvent.COLLECTION_LIST,this.onMedicineInventory,false,-1);
         ItemManager.getCollection();
      }

      private function onMedicineInventory(param1:Event) : void
      {
         if(this.medicineReadback)
         {
            this.finishMedicineRejection(true);
         }
      }

      private function finishMedicineRejection(synchronized:Boolean) : void
      {
         this.clearMedicineListeners();
         PlayerMode(FighterModeFactory.playerMode).nextRound();
         var message:TextField = PetFightEntry.fighterCon.mainPanel["msgMC"]["msg_txt"];
         if(synchronized)
         {
            message.htmlText += "<font color='#ffff00'>药剂使用未完成，请检查目标和当前库存后继续。</font><br>";
         }
         else
         {
            message.htmlText += "<font color='#ffff00'>药剂使用未完成，库存暂时无法校准，请重新进入战斗核对。</font><br>";
         }
         message.scrollV = message.maxScrollV;
         TimerManager.start();
      }

      private function clearMedicineListeners() : void
      {
         this.medicinePending = false;
         this.medicineReadback = false;
         if(activeMedicine == this)
         {
            activeMedicine = null;
         }
         SocketConnection.removeCmdListener(CommandID.USE_PET_ITEM,this.onMedicineResponse);
         SocketDispatcher.getInstance().removeEventListener(SocketErrorEvent.ERROR,this.onMedicineRejected);
         ItemManager.removeEventListener(ItemEvent.COLLECTION_LIST,this.onMedicineInventory);
         EventManager.removeEventListener(PetFightEvent.ON_USE_PET_ITEM,this.onMedicineAnimationOver);
      }

      private function outHandler(param1:MouseEvent) : void
      {
         ItemInfoTip.hide();
      }

      protected function refreshInfo() : void
      {
         this._txt.text = this._itemNum.toString();
         if(this._itemNum == 0)
         {
            DisplayUtil.removeForParent(this._sprite);
         }
      }

      public function get sprite() : Sprite
      {
         return this._sprite;
      }

      public function get itemID() : uint
      {
         return this._itemID;
      }

      private function overHandler(param1:MouseEvent) : void
      {
         var _loc2_:SingleItemInfo = ItemManager.getCollectionInfo(this._itemID);
         ItemInfoTip.show(_loc2_,false,MainManager.getStage());
      }

      public function destroy() : void
      {
         this.clearMedicineListeners();
         DisplayUtil.removeForParent(this._sprite);
         this._sprite.removeEventListener(MouseEvent.CLICK,this.useItem);
         this._sprite.removeEventListener(MouseEvent.MOUSE_OVER,this.overHandler);
         this._sprite.removeEventListener(MouseEvent.MOUSE_OUT,this.outHandler);
         this._sprite = null;
         this._txt = null;
      }
   }
}
