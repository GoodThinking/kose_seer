package com.robot.app.task.taskscollection
{
   import com.robot.app.ogre.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.map.config.MapProcessConfig;
   import com.robot.core.npc.*;
   import com.robot.core.utils.*;
   import flash.display.MovieClip;
   import flash.events.*;
   import flash.geom.*;
   import org.taomee.utils.*;
   
   public class Task811
   {
      private static var _scene:StoryScene;
      private static var _sptSaved:Boolean;
      private static var _sptWasVisible:Boolean;
      
      private static var _mcForMap426:MovieClip;
      
      private static var _mcForMap687:MovieClip;
      
      private static var _mcForMap684:MovieClip;
      
      private static var _mcForMap685:MovieClip;
      
      private static var _mcForMap686:MovieClip;
      
      private static var _map:BaseMapProcess;
      
      private static const TASK_ID:uint = 811;
      
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
         if(_sptSaved && _map != null && _map.conLevel["sptAnyebinghu"])
            _map.conLevel["sptAnyebinghu"].visible = _sptWasVisible;
         _sptSaved = false;
      }

      public function Task811()
      {
         super();
      }
      
      public static function acceptTask() : void
      {
         goStep1();
      }
      
      public static function initTaskForMap5(param1:BaseMapProcess) : void
      {
         var owner:BaseMapProcess = param1;
         var map:BaseMapProcess = param1;
         bind(map);
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               if(!param1[0])
               {
                  goStep1();
               }
            });
         }
      }
      
      public static function initTaskForMap426(param1:BaseMapProcess) : void
      {
         var owner:BaseMapProcess = param1;
         var map:BaseMapProcess = param1;
         bind(map);
         _mcForMap426 = _map.animatorLevel["task_811_2"];
         _mcForMap426.visible = false;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               if(Boolean(param1[0]) && !param1[1])
               {
                  goStep2();
               }
               else
               {
                  DisplayUtil.removeForParent(_mcForMap426);
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_mcForMap426);
         }
      }
      
      public static function initTaskForMap687(param1:BaseMapProcess) : void
      {
         var owner:BaseMapProcess = param1;
         var map:BaseMapProcess = param1;
         bind(map);
         _mcForMap687 = _map.animatorLevel["task_811_3"];
         _mcForMap687.visible = false;
         _map.conLevel["dragonTig"].mouseEnabled = false;
         _map.conLevel["dragonTig"].mouseChildren = false;
         _map.conLevel["beierTig"].mouseEnabled = false;
         _map.conLevel["beierTig"].mouseChildren = false;
         _map.conLevel["baobeiliTig"].mouseEnabled = false;
         _map.conLevel["baobeiliTig"].mouseChildren = false;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               if(Boolean(param1[0]) && Boolean(param1[1]) && !param1[2])
               {
                  goStep3();
               }
               else
               {
                  DisplayUtil.removeForParent(_mcForMap687);
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_mcForMap687);
         }
      }
      
      public static function initTaskForMap684(param1:BaseMapProcess) : void
      {
         var owner:BaseMapProcess = param1;
         var map:BaseMapProcess = param1;
         bind(map);
         _mcForMap684 = _map.animatorLevel["task_811_4"];
         _mcForMap684.visible = false;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && !param1[3])
               {
                  goStep4();
               }
               else
               {
                  DisplayUtil.removeForParent(_mcForMap684);
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_mcForMap684);
         }
      }
      
      public static function initTaskForMap685(param1:BaseMapProcess) : void
      {
         var owner:BaseMapProcess = param1;
         var map:BaseMapProcess = param1;
         bind(map);
         _mcForMap685 = _map.animatorLevel["task_811_5"];
         _mcForMap685.visible = false;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && !param1[4])
               {
                  goStep5();
               }
               else
               {
                  DisplayUtil.removeForParent(_mcForMap685);
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_mcForMap685);
         }
      }
      
      public static function initTaskForMap686(param1:BaseMapProcess) : void
      {
         var owner:BaseMapProcess = param1;
         var map:BaseMapProcess = param1;
         bind(map);
         _mcForMap686 = _map.animatorLevel["task_811_6"];
         _mcForMap686.visible = false;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && Boolean(param1[4]) && !param1[5])
               {
                  if(!_sptSaved)
                  {
                     _sptWasVisible = _map.conLevel["sptAnyebinghu"].visible;
                     _sptSaved = true;
                  }
                  _map.conLevel["sptAnyebinghu"].visible = false;
                  goStep6();
               }
               else
               {
                  DisplayUtil.removeForParent(_mcForMap686);
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_mcForMap686);
         }
      }
      
      private static function initRule(movie:MovieClip, visible:Boolean = false, frame:uint = 1, showUsers:Boolean = true, showSelf:Boolean = true, showOgres:Boolean = true) : void
      {
         _scene.setScene(movie,visible,frame,showUsers,showSelf,showOgres);
      }

      public static function goStep1() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         NpcDialog.show(NPC.SEER,["博士博士，冰狐的伤势怎么样了啊！有没有好转呢？"],["放心吧！有我在它不会有事的！"],[function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_811_1"),function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               NpcDialog.show(NPC.DOCTOR,["哎呀呀呀…这下摔的可真疼啊！可怜的小家伙，快来博士这边吧！"],["哈哈！冰狐太可爱啦！"],[function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  NpcDialog.show(NPC.BINGHU,["我才不要呢！博士你的包扎技术太不专业了！哎…不知道火狐现在怎么样了！"],null,null,false,function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     NpcDialog.show(NPC.SEER,["派特博士，这次我来的目的是想了解珀伽索斯的事情，你一定知道关于它的故事吧！"],["这个么…先和我回秘密基地吧！"],[function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        TasksManager.complete(TASK_ID,0,function(param1:Boolean):void
                        {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                           if(param1)
                           {
                              MapManager.changeMap(426);
                           }
                        });
                     }]);
                  });
               }]);
            });
         }]);
      }
      
      public static function goStep2() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         initRule(_mcForMap426,true,1,false,false);
         NpcDialog.show(NPC.DOCTOR,["赛尔，关于珀伽索斯故事说来话长，不过我在精灵资料里找到了关于它的记载，据说它曾经和四大神兽有着千丝万缕的联系！"],["对哦！我好像听它提起过！"],[function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            AnimateManager.playMcAnimate(_mcForMap426,1,"task_811_mc1",function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               NpcDialog.show(NPC.SEER,["哇…这不是博士收藏多年的0xff0000宇宙精灵宝典0xffffff嘛！这..现在就在我面前，简直太激动了！"],null,null,false,function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  NpcDialog.show(NPC.DOCTOR,["呵呵！当你看完关于珀伽索斯的相关资料，你一定会觉得它很强大，而且不是一般的强大！"],["真的吗？我这就开始阅读！"],[function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_811_2"),function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        ModuleManager.showModule(ClientConfig.getAppModule("TaskCartoon"),"正在打开面板....");
                     },false);
                  }]);
               });
            });
         }]);
      }
      
      public static function cartoonOver() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         _mcForMap426.gotoAndStop(2);
         NpcDialog.show(NPC.SEER,["哇！博士，原来珀伽索斯这么强大啊！看来已经没有人能阻止它的一举一动了！"],["这个么，也不一定！"],[function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.DOCTOR,["每当灾难降临的时候，总会有一两个伸张正义的“救世主”会出现的，我已经感觉到它们的存在！"],["如果是真的就好了！"],[function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               AnimateManager.playMcAnimate(_mcForMap426,2,"task_811_mc2",function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  NpcDialog.show(NPC.DOCTOR,["不好！泰若星又有新情况了！那里可是鱼龙王守护的海之神殿啊！必须马上动身，否则就晚了！ "],["恩，博士放心吧！我现在就去！"],[function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     TasksManager.complete(TASK_ID,1,function(param1:Boolean):void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        if(param1)
                        {
                           MapManager.changeMap(687);
                        }
                     });
                  }]);
               });
            }]);
         }]);
      }
      
      public static function goStep3() : void
      {
         if(!isActive()) return;
         initRule(_mcForMap687,true,1);
         _map.conLevel["dragonTig"].buttonMode = true;
         _map.conLevel["dragonTig"].mouseEnabled = true;
         _map.conLevel["dragonTig"].addEventListener(MouseEvent.CLICK,talkWithDragon);
      }
      
      private static function talkWithDragon(param1:MouseEvent) : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         var event:MouseEvent = param1;
         _scene.lockInput();
         MainManager.actorModel.moveAndAction(new Point(600,400),function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            _scene.unlockInput();
            _map.conLevel["dragonTig"].buttonMode = false;
            _map.conLevel["dragonTig"].removeEventListener(MouseEvent.CLICK,talkWithDragon);
            _map.conLevel["dragonTig"].mouseEnabled = false;
            _mcForMap687.gotoAndStop(2);
            ToolBarController.showOrHideAllUser(false);
            NpcDialog.show(NPC.SEER,["鱼龙王，你没事吧！怎么会这样，是谁这么心狠手辣！"],null,null,false,function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               NpcDialog.show(NPC.YULONGWANG,["赛尔，你…你终于来了…珀伽索斯这家伙刚刚偷袭了神殿，还好我及时发现否则，海之神殿一定会被他毁了！我…"],["鱼龙王…这家伙太可恶啦！"],[function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  AnimateManager.playMcAnimate(_mcForMap687,2,"task_812_mc2",function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     NpcDialog.show(NPC.SEER,["看来我也要出份力才行，去附近找找有什么线索！"],["点击附近的贝壳！"],[function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        CommonUI.addYellowArrow(_map.conLevel["beierTig"],0,0,300);
                        _map.conLevel["beierTig"].buttonMode = true;
                        _map.conLevel["beierTig"].mouseEnabled = true;
                        _map.conLevel["beierTig"].addEventListener(MouseEvent.CLICK,onBeierClick);
                     }]);
                  });
               }]);
            });
         });
      }
      
      private static function onBeierClick(param1:MouseEvent) : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         var event:MouseEvent = param1;
         _scene.lockInput();
         MainManager.actorModel.moveAndAction(new Point(550,450),function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            _scene.unlockInput();
            CommonUI.removeYellowArrow(_map.conLevel["beierTig"]);
            _map.conLevel["beierTig"].buttonMode = false;
            _map.conLevel["beierTig"].removeEventListener(MouseEvent.CLICK,onBeierClick);
            _map.conLevel["beierTig"].mouseEnabled = false;
            AnimateManager.playMcAnimate(_mcForMap687,3,"task_812_mc3",function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               NpcDialog.show(NPC.SEER,["额..对不起，我不是故意的嘛！我正在寻找海之子的下落！"],["再去附近找找！"],[function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  CommonUI.addYellowArrow(_map.conLevel["baobeiliTig"],0,0,300);
                  _map.conLevel["baobeiliTig"].buttonMode = true;
                  _map.conLevel["baobeiliTig"].mouseEnabled = true;
                  _map.conLevel["baobeiliTig"].addEventListener(MouseEvent.CLICK,onBaobeiliClick);
               }]);
            });
         });
      }
      
      private static function onBaobeiliClick(param1:MouseEvent) : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         var event:MouseEvent = param1;
         _scene.lockInput();
         MainManager.actorModel.moveAndAction(new Point(200,425),function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            _scene.unlockInput();
            CommonUI.removeYellowArrow(_map.conLevel["baobeiliTig"]);
            _map.conLevel["baobeiliTig"].buttonMode = false;
            _map.conLevel["baobeiliTig"].removeEventListener(MouseEvent.CLICK,onBaobeiliClick);
            _map.conLevel["baobeiliTig"].mouseEnabled = false;
            _scene.hideActors();
            AnimateManager.playMcAnimate(_mcForMap687,4,"task_812_mc4",function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               _scene.restoreActors();
               _mcForMap687.gotoAndStop(5);
               NpcDialog.show(NPC.SEER,["呵呵！宝贝鲤真是太可爱了！奇怪了，海之子去哪里了呢？"],null,null,false,function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  AnimateManager.playMcAnimate(_mcForMap687,5,"task_812_mc5",function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     NpcDialog.show(NPC.SEER,["嗯？什么声音，难道鱼龙王醒了？"],["过去看看怎么回事！"],[function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        CommonUI.addYellowArrow(_map.conLevel["dragonTig"],0,0,300);
                        _map.conLevel["dragonTig"].buttonMode = true;
                        _map.conLevel["dragonTig"].mouseEnabled = true;
                        _map.conLevel["dragonTig"].addEventListener(MouseEvent.CLICK,onDragonClick);
                     }]);
                  });
               });
            });
         });
      }
      
      private static function onDragonClick(param1:MouseEvent) : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         var event:MouseEvent = param1;
         CommonUI.removeYellowArrow(_map.conLevel["dragonTig"]);
         _map.conLevel["dragonTig"].buttonMode = false;
         _map.conLevel["dragonTig"].removeEventListener(MouseEvent.CLICK,onDragonClick);
         _map.conLevel["dragonTig"].mouseEnabled = false;
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_811_3"),function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            _mcForMap687.gotoAndStop(6);
            NpcDialog.show(NPC.YULONGWANG,["多谢陛下，鱼龙王一族誓死守卫海之神殿，保证海洋安全！"],null,null,false,function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               NpcDialog.show(NPC.SEER,["哇！果然是海之子，相信鱼龙王一族已经化险为夷了！但是泰若星上一定还有其他精灵正遭受着危机，是该我出场的时候了！"],["返回陆地！"],[function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  TasksManager.complete(TASK_ID,2,function(param1:Boolean):void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     if(param1)
                     {
                        MapManager.changeMap(684);
                     }
                  });
               }]);
            });
         });
      }
      
      public static function goStep4() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         initRule(_mcForMap684,true,1,false);
         AnimateManager.playMcAnimate(_mcForMap684,1,"task_811_mc1",function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.SOLIDMAN,["赛尔，快看，瀑布后面有情况，会不会是0xff0000珀伽索斯0xffffff啊！"],["管他什么斯的，我这就去解决它！"],[function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               NpcDialog.show(NPC.SOLIDMAN,["你小心啊！我这就叫援兵去，千万别轻举妄动哦！"],["哼哼！四色羽毛的怪物，你给我等着！"],[function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  AnimateManager.playMcAnimate(_mcForMap684,2,"task_811_mc2",function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     TasksManager.complete(TASK_ID,3,function(param1:Boolean):void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        if(param1)
                        {
                           CommonUI.addYellowArrow(_map.conLevel["door_1"],0,0,300);
                           NpcDialog.show(NPC.SEER,["冰封洞窟在上层河岸。先乘岸边的小木舟过去，再进入洞窟寻找火狐。"],["我知道了，先去乘船！"]);
                        }
                     });
                  });
               }]);
            }]);
         });
      }
      
      public static function goStep5() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         initRule(_mcForMap685,true,1,false);
         NpcDialog.show(NPC.SEER,["哇！四尾火狐，它在干什么啊！是在修炼吗？"],["先去问问它！"],[function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.SEER,["火狐？你在这里做什么啊！这么冷的冰窟不适合你，再说伤还没好呢？"],null,null,false,function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               NpcDialog.show(NPC.SIWEIYAOHU,["我一定要不断超越自己，否则就算我和冰狐联手都不是0xff0000珀伽索斯0xffffff的对手！"],["但是…."],[function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  AnimateManager.playMcAnimate(_mcForMap685,2,"task_812_mc2",function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     NpcDialog.show(NPC.SEER,["冰…冰狐你怎么来了，你不是在实验室接受博士的治疗吗？哎呀，快回去啦！"],["我已经好的差不多了！"],[function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        NpcDialog.show(NPC.BINGHU,["这点小伤不算什么，感觉自己已经恢复的差不多了！再说，我可不能输给火狐啊！是吧！好兄弟！"],null,null,false,function():void
                        {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                           NpcDialog.show(NPC.SIWEIYAOHU,["当然啦！好兄弟，让我们联手一起解决0xff0000珀伽索斯0xffffff吧！兄弟齐心…后半句是？"],["当然是其力断金咯！"],[function():void
                           {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                              AnimateManager.playMcAnimate(_mcForMap685,3,"task_812_mc3",function():void
                              {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                 TasksManager.complete(TASK_ID,4,function(param1:Boolean):void
                                 {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                    if(param1)
                                    {
                                       MapManager.changeMap(686);
                                    }
                                 });
                              });
                           }]);
                        });
                     }]);
                  });
               }]);
            });
         }]);
      }
      
      // 当前匹配客户端缺少本阶段控制代码；保留五段原生动画，补写项目版结尾与完成回调。
      public static function goStep6() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         initRule(_mcForMap686,true,1,false,false);
         AnimateManager.playMcAnimate(_mcForMap686,1,"task_812_mc1",function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.POJIASUOSI,["又是你们！我只想取回原本属于自己的力量，谁也别想阻止我！"],["可是你的力量已经伤害了无辜的精灵！"],[function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               AnimateManager.playMcAnimate(_mcForMap686,2,"task_812_mc2",function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  NpcDialog.show(NPC.SIWEIYAOHU,["冰狐，赛尔，这一次让我站在前面。守护伙伴，就是我不断变强的理由！"],["火狐，我们和你在一起！"],[function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     AnimateManager.playMcAnimate(_mcForMap686,3,"task_812_mc3",function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        NpcDialog.show(NPC.SEER,["这是……九尾的力量！火狐，你做到了！但是别勉强自己，我们一起守住这片土地！"],["伙伴的力量不会轻易熄灭！"],[function():void
                        {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                           AnimateManager.playMcAnimate(_mcForMap686,4,"task_812_mc4",function():void
                           {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                              NpcDialog.show(NPC.POJIASUOSI,["神狐一族的力量，我记住了。下一次，我会带着更强的力量回来！"],["我们不会再让无辜的精灵受伤！"],[function():void
                              {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                 AnimateManager.playMcAnimate(_mcForMap686,5,"task_812_mc5",function():void
                                 {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                    _scene.restoreActors();
                                    NpcDialog.show(NPC.BINGHU,["火狐，先休息一下吧。我会留下来守护泰若星，不会再让过去的错误重演。这根紫色羽毛和火之果，请带回去交给博士研究。"],["我会把这里的事情告诉博士和船长。"],[function():void
                                    {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                       TasksManager.complete(TASK_ID,5,function(success:Boolean):void
                                       {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                          if(!success) return;
                                          DisplayUtil.removeForParent(_mcForMap686);
                                          releaseScene();
                                          NpcDialog.show(NPC.SEER,["九尾的力量让泰若星暂时恢复了平静。回船长室，把珀伽索斯的线索报告给罗杰船长吧！"],["前往船长室","留在神兽谷"],[function():void
                                          {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                             MapManager.changeMap(4);
                                          }]);
                                       });
                                    }]);
                                 });
                              }]);
                           });
                        }]);
                     });
                  }]);
               });
            }]);
         });
      }
      
      public static function destroy(map:BaseMapProcess) : void
      {
         if(_map !== map) return;
         releaseScene();
         if(_scene != null) _scene.dispose();
         _scene = null;
         if(Boolean(_map))
         {
            if(Boolean(_map.conLevel["dragonTig"]))
            {
               _map.conLevel["dragonTig"].removeEventListener(MouseEvent.CLICK,talkWithDragon);
               _map.conLevel["dragonTig"].removeEventListener(MouseEvent.CLICK,onDragonClick);
            }
            if(Boolean(_map.conLevel["beierTig"]))
            {
               _map.conLevel["beierTig"].removeEventListener(MouseEvent.CLICK,onBeierClick);
            }
            if(Boolean(_map.conLevel["baobeiliTig"]))
            {
               _map.conLevel["baobeiliTig"].removeEventListener(MouseEvent.CLICK,onBaobeiliClick);
            }
         }
         _mcForMap426 = null;
         _mcForMap684 = null;
         _mcForMap685 = null;
         _mcForMap686 = null;
         _mcForMap687 = null;
         _map = null;
      }
   }
}

