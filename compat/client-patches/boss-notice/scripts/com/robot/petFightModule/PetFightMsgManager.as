package com.robot.petFightModule
{
   import com.robot.core.config.xml.*;
   import com.robot.core.info.fightInfo.attack.AttackValue;
   import com.robot.core.manager.*;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.uic.*;
   import com.robot.petFightModule.control.*;
   import com.robot.petFightModule.mode.BaseFighterMode;
   import flash.display.MovieClip;
   import flash.text.TextField;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketEvent;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;
   
   public class PetFightMsgManager
   {
      
      private static var scrollBar:TextScrollBar;
      
      private static var txt:TextField;
      
      private static var msgMC:MovieClip;
      
      // 首领提示（64006）：服务端在回合结果之后下发，等本回合双方出手都播完（PetFightController 调 roundEnd）再追加到战报末尾
      private static const BOSS_NOTICE_CMD:uint = 64006;
      
      private static var noticeListening:Boolean = false;
      
      private static var noticeStarted:Boolean = false;
      
      private static var noticePending:String = null;
      
      private static var noticeWaitRound:Boolean = false;
      
      private static var critEffect:MovieClip = new attack_crit_effect();
      
      private static var critseer:MovieClip = new attack_crit_seer();
      
      public static var STATUS_ARRAY:Array = ["麻痹","中毒","烧伤","吸取对方的体力","被对方吸取体力","冻伤","害怕","疲惫","睡眠","石化","混乱","衰弱","山神守护","易燃","狂暴","冰封","流血","免疫能力下降","免疫异常状态"];
      
      public static var TRAIT_STATUS_ARRAY:Array = ["攻击","防御","特攻","特防","速度","命中"];
      
      public function PetFightMsgManager()
      {
         super();
      }
      
      private static function onPlayEndHandler() : void
      {
         critseer.gotoAndStop(critseer.totalFrames - 1);
         critseer.addFrameScript(critseer.totalFrames - 1,null);
         DisplayUtil.removeForParent(critseer);
         critseer = null;
      }
      
      public static function showText(param1:AttackValue) : void
      {
         var _loc2_:Number = 0;
         var _loc3_:int = 0;
         var _loc4_:* = 0;
         var _loc5_:String = null;
         var _loc6_:Number = 0;
         var _loc7_:String = null;
         var _loc8_:* = MainManager.actorInfo.userID == param1.userID;
         _loc4_ = uint(PetFightEntry.fighterCon.getFighterMode(param1.userID).petID);
         var _loc9_:String = PetXMLInfo.getName(_loc4_);
         if(Boolean(_loc8_))
         {
            _loc5_ = "ffffff";
         }
         else
         {
            _loc5_ = "FF00FF";
         }
         var _loc10_:* = "<font color=\'#" + _loc5_ + "\'>【" + _loc9_ + "】";
         if(param1.skillID != 0)
         {
            _loc7_ = SkillXMLInfo.getName(param1.skillID);
            _loc10_ += "使用了<font color=\'#ffff00\'>" + _loc7_ + "，</font>";
         }
         if(param1.isCrit)
         {
            if(param1.userID == MainManager.actorID)
            {
               critEffect.scaleX = 1;
               critEffect.x = 0;
               critseer = new attack_crit_seer();
               critseer.mouseChildren = false;
               critseer.mouseEnabled = false;
               LevelManager.root.addChild(critseer);
               DisplayUtil.align(critseer,null,AlignType.MIDDLE_CENTER);
               critseer.addFrameScript(critseer.totalFrames - 1,onPlayEndHandler);
            }
            else
            {
               critEffect.scaleX = -1;
               critEffect.x = MainManager.getStageWidth();
            }
            critEffect["mc"].gotoAndPlay(2);
            MainManager.getStage().addChild(critEffect);
            _loc10_ += "打出了致命一击，";
         }
         if(param1.skillID != 0)
         {
            _loc10_ += SkillXMLInfo.getInfo(param1.skillID) + " ";
         }
         _loc10_ += "<font color=\'#66FF00\'>〖状态〗:";
         var _loc11_:BaseFighterMode = PetFightEntry.fighterCon.getFighterMode(param1.userID);
         _loc11_.propView.removeAllEffect();
         var _loc12_:Number = 0;
         var _loc13_:Boolean = false;
         for each(_loc6_ in param1.status)
         {
            if(_loc6_ != 0)
            {
               _loc10_ += STATUS_ARRAY[_loc12_] + ":" + _loc6_.toString() + "回合 ";
               _loc13_ = true;
               PetStautsEffect.addEffect(param1.userID,_loc12_,_loc6_);
            }
            _loc12_++;
         }
         _loc2_ = 0;
         _loc3_ = 0;
         for each(_loc3_ in param1.battleLv)
         {
            if(_loc3_ != 0)
            {
               PetStautsEffect.addEffectTrait(param1.userID,_loc2_,_loc3_);
            }
            _loc2_++;
         }
         if(!_loc13_)
         {
            _loc10_ += "正常";
         }
         txt.htmlText += _loc10_ + "</font>\r";
         scrollBar.checkScroll();
      }
      
      public static function setup(param1:MovieClip) : void
      {
         msgMC = param1;
         txt = msgMC["msg_txt"];
         txt.text = "";
         scrollBar = new TextScrollBar(msgMC,txt);
         noticeStarted = false;
         noticePending = null;
         noticeWaitRound = false;
         if(!noticeListening)
         {
            noticeListening = true;
            SocketConnection.addCmdListener(BOSS_NOTICE_CMD,onBossNotice);
         }
      }
      
      private static function onBossNotice(param1:SocketEvent) : void
      {
         var _loc2_:ByteArray = param1.data as ByteArray;
         if(_loc2_ == null || _loc2_.length < 24 || txt == null)
         {
            return;
         }
         var _loc3_:uint = _loc2_.position;
         _loc2_.position = 0;
         var _loc4_:uint = _loc2_.readUnsignedInt();
         _loc2_.position = 20;
         var _loc5_:uint = _loc2_.readUnsignedInt();
         var _loc6_:String = _loc5_ > 0 && _loc5_ <= _loc2_.bytesAvailable ? _loc2_.readUTFBytes(_loc5_) : "";
         _loc2_.position = _loc3_;
         if(_loc6_.length == 0)
         {
            return;
         }
         if(noticePending != null && noticeStarted)
         {
            flushBossNotice();
         }
         noticePending = _loc6_;
         // 1 = 跟在一回合结果之后，等回合播完；2 = 开战或补位换精灵，立即显示
         noticeWaitRound = _loc4_ == 1;
         if(noticeStarted && !noticeWaitRound)
         {
            flushBossNotice();
         }
      }
      
      public static function roundEnd() : void
      {
         if(noticePending != null)
         {
            flushBossNotice();
         }
      }
      
      private static function flushBossNotice() : void
      {
         var _loc1_:String = noticePending;
         noticePending = null;
         noticeWaitRound = false;
         if(_loc1_ == null || txt == null)
         {
            return;
         }
         _loc1_ = _loc1_.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"\r");
         txt.htmlText += "<font color=\'#F4D58A\'>" + _loc1_ + "</font>\r";
         scrollBar.checkScroll();
      }
      
      public static function showStartText() : void
      {
         var _loc1_:String = "我方<font color=\'#ffffff\'>【" + FighterModeFactory.playerMode.petName + "】</font>登场了！\r";
         _loc1_ += "对方<font color=\'#FF00FF\'>【" + FighterModeFactory.enemyMode.petName + "】</font>登场了！\r";
         txt.htmlText += _loc1_;
         noticeStarted = true;
         if(noticePending != null && !noticeWaitRound)
         {
            flushBossNotice();
         }
      }
   }
}

