package com.robot.groupFight.control.panel.ui.petItem.category
{
   import com.robot.core.CommandID;
   import com.robot.core.config.xml.ItemXMLInfo;
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.info.userItem.SingleItemInfo;
   import com.robot.core.manager.ItemManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.itemTip.ItemInfoTip;
   import com.robot.groupFight.data.FighterModelFactory;
   import com.robot.groupFight.data.FighterPetInfoFactory;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.filters.GlowFilter;
   import flash.text.TextField;
   import org.taomee.manager.EventManager;
   import org.taomee.manager.ResourceManager;
   import org.taomee.utils.DisplayUtil;
   
   public class PetItemItem extends Sprite implements IPetItem
   {
      
      protected var _itemMC:MovieClip;
      
      protected var _itemID:uint;
      
      protected var _txt:TextField;
      
      protected var _itemNum:uint;
      
      protected var glowFilter:GlowFilter = new GlowFilter(16777215,1,2,2,50,3);
      
      protected var icon:MovieClip;
      
      protected var _info:SingleItemInfo;
      
      public function PetItemItem()
      {
         super();
         this._itemMC = new ui_gp_itemBg();
         this._txt = this._itemMC["txt"];
         this._itemMC.mouseEnabled = false;
         this.addChild(this._itemMC);
      }
      
      public static function dispatchOnUsePetItem() : void
      {
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.ON_USE_PET_ITEM));
      }
      
      public function destroy() : void
      {
         if(Boolean(this._itemID))
         {
            ResourceManager.cancel(ItemXMLInfo.getIconURL(this._itemID),this.onLoadedIcon);
         }
         this.removeEvent();
         DisplayUtil.removeForParent(this._itemMC);
         this._itemMC = null;
         this._txt = null;
         ItemInfoTip.hide();
      }
      
      public function get info() : SingleItemInfo
      {
         return this._info;
      }
      
      public function set info(i:SingleItemInfo) : void
      {
         this._info = i;
         if(Boolean(this._info))
         {
            this._itemID = this._info.itemID;
            this._itemNum = this._info.itemNum;
            this._txt.text = this._itemNum.toString();
            ResourceManager.getResource(ItemXMLInfo.getIconURL(this._itemID),this.onLoadedIcon);
         }
         else
         {
            this._itemMC.buttonMode = false;
            this._itemMC.mouseEnabled = false;
            this._itemMC.mouseEnabled = false;
            DisplayUtil.removeForParent(this.icon);
         }
      }
      
      public function get sprite() : MovieClip
      {
         return this._itemMC;
      }
      
      public function get itemID() : uint
      {
         return this._itemID;
      }
      
      protected function onLoadedIcon(mc:MovieClip) : void
      {
         this.icon = mc;
         this._itemMC.addChildAt(this.icon,1);
         this._itemMC.mouseEnabled = true;
         this._itemMC.buttonMode = true;
         this.addEvent();
      }
      
      protected function useItem(event:MouseEvent) : void
      {
         var time:uint = uint(FighterModelFactory.playerMode.info.catchTime);
         var petInfo:PetInfo = FighterPetInfoFactory.gfUserInfo.monInfoMap.getValue(time);
         if(petInfo.hp == 0)
         {
            MainManager.getStage().addChild(Alarm.show("这只精灵已经死亡，请重新选择使用道具的精灵"));
            return;
         }
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.USE_PET_ITEM));
         SocketConnection.send(CommandID.GROUP_FT_USE_ITEM,time,this._itemID);
         --this._itemNum;
         this.refreshInfo();
      }
      
      protected function refreshInfo() : void
      {
         this._txt.text = this._itemNum.toString();
         if(this._itemNum == 0)
         {
            DisplayUtil.removeForParent(this.icon);
            this.removeEvent();
            if(Boolean(this._itemMC))
            {
               this._itemMC.mouseEnabled = false;
               this._itemMC.buttonMode = false;
            }
         }
      }
      
      private function addEvent() : void
      {
         this._itemMC.addEventListener(MouseEvent.CLICK,this.useItem);
         this._itemMC.addEventListener(MouseEvent.MOUSE_OVER,this.overHandler);
         this._itemMC.addEventListener(MouseEvent.MOUSE_OUT,this.outHandler);
      }
      
      private function removeEvent() : void
      {
         this._itemMC.removeEventListener(MouseEvent.CLICK,this.useItem);
         this._itemMC.removeEventListener(MouseEvent.MOUSE_OVER,this.overHandler);
         this._itemMC.removeEventListener(MouseEvent.MOUSE_OUT,this.outHandler);
         ItemInfoTip.hide();
      }
      
      private function overHandler(event:MouseEvent) : void
      {
         var info:SingleItemInfo = ItemManager.getCollectionInfo(this._itemID);
         ItemInfoTip.show(info,false,MainManager.getStage());
      }
      
      private function outHandler(event:MouseEvent) : void
      {
         ItemInfoTip.hide();
      }
   }
}

