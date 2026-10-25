package com.robot.module.book
{
   import com.robot.core.config.ClientConfig;
   import com.robot.core.event.PetEvent;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.manager.UIManager;
   import com.robot.core.net.SocketConnection;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.filters.GlowFilter;
   import flash.display.GradientType;
   import flash.geom.Matrix;
   import flash.geom.Rectangle;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.events.TimerEvent;
   import flash.utils.Timer;
   import org.taomee.events.SocketErrorEvent;
   import org.taomee.net.SocketDispatcher;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.ResourceManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;

   public class PetCountermarkBookPanel extends Sprite implements IModule
   {
      private var ui:Sprite;
      private var body:Sprite;
      private var state:XML;
      private var petTime:uint = 0;
      private var markId:uint = 0;
      private var kind:String = "ability";
      private var pending:Boolean = false;
      private var uncertain:Boolean = false;
      private var requestTimer:Timer = new Timer(15000,1);
      private var visiblePanel:Boolean = false;
      private var message:String = "正在读取刻印资料…";
      private var portraitURL:String = "";
      private var portraitBox:Sprite;
      private var wantedPortrait:uint = 0;
      private var petLoads:Array = [];
      private var generation:uint = 0;
      public function PetCountermarkBookPanel() { super(); }
      public function init(data:Object = null):void {
         if(data != null && data.catchTime != null) petTime = uint(data.catchTime);
      }
      public function setup():void {
         if(ui != null) return;
         ui = new Sprite();ui.name="countermarkPanel";
         var frame:Sprite = UIManager.getSprite("Panel_Background");
         frame.scale9Grid = new Rectangle(16,32,frame.width-32,frame.height-48);
         frame.width = 920; frame.height = 520;
         frame.mouseChildren = false;
         ui.addChild(frame);
         var title:TextField = label(ui,"精灵刻印",31,18,230,29,20,0xFFFFFF,true);
         title.filters = [new GlowFilter(676248,0.8,4,4,10)];
         label(ui,"为精灵装上专属刻印",261,29,310,25,13,0x163F62);
         button(ui,"关闭",829,19,65,32,"close");
         ui.addEventListener(MouseEvent.CLICK,onClick);
         body=new Sprite();ui.addChild(body);
      }

      public function show():void {
         setup(); if(visiblePanel) return;
         visiblePanel = true; ui.x = 20; ui.y = 20;
         LevelManager.appLevel.addChild(ui);
         SocketConnection.addCmdListener(2311,onResponse);
         PetManager.addEventListener(PetEvent.UPDATE_INFO,onPetUpdate);
         SocketDispatcher.getInstance().addEventListener(SocketErrorEvent.ERROR,onSocketError);
         requestTimer.addEventListener(TimerEvent.TIMER_COMPLETE,onTimeout);
         draw(); request(0);
      }
      public function hide():void {
         visiblePanel = false; pending = false;
         SocketConnection.removeCmdListener(2311,onResponse);
         PetManager.removeEventListener(PetEvent.UPDATE_INFO,onPetUpdate);
         SocketDispatcher.getInstance().removeEventListener(SocketErrorEvent.ERROR,onSocketError);
         requestTimer.stop();
         requestTimer.removeEventListener(TimerEvent.TIMER_COMPLETE,onTimeout);
         cancelPortrait();
         if(ui != null && ui.parent != null) ui.parent.removeChild(ui);
      }
      public function destroy():void {
         hide(); if(ui != null) ui.removeEventListener(MouseEvent.CLICK,onClick);
         ui = null; body = null; state = null;
      }
      private function cancelPortrait():void {
         generation++;
         if(portraitURL != "") ResourceManager.cancel(portraitURL,onPortrait);
         for each(var load:Object in petLoads) ResourceManager.cancel(load.url,load.callback);
         petLoads = []; portraitURL = ""; wantedPortrait = 0;
      }

      private function onPetUpdate(event:PetEvent):void { if(visiblePanel) draw(); }
      private function label(parent:Sprite,value:String,x:Number,y:Number,w:Number,h:Number,size:uint = 14,color:uint = 0xD7F0FF,bold:Boolean = false):TextField {
         var t:TextField = new TextField(); t.x=x; t.y=y; t.width=w; t.height=Math.max(h,Math.ceil(size*1.5)+4);
         t.defaultTextFormat = new TextFormat("宋体",size,color,bold);
         t.text=value; t.selectable=false; t.mouseEnabled=false; t.wordWrap=true; t.multiline=true;
         parent.addChild(t); return t;
      }
      private function plate(parent:Sprite,x:Number,y:Number,w:Number,h:Number,top:uint,bottom:uint,edge:uint,line:Number = 1):void {
         var matrix:Matrix=new Matrix();matrix.createGradientBox(w,h,Math.PI/2,x,y);
         parent.graphics.lineStyle(line,edge);parent.graphics.beginGradientFill(GradientType.LINEAR,[top,bottom],[1,1],[0,255],matrix);
         parent.graphics.drawRoundRect(x,y,w,h,10,10);parent.graphics.endFill();
      }
      private function button(parent:Sprite,title:String,x:Number,y:Number,w:Number,h:Number,action:String,enabled:Boolean = true):Sprite {
         var b:Sprite=new Sprite(); b.x=x; b.y=y; b.name=action; b.buttonMode=true;
         var selected:Boolean=action=="tab:"+kind;
         var skin:SimpleButton;
         if(action=="close") skin=UIManager.getButton("Close_Btn");
         else {
            var up:DisplayObject=UIManager.getDisplayObject("Button_upSkin");
            var over:DisplayObject=UIManager.getDisplayObject("Button_overSkin");
            var down:DisplayObject=UIManager.getDisplayObject("Button_downSkin");
            up.width=over.width=down.width=w; up.height=over.height=down.height=h;
            skin=new SimpleButton(selected?down:up,over,down,up);
         }
         skin.name=action; skin.width=action=="close"?26:w; skin.height=action=="close"?26:h;
         if(action=="close") skin.x=w-26;
         b.addChild(skin);
         if(action!="close") {
            var t:TextField=label(b,title,4,Math.max(1,(h-22)/2),w-8,h-2,12,0xFFFFFF,true);
            var f:TextFormat=t.defaultTextFormat; f.align="center"; t.setTextFormat(f);
            t.filters = [new GlowFilter(676248,0.8,4,4,10)];
            b.mouseEnabled=enabled&&!pending&&(!uncertain||action=="refresh");
            b.mouseChildren=b.mouseEnabled; skin.enabled=b.mouseEnabled; b.alpha=b.mouseEnabled?1:0.55;
         }
         parent.addChild(b);
         return b;
      }
      private function shape(s:Sprite,points:Array,fill:uint,edge:uint = 0xF7EDCA):void {
         s.graphics.lineStyle(1.4,edge);s.graphics.beginFill(fill);
         s.graphics.moveTo(points[0],points[1]);
         for(var i:int=2;i<points.length;i+=2)s.graphics.lineTo(points[i],points[i+1]);
         s.graphics.lineTo(points[0],points[1]);s.graphics.endFill();
      }
      private function bagPets():Array {
         var result:Array=[];
         if(state!=null) for each(var p:XML in state.pets.pet) if(String(p.@inBag)=="1"||String(p.@inBag)=="true") result.push(p);
         return result;
      }
      private function selectedPet():XML {
         if(state == null) return null;
         for each(var p:XML in bagPets()) if(uint(p.@catchTime)==petTime) return p;
         return null;
      }
      private function selectedMark():XML { return findMark(markId); }
      private function findMark(id:uint):XML {
         if(state != null) for each(var m:XML in state.catalog.mark) if(uint(m.@id)==id) return m;
         return null;
      }
      private function count(id:uint):uint {
         if(state != null) for each(var item:XML in state.inventory.mark) if(uint(item.@id)==id) return uint(item.@count);
         return 0;
      }
      // Each identifier has its own original vector emblem; the same drawing is used in inventory, details and equipped sockets.
      private function badge(parent:Sprite,x:Number,y:Number,id:uint,size:Number):Sprite {
         var s:Sprite=new Sprite();s.x=x;s.y=y;s.name="badge:"+id;s.scaleX=s.scaleY=size/60;s.mouseEnabled=false;s.mouseChildren=false;
         var color:uint=id==10001?0xF07B65:id==10002?0x65A9EB:id==10003?0xC396F8:id==10004?0x71DAD9:id==10005?0x91D988:id==10006?0xF29AB8:id==20001?0xF6B862:0xF4DF75;
         s.graphics.lineStyle(2.2,0x0B3556);s.graphics.beginFill(color);s.graphics.drawCircle(0,0,27);s.graphics.endFill();
         var matrix:Matrix=new Matrix();matrix.createGradientBox(44,44,Math.PI/2,-22,-22);
         s.graphics.lineStyle(1,0xFFFFFF,0.6);s.graphics.beginGradientFill(GradientType.LINEAR,[color,0x23476B],[1,0.7],[0,255],matrix);s.graphics.drawCircle(0,0,23);s.graphics.endFill();
         s.graphics.lineStyle();s.graphics.beginFill(0xFFFFFF,0.25);s.graphics.drawEllipse(-17,-19,24,9);s.graphics.endFill();
         if(id==10001) {
            shape(s,[-3,9,3,3,3,-13,0,-19,-3,-13,-3,1,-9,7],0xFFEAC8);
            shape(s,[-11,3,-7,-1,6,12,2,16],0xCE9B4B);shape(s,[-8,13,-5,10,-1,14,-4,18],0xFFE3A8);
            s.graphics.lineStyle(1,0xFFFFFF);s.graphics.moveTo(0,-13);s.graphics.lineTo(0,1);
         } else if(id==10002) {
            shape(s,[-14,-12,0,-17,14,-12,12,5,6,14,0,19,-6,14,-12,5],0xAACEEF);
            shape(s,[-9,-8,0,-12,9,-8,8,3,0,13,-8,3],0x245C93);
            s.graphics.lineStyle(2,0xE2F6FF);s.graphics.moveTo(0,-10);s.graphics.lineTo(0,12);s.graphics.moveTo(-8,-5);s.graphics.lineTo(8,-5);
         } else if(id==10003) {
            shape(s,[0,-20,5,-6,18,0,5,5,0,19,-5,5,-18,0,-5,-6],0xF2E6FF);
            shape(s,[0,-10,4,0,0,10,-4,0],0x9D69DE);
            s.graphics.lineStyle(1.5,0xE9CEFF);s.graphics.drawEllipse(-20,-8,40,16);s.graphics.beginFill(0xFFF1C3);s.graphics.drawCircle(17,-7,2);s.graphics.endFill();
         } else if(id==10004) {
            shape(s,[-17,-10,0,-19,17,-10,17,5,0,20,-17,5],0x163F67);
            shape(s,[-11,-7,0,-13,11,-7,10,4,0,14,-10,4],0x8EF2E7);
            s.graphics.lineStyle(2,0xE1FFFA);s.graphics.moveTo(-20,-1);s.graphics.lineTo(0,-12);s.graphics.lineTo(20,-1);s.graphics.moveTo(-20,6);s.graphics.lineTo(0,18);s.graphics.lineTo(20,6);
            shape(s,[0,-6,4,1,0,8,-4,1],0xDDFDF1);
         } else if(id==10005) {
            shape(s,[-18,10,-14,-4,17,-18,11,-6,3,-2,11,-3,6,6,-3,8,4,8,-3,16,-12,18],0xDDF7CC);
            s.graphics.lineStyle(2,0x68B86F);s.graphics.moveTo(-13,11);s.graphics.lineTo(10,-9);
            s.graphics.lineStyle(1,0xE8FFDE);s.graphics.moveTo(-20,-10);s.graphics.lineTo(-11,-13);s.graphics.moveTo(-22,-3);s.graphics.lineTo(-14,-6);
         } else if(id==10006) {
            s.graphics.lineStyle(1.6,0xFFE8EB);s.graphics.beginFill(0xFFD0D8);
            s.graphics.moveTo(0,17);s.graphics.curveTo(-23,0,-14,-11);s.graphics.curveTo(-6,-20,0,-9);s.graphics.curveTo(7,-21,15,-11);s.graphics.curveTo(24,0,0,17);s.graphics.endFill();
            s.graphics.lineStyle(2,0xB34A72);s.graphics.moveTo(-13,0);s.graphics.lineTo(-5,0);s.graphics.lineTo(-2,-6);s.graphics.lineTo(3,7);s.graphics.lineTo(6,0);s.graphics.lineTo(13,0);
         } else if(id==20001) {
            shape(s,[-3,-21,2,-13,14,-17,11,-6,22,-2,12,4,16,16,4,12,-2,22,-7,11,-19,14,-14,3,-22,-4,-11,-8,-14,-19],0xF6C879,0xFFEAC0);
            shape(s,[-9,-5,-5,-10,0,-8,5,-9,10,-5,10,6,4,12,-6,9,-11,2],0xB66431,0xFFF1CE);
            s.graphics.lineStyle(1.5,0xFFE5AD);s.graphics.moveTo(-5,-7);s.graphics.lineTo(-5,0);s.graphics.moveTo(0,-6);s.graphics.lineTo(0,0);s.graphics.moveTo(5,-6);s.graphics.lineTo(5,1);
         } else if(id==20002) {
            shape(s,[-3,-21,13,-21,3,-6,16,-6,-9,22,-3,4,-15,4],0xFFF1A0);
            s.graphics.lineStyle(2,0xF7B55A);s.graphics.moveTo(-21,-10);s.graphics.lineTo(-11,-15);s.graphics.moveTo(-22,-1);s.graphics.lineTo(-13,-5);s.graphics.moveTo(13,10);s.graphics.lineTo(21,5);
         }
         parent.addChild(s);return s;
      }
      private function socket(x:Number,y:Number,id:uint,title:String,active:Boolean):void {
         var s:Sprite=new Sprite();s.x=x;s.y=y;body.addChild(s);
         s.graphics.lineStyle(2,active?0xFFE59A:0xB8CAD5);s.graphics.beginFill(0x0C2947);s.graphics.drawCircle(0,0,26);s.graphics.endFill();
         s.graphics.lineStyle(1,0x4D92B9);s.graphics.drawCircle(0,0,21);
         if(id!=0) badge(s,0,0,id,42);
         else centerLabel(s,"空",-19,-12,38,24,13,0x76A2BF);
         centerLabel(body,title,x-47,y+31,94,22,12,active?0xFFE59A:0xB5D9EC);
      }
      private function centerLabel(parent:Sprite,value:String,x:Number,y:Number,w:Number,h:Number,size:uint,color:uint,bold:Boolean=false):TextField {
         var t:TextField=label(parent,value,x,y,w,h,size,color,bold);var f:TextFormat=t.defaultTextFormat;f.align="center";t.setTextFormat(f);return t;
      }
      private function draw():void {
         if(body==null) return;
         cancelPortrait();while(body.numChildren>0) body.removeChildAt(0);body.graphics.clear();
         plate(body,20,78,226,351,0x204D77,0x18395F,0x0C3C66,2);
         plate(body,257,78,309,351,0x204D77,0x18395F,0x0C3C66,2);
         plate(body,577,78,322,351,0x204D77,0x18395F,0x0C3C66,2);
         label(body,"背包精灵",32,88,200,28,17,0xF1FBFF,true);
         if(state!=null) {
            label(body,"赛尔豆",626,29,60,25,13,0x163F62);
            label(body,String(state.@coins),692,25,114,29,18,0x163F62,true);
         }
         var pets:Array=bagPets();
         if(pets.length==0) label(body,pending?"正在读取背包…":"请先放入背包精灵",34,166,195,50,14,0xC4E2F2);
         for(var i:int=0;i<pets.length&&i<6;i++) {
            var p:XML=pets[i];var card:Sprite=new Sprite();card.x=31;card.y=123+i*44;card.name="pet:"+p.@catchTime;card.buttonMode=true;card.mouseChildren=false;
            var selected:Boolean=uint(p.@catchTime)==petTime;
            plate(card,0,0,203,38,selected?0x458DB9:0x245C8B,selected?0x28648D:0x1B4A76,selected?0xFFE58D:0x0F3559,selected?2:1);
            var thumb:Sprite=new Sprite();card.addChild(thumb);loadThumbnail(thumb,uint(p.@id));
            label(card,String(p.@name),46,3,150,22,12,selected?0xFFF0AA:0xE1F2FD,true);
            label(card,"等级 "+p.@level,47,21,147,17,9,0xB9D8EC);
            card.mouseEnabled=!pending&&!uncertain;card.alpha=card.mouseEnabled?1:0.6;body.addChild(card);
         }
         label(body,"不足100级时，刻印效果停用",32,399,204,22,10,0xB6D6E9);
         button(body,"能力刻印",270,90,139,31,"tab:ability");button(body,"技能刻印",417,90,136,31,"tab:skill");
         var marks:Array=[];var item:XML;
         if(state!=null) for each(item in state.catalog.mark) if(String(item.@kind)==kind) marks.push(item);
         for(i=0;i<marks.length;i++) {
            var m:XML=marks[i];
            var x:Number=271+(i%2)*146;var y:Number=136+int(i/2)*86;
            var tile:Sprite=new Sprite();tile.x=x;tile.y=y;tile.name="mark:"+m.@id;tile.buttonMode=true;tile.mouseChildren=false;
            selected=markId==uint(m.@id);
            plate(tile,0,0,136,78,selected?0x347CA6:0x265C86,selected?0x245E88:0x1A456D,selected?0xFFE58D:0x0C355A,selected?2:1);
            badge(tile,31,28,uint(m.@id),45);
            var shortEffect:String=String(m.@description).replace("电光火石","").replace("撞击","");
            label(tile,shortEffect,62,10,69,25,12,selected?0xFFF0AC:0xC7E6F3,true);
            centerLabel(tile,String(m.@name),3,53,130,24,12,selected?0xFFF0AC:0xE1F3FF,true);
            label(tile,"库存×"+count(uint(m.@id)),62,31,70,20,10,count(uint(m.@id))>0?0xFFF0AC:0xAACBDE);
            tile.mouseEnabled=!pending&&!uncertain;tile.alpha=tile.mouseEnabled?1:0.6;body.addChild(tile);
         }
         if(kind=="skill") {
            label(body,"技能孔专用",278,256,270,31,18,0xFFF0A7,true);
            label(body,"刻印效果仅作用于对应技能。\n选择刻印，查看详细效果。",278,300,267,60,13,0xC4DFEF);
         }
         label(body,"库存为未装备数量",274,401,275,22,11,0xB6D6E9);
         var pet:XML=selectedPet();var mark:XML=selectedMark();
         if(pet!=null) {
            var petLevel:uint=uint(pet.@level);
            var abilityMark:uint=uint(pet.@ability);
            var skillMark:uint=uint(pet.@skill);
            var hasMark:Boolean=abilityMark>0||skillMark>0;
            label(body,String(pet.@name)+"  等级 "+petLevel,590,88,294,31,18,0xF3FAFF,true);
            label(body,hasMark?(petLevel>=100?"刻印效果已启用":"不足100级 · 刻印效果停用"):(petLevel>=100?"尚未装备刻印":"尚未装备 · 100级可用"),591,117,292,22,11,hasMark&&petLevel>=100?0xB0E6D9:(petLevel<100?0xFFE0A0:0xB5D9EC));
            portraitBox=new Sprite();portraitBox.x=654;portraitBox.y=194;portraitBox.mouseEnabled=false;portraitBox.mouseChildren=false;body.addChild(portraitBox);
            wantedPortrait=uint(pet.@id);portraitURL=ClientConfig.getPetSwfPath(wantedPortrait);ResourceManager.getResource(portraitURL,onPortrait,"pet");
            socket(762,176,abilityMark,"能力孔",petLevel>=100&&abilityMark>0);
            socket(848,176,skillMark,"技能孔",petLevel>=100&&skillMark>0);
            var names:Array=["体力","攻击","防御","特攻","特防","速度"];
            var vals:Array=[String(pet.@hp)+"/"+pet.@maxHp,String(pet.@atk),String(pet.attribute("def")),String(pet.@spAtk),String(pet.@spDef),String(pet.@speed)];
            for(i=0;i<6;i++) {
               var sx:Number=590+(i%3)*101;var sy:Number=255+int(i/3)*24;
               label(body,names[i],sx,sy,31,23,11,0xB8D8EC);label(body,vals[i],sx+32,sy-2,68,27,13,0xFFF0AF,true);
            }
         } else {
            centerLabel(body,pending?"正在读取精灵…":"未选择精灵",597,145,280,32,17,0xBDDCEA);
            socket(762,207,0,"能力孔",false);socket(848,207,0,"技能孔",false);
         }
         body.graphics.lineStyle(1,0x6CA2C1,0.6);body.graphics.moveTo(590,309);body.graphics.lineTo(887,309);
         if(mark!=null) {
            badge(body,617,341,markId,45);
            label(body,String(mark.@name),652,316,236,28,17,0xFFF0AB,true);
            label(body,String(mark.@description),652,345,235,33,12,0xE2F1FC);
            var same:Boolean=pet!=null&&uint(pet.attribute(kind))==markId;
            var status:String="库存×"+count(markId)+"  ·  本服兑换："+mark.@price+" 赛尔豆";
            label(body,status,590,365,297,24,11,0xBDDFE8);
            button(body,"兑换刻印",590,391,139,29,"buy",state!=null&&uint(state.@coins)>=uint(mark.@price));
            button(body,same?"卸下刻印":(pet!=null&&uint(pet.attribute(kind))!=0?"替换装备":"装备刻印"),740,391,147,29,same?"unequip":"equip",pet!=null&&(same||(count(markId)>0&&petLevel>=100)));
         }
         label(body,"100级可用；降级后装备保留，效果停用。更换刻印会返还原刻印。",25,443,864,25,12,0x163F62);
         label(body,pending?"请求处理中，请稍候…":message,25,481,772,27,13,0x163F62,true);
         button(body,"刷新",817,478,76,30,"refresh");
      }
      private function fitPet(content:DisplayObject,target:Sprite,cx:Number,cy:Number,w:Number,h:Number):void {
         var mc:MovieClip=content as MovieClip;if(mc!=null) DisplayUtil.stopAllMovieClip(mc);
         var bounds:Rectangle=content.getBounds(content);var ratio:Number=Math.min(w/Math.max(bounds.width,1),h/Math.max(bounds.height,1));
         content.scaleX=content.scaleY=ratio;content.x=cx-(bounds.x+bounds.width/2)*ratio;content.y=cy-(bounds.y+bounds.height/2)*ratio;
         target.addChild(content);
      }
      private function onPortrait(content:DisplayObject):void {
         if(!visiblePanel||portraitBox==null||wantedPortrait==0||content==null) return;
         fitPet(content,portraitBox,0,0,120,111);
      }
      private function loadThumbnail(target:Sprite,id:uint):void {
         var token:uint=generation;var url:String=ClientConfig.getPetSwfPath(id);
         var callback:Function=function(content:DisplayObject):void {
            if(visiblePanel&&token==generation&&content!=null) fitPet(content,target,22,19,35,33);
         };
         petLoads.push({url:url,callback:callback});ResourceManager.getResource(url,callback,"pet");
      }
      private function onClick(event:MouseEvent):void {
         var target:DisplayObject=event.target as DisplayObject; if(target==null) return;
         var action:String=target.name;
         if(action=="close") { hide(); return; }
         if(pending || (uncertain&&action!="refresh")) return;
         if(action.indexOf("pet:")==0) petTime=uint(action.split(":")[1]);
         else if(action.indexOf("mark:")==0) markId=uint(action.split(":")[1]);
         else if(action.indexOf("tab:")==0) { kind=action.split(":")[1]; markId=0; chooseMark(); }
         else if(action=="refresh") { request(0); return; }
         else if(action=="buy") { request(1); return; }
         else if(action=="equip") { request(2); return; }
         else if(action=="unequip") { request(3); return; }
         else return;
         draw();
      }
      private function chooseMark():void {
         if(state!=null&&findMark(markId)==null) for each(var m:XML in state.catalog.mark) if(String(m.@kind)==kind) { markId=uint(m.@id); break; }
      }
      private function request(op:uint):void {
         if(pending || (uncertain&&op!=0)) return; pending=true; requestTimer.reset(); requestTimer.start(); draw();
         SocketConnection.send(2311,900002,op,petTime,markId,kind=="skill"?1:0);
      }
      private function onTimeout(event:TimerEvent):void { markUncertain(); }
      private function onSocketError(event:SocketErrorEvent):void {
         if(pending&&(event.headInfo==null||event.headInfo.cmdID==2311)) markUncertain();
      }
      private function markUncertain():void {
         requestTimer.stop(); pending=false; uncertain=true;
         message="未确认操作结果，请刷新核对。"; draw();
      }
      private function onResponse(event:SocketEvent):void {
         var bytes:ByteArray=event.data as ByteArray; if(bytes==null||bytes.length<8) return;
         var saved:uint=bytes.position; bytes.position=0;
         var group:uint=bytes.readUnsignedInt();
         if(group!=900002) { bytes.position=saved; return; }
         var error:uint=bytes.readUnsignedInt();
         try {
            var next:XML=new XML(bytes.readUTFBytes(bytes.bytesAvailable));
            if(next.name()!="countermarks") throw new Error("invalid root");
            state=next; MainManager.actorInfo.coins=uint(state.@coins);
            var pets:Array=bagPets();
            if(selectedPet()==null) petTime=pets.length>0?uint(pets[0].@catchTime):0;
            uncertain=false; chooseMark(); message=String(state.@message);
            if(message=="") message=error==0?"资料已更新":"操作未完成，请刷新后重试。";
            if(error==0) PetManager.upDate();
         } catch(e:Error) { uncertain=true; message="未确认操作结果，请刷新核对。"; }
         bytes.position=saved; requestTimer.stop(); pending=false; draw();
      }
   }
}
