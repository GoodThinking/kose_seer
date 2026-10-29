package com.robot.app.task.control
{
   import com.robot.app.fight.FightManager;
   import com.robot.app.task.taskUtils.taskDialog.NpcTipDialog;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TaskIconManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.map.config.MapProcessConfig;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.utils.CommonUI;
   import flash.display.InteractiveObject;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.events.TimerEvent;
   import flash.geom.Rectangle;
   import flash.utils.Timer;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.manager.ToolTipManager;

   public class TaskController_33
   {
      public static const TASK_ID:uint = 33;
      private static var icon:InteractiveObject;
      private static var lightMC:MovieClip;
      private static var _owner:BaseMapProcess;
      private static var _mapId:uint;
      private static var _progress:Array;
      private static var _ready:Boolean;
      private static var _busy:Boolean;
      private static var _request:uint;
      private static var _requestTimer:uint;
      private static var _acceptRequest:uint;
      private static var _acceptTimer:uint;
      private static var _accepting:Boolean;
      private static var _movie:MovieClip;
      private static var _movieEnd:Function;
      private static var _cageRoot:MovieClip;
      private static var _countdown:Timer;
      private static var _hitAreas:Array = [];
      private static var _zogBounds:Rectangle;

      public function TaskController_33() { super(); }

      public static function setup() : void
      {
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT) showIcon();
         else if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.COMPLETE) delIcon();
      }

      public static function start(onAccepted:Function = null) : void
      {
         if(_accepting) return;
         if(TasksManager.getTaskStatus(TASK_ID) != TasksManager.UN_ACCEPT)
         {
            setup();
            if(onAccepted != null) onAccepted();
            return;
         }
         // Preserve the current client's original task-33 opening instruction.
         NpcTipDialog.show("勇敢的小赛尔，你是一名坚强的战士，但是要记住，精灵的拯救才是我们这次的主要任务，不要恋战而耽误大事。",function():void
         {
            showAcceptance(onAccepted);
         },NpcTipDialog.INSTRUCTOR);
      }

      private static function showAcceptance(onAccepted:Function) : void
      {
         NpcTipDialog.show("据派特博士探测，精灵的体能已经过低，需要急救。",function():void
         {
            if(_accepting) return;
            _accepting = true;
            var request:uint = ++_acceptRequest;
            _acceptTimer = setTimeout(function():void
            {
               if(request != _acceptRequest) return;
               ++_acceptRequest;
               _acceptTimer = 0;
               _accepting = false;
               Alarm.show("接取结果尚未确认，请重新登录读取已保存的营救进度。");
            },5000);
            TasksManager.accept(TASK_ID,function(ok:Boolean):void
            {
               if(request != _acceptRequest) return;
               clearTimeout(_acceptTimer);
               _acceptTimer = 0;
               _accepting = false;
               if(!ok) { Alarm.show("任务接取未成功，尚未开始新的营救。"); return; }
               showIcon();
               if(onAccepted != null) onAccepted();
            });
         },NpcTipDialog.INSTRUCTOR);
      }

      public static function showIcon() : void
      {
         if(!icon)
         {
            icon = TaskIconManager.getIcon("icon_33");
            icon.addEventListener(MouseEvent.CLICK,clickHandler);
            ToolTipManager.add(icon,"解救被困的精灵们");
            lightMC = icon["lightMC"];
         }
         TaskIconManager.addIcon(icon);
      }

      public static function delIcon() : void
      {
         if(icon) TaskIconManager.delIcon(icon);
      }

      public static function clickHandler(event:MouseEvent = null) : void
      {
         if(lightMC) lightMC.gotoAndStop(lightMC.totalFrames);
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.COMPLETE)
         {
            delIcon();
            NpcDialog.show(NPC.SEER,["被困精灵已经安全离开，天枰装与海盗战斗奖章已经完成结算。"],["继续探索"]);
            return;
         }
         TasksManager.getProStatusList(TASK_ID,function(progress:Array):void
         {
            var text:String = guidance(progress);
            NpcDialog.show(NPC.SEER,[text],["继续营救","稍后再说"],[function():void
            {
               if(active) readProgress();
               else MapManager.changeMap(50);
            }]);
         });
      }

      public static function enterScene(owner:BaseMapProcess) : void
      {
         if(_owner === owner) return;
         if(_owner) destroy(_owner);
         _owner = owner;
         _mapId = MapManager.currentMap.id;
         setup();
         if(MapManager.currentMap.id == 48)
         {
            if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.UN_ACCEPT) start();
            return;
         }
         _progress = [false,false,false,false,false,false,false];
         _ready = false;
         var con:MovieClip = owner.conLevel;
         con["ailixunMC"].gotoAndStop(1);
         con["zogMC"].gotoAndStop(1);
         con["rescueMC"].gotoAndStop(1);
         con["countMC"].gotoAndStop(1);
         con["countMC"].visible = false;
         con["rescueBtn"].visible = false;
         for(var index:uint = 0; index < 3; ++index)
         {
            var pawn:MovieClip = con["piratePawn_" + index];
            pawn.gotoAndStop(1);
            pawn.buttonMode = true;
            pawn.mouseChildren = false;
            pawn.addEventListener(MouseEvent.CLICK,onPawn);
            ToolTipManager.add(pawn,"海盗杂兵：击败后才能靠近实验装置");
         }
         bindActor(con["ailixunMC"],onAllison,"艾里逊");
         _zogBounds = bindActor(con["zogMC"],onZog,"佐格：三个守卫被击败后才能挑战");
         con["blackShadow"].buttonMode = true;
         con["blackShadow"].mouseChildren = false;
         con["blackShadow"].addEventListener(MouseEvent.CLICK,onShadow);
         ToolTipManager.add(con["blackShadow"],"神秘人：先解救牢笼中的精灵");
         con["rescueBtn"].addEventListener(MouseEvent.CLICK,onSwitch);
         ToolTipManager.add(con["rescueBtn"],"牢笼电网开关");
         readProgress();
      }

      private static function get active() : Boolean
      {
         return _owner != null && MapManager.currentMap != null && MapManager.currentMap.id == 50 && MapProcessConfig.currentProcessInstance === _owner;
      }

      private static function bindActor(movie:MovieClip, listener:Function, tip:String) : Rectangle
      {
         // In guarded map-50 symbols 225/287, child 0 is scenery; child 1 is the pirate body.
         // Only the original body's bounds receive input, never the entire door/window movie.
         var bounds:Rectangle = movie.getChildAt(1).getBounds(movie);
         var hit:Sprite = new Sprite();
         hit.graphics.beginFill(0,0);
         hit.graphics.drawRect(bounds.x,bounds.y,bounds.width,bounds.height);
         hit.graphics.endFill();
         hit.visible = false;
         hit.mouseEnabled = false;
         hit.mouseChildren = false;
         movie.addChild(hit);
         movie.hitArea = hit;
         movie.mouseChildren = false;
         movie.buttonMode = true;
         movie.addEventListener(MouseEvent.CLICK,listener);
         ToolTipManager.add(movie,tip);
         _hitAreas.push(hit);
         return bounds;
      }

      private static function beginRequest() : uint
      {
         _busy = true;
         var request:uint = ++_request;
         var owner:BaseMapProcess = _owner;
         _requestTimer = setTimeout(function():void
         {
            if(_owner !== owner || request != _request) return;
            ++_request;
            _requestTimer = 0;
            _busy = false;
            Alarm.show("营救进度尚未确认，请重登后继续；已经保存的战斗和奖励不会重复结算。");
         },5000);
         return request;
      }

      private static function finishRequest(request:uint) : Boolean
      {
         if(!active || request != _request) return false;
         if(_requestTimer) clearTimeout(_requestTimer);
         _requestTimer = 0;
         _busy = false;
         return true;
      }

      private static function readProgress() : void
      {
         if(!active || _busy) return;
         if(TasksManager.getTaskStatus(TASK_ID) != TasksManager.ALR_ACCEPT)
         {
            _ready = true;
            render();
            return;
         }
         var request:uint = beginRequest();
         TasksManager.getProStatusList(TASK_ID,function(progress:Array):void
         {
            if(!finishRequest(request)) return;
            _progress = progress;
            _ready = true;
            render();
         });
      }

      private static function render() : void
      {
         if(!active) return;
         var con:MovieClip = _owner.conLevel;
         var completed:Boolean = TasksManager.getTaskStatus(TASK_ID) == TasksManager.COMPLETE;
         var guardsReady:Boolean = _progress[0] && _progress[1] && _progress[2];
         var marked:Boolean = false;
         for(var index:uint = 0; index < 3; ++index)
         {
            var pawn:MovieClip = con["piratePawn_" + index];
            CommonUI.removeYellowExcal(pawn);
            pawn.visible = !completed && !_progress[index];
            if(pawn.visible && !marked) { CommonUI.addYellowExcal(pawn,0,-80); marked = true; }
         }
         con["ailixunMC"].getChildAt(1).visible = !completed && !_progress[3];
         con["ailixunMC"].getChildAt(2).visible = !completed && !_progress[3];
         con["ailixunMC"].mouseEnabled = !completed && !_progress[3];
         con["zogMC"].gotoAndStop(_progress[4] || completed ? 70 : 1);
         if(!_progress[4] && !completed) con["zogMC"].getChildAt(1).visible = guardsReady;
         con["zogMC"].mouseEnabled = !completed && guardsReady && !_progress[4];
         CommonUI.removeYellowExcal(con["zogMC"]);
         if(!completed && guardsReady && !_progress[4]) CommonUI.addYellowExcal(con["zogMC"],_zogBounds.x + _zogBounds.width / 2,_zogBounds.y - 20);
         con["rescueMC"].gotoAndStop(completed || _progress[5] ? 3 : 1);
         con["rescueMC"].visible = true;
         con["blackShadow"].visible = !completed;
         CommonUI.removeYellowExcal(con["blackShadow"]);
         if(!completed && _progress[5])
         {
            var shadowBounds:Rectangle = con["blackShadow"].getBounds(con["blackShadow"]);
            CommonUI.addYellowExcal(con["blackShadow"],shadowBounds.x + shadowBounds.width / 2,shadowBounds.y - 12);
         }
         CommonUI.removeYellowArrow(con["rescueBtnMC"]);
         con["rescueBtn"].visible = !completed && _progress[4] && !_progress[5];
         if(con["rescueBtn"].visible)
         {
            CommonUI.addYellowArrow(con["rescueBtnMC"],0,0,300);
            startCountdown();
         }
         else stopCountdown();
         if(completed) delIcon();
      }

      private static function onPawn(event:MouseEvent) : void
      {
         if(!active || !_ready || _busy) return;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.UN_ACCEPT) { start(readProgress); return; }
         var index:uint = uint(String(event.currentTarget.name).substr(-1));
         if(_progress[index]) return;
         NpcDialog.show(NPC.SEER,["这名海盗杂兵使用35级" + ["机械","地面","冰"][index] + "系精灵。击败三个守卫，再阻止佐格的实验！"],["开始战斗","暂时离开"],[function():void
         {
            if(active) FightManager.fightWithBoss("海盗杂兵",index);
         }]);
      }

      private static function onAllison(event:MouseEvent) : void
      {
         if(!active || _busy) return;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.UN_ACCEPT) { start(readProgress); return; }
         NpcDialog.show(NPC.ALLISON,["别想靠近实验装置！先过了守卫这一关再说。"],["我不会丢下这些精灵！"]);
      }

      private static function onZog(event:MouseEvent) : void
      {
         if(!active || !_ready || _busy) return;
         if(!_progress[0] || !_progress[1] || !_progress[2]) { clickHandler(); return; }
         if(_progress[3]) { offerEscape(); return; }
         NpcDialog.show(NPC.ZOG,["我的尼斯克可不是那些杂兵能比的！有本事就来阻止我！"],["挑战60级尼斯克","先整理精灵"],[function():void
         {
            if(active) FightManager.fightWithBoss("佐格",3);
         }]);
      }

      private static function offerEscape() : void
      {
         if(!active || _busy) return;
         NpcDialog.show(NPC.ZOG,["可恶！装置的警报已经启动，你还是先担心那些精灵吧！"],["先救精灵！","稍后再说"],[function():void
         {
            if(!active || _busy) return;
            playMovie(_owner.conLevel["zogMC"],function():void { saveStage(4); });
         }]);
      }

      private static function onSwitch(event:MouseEvent) : void
      {
         event.stopPropagation();
         if(!active || !_ready || _busy) return;
         // The original SimpleButton and its XML MovieClip marker share native approach movement.
         _owner.conLevel["rescueBtnMC"].dispatchEvent(new MouseEvent(MouseEvent.CLICK));
      }

      public static function onRescueBtnClick(owner:BaseMapProcess) : void
      {
         if(_owner !== owner || !active || !_ready || _busy) return;
         if(!_progress[4]) { clickHandler(); return; }
         if(_progress[5]) return;
         stopCountdown();
         _busy = true;
         _cageRoot = _owner.conLevel["rescueMC"];
         _cageRoot.addEventListener(Event.ENTER_FRAME,onCageReady);
         _cageRoot.gotoAndStop(2);
      }

      private static function onCageReady(event:Event) : void
      {
         if(!active || event.currentTarget !== _cageRoot) return;
         var movie:MovieClip = _cageRoot.getChildByName("rescueAnimateMC") as MovieClip;
         if(!movie) return;
         _cageRoot.removeEventListener(Event.ENTER_FRAME,onCageReady);
         _cageRoot = null;
         playMovie(movie,function():void { saveStage(5); });
      }

      private static function onShadow(event:MouseEvent) : void
      {
         if(!active || !_ready || _busy) return;
         if(!_progress[5]) { clickHandler(); return; }
         NpcDialog.show(NPC.SEER,["电网已经关闭，牢笼中的精灵也脱离了危险。先向教官报告营救结果。"],["向教官报告","稍后再说"],[function():void
         {
            if(active && !_busy) saveStage(6);
         }]);
      }

      private static function saveStage(stage:uint) : void
      {
         if(!active) return;
         _busy = false;
         var request:uint = beginRequest();
         TasksManager.complete(TASK_ID,stage,function(ok:Boolean):void
         {
            if(!finishRequest(request)) return;
            if(!ok) { Alarm.show("营救进度未完成保存，请重新读取进度后继续。"); readProgress(); return; }
            if(stage == 6)
            {
               delIcon();
               render();
            }
            else readProgress();
         });
      }

      private static function playMovie(movie:MovieClip, complete:Function) : void
      {
         _busy = true;
         _movie = movie;
         _movieEnd = complete;
         movie.visible = true;
         movie.mouseEnabled = false;
         movie.mouseChildren = false;
         movie.gotoAndStop(1);
         movie.addEventListener(Event.ENTER_FRAME,onMovieFrame);
         movie.play();
      }

      private static function onMovieFrame(event:Event) : void
      {
         if(!active || event.currentTarget !== _movie || _movie.currentFrame < _movie.totalFrames) return;
         var complete:Function = _movieEnd;
         _movie.removeEventListener(Event.ENTER_FRAME,onMovieFrame);
         _movie.stop();
         _movie = null;
         _movieEnd = null;
         if(complete != null) complete();
      }

      private static function startCountdown() : void
      {
         if(_countdown) return;
         _owner.conLevel["countMC"].visible = true;
         _owner.conLevel["countMC"].gotoAndStop(1);
         _countdown = new Timer(1000,10);
         _countdown.addEventListener(TimerEvent.TIMER,onCountdown);
         _countdown.start();
      }

      private static function onCountdown(event:TimerEvent) : void
      {
         if(!active) return;
         _owner.conLevel["countMC"].gotoAndStop(_countdown.currentCount + 1);
         if(_countdown.currentCount == 10) ToolTipManager.add(_owner.conLevel["rescueBtn"],"警报已响：仍可按下开关解救伙伴");
      }

      private static function stopCountdown() : void
      {
         if(_countdown)
         {
            _countdown.stop();
            _countdown.removeEventListener(TimerEvent.TIMER,onCountdown);
            _countdown = null;
         }
         if(active) _owner.conLevel["countMC"].visible = false;
      }

      private static function guidance(progress:Array) : String
      {
         var cleared:uint = 0;
         for(var index:uint = 0; index < 3; ++index) if(progress[index]) ++cleared;
         if(cleared < 3) return "被困精灵就在海盗要塞内部的电网牢笼中。先击败三个海盗杂兵（已完成" + cleared + "/3），再挑战佐格。守卫可以任意顺序挑战。";
         if(!progress[3]) return "三个守卫已经被击败。点击右侧的佐格，挑战他的60级尼斯克。战败或逃跑后可以再次挑战，已经完成的守卫战会保留。";
         if(!progress[4]) return "佐格已被击败。点击佐格继续剧情，确认他逃离实验室后，马上解救精灵。";
         if(!progress[5]) return "点击牢笼右侧、艾里逊旁边的红色开关，靠近后关闭电网。警报不会让已经完成的战斗失效。";
         return "精灵们已经离开牢笼。点击牢笼旁的神秘身影，完成营救并领取天枰装。服装与奖章每号只结算一次，重登可以继续。";
      }

      public static function destroy(owner:BaseMapProcess) : void
      {
         if(_owner !== owner) return;
         ++_request;
         if(_requestTimer) clearTimeout(_requestTimer);
         _requestTimer = 0;
         if(_cageRoot)
         {
            _cageRoot.removeEventListener(Event.ENTER_FRAME,onCageReady);
            var child:MovieClip = _cageRoot.getChildByName("rescueAnimateMC") as MovieClip;
            if(child) child.stop();
            _cageRoot = null;
         }
         if(_movie)
         {
            _movie.removeEventListener(Event.ENTER_FRAME,onMovieFrame);
            _movie.stop();
            _movie = null;
            _movieEnd = null;
         }
         stopCountdown();
         if(_mapId == 50)
         {
            var con:MovieClip = owner.conLevel;
            for(var index:uint = 0; index < 3; ++index)
            {
               var pawn:MovieClip = con["piratePawn_" + index];
               pawn.removeEventListener(MouseEvent.CLICK,onPawn);
               CommonUI.removeYellowExcal(pawn);
               ToolTipManager.remove(pawn);
            }
            con["ailixunMC"].removeEventListener(MouseEvent.CLICK,onAllison);
            con["zogMC"].removeEventListener(MouseEvent.CLICK,onZog);
            con["blackShadow"].removeEventListener(MouseEvent.CLICK,onShadow);
            con["rescueBtn"].removeEventListener(MouseEvent.CLICK,onSwitch);
            CommonUI.removeYellowExcal(con["zogMC"]);
            CommonUI.removeYellowExcal(con["blackShadow"]);
            CommonUI.removeYellowArrow(con["rescueBtnMC"]);
            for each(var name:String in ["ailixunMC","zogMC","blackShadow","rescueBtn"]) ToolTipManager.remove(con[name]);
            con["ailixunMC"].hitArea = null;
            con["zogMC"].hitArea = null;
         }
         for each(var hit:Sprite in _hitAreas) if(hit.parent) hit.parent.removeChild(hit);
         _hitAreas = [];
         _owner = null;
         _progress = null;
         _ready = false;
         _busy = false;
      }
   }
}
