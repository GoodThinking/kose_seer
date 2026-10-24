package com.robot.app.task.taskscollection
{
   import com.robot.app.fight.*;
   import com.robot.app.mapProcess.*;
   import com.robot.app.task.control.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import org.taomee.manager.EventManager;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.npc.*;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.*;
   import flash.utils.*;
   import org.taomee.utils.*;
   
   public class Task795
   {
      
      private static var _map:BaseMapProcess;
      
      private static var crtSeer:int;
      
      private static var intervalID:uint;
      
      private static var standuptimeout:uint;
      
      private static var seerArray:Array = [];
      
      public function Task795()
      {
         super();
      }
      
      public static function initTaskForMap662(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         crtSeer = 1;
         TasksManager.getProStatusList(TaskController_795.TASK_ID,function(param1:Array):void
         {
            var _loc2_:MovieClip = null;
            _loc2_ = _map.topLevel["seers"];
            _map.topLevel["guide"].visible = false;
            _map.topLevel["guide2"].visible = false;
            if(!param1[0])
            {
               _loc2_.buttonMode = true;
               showSeersDialog();
               _loc2_.addEventListener(MouseEvent.CLICK,onSeersClicked);
            }
            else if(Boolean(param1[0]) && !param1[1])
            {
               initForStep1();
            }
            else
            {
               DisplayUtil.removeForParent(_loc2_);
               _map = null;
            }
         });
      }
      
      private static function onSeersClicked(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         NpcDialog.show(NPC.SEER,["这，这，Y星守卫队竟然全部被击倒！"],null,null,false,function():void
         {
            NpcDialog.show(NPC.SEER,["而且他们身上还着火了，这可怎么办呀！"],null,null,false,function():void
            {
               NpcDialog.show(NPC.SEER,["咦！瀑布旁有水桶，我得赶紧用清水浇灭他们身上的火焰。"],["（点击瀑布旁边的水桶，用清水扑灭守卫队身上的火焰）"],[function():void
               {
                  TasksManager.complete(TaskController_795.TASK_ID,0,function(param1:Boolean):void
                  {
                     if(param1)
                     {
                        clearStep0();
                        initForStep1();
                     }
                  });
               }]);
            });
         });
      }
      
      private static function showSeersDialog() : void
      {
         seerArray.push(_map.topLevel["seers"]["s1"]);
         seerArray.push(_map.topLevel["seers"]["s2"]);
         seerArray.push(_map.topLevel["seers"]["s3"]);
         seerArray[1].gotoAndStop(2);
         intervalID = setInterval(function():void
         {
            var _loc1_:* = 0;
            while(_loc1_ < seerArray.length)
            {
               if(seerArray[_loc1_].currentFrame == 2)
               {
                  seerArray[_loc1_].gotoAndStop(1);
               }
               _loc1_++;
            }
            var _loc2_:* = int(Math.random() * seerArray.length);
            if(seerArray[_loc2_].currentFrame == 1)
            {
               seerArray[_loc2_].gotoAndStop(2);
            }
         },3000);
      }
      
      private static function clearStep0() : void
      {
         seerArray = [];
         clearInterval(intervalID);
         _map.topLevel["seers"].removeEventListener(MouseEvent.CLICK,onSeersClicked);
         _map.topLevel["seers"].buttonMode = false;
      }
      
      private static function initForStep1() : void
      {
         showSeersDialog();
         var _loc1_:int = 0;
         while(_loc1_ < seerArray.length)
         {
            seerArray[_loc1_].addEventListener(MouseEvent.CLICK,onSeerClicked);
            _loc1_++;
         }
         _map.topLevel["guide"].visible = true;
         _map.topLevel["bucket"].addEventListener(MouseEvent.CLICK,onBucketClicked);
      }
      
      private static function onBucketClicked(param1:MouseEvent) : void
      {
         _map.topLevel["guide"].visible = false;
         _map.topLevel["bucket"].removeEventListener(MouseEvent.CLICK,onBucketClicked);
      }
      
      private static function onSeerClicked(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var seer:MovieClip = MovieClip(e.currentTarget);
         if(MapProcess_662.canPourWater)
         {
            seer.removeEventListener(MouseEvent.CLICK,onSeerClicked);
            seerArray.splice(seerArray.indexOf(seer),1);
            seer.gotoAndStop(3);
            if(seerArray.length == 0)
            {
               clearInterval(intervalID);
               standuptimeout = setTimeout(function():void
               {
                  NpcDialog.show(NPC.SEER,["兄弟们，好点没？"],null,null,false,function():void
                  {
                     NpcDialog.show(NPC.SHOUWEIDUIYUAN_1,[MainManager.actorInfo.formatNick + "，幸亏你及时赶到，要不然我们会被烧焦的……"],null,null,false,function():void
                     {
                        NpcDialog.show(NPC.SHOUWEIDUIYUAN_2,["是啊，瞧我们现在这肤色，真是太难看了！呜呜呜！"],null,null,false,function():void
                        {
                           NpcDialog.show(NPC.SEER,["伙伴们，一定要振作起来呀！现在的整容技术发达，你们绝对能恢复以往的帅气！By the way，这里到底发生了什么事情？"],null,null,false,function():void
                           {
                              NpcDialog.show(NPC.SHOUWEIDUIZHANG,["哎！太突然啦，我们强大的Y星守卫队竟然被搞成如此模样……身为为队长的我还真有点说不出口。"],["（守卫队长强迫自己开始回忆……）"],[function():void
                              {
                                 AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_795_2"),function():void
                                 {
                                    NpcDialog.show(NPC.SHOUWEIDUIYUAN_1,["话说，我们被莫名其妙的黑影打倒后，紧接着又被愚蠢至极的海盗虐待！这不单单是Y星守卫队的败绩，也是整个XIN的耻辱啊！"],["嗯，确实有那么一点……"],[function():void
                                    {
                                       NpcDialog.show(NPC.SHOUWEIDUIYUAN_2,["咳咳，" + MainManager.actorInfo.formatNick + "，我们全身都快散架了，得立刻回XIN进行修理。"],["你们回去好好休息，我一定会在这找出黑影与海盗。"],[function():void
                                       {
                                          NpcDialog.show(NPC.SHOUWEIDUIZHANG,["嗯， 你要小心应付，我们会要求船长迅速派出兵力援助的。"],["Y星就先交给我吧，没问题！"],[function():void
                                          {
                                             TasksManager.complete(TaskController_795.TASK_ID,1,function(param1:Boolean):void
                                             {
                                                if(param1)
                                                {
                                                   _map.topLevel["seers"]["s1"].gotoAndStop(4);
                                                   _map.topLevel["seers"]["s2"].gotoAndStop(4);
                                                   _map.topLevel["seers"]["s3"].gotoAndStop(4);
                                                   _map.topLevel["guide2"].visible = true;
                                                }
                                             });
                                          }]);
                                       }]);
                                    }]);
                                 });
                              }]);
                           });
                        });
                     });
                  });
               },3500);
            }
         }
      }
      
      private static function clearStep1() : void
      {
         clearTimeout(standuptimeout);
         _map.topLevel["seers"]["s1"].removeEventListener(MouseEvent.CLICK,onSeerClicked);
         _map.topLevel["seers"]["s2"].removeEventListener(MouseEvent.CLICK,onSeerClicked);
         _map.topLevel["seers"]["s3"].removeEventListener(MouseEvent.CLICK,onSeerClicked);
         _map.topLevel["bucket"].removeEventListener(MouseEvent.CLICK,onBucketClicked);
      }
      
      public static function initTaskForMap664(param1:BaseMapProcess) : void
      {
         var map:BaseMapProcess = param1;
         _map = map;
         TasksManager.getProStatusList(TaskController_795.TASK_ID,function(param1:Array):void
         {
            if(Boolean(param1[0]) && Boolean(param1[1]) && !param1[2])
            {
               _map.conLevel["task795mc"].buttonMode = true;
               _map.conLevel["task795mc"].addEventListener(MouseEvent.CLICK,on2npcClicked);
               _map.conLevel["kaxiusi"].visible = false;
            }
            else if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && !param1[3])
            {
               initForStep3();
               DisplayUtil.removeForParent(_map.conLevel["task795mc"]);
            }
            else
            {
               DisplayUtil.removeForParent(_map.conLevel["task795mc"]);
               DisplayUtil.removeForParent(_map.conLevel["kaxiusi"]);
               _map = null;
            }
         });
      }
      
      private static function on2npcClicked(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         MainManager.actorModel.moveAndAction(new Point(490,230),function():void
         {
            _map.conLevel["task795mc"].removeEventListener(MouseEvent.CLICK,on2npcClicked);
            NpcDialog.show(NPC.ZOG_20111027,["小乖乖，别乱跑了，跟哥哥我回海盗基地吧。"],null,null,false,function():void
            {
               NpcDialog.show(NPC.ALLISON_20111027,["听话啊，小乖乖，你要是被XIN的那帮坏蛋抓住可就惨啦，我们是在帮助你呀！"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.HEIYING_111117,["……"],null,null,false,function():void
                  {
                     NpcDialog.show(NPC.SEER,["佐格！艾利逊！胡说八道什么！你们才是全宇宙最最最最坏的超级大坏蛋！"],null,null,false,function():void
                     {
                        NpcDialog.show(NPC.ZOG_20111027,["又是你这个小喽啰，怎么我们出现在哪儿，你就跟到哪呀！"],null,null,false,function():void
                        {
                           NpcDialog.show(NPC.ALLISON_20111027,["大哥说得对，这个家伙太烦人了！必须得教训教训。"],["（与佐格、艾利逊对战）"],[function():void
                           {
                              _map.conLevel["task795mc"].addEventListener(MouseEvent.CLICK,onFightWith2npc);
                           }]);
                        });
                     });
                  });
               });
            });
         });
      }
      
      private static function onFightWith2npc(param1:MouseEvent) : void
      {
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFight2npcComplete);
         EventManager.addEventListener(PetFightEvent.ALARM_CLICK,onFight2npcComplete);
         FightManager.fightWithBoss("佐格、艾利逊",1);
      }
      
      private static function onFight2npcComplete(param1:PetFightEvent) : void
      {
         var e:PetFightEvent = param1;
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFight2npcComplete);
         TasksManager.complete(TaskController_795.TASK_ID,2,function(param1:Boolean):void
         {
            var b:Boolean = param1;
            if(b)
            {
               initForStep3();
               AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_795_3"),function():void
               {
                  NpcDialog.show(NPC.ALLISON_20111027,["大哥，卡修斯太厉害了，咱们先逃吧！"],null,null,false,function():void
                  {
                     NpcDialog.show(NPC.ZOG_20111027,["弟弟说的很实在，好汉不吃眼前亏，那个小乖乖终将会是我们的囊中之物，咱们闪咯！"],null,null,false,function():void
                     {
                        _map.conLevel["task795mc"].gotoAndStop(3);
                     });
                  });
               });
            }
         });
         _map.conLevel["task795mc"].gotoAndStop(2);
      }
      
      private static function initForStep3() : void
      {
         _map.conLevel["kaxiusi"].visible = true;
         _map.conLevel["kaxiusi"].buttonMode = true;
         _map.conLevel["kaxiusi"].addEventListener(MouseEvent.CLICK,onkaxiusiClicked);
      }
      
      private static function onkaxiusiClicked(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         MainManager.actorModel.moveAndAction(new Point(380,230),function():void
         {
            NpcDialog.show(NPC.SEER,["卡修斯，你怎么跑到Y星球来了？"],null,null,false,function():void
            {
               NpcDialog.show(NPC.KAXIUSI_WHITE,["我也不想这么奔波啊！可那个黑影小家伙最近总在怀特星鬼鬼祟祟，我今天是一路追踪他到此的。"],["什么？他竟然去过怀特星？"],[function():void
               {
                  NpcDialog.show(NPC.KAXIUSI_WHITE,["嗯，而海盗似乎也一直与他有关联，几次我都看见他们同时出现！"],["我从前面佐格、艾利逊与他的谈话中可以肯定，他们不是一伙的。"],[function():void
                  {
                     NpcDialog.show(NPC.SEER,["佐格、艾利逊一直在哄骗他回海盗基地，而他却是一直在对抗。"],null,null,false,function():void
                     {
                        NpcDialog.show(NPC.KAXIUSI_WHITE,["但愿如此，那个家伙的实力与我不相上下，希望他是属于正义的一方！"],["船长给我发来消息了，一定有紧急情况。"],[function():void
                        {
                           var app:* = undefined;
                           app = undefined;
                           app = ModuleManager.getModule(ClientConfig.getAppModule("TaskIntro_795"));
                           app.setup();
                           app.show();
                           app.sharedEvents.addEventListener(Event.CLOSE,function(param1:Event):void
                           {
                              var evt:* = param1;
                              app.sharedEvents.removeEventListener(Event.CLOSE,arguments.callee);
                              app.destroy();
                              app = null;
                              NpcDialog.show(NPC.KAXIUSI_WHITE,["这个小丑总算是出现了！"],["卡修斯，我们出发吧！（前往魔窟）"],[function():void
                              {
                                 TasksManager.complete(TaskController_795.TASK_ID,3,function(param1:Boolean):void
                                 {
                                    if(param1)
                                    {
                                       MapManager.changeMap(479);
                                    }
                                 });
                              }]);
                           });
                        }]);
                     });
                  }]);
               }]);
            });
         });
      }
      
      public static function initTaskForMap479() : void
      {
         AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_795_4"),function():void
         {
            NpcDialog.show(NPC.SEER,["晕倒！我真服他了，这傻子是想在怀特星与我们玩一万年的捉迷藏吗！"],null,null,false,function():void
            {
               NpcDialog.show(NPC.KAXIUSI_WHITE,["哎！我也很无语啊，它什么时候可以离开怀特星，我就真的欣慰了！"],["卡修斯，别着急，我们会等到那一天的。"],[function():void
               {
                  AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_795_5"),function():void
                  {
                     TasksManager.complete(TaskController_795.TASK_ID,4);
                  });
               }]);
            });
         });
      }
      
      public static function destroy() : void
      {
         if(!_map)
         {
            return;
         }
         if(MapManager.currentMap.id == 662)
         {
            clearStep0();
            clearStep1();
         }
         else if(MapManager.currentMap.id == 664)
         {
            _map.conLevel["task795mc"].removeEventListener(MouseEvent.CLICK,on2npcClicked);
            _map.conLevel["task795mc"].removeEventListener(MouseEvent.CLICK,onFightWith2npc);
            _map.conLevel["kaxiusi"].removeEventListener(MouseEvent.CLICK,onkaxiusiClicked);
         }
         _map = null;
      }
   }
}

