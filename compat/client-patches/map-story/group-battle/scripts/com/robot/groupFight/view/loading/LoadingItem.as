package com.robot.groupFight.view.loading
{
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.group.fightInfo.readyToFight.GroupReadyToFtUserInfo;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.text.TextField;
   
   public class LoadingItem extends Sprite
   {
      
      public var mc:MovieClip;
      
      public var txt:TextField;
      
      private var info:GroupReadyToFtUserInfo;
      private var leaderID:uint;
      
      public function LoadingItem(info:GroupReadyToFtUserInfo, leaderID:uint)
      {
         super();
         this.info = info;
         this.leaderID = leaderID;
         this.init();
      }
      
      public function init() : void
      {
         this.mc = new LoadPercentItem();
         this.mc.gotoAndStop(1);
         if(this.info.userID == this.leaderID)
         {
            this.mc["icon"].visible = true;
         }
         else
         {
            this.mc["icon"].visible = false;
         }
         this.txt = this.mc["percentTxt"];
         if(this.info.userID == 0)
         {
            this.mc["nameTxt"].htmlText = PetXMLInfo.getName(this.info.monList[0].id);
         }
         else
         {
            this.mc["nameTxt"].htmlText = this.info.userID.toString() + "\r" + this.info.nick;
         }
         this.addChild(this.mc);
      }
   }
}

