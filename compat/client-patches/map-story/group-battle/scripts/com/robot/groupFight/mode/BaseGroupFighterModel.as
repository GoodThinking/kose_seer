package com.robot.groupFight.mode
{
   import com.robot.core.group.fightInfo.startFight.GroupFightPetInfo;
   import com.robot.core.group.model.GroupFightModel;
   import com.robot.core.manager.MainManager;
   import com.robot.groupFight.data.FighterModelFactory;
   import com.robot.groupFight.data.FighterPetInfoFactory;
   import com.robot.groupFight.view.BaseFighterBloodWin;
   import com.robot.groupFight.view.BaseFighterHPView;
   import com.robot.groupFight.view.BaseFighterPetWin;
   import com.robot.groupFight.view.PlayerFighterPetWin;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import org.taomee.utils.DisplayUtil;
   
   public class BaseGroupFighterModel
   {
      
      public var info:GroupFightPetInfo;
      
      private var _container:Sprite;
      
      public var petWin:BaseFighterPetWin;
      
      public var hpView:BaseFighterHPView;
      
      public var bloodWin:BaseFighterBloodWin;
      
      public function BaseGroupFighterModel(i:GroupFightPetInfo, container:Sprite)
      {
         super();
         this.info = i;
         this._container = container;
         this.init();
      }
      
      public function destroy() : void
      {
         if(Boolean(this._container))
         {
            this._container = null;
         }
         if(Boolean(this.petWin))
         {
            this.petWin.removeEventListener(MouseEvent.CLICK,this.onClick);
            this.petWin.destroy();
            this.petWin = null;
         }
         if(Boolean(this.hpView))
         {
            this.hpView.destroy();
            this.hpView = null;
         }
         if(Boolean(this.bloodWin))
         {
            this.bloodWin.destroy();
            this.bloodWin = null;
         }
      }
      
      private function init() : void
      {
         this.createView();
      }
      
      private function createView() : void
      {
         if(this.info.userID == MainManager.actorID)
         {
            this.petWin = new PlayerFighterPetWin(this.info);
            this.bloodWin = new BaseFighterBloodWin(this._container["MyInfoPanel"]);
            this.bloodWin.update(this.info);
         }
         else
         {
            this.petWin = new BaseFighterPetWin(this.info);
            this.petWin.buttonMode = true;
            this.petWin.addEventListener(MouseEvent.CLICK,this.onClick);
            this.bloodWin = new BaseFighterBloodWin(this._container["OtherInfoPanel"]);
         }
         this.hpView = new BaseFighterHPView();
         this.petWin.update(this.info);
         if(GroupFightModel.status == GroupFightModel.FIGHT_WITH_BOSS && this.info.userID == 0)
         {
            if(FighterPetInfoFactory.opponentMap.length == 1)
            {
               this.petWin.scaleX = 1.5;
               this.petWin.scaleY = 1.5;
            }
            else
            {
               this.petWin.scaleX = 1;
               this.petWin.scaleY = 1;
            }
         }
         else
         {
            this.petWin.scaleX = 1;
            this.petWin.scaleY = 1;
         }
         this._container.addChildAt(this.petWin,1);
         this.petWin.addChild(this.hpView);
         this.hpView.y = -BaseFighterPetWin.WIN_HEIGHT - 5;
         this._container["OtherInfoPanel"].visible = false;
      }
      
      private function onClick(evt:MouseEvent) : void
      {
         var pWin:BaseFighterPetWin = evt.currentTarget as BaseFighterPetWin;
         if(Boolean(this.bloodWin))
         {
            this._container["OtherInfoPanel"].visible = true;
            this.bloodWin.isShowHp = FighterModelFactory.playerMode.info.isShowFtHp;
            this.bloodWin.update(pWin.info);
         }
      }
   }
}

