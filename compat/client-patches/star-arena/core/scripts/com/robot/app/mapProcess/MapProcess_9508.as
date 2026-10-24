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
   import com.robot.core.mode.BasePeoleModel;
   import com.robot.core.mode.PeopleModel;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.DisplayObject;
   import flash.display.DisplayObjectContainer;
   import flash.display.Loader;
   import flash.display.Sprite;
   import flash.display.Graphics;
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
   public class MapProcess_9508 extends BaseMapProcess
   {
      private const TRAINERS:Array = []; // @STAR_ARENA_TRAINERS@
      private var scene:Sprite;
      private var ui:Sprite;
      private var actors:Array = [];
      private var loads:Array = [];
      private var labels:Array = [];
      private var group:uint = 0;
      private var trainerHits:Array = [];
      private var detail:Sprite;
      private var progressText:TextField;
      private var action:Sprite;
      private var selected:uint = 0;
      private var nextStage:uint = 0;
      private var claimed:Boolean = false;
      private var champion:Boolean = false;
      private var ready:Boolean = false;
      private var busy:Boolean = false;
      private var timeout:uint;
      public function MapProcess_9508(){super();}
      override protected function init():void
      {
         var child:DisplayObject;
         for(var i:int=0;i<conLevel.numChildren;i++)conLevel.getChildAt(i).visible=false;
         for(i=0;i<btnLevel.numChildren;i++)btnLevel.getChildAt(i).visible=false;
         for(i=0;i<topLevel.numChildren;i++)topLevel.getChildAt(i).visible=false;
         for(i=0;i<animatorLevel.numChildren;i++)animatorLevel.getChildAt(i).visible=false;
         for(i=0;i<depthLevel.numChildren;i++){child=depthLevel.getChildAt(i);if(!(child is BasePeoleModel))child.visible=false;}
         scene=new Sprite();scene.mouseEnabled=false;scene.mouseChildren=false;
         ui=new Sprite();conLevel.addChild(ui);
         paint();
         MapManager.currentMap.backLevel.bitmapData.draw(scene);
         var grid:Array=MapManager.currentMap.data;
         var size:uint=MapManager.currentMap.gridSize;
         for(var gx:int=0;gx<MapManager.currentMap.gridX;gx++)
            for(var gy:int=0;gy<MapManager.currentMap.gridY;gy++)
               grid[gx][gy]=(gx*size>214&&gx*size<735&&gy*size>154&&gy*size<410);
         button(ui,"返回空间站",18,18,128,32,function(e:MouseEvent):void{MapManager.changeMap(102);},0x346b88);
         text(ui,"帕诺 · 星系擂台",336,24,350,32,26,0xffefb4,true);
         text(ui,"16位守擂者 · 固定六宠 · 连战夺冠",321,59,420,24,14,0xd0e8ef);
         text(ui,"参赛选手",32,109,160,26,18,0x183f52,true);
         for(i=0;i<Math.min(8,TRAINERS.length);i++)addTrainer(i);
         button(ui,"1—8位",27,378,81,25,function(e:MouseEvent):void{showGroup(0);select(0);},0x557e8b);
         button(ui,"9—16位",115,378,81,25,function(e:MouseEvent):void{showGroup(1);select(8);},0x557e8b);
         progressText=text(ui,"正在读取参赛进度…",30,410,180,42,13,0x244c5a);
         text(ui,"冠军专属",766,115,160,28,19,0x69491c,true);
         petHead(ui,3406,800,151,64);
         text(ui,"圣霆雷伊",774,220,170,25,19,0x5c431c,true);
         text(ui,"Lv.100 · 种族值 710\n魂印与第五技能已解锁\n首次夺冠后，每号仅领一次",755,251,190,66,12,0x344e60);
         button(ui,"精灵背包",761,329,173,31,function(e:MouseEvent):void{PetBagController.show();},0x427ba0);
         button(ui,"仓库调队",761,367,173,31,function(e:MouseEvent):void{ModuleManager.showModule(ClientConfig.getAppModule("PetStorage"),"正在打开精灵仓库…");},0x427ba0);
         detail=new Sprite();ui.addChild(detail);detail.x=222;detail.y=420;
         action=button(ui,"读取中…",760,451,130,37,onAction,0xa27129);
         SocketConnection.addCmdListener(91010,onProgress);
         PetManager.upDate();request(0);
      }
      private function paint():void
      {
         var g:Graphics=scene.graphics;
         g.beginFill(0x173b54);g.drawRect(0,0,960,560);g.endFill();
         g.beginFill(0x2e6079);g.drawRoundRect(8,92,944,426,46,46);g.endFill();
         g.beginFill(0x91b3bf);g.drawEllipse(171,154,586,292);g.endFill();
         g.beginFill(0x567c91);g.drawEllipse(183,160,562,266);g.endFill();
         g.lineStyle(5,0xd2e0d5);g.beginFill(0xa5c0be);g.drawEllipse(208,169,511,236);g.endFill();
         g.lineStyle(3,0x477a89);g.drawEllipse(257,192,413,183);
         g.lineStyle(2,0xd1e5dc);g.drawEllipse(324,213,281,133);g.moveTo(466,175);g.lineTo(466,397);
         g.lineStyle(0);g.beginFill(0xd1bd76);g.drawEllipse(424,249,85,64);g.endFill();
         g.lineStyle(3,0x775e31);g.moveTo(441,288);g.lineTo(436,265);g.lineTo(451,277);g.lineTo(467,256);g.lineTo(482,277);g.lineTo(497,265);g.lineTo(492,288);g.lineTo(441,288);
         g.lineStyle(0);g.beginFill(0xdbe5dc);g.drawRoundRect(17,97,190,365,20,20);g.endFill();
         g.beginFill(0xe1d7ac);g.drawRoundRect(746,100,196,219,24,24);g.endFill();
         for(var i:int=0;i<42;i++){
            var x:Number=217+i*12.3;var y:Number=119+(i%3)*8;
            g.beginFill(i%2?0x77a0af:0x9db7bd);g.drawCircle(x,y,5);g.drawRoundRect(x-6,y+5,12,14,4,4);g.endFill();
         }
         for(i=0;i<TRAINERS.length;i++){
            x=225+i*(500/TRAINERS.length);g.lineStyle(2,0xdec98d);g.moveTo(x,4);g.lineTo(x,62);
            g.beginFill(uint(TRAINERS[i].color));g.moveTo(x,9);g.lineTo(x+29,9);g.lineTo(x+29,40);g.lineTo(x+15,49);g.lineTo(x,40);g.lineTo(x,9);g.endFill();
         }
         text(ui,"每场后恢复体力与PP · 场间可调队 · 禁止使用背包药品和胶囊",226,394,520,22,12,0xd8e8e9);
      }
      private function showGroup(value:uint):void
      {
         if(value==group&&actors.length>0)return;
         for each(var actor:PeopleModel in actors)actor.destroy();
         for each(var row:Sprite in labels)if(row.parent)row.parent.removeChild(row);
         for each(var hit:Sprite in trainerHits)if(hit.parent)hit.parent.removeChild(hit);
         actors=[];labels=[];trainerHits=[];group=value;
         for(var index:uint=group*8;index<Math.min((group+1)*8,TRAINERS.length);index++)addTrainer(index);
      }
      private function addTrainer(index:uint):void
      {
         var trainer:Object=TRAINERS[index];
         var slot:uint=index%8;
         var row:Sprite=button(ui,(index+1)+"  "+trainer.name+" · "+styleName(trainer.style),27,143+slot*29,170,25,function(e:MouseEvent):void{select(index);},0x557e8b);
         row.alpha=index<nextStage?0.5:1;
         labels.push(row);
         var pos:Point=new Point(280+(slot%4)*130, slot<4?245:352);
         var info:UserInfo=new UserInfo();info.userID=99008001+index;info.nick=trainer.name;info.color=trainer.color;info.direction=0;info.pos=pos;
         info.spiritID=trainer.signaturePetId;info.spiritTime=1000000000+index;info.petDV=31;
         var model:PeopleModel=new PeopleModel(info);model.mouseEnabled=false;model.mouseChildren=false;depthLevel.addChild(model);actors.push(model);
         var hit:Sprite=new Sprite();hit.graphics.beginFill(0xffffff,0.01);hit.graphics.drawEllipse(pos.x-35,pos.y-71,73,95);hit.graphics.endFill();hit.buttonMode=true;
         hit.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void{select(index);Alarm.show(trainer.quote);});ui.addChild(hit);trainerHits.push(hit);
      }
      private function styleName(style:String):String{return {aggressive:"强攻",defensive:"坚守",tactical:"战术",balanced:"均衡"}[style];}
      private function select(index:uint):void
      {
         selected=index;
         showGroup(uint(index/8));
         while(detail.numChildren){
            var removed:DisplayObject=detail.removeChildAt(0);
            if(removed is Loader){
               var oldHead:Loader=removed as Loader;
               loads.splice(loads.indexOf(oldHead),1);
               oldHead.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR,onImageError);
               oldHead.unloadAndStop();
            }
         }
         var t:Object=TRAINERS[index];
         text(detail,t.name+" · "+t.title,0,0,520,24,17,0xffedbb,true);
         text(detail,t.description,0,24,520,20,12,0xe0eceb);
         for(var i:int=0;i<t.team.length;i++){
            var pet:Object=t.team[i];petHead(detail,pet.petId,5+i*83,47,31);
            text(detail,PetXMLInfo.getName(pet.petId),35+i*83,52,62,24,10,0xe0eceb);
         }
      }
      private function onAction(event:MouseEvent):void
      {
         if(!ready||busy)return;
         if(nextStage<TRAINERS.length){
            select(nextStage);PetFightModel.mode=PetFightModel.MULTI_MODE;PetFightModel.status=PetFightModel.FIGHT_WITH_NPC;PetFightModel.enemyName=TRAINERS[nextStage].name;
            request(1);
         }else request(claimed?3:2);
      }
      private function request(operation:uint):void
      {
         if(busy)return;busy=true;timeout=setTimeout(onTimeout,8000);SocketConnection.send(91010,operation,nextStage);
      }
      private function onTimeout():void
      {
         busy=false;Alarm.show("未收到擂台操作结果。请重新进入擂台确认进度，不会自动重复挑战或领奖。");
      }
      private function onProgress(event:SocketEvent):void
      {
         var data:ByteArray=event.data as ByteArray;
         if(data==null||data.bytesAvailable!=32)return;
         var operation:uint=data.readUnsignedInt();var version:uint=data.readUnsignedInt();
         if(version!=1)return;
         clearTimeout(timeout);busy=false;ready=true;nextStage=data.readUnsignedInt();var count:uint=data.readUnsignedInt();var reward:uint=data.readUnsignedInt();claimed=data.readUnsignedInt()!=0;champion=data.readUnsignedInt()!=0;data.readUnsignedInt();
         if(count!=TRAINERS.length||reward!=3406||nextStage>count){ready=false;Alarm.show("擂台数据版本不一致，请刷新游戏。");return;}
         showGroup(uint(Math.min(nextStage,count-1)/8));
         for(var i:int=0;i<labels.length;i++)labels[i].alpha=group*8+i<nextStage?0.5:1;
         progressText.text=nextStage<count?"已击败 "+nextStage+" / "+count+" 位选手\n下一位："+TRAINERS[nextStage].name:"16擂全胜 · 帕诺冠军";
         (action.getChildAt(0) as TextField).text=nextStage<count?"攻擂 · "+TRAINERS[nextStage].name:(claimed?"再次攻擂":"领取圣霆雷伊");
         select(Math.min(nextStage,TRAINERS.length-1));
         if(operation==2){PetManager.upDate();Alarm.show("冠军奖励：100级圣霆雷伊已发放。背包已满时进入仓库；同一账号仅可领取一次。");}
         if(operation==3)Alarm.show("新一轮攻擂已开始。冠军精灵不会重复发放。");
      }
      private function text(parent:DisplayObjectContainer,value:String,x:Number,y:Number,width:Number,height:Number,size:uint,color:uint,bold:Boolean=false):TextField
      {
         var field:TextField=new TextField();field.defaultTextFormat=new TextFormat("宋体",size,color,bold);field.text=value;field.x=x;field.y=y;field.width=width;field.height=height;field.selectable=false;field.mouseEnabled=false;field.wordWrap=true;parent.addChild(field);return field;
      }
      private function button(parent:DisplayObjectContainer,value:String,x:Number,y:Number,width:Number,height:Number,callback:Function,color:uint):Sprite
      {
         var item:Sprite=new Sprite();item.graphics.lineStyle(2,0xd5d9c0);item.graphics.beginFill(color);item.graphics.drawRoundRect(0,0,width,height,12,12);item.graphics.endFill();
         var field:TextField=text(item,value,4,Math.max(2,(height-21)/2),width-8,25,13,0xffffff,true);var format:TextFormat=field.defaultTextFormat;format.align="center";field.setTextFormat(format);field.defaultTextFormat=format;
         item.x=x;item.y=y;item.buttonMode=true;item.mouseChildren=false;item.addEventListener(MouseEvent.CLICK,callback);parent.addChild(item);return item;
      }
      private function petHead(parent:DisplayObjectContainer,petId:uint,x:Number,y:Number,size:Number):void
      {
         var loader:Loader=new Loader();loader.x=x;loader.y=y;loader.scaleX=loader.scaleY=size/80;loader.mouseEnabled=false;loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,onImageError);parent.addChild(loader);loads.push(loader);loader.load(new URLRequest(ClientConfig.getResPath("pet/head/"+petId+".swf")));
      }
      private function onImageError(event:IOErrorEvent):void{Alarm.show("选手精灵头像加载失败，请刷新游戏后重试。");}
      override public function destroy():void
      {
         clearTimeout(timeout);SocketConnection.removeCmdListener(91010,onProgress);
         for each(var actor:PeopleModel in actors)actor.destroy();actors=[];
         for each(var loader:Loader in loads){loader.contentLoaderInfo.removeEventListener(IOErrorEvent.IO_ERROR,onImageError);loader.unloadAndStop();}loads=[];
         if(scene&&scene.parent)scene.parent.removeChild(scene);if(ui&&ui.parent)ui.parent.removeChild(ui);scene=null;ui=null;
      }
   }
}
