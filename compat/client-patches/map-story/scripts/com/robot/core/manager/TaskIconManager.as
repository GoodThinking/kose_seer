package com.robot.core.manager
{
   import com.robot.core.event.MapEvent;
   import com.robot.core.net.SocketConnection;
   import flash.display.DisplayObject;
   import flash.display.DisplayObjectContainer;
   import flash.display.InteractiveObject;
   import flash.display.Loader;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.external.ExternalInterface;
   import flash.filters.DropShadowFilter;
   import flash.filters.GlowFilter;
   import flash.net.URLRequest;
   import flash.net.navigateToURL;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.text.TextFormatAlign;
   import flash.utils.ByteArray;
   import org.taomee.component.UIComponent;
   import org.taomee.component.containers.HBox;
   import org.taomee.component.control.UIMovieClip;
   import org.taomee.component.layout.FlowLayout;
   import org.taomee.ds.HashMap;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.DisplayUtil;
   import org.taomee.utils.Utils;
   
   public class TaskIconManager
   {
      
      private static const PLAYMODES_CMD:uint = 64020;
      
      private static var box:HBox;
      
      private static var _loader:Loader;
      
      private static var iconArray:HashMap = new HashMap();
      
      private static var filter:DropShadowFilter = new DropShadowFilter(5,45,0,0.6);
      
      private static var _portalSp:Sprite;
      
      private static var _portalTick:Number = 0;
      
      private static var _panelOverlay:Sprite;
      
      private static var _panelBody:Sprite;
      
      private static var _statusTf:TextField;
      
      private static var _activeTab:int = 0;
      
      private static var _skillPage:int = 0;
      
      private static var _skillMaxPage:int = 0;
      
      private static var _traitPage:int = 0;
      
      private static var _traitMaxPage:int = 0;
      
      private static var _selectedTraitId:uint = 0;
      
      private static var _selectedTraitName:String = "";
      
      private static var _cmdBound:Boolean = false;
      
      private static var _state:Object = null;
      
      public function TaskIconManager()
      {
         super();
      }
      
      public static function setup(param1:Loader) : void
      {
         _loader = param1;
         box = new HBox();
         box.width = MainManager.getStageWidth() - 15;
         box.height = 94;
         box.gap = 10;
         box.halign = FlowLayout.RIGHT;
         box.valign = FlowLayout.MIDLLE;
         LevelManager.iconLevel.addChild(box);
         var guideIcon:InteractiveObject = getIcon("new_player_icon");
         if(guideIcon != null)
         {
            ToolTipManager.add(guideIcon,"赛尔号星际攻略档案（新窗口打开）");
            guideIcon.addEventListener(MouseEvent.CLICK,onOpenGuide);
            addIcon(guideIcon);
         }
         try
         {
            var trialIcon:Sprite = createTopTrialIcon();
            ToolTipManager.add(trialIcon,"星际试炼中心（无尽爬塔 · 技能回忆 · 特性觉醒）");
            trialIcon.addEventListener(MouseEvent.CLICK,onOpenTrialPanel);
            addIcon(trialIcon);
            MapManager.addEventListener(MapEvent.MAP_SWITCH_COMPLETE,onMapSwitchComplete);
         }
         catch(e:Error)
         {
         }
      }
      
      private static function createTopTrialIcon() : Sprite
      {
         var sp:Sprite = new Sprite();
         sp.buttonMode = true;
         sp.mouseChildren = false;
         sp.graphics.lineStyle(2,0x7EE6FF,0.95);
         sp.graphics.beginFill(0x0D3B66,0.95);
         sp.graphics.drawCircle(24,24,22);
         sp.graphics.endFill();
         sp.graphics.lineStyle(1,0xC6F4FF,0.7);
         sp.graphics.beginFill(0x1B6CA8,0.9);
         sp.graphics.drawCircle(24,24,17);
         sp.graphics.endFill();
         var tf:TextField = makeText("试炼",13,0xFFFFFF,true,48,22,TextFormatAlign.CENTER);
         tf.x = 0;
         tf.y = 14;
         sp.addChild(tf);
         return sp;
      }
      
      private static function onMapSwitchComplete(param1:MapEvent) : void
      {
         try
         {
            refreshScenePortal();
         }
         catch(e:Error)
         {
         }
      }
      
      private static function refreshScenePortal() : void
      {
         if(_portalSp != null)
         {
            _portalSp.removeEventListener(Event.ENTER_FRAME,onPortalFrame);
            ToolTipManager.remove(_portalSp);
            DisplayUtil.removeForParent(_portalSp);
            _portalSp = null;
         }
         var mapId:uint = MainManager.actorInfo != null ? uint(MainManager.actorInfo.mapID) : 0;
         if(mapId != 102 && mapId != 500)
         {
            return;
         }
         var parentLayer:DisplayObjectContainer = null;
         if(MapManager.currentMap != null && MapManager.currentMap.depthLevel != null)
         {
            parentLayer = MapManager.currentMap.depthLevel;
         }
         else
         {
            parentLayer = LevelManager.mapLevel;
         }
         if(parentLayer == null)
         {
            return;
         }
         _portalSp = new Sprite();
         _portalSp.buttonMode = true;
         _portalSp.mouseChildren = false;
         var baseGlow:Sprite = new Sprite();
         baseGlow.name = "ring";
         baseGlow.graphics.lineStyle(3,0x66E0FF,0.9);
         baseGlow.graphics.beginFill(0x0C3A6B,0.55);
         baseGlow.graphics.drawEllipse(-34,-14,68,28);
         baseGlow.graphics.endFill();
         baseGlow.y = 26;
         _portalSp.addChild(baseGlow);
         var core:Sprite = new Sprite();
         core.name = "core";
         core.graphics.lineStyle(2.5,0xA8F0FF,0.95);
         core.graphics.beginFill(0x165E9B,0.82);
         core.graphics.drawCircle(0,0,22);
         core.graphics.endFill();
         core.graphics.beginFill(0x7EE8FF,0.9);
         core.graphics.drawCircle(0,0,10);
         core.graphics.endFill();
         core.filters = [new GlowFilter(0x33CCFF,0.85,14,14,2)];
         _portalSp.addChild(core);
         var tagBg:Sprite = new Sprite();
         tagBg.graphics.lineStyle(1,0x7EE6FF,0.9);
         tagBg.graphics.beginFill(0x07203B,0.88);
         tagBg.graphics.drawRoundRect(-48,-46,96,20,10,10);
         tagBg.graphics.endFill();
         var tagTf:TextField = makeText("星际试炼塔",12,0xE8F8FF,true,96,18,TextFormatAlign.CENTER);
         tagTf.x = -48;
         tagTf.y = -45;
         tagBg.addChild(tagTf);
         _portalSp.addChild(tagBg);
         if(mapId == 102)
         {
            _portalSp.x = 765;
            _portalSp.y = 325;
         }
         else
         {
            _portalSp.x = 175;
            _portalSp.y = 375;
         }
         ToolTipManager.add(_portalSp,"星际试炼塔（点击进入无尽爬塔、免费技能回忆与特性定向觉醒）");
         _portalSp.addEventListener(MouseEvent.CLICK,onOpenTrialPanel);
         _portalSp.addEventListener(Event.ENTER_FRAME,onPortalFrame);
         parentLayer.addChild(_portalSp);
      }
      
      private static function onPortalFrame(param1:Event) : void
      {
         if(_portalSp == null)
         {
            return;
         }
         _portalTick += 0.08;
         var core:DisplayObject = _portalSp.getChildByName("core");
         if(core != null)
         {
            core.y = Math.sin(_portalTick) * 4;
         }
      }
      
      private static function ensureCmdListener() : void
      {
         if(_cmdBound)
         {
            return;
         }
         _cmdBound = true;
         SocketConnection.addCmdListener(PLAYMODES_CMD,onPlayModesResp);
      }
      
      private static function onOpenTrialPanel(param1:MouseEvent = null) : void
      {
         try
         {
            if(param1 != null)
            {
               param1.stopPropagation();
            }
            ensureCmdListener();
            showPanelShell();
            SocketConnection.send(PLAYMODES_CMD,1,0,0);
         }
         catch(e:Error)
         {
         }
      }
      
      private static function closeTrialPanel(param1:MouseEvent = null) : void
      {
         if(_panelOverlay != null)
         {
            DisplayUtil.removeForParent(_panelOverlay);
            _panelOverlay = null;
            _panelBody = null;
            _statusTf = null;
         }
      }
      
      private static function showPanelShell() : void
      {
         closeTrialPanel();
         _panelOverlay = new Sprite();
         _panelOverlay.graphics.beginFill(0x000814,0.58);
         _panelOverlay.graphics.drawRect(0,0,960,560);
         _panelOverlay.graphics.endFill();
         var panel:Sprite = new Sprite();
         panel.x = 140;
         panel.y = 55;
         panel.graphics.lineStyle(2,0x5CC8FF,0.95);
         panel.graphics.beginFill(0x082038,0.96);
         panel.graphics.drawRoundRect(0,0,680,450,14,14);
         panel.graphics.endFill();
         panel.graphics.beginFill(0x0E355C,0.95);
         panel.graphics.drawRoundRect(2,2,676,46,12,12);
         panel.graphics.endFill();
         panel.filters = [new DropShadowFilter(6,90,0x000000,0.7,16,16)];
         var title:TextField = makeText("星际试炼中心 · 无尽爬塔 & 精灵特训",16,0xE8F8FF,true,420,26,TextFormatAlign.LEFT);
         title.x = 18;
         title.y = 12;
         panel.addChild(title);
         var closeBtn:Sprite = makePillButton("× 关闭",68,26,0x2B3F56,0x7EE6FF,closeTrialPanel);
         closeBtn.x = 598;
         closeBtn.y = 11;
         panel.addChild(closeBtn);
         var tabNames:Array = ["无尽星际爬塔","免费技能回忆","特性定向觉醒"];
         var i:int = 0;
         while(i < tabNames.length)
         {
            var isAct:Boolean = _activeTab == i;
            var tBtn:Sprite = makePillButton(tabNames[i],136,28,isAct ? 0x1A73B8 : 0x0F2D4B,isAct ? 0xA8F0FF : 0x4E8BB5,onTabClick);
            tBtn.name = "tab:" + i;
            tBtn.x = 18 + i * 146;
            tBtn.y = 58;
            panel.addChild(tBtn);
            i++;
         }
         _panelBody = new Sprite();
         _panelBody.x = 18;
         _panelBody.y = 96;
         panel.addChild(_panelBody);
         _statusTf = makeText("正在连接星际试炼服务器...",12,0x8CD8FF,false,644,22,TextFormatAlign.LEFT);
         _statusTf.x = 18;
         _statusTf.y = 420;
         panel.addChild(_statusTf);
         _panelOverlay.addChild(panel);
         LevelManager.appLevel.addChild(_panelOverlay);
         if(_state != null)
         {
            renderPanelBody();
         }
      }
      
      private static function onTabClick(param1:MouseEvent) : void
      {
         var tgt:DisplayObject = param1.currentTarget as DisplayObject;
         if(tgt == null || tgt.name.indexOf("tab:") != 0)
         {
            return;
         }
         _activeTab = int(tgt.name.substr(4));
         showPanelShell();
      }
      
      private static function onPlayModesResp(param1:SocketEvent) : void
      {
         try
         {
            var raw:ByteArray = param1.data as ByteArray;
            if(raw == null || raw.bytesAvailable < 4)
            {
               return;
            }
            var len:uint = raw.readUnsignedInt();
            var text:String = raw.readUTFBytes(Math.min(len,raw.bytesAvailable));
            _state = parsePayload(text);
            if(_panelOverlay != null)
            {
               renderPanelBody();
            }
         }
         catch(e:Error)
         {
         }
      }
      
      private static function parsePayload(text:String) : Object
      {
         var obj:Object = new Object();
         obj.notice = "";
         obj.auraTitle = "新手赛尔";
         obj.dexCount = 0;
         obj.bountyDone = 0;
         obj.bountyTotal = 10;
         obj.nextHint = "";
         obj.curFloor = 1;
         obj.bestFloor = 0;
         obj.crystals = 0;
         obj.buffs = [];
         obj.pending = [];
         obj.leadId = 0;
         obj.leadName = "无首发精灵";
         obj.leadTraitId = 0;
         obj.leadTraitName = "暂无特性";
         obj.eqSkills = [];
         obj.skills = [];
         obj.traits = [];
         var lines:Array = text.split("\n");
         var i:int = 0;
         while(i < lines.length)
         {
            var line:String = lines[i];
            var eq:int = line.indexOf("=");
            if(eq > 0)
            {
               var k:String = line.substr(0,eq);
               var v:String = line.substr(eq + 1);
               if(k == "NOTICE")
               {
                  obj.notice = v;
               }
               else if(k == "AURA")
               {
                  var ap:Array = v.split("|");
                  obj.auraTitle = ap.length > 0 && ap[0] != "" ? ap[0] : "新手赛尔";
                  obj.dexCount = ap.length > 1 ? int(ap[1]) : 0;
                  obj.bountyDone = ap.length > 2 ? int(ap[2]) : 0;
                  obj.bountyTotal = ap.length > 3 && int(ap[3]) > 0 ? int(ap[3]) : 10;
                  obj.nextHint = ap.length > 4 ? ap[4] : "";
               }
               else if(k == "TOWER")
               {
                  var tp:Array = v.split("|");
                  obj.curFloor = tp.length > 0 && int(tp[0]) > 0 ? int(tp[0]) : 1;
                  obj.bestFloor = tp.length > 1 ? int(tp[1]) : 0;
                  obj.crystals = tp.length > 2 ? int(tp[2]) : 0;
               }
               else if(k == "BUFFS" && v.length > 0)
               {
                  obj.buffs = parseColonItems(v,2);
               }
               else if(k == "PENDING" && v.length > 0)
               {
                  obj.pending = parseColonItems(v,3);
               }
               else if(k == "LEAD")
               {
                  var lp:Array = v.split("|");
                  obj.leadId = lp.length > 0 ? int(lp[0]) : 0;
                  obj.leadName = lp.length > 1 && lp[1] != "" ? lp[1] : "无首发精灵";
                  obj.leadTraitId = lp.length > 2 ? int(lp[2]) : 0;
                  obj.leadTraitName = lp.length > 3 && lp[3] != "" ? lp[3] : "暂无特性";
               }
               else if(k == "EQSKILLS" && v.length > 0)
               {
                  obj.eqSkills = parseColonItems(v,2);
               }
               else if(k == "SKILLS" && v.length > 0)
               {
                  obj.skills = parseColonItems(v,3);
               }
               else if(k == "TRAITS" && v.length > 0)
               {
                  obj.traits = parseColonItems(v,3);
               }
            }
            i++;
         }
         return obj;
      }
      
      private static function parseColonItems(v:String, cols:int) : Array
      {
         var out:Array = [];
         var items:Array = v.split(";");
         var i:int = 0;
         while(i < items.length)
         {
            if(items[i].length > 0)
            {
               var p:Array = items[i].split(":");
               var rec:Object = new Object();
               rec.a = p.length > 0 ? p[0] : "";
               rec.b = p.length > 1 ? p[1] : "";
               rec.c = cols >= 3 && p.length > 2 ? p[2] : "";
               out.push(rec);
            }
            i++;
         }
         return out;
      }
      
      private static function renderPanelBody() : void
      {
         try
         {
            if(_panelBody == null || _state == null)
            {
               return;
            }
            while(_panelBody.numChildren > 0)
            {
               _panelBody.removeChildAt(0);
            }
            if(_statusTf != null)
            {
               if(_state.notice != "")
               {
                  _statusTf.text = "提示：" + _state.notice;
               }
               else
               {
                  _statusTf.text = "称号【" + _state.auraTitle + "】 · 图鉴 " + _state.dexCount + " 只（" + _state.nextHint + "） · 赏金 " + _state.bountyDone + "/" + _state.bountyTotal + " · 特性晶石 " + _state.crystals + " 颗";
               }
            }
            if(_activeTab == 0)
            {
               renderTowerTab();
            }
            else if(_activeTab == 1)
            {
               renderSkillsTab();
            }
            else
            {
               renderTraitsTab();
            }
         }
         catch(e:Error)
         {
         }
      }
      
      private static function renderTowerTab() : void
      {
         var card:Sprite = drawBox(644,74,0x0D2B4B,0x3D80B2);
         _panelBody.addChild(card);
         var t1:TextField = makeText("当前挑战：第 " + _state.curFloor + " 层     |     历史最高：第 " + _state.bestFloor + " 层     |     特性晶石：" + _state.crystals + " 颗",15,0xFFFFFF,true,620,24,TextFormatAlign.LEFT);
         t1.x = 14;
         t1.y = 12;
         card.addChild(t1);
         var buffText:String = "本轮已装备肉鸽词条：";
         if(_state.buffs.length == 0)
         {
            buffText += "暂无（通关当前层后可 3 选 1 叠加词条）";
         }
         else
         {
            var bi:int = 0;
            while(bi < _state.buffs.length)
            {
               buffText += (bi > 0 ? "  +  " : "") + _state.buffs[bi].b;
               bi++;
            }
         }
         var t2:TextField = makeText(buffText,12,0x8EE4FF,false,620,26,TextFormatAlign.LEFT);
         t2.x = 14;
         t2.y = 42;
         card.addChild(t2);
         if(_state.pending.length > 0)
         {
            var pt:TextField = makeText("请从下方 3 个战后肉鸽词条中点击选择 1 个装备：",13,0xFFE07D,true,620,22,TextFormatAlign.LEFT);
            pt.x = 4;
            pt.y = 88;
            _panelBody.addChild(pt);
            var pi:int = 0;
            while(pi < _state.pending.length)
            {
               var item:Object = _state.pending[pi];
               var pickIdx:int = pi + 1;
               var cBtn:Sprite = drawBox(204,112,0x103B66,0x7EE6FF);
               cBtn.name = "pick:" + pickIdx;
               cBtn.buttonMode = true;
               cBtn.mouseChildren = false;
               cBtn.x = pi * 220;
               cBtn.y = 116;
               var cn:TextField = makeText(item.b,14,0xFFFFFF,true,184,26,TextFormatAlign.CENTER);
               cn.x = 10;
               cn.y = 18;
               cBtn.addChild(cn);
               var cd:TextField = makeText(item.c,12,0xB8ECFF,false,184,42,TextFormatAlign.CENTER);
               cd.wordWrap = true;
               cd.x = 10;
               cd.y = 50;
               cBtn.addChild(cd);
               var cf:TextField = makeText("[ 点击装备 ]",12,0x72FFCF,true,184,20,TextFormatAlign.CENTER);
               cf.x = 10;
               cf.y = 86;
               cBtn.addChild(cf);
               cBtn.addEventListener(MouseEvent.CLICK,onPickBuffClick);
               _panelBody.addChild(cBtn);
               pi++;
            }
         }
         else
         {
            var info:Sprite = drawBox(644,118,0x0A2440,0x2C5D85);
            info.y = 92;
            _panelBody.addChild(info);
            var desc:TextField = makeText("玩法说明：\n• 挑战由经典高阶终态精灵把守的无尽层数，层数越高对手越强、赛尔豆与特性晶石奖励越丰厚。\n• 每通过 1 层即可在面板中 3 选 1 叠加肉鸽强化词条（增伤、吸血、减伤、回合回血、反伤、斩杀等）。\n• 突破第 10 层可自动达成【无尽征服者】极限赏金并领取 25 颗特性晶石！",12,0xCFEAFF,false,616,96,TextFormatAlign.LEFT);
            desc.wordWrap = true;
            desc.x = 14;
            desc.y = 12;
            info.addChild(desc);
         }
         var fightBtn:Sprite = makePillButton("开始挑战 第 " + _state.curFloor + " 层",220,38,0x1578C2,0x9CF0FF,onStartTowerFight);
         fightBtn.x = 212;
         fightBtn.y = 250;
         _panelBody.addChild(fightBtn);
      }
      
      private static function onPickBuffClick(param1:MouseEvent) : void
      {
         var tgt:DisplayObject = param1.currentTarget as DisplayObject;
         if(tgt == null || tgt.name.indexOf("pick:") != 0)
         {
            return;
         }
         var idx:int = int(tgt.name.substr(5));
         if(idx > 0)
         {
            SocketConnection.send(PLAYMODES_CMD,3,idx,0);
         }
      }
      
      private static function onStartTowerFight(param1:MouseEvent) : void
      {
         closeTrialPanel();
         SocketConnection.send(PLAYMODES_CMD,2,0,0);
      }
      
      private static function renderSkillsTab() : void
      {
         var eqStr:String = "";
         var ei:int = 0;
         while(ei < _state.eqSkills.length)
         {
            eqStr += (ei > 0 ? " / " : "") + (ei + 1) + "." + _state.eqSkills[ei].b;
            ei++;
         }
         var head:TextField = makeText("当前首发精灵：【" + _state.leadName + "】   已装备技能：" + (eqStr != "" ? eqStr : "无"),13,0xE8F8FF,true,640,24,TextFormatAlign.LEFT);
         _panelBody.addChild(head);
         var perPage:int = 7;
         var total:int = _state.skills.length;
         _skillMaxPage = Math.max(0,Math.ceil(total / perPage) - 1);
         if(_skillPage > _skillMaxPage)
         {
            _skillPage = _skillMaxPage;
         }
         var start:int = _skillPage * perPage;
         var end:int = Math.min(total,start + perPage);
         var row:int = 0;
         var i:int = start;
         while(i < end)
         {
            var sk:Object = _state.skills[i];
            var line:Sprite = drawBox(644,32,row % 2 == 0 ? 0x0C2B4A : 0x09223B,0x275780);
            line.y = 30 + row * 36;
            var lbl:TextField = makeText(sk.b + "   (威力 " + sk.c + " · ID " + sk.a + ")",12,0xE8F8FF,false,380,22,TextFormatAlign.LEFT);
            lbl.x = 12;
            lbl.y = 6;
            line.addChild(lbl);
            var sIdx:int = 1;
            while(sIdx <= 4)
            {
               var sb:Sprite = makePillButton("装入" + sIdx,54,22,0x145B94,0x7EE6FF,onLearnSkillClick);
               sb.name = "learn:" + sk.a + ":" + sIdx;
               sb.x = 398 + (sIdx - 1) * 60;
               sb.y = 5;
               line.addChild(sb);
               sIdx++;
            }
            _panelBody.addChild(line);
            row++;
            i++;
         }
         if(total == 0)
         {
            var emptyTf:TextField = makeText("请先在精灵背包中设置一只首发精灵。",13,0x99C4E0,false,400,24,TextFormatAlign.LEFT);
            emptyTf.y = 60;
            _panelBody.addChild(emptyTf);
         }
         if(_skillMaxPage > 0)
         {
            var prevB:Sprite = makePillButton("上一页",76,26,0x143A5E,0x7EE6FF,onSkillPageClick);
            prevB.name = "spage:-1";
            prevB.x = 200;
            prevB.y = 286;
            _panelBody.addChild(prevB);
            var pgTf:TextField = makeText("第 " + (_skillPage + 1) + " / " + (_skillMaxPage + 1) + " 页",12,0xCFEAFF,false,90,22,TextFormatAlign.CENTER);
            pgTf.x = 280;
            pgTf.y = 290;
            _panelBody.addChild(pgTf);
            var nextB:Sprite = makePillButton("下一页",76,26,0x143A5E,0x7EE6FF,onSkillPageClick);
            nextB.name = "spage:1";
            nextB.x = 374;
            nextB.y = 286;
            _panelBody.addChild(nextB);
         }
      }
      
      private static function onLearnSkillClick(param1:MouseEvent) : void
      {
         var tgt:DisplayObject = param1.currentTarget as DisplayObject;
         if(tgt == null || tgt.name.indexOf("learn:") != 0)
         {
            return;
         }
         var parts:Array = tgt.name.split(":");
         if(parts.length >= 3)
         {
            SocketConnection.send(PLAYMODES_CMD,4,uint(parts[1]),int(parts[2]));
         }
      }
      
      private static function onSkillPageClick(param1:MouseEvent) : void
      {
         var tgt:DisplayObject = param1.currentTarget as DisplayObject;
         if(tgt == null || tgt.name.indexOf("spage:") != 0)
         {
            return;
         }
         var delta:int = int(tgt.name.substr(6));
         var nextP:int = _skillPage + delta;
         if(nextP >= 0 && nextP <= _skillMaxPage)
         {
            _skillPage = nextP;
            renderPanelBody();
         }
      }
      
      private static function renderTraitsTab() : void
      {
         var head:TextField = makeText("首发精灵：【" + _state.leadName + "】   当前特性：「" + _state.leadTraitName + "」   特性晶石：" + _state.crystals + " 颗（每次消耗 5 颗）",13,0xE8F8FF,true,644,24,TextFormatAlign.LEFT);
         _panelBody.addChild(head);
         var perPage:int = 18;
         var total:int = _state.traits.length;
         _traitMaxPage = Math.max(0,Math.ceil(total / perPage) - 1);
         if(_traitPage > _traitMaxPage)
         {
            _traitPage = _traitMaxPage;
         }
         var start:int = _traitPage * perPage;
         var end:int = Math.min(total,start + perPage);
         var idx:int = 0;
         var i:int = start;
         while(i < end)
         {
            var tr:Object = _state.traits[i];
            var tid:uint = uint(tr.a);
            var isSel:Boolean = _selectedTraitId == tid;
            var col:int = idx % 3;
            var row:int = int(idx / 3);
            var cell:Sprite = drawBox(208,34,isSel ? 0x1B6EA8 : 0x0C2A48,isSel ? 0xFFE07D : 0x356D9A);
            cell.name = "trait:" + tid + ":" + tr.b;
            cell.buttonMode = true;
            cell.mouseChildren = false;
            cell.x = col * 218;
            cell.y = 30 + row * 38;
            var tf:TextField = makeText(tr.b + " (#" + tr.a + ")",12,isSel ? 0xFFF3B0 : 0xE8F8FF,isSel,196,22,TextFormatAlign.CENTER);
            tf.x = 6;
            tf.y = 7;
            cell.addChild(tf);
            if(tr.c != "")
            {
               ToolTipManager.add(cell,tr.b + "：" + tr.c);
            }
            cell.addEventListener(MouseEvent.CLICK,onSelectTraitClick);
            _panelBody.addChild(cell);
            idx++;
            i++;
         }
         var prevB:Sprite = makePillButton("上一页",72,28,0x143A5E,0x7EE6FF,onTraitPageClick);
         prevB.name = "tpage:-1";
         prevB.x = 0;
         prevB.y = 268;
         _panelBody.addChild(prevB);
         var nextB:Sprite = makePillButton("下一页",72,28,0x143A5E,0x7EE6FF,onTraitPageClick);
         nextB.name = "tpage:1";
         nextB.x = 80;
         nextB.y = 268;
         _panelBody.addChild(nextB);
         var btnText:String = _selectedTraitId > 0 ? "消耗 5 晶石定向觉醒【" + _selectedTraitName + "】" : "请先点击上方选择目标特性";
         var forgeBtn:Sprite = makePillButton(btnText,290,32,_selectedTraitId > 0 ? 0x1578C2 : 0x263E55,_selectedTraitId > 0 ? 0xFFE07D : 0x5C7B96,onConfirmTraitForge);
         forgeBtn.x = 354;
         forgeBtn.y = 266;
         _panelBody.addChild(forgeBtn);
      }
      
      private static function onSelectTraitClick(param1:MouseEvent) : void
      {
         var tgt:DisplayObject = param1.currentTarget as DisplayObject;
         if(tgt == null || tgt.name.indexOf("trait:") != 0)
         {
            return;
         }
         var rest:String = tgt.name.substr(6);
         var sep:int = rest.indexOf(":");
         if(sep > 0)
         {
            _selectedTraitId = uint(rest.substr(0,sep));
            _selectedTraitName = rest.substr(sep + 1);
            renderPanelBody();
         }
      }
      
      private static function onTraitPageClick(param1:MouseEvent) : void
      {
         var tgt:DisplayObject = param1.currentTarget as DisplayObject;
         if(tgt == null || tgt.name.indexOf("tpage:") != 0)
         {
            return;
         }
         var delta:int = int(tgt.name.substr(6));
         var nextP:int = _traitPage + delta;
         if(nextP >= 0 && nextP <= _traitMaxPage)
         {
            _traitPage = nextP;
            renderPanelBody();
         }
      }
      
      private static function onConfirmTraitForge(param1:MouseEvent) : void
      {
         if(_selectedTraitId == 0)
         {
            return;
         }
         SocketConnection.send(PLAYMODES_CMD,5,_selectedTraitId,0);
      }
      
      private static function drawBox(w:Number, h:Number, fill:uint, border:uint) : Sprite
      {
         var sp:Sprite = new Sprite();
         sp.graphics.lineStyle(1,border,0.9);
         sp.graphics.beginFill(fill,0.92);
         sp.graphics.drawRoundRect(0,0,w,h,8,8);
         sp.graphics.endFill();
         return sp;
      }
      
      private static function makePillButton(label:String, w:Number, h:Number, fill:uint, border:uint, onClick:Function) : Sprite
      {
         var sp:Sprite = new Sprite();
         sp.buttonMode = true;
         sp.mouseChildren = false;
         sp.graphics.lineStyle(1.2,border,0.95);
         sp.graphics.beginFill(fill,0.95);
         sp.graphics.drawRoundRect(0,0,w,h,h / 2,h / 2);
         sp.graphics.endFill();
         var tf:TextField = makeText(label,12,0xFFFFFF,true,w,h - 4,TextFormatAlign.CENTER);
         tf.y = Math.max(2,(h - 18) / 2);
         sp.addChild(tf);
         if(onClick != null)
         {
            sp.addEventListener(MouseEvent.CLICK,onClick);
         }
         return sp;
      }
      
      private static function makeText(txt:String, size:int, color:uint, bold:Boolean, w:Number, h:Number, align:String) : TextField
      {
         var tf:TextField = new TextField();
         tf.width = w;
         tf.height = h;
         tf.selectable = false;
         tf.mouseEnabled = false;
         var fmt:TextFormat = new TextFormat("Microsoft YaHei,SimHei,_sans",size,color,bold);
         fmt.align = align;
         tf.defaultTextFormat = fmt;
         tf.text = txt;
         return tf;
      }
      
      private static function onOpenGuide(param1:MouseEvent) : void
      {
         var mapId:uint = MainManager.actorInfo != null ? uint(MainManager.actorInfo.mapID) : 0;
         var uid:uint = uint(MainManager.actorID);
         try
         {
            if(ExternalInterface.available)
            {
               ExternalInterface.call("openSeerGuide",mapId,uid);
               return;
            }
         }
         catch(e:Error)
         {
         }
         var qs:String = "";
         if(mapId > 0)
         {
            qs += "map=" + mapId;
         }
         if(uid > 0)
         {
            qs += (qs.length > 0 ? "&" : "") + "uid=" + uid;
         }
         navigateToURL(new URLRequest(qs.length > 0 ? "/guide/index.html?" + qs : "/guide/index.html"),"_blank");
      }
      
      public static function set rightInset(param1:Number) : void
      {
         box.width = MainManager.getStageWidth() - 15 - param1;
      }
      
      public static function getIcon(param1:String) : InteractiveObject
      {
         return Utils.getDisplayObjectFromLoader(param1,_loader) as InteractiveObject;
      }
      
      public static function addIcon(param1:DisplayObject) : void
      {
         var _loc2_:UIComponent = null;
         if(!iconArray.containsKey(param1))
         {
            _loc2_ = new UIMovieClip(param1);
            box.appendAt(_loc2_,0);
            param1.filters = [filter];
            iconArray.add(param1,_loc2_);
         }
      }
      
      public static function delIcon(param1:DisplayObject) : void
      {
         var _loc2_:UIComponent = null;
         if(iconArray.containsKey(param1))
         {
            _loc2_ = iconArray.getValue(param1) as UIComponent;
            box.remove(_loc2_);
            iconArray.remove(param1);
         }
      }
   }
}
