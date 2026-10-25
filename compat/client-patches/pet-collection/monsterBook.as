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
      private var searchHint:TextField;
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
         text(shell,"收集进度与永久档案",261,29,310,25,13,0x123E61);
         box(shell,28,64,864,2,0x76E4FF);
         button(shell,"关闭",866,18,26,26,"close");
         search=text(shell,"",260,84,470,30,14,0xFFFFFF);
         search.border=true;search.borderColor=0x69DFFF;search.background=true;search.backgroundColor=0x103F68;
         search.type=TextFieldType.INPUT;search.selectable=true;search.mouseEnabled=true;search.maxChars=36;
         search.multiline=false;search.wordWrap=false;
         search.addEventListener(Event.CHANGE,onSearch);
         searchHint=text(shell,"搜索精灵名称 / 编号 / 属性",260,116,470,16,10,0x123E61);
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
         search.visible=searchHint.visible=mode=="catalog";
         button(body,"收藏图录",624,20,112,34,"catalog",mode=="catalog");
         button(body,"收集成就",746,20,112,34,"achievements",mode=="achievements");
         button(body,state=="loading"?"同步中…":"刷新进度",756,84,136,30,"refresh",false,state!="loading");
         box(body,28,86,210,390,0x0C3B63,0x6CDFFF);
         text(body,"收藏进度",44,103,178,25,16,0xFFFFFF,true);
         text(body,"永久收藏 · 每个编号只计一次",44,135,178,20,10,0xBBDFF4);
         if(state!="ready") {
            text(body,state=="loading"?"正在同步…":"同步失败",44,187,178,38,23,0xFFFFFF,true);
            text(body,state=="loading"?"正在读取已获得记录。":"请点击「刷新进度」重试。\n未将同步失败显示为零进度。",44,242,178,78,12,0xC9E8F7);
            box(body,260,174,632,234,0x103F68,0x69DFFF);
            text(body,state=="loading"?"正在整理你的精灵收藏":"暂时无法读取收藏档案",290,234,572,35,21,0xFFFFFF,true);
            text(body,state=="loading"?"同步完成后显示图录与收藏印记。":"请检查连接后重试，已保存的收藏记录不会丢失。",290,282,572,55,13,0xC9E8F7);
            return;
         }
         var pct:Number=catalog.length?Math.floor(total*1000/catalog.length)/10:0;
         text(body,pct+"%",43,161,178,61,42,0xFFFFFF,true);
         text(body,total+" / "+catalog.length+" 种",45,225,177,27,18,0xFFFFFF,true);
         box(body,44,263,178,8,0x20597E);
         if(total>0)box(body,44,263,178*total/catalog.length,8,0x5DEAFF);
         var thresholds:Array=milestones();var next:int=catalog.length;
         for each(var value:int in thresholds)if(value>total) { next=value;break; }
         text(body,total==catalog.length?"全图鉴已点亮":"下一枚印记 · "+next+"种",44,295,178,27,15,0xFFE582,true);
         text(body,total==catalog.length?"所有配置内战斗精灵均已收集。":"再收集 "+Math.max(0,next-total)+" 种不同精灵即可点亮。",44,331,178,48,12,0xD7F0FF);
         text(body,"进化或放生不减少记录。\n旧账号仅从现有背包与仓库补录。\n印记仅作纪念，不发放奖励。",44,399,178,64,10,0xC9E8F7);
         if(mode=="achievements")renderAchievements(thresholds);else renderCatalog();
         text(body,"统计范围：本服完整战斗精灵配置 · 进化形态分别计数 · 未获得的进化前形态不自动点亮",260,490,632,18,9,0x123E61);
      }
      private function milestones():Array {
         var values:Array=[];
         for each(var value:int in [1,10,50,100,300,500,1000])if(value<catalog.length)values.push(value);
         if(catalog.length>0)values.push(catalog.length);
         return values;
      }
      private function renderAchievements(values:Array):void {
         text(body,"收藏里程碑",260,86,450,29,20,0xFFFFFF,true);
         text(body,"获得不同编号的精灵，点亮对应收藏印记。",260,122,632,23,12,0x123E61);
         for(var i:int=0;i<values.length;i++) {
            var target:int=values[i];var done:Boolean=total>=target;
            var x:Number=260+(i%2)*322;var y:Number=156+int(i/2)*74;
            var card:Sprite=new Sprite();card.x=x;card.y=y;body.addChild(card);
            box(card,0,0,310,64,done?0x125B7D:0x103F68,done?0x67F2D0:0x4F91B7);
            card.graphics.lineStyle(2,done?0x8CFFE1:0x69A5C7);
            card.graphics.beginFill(done?0x167F88:0x174C73);card.graphics.drawCircle(28,31,18);card.graphics.endFill();
            text(card,(i<9?"0":"")+(i+1),15,20,34,23,14,0xFFFFFF,true);
            text(card,target==catalog.length?"全图鉴收藏家":"收藏 "+target+" 种",58,9,177,24,15,0xFFFFFF,true);
            text(card,done?"已点亮":"未点亮",239,12,65,20,11,done?0x91FFE1:0xC1D8E7,true);
            text(card,Math.min(total,target)+" / "+target,58,36,95,20,11,0xD7F0FF);
            box(card,154,42,136,6,0x235878);
            if(total>0)box(card,154,42,136*Math.min(total/target,1),6,done?0x70F3CB:0x65DFFF);
         }
      }
      private function renderCatalog():void {
         button(body,"全部",260,134,90,28,"all",filter=="all");
         button(body,"已收集",360,134,98,28,"owned",filter=="owned");
         button(body,"未收集",468,134,98,28,"missing",filter=="missing");
         var query:String=search.text.replace(/^\s+|\s+$/g,"").toLowerCase();var rows:Array=[];
         for each(var pet:Object in catalog) {
            if(filter=="owned"&&!owned[pet.id] || filter=="missing"&&owned[pet.id])continue;
            if(query.length&&(pet.name+" "+pet.id+" "+pet.type).toLowerCase().indexOf(query)<0)continue;
            rows.push(pet);
         }
         var pages:int=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));page=Math.min(page,pages-1);
         text(body,"匹配 "+rows.length+" 种",650,139,242,23,12,0x123E61);
         if(!rows.length) {
            box(body,260,174,632,234,0x103F68,0x69DFFF);
            text(body,"没有匹配的精灵",290,235,572,34,21,0xFFFFFF,true);
            text(body,"试试其他名字、编号、属性或收集状态。",290,282,572,44,13,0xC9E8F7);
         }
         for(var i:int=page*PAGE_SIZE;i<Math.min(rows.length,(page+1)*PAGE_SIZE);i++) {
            pet=rows[i];var index:int=i-page*PAGE_SIZE;
            var x:Number=260+(index%4)*161;var y:Number=174+int(index/4)*122;
            var card:Sprite=new Sprite();card.x=x;card.y=y;body.addChild(card);
            box(card,0,0,149,112,owned[pet.id]?0x12577B:0x103F68,selected&&selected.id==pet.id?0xFFE582:owned[pet.id]?0x6DDFFF:0x4F91B7);
            text(card,"#"+pet.id,9,7,77,18,10,0xC9E8F7);
            text(card,owned[pet.id]?"已收集":"未收集",94,8,53,18,10,owned[pet.id]?0x91FFE1:0xBAD0DF);
            portrait(card,int(pet.id),10,31,64,64,!owned[pet.id]);
            text(card,pet.name,80,31,65,44,12,0xFFFFFF,true);
            text(card,pet.type+"系",80,80,65,21,10,0xC9E8F7);
            card.name="pet:"+pet.id;card.buttonMode=true;card.mouseChildren=false;
         }
         box(body,260,416,632,28,0x103F68);
         text(body,selected?"#"+selected.id+"  "+selected.name+" · "+selected.type+"系 · "+(owned[selected.id]?"已永久收录":"尚未收录，获得该形态后点亮"):"点击卡片查看收录状态；暗色头像表示尚未收集。",270,420,612,22,11,0xE2F5FF);
         button(body,"上一页",260,452,102,30,"prev",false,page>0);
         var pagination:TextField=text(body,(page+1)+" / "+pages,376,457,125,24,13,0x123E61,true);
         var centered:TextFormat=pagination.defaultTextFormat;centered.align="center";pagination.setTextFormat(centered);
         button(body,"下一页",516,452,102,30,"next",false,page<pages-1);
      }
      private function portrait(parent:Sprite,id:int,x:Number,y:Number,w:Number,h:Number,dim:Boolean):void {
         var holder:Sprite=new Sprite();holder.x=x;holder.y=y;holder.alpha=dim?0.46:1;parent.addChild(holder);
         holder.mouseEnabled=false;holder.mouseChildren=false;
         var loader:Loader=new Loader();var record:Object={loader:loader,disposed:false};art.push(record);
         var fail:Function=function(event:Event):void { if(!record.disposed)text(holder,"图像缺失",0,13,w,22,9,0xD7F0FF); };
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
      private function box(parent:Sprite,x:Number,y:Number,w:Number,h:Number,color:uint,border:uint=0):void {
         if(border)parent.graphics.lineStyle(1,border);else parent.graphics.lineStyle();
         parent.graphics.beginFill(color);parent.graphics.drawRoundRect(x,y,w,h,Math.min(12,h),Math.min(12,h));parent.graphics.endFill();
      }
      private function text(parent:DisplayObjectContainer,value:String,x:Number,y:Number,w:Number,h:Number,size:int,color:uint,bold:Boolean=false):TextField {
         var field:TextField=new TextField();field.defaultTextFormat=new TextFormat("Microsoft YaHei",size,color,bold);
         field.multiline=true;field.wordWrap=true;
         field.x=x;field.y=y;field.width=w;field.height=h;field.text=value;field.selectable=false;field.mouseEnabled=false;
         parent.addChild(field);return field;
      }
      private function button(parent:Sprite,value:String,x:Number,y:Number,w:Number,h:Number,command:String,active:Boolean=false,enabled:Boolean=true):void {
         var target:Sprite=new Sprite();target.x=x;target.y=y;target.name=command;target.buttonMode=enabled;
         var skin:SimpleButton;
         if(command=="close")skin=nativeUI.getButton("Close_Btn");
         else {
            var up:DisplayObject=nativeUI.getDisplayObject("Button_upSkin");
            var over:DisplayObject=nativeUI.getDisplayObject("Button_overSkin");
            var down:DisplayObject=nativeUI.getDisplayObject("Button_downSkin");
            up.width=over.width=down.width=w;up.height=over.height=down.height=h;
            skin=new SimpleButton(up,over,down,up);
         }
         skin.name=command;skin.width=command=="close"?26:w;skin.height=command=="close"?26:h;
         if(command=="close")skin.x=w-26;
         target.addChild(skin);
         if(command!="close"){
            var label:TextField=text(target,value,0,Math.max(1,(h-22)/2),w,h-2,13,0xFFFFFF,true);
            var format:TextFormat=label.defaultTextFormat;format.align="center";label.setTextFormat(format);
            label.filters=[new GlowFilter(676248,0.8,4,4,10)];
         }
         if(active)target.filters=[new GlowFilter(0x73E8FF,0.9,5,5,2)];
         if(!enabled){target.mouseEnabled=false;target.mouseChildren=false;target.alpha=0.45;}
         parent.addChild(target);
      }
   }
}
