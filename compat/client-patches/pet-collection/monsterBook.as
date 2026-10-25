package {
   import flash.display.*;
   import flash.events.*;
   import flash.filters.GlowFilter;
   import flash.geom.Rectangle;
   import flash.net.URLRequest;
   import flash.system.ApplicationDomain;
   import flash.system.LoaderContext;
   import flash.text.*;
   import flash.utils.ByteArray;
   import flash.utils.Timer;

   // Separate resource and child ApplicationDomain; the original battle handbook stays intact.
   public dynamic class PetCollectionGallery extends MovieClip {
      private const catalog:Array = []; // @CATALOG@
      private const COMMAND:int = 91001;
      private const PAGE_SIZE:int = 8;
      private var socket:Class;
      private var nativeUI:Class;
      private var owned:Object = {};
      private var total:int = 0;
      private var state:String = "loading";
      private var mode:String = "catalog";
      private var filter:String = "all";
      private var page:int = 0;
      private var selected:Object;
      private var shell:Sprite;
      private var body:Sprite;
      private var search:TextField;
      private var timer:Timer = new Timer(8000,1);
      private var art:Array = [];
      private var eventStage:Stage;

      public function PetCollectionGallery() {
         stop();
         addEventListener(Event.ADDED_TO_STAGE,onAdded);
         addEventListener(Event.REMOVED_FROM_STAGE,onRemoved);
      }
      private function onAdded(event:Event):void {
         if(event.target!=this)return;
         eventStage=stage;
         graphics.beginFill(0x14242A,0.65);graphics.drawRect(0,0,960,560);graphics.endFill();
         shell=new Sprite();shell.x=20;shell.y=20;addChild(shell);
         nativeUI=ApplicationDomain.currentDomain.getDefinition("com.robot.core.manager.UIManager") as Class;
         var frame:Sprite=nativeUI.getSprite("Panel_Background");
         frame.scale9Grid=new Rectangle(16,32,frame.width-32,frame.height-48);
         frame.width=920;frame.height=520;frame.mouseChildren=false;shell.addChild(frame);
         var title:TextField=text(shell,"精灵收藏馆",31,18,230,29,20,0xFFFFFF,true);
         title.filters=[new GlowFilter(676248,0.8,4,4,10)];
         text(shell,"收集进度与精灵档案",261,29,310,25,13,0x163F62);
         button(shell,"收藏图录",544,44,112,36,"catalog");
         button(shell,"收集成就",665,44,112,36,"achievements");
         button(shell,"关闭",866,18,26,26,"close");
         search=text(shell,"",291,123,370,28,14,0x293F39);
         search.border=true;search.borderColor=0xB9AD91;search.background=true;search.backgroundColor=0xFAF5E8;
         search.type=TextFieldType.INPUT;search.selectable=true;search.mouseEnabled=true;search.maxChars=36;
         search.multiline=false;search.wordWrap=false;
         search.addEventListener(Event.CHANGE,onSearch);
         text(shell,"搜索名字 / 编号 / 属性",291,153,370,18,10,0x716A58);
         button(shell,"刷新进度",781,122,111,32,"refresh");
         body=new Sprite();shell.addChild(body);
         shell.addEventListener(MouseEvent.CLICK,onClick);
         eventStage.addEventListener(KeyboardEvent.KEY_DOWN,onKey);
         timer.addEventListener(TimerEvent.TIMER_COMPLETE,onTimeout);
         request();
      }
      private function request():void {
         if(state=="loading"&&timer.running)return;
         state="loading";render();
         try {
            socket=ApplicationDomain.currentDomain.getDefinition("com.robot.core.net.SocketConnection") as Class;
            socket.removeCmdListener(COMMAND,onSnapshot);
            socket.addCmdListener(COMMAND,onSnapshot);
            timer.reset();timer.start();socket.send(COMMAND);
         } catch(error:Error) { fail(); }
      }
      private function onSnapshot(event:*):void {
         try {
            var bytes:ByteArray=event.data as ByteArray;
            if(bytes==null || bytes.bytesAvailable<4)throw new Error("Invalid collection snapshot");
            var count:uint=bytes.readUnsignedInt();
            if(bytes.bytesAvailable!=count*4)throw new Error("Invalid collection count");
            var next:Object={};
            for(var i:uint=0;i<count;i++)next[bytes.readUnsignedInt()]=true;
            owned=next;total=0;
            for each(var pet:Object in catalog)if(owned[pet.id])total++;
            state="ready";timer.stop();socket.removeCmdListener(COMMAND,onSnapshot);render();
         } catch(error:Error) { fail(); }
      }
      private function onTimeout(event:TimerEvent):void { fail(); }
      private function fail():void {
         timer.stop();if(socket)socket.removeCmdListener(COMMAND,onSnapshot);
         state="error";render();
      }
      private function onSearch(event:Event):void { page=0;mode="catalog";selected=null;render(); }
      private function onKey(event:KeyboardEvent):void {
         if(event.keyCode==27)close();
      }
      private function onClick(event:MouseEvent):void {
         var command:String=event.target.name;
         if(command=="close") { close();return; }
         if(command=="refresh") { request();return; }
         if(command=="catalog"||command=="achievements") { mode=command;page=0; }
         else if(command=="all"||command=="owned"||command=="missing") { filter=command;page=0;selected=null; }
         else if(command=="prev")page=Math.max(0,page-1);
         else if(command=="next")page++;
         else if(command.indexOf("pet:")==0) {
            for each(var pet:Object in catalog)if(pet.id==int(command.substr(4))) { selected=pet;break; }
         } else return;
         render();
      }
      private function close():void { if(parent)parent.removeChild(this); }
      private function onRemoved(event:Event):void {
         if(event.target!=this)return;
         timer.stop();timer.removeEventListener(TimerEvent.TIMER_COMPLETE,onTimeout);
         if(socket)socket.removeCmdListener(COMMAND,onSnapshot);
         if(eventStage)eventStage.removeEventListener(KeyboardEvent.KEY_DOWN,onKey);
         eventStage=null;disposeArt();
         shell.removeEventListener(MouseEvent.CLICK,onClick);search.removeEventListener(Event.CHANGE,onSearch);
      }
      private function render():void {
         disposeArt();body.graphics.clear();while(body.numChildren)body.removeChildAt(0);
         box(body,28,129,229,345,0xDCD7BD);
         text(body,"永久收藏 / 按精灵编号去重",44,146,203,22,12,0x6D7158);
         if(state!="ready") {
            text(body,state=="loading"?"正在同步收藏…":"收藏同步失败",44,202,202,38,21,0x293F39,true);
            text(body,state=="loading"?"从服务器读取已获得记录。":"未显示旧值或零进度。\n请点右上角「刷新进度」。",44,249,194,79,13,0x5D6451);
            text(body,"已获得的编号永久点亮。\n进化与放生不扣进度。\n奖励尚未开放领取。",44,363,199,93,12,0x5D6451);
            return;
         }
         var pct:Number=catalog.length?Math.floor(total*1000/catalog.length)/10:0;
         text(body,pct+"%",43,185,202,61,42,0x293F39,true);
         text(body,total+" / "+catalog.length+" 种",45,248,197,27,18,0x293F39,true);
         box(body,44,293,196,7,0xC2C5A9);
         if(total>0)box(body,44,293,196*total/catalog.length,7,0x617457);
         var thresholds:Array=milestones();var next:int=catalog.length;
         for each(var value:int in thresholds)if(value>total) { next=value;break; }
         text(body,total==catalog.length?"全图鉴已点亮":"下一枚印记 · "+next+"种",44,321,199,26,15,0x293F39,true);
         text(body,total==catalog.length?"所有配置内战斗精灵均已收集。":"还差 "+Math.max(0,next-total)+" 种不同精灵。",44,351,199,46,12,0x5D6451);
         text(body,"已获得永久保留，不扣进度。\n旧记录仅从现有背包与仓库补录。\n成就不发奖励，暂无领取操作。",44,408,199,65,10,0x5D6451);
         if(mode=="achievements")renderAchievements(thresholds);else renderCatalog();
         text(body,"分母：服务端完整战斗精灵配置 · 进化各形态分别计数 · 不推测未获得的进化前形态",28,490,864,19,10,0x766F5D);
      }
      private function milestones():Array {
         var values:Array=[];
         for each(var value:int in [1,10,50,100,300,500,1000])if(value<catalog.length)values.push(value);
         if(catalog.length>0)values.push(catalog.length);
         return values;
      }
      private function renderAchievements(values:Array):void {
         text(body,"收集成就",288,181,450,29,20,0x293F39,true);
         for(var i:int=0;i<values.length;i++) {
            var target:int=values[i];var done:Boolean=total>=target;
            var x:Number=289+(i%2)*309;var y:Number=222+int(i/2)*62;
            box(body,x,y,293,53,done?0xD6DFC6:0xE2DCCB);
            text(body,done?"已达成":"未达成",x+12,y+6,70,22,12,done?0x47613F:0x8B826C,true);
            text(body,target==catalog.length?"全图鉴收藏家":"收藏 "+target+" 种",x+85,y+5,190,24,15,0x293F39,true);
            text(body,Math.min(total,target)+" / "+target,x+85,y+29,190,18,10,0x6B705C);
         }
      }
      private function renderCatalog():void {
         button(body,"全部",289,179,83,28,"all",filter=="all");
         button(body,"已收集",380,179,93,28,"owned",filter=="owned");
         button(body,"未收集",481,179,93,28,"missing",filter=="missing");
         var query:String=search.text.replace(/^\s+|\s+$/g,"").toLowerCase();var rows:Array=[];
         for each(var pet:Object in catalog) {
            if(filter=="owned"&&!owned[pet.id] || filter=="missing"&&owned[pet.id])continue;
            if(query.length&&(pet.name+" "+pet.id+" "+pet.type).toLowerCase().indexOf(query)<0)continue;
            rows.push(pet);
         }
         var pages:int=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));page=Math.min(page,pages-1);
         text(body,"匹配 "+rows.length+" 种",621,181,267,24,12,0x6D7158);
         if(!rows.length)text(body,"没有匹配的精灵，试试其他名字、编号或收集状态。",292,274,585,54,16,0x6D7158);
         for(var i:int=page*PAGE_SIZE;i<Math.min(rows.length,(page+1)*PAGE_SIZE);i++) {
            pet=rows[i];var index:int=i-page*PAGE_SIZE;
            var x:Number=289+(index%4)*153;var y:Number=220+int(index/4)*94;
            var card:Sprite=new Sprite();card.x=x;card.y=y;body.addChild(card);
            box(card,0,0,140,83,owned[pet.id]?0xF9F4E6:0xDDD9CA);
            text(card,"#"+pet.id,8,4,80,18,10,0x7C7765);
            portrait(card,int(pet.id),8,23,45,43,!owned[pet.id]);
            text(card,pet.name,56,21,80,33,11,0x293F39,true);
            text(card,owned[pet.id]?"已收集":"未收集",56,54,80,19,10,owned[pet.id]?0x4F6E44:0x8A7A61);
            card.name="pet:"+pet.id;card.buttonMode=true;card.mouseChildren=false;
         }
         text(body,selected?"#"+selected.id+"  "+selected.name+" · "+selected.type+"系 · "+(owned[selected.id]?"已永久收录":"尚未收录，获得该形态后点亮"):"点击精灵查看收录状态；灰色头像表示尚未收集。",289,415,598,24,12,0x5D6451);
         button(body,"上一页",289,449,90,28,"prev");
         text(body,(page+1)+" / "+pages,410,452,135,24,13,0x293F39,true);
         button(body,"下一页",550,449,90,28,"next");
      }
      private function portrait(parent:Sprite,id:int,x:Number,y:Number,w:Number,h:Number,dim:Boolean):void {
         var holder:Sprite=new Sprite();holder.x=x;holder.y=y;holder.alpha=dim?0.32:1;parent.addChild(holder);
         holder.mouseEnabled=false;holder.mouseChildren=false;
         var loader:Loader=new Loader();var record:Object={loader:loader,disposed:false};art.push(record);
         var fail:Function=function(event:Event):void { if(!record.disposed)text(holder,"图像缺失",0,13,w,22,9,0x766F5D); };
         loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,fail);
         loader.contentLoaderInfo.addEventListener(SecurityErrorEvent.SECURITY_ERROR,fail);
         loader.contentLoaderInfo.addEventListener(Event.COMPLETE,function(event:Event):void {
            if(record.disposed)return;
            var domain:ApplicationDomain=loader.contentLoaderInfo.applicationDomain;
            if(!domain.hasDefinition("item")) { fail(event);return; }
            var definition:Class=domain.getDefinition("item") as Class;var display:DisplayObject=new definition();
            if(display is MovieClip)MovieClip(display).stop();
            var bounds:Rectangle=display.getBounds(display);if(bounds.width<=0||bounds.height<=0)return;
            var scale:Number=Math.min(w/bounds.width,h/bounds.height);
            display.scaleX=scale;display.scaleY=scale;display.x=-bounds.x*scale;display.y=-bounds.y*scale;
            holder.addChild(display);
         });
         loader.load(new URLRequest("/resource/pet/head/"+id+".swf"),new LoaderContext(false,new ApplicationDomain()));
      }
      private function disposeArt():void {
         for each(var record:Object in art) {
            record.disposed=true;
            try { record.loader.close(); } catch(error:Error) {}
            record.loader.unloadAndStop(true);
         }
         art=[];
      }
      private function box(parent:Sprite,x:Number,y:Number,w:Number,h:Number,color:uint):void {
         parent.graphics.beginFill(color);parent.graphics.drawRect(x,y,w,h);parent.graphics.endFill();
      }
      private function text(parent:DisplayObjectContainer,value:String,x:Number,y:Number,w:Number,h:Number,size:int,color:uint,bold:Boolean=false):TextField {
         var field:TextField=new TextField();field.defaultTextFormat=new TextFormat("Microsoft YaHei",size,color,bold);
         field.multiline=true;field.wordWrap=true;
         field.x=x;field.y=y;field.width=w;field.height=h;field.text=value;field.selectable=false;field.mouseEnabled=false;
         parent.addChild(field);return field;
      }
      private function button(parent:Sprite,value:String,x:Number,y:Number,w:Number,h:Number,command:String,active:Boolean=false):void {
         var target:Sprite=new Sprite();target.x=x;target.y=y;target.name=command;target.buttonMode=true;
         var skin:SimpleButton;
         if(command=="close")skin=nativeUI.getButton("Close_Btn");
         else {
            var up:DisplayObject=nativeUI.getDisplayObject("Button_upSkin");
            var over:DisplayObject=nativeUI.getDisplayObject("Button_overSkin");
            var down:DisplayObject=nativeUI.getDisplayObject("Button_downSkin");
            up.width=over.width=down.width=w;up.height=over.height=down.height=h;
            skin=new SimpleButton(active?down:up,over,down,up);
         }
         skin.name=command;skin.width=command=="close"?26:w;skin.height=command=="close"?26:h;
         if(command=="close")skin.x=w-26;
         target.addChild(skin);
         if(command!="close"){
            var label:TextField=text(target,value,0,Math.max(1,(h-22)/2),w,h-2,13,0xFFFFFF,true);
            var format:TextFormat=label.defaultTextFormat;format.align="center";label.setTextFormat(format);
            label.filters=[new GlowFilter(676248,0.8,4,4,10)];
         }
         parent.addChild(target);
      }
   }
}
