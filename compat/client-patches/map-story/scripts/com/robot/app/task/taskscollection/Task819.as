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
   import com.robot.core.newloader.MCLoader;
   import com.robot.core.event.MCLoadEvent;
   import flash.display.Sprite;
   import flash.display.MovieClip;
   import flash.events.*;
   import flash.geom.*;
   import org.taomee.utils.*;
   import flash.display.DisplayObject;
   import org.taomee.manager.ResourceManager;
   
   public class Task819
   {
      private static var _scene:StoryScene;
      
      private static var _map:BaseMapProcess;
      
      private static var _mcForMap57:MovieClip;
      private static var _miniNPC57:Sprite;
      private static var _map57Loader:MCLoader;
      private static var _map57Loaded:Function;
      private static var _miluo57URL:String;
      private static var _miluo57Loaded:Function;
      
      
      private static var _mcForMap693:MovieClip;
      
      private static const TASK_ID:uint = 819;
      
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

      public function Task819()
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
      
      public static function initTaskForMap57(map:BaseMapProcess) : void
      {
         var owner:BaseMapProcess = map;
         bind(map);
         if(TasksManager.getTaskStatus(TASK_ID) != TasksManager.ALR_ACCEPT) return;
         TasksManager.getProStatusList(TASK_ID,function(progress:Array):void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner ||
               !progress[0] || progress[2] || _map57Loaded != null) return;
            // 保留57号早期龙族任务；抽取官方819剧情层，米洛尼使用当前236号模型。
            _map57Loader = new MCLoader(ClientConfig.getMapPath(81957));
            _map57Loaded = function(event:MCLoadEvent):void
            {
               if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               _map57Loader.removeEventListener(MCLoadEvent.SUCCESS,_map57Loaded);
               var root:MovieClip = event.getContent() as MovieClip;
               DisplayUtil.stopAllMovieClip(root);
               var depth:Sprite = root["depth_mc"] as Sprite;
               _miniNPC57 = new Sprite();
               _mcForMap57 = depth["task_819_1"] as MovieClip;
               _miniNPC57.x = 590;
               _miniNPC57.y = 435;
               _miniNPC57.mouseChildren = false;
               _mcForMap57.x += depth.x - owner.topLevel.x;
               _mcForMap57.y += depth.y - owner.topLevel.y;
               _mcForMap57.visible = false;
               owner.topLevel.addChild(_miniNPC57);
               owner.topLevel.addChild(_mcForMap57);
               var npc:Sprite = _miniNPC57;
               _miluo57URL = ClientConfig.getPetSwfPath(236);
               _miluo57Loaded = function(content:DisplayObject):void
               {
                  if(_map !== owner || _miniNPC57 !== npc) return;
                  DisplayUtil.stopAllMovieClip(content);
                  var bounds:Rectangle = content.getBounds(content);
                  var scale:Number = Math.min(90 / bounds.width,100 / bounds.height);
                  content.scaleX = content.scaleY = scale;
                  content.x = -(bounds.x + bounds.width / 2) * scale;
                  content.y = -bounds.bottom * scale;
                  npc.addChild(content);
               };
               ResourceManager.getResource(_miluo57URL,_miluo57Loaded,"pet");
               if(!progress[1])
               {
                  CommonUI.addYellowExcal(_miniNPC57,20,-110);
                  _miniNPC57.buttonMode = true;
                  _miniNPC57.addEventListener(MouseEvent.CLICK,goStep2);
               }
               else
               {
                  goStep3();
               }
            };
            _map57Loader.addEventListener(MCLoadEvent.SUCCESS,_map57Loaded);
            _map57Loader.doLoad();
         });
      }
      
      public static function initTaskForMap81951(map:BaseMapProcess) : void
      {
         var owner:BaseMapProcess = map;
         bind(map);
         if(TasksManager.getTaskStatus(TASK_ID) != TasksManager.ALR_ACCEPT) return;
         TasksManager.getProStatusList(TASK_ID,function(progress:Array):void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            if(progress[0] && progress[1] && progress[2] && !progress[3]) goStep4();
         });
      }
      
      public static function initTaskForMap693(param1:BaseMapProcess) : void
      {
         var owner:BaseMapProcess = param1;
         var map:BaseMapProcess = param1;
         bind(map);
         _mcForMap693 = _map.conLevel["task_819_3"];
         _mcForMap693.visible = false;
         _map.conLevel["pojiasuosiTig"].visible = false;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TASK_ID,function(param1:Array):void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && !param1[4])
               {
                  goStep5();
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && Boolean(param1[2]) && Boolean(param1[3]) && Boolean(param1[4]) && !param1[5])
               {
                  goStep6();
               }
               else
               {
                  DisplayUtil.removeForParent(_mcForMap693);
               }
            });
         }
         else
         {
            DisplayUtil.removeForParent(_mcForMap693);
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
         NpcDialog.show(NPC.SHIPER,[MainManager.actorInfo.formatNick + "你终于回来了！我还以为你被困Y星呢？回来就好…回来就好啊！"],["恩恩，事情是这样的！"],[function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            CartoonManager.play(ClientConfig.getFullMovie("cartoon/task_816"),function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               NpcDialog.show(NPC.SEER,["船长，我也只能长话短说了，朱雀还提到珀伽索斯的事情由它来解决！现在我想去0xff0000上古圣战0xffffff的现场0xff0000尼古尔星0xffffff勘察一下，说不定会发现新线索哦！等我好消息吧！船长…"],["向尼古尔星出发！！"],[function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_819_1"),function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     TasksManager.complete(TASK_ID,0,function(param1:Boolean):void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        if(param1)
                        {
                           MapManager.changeMap(57);
                        }
                     });
                  });
               }]);
            });
         }]);
      }
      
      public static function goStep2(param1:MouseEvent) : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         var event:MouseEvent = param1;
         MainManager.actorModel.moveAndAction(new Point(590,470),function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.MILUO,["尼古尔星有着很多秘密，这需要你一步一步去探寻……"],["仙境中的顶尖对决","哇哦！我的好奇心被激发了！"],[function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               step2Accept();
            }]);
         });
      }
      
      private static function step2Accept() : void
      {
         var owner:BaseMapProcess = _map;
         _miniNPC57.removeEventListener(MouseEvent.CLICK,goStep2);
         _miniNPC57.buttonMode = false;
         CommonUI.removeYellowExcal(_miniNPC57);
         initRule(_mcForMap57,false,1,false,true,false);
         NpcDialog.show(NPC.MILUO,["最近你有听说关于上古圣战的传言吗？这里可是当时决战的圣地啊！对于我来说这很是太荣幸了！"],["哇哦！难道你也是参与者？"],[function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.MILUO,["那是！！我们米洛尼一族在尼古尔星上已经生活了千百年了，那场圣战当然不会忘记！"],["太好了，快告诉我吧！"],[function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_819_2"),function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  NpcDialog.show(NPC.MILUO,["事情就是这样的，不过现在想想，那时候珀伽索斯从天上坠落是有点奇怪，好好的怎么会突然…其中一定是有什么原因的！"],["恩，你的描述果然和朱雀说的一样！"],[function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     NpcDialog.show(NPC.MILUO,["不过我听说自从上次珀伽索斯消失后就一直居住在一个神秘的地方，好像是叫0xff0000拉珀0xffffff什么，我也记不清楚了！那里可是仙境哦！"],["真的吗？这个线索太重要了！"],[function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        NpcDialog.show(NPC.MILUO,["别高兴的太早，珀伽索斯一定会带着当年的仇恨向四大守护神宣战，这次的对决可谓是0xff0000神与神之间的较量0xffffff！等等，我们好像被监视了…."],null,null,false,function():void
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
            }]);
         }]);
      }
      
      public static function goStep3() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         initRule(_mcForMap57,true,1,false,false,false);
         AnimateManager.playMcAnimate(_mcForMap57,1,"task_819_mc1",function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.SEER,["可恶的海盗，你为什么会出现在这里？？快说！！！"],["额…我也是奉命行事而已！"],[function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               NpcDialog.show(NPC.SEER,["那么，那两个蠢货一定也在附近咯！是不是啊！快说…你最好老实交代，免遭皮肉之苦！！哼哼！否则…."],["它..它们就在…"],[function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  AnimateManager.playMcAnimate(_mcForMap57,2,"task_819_mc2",function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     NpcDialog.show(NPC.MILUO,["混蛋，居然偷听我们说话！这次一定要让你们尝尝我狼牙锤的滋味！"],["哈哈！又有好戏看咯！"],[function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        _scene.restoreActors();
                        AnimateManager.playMcAnimate(_mcForMap57,3,"task_819_mc3",function():void
                        {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                           NpcDialog.show(NPC.MILUO,["哼哼，知道我的厉害了吧！放你们出来可以，不过你们要老实交代，别再惹我生气！"],null,null,false,function():void
                           {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                              AnimateManager.playMcAnimate(_mcForMap57,4,"task_819_mc4",function():void
                              {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                 NpcDialog.show(NPC.ZOG_20111027,["嘶….疼死我了！居然打海盗的屁股，你们胆子不小嘛！"],["佐格，你来这里干什么，快说！"],[function():void
                                 {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                    NpcDialog.show(NPC.ALLISON_20111027,["小子，居然敢如此无礼，告诉你吧！0xff0000天马珀伽索斯0xffffff一定会成为海盗的精灵，哈哈哈！"],["什么，你们居然想抓天马？"],[function():void
                                    {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                       NpcDialog.show(NPC.ZOG_20111027,["大哥，我们还是先走吧！先锋部队已经前往拉珀尔仙境了，估计现在已经将珀伽索斯降服了，你就望尘莫及吧！"],["海盗，你们的计谋一定不会得逞的！"],[function():void
                                       {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                          AnimateManager.playMcAnimate(_mcForMap57,5,"task_819_mc5",function():void
                                          {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                             NpcDialog.show(NPC.SEER,["不好，米洛尼！拉珀尔仙境里一定还有其他精灵，还有神兽，要是被海盗发现，那就不好了！我一定要去阻止海盗的计划！"],["立刻前往拉珀尔星！"],[function():void
                                             {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                                TasksManager.complete(TASK_ID,2,function(param1:Boolean):void
                                                {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                                   if(param1)
                                                   {
                                                      MapManager.changeMap(81951);
                                                   }
                                                });
                                             }]);
                                          });
                                       }]);
                                    }]);
                                 }]);
                              });
                           });
                        });
                     }]);
                  });
               }]);
            }]);
         });
      }
      
      // 旧515号已被当前客户端的新手地下室占用；岸边场景独立登记，不改新手流程。
      public static function goStep4() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         NpcDialog.show(NPC.BULU,["赛尔，你终于来了，前面我发现四大神兽路过这里，随后还出现了很多海盗，它们也进入了拉珀尔仙境，可能是去抓珀伽索斯的！"],["可恶，我一定要去阻止它们！","先观察一下岸边"],[function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.BULU,["恩恩，我也去！你等等啊！你这样是去不了拉珀尔仙境的！不过我有办法的！岸边的叶舟可以带我们穿过水面！"],["太好了，还是布鲁聪明！"],[function():void
            {
               if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               TasksManager.complete(TASK_ID,3,function(success:Boolean):void
               {
                  if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner || !success) return;
                  NpcDialog.show(NPC.SEER,["哇！这样我们就能进入拉珀尔仙境了！叶舟就在岸边，准备好后点击它出发吧。"],["我知道了！"]);
               });
            }]);
         }]);
      }
      
      public static function goStep5() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         initRule(_mcForMap693,true,1,false);
         _map.conLevel["pojiasuosiTig"].visible = true;
         NpcDialog.show(NPC.BULU,["赛尔，这里就是拉珀尔仙境，漂亮吧！呵呵！"],["哇哦！好漂亮啊！"],[function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.SEER,["原来这里就是天马珀伽索斯生活的地方，果然是仙境，快看那些美丽的花朵，里面好像有什么东西？？"],["让我去看看里面是什么！"],[function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               CommonUI.addYellowArrow(_map.conLevel["pojiasuosiTig"],0,0,300);
               _map.conLevel["pojiasuosiTig"].buttonMode = true;
               _map.conLevel["pojiasuosiTig"].addEventListener(MouseEvent.CLICK,onFlowerClick);
            }]);
         }]);
      }
      
      private static function onFlowerClick(param1:MouseEvent) : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         var event:MouseEvent = param1;
         MainManager.actorModel.moveAndAction(new Point(400,320),function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            CommonUI.removeYellowArrow(_map.conLevel["pojiasuosiTig"]);
            _map.conLevel["pojiasuosiTig"].visible = false;
            _map.conLevel["pojiasuosiTig"].buttonMode = false;
            _map.conLevel["pojiasuosiTig"].removeEventListener(MouseEvent.CLICK,onFlowerClick);
            AnimateManager.playMcAnimate(_mcForMap693,1,"task_819_mc1",function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               NpcDialog.show(NPC.POJIASUOSI,["小子，你竟然敢闯入我的仙境，难道就不怕粉身碎骨吗？以前的那些小喽喽难道是你的同伴？"],["不不，才不是呢！我是来保护你的！"],[function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  AnimateManager.playMcAnimate(_mcForMap693,2,"task_819_mc2",function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     NpcDialog.show(NPC.POJIASUOSI,["笑话！四大神兽我都不放在眼里，我怎么会需要你的保护，马上离开这里，否则…"],["你误会了天马，上古圣战也不是你所想的那样！"],[function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        _scene.hideActors();
                        AnimateManager.playMcAnimate(_mcForMap693,3,"task_819_mc3",function():void
                        {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                           _scene.restoreActors();
                           NpcDialog.show(NPC.BAI_HU,["天马，我们的约定也该到时间了吧！那么今天就来个了断吧！"],["等等，白虎！"],[function():void
                           {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                              NpcDialog.show(NPC.QINGLONG,["珀伽索斯要找的对手是我，上次那场战斗还没有真正结束，你不要插手！我很想领教它的终极力量！"],null,null,false,function():void
                              {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                 NpcDialog.show(NPC.ZHUQUE,["我履行当初的约定，不过珀伽索斯这次你可看清楚了，我们四个现在都在这里，没有人会暗算你的！如果你改变现在的想法，我…"],["少废话，开战吧！"],[function():void
                                 {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                    AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_819_3"),function():void
                                    {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                       _mcForMap693.gotoAndStop(4);
                                       NpcDialog.show(NPC.POJIASUOSI,["为什么会这样！难道这就是我最终的力量吗？可恶….."],null,null,false,function():void
                                       {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                          NpcDialog.show(NPC.ZHUQUE,["天马，你清醒点吧！没有人质疑过你的实力和你的强大，但是一旦你激发自己的潜能达到一定程度，就会对自己造成伤害！"],["这是为什么？？？"],[function():void
                                          {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                             NpcDialog.show(NPC.POJIASUOSI,["但是，之前我所做的一切…为什么我是最后一个知道的，为什么！！"],["我当初没告诉你真相，就是不忍心伤害你！所以…."],[function():void
                                             {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                                TasksManager.complete(TASK_ID,4,function(param1:Boolean):void
                                                {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                                   if(param1)
                                                   {
                                                      goStep6();
                                                   }
                                                });
                                             }]);
                                          }]);
                                       });
                                    });
                                 }]);
                              });
                           }]);
                        });
                     }]);
                  });
               }]);
            });
         });
      }
      
      public static function goStep6() : void
      {
         if(!isActive()) return;
         var owner:BaseMapProcess = _map;
         initRule(_mcForMap693,true,4,false);
         AnimateManager.playMcAnimate(_mcForMap693,4,"task_819_mc4",function():void
         {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
            NpcDialog.show(NPC.ZOG_20111027,["哼！别以为这样就结束了，噩梦才刚刚开始，精灵吸收仪器虽然坏了，但是里面的元素会形成巨大的死黑能量圈，你们就等死吧！啊哈哈！"],null,null,false,function():void
            {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
               NpcDialog.show(NPC.POJIASUOSI,["不行，我只有这一次机会了！之前我所做的一切，已经无法弥补了，那就用我的生命来补偿你们吧！"],["等等，天马！"],[function():void
               {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                  AnimateManager.playMcAnimate(_mcForMap693,5,"task_819_mc5",function():void
                  {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                     NpcDialog.show(NPC.ZHUQUE,["不好，天马用自己的身躯拯救了我们，不过我想它应该也受了很重的伤，对了，我们快去寻找四色羽毛吧！说不定那些羽毛能够治愈它！"],null,null,false,function():void
                     {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                        NpcDialog.show(NPC.SEER,["恩，我们一定可以找到四色羽毛的，珀伽索斯你会慢慢好起来的！0xff0000大家出发一起寻找四色羽毛吧！0xffffff"],null,null,false,function():void
                        {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                           AnimateManager.playMcAnimate(_mcForMap693,6,"task_819_mc6",function():void
                           {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                              TasksManager.complete(TASK_ID,5,function(param1:Boolean):void
                              {
            if(_map !== owner || MapProcessConfig.currentProcessInstance !== owner) return;
                                 if(param1)
                                 {
                                    DisplayUtil.removeForParent(_mcForMap693);
                                    releaseScene();
                                    MapManager.refMap();
                                 }
                              });
                           });
                        });
                     });
                  });
               }]);
            });
         });
      }
      
      public static function destroy(map:BaseMapProcess) : void
      {
         if(_map !== map) return;
         releaseScene();
         if(_scene != null) _scene.dispose();
         _scene = null;
         if(_map57Loader != null)
         {
            _map57Loader.removeEventListener(MCLoadEvent.SUCCESS,_map57Loaded);
            _map57Loader.clear();
            _map57Loader = null;
         }
         _map57Loaded = null;
         if(_miluo57Loaded != null) ResourceManager.cancel(_miluo57URL,_miluo57Loaded);
         _miluo57Loaded = null;
         _miluo57URL = null;
         if(_miniNPC57 != null)
         {
            _miniNPC57.removeEventListener(MouseEvent.CLICK,goStep2);
            CommonUI.removeYellowExcal(_miniNPC57);
            DisplayUtil.removeForParent(_miniNPC57);
         }
         _miniNPC57 = null;
         DisplayUtil.removeForParent(_mcForMap57);
         if(Boolean(_map))
         {
            if(Boolean(_map.conLevel["pojiasuosiTig"]))
            {
               _map.conLevel["pojiasuosiTig"].removeEventListener(MouseEvent.CLICK,onFlowerClick);
            }
         }
         _mcForMap57 = null;
         _mcForMap693 = null;
         _map = null;
      }
   }
}

