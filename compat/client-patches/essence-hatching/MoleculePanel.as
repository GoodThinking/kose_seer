package com.robot.module.app
{
   import com.robot.core.CommandID;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.ItemXMLInfo;
   import com.robot.core.info.userItem.SingleItemInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.uic.UIProPageBar;
   import flash.display.DisplayObject;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import flash.utils.ByteArray;
   import org.taomee.events.DynamicEvent;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.DepthManager;
   import org.taomee.manager.ResourceManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;

   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class MoleculePanel extends Sprite implements IModule
   {

      private var _proBar:UIProPageBar;

      private var _dragBtn:SimpleButton;

      private var _closeBtn:SimpleButton;

      private var _mleList:Array;

      private var _nameTxt:TextField;

      private var _needA:Array = [];

      private var _applyBtn:SimpleButton;

      private var _mainUI:Sprite;

      private var _currUI:Sprite;

      private var _currID:uint;

      public function MoleculePanel()
      {
         super();
      }

      public function hide() : void
      {
         ResourceManager.cancel(ClientConfig.getResPath("item/doodle/icon/" + this._currID.toString() + ".swf"),this.onResLoad);
         this._currID = 0;
         if(this._currUI)
         {
            DisplayUtil.removeForParent(this._currUI);
            this._currUI = null;
         }
         this.removeEvent();
         DisplayUtil.removeForParent(this._mainUI);
      }

      private function onResLoad(param1:DisplayObject) : void
      {
         this._currUI = param1 as Sprite;
         this._currUI.x = 120;
         this._currUI.y = 120;
         this._mainUI.addChild(this._currUI);
      }

      private function check(param1:uint) : Boolean
      {
         return this._needA.indexOf(param1) != -1;
      }

      private function onApply(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         if(this._currID == 0)
         {
            return;
         }
         SocketConnection.addCmdListener(CommandID.PET_HATCH,function(param1:SocketEvent):void
         {
            SocketConnection.removeCmdListener(CommandID.PET_HATCH,arguments.callee);
            Alarm.show("精元开始孵化，" + Math.ceil((param1.data as ByteArray).readUnsignedInt() / 60) + "分钟后可以领取精灵");
            hide();
         });
         SocketConnection.send(CommandID.PET_HATCH,this._currID);
      }

      public function init(param1:Object = null) : void
      {
      }

      public function setup() : void
      {
         this._mainUI = new UI_MoleculePanel();
         this._closeBtn = this._mainUI["closeBtn"];
         this._dragBtn = this._mainUI["dragBtn"];
         this._applyBtn = this._mainUI["applyBtn"];
         this._nameTxt = this._mainUI["nameTxt"];
         this._proBar = new UIProPageBar(this._mainUI["preBtn"],this._mainUI["nextBtn"],1);
      }

      private function onCollectionList(param1:SocketEvent) : void
      {
         var _loc2_:SingleItemInfo = null;
         var _loc3_:int = 0;
         SocketConnection.removeCmdListener(CommandID.ITEM_LIST,this.onCollectionList);
         var _loc4_:ByteArray = param1.data as ByteArray;
         var _loc5_:uint = _loc4_.readUnsignedInt();
         var _loc6_:int = 0;
         while(_loc6_ < _loc5_)
         {
            _loc2_ = new SingleItemInfo(_loc4_);
            if(this.check(_loc2_.itemID))
            {
               _loc3_ = 0;
               while(_loc3_ < _loc2_.itemNum)
               {
                  this._mleList.push(_loc2_.itemID);
                  _loc3_++;
               }
            }
            _loc6_++;
         }
         this._proBar.totalLength = this._mleList.length;
         if(this._mleList.length == 0)
         {
            return;
         }
         this._currID = this._mleList[0];
         if(this._currID == 0)
         {
            return;
         }
         this._nameTxt.text = ItemXMLInfo.getName(this._currID);
         ResourceManager.getResource(ClientConfig.getResPath("item/doodle/icon/" + this._currID.toString() + ".swf"),this.onResLoad);
      }

      private function onClose(param1:MouseEvent) : void
      {
         this.hide();
      }

      private function onClick(param1:DynamicEvent) : void
      {
         if(this._currID != 0)
         {
            ResourceManager.cancel(ClientConfig.getResPath("item/doodle/icon/" + this._currID.toString() + ".swf"),this.onResLoad);
         }
         if(this._currUI)
         {
            DisplayUtil.removeForParent(this._currUI);
            this._currUI = null;
         }
         this._currID = this._mleList[param1.paramObject as int];
         if(this._currID != 0)
         {
            this._nameTxt.text = ItemXMLInfo.getName(this._currID);
            ResourceManager.getResource(ClientConfig.getResPath("item/doodle/icon/" + this._currID.toString() + ".swf"),this.onResLoad);
         }
      }

      private function onDragUp(param1:MouseEvent) : void
      {
         this._mainUI.stopDrag();
      }

      private function onDragDown(param1:MouseEvent) : void
      {
         DepthManager.bringToTop(this._mainUI);
         this._mainUI.startDrag();
      }

      private function removeEvent() : void
      {
         this._closeBtn.removeEventListener(MouseEvent.CLICK,this.onClose);
         this._dragBtn.removeEventListener(MouseEvent.MOUSE_DOWN,this.onDragDown);
         this._dragBtn.removeEventListener(MouseEvent.MOUSE_UP,this.onDragUp);
         this._proBar.removeEventListener(MouseEvent.CLICK,this.onClick);
         this._applyBtn.removeEventListener(MouseEvent.CLICK,this.onApply);
         SocketConnection.removeCmdListener(CommandID.ITEM_LIST,this.onCollectionList);
      }

      private function addEvent() : void
      {
         this._closeBtn.addEventListener(MouseEvent.CLICK,this.onClose);
         this._dragBtn.addEventListener(MouseEvent.MOUSE_DOWN,this.onDragDown);
         this._dragBtn.addEventListener(MouseEvent.MOUSE_UP,this.onDragUp);
         this._proBar.addEventListener(MouseEvent.CLICK,this.onClick);
         this._applyBtn.addEventListener(MouseEvent.CLICK,this.onApply);
      }

      public function destroy() : void
      {
         this.hide();
         this._mleList = null;
         this._proBar.destroy();
         this._proBar = null;
         this._closeBtn = null;
         this._dragBtn = null;
         this._mainUI = null;
         this._currUI = null;
      }

      public function show() : void
      {
         if(DisplayUtil.hasParent(this._mainUI))
         {
            return;
         }
         LevelManager.appLevel.addChild(this._mainUI);
         DisplayUtil.align(this._mainUI,null,AlignType.MIDDLE_CENTER);
         this.addEvent();
         this._mleList = [];
         this._currID = 0;
         this._nameTxt.text = "暂无可孵化的精元";
         if(this._proBar.index > 0)
         {
            this._proBar.index = 0;
         }
         SocketConnection.addCmdListener(CommandID.ITEM_LIST,this.onCollectionList);
         SocketConnection.send(CommandID.ITEM_LIST,this._needA[0],this._needA[this._needA.length - 1],2);
      }
   }
}
