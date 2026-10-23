package com.robot.core.ui.nono
{
   import com.robot.core.CommandID;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.ItemXMLInfo;
   import com.robot.core.config.xml.MapXMLInfo;
   import com.robot.core.event.RobotEvent;
   import com.robot.core.info.NonoInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.manager.NonoManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.manager.TaskIconManager;
   import com.robot.core.mode.AppModel;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alert;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.app.buyPetProps.BuyPetPropsController;
   import flash.utils.ByteArray;
   import flash.utils.setTimeout;
   import flash.utils.clearTimeout;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.TaomeeManager;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import org.taomee.effect.ColorFilter;
   import org.taomee.manager.EventManager;
   import org.taomee.utils.DisplayUtil;
   
   public class NonoShortcut
   {
      
      private static var _mainUI:Sprite;
      
      private static var _bgmc:Sprite;
      
      private static var _cureBtn:SimpleButton;
      
      private static var _fhBtn:SimpleButton;
      
      private static var _jnBtn:SimpleButton;
      
      private static var _powerBtn:SimpleButton;
      
      private static var _petStorageBtn:SimpleButton;
      
      private static var _petDiscoverBtn:SimpleButton;
      
      private static var _appModel:AppModel;
      
      private static var _nonoPanel:AppModel;
      
      private static var _nonoInfoPanel:AppModel;
      
      private static var _info:NonoInfo;
      
      private static var _flag:Boolean;
      
      private static var _canShowA:Array;
      
      private static var _tipA:Array;
      
      private static var _handlerFunA:Array;
      
      private static var _itemA:Array;
      
      private static var _petStorage:AppModel;
      
      private static const _length:uint = 8;
      
      private static var _newShowA:Array = ["700011","700015","700017"];
      
      private static var _newTipA:Array = ["精灵仓库","精灵追踪","飞行模式"];
      private static var _skillPanel:AppModel;
      private static var _teams:Object = {};
      private static var _teamPending:Boolean = false;
      private static var _teamTimeout:uint;
      
      public function NonoShortcut()
      {
         super();
      }
      
      private static function makeAry() : void
      {
         if(MainManager.actorInfo.actionType == 0)
         {
            _newTipA[2] = "飞行模式";
         }
         else
         {
            _newTipA[2] = "飞行模式";
         }
         _canShowA = ["1","2","3","4"];
         _tipA = ["精灵治疗","跟随主人","经验分配","给NoNo充电"];
         _handlerFunA = [onCure,onFollow,onjn,onPower,hide,hide];
         if(_flag == false)
         {
            _canShowA[1] = "2";
            _tipA[1] = "跟随主人";
            if(!MainManager.actorInfo.superNono)
            {
               _canShowA[3] = "4";
               _tipA[3] = "给NoNo充电";
            }
            else
            {
               _canShowA[3] = null;
               _tipA[3] = null;
            }
         }
         else
         {
            _canShowA[1] = "2_1";
            _tipA[1] = "回家休息";
            _canShowA[3] = null;
            _tipA[3] = null;
         }
         var _loc1_:int = 0;
         while(_loc1_ < _newShowA.length)
         {
            if(Boolean(_info.func[uint(_newShowA[_loc1_]) - 700001]))
            {
               if(ItemXMLInfo.getVipOnly(uint(_newShowA[_loc1_])))
               {
                  if(MainManager.actorInfo.superNono)
                  {
                     _canShowA.push(_newShowA[_loc1_]);
                     _tipA.push(_newTipA[_loc1_]);
                  }
               }
               else if(MainManager.actorInfo.superNono)
               {
                  _canShowA.push(_newShowA[_loc1_]);
                  _tipA.push(_newTipA[_loc1_]);
               }
               else if(NonoManager.info.ai >= ItemXMLInfo.getAiLevel(uint(_newShowA[_loc1_])))
               {
                  _canShowA.push(_newShowA[_loc1_]);
                  _tipA.push(_newTipA[_loc1_]);
               }
            }
            _loc1_++;
         }
         _canShowA[7] = "qx_services";
         _tipA[7] = "随身服务：换技能、商城、队伍与战斗设置";
         _handlerFunA[7] = showServices;
      }
      
      private static function addKeyBg() : void
      {
         var _loc1_:NonoShortcutKeyItem = null;
         if(!_itemA)
         {
            _itemA = new Array();
         }
         var _loc2_:int = 1;
         while(_loc2_ <= _length)
         {
            _loc1_ = new NonoShortcutKeyItem();
            _mainUI["key" + _loc2_].addChild(_loc1_);
            _itemA.push(_loc1_);
            _loc2_++;
         }
      }
      
      private static function clearKeyBg() : void
      {
         var _loc1_:int = 1;
         while(_loc1_ <= _length)
         {
            (_itemA[_loc1_ - 1] as NonoShortcutKeyItem).destroy();
            _loc1_++;
         }
      }
      
      private static function setData() : void
      {
         var _loc1_:NonoShortcutKeyItem = null;
         var _loc2_:int = 1;
         while(_loc2_ <= _length)
         {
            _loc1_ = _itemA[_loc2_ - 1] as NonoShortcutKeyItem;
            if(_canShowA[_loc2_ - 1] != null)
            {
               if(_canShowA[_loc2_ - 1] != undefined)
               {
                  if(_handlerFunA[_loc2_ - 1] != undefined)
                  {
                     _loc1_.setInfo(_canShowA[_loc2_ - 1],_tipA[_loc2_ - 1],_handlerFunA[_loc2_ - 1]);
                  }
                  else
                  {
                     _loc1_.setInfo(_canShowA[_loc2_ - 1],_tipA[_loc2_ - 1]);
                  }
               }
            }
            _loc2_++;
         }
      }
      
      public static function show(param1:Point, param2:NonoInfo, param3:Boolean) : void
      {
         _info = param2;
         _flag = param3;
         TaomeeManager.loadExperience();
         makeAry();
         if(_mainUI == null)
         {
            _mainUI = TaskIconManager.getIcon("UI_NonoShortcut") as Sprite;
            addKeyBg();
         }
         clearKeyBg();
         _bgmc = _mainUI["bgmc"];
         _bgmc.buttonMode = true;
         _mainUI.x = param1.x;
         _mainUI.y = param1.y;
         LevelManager.appLevel.addChild(_mainUI);
         setData();
         _mainUI.addEventListener(MouseEvent.ROLL_OUT,onOut);
         if(MapXMLInfo.getIsLocal(MapManager.currentMap.id) == false)
         {
            _mainUI["key2"].filters = [];
            _mainUI["key2"].mouseEnabled = true;
            _mainUI["key2"].mouseChildren = true;
         }
         else
         {
            _mainUI["key2"].filters = [ColorFilter.setGrayscale()];
            _mainUI["key2"].mouseEnabled = false;
            _mainUI["key2"].mouseChildren = false;
         }
         _bgmc.addEventListener(MouseEvent.CLICK,onClick);
      }
      
      public static function hide() : void
      {
         if(Boolean(_mainUI))
         {
            clearKeyBg();
            _mainUI.removeEventListener(MouseEvent.ROLL_OUT,onOut);
            DisplayUtil.removeForParent(_mainUI);
            EventManager.dispatchEvent(new RobotEvent(RobotEvent.NONO_SHORTCUT_HIDE));
         }
      }
      
      private static function onOut(param1:MouseEvent) : void
      {
         hide();
      }
      
      private static function onCure() : void
      {
         hide();
         Alert.show("为背包内全部精灵补满体力和技能PP。\n消耗：0赛尔豆；不消耗任何药剂。确定恢复吗？",function():void
         {
            SocketConnection.addCmdListener(CommandID.PET_CURE,onPortableCure);
            SocketConnection.send(CommandID.PET_CURE);
         });
         hide();
      }
      
      private static function onFollow() : void
      {
         if(_flag)
         {
            SocketConnection.send(CommandID.NONO_FOLLOW_OR_HOOM,0);
         }
         else
         {
            SocketConnection.send(CommandID.NONO_FOLLOW_OR_HOOM,1);
         }
         hide();
      }
      
      private static function onPower() : void
      {
         if(_info.chargeTime == 0)
         {
            SocketConnection.send(CommandID.NONO_CHARGE,1);
         }
         else
         {
            SocketConnection.send(CommandID.NONO_CHARGE,0);
         }
         hide();
      }
      
      private static function onjn() : void
      {
         if(_appModel == null)
         {
            _appModel = ModuleManager.getModule(ClientConfig.getAppModule("ExpAdmPanel"),"正在打开经验分配器面板...");
            _appModel.setup();
            _appModel.sharedEvents.addEventListener(Event.CLOSE,onAppCloseHandler);
         }
         _appModel.show();
         hide();
      }
      
      private static function onAppCloseHandler(param1:Event) : void
      {
         _appModel.sharedEvents.removeEventListener(Event.CLOSE,onAppCloseHandler);
         _appModel.destroy();
         _appModel = null;
      }
      
      private static function onPetStorage() : void
      {
         if(_petStorage == null)
         {
            _petStorage = ModuleManager.getModule(ClientConfig.getAppModule("PetStorage"),"正在打开精灵仓库");
            _petStorage.setup();
         }
         _petStorage.show();
      }
      
      private static function onClick(param1:MouseEvent) : void
      {
         showNoNOPanel();
      }
      
      private static function showNoNOPanel() : void
      {
         if(_nonoPanel == null)
         {
            _nonoPanel = ModuleManager.getModule(ClientConfig.getAppModule("MachineDogPanel"),"正在打开NoNo面板...");
            _nonoPanel.setup();
            _nonoPanel.sharedEvents.addEventListener(Event.CLOSE,onNonoPanelClose);
         }
         _nonoPanel.init(_info);
         _nonoPanel.show();
      }
      
      public static function onNonoPanelClose(param1:Event) : void
      {
         if(Boolean(_nonoPanel))
         {
            _nonoPanel.sharedEvents.removeEventListener(Event.CLOSE,onNonoPanelClose);
            _nonoPanel.destroy();
         }
         _nonoPanel = null;
      }
      
      private static function onPortableCure(event:SocketEvent):void
      {
         SocketConnection.removeCmdListener(CommandID.PET_CURE,onPortableCure);
         PetManager.upDate();
         Alarm.show("背包内精灵的体力和技能PP已恢复。");
      }

      private static function servicePage(ids:Array,tips:Array,handlers:Array):void
      {
         clearKeyBg();
         _canShowA = ids;
         _tipA = tips;
         _handlerFunA = handlers;
         _mainUI["key2"].filters = [];
         _mainUI["key2"].mouseEnabled = true;
         _mainUI["key2"].mouseChildren = true;
         setData();
      }

      public static function showServices():void
      {
         servicePage(["qx_skills","qx_shop","qx_teams","qx_speed","1",null,null,"qx_back"],
            ["更换技能","道具商城","常用队伍","战斗播放设置","补满体力与PP（免费）",null,null,"返回NONO功能"],
            [showSkills,showShop,requestTeams,showBattleSettings,onCure,null,null,backToNono]);
      }

      private static function backToNono():void
      {
         show(new Point(_mainUI.x,_mainUI.y),_info,_flag);
      }

      private static function showSkills():void
      {
         hide();
         if(PetManager.length == 0) { Alarm.show("请先将精灵放入背包。"); return; }
         if(_skillPanel == null)
         {
            _skillPanel = ModuleManager.getModule(ClientConfig.getAppModule("PetSelectPanel"),"正在打开技能唤醒仪");
            _skillPanel.setup();
            SocketConnection.addCmdListener(CommandID.PET_SKILL_SWICTH,onSkillChanged);
         }
         _skillPanel.show();
      }

      private static function onSkillChanged(event:SocketEvent):void { PetManager.upDate(); }

      private static function showShop():void
      {
         hide();
         BuyPetPropsController.show();
      }

      public static function showBattleSettings():void
      {
         hide();
         TaomeeManager.loadExperience(displayBattleSettings);
      }

      private static function displayBattleSettings():void
      {
         NpcDialog.show(NPC.NONO,
            ["当前战斗播放速度：" + TaomeeManager.battleMultiplier + "倍。只加速演出，不改变回合、伤害和选招时间。"],
            ["选择播放速度","重复挑战简化过场：" + (TaomeeManager.shortTransitions ? "开启" : "关闭") + "（点击切换）","关闭"],
            [displayBattleSpeeds,function():void { TaomeeManager.saveExperience(TaomeeManager.battleMultiplier,!TaomeeManager.shortTransitions,displayBattleSettings); }]);
      }

      private static function displayBattleSpeeds():void
      {
         NpcDialog.show(NPC.NONO,["选择播放速度。1倍保持原有体验；战斗中从下一段演出开始生效。"],
            ["1倍（原速）","2倍","4倍"],
            [function():void { saveBattle(1); },function():void { saveBattle(2); },function():void { saveBattle(4); }]);
      }

      private static function saveBattle(multiplier:uint):void
      {
         TaomeeManager.saveExperience(multiplier,TaomeeManager.shortTransitions,function():void
         {
            Alarm.show("已保存为" + multiplier + "倍。战斗中将在下一段演出开始时生效。");
         });
      }

      private static function requestTeams():void
      {
         hide();
         submitTeam(0,0);
      }

      private static function onTeams(event:SocketEvent):void
      {
         SocketConnection.removeCmdListener(91003,onTeams);
         clearTimeout(_teamTimeout);
         _teamPending = false;
         var bytes:ByteArray = event.data as ByteArray;
         if(bytes == null || bytes.bytesAvailable < 12) return;
         var operation:uint = bytes.readUnsignedInt();
         var slot:uint = bytes.readUnsignedInt();
         var count:uint = bytes.readUnsignedInt();
         _teams = {};
         for(var i:uint=0;i<count;i++)
         {
            var index:uint = bytes.readUnsignedInt();
            var size:uint = bytes.readUnsignedInt();
            var names:Array = [];
            for(var j:uint=0;j<size;j++)
            {
               bytes.readUnsignedInt();
               var species:uint = bytes.readUnsignedInt();
               names.push(species == 0 ? "精灵已不在仓库" : PetXMLInfo.getName(species));
            }
            _teams[index] = names.join("、");
         }
         if(operation == 2) PetManager.replaceBagSnapshot(bytes,bytes.readUnsignedInt());
         NpcDialog.show(NPC.NONO,
            [(operation == 1 ? "队伍已保存。\n" : operation == 2 ? "队伍已切换。\n" : "") +
             "保存背包精灵和首发顺序，不更换技能或装备。选择队伍查看成员。"],
            ["队伍1" + (_teams[1] == null ? "（未保存）" : "（已保存）"),"队伍2" + (_teams[2] == null ? "（未保存）" : "（已保存）"),"队伍3" + (_teams[3] == null ? "（未保存）" : "（已保存）"),"关闭"],
            [function():void { showTeam(1); },function():void { showTeam(2); },function():void { showTeam(3); }]);
      }

      private static function teamText(slot:uint):String { return _teams[slot] == null ? "尚未保存" : String(_teams[slot]); }

      private static function showTeam(slot:uint):void
      {
         NpcDialog.show(NPC.NONO,["队伍" + slot + "：" + teamText(slot)],
            ["切换到这支队伍","保存当前背包到此位置","返回"],
            [function():void { submitTeam(2,slot); },function():void
             {
                Alert.show("将当前背包保存到队伍" + slot + "，覆盖该位置已有预设？",function():void { submitTeam(1,slot); });
             },requestTeams]);
      }

      private static function submitTeam(operation:uint,slot:uint):void
      {
         if(_teamPending) return;
         _teamPending = true;
         SocketConnection.addCmdListener(91003,onTeams);
         _teamTimeout = setTimeout(onTeamTimeout,8000);
         SocketConnection.send(91003,operation,slot);
      }

      private static function onTeamTimeout():void
      {
         SocketConnection.removeCmdListener(91003,onTeams);
         _teamPending = false;
         Alarm.show("未收到队伍操作结果，请重新打开常用队伍确认。不会自动重试。");
      }

      private static function onNonoInfoPanelClose(param1:Event) : void
      {
         _nonoInfoPanel.sharedEvents.removeEventListener(Event.CLOSE,onNonoInfoPanelClose);
         _nonoInfoPanel.destroy();
         _nonoInfoPanel = null;
      }
   }
}

