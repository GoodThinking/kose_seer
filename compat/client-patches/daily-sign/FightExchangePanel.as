package com.robot.module.app
{
   import com.robot.core.CommandID;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.manager.UIManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.alert.Alert;
   import flash.display.DisplayObject;
   import flash.display.Loader;
   import flash.display.Sprite;
   import flash.display.SimpleButton;
   import flash.filters.GlowFilter;
   import flash.events.Event;
   import flash.events.IOErrorEvent;
   import flash.events.MouseEvent;
   import flash.events.SecurityErrorEvent;
   import flash.geom.Rectangle;
   import flash.net.URLRequest;
   import flash.system.ApplicationDomain;
   import flash.system.LoaderContext;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketEvent;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;

   [SWF(width="500", height="375", backgroundColor="#ffffff", frameRate="24")]
   [SWF(frameRate="24",backgroundColor="#000000",width="960",height="560")]
   public class FightExchangePanel extends Sprite implements IModule
   {

      private const PETS:Array = []; // @PET_ACQUISITION_CATALOG@

      private var _modalBg:Sprite;

      private var _panel:Sprite;

      private var _leftStage:Sprite;

      private var _rightArea:Sprite;

      private var _signBtn:Sprite;

      private var _signBtnText:TextField;

      private var _selectedPet:Object;

      private var _currentMode:String = "schedule";
      private var _page:int = 0;

      private var _totalDays:int = 0;

      private var _todayClaimed:Boolean = false;

      private var _waitingResponse:Boolean = false;

      private var _statusReady:Boolean = false;

      private var _petNameText:TextField;

      private var _petTypeText:TextField;

      private var _moveNameText:TextField;

      private var _moveDesText:TextField;

      private var _statsText:TextField;

      private var _evolText:TextField;

      private var _bodyHolder:Sprite;

      public function FightExchangePanel()
      {
         super();
      }

      public function setup() : void
      {
         initUI();
      }

      public function init(param1:Object = null) : void
      {
      }

      public function show() : void
      {
         LevelManager.showOrRemoveMapLevelandToolslevel(false,true);
         LevelManager.appLevel.addChild(this);
         queryStatus();
      }

      public function hide() : void
      {
         LevelManager.showOrRemoveMapLevelandToolslevel(true);
         DisplayUtil.removeForParent(this);
         ModuleManager.destroyForInstance(this);
      }

      public function destroy() : void
      {
         SocketConnection.removeCmdListener(CommandID.IS_COLLECT,onStatusResponse);
         SocketConnection.removeCmdListener(CommandID.PET_COLLECT,onCollectResponse);
         this._selectedPet = null;
      }

      private function initUI() : void
      {
         while(this.numChildren > 0)
         {
            this.removeChildAt(0);
         }
         _modalBg = new Sprite();
         _modalBg.graphics.beginFill(0,0.65);
         _modalBg.graphics.drawRect(0,0,960,560);
         _modalBg.graphics.endFill();
         addChild(_modalBg);
         _panel = new Sprite();
         _panel.x = (960 - 860) / 2;
         _panel.y = (560 - 520) / 2;
         drawPanelFrame(_panel,860,520);
         addChild(_panel);
         drawHeader();
         _leftStage = new Sprite();
         _leftStage.x = 22;
         _leftStage.y = 56;
         drawLeftStage(_leftStage,310,444);
         _panel.addChild(_leftStage);
         _rightArea = new Sprite();
         _rightArea.x = 344;
         _rightArea.y = 56;
         _panel.addChild(_rightArea);
         if(PETS.length > 0) selectPet(PETS[0]);
         renderRightArea();
      }

      private function drawPanelFrame(s:Sprite, w:Number, h:Number) : void
      {
         var frame:Sprite = UIManager.getSprite("Panel_Background");
         frame.scale9Grid = new Rectangle(16,32,frame.width-32,frame.height-48);
         frame.width = w;
         frame.height = h;
         frame.mouseEnabled = frame.mouseChildren = false;
         s.addChild(frame);
      }


      private function drawHeader() : void
      {
         var bar:Sprite = UIManager.getSprite("Panel_TitleBar");
         bar.x = 230; bar.y = 5; bar.width = 400; bar.height = 14;
         bar.mouseEnabled = bar.mouseChildren = false;
         _panel.addChild(bar);
         var title:TextField = createLabel(_panel,250,24,360,26,18,0xFFFFFF,true,"center");
         title.filters = [new GlowFilter(676248,0.8,4,4,10)];
         title.text = "收藏精灵 · 每日签到";
         var closeBtn:SimpleButton = UIManager.getButton("Close_Btn");
         closeBtn.width = closeBtn.height = 26;
         closeBtn.x = 817; closeBtn.y = 11;
         closeBtn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            hide();
         });
         _panel.addChild(closeBtn);
      }

      private function drawLeftStage(s:Sprite, w:Number, h:Number) : void
      {
         s.graphics.lineStyle(1.5,1986174);
         s.graphics.beginFill(597040,0.95);
         s.graphics.drawRoundRect(0,0,w,h,12,12);
         s.graphics.endFill();
         s.graphics.lineStyle(1.5,61695,0.5);
         s.graphics.beginFill(61695,0.1);
         s.graphics.drawEllipse(40,240,230,42);
         s.graphics.endFill();
         _bodyHolder = new Sprite();
         _bodyHolder.x = 20;
         _bodyHolder.y = 60;
         s.addChild(_bodyHolder);
         _petNameText = createLabel(s,20,14,270,30,22,16777215,true,"center");
         _petTypeText = createLabel(s,20,44,270,22,12,6600182,true,"center");
         var moveBox:Sprite = new Sprite();
         moveBox.graphics.lineStyle(1.2,55551,0.8);
         moveBox.graphics.beginFill(398630,0.9);
         moveBox.graphics.drawRoundRect(16,290,278,68,6,6);
         moveBox.graphics.endFill();
         s.addChild(moveBox);
         var tagTf:TextField = createLabel(s,24,296,68,18,11,16748544,true);
         tagTf.text = "收藏签到";
         _moveNameText = createLabel(s,92,296,195,20,13,16769625,true);
         _moveDesText = createLabel(s,24,318,262,36,11,10536424,false);
         _statsText = createLabel(s,16,366,278,20,11,9222629,false,"center");
         _evolText = createLabel(s,16,388,278,20,11,7725727,false,"center");
         var tip:TextField = createLabel(s,10,418,290,20,11,55551,false,"center");
         tip.text = "◀ 点击右侧卡片，可直接切换全息预览";
      }

      private function selectPet(p:Object) : void
      {
         _selectedPet = p;
         _petNameText.text = p.name;
         _petTypeText.text = "收藏签到精灵";
         _moveNameText.text = "签到说明";
         _moveDesText.text = "每日可选择一只，领取后存入仓库。";
         _statsText.text = "";
         _evolText.text = "形态进阶：" + p.evol;
         while(_bodyHolder.numChildren > 0)
         {
            _bodyHolder.removeChildAt(0);
         }
         loadArt(_bodyHolder,p.id,0,0,270,220,true);
         updateSignButton();
      }

      private function loadArt(container:Sprite, petId:int, x:Number, y:Number, w:Number, h:Number, full:Boolean) : void
      {
         var loader:Loader;
         var subUrl:String;
         var fullPath:String;
         var holder:Sprite = new Sprite();
         holder.x = x;
         holder.y = y;
         holder.mouseEnabled = false;
         holder.mouseChildren = false;
         container.addChild(holder);
         loader = new Loader();
         loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,function(e:IOErrorEvent):void
         {
         });
         loader.contentLoaderInfo.addEventListener(SecurityErrorEvent.SECURITY_ERROR,function(e:SecurityErrorEvent):void
         {
         });
         loader.contentLoaderInfo.addEventListener(Event.COMPLETE,function(e:Event):void
         {
            var domain:ApplicationDomain;
            var symbol:String;
            var definition:Class;
            var display:DisplayObject;
            var bounds:Rectangle;
            var scale:Number;
            try
            {
               domain = loader.contentLoaderInfo.applicationDomain;
               symbol = full ? "pet" : "item";
               if(!domain.hasDefinition(symbol))
               {
                  return;
               }
               definition = domain.getDefinition(symbol) as Class;
               display = new definition() as DisplayObject;
               bounds = display.getBounds(display);
               if(bounds.width <= 0 || bounds.height <= 0)
               {
                  return;
               }
               scale = Math.min(w / bounds.width,h / bounds.height);
               display.scaleX = scale;
               display.scaleY = scale;
               display.x = (w - bounds.width * scale) / 2 - bounds.x * scale;
               display.y = (h - bounds.height * scale) / 2 - bounds.y * scale;
               holder.addChild(display);
            }
            catch(err:Error)
            {
            }
         });
         subUrl = full ? (petId > 500 ? "groupFightResource/pet/" : "pet/swf/") : "pet/head/";
         fullPath = "/resource/" + subUrl + petId + ".swf";
         loader.load(new URLRequest(fullPath),new LoaderContext(false,new ApplicationDomain()));
      }

      private function renderRightArea() : void
      {
         var errTf:TextField;
         while(_rightArea.numChildren > 0)
         {
            _rightArea.removeChildAt(0);
         }
         try
         {
            drawTabs();
            if(_currentMode == "schedule")
            {
               renderScheduleMode();
            }
            else
            {
               renderChooseMode();
            }
            drawBottomBar();
         }
         catch(err:Error)
         {
            errTf = createLabel(_rightArea,10,10,480,200,12,16733525,true);
            errTf.text = "Render Error: " + err.message;
         }
      }

      private function drawTabs() : void
      {
         var t2:Sprite;
         var progTxt:TextField;
         var t1:Sprite = new Sprite();
         drawSingleTab(t1,0,0,110,28,"【签到进度】",_currentMode == "schedule");
         t1.buttonMode = true;
         t1.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            _currentMode = "schedule";
            renderRightArea();
         });
         _rightArea.addChild(t1);
         t2 = new Sprite();
         drawSingleTab(t2,115,0,130,28,"【收藏自选】",_currentMode == "choose");
         t2.buttonMode = true;
         t2.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            _currentMode = "choose";
            renderRightArea();
         });
         _rightArea.addChild(t2);
         progTxt = createLabel(_rightArea,250,4,240,22,12,0x163F62,true,"right");
         progTxt.text = _statusReady ? ("累计签到：" + _totalDays + " 天 · " + (_todayClaimed ? "今日已签" : "今日待签")) : "正在读取签到状态…";
      }

      private function drawSingleTab(s:Sprite, x:Number, y:Number, w:Number, h:Number, label:String, active:Boolean) : void
      {
         s.x = x;
         s.y = y;
         nativeButton(s,w,h,label,active);
      }

      private function nativeButton(s:Sprite,w:Number,h:Number,title:String,active:Boolean = false):TextField
      {
         var up:DisplayObject = UIManager.getDisplayObject("Button_upSkin");
         var over:DisplayObject = UIManager.getDisplayObject("Button_overSkin");
         var down:DisplayObject = UIManager.getDisplayObject("Button_downSkin");
         up.width = over.width = down.width = w;
         up.height = over.height = down.height = h;
         s.addChild(new SimpleButton(active ? down : up,over,down,up));
         s.mouseChildren = true;
         var text:TextField = createLabel(s,0,(h-20)/2,w,20,12,0xFFFFFF,true,"center");
         text.filters = [new GlowFilter(676248,0.8,4,4,10)];
         text.text = title;
         return text;
      }

      private function renderScheduleMode() : void
      {
         var startDay:int = int(Math.max(0,_totalDays - (_todayClaimed ? 1 : 0)) / 7) * 7;
         var cycleDays:int = 7;
         var i:int = 0;
         while(i < cycleDays)
         {
            if(PETS.length == 0) return;
            var pIndex:int = (startDay + i) % PETS.length;
            var petObj:Object = PETS[pIndex];
            var dayNum:int = startDay + i + 1;
            var isClaimed:Boolean = dayNum <= _totalDays;
            var isTodayTarget:Boolean = dayNum == _totalDays + 1 && !_todayClaimed;
            var card:Sprite = createDayCard(i,dayNum,petObj,isClaimed,isTodayTarget);
            _rightArea.addChild(card);
            i++;
         }
      }

      private function createDayCard(slotIndex:int, dayNum:int, p:Object, isClaimed:Boolean, isTodayTarget:Boolean) : Sprite
      {
         var dayTxt:TextField;
         var headCircle:Sprite;
         var nameTxt:TextField;
         var bigName:TextField;
         var bigDes:TextField;
         var stamp:Sprite;
         var btnBar:Sprite;
         var card:Sprite = new Sprite();
         var col:int = slotIndex % 4;
         var row:int = Math.floor(slotIndex / 4);
         var isBigCard:Boolean = slotIndex == 6;
         var cardW:Number = isBigCard ? 234 : 112;
         var cardH:Number = 138;
         card.x = isBigCard ? 244 : col * 122;
         card.y = 38 + row * 148;
         card.graphics.lineStyle(isTodayTarget ? 2.5 : 1.5,isTodayTarget ? 16760832 : (isClaimed ? 2452286 : 1456476));
         card.graphics.beginFill(isTodayTarget ? 1126738 : 597040,0.95);
         card.graphics.drawRoundRect(0,0,cardW,cardH,8,8);
         card.graphics.endFill();
         card.graphics.beginFill(isTodayTarget ? 16748544 : (isClaimed ? 1789230 : 861242));
         card.graphics.drawRoundRect(0,0,cardW,22,6,6);
         card.graphics.endFill();
         dayTxt = createLabel(card,0,2,cardW,20,11,isTodayTarget ? 0 : (isClaimed ? 8712359 : 9220561),true,"center");
         dayTxt.text = "第 " + dayNum + " 天" + (isTodayTarget ? " · 今日" : "");
         headCircle = new Sprite();
         headCircle.x = isBigCard ? 50 : cardW / 2;
         headCircle.y = 64;
         headCircle.graphics.lineStyle(1.5,55551,0.6);
         headCircle.graphics.beginFill(398372);
         headCircle.graphics.drawCircle(0,0,24);
         headCircle.graphics.endFill();
         card.addChild(headCircle);
         loadArt(card,p.id,(isBigCard ? 50 : cardW / 2) - 20,44,40,40,false);
         if(!isBigCard)
         {
            nameTxt = createLabel(card,0,92,cardW,20,12,isTodayTarget ? 16770431 : 16777215,true,"center");
            nameTxt.text = p.name;
         }
         else
         {
            bigName = createLabel(card,96,40,134,22,14,16766720,true);
            bigName.text = p.name;
            bigDes = createLabel(card,96,64,134,36,11,10536424,false);
            bigDes.text = "收藏签到";
         }
         if(isClaimed)
         {
            stamp = createStamp("已签到");
            stamp.x = cardW / 2;
            stamp.y = 68;
            card.addChild(stamp);
         }
         else if(isTodayTarget)
         {
            btnBar = new Sprite();
            btnBar.x = isBigCard ? 96 : 12;
            btnBar.y = 112;
            nativeButton(btnBar,isBigCard ? 116 : 88,20,"选择精灵");
            card.addChild(btnBar);
         }
         card.buttonMode = true;
         (function(targetP:Object):void
         {
            card.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
            {
               selectPet(targetP);
            });
         })(p);
         return card;
      }

      private function createStamp(text:String) : Sprite
      {
         var s:Sprite = new Sprite();
         s.graphics.lineStyle(1.5,16741749,0.9);
         s.graphics.beginFill(11019043,0.85);
         s.graphics.drawRoundRect(-36,-12,72,24,4,4);
         s.graphics.endFill();
         var t:TextField = createLabel(s,-36,-10,72,20,11,16777215,true,"center");
         t.text = text;
         return s;
      }

      private function renderChooseMode() : void
      {
         var p:Object;
         var col:int;
         var row:int;
         var cell:Sprite;
         var n:TextField;
         var ty:TextField;
         var start:int = _page * 12;
         var i:int = start;
         while(i < Math.min(start + 12,PETS.length))
         {
            p = PETS[i];
            col = (i - start) % 4;
            row = Math.floor((i - start) / 4);
            cell = new Sprite();
            cell.x = col * 122;
            cell.y = 36 + row * 88;
            cell.graphics.lineStyle(1.2,_selectedPet == p ? 16760832 : 1456476);
            cell.graphics.beginFill(_selectedPet == p ? 1126738 : 597040,0.95);
            cell.graphics.drawRoundRect(0,0,112,78,6,6);
            cell.graphics.endFill();
            loadArt(cell,p.id,8,18,40,40,false);
            n = createLabel(cell,52,16,56,20,12,16777215,true);
            n.text = p.name;
            ty = createLabel(cell,52,38,56,20,11,6600182);
            ty.text = "收藏";
            cell.buttonMode = true;
            (function(targetPet:Object):void
            {
               cell.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
               {
                  selectPet(targetPet);
                  renderRightArea();
               });
            })(p);
            _rightArea.addChild(cell);
            i++;
         }
         if(_page > 0)
         {
            var prev:Sprite = new Sprite();
            prev.x = 110;
            prev.y = 312;
            nativeButton(prev,100,26,"上一页");
            prev.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void { _page--; renderRightArea(); });
            _rightArea.addChild(prev);
         }
         if((_page + 1) * 12 < PETS.length)
         {
            var next:Sprite = new Sprite();
            next.x = 270;
            next.y = 312;
            nativeButton(next,100,26,"下一页");
            next.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void { _page++; renderRightArea(); });
            _rightArea.addChild(next);
         }
      }

      private function drawBottomBar() : void
      {
         var info:TextField = createLabel(_rightArea,0,396,490,22,11,0x163F62,false,"center");
         info.text = "★ 每日免费领取 1 只收藏精灵，直接入仓；北京时间 00:00 刷新。";
         _signBtn = new Sprite();
         _signBtn.x = 165;
         _signBtn.y = 425;
         _signBtnText = nativeButton(_signBtn,160,30,"");
         updateSignButton();
         _signBtn.addEventListener(MouseEvent.CLICK,onSignClick);
         _rightArea.addChild(_signBtn);
      }

      private function updateSignButton() : void
      {
         if(_signBtn == null || _signBtnText == null)return;
         _signBtn.mouseEnabled = _selectedPet != null && _statusReady && !_todayClaimed && !_waitingResponse;
         _signBtn.mouseChildren = _signBtn.mouseEnabled;
         _signBtn.alpha = _signBtn.mouseEnabled ? 1 : 0.55;
         _signBtnText.text = !_statusReady ? "正在读取…" : (_waitingResponse ? "正在签到…" : (_todayClaimed ? "今日已签到" : (_selectedPet == null ? "暂无可领取精灵" : "签到领取" + _selectedPet.name)));
      }

      private function onSignClick(e:MouseEvent) : void
      {
         if(!_statusReady || _selectedPet == null)return;
         if(_todayClaimed)
         {
            Alarm.show("你今天已经签到领取过精灵了，明天 00:00 刷新后再来吧！");
            return;
         }
         if(_waitingResponse)
         {
            return;
         }
         var targetPetId:uint = uint(_selectedPet.id);
         var targetPetName:String = String(_selectedPet.name);
         Alert.show("今日签到免费领取 1 级【" + targetPetName + "】？精灵将直接存入仓库。",function():void
         {
            if(!_statusReady || _todayClaimed || _waitingResponse) return;
            _waitingResponse = true;
            updateSignButton();
            SocketConnection.addCmdListener(CommandID.PET_COLLECT,onCollectResponse);
            SocketConnection.send(CommandID.PET_COLLECT,900001,targetPetId);
         });
      }

      private function onCollectResponse(e:SocketEvent) : void
      {
         _waitingResponse = false;
         updateSignButton();
         SocketConnection.removeCmdListener(CommandID.PET_COLLECT,onCollectResponse);
         var body:ByteArray = e.data as ByteArray;
         if(!body || body.bytesAvailable < 16)
         {
            return;
         }
         var petId:uint = body.readUnsignedInt();
         var catchTime:uint = body.readUnsignedInt();
         var coins:uint = body.readUnsignedInt();
         var error:uint = body.readUnsignedInt();
         if(error != 0)
         {
            Alarm.show(error == 5002 ? "你今天已经签到领取过精灵了，明天再来吧！" : (error == 5001 ? "该精灵不再提供签到领取。" : "签到未完成，请重试。"));
            if(error == 5002)queryStatus();
            return;
         }
         _todayClaimed = true;
         PetManager.addStorage(petId,catchTime);
         queryStatus();
         Alarm.show("签到成功！1级【" + PetXMLInfo.getName(petId) + "】已直接存入你的精灵仓库！明日记得继续来签到！");
      }

      public function queryStatus() : void
      {
         _statusReady = false;
         renderRightArea();
         SocketConnection.removeCmdListener(CommandID.IS_COLLECT,onStatusResponse);
         SocketConnection.addCmdListener(CommandID.IS_COLLECT,onStatusResponse);
         SocketConnection.send(CommandID.IS_COLLECT,900001);
      }

      private function onStatusResponse(e:SocketEvent):void
      {
         var body:ByteArray = e.data as ByteArray;
         if(!body || body.bytesAvailable < 12)return;
         var start:uint = body.position;
         var groupId:uint = body.readUnsignedInt();
         if(groupId != 900001)
         {
            body.position = start;
            return;
         }
         SocketConnection.removeCmdListener(CommandID.IS_COLLECT,onStatusResponse);
         _todayClaimed = body.readUnsignedInt() == 1;
         _totalDays = body.readUnsignedInt();
         _statusReady = true;
         renderRightArea();
      }

      private function createLabel(parent:Sprite, x:Number, y:Number, w:Number, h:Number, size:int, color:uint, bold:Boolean = false, align:String = "left") : TextField
      {
         var t:TextField = new TextField();
         t.x = x;
         t.y = y;
         t.width = w;
         t.height = h;
         t.defaultTextFormat = new TextFormat("宋体",size,color,bold,null,null,null,null,align);
         t.selectable = false;
         t.mouseEnabled = false;
         parent.addChild(t);
         return t;
      }
   }
}
