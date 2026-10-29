package com.robot.app.group
{
   import com.robot.core.group.manager.GroupManager;
   import com.robot.core.info.UserInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.UserInfoManager;
   import com.robot.core.manager.UserManager;
   import com.robot.core.mode.BasePeoleModel;
   import com.robot.core.utils.ArrayUtils;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import gs.TweenLite;
   import org.taomee.events.DynamicEvent;
   import org.taomee.manager.EventManager;
   import org.taomee.utils.DisplayUtil;
   
   public class GroupMembItemList extends Sprite
   {
      
      private static var _mainUI:MovieClip;
      
      private static var _btn:MovieClip;
      
      private static var _itemContainer:Sprite;
      
      private static var _membList:Array;
      
      private static var _infoArr:Array;
      
      public static const MEMBINFO_LIST:String = "membInfo_list";
      
      private static var _itemList:Array = [];
      
      private static var _msgArr:Array = [];
      
      private static var _isUpdating:Boolean = false;
      
      public function GroupMembItemList()
      {
         super();
      }
      
      public static function setup(param1:* = null) : void
      {
         GroupUiLinkage.load(function():void
         {
            _msgArr.push(param1);
            updateList();
         });
      }
      
      private static function updateList() : void
      {
         var _loc1_:GroupMembItem = null;
         _isUpdating = true;
         _msgArr.shift();
         if(!_mainUI)
         {
            _mainUI = GroupUiLinkage.getDisplayObject("GpMembItemList_mc") as MovieClip;
         }
         _btn = _mainUI["btn"];
         _btn.buttonMode = true;
         _btn.gotoAndStop(1);
         _btn.addEventListener(MouseEvent.CLICK,onShowHide);
         if(_itemContainer)
         {
            while(_itemContainer.numChildren > 0)
            {
               _loc1_ = _itemContainer.getChildAt(0) as GroupMembItem;
               if(_loc1_)
               {
                  _loc1_.destroy();
                  DisplayUtil.removeForParent(_loc1_);
                  _loc1_ = null;
               }
            }
            _itemContainer = null;
         }
         _itemContainer = new Sprite();
         _mainUI.addChild(_itemContainer);
         _itemContainer.y = 22;
         if(Boolean(GroupManager.isInGroup) && Boolean(MainManager.actorInfo) && Boolean(MainManager.actorInfo.groupInfo))
         {
            _membList = MainManager.actorInfo.groupInfo.memberList;
            ArrayUtils.removeDuplicates(_membList);
            LevelManager.iconLevel.addChild(_mainUI);
            _mainUI.y = 75;
            updateItemData();
         }
         else
         {
            DisplayUtil.removeForParent(_mainUI);
            _isUpdating = false;
         }
      }
      
      private static function updateData() : void
      {
         var count:uint = 0;
         var loop:Function = function(param1:uint):void
         {
            var cnt:uint = param1;
            UserInfoManager.getInfo(_membList[cnt],function(param1:UserInfo):void
            {
               _infoArr.push(param1);
               ++count;
               if(count == _membList.length)
               {
                  updateMoreInfo();
                  return;
               }
               loop(count);
            });
         };
         _infoArr = [];
         count = 0;
         loop(count);
      }
      
      private static function updateMoreInfo() : void
      {
         var count:uint = 0;
         var loop:Function = function(param1:uint):void
         {
            var cnt:uint = param1;
            UserInfoManager.upDateMoreInfo(_infoArr[count],function():void
            {
               ++count;
               if(count == _infoArr.length)
               {
                  if(_msgArr.length > 0)
                  {
                     updateList();
                  }
                  else
                  {
                     updateItemData();
                     _isUpdating = false;
                     EventManager.dispatchEvent(new DynamicEvent(MEMBINFO_LIST,_infoArr));
                  }
                  return;
               }
               loop(count);
            });
         };
         count = 0;
         loop(count);
      }
      
      private static function updateItemData() : void
      {
         var _loc1_:uint = 0;
         var _loc2_:uint = 0;
         var _loc3_:UserInfo = null;
         var _loc4_:BasePeoleModel = null;
         var _loc5_:UserInfo = null;
         var _loc6_:UserInfo = null;
         var _loc7_:UserInfo = null;
         var _loc8_:GroupMembItem = null;
         _infoArr = [];
         for each(_loc1_ in _membList)
         {
            _loc4_ = UserManager.getUserModel(_loc1_);
            if(_loc1_ == MainManager.actorID)
            {
               _loc4_ = MainManager.actorModel;
            }
            if(_loc4_)
            {
               _loc5_ = _loc4_.info;
               if(_loc5_)
               {
                  _infoArr.push(_loc5_);
               }
               else
               {
                  _loc6_ = new UserInfo();
                  _loc6_.userID = _loc1_;
                  _loc6_.nick = _loc1_.toString();
                  _infoArr.push(_loc6_);
               }
            }
            else
            {
               _loc7_ = new UserInfo();
               _loc7_.userID = _loc1_;
               _loc7_.nick = _loc1_.toString();
               _infoArr.push(_loc7_);
            }
         }
         _loc2_ = 0;
         for each(_loc3_ in _infoArr)
         {
            _loc8_ = new GroupMembItem(_loc3_);
            _loc8_.x = 2;
            _loc8_.y = _loc2_ * 55;
            _itemContainer.addChild(_loc8_);
            if(MainManager.actorInfo.groupInfo.leaderID == MainManager.actorID)
            {
               _loc8_.setCloseBtn(true);
            }
            else
            {
               _loc8_.setCloseBtn(false);
            }
            _loc2_++;
         }
      }
      
      private static function onShowHide(param1:MouseEvent) : void
      {
         if(_btn.currentFrame == 1)
         {
            TweenLite.to(_itemContainer,0.5,{"x":-120});
            _btn.gotoAndStop(2);
         }
         else
         {
            TweenLite.to(_itemContainer,0.5,{"x":0});
            _btn.gotoAndStop(1);
         }
      }
   }
}

