package com.robot.groupFight.manager
{
   import com.robot.core.CommandID;
   import com.robot.core.group.chat.GroupChatMsgInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.uic.TextScrollBar;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.events.KeyboardEvent;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import flash.ui.Keyboard;
   import flash.utils.ByteArray;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import gs.TweenLite;
   import org.taomee.effect.ColorFilter;
   import org.taomee.events.SocketEvent;
   import org.taomee.utils.DisplayUtil;
   
   public class GroupChatManager
   {
      
      private static var _instance:GroupChatManager;
      
      private static const MAX:int = 131;
      
      private var gpChatMsgMC:MovieClip;
      
      private var allMsgTxt:TextField;
      
      private var membMsgTxt:TextField;
      
      private var fightMsgTxt:TextField;
      
      private var scrollBar:TextScrollBar;
      
      private var chatMsgBtn:MovieClip;
      
      private var fightMsgBtn:MovieClip;
      
      private var chatAllBtn:SimpleButton;
      
      private var chatMembBtn:SimpleButton;
      
      private var curtType:uint = 1;
      
      private var curtY:int = -181;
      
      private var yLen:uint = 20;
      
      private var inputCurtY:int = -60;
      
      private var inputMC:MovieClip;
      
      private var typeTxt:TextField;
      
      private var inputTxt:TextField;
      
      private var sendBtn:SimpleButton;
      
      private var emotionBtn:SimpleButton;
      
      private var chatClewMC:MovieClip;
      private var hideTimeout:uint;
      
      public function GroupChatManager()
      {
         super();
      }
      
      public static function getInstance() : GroupChatManager
      {
         if(!_instance)
         {
            _instance = new GroupChatManager();
         }
         return _instance;
      }
      
      public function setup(msgMc:MovieClip) : void
      {
         this.gpChatMsgMC = msgMc;
         this.allMsgTxt = msgMc["allMsgTxt"];
         this.allMsgTxt.wordWrap = true;
         this.allMsgTxt.text = "";
         this.allMsgTxt.visible = false;
         this.membMsgTxt = msgMc["membMsgTxt"];
         this.membMsgTxt.wordWrap = true;
         this.membMsgTxt.text = "";
         this.membMsgTxt.visible = false;
         this.fightMsgTxt = msgMc["fightMsgTxt"];
         this.fightMsgTxt.wordWrap = true;
         this.fightMsgTxt.text = "";
         this.fightMsgTxt.visible = true;
         this.chatMsgBtn = msgMc["chatMsgBtn"];
         this.chatMsgBtn.gotoAndStop(1);
         this.chatMsgBtn.buttonMode = true;
         this.fightMsgBtn = msgMc["fightMsgBtn"];
         this.fightMsgBtn.gotoAndStop(2);
         this.fightMsgBtn.buttonMode = true;
         this.chatAllBtn = msgMc["chatAllBtn"];
         this.chatMembBtn = msgMc["chatMembBtn"];
         this.inputMC = this.gpChatMsgMC["inputMC"];
         this.inputTxt = this.inputMC["inputTxt"];
         this.inputTxt.maxChars = 30;
         this.typeTxt = this.inputMC["typeTxt"];
         this.typeTxt.text = "全部";
         this.sendBtn = this.inputMC["sendBtn"];
         this.emotionBtn = this.inputMC["emotionBtn"];
         this.emotionBtn.mouseEnabled = false;
         this.emotionBtn.filters = [ColorFilter.setGrayscale()];
         this.chatClewMC = new ChatClewMC();
         this.scrollBar = new TextScrollBar(this.gpChatMsgMC,this.allMsgTxt,this.gpChatMsgMC["upBtn"],this.gpChatMsgMC["downBtn"]);
         GroupFightMsgManager.getInstance().setup(this.gpChatMsgMC);
         this.addEvent();
      }
      
      public function destroy() : void
      {
         if(this.gpChatMsgMC == null) return;
         this.removeEvent();
         clearTimeout(this.hideTimeout);
         TweenLite.killTweensOf(this.chatAllBtn);
         TweenLite.killTweensOf(this.chatMembBtn);
         TweenLite.killTweensOf(this.inputMC);
         if(Boolean(this.scrollBar))
         {
            this.scrollBar.destroy();
         }
         this.scrollBar = null;
         GroupFightMsgManager.getInstance().destroy();
         DisplayUtil.removeAllChild(this.gpChatMsgMC);
         this.gpChatMsgMC = null;
      }
      
      private function addEvent() : void
      {
         SocketConnection.addCmdListener(CommandID.GROUP_CHAT_MSG,this.onChatMsg);
         this.chatMsgBtn.addEventListener(MouseEvent.MOUSE_OVER,this.onShowTypeBtn);
         this.chatMsgBtn.addEventListener(MouseEvent.MOUSE_OUT,this.onHideTypeBtn);
         this.chatMsgBtn.addEventListener(MouseEvent.CLICK,this.onShowChatMsg);
         this.fightMsgBtn.addEventListener(MouseEvent.CLICK,this.onShowFightMsg);
         this.chatAllBtn.addEventListener(MouseEvent.CLICK,this.onShowChatAll);
         this.chatMembBtn.addEventListener(MouseEvent.CLICK,this.onShowChatMemb);
         this.sendBtn.addEventListener(MouseEvent.CLICK,this.onSendMsg);
         MainManager.getStage().focus = MainManager.getStage();
         MainManager.getStage().addEventListener(KeyboardEvent.KEY_DOWN,this.onEnterDown);
      }
      
      private function removeEvent() : void
      {
         SocketConnection.removeCmdListener(CommandID.GROUP_CHAT_MSG,this.onChatMsg);
         this.chatMsgBtn.removeEventListener(MouseEvent.MOUSE_OVER,this.onShowTypeBtn);
         this.chatMsgBtn.removeEventListener(MouseEvent.MOUSE_OUT,this.onHideTypeBtn);
         this.chatMsgBtn.removeEventListener(MouseEvent.CLICK,this.onShowChatMsg);
         this.fightMsgBtn.removeEventListener(MouseEvent.CLICK,this.onShowFightMsg);
         this.chatAllBtn.removeEventListener(MouseEvent.CLICK,this.onShowChatAll);
         this.chatMembBtn.removeEventListener(MouseEvent.CLICK,this.onShowChatMemb);
         this.sendBtn.removeEventListener(MouseEvent.CLICK,this.onSendMsg);
         MainManager.getStage().removeEventListener(KeyboardEvent.KEY_DOWN,this.onEnterDown);
      }
      
      private function onChatMsg(evt:SocketEvent) : void
      {
         var info:GroupChatMsgInfo = evt.data as GroupChatMsgInfo;
         if(info.type == 1)
         {
            this.allMsgTxt.htmlText += "<font color=\'#00ff00\'>" + info.nick + "</font>: " + info.msg + "\r";
         }
         else
         {
            this.membMsgTxt.htmlText += "<font color=\'#ff0000\'>" + info.nick + "</font>: " + info.msg + "\r";
         }
         this.scrollBar.checkScroll();
         if(this.fightMsgTxt.visible == true)
         {
            this.chatMsgBtn.addChildAt(this.chatClewMC,0);
         }
         else
         {
            DisplayUtil.removeForParent(this.chatClewMC);
         }
      }
      
      private function onShowTypeBtn(evt:MouseEvent) : void
      {
         TweenLite.to(this.chatAllBtn,1,{"y":this.curtY + this.yLen});
         TweenLite.to(this.chatMembBtn,1,{"y":this.curtY + this.yLen});
      }
      
      private function onHideTypeBtn(evt:MouseEvent = null) : void
      {
         clearTimeout(this.hideTimeout);
         this.hideTimeout = setTimeout(function():void
         {
            hideTimeout = 0;
            TweenLite.to(chatAllBtn,1,{"y":curtY});
            TweenLite.to(chatMembBtn,1,{"y":curtY});
         },1500);
      }
      
      private function onShowChatMsg(evt:MouseEvent) : void
      {
         this.chatMsgBtn.gotoAndStop(2);
         this.fightMsgBtn.gotoAndStop(1);
         this.onShowChatAll();
         TweenLite.to(this.inputMC,0.5,{"y":this.inputCurtY});
         DisplayUtil.removeForParent(this.chatClewMC);
      }
      
      private function onShowFightMsg(evt:MouseEvent) : void
      {
         this.chatMsgBtn.gotoAndStop(1);
         this.fightMsgBtn.gotoAndStop(2);
         this.allMsgTxt.visible = false;
         this.membMsgTxt.visible = false;
         this.fightMsgTxt.visible = true;
         TweenLite.to(this.inputMC,0.5,{"y":this.inputCurtY + 30});
      }
      
      private function onShowChatAll(evt:MouseEvent = null) : void
      {
         this.curtType = 1;
         this.onHideTypeBtn();
         this.allMsgTxt.visible = true;
         this.membMsgTxt.visible = false;
         this.fightMsgTxt.visible = false;
         this.typeTxt.text = "全部";
         if(this.scrollBar != null) this.scrollBar.destroy();
         this.scrollBar = new TextScrollBar(this.gpChatMsgMC,this.allMsgTxt,this.gpChatMsgMC["upBtn"],this.gpChatMsgMC["downBtn"]);
      }
      
      private function onShowChatMemb(evt:MouseEvent) : void
      {
         this.curtType = 0;
         this.onHideTypeBtn();
         this.allMsgTxt.visible = false;
         this.membMsgTxt.visible = true;
         this.fightMsgTxt.visible = false;
         this.typeTxt.text = "组队";
         if(this.scrollBar != null) this.scrollBar.destroy();
         this.scrollBar = new TextScrollBar(this.gpChatMsgMC,this.membMsgTxt,this.gpChatMsgMC["upBtn"],this.gpChatMsgMC["downBtn"]);
      }
      
      private function onSendMsg(evt:MouseEvent = null) : void
      {
         if(this.inputTxt.text.length < 1)
         {
            return;
         }
         var str:String = this.inputTxt.text;
         var by:ByteArray = new ByteArray();
         var sLen:int = str.length;
         for(var i:int = 0; i < sLen; i++)
         {
            if(by.length > MAX)
            {
               break;
            }
            by.writeUTFBytes(str.charAt(i));
         }
         by.writeUTFBytes("0");
         SocketConnection.send(CommandID.GROUP_CHAT,this.curtType,by.length,by);
         this.inputTxt.text = "";
      }
      
      private function onEnterDown(evt:KeyboardEvent) : void
      {
         if(evt.keyCode == Keyboard.ENTER)
         {
            this.onSendMsg();
         }
      }
   }
}

