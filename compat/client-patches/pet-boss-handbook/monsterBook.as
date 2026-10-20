package
{
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.display.SimpleButton;
   import flash.display.DisplayObject;
   import flash.display.DisplayObjectContainer;
   import flash.display.Loader;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.events.KeyboardEvent;
   import flash.events.IOErrorEvent;
   import flash.events.SecurityErrorEvent;
   import flash.external.ExternalInterface;
   import flash.geom.Point;
   import flash.geom.Rectangle;
   import flash.net.URLRequest;
   import flash.system.ApplicationDomain;
   import flash.system.LoaderContext;
   import flash.text.TextField;
   import flash.text.TextFieldType;
   import flash.text.TextFormat;
   import flash.utils.getTimer;

   // Kept as the original library symbol. MonsterBook owns scene locking and novice-task completion.
   public dynamic class monsterBook extends MovieClip
   {
      public var closeBtn:SimpleButton;
      private const catalog:Array = []; // @CATALOG@
      private const methodology:Array = []; // @METHODOLOGY@
      private const tierNames:Array = ["夯","顶级","人上人","NPC","拉"];
      private const colors:Array = [0xB74731,0xAD7428,0x50735D,0x4D7285,0x727381];
      private const descriptions:Array = ["顶级水平 · 非常强","优秀 · 仅次于夯","中上水平 · 值得培养","普通水平 · 按需使用","当前形态 · 不宜优先"];
      private var mainUI:Sprite;
      private var content:Sprite;
      private var body:Sprite;
      private var navigation:Sprite;
      private var searchInput:TextField;
      private var footer:TextField;
      private var rows:Array = [];
      private var selected:Object;
      private var pageIndex:int = 0;
      private var viewMode:String = "overview";
      private var tierFilter:int = -1;
      private var scrollOffset:Number = 0;
      private var scrollTarget:Number = 0;
      private var scrollTime:int = 0;
      private var scrollProgress:int = -1;
      private var bodyHeight:Number = 0;
      private var loaders:Array = [];
      private const VIEW_HEIGHT:Number = 352;
      private const PAGE_SIZE:int = 12;
      private var scrollLabel:TextField;

      public function monsterBook()
      {
         super();
         stop();
         addEventListener(Event.ADDED_TO_STAGE,onAdded);
         addEventListener(Event.REMOVED_FROM_STAGE,onRemoved);
      }
      private function onAdded(event:Event):void
      {
         if(event.target != this) return;
         stop();
         cacheAsBitmap = false;
         while(numChildren > 0) removeChildAt(0);
         mainUI = layer(this,-443,-222);
         // The native loader places this symbol at (463,242): book lands at (20,20).
         rect(mainUI,0,0,920,520,0x203D50,0x70909B,12);
         rect(mainUI,8,7,904,505,0xDED4B9,0xB4A78A,8);
         rect(mainUI,15,12,890,491,0xF4EBD7,0xDFD1B0,5);
         for(var edge:int=0;edge<3;edge++) line(mainUI,24,508+edge*2,895,508+edge*2,0xA99D82);
         rect(mainUI,15,12,26,491,0x344E59,0x536C70,3);
         for(var ring:int=0;ring<5;ring++) rect(mainUI,25,94+ring*84,25,7,0x9AA19A,0xD5D4BF,5);
         label(mainUI,"赛尔号 / 作战研究室",61,21,300,18,10,0x67766E);
         label(mainUI,"精灵作战宝典",59,41,330,42,30,0x233E4D,true);
         label(mainUI,"不只看种族值，更看谁能帮你过关。",62,83,360,21,12,0x6C7266);
         rect(mainUI,566,35,284,34,0xFFFAED,0xAFA58D,4);
         searchInput=label(mainUI,"",577,41,260,25,14,0x243D4B);
         searchInput.type=TextFieldType.INPUT;
         searchInput.selectable=true;
         searchInput.mouseEnabled=true;
         searchInput.maxChars=40;
         searchInput.addEventListener(Event.CHANGE,onSearch);
         label(mainUI,"搜索全部：名字 / 编号 / 属性 / 技能",568,74,289,20,10,0x777362);
         closeBtn=new SimpleButton(closeFace(0x294859),closeFace(0x496777),closeFace(0x19303D),closeFace(0x294859));
         closeBtn.x=870;closeBtn.y=30;mainUI.addChild(closeBtn);
         // Native MonsterBook attaches the close handler after adding this symbol to the stage.
         navigation=layer(mainUI,60,110);
         content=layer(mainUI,60,139);
         content.graphics.beginFill(0,0);
         content.graphics.drawRect(0,0,824,VIEW_HEIGHT);
         content.graphics.endFill();
         var viewportMask:Sprite=layer(mainUI,60,139);
         viewportMask.mouseEnabled=false;
         viewportMask.graphics.beginFill(0);
         viewportMask.graphics.drawRect(0,0,824,VIEW_HEIGHT);
         viewportMask.graphics.endFill();
         content.mask=viewportMask;
         content.addEventListener(MouseEvent.MOUSE_WHEEL,onWheel);
         body=layer(content,0,0);
         footer=label(mainUI,"",62,493,735,18,10,0x6A7167);
         scrollLabel=label(mainUI,"",785,493,91,18,10,0x6A7167);
         mainUI.addEventListener(MouseEvent.CLICK,onClick);
         stage.addEventListener(KeyboardEvent.KEY_DOWN,onKey);
         viewMode="overview";tierFilter=-1;pageIndex=0;selected=null;
         render();
         if(ExternalInterface.available)ExternalInterface.addCallback("scrollPetHandbook",scrollFromBrowser);
      }
      private function onRemoved(event:Event):void
      {
         if(event.target!=this)return;
         removeEventListener(Event.ENTER_FRAME,onScrollFrame);
         if(ExternalInterface.available)ExternalInterface.addCallback("scrollPetHandbook",null);
         disposeArt();
         if(searchInput)searchInput.removeEventListener(Event.CHANGE,onSearch);
         if(mainUI)mainUI.removeEventListener(MouseEvent.CLICK,onClick);
         if(content)content.removeEventListener(MouseEvent.MOUSE_WHEEL,onWheel);
         // Keep no stage listeners after the native book is closed.
         if(eventStage!=null)eventStage.removeEventListener(KeyboardEvent.KEY_DOWN,onKey);
         eventStage=null;
      }
      private var eventStage:flash.display.Stage;
      private function onKey(event:KeyboardEvent):void
      {
         if(stage && stage.focus===searchInput)return;
         if(event.keyCode===27)closeBtn.dispatchEvent(new MouseEvent(MouseEvent.CLICK));
         if(event.keyCode===34)scroll(280);
         if(event.keyCode===33)scroll(-280);
      }
      private function layer(parent:DisplayObjectContainer,x:Number,y:Number):Sprite
      {
         var s:Sprite=new Sprite();s.x=x;s.y=y;parent.addChild(s);return s;
      }
      private function rect(parent:Sprite,x:Number,y:Number,w:Number,h:Number,fill:uint,border:uint,r:Number=0):void
      {
         parent.graphics.lineStyle(1,border);parent.graphics.beginFill(fill);
         if(r>0)parent.graphics.drawRoundRect(x,y,w,h,r,r);else parent.graphics.drawRect(x,y,w,h);
         parent.graphics.endFill();
      }
      private function line(parent:Sprite,x:Number,y:Number,x2:Number,y2:Number,color:uint):void
      {
         parent.graphics.lineStyle(1,color);parent.graphics.moveTo(x,y);parent.graphics.lineTo(x2,y2);
      }
      private function label(parent:DisplayObjectContainer,value:String,x:Number,y:Number,w:Number,h:Number,size:int=13,color:uint=0x354A50,bold:Boolean=false):TextField
      {
         var f:TextField=new TextField();var format:TextFormat=new TextFormat("Microsoft YaHei",size,color,bold);
         format.leading=4;f.defaultTextFormat=format;f.x=x;f.y=y;f.width=w;f.height=h;
         f.mouseEnabled=false;f.selectable=false;f.text=value;parent.addChild(f);return f;
      }
      private function paragraph(parent:DisplayObjectContainer,value:String,x:Number,y:Number,w:Number,size:int=13,color:uint=0x354A50):Number
      {
         var f:TextField=label(parent,value,x,y,w,1000,size,color);f.wordWrap=true;f.multiline=true;f.text=value;
         f.height=Math.ceil(f.textHeight)+8;return f.height;
      }
      private function closeFace(color:uint):Sprite
      {
         var s:Sprite=new Sprite();rect(s,0,0,31,31,color,color,5);label(s,"×",5,0,24,30,23,0xF4EBD7);return s;
      }
      private function action(parent:Sprite,value:String,x:Number,y:Number,w:Number,h:Number,command:String,color:uint=0x294859):Sprite
      {
         var s:Sprite=layer(parent,x,y);s.name=command;s.buttonMode=true;s.mouseChildren=false;
         rect(s,0,0,w,h,color,color,4);var t:TextField=label(s,value,3,(h-19)/2,w-6,23,12,0xFFFAED,true);
         var f:TextFormat=t.defaultTextFormat;f.align="center";t.setTextFormat(f);return s;
      }
      private function clear(parent:Sprite):void
      {
         parent.graphics.clear();while(parent.numChildren>0)parent.removeChildAt(0);
      }
      private function disposeArt():void
      {
         for each(var rec:Object in loaders) {
            rec.disposed=true;
            try { rec.loader.close(); } catch(error:Error) {}
            rec.loader.unloadAndStop(true);
         }
         loaders=[];
      }
      private function stopArt(display:DisplayObject):void
      {
         if(display is MovieClip)MovieClip(display).gotoAndStop(1);
         if(display is DisplayObjectContainer)for(var i:int=0;i<DisplayObjectContainer(display).numChildren;i++)stopArt(DisplayObjectContainer(display).getChildAt(i));
      }
      private function portrait(parent:Sprite,id:int,x:Number,y:Number,w:Number,h:Number,full:Boolean=false):void
      {
         var holder:Sprite=layer(parent,x,y);holder.mouseEnabled=false;holder.mouseChildren=false;
         var loader:Loader=new Loader();var rec:Object={loader:loader,disposed:false};loaders.push(rec);
         var failed:Function=function(event:Event):void { if(!rec.disposed)label(holder,"#"+id,4,h/2-7,w-8,20,10,0x8D8979); };
         loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,failed);
         loader.contentLoaderInfo.addEventListener(SecurityErrorEvent.SECURITY_ERROR,failed);
         loader.contentLoaderInfo.addEventListener(Event.COMPLETE,function(event:Event):void {
            if(rec.disposed)return;
            var domain:ApplicationDomain=loader.contentLoaderInfo.applicationDomain;
            var symbol:String=full?"pet":"item";
            if(!domain.hasDefinition(symbol)) { failed(event);return; }
            var definition:Class=domain.getDefinition(symbol) as Class;
            var display:DisplayObject=new definition() as DisplayObject;stopArt(display);
            var bounds:Rectangle=display.getBounds(display);
            if(bounds.width<=0 || bounds.height<=0)return;
            var scale:Number=Math.min(w/bounds.width,h/bounds.height);
            display.scaleX=scale;display.scaleY=scale;display.x=(w-bounds.width*scale)/2-bounds.x*scale;
            display.y=(h-bounds.height*scale)/2-bounds.y*scale;holder.addChild(display);
         });
         var url:String=full?(id>500?"groupFightResource/pet/":"pet/swf/"):"pet/head/";
         loader.load(new URLRequest("/resource/"+url+id+".swf"),new LoaderContext(false,new ApplicationDomain()));
      }
      private function onSearch(event:Event):void
      {
         viewMode="list";tierFilter=-1;pageIndex=0;selected=null;render();
      }
      private function onClick(event:MouseEvent):void
      {
         var command:String=event.target.name;
         if(command=="home") { viewMode="overview";tierFilter=-1;pageIndex=0;searchInput.text=""; }
         else if(command=="all") { viewMode="list";tierFilter=-1;pageIndex=0;searchInput.text=""; }
         else if(command=="clear") { searchInput.text="";viewMode="list";pageIndex=0; }
         else if(command=="rules")viewMode="rules";
         else if(command=="back")viewMode="list";
         else if(command=="previous")pageIndex=Math.max(0,pageIndex-1);
         else if(command=="next")pageIndex=Math.min(Math.max(0,Math.ceil(rows.length/PAGE_SIZE)-1),pageIndex+1);
         else if(command=="up") { scroll(-230);return; }
         else if(command=="down") { scroll(230);return; }
         else if(command.indexOf("tier:")==0) { tierFilter=int(command.substr(5));searchInput.text="";pageIndex=0;viewMode="list"; }
         else if(command.indexOf("pet:")==0) {
            var id:int=int(command.substr(4));
            for each(var p:Object in catalog)if(p.id==id){selected=p;break;}
            viewMode="detail";
         } else return;
         render();
      }
      private function render():void
      {
         eventStage=stage;
         removeEventListener(Event.ENTER_FRAME,onScrollFrame);
         disposeArt();clear(body);clear(navigation);scrollOffset=0;scrollTarget=0;scrollProgress=-1;body.y=0;bodyHeight=0;
         action(navigation,"梯队一览",0,0,83,27,"home");
         action(navigation,"全部精灵",91,0,83,27,"all");
         action(navigation,"评级标准",182,0,83,27,"rules");
         action(navigation,"清空搜索",273,0,83,27,"clear",0x716F62);
         if(viewMode=="detail")action(navigation,"返回列表",364,0,83,27,"back");
         if(viewMode=="overview")renderOverview();
         else if(viewMode=="list")renderList();
         else if(viewMode=="detail")renderDetail();
         else renderRules();
         if(bodyHeight>VIEW_HEIGHT) {
            action(navigation,"↑",746,0,32,27,"up");action(navigation,"↓",786,0,32,27,"down");
         }
         scroll(0);
      }
      private function renderOverview():void
      {
         for(var t:int=0;t<5;t++) {
            var y:Number=t*69;
            rect(body,0,y,820,64,0xEAE0CA,0xCDBFA3,3);
            var tier:Sprite=action(body,tierNames[t],0,y,93,64,"tier:"+t,colors[t]);
            var count:int=0;
            for each(var p:Object in catalog)if(p.tier==t)count++;
            label(body,descriptions[t],105,y+4,168,21,11,colors[t],true);
            label(body,count+"只 · 点等级查看全部",105,y+28,168,20,10,0x736F61);
            var x:Number=283;
            for each(var r:Object in catalog)if(r.tier==t && r.featured) {
               var tile:Sprite=layer(body,x,y+1);tile.name="pet:"+r.id;tile.buttonMode=true;tile.mouseChildren=false;
               tile.graphics.beginFill(0xFFFAED,0.01);tile.graphics.drawRect(0,0,87,62);tile.graphics.endFill();
               portrait(tile,r.id,21,0,43,40);
               var n:TextField=label(tile,r.name,1,40,85,21,11,0x2E444B,true);var f:TextFormat=n.defaultTextFormat;f.align="center";n.setTextFormat(f);
               x+=89;
            }
         }
         bodyHeight=345;footer.text="全收录 "+catalog.length+" 只 · 首屏仅展示代表 · 点击精灵看配招与获取 · 评价限本服Boss战";
      }
      private function renderList():void
      {
         rows=[];
         var query:String=searchInput.text.toLowerCase().replace(/^\s+|\s+$/g,"");
         for each(var r:Object in catalog)if((tierFilter<0 || r.tier==tierFilter) && (query=="" || String(r.search).toLowerCase().indexOf(query)>=0))rows.push(r);
         label(body,(tierFilter<0?"全精灵索引":tierNames[tierFilter]+" · 梯队索引")+" / "+rows.length+"只",0,0,600,27,16,0x294859,true);
         if(rows.length==0) {
            label(body,"没有找到这只精灵",66,95,600,39,25,0x42564F,true);
            paragraph(body,"试试完整名字、图鉴编号、属性，或关键技能。搜索覆盖全部已收录精灵，不只首页代表。",66,144,650,15);
            action(body,"清空搜索，查看全部",66,218,180,34,"all");
         }
         var end:int=Math.min(rows.length,(pageIndex+1)*PAGE_SIZE);
         for(var i:int=pageIndex*PAGE_SIZE;i<end;i++) {
            r=rows[i];var index:int=i-pageIndex*PAGE_SIZE;
            var x:Number=(index%3)*276;var y:Number=38+int(index/3)*69;
            var tile:Sprite=layer(body,x,y);tile.name="pet:"+r.id;tile.buttonMode=true;tile.mouseChildren=false;
            rect(tile,0,0,265,62,0xFFFAED,0xD3C6AA,3);portrait(tile,r.id,6,6,47,47);
            label(tile,r.name,62,4,139,24,14,0x294859,true);
            label(tile,tierNames[r.tier],205,5,58,23,13,colors[r.tier],true);
            label(tile,"#"+r.id+" · "+r.type+" · "+r.role,62,31,199,22,10,0x747365);
         }
         action(body,"上一页",0,324,77,28,"previous");action(body,"下一页",741,324,77,28,"next");
         label(body,(pageIndex+1)+" / "+Math.max(1,Math.ceil(rows.length/PAGE_SIZE)),354,328,130,23,13,0x294859,true);
         bodyHeight=352;footer.text="按图鉴编号排列 · 搜索名字、编号、属性或技能 · 每页12只 · 当前形态独立评级";
      }
      private function section(title:String,lines:Array,y:Number):Number
      {
         line(body,260,y+9,810,y+9,0xD3C6AA);
         label(body,title,260,y+17,550,27,17,0x294859,true);y+=51;
         for each(var value:String in lines)y+=paragraph(body,value,260,y,543,13)+9;
         return y+12;
      }
      private function renderDetail():void
      {
         if(selected==null)return;
         var r:Object=selected;
         label(body,r.name,0,0,248,36,25,0x294859,true);
         label(body,"#"+r.id+" / "+r.type+"系 / "+r.role,1,39,246,39,12,0x727261);
         rect(body,0,83,230,188,0xE9DFC6,0xD0C2A5,4);
         portrait(body,r.id,16,88,196,171,true);
         action(body,tierNames[r.tier]+" · "+r.score+"分",0,282,230,35,"tier:"+r.tier,colors[r.tier]);
         var summaryHeight:Number=paragraph(body,r.summary,2,331,229,13);
         label(body,"种族值 / 总和 "+r.stats.total,0,347+summaryHeight,234,25,16,0x294859,true);
         var statLabels:Array=["体力","攻击","防御","特攻","特防","速度"];
         var values:Array=[r.stats.hp,r.stats.atk,r.stats.def,r.stats.spAtk,r.stats.spDef,r.stats.spd];
         for(var i:int=0;i<6;i++) {
            var sy:Number=382+summaryHeight+i*30;
            label(body,statLabels[i],0,sy,40,24,12);
            rect(body,44,sy+8,139,6,0xDED3B9,0xDED3B9);
            rect(body,44,sy+8,Math.min(139,Number(values[i])/180*139),6,colors[r.tier],colors[r.tier]);
            label(body,String(values[i]),190,sy,41,24,12,0x294859,true);
         }
         var y:Number=section("为什么是「"+tierNames[r.tier]+"」",r.reasons,0);
         y=section("打法边界 / 别把工具当万能",r.caveats,y);
         y=section("如何获取",r.acquisition,y);
         y=section("学习力 / 怎么练",r.training,y);
         var moves:Array=[];
         for each(var m:Object in r.moves)moves.push(m.name+" · "+m.level+"级可学\n"+m.description);
         y=section("推荐四招 / 按关卡替换",moves,y);
         y=section("推荐特性 / "+r.ability.name,[r.ability.description],y);
         bodyHeight=Math.max(y,575+summaryHeight);footer.text="本服Boss养成建议 · 滚轮 / 右上箭头 / PageDown 翻阅 · 不执行培养或购买操作";
      }
      private function renderRules():void
      {
         label(body,"先看机制，再谈面板。",0,0,810,43,27,0x294859,true);
         var y:Number=58;
         for(var i:int=0;i<methodology.length;i++) {
            label(body,"0"+(i+1),0,y,53,32,21,0xB74731,true);
            y+=paragraph(body,String(methodology[i]),62,y,733,15)+23;
         }
         bodyHeight=y;footer.text="评分依据：本服种族值、可学技能、技能运行时与获取配置 · 配置更新后应重新构建宝典";
      }
      private function scrollFromBrowser(xRatio:Number,yRatio:Number,pixels:Number):Boolean
      {
         if(stage==null || content==null || !isFinite(pixels) || pixels==0)return false;
         var point:Point=content.globalToLocal(new Point(xRatio*stage.stageWidth,yRatio*stage.stageHeight));
         if(point.x<0 || point.x>824 || point.y<0 || point.y>VIEW_HEIGHT)return false;
         scroll(pixels);
         return true;
      }
      private function onWheel(event:MouseEvent):void
      {
         if(event.delta==0)return;
         event.stopPropagation();
         scroll(-event.delta*22);
      }
      private function scroll(delta:Number):void
      {
         if(delta*(scrollTarget-scrollOffset)<0)scrollTarget=scrollOffset;
         scrollTarget=Math.max(0,Math.min(Math.max(0,bodyHeight-VIEW_HEIGHT),scrollTarget+delta));
         if(scrollTarget==scrollOffset) { updateScroll();return; }
         if(!hasEventListener(Event.ENTER_FRAME)) {
            scrollTime=getTimer();
            addEventListener(Event.ENTER_FRAME,onScrollFrame);
         }
      }
      private function onScrollFrame(event:Event):void
      {
         var now:int=getTimer();
         scrollOffset+=(scrollTarget-scrollOffset)*(1-Math.exp(-(now-scrollTime)/65));
         scrollTime=now;
         if(Math.abs(scrollTarget-scrollOffset)<0.5) {
            scrollOffset=scrollTarget;
            removeEventListener(Event.ENTER_FRAME,onScrollFrame);
         }
         updateScroll();
      }
      private function updateScroll():void
      {
         body.y=-scrollOffset;
         var progress:int=bodyHeight>VIEW_HEIGHT?Math.round(scrollOffset/(bodyHeight-VIEW_HEIGHT)*100):-1;
         if(progress!=scrollProgress || progress==-1) {
            scrollProgress=progress;
            scrollLabel.text=progress>=0?progress+"% · 可下翻":"";
         }
      }
   }
}
