package com.robot.module.app
{
   import com.robot.core.CommandID;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.alert.Alert;
   import flash.display.DisplayObject;
   import flash.display.Loader;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.IOErrorEvent;
   import flash.events.MouseEvent;
   import flash.net.URLRequest;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.text.TextFormatAlign;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketEvent;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;

   [SWF(width="960", height="560", backgroundColor="#000000", frameRate="24")]
   public class FightExchangePanel extends Sprite implements IModule
   {
      // 16 只全服绝对零产出绝版亲本（彻底剔除达比拉、该隐等既有产出）
      private const PETS:Array = [
         {id:108, name:"布鲁", type:"水", hp:105, atk:44, def:40, spAtk:115, spDef:46, spd:96, move:"海洋之心", moveDes:"怒涛巨浪，强制扣除对手当前体力的 1/4！经典打BOSS第一神技。", evol:"布鲁克克 (满级形态)"},
         {id:62,  name:"格林", type:"地面", hp:100, atk:48, def:42, spAtk:112, spDef:46, spd:95, move:"地系绝版", moveDes:"地面系经典绝版亲本，融合格林奇核心母体。", evol:"格林奇 (满级形态)"},
         {id:378, name:"凯奴", type:"光", hp:110, atk:50, def:45, spAtk:118, spDef:55, spd:105, move:"极光之幕", moveDes:"光芒护体，稀有特攻光系绝版亲本。", evol:"凯尔奴斯 (满级形态)"},
         {id:445, name:"兰妮", type:"超能", hp:108, atk:45, def:46, spAtk:116, spDef:48, spd:102, move:"精神轰炸", moveDes:"超能念力冲击，稀有控制与融合亲本。", evol:"兰特 (满级形态)"},
         {id:448, name:"卡拉", type:"草", hp:115, atk:45, def:110, spAtk:105, spDef:100, spd:92, move:"绿芒守护", moveDes:"草系高防回复特攻亲本，融合卡拉巨龙核心。", evol:"卡拉巨龙 (满级形态)"},
         {id:469, name:"米奈", type:"龙", hp:112, atk:45, def:49, spAtk:118, spDef:55, spd:108, move:"疾风龙爪", moveDes:"高速龙系特殊亲本，进化米奈希尔。", evol:"米奈希尔 (满级形态)"},
         {id:515, name:"奈落", type:"龙", hp:120, atk:115, def:95, spAtk:80, spDef:85, spd:100, move:"终极龙尊", moveDes:"龙威震慑，高阶超绝版龙尊终极亲本母体！", evol:"奈落达尔 (满级形态)"},
         {id:526, name:"托克", type:"火", hp:110, atk:112, def:54, spAtk:59, spDef:47, spd:100, move:"烈焰吐息", moveDes:"火系速攻亲本，托克尔初级形态。", evol:"托克尔 (满级形态)"},
         {id:560, name:"沃特", type:"地面", hp:115, atk:49, def:105, spAtk:116, spDef:54, spd:92, move:"岩突崩塌", moveDes:"坚实地面特攻亲本，沃特雷初级形态。", evol:"沃特雷 (满级形态)"},
         {id:576, name:"德普", type:"龙", hp:116, atk:118, def:90, spAtk:40, spDef:43, spd:95, move:"狂暴龙牙", moveDes:"强力龙系物攻亲本，德普拉初级形态。", evol:"德普拉 (满级形态)"},
         {id:596, name:"史克", type:"战斗", hp:118, atk:116, def:92, spAtk:48, spDef:50, spd:98, move:"霸者重拳", moveDes:"强力格斗亲本，史克鲁初级形态。", evol:"史克鲁 (满级形态)"},
         {id:598, name:"米娅", type:"火", hp:110, atk:50, def:48, spAtk:115, spDef:55, spd:104, move:"红莲火环", moveDes:"火系特殊亲本，米娅斯初级形态。", evol:"米娅斯 (满级形态)"},
         {id:604, name:"莎莉", type:"飞行", hp:105, atk:40, def:42, spAtk:114, spDef:48, spd:108, move:"疾风花羽", moveDes:"飞行系优雅绝版亲本，莎莉花初级形态。", evol:"莎莉花 (满级形态)"},
         {id:618, name:"嘟拉", type:"冰", hp:112, atk:114, def:85, spAtk:52, spDef:49, spd:102, move:"冰霜风暴", moveDes:"极地冰系强力亲本，嘟拉拉初级形态。", evol:"嘟拉拉 (满级形态)"},
         {id:677, name:"草莓多多", type:"火", hp:105, atk:55, def:55, spAtk:110, spDef:56, spd:95, move:"甜甜炸弹", moveDes:"经典节日美食限定专属技能，草莓甜甜初级形态。", evol:"草莓甜甜 (满级形态)"},
         {id:682, name:"苹果多多", type:"草", hp:110, atk:114, def:80, spAtk:40, spDef:44, spd:96, move:"果香冲击", moveDes:"经典节日美食限定专属技能，苹果脆脆初级形态。", evol:"苹果脆脆 (满级形态)"}
      ];

      private var _modalBg:Sprite;
      private var _panel:Sprite;
      private var _leftStage:Sprite;
      private var _rightArea:Sprite;
      private var _signBtn:Sprite;
      private var _signBtnText:TextField;
      private var _tabSchedule:Sprite;
      private var _tabChoose:Sprite;

      private var _selectedPet:Object;
      private var _currentMode:String = "schedule";
      private var _totalDays:int = 0;
      private var _todayClaimed:Boolean = false;
      private var _waitingResponse:Boolean = false;

      private var _petNameText:TextField;
      private var _petTypeText:TextField;
      private var _moveNameText:TextField;
      private var _moveDesText:TextField;
      private var _statsText:TextField;
      private var _evolText:TextField;
      private var _avatarContainer:Sprite;

      public function FightExchangePanel()
      {
         super();
      }

      public function setup():void
      {
         initUI();
      }

      public function init(param1:Object = null):void
      {
      }

      public function show():void
      {
         LevelManager.showOrRemoveMapLevelandToolslevel(false, true);
         LevelManager.appLevel.addChild(this);
         queryStatus();
      }

      public function hide():void
      {
         LevelManager.showOrRemoveMapLevelandToolslevel(true);
         DisplayUtil.removeForParent(this);
         ModuleManager.destroyForInstance(this);
      }

      public function destroy():void
      {
         this._selectedPet = null;
      }

      private function initUI():void
      {
         while(this.numChildren > 0) this.removeChildAt(0);

         // 1. 半透明遮罩
         _modalBg = new Sprite();
         _modalBg.graphics.beginFill(0x000000, 0.65);
         _modalBg.graphics.drawRect(0, 0, 960, 560);
         _modalBg.graphics.endFill();
         addChild(_modalBg);

         // 2. 主面板居中 860x520
         _panel = new Sprite();
         _panel.x = (960 - 860) / 2;
         _panel.y = (560 - 520) / 2;
         drawPanelFrame(_panel, 860, 520);
         addChild(_panel);

         // 3. 顶部标题栏
         drawHeader();

         // 4. 左侧全息展示台
         _leftStage = new Sprite();
         _leftStage.x = 22;
         _leftStage.y = 56;
         drawLeftStage(_leftStage, 310, 444);
         _panel.addChild(_leftStage);

         // 5. 右侧区域
         _rightArea = new Sprite();
         _rightArea.x = 344;
         _rightArea.y = 56;
         _panel.addChild(_rightArea);

         selectPet(PETS[0]);
         renderRightArea();
      }

      private function drawPanelFrame(s:Sprite, w:Number, h:Number):void
      {
         s.graphics.clear();
         s.graphics.beginFill(0x13385e, 1.0);
         s.graphics.drawRoundRect(0, 0, w, h, 20, 20);
         s.graphics.endFill();

         s.graphics.lineStyle(2, 0x00d8ff, 0.9);
         s.graphics.beginFill(0x071526, 0.98);
         s.graphics.drawRoundRect(4, 4, w - 8, h - 8, 16, 16);
         s.graphics.endFill();

         drawRivet(s, 16, 16);
         drawRivet(s, w - 16, 16);
         drawRivet(s, 16, h - 16);
         drawRivet(s, w - 16, h - 16);
      }

      private function drawRivet(s:Sprite, x:Number, y:Number):void
      {
         s.graphics.lineStyle(1, 0x004c80);
         s.graphics.beginFill(0x69b4ff);
         s.graphics.drawCircle(x, y, 4);
         s.graphics.endFill();
      }

      private function drawHeader():void
      {
         var h:Sprite = new Sprite();
         h.graphics.lineStyle(2, 0x00f0ff, 0.9);
         h.graphics.beginFill(0x0d2e50, 1.0);
         h.graphics.moveTo(230, 4);
         h.graphics.lineTo(270, 42);
         h.graphics.lineTo(590, 42);
         h.graphics.lineTo(630, 4);
         h.graphics.endFill();
         _panel.addChild(h);

         var title:TextField = new TextField();
         title.defaultTextFormat = new TextFormat("Microsoft YaHei, SimHei", 20, 0xffd200, true, null, null, null, null, TextFormatAlign.CENTER);
         title.text = "绝版神宠 · 每日签到";
         title.width = 360;
         title.height = 30;
         title.x = 250;
         title.y = 12;
         title.selectable = false;
         title.mouseEnabled = false;
         _panel.addChild(title);

         var closeBtn:Sprite = new Sprite();
         closeBtn.graphics.lineStyle(1.5, 0xff8282);
         closeBtn.graphics.beginFill(0x9e1b1b, 1.0);
         closeBtn.graphics.drawCircle(832, 24, 12);
         closeBtn.graphics.endFill();
         closeBtn.buttonMode = true;

         var closeTxt:TextField = new TextField();
         closeTxt.defaultTextFormat = new TextFormat("Arial", 14, 0xffffff, true, null, null, null, null, TextFormatAlign.CENTER);
         closeTxt.text = "✕";
         closeTxt.width = 24;
         closeTxt.height = 20;
         closeTxt.x = 820;
         closeTxt.y = 14;
         closeTxt.selectable = false;
         closeTxt.mouseEnabled = false;
         closeBtn.addChild(closeTxt);

         closeBtn.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
            hide();
         });
         _panel.addChild(closeBtn);
      }

      private function drawLeftStage(s:Sprite, w:Number, h:Number):void
      {
         s.graphics.lineStyle(1.5, 0x1e4e7e);
         s.graphics.beginFill(0x091c30, 0.95);
         s.graphics.drawRoundRect(0, 0, w, h, 12, 12);
         s.graphics.endFill();

         s.graphics.lineStyle(1.5, 0x00f0ff, 0.5);
         s.graphics.beginFill(0x00f0ff, 0.1);
         s.graphics.drawEllipse(40, 240, 230, 42);
         s.graphics.endFill();

         _avatarContainer = new Sprite();
         _avatarContainer.x = 100;
         _avatarContainer.y = 70;
         s.addChild(_avatarContainer);

         _petNameText = createLabel(s, 20, 18, 270, 30, 22, 0xffffff, true, TextFormatAlign.CENTER);
         _petTypeText = createLabel(s, 20, 48, 270, 22, 12, 0x64b5f6, true, TextFormatAlign.CENTER);

         var moveBox:Sprite = new Sprite();
         moveBox.graphics.lineStyle(1.2, 0x00d8ff, 0.8);
         moveBox.graphics.beginFill(0x061526, 0.9);
         moveBox.graphics.drawRoundRect(16, 290, 278, 68, 6, 6);
         moveBox.graphics.endFill();
         s.addChild(moveBox);

         createLabel(s, 26, 296, 70, 18, 11, 0xff9000, true);
         _moveNameText = createLabel(s, 90, 296, 195, 20, 13, 0xffe259, true);
         _moveDesText = createLabel(s, 24, 318, 262, 36, 11, 0xa0c5e8, false);

         _statsText = createLabel(s, 20, 368, 270, 20, 11, 0x8cb9e5, false, TextFormatAlign.CENTER);
         _evolText = createLabel(s, 20, 390, 270, 20, 11, 0x75e29f, false, TextFormatAlign.CENTER);

         var tip:TextField = createLabel(s, 10, 418, 290, 20, 11, 0x00d8ff, false, TextFormatAlign.CENTER);
         tip.text = "◀ 点击右侧卡片，可直接切换全息预览";
      }

      private function selectPet(p:Object):void
      {
         _selectedPet = p;
         _petNameText.text = p.name;
         _petTypeText.text = "【" + p.type + "系】· 全服零产出绝版亲本";
         _moveNameText.text = "【" + p.move + "】";
         _moveDesText.text = p.moveDes;
         _statsText.text = "种族值：体 " + p.hp + " · 攻 " + p.atk + " · 防 " + p.def + " · 特攻 " + p.spAtk + " · 速 " + p.spd;
         _evolText.text = "形态进阶：" + p.evol;

         loadPetAvatar(_avatarContainer, p.id);
      }

      private function loadPetAvatar(container:Sprite, petId:uint):void
      {
         while(container.numChildren > 0) container.removeChildAt(0);

         var glow:Sprite = new Sprite();
         glow.graphics.lineStyle(2, 0x00d8ff, 0.8);
         glow.graphics.beginFill(0x13385e, 0.9);
         glow.graphics.drawCircle(55, 60, 52);
         glow.graphics.endFill();
         container.addChild(glow);

         var loader:Loader = new Loader();
         loader.contentLoaderInfo.addEventListener(Event.COMPLETE, function(e:Event):void {
            var content:DisplayObject = loader.content;
            if(content)
            {
               content.scaleX = content.scaleY = 1.6;
               content.x = 10;
               content.y = 15;
            }
         });
         loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, function(e:IOErrorEvent):void {});
         loader.load(new URLRequest(ClientConfig.getPetHeadPath(petId)));
         container.addChild(loader);
      }

      private function renderRightArea():void
      {
         while(_rightArea.numChildren > 0) _rightArea.removeChildAt(0);

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

      private function drawTabs():void
      {
         _tabSchedule = new Sprite();
         drawSingleTab(_tabSchedule, 0, 0, 110, 28, "【每日排期】", _currentMode == "schedule");
         _tabSchedule.buttonMode = true;
         _tabSchedule.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
            _currentMode = "schedule";
            renderRightArea();
         });
         _rightArea.addChild(_tabSchedule);

         _tabChoose = new Sprite();
         drawSingleTab(_tabChoose, 115, 0, 130, 28, "【自选绝版库】", _currentMode == "choose");
         _tabChoose.buttonMode = true;
         _tabChoose.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
            _currentMode = "choose";
            renderRightArea();
         });
         _rightArea.addChild(_tabChoose);

         var progTxt:TextField = createLabel(_rightArea, 260, 4, 230, 22, 12, 0xffd200, true, TextFormatAlign.RIGHT);
         progTxt.text = "累计签到：" + _totalDays + " 天 · " + (_todayClaimed ? "今日已签" : "今日待签");
      }

      private function drawSingleTab(s:Sprite, x:Number, y:Number, w:Number, h:Number, label:String, active:Boolean):void
      {
         s.x = x; s.y = y;
         s.graphics.clear();
         s.graphics.lineStyle(1.5, active ? 0x00d8ff : 0x1e4e7e);
         s.graphics.beginFill(active ? 0x154573 : 0x0a1a2c, 0.95);
         s.graphics.drawRoundRect(0, 0, w, h, 6, 6);
         s.graphics.endFill();

         var tf:TextField = createLabel(s, 0, 4, w, h, 12, active ? 0xffffff : 0x7da4c7, true, TextFormatAlign.CENTER);
         tf.text = label;
      }

      private function renderScheduleMode():void
      {
         var startDay:int = _totalDays < 7 ? 0 : (_totalDays < 14 ? 7 : 0);
         var cycleDays:int = 7;

         for(var i:int = 0; i < cycleDays; i++)
         {
            var pIndex:int = (startDay + i) % PETS.length;
            var petObj:Object = PETS[pIndex];
            var dayNum:int = startDay + i + 1;
            var isClaimed:Boolean = dayNum <= _totalDays;
            var isTodayTarget:Boolean = (dayNum == _totalDays + 1) && !_todayClaimed;

            var card:Sprite = createDayCard(i, dayNum, petObj, isClaimed, isTodayTarget);
            _rightArea.addChild(card);
         }
      }

      private function createDayCard(slotIndex:int, dayNum:int, p:Object, isClaimed:Boolean, isTodayTarget:Boolean):Sprite
      {
         var card:Sprite = new Sprite();
         var col:int = slotIndex % 4;
         var row:int = slotIndex / 4;
         var isBigCard:Boolean = (slotIndex == 6);

         var cardW:Number = isBigCard ? 234 : 112;
         var cardH:Number = 138;
         card.x = isBigCard ? 244 : col * 122;
         card.y = 38 + row * 148;

         card.graphics.lineStyle(isTodayTarget ? 2.5 : 1.5, isTodayTarget ? 0xffc000 : (isClaimed ? 0x256b3e : 0x16395c));
         card.graphics.beginFill(isTodayTarget ? 0x113152 : 0x091c30, 0.95);
         card.graphics.drawRoundRect(0, 0, cardW, cardH, 8, 8);
         card.graphics.endFill();

         card.graphics.beginFill(isTodayTarget ? 0xff9000 : (isClaimed ? 0x1b4d2e : 0x0d243a));
         card.graphics.drawRoundRect(0, 0, cardW, 22, 6, 6);
         card.graphics.endFill();

         var dayTxt:TextField = createLabel(card, 0, 2, cardW, 20, 11, isTodayTarget ? 0x000000 : (isClaimed ? 0x84f0a7 : 0x8cb1d1), true, TextFormatAlign.CENTER);
         dayTxt.text = "第 " + dayNum + " 天" + (isTodayTarget ? " · 今日" : "");

         var headSlot:Sprite = new Sprite();
         headSlot.x = isBigCard ? 55 : cardW / 2;
         headSlot.y = 66;
         drawCardAvatar(headSlot, p.id);
         card.addChild(headSlot);

         if(!isBigCard)
         {
            var nameTxt:TextField = createLabel(card, 0, 94, cardW, 20, 12, isTodayTarget ? 0xffe57f : 0xffffff, true, TextFormatAlign.CENTER);
            nameTxt.text = p.name;
         }
         else
         {
            var bigName:TextField = createLabel(card, 100, 42, 130, 22, 14, 0xffd700, true);
            bigName.text = p.name + "【" + p.type + "系】";
            var bigDes:TextField = createLabel(card, 100, 66, 130, 36, 11, 0xa0c5e8, false);
            bigDes.text = p.move + "\n终极绝版神宠";
         }

         if(isClaimed)
         {
            var stamp:Sprite = createStamp("已入仓");
            stamp.x = cardW / 2;
            stamp.y = 68;
            card.addChild(stamp);
         }
         else if(isTodayTarget)
         {
            var btnBar:Sprite = new Sprite();
            btnBar.graphics.beginFill(0xff9000);
            btnBar.graphics.drawRoundRect(isBigCard ? 100 : 12, 112, isBigCard ? 110 : 88, 18, 4, 4);
            btnBar.graphics.endFill();
            var btnTxt:TextField = createLabel(btnBar, 0, 1, isBigCard ? 110 : 88, 18, 11, 0xffffff, true, TextFormatAlign.CENTER);
            btnTxt.text = "点击签到";
            card.addChild(btnBar);
         }

         card.buttonMode = true;
         card.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
            selectPet(p);
         });

         return card;
      }

      private function drawCardAvatar(s:Sprite, petId:uint):void
      {
         s.graphics.lineStyle(1.5, 0x00d8ff, 0.6);
         s.graphics.beginFill(0x061424);
         s.graphics.drawCircle(0, 0, 24);
         s.graphics.endFill();

         var l:Loader = new Loader();
         l.contentLoaderInfo.addEventListener(Event.COMPLETE, function(e:Event):void {
            if(l.content)
            {
               l.content.scaleX = l.content.scaleY = 0.85;
               l.content.x = -22;
               l.content.y = -22;
            }
         });
         l.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, function(e:IOErrorEvent):void {});
         l.load(new URLRequest(ClientConfig.getPetHeadPath(petId)));
         s.addChild(l);
      }

      private function createStamp(text:String):Sprite
      {
         var s:Sprite = new Sprite();
         s.graphics.lineStyle(1.5, 0xff7575, 0.9);
         s.graphics.beginFill(0xa82323, 0.85);
         s.graphics.drawRoundRect(-36, -12, 72, 24, 4, 4);
         s.graphics.endFill();
         s.rotation = -12;

         var t:TextField = createLabel(s, -36, -10, 72, 20, 11, 0xffffff, true, TextFormatAlign.CENTER);
         t.text = text;
         return s;
      }

      private function renderChooseMode():void
      {
         for(var i:int = 0; i < PETS.length; i++)
         {
            var p:Object = PETS[i];
            var col:int = i % 4;
            var row:int = i / 4;

            var cell:Sprite = new Sprite();
            cell.x = col * 122;
            cell.y = 36 + row * 88;

            cell.graphics.lineStyle(1.2, _selectedPet == p ? 0xffc000 : 0x16395c);
            cell.graphics.beginFill(_selectedPet == p ? 0x113152 : 0x091c30, 0.95);
            cell.graphics.drawRoundRect(0, 0, 112, 78, 6, 6);
            cell.graphics.endFill();

            var h:Sprite = new Sprite();
            h.x = 28; h.y = 38;
            drawCardAvatar(h, p.id);
            cell.addChild(h);

            var n:TextField = createLabel(cell, 56, 16, 52, 20, 12, 0xffffff, true);
            n.text = p.name;
            var ty:TextField = createLabel(cell, 56, 38, 52, 20, 11, 0x64b5f6);
            ty.text = p.type + "系";

            cell.buttonMode = true;
            (function(targetPet:Object):void {
               cell.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
                  selectPet(targetPet);
                  renderRightArea();
               });
            })(p);

            _rightArea.addChild(cell);
         }
      }

      private function drawBottomBar():void
      {
         var info:TextField = createLabel(_rightArea, 0, 396, 490, 22, 11, 0x88b5e0, false, TextFormatAlign.CENTER);
         info.text = "★ 绝版亲本 0 豆免费直接入仓，融掉可无限次再签补领，全收集无忧！";

         _signBtn = new Sprite();
         _signBtn.x = 135;
         _signBtn.y = 422;
         _signBtn.graphics.lineStyle(2, _todayClaimed ? 0x5a6e82 : 0xffee82);
         _signBtn.graphics.beginFill(_todayClaimed ? 0x364656 : 0xff9000);
         _signBtn.graphics.drawRoundRect(0, 0, 220, 38, 19, 19);
         _signBtn.graphics.endFill();
         _signBtn.buttonMode = !_todayClaimed;

         _signBtnText = createLabel(_signBtn, 0, 8, 220, 26, 15, 0xffffff, true, TextFormatAlign.CENTER);
         _signBtnText.text = _todayClaimed ? "今日已完成签到" : ("【今日签到】领" + _selectedPet.name);
         _signBtn.addEventListener(MouseEvent.CLICK, onSignClick);

         _rightArea.addChild(_signBtn);
      }

      private function onSignClick(e:MouseEvent):void
      {
         if(_todayClaimed)
         {
            Alarm.show("你今天已经签到领取过绝版精灵了，明天 00:00 刷新后再来吧！");
            return;
         }
         if(_waitingResponse) return;

         Alert.show("今日签到免费领取 1 级【" + _selectedPet.name + "】？精灵将直接存入仓库。", function():void {
            _waitingResponse = true;
            SocketConnection.addCmdListener(CommandID.PET_COLLECT, onCollectResponse);
            SocketConnection.send(CommandID.PET_COLLECT, 900001, _selectedPet.id);
         });
      }

      private function onCollectResponse(e:SocketEvent):void
      {
         _waitingResponse = false;
         SocketConnection.removeCmdListener(CommandID.PET_COLLECT, onCollectResponse);
         var body:ByteArray = e.data as ByteArray;
         if(!body) return;

         var petId:uint = body.readUnsignedInt();
         var catchTime:uint = body.readUnsignedInt();
         var coins:uint = body.readUnsignedInt();
         var error:uint = body.readUnsignedInt();

         if(error != 0)
         {
            Alarm.show(error == 5002 ? "你今天已经签到领取过绝版精灵了，明天再来吧！" : "签到未完成，请重试。");
            return;
         }

         _todayClaimed = true;
         _totalDays++;
         PetManager.addStorage(petId, catchTime);
         renderRightArea();
         Alarm.show("签到成功！1级【" + PetXMLInfo.getName(petId) + "】已直接存入你的精灵仓库！明日记得继续来签到！");
      }

      public function queryStatus():void
      {
         SocketConnection.addCmdListener(CommandID.IS_COLLECT, function(e:SocketEvent):void {
            SocketConnection.removeCmdListener(CommandID.IS_COLLECT, arguments.callee);
            var b:ByteArray = e.data as ByteArray;
            if(!b || b.length < 8) return;
            var gid:uint = b.readUnsignedInt();
            if(gid != 900001) return;
            var flag:uint = b.readUnsignedInt();
            _todayClaimed = (flag == 1);
            if(b.bytesAvailable >= 4)
            {
               _totalDays = b.readUnsignedInt();
            }
            renderRightArea();
         });
         SocketConnection.send(CommandID.IS_COLLECT, 900001);
      }

      private function createLabel(parent:Sprite, x:Number, y:Number, w:Number, h:Number, size:int, color:uint, bold:Boolean = false, align:String = "left"):TextField
      {
         var t:TextField = new TextField();
         t.x = x; t.y = y; t.width = w; t.height = h;
         t.defaultTextFormat = new TextFormat("Microsoft YaHei, SimHei, Arial", size, color, bold, null, null, null, null, align);
         t.selectable = false;
         t.mouseEnabled = false;
         parent.addChild(t);
         return t;
      }
   }
}
