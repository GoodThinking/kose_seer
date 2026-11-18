package com.robot.app.mapProcess
{
   import com.robot.app.petbag.PetBagController;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.info.UserInfo;
   import com.robot.core.info.fightInfo.PetFightModel;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.manager.UIManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.map.config.MapProcessConfig;
   import com.robot.core.mode.BasePeoleModel;
   import com.robot.core.mode.PeopleModel;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.DisplayObject;
   import flash.display.DisplayObjectContainer;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.filters.GlowFilter;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.utils.ByteArray;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.ToolTipManager;

   public class GalaxyArenaMap extends BaseMapProcess
   {
      private static const ARENAS:Array = []; // @GALAXY_ARENAS@
      private var catalog:Object;
      private var trainers:Array;
      private var ui:Sprite;
      private var hud:Sprite;
      private var actors:Array = [];
      private var hits:Array = [];
      private var progressText:TextField;
      private var groupBtnLabel:TextField;
      private var actionBtnLabel:TextField;
      private var guide:PeopleModel;
      private var guideHit:Sprite;
      private var disposed:Boolean = false;
      private var group:uint = 0;
      private var nextStage:uint = 0;
      private var claimed:Boolean = false;
      private var ready:Boolean = false;
      private var busy:Boolean = false;
      private var timeout:uint;

      public function GalaxyArenaMap()
      {
         super();
      }

      override protected function init() : void
      {
         var definition:Object = null;
         for each(definition in ARENAS)
         {
            if(definition.mapId == MapManager.currentMap.id)
            {
               catalog = definition;
            }
         }
         if(catalog == null)
         {
            throw new Error("Missing galaxy arena definition");
         }
         trainers = catalog.trainers;
         var child:DisplayObject = null;
         var i:int = 0;
         for(i = 0; i < conLevel.numChildren; i++)
         {
            conLevel.getChildAt(i).visible = false;
         }
         for(i = 0; i < btnLevel.numChildren; i++)
         {
            btnLevel.getChildAt(i).visible = false;
         }
         for(i = 0; i < topLevel.numChildren; i++)
         {
            topLevel.getChildAt(i).visible = false;
         }
         for(i = 0; i < animatorLevel.numChildren; i++)
         {
            animatorLevel.getChildAt(i).visible = false;
         }
         for(i = 0; i < depthLevel.numChildren; i++)
         {
            child = depthLevel.getChildAt(i);
            if(!(child is BasePeoleModel))
            {
               child.visible = false;
            }
         }
         ui = new Sprite();
         ui.mouseEnabled = false;
         conLevel.addChild(ui);
         var grid:Array = MapManager.currentMap.data;
         var size:uint = MapManager.currentMap.gridSize;
         for(var gx:int = 0; gx < MapManager.currentMap.gridX; gx++)
         {
            for(var gy:int = 0; gy < MapManager.currentMap.gridY; gy++)
            {
               grid[gx][gy] = gx * size > 160 && gx * size < 800 && gy * size > 155 && gy * size < 445;
            }
         }
         this.buildHud();
         var guideInfo:UserInfo = new UserInfo();
         guideInfo.userID = 99009900 + catalog.id;
         guideInfo.nick = "擂台接待员";
         guideInfo.color = 11847132;
         guideInfo.direction = 0;
         guideInfo.pos = new Point(480,195);
         guide = new PeopleModel(guideInfo);
         guide.mouseEnabled = false;
         guide.mouseChildren = false;
         depthLevel.addChild(guide);
         guideHit = new Sprite();
         guideHit.name = "arenaGuideHit";
         guideHit.graphics.beginFill(16777215,0.01);
         guideHit.graphics.drawEllipse(448,124,64,95);
         guideHit.graphics.endFill();
         guideHit.buttonMode = true;
         guideHit.addEventListener(MouseEvent.CLICK,onGuideClick);
         ToolTipManager.add(guideHit,"擂台接待员：挑战、选手、奖励、调队与换场");
         ui.addChild(guideHit);
         showGroup(0);
         SocketConnection.addCmdListener(91010,onProgress);
         PetManager.upDate();
         request(0);
      }

      private function buildHud() : void
      {
         hud = new Sprite();
         hud.x = 150;
         hud.y = 8;
         var bar:Sprite = UIManager.getSprite("Panel_TitleBar");
         if(bar)
         {
            bar.width = 660;
            bar.height = 68;
            bar.alpha = 0.92;
            bar.mouseEnabled = false;
            bar.mouseChildren = false;
            hud.addChild(bar);
         }
         progressText = text(hud,catalog.name + "星系擂台 · 正在读取擂台进度…",18,6,624,24,14,16772529,true,true);
         actionBtnLabel = addNativeButton(hud,"读取进度中",24,33,152,onActionClick);
         groupBtnLabel = addNativeButton(hud,"切换9—16席",188,33,136,showOtherGroup);
         addNativeButton(hud,"精灵背包",336,33,120,showBag);
         addNativeButton(hud,"赛场切换/离开",468,33,164,showTravel);
         topLevel.addChild(hud);
      }

      private function addNativeButton(parent:DisplayObjectContainer, labelText:String, bx:Number, by:Number, bw:Number, handler:Function) : TextField
      {
         var holder:Sprite = new Sprite();
         holder.x = bx;
         holder.y = by;
         var up:DisplayObject = UIManager.getDisplayObject("Button_upSkin");
         var over:DisplayObject = UIManager.getDisplayObject("Button_overSkin");
         var down:DisplayObject = UIManager.getDisplayObject("Button_downSkin");
         up.width = over.width = down.width = bw;
         up.height = over.height = down.height = 28;
         var btn:SimpleButton = new SimpleButton(up,over,down,up);
         holder.addChild(btn);
         var lbl:TextField = text(holder,labelText,2,4,bw - 4,22,12,16777215,true,true);
         holder.buttonMode = true;
         holder.mouseChildren = false;
         holder.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            if(isActive())
            {
               handler();
            }
         });
         parent.addChild(holder);
         return lbl;
      }

      private function onActionClick() : void
      {
         if(!ready || busy)
         {
            showGuide();
            return;
         }
         onAction();
      }

      private function isActive() : Boolean
      {
         return !disposed && MapProcessConfig.currentProcessInstance == this;
      }

      private function onGuideClick(event:MouseEvent) : void
      {
         if(isActive())
         {
            MainManager.actorModel.moveAndAction(guide.pos,showGuide);
         }
      }

      private function showGuide() : void
      {
         if(!isActive())
         {
            return;
         }
         var message:String = catalog.name + "星系共有16位守擂者，每位携带六只100级精灵。";
         if(!ready || busy)
         {
            NpcDialog.show(NPC.SEER,[message + (busy ? "正在处理擂台操作，请稍候。" : "正在读取你的参赛进度，请稍候。")],["了解赛场","调队与换场","稍后再来"],[showOverview,showServices]);
            return;
         }
         message += nextStage < trainers.length ? "你已击败" + nextStage + "位选手，下一位是" + trainers[nextStage].name + "。" : "你已通过全部16擂。" + (claimed ? "本星系冠军奖励已经领取。" : "冠军精灵正在等你领取。");
         var label:String = nextStage < trainers.length ? "继续挑战：" + trainers[nextStage].name : (claimed ? "再战一轮" : "领取冠军精灵");
         NpcDialog.show(NPC.SEER,[message],[label,"了解赛场","调队与换场","稍后再来"],[onAction,showOverview,showServices]);
      }

      private function showOverview() : void
      {
         if(!isActive())
         {
            return;
         }
         NpcDialog.show(NPC.SEER,["选手分前后八席候场。直接点击场上的赛尔，就能交谈并了解完整阵容；挑战仍按16位选手的顺序进行。"],[group == 0 ? "换到后八席" : "换到前八席","了解冠军奖励","返回接待员","暂时离开"],[showOtherGroup,showChampion,showGuide]);
      }

      private function showOtherGroup() : void
      {
         if(isActive())
         {
            showGroup(1 - group);
         }
      }

      private function showChampion() : void
      {
         if(!isActive())
         {
            return;
         }
         NpcDialog.show(NPC.SEER,["本星系首次夺冠可领取一只100级满个体典藏精灵【" + catalog.rewardName + "】（种族值总和" + catalog.rewardSpeciesTotal + "）。背包满时进入仓库，每个账号在本星系只领取一次。"],["返回接待员","暂时离开"],[showGuide]);
      }

      private function showServices() : void
      {
         if(!isActive())
         {
            return;
         }
         NpcDialog.show(NPC.SEER,["场间可以整理精灵，体力和PP按擂台规则自动恢复。三座星系擂台的进度与冠军奖励互不影响。"],["精灵背包","精灵仓库","前往其他赛场","返回接待员"],[showBag,showStorage,showTravel,showGuide]);
      }

      private function showBag() : void
      {
         if(isActive())
         {
            PetBagController.show();
         }
      }

      private function showStorage() : void
      {
         if(isActive())
         {
            ModuleManager.showModule(ClientConfig.getAppModule("PetStorage"),"正在打开精灵仓库…");
         }
      }

      private function showTravel() : void
      {
         if(!isActive())
         {
            return;
         }
         var options:Array = ["返回精灵太空站"];
         var handlers:Array = [travelTo(102)];
         for each(var destination:Object in ARENAS)
         {
            if(destination.mapId == catalog.mapId)
            {
               continue;
            }
            options.push(destination.name + "星系擂台");
            handlers.push(travelTo(destination.mapId));
         }
         options.push("返回接待员");
         handlers.push(showGuide);
         NpcDialog.show(NPC.SEER,["想换个赛场看看？各星系保留各自的攻擂进度。"],options,handlers);
      }

      private function travelTo(mapId:uint) : Function
      {
         return function():void
         {
            if(isActive())
            {
               MapManager.changeMap(mapId);
            }
         };
      }

      private function showGroup(value:uint) : void
      {
         if(value == group && actors.length > 0)
         {
            return;
         }
         for each(var actor:PeopleModel in actors)
         {
            actor.destroy();
         }
         for each(var hit:Sprite in hits)
         {
            ToolTipManager.remove(hit);
            if(hit.parent)
            {
               hit.parent.removeChild(hit);
            }
         }
         actors = [];
         hits = [];
         group = value;
         if(groupBtnLabel)
         {
            groupBtnLabel.text = group == 0 ? "切换9—16席" : "切换1—8席";
            var fmt:TextFormat = groupBtnLabel.defaultTextFormat;
            fmt.align = "center";
            groupBtnLabel.setTextFormat(fmt);
         }
         for(var index:uint = group * 8; index < Math.min((group + 1) * 8,trainers.length); index++)
         {
            addTrainer(index);
         }
      }

      private function addTrainer(index:uint) : void
      {
         var trainer:Object = trainers[index];
         var slot:uint = index % 8;
         var pos:Point = new Point([245,375,585,715,245,375,585,715][slot],[255,235,235,255,365,385,385,365][slot]);
         var info:UserInfo = new UserInfo();
         info.userID = 99008001 + catalog.id * 100 + index;
         info.nick = trainer.name;
         info.color = trainer.color;
         info.direction = 0;
         info.pos = pos;
         info.spiritID = trainer.signaturePetId;
         info.spiritTime = 1000000000 + index;
         info.petDV = 31;
         var model:PeopleModel = new PeopleModel(info);
         model.mouseEnabled = false;
         model.mouseChildren = false;
         depthLevel.addChild(model);
         actors.push(model);
         var hit:Sprite = new Sprite();
         hit.name = "arenaTrainerHit_" + index;
         hit.graphics.beginFill(16777215,0.01);
         hit.graphics.drawEllipse(pos.x - 35,pos.y - 71,73,95);
         hit.graphics.endFill();
         hit.buttonMode = true;
         hit.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            approachTrainer(index);
         });
         ToolTipManager.add(hit,index + 1 + "号 " + trainer.name + "：交谈与查看六宠阵容");
         ui.addChild(hit);
         hits.push(hit);
      }

      private function styleName(style:String) : String
      {
         return {
            "aggressive":"强攻流",
            "defensive":"坚守流",
            "tactical":"战术流",
            "balanced":"均衡流"
         }[style];
      }

      private function approachTrainer(index:uint) : void
      {
         if(!isActive())
         {
            return;
         }
         showGroup(uint(index / 8));
         MainManager.actorModel.moveAndAction(actors[index % 8].pos,function():void
         {
            showTrainer(index);
         });
      }

      private function showTrainer(index:uint) : void
      {
         if(!isActive())
         {
            return;
         }
         var trainer:Object = trainers[index];
         var status:String = !ready ? "参赛进度正在读取。" : (index < nextStage ? "你已经战胜这位选手。" : (index == nextStage ? "这是当前的守擂者。" : "需要先战胜前面的守擂者。"));
         var options:Array = ["查看六宠阵容"];
         var handlers:Array = [function():void
         {
            showTeam(index);
         }];
         if(ready && index == nextStage)
         {
            options.push("开始挑战");
            handlers.push(function():void
            {
               if(!isActive())
               {
                  return;
               }
               if(index == nextStage)
               {
                  onAction();
               }
               else
               {
                  showGuide();
               }
            });
         }
         options.push("返回接待员");
         handlers.push(showGuide);
         options.push("暂时离开");
         NpcDialog.show(NPC.SEER,[index + 1 + "号 " + trainer.name + "：" + trainer.quote,trainer.title + "（" + styleName(trainer.style) + "）。" + trainer.description + status],options,handlers);
      }

      private function showTeam(index:uint) : void
      {
         if(!isActive())
         {
            return;
         }
         var trainer:Object = trainers[index];
         var names:Array = [];
         for each(var pet:Object in trainer.team)
         {
            names.push(PetXMLInfo.getName(pet.petId) + "（100级）");
         }
         NpcDialog.show(NPC.SEER,[index + 1 + "号 " + trainer.name + "的六宠阵容：" + names.join("、") + "。"],["返回选手对话","返回接待员","暂时离开"],[function():void
         {
            showTrainer(index);
         },showGuide]);
      }

      private function onAction() : void
      {
         if(!isActive())
         {
            return;
         }
         if(!ready || busy)
         {
            showGuide();
            return;
         }
         if(nextStage < trainers.length)
         {
            showGroup(uint(nextStage / 8));
            PetFightModel.mode = PetFightModel.MULTI_MODE;
            PetFightModel.status = PetFightModel.FIGHT_WITH_NPC;
            PetFightModel.enemyName = trainers[nextStage].name;
            request(1);
         }
         else
         {
            request(claimed ? 3 : 2);
         }
      }

      private function request(operation:uint) : void
      {
         if(busy)
         {
            return;
         }
         busy = true;
         timeout = setTimeout(onTimeout,8000);
         SocketConnection.send(91010,operation,catalog.id,nextStage);
      }

      private function onTimeout() : void
      {
         busy = false;
         Alarm.show("未收到擂台操作结果。请重新进入确认进度，不会自动重放挑战或领奖。");
      }

      private function onProgress(event:SocketEvent) : void
      {
         var data:ByteArray = event.data as ByteArray;
         if(data == null || data.bytesAvailable != 36)
         {
            return;
         }
         var operation:uint = data.readUnsignedInt();
         var version:uint = data.readUnsignedInt();
         var arenaId:uint = data.readUnsignedInt();
         if(version != 2 || arenaId != catalog.id)
         {
            return;
         }
         clearTimeout(timeout);
         busy = false;
         ready = true;
         nextStage = data.readUnsignedInt();
         var count:uint = data.readUnsignedInt();
         var reward:uint = data.readUnsignedInt();
         claimed = data.readUnsignedInt() != 0;
         data.readUnsignedInt();
         data.readUnsignedInt();
         if(count != trainers.length || reward != catalog.rewardPetId || nextStage > count)
         {
            ready = false;
            Alarm.show("擂台数据版本不一致，请刷新游戏。");
            return;
         }
         showGroup(uint(Math.min(nextStage,count - 1) / 8));
         progressText.text = catalog.name + "星系擂台（" + (group == 0 ? "第1—8席" : "第9—16席") + "） · " + (nextStage < count ? "已击败 " + nextStage + " / " + count + " 位，下一位：" + trainers[nextStage].name : "16擂全胜！");
         var pFmt:TextFormat = progressText.defaultTextFormat;
         pFmt.align = "center";
         progressText.setTextFormat(pFmt);
         if(actionBtnLabel)
         {
            actionBtnLabel.text = nextStage < count ? "挑战：" + trainers[nextStage].name : (claimed ? "新一轮攻擂" : "领取冠军精灵");
            var aFmt:TextFormat = actionBtnLabel.defaultTextFormat;
            aFmt.align = "center";
            actionBtnLabel.setTextFormat(aFmt);
         }
         ToolTipManager.remove(guideHit);
         ToolTipManager.add(guideHit,progressText.text + "；点击接待员继续挑战、查看奖励或换场");
         if(operation == 2)
         {
            PetManager.upDate();
            Alarm.show("冠军奖励：100级" + catalog.rewardName + "已发放！背包满时进入仓库；本星系每号仅领一次。");
         }
         if(operation == 3)
         {
            Alarm.show("新一轮攻擂已开始。本星系冠军精灵不会重复发放。");
         }
      }

      private function text(parent:DisplayObjectContainer, value:String, x:Number, y:Number, width:Number, height:Number, size:uint, color:uint, bold:Boolean = false, center:Boolean = false) : TextField
      {
         var field:TextField = new TextField();
         var fmt:TextFormat = new TextFormat("宋体",size,color,bold);
         if(center)
         {
            fmt.align = "center";
         }
         field.defaultTextFormat = fmt;
         field.text = value;
         field.setTextFormat(fmt);
         field.x = x;
         field.y = y;
         field.width = width;
         field.height = height;
         field.selectable = false;
         field.mouseEnabled = false;
         field.wordWrap = true;
         field.filters = [new GlowFilter(1584955,1,3,3,4)];
         parent.addChild(field);
         return field;
      }

      override public function destroy() : void
      {
         disposed = true;
         ready = false;
         guideHit.removeEventListener(MouseEvent.CLICK,onGuideClick);
         ToolTipManager.remove(guideHit);
         guide.destroy();
         guide = null;
         for each(var hit:Sprite in hits)
         {
            ToolTipManager.remove(hit);
         }
         hits = [];
         clearTimeout(timeout);
         SocketConnection.removeCmdListener(91010,onProgress);
         for each(var actor:PeopleModel in actors)
         {
            actor.destroy();
         }
         actors = [];
         if(hud && hud.parent)
         {
            hud.parent.removeChild(hud);
         }
         if(ui && ui.parent)
         {
            ui.parent.removeChild(ui);
         }
         hud = null;
         ui = null;
      }
   }
}
