package com.robot.module.app
{
   import com.robot.app.sceneInteraction.RoomPetManager;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.event.PetEvent;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.info.pet.PetListInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.mode.AppModel;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.alert.Alert;
   import com.robot.core.ui.alert.PetInBagAlert;
   import com.robot.core.uic.UIPageBar;
   import com.robot.core.utils.TextFormatUtil;
   import com.robot.module.app.petStorage.InfoTxtPanel;
   import com.robot.module.app.petStorage.PetListItem;
   import com.robot.module.app.petStorage.TypeBtnPanel;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import flash.text.TextFieldType;
   import flash.text.TextFormat;
   import org.taomee.events.DynamicEvent;
   import org.taomee.manager.DepthManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(width="500", height="500", backgroundColor="#869ca7", frameRate="24")]
   public class PetStorage extends Sprite implements IModule
   {
      
      private static const MAX_LIST:int = 9;
      
      private var _data:Array;
      
      private var _inBagBtn:SimpleButton;
      
      private var _type:int = 1;
      
      private var _closeBtn:SimpleButton;
      
      private var _petStoryBtn:SimpleButton;
      
      private var _mainUI:Sprite;
      
      private var _statusNum:int;
      
      private var _petSwitchPanel:AppModel;
      
      private var _showPetBtn:SimpleButton;
      
      private var _hidePetBtn:SimpleButton;
      
      private var _countTxt:TextField;
      
      private var _getBtn:SimpleButton;
      
      private var _dragBtn:SimpleButton;
      
      private var _listCon:Sprite;
      
      private var _outBtn:SimpleButton;
      
      private var _pageBar:UIPageBar;
      
      private var _selectItem:PetListItem;
      
      private var _roweiBtn:SimpleButton;
      
      private var _typePanel:TypeBtnPanel;
      
      private var _infoPanel:InfoTxtPanel;
      
      private var _showAllPetBtn:SimpleButton;
      
      private var showAllFlag:Boolean = false;
      private static var _views:Object = {};
      private var _search:TextField;
      private var _rememberedPage:uint = 0;
      private var _selectedCatchTime:uint = 0;
      
      public function PetStorage()
      {
         super();
      }
      
      private function onInBagSuccessHandler(param1:PetEvent) : void
      {
         PetManager.removeEventListener(PetEvent.ADDED,this.onInBagSuccessHandler);
         this._inBagBtn.mouseEnabled = true;
         var _loc2_:PetListInfo = new PetListInfo();
         _loc2_.catchTime = param1.catchTime();
         _loc2_.id = 0;
         RoomPetManager.getInstance().showOrHide(_loc2_,false);
      }
      
      private function onRoweiSuccessHandler(param1:PetEvent) : void
      {
         Alarm.show("    " + TextFormatUtil.getRedTxt(PetXMLInfo.getName(this._infoPanel.info.id)) + " 已回归到正常的野外生活啦！");
         PetManager.removeEventListener(PetEvent.ROWEI_PET,this.onRoweiSuccessHandler);
         this.setBtnVisible(false,false);
         this.reItem();
         this._countTxt.text = PetManager.getStorage().length.toString();
         var _loc2_:PetListInfo = new PetListInfo();
         _loc2_.catchTime = this._infoPanel.info.catchTime;
         _loc2_.id = this._infoPanel.info.id;
         RoomPetManager.getInstance().showOrHide(_loc2_,false);
      }
      
      private function clearItem() : void
      {
         var _loc1_:PetListItem = null;
         this._selectItem = null;
         var _loc2_:int = 0;
         while(_loc2_ < MAX_LIST)
         {
            _loc1_ = this._listCon.getChildAt(_loc2_) as PetListItem;
            _loc1_.mouseEnabled = false;
            _loc1_.removeEventListener(MouseEvent.CLICK,this.onItemClick);
            _loc1_.clear();
            _loc1_.select = false;
            _loc2_++;
         }
      }
      
      private function onInBag(param1:MouseEvent) : void
      {
         if(!this._selectItem)
         {
            return;
         }
         if(this._selectItem.info.course > 0)
         {
            Alarm.show("该精灵正在训练中不可以放入背包。");
            return;
         }
         if(PetManager.length >= 6)
         {
            if(this._petSwitchPanel == null)
            {
               this._petSwitchPanel = ModuleManager.getModule(ClientConfig.getAppModule("PetSwitchPanel"),"正在打开精灵切换面板...");
               this._petSwitchPanel.setup();
            }
            this._petSwitchPanel.init(this._selectItem.info);
            this._petSwitchPanel.show();
         }
         else
         {
            this._inBagBtn.mouseEnabled = false;
            PetManager.addEventListener(PetEvent.ADDED,this.onInBagSuccessHandler);
            PetManager.storageToInBag(this._selectItem.info.catchTime);
            PetInBagAlert.show(this._selectItem.info.id,TextFormatUtil.getRedTxt(PetXMLInfo.getName(this._selectItem.info.id)) + "已经放入了你的精灵背包。");
         }
      }
      
      private function onListInfo(param1:PetEvent) : void
      {
         if(MapManager.currentMap.id == MainManager.actorID)
         {
            RoomPetManager.getInstance().addEventListener(PetEvent.ROOM_PET_LIST,this.onPetShowList);
            RoomPetManager.getInstance().getShowList(MainManager.actorInfo.mapID);
         }
         else this.reItem();
      }
      
      private function onPage(param1:DynamicEvent) : void
      {
         var _loc2_:PetListItem = null;
         this.clearItem();
         var _loc3_:uint = param1.paramObject as uint;
         var _loc4_:int = Math.min(this._data.length - _loc3_ * MAX_LIST,MAX_LIST);
         var _loc5_:int = 0;
         while(_loc5_ < _loc4_)
         {
            _loc2_ = this._listCon.getChildAt(_loc5_) as PetListItem;
            _loc2_.info = this._data[_loc5_ + _loc3_ * MAX_LIST];
            _loc2_.addEventListener(MouseEvent.CLICK,this.onItemClick);
            _loc2_.mouseEnabled = true;
            _loc5_++;
         }
         this._rememberedPage = _loc3_;
         if(_loc4_ > 0) this.setSelectItem();
      }
      
      private function onGetPetSuccessHandler(param1:PetEvent) : void
      {
         Alarm.show("    你领回了你的精灵 " + TextFormatUtil.getRedTxt(PetXMLInfo.getName(this._infoPanel.info.id)) + "，它显得非常高兴。");
         PetManager.removeEventListener(PetEvent.RETRIEVE_PET,this.onGetPetSuccessHandler);
         this.setBtnVisible(false,false);
         this.reItem();
         this._countTxt.text = PetManager.roweiPetLength.toString();
      }
      
      public function setup() : void
      {
         var i:int = 0;
         var item:PetListItem = null;
         this._mainUI = new UI_PetStorage();
         var saved:Object = _views[MainManager.actorID];
         if(saved != null)
         {
            this._type = saved.type;
            this.showAllFlag = saved.all;
            this._rememberedPage = saved.page;
            this._selectedCatchTime = saved.selected;
         }
         this._search = new TextField();
         this._search.type = TextFieldType.INPUT;
         this._search.defaultTextFormat = new TextFormat(this._mainUI["countTxt"].defaultTextFormat.font,12,0x163C50);
         this._search.border = true;
         this._search.borderColor = 0x5091A5;
         this._search.background = true;
         this._search.backgroundColor = 0xE6F7FA;
         this._search.x = 190;
         this._search.y = 5;
         this._search.width = 210;
         this._search.height = 21;
         this._search.maxChars = 30;
         this._search.text = saved == null ? "" : saved.query;
         if(saved != null) this._search.scrollH = saved.scroll;
         this._mainUI.addChild(this._search);
         var searchLabel:TextField = new TextField();
         searchLabel.defaultTextFormat = new TextFormat(this._mainUI["countTxt"].defaultTextFormat.font,11,0xFFFFFF);
         searchLabel.text = "名称 / 编号";
         searchLabel.x = 405;
         searchLabel.y = 6;
         searchLabel.width = 75;
         searchLabel.height = 20;
         searchLabel.mouseEnabled = false;
         this._mainUI.addChild(searchLabel);
         this._closeBtn = this._mainUI["closeBtn"];
         this._dragBtn = this._mainUI["dragBtn"];
         this._countTxt = this._mainUI["countTxt"];
         this._inBagBtn = this._mainUI["inBagBtn"];
         this._getBtn = this._mainUI["getBtn"];
         this._outBtn = this._mainUI["outBtn"];
         this._petStoryBtn = this._mainUI["petStoryBtn"];
         this._roweiBtn = this._mainUI["roweiBtn"];
         this._showPetBtn = this._mainUI["showPetBtn"];
         this._hidePetBtn = this._mainUI["hidePetBtn"];
         this._showAllPetBtn = this._mainUI["allBtn"];
         this._showAllPetBtn.visible = true;
         this._showAllPetBtn.addEventListener(MouseEvent.CLICK,function():void
         {
            showAllFlag = true;
            _rememberedPage = 0;
            reItem();
         });
         this.setShowHideBtn(false,false);
         this._countTxt.text = "";
         this.setBtnVisible(false,false);
         this._statusNum = 0;
         this._petStoryBtn.visible = false;
         this._typePanel = new TypeBtnPanel(this._mainUI["typeMc"],this._type);
         this._infoPanel = new InfoTxtPanel(this._mainUI["infoMc"]);
         this._listCon = new Sprite();
         this._listCon.x = 190;
         this._listCon.y = 55;
         this._mainUI.addChild(this._listCon);
         i = 0;
         while(i < MAX_LIST)
         {
            item = new PetListItem();
            item.x = item.width * int(i % 3);
            item.y = item.height * int(i / 3);
            this._listCon.addChild(item);
            i++;
         }
         this._pageBar = new UIPageBar(this._mainUI["preBtn"],this._mainUI["nextBtn"],this._mainUI["pageTxt"],MAX_LIST);
      }
      
      private function onItemClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         this.setShowHideBtn(false,false);
         this._selectItem.select = false;
         this._selectItem = e.target as PetListItem;
         this._selectItem.select = true;
         this._selectedCatchTime = this._selectItem.info.catchTime;
         PetManager.storageUpDate(this._selectItem.info.catchTime,function(param1:PetInfo):void
         {
            _infoPanel.info = param1;
            if(_statusNum == 0)
            {
               if(RoomPetManager.getInstance().contains(param1.catchTime))
               {
                  setShowHideBtn(false,true);
               }
               else
               {
                  setShowHideBtn(true,false);
               }
            }
         });
      }
      
      public function init(param1:Object = null) : void
      {
      }
      
      private function onShowPet(param1:MouseEvent) : void
      {
         if(MapManager.currentMap.id != MainManager.actorID)
         {
            Alarm.show("你不在你的基地中,不可以展示精灵哦!");
            return;
         }
         if(this._selectItem)
         {
            if(this._selectItem.info.course > 0)
            {
               Alarm.show("该精灵在训练中不可以展示。");
               return;
            }
            RoomPetManager.getInstance().showOrHide(this._selectItem.info,true);
         }
      }
      
      private function onHidePet(param1:MouseEvent) : void
      {
         if(this._selectItem)
         {
            RoomPetManager.getInstance().showOrHide(this._selectItem.info,false);
         }
      }
      
      private function onPetShowList(param1:Event) : void
      {
         RoomPetManager.getInstance().removeEventListener(PetEvent.ROOM_PET_LIST,this.onPetShowList);
         this.reItem();
      }
      
      private function onDragUp(param1:MouseEvent) : void
      {
         this._mainUI.stopDrag();
      }
      
      private function onOutClickHandler(param1:MouseEvent) : void
      {
         if(this._selectItem)
         {
            if(this._selectItem.info.course > 0)
            {
               Alarm.show("该精灵在模拟训练中不可以放生。");
               return;
            }
         }
         this.Confirm();
      }
      
      private function Confirm() : void
      {
         var self:PetStorage = null;
         self = this;
         Alert.show("确认要放生" + TextFormatUtil.getRedTxt(PetXMLInfo.getName(this._selectItem.info.id)) + "吗？放生后该精灵将会永远回归到野外生活哦！",function():void
         {
            PetManager.addEventListener(PetEvent.ROWEI_PET,self.onRoweiSuccessHandler);
            PetManager.roweiPet(self._infoPanel.info.id,self._infoPanel.info.catchTime);
         });
      }
      
      private function setSelectItem() : void
      {
         this.setShowHideBtn(false,false);
         if(this._statusNum == 0)
         {
            this._inBagBtn.mouseEnabled = true;
         }
         else
         {
            this._inBagBtn.mouseEnabled = false;
         }
         this._selectItem = this._listCon.getChildAt(0) as PetListItem;
         for(var i:int = 0; i < MAX_LIST; i++)
         {
            var candidate:PetListItem = this._listCon.getChildAt(i) as PetListItem;
            if(candidate.info != null && candidate.info.catchTime == this._selectedCatchTime)
            {
               this._selectItem = candidate;
               break;
            }
         }
         this._selectedCatchTime = this._selectItem.info.catchTime;
         this._selectItem.select = true;
         PetManager.storageUpDate(this._selectItem.info.catchTime,function(param1:PetInfo):void
         {
            _infoPanel.info = param1;
            if(_statusNum == 0)
            {
               if(RoomPetManager.getInstance().contains(param1.catchTime))
               {
                  setShowHideBtn(false,true);
               }
               else
               {
                  setShowHideBtn(true,false);
               }
            }
         });
      }
      
      private function setShowHideBtn(param1:Boolean, param2:Boolean) : void
      {
         this._showPetBtn.visible = param1;
         this._hidePetBtn.visible = param2;
      }
      
      private function onRoweiBtnClickHandler(param1:MouseEvent) : void
      {
         this._petStoryBtn.visible = true;
         this._inBagBtn.mouseEnabled = false;
         this._roweiBtn.visible = false;
         this._statusNum = 1;
         this.setBtnVisible(false,false);
         this.setShowHideBtn(false,false);
         this._infoPanel.clear();
         PetManager.addEventListener(PetEvent.GET_ROWEI_PET_LIST,this.onGetListScucessHandler);
         PetManager.getRoweiPetList();
      }
      
      public function hide() : void
      {
         _views[MainManager.actorID] = {type:this._type,all:this.showAllFlag,page:this._rememberedPage,
            selected:this._selectedCatchTime,query:this._search.text,scroll:this._search.scrollH};
         this.removeEvent();
         DisplayUtil.removeForParent(this._mainUI);
      }
      
      private function onGetClickHandler(param1:MouseEvent) : void
      {
         PetManager.addEventListener(PetEvent.RETRIEVE_PET,this.onGetPetSuccessHandler);
         PetManager.retrievePet(this._infoPanel.info.id,this._infoPanel.info.catchTime);
      }
      
      private function onTypeClick(param1:DynamicEvent) : void
      {
         this._type = param1.paramObject as int;
         this.showAllFlag = false;
         this._rememberedPage = 0;
         this.reItem();
      }
      
      private function onPetStoryBtnClickHandler(param1:MouseEvent) : void
      {
         this._petStoryBtn.visible = false;
         this._roweiBtn.visible = true;
         this._statusNum = 0;
         this._inBagBtn.mouseEnabled = true;
         this.setBtnVisible(false,false);
         this._infoPanel.clear();
         this.reItem();
         this._countTxt.text = PetManager.getStorage().length.toString();
      }
      
      private function onClose(param1:MouseEvent) : void
      {
         this.hide();
      }
      
      private function reItem() : void
      {
         this.clearItem();
         this._data = this._statusNum == 0 ?
            (this.showAllFlag ? PetManager.getStorage() : PetManager.getStorageTypeList(this._type)) :
            PetManager.getRoweiTypeList(this._type);
         this._countTxt.text = this._data.length.toString();
         var query:String = this._search.text.replace(/^\s+|\s+$/g,"").toLowerCase();
         if(query.length > 0)
         {
            this._data = this._data.filter(function(pet:Object,index:int,list:Array):Boolean
            {
               return PetXMLInfo.getName(pet.id).toLowerCase().indexOf(query) >= 0 || String(pet.id) == query;
            });
         }
         this._data.sort(function(a:Object,b:Object):Number { return b.catchTime - a.catchTime; });
         var page:uint = Math.min(this._rememberedPage,Math.max(0,Math.ceil(this._data.length / MAX_LIST) - 1));
         this._pageBar.totalLength = this._data.length;
         this._pageBar.index = page;
         this._rememberedPage = page;
         var count:int = Math.min(MAX_LIST,this._data.length - page * MAX_LIST);
         for(var i:int = 0; i < count; i++)
         {
            var item:PetListItem = this._listCon.getChildAt(i) as PetListItem;
            item.info = this._data[i + page * MAX_LIST];
            item.addEventListener(MouseEvent.CLICK,this.onItemClick);
            item.mouseEnabled = true;
         }
         if(count > 0)
         {
            this.setSelectItem();
            this.setBtnVisible(this._statusNum != 0,this._statusNum == 0);
         }
         else
         {
            this._inBagBtn.mouseEnabled = false;
            this._infoPanel.clear();
            this.setBtnVisible(false,false);
            this.setShowHideBtn(false,false);
         }
      }

      private function onSearch(event:Event):void
      {
         this._rememberedPage = 0;
         this.reItem();
      }
      
      private function onChange(param1:PetEvent) : void
      {
         this.reItem();
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
         this._inBagBtn.removeEventListener(MouseEvent.CLICK,this.onInBag);
         this._typePanel.removeEventListener(MouseEvent.CLICK,this.onTypeClick);
         this._pageBar.removeEventListener(MouseEvent.CLICK,this.onPage);
         this._petStoryBtn.removeEventListener(MouseEvent.CLICK,this.onPetStoryBtnClickHandler);
         this._roweiBtn.removeEventListener(MouseEvent.CLICK,this.onRoweiBtnClickHandler);
         this._getBtn.removeEventListener(MouseEvent.CLICK,this.onGetClickHandler);
         this._outBtn.removeEventListener(MouseEvent.CLICK,this.onOutClickHandler);
         this._showPetBtn.removeEventListener(MouseEvent.CLICK,this.onShowPet);
         this._hidePetBtn.removeEventListener(MouseEvent.CLICK,this.onHidePet);
         PetManager.removeEventListener(PetEvent.STORAGE_ADDED,this.onChange);
         PetManager.removeEventListener(PetEvent.STORAGE_REMOVED,this.onChange);
         PetManager.removeEventListener(PetEvent.STORAGE_LIST,this.onListInfo);
         RoomPetManager.getInstance().removeEventListener(PetEvent.ROOM_PET_SHOW,this.onChange);
         this._search.removeEventListener(Event.CHANGE,this.onSearch);
      }
      
      private function onGetListScucessHandler(param1:PetEvent) : void
      {
         PetManager.removeEventListener(PetEvent.GET_ROWEI_PET_LIST,this.onGetListScucessHandler);
         this._countTxt.text = PetManager.roweiPetLength.toString();
         this.reItem();
      }
      
      private function addEvent() : void
      {
         this._closeBtn.addEventListener(MouseEvent.CLICK,this.onClose);
         this._dragBtn.addEventListener(MouseEvent.MOUSE_DOWN,this.onDragDown);
         this._dragBtn.addEventListener(MouseEvent.MOUSE_UP,this.onDragUp);
         this._inBagBtn.addEventListener(MouseEvent.CLICK,this.onInBag);
         this._typePanel.addEventListener(MouseEvent.CLICK,this.onTypeClick);
         this._pageBar.addEventListener(MouseEvent.CLICK,this.onPage);
         this._petStoryBtn.addEventListener(MouseEvent.CLICK,this.onPetStoryBtnClickHandler);
         this._roweiBtn.addEventListener(MouseEvent.CLICK,this.onRoweiBtnClickHandler);
         this._getBtn.addEventListener(MouseEvent.CLICK,this.onGetClickHandler);
         this._outBtn.addEventListener(MouseEvent.CLICK,this.onOutClickHandler);
         this._showPetBtn.addEventListener(MouseEvent.CLICK,this.onShowPet);
         this._hidePetBtn.addEventListener(MouseEvent.CLICK,this.onHidePet);
         PetManager.addEventListener(PetEvent.STORAGE_ADDED,this.onChange);
         PetManager.addEventListener(PetEvent.STORAGE_REMOVED,this.onChange);
         PetManager.addEventListener(PetEvent.STORAGE_LIST,this.onListInfo);
         RoomPetManager.getInstance().addEventListener(PetEvent.ROOM_PET_SHOW,this.onChange);
         this._search.addEventListener(Event.CHANGE,this.onSearch);
      }
      
      public function destroy() : void
      {
         this.hide();
         this._typePanel.destroy();
         this._closeBtn = null;
         this._dragBtn = null;
         this._inBagBtn = null;
         this._countTxt = null;
         this._typePanel = null;
         this._infoPanel = null;
         this._getBtn = null;
         this._outBtn = null;
         this._petStoryBtn = null;
         this._roweiBtn = null;
         this._listCon = null;
         this._mainUI = null;
         if(this._petSwitchPanel)
         {
            this._petSwitchPanel.destroy();
            this._petSwitchPanel = null;
         }
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
         PetManager.getStorageList();
      }
      
      private function setBtnVisible(param1:Boolean, param2:Boolean) : void
      {
         this._getBtn.visible = param1;
         this._outBtn.visible = param2;
      }
   }
}

