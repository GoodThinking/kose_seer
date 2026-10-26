package com.robot.app.petbag.petPropsBag
{
   import com.robot.app.petbag.petPropsBag.ui.PetPropsPanel;
   import com.robot.core.config.xml.ItemXMLInfo;
   import com.robot.core.event.ItemEvent;
   import com.robot.core.manager.ItemManager;
   import flash.display.Sprite;
   import flash.events.Event;

   public class PetBagModel
   {
      private var view:PetPropsPanel;
      private var totalPage:uint=1;
      private var currentPage:uint=1;
      private const PET_NUM:uint=9;
      private var ids:Array=[];
      private var visibleIds:Array=[];

      public function PetBagModel(parent:Sprite)
      {
         view=parent as PetPropsPanel;
         currentPage=view.rememberedPage;
         addEvent();onShowCollection();
      }
      public function addEvent():void
      {
         view.addEventListener(Event.CLOSE,onPanelClose);
         view.addEventListener(PetPropsPanel.NEXT_PAGE,nextHandler);
         view.addEventListener(PetPropsPanel.PREV_PAGE,prevHandler);
         view.addEventListener(PetPropsPanel.SHOW_COLLECTION,onShowCollection);
         view.addEventListener(PetPropsPanel.FILTER_CHANGED,onFilter);
      }
      public function removeEvent():void
      {
         view.removeEventListener(Event.CLOSE,onPanelClose);
         view.removeEventListener(PetPropsPanel.NEXT_PAGE,nextHandler);
         view.removeEventListener(PetPropsPanel.PREV_PAGE,prevHandler);
         view.removeEventListener(PetPropsPanel.SHOW_COLLECTION,onShowCollection);
         view.removeEventListener(PetPropsPanel.FILTER_CHANGED,onFilter);
      }
      private function onPanelClose(event:Event):void { clear();removeEvent(); }
      public function clear():void { ItemManager.removeEventListener(ItemEvent.PET_ITEM_LIST,onPetItemList); }
      private function onShowCollection(event:Event=null):void
      {
         ItemManager.removeEventListener(ItemEvent.PET_ITEM_LIST,onPetItemList);
         ItemManager.addEventListener(ItemEvent.PET_ITEM_LIST,onPetItemList);
         ItemManager.getPetItem();
      }
      private function onPetItemList(event:ItemEvent):void
      {
         ItemManager.removeEventListener(ItemEvent.PET_ITEM_LIST,onPetItemList);
         var next:Array=ItemManager.getPetItemIDs();
         var unchanged:Boolean=next.length==ids.length;
         for(var i:int=0;unchanged&&i<next.length;i++)unchanged=next[i]==ids[i];
         ids=next;
         if(unchanged)showPage();else rebuild();
      }
      private function onFilter(event:Event):void { currentPage=view.rememberedPage;rebuild(); }
      private function rebuild():void
      {
         visibleIds=[];
         for each(var id:uint in ids)if(ItemXMLInfo.getIsShowInPetBag(id)&&view.matchesItem(id))visibleIds.push(id);
         visibleIds.sort(function(a:uint,b:uint):Number{
            var af:Boolean=view.favorites.indexOf(a)>=0;var bf:Boolean=view.favorites.indexOf(b)>=0;
            return af==bf?a-b:af?-1:1;
         });
         totalPage=Math.max(1,Math.ceil(visibleIds.length/PET_NUM));
         currentPage=Math.min(Math.max(1,currentPage),totalPage);showPage();
      }
      private function showPage():void
      {
         view.rememberedPage=currentPage;
         view.setPageNum(currentPage,totalPage);
         view.showItem(visibleIds.slice((currentPage-1)*PET_NUM,currentPage*PET_NUM));
      }
      private function prevHandler(event:Event):void { if(currentPage>1){currentPage--;showPage();} }
      private function nextHandler(event:Event):void { if(currentPage<totalPage){currentPage++;showPage();} }
   }
}
