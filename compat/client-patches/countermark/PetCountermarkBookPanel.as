package com.robot.module.book
{
   import com.robot.core.config.ClientConfig;
   import com.robot.core.event.PetEvent;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.net.SocketConnection;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
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
      private var actions:Array = [];
      private var state:XML;
      private var petTime:uint = 0;
      private var markId:uint = 0;
      private var kind:String = "ability";
      private var page:int = 0;
      private var pending:Boolean = false;
      private var uncertain:Boolean = false;
      private var requestTimer:Timer = new Timer(15000,1);
      private var visiblePanel:Boolean = false;
      private var message:String = "正在读取刻印资料…";
      private var pendingOp:uint = 0;
      private var portraitURL:String = "";
      private var portraitBox:Sprite;
      private var wantedPortrait:uint = 0;
      public function PetCountermarkBookPanel() { super(); }
      public function init(data:Object = null):void {
         if(data != null && data.catchTime != null) petTime = uint(data.catchTime);
      }
      public function setup():void {
         if(ui != null) return;
         ui = new Sprite(); ui.name = "countermarkPanel";
         ui.graphics.lineStyle(3,0x69DDF7); ui.graphics.beginFill(0x0B416A);
         ui.graphics.drawRoundRect(0,0,920,520,18,18); ui.graphics.endFill();
         label(ui,"精灵刻印",26,16,300,36,26,0xF1FBFF,true);
         label(ui,"能力孔 · 技能孔   /   100级精灵专属",28,62,600,24,13,0xACD9F0);
         var close:Sprite = button(ui,"关闭",824,24,72,32,"close");
         ui.addEventListener(MouseEvent.CLICK,onClick);
         body = new Sprite(); ui.addChild(body);
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
         ui = null; body = null; state = null; actions = [];
      }
      private function cancelPortrait():void {
         if(portraitURL != "") ResourceManager.cancel(portraitURL,onPortrait);
         portraitURL = ""; wantedPortrait = 0;
      }
      private function onPetUpdate(event:PetEvent):void { if(visiblePanel) draw(); }
      private function label(parent:Sprite,value:String,x:Number,y:Number,w:Number,h:Number,size:uint = 14,color:uint = 0xD7F0FF,bold:Boolean = false):TextField {
         var t:TextField = new TextField(); t.x=x; t.y=y; t.width=w; t.height=Math.max(h,Math.ceil(size*1.5)+4);
         t.defaultTextFormat = new TextFormat("Microsoft YaHei",size,color,bold);
         t.text=value; t.selectable=false; t.mouseEnabled=false; t.wordWrap=true; t.multiline=true;
         parent.addChild(t); return t;
      }
      private function box(parent:Sprite,x:Number,y:Number,w:Number,h:Number,color:uint = 0x082C49):void {
         parent.graphics.lineStyle(1,0x3187AE); parent.graphics.beginFill(color);
         parent.graphics.drawRoundRect(x,y,w,h,8,8); parent.graphics.endFill();
      }
      private function button(parent:Sprite,title:String,x:Number,y:Number,w:Number,h:Number,action:String,enabled:Boolean = true):Sprite {
         var b:Sprite=new Sprite(); b.x=x; b.y=y; b.name=action; b.buttonMode=true;
         box(b,0,0,w,h,enabled?0x176B9D:0x25485E);
         var t:TextField=label(b,title,4,Math.max(1,(h-23)/2),w-8,h-2,13,enabled?0xF1FCFF:0x839CAC,true);
         var f:TextFormat=t.defaultTextFormat; f.align="center"; t.setTextFormat(f);
         b.mouseChildren=false; parent.addChild(b);
         if(action!="close") { b.mouseEnabled=enabled&&!pending&&(!uncertain||action=="refresh"); b.alpha=b.mouseEnabled?1:0.55; actions.push(b); }
         return b;
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
      private function markName(id:uint):String { var m:XML=findMark(id); return m==null?"未装备":String(m.@name); }
      private function count(id:uint):uint {
         if(state != null) for each(var item:XML in state.inventory.mark) if(uint(item.@id)==id) return uint(item.@count);
         return 0;
      }
      private function owner(id:uint):XML {
         if(state != null) for each(var p:XML in state.pets.pet) if(uint(p.@ability)==id||uint(p.@skill)==id) return p;
         return null;
      }
      private function badge(parent:Sprite,x:Number,y:Number,skill:Boolean):void {
         var s:Sprite=new Sprite(); s.x=x; s.y=y;
         s.graphics.lineStyle(2,skill?0xE9BF76:0x73DDF5); s.graphics.beginFill(skill?0x74542D:0x16658C);
         s.graphics.moveTo(0,-19); s.graphics.lineTo(17,-9); s.graphics.lineTo(17,10); s.graphics.lineTo(0,20); s.graphics.lineTo(-17,10); s.graphics.lineTo(-17,-9); s.graphics.lineTo(0,-19); s.graphics.endFill();
         s.graphics.lineStyle(3,0xEAFBFF);
         if(skill) { s.graphics.moveTo(4,-12); s.graphics.lineTo(-6,2); s.graphics.lineTo(3,2); s.graphics.lineTo(-4,12); }
         else { s.graphics.moveTo(-8,0); s.graphics.lineTo(8,0); s.graphics.moveTo(0,-9); s.graphics.lineTo(0,9); }
         parent.addChild(s);
      }
      private function draw():void {
         if(body==null) return;
         cancelPortrait(); while(body.numChildren>0) body.removeChildAt(0); body.graphics.clear(); actions=[];
         box(body,18,92,230,368); box(body,260,92,310,368); box(body,582,92,320,368);
         label(body,"背包精灵",30,101,200,26,17,0x8CE4F6,true);
         if(state != null) label(body,"赛尔豆  "+String(state.@coins),620,55,275,26,16,0xF6D68E,true);
         var pets:Array=bagPets();
         if(pets.length==0) label(body,"背包里还没有精灵",32,155,200,40);
         for(var i:int=0;i<pets.length&&i<6;i++) {
            var p:XML=pets[i];
            button(body,(uint(p.@catchTime)==petTime?"◆ ":"")+String(p.@name)+"  Lv."+String(p.@level),30,138+i*43,206,35,"pet:"+p.@catchTime);
         }
         label(body,"100级启用刻印效果\n降级后装备保留，效果暂停",30,407,206,46,12,0xB3D4E6);
         button(body,"能力刻印",272,103,139,31,"tab:ability"); button(body,"技能刻印",419,103,139,31,"tab:skill");
         var marks:Array=[];
         if(state != null) for each(var item:XML in state.catalog.mark) if(String(item.@kind)==kind) marks.push(item);
         if(page*5>=marks.length) page=0;
         for(i=page*5;i<Math.min(marks.length,page*5+5);i++) {
            var m:XML=marks[i]; var own:XML=owner(uint(m.@id));
            var rowY:Number=145+(i-page*5)*52;
            button(body,(markId==uint(m.@id)?"◆ ":"")+m.@name,274,rowY,282,30,"mark:"+m.@id);
            label(body,own!=null?"占用："+own.@name:(count(uint(m.@id))>0?"已拥有 · 可装备":"本服兑换  "+m.@price+" 赛尔豆"),281,rowY+30,274,20,11,own!=null?0xF2CC8C:0xA8D4EB);
         }
         button(body,"上一页",274,416,83,30,"prev",page>0);
         label(body,(page+1)+" / "+Math.max(1,Math.ceil(marks.length/5)),367,421,80,22,12);
         button(body,"下一页",466,416,90,30,"next",(page+1)*5<marks.length);
         var pet:XML=selectedPet(); var mark:XML=selectedMark();
         if(pet != null) {
            label(body,String(pet.@name)+"  Lv."+pet.@level,596,101,288,26,18,0xEDFAFF,true);
            portraitBox=new Sprite(); portraitBox.x=606; portraitBox.y=136; body.addChild(portraitBox);
            box(portraitBox,0,0,76,78,0x103F60);
            wantedPortrait=uint(pet.@id); portraitURL=ClientConfig.getPetSwfPath(wantedPortrait);
            ResourceManager.getResource(portraitURL,onPortrait,"pet");
            label(body,"能力孔："+markName(uint(pet.@ability))+"\n技能孔："+markName(uint(pet.@skill)),691,136,199,61,12,0xBDDFF0);
            label(body,uint(pet.@level)>=100?"刻印效果已启用":"不足100级 · 刻印效果停用",596,218,292,23,12,uint(pet.@level)>=100?0x8DE3B8:0xFFD18A,true);
            label(body,"体力 "+pet.@hp+"/"+pet.@maxHp+"   攻击 "+pet.@atk+"   防御 "+pet.attribute("def")+"\n特攻 "+pet.@spAtk+"   特防 "+pet.@spDef+"   速度 "+pet.@speed,596,245,292,48,12,0xE1F5FF);
         }
         if(mark != null) {
            badge(body,615,318,String(mark.@kind)=="skill");
            label(body,String(mark.@name),646,298,242,26,17,0xF6D68E,true);
            label(body,String(mark.@description),646,332,242,43,12,0xD8EAF4);
            var nums:Array=["hp","atk","def","spAtk","spDef","speed"]; var names:Array=["体力","攻击","防御","特攻","特防","速度"]; var bonuses:Array=[];
            for(i=0;i<nums.length;i++) if(int(mark.attribute(nums[i]))!=0) bonuses.push(names[i]+" +"+mark.attribute(nums[i]));
            if(bonuses.length>0) label(body,bonuses.join("  "),596,373,292,23,14,0x8DE3B8,true);
            own=owner(markId); var owned:Boolean=count(markId)>0||own!=null;
            var same:Boolean=pet!=null&&uint(pet.attribute(kind))==markId;
            button(body,owned?"已拥有":"本服兑换 "+mark.@price,596,412,138,34,"buy",!owned&&state!=null&&uint(state.@coins)>=uint(mark.@price));
            button(body,same?"卸下":(pet!=null&&uint(pet.attribute(kind))!=0?"替换装备":"装备"),746,412,142,34,same?"unequip":"equip",pet!=null&&owned&&(same||uint(pet.@level)>=100)&&(own==null||uint(own.@catchTime)==petTime));
         }
         label(body,pending?"请求处理中，请稍候…":message,24,472,776,27,13,pending?0xA7DCF2:0xF6D68E);
         button(body,"刷新",824,472,72,28,"refresh");
         label(body,"每种刻印最多拥有1枚（包含已装备）；更换刻印会返还原刻印。",26,500,866,16,10,0xA9CBDF);
      }
      private function onPortrait(content:DisplayObject):void {
         if(!visiblePanel||portraitBox==null||wantedPortrait==0||content==null) return;
         var mc:MovieClip=content as MovieClip; if(mc!=null) DisplayUtil.stopAllMovieClip(mc);
         var ratio:Number=Math.min(64/Math.max(content.width,1),64/Math.max(content.height,1));
         content.scaleX=content.scaleY=ratio; content.x=38-content.getBounds(content).x*ratio-content.width/2; content.y=39-content.getBounds(content).y*ratio-content.height/2;
         portraitBox.addChild(content);
      }
      private function onClick(event:MouseEvent):void {
         var target:DisplayObject=event.target as DisplayObject; if(target==null) return;
         var action:String=target.name;
         if(action=="close") { hide(); return; }
         if(pending || (uncertain&&action!="refresh")) return;
         if(action.indexOf("pet:")==0) petTime=uint(action.split(":")[1]);
         else if(action.indexOf("mark:")==0) markId=uint(action.split(":")[1]);
         else if(action.indexOf("tab:")==0) { kind=action.split(":")[1]; page=0; markId=0; chooseMark(); }
         else if(action=="prev") page--;
         else if(action=="next") page++;
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
         if(pending || (uncertain&&op!=0)) return; pending=true; pendingOp=op; requestTimer.reset(); requestTimer.start(); draw();
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
