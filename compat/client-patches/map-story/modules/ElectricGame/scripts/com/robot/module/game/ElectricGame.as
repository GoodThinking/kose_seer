package com.robot.module.game
{
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.display.Stage;
   import flash.events.Event;
   import flash.events.KeyboardEvent;
   import flash.events.MouseEvent;
   import flash.events.TimerEvent;
   import flash.ui.Keyboard;
   import flash.utils.Timer;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.module.IModule;
   
   [SWF(width="500", height="375", backgroundColor="#869ca7", frameRate="24")]
   public class ElectricGame extends Sprite implements IModule
   {
      
      private var left:MovieClip;
      
      private var bool2:Boolean = false;
      
      private var bool3:Boolean = false;
      
      private var timer1:Timer;
      
      private var timer2:Timer;
      
      private var state:String;
      
      private var bool1:Boolean = false;
      
      private var timer3:Timer;
      
      private var right:MovieClip;
      
      private var electric:ElectricCreate;
      
      private var allScore:Number;
      
      private var timeMove1:Timer;
      
      private var timeMove2:Timer;

      private var inputStage:Stage;

      private var completionTimeout:uint;
      
      public function ElectricGame()
      {
         super();
      }
      
      private function downElec(e:KeyboardEvent) : void
      {
         timeMove2.start();
         timeMove1.start();
      }
      
      public function delet() : void
      {
         if(!electric) return;
         stopRunning();
         clearTimeout(completionTimeout);
         completionTimeout = 0;
         electric.closeBtn.removeEventListener(MouseEvent.CLICK,closeGame);
         electric.StartBtn.removeEventListener(MouseEvent.CLICK,startGame);
         if(electric.parent) electric.parent.removeChild(electric);
         electric = null;
         left = right = null;
         LevelManager.openMouseEvent();
      }

      private function stopTimer(timer:Timer, listener:Function) : void
      {
         if(!timer) return;
         timer.stop();
         timer.removeEventListener(TimerEvent.TIMER,listener);
      }

      private function stopRunning() : void
      {
         if(electric) electric.removeEventListener(Event.ENTER_FRAME,confine);
         if(inputStage)
         {
            inputStage.removeEventListener(KeyboardEvent.KEY_DOWN,upElectric);
            inputStage.removeEventListener(KeyboardEvent.KEY_UP,downElec);
            inputStage = null;
         }
         stopTimer(timeMove1,move1Electric);
         stopTimer(timeMove2,move2Electric);
         stopTimer(timer1,addLowScore);
         stopTimer(timer2,addNomalScore);
         stopTimer(timer3,addHighScore);
         timeMove1 = timeMove2 = timer1 = timer2 = timer3 = null;
      }
      
      private function startGame(e:MouseEvent) : void
      {
         if(!electric.StartBtn.visible) return;
         electric.gameMC.visible = true;
         electric.HadElec.visible = true;
         electric.elecTxt.visible = true;
         electric.StartBtn.visible = false;
         electric.WordSting.visible = false;
         right = electric.Right;
         left = electric.Left;
         right.y = 80;
         left.y = 80;
         timeMove1 = new Timer(200);
         timeMove1.addEventListener(TimerEvent.TIMER,move1Electric);
         timeMove1.start();
         timeMove2 = new Timer(200);
         timeMove2.addEventListener(TimerEvent.TIMER,move2Electric);
         timeMove2.start();
         inputStage = MainManager.getStage();
         inputStage.focus = inputStage;
         inputStage.addEventListener(KeyboardEvent.KEY_DOWN,upElectric);
         inputStage.addEventListener(KeyboardEvent.KEY_UP,downElec);
         electric.addEventListener(Event.ENTER_FRAME,confine);
      }
      
      private function closeGame(e:MouseEvent) : void
      {
         delet();
      }
      
      public function init(data:Object = null) : void
      {
      }
      
      private function move1Electric(e:TimerEvent) : void
      {
         right.y += 6;
      }
      
      private function delayTime2() : void
      {
         completionTimeout = 0;
         TasksManager.complete(405,0);
         delet();
      }
      
      private function upElectric(e:KeyboardEvent) : void
      {
         switch(e.keyCode)
         {
            case Keyboard.LEFT:
               left.y -= 5;
               timeMove2.stop();
               break;
            case Keyboard.RIGHT:
               right.y -= 5;
               timeMove1.stop();
         }
      }
      
      public function show() : void
      {
         delet();
         allScore = 0;
         LevelManager.closeMouseEvent();
         electric = new ElectricCreate();
         LevelManager.appLevel.addChild(electric);
         electric.x = (MainManager.getStage().width - electric.width) / 2;
         electric.y = (MainManager.getStage().height - electric.height) / 2;
         electric.HadElec.visible = false;
         electric.gameMC.visible = false;
         electric.elecTxt.visible = false;
         electric.closeBtn.addEventListener(MouseEvent.CLICK,closeGame);
         electric.StartBtn.addEventListener(MouseEvent.CLICK,startGame);
      }
      
      private function addNomalScore(e:TimerEvent) : void
      {
         allScore += 30;
      }
      
      public function destroy() : void
      {
         delet();
      }
      
      private function addLowScore(e:TimerEvent) : void
      {
         allScore += 15;
      }
      
      public function hide() : void
      {
         delet();
      }
      
      private function delayTime() : void
      {
         completionTimeout = 0;
         var panel:ElectricCreate = electric;
         Alarm.show("  非常抱歉，你的比比鼠没能掌握好电能球的发电频率哦。不要气馁，再来试试看吧！相信你一定能发现其中的诀窍。",function():void
         {
            if(electric == panel) delet();
         });
      }
      
      private function addHighScore(e:TimerEvent) : void
      {
         allScore += 50;
      }
      
      private function confine(e:Event) : void
      {
         electric.elecTxt.text = allScore.toString();
         if(right.y <= 62 || right.y >= 242 || left.y <= 62 || left.y >= 242)
         {
            electric.closeBtn.mouseEnabled = false;
            stopRunning();
            electric.gameMC.gotoAndStop(4);
            completionTimeout = setTimeout(delayTime,3000);
            return;
         }
         if(allScore >= 3000)
         {
            electric.closeBtn.mouseEnabled = false;
            allScore = 3000;
            electric.elecTxt.text = allScore.toString();
            stopRunning();
            electric.gameMC.gotoAndStop(5);
            completionTimeout = setTimeout(delayTime2,3000);
            return;
         }
         if((right.y > 62 && right.y <= 106 || right.y > 196 && right.y < 242) && (left.y > 62 && left.y <= 106 || left.y > 196 && left.y < 242))
         {
            state = "lowScore";
         }
         else if((right.y > 106 && right.y <= 140 || right.y > 163 && right.y <= 196) && (left.y > 106 && left.y <= 140) || left.y > 163 && left.y <= 196)
         {
            state = "nomalScore";
         }
         else if(right.y > 140 && right.y <= 163 && (left.y > 140 && left.y <= 163))
         {
            state = "highScore";
         }
         else
         {
            state = "lowScore";
         }
         if(state == "lowScore")
         {
            if(!timer1)
            {
               timer1 = new Timer(500);
               timer1.addEventListener(TimerEvent.TIMER,addLowScore);
               timer1.start();
               electric.gameMC.gotoAndStop(1);
               if(timer2)
               {
                  timer2.stop();
                  timer2 = null;
               }
               if(timer3)
               {
                  timer3.stop();
                  timer3 = null;
               }
            }
         }
         else if(state == "nomalScore")
         {
            if(!timer2)
            {
               if(timer1)
               {
                  timer1.stop();
                  timer1 = null;
               }
               timer2 = new Timer(500);
               timer2.addEventListener(TimerEvent.TIMER,addNomalScore);
               timer2.start();
               electric.gameMC.gotoAndStop(2);
               if(timer3)
               {
                  timer3.stop();
                  timer3 = null;
               }
            }
         }
         else if(state == "highScore")
         {
            if(!timer3)
            {
               if(timer1)
               {
                  timer1.stop();
                  timer1 = null;
               }
               if(timer2)
               {
                  timer2.stop();
                  timer2 = null;
               }
               timer3 = new Timer(500);
               timer3.addEventListener(TimerEvent.TIMER,addHighScore);
               timer3.start();
               electric.gameMC.gotoAndStop(3);
            }
         }
      }
      
      public function setup() : void
      {
      }
      
      private function move2Electric(e:TimerEvent) : void
      {
         left.y += 4;
      }
   }
}

