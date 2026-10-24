package com.robot.app.panel
{
   import com.robot.core.*;
   import com.robot.core.config.*;
   import com.robot.core.info.pet.*;
   import com.robot.core.manager.*;
   import com.robot.core.net.*;
   import com.robot.core.ui.alert.*;
   import com.robot.core.ui.skillBtn.*;
   import flash.display.*;
   import flash.events.*;
   import org.taomee.effect.*;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class SkillReplacePanel
   {
      
      private static var _ui:MovieClip;
      
      private static var _alarm:MovieClip;
      
      private static var _catchTime:uint;
      
      private static var _newSkillId:uint;
      
      private static var _handler:Function;
      
      private static var _cancel:Function;
      
      private static var _type:uint;
      
      private static var _info:PetInfo;
      
      private static var _oldSkillId:uint;
      
      private static var _skillBtn:Array = [];
      
      public static const NORMAL:uint = 0;
      
      public static const SPECIAL:uint = 1;
      
      public function SkillReplacePanel()
      {
         super();
      }
      
      public static function show(param1:uint, param2:uint, param3:Function = null, param4:Function = null, param5:uint = 0) : void
      {
         var _loc6_:BlackSkillBtn = null;
         _loc6_ = null;
         if(_ui == null)
         {
            LevelManager.closeMouseEvent();
            _catchTime = param1;
            _newSkillId = param2;
            _handler = param3;
            _cancel = param4;
            _type = param5;
            _ui = UIManager.getMovieClip("ui_PetUpdateMoreSkillPanel");
            LevelManager.appLevel.addChild(_ui);
            DisplayUtil.align(_ui,null,AlignType.MIDDLE_CENTER);
            _ui["ok"].enabled = false;
            _ui["ok"].mouseEnabled = false;
            _ui["ok"].filters = [ColorFilter.setGrayscale()];
            _ui["ok"].addEventListener(MouseEvent.CLICK,onReplaceClick);
            _ui["cancel"].addEventListener(MouseEvent.CLICK,onCancelClick);
            _loc6_ = new BlackSkillBtn(_newSkillId);
            _loc6_.x = 174;
            _loc6_.y = 100;
            _ui.addChild(_loc6_);
            _skillBtn.push(_loc6_);
            SocketConnection.addCmdListener(CommandID.GET_PET_INFO,onGetInfo);
            SocketConnection.send(CommandID.GET_PET_INFO,_catchTime);
            SocketConnection.addCmdListener(CommandID.PET_STUDY_SKILL,onStudy);
         }
      }
      
      private static function onGetInfo(param1:SocketEvent) : void
      {
         var _loc2_:PetSkillInfo = null;
         var _loc3_:BlackSkillBtn = null;
         SocketConnection.removeCmdListener(CommandID.GET_PET_INFO,onGetInfo);
         _info = param1.data as PetInfo;
         var _loc4_:Array = _info.skillArray;
         var _loc5_:uint = 0;
         while(_loc5_ < _loc4_.length)
         {
            _loc2_ = _loc4_[_loc5_];
            _loc3_ = new BlackSkillBtn(_loc2_.id,_loc2_.pp);
            _loc3_.x = 40 + _loc5_ % 2 * 134;
            _loc3_.y = 180 + Math.floor(_loc5_ / 2) * 60;
            _loc3_.buttonMode = true;
            _loc3_.addEventListener(MouseEvent.CLICK,onSkillClick);
            _ui.addChild(_loc3_);
            _skillBtn.push(_loc3_);
            if(_loc2_.id > 100000)
            {
               _loc3_.mouseEnabled = false;
               _loc3_.mouseChildren = false;
               _loc3_.filters = [ColorFilter.setGrayscale()];
            }
            _loc5_++;
         }
         ResourceManager.getResource(ClientConfig.getPetSwfPath(_info.id,_info.catchTime),onLoadComplete,"pet");
      }
      
      private static function onLoadComplete(param1:DisplayObject) : void
      {
         var pet:MovieClip = null;
         pet = null;
         var o:DisplayObject = param1;
         pet = o as MovieClip;
         if(pet != null)
         {
            pet.gotoAndStop("rightdown");
            pet.addEventListener(Event.ENTER_FRAME,function():void
            {
               var _loc2_:MovieClip = pet.getChildAt(0) as MovieClip;
               if(_loc2_ != null)
               {
                  _loc2_.gotoAndStop(1);
                  pet.removeEventListener(Event.ENTER_FRAME,arguments.callee);
               }
            });
            pet.x = 100;
            pet.y = 150;
            if(80 / pet.width < 100 / pet.height)
            {
               pet.scaleX = pet.scaleY = 80 / pet.width;
            }
            else
            {
               pet.scaleX = pet.scaleY = 100 / pet.height;
            }
            _ui.addChild(pet);
         }
      }
      
      private static function onSkillClick(param1:MouseEvent) : void
      {
         var _loc2_:BlackSkillBtn = null;
         var _loc3_:BlackSkillBtn = param1.currentTarget as BlackSkillBtn;
         _oldSkillId = _loc3_.skillID;
         for each(_loc2_ in _skillBtn)
         {
            _loc2_.setSelect(false);
         }
         _loc3_.setSelect(true);
         _ui["ok"].enabled = true;
         _ui["ok"].mouseEnabled = true;
         _ui["ok"].filters = [];
      }
      
      private static function onReplaceClick(param1:MouseEvent) : void
      {
         var _loc2_:BlackSkillBtn = null;
         var _loc3_:BlackSkillBtn = null;
         if(_alarm == null)
         {
            _ui.mouseEnabled = false;
            _ui.mouseChildren = false;
            _alarm = UIManager.getMovieClip("ui_MultiSkillAlarm");
            _loc2_ = new BlackSkillBtn(_newSkillId);
            _loc3_ = new BlackSkillBtn(_oldSkillId);
            _loc2_.x = 40;
            _loc3_.x = 194;
            _loc3_.y = 100;
            _loc2_.y = 100;
            _skillBtn.push(_loc2_);
            _alarm.addChild(_loc2_);
            _skillBtn.push(_loc3_);
            _alarm.addChild(_loc3_);
            _alarm["ok"].addEventListener(MouseEvent.CLICK,onAlarmOkClick);
            _alarm["cancel"].addEventListener(MouseEvent.CLICK,onAlarmCancelClick);
            LevelManager.appLevel.addChild(_alarm);
            DisplayUtil.align(_alarm,null,AlignType.MIDDLE_CENTER);
         }
      }
      
      private static function onCancelClick(param1:MouseEvent) : void
      {
         if(_cancel != null)
         {
            _cancel();
         }
         destory();
      }
      
      private static function onAlarmOkClick(param1:MouseEvent) : void
      {
         destoryAlarm();
         if(_type == NORMAL)
         {
            SocketConnection.send(CommandID.PET_STUDY_SKILL,_catchTime,1,1,_oldSkillId,_newSkillId);
         }
         else if(_type == SPECIAL)
         {
            if(_handler != null)
            {
               _handler(_catchTime,_oldSkillId,_newSkillId);
            }
            destory();
         }
      }
      
      private static function onAlarmCancelClick(param1:MouseEvent) : void
      {
         destoryAlarm();
      }
      
      private static function onStudy(param1:SocketEvent) : void
      {
         var event:SocketEvent = param1;
         SocketConnection.removeCmdListener(CommandID.PET_STUDY_SKILL,onStudy);
         PetManager.upDate();
         Alarm.show("恭喜你，宠物学习技能成功！",function():void
         {
            if(_handler != null)
            {
               _handler(_catchTime,_oldSkillId,_newSkillId);
            }
            destory();
         });
      }
      
      private static function destoryAlarm() : void
      {
         if(_alarm != null)
         {
            _ui.mouseEnabled = true;
            _ui.mouseChildren = true;
            _alarm["ok"].addEventListener(MouseEvent.CLICK,onAlarmOkClick);
            _alarm["cancel"].addEventListener(MouseEvent.CLICK,onAlarmCancelClick);
            DisplayUtil.removeForParent(_alarm);
            _alarm = null;
         }
      }
      
      private static function destory() : void
      {
         var _loc1_:BlackSkillBtn = null;
         if(_ui != null)
         {
            LevelManager.openMouseEvent();
            ResourceManager.cancelURL(ClientConfig.getPetSwfPath(_info.id,_info.catchTime));
            _handler = null;
            _cancel = null;
            _info = null;
            for each(_loc1_ in _skillBtn)
            {
               _loc1_.removeEventListener(MouseEvent.CLICK,onSkillClick);
               _loc1_.destroy();
            }
            _skillBtn = [];
            destoryAlarm();
            _ui["ok"].removeEventListener(MouseEvent.CLICK,onReplaceClick);
            _ui["cancel"].removeEventListener(MouseEvent.CLICK,onCancelClick);
            DisplayUtil.removeForParent(_ui);
            _ui = null;
         }
      }
   }
}

