package com.robot.app.task.taskscollection
{
   import com.robot.app.task.control.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.map.MapLibManager;
   import com.robot.core.newloader.*;
   import com.robot.core.npc.*;
   import flash.display.*;
   import flash.events.*;
   import flash.media.Sound;
   import flash.media.SoundChannel;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class Task560
   {
      
      private static var _map:BaseMapProcess;
      private static var _snowLoader:MCLoader;
      private static var _hiddenActor:DisplayObject;
      private static var _hiddenPet:DisplayObject;
      private static var _actorWasVisible:Boolean;
      private static var _petWasVisible:Boolean;
      
      private static var xuanMc:MovieClip;
      
      private static var leiyiAppear_mc:MovieClip;
      
      private static var leiyiDisappear_mc:MovieClip;
      
      private static var door_mc:MovieClip;
      
      private static var openDoor_mc:MovieClip;
      
      
      private static var BingDiaoMC:MovieClip;
      
      private static var JackBattleMC:MovieClip;
      
      
      private static var snowMC:MovieClip;
      
      private static var guide_mc:MovieClip;
      
      private static var doorMc:MovieClip;
      
      private static var leiyiAppearSound:Sound;
      
      private static var leiyiAppearChannel:SoundChannel;
      
      private static var hasIndoor:Boolean = false;
      
      public function Task560()
      {
         super();
      }
      
      public static function initTask() : void
      {
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_560_0"),function():void
         {
            NpcDialog.show(NPC.IRIS,["黑色旋涡、时空入口、黑白精灵……我都快要搞不清楚了！我想只有前往那里，才可以找到真正的答案！"],null,null,false,function():void
            {
               NpcDialog.show(NPC.IRIS,["哦对了！你所说的那个黑色精灵所散发出来的物质，经过派特化验，它绝对不是单纯的精灵……你一定要加倍小心！"],["向菲尔纳星球起航！"],[function():void
               {
                  MapManager.changeMap(459);
               }]);
            });
         });
      }
      
      public static function initTask_459(param1:BaseMapProcess) : void
      {
         xuanMc = param1.conLevel["xuanMc"];
         var _loc2_:uint = uint(TasksManager.getTaskStatus(560));
         if(_loc2_ == TasksManager.ALR_ACCEPT)
         {
            ToolTipManager.add(xuanMc,"赫鲁卡星");
            xuanMc.gotoAndStop(1);
            xuanMc.buttonMode = true;
            xuanMc.addEventListener(MouseEvent.CLICK,onXuanMcClick);
         }
      }
      
      private static function onXuanMcClick(param1:MouseEvent) : void
      {
         var e:MouseEvent = param1;
         var owner:DisplayObject = MapManager.currentMap.root;
         xuanMc.removeEventListener(MouseEvent.CLICK,onXuanMcClick);
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_559_0"),function():void
         {
            if(MapManager.currentMap.root != owner) return;
            MapManager.changeMap(460);
         });
      }
      
      public static function initTask_460(param1:BaseMapProcess) : void
      {
         var status:uint = 0;
         var map:BaseMapProcess = param1;
         _map = map;
         hasIndoor = false;
         leiyiAppear_mc = _map.animatorLevel["leiyiAppear_mc"];
         leiyiDisappear_mc = _map.animatorLevel["leiyiDisappear_mc"];
         door_mc = _map.animatorLevel["door_mc"];
         doorMc = map.conLevel["doorMc"];
         openDoor_mc = _map.animatorLevel["openDoor_mc"];
         BingDiaoMC = _map.animatorLevel["BingDiaoMC"];
         JackBattleMC = _map.animatorLevel["JackBattleMC"];
         guide_mc = _map.animatorLevel["guide_mc"];
         guide_mc.visible = false;
         leiyiAppear_mc.gotoAndStop(1);
         status = uint(TasksManager.getTaskStatus(560));
         if(status == TasksManager.UN_ACCEPT)
         {
            DisplayUtil.removeForParent(leiyiAppear_mc);
            DisplayUtil.removeForParent(leiyiDisappear_mc);
            DisplayUtil.removeForParent(door_mc);
            DisplayUtil.removeForParent(BingDiaoMC);
            DisplayUtil.removeForParent(JackBattleMC);
         }
         else if(status == TasksManager.ALR_ACCEPT)
         {
            leiyiAppear_mc.visible = false;
            leiyiDisappear_mc.visible = false;
            door_mc.visible = false;
            BingDiaoMC.visible = false;
            JackBattleMC.visible = false;
            TasksManager.getProStatusList(TaskController_560.TASK_ID,function(param1:Array):void
            {
               if(_map != map) return;
               if(!param1[0])
               {
                  startProOne();
               }
               else if(Boolean(param1[0]) && !param1[1])
               {
                  openDoor_mc.visible = true;
                  if(hasIndoor)
                  {
                     startProTwo();
                  }
               }
               else if(Boolean(param1[0]) && Boolean(param1[1]) && !param1[2])
               {
                  openDoor_mc.visible = true;
                  startProThree();
               }
            });
         }
         else if(status == TasksManager.COMPLETE)
         {
            DisplayUtil.removeForParent(leiyiAppear_mc);
            DisplayUtil.removeForParent(leiyiDisappear_mc);
            DisplayUtil.removeForParent(BingDiaoMC);
            DisplayUtil.removeForParent(JackBattleMC);
            DisplayUtil.removeForParent(door_mc);
            openDoor_mc.visible = true;
         }
      }
      
      public static function EnterDoor() : void
      {
         var status:uint = 0;
         hasIndoor = true;
         var map:BaseMapProcess = _map;
         if(Boolean(guide_mc))
         {
            guide_mc.visible = false;
         }
         status = uint(TasksManager.getTaskStatus(560));
         if(status == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_560.TASK_ID,function(param1:Array):void
            {
               if(_map != map) return;
               if(Boolean(param1[0]) && !param1[1])
               {
                  startProTwo();
               }
            });
         }
      }
      
      public static function OutDoor() : void
      {
         hasIndoor = false;
      }
      
      private static function snowLoad(param1:MCLoadEvent) : void
      {
         if(param1.currentTarget != _snowLoader || _map == null) return;
         _snowLoader.removeEventListener(MCLoadEvent.SUCCESS,snowLoad);
         snowMC = param1.getContent() as MovieClip;
         snowMC.mouseEnabled = false;
         snowMC.mouseChildren = false;
         LevelManager.appLevel.addChild(snowMC);
      }
      
      
      private static function startProOne() : void
      {
         var map:BaseMapProcess = _map;
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_559_0"),function():void
         {
            if(_map != map) return;
            NpcDialog.show(NPC.SEER,["哎哟……我的屁股……好疼……好讨厌的感觉啊！"],["哇哇哇！旁边有动静！！！"],[function():void
            {
               if(_map != map) return;
               leiyiAppear_mc.visible = true;
               leiyiAppearSound = MapLibManager.getSound("leiyiAppear");
               leiyiAppearChannel = leiyiAppearSound.play();
               doorMc.mouseChildren = false;
               doorMc.mouseEnabled = false;
               AnimateManager.playMcAnimate(leiyiAppear_mc,0,"",function():void
               {
                  if(_map != map) return;
                  leiyiAppear_mc.stop();
                  NpcDialog.show(NPC.LEIYI,["我的朋友，你是来拯救赫鲁卡星的吗？咤克斯的封印已经解除了……我不知道还有多少精灵会因此而受伤"],["……雷……雷伊？"],[function():void
                  {
                     if(_map != map) return;
                     NpcDialog.show(NPC.LEIYI,["在这里，我无法现身更无法保护赫尔卡星人！我希望你可以帮助我守护这里……"],null,null,false,function():void
                     {
                        if(_map != map) return;
                        NpcDialog.show(NPC.LEIYI,["守护我的人民！接下来你所看到的就是几千万年以前发生在这里的事情！咤克斯……可怕的噩梦！"],null,null,false,function():void
                        {
                           if(_map != map) return;
                           AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_560_5"),function():void
                           {
                              if(_map != map) return;
                              NpcDialog.show(NPC.LEIYI,["你所要做的就是去解开阿哆拉和特尼的诅咒，只有他们的帮助下，我们才有可能镇压咤克斯…"],["你是平行世界里的雷伊吗？"],[function():void
                              {
                                 if(_map != map) return;
                                 leiyiAppear_mc.visible = false;
                                 leiyiDisappear_mc.visible = true;
                                 AnimateManager.playMcAnimate(leiyiDisappear_mc,0,"",function():void
                                 {
                                    if(_map != map) return;
                                    door_mc.visible = true;
                                    AnimateManager.playMcAnimate(door_mc,0,"",function():void
                                    {
                                       if(_map != map) return;
                                       door_mc.stop();
                                       openDoor_mc.visible = true;
                                       doorMc.mouseEnabled = true;
                                       guide_mc.visible = true;
                                       TasksManager.complete(TaskController_560.TASK_ID,0,function(param1:Boolean):void
                                       {
                                          if(_map != map) return;
                                          if(param1)
                                          {
                                             if(hasIndoor)
                                             {
                                                startProTwo();
                                             }
                                          }
                                       });
                                    });
                                 });
                              }]);
                           });
                        });
                     });
                  }]);
               });
            }]);
         });
      }
      
      private static function startProTwo() : void
      {
         var map:BaseMapProcess = _map;
         BingDiaoMC.visible = true;
         hideActors();
         AnimateManager.playMcAnimate(BingDiaoMC,0,"",function():void
         {
            if(_map != map) return;
            NpcDialog.show(NPC.ZHANG_LAO,["谁……是谁？为什么你的到来让冰封多年的赫鲁卡星神兽有了动静？你难道就是预言中的救世主？"],null,null,false,function():void
            {
               if(_map != map) return;
               NpcDialog.show(NPC.ZHANG_LAO,["咤克斯的封印就是你解开的吧！这或许就是天意……赫鲁卡星需要你……拜托！"],null,null,false,function():void
               {
                  if(_map != map) return;
                  NpcDialog.show(NPC.ZHANG_LAO,["自由飞行在天空中的阿哆拉需要飞行能量的元素，爱好战斗的特尼只有战斗的频率才能让它感受到心跳！准备好了吗？"],["伴随着他们自由在天空翱翔吧……"],[function():void
                  {
                     if(_map != map) return;
                     AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_560_1"),function():void
                     {
                        if(_map != map) return;
                        BingDiaoMC.visible = false;
                        JackBattleMC.visible = true;
                        AnimateManager.playMcAnimate(JackBattleMC,0,"",function():void
                        {
                           if(_map != map) return;
                           NpcDialog.show(NPC.KRIS_PET,["救世主，你愿意率领我们一起战斗吗？"],["上"],[function():void
                           {
                              if(_map != map) return;
                              TasksManager.complete(TaskController_560.TASK_ID,1,function(param1:Boolean):void
                              {
                                 if(_map != map) return;
                                 if(param1)
                                 {
                                    startProThree();
                                 }
                              });
                           }]);
                        });
                     });
                  }]);
               });
            });
         });
      }
      
      private static function startProThree() : void
      {
         var map:BaseMapProcess = _map;
         hideActors();
         AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_560_4"),function():void
         {
            if(_map != map) return;
            AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_560_6"),function():void
            {
               if(_map != map) return;
               var url:String = null;
               JackBattleMC.visible = false;
               url = ClientConfig.getFullMovie("task_560_2");
               _snowLoader = new MCLoader(url,LevelManager.appLevel,1,"正在加载中...");
               _snowLoader.addEventListener(MCLoadEvent.SUCCESS,snowLoad);
               _snowLoader.doLoad();
               AnimateManager.playClassicFullScreenAnimate(ClientConfig.getFullMovie("task_560_3"),function():void
               {
                  if(_map != map) return;
                  NpcDialog.show(NPC.ZHANG_LAO,["星球的能量也在衰退，我想这次可能是最后一个神圣仪式了……"],null,null,false,function():void
                  {
                     if(_map != map) return;
                     NpcDialog.show(NPC.ZHANG_LAO,["我们会在这里等你回来，最后一次的神圣祭奠希望会有你，我们的救世主"],["我先回赛尔号禀报一下这里的情况！我一定会回来！"],[function():void
                     {
                        if(_map != map) return;
                        TasksManager.complete(TaskController_560.TASK_ID,2,function(param1:Boolean):void
                        {
                           if(_map != map) return;
                           if(param1)
                           {
                              MapManager.changeMap(9);
                           }
                        });
                     }]);
                  });
               });
            });
         });
      }
      
      private static function hideActors() : void
      {
         if(_hiddenActor != null) return;
         _hiddenActor = MainManager.actorModel;
         _actorWasVisible = _hiddenActor.visible;
         _hiddenPet = MainManager.actorModel.pet;
         if(_hiddenPet != null)
         {
            _petWasVisible = _hiddenPet.visible;
            _hiddenPet.visible = false;
         }
         _hiddenActor.visible = false;
      }

      private static function restoreActors() : void
      {
         if(_hiddenActor != null) _hiddenActor.visible = _actorWasVisible;
         if(_hiddenPet != null) _hiddenPet.visible = _petWasVisible;
         _hiddenActor = null;
         _hiddenPet = null;
      }

      public static function destroy(map:BaseMapProcess) : void
      {
         if(xuanMc != null && xuanMc.parent == map.conLevel)
         {
            ToolTipManager.remove(xuanMc);
            xuanMc.removeEventListener(MouseEvent.CLICK,onXuanMcClick);
            xuanMc = null;
            return;
         }
         if(_map != map) return;
         hasIndoor = false;
         restoreActors();
         if(_snowLoader != null)
         {
            _snowLoader.removeEventListener(MCLoadEvent.SUCCESS,snowLoad);
            _snowLoader.clear();
            _snowLoader = null;
         }
         DisplayUtil.removeForParent(snowMC);
         snowMC = null;
         if(Boolean(leiyiAppearChannel))
         {
            leiyiAppearChannel.stop();
            leiyiAppearChannel = null;
         }
         DisplayUtil.removeForParent(leiyiAppear_mc);
         DisplayUtil.removeForParent(leiyiDisappear_mc);
         DisplayUtil.removeForParent(door_mc);
         DisplayUtil.removeForParent(BingDiaoMC);
         DisplayUtil.removeForParent(JackBattleMC);
         DisplayUtil.removeForParent(openDoor_mc);
         _map = null;
      }
   }
}

