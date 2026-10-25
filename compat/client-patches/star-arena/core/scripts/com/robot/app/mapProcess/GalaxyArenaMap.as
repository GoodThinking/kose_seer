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
   import flash.display.Graphics;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import flash.filters.GlowFilter;
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
      private var scene:Sprite;
      private var ui:Sprite;
      private var actors:Array = [];
      private var hits:Array = [];
      private var progressText:TextField;
      private var groupText:TextField;
      private var guide:PeopleModel;
      private var guideHit:Sprite;
      private var disposed:Boolean = false;
      private var group:uint = 0;
      private var nextStage:uint = 0;
      private var claimed:Boolean = false;
      private var ready:Boolean = false;
      private var busy:Boolean = false;
      private var timeout:uint;

      public function GalaxyArenaMap(){super();}

      override protected function init():void
      {
         for each(var definition:Object in ARENAS)if(definition.mapId==MapManager.currentMap.id)catalog=definition;
         if(catalog==null)throw new Error("Missing galaxy arena definition");
         trainers=catalog.trainers;
         var child:DisplayObject;
         var i:int;
         for(i=0;i<conLevel.numChildren;i++)conLevel.getChildAt(i).visible=false;
         for(i=0;i<btnLevel.numChildren;i++)btnLevel.getChildAt(i).visible=false;
         for(i=0;i<topLevel.numChildren;i++)topLevel.getChildAt(i).visible=false;
         for(i=0;i<animatorLevel.numChildren;i++)animatorLevel.getChildAt(i).visible=false;
         for(i=0;i<depthLevel.numChildren;i++){child=depthLevel.getChildAt(i);if(!(child is BasePeoleModel))child.visible=false;}
         scene=new Sprite();scene.mouseEnabled=false;scene.mouseChildren=false;
         ui=new Sprite();ui.mouseEnabled=false;conLevel.addChild(ui);
         if(catalog.id==1)paintPano();else paintRegional();
         MapManager.currentMap.backLevel.bitmapData.draw(scene);
         var grid:Array=MapManager.currentMap.data;
         var size:uint=MapManager.currentMap.gridSize;
         for(var gx:int=0;gx<MapManager.currentMap.gridX;gx++)
            for(var gy:int=0;gy<MapManager.currentMap.gridY;gy++)
               grid[gx][gy]=(gx*size>205&&gx*size<760&&gy*size>165&&gy*size<410);
         progressText=text(ui,"正在读取擂台进度…",238,78,500,28,15,0xffedb1,true);
         groupText=text(ui,"候场区：第 1—8 席",25,325,180,45,13,0xffedb1,true);
         var guideInfo:UserInfo=new UserInfo();
         guideInfo.userID=99009900+catalog.id;
         guideInfo.nick="擂台接待员";
         guideInfo.color=0xb4c5dc;
         guideInfo.direction=0;
         guideInfo.pos=new Point(480,195);
         guide=new PeopleModel(guideInfo);
         guide.mouseEnabled=false;
         guide.mouseChildren=false;
         depthLevel.addChild(guide);
         guideHit=new Sprite();
         guideHit.name="arenaGuideHit";
         guideHit.graphics.beginFill(0xffffff,0.01);
         guideHit.graphics.drawEllipse(448,124,64,95);
         guideHit.graphics.endFill();
         guideHit.buttonMode=true;
         guideHit.addEventListener(MouseEvent.CLICK,onGuideClick);
         ToolTipManager.add(guideHit,"擂台接待员：挑战、选手、奖励、调队与换场");
         ui.addChild(guideHit);
         showGroup(0);
         SocketConnection.addCmdListener(91010,onProgress);
         PetManager.upDate();request(0);
      }

      private function isActive():Boolean
      {
         return !disposed && MapProcessConfig.currentProcessInstance==this;
      }

      private function onGuideClick(event:MouseEvent):void
      {
         if(isActive())MainManager.actorModel.moveAndAction(guide.pos,showGuide);
      }

      private function showGuide():void
      {
         if(!isActive())return;
         var message:String=catalog.name+"星系共有16位守擂者，每位携带六只100级精灵。";
         if(!ready||busy){
            NpcDialog.show(NPC.SEER,[message+(busy?"正在处理擂台操作，请稍候。":"正在读取你的参赛进度，请稍候。")],["了解赛场","调队与换场","稍后再来"],[showOverview,showServices]);
            return;
         }
         message+=nextStage<trainers.length?"你已击败"+nextStage+"位选手，下一位是"+trainers[nextStage].name+"。":"你已通过全部16擂。"+(claimed?"本星系冠军奖励已经领取。":"冠军精灵正在等你领取。");
         var label:String=nextStage<trainers.length?"继续挑战："+trainers[nextStage].name:(claimed?"再战一轮":"领取冠军精灵");
         NpcDialog.show(NPC.SEER,[message],[label,"了解赛场","调队与换场","稍后再来"],[onAction,showOverview,showServices]);
      }

      private function showOverview():void
      {
         if(!isActive())return;
         NpcDialog.show(NPC.SEER,["选手分前后八席候场。直接点击场上的赛尔，就能交谈并了解完整阵容；挑战仍按16位选手的顺序进行。"],[group==0?"换到后八席":"换到前八席","了解冠军奖励","返回接待员","暂时离开"],[showOtherGroup,showChampion,showGuide]);
      }

      private function showOtherGroup():void
      {
         if(isActive())showGroup(1-group);
      }

      private function showChampion():void
      {
         if(!isActive())return;
         NpcDialog.show(NPC.SEER,["本星系首次夺冠可领取一只100级"+catalog.rewardName+"，种族值总和"+catalog.rewardSpeciesTotal+"。背包满时进入仓库，每个账号在本星系只领取一次。再次攻擂不会重复发奖。"],["返回接待员","暂时离开"],[showGuide]);
      }

      private function showServices():void
      {
         if(!isActive())return;
         NpcDialog.show(NPC.SEER,["场间可以整理精灵，体力和PP按现有擂台规则恢复。三座星系擂台的进度与冠军奖励互不影响。"],["精灵背包","精灵仓库","前往其他赛场","返回接待员"],[showBag,showStorage,showTravel,showGuide]);
      }

      private function showBag():void
      {
         if(isActive())PetBagController.show();
      }

      private function showStorage():void
      {
         if(isActive())ModuleManager.showModule(ClientConfig.getAppModule("PetStorage"),"正在打开精灵仓库…");
      }

      private function showTravel():void
      {
         if(!isActive())return;
         var options:Array=["返回空间站"];
         var handlers:Array=[travelTo(102)];
         for each(var destination:Object in ARENAS){
            if(destination.mapId==catalog.mapId)continue;
            options.push(destination.name+"星系擂台");
            handlers.push(travelTo(destination.mapId));
         }
         options.push("返回接待员");
         handlers.push(showGuide);
         NpcDialog.show(NPC.SEER,["想换个赛场看看？各星系保留各自的攻擂进度。"],options,handlers);
      }

      private function travelTo(mapId:uint):Function
      {
         return function():void{if(isActive())MapManager.changeMap(mapId);};
      }

      private function paintPano():void
      {
         var g:Graphics=scene.graphics;
         g.beginFill(0x173b54);g.drawRect(0,0,960,560);g.endFill();
         g.beginFill(0x2e6079);g.drawRoundRect(8,92,944,426,46,46);g.endFill();
         g.lineStyle(6,0x567c91);g.beginFill(0xa5c0be);g.drawEllipse(208,169,538,236);g.endFill();
         g.lineStyle(3,0x477a89);g.drawEllipse(257,192,438,183);
         g.lineStyle(2,0xd1e5dc);g.drawEllipse(324,213,300,133);g.moveTo(477,175);g.lineTo(477,397);
         crown(g,478,292);
         crowd(g,217,117,42);
      }

      private function paintRegional():void
      {
         var g:Graphics=scene.graphics;
         var garden:Boolean=catalog.id==2;
         // The outer native moon-garden / wrecked-factory art remains visible.
         // The platform, steps, stands and props belong to the walkable world, not a menu backdrop.
         g.lineStyle(5,garden?0x354e40:0x312b36);
         g.beginFill(garden?0x4d6550:0x413847);g.drawEllipse(183,187,593,247);g.endFill();
         g.beginFill(garden?0x7b9271:0x7c6261);g.drawEllipse(183,173,593,245);g.endFill();
         g.lineStyle(4,garden?0xd2d3a2:0xd0a15e);
         g.beginFill(garden?0xb3ba8d:0x73626b);g.drawEllipse(201,180,557,216);g.endFill();
         g.lineStyle(2,garden?0x6e825c:0x463c49);g.drawEllipse(241,194,478,184);g.drawEllipse(324,222,312,128);
         g.lineStyle(2,garden?0xe1deb4:0xd7ac70);g.moveTo(480,186);g.lineTo(480,390);
         for(var i:int=0;i<12;i++){
            var angle:Number=i*Math.PI/6;
            var sx:Number=480+269*Math.cos(angle);var sy:Number=288+105*Math.sin(angle);
            g.lineStyle(2,garden?0x6b8059:0xb08762);g.moveTo(sx,sy);g.lineTo(480+240*Math.cos(angle),288+93*Math.sin(angle));
         }
         g.lineStyle(3,0x302e32);
         for(i=0;i<3;i++){
            g.beginFill(garden?0x9baf80:0x8f7167);g.drawRoundRect(429-i*10,397+i*8,103+i*20,12,4,4);g.endFill();
         }
         crown(g,480,300);
         for(i=0;i<2;i++){
            var px:Number=i==0?192:759;
            g.beginFill(garden?0x66785b:0x5f4b51);g.drawRoundRect(px-15,164,29,83,7,7);g.endFill();
            g.beginFill(garden?0xb1c28d:0xa0785e);g.drawEllipse(px-23,154,45,19);g.endFill();
            if(garden){
               g.lineStyle(4,0x315b49);g.moveTo(px,229);g.curveTo(px+27,205,px-8,176);
               for(var j:int=0;j<5;j++){g.lineStyle(1,0x4a7151);g.beginFill(j%2?0x94b661:0x77a56b);g.drawEllipse(px-15+(j%2)*13,177+j*10,23,10);g.endFill();}
               g.beginFill(0xf5d287);g.drawCircle(px,156,9);g.endFill();
            }else{
               g.lineStyle(5,0x332c38);g.beginFill(0xd29b51);g.drawEllipse(px-18,154,36,23);g.endFill();
               g.lineStyle(2,0x774d46);g.moveTo(px-20,234);g.lineTo(px+21,234);
               g.beginFill(0xf1c567);g.drawCircle(px,165,6);g.endFill();
            }
         }
         crowd(g,248,161,36);
         for(i=0;i<16;i++){
            var x:Number=223+i*32;
            g.lineStyle(2,0x554b3d);g.moveTo(x,113);g.lineTo(x,164);
            g.lineStyle(1,0x433e36);g.beginFill(uint(trainers[i].color));g.moveTo(x,118);g.lineTo(x+22,118);g.lineTo(x+22,141);g.lineTo(x+11,149);g.lineTo(x,141);g.lineTo(x,118);g.endFill();
         }
      }

      private function crown(g:Graphics,x:Number,y:Number):void
      {
         g.lineStyle(2,0x716039);g.beginFill(0xd4bc73);g.drawEllipse(x-35,y-22,70,45);g.endFill();
         g.lineStyle(3,0x77602c);g.moveTo(x-22,y+10);g.lineTo(x-26,y-10);g.lineTo(x-12,y);g.lineTo(x,y-18);g.lineTo(x+12,y);g.lineTo(x+26,y-10);g.lineTo(x+22,y+10);g.lineTo(x-22,y+10);
      }

      private function crowd(g:Graphics,x:Number,y:Number,count:int):void
      {
         for(var i:int=0;i<count;i++){
            var px:Number=x+i*13;var py:Number=y+(i%3)*5;
            g.lineStyle(1,0x3a4a42);g.beginFill([0x8cbdac,0xb5ad81,0x9b9bc3,0xc59b83][i%4]);g.drawCircle(px,py,4);g.drawRoundRect(px-5,py+4,10,11,3,3);g.endFill();
         }
      }

      private function showGroup(value:uint):void
      {
         if(value==group&&actors.length>0)return;
         for each(var actor:PeopleModel in actors)actor.destroy();
         for each(var hit:Sprite in hits){ToolTipManager.remove(hit);if(hit.parent)hit.parent.removeChild(hit);}
         actors=[];hits=[];group=value;
         if(groupText)groupText.text=group==0?"第 1—8 席":"第 9—16 席";
         for(var index:uint=group*8;index<Math.min((group+1)*8,trainers.length);index++)addTrainer(index);
      }

      private function addTrainer(index:uint):void
      {
         var trainer:Object=trainers[index];var slot:uint=index%8;
         var pos:Point;
         if(catalog.id==1)pos=new Point(280+(slot%4)*130,slot<4?245:352);
         else pos=new Point([254,382,567,697,254,382,567,697][slot],[245,228,228,245,358,383,383,358][slot]);
         var info:UserInfo=new UserInfo();info.userID=99008001+catalog.id*100+index;info.nick=trainer.name;info.color=trainer.color;info.direction=0;info.pos=pos;info.spiritID=trainer.signaturePetId;info.spiritTime=1000000000+index;info.petDV=31;
         var model:PeopleModel=new PeopleModel(info);model.mouseEnabled=false;model.mouseChildren=false;depthLevel.addChild(model);actors.push(model);
         var hit:Sprite=new Sprite();hit.name="arenaTrainerHit_"+index;hit.graphics.beginFill(0xffffff,0.01);hit.graphics.drawEllipse(pos.x-35,pos.y-71,73,95);hit.graphics.endFill();hit.buttonMode=true;hit.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void{approachTrainer(index);});ToolTipManager.add(hit,(index+1)+"号 "+trainer.name+"：交谈与查看六宠阵容");ui.addChild(hit);hits.push(hit);
      }

      private function styleName(style:String):String{return {aggressive:"强攻",defensive:"坚守",tactical:"战术",balanced:"均衡"}[style];}
      private function approachTrainer(index:uint):void
      {
         if(!isActive())return;
         showGroup(uint(index/8));
         MainManager.actorModel.moveAndAction(actors[index%8].pos,function():void{showTrainer(index);});
      }

      private function showTrainer(index:uint):void
      {
         if(!isActive())return;
         var trainer:Object=trainers[index];
         var status:String=!ready?"参赛进度正在读取。":(index<nextStage?"你已经战胜这位选手。":(index==nextStage?"这是当前的守擂者。":"需要先战胜前面的守擂者。"));
         var options:Array=["查看六宠阵容"];
         var handlers:Array=[function():void{showTeam(index);}];
         if(ready&&index==nextStage){
            options.push("开始挑战");
            handlers.push(function():void{if(!isActive())return;if(index==nextStage)onAction();else showGuide();});
         }
         options.push("返回接待员");
         handlers.push(showGuide);
         options.push("暂时离开");
         NpcDialog.show(NPC.SEER,[(index+1)+"号 "+trainer.name+"："+trainer.quote,trainer.title+"（"+styleName(trainer.style)+"）。"+trainer.description+status],options,handlers);
      }

      private function showTeam(index:uint):void
      {
         if(!isActive())return;
         var trainer:Object=trainers[index];
         var names:Array=[];
         for each(var pet:Object in trainer.team)names.push(PetXMLInfo.getName(pet.petId)+"（100级）");
         NpcDialog.show(NPC.SEER,[(index+1)+"号 "+trainer.name+"的六宠阵容："+names.join("、")+"。"],["返回选手对话","返回接待员","暂时离开"],[function():void{showTrainer(index);},showGuide]);
      }

      private function onAction():void
      {
         if(!isActive())return;
         if(!ready||busy){showGuide();return;}
         if(nextStage<trainers.length){showGroup(uint(nextStage/8));PetFightModel.mode=PetFightModel.MULTI_MODE;PetFightModel.status=PetFightModel.FIGHT_WITH_NPC;PetFightModel.enemyName=trainers[nextStage].name;request(1);}
         else request(claimed?3:2);
      }
      private function request(operation:uint):void{if(busy)return;busy=true;timeout=setTimeout(onTimeout,8000);SocketConnection.send(91010,operation,catalog.id,nextStage);}
      private function onTimeout():void{busy=false;Alarm.show("未收到擂台操作结果。请重新进入确认进度，不会自动重放挑战或领奖。");}
      private function onProgress(event:SocketEvent):void
      {
         var data:ByteArray=event.data as ByteArray;
         if(data==null||data.bytesAvailable!=36)return;
         var operation:uint=data.readUnsignedInt();var version:uint=data.readUnsignedInt();var arenaId:uint=data.readUnsignedInt();
         if(version!=2||arenaId!=catalog.id)return;
         clearTimeout(timeout);busy=false;ready=true;
         nextStage=data.readUnsignedInt();var count:uint=data.readUnsignedInt();var reward:uint=data.readUnsignedInt();claimed=data.readUnsignedInt()!=0;data.readUnsignedInt();data.readUnsignedInt();
         if(count!=trainers.length||reward!=catalog.rewardPetId||nextStage>count){ready=false;Alarm.show("擂台数据版本不一致，请刷新游戏。");return;}
         showGroup(uint(Math.min(nextStage,count-1)/8));
         progressText.text=catalog.name+"擂台 · "+(nextStage<count?"已击败 "+nextStage+" / "+count+" 位选手，下一位："+trainers[nextStage].name:"16擂全胜");
         ToolTipManager.remove(guideHit);
         ToolTipManager.add(guideHit,progressText.text+"；点击接待员继续挑战、查看奖励或换场");
         if(operation==2){PetManager.upDate();Alarm.show("冠军奖励：100级"+catalog.rewardName+"已发放。背包满时进入仓库；本星系每号仅领一次。");}
         if(operation==3)Alarm.show("新一轮攻擂已开始。本星系冠军精灵不会重复发放。");
      }
      private function text(parent:DisplayObjectContainer,value:String,x:Number,y:Number,width:Number,height:Number,size:uint,color:uint,bold:Boolean=false):TextField
      {
         var field:TextField=new TextField();field.defaultTextFormat=new TextFormat("宋体",size,color,bold);field.text=value;field.x=x;field.y=y;field.width=width;field.height=height;field.selectable=false;field.mouseEnabled=false;field.wordWrap=true;field.filters=[new GlowFilter(0x182f3b,1,3,3,4)];parent.addChild(field);return field;
      }
      override public function destroy():void
      {
         disposed=true;ready=false;
         guideHit.removeEventListener(MouseEvent.CLICK,onGuideClick);ToolTipManager.remove(guideHit);
         guide.destroy();guide=null;
         for each(var hit:Sprite in hits)ToolTipManager.remove(hit);
         hits=[];
         clearTimeout(timeout);SocketConnection.removeCmdListener(91010,onProgress);
         for each(var actor:PeopleModel in actors)actor.destroy();actors=[];
         if(ui&&ui.parent)ui.parent.removeChild(ui);scene=null;ui=null;
      }
   }
}
