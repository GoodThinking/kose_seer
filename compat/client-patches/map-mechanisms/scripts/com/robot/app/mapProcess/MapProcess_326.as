package com.robot.app.mapProcess
{
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.MovieClip;
   import flash.display.Stage;
   import flash.events.*;
   import flash.geom.Point;
   import flash.media.SoundChannel;
   import flash.utils.*;
   import org.taomee.manager.ToolTipManager;

   public class MapProcess_326 extends BaseMapProcess
   {
      private var my_timedProcess:Number;
      private var my_timedProcess2:Number;
      private var stoneChannel:SoundChannel;
      private var draggedStone:MovieClip;
      private var dragStage:Stage;
      private var dragOrigin:Point;
      private var transitioning:Boolean = false;
      private var destinations:Array = [new Point(383,425),new Point(577,465),new Point(748,326)];
      private var directions:Array = ["左下方","下方中央","右上方"];

      public function MapProcess_326()
      {
         super();
      }

      override protected function init() : void
      {
         conLevel["npcMC"].visible = false;
         conLevel["weisikeMC"].visible = false;
         conLevel["haidaoMC"].visible = false;
         for(var index:uint = 0;index < 3;index++)
         {
            var stone:MovieClip = conLevel["icon" + index];
            stone.mouseChildren = false;
            if(index > 0) stone["mc"].gotoAndStop(1);
            ToolTipManager.add(stone,index == 0 ? "将中间石碑拖到左下方相同的地面符文上" : "先放好前一块石碑，再按相同符文配对");
         }
         this.enableStone(0);
         animatorLevel["anmain"]["mc"].gotoAndStop(1);
         for(var soundIndex:uint = 1;soundIndex < 7;soundIndex++)
         {
            conLevel["soundPlay" + soundIndex].gotoAndStop(1);
            conLevel["soundPlay" + soundIndex].buttonMode = true;
            conLevel["soundPlay" + soundIndex].addEventListener(MouseEvent.CLICK,this.soudPlay);
         }
      }

      private function enableStone(index:uint) : void
      {
         var stone:MovieClip = conLevel["icon" + index];
         stone.buttonMode = true;
         stone.addEventListener(MouseEvent.MOUSE_DOWN,this.startDr);
         ToolTipManager.add(stone,"拖到" + this.directions[index] + "相同的地面符文上");
      }

      private function startDr(event:MouseEvent) : void
      {
         if(this.draggedStone != null || this.transitioning) return;
         event.stopPropagation();
         this.draggedStone = event.currentTarget as MovieClip;
         this.dragOrigin = new Point(this.draggedStone.x,this.draggedStone.y);
         this.dragStage = this.draggedStone.stage;
         this.dragStage.addEventListener(MouseEvent.MOUSE_UP,this.stopDr);
         this.dragStage.addEventListener(Event.MOUSE_LEAVE,this.cancelDrag);
         this.draggedStone.startDrag();
      }

      private function detachDrag() : MovieClip
      {
         var stone:MovieClip = this.draggedStone;
         if(stone != null) stone.stopDrag();
         if(this.dragStage != null)
         {
            this.dragStage.removeEventListener(MouseEvent.MOUSE_UP,this.stopDr);
            this.dragStage.removeEventListener(Event.MOUSE_LEAVE,this.cancelDrag);
         }
         this.draggedStone = null;
         this.dragStage = null;
         return stone;
      }

      private function cancelDrag(event:Event = null) : void
      {
         var stone:MovieClip = this.detachDrag();
         if(stone != null)
         {
            stone.x = this.dragOrigin.x;
            stone.y = this.dragOrigin.y;
         }
         this.dragOrigin = null;
      }

      private function stopDr(event:MouseEvent) : void
      {
         var stone:MovieClip = this.detachDrag();
         if(stone == null) return;
         event.stopPropagation();
         var index:uint = uint(stone.name.substr(4));
         if(!stone.hitTestObject(conLevel["Nicon" + index]))
         {
            stone.x = this.dragOrigin.x;
            stone.y = this.dragOrigin.y;
            this.dragOrigin = null;
            Alarm.show("符文未对齐，请将这块石碑拖到" + this.directions[index] + "相同的地面符文上。");
            return;
         }
         this.dragOrigin = null;
         var destination:Point = this.destinations[index];
         stone.x = destination.x;
         stone.y = destination.y;
         stone.buttonMode = false;
         stone.mouseEnabled = false;
         stone.mouseChildren = false;
         stone.removeEventListener(MouseEvent.MOUSE_DOWN,this.startDr);
         ToolTipManager.remove(stone);
         this.stoneChannel = MapLibManager.getSound("downStone").play();
         this.stoneChannel.addEventListener(Event.SOUND_COMPLETE,this.otherSound);
         stone["mc"].gotoAndPlay(2);
         if(index < 2)
         {
            this.enableStone(index + 1);
            return;
         }
         this.stoneChannel.removeEventListener(Event.SOUND_COMPLETE,this.otherSound);
         MapLibManager.getSound("openStone").play();
         this.transitioning = true;
         LevelManager.closeMouseEvent();
         this.my_timedProcess = setTimeout(this.setTime1,2000);
      }

      private function otherSound(event:Event) : void
      {
         var channel:SoundChannel = event.currentTarget as SoundChannel;
         channel.removeEventListener(Event.SOUND_COMPLETE,this.otherSound);
         MapLibManager.getSound("lightSound").play();
      }

      private function setTime1() : void
      {
         clearTimeout(this.my_timedProcess);
         this.my_timedProcess = 0;
         animatorLevel["anmain"]["mc"].gotoAndPlay(1);
         animatorLevel["anmain"].gotoAndPlay(2);
         this.my_timedProcess2 = setTimeout(this.setTime2,5000);
      }

      private function setTime2() : void
      {
         LevelManager.openMouseEvent();
         this.transitioning = false;
         clearTimeout(this.my_timedProcess2);
         this.my_timedProcess2 = 0;
         MapManager.changeMap(327);
      }

      private function soudPlay(event:MouseEvent) : void
      {
         var index:uint = uint(event.currentTarget.name.substr(9));
         conLevel["soundPlay" + index].gotoAndPlay(1);
         MapLibManager.getSound("oneSound" + index).play();
      }

      override public function destroy() : void
      {
         this.cancelDrag();
         for(var index:uint = 0;index < 3;index++)
         {
            var stone:MovieClip = conLevel["icon" + index];
            stone.removeEventListener(MouseEvent.MOUSE_DOWN,this.startDr);
            ToolTipManager.remove(stone);
         }
         for(var soundIndex:uint = 1;soundIndex < 7;soundIndex++)
         {
            conLevel["soundPlay" + soundIndex].removeEventListener(MouseEvent.CLICK,this.soudPlay);
         }
         if(this.stoneChannel != null)
         {
            this.stoneChannel.removeEventListener(Event.SOUND_COMPLETE,this.otherSound);
            this.stoneChannel.stop();
            this.stoneChannel = null;
         }
         clearTimeout(this.my_timedProcess);
         clearTimeout(this.my_timedProcess2);
         this.my_timedProcess = 0;
         this.my_timedProcess2 = 0;
         if(this.transitioning) LevelManager.openMouseEvent();
         this.transitioning = false;
      }
   }
}
