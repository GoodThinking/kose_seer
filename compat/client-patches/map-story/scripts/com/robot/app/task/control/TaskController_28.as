package com.robot.app.task.control
{
   import com.robot.core.config.ClientConfig;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TaskIconManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.map.config.MapProcessConfig;
   import com.robot.core.mode.AppModel;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.ui.alert.Alarm;
   import com.robot.core.utils.CommonUI;
   import flash.display.InteractiveObject;
   import flash.display.MovieClip;
   import flash.events.Event;
   import flash.events.EventDispatcher;
   import flash.events.MouseEvent;
   import flash.geom.Rectangle;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.manager.ToolTipManager;

   public class TaskController_28
   {
      public static const TASK_ID:uint = 28;
      private static var icon:InteractiveObject;
      private static var lightMC:MovieClip;
      private static var panel:AppModel;
      private static var _owner:BaseMapProcess;
      private static var _mapId:uint;
      private static var _progress:Array = [false,false,false];
      private static var _ready:Boolean;
      private static var _busy:Boolean;
      private static var _request:uint;
      private static var _requestTimer:uint;
      private static var _movie:MovieClip;
      private static var _movieEnd:Function;
      private static var _pendingStone:MovieClip;
      private static var _boxExposed:Boolean;
      private static var _blueprintExposed:Boolean;
      private static var _puzzleSolved:Boolean;
      private static var _assembly:AppModel;
      private static var _assemblyEvents:EventDispatcher;
      private static var _assemblyTimer:uint;

      public function TaskController_28() { super(); }

      public static function start() : void
      {
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT) showIcon();
         else delIcon();
      }

      private static function showIcon() : void
      {
         if(!icon)
         {
            icon = TaskIconManager.getIcon("icon_28");
            icon.addEventListener(MouseEvent.CLICK,clickHandler);
            ToolTipManager.add(icon,"遗迹中的精灵信号");
            lightMC = icon["lightMC"];
         }
         TaskIconManager.addIcon(icon);
      }

      public static function delIcon() : void
      {
         if(icon) TaskIconManager.delIcon(icon);
      }

      private static function clickHandler(event:MouseEvent) : void
      {
         if(TasksManager.getTaskStatus(TASK_ID) != TasksManager.ALR_ACCEPT) return;
         lightMC.gotoAndStop(lightMC.totalFrames);
         if(!panel)
         {
            panel = new AppModel(ClientConfig.getTaskModule("VestigeSpriteSingal"),"正在打开任务信息");
            panel.setup();
         }
         panel.show();
      }

      private static function get active() : Boolean
      {
         return _owner != null && MapManager.currentMap != null && MapManager.currentMap.id == _mapId && MapProcessConfig.currentProcessInstance === _owner;
      }

      public static function enterScene(owner:BaseMapProcess) : void
      {
         if(_owner === owner) return;
         if(_owner) destroy(_owner);
         _owner = owner;
         _mapId = MapManager.currentMap.id;
         _ready = false;
         _busy = false;
         _boxExposed = false;
         _blueprintExposed = false;
         _puzzleSolved = false;
         _progress = [false,false,false];
         start();
         if(_mapId == 31)
         {
            owner.conLevel["ear"].gotoAndStop(1);
            owner.conLevel["picture"].visible = false;
            owner.conLevel["picture"].mouseEnabled = false;
            owner.conLevel["picture"].mouseChildren = false;
            owner.conLevel["picture"].addEventListener(MouseEvent.CLICK,onBlueprint);
         }
         else if(_mapId == 34)
         {
            owner.conLevel["shitou"].gotoAndStop(1);
            owner.conLevel["xiangzi"].gotoAndStop(1);
            owner.conLevel["xiangzi"].visible = false;
            owner.conLevel["xiangzi"].mouseEnabled = false;
            owner.conLevel["xiangzi"].mouseChildren = false;
            owner.conLevel["xiangzi"].addEventListener(MouseEvent.CLICK,onBox);
         }
         // The laboratory has other active story requests; read this task only when selected.
         if(_mapId != 5) refresh();
      }

      public static function onDoctor() : void
      {
         if(!active || _mapId != 5 || _busy) return;
         var status:uint = TasksManager.getTaskStatus(TASK_ID);
         if(status == TasksManager.COMPLETE)
         {
            NpcDialog.show(NPC.DOCTOR,["奇塔已经交给你照顾了。记得在精灵背包或仓库里看看这位来自赫尔卡文明的小伙伴。"],["我会好好照顾它的！"]);
            return;
         }
         if(status == TasksManager.UN_ACCEPT)
         {
            NpcDialog.show(NPC.DOCTOR,["精灵探测仪信号指出在0xff0000赫尔卡星0xffffff发现了新精灵，但是不知道为什么，信号极其异常！那里究竟发生了什么？赛尔勇士们，你愿意接受这个艰巨的任务吗？"],["确定","稍后再来"],[acceptTask]);
            return;
         }
         refresh(showDoctorProgress);
      }

      private static function acceptTask() : void
      {
         if(!active || _mapId != 5 || _busy) return;
         var request:uint = beginRequest();
         TasksManager.accept(TASK_ID,function(ok:Boolean):void
         {
            if(!finishRequest(request)) return;
            if(!ok) { Alarm.show("接受任务失败，请重新与博士交谈。"); return; }
            start();
            refresh(showDoctorProgress);
         });
      }

      private static function showDoctorProgress() : void
      {
         if(!active || _mapId != 5) return;
         if(!_progress[0])
         {
            NpcDialog.show(NPC.DOCTOR,["先去赫尔卡星调查异常信号。通过拆弹地点旁的神秘通道，完成通道机关进入精灵广场。水潭旁的小石子也许能帮你发现线索。"],["前往赫尔卡星","稍后再去"],[function():void { if(active) MapManager.changeMap(30); }]);
         }
         else if(!_progress[1])
         {
            NpcDialog.show(NPC.DOCTOR,["遗迹宝箱里留下了机械精灵的残骸，不过还缺少拼装图纸。到赫尔卡星遗迹，检查巨型机器人的耳朵，取回掉落的图纸。"],["前往赫尔卡星遗迹","稍后再去"],[function():void { if(active) MapManager.changeMap(31); }]);
         }
         else
         {
            NpcDialog.show(NPC.DOCTOR,["机械残骸与图纸都齐了。按照奇塔的轮廓拼装零件，按空格键旋正方向，再把零件放到对应位置。关闭装置或拼装失败都不会丢失已经找回的线索。"],[_puzzleSolved ? "提交拼装结果" : "开始拼装奇塔","稍后再试"],[function():void
            {
               if(!active || _busy) return;
               if(_puzzleSolved) saveStage(2);
               else openAssembly();
            }]);
         }
      }

      private static function beginRequest() : uint
      {
         _busy = true;
         var request:uint = ++_request;
         _requestTimer = setTimeout(function():void
         {
            if(request != _request || !active) return;
            ++_request;
            _requestTimer = 0;
            _busy = false;
            Alarm.show("遗迹任务请求未完成，请重新交谈或点击机关后再试。");
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

      private static function refresh(after:Function = null) : void
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
            if(after != null) after();
         });
      }

      private static function render() : void
      {
         if(!active) return;
         var accepted:Boolean = TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT;
         var con:MovieClip = _owner.conLevel;
         if(_mapId == 31)
         {
            var ear:MovieClip = con["ear"];
            var picture:MovieClip = con["picture"];
            CommonUI.removeYellowExcal(ear);
            CommonUI.removeYellowExcal(picture);
            picture.visible = accepted && !_progress[1] && _blueprintExposed;
            picture.mouseEnabled = picture.visible;
            picture.buttonMode = true;
            if(picture.visible) CommonUI.addYellowExcal(picture,0,-20);
            else if(accepted && _progress[0] && !_progress[1])
            {
               var bounds:Rectangle = ear.getBounds(ear);
               CommonUI.addYellowExcal(ear,bounds.x + bounds.width / 2,bounds.y - 15);
            }
         }
         else if(_mapId == 34)
         {
            var stone:MovieClip = con["shitou"];
            var box:MovieClip = con["xiangzi"];
            CommonUI.removeYellowExcal(stone);
            CommonUI.removeYellowExcal(box);
            stone.visible = accepted && !_progress[0] && !_boxExposed;
            box.visible = accepted && !_progress[0] && _boxExposed;
            box.alpha = 1;
            box.mouseEnabled = box.visible;
            box.buttonMode = true;
            if(stone.visible) CommonUI.addYellowExcal(stone,0,-20);
            if(box.visible) CommonUI.addYellowExcal(box,0,-20);
         }
      }

      public static function onStone(owner:BaseMapProcess) : void
      {
         if(_owner !== owner || !active || !_ready || _busy || _mapId != 34 || TasksManager.getTaskStatus(TASK_ID) != TasksManager.ALR_ACCEPT || _progress[0]) return;
         _busy = true;
         _pendingStone = owner.conLevel["shitou"];
         CommonUI.removeYellowExcal(_pendingStone);
         _pendingStone.addEventListener(Event.ENTER_FRAME,onStoneReady);
         _pendingStone.gotoAndStop(2);
      }

      private static function onStoneReady(event:Event) : void
      {
         if(!active || event.currentTarget !== _pendingStone || _pendingStone.currentFrame != 2 || _pendingStone.numChildren != 1) return;
         // Guarded map34 symbol262 frame2 contains the original unnamed52-frame throw movie.
         var movie:MovieClip = _pendingStone.getChildAt(0) as MovieClip;
         if(!movie) return;
         _pendingStone.removeEventListener(Event.ENTER_FRAME,onStoneReady);
         _pendingStone = null;
         var box:MovieClip = _owner.conLevel["xiangzi"];
         box.alpha = 1;
         box.visible = true;
         box.mouseEnabled = false;
         box.gotoAndPlay(1);
         playMovie(movie,function():void
         {
            box.stop();
            _boxExposed = true;
            render();
         });
      }

      private static function onBox(event:MouseEvent) : void
      {
         event.stopPropagation();
         if(!active || _mapId != 34 || !_boxExposed || _busy || _progress[0]) return;
         saveStage(0);
      }

      public static function onEar(owner:BaseMapProcess) : void
      {
         if(_owner !== owner || !active || !_ready || _busy || _mapId != 31) return;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.COMPLETE)
         {
            Alarm.show("这份机械图纸的调查已经完成，不需要再次收集。");
            return;
         }
         if(TasksManager.getTaskStatus(TASK_ID) != TasksManager.ALR_ACCEPT)
         {
            NpcDialog.show(NPC.SEER,["巨型机器人的耳朵里似乎保存着一张机械图纸。想调查遗迹的精灵信号，可以先去实验室与派特博士交谈。"],["前往实验室","先看看周围"],[function():void { if(active) MapManager.changeMap(5); }]);
            return;
         }
         if(!_progress[0]) { Alarm.show("先调查精灵广场水潭旁的石子，找回遗迹宝箱。任务图标里保留了博士的提示。"); return; }
         if(_progress[1]) { Alarm.show("图纸已经找到了，带着线索回实验室与博士交谈吧。"); return; }
         if(_blueprintExposed) return;
         playMovie(_owner.conLevel["ear"],function():void
         {
            _blueprintExposed = true;
            render();
         });
      }

      private static function onBlueprint(event:MouseEvent) : void
      {
         event.stopPropagation();
         if(!active || _mapId != 31 || !_blueprintExposed || _busy || _progress[1]) return;
         saveStage(1);
      }

      private static function playMovie(movie:MovieClip, complete:Function) : void
      {
         _busy = true;
         _movie = movie;
         _movieEnd = complete;
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
         _busy = false;
         if(complete != null) complete();
      }

      private static function saveStage(stage:uint) : void
      {
         if(!active || _busy) return;
         var request:uint = beginRequest();
         TasksManager.complete(TASK_ID,stage,function(ok:Boolean):void
         {
            if(!finishRequest(request)) return;
            if(!ok) { Alarm.show("任务进度未能保存，请重新交谈或点击物品后再试。"); refresh(); return; }
            if(stage == 2)
            {
               delIcon();
               render();
               // The current client's TaskClass_28 owns the original ending and pet notification.
               return;
            }
            refresh(function():void
            {
               if(stage == 0) NpcDialog.show(NPC.DOCTOR,["恭喜你找到了遗迹宝箱！这些机械残骸可能属于机械精灵，不过还缺少图纸。再去赫尔卡星遗迹，检查巨型机器人的耳朵吧。"],["去找机械图纸"]);
               else NpcDialog.show(NPC.DOCTOR,["图纸已经找到了！带上机械残骸和图纸，回实验室一起拼装这只机械精灵吧。"],["返回实验室","稍后再去"],[function():void { if(active) MapManager.changeMap(5); }]);
            });
         });
      }

      private static function openAssembly() : void
      {
         if(!active || _mapId != 5 || _busy || _assembly || !_progress[0] || !_progress[1]) return;
         _busy = true;
         _assembly = new AppModel(ClientConfig.getTaskModule("VestigeQitaAssembly"),"正在打开机械精灵拼装装置");
         _assembly.addEventListener(Event.COMPLETE,onAssemblyLoaded);
         _assembly.addEventListener(Event.CLOSE,onAssemblyClosed);
         _assembly.setup();
         _assemblyEvents = _assembly.sharedEvents;
         _assemblyEvents.addEventListener("GamePass",onAssemblyPass);
         _assemblyEvents.addEventListener("GameFail",onAssemblyFail);
         _assemblyEvents.addEventListener("GameClose",onAssemblyClosed);
         _assembly.show();
         _assemblyTimer = setTimeout(onAssemblyTimeout,15000);
      }

      private static function onAssemblyLoaded(event:Event) : void
      {
         if(!active || event.currentTarget !== _assembly) return;
         if(_assemblyTimer) clearTimeout(_assemblyTimer);
         _assemblyTimer = 0;
      }

      private static function onAssemblyTimeout() : void
      {
         _assemblyTimer = 0;
         if(!active || !_assembly) return;
         closeAssembly();
         Alarm.show("拼装装置未能加载，请检查连接后重新与博士交谈。");
      }

      private static function onAssemblyClosed(event:Event) : void { closeAssembly(); }

      private static function onAssemblyFail(event:Event) : void
      {
         if(!active || event.currentTarget !== _assemblyEvents) return;
         closeAssembly();
         Alarm.show("这次拼装没有完成。机械残骸与图纸仍然保留，重新与博士交谈就能再试。");
      }

      private static function onAssemblyPass(event:Event) : void
      {
         if(!active || event.currentTarget !== _assemblyEvents) return;
         closeAssembly();
         _puzzleSolved = true;
         saveStage(2);
      }

      private static function closeAssembly() : void
      {
         if(_assemblyTimer) clearTimeout(_assemblyTimer);
         _assemblyTimer = 0;
         var old:AppModel = _assembly;
         _assembly = null;
         if(_assemblyEvents)
         {
            _assemblyEvents.removeEventListener("GamePass",onAssemblyPass);
            _assemblyEvents.removeEventListener("GameFail",onAssemblyFail);
            _assemblyEvents.removeEventListener("GameClose",onAssemblyClosed);
            _assemblyEvents = null;
         }
         if(old)
         {
            old.removeEventListener(Event.COMPLETE,onAssemblyLoaded);
            old.removeEventListener(Event.CLOSE,onAssemblyClosed);
            old.destroy();
         }
         _busy = false;
      }

      public static function destroy(owner:BaseMapProcess) : void
      {
         if(_owner !== owner) return;
         ++_request;
         if(_requestTimer) clearTimeout(_requestTimer);
         _requestTimer = 0;
         if(_pendingStone)
         {
            _pendingStone.removeEventListener(Event.ENTER_FRAME,onStoneReady);
            _pendingStone.stop();
            _pendingStone = null;
         }
         if(_movie)
         {
            _movie.removeEventListener(Event.ENTER_FRAME,onMovieFrame);
            _movie.stop();
            _movie = null;
            _movieEnd = null;
         }
         if(_mapId == 34)
         {
            _owner.conLevel["xiangzi"].stop();
            _owner.conLevel["xiangzi"].removeEventListener(MouseEvent.CLICK,onBox);
            CommonUI.removeYellowExcal(_owner.conLevel["shitou"]);
            CommonUI.removeYellowExcal(_owner.conLevel["xiangzi"]);
         }
         if(_mapId == 31)
         {
            _owner.conLevel["picture"].removeEventListener(MouseEvent.CLICK,onBlueprint);
            CommonUI.removeYellowExcal(_owner.conLevel["picture"]);
            CommonUI.removeYellowExcal(_owner.conLevel["ear"]);
         }
         closeAssembly();
         if(panel) { panel.destroy(); panel = null; }
         _owner = null;
         _mapId = 0;
         _ready = false;
      }
   }
}
