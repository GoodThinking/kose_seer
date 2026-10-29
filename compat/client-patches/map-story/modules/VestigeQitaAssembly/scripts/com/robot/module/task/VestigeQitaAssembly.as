package com.robot.module.task
{
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.module.game.spritePieceTogether.SpritePiece;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.KeyboardEvent;
   import flash.events.MouseEvent;
   import flash.events.TimerEvent;
   import flash.text.TextField;
   import flash.ui.Keyboard;
   import flash.utils.Timer;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;

   // Task-specific adaptation of the official-era mechanical assembly art and interaction.
   // The shared SpritePieceTogether game remains unchanged; this task only assembles Qita.
   public class VestigeQitaAssembly extends Sprite implements IModule
   {
      // Original SpritePieceData interleaves both species; map logical Qita slots0..4 to its actual indices.
      private static const QITA_PIECE_IDS:Array = [5,1,7,3,9];

      private var _main:MovieClip;
      private var _qita:MovieClip;
      private var _belt:MovieClip;
      private var _countdown:MovieClip;
      private var _start:MovieClip;
      private var _close:SimpleButton;
      private var _counter:TextField;
      private var _remaining:Array = [];
      private var _parts:Array = [];
      private var _clock:Timer;
      private var _pieceTimer:Timer;
      private var _held:MovieClip;
      private var _heldX:Number;
      private var _heldY:Number;
      private var _seconds:uint;
      private var _finished:Boolean;
      private var _flashTimer:uint;

      public function VestigeQitaAssembly()
      {
         super();
      }

      public function init(data:Object = null) : void
      {
         setup();
      }

      public function setup() : void
      {
         if(_main) return;
         _finished = false;
         _seconds = 100;
         _remaining.length = 0;
         for(var index:uint = 0; index < 5; ++index) _remaining.push(index);
         _main = new ui_SpritePieceTogether();
         _belt = _main["chuansongMC"];
         _belt.gotoAndStop(1);
         // Shape174 at original timeline depth138 draws both fixed wireframes behind the live models.
         // This task uses one centered live Qita; retain the factory art without duplicate silhouettes.
         _main.getChildAt(14).visible = false;
         _qita = _main["qita"];
         var xita:MovieClip = _main["xita"];
         _qita.x = (_qita.x + xita.x) / 2;
         xita.visible = false;
         xita.mouseEnabled = false;
         xita.mouseChildren = false;
         _qita.mouseEnabled = false;
         _qita.mouseChildren = false;
         for(index = 0; index < 5; ++index) _qita["hitOne_" + index].gotoAndStop(1);
         _qita["qitaBgMC"].gotoAndStop(1);
         _counter = _main["countTxt"];
         var center:Number = _counter.x + _counter.width / 2;
         _counter.wordWrap = false;
         _counter.multiline = false;
         _counter.width = 130;
         _counter.height = 60;
         _counter.x = center - _counter.width / 2;
         _counter.text = _seconds.toString();
         _counter.visible = false;
         _countdown = _main["timeMC"];
         _countdown.gotoAndStop(1);
         _countdown.visible = false;
         _start = _main["startBtn"];
         _start.gotoAndStop(1);
         _start.buttonMode = true;
         _start.mouseChildren = false;
         _start.addEventListener(MouseEvent.CLICK,onStart);
         _start.addEventListener(MouseEvent.MOUSE_OVER,onStartOver);
         _start.addEventListener(MouseEvent.MOUSE_OUT,onStartOut);
         _close = _main["closeBtn"];
         _close.addEventListener(MouseEvent.CLICK,onClose);
         _clock = new Timer(1000);
         _clock.addEventListener(TimerEvent.TIMER,onTick);
         _pieceTimer = new Timer(4000);
         _pieceTimer.addEventListener(TimerEvent.TIMER,onPieceTick);
         MainManager.getStage().addEventListener(KeyboardEvent.KEY_DOWN,onKeyDown);
      }

      public function show() : void
      {
         setup();
         if(!_main.parent) LevelManager.appLevel.addChild(_main);
      }

      private function onStartOver(event:MouseEvent) : void { _start.gotoAndStop(2); }
      private function onStartOut(event:MouseEvent) : void { _start.gotoAndStop(1); }

      private function onStart(event:MouseEvent) : void
      {
         if(_finished || !_start.visible) return;
         _start.visible = false;
         _start.mouseEnabled = false;
         _countdown.visible = true;
         _countdown.addEventListener(Event.ENTER_FRAME,onCountdown);
         _countdown.gotoAndPlay(2);
      }

      private function onCountdown(event:Event) : void
      {
         if(!_main || _finished || _countdown.currentFrame < _countdown.totalFrames) return;
         _countdown.removeEventListener(Event.ENTER_FRAME,onCountdown);
         _countdown.stop();
         _counter.visible = true;
         _clock.start();
         _belt.gotoAndPlay(2);
         addPiece();
         _pieceTimer.start();
      }

      private function onTick(event:TimerEvent) : void
      {
         if(_finished || !_main) return;
         --_seconds;
         _counter.text = _seconds.toString();
         if(_seconds == 0) finish("GameFail");
      }

      private function onPieceTick(event:TimerEvent) : void { addPiece(); }

      private function addPiece() : void
      {
         if(_finished || !_main || _remaining.length == 0) return;
         var type:uint = _remaining[uint(Math.random() * _remaining.length)];
         var part:MovieClip = new SpritePiece(uint(QITA_PIECE_IDS[type]));
         part["type"] = type;
         part.x = 980;
         part.y = 470;
         part.rotation = 90;
         part.buttonMode = true;
         part.mouseChildren = false;
         part.addEventListener(MouseEvent.CLICK,onPartClick);
         part.addEventListener(Event.ENTER_FRAME,onPartFrame);
         _main.addChildAt(part,_main.getChildIndex(_belt) + 1);
         _parts.push(part);
      }

      private function onPartFrame(event:Event) : void
      {
         var part:MovieClip = event.currentTarget as MovieClip;
         part.x -= 5.5;
         if(part.x < -10) removePart(part);
      }

      private function onPartClick(event:MouseEvent) : void
      {
         if(_finished || !_main) return;
         var part:MovieClip = event.currentTarget as MovieClip;
         if(!_held)
         {
            _held = part;
            _heldX = part.x;
            _heldY = part.y;
            part.removeEventListener(Event.ENTER_FRAME,onPartFrame);
            _main.setChildIndex(part,_main.getChildIndex(_close) - 1);
            part.startDrag(true);
            return;
         }
         if(part !== _held) return;
         part.stopDrag();
         _held = null;
         var type:uint = part["type"];
         var target:MovieClip = _qita["hitOne_" + type];
         if(part.rotation != 0 || !part.hitTestObject(target))
         {
            part.x = _heldX;
            part.y = _heldY;
            part.addEventListener(Event.ENTER_FRAME,onPartFrame);
            return;
         }
         target.gotoAndStop(2);
         var index:int = _remaining.indexOf(type);
         if(index >= 0) _remaining.splice(index,1);
         // Remove duplicate conveyor copies of a component that is already fitted.
         for(index = _parts.length - 1; index >= 0; --index)
         {
            if(uint(_parts[index]["type"]) == type) removePart(_parts[index]);
         }
         if(_remaining.length == 0)
         {
            finish("GamePass");
            return;
         }
         if(_flashTimer) clearTimeout(_flashTimer);
         _qita["qitaBgMC"].gotoAndStop(2);
         _flashTimer = setTimeout(clearFlash,400);
      }

      private function clearFlash() : void
      {
         _flashTimer = 0;
         if(_main && !_finished) _qita["qitaBgMC"].gotoAndStop(1);
      }

      private function onKeyDown(event:KeyboardEvent) : void
      {
         if(_held && event.keyCode == Keyboard.SPACE) _held.rotation += 45;
      }

      private function removePart(part:MovieClip) : void
      {
         part.removeEventListener(MouseEvent.CLICK,onPartClick);
         part.removeEventListener(Event.ENTER_FRAME,onPartFrame);
         DisplayUtil.removeForParent(part);
         var index:int = _parts.indexOf(part);
         if(index >= 0) _parts.splice(index,1);
      }

      private function finish(eventType:String) : void
      {
         if(_finished || !_main) return;
         _finished = true;
         stopRunning();
         this.loaderInfo.sharedEvents.dispatchEvent(new Event(eventType));
      }

      private function onClose(event:MouseEvent) : void
      {
         if(!_main) return;
         hide();
         this.loaderInfo.sharedEvents.dispatchEvent(new Event("GameClose"));
      }

      private function stopRunning() : void
      {
         if(_flashTimer) clearTimeout(_flashTimer);
         _flashTimer = 0;
         if(_held) _held.stopDrag();
         _held = null;
         while(_parts.length) removePart(_parts[_parts.length - 1]);
         if(_clock)
         {
            _clock.stop();
            _clock.removeEventListener(TimerEvent.TIMER,onTick);
         }
         if(_pieceTimer)
         {
            _pieceTimer.stop();
            _pieceTimer.removeEventListener(TimerEvent.TIMER,onPieceTick);
         }
         if(_countdown)
         {
            _countdown.removeEventListener(Event.ENTER_FRAME,onCountdown);
            _countdown.stop();
         }
         if(_belt) _belt.stop();
         MainManager.getStage().removeEventListener(KeyboardEvent.KEY_DOWN,onKeyDown);
      }

      public function hide() : void
      {
         if(!_main) return;
         _finished = true;
         stopRunning();
         _close.removeEventListener(MouseEvent.CLICK,onClose);
         _start.removeEventListener(MouseEvent.CLICK,onStart);
         _start.removeEventListener(MouseEvent.MOUSE_OVER,onStartOver);
         _start.removeEventListener(MouseEvent.MOUSE_OUT,onStartOut);
         DisplayUtil.removeForParent(_main);
         _main = null;
         _qita = null;
         _belt = null;
         _countdown = null;
         _start = null;
         _close = null;
         _counter = null;
         _clock = null;
         _pieceTimer = null;
      }

      public function destroy() : void
      {
         hide();
      }
   }
}
