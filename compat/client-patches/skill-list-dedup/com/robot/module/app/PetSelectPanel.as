package com.robot.module.app
{
   import com.robot.app.petbag.ui.PetBagListItem;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.event.PetEvent;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.info.pet.PetSkillInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.module.app.skill.SkillReplacePanel;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.manager.DepthManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;

   public class PetSelectPanel extends Sprite implements IModule
   {

      private static const MAX:int = 6;

      private var _listCon:Sprite;

      private var _dragBtn:SimpleButton;

      private var _arr:Array;

      private var _closeBtn:SimpleButton;

      private var _mainUI:Sprite;

      private var _applyBtn:SimpleButton;

      private var _curretItem:PetBagListItem;

      public function PetSelectPanel()
      {
         super();
      }

      private function clearItem() : void
      {
         var dis:PetBagListItem = null;
         for(var k:int = 0; k < MAX; k++)
         {
            dis = _listCon.getChildAt(k) as PetBagListItem;
            dis.mouseEnabled = false;
            dis.hide();
            dis.removeEventListener(MouseEvent.CLICK,onItemClick);
         }
      }

      public function hide() : void
      {
         removeEvent();
         DisplayUtil.removeForParent(_mainUI);
      }

      public function setup() : void
      {
         var item:PetBagListItem = null;
         _mainUI = new UI_PetSelectPanel();
         _dragBtn = _mainUI["dragBtn"];
         _closeBtn = _mainUI["closeBtn"];
         _applyBtn = _mainUI["applyBtn"];
         _listCon = new Sprite();
         _listCon.x = 30;
         _listCon.y = 75;
         _mainUI.addChild(_listCon);
         for(var i:int = 0; i < MAX; i++)
         {
            item = new PetBagListItem();
            item.y = (item.height + 6) * int(i / 2);
            item.x = (item.width + 6) * (i % 2);
            _listCon.addChild(item);
         }
      }

      private function refreshItem() : void
      {
         var info:PetInfo = null;
         var item:PetBagListItem = null;
         clearItem();
         var _listData:Array = PetManager.infos;
         var len:int = Math.min(MAX,PetManager.length);
         for(var i:int = 0; i < len; i++)
         {
            info = _listData[i] as PetInfo;
            item = _listCon.getChildAt(i) as PetBagListItem;
            item.show(info);
            item.name = info.id.toString();
            item.mouseEnabled = true;
            item.addEventListener(MouseEvent.CLICK,onItemClick);
         }
         if(_curretItem)
         {
            _curretItem.isSelect = true;
         }
      }

      private function onApply(e:MouseEvent) : void
      {
         var info:PetSkillInfo = null;
         var index:int = 0;
         if(_curretItem == null)
         {
            Alarm.show("你还没有选择精灵！");
            return;
         }
         _arr = PetXMLInfo.getSkillListForLv(_curretItem.info.id,_curretItem.info.level);
         for each(info in _curretItem.info.skillArray)
         {
            index = _arr.indexOf(info.id);
            if(index != -1)
            {
               _arr.splice(index,1);
            }
         }
         if(_curretItem.info.id == 650 || _curretItem.info.id == 651 || _curretItem.info.id == 652)
         {
            PetManager.getBlackCanStudySkill(_curretItem.info.catchTime,handler);
         }
         else
         {
            PetManager.getCanStudySkill(_curretItem.info.catchTime,handler);
         }
      }

      public function init(data:Object = null) : void
      {
      }

      public function show() : void
      {
         if(DisplayUtil.hasParent(_mainUI))
         {
            return;
         }
         LevelManager.appLevel.addChild(_mainUI);
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
         addEvent();
         PetManager.upDate();
      }

      private function onItemClick(e:MouseEvent) : void
      {
         if(_curretItem)
         {
            _curretItem.isSelect = false;
         }
         _curretItem = e.currentTarget as PetBagListItem;
         _curretItem.isSelect = true;
      }

      private function handler(a:Array) : void
      {
         var arr:Array = new Array();
         var merged:Array = null;
         var skillID:uint = 0;
         if(_curretItem.info.id == 650 || _curretItem.info.id == 651 || _curretItem.info.id == 652)
         {
            arr = a;
         }
         else
         {
            merged = this._arr.concat(a);
            for each(skillID in merged)
            {
               if(arr.indexOf(skillID) == -1)
               {
                  arr.push(skillID);
               }
            }
         }
         if(arr.length == 0)
         {
            Alarm.show("你的这只精灵没有可以唤醒的技能！");
            return;
         }
         var _skillRePanel:SkillReplacePanel = new SkillReplacePanel();
         _skillRePanel.show(_curretItem.info,arr);
         _curretItem = null;
         hide();
      }

      protected function onClose(e:MouseEvent) : void
      {
         hide();
      }

      private function onUpDate(e:PetEvent) : void
      {
         refreshItem();
      }

      private function onDragUp(e:MouseEvent) : void
      {
         _mainUI.stopDrag();
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
         PetManager.removeEventListener(PetEvent.UPDATE_INFO,onUpDate);
         PetManager.removeEventListener(PetEvent.ADDED,onUpDate);
         PetManager.removeEventListener(PetEvent.REMOVED,onUpDate);
      }

      private function addEvent() : void
      {
         _closeBtn.addEventListener(MouseEvent.CLICK,onClose);
         _dragBtn.addEventListener(MouseEvent.MOUSE_DOWN,onDragDown);
         _dragBtn.addEventListener(MouseEvent.MOUSE_UP,onDragUp);
         _applyBtn.addEventListener(MouseEvent.CLICK,onApply);
         PetManager.addEventListener(PetEvent.UPDATE_INFO,onUpDate);
         PetManager.addEventListener(PetEvent.ADDED,onUpDate);
         PetManager.addEventListener(PetEvent.REMOVED,onUpDate);
      }

      public function destroy() : void
      {
         clearItem();
         hide();
         _listCon = null;
         _mainUI = null;
         _curretItem = null;
      }
   }
}
