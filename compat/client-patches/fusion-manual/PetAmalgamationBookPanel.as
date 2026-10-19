package com.robot.module.book
{
   import com.robot.core.manager.LevelManager;
   import org.taomee.module.IModule;
   import flash.display.Sprite;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;
   import flash.display.Loader;
   import flash.display.GradientType;
   import flash.events.IOErrorEvent;
   import flash.events.SecurityErrorEvent;
   import flash.net.URLRequest;
   import flash.system.LoaderContext;
   import flash.system.ApplicationDomain;
   import flash.geom.Matrix;
   import flash.display.DisplayObjectContainer;
   import flash.events.Event;
   import flash.events.MouseEvent;
   import flash.geom.Rectangle;
   import flash.text.TextField;
   import flash.text.TextFieldType;
   import flash.text.TextFormat;

   public class PetAmalgamationBookPanel extends Sprite implements IModule
   {
      // Replaced with the reviewed catalogue by the reproducible builder.
      private const catalog:Array = []; // @CATALOG@
      private var mainUI:Sprite;
      private var listLayer:Sprite;
      private var detailView:Sprite;
      private var detailBody:Sprite;
      private var tabsLayer:Sprite;
      private var pagingLayer:Sprite;
      private var scrollLayer:Sprite;
      private var searchInput:TextField;
      private var footer:TextField;
      private var countLabel:TextField;
      private var rows:Array = [];
      private var category:String = "all";
      private var selected:Object;
      private var pageIndex:int = 0;
      private var scrollOffset:Number = 0;
      private var detailHeight:Number = 0;
      private const PAGE_SIZE:int = 6;
      private const VIEW_HEIGHT:Number = 400;

      public function PetAmalgamationBookPanel()
      {
         super();
      }
      public function init(data:Object = null) : void {}
      public function setup() : void
      {
         if(mainUI != null) return;
         mainUI = new Sprite();
         mainUI.name = "fusionManual";
         box(mainUI,0,0,920,520,0x071F36,0x45C9F5,16);
         box(mainUI,5,5,910,510,0x071F36,0x1E6085,12);
         box(mainUI,7,7,906,68,0x0D3A5C,0x0D3A5C,9);
         var book:Sprite = layer(mainUI,24,23);
         box(book,0,0,31,27,0x168AC1,0x9EEAFF,4);
         book.graphics.lineStyle(2,0xD4F6FF);book.graphics.moveTo(15,3);book.graphics.lineTo(15,25);
         book.graphics.moveTo(4,7);book.graphics.lineTo(11,10);book.graphics.moveTo(20,10);book.graphics.lineTo(27,7);
         text(mainUI,"融合手册",68,11,220,40,29,0xE3F6FF,true);
         text(mainUI,"寻找配方，迎接新的伙伴",71,51,240,18,10,0x90C8E4);
         box(mainUI,595,22,262,32,0x07253D,0x3C8EB3,16);
         text(mainUI,"⌕",604,24,20,26,20,0x8BD8F6);
         searchInput = text(mainUI,"",627,28,216,23,12,0xE2F3FB);
         searchInput.type = TextFieldType.INPUT;
         searchInput.selectable = true;
         searchInput.mouseEnabled = true;
         searchInput.maxChars = 40;
         searchInput.wordWrap = false;
         searchInput.multiline = false;
         searchInput.addEventListener(Event.CHANGE,onSearch);
         text(mainUI,"搜索精灵 / 精华 / 元神珠",596,57,260,15,9,0x79AFCB);
         button(mainUI,"×",874,19,32,32,closePanel,0x14557D,0x65D6FC,24);
         box(mainUI,13,88,245,407,0x092B46,0x174D6E,5);
         tabsLayer = layer(mainUI,18,94);
         countLabel = text(mainUI,"",19,131,231,19,10,0x8FBBD3);
         listLayer = layer(mainUI,18,156);
         listLayer.addEventListener(MouseEvent.MOUSE_WHEEL,onListWheel);
         pagingLayer = layer(mainUI,18,466);
         detailView = layer(mainUI,274,89);
         detailView.scrollRect = new Rectangle(0,0,612,VIEW_HEIGHT);
         detailView.addEventListener(MouseEvent.MOUSE_WHEEL,onDetailWheel);
         detailBody = layer(detailView,0,0);
         scrollLayer = layer(mainUI,893,90);
         footer = text(mainUI,"",20,499,880,16,9,0x76ACC9);
         mainUI.setChildIndex(searchInput,mainUI.numChildren-1);
         mainUI.addEventListener(MouseEvent.CLICK,onClick);
         resetSelection();
      }
      public function show() : void
      {
         setup();
         resetSelection();
         mainUI.x = 20;
         mainUI.y = 20;
         LevelManager.appLevel.addChild(mainUI);
      }
      public function hide() : void
      {
         if(mainUI != null && mainUI.parent != null) mainUI.parent.removeChild(mainUI);
      }
      public function destroy() : void
      {
         hide();
         if(mainUI == null) return;
         searchInput.removeEventListener(Event.CHANGE,onSearch);
         mainUI.removeEventListener(MouseEvent.CLICK,onClick);
         listLayer.removeEventListener(MouseEvent.MOUSE_WHEEL,onListWheel);
         detailView.removeEventListener(MouseEvent.MOUSE_WHEEL,onDetailWheel);
         clear(mainUI);
         mainUI = null;
         searchInput = null;
         listLayer = null;
         detailView = null;
         detailBody = null;
         tabsLayer = null;
         pagingLayer = null;
         scrollLayer = null;
         footer = null;
         countLabel = null;
         selected = null;
         rows = [];
      }
      private function closePanel(e:MouseEvent) : void { hide(); }
      private function resetSelection() : void
      {
         category = "all";
         searchInput.text = "";
         pageIndex = 0;
         selected = catalog[0];
         updateRows();
         renderDetail();
      }
      private function layer(parent:DisplayObjectContainer,x:Number,y:Number) : Sprite
      {
         var result:Sprite = new Sprite();
         result.x = x; result.y = y;
         parent.addChild(result);
         return result;
      }
      private function clear(parent:DisplayObjectContainer) : void
      {
         while(parent.numChildren > 0) parent.removeChildAt(0);
      }
      private function box(parent:Sprite,x:Number,y:Number,w:Number,h:Number,fill:uint,border:uint,r:Number = 5) : void
      {
         parent.graphics.lineStyle(1,border);
         var matrix:Matrix = new Matrix();
         matrix.createGradientBox(w,h,Math.PI/2,x,y);
         parent.graphics.beginGradientFill(GradientType.LINEAR,[fill,fill & 0xDDEEFF],[1,1],[0,255],matrix);
         parent.graphics.drawRoundRect(x,y,w,h,r,r);
         parent.graphics.endFill();
      }
      private function text(parent:DisplayObjectContainer,value:String,x:Number,y:Number,w:Number,h:Number,size:int = 12,color:uint = 0xC7E4F4,bold:Boolean = false) : TextField
      {
         var field:TextField = new TextField();
         var format:TextFormat = new TextFormat("Microsoft YaHei",size,color,bold);
         format.leading = 3;
         field.defaultTextFormat = format;
         field.x = x; field.y = y; field.width = w; field.height = h;
         field.wordWrap = false; field.multiline = false;
         field.mouseEnabled = false; field.selectable = false;
         field.text = value;
         parent.addChild(field);
         return field;
      }
      private function paragraph(parent:DisplayObjectContainer,value:String,x:Number,y:Number,w:Number,size:int = 12,color:uint = 0xBDDCEE,bold:Boolean = false) : Number
      {
         var field:TextField = text(parent,value,x,y,w,1000,size,color,bold);
         field.wordWrap = true; field.multiline = true; field.text = value;
         field.height = Math.ceil(field.textHeight) + 6;
         return field.height;
      }
      private function button(parent:Sprite,label:String,x:Number,y:Number,w:Number,h:Number,handler:Function = null,fill:uint = 0x103D5C,border:uint = 0x2C6B8E,size:int = 11) : Sprite
      {
         var target:Sprite = layer(parent,x,y);
         box(target,0,0,w,h,fill,border,6);
         var field:TextField = text(target,label,2,(h-size-6)/2,w-4,size+8,size,0xDBF3FF,true);
         var format:TextFormat = field.defaultTextFormat;
         format.align = "center";
         field.setTextFormat(format);
         target.buttonMode = true;
         target.mouseChildren = false;
         if(handler != null) target.addEventListener(MouseEvent.CLICK,handler);
         return target;
      }
      private function categoryName(value:String) : String
      {
         if(value == "fixed") return "固定配方";
         if(value == "miracle") return "奇迹融合";
         if(value == "rare") return "稀有粉珠";
         if(value == "fallback") return "未匹配配方";
         return "全部";
      }
      private function updateRows() : void
      {
         rows = [];
         var query:String = searchInput.text.toLowerCase().replace(/^\s+|\s+$/g,"");
         for each(var item:Object in catalog)
         {
            if(category == "all" ? item.kind == "rare" : item.kind != category) continue;
            if(query != "" && String(item.search).toLowerCase().indexOf(query) < 0) continue;
            rows.push(item);
         }
         var found:Boolean = false;
         for each(var candidate:Object in rows) if(selected != null && candidate.id == selected.id) found = true;
         if(!found) selected = rows.length > 0 ? rows[0] : null;
         pageIndex = Math.max(0,Math.min(pageIndex,Math.ceil(rows.length/PAGE_SIZE)-1));
         renderTabs();
         renderList();
      }
      private function renderTabs() : void
      {
         clear(tabsLayer);
         var kinds:Array = ["all","fixed","miracle","rare"];
         for(var i:int=0;i<kinds.length;i++)
         {
            var active:Boolean = category == kinds[i];
            var tabButton:Sprite = button(tabsLayer,categoryName(kinds[i]),i*59,0,55,29,null,active?0x087BB6:0x103B59,active?0x82E6FC:0x2A6487,10);
            tabButton.name = "tab:"+kinds[i];
         }
      }
      private function renderList() : void
      {
         clear(listLayer); clear(pagingLayer);
         countLabel.text = categoryName(category)+"    /    "+rows.length+" 条";
         if(rows.length == 0) text(listLayer,"没有找到相关配方\n试试精灵名或精华名称",12,55,208,70,12,0x8DBBD2);
         var start:int = pageIndex*PAGE_SIZE;
         for(var i:int=start;i<Math.min(rows.length,start+PAGE_SIZE);i++)
         {
            var r:Object = rows[i];
            var active:Boolean = selected != null && r.id == selected.id;
            var row:Sprite = button(listLayer,"",0,(i-start)*50,231,45,null,active?0x145D84:0x103751,active?0x7EE7FD:0x245E7D);
            row.name = "row:"+r.id;
            text(row,String(i+1),7,14,21,20,9,0x8ABBD6);
            art(row,"head",r.petId != null ? r.petId : r.mainId,27,3,38,39);
            text(row,r.name,69,5,147,23,13,active?0xFFE19A:0xE2F0F9,true);
            text(row,r.kind=="miracle"?r.soul+" · 随机":r.kind=="rare"?"粉色元神珠 · 5%":r.soul,69,27,152,16,9,0x8FBBD1);
         }
         var previous:Sprite = button(pagingLayer,"‹",0,0,35,23);
         previous.name = "previous"; previous.alpha = pageIndex>0?1:0.35;
         text(pagingLayer,String(pageIndex+1)+" / "+Math.max(1,Math.ceil(rows.length/PAGE_SIZE)),75,2,100,20,10,0x91C2DE);
         var next:Sprite = button(pagingLayer,"›",196,0,35,23);
         next.name = "next"; next.alpha = (pageIndex+1)*PAGE_SIZE<rows.length?1:0.35;
      }
      private function stopArt(display:DisplayObject) : void
      {
         if(display is MovieClip) MovieClip(display).gotoAndStop(1);
         if(display is DisplayObjectContainer)
         {
            var container:DisplayObjectContainer = display as DisplayObjectContainer;
            for(var i:int=0;i<container.numChildren;i++) stopArt(container.getChildAt(i));
         }
      }
      private function art(parent:Sprite,kind:String,id:*,x:Number,y:Number,w:Number,h:Number) : void
      {
         if(id == null || uint(id) == 0) {
            var unknown:Sprite = layer(parent,x,y);
            unknown.graphics.lineStyle(2,0x6FCBEA);unknown.graphics.beginFill(0x1D5879,0.5);
            unknown.graphics.drawCircle(w/2,h/2,Math.min(w,h)*0.32);unknown.graphics.endFill();
            text(unknown,"?",w/2-10,h/2-17,24,35,25,0xB6EBFF,true);
            return;
         }
         var holder:Sprite = layer(parent,x,y);
         holder.mouseEnabled = false; holder.mouseChildren = false;
         var loader:Loader = new Loader();
         var url:String = "/resource/";
         if(kind == "pet") url += (uint(id)>500?"groupFightResource/pet/":"pet/swf/")+id+".swf";
         else if(kind == "head") url += "pet/head/"+id+".swf";
         else if(kind == "soul") url += "soulBead/icon/"+id+".swf";
         else url += "item/doodle/icon/"+id+".swf";
         var disposed:Boolean = false;
         var finished:Boolean = false;
         var failed:Function = function(event:Event):void {
            finished = true;
            if(!disposed) text(holder,"素材加载失败",0,h/2-8,w,20,10,0xF6C088);
         };
         loader.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,failed);
         loader.contentLoaderInfo.addEventListener(SecurityErrorEvent.SECURITY_ERROR,failed);
         loader.contentLoaderInfo.addEventListener(Event.COMPLETE,function(event:Event):void {
            finished = true;
            if(disposed) return;
            var symbol:String = kind=="pet"?"pet":"item";
            var definition:Class = loader.contentLoaderInfo.applicationDomain.getDefinition(symbol) as Class;
            var display:DisplayObject = new definition() as DisplayObject;
            stopArt(display);
            var bounds:Rectangle = display.getBounds(display);
            var scale:Number = Math.min((w-4)/bounds.width,(h-4)/bounds.height);
            display.scaleX = scale; display.scaleY = scale;
            display.x = (w-bounds.width*scale)/2-bounds.x*scale;
            display.y = (h-bounds.height*scale)/2-bounds.y*scale;
            holder.addChild(display);
         });
         holder.addEventListener(Event.REMOVED_FROM_STAGE,function(event:Event):void {
            if(event.target != holder) return;
            disposed = true;
            if(!finished) loader.close();
            loader.unload();
         });
         loader.load(new URLRequest(url),new LoaderContext(false,new ApplicationDomain()));
      }
      private function sectionTitle(label:String,y:Number,hint:String = "") : Number
      {
         text(detailBody,label,0,y,260,24,14,0x77DCFF,true);
         if(hint != "") text(detailBody,hint,320,y+4,281,20,9,0x82B4CD);
         return y+29;
      }
      private function renderDetail() : void
      {
         clear(detailBody); detailBody.graphics.clear();
         scrollOffset = 0; detailBody.y = 0;
         if(selected == null)
         {
            text(detailBody,"没有符合搜索条件的配方",40,80,500,40,16,0x9CC5DC);
            detailHeight = 160; updateScroll();
            footer.text = "融合研究所 / 无搜索结果";
            return;
         }
         var r:Object = selected;
         box(detailBody,0,0,601,124,0x10446B,0x319CCC,10);
         text(detailBody,r.name,18,17,390,39,28,0xFFDD83,true);
         text(detailBody,categoryName(r.kind)+(r.type?"  ·  "+r.type+"系":""),20,61,360,24,13,0x9ADFFF);
         text(detailBody,r.kind=="miracle"?"融合结果按权重随机获得":r.kind=="rare"?"粉色元神珠的稀有结果":r.soul+"  →  "+r.name,20,91,380,23,12,0xD4EBF8);
         detailBody.graphics.lineStyle(2,0x2580AC);
         detailBody.graphics.beginFill(0x1596CE,0.15);detailBody.graphics.drawEllipse(427,97,147,18);detailBody.graphics.endFill();
         art(detailBody,"pet",r.petId != null?r.petId:r.mainId,425,3,155,112);
         var y:Number = 138;
         if(r.kind == "rare")
         {
            y = sectionTitle("粉珠来源",y,"每条来源均有 5% 粉珠分支");
            for each(var sourceId:String in r.sources)
            {
               var source:Object = findEntry(sourceId);
               var panel:Sprite = layer(detailBody,0,y);
               var title:Sprite = button(panel,source.name+"配方  ›",9,8,170,23,null,0x174564,0x386F8D,11);
               title.name = "source:"+source.id;
               text(panel,"粉色元神珠 5%",450,11,145,20,10,0xF3B4D9);
               text(panel,source.main+" + "+source.essence+" ×1 → 粉色元神珠 → "+r.name,12,38,578,23,12,0xD6EAF5);
               var sourceBottom:Number = optionTags(panel,source.secondary,67);
               box(panel,0,0,601,sourceBottom+7,0x0B2E47,0x28617F,6);
               y += sourceBottom+17;
            }
         }
         else
         {
            y = sectionTitle("融合配方",y,r.kind=="miracle"?"同属性副宠 / 闪光系副宠":"副宠任选一只");
            y = recipe(r,y);
            if(r.rareId != null)
            {
               var rareButton:Sprite = button(detailBody,"另有 5% 粉色元神珠 → "+findEntry(r.rareId).name+"    查看来源 ›",0,y,601,27,null,0x3B304A,0x996887,11);
               rareButton.name = "source:"+r.rareId;
               y += 36;
            }
            if(r.outcomes != null)
            {
               y = sectionTitle("可能孵化",y,"随机获得一只");
               for(var i:int=0;i<r.outcomes.length;i++)
               {
                  var o:Object = r.outcomes[i];
                  var ox:Number = (i%3)*202;
                  var oy:Number = y+int(i/3)*31;
                  box(detailBody,ox,oy,195,26,0x0D3049,0x285A76,4);
                  text(detailBody,o.name,ox+7,oy+4,118,20,11,0xCDE7F3);
                  text(detailBody,o.percent,ox+125,oy+4,66,20,10,0xF9DA8B,true);
               }
               y += Math.ceil(r.outcomes.length/3)*31+4;
               y += paragraph(detailBody,r.kind=="fallback"?"三种结果等概率，各为 1/3。":"按现网权重计算，重复结果已合并；显示百分比经四舍五入。",0,y,601,10,0x84B6D1)+9;
            }
         }
         y = sectionTitle("获得方式",y);
         var acquired:String = r.acquisition;
         var acquiredPanel:Sprite = layer(detailBody,0,y);
         if(acquired != "") {
            var acquiredHeight:Number = paragraph(acquiredPanel,acquired,10,7,580,12)+14;
            box(acquiredPanel,0,0,601,acquiredHeight,0x0C3452,0x2A7095,6);
            y += acquiredHeight+12;
         }
         y = sectionTitle("注意事项",y);
         var notePanel:Sprite = layer(detailBody,0,y);
         var noteHeight:Number = paragraph(notePanel,r.notes,9,6,581,11)+12;
         box(notePanel,0,0,601,noteHeight,0x092940,0x245572,5);
         y += noteHeight+8;
         detailHeight = y;
         updateScroll();
         footer.text = "融合研究所 / "+categoryName(r.kind)+(detailHeight>VIEW_HEIGHT?"    ·    滚轮或右侧箭头查看更多":"");
      }
      private function recipe(r:Object,y:Number) : Number
      {
         var strip:Sprite = layer(detailBody,0,y);
         var widths:Array = [99,127,93,104,106];
         var names:Array = [r.main,r.kind=="fixed"?"任选一只副宠":"符合条件的副宠",r.kind=="fallback"?"属性对应精华":r.essence,r.soul,r.kind=="fixed"?r.name:"随机结果"];
         var roles:Array = ["主宠 · 最终形态","副宠", "精华 ×1","元神珠","结果精灵"];
         var kinds:Array = ["pet","pet","item","soul","pet"];
         var ids:Array = [r.mainId,r.secondaryIds!=null?r.secondaryIds[0]:(r.kind=="miracle"?310:null),r.essenceId,r.soulId,r.petId];
         var x:Number = 0;
         for(var i:int=0;i<5;i++)
         {
            var w:Number = widths[i];
            var card:Sprite = layer(strip,x,0);
            box(card,0,0,w,119,i==4?0x39452E:0x103B5B,i==4?0xF2D471:0x2788B5,7);
            text(card,roles[i],7,5,w-10,20,10,0xA8D7ED);
            art(card,kinds[i],ids[i],7,25,w-14,63);
            text(card,names[i],5,92,w-8,23,i==1?12:11,i==4?0xFFE69D:0xE0F4FF,true);
            if(i<4) text(strip,i<2?"+":"→",x+w+1,46,18,28,13,0x70DEFF,true);
            x += w+18;
         }
         var bottom:Number = optionTags(strip,r.secondary,128);
         text(strip,"消耗：主宠 + 副宠 + 精华 1 个 + 1000 赛尔豆",0,bottom+9,601,22,12,0xF2D88C);
         return y+bottom+41;
      }
      private function optionTags(parent:Sprite,value:String,y:Number) : Number
      {
         text(parent,"副宠",0,y+3,36,22,11,0x86CFF0,true);
         var x:Number = 40;
         var options:Array = value.split(" / ");
         for each(var option:String in options)
         {
            var w:Number = option.length*12+18;
            if(x+w>601) { x=40;y+=29; }
            box(parent,x,y,w,24,0x124767,0x307A9E,5);
            text(parent,option,x+8,y+3,w-12,21,12,0xD6F0FF);
            x += w+6;
         }
         return y+24;
      }
      private function updateScroll() : void
      {
         clear(scrollLayer);scrollLayer.graphics.clear();
         var maxScroll:Number = Math.max(0,detailHeight-VIEW_HEIGHT);
         scrollOffset = Math.max(0,Math.min(scrollOffset,maxScroll));
         detailBody.y = -scrollOffset;
         if(maxScroll == 0) return;
         var up:Sprite = button(scrollLayer,"▲",0,0,15,23,null,0x133E59,0x337494,7);up.name="up";
         var down:Sprite = button(scrollLayer,"▼",0,377,15,23,null,0x133E59,0x337494,7);down.name="down";
         box(scrollLayer,5,29,5,342,0x12384F,0x245875,3);
         var thumbHeight:Number = Math.max(25,342*VIEW_HEIGHT/detailHeight);
         box(scrollLayer,4,29+(342-thumbHeight)*scrollOffset/maxScroll,7,thumbHeight,0x4394BC,0x67C5E7,4);
      }
      private function findEntry(id:String) : Object
      {
         for each(var r:Object in catalog) if(r.id==id) return r;
         return null;
      }
      private function onSearch(e:Event) : void { pageIndex=0;updateRows();renderDetail(); }
      private function onListWheel(e:MouseEvent) : void
      {
         pageIndex += e.delta<0?1:-1;updateRows();e.stopPropagation();
      }
      private function onDetailWheel(e:MouseEvent) : void
      {
         scrollOffset -= e.delta*22;updateScroll();e.stopPropagation();
      }
      private function onClick(e:MouseEvent) : void
      {
         var target:Sprite = e.target as Sprite;
         if(target == null) return;
         var name:String = target.name;
         if(name.indexOf("tab:")==0)
         {
            category=name.substr(4);pageIndex=0;updateRows();renderDetail();
         }
         else if(name.indexOf("row:")==0)
         {
            selected=findEntry(name.substr(4));renderList();renderDetail();
         }
         else if(name.indexOf("source:")==0)
         {
            selected=findEntry(name.substr(7));category=selected.kind;searchInput.text="";pageIndex=0;updateRows();
            pageIndex=int(rows.indexOf(selected)/PAGE_SIZE);renderList();renderDetail();
         }
         else if(name=="previous" || name=="next") {pageIndex+=name=="next"?1:-1;updateRows();}
         else if(name=="up" || name=="down") {scrollOffset+=name=="down"?90:-90;updateScroll();}
      }
   }
}
