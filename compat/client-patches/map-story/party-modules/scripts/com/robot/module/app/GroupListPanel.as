package com.robot.module.app
{
   import com.robot.app.group.manager.GroupNoticeManager;
   import com.robot.app.user.UserInfoController;
   import com.robot.core.CommandID;
   import com.robot.core.event.RobotEvent;
   import com.robot.core.info.UserInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.UserInfoManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.utils.ArrayUtils;
   import com.robot.module.app.group.GroupListItem;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import flash.utils.ByteArray;
   import org.taomee.effect.ColorFilter;
   import org.taomee.events.DynamicEvent;
   import org.taomee.events.SocketEvent;
   import org.taomee.module.IModule;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class GroupListPanel extends Sprite implements IModule
   {
      
      private var _typeBtn:SimpleButton;
      
      private var _fireBtn:SimpleButton;
      
      private var _trsfBtn:SimpleButton;
      
      private var _seerInfoBtn:SimpleButton;
      
      private var _closeBtn:SimpleButton;
      
      private var _nameTxt:TextField;
      
      private var _chgNameConfBtn:MovieClip;
      
      private var _mainUI:MovieClip;
      
      private var _itemList:Array = [];
      
      private var _infoArr:Array;
      
      private var _userID:uint;
      
      private var _membList:Array;
      
      private var _curtItem:GroupListItem;
      
      private var _quitBtn:SimpleButton;
      
      private var _chgNameBtn:MovieClip;
      
      private var _chgLeaderBtn:SimpleButton;
      
      public function GroupListPanel()
      {
         super();
      }
      
      public function destroy() : void
      {
         removeEvent();
         DisplayUtil.removeForParent(_mainUI);
      }
      
      private function onGetMembInfo(evt:DynamicEvent) : void
      {
         _infoArr = evt.paramObject as Array;
         updateItemData();
      }
      
      private function updateData() : void
      {
         var count:uint = 0;
         var loop:Function = function(cnt:uint):void
         {
            UserInfoManager.getInfo(_membList[cnt],function(info:UserInfo):void
            {
               _infoArr.push(info);
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
      
      public function init(data:Object = null) : void
      {
      }
      
      private function updateMoreInfo() : void
      {
         var count:uint = 0;
         var loop:Function = function(cnt:uint):void
         {
            UserInfoManager.upDateMoreInfo(_infoArr[count],function():void
            {
               ++count;
               if(count == _infoArr.length)
               {
                  updateItemData();
                  return;
               }
               loop(count);
            });
         };
         count = 0;
         loop(count);
      }
      
      private function onChgName(evt:MouseEvent) : void
      {
         _nameTxt.selectable = true;
         _nameTxt.mouseEnabled = true;
         _chgNameBtn.visible = false;
         _chgNameConfBtn.visible = true;
      }
      
      private function onClickItem(evt:MouseEvent) : void
      {
         if(_curtItem)
         {
            _curtItem.mc.gotoAndStop(1);
         }
         var item:GroupListItem = evt.currentTarget as GroupListItem;
         item.mc.gotoAndStop(2);
         _curtItem = item;
         _seerInfoBtn.mouseEnabled = true;
         _seerInfoBtn.filters = [];
      }
      
      private function onFireMember(evt:MouseEvent) : void
      {
         GroupNoticeManager.addEventListener(RobotEvent.QUIT_GROUP,onFireMembSuc);
         if(Boolean(_curtItem) && _curtItem.userID != MainManager.actorID)
         {
            SocketConnection.send(CommandID.FIRE_GROUP_MEMBER,_curtItem.userID);
         }
         else
         {
            Alarm.show("你不能把你自己开除哟!");
         }
      }
      
      private function onChgNameConf(evt:MouseEvent) : void
      {
         if(checkNickLength())
         {
            return;
         }
         _nameTxt.selectable = false;
         _nameTxt.mouseEnabled = false;
         if(_nameTxt.length == 0)
         {
            _nameTxt.text = "赛尔小队";
         }
         var by:ByteArray = new ByteArray();
         by.writeUTFBytes(_nameTxt.text);
         by.length = 16;
         SocketConnection.send(CommandID.CHG_GROUP_NAME,by);
         _chgNameBtn.visible = true;
         _chgNameConfBtn.visible = false;
      }
      
      private function onQuitGroupSuc(evt:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(CommandID.QUIT_GROUP,onQuitGroupSuc);
         Alarm.show("你已经成功退出小队");
         hide();
      }
      
      private function onChgLeader(evt:MouseEvent) : void
      {
         if(_curtItem == null)
         {
            Alarm.show("请先选择要移交队长的队员。");
            return;
         }
         GroupNoticeManager.addEventListener(RobotEvent.NEW_LEADER_GROUP,onChgLeaderSuc);
         SocketConnection.send(CommandID.CHG_GROUP_LEADER,_curtItem.userID);
      }
      
      public function hide() : void
      {
         destroy();
      }
      
      public function setup() : void
      {
         var b:Boolean = false;
         var item:GroupListItem = null;
         _mainUI = new ui_GroupListPanel();
         _typeBtn = _mainUI["typeBtn"];
         _typeBtn.mouseEnabled = false;
         _typeBtn.filters = [ColorFilter.setGrayscale()];
         _fireBtn = _mainUI["fireBtn"];
         _chgLeaderBtn = _mainUI["chgLeaderBtn"];
         _quitBtn = _mainUI["quitBtn"];
         _closeBtn = _mainUI["closeBtn"];
         _seerInfoBtn = _mainUI["seerInfoBtn"];
         _chgNameBtn = _mainUI["changeMC"];
         _chgNameBtn.buttonMode = true;
         _chgNameBtn.visible = false;
         _chgNameConfBtn = _mainUI["sucMC"];
         _chgNameConfBtn.buttonMode = true;
         _chgNameConfBtn.visible = false;
         _trsfBtn = _mainUI["trsfBtn"];
         _trsfBtn.mouseEnabled = false;
         _trsfBtn.filters = [ColorFilter.setGrayscale()];
         DisplayUtil.removeForParent(_chgNameBtn);
         DisplayUtil.removeForParent(_chgNameConfBtn);
         _nameTxt = _mainUI["nameTxt"];
         _nameTxt.selectable = false;
         _nameTxt.mouseEnabled = false;
         _nameTxt.maxChars = 10;
         for(var i:uint = 0; i < 5; i++)
         {
            b = !Boolean(i);
            item = new GroupListItem(b);
            item.name = "item_" + i;
            _mainUI.addChild(item);
            item.x = 35 + item.width * i;
            item.y = 135;
         }
      }
      
      private function update() : void
      {
         _membList = MainManager.actorInfo.groupInfo.memberList;
         updateData();
      }
      
      private function onQuitGroup(evt:MouseEvent) : void
      {
         SocketConnection.addCmdListener(CommandID.QUIT_GROUP,onQuitGroupSuc);
         SocketConnection.send(CommandID.QUIT_GROUP);
      }
      
      private function updateItemData() : void
      {
         var itemName:String = null;
         var item:GroupListItem = null;
         addEvent();
         setRight();
         for(var i:uint = 0; i < 5; i++)
         {
            itemName = "item_" + i;
            item = _mainUI.getChildByName(itemName) as GroupListItem;
            if(item)
            {
               item.update(_infoArr[i]);
               if(_infoArr[i])
               {
                  item.buttonMode = true;
                  item.addEventListener(MouseEvent.CLICK,onClickItem);
               }
               else
               {
                  item.buttonMode = false;
                  item.removeEventListener(MouseEvent.CLICK,onClickItem);
               }
            }
         }
      }
      
      private function onClose(evt:MouseEvent) : void
      {
         hide();
      }
      
      private function setRight() : void
      {
         if(_curtItem)
         {
            _curtItem.mc.gotoAndStop(1);
            _curtItem = null;
         }
         _seerInfoBtn.mouseEnabled = false;
         _seerInfoBtn.filters = [ColorFilter.setGrayscale()];
         _fireBtn.mouseEnabled = false;
         _fireBtn.filters = [ColorFilter.setGrayscale()];
         _chgLeaderBtn.mouseEnabled = false;
         _chgLeaderBtn.filters = [ColorFilter.setGrayscale()];
         if(MainManager.actorInfo.groupInfo.leaderID == MainManager.actorID)
         {
            if(_membList.length > 1)
            {
               _fireBtn.mouseEnabled = true;
               _fireBtn.filters = [];
               _chgLeaderBtn.mouseEnabled = true;
               _chgLeaderBtn.filters = [];
            }
            _trsfBtn.mouseEnabled = true;
            _trsfBtn.filters = [];
            _chgNameBtn.visible = true;
         }
         else
         {
            _fireBtn.mouseEnabled = false;
            _fireBtn.filters = [ColorFilter.setGrayscale()];
            _chgLeaderBtn.mouseEnabled = false;
            _chgLeaderBtn.filters = [ColorFilter.setGrayscale()];
            _trsfBtn.mouseEnabled = false;
            _trsfBtn.filters = [ColorFilter.setGrayscale()];
            _chgNameBtn.visible = false;
         }
      }
      
      private function onFireMembSuc(evt:RobotEvent) : void
      {
         if(_curtItem)
         {
            GroupNoticeManager.removeEventListener(RobotEvent.QUIT_GROUP,onFireMembSuc);
            Alarm.show("你已经成功开除<font color=\'0xff0000\'>" + _curtItem.info.nick + "</font>");
            update();
         }
      }
      
      private function onChosType(evt:MouseEvent) : void
      {
         hide();
      }
      
      private function onShowSeerInfo(evt:MouseEvent) : void
      {
         if(_curtItem)
         {
            UserInfoController.show(_curtItem.info.userID);
         }
      }
      
      private function onGroupTrsf(evt:MouseEvent) : void
      {
         SocketConnection.send(CommandID.GROUP_SUIT_TRANSFORM,1);
         hide();
      }
      
      private function onChgLeaderSuc(evt:RobotEvent) : void
      {
         if(_curtItem)
         {
            GroupNoticeManager.removeEventListener(RobotEvent.NEW_LEADER_GROUP,onChgLeaderSuc);
            Alarm.show("你已经成功替换<font color=\'0xff0000\'>" + _curtItem.info.nick + "</font>为队长");
            update();
         }
      }
      
      private function removeEvent() : void
      {
         _typeBtn.removeEventListener(MouseEvent.CLICK,onChosType);
         _fireBtn.removeEventListener(MouseEvent.CLICK,onFireMember);
         _chgLeaderBtn.removeEventListener(MouseEvent.CLICK,onChgLeader);
         _quitBtn.removeEventListener(MouseEvent.CLICK,onQuitGroup);
         _closeBtn.removeEventListener(MouseEvent.CLICK,hide);
         _seerInfoBtn.removeEventListener(MouseEvent.CLICK,onShowSeerInfo);
         _chgNameBtn.removeEventListener(MouseEvent.CLICK,onChgName);
         _chgNameConfBtn.removeEventListener(MouseEvent.CLICK,onChgNameConf);
         _trsfBtn.removeEventListener(MouseEvent.CLICK,onGroupTrsf);
      }
      
      private function addEvent() : void
      {
         _typeBtn.addEventListener(MouseEvent.CLICK,onChosType);
         _fireBtn.addEventListener(MouseEvent.CLICK,onFireMember);
         _chgLeaderBtn.addEventListener(MouseEvent.CLICK,onChgLeader);
         _quitBtn.addEventListener(MouseEvent.CLICK,onQuitGroup);
         _closeBtn.addEventListener(MouseEvent.CLICK,onClose);
         _seerInfoBtn.addEventListener(MouseEvent.CLICK,onShowSeerInfo);
         _chgNameBtn.addEventListener(MouseEvent.CLICK,onChgName);
         _chgNameConfBtn.addEventListener(MouseEvent.CLICK,onChgNameConf);
         _trsfBtn.addEventListener(MouseEvent.CLICK,onGroupTrsf);
      }
      
      public function show() : void
      {
         if(MainManager.actorInfo.groupInfo == null || MainManager.actorInfo.groupInfo.memberList.length == 0)
         {
            Alarm.show("你还没有加入小队哟");
            return;
         }
         _membList = MainManager.actorInfo.groupInfo.memberList;
         ArrayUtils.removeDuplicates(_membList);
         if(DisplayUtil.hasParent(_mainUI))
         {
            return;
         }
         LevelManager.appLevel.addChild(_mainUI);
         DisplayUtil.align(_mainUI,null,AlignType.MIDDLE_CENTER);
         updateData();
      }
      
      private function checkNickLength() : Boolean
      {
         var bToLong:Boolean = false;
         var nickByte:ByteArray = new ByteArray();
         nickByte.writeUTFBytes(_nameTxt.text);
         if(nickByte.length > 10)
         {
            Alarm.show("输入的文字太长了");
            bToLong = true;
         }
         return bToLong;
      }
   }
}

