package com.robot.app.mapProcess
{
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.app.toolBar.ToolBarController;
   import com.robot.core.CommandID;
   import com.robot.core.aimat.AimatController;
   import com.robot.core.animate.AnimateManager;
   import com.robot.core.event.AimatEvent;
   import com.robot.core.event.PetFightEvent;
   import com.robot.core.event.RobotEvent;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.utils.CommonUI;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketErrorEvent;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.EventManager;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.net.SocketDispatcher;
   import org.taomee.utils.DisplayUtil;
   
   public class MapProcess_425 extends BaseMapProcess
   {
      
      private static var _pointArray:Array = [640,162,710,192,750,236,735,292,656,332,552,347,446,332,374,294,350,236,392,190,463,162,552,152];
      
      private var _shadeMc:MovieClip;
      
      private var _startMc:MovieClip;
      private var _startHint:Sprite;
      
      private var _hitMc_1:MovieClip;
      
      private var _hitMc_2:MovieClip;
      
      private var _leftMc:MovieClip;
      
      private var _rightMc:MovieClip;
      
      private var _keyMc:MovieClip;
      
      private var _wheelMc:MovieClip;
      
      private var _groundMc:MovieClip;
      
      private var _hitMc_3:MovieClip;
      
      private var _starOutMc:MovieClip;
      
      private var _leiyiMc:MovieClip;
      
      private var _leiyiOutMc:MovieClip;
      
      private var _petMc:MovieClip;
      
      private var _flashMc:MovieClip;
      
      private var _isFight:Boolean;
      
      private var _num:int;
      
      private var _index:int;
      
      private var _isTurn:Boolean;
      
      private var _isLeiyiClick:Boolean;
      
      private var _currentStar:MovieClip;
      
      private var _starArray:Array;
      private var _destroyed:Boolean;
      
      public function MapProcess_425()
      {
         super();
      }
      
      override protected function init() : void
      {
         ToolBarController.showOrHideAllUser(false);
         this._shadeMc = conLevel["shade_mc"];
         this._startMc = conLevel["start_mc"];
         this._hitMc_1 = conLevel["hit_1"];
         this._hitMc_2 = conLevel["hit_2"];
         ToolTipManager.add(this._hitMc_1,"用头部射击试试！");
         ToolTipManager.add(this._hitMc_2,"用头部射击试试！");
         this._leftMc = conLevel["left_mc"];
         this._rightMc = animatorLevel["right_mc"];
         this._keyMc = conLevel["key_mc"];
         this._wheelMc = conLevel["wheel_mc"];
         this._groundMc = animatorLevel["ground_mc"];
         this._hitMc_3 = animatorLevel["hit_3"];
         this._starOutMc = conLevel["starOut_mc"];
         this._leiyiMc = conLevel["leiyi_mc"];
         this._leiyiOutMc = conLevel["leiyiOut_mc"];
         this._petMc = conLevel["pet_mc"];
         this._flashMc = depthLevel["flash_mc"];
         this._startMc.buttonMode = true;
         this._startMc.addEventListener(MouseEvent.CLICK,this.onOneClick);
         ToolTipManager.add(this._startMc,"罗盘启动装置：点击开启探索");
         // start_mc is an invisible hit area; its children inherit alpha zero.
         this._startHint = new Sprite();
         this._startHint.x = this._startMc.x + 30;
         this._startHint.y = this._startMc.y;
         this._startHint.buttonMode = true;
         this._startHint.mouseChildren = false;
         CommonUI.addYellowExcal(this._startHint,0,-15);
         this._startHint.addEventListener(MouseEvent.CLICK,this.onOneClick);
         topLevel.addChild(this._startHint);
         ToolTipManager.add(this._startHint,"罗盘启动装置：点击开启探索");
         SocketConnection.addCmdListener(CommandID.GET_NONOPARTY_EXP,this.onExperienceReward);
         SocketDispatcher.getInstance().addEventListener(SocketErrorEvent.ERROR,this.onRewardError,false,2);
      }
      
      private function clearStartHint() : void
      {
         if(this._startHint == null) return;
         this._startHint.removeEventListener(MouseEvent.CLICK,this.onOneClick);
         ToolTipManager.remove(this._startHint);
         DisplayUtil.removeForParent(this._startHint);
         this._startHint = null;
      }

      private function onOneClick(param1:MouseEvent) : void
      {
         NpcDialog.show(NPC.SEER,["点击启动装置开启罗盘。点亮后，可头部射击左右发光装置，或转动钥匙领取物资。登上大罗盘，避开带电指针；等星球完全显现后逐个点击，共五次。沿南侧通路可返回空间补给站。"],["开始探索","再看看"],[beginExploration]);
      }

      private function beginExploration() : void
      {
         if(_destroyed) return;
         this.clearStartHint();
         ToolTipManager.remove(this._startMc);
         this._startMc.buttonMode = false;
         this._startMc.removeEventListener(MouseEvent.CLICK,this.onOneClick);
         AnimateManager.playMcAnimate(this._shadeMc,0,"",function():void
         {
            if(_destroyed) return;
            DisplayUtil.removeForParent(_shadeMc);
            _shadeMc = null;
            activeMap();
         });
      }
      
      private function activeMap() : void
      {
         AimatController.addEventListener(AimatEvent.PLAY_END,this.onAimatEnd);
         this._keyMc.buttonMode = true;
         this._keyMc.addEventListener(MouseEvent.CLICK,this.onKeyClick);
         MainManager.actorModel.addEventListener(RobotEvent.WALK_ENTER_FRAME,this.onWalk);
         ToolTipManager.add(this._keyMc,"转动钥匙，领取罗盘物资");
      }
      
      private function onAimatEnd(param1:AimatEvent) : void
      {
         var e:AimatEvent = param1;
         if(this._hitMc_1.hitTestPoint(e.info.endPos.x,e.info.endPos.y))
         {
            AimatController.removeEventListener(AimatEvent.PLAY_END,this.onAimatEnd);
            AnimateManager.playMcAnimate(this._leftMc,2,"mc",function():void
            {
               if(_destroyed) return;
               _leftMc.gotoAndStop(1);
               AimatController.addEventListener(AimatEvent.PLAY_END,onAimatEnd);
               SocketConnection.send(CommandID.GET_NONOPARTY_EXP);
            });
         }
         if(this._hitMc_2.hitTestPoint(e.info.endPos.x,e.info.endPos.y))
         {
            AimatController.removeEventListener(AimatEvent.PLAY_END,this.onAimatEnd);
            AnimateManager.playMcAnimate(this._rightMc,2,"mc",function():void
            {
               if(_destroyed) return;
               _rightMc.gotoAndStop(1);
               AimatController.addEventListener(AimatEvent.PLAY_END,onAimatEnd);
               SocketConnection.send(CommandID.GET_NONOPARTY_EXP);
            });
         }
      }

      private function onExperienceReward(param1:SocketEvent) : void
      {
         Alarm.show("你获得了" + (param1.data as ByteArray).readUnsignedInt() + "点积累经验。");
      }

      private function onRewardError(param1:SocketErrorEvent) : void
      {
         if(param1.headInfo == null || param1.headInfo.result != 5002)
         {
            return;
         }
         var command:uint = param1.headInfo.cmdID;
         if(command != CommandID.GET_NONOPARTY_EXP && command != CommandID.GET_NONOPARTY_ITEM)
         {
            return;
         }
         param1.stopImmediatePropagation();
         if(command == CommandID.GET_NONOPARTY_EXP)
         {
            Alarm.show("本周的罗盘经验已经领取过了，每周一北京时间 00:00 后可再次领取。");
         }
         else
         {
            Alarm.show("今天的这份罗盘奖励已经领取过了，北京时间 00:00 后可再次领取。");
         }
      }
      
      private function onKeyClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         this._keyMc.buttonMode = false;
         this._keyMc.removeEventListener(MouseEvent.CLICK,this.onKeyClick);
         this._keyMc.gotoAndPlay(2);
         AnimateManager.playMcAnimate(this._wheelMc,0,"",function():void
         {
            if(_destroyed) return;
            _keyMc.gotoAndStop(1);
            _wheelMc.gotoAndStop(1);
            _keyMc.buttonMode = true;
            _keyMc.addEventListener(MouseEvent.CLICK,onKeyClick);
            SocketConnection.send(CommandID.GET_NONOPARTY_ITEM,1);
         });
      }
      
      private function onWalk(param1:RobotEvent) : void
      {
         var star:String = null;
         var i:int = 0;
         var e:RobotEvent = param1;
         if(!this._isTurn && this._hitMc_3.hitTestPoint(MainManager.actorModel.pos.x,MainManager.actorModel.pos.y,true))
         {
            this._num = 0;
            this._isTurn = true;
            this._groundMc.addEventListener(Event.ENTER_FRAME,onGroundReady);
            this._groundMc.gotoAndStop(2);
            this._starArray = [];
            while(this._starArray.length < 15)
            {
               if(this._starArray.length == 11)
               {
                  this._starArray.push("star_3");
               }
               star = "star_" + Math.floor(Math.random() * 15);
               if(this._starArray.indexOf(star) == -1 && star != "star_3")
               {
                  this._starArray.push(star);
               }
            }
            this.starStart(this._starArray);
         }
         else if(this._isTurn && !this._hitMc_3.hitTestPoint(MainManager.actorModel.pos.x,MainManager.actorModel.pos.y,true))
         {
            this._isTurn = false;
            this._currentStar.removeEventListener(MouseEvent.CLICK,this.onStarClick);
            this._groundMc.gotoAndStop(1);
            this._groundMc.removeEventListener(Event.ENTER_FRAME,this.onArrowEnterFrame);
            while(i < 12)
            {
               conLevel[this._starArray[i]].x = -100;
               i++;
            }
         }
      }
      
      private function onArrowEnterFrame(param1:Event) : void
      {
         var e:Event = param1;
         if(Boolean(this._groundMc["arrow_mc"].hitTestPoint(MainManager.actorModel.pos.x,MainManager.actorModel.pos.y)))
         {
            MainManager.actorModel.stop();
            LevelManager.closeMouseEvent();
            this._currentStar.removeEventListener(MouseEvent.CLICK,this.onStarClick);
            this._groundMc.removeEventListener(Event.ENTER_FRAME,this.onArrowEnterFrame);
            this._flashMc.x = MainManager.actorModel.pos.x;
            this._flashMc.y = MainManager.actorModel.pos.y;
            AnimateManager.playMcAnimate(this._flashMc,0,"",function():void
            {
               if(_destroyed) return;
               var _loc1_:int = 0;
               _flashMc.x = -200;
               LevelManager.openMouseEvent();
               MainManager.actorModel.x = 354;
               MainManager.actorModel.y = 440;
               if(MainManager.actorInfo.superNono)
               {
                  NpcDialog.show(NPC.SUPERNONO,["糟糕！机械指针上竟然带着强大的电流！记得要避开指针哦！"],["我要再试一次！这次可以避开指针咯！"]);
               }
               else
               {
                  NpcDialog.show(NPC.NONO,["糟糕！机械指针上竟然带着强大的电流！记得要避开指针哦！"],["我要再试一次！这次可以避开指针咯！"]);
               }
               _isTurn = false;
               _groundMc.gotoAndStop(1);
               while(_loc1_ < 12)
               {
                  conLevel[_starArray[_loc1_]].x = -100;
                  _loc1_++;
               }
            });
         }
      }
      
      private function starStart(param1:Array) : void
      {
         var array:Array = null;
         var i:int = 0;
         array = param1;
         if(this._num < 5)
         {
            ++this._num;
            this._index = Math.floor(Math.random() * 12);
            this._currentStar = conLevel[array[this._index]];
            this._currentStar.x = _pointArray[this._index * 2];
            this._currentStar.y = _pointArray[this._index * 2 + 1];
            AnimateManager.playMcAnimate(this._currentStar,0,"",function():void
            {
               if(_destroyed) return;
               _currentStar.buttonMode = true;
               _currentStar.addEventListener(MouseEvent.CLICK,onStarClick);
            });
         }
         else
         {
            MainManager.actorModel.removeEventListener(RobotEvent.WALK_ENTER_FRAME,this.onWalk);
            this._groundMc["arrow_mc"].stop();
            this._groundMc.removeEventListener(Event.ENTER_FRAME,this.onArrowEnterFrame);
            while(i < 12)
            {
               conLevel[array[i]].x = _pointArray[i * 2];
               conLevel[array[i]].y = _pointArray[i * 2 + 1];
               conLevel[array[i]].gotoAndPlay(2);
               conLevel[array[i]].removeEventListener(MouseEvent.CLICK,this.onStarClick);
               i++;
            }
            AnimateManager.playMcAnimate(this._leiyiMc,0,"",function():void
            {
               if(_destroyed) return;
               var _loc1_:int = 0;
               _leiyiMc.buttonMode = true;
               _leiyiMc.addEventListener(MouseEvent.CLICK,onLeiyiClick);
               while(_loc1_ < 12)
               {
                  conLevel[array[_loc1_]].buttonMode = true;
                  conLevel[array[_loc1_]].mouseChildren = false;
                  conLevel[array[_loc1_]].addEventListener(MouseEvent.CLICK,onHeerkaClick);
                  _loc1_++;
               }
            });
         }
      }
      
      private function onStarClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         this._currentStar.x = -100;
         this._currentStar.buttonMode = false;
         this._currentStar.removeEventListener(MouseEvent.CLICK,this.onStarClick);
         this._starOutMc.x = _pointArray[this._index * 2];
         this._starOutMc.y = _pointArray[this._index * 2 + 1];
         AnimateManager.playMcAnimate(this._starOutMc,0,"",function():void
         {
            if(_destroyed) return;
            starStart(_starArray);
         });
      }
      
      private function onLeiyiClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         this._isLeiyiClick = true;
         AnimateManager.playMcAnimate(this._leiyiOutMc,0,"",function():void
         {
            if(_destroyed) return;
            SocketConnection.send(CommandID.GET_NONOPARTY_ITEM,2);
         });
      }
      
      private function onHeerkaClick(param1:MouseEvent) : void
      {
         var i:int = 0;
         var e:MouseEvent = param1;
         if(e.target.name == "star_3")
         {
            if(this._isLeiyiClick)
            {
               if(MainManager.actorInfo.superNono)
               {
                  this._leiyiMc.buttonMode = false;
                  this._leiyiMc.removeEventListener(MouseEvent.CLICK,this.onLeiyiClick);
                  while(i < 12)
                  {
                     conLevel[this._starArray[i]].buttonMode = false;
                     conLevel[this._starArray[i]].removeEventListener(MouseEvent.CLICK,this.onHeerkaClick);
                     i++;
                  }
                  AnimateManager.playMcAnimate(this._petMc,0,"",function():void
                  {
                     if(_destroyed) return;
                     _petMc.buttonMode = true;
                     _petMc.addEventListener(MouseEvent.CLICK,onPetClick);
                  });
               }
               else
               {
                  NpcDialog.show(NPC.SUPERNONO,["咦，这个机关点上去怎么没有反应呢？难道一定要拥有超能NONO的超能力才能打开吗？"],["我想马上成为超能NoNo！","我还是再考虑考虑吧！"],[function():void
                  {
                     if(_destroyed) return;
                     MapManager.changeMap(107);
                  }]);
               }
            }
         }
      }
      
      private function onPetClick(param1:MouseEvent) : void
      {
         this._isFight = true;
         FightInviteManager.fightWithBoss("阿零",0);
         EventManager.addEventListener(RobotEvent.NO_PET_CAN_FIGHT,this.onFightError);
         EventManager.addEventListener(PetFightEvent.CATCH_PET,this.onFightComplete);
         EventManager.addEventListener(PetFightEvent.ALARM_CLICK,this.onFightComplete);
      }
      
      private function onFightError(param1:RobotEvent) : void
      {
         this._isFight = false;
         EventManager.removeEventListener(RobotEvent.NO_PET_CAN_FIGHT,this.onFightError);
         EventManager.removeEventListener(PetFightEvent.CATCH_PET,this.onFightComplete);
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,this.onFightComplete);
      }
      
      private function onFightComplete(param1:PetFightEvent) : void
      {
         this._isFight = false;
         EventManager.removeEventListener(RobotEvent.NO_PET_CAN_FIGHT,this.onFightError);
         EventManager.removeEventListener(PetFightEvent.CATCH_PET,this.onFightComplete);
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,this.onFightComplete);
         MapManager.changeMap(424);
      }
      
      public function onGo_424() : void
      {
         MapManager.changeMap(424);
      }
      
      private function onGroundReady(event:Event) : void
      {
         if(_destroyed) return;
         if(Boolean(this._groundMc["arrow_mc"]))
         {
            this._groundMc.removeEventListener(Event.ENTER_FRAME,onGroundReady);
            this._groundMc.addEventListener(Event.ENTER_FRAME,onArrowEnterFrame);
         }
      }

      override public function destroy() : void
      {
         var _loc1_:int = 0;
         _destroyed = true;
         this.clearStartHint();
         ToolTipManager.remove(this._startMc);
         ToolTipManager.remove(this._keyMc);
         this._groundMc.removeEventListener(Event.ENTER_FRAME,onGroundReady);
         ToolBarController.showOrHideAllUser(true);
         SocketConnection.removeCmdListener(CommandID.GET_NONOPARTY_EXP,this.onExperienceReward);
         SocketDispatcher.getInstance().removeEventListener(SocketErrorEvent.ERROR,this.onRewardError);
         ToolTipManager.remove(this._hitMc_1);
         ToolTipManager.remove(this._hitMc_2);
         this._startMc.removeEventListener(MouseEvent.CLICK,this.onOneClick);
         AimatController.removeEventListener(AimatEvent.PLAY_END,this.onAimatEnd);
         this._keyMc.removeEventListener(MouseEvent.CLICK,this.onKeyClick);
         MainManager.actorModel.removeEventListener(RobotEvent.WALK_ENTER_FRAME,this.onWalk);
         this._leiyiMc.removeEventListener(MouseEvent.CLICK,this.onLeiyiClick);
         this._groundMc.removeEventListener(Event.ENTER_FRAME,this.onArrowEnterFrame);
         if(Boolean(this._starArray))
         {
            while(_loc1_ < this._starArray.length)
            {
               conLevel[this._starArray[_loc1_]].removeEventListener(MouseEvent.CLICK,this.onStarClick);
               conLevel[this._starArray[_loc1_]].removeEventListener(MouseEvent.CLICK,this.onHeerkaClick);
               _loc1_++;
            }
         }
         this._petMc.removeEventListener(MouseEvent.CLICK,this.onPetClick);
         if(!this._isFight)
         {
            EventManager.removeEventListener(RobotEvent.NO_PET_CAN_FIGHT,this.onFightError);
            EventManager.removeEventListener(PetFightEvent.CATCH_PET,this.onFightComplete);
            EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,this.onFightComplete);
         }
      }
   }
}

