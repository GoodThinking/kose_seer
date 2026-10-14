package com.robot.petFightModule.ui.controlPanel.petItem.category
{
   import com.robot.core.CommandID;
   import com.robot.core.manager.ItemManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.petFightModule.PetFightEntry;
   import com.robot.petFightModule.control.FighterModeFactory;
   import com.robot.petFightModule.mode.BaseFighterMode;
   import com.robot.petFightModule.mode.PlayerMode;
   import com.robot.petFightModule.TimerManager;
   import com.robot.petFightModule.view.BaseFighterPetWin;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import org.taomee.effect.ColorFilter;
   import org.taomee.events.SocketErrorEvent;
   import org.taomee.events.SocketEvent;
   import org.taomee.net.SocketDispatcher;

   public class CatchPetItemCategory extends AbstractPetItemCategory implements IPetItemCategory
   {
      private var catchPending:Boolean = false;

      public function CatchPetItemCategory(param1:uint)
      {
         super(param1);
         var _loc2_:BaseFighterMode = FighterModeFactory.enemyMode;
         if(!_loc2_.catchable)
         {
            _sprite.filters = [ColorFilter.setGrayscale()];
            _sprite.mouseEnabled = false;
            _sprite.mouseChildren = false;
         }
      }

      override protected function useItem(param1:MouseEvent) : void
      {
         if(this.catchPending)
         {
            return;
         }
         super.useItem(param1);
         BaseFighterPetWin.itemID = _itemID;
         this.catchPending = true;
         SocketConnection.addCmdListener(CommandID.CATCH_MONSTER,this.onCatchResponse,false,1);
         SocketDispatcher.getInstance().addEventListener(SocketErrorEvent.ERROR,this.onCatchRejected,false,2);
         SocketConnection.send(CommandID.CATCH_MONSTER,_itemID);
      }

      private function consumeDisplayedCapsule() : void
      {
         --_itemNum;
         --ItemManager.getCollectionInfo(_itemID).itemNum;
         refreshInfo();
      }

      private function onCatchResponse(param1:SocketEvent) : void
      {
         this.clearCatchListeners();
         this.consumeDisplayedCapsule();
      }

      private function onCatchRejected(param1:SocketErrorEvent) : void
      {
         if(!this.catchPending || !param1.headInfo || param1.headInfo.cmdID != CommandID.CATCH_MONSTER)
         {
            return;
         }
         param1.stopImmediatePropagation();
         this.clearCatchListeners();
         if(param1.headInfo.result == 5003)
         {
            this.consumeDisplayedCapsule();
         }
         PlayerMode(FighterModeFactory.playerMode).nextRound();
         var message:TextField = PetFightEntry.fighterCon.mainPanel["msgMC"]["msg_txt"];
         if(param1.headInfo.result == 5001)
         {
            message.htmlText += "<font color='#ffff00'>当前无法捕捉，胶囊未消耗。请先削弱目标并检查库存。</font>\r";
         }
         else
         {
            message.htmlText += "<font color='#ffff00'>捕捉没有完成，请检查目标状态。</font>\r";
         }
         message.scrollV = message.maxScrollV;
         TimerManager.start();
      }

      private function clearCatchListeners() : void
      {
         this.catchPending = false;
         SocketConnection.removeCmdListener(CommandID.CATCH_MONSTER,this.onCatchResponse);
         SocketDispatcher.getInstance().removeEventListener(SocketErrorEvent.ERROR,this.onCatchRejected);
      }

      override public function destroy() : void
      {
         this.clearCatchListeners();
         super.destroy();
      }
   }
}
