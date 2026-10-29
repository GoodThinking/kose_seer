package com.robot.groupFight.control.panel.ui.fightPanel
{
   import com.robot.core.event.ItemEvent;
   import com.robot.core.info.userItem.SingleItemInfo;
   import com.robot.core.manager.ItemManager;
   import com.robot.core.uic.UIScrollBar;
   import com.robot.groupFight.control.panel.ui.petItem.category.PetItemItem;
   import flash.events.MouseEvent;
   
   public class FightItemPanel extends BaseControlPanel
   {
      
      private var _infoArr:Array;
      
      private var _scrollMc:UIScrollBar;
      
      private var _itemArr:Array = [];
      
      private const MAX:uint = 10;
      
      private var _itemA:Array = [[300011,300019]];
      
      public function FightItemPanel()
      {
         super();
         _panel = new ui_gp_ItemPanel();
         this.createItem();
      }
      
      override public function destroy() : void
      {
         super.destroy();
         this.clear();
      }
      
      public function clear() : void
      {
         var item:PetItemItem = null;
         ItemManager.removeEventListener(ItemEvent.COLLECTION_LIST,this.onList);
         for each(item in this._itemArr)
         {
            if(Boolean(item))
            {
               item.destroy();
               item = null;
            }
         }
         this._itemArr = [];
      }
      
      public function updateItem() : void
      {
         ItemManager.addEventListener(ItemEvent.COLLECTION_LIST,this.onList);
         ItemManager.getCollection();
      }
      
      private function onList(evt:ItemEvent) : void
      {
         var info:SingleItemInfo = null;
         this._infoArr = [];
         for each(info in ItemManager.getCollectionInfos())
         {
            if(info.itemID >= 300011 && info.itemID <= 300019)
            {
               this._infoArr.push(info);
            }
         }
         this.showPetItem(this._infoArr);
         if(this._infoArr.length > this.MAX)
         {
            this.showScroll();
         }
         else if(Boolean(this._scrollMc))
         {
            this._scrollMc.totalLength = 0;
         }
      }
      
      private function createItem() : void
      {
         var petItem:PetItemItem = null;
         for(var i:int = 0; i < 10; i++)
         {
            petItem = new PetItemItem();
            petItem.x = 50 + 56 * (i % 5);
            petItem.y = 20 + 50 * Math.floor(i / 5);
            petItem.name = "petItem_" + i;
            _panel.addChild(petItem);
            this._itemArr.push(petItem);
         }
      }
      
      private function showPetItem(array:Array) : void
      {
         var name:String = null;
         var petItem:PetItemItem = null;
         for(var i:int = 0; i < array.length; i++)
         {
            name = "petItem_" + i;
            petItem = _panel.getChildByName(name) as PetItemItem;
            if(Boolean(petItem))
            {
               petItem.info = array[i] as SingleItemInfo;
            }
         }
      }
      
      private function showScroll() : void
      {
         if(!this._scrollMc)
         {
            this._scrollMc = new UIScrollBar(_panel["barBall"],_panel["barBg"],this.MAX,_panel["upBtn"],_panel["downBtn"]);
         }
         this._scrollMc.wheelObject = _panel;
         this._scrollMc.totalLength = this._infoArr.length;
         this._scrollMc.addEventListener(MouseEvent.MOUSE_MOVE,this.onScrollMove);
      }
      
      private function onScrollMove(e:MouseEvent) : void
      {
         var index:uint = uint(this._scrollMc.index);
         var a:Array = this._infoArr.slice(this._scrollMc.index * this.MAX,(this._infoArr.index + 1) * this.MAX);
         this.showPetItem(a);
      }
   }
}

