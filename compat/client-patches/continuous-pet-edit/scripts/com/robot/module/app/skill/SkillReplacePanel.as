package com.robot.module.app.skill
{
   import com.robot.core.CommandID;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.NatureXMLInfo;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.event.PetEvent;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.net.SocketConnection;
   import org.taomee.net.SocketDispatcher;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.ui.alert.Alert;
   import com.robot.core.ui.skillBtn.BlackSkillBtn;
   import com.robot.core.uic.UIPageBar;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.events.EventDispatcher;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   import flash.text.TextFormat;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.events.DynamicEvent;
   import org.taomee.events.SocketEvent;
   import org.taomee.events.SocketErrorEvent;
   import org.taomee.manager.DepthManager;
   import org.taomee.manager.ResourceManager;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   import org.taomee.utils.StringUtil;
   
   public class SkillReplacePanel extends Sprite
   {
      
      private static const MAX:int = 4;
      
      private var _cancelBtn:SimpleButton;
      
      private var _speedTxt:TextField;
      
      private var _attackTxt:TextField;
      
      private var _info:PetInfo;
      
      private var num:uint;
      
      private var _skillList:Array = [];
      
      private var _defenceTxt:TextField;
      
      private var _showMc:MovieClip;
      
      private var _closeBtn:SimpleButton;
      
      private var _infoTxt:TextField;
      
      private var _mainUI:Sprite;
      
      private var _id:uint;
      
      private var targetName:String;
      
      private var _selectHasSkill:BlackSkillBtn;
      
      private var _saTxt:TextField;
      
      private var _listCon:Sprite;
      
      private var _dragBtn:SimpleButton;
      
      private var _pageBar:UIPageBar;
      
      private var _skillBtnArray:Array = [];
      
      private var _hpTxt:TextField;
      
      private var _sdTxt:TextField;
      
      private var _applyBtn:SimpleButton;
      
      private var _selectListSkill:BlackSkillBtn;
      private var _phase:String = "";
      private var _requestTimer:uint;
      private var _errorDispatcher:EventDispatcher;
      private var _statusText:TextField;
      private var _notice:String = "";
      private var _expectedSkill:uint;
      
      public function SkillReplacePanel()
      {
         var item:BlackSkillBtn = null;
         super();
         _mainUI = new UI_SkillReplacePanel();
         _closeBtn = _mainUI["closeBtn"];
         _dragBtn = _mainUI["dragBtn"];
         _applyBtn = _mainUI["applyBtn"];
         _cancelBtn = _mainUI["cancelBtn"];
         _infoTxt = _mainUI["infoTxt"];
         _infoTxt.autoSize = TextFieldAutoSize.LEFT;
         _infoTxt.multiline = true;
         _attackTxt = _mainUI["attackTxt"];
         _defenceTxt = _mainUI["defenceTxt"];
         _saTxt = _mainUI["saTxt"];
         _sdTxt = _mainUI["sdTxt"];
         _speedTxt = _mainUI["speedTxt"];
         _hpTxt = _mainUI["hpTxt"];
         _listCon = new Sprite();
         _listCon.x = 340;
         _listCon.y = 95;
         _mainUI.addChild(_listCon);
         var i:int = 0;
         while(i < MAX)
         {
            item = new BlackSkillBtn();
            item.y = (item.height + 10) * i;
            _listCon.addChild(item);
            i++;
         }
         _pageBar = new UIPageBar(_mainUI["preBtn"],_mainUI["nextBtn"],_mainUI["pageTxt"],MAX);
         _statusText = new TextField();
         _statusText.defaultTextFormat = new TextFormat("宋体",12,0xFFFFFF);
         _statusText.x = 26;
         _statusText.y = 10;
         _statusText.width = _mainUI.width-78;
         _statusText.height = 25;
         _statusText.multiline = false;
         _statusText.wordWrap = false;
         _statusText.background = true;
         _statusText.backgroundColor = 0x0B658E;
         _statusText.border = true;
         _statusText.borderColor = 0x4BADD2;
         _statusText.mouseEnabled = false;
         _statusText.selectable = false;
         _statusText.text = "更换后保留此面板，可继续调整其余技能。";
         _mainUI.addChild(_statusText);
      }
      
      private function clearItem() : void
      {
         var item:BlackSkillBtn = null;
         _selectListSkill = null;
         var i:int = 0;
         while(i < MAX)
         {
            item = _listCon.getChildAt(i) as BlackSkillBtn;
            item.setSelect(false);
            item.removeEventListener(MouseEvent.CLICK,onItemClick);
            item.mouseEnabled = false;
            item.mouseChildren = false;
            item.clear();
            i++;
         }
      }
      
      private function refreshItem(id:uint) : void
      {
         var item:BlackSkillBtn = null;
         clearItem();
         _pageBar.totalLength = _skillList.length;
         var len:int = Math.min(MAX,_skillList.length-_pageBar.index*MAX);
         var i:int = 0;
         while(i < len)
         {
            item = _listCon.getChildAt(i) as BlackSkillBtn;
            item.init(_skillList[i + _pageBar.index * MAX]);
            item.addEventListener(MouseEvent.CLICK,onItemClick);
            item.mouseEnabled = true;
            item.mouseChildren = true;
            item.buttonMode = true;
            i++;
         }
      }
      
      private function onH1(e:SocketEvent) : void
      {
         onSwitchComplete();
      }
      
      private function onItemClick(e:MouseEvent) : void
      {
         if(_phase != "")return;
         if(_selectListSkill)
         {
            _selectListSkill.setSelect(false);
         }
         _selectListSkill = e.currentTarget as BlackSkillBtn;
         _selectListSkill.setSelect(true);
      }
      
      private function onH2(e:SocketEvent) : void
      {
         onSwitchComplete();
      }
      
      private function onPageClick(e:DynamicEvent) : void
      {
         var item:BlackSkillBtn = null;
         clearItem();
         var index:uint = e.paramObject as uint;
         var len:int = Math.min(_skillList.length - index * MAX,MAX);
         var i:int = 0;
         while(i < len)
         {
            item = _listCon.getChildAt(i) as BlackSkillBtn;
            item.init(_skillList[i + index * MAX]);
            item.addEventListener(MouseEvent.CLICK,onItemClick);
            item.mouseEnabled = true;
            item.mouseChildren = true;
            i++;
         }
      }
      
      private function onDragUp(e:MouseEvent) : void
      {
         _mainUI.stopDrag();
      }
      
      public function hide() : void
      {
         removeEvent();
         DisplayUtil.removeForParent(_mainUI);
      }
      
      private function onHasSkillClick(e:MouseEvent) : void
      {
         if(_phase != "")return;
         if(_selectHasSkill)
         {
            _selectHasSkill.setSelect(false);
         }
         _selectHasSkill = e.currentTarget as BlackSkillBtn;
         _selectHasSkill.setSelect(true);
      }
      
      private function onShowComplete(o:DisplayObject) : void
      {
         if(_mainUI == null)return;
         _showMc = o as MovieClip;
         if(_showMc)
         {
            DisplayUtil.stopAllMovieClip(_showMc);
            _showMc.scaleX = 2;
            _showMc.scaleY = 2;
            _showMc.x = 100;
            _showMc.y = 120;
            _mainUI.addChild(_showMc);
            _mainUI.addChild(_statusText);
         }
      }
      
      private function onApply(e:MouseEvent) : void
      {
         var isapply:Boolean = true;
         if(_mainUI == null)return;
         if(_phase == "sync-error" || _phase == "uncertain"){refreshPet();return;}
         if(_phase != "")return;
         if(_selectHasSkill == null)
         {
            isapply = false;
         }
         if(_selectListSkill == null)
         {
            isapply = false;
         }
         if(!isapply)
         {
            Alarm.show("点击选择两边的技能才能进行技能唤醒。");
            return;
         }
         num = _info.skillNum;
         targetName = PetXMLInfo.getName(_info.id);
         if(_selectHasSkill.skillID > 100000)
         {
            _mainUI.mouseEnabled = false;
            _mainUI.mouseChildren = false;
            Alert.show("更换此技能时，当前技能石会被摧毁，确定要更换这个技能吗？",function():void
            {
               _mainUI.mouseEnabled = true;
               _mainUI.mouseChildren = true;
               execute();
            },function():void
            {
               _mainUI.mouseEnabled = true;
               _mainUI.mouseChildren = true;
            });
         }
         else
         {
            execute();
         }
      }
      
      private function onClose(e:MouseEvent) : void
      {
         destroy();
      }
      
      private function showDes() : void
      {
         if(num >= 4)MainManager.actorInfo.coins -= 100;
         _notice = num >= 4 ? "更换成功，消耗100赛尔豆。" : "技能更换成功。";
         _statusText.text = _notice + "正在同步当前技能…";
      }
      
      private function clearOldBtn() : void
      {
         var i:BlackSkillBtn = null;
         for each(i in _skillBtnArray)
         {
            i.removeEventListener(MouseEvent.CLICK,onHasSkillClick);
            i.destroy();
            i = null;
         }
         _skillBtnArray = [];
      }
      
      private function onDragDown(e:MouseEvent) : void
      {
         DepthManager.bringToTop(_mainUI);
         _mainUI.startDrag();
      }
      
      private function removeEvent() : void
      {
         _closeBtn.removeEventListener(MouseEvent.CLICK,onClose);
         _dragBtn.removeEventListener(MouseEvent.MOUSE_DOWN,onDragDown);
         _dragBtn.removeEventListener(MouseEvent.MOUSE_UP,onDragUp);
         _applyBtn.removeEventListener(MouseEvent.CLICK,onApply);
         _cancelBtn.removeEventListener(MouseEvent.CLICK,onClose);
         _pageBar.removeEventListener(MouseEvent.CLICK,onPageClick);
      }
      
      private function addEvent() : void
      {
         _closeBtn.addEventListener(MouseEvent.CLICK,onClose);
         _dragBtn.addEventListener(MouseEvent.MOUSE_DOWN,onDragDown);
         _dragBtn.addEventListener(MouseEvent.MOUSE_UP,onDragUp);
         _applyBtn.addEventListener(MouseEvent.CLICK,onApply);
         _cancelBtn.addEventListener(MouseEvent.CLICK,onClose);
         _pageBar.addEventListener(MouseEvent.CLICK,onPageClick);
      }
      
      public function destroy() : void
      {
         if(_mainUI == null)return;
         stopRequest();
         _pageBar.destroy();
         if(_id != 0)
         {
            ResourceManager.cancel(ClientConfig.getPetSwfPath(_id),onShowComplete);
         }
         if(_showMc)
         {
            DisplayUtil.removeForParent(_showMc);
            _showMc = null;
         }
         clearOldBtn();
         hide();
         _info = null;
         _mainUI = null;
         _infoTxt = null;
         _attackTxt = null;
         _defenceTxt = null;
         _saTxt = null;
         _sdTxt = null;
         _speedTxt = null;
         _hpTxt = null;
         clearItem();
         _selectHasSkill = null;
         _selectListSkill = null;
         _listCon = null;
         _skillList = null;
         _pageBar = null;
         _statusText = null;
      }
      
      private function execute() : void
      {
         if(_mainUI == null || _phase != "")return;
         _phase = "saving";
         _expectedSkill = _selectListSkill.skillID;
         _applyBtn.mouseEnabled = false;
         _applyBtn.alpha = 0.45;
         _statusText.text = "正在为" + targetName + "更换技能，请稍候…";
         _errorDispatcher = SocketDispatcher.getInstance();
         _errorDispatcher.addEventListener(SocketErrorEvent.ERROR,onUseError);
         _requestTimer = setTimeout(onRequestTimeout,8000);
         if(_info.id == 650 || _info.id == 651 || _info.id == 652)
         {
            SocketConnection.addCmdListener(CommandID.EXCHANGE_BLACKPET_SKILL,onH1);
            SocketConnection.send(CommandID.EXCHANGE_BLACKPET_SKILL,_info.catchTime,_selectHasSkill.skillID,_selectListSkill.skillID,1);
         }
         else
         {
            SocketConnection.addCmdListener(CommandID.PET_SKILL_SWICTH,onH2);
            SocketConnection.send(CommandID.PET_SKILL_SWICTH,_info.catchTime,1,1,_selectHasSkill.skillID,_selectListSkill.skillID);
         }
      }
      
      public function show(info:PetInfo, skillList:Array) : void
      {
         if(DisplayUtil.hasParent(_mainUI))
         {
            return;
         }
         LevelManager.appLevel.addChild(_mainUI);
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
         _info = info;
         _skillList = skillList;
         _infoTxt.appendText("序号:" + StringUtil.renewZero(info.id.toString(),3));
         _infoTxt.appendText("\n名字:" + PetXMLInfo.getName(info.id));
         _infoTxt.appendText("\n等级:" + info.level.toString());
         _infoTxt.appendText("\n性格:" + NatureXMLInfo.getName(info.nature));
         if(_id != 0)
         {
            ResourceManager.cancel(ClientConfig.getPetSwfPath(_id),onShowComplete);
         }
         if(_showMc)
         {
            DisplayUtil.removeForParent(_showMc);
            _showMc = null;
         }
         _id = info.id;
         ResourceManager.getResource(ClientConfig.getPetSwfPath(info.id),onShowComplete,"pet");
         _attackTxt.text = "攻击:" + info.attack.toString();
         _defenceTxt.text = "防御:" + info.defence.toString();
         _saTxt.text = "特攻:" + info.s_a.toString();
         _sdTxt.text = "特防:" + info.s_d.toString();
         _speedTxt.text = "速度:" + info.speed.toString();
         _hpTxt.text = "体力:" + info.hp.toString();
         renderKnownSkills();
         refreshItem(_info.id);
         addEvent();
      }

      private function renderKnownSkills():void
      {
         clearOldBtn();
         _selectHasSkill = null;
         for(var i:int=0;i<MAX;i++)
         {
            var button:BlackSkillBtn;
            if(i < _info.skillNum)
            {
               button = new BlackSkillBtn(_info.skillArray[i].id,_info.skillArray[i].pp);
               button.buttonMode = true;
               button.addEventListener(MouseEvent.CLICK,onHasSkillClick);
            }
            else button = new BlackSkillBtn();
            button.x = 40+(button.width+10)*(i%2);
            button.y = 226+(button.height+5)*Math.floor(i/2);
            _skillBtnArray.push(button);
            _mainUI.addChild(button);
         }
      }

      private function onSwitchComplete():void
      {
         if(_mainUI == null || _phase != "saving")return;
         stopRequest();
         showDes();
         refreshPet();
      }

      private function refreshPet():void
      {
         stopRequest();
         _phase = "sync";
         _applyBtn.mouseEnabled = false;
         _applyBtn.alpha = 0.45;
         _statusText.text = _notice + "正在刷新已装备与可唤醒技能…";
         PetManager.addEventListener(PetEvent.UPDATE_INFO,onPetReady);
         _requestTimer = setTimeout(onRequestTimeout,8000);
         PetManager.upDate();
      }

      private function onPetReady(event:PetEvent):void
      {
         PetManager.removeEventListener(PetEvent.UPDATE_INFO,onPetReady);
         if(_mainUI == null)return;
         var next:PetInfo = PetManager.getPetInfo(_info.catchTime);
         if(next == null)
         {
            stopRequest();
            _phase = "sync-error";
            _statusText.text = "目标已不在背包，请关闭面板后重新选择精灵。";
            return;
         }
         _info = next;
         if(_expectedSkill != 0 && !hasSkill(_expectedSkill))
         {
            stopRequest();
            _phase = "sync-error";
            _applyBtn.mouseEnabled = true;
            _applyBtn.alpha = 1;
            _statusText.text = "当前技能尚未同步，点确认刷新；不会再次换招。";
            return;
         }
         renderKnownSkills();
         if(_info.id == 650 || _info.id == 651 || _info.id == 652)
            PetManager.getBlackCanStudySkill(_info.catchTime,onAvailable);
         else PetManager.getCanStudySkill(_info.catchTime,onAvailable);
      }

      private function hasSkill(id:uint):Boolean
      {
         for each(var skill:* in _info.skillArray)if(skill.id == id)return true;
         return false;
      }

      private function onAvailable(extra:Array):void
      {
         if(_mainUI == null || _phase != "sync")return;
         var ids:Array;
         var id:uint;
         if(_info.id == 650 || _info.id == 651 || _info.id == 652)ids = extra;
         else
         {
            ids = PetXMLInfo.getSkillListForLv(_info.id,_info.level);
            for each(id in extra)ids.push(id);
         }
         var seen:Object = {};
         _skillList = [];
         for each(id in ids)
         {
            if(seen[id])continue;
            seen[id] = true;
            if(!hasSkill(id))_skillList.push(id);
         }
         refreshItem(_info.id);
         stopRequest();
         _phase = "";
         _expectedSkill = 0;
         _applyBtn.mouseEnabled = _skillList.length > 0;
         _applyBtn.alpha = _skillList.length > 0 ? 1 : 0.45;
         _statusText.text = _notice + (_skillList.length > 0 ? "可继续选择下一组技能，无需重新打开。" : "当前已无其他可唤醒技能。");
      }

      private function onUseError(event:SocketErrorEvent):void
      {
         if(_mainUI == null || _phase != "saving" || event.headInfo == null ||
            event.headInfo.cmdID != CommandID.PET_SKILL_SWICTH && event.headInfo.cmdID != CommandID.EXCHANGE_BLACKPET_SKILL)return;
         stopRequest();
         _expectedSkill = 0;
         _notice = "更换未成功，已保留此精灵。";
         refreshPet();
      }

      private function onRequestTimeout():void
      {
         var saving:Boolean = _phase == "saving";
         stopRequest();
         if(_mainUI == null)return;
         _phase = saving ? "uncertain" : "sync-error";
         if(saving)_expectedSkill = 0;
         _applyBtn.mouseEnabled = true;
         _applyBtn.alpha = 1;
         _statusText.text = saving ? "换招结果未确认；点确认仅刷新技能，不会重发请求。" : "技能同步超时；点确认刷新，不会再次扣费。";
      }

      private function stopRequest():void
      {
         clearTimeout(_requestTimer);
         SocketConnection.removeCmdListener(CommandID.EXCHANGE_BLACKPET_SKILL,onH1);
         SocketConnection.removeCmdListener(CommandID.PET_SKILL_SWICTH,onH2);
         PetManager.removeEventListener(PetEvent.UPDATE_INFO,onPetReady);
         if(_errorDispatcher != null)_errorDispatcher.removeEventListener(SocketErrorEvent.ERROR,onUseError);
         _errorDispatcher = null;
      }
   }
}

