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
   import flash.filters.GlowFilter;
   import flash.geom.Rectangle;
   import flash.net.URLRequest;
   import flash.net.SharedObject;
   import flash.system.ApplicationDomain;
   import flash.system.LoaderContext;
   import flash.text.TextField;
   import flash.text.TextFieldType;
   import flash.text.TextFormat;

   // Kept as the original library symbol. MonsterBook owns scene locking and novice-task completion.
   public dynamic class monsterBook extends MovieClip
   {
      public var closeBtn:SimpleButton;
      private const catalog:Array = []; // @CATALOG@
      private const methodology:Array = []; // @METHODOLOGY@
      private const tierNames:Array=["夯","顶级","人上人","NPC","拉"];
      private const colors:Array=[0xFFD16A,0xF7E397,0x9DECC2,0xA4DFFF,0xC4CDD8];
      private const viewKeys:Array=["overall","arena","boss"];
      private const viewNames:Array=["综合培养","星系擂台","Boss攻略"];
      private const sortKeys:Array=["score","total","speed","attack"];
      private const sortNames:Array=["培养评分","种族总和","种族速度","有效主攻"];
      private var mainUI:Sprite;
      private var body:Sprite;
      private var navigation:Sprite;
      private var filters:Sprite;
      private var footer:TextField;
      private var searchInput:TextField;
      private var nativeUI:Class;
      private var eventStage:flash.display.Stage;
      private var rows:Array=[];
      private var selected:Object;
      private var compareIds:Array=[];
      private var pageIndex:int=0;
      private var viewMode:String="list";
      private var ratingView:String="overall";
      private var tierFilter:int=-1;
      private var typeFilter:String="全部";
      private var roleFilter:String="全部";
      private var sortBy:String="score";
      private var finalOnly:Boolean=true;
      private var detailTab:String="overview";
      private var detailPage:int=0;
      private var detailPages:int=1;
      private var routeIndex:int=0;
      private var menu:Sprite;
      private var menuKind:String="";
      private var menuPage:int=0;
      private var menuValues:Array=[];
      private var loaders:Array=[];
      private var settings:SharedObject;
      private const PAGE_SIZE:int=8;

      public function monsterBook()
      {
         super();stop();
         addEventListener(Event.ADDED_TO_STAGE,onAdded);
         addEventListener(Event.REMOVED_FROM_STAGE,onRemoved);
      }
      private function onAdded(event:Event):void
      {
         if(event.target!==this)return;
         stop();while(numChildren)removeChildAt(0);
         // The native loader places this symbol at (463,242): book lands at (20,20).
         var shell:Sprite=layer(this,-443,-222);
         mainUI=layer(shell,34,0);mainUI.scaleX=mainUI.scaleY=0.92;
         nativeUI=ApplicationDomain.currentDomain.getDefinition("com.robot.core.manager.UIManager") as Class;
         var frame:Sprite=nativeUI.getSprite("Panel_Background");
         frame.scale9Grid=new Rectangle(40,40,frame.width-80,frame.height-80);frame.width=920;frame.height=520;frame.mouseChildren=false;shell.addChildAt(frame,0);
         var title:TextField=label(mainUI,"精灵培养榜 · 从夯到拉",28,17,500,32,21,0xFFFFFF,true);title.filters=[new GlowFilter(0x0A5287,0.8,4,4,10)];
         searchInput=label(mainUI,"",592,28,258,27,14,0x153E5F);searchInput.type=TextFieldType.INPUT;searchInput.selectable=true;searchInput.mouseEnabled=true;searchInput.border=true;searchInput.borderColor=0x5EBBD7;searchInput.background=true;searchInput.backgroundColor=0xE8F8FF;searchInput.maxChars=40;
         searchInput.addEventListener(Event.CHANGE,onSearch);
         closeBtn=nativeUI.getButton("Close_Btn");closeBtn.x=866;closeBtn.y=18;closeBtn.width=26;closeBtn.height=26;shell.addChild(closeBtn);
         // Native MonsterBook attaches the close handler after adding this symbol to the stage.
         navigation=layer(mainUI,28,68);filters=layer(mainUI,28,111);body=layer(mainUI,28,156);
         footer=label(mainUI,"",30,497,862,20,11,0x163F62);
         loadSettings();mainUI.addEventListener(MouseEvent.CLICK,onClick);eventStage=stage;eventStage.addEventListener(KeyboardEvent.KEY_DOWN,onKey);
         render();
      }
      private function loadSettings():void
      {
         try {
            var manager:Class=ApplicationDomain.currentDomain.getDefinition("com.robot.core.manager.MainManager") as Class;
            settings=SharedObject.getLocal("seer-cultivation-book-"+manager.actorID);
            var saved:Object=settings.data.view;
            if(saved!=null){
               if(viewKeys.indexOf(saved.rating)>=0)ratingView=saved.rating;
               if(sortKeys.indexOf(saved.sort)>=0)sortBy=saved.sort;
               tierFilter=Math.max(-1,Math.min(4,int(saved.tier)));typeFilter=String(saved.type);roleFilter=String(saved.role);
               finalOnly=saved.finalOnly!==false;searchInput.text=saved.query==null?"":String(saved.query);pageIndex=Math.max(0,int(saved.page));
            }
         } catch(error:Error){settings=null;}
         viewMode="list";selected=null;compareIds=[];
      }
      private function onRemoved(event:Event):void
      {
         if(event.target!==this)return;
         if(settings!=null)try{settings.data.view={rating:ratingView,sort:sortBy,tier:tierFilter,type:typeFilter,role:roleFilter,finalOnly:finalOnly,query:searchInput.text,page:pageIndex};settings.flush();}catch(error:Error){}
         disposeArt();
         if(searchInput)searchInput.removeEventListener(Event.CHANGE,onSearch);
         if(mainUI)mainUI.removeEventListener(MouseEvent.CLICK,onClick);
         // Keep no stage listeners after the native book is closed.
         if(eventStage!=null)eventStage.removeEventListener(KeyboardEvent.KEY_DOWN,onKey);
         eventStage=null;settings=null;
      }
      private function onKey(event:KeyboardEvent):void
      {
         if(stage&&stage.focus===searchInput)return;
         if(event.keyCode==27){if(menu!=null){closeMenu();return;}closeBtn.dispatchEvent(new MouseEvent(MouseEvent.CLICK));}
         if(event.keyCode==34)turn(1);
         if(event.keyCode==33)turn(-1);
      }
      private function onSearch(event:Event):void { pageIndex=0;viewMode="list";render(); }
      private function rating(pet:Object):Object { return pet.ratings[ratingView]; }
      private function find(id:int):Object { for each(var pet:Object in catalog)if(pet.id==id)return pet;return null; }
      private function onClick(event:MouseEvent):void
      {
         var command:String=event.target.name;
         if(command.indexOf("view:")==0){ratingView=command.substr(5);pageIndex=0;detailPage=0;render();return;}
         if(command.indexOf("pet:")==0){selected=find(int(command.substr(4)));detailTab="overview";detailPage=0;routeIndex=0;viewMode="detail";render();return;}
         if(command.indexOf("compare:")==0){toggleCompare(int(command.substr(8)));return;}
         if(command.indexOf("tier:")==0){tierFilter=int(command.substr(5));pageIndex=0;viewMode="list";render();return;}
         if(command.indexOf("tab:")==0){detailTab=command.substr(4);detailPage=0;render();return;}
         if(command=="routePrev"||command=="routeNext"){routeIndex=Math.max(0,Math.min(selected.acquisition.length-1,routeIndex+(command=="routeNext"?1:-1)));detailPage=0;render();return;}
         if(command=="routeGo"){var target:Object=selected.acquisition[routeIndex].target;if(target&&int(target.mapId)>0){var mapId:int=int(target.mapId);closeBtn.dispatchEvent(new MouseEvent(MouseEvent.CLICK));var manager:Class=ApplicationDomain.currentDomain.getDefinition("com.robot.core.manager.MapManager") as Class;manager.changeMap(mapId);}return;}
         if(command.indexOf("menu:")==0){openMenu(command.substr(5));return;}
         if(command.indexOf("pick:")==0){pick(int(command.substr(5)));return;}
         if(command=="menuPrev"||command=="menuNext"){menuPage+=command=="menuNext"?1:-1;drawMenu();return;}
         if(command=="menuClose"){closeMenu();return;}
         closeMenu();
         if(command=="overview")viewMode=viewMode=="overview"?"list":"overview";
         else if(command=="compareView")viewMode="compare";
         else if(command=="rules"){viewMode="rules";detailPage=0;}
         else if(command=="back")viewMode="list";
         else if(command=="forms"){finalOnly=!finalOnly;pageIndex=0;viewMode="list";}
         else if(command=="sort"){sortBy=sortKeys[(sortKeys.indexOf(sortBy)+1)%sortKeys.length];pageIndex=0;viewMode="list";}
         else if(command=="clear"){searchInput.text="";typeFilter=roleFilter="全部";tierFilter=-1;pageIndex=0;viewMode="list";}
         else if(command=="previous"){turn(-1);return;}
         else if(command=="next"){turn(1);return;}
         else return;
         render();
      }
      private function turn(delta:int):void
      {
         if(viewMode=="list")pageIndex=Math.max(0,Math.min(Math.max(0,Math.ceil(rows.length/PAGE_SIZE)-1),pageIndex+delta));
         else if(viewMode=="detail"||viewMode=="rules")detailPage=Math.max(0,Math.min(detailPages-1,detailPage+delta));
         else return;
         render();
      }
      private function toggleCompare(id:int):void
      {
         var index:int=compareIds.indexOf(id);
         if(index>=0)compareIds.splice(index,1);
         else if(compareIds.length<2)compareIds.push(id);
         else {footer.text="比较位已满，请先移除一只再加入。";return;}
         render();
      }
      private function filtered():Array
      {
         var result:Array=[];var query:String=searchInput.text.toLowerCase().replace(/^\s+|\s+$/g,"");
         for each(var pet:Object in catalog){
            var current:Object=rating(pet);
            if(finalOnly&&!pet.finalForm||tierFilter>=0&&current.tier!=tierFilter||typeFilter!="全部"&&pet.type!=typeFilter||roleFilter!="全部"&&current.role!=roleFilter)continue;
            if(query!=""){
               if(/^\d+$/.test(query)){if(String(pet.id)!=query)continue;}
               else {var matched:Boolean=true;for each(var word:String in query.split(/\s+/))if(String(pet.search).toLowerCase().indexOf(word)<0)matched=false;if(!matched)continue;}
            }
            result.push(pet);
         }
         result.sort(function(a:Object,b:Object):Number{
            var av:Number=sortBy=="score"?rating(a).score:sortBy=="total"?a.stats.total:sortBy=="speed"?a.stats.spd:a.mainAttack;
            var bv:Number=sortBy=="score"?rating(b).score:sortBy=="total"?b.stats.total:sortBy=="speed"?b.stats.spd:b.mainAttack;
            return bv!=av ? bv-av : a.id-b.id;
         });
         return result;
      }
      private function render():void
      {
         closeMenu();disposeArt();clear(body);clear(navigation);clear(filters);
         for(var index:int=0;index<3;index++)action(navigation,(ratingView==viewKeys[index]?"✓ ":"")+viewNames[index],index*126,0,118,30,"view:"+viewKeys[index]);
         action(navigation,viewMode=="overview"?"返回榜单":"梯队总览",386,0,112,30,"overview");
         action(navigation,"双宠对比 "+compareIds.length+"/2",510,0,137,30,"compareView");
         action(navigation,"评级标准",661,0,112,30,"rules");
         action(filters,"属性："+typeFilter,0,0,137,29,"menu:type");
         action(filters,"定位："+roleFilter,145,0,157,29,"menu:role");
         action(filters,"档位："+(tierFilter<0?"全部":tierNames[tierFilter]),310,0,112,29,"menu:tier");
         action(filters,finalOnly?"终形精灵":"全部形态",430,0,116,29,"forms");
         action(filters,sortNames[sortKeys.indexOf(sortBy)]+" ↓",554,0,158,29,"sort");
         action(filters,"清空筛选",720,0,141,29,"clear");
         rows=filtered();pageIndex=Math.max(0,Math.min(pageIndex,Math.max(0,Math.ceil(rows.length/PAGE_SIZE)-1)));
         if(viewMode=="detail"&&selected!=null)renderDetail();
         else if(viewMode=="compare")renderCompare();
         else if(viewMode=="rules")renderRules();
         else if(viewMode=="overview")renderOverview();
         else renderList();
      }
      private function renderList():void
      {
         if(rows.length==0){label(body,"没有匹配的精灵",30,65,790,40,24,0xFFFFFF,true);paragraph(body,"可以单独清除属性、定位或档位筛选；搜索和筛选不会互相清空。",30,118,790,14);}
         for(var i:int=pageIndex*PAGE_SIZE;i<Math.min(rows.length,(pageIndex+1)*PAGE_SIZE);i++){
            var pet:Object=rows[i];var current:Object=rating(pet);var position:int=i-pageIndex*PAGE_SIZE;
            var tile:Sprite=layer(body,(position%2)*438,int(position/2)*73);tile.name="pet:"+pet.id;tile.buttonMode=true;
            rect(tile,0,0,424,66,0x0E456F,0x60CCEC,7);
            portrait(tile,pet.id,6,8,49,49);
            label(tile,pet.name,64,4,210,25,16,0xFFFFFF,true);
            label(tile,tierNames[current.tier]+" "+current.score,277,5,90,24,14,colors[current.tier],true);
            label(tile,"总和 "+pet.stats.total+" · 速度 "+pet.stats.spd+" · "+pet.type+"系",64,29,290,21,12,0xCFEEFF);
            label(tile,current.role+" · "+String(current.summary).substr(0,14)+(String(current.summary).length>14?"…":""),64,47,280,18,11,0xAADAF4);
            action(tile,compareIds.indexOf(pet.id)>=0?"已加入":"对比",354,31,63,27,"compare:"+pet.id);
         }
         pager(pageIndex+1,Math.max(1,Math.ceil(rows.length/PAGE_SIZE)),pageIndex>0,(pageIndex+1)*PAGE_SIZE<rows.length);
         footer.text=viewNames[viewKeys.indexOf(ratingView)]+" · 匹配 "+rows.length+" / "+catalog.length+"只 · 点精灵看详情 · 规则初评，不是胜率";
      }
      private function renderOverview():void
      {
         for(var t:int=0;t<5;t++){
            var y:Number=t*59;var group:Array=[];
            for each(var pet:Object in rows)if(rating(pet).tier==t)group.push(pet);
            action(body,tierNames[t]+" · "+group.length+"只",0,y+10,112,32,"tier:"+t);
            for(var i:int=0;i<Math.min(6,group.length);i++){
               pet=group[i];var tile:Sprite=layer(body,128+i*122,y);tile.name="pet:"+pet.id;tile.buttonMode=true;
               portrait(tile,pet.id,36,0,35,35);label(tile,pet.name,0,37,118,20,11,0xFFFFFF,true);
               tile.graphics.beginFill(0,0);tile.graphics.drawRect(0,0,118,56);tile.graphics.endFill();tile.mouseChildren=false;
            }
         }
         action(mainUI,"返回榜单",30,463,112,29,"back");
         footer.text="按当前筛选与排序展示每档前六只；点击档位查看全部，不固定塞入熟悉精灵。";
      }
      private function renderDetail():void
      {
         var pet:Object=selected;var current:Object=rating(pet);
         label(body,pet.name,0,0,250,29,22,0xFFFFFF,true);
         label(body,"#"+pet.id+" · "+pet.type+"系 · "+current.role,0,32,266,25,12,0xD1EEFF);
         portrait(body,pet.id,12,60,108,108,true);
         label(body,"种族总和 "+pet.stats.total,130,69,140,29,15,0xFFE9A5,true);
         action(body,compareIds.indexOf(pet.id)>=0?"移出比较":"加入比较",130,111,124,30,"compare:"+pet.id);
         var names:Array=["体力","攻击","防御","特攻","特防","速度"];var values:Array=[pet.stats.hp,pet.stats.atk,pet.stats.def,pet.stats.spAtk,pet.stats.spDef,pet.stats.spd];
         for(var i:int=0;i<6;i++){
            var y:Number=174+i*20;
            label(body,names[i],0,y,43,22,12);rect(body,46,y+7,140,5,0x1B5C83,0x1B5C83);rect(body,46,y+7,Math.min(140,Number(values[i])/180*140),5,0x70DFFA,0x70DFFA);label(body,String(values[i]),196,y,57,22,12,0xFFFFFF,true);
         }
         for(i=0;i<3;i++){
            var grade:Object=pet.ratings[viewKeys[i]];
            label(body,viewNames[i],284+i*190,0,180,22,13,0xBDEAFF);
            label(body,tierNames[grade.tier]+" · "+grade.score+"分",284+i*190,23,180,28,18,colors[grade.tier],true);
         }
         var tabs:Array=["overview","moves","training","acquisition"];var titles:Array=["优点与边界","推荐配招","培养建议","如何获取"];
         for(i=0;i<4;i++)action(body,(detailTab==tabs[i]?"✓ ":"")+titles[i],280+i*146,62,137,29,"tab:"+tabs[i]);
         var content:String="";
         if(detailTab=="overview")content=current.summary+"\n\n"+current.reasons.join("\n")+"\n\n注意：\n"+current.caveats.join("\n");
         else if(detailTab=="moves"){
            for each(var move:Object in current.moves)content+=move.name+" · "+move.level+"级可学\n"+move.description+"\n\n";
            if(current.fifth!=null)content+="独立第五技能（不占四个常规位）\n"+current.fifth.name+"\n"+current.fifth.description+"\n";
            content+="\n按实际对局替换，不要求四招固定不变。";
         } else if(detailTab=="training")content=current.training.join("\n\n")+"\n\n个体特性建议："+pet.ability.name+"\n"+pet.ability.description;
         else {
            routeIndex=Math.max(0,Math.min(pet.acquisition.length-1,routeIndex));
            var route:Object=pet.acquisition[routeIndex];
            content="路线 "+(routeIndex+1)+"/"+pet.acquisition.length+"\n"+route.text;
            if(routeIndex>0)action(body,"上一条路线",280,270,110,26,"routePrev");
            if(routeIndex+1<pet.acquisition.length)action(body,"下一条路线",397,270,110,26,"routeNext");
            if(route.target&&int(route.target.mapId)>0)action(body,"前往获取",520,270,110,26,"routeGo");
         }
         pagedText(content,280,105,575,detailTab=="acquisition"?155:195,detailTab=="acquisition"?8:10);
         pager(detailPage+1,detailPages,detailPage>0,detailPage+1<detailPages);
         footer.text="返回列表保留原筛选和页码 · 当前形态独立评级 · 不执行培养或购买";
      }
      private function renderCompare():void
      {
         if(compareIds.length==0){
            label(body,"先选两只精灵，再比较培养价值",18,50,820,40,23,0xFFFFFF,true);
            paragraph(body,"在榜单或详情点击“对比 / 加入比较”。评级按同一培养基准，实际角色能力仍由个体、性格和学习力决定。",18,109,820,15);
         }
         else if(compareIds.length==1)paragraph(body,"已选一只精灵。返回榜单，再加入另一只即可比较六维种族与三个用途评级。",18,95,820,15);
         for(var side:int=0;side<compareIds.length;side++){
            var pet:Object=find(compareIds[side]);if(pet==null)continue;
            var x:Number=side*438;
            portrait(body,pet.id,x+7,0,57,57);
            label(body,pet.name,x+77,1,320,29,20,0xFFFFFF,true);
            label(body,pet.type+"系 · 总种族 "+pet.stats.total+" · "+rating(pet).role,x+77,33,340,24,12,0xD0EEFF);
            if(compareIds.length==2){
               var other:Object=find(compareIds[1-side]);
               var names:Array=["体力","攻击","防御","特攻","特防","速度"];var keys:Array=["hp","atk","def","spAtk","spDef","spd"];
               for(var i:int=0;i<6;i++){
                  var difference:Number=Number(pet.stats[keys[i]])-Number(other.stats[keys[i]]);
                  label(body,names[i],x+18,71+i*23,90,24,13);
                  label(body,String(pet.stats[keys[i]]),x+115,71+i*23,90,24,14,0xFFFFFF,true);
                  label(body,(difference>0?"+":"")+difference,x+237,71+i*23,120,24,13,difference>0?0xB4F5C8:difference<0?0xFFD2B6:0xC9E8F7);
               }
               for(i=0;i<3;i++){
                  var grade:Object=pet.ratings[viewKeys[i]];
                  label(body,viewNames[i]+"："+tierNames[grade.tier]+" "+grade.score,x+18,218+i*23,390,24,14,colors[grade.tier],true);
               }
            }
            action(body,"移除此精灵",x+278,274,138,29,"compare:"+pet.id);
         }
         action(mainUI,"返回榜单",30,463,112,29,"back");footer.text="差值仅表示种族数值高低，不代表所有对局都更强；魂印、技能与队伍分工需一起看。";
      }
      private function renderRules():void
      {
         label(body,"评级口径 · 先选用途，再比较投入价值",0,0,850,35,22,0xFFFFFF,true);
         pagedText(methodology.join("\n\n"),0,48,850,240,12);
         pager(detailPage+1,detailPages,detailPage>0,detailPage+1<detailPages);
         footer.text="评分来自当前本服配置和已接入运行时；未知附加效果不按宣传描述猜测加分。";
      }
      private function pagedText(value:String,x:Number,y:Number,w:Number,h:Number,linesPerPage:int):void
      {
         var field:TextField=label(body,value,x,y,w,h,13,0xE4F5FF);field.wordWrap=true;field.multiline=true;field.text=value;
         var lines:Array=[];
         for(var i:int=0;i<field.numLines;i++)lines.push(field.getLineText(i).replace(/[\r\n]+$/,""));
         var metrics:flash.text.TextLineMetrics=field.getLineMetrics(0);
         var lineHeight:Number=metrics.ascent+metrics.descent+metrics.leading;
         linesPerPage=Math.max(1,Math.min(linesPerPage,Math.floor((h-4)/lineHeight)));
         detailPages=Math.max(1,Math.ceil(lines.length/linesPerPage));detailPage=Math.max(0,Math.min(detailPage,detailPages-1));
         field.wordWrap=false;
         field.text=lines.slice(detailPage*linesPerPage,(detailPage+1)*linesPerPage).join("\n");
      }
      private function pager(current:int,total:int,previous:Boolean,next:Boolean):void
      {
         action(mainUI,"返回榜单",30,463,112,29,"back",viewMode!="list");
         action(mainUI,"上一页",542,463,96,29,"previous",previous);
         var number:TextField=label(mainUI,current+" / "+total,651,468,100,23,13,0xFFFFFF,true);number.name="pageNumber";
         action(mainUI,"下一页",766,463,96,29,"next",next);
      }
      private function openMenu(kind:String):void
      {
         menuKind=kind;menuPage=0;menuValues=["全部"];
         if(kind=="tier")menuValues=menuValues.concat(tierNames);
         else {
            for each(var pet:Object in catalog){var value:String=kind=="type"?String(pet.type):String(rating(pet).role);if(menuValues.indexOf(value)<0)menuValues.push(value);}
            var first:String=menuValues.shift();menuValues.sort();menuValues.unshift(first);
         }
         drawMenu();
      }
      private function drawMenu():void
      {
         if(menu!=null&&menu.parent)menu.parent.removeChild(menu);
         menu=layer(mainUI,menuKind=="type"?28:menuKind=="role"?173:338,143);
         var pages:int=Math.max(1,Math.ceil(menuValues.length/7));menuPage=Math.max(0,Math.min(menuPage,pages-1));
         rect(menu,0,0,230,288,0x0D365A,0x72DCFF,8);
         for(var i:int=menuPage*7;i<Math.min(menuValues.length,(menuPage+1)*7);i++)action(menu,String(menuValues[i]),10,9+(i-menuPage*7)*32,210,29,"pick:"+i);
         action(menu,"◀",10,244,54,29,"menuPrev",menuPage>0);action(menu,"关闭",81,244,70,29,"menuClose");action(menu,"▶",166,244,54,29,"menuNext",menuPage+1<pages);
      }
      private function pick(index:int):void
      {
         if(index<0||index>=menuValues.length)return;
         if(menuKind=="type")typeFilter=String(menuValues[index]);
         else if(menuKind=="role")roleFilter=String(menuValues[index]);
         else tierFilter=index-1;
         pageIndex=0;viewMode="list";render();
      }
      private function closeMenu():void { if(menu!=null&&menu.parent)menu.parent.removeChild(menu);menu=null; }
      private function layer(parent:DisplayObjectContainer,x:Number,y:Number):Sprite { var value:Sprite=new Sprite();value.x=x;value.y=y;parent.addChild(value);return value; }
      private function rect(parent:Sprite,x:Number,y:Number,w:Number,h:Number,fill:uint,border:uint,r:Number=0):void
      {
         parent.graphics.lineStyle(1,border);parent.graphics.beginFill(fill);
         if(r>0)parent.graphics.drawRoundRect(x,y,w,h,r,r);else parent.graphics.drawRect(x,y,w,h);
         parent.graphics.endFill();
      }
      private function label(parent:DisplayObjectContainer,value:String,x:Number,y:Number,w:Number,h:Number,size:int=13,color:uint=0xFFFFFF,bold:Boolean=false):TextField
      {
         var field:TextField=new TextField();var format:TextFormat=new TextFormat("宋体",size,color,bold);format.leading=4;
         field.defaultTextFormat=format;field.x=x;field.y=y;field.width=w;field.height=h;field.mouseEnabled=false;field.selectable=false;field.text=value;parent.addChild(field);return field;
      }
      private function paragraph(parent:DisplayObjectContainer,value:String,x:Number,y:Number,w:Number,size:int=13):Number
      {
         var field:TextField=label(parent,value,x,y,w,1000,size);field.wordWrap=true;field.multiline=true;field.text=value;field.height=Math.ceil(field.textHeight)+8;return field.height;
      }
      private function action(parent:Sprite,value:String,x:Number,y:Number,w:Number,h:Number,command:String,enabled:Boolean=true):Sprite
      {
         var item:Sprite=layer(parent,x,y);item.name=command;item.buttonMode=enabled;item.mouseEnabled=enabled;item.mouseChildren=false;item.alpha=enabled?1:0.45;
         var up:DisplayObject=nativeUI.getDisplayObject("Button_upSkin");var over:DisplayObject=nativeUI.getDisplayObject("Button_overSkin");var down:DisplayObject=nativeUI.getDisplayObject("Button_downSkin");up.width=over.width=down.width=w;up.height=over.height=down.height=h;
         item.addChild(new SimpleButton(up,over,down,up));var field:TextField=label(item,value,3,(h-19)/2,w-6,23,12,0xFFFFFF,true);var format:TextFormat=field.defaultTextFormat;format.align="center";field.setTextFormat(format);return item;
      }
      private function clear(parent:Sprite):void { parent.graphics.clear();while(parent.numChildren)parent.removeChildAt(0); }
      private function disposeArt():void
      {
         for each(var record:Object in loaders){record.disposed=true;try{record.loader.close();}catch(error:Error){}record.loader.unloadAndStop(true);}
         loaders=[];
         for(var i:int=mainUI.numChildren-1;i>=0;i--){var child:DisplayObject=mainUI.getChildAt(i);if(child.name=="previous"||child.name=="next"||child.name=="back"||child.name=="pageNumber")mainUI.removeChild(child);}
      }
      private function stopArt(display:DisplayObject):void
      {
         if(display is MovieClip)MovieClip(display).gotoAndStop(1);
         if(display is DisplayObjectContainer)for(var i:int=0;i<DisplayObjectContainer(display).numChildren;i++)stopArt(DisplayObjectContainer(display).getChildAt(i));
      }
      private function portrait(parent:Sprite,id:int,x:Number,y:Number,w:Number,h:Number,full:Boolean=false):void
      {
         var holder:Sprite=layer(parent,x,y);holder.mouseEnabled=false;holder.mouseChildren=false;
         var loader:Loader=new Loader();var record:Object={loader:loader,disposed:false};loaders.push(record);
         var failed:Function=function(event:Event):void{if(!record.disposed)label(holder,"#"+id,4,h/2-7,w-8,20,10,0xD5EEFF);};
         loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,failed);loader.contentLoaderInfo.addEventListener(SecurityErrorEvent.SECURITY_ERROR,failed);
         loader.contentLoaderInfo.addEventListener(Event.COMPLETE,function(event:Event):void{
            if(record.disposed)return;
            var domain:ApplicationDomain=loader.contentLoaderInfo.applicationDomain;var symbol:String=full?"pet":"item";
            if(!domain.hasDefinition(symbol)){failed(event);return;}
            var definition:Class=domain.getDefinition(symbol) as Class;var display:DisplayObject=new definition() as DisplayObject;stopArt(display);
            var bounds:Rectangle=display.getBounds(display);if(bounds.width<=0||bounds.height<=0)return;
            var scale:Number=Math.min(w/bounds.width,h/bounds.height);display.scaleX=display.scaleY=scale;display.x=(w-bounds.width*scale)/2-bounds.x*scale;display.y=(h-bounds.height*scale)/2-bounds.y*scale;holder.addChild(display);
         });
         var url:String=full?(id>500?"groupFightResource/pet/":"pet/swf/"):"pet/head/";
         loader.load(new URLRequest("/resource/"+url+id+".swf"),new LoaderContext(false,new ApplicationDomain()));
      }
   }
}
