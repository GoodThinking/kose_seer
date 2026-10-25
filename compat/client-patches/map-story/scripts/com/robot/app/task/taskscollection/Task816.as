package com.robot.app.task.taskscollection
{
   import com.robot.app.ogre.*;
   import com.robot.core.aimat.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.map.config.MapProcessConfig;
   import com.robot.core.mode.AppModel;
   import com.robot.core.npc.*;
   import com.robot.core.utils.*;
   import flash.display.MovieClip;
   import flash.events.*;
   import flash.geom.*;
   import org.taomee.utils.*;
   
   public class Task816
   {
      private static var _scene:StoryScene;
      
      private static var _map:BaseMapProcess;
      
      private static var _mcForMap666:MovieClip;
      
      private static var _app:AppModel;
      
      private static const TASK_ID:uint = 816;
      
      private static function bind(map:BaseMapProcess) : void
      {
         if(_map === map && _scene != null) return;
         if(_scene != null) _scene.dispose();
         _map = map;
         _scene = new StoryScene(map);
      }

      private static function isActive() : Boolean
      {
         return _scene != null && _scene.active;
      }

      private static function releaseScene() : void
      {
         if(_scene != null) _scene.releaseState();
      }

      public function Task816()
      {
         super();
      }
      
      public static function acceptTask() : void
      {
         goStep1();
      }
      
      public static function initTaskForMap4(param1:BaseMapProcess) : void
      {
         var owner:BaseMapProcess = param1;
         var map:BaseMapProcess = param1;
         bind(map);
         if(TasksManager.getTaskStatus(TASK_ID) != TasksManager.ALR_ACCEPT) return;
         TasksManager.getProStatusList(TASK_ID,function(progress:Array):void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            if(!progress[0]) goStep1();
         });
      }
      
      public static function initTaskForMap666(param1:BaseMapProcess) : void
      {
         var owner:BaseMapProcess = param1;
         var map:BaseMapProcess = param1;
         bind(map);
         _mcForMap666 = _map.conLevel["task_811_1"];
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               if(Boolean(param1[0]) && !param1[1])
               {
                  initExtask();
                  goStep2();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && !param1[2])
               {
                  initExtask();
                  goStep3();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && !param1[3])
               {
                  initExtask();
                  goStep4();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && !param1[4])
               {
                  initExtask();
                  goStep5();
               }
               else
               {
                  onTaskEnd();
               }
            });
         }
         else
         {
            onTaskEnd();
         }
      }
      
      private static function initExtask() : void
      {
         if(Boolean(_map.conLevel["ani_0"]) && Boolean(_map.conLevel["ani_1"]) && Boolean(_map.conLevel["ani_2"]))
         {
            _map.conLevel["ani_0"].visible = false;
            _map.conLevel["ani_1"].visible = false;
            _map.conLevel["ani_2"].visible = false;
         }
         var _loc1_:int = 0;
         while(_loc1_ < 4)
         {
            _map.conLevel["stone_" + _loc1_].visible = false;
            _loc1_++;
         }
         _mcForMap666.visible = false;
         _map.conLevel["task816tig"].visible = false;
         _map.conLevel["bloodMc"].visible = false;
      }
      
      private static function onTaskEnd() : void
      {
         var _loc1_:int = 0;
         while(_loc1_ < 4)
         {
            _map.conLevel["stone_" + _loc1_].visible = true;
            _loc1_++;
         }
         DisplayUtil.removeForParent(_mcForMap666);
         DisplayUtil.removeForParent(_map.conLevel["task816tig"]);
         DisplayUtil.removeForParent(_map.conLevel["bloodMc"]);
      }
      
      private static function initRule(movie:MovieClip, visible:Boolean = false, frame:uint = 1, showUsers:Boolean = true, showSelf:Boolean = true, showOgres:Boolean = true) : void
      {
         _scene.setScene(movie,visible,frame,showUsers,showSelf,showOgres);
      }

      public static function goStep1() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         NpcDialog.show(NPC.SHIPER,["小赛尔，听说这次与0xff0000珀伽索斯0xffffff的对抗中，你和神狐一族表现的非常出色！赛尔上最勇敢的战士非你莫属！"],["嘿嘿，船长，保护赛尔和精灵伙伴是我的使命！"],[function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.SEER,["不过听博士说这件事情应该和0xff0000千年前的上古圣战0xffffff有关，时隔这么久想要知道里面的内情，可就难上加难！"],["再次连线博士！"],[function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               if(!_app)
               {
                  _app = ModuleManager.getModule(ClientConfig.getAppModule("TaskIntro_816"),"正在连线……");
                  _app.setup();
                  _app.show();
               }
               else
               {
                  _app.show();
               }
            }]);
         }]);
      }
      
      public static function onVideoOver() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         NpcDialog.show(NPC.SEER,["船长，既然博士告诉我们这些线索，那就让我去Y星看看吧！毕竟事关整个宇宙的和平和精灵世界的安危，刻不容缓啊！"],["这个么，让我想想…"],[function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.SEER,["别想了船长，我已经不是曾经的赛尔了，现在我已经充满着斗志，我一定要弄清上古圣战的真相，0xff0000珀伽索斯0xffffff我一定要亲手消灭你！"],["前往Y星！"],[function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               TasksManager.complete(TASK_ID,0,function(param1:Boolean):void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  var b:* = param1;
                  if(Boolean(b))
                  {
                     AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_816_1"),function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        MapManager.changeMap(666);
                     });
                  }
               });
            }]);
         }]);
      }
      
      public static function goStep2() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         initRule(_mcForMap666,true,1,false);
         AnimateManager.playMcAnimate(_mcForMap666,1,"task_816_mc1",function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.PANDA,["你们走的这么快干嘛！我还没有祷告好呢！这次帮佐洛出头，还不知道会遇上什么高手呢！怕怕..怕怕…"],null,null,false,function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               NpcDialog.show(NPC.SEER,["哇！你们这是要去报仇啊！不行…不行，你快去告诉佐洛它们，冰狐当时是无意的，它现在已经改邪归正了！再说你们肯定不是它的对手！"],["冰狐？好酷的名字！啊…我怎么这么苦命啊！等等我…"],[function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  AnimateManager.playMcAnimate(_mcForMap666,2,"task_816_mc2",function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     NpcDialog.show(NPC.SEER,["哈哈！它们还是这么搞笑！还是办正事要紧，四大神兽应该就在附近，我该怎么找到他们呢？"],["让我先看看石像是不是有机关！"],[function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        _map.conLevel["task816tig"].visible = true;
                        CommonUI.addYellowArrow(_map.conLevel["task816tig"],0,0,300);
                        _map.conLevel["task816tig"].buttonMode = true;
                        _map.conLevel["task816tig"].addEventListener(MouseEvent.CLICK,onStoneClick);
                     }]);
                  });
               }]);
            });
         });
      }
      
      private static function onStoneClick(param1:MouseEvent) : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         var event:MouseEvent = param1;
         _scene.lockInput();
         MainManager.actorModel.moveAndAction(new Point(330,380),function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            _scene.unlockInput();
            CommonUI.removeYellowArrow(_map.conLevel["task816tig"]);
            _map.conLevel["task816tig"].buttonMode = false;
            _map.conLevel["task816tig"].removeEventListener(MouseEvent.CLICK,onStoneClick);
            NpcDialog.show(NPC.SEER,["嗯？好像不行嘛！这下可怎么办，紧急关头神兽也不给力，太让我失望了！"],["等等，难道神兽睡着了？"],[function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  _scene.hideActors();
               AnimateManager.playMcAnimate(_mcForMap666,3,"task_816_mc3",function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  NpcDialog.show(NPC.SEER,["可恶，还是没有反应，看来只有用武力了！哼哼！看你们什么时候出来！"],["点击底部准心，选择普通射击，再命中朱雀石像三次。"],[function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     _mcForMap666.gotoAndStop(4);
                     _scene.restoreActors();
                     var blood:MovieClip = _map.conLevel["bloodMc"];
                     blood.y = 130;
                     blood.visible = true;
                     blood.data = {"blood":3};
                     blood["perTxt"].text = "3/3";
                     blood["perMc"].gotoAndStop(1);
                     _map.conLevel["task816tig"].buttonMode = true;
                     _map.conLevel["task816tig"].addEventListener(MouseEvent.CLICK,onStoneSeconeClick);
                     AimatController.addEventListener(AimatEvent.PLAY_END,onShootStone);
                  }]);
               });
            }]);
         });
      }
      
      private static function onStoneSeconeClick(param1:MouseEvent) : void
      {
         if(!isActive()) return;
         NpcDialog.show(NPC.SEER,["可恶，还是没有反应，看来只有用武力了！哼哼！看你们什么时候出来！"],["点击底部准心，选择普通射击，再命中朱雀石像三次。"]);
      }
      
      private static function onShootStone(param1:AimatEvent) : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         var point:Point = null;
         var bloodMc:MovieClip = null;
         var event:AimatEvent = param1;
         if(event.info.userID != MainManager.actorID)
         {
            return;
         }
         point = event.info.endPos;
         if(Boolean(_map.conLevel["task816tig"].hitTestPoint(point.x,point.y)))
         {
            bloodMc = _map.conLevel["bloodMc"];
            bloodMc.visible = true;
            bloodMc.data["blood"] -= 1;
            bloodMc["perTxt"].text = bloodMc.data["blood"] + "/3";
            bloodMc["perMc"].gotoAndStop(uint(101 - 33 * bloodMc.data["blood"]));
            if(bloodMc.data["blood"] <= 0)
            {
               _map.conLevel["task816tig"].buttonMode = false;
               _map.conLevel["task816tig"].removeEventListener(MouseEvent.CLICK,onStoneSeconeClick);
               AimatController.removeEventListener(AimatEvent.PLAY_END,onShootStone);
               bloodMc.visible = false;
               _scene.hideActors();
               AnimateManager.playMcAnimate(_mcForMap666,4,"task_816_mc4",function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  MainManager.actorModel.x = 270;
                  MainManager.actorModel.y = 420;
                  _scene.restoreActors();
                  NpcDialog.show(NPC.ZHUQUE,["嗯？原来是赛尔…这么急召唤我有什么大事发生吗？"],["那个…珀伽索斯出现了！"],[function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     NpcDialog.show(NPC.ZHUQUE,["哎…它果然还是来了！当年的那段仇恨难道还没有放下吗？这次它的目的一定是来复仇！"],["复仇？？当年到底发什么事情啊！"],[function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        NpcDialog.show(NPC.ZHUQUE,["那是很久之前的事情了，记得当年…"],null,null,false,function():void
                        {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                           TasksManager.complete(TASK_ID,1,function(param1:Boolean):void
                           {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                              if(param1)
                              {
                                 goStep3();
                              }
                           });
                        });
                     }]);
                  }]);
               });
            }
         }
      }
      
      public static function goStep3() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         initRule(_mcForMap666,true,5,false);
         CartoonManager.play(ClientConfig.getFullMovie("cartoon/task_816"),function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.SEER,["神马！！0xff0000天马珀伽索斯0xffffff是你的朋友，那么为什么会变成现在这样呢？当年一定还发生了其他的事情！"],["恩，不错，也许这都是我一手造成的！"],[function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               NpcDialog.show(NPC.SEER,["是菲尼克斯你造成的？？我怎么越来越听不懂了！"],null,null,false,function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  NpcDialog.show(NPC.ZHUQUE,["事情要从选拔星际守护兽开始…当年的上古圣战其实是0xff0000青龙和珀伽索斯之间的战斗0xffffff，为的就是争夺卡兰星系守护兽的位置！"],["青龙也有份？？？"],[function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_816_3"),function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        NpcDialog.show(NPC.SEER,["原来…珀伽索斯原本是想争取成为卡兰星系的守护兽啊！怪不得遇见他的时候，他说的最多的就是想拿回原本属于他的东西！"],["所以，他这次一定又是想找青龙报仇！"],[function():void
                        {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                           NpcDialog.show(NPC.ZHUQUE,["我们一定要先找到青龙，这样才能集合我们四大神兽的力量抵抗天马，我相信现在的珀伽索斯一定比之前更强大！"],["但是去哪里找青龙呢？"],[function():void
                           {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                              NpcDialog.show(NPC.ZHUQUE,["青龙和白虎一定是去了神兽谷，在那里一定可以找到它们！"],["好，我现在就去！"],[function():void
                              {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                 AnimateManager.playMcAnimate(_mcForMap666,5,"task_816_mc5",function():void
                                 {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                    NpcDialog.show(NPC.ZHUQUE,["你们终于回来了，你们知道吗？珀伽索斯它回来了！！带着千年的仇恨回来了！"],["什么！这家伙又想干嘛！"],[function():void
                                    {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                       TasksManager.complete(TASK_ID,2,function(param1:Boolean):void
                                       {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                          if(param1)
                                          {
                                             goStep4();
                                          }
                                       });
                                    }]);
                                 });
                              }]);
                           }]);
                        }]);
                     });
                  }]);
               });
            }]);
         });
      }
      
      public static function goStep4() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         initRule(_mcForMap666,true,6,false);
         NpcDialog.show(NPC.ZHUQUE,["还记得当年它和青龙的那场战斗吗？这件事情只有他不知道真相，还以为我们串通好了故意设计它！"],null,null,false,function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.BAI_HU,["哼哼，这次看到它，我非好好教训它不可，朱雀你知道吗？我们在神兽谷的石像已经被打的粉碎了，一定是这家伙干的！"],["白虎，你先冷静一下！"],[function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               AnimateManager.playMcAnimate(_mcForMap666,6,"task_816_mc6",function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  NpcDialog.show(NPC.BAI_HU,["不行，这口气我咽不下！啊呜……."],["哎呀…快说啊！后来呢？真相是什么？"],[function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     NpcDialog.show(NPC.QINGLONG,["真相就是…当年珀伽索斯是被自己打败的！其实它的实力不容小视，它的确很强！"],["那次战斗我还记忆犹新…"],[function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_816_4"),function():void
                        {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                           _mcForMap666.gotoAndStop(7);
                           NpcDialog.show(NPC.QINGLONG,["事情就是这样的，对于天马珀伽索斯来说误以为是白虎和玄武在暗中帮忙！其实不然，因为它的超能力只能爆发一次，而且爆发的时候会产生副作用，损耗它大量的体能！"],["原来是这样啊！"],[function():void
                           {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                              NpcDialog.show(NPC.ZHUQUE,["是的！珀伽索斯每次耗尽能量都要重新恢复，其实它所说的七色能量只是一个传说而已！0xff0000它真正拥有的其实就是金、蓝、紫、红分别代表拥有了光、水、超能以及战斗的能量！0xffffff"],["哇！这么强大啊！"],[function():void
                              {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                 NpcDialog.show(NPC.XUANWU,["希望这次我们能解开它心中的仇恨，这件事也困扰了我们很久很久！"],null,null,false,function():void
                                 {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                    AnimateManager.playMcAnimate(_mcForMap666,7,"task_816_mc7",function():void
                                    {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                       TasksManager.complete(TASK_ID,3,function(param1:Boolean):void
                                       {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                          if(param1)
                                          {
                                             goStep5();
                                          }
                                       });
                                    });
                                 });
                              }]);
                           }]);
                        });
                     }]);
                  }]);
               });
            }]);
         });
      }
      
      public static function goStep5() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         initRule(_mcForMap666,true,8,false);
         NpcDialog.show(NPC.POJIASUOSI,["哼哼，终于找到你们了！很好，既然都在，我就一并解决了你们！"],["珀伽索斯你误会它们了！"],[function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.POJIASUOSI,["小东西，少废话，这里没你的事！当你面对你自己的仇人时，相信你心里只有一个念头，就是打倒他们！"],["别别…你先听它们说完啊！"],[function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  _scene.hideActors();
               AnimateManager.playMcAnimate(_mcForMap666,8,"task_816_mc8",function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  MainManager.actorModel.x = 300;
                  MainManager.actorModel.y = 420;
                  _scene.restoreActors();
                  NpcDialog.show(NPC.BAI_HU,["你这家伙到现在还不知悔改，看我怎么收拾你！"],["哈哈！不如你们四个一起上吧！"],[function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_816_5"),function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        _mcForMap666.gotoAndStop(9);
                        NpcDialog.show(NPC.ZHUQUE,["天马，既然你不想听我们说什么，那我们就定个时间吧！让你再和青龙对决一次，还是和上次一样，如果你赢了卡兰星系的星际守护兽就是你！"],null,null,false,function():void
                        {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                           NpcDialog.show(NPC.POJIASUOSI,["好，一言为定！如果我输了，从今往后再也不提关于星际守护兽的任何条件，0xff0000等我把最后一根冰之羽毛的力量收集后，就是你们的末日！0xffffff"],["一言为定"],[function():void
                           {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                              AnimateManager.playMcAnimate(_mcForMap666,9,"task_816_mc9",function():void
                              {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                 NpcDialog.show(NPC.ZHUQUE,["赛尔，回去告诉船长，这件事情由我们四大神兽负责，我想只有在对战中才能让珀伽索斯了解真相了！"],["恩恩，我这就告诉船长！"],[function():void
                                 {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                    AnimateManager.playMcAnimate(_mcForMap666,10,"task_816_mc10",function():void
                                    {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                       NpcDialog.show(NPC.SEER,["尊敬的朱雀，希望你们能感化珀伽索斯，因为它也有不得已的苦衷，0xff0000冰之羽毛0xffffff一定和冰系精灵有关，拯救计划再次开始！ "],["期待神兽与天马的真实较量！"],[function():void
                                       {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                          TasksManager.complete(TASK_ID,4,function(param1:Boolean):void
                                          {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                             if(param1)
                                             {
                                                onTaskEnd();
                                                MapManager.refMap();
                                             }
                                          });
                                       }]);
                                    });
                                 }]);
                              });
                           }]);
                        });
                     });
                  }]);
               });
            }]);
         }]);
      }
      
      public static function destroy(map:BaseMapProcess) : void
      {
         if(_map !== map) return;
         releaseScene();
         if(_scene != null) _scene.dispose();
         _scene = null;
         AimatController.removeEventListener(AimatEvent.PLAY_END,onShootStone);
         if(Boolean(_map))
         {
            if(Boolean(_map.conLevel["task816tig"]))
            {
               _map.conLevel["task816tig"].removeEventListener(MouseEvent.CLICK,onStoneClick);
               _map.conLevel["task816tig"].removeEventListener(MouseEvent.CLICK,onStoneSeconeClick);
            }
         }
         _mcForMap666 = null;
         _map = null;
         if(_app != null) _app.destroy();
         _app = null;
      }
   }
}

