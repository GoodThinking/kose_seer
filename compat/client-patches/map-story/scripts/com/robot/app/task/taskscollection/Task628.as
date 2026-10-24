package com.robot.app.task.taskscollection
{
   import com.robot.app.fight.*;
   import com.robot.app.task.control.*;
   import com.robot.app.task.petstory.util.KTool;
   import com.robot.app.toolBar.*;
   import com.robot.core.aimat.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.info.fightInfo.attack.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.MapLibManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.npc.*;
   import com.robot.core.ui.alert.*;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.*;
   import flash.utils.*;
   import org.taomee.debug.*;
   import org.taomee.effect.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class Task628 extends ITask
   {
      
      private static var _map:BaseMapProcess;
      
      private static var MonsterArr:Array;
      
      private static var seerDied:Boolean;
      
      private static var nTime:uint = 0;
      
      private static var fightOver:Boolean = false;
      
      public function Task628()
      {
         super();
      }
      
      public static function initTaskForMap497(param1:BaseMapProcess) : void
      {
         var ret:uint = 0;
         var mc2:MovieClip = null;
         var mc1:MovieClip = null;
         mc2 = null;
         var map:BaseMapProcess = param1;
         _map = map;
         seerDied = false;
         mc1 = _map.conLevel["allisonHit"];
         mc2 = _map.conLevel["zogHit"];
         mc1.mouseChildren = mc2.mouseChildren = false;
         mc1.mouseEnabled = mc2.mouseEnabled = false;
         ret = uint(TasksManager.getTaskStatus(628));
         if(ret == TasksManager.UN_ACCEPT)
         {
            DisplayUtil.removeForParent(mc1);
            DisplayUtil.removeForParent(mc2);
            DisplayUtil.removeForParent(_map.animatorLevel["pirate"]);
         }
         else
         {
            if(ret == TasksManager.COMPLETE)
            {
               DisplayUtil.removeForParent(mc1);
               DisplayUtil.removeForParent(mc2);
               _map.animatorLevel["pirate"].gotoAndStop(5);
               return;
            }
            ToolBarController.showOrHideAllUser(false);
            TasksManager.getProStatusList(TaskController_628.TASK_ID,function(param1:Array):void
            {
               if(!param1[0])
               {
                  gotoStep1();
               }
               else if(Boolean(param1[0]) && !param1[1])
               {
                  if(!fightOver)
                  {
                     gotoStep2();
                  }
                  else
                  {
                     onFightClose();
                  }
               }
            });
         }
      }
      
      private static function gotoStep1() : void
      {
         var pirateMc:MovieClip = null;
         var mc:MovieClip = null;
         var pirateArr:Array = null;
         pirateMc = null;
         mc = null;
         pirateArr = null;
         pirateMc = _map.animatorLevel["pirate"]["pirate1Mc"];
         pirateArr = new Array();
         pirateArr.push(pirateMc["pirate1Mc"],pirateMc["pirate2Mc"],pirateMc["pirate3Mc"],pirateMc["pirate4Mc"],pirateMc["pirate5Mc"]);
         NpcDialog.show(NPC.SEER,["你……你们在干吗！可恶贪婪的家伙！！快住手！！！！卡茨到底在哪里？"],null,null,false,function():void
         {
            NpcDialog.show(NPC.PIRATE_2,["哇哈哈哈！自不量力！兄弟们！冲啊！干掉他我们就能去美利图大人那里邀功了！"],["(小心！快使用头部射击！)"],[function():void
            {
               pirateArr[0].addEventListener("playover",function(param1:Event):void
               {
                  var _loc3_:* = undefined;
                  var _loc4_:* = undefined;
                  var _loc5_:* = undefined;
                  pirateArr[0].removeEventListener("playover",arguments.callee);
                  for each(mc in pirateArr)
                  {
                     mc.visible = false;
                  }
                  MonsterArr = new Array();
                  _loc4_ = 1;
                  while(_loc4_ <= 5)
                  {
                     _loc5_ = new OgreModel(_loc4_);
                     _loc5_.name = "ogre" + _loc4_;
                     _loc5_.isPurseFlag = true;
                     _loc3_ = MapLibManager.getMovieClip("bloodMc");
                     _loc5_.sprite.addChild(_loc3_);
                     _loc3_.x -= 30;
                     _loc3_.y -= _loc5_.height + 35;
                     _loc3_.name = "bloodMc";
                     _loc3_.data = {"blood":10};
                     _loc3_["perTxt"].text = _loc3_.data["blood"] + "/" + _loc3_.data["blood"];
                     mc = pirateArr[_loc4_ - 1];
                     _loc5_.show(5020,pirateMc.localToGlobal(new Point(mc.x - 10,mc.y + _loc5_.height + _loc3_.height - 5)));
                     MonsterArr.push(_loc5_);
                     _loc4_++;
                  }
                  pirateArr.length = 0;
                  DisplayUtil.removeForParent(pirateMc);
                  _loc3_ = MapLibManager.getMovieClip("bloodMc");
                  _loc3_.x -= 30;
                  _loc3_.y -= MainManager.actorModel.height;
                  _loc3_.name = "bloodMc";
                  _loc3_.data = {"blood":50};
                  _loc3_["perTxt"].text = _loc3_.data["blood"] + "/" + _loc3_.data["blood"];
                  MainManager.actorModel.sprite.addChild(_loc3_);
                  AimatController.addEventListener(AimatEvent.PLAY_END,onAimatEnd);
                  nTime = setInterval(checkMonster,1000);
               });
               for each(mc in pirateArr)
               {
                  mc.gotoAndStop(2);
               }
            }]);
         });
      }
      
      private static function gotoStep2() : void
      {
         KTool.setActorVisible(false);
         AnimateManager.playMcAnimate(_map.animatorLevel["pirate"],3,"pirate3Mc",function():void
         {
            NpcDialog.show(NPC.SEER,["那群奇怪精灵的能量竟然帮助我恢复体力了……快站起来！我……我要保护卡茨！"],["（点击佐格和艾里逊进行精灵对战）"],[function():void
            {
               var _loc1_:* = _map.conLevel["allisonHit"];
               var _loc2_:* = _map.conLevel["zogHit"];
               _loc1_.mouseChildren = _loc2_.mouseChildren = true;
               _loc1_.mouseEnabled = _loc2_.mouseEnabled = true;
               _loc1_.buttonMode = _loc2_.buttonMode = true;
               _loc1_.addEventListener(MouseEvent.CLICK,fightHandler);
               _loc2_.addEventListener(MouseEvent.CLICK,fightHandler);
            }]);
         });
      }
      
      private static function getRotation(param1:Point, param2:Point) : Number
      {
         var _loc3_:Number = (param1.y - param2.y) / (param1.x - param2.x);
         var _loc4_:Number = Math.abs(Math.atan(_loc3_) / (Math.PI / 180));
         var _loc5_:Number = Math.abs(Math.atan(0) / (Math.PI / 180));
         var _loc6_:Number = Math.abs(_loc4_ - _loc5_);
         if(param2.y <= param1.y)
         {
            if(param2.x <= param1.x)
            {
               _loc6_ += 180;
            }
            else
            {
               _loc6_ *= -1;
            }
         }
         else if(param2.x <= param1.x)
         {
            _loc6_ = 180 - _loc6_;
         }
         return _loc6_;
      }
      
      private static function checkMonster() : void
      {
         var nDis:Number = NaN;
         var killMc:MovieClip = null;
         var hitsMc:MovieClip = null;
         var obj:OgreModel = null;
         var monst:OgreModel = null;
         var bloodMc:MovieClip = MainManager.actorModel.sprite.getChildByName("bloodMc") as MovieClip;
         if(Boolean(bloodMc))
         {
            for each(obj in MonsterArr)
            {
               nDis = Number(Point.distance(obj.pos,MainManager.actorModel.pos));
               if(nDis <= 150 && nDis >= 60)
               {
                  if(obj.sprite.getChildByName("killMc") == null)
                  {
                     killMc = MapLibManager.getMovieClip("killMc");
                     killMc.name = "killMc";
                     killMc.rotation = getRotation(obj.pos,MainManager.actorModel.pos);
                     killMc.y -= 40;
                     obj.sprite.addChild(killMc);
                     if(MainManager.actorModel.sprite.getChildByName("hitsMc") == null)
                     {
                        hitsMc = MapLibManager.getMovieClip("hitsMc");
                        hitsMc.name = "hitsMc";
                        hitsMc.y -= 10;
                        MainManager.actorModel.sprite.addChild(hitsMc);
                        bloodMc.data["blood"] -= 5;
                        if(bloodMc.data["blood"] < 0)
                        {
                           bloodMc.data["blood"] = 0;
                        }
                        bloodMc["perTxt"].text = bloodMc.data["blood"] + "/50";
                        bloodMc["perMc"].gotoAndStop(uint(101 - 2 * bloodMc.data["blood"]));
                        if(bloodMc.data["blood"] <= 0)
                        {
                           seerDied = true;
                           clearInterval(nTime);
                           nTime = 0;
                           DisplayUtil.removeForParent(bloodMc);
                           MainManager.actorModel.stopAutoWalk();
                           MainManager.actorModel.filters = [ColorFilter.setGrayscale()];
                           for each(monst in MonsterArr)
                           {
                              monst.isPurseFlag = false;
                           }
                           Alarm.show("你已被疯狂的海盗击毙",function():void
                           {
                              MapManager.changeMap(1);
                              MainManager.actorModel.filters = null;
                           });
                           return;
                        }
                     }
                  }
               }
            }
         }
      }
      
      public static function checkSeer() : void
      {
         if(seerDied)
         {
            NpcDialog.show(NPC.SEER,["可恶！竟然以多欺少！看我不好好教训你们！！！！"],["杀个回马枪！(回到SUN星球)","我一会再回去！"],[function():void
            {
               MapManager.changeMap(497);
            }]);
         }
      }
      
      private static function onAimatEnd(param1:AimatEvent) : void
      {
         var _loc2_:OgreModel = null;
         DebugTrace.show("剩余海盗个数：" + MonsterArr.length);
         for each(_loc2_ in MonsterArr)
         {
            if(_loc2_.hitTestPoint(param1.info.endPos.x,param1.info.endPos.y))
            {
               killMonster(_loc2_);
               break;
            }
         }
      }
      
      private static function killMonster(param1:OgreModel) : void
      {
         var dispMc:MovieClip = null;
         var obj:OgreModel = null;
         dispMc = null;
         obj = param1;
         var bloodMc:MovieClip = obj.sprite.getChildByName("bloodMc") as MovieClip;
         if(Boolean(bloodMc))
         {
            if(bloodMc.data["blood"] > 0)
            {
               bloodMc.data["blood"] -= 5;
               if(bloodMc.data["blood"] < 0)
               {
                  bloodMc.data["blood"] = 0;
               }
               bloodMc["perTxt"].text = bloodMc.data["blood"] + "/10";
               bloodMc["perMc"].gotoAndStop(uint(101 - 10 * bloodMc.data["blood"]));
               if(bloodMc.data["blood"] <= 0)
               {
                  bloodMc.visible = false;
                  obj.isPurseFlag = false;
                  dispMc = MapLibManager.getMovieClip("dispMc");
                  obj.sprite.addChild(dispMc);
                  dispMc.addFrameScript(17,function():void
                  {
                     dispMc.stop();
                     MonsterArr.splice(MonsterArr.indexOf(obj),1);
                     obj.destroy();
                     if(MonsterArr.length == 0)
                     {
                        AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
                        MonsterArr = null;
                        clearInterval(nTime);
                        nTime = 0;
                        AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_628_2"),function():void
                        {
                           KTool.setActorVisible(false);
                           AnimateManager.playMcAnimate(_map.animatorLevel["pirate"],2,"pirate2Mc",function():void
                           {
                              AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_628_3"),function():void
                              {
                                 TasksManager.complete(TaskController_628.TASK_ID,0);
                                 DebugTrace.show("第一步完成");
                                 gotoStep2();
                              });
                           });
                        });
                     }
                  });
               }
            }
         }
      }
      
      private static function fightHandler(param1:MouseEvent) : void
      {
         DebugTrace.show("fight with " + param1.currentTarget.name);
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
         EventManager.addEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
         if(param1.currentTarget.name == "allisonHit")
         {
            FightManager.fightWithBoss("塔奇拉顿",0);
         }
         else if(param1.currentTarget.name == "zogHit")
         {
            FightManager.fightWithBoss("尼斯克",1);
         }
      }
      
      private static function onFightComplete(param1:PetFightEvent) : void
      {
         var _loc2_:FightOverInfo = param1 == null ? null : param1.dataObj as FightOverInfo;
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightComplete);
         if(_loc2_ == null)
         {
            return;
         }
         fightOver = true;
         onFightClose();
      }
      
      private static function onFightClose() : void
      {
         KTool.setActorVisible(false);
         MainManager.actorModel.pos = new Point(420,410);
         AnimateManager.playMcAnimate(_map.animatorLevel["pirate"],4,"pirate4Mc",function():void
         {
            NpcDialog.show(NPC.HELLO,["你的朋友可能快要不行了……"],null,null,false,function():void
            {
               NpcDialog.show(NPC.SEER,["说什么傻话呢！它是诅咒之子！他才不会这么容易不行……他只是在闭目养神！555555555555你……你是谁？"],null,null,false,function():void
               {
                  NpcDialog.show(NPC.HELLO,["我是哈喽，SUN星球的精灵，我们吸收太阳能量转换成矿石，我们还具有修复作用哦！让你朋友呆在这里吧，或许我们能够帮忙……"],["谢……谢……(我没哭鼻子)"],[function():void
                  {
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_628_4"),function():void
                     {
                        _map.animatorLevel["pirate"].gotoAndStop(5);
                        KTool.setActorVisible(true);
                        TasksManager.completeFinal(TaskController_628.TASK_ID,function(param1:Boolean):void
                        {
                           if(param1)
                           {
                              DebugTrace.show("第二步完成");
                              ToolBarController.showOrHideAllUser(true);
                              Task633.initTaskForMap497(_map);
                           }
                        });
                     });
                  }]);
               });
            });
         });
      }
      
      public static function initTaskForMap496(param1:BaseMapProcess) : void
      {
         _map = param1;
         if(TasksManager.getTaskStatus(626) == TasksManager.COMPLETE)
         {
            if(TasksManager.getTaskStatus(628) == TasksManager.UN_ACCEPT)
            {
               _map.conLevel["hairMc"].visible = true;
               _map.conLevel["hairMc"].buttonMode = true;
               _map.conLevel["hairMc"].addEventListener(MouseEvent.CLICK,acceptTask628);
               return;
            }
         }
         _map.conLevel["hairMc"].visible = false;
      }
      
      private static function acceptTask628(param1:MouseEvent) : void
      {
         var evt:MouseEvent = param1;
         NpcDialog.show(NPC.SEER,["这个不是卡茨身上的吗？它……它到底在哪里？咦！或许我们能根据精灵DNA侦测到它的下落！！！"],["快根据精灵DNA侦测看看！","我一会再来找你"],[function():void
         {
            TasksManager.accept(TaskController_628.TASK_ID,function(param1:Boolean):void
            {
               var b:* = param1;
               if(Boolean(b))
               {
                  _map.conLevel["hairMc"].visible = false;
                  AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_628_1"),function():void
                  {
                     MapManager.changeMap(497);
                  });
               }
            });
         }]);
      }
      
      public static function destroy() : void
      {
         var _loc1_:MovieClip = null;
         if(!_map)
         {
            return;
         }
         if(MapManager.currentMap.id == 496)
         {
            if(Boolean(_map.conLevel["hairMc"]))
            {
               _map.conLevel["hairMc"].removeEventListener(MouseEvent.CLICK,acceptTask628);
            }
         }
         else if(MapManager.currentMap.id == 497)
         {
            KTool.setActorVisible(true);
            ToolBarController.showOrHideAllUser(true);
            if(Boolean(_map.conLevel["allisonHit"]))
            {
               _map.conLevel["allisonHit"].removeEventListener(MouseEvent.CLICK,fightHandler);
            }
            if(Boolean(_map.conLevel["zogHit"]))
            {
               _map.conLevel["zogHit"].removeEventListener(MouseEvent.CLICK,fightHandler);
            }
            if(Boolean(MonsterArr))
            {
               AimatController.removeEventListener(AimatEvent.PLAY_END,onAimatEnd);
            }
            if(nTime > 0)
            {
               clearInterval(nTime);
            }
            _loc1_ = MainManager.actorModel.sprite.getChildByName("bloodMc") as MovieClip;
            if(Boolean(_loc1_))
            {
               DisplayUtil.removeForParent(_loc1_);
            }
         }
         _map = null;
      }
      
      override public function hideInMap(param1:BaseMapProcess) : void
      {
         var _loc2_:MovieClip = null;
         var _loc3_:MovieClip = null;
         _map = param1;
         if(MapManager.currentMap.id == 497)
         {
            _loc2_ = _map.conLevel["allisonHit"];
            _loc3_ = _map.conLevel["zogHit"];
            DisplayUtil.removeForParent(_loc2_);
            DisplayUtil.removeForParent(_loc3_);
            _map.animatorLevel["pirate"].visible = false;
         }
         if(MapManager.currentMap.id == 496)
         {
            _map.conLevel["hairMc"].visible = false;
         }
      }
      
      override public function initForMap(param1:BaseMapProcess) : void
      {
         if(MapManager.currentMap.id == 497)
         {
            initTaskForMap497(param1);
         }
         if(MapManager.currentMap.id == 496)
         {
            initTaskForMap496(param1);
         }
      }
      
      override public function destoryForMap() : void
      {
         if(MapManager.currentMap.id == 497)
         {
            destroy();
         }
         if(MapManager.currentMap.id == 496)
         {
            destroy();
         }
         _map = null;
      }
   }
}

