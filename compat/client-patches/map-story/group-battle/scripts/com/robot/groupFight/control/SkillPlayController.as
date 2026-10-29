package com.robot.groupFight.control
{
   import com.robot.core.CommandID;
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.group.fightInfo.fightOver.GroupFightOverInfo;
   import com.robot.core.group.fightInfo.fighting.GpFtSpriteNoticeInfo;
   import com.robot.core.group.fightInfo.fighting.skill.GpFtSkillHurtInfo;
   import com.robot.core.group.fightInfo.fighting.skill.SkillHurtInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.groupFight.control.skill.ISkillAction;
   import com.robot.groupFight.control.skill.SkillPlayInfo;
   import com.robot.groupFight.data.FighterModelFactory;
   import com.robot.groupFight.manager.GpFtSpriteNoticeManager;
   import com.robot.groupFight.manager.TimerManager;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.EventManager;
   
   public class SkillPlayController
   {
      
      private static var instance:SkillPlayController;
      
      private var _info:GpFtSkillHurtInfo;
      
      private var _infoArr:Array = [];
      
      private var _sInfo:SkillPlayInfo;
      
      private var _isFightOver:Boolean = false;
      
      private var _overData:GroupFightOverInfo;
      
      private var _isPlaying:Boolean = false;
      
      private var _noticeInfoArr:Array = [];
      
      public function SkillPlayController()
      {
         super();
      }
      
      public static function getInstance() : SkillPlayController
      {
         if(instance == null)
         {
            instance = new SkillPlayController();
         }
         return instance;
      }
      
      public function setup() : void
      {
         SocketConnection.addCmdListener(CommandID.GROUP_FT_SKILL_HURT,this.onSkillHurt);
         SocketConnection.addCmdListener(CommandID.GROUP_FT_BOUT_DONE,this.onBoutDone);
         EventManager.addEventListener(GroupFightEvent.SKILL_ATTACK_DONE,this.onSkillAttackDone);
         EventManager.addEventListener(GroupFightEvent.FIGHT_OVER,this.onFightOver);
         SocketConnection.addCmdListener(CommandID.GROUP_FT_SPRITE_NOTICE,this.onSpriteNotice);
      }
      
      public function destroy() : void
      {
         SkillTimerManager.stopTimer();
         SkillMouseController.undo();
         SocketConnection.removeCmdListener(CommandID.GROUP_FT_SKILL_HURT,this.onSkillHurt);
         SocketConnection.removeCmdListener(CommandID.GROUP_FT_BOUT_DONE,this.onBoutDone);
         EventManager.removeEventListener(GroupFightEvent.SKILL_ATTACK_DONE,this.onSkillAttackDone);
         EventManager.removeEventListener(GroupFightEvent.FIGHT_OVER,this.onFightOver);
         SocketConnection.removeCmdListener(CommandID.GROUP_FT_SPRITE_NOTICE,this.onSpriteNotice);
         SpriteDieController.destroy();
         TimerManager.clear();
         SpriteDieController.diedSpriteList = [];
         this._info = null;
         this._overData = null;
         this._isFightOver = false;
         this._infoArr = [];
         this._noticeInfoArr = [];
         this._sInfo = null;
         this._isPlaying = false;
      }
      
      private function onSkillHurt(evt:SocketEvent) : void
      {
         var attData:SkillHurtInfo = null;
         var _pp:uint = 0;
         var model:BaseGroupFighterModel = null;
         var info:GpFtSkillHurtInfo = evt.data as GpFtSkillHurtInfo;
         if(info.attackSkillHurtInfo.userID == MainManager.actorID)
         {
            attData = info.attackSkillHurtInfo;
            _pp = uint(attData.moveMap.getValue(attData.moveID));
            SkillMouseController.pp = _pp;
            EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.USE_SKILL_SUC_PP,[attData.moveID,SkillMouseController.pp]));
         }
         trace(info.attackSkillHurtInfo.userID + "-- acttack -->" + info.attackedSkillHurtInfo.userID);
         this._infoArr.push(info);
         GroupFightController.isStartFihgt = true;
         for each(model in FighterModelFactory.fighterModelMap.getValues())
         {
            if(Boolean(model))
            {
               model.petWin.removeWaitClock();
            }
         }
      }
      
      private function onBoutDone(evt:SocketEvent) : void
      {
         var by:ByteArray = evt.data as ByteArray;
         var bout:uint = by.readUnsignedInt();
         if(!this._isPlaying)
         {
            this.play(this._infoArr);
         }
      }
      
      public function play(arr:Array) : void
      {
         var i:GpFtSpriteNoticeInfo = null;
         TimerManager.clearTxt();
         if(arr.length < 1)
         {
            SpriteDieController.dealWithDiePet();
            if(this._isFightOver)
            {
               EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.FIGHT_CLOSE,{"data":this._overData}));
               return;
            }
            else
            {
               if(!this._isFightOver)
               {
                  SocketConnection.send(CommandID.GROUP_FT_SKILL_PLAY_OVER);
               }
               EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.SKILL_MOVIE_DONE));
            }
            for each(i in this._noticeInfoArr)
            {
               GpFtSpriteNoticeManager.chgFtPetInfo(i);
            }
            this._noticeInfoArr = [];
            this._isPlaying = false;
            return;
         }
         this.parseBout();
      }
      
      private function parseBout() : void
      {
         var skillAction:ISkillAction = SkillActionPase.paseSkill(this._infoArr);
         skillAction.play();
         SkillTimerManager.startTimer();
         this._isPlaying = true;
      }
      
      private function onSkillAttackDone(evt:GroupFightEvent) : void
      {
         SkillTimerManager.stopTimer();
         this.play(this._infoArr);
         SocketConnection.send(CommandID.GROUP_FT_SKILL_PLAY_OVER);
      }
      
      private function onFightOver(evt:GroupFightEvent) : void
      {
         this._overData = evt.dataObj as GroupFightOverInfo;
         this._isFightOver = true;
         if(!this._isPlaying)
         {
            this.play(this._infoArr);
         }
         if(FighterModelFactory.playerMode != null)
         {
            FighterModelFactory.playerMode.subject.closePanel();
            if(FighterModelFactory.playerMode.ctlPanel != null) FighterModelFactory.playerMode.ctlPanel.removeEvent();
         }
         TimerManager.clear();
      }
      
      private function onSpriteNotice(evt:SocketEvent) : void
      {
         var info:GpFtSpriteNoticeInfo = evt.data as GpFtSpriteNoticeInfo;
         this._noticeInfoArr.push(info);
      }
   }
}

