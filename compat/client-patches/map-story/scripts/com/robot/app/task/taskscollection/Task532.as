package com.robot.app.task.taskscollection
{
   import com.robot.app.fight.FightManager;
   import com.robot.app.mapProcess.MapProcess_17;
   import com.robot.app.task.control.TaskController_532;
   import com.robot.core.animate.AnimateManager;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.event.PetFightEvent;
   import com.robot.core.event.RobotEvent;
   import com.robot.core.info.fightInfo.attack.FightOverInfo;
   import org.taomee.manager.EventManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.BossModel;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.geom.Rectangle;
   import flash.utils.getQualifiedClassName;
   import org.taomee.manager.ResourceManager;
   import org.taomee.utils.DisplayUtil;

   public class Task532
   {
      public static var _mushroomNum:int = 0;
      public static var _pirateNum:int = 0;

      private static const MUSHROOMS:Array = [
         {map:10,x:59,y:126},{map:10,x:877,y:275},
         {map:11,x:140,y:177},{map:11,x:372,y:169},
         {map:12,x:698,y:113}
      ];
      private static const PIRATES:Array = [{x:681,y:202},{x:810,y:207},{x:686,y:271}];
      private static const QUESTIONS:XML = <all><dialog question="海水中含有大量盐类，哪种盐类含量最高？" answerA="硫酸镁" answerB="氯化钠" answerC="氯化镁" right="1"/><dialog question="你知道鲨鱼还有一个什么外号叫什么吗？" answerA="海中狮" answerB="海中王" answerC="海中狼" right="2"/><dialog question="地球上的鲸鲨是海洋中最大的鱼类，它长成后身长可以达多少尺呢？" answerA="16米" answerB="18米" answerC="20米" right="1"/></all>;
      private static const MUSHROOM_DIALOG:Array = ["咯叽……咯叽！嘿嘿……我藏的这么隐蔽你都好发现啦！好厉害哦！#1","不好玩#2！人家藏在这里好好的！5555~~我去告诉大蘑菇！","我们再来玩一次好不好！每次大蘑菇都找不到我们！还是你比较厉害呢！#6","咦？你就是赛尔吗？你头上的螺丝钉给我玩玩吧？我去找大蘑菇咯！","你看不到我！你看不到我！哎呀！怎么还是被你发现了！"];
      private static const SHARK_DIALOG:Array = ["搞什么呀！这个可是最基本的问题了！连这个都不知道还好意思潜水下海来找我！真是的！再给你次机会！","不是吧！！！真没见识！好好再想想！我先不吃你！你努力想想！","就差一点点了！你再努力想想啊！"];
      private static const PIRATE_DIALOG:Array = ["别得意的太早！我们老大一定会打开赫尔卡星宝藏的！","君子报仇十年不晚！下一次你可千万不要栽在我手里！","可恶！又是赛尔！！我这就去告诉我的艾里逊大人！"];

      private static var _map:BaseMapProcess;
      private static var _mapId:uint;
      private static var _progress:Array;
      private static var _actors:Array = [];
      private static var _loads:Array = [];
      private static var _hidden:Array = [];
      private static var _found:Array = [false,false,false,false,false];
      private static var _defeated:Array = [false,false,false];
      private static var _introduced:Boolean = false;
      private static var _volcanoIntroduced:Boolean = false;
      private static var _busy:Boolean = false;
      private static var _isFight:Boolean = false;
      private static var _pendingPirate:int = -1;
      private static var _wonPirate:Boolean = false;
      private static var _questionOrder:Array = [];
      private static var _questionIndex:int = 0;

      public static function initTask() : void
      {
         _mushroomNum = 0;
         _pirateNum = 0;
         _found = [false,false,false,false,false];
         _defeated = [false,false,false];
         _introduced = false;
         _volcanoIntroduced = false;
         _questionOrder = [];
         _questionIndex = 0;
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_532_1"),function():void
         {
            NpcDialog.show(NPC.IRIS,["据我所知，蘑菇怪、钢牙鲨和里奥斯都具有与众不同的活力能源，我想，它们应该可以使钥匙复苏！"],["我先去克洛斯星找蘑菇怪。","我先去海洋星找钢牙鲨。","我先去火山星找里奥斯。"],[function():void
            {
               MapManager.changeMap(12);
            },function():void
            {
               MapManager.changeMap(22);
            },function():void
            {
               MapManager.changeMap(17);
            }]);
         });
      }

      public static function initMap(map:BaseMapProcess) : void
      {
         if(TasksManager.getTaskStatus(532) != TasksManager.ALR_ACCEPT)
         {
            return;
         }
         _map = map;
         _mapId = MapManager.currentMap.id;
         TasksManager.getProStatusList(532,function(progress:Array):void
         {
            if(_map != map || MapManager.currentMap == null || MapManager.currentMap.id != _mapId)
            {
               return;
            }
            _progress = progress;
            _map.depthLevel.addEventListener(MouseEvent.CLICK,onNpcClick,true);
            if(_mapId >= 10 && _mapId <= 12 && !progress[0])
            {
               for(var i:int = 0; i < MUSHROOMS.length; i++)
               {
                  if(MUSHROOMS[i].map == _mapId && !_found[i])
                  {
                     addActor("mushroom_" + i,46,MUSHROOMS[i].x,MUSHROOMS[i].y,onMushroomClick,true);
                  }
               }
               if(_mapId == 12)
               {
                  if(_mushroomNum == 5)
                  {
                     finishMushrooms();
                  }
                  else if(!_introduced)
                  {
                     introduceMushrooms();
                  }
               }
            }
            else if(_mapId == 22 && !progress[1])
            {
               startQuiz();
            }
            else if(_mapId == 17 && !progress[2])
            {
               MapProcess_17(_map).setTreasureStoryActive(true);
               hideActor(_map.depthLevel.getChildByName("npc"));
               hideActor(_map.depthLevel.getChildByName("fire_mc"));
               hideActor(_map.depthLevel.getChildByName("boss"));
               hideActor(_map.conLevel.getChildByName("bossHu1"));
               _map.depthLevel.addEventListener(Event.ADDED,onActorAdded);
               for(i = 0; i < _map.depthLevel.numChildren; i++)
               {
                  if(_map.depthLevel.getChildAt(i) is BossModel)
                  {
                     hideActor(_map.depthLevel.getChildAt(i));
                  }
               }
               addActor("treasure_liaos",42,740,225,onLiaosClick);
               for(i = 0; i < PIRATES.length; i++)
               {
                  if(!_defeated[i])
                  {
                     addActor("pirate_" + i,5020,PIRATES[i].x,PIRATES[i].y,onPirateClick);
                  }
               }
               resumeVolcano();
            }
         });
      }

      private static function addActor(name:String,petId:uint,x:Number,y:Number,click:Function,head:Boolean = false) : void
      {
         var map:BaseMapProcess = _map;
         var path:String = ClientConfig.getPetSwfPath(petId);
         var loaded:Function = function(content:DisplayObject):void
         {
            if(_map != map || content == null)
            {
               return;
            }
            if(name.indexOf("pirate_") == 0 && _defeated[int(name.substr(7))])
            {
               return;
            }
            var actor:MovieClip = content as MovieClip;
            actor.name = name;
            actor.gotoAndStop("down");
            actor.mouseChildren = false;
            actor.buttonMode = true;
            var bounds:Rectangle = actor.getBounds(actor);
            actor.x = x - bounds.x - bounds.width / 2;
            actor.y = y - bounds.y - bounds.height * (head ? 0.3 : 1);
            actor.addEventListener(MouseEvent.CLICK,click);
            _actors.push({actor:actor,click:click});
            map.depthLevel.addChild(actor);
         };
         _loads.push({path:path,loaded:loaded});
         ResourceManager.getResource(path,loaded,"pet");
      }

      private static function hideActor(actor:DisplayObject) : void
      {
         if(actor == null)
         {
            return;
         }
         for each(var saved:Object in _hidden)
         {
            if(saved.actor == actor)
            {
               return;
            }
         }
         _hidden.push({actor:actor,visible:actor.visible});
         actor.visible = false;
      }

      private static function onActorAdded(event:Event) : void
      {
         if(event.target is BossModel)
         {
            hideActor(event.target as DisplayObject);
         }
      }

      private static function onNpcClick(event:MouseEvent) : void
      {
         if(_progress == null)
         {
            return;
         }
         var actor:DisplayObject = event.target as DisplayObject;
         while(actor != null && actor != _map.depthLevel)
         {
            if(actor is BossModel || getQualifiedClassName(actor) == "com.robot.app.ogre.boss::FungusBoss")
            {
               if((_mapId == 12 && !_progress[0]) || (_mapId == 22 && !_progress[1]) || (_mapId == 17 && !_progress[2]))
               {
                  event.stopImmediatePropagation();
                  if(_mapId == 12) introduceMushrooms();
                  else if(_mapId == 22) startQuiz();
                  else showVolcanoDialogue();
               }
               return;
            }
            actor = actor.parent;
         }
      }

      private static function introduceMushrooms() : void
      {
         if(_busy) return;
         _busy = true;
         NpcDialog.show(NPC.MOGUGUAI,["走开！走开！没看见我正在忙嘛！什么活力钥匙不活力钥匙的！我不知道！我只要我的小蘑菇！啊555555~~~~~"],["或许我能够帮你。"],[function():void
         {
            NpcDialog.show(NPC.MOGUGUAI,["呜……呜呜！你是说真的吗？你确定没有骗我吗？那好！你帮我找到我的五个小蘑菇宝宝，我就帮你！它们肯定就在克洛斯星上！"],["好！我这就去找！"],[function():void
            {
               _introduced = true;
               _busy = false;
            }]);
         }]);
      }

      private static function onMushroomClick(event:MouseEvent) : void
      {
         if(_busy) return;
         var actor:MovieClip = event.currentTarget as MovieClip;
         var index:int = int(actor.name.substr(9));
         if(_found[index]) return;
         _found[index] = true;
         ++_mushroomNum;
         DisplayUtil.removeForParent(actor);
         _busy = true;
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_532_5"),function():void
         {
            if(_mushroomNum == 5)
            {
               NpcDialog.show(NPC.SEER,["一个、两个、三个……五个！啊哈！齐了！快去蘑菇怪那里看看吧！"],null,null,false,function():void
               {
                  _busy = false;
                  if(MapManager.currentMap.id == 12) finishMushrooms();
                  else MapManager.changeMap(12);
               });
            }
            else
            {
               NpcDialog.show(NPC.XIAOMOGU,[MUSHROOM_DIALOG[index]],["再到别的地方找找看吧！"],[function():void
               {
                  _busy = false;
               }]);
            }
         });
      }

      private static function finishMushrooms() : void
      {
         if(_busy) return;
         _busy = true;
         NpcDialog.show(NPC.MOGUGUAI,["没想到你这么厉害！竟然这么快就找到了我这群淘气的小宝贝！说吧，我能帮你什么？"],["你听说过活力之匙吗？我想请你帮我恢复它的活力！"],[function():void
         {
            NpcDialog.show(NPC.MOGUGUAI,["这个……那个……你是为了宝藏？算了！说话算话！我帮你！"],["谢谢蘑菇怪！谢谢蘑菇怪！"],[function():void
            {
               AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_532_2"),function():void
               {
                  NpcDialog.show(NPC.MOGUGUAI,["别以为帮了我就可以在这里久留！好了！忙你的事情去吧！不过别怪我没提醒你！你现在做的事情很危险……"],null,null,false,function():void
                  {
                     completeBranch(0);
                  });
               });
            }]);
         }]);
      }

      public static function startQuiz() : Boolean
      {
         if(_mapId != 22 || _progress == null || _progress[1]) return false;
         if(_busy) return true;
         _busy = true;
         if(_questionOrder.length == 0)
         {
            _questionOrder = [0,1,2];
            for(var i:int = 2; i > 0; i--)
            {
               var j:int = Math.floor(Math.random() * (i + 1));
               var value:int = _questionOrder[i];
               _questionOrder[i] = _questionOrder[j];
               _questionOrder[j] = value;
            }
         }
         if(_questionIndex >= 3)
         {
            finishQuiz();
         }
         else
         {
            NpcDialog.show(NPC.GANGYASHA_THIRD,["别怕！别怕！只要你能回答出我的问题，我就不吃你！不然！嘿嘿……"],null,null,false,askQuestion);
         }
         return true;
      }

      private static function askQuestion() : void
      {
         var question:XML = QUESTIONS.dialog[_questionOrder[_questionIndex]];
         var answers:Array = [];
         for(var i:int = 0; i < 3; i++)
         {
            answers.push(int(question.@right) == i ? onAnswerRight : onAnswerWrong);
         }
         NpcDialog.show(NPC.GANGYASHA_THIRD,[question.@question],[question.@answerA,question.@answerB,question.@answerC],answers);
      }

      private static function onAnswerRight() : void
      {
         ++_questionIndex;
         if(_questionIndex < 3) askQuestion();
         else finishQuiz();
      }

      private static function onAnswerWrong() : void
      {
         NpcDialog.show(NPC.GANGYASHA_THIRD,[SHARK_DIALOG[_questionIndex]],null,null,false,askQuestion);
      }

      private static function finishQuiz() : void
      {
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_532_6"),function():void
         {
            NpcDialog.show(NPC.GANGYASHA_THIRD,["说吧！说吧！我知道你这次来找我一定有事……"],null,null,false,function():void
            {
               NpcDialog.show(NPC.GANGYASHA_THIRD,["什么？活力钥匙？！那玩意可不是什么好东西！你真的希望我帮你恢复它的活力吗？"],["是的！拜托你了！"],[function():void
               {
                  AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_532_3"),function():void
                  {
                     NpcDialog.show(NPC.GANGYASHA_THIRD,["喂！小家伙！考验才刚刚开始！以后你可得好好保重了！"],["谢谢你！（没想到外表凶悍的钢牙鲨竟然这么好！）"],[function():void
                     {
                        completeBranch(1);
                     }]);
                  });
               }]);
            });
         });
      }

      public static function showVolcanoDialogue() : Boolean
      {
         if(_mapId != 17 || _progress == null || _progress[2]) return false;
         if(_busy || _isFight) return true;
         _busy = true;
         NpcDialog.show(NPC.LIAOS,["走开！走开！快走开！！！离开我的地盘！！！谁能帮我赶走可恶的海盗啊！"],null,null,false,function():void
         {
            _volcanoIntroduced = true;
            _busy = false;
         });
         return true;
      }

      private static function onLiaosClick(event:MouseEvent) : void
      {
         showVolcanoDialogue();
      }

      private static function onPirateClick(event:MouseEvent) : void
      {
         if(_busy || _isFight) return;
         _pendingPirate = int(DisplayObject(event.currentTarget).name.substr(7));
         if(_defeated[_pendingPirate]) return;
         _isFight = true;
         EventManager.addEventListener(RobotEvent.NO_PET_CAN_FIGHT,onFightError);
         EventManager.addEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
         FightManager.fightWithBoss("海盗",2);
      }

      private static function removeFightListeners() : void
      {
         EventManager.removeEventListener(RobotEvent.NO_PET_CAN_FIGHT,onFightError);
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
      }

      private static function onFightError(event:RobotEvent) : void
      {
         _isFight = false;
         _pendingPirate = -1;
         removeFightListeners();
      }

      private static function onFightComplete(event:PetFightEvent) : void
      {
         removeFightListeners();
         _isFight = false;
         if((event.dataObj as FightOverInfo).winnerID == MainManager.actorID && _pendingPirate >= 0 && !_defeated[_pendingPirate])
         {
            _defeated[_pendingPirate] = true;
            ++_pirateNum;
            _wonPirate = true;
         }
         _pendingPirate = -1;
         resumeVolcano();
      }

      private static function resumeVolcano() : void
      {
         if(_map == null || _mapId != 17 || _progress == null || _progress[2] || _isFight || _busy) return;
         for each(var entry:Object in _actors)
         {
            if(entry.actor.name.indexOf("pirate_") == 0 && _defeated[int(entry.actor.name.substr(7))])
            {
               DisplayUtil.removeForParent(entry.actor);
            }
         }
         if(_wonPirate)
         {
            _wonPirate = false;
            _busy = true;
            NpcDialog.show(NPC.PIRATE,[PIRATE_DIALOG[_pirateNum - 1]],null,null,false,function():void
            {
               _busy = false;
               resumeVolcano();
            });
         }
         else if(_pirateNum == 3)
         {
            finishVolcano();
         }
         else if(!_volcanoIntroduced)
         {
            showVolcanoDialogue();
         }
      }

      private static function finishVolcano() : void
      {
         _busy = true;
         NpcDialog.show(NPC.LIAOS,["每次有你出现的地方！就一定会给我带来麻烦！说吧……找我是为了什么？"],["我希望你能用你的火之能源注入到活力之匙中，帮助它恢复活力……"],[function():void
         {
            NpcDialog.show(NPC.LIAOS,["……我似乎已经很久没有看到过它了！呵呵！好吧！这或许就是赫尔卡星人寓言所说！"],["寓言……"],[function():void
            {
               AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_532_4"),function():void
               {
                  completeBranch(2);
               });
            }]);
         }]);
      }

      private static function completeBranch(index:uint) : void
      {
         var map:BaseMapProcess = _map;
         TasksManager.complete(532,index,function(success:Boolean):void
         {
            _busy = false;
            if(success)
            {
               if(_map == map) destroy(map);
               TaskController_532.showPanel();
            }
         });
      }

      public static function destroy(map:BaseMapProcess) : void
      {
         if(_map != map) return;
         _map.depthLevel.removeEventListener(MouseEvent.CLICK,onNpcClick,true);
         _map.depthLevel.removeEventListener(Event.ADDED,onActorAdded);
         if(_mapId == 17) MapProcess_17(_map).setTreasureStoryActive(false);
         for each(var load:Object in _loads) ResourceManager.cancel(load.path,load.loaded);
         for each(var entry:Object in _actors)
         {
            entry.actor.removeEventListener(MouseEvent.CLICK,entry.click);
            DisplayUtil.removeForParent(entry.actor);
         }
         for each(var saved:Object in _hidden) saved.actor.visible = saved.visible;
         _loads = [];
         _actors = [];
         _hidden = [];
         _progress = null;
         _map = null;
         _mapId = 0;
         _busy = false;
         if(!_isFight) removeFightListeners();
      }
   }
}
