package com.robot.app.group
{
   import com.robot.app.bag.BagClothPreview;
   import com.robot.app.user.UserInfoController;
   import com.robot.core.CommandID;
   import com.robot.core.info.UserInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.skeleton.ClothPreview;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import org.taomee.utils.DisplayUtil;
   
   public class GroupMembItem extends Sprite
   {
      
      private var _mc:MovieClip;
      
      private var _seerMC:MovieClip;
      
      private var _nameTxt:TextField;
      
      private var _closeBtn:SimpleButton;
      
      private var _leaderIcon:MovieClip;
      
      private var _faceShow:Sprite;
      
      private var _clothPrev:BagClothPreview;
      
      private var _info:UserInfo;
      
      public function GroupMembItem(param1:UserInfo)
      {
         super();
         this._info = param1;
         this.init();
         this.update(param1);
      }
      
      public function destroy() : void
      {
         if(this._closeBtn)
         {
            this._closeBtn.removeEventListener(MouseEvent.CLICK,this.onLeaderFire);
            this._closeBtn.removeEventListener(MouseEvent.CLICK,this.onQuit);
         }
         if(this._mc)
         {
            DisplayUtil.removeAllChild(this._mc);
            DisplayUtil.removeForParent(this._mc);
         }
      }
      
      public function setCloseBtn(param1:Boolean = false) : void
      {
         if(param1 && this._info.userID != MainManager.actorID)
         {
            this._closeBtn.visible = true;
            this._closeBtn.addEventListener(MouseEvent.CLICK,this.onLeaderFire);
         }
         else
         {
            this._closeBtn.addEventListener(MouseEvent.CLICK,this.onQuit);
         }
      }
      
      private function init() : void
      {
         if(MainManager.actorInfo.groupInfo.leaderID == this._info.userID)
         {
            this._mc = GroupUiLinkage.getDisplayObject("GpMembItem_mc_vip") as MovieClip;
            this._leaderIcon = this._mc["leaderIcon"];
            if(Boolean(this._info.vip))
            {
               this._leaderIcon.gotoAndStop(2);
            }
            else
            {
               this._leaderIcon.gotoAndStop(1);
            }
         }
         else
         {
            this._mc = GroupUiLinkage.getDisplayObject("GpMembItem_mc") as MovieClip;
         }
         this._nameTxt = this._mc["txt"];
         this._seerMC = this._mc["seerMC"];
         this._seerMC.buttonMode = true;
         this._seerMC.addEventListener(MouseEvent.CLICK,this.showSeerInfo);
         this._closeBtn = this._mc["closeBtn"];
         if(this._info.userID != MainManager.actorID)
         {
            this._closeBtn.visible = false;
         }
         this.addChild(this._mc);
      }
      
      private function update(param1:UserInfo) : void
      {
         if(param1)
         {
            this.addItem();
            this._nameTxt.text = param1.nick;
            this._clothPrev.changeColor(param1.color);
            this._clothPrev.showCloths(param1.clothes);
            this._clothPrev.showDoodle(param1.texture);
         }
         else if(this._faceShow)
         {
            DisplayUtil.removeAllChild(this._faceShow);
            DisplayUtil.removeForParent(this._faceShow);
            this._nameTxt.text = "";
         }
      }
      
      private function addItem() : void
      {
         if(this._faceShow)
         {
            DisplayUtil.removeAllChild(this._faceShow);
            DisplayUtil.removeForParent(this._faceShow);
            this._nameTxt.text = "";
         }
         this._faceShow = this.getFaceBg();
         this._seerMC.addChild(this._faceShow);
         if(this._clothPrev)
         {
            this._clothPrev.destroy();
            this._clothPrev = null;
         }
         this._clothPrev = new BagClothPreview(this._faceShow,null,ClothPreview.MODEL_SHOW);
      }
      
      private function getFaceBg() : Sprite
      {
         var _loc1_:Sprite = GroupUiLinkage.getSprite("ComposeMC");
         _loc1_.mouseEnabled = false;
         _loc1_.mouseChildren = false;
         _loc1_.scaleX = _loc1_.scaleY = 0.35;
         return _loc1_;
      }
      
      private function onLeaderFire(param1:MouseEvent) : void
      {
         SocketConnection.send(CommandID.FIRE_GROUP_MEMBER,this._info.userID);
      }
      
      private function onQuit(param1:MouseEvent) : void
      {
         GroupController.quitGroup();
      }
      
      private function showSeerInfo(param1:MouseEvent) : void
      {
         UserInfoController.show(this._info.userID);
      }
   }
}

