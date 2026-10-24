package com.robot.app.mapProcess
{
   import com.robot.app.petbag.PetBagController;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.info.UserInfo;
   import com.robot.core.info.fightInfo.PetFightModel;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.BasePeoleModel;
   import com.robot.core.mode.PeopleModel;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.DisplayObject;
   import flash.display.DisplayObjectContainer;
   import flash.display.Graphics;
   import flash.display.Loader;
   import flash.display.Sprite;
   import flash.events.IOErrorEvent;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import flash.net.URLRequest;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.utils.ByteArray;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.events.SocketEvent;

   public class GalaxyArenaMap extends BaseMapProcess
   {
      private static const ARENAS:Array = []; // @GALAXY_ARENAS@
      private var catalog:Object;
      private var trainers:Array;
      private var scene:Sprite;
      private var ui:Sprite;
      private var actors:Array = [];
      private var heads:Array = [];
      private var rows:Array = [];
      private var hits:Array = [];
      private var detail:Sprite;
      private var progressText:TextField;
      private var groupText:TextField;
      private var action:Sprite;
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
         plaque(ui,230,18,400,65,catalog.id==3?0x493c40:0x304e47);
         text(ui,catalog.name+" · "+catalog.title,253,23,370,31,23,0xffedb1,true);
         text(ui,"16位守擂者  /  固定六宠  /  100级",281,55,335,24,13,0xe4e9ce);
         travel("空间站",18,91,102);
         for(i=0;i<ARENAS.length;i++)travel(ARENAS[i].name+"擂台",256+i*126,94,ARENAS[i].mapId);
         if(catalog.id==1){
            text(ui,"参赛选手",31,137,170,26,17,0x244c52,true);
            button(ui,"前八席",27,383,81,25,function(e:MouseEvent):void{showGroup(0);select(0);},0x557e8b);
            button(ui,"后八席",115,383,81,25,function(e:MouseEvent):void{showGroup(1);select(8);},0x557e8b);
            progressText=text(ui,"读取进度…",30,413,180,43,13,0x244c5a);
         }else{
            plaque(ui,18,185,161,133,catalog.id==3?0x55424a:0x365947);
            text(ui,"候场区",52,194,120,25,17,0xffe7b0,true);
            groupText=text(ui,"第 1—8 席",44,224,132,24,14,0xf5e8c2);
            button(ui,"前八席",30,257,65,26,function(e:MouseEvent):void{showGroup(0);select(0);},0x536b5c);
            button(ui,"后八席",101,257,65,26,function(e:MouseEvent):void{showGroup(1);select(8);},0x536b5c);
            plaque(ui,240,126,475,32,catalog.id==3?0x473e48:0x3e6254);
            progressText=text(ui,"正在读取参赛进度…",254,132,455,25,14,0xffefc5,true);
            text(ui,"点击赛尔交谈，查看六宠阵容",23,324,170,43,12,0xffedc1);
         }
         plaque(ui,772,164,168,137,catalog.id==3?0x594741:0x456248);
         text(ui,"冠军殿",813,170,116,25,17,0xffe9a1,true);
         petHead(ui,catalog.rewardPetId,821,197,52);
         text(ui,catalog.rewardName,791,251,160,25,17,0xffedb1,true);
         text(ui,"Lv.100 · 种族值 "+catalog.rewardSpeciesTotal,786,276,158,23,11,0xf1e6cc);
         button(ui,"精灵背包",782,318,147,29,function(e:MouseEvent):void{PetBagController.show();},0x487c8a);
         button(ui,"仓库调队",782,354,147,29,function(e:MouseEvent):void{ModuleManager.showModule(ClientConfig.getAppModule("PetStorage"),"正在打开精灵仓库…");},0x487c8a);
         text(ui,"首冠一只 · 不重复发奖\n场间恢复体力与PP",784,391,151,45,12,0xffefd0);
         detail=new Sprite();detail.x=214;detail.y=420;ui.addChild(detail);
         action=button(ui,"读取中…",760,451,130,37,onAction,0xa27129);
         showGroup(0);
         SocketConnection.addCmdListener(91010,onProgress);
         PetManager.upDate();request(0);
      }

      private function plaque(parent:DisplayObjectContainer,x:Number,y:Number,w:Number,h:Number,color:uint):void
      {
         var plate:Sprite=new Sprite();plate.mouseEnabled=false;plate.graphics.lineStyle(3,0x302f32);plate.graphics.beginFill(color,0.94);plate.graphics.drawRoundRect(x,y,w,h,12,12);plate.graphics.endFill();plate.graphics.lineStyle(1,0xb9b598);plate.graphics.drawRoundRect(x+4,y+4,w-8,h-8,8,8);parent.addChild(plate);
      }

      private function travel(label:String,x:Number,y:Number,mapId:uint):void
      {
         var door:Sprite=button(ui,label,x,y,mapId==102?148:119,28,function(e:MouseEvent):void{if(mapId!=catalog.mapId)MapManager.changeMap(mapId);},mapId==catalog.mapId?0x8b763e:0x426c65);
         door.graphics.lineStyle(3,0x342f30);door.graphics.moveTo(10,29);door.graphics.lineTo(10,35);door.graphics.moveTo((mapId==102?148:119)-10,29);door.graphics.lineTo((mapId==102?148:119)-10,35);
      }

      private function paintPano():void
      {
         var g:Graphics=scene.graphics;
         g.beginFill(0x173b54);g.drawRect(0,0,960,560);g.endFill();
         g.beginFill(0x2e6079);g.drawRoundRect(8,92,944,426,46,46);g.endFill();
         g.beginFill(0xdbe5dc);g.drawRoundRect(17,133,190,329,20,20);g.endFill();
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
         for each(var row:Sprite in rows)if(row.parent)row.parent.removeChild(row);
         for each(var hit:Sprite in hits)if(hit.parent)hit.parent.removeChild(hit);
         actors=[];rows=[];hits=[];group=value;
         if(groupText)groupText.text=group==0?"第 1—8 席":"第 9—16 席";
         for(var index:uint=group*8;index<Math.min((group+1)*8,trainers.length);index++)addTrainer(index);
      }

      private function addTrainer(index:uint):void
      {
         var trainer:Object=trainers[index];var slot:uint=index%8;
         if(catalog.id==1){var row:Sprite=button(ui,(index+1)+" "+trainer.name+" · "+styleName(trainer.style),27,169+slot*26,170,23,function(e:MouseEvent):void{select(index);},0x557e8b);row.alpha=index<nextStage?0.5:1;rows.push(row);}
         var pos:Point;
         if(catalog.id==1)pos=new Point(280+(slot%4)*130,slot<4?245:352);
         else pos=new Point([254,382,567,697,254,382,567,697][slot],[245,228,228,245,358,383,383,358][slot]);
         var info:UserInfo=new UserInfo();info.userID=99008001+catalog.id*100+index;info.nick=trainer.name;info.color=trainer.color;info.direction=0;info.pos=pos;info.spiritID=trainer.signaturePetId;info.spiritTime=1000000000+index;info.petDV=31;
         var model:PeopleModel=new PeopleModel(info);model.mouseEnabled=false;model.mouseChildren=false;depthLevel.addChild(model);actors.push(model);
         var hit:Sprite=new Sprite();hit.graphics.beginFill(0xffffff,0.01);hit.graphics.drawEllipse(pos.x-35,pos.y-71,73,95);hit.graphics.endFill();hit.buttonMode=true;hit.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void{select(index);Alarm.show(trainer.quote);});ui.addChild(hit);hits.push(hit);
      }

      private function styleName(style:String):String{return {aggressive:"强攻",defensive:"坚守",tactical:"战术",balanced:"均衡"}[style];}
      private function select(index:uint):void
      {
         showGroup(uint(index/8));
         while(detail.numChildren){var removed:DisplayObject=detail.removeChildAt(0);if(removed is Loader){var old:Loader=removed as Loader;heads.splice(heads.indexOf(old),1);old.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR,onImageError);old.unloadAndStop();}}
         detail.graphics.clear();detail.graphics.lineStyle(2,0x2c3d38);detail.graphics.beginFill(catalog.id==3?0x493d49:0x34554a,0.95);detail.graphics.drawRoundRect(-7,-4,534,77,10,10);detail.graphics.endFill();
         var trainer:Object=trainers[index];text(detail,(index+1)+"号 "+trainer.name+" · "+trainer.title+" / "+styleName(trainer.style),0,0,520,22,15,0xffe4a7,true);
         text(detail,trainer.description,0,23,520,19,11,0xdee8d2);
         for(var i:int=0;i<trainer.team.length;i++){var pet:Object=trainer.team[i];petHead(detail,pet.petId,4+i*86,43,28);text(detail,PetXMLInfo.getName(pet.petId),34+i*86,48,58,22,10,0xe9e8d7);}
      }

      private function onAction(event:MouseEvent):void
      {
         if(!ready||busy)return;
         if(nextStage<trainers.length){select(nextStage);PetFightModel.mode=PetFightModel.MULTI_MODE;PetFightModel.status=PetFightModel.FIGHT_WITH_NPC;PetFightModel.enemyName=trainers[nextStage].name;request(1);}
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
         for(var i:int=0;i<rows.length;i++)rows[i].alpha=group*8+i<nextStage?0.5:1;
         progressText.text=nextStage<count?"已击败 "+nextStage+" / "+count+" 位选手"+(catalog.id==1?"\n下一位：":"   下一位：")+trainers[nextStage].name:"16擂全胜 · "+catalog.name+"冠军";
         (action.getChildAt(0) as TextField).text=nextStage<count?"攻擂 · "+trainers[nextStage].name:(claimed?"再次攻擂":"领取冠军精灵");
         select(Math.min(nextStage,trainers.length-1));
         if(operation==2){PetManager.upDate();Alarm.show("冠军奖励：100级"+catalog.rewardName+"已发放。背包满时进入仓库；本星系每号仅领一次。");}
         if(operation==3)Alarm.show("新一轮攻擂已开始。本星系冠军精灵不会重复发放。");
      }
      private function text(parent:DisplayObjectContainer,value:String,x:Number,y:Number,width:Number,height:Number,size:uint,color:uint,bold:Boolean=false):TextField
      {
         var field:TextField=new TextField();field.defaultTextFormat=new TextFormat("宋体",size,color,bold);field.text=value;field.x=x;field.y=y;field.width=width;field.height=height;field.selectable=false;field.mouseEnabled=false;field.wordWrap=true;parent.addChild(field);return field;
      }
      private function button(parent:DisplayObjectContainer,value:String,x:Number,y:Number,width:Number,height:Number,callback:Function,color:uint):Sprite
      {
         var item:Sprite=new Sprite();item.graphics.lineStyle(2,0xd3cfac);item.graphics.beginFill(color);item.graphics.drawRoundRect(0,0,width,height,10,10);item.graphics.endFill();var field:TextField=text(item,value,4,Math.max(2,(height-21)/2),width-8,25,13,0xffffff,true);var format:TextFormat=field.defaultTextFormat;format.align="center";field.setTextFormat(format);field.defaultTextFormat=format;item.x=x;item.y=y;item.buttonMode=true;item.mouseChildren=false;item.addEventListener(MouseEvent.CLICK,callback);parent.addChild(item);return item;
      }
      private function petHead(parent:DisplayObjectContainer,petId:uint,x:Number,y:Number,size:Number):void
      {
         var loader:Loader=new Loader();loader.x=x;loader.y=y;loader.scaleX=loader.scaleY=size/80;loader.mouseEnabled=false;loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,onImageError);parent.addChild(loader);heads.push(loader);loader.load(new URLRequest(ClientConfig.getResPath("pet/head/"+petId+".swf")));
      }
      private function onImageError(event:IOErrorEvent):void{Alarm.show("精灵头像加载失败，请刷新游戏后重试。");}
      override public function destroy():void
      {
         clearTimeout(timeout);SocketConnection.removeCmdListener(91010,onProgress);
         for each(var actor:PeopleModel in actors)actor.destroy();actors=[];
         for each(var loader:Loader in heads){loader.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR,onImageError);loader.unloadAndStop();}heads=[];
         if(ui&&ui.parent)ui.parent.removeChild(ui);scene=null;ui=null;
      }
   }
}
