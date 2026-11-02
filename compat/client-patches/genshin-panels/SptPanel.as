package com.robot.module.app
{
   import com.robot.app.mapProcess.UniverseAtlas;
   import com.robot.app.mapProcess.UniverseState;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.manager.TasksManager;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.text.TextField;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;

   public class SptPanel extends Sprite implements IModule
   {
      // @LIVE_DATA@
      private var _panel:Sprite;
      private var _tabsContainer:Sprite;
      private var _filterBar:Sprite;
      private var _cardsArea:Sprite;
      private var _detail:Sprite;
      private var _pagination:Sprite;
      private var _locationPopup:Sprite;
      private var _filteredBosses:Array=[];
      private var _currentGalaxy:String="帕诺星系";
      private var _currentFilter:String="全部";
      private var _curPage:int=1;
      private var _pageSize:int=6;
      private var _selectedBoss:Object;

      public function SptPanel(){super();}
      public function setup():void
      {
         if(_panel)return;
         uiRect(this,0,0,960,560,0x202735,0.88);
         _panel=new Sprite();_panel.x=20;_panel.y=20;addChild(_panel);
         uiFrame(_panel,920,520,"讨伐 · 星际首领","赛尔先锋队  /  记录首领情报，寻找下一场挑战");
         uiClose(_panel,869,23).addEventListener(MouseEvent.CLICK,onClose);
         _tabsContainer=new Sprite();_tabsContainer.y=124;_panel.addChild(_tabsContainer);
         _filterBar=new Sprite();_filterBar.x=204;_filterBar.y=101;_panel.addChild(_filterBar);
         _cardsArea=new Sprite();_cardsArea.x=204;_cardsArea.y=146;_panel.addChild(_cardsArea);
         _detail=new Sprite();_detail.x=456;_detail.y=105;_panel.addChild(_detail);
         _pagination=new Sprite();_pagination.x=204;_pagination.y=472;_panel.addChild(_pagination);
         renderGalaxyTabs();renderFilters();updateFilter();
      }
      public function init(data:Object=null):void{setup();}
      public function show():void
      {
         setup();LevelManager.showOrRemoveMapLevelandToolslevel(false,true);
         LevelManager.appLevel.addChild(this);updateFilter();
      }
      public function hide():void
      {
         uiRelease(this);LevelManager.showOrRemoveMapLevelandToolslevel(true);
         DisplayUtil.removeForParent(this);ModuleManager.destroyForInstance(this);
      }
      public function destroy():void{uiRelease(this);}
      private function onClose(event:MouseEvent):void{hide();}
      private function renderGalaxyTabs():void
      {
         uiClear(_tabsContainer);
         for(var i:int=0;i<GALAXIES.length;i++){
            var button:Sprite=uiNav(_tabsContainer,GALAXIES[i],0,i*33,178,31,String(GALAXIES[i]),_currentGalaxy==GALAXIES[i],i+1);
            button.addEventListener(MouseEvent.CLICK,onGalaxy);
         }
      }
      private function onGalaxy(event:MouseEvent):void
      {
         _currentGalaxy=event.currentTarget.name;_curPage=1;_selectedBoss=null;renderGalaxyTabs();updateFilter();
      }
      private function renderFilters():void
      {
         uiClear(_filterBar);var states:Array=["全部","未击败","已击败"];
         for(var i:int=0;i<states.length;i++)uiButton(_filterBar,states[i],i*76,0,70,28,states[i],_currentFilter==states[i]).addEventListener(MouseEvent.CLICK,onFilter);
      }
      private function onFilter(event:MouseEvent):void
      {
         _currentFilter=event.currentTarget.name;_curPage=1;_selectedBoss=null;renderFilters();updateFilter();
      }
      private function isBossDefeated(b:Object):Boolean
      {
         var sptId:int=int(b.sptId);var achievements:Array=MainManager.actorInfo.bossAchievement;
         if(sptId>=1&&sptId<=200&&achievements&&achievements[sptId-1]===true)return true;
         return b.taskId&&TasksManager.getTaskStatus(b.taskId)==TasksManager.COMPLETE;
      }
      private function mergeDuplicateBosses(list:Array):Array
      {
         var out:Array=[];var seen:Object={};
         for each(var b:Object in list){
            var key:String=String(b.id)+":"+String(b.sptId)+":"+String(b.name);var hit:Object=seen[key];
            if(!hit){hit={};for(var k:String in b)hit[k]=b[k];hit.maps=[{mapId:b.mapId,loc:b.loc}];seen[key]=hit;out.push(hit);}
            else hit.maps.push({mapId:b.mapId,loc:b.loc});
         }
         return out;
      }
      private function updateFilter():void
      {
         if(!_panel)return;var list:Array=[];
         for each(var b:Object in BOSSES){
            if(_currentGalaxy!="全部"&&b.galaxy!=_currentGalaxy)continue;
            var done:Boolean=isBossDefeated(b);
            if(_currentFilter=="已击败"&&!done||_currentFilter=="未击败"&&done)continue;
            list.push(b);
         }
         _filteredBosses=mergeDuplicateBosses(list);
         _curPage=Math.max(1,Math.min(_curPage,Math.max(1,Math.ceil(_filteredBosses.length/_pageSize))));
         renderCards();
      }
      private function renderCards():void
      {
         uiClear(_cardsArea);uiClear(_pagination);
         var start:int=(_curPage-1)*_pageSize;var end:int=Math.min(_filteredBosses.length,start+_pageSize);
         var containsSelection:Boolean=false;
         for(var n:int=start;n<end;n++)if(_filteredBosses[n]===_selectedBoss)containsSelection=true;
         if(!containsSelection)_selectedBoss=start<end?_filteredBosses[start]:null;
         for(var i:int=start;i<end;i++){
            var b:Object=_filteredBosses[i];var row:Sprite=new Sprite();row.x=0;row.y=(i-start)*51;row.name=String(i);_cardsArea.addChild(row);
            var active:Boolean=b===_selectedBoss;
            uiRect(row,0,0,226,46,active?UI_WHITE:0xE4DDCF,active?1:0.65,3);
            if(active){uiRect(row,0,0,3,46,UI_GOLD);uiDiamond(row,219,23,4,UI_GOLD);}
            uiArt(row,b.id,8,5,36,36);
            uiText(row,b.name,53,3,163,22,13,UI_INK,true);
            uiText(row,isBossDefeated(b)?"已完成讨伐":"等级 "+(b.lv?b.lv:"—")+"  ·  未击败",53,25,166,18,10,isBossDefeated(b)?0x64836A:UI_MUTED);
            row.mouseChildren=false;row.buttonMode=true;row.addEventListener(MouseEvent.CLICK,onSelect);
         }
         uiButton(_pagination,"‹",0,0,42,27,"prev",false,_curPage>1).addEventListener(MouseEvent.CLICK,onPage);
         uiText(_pagination,_curPage+" / "+Math.max(1,Math.ceil(_filteredBosses.length/_pageSize)),48,3,125,24,12,UI_INK,false,"center");
         uiButton(_pagination,"›",182,0,42,27,"next",false,end<_filteredBosses.length).addEventListener(MouseEvent.CLICK,onPage);
         uiText(_pagination,_filteredBosses.length+" 位首领",0,-21,226,18,10,UI_MUTED,false,"center");
         renderDetail();
      }
      private function onSelect(event:MouseEvent):void{_selectedBoss=_filteredBosses[int(event.currentTarget.name)];renderCards();}
      private function onPage(event:MouseEvent):void{_curPage+=event.currentTarget.name=="next"?1:-1;_selectedBoss=null;renderCards();}
      private function renderDetail():void
      {
         uiClear(_detail);
         if(!_selectedBoss){uiText(_detail,"暂无符合条件的首领",24,140,380,35,22,UI_INK,true,"center");return;}
         var b:Object=_selectedBoss;var done:Boolean=isBossDefeated(b);
         uiText(_detail,b.name,7,0,382,34,25,UI_INK,true);
         uiText(_detail,b.galaxy+"  /  "+(b.maps.length>1?b.maps.length+" 处挑战地点":b.loc),8,38,399,24,11,UI_MUTED);
         uiSeal(_detail,211,138,70,UI_GOLD,0.28);uiArt(_detail,b.id,99,63,222,148,true);
         uiText(_detail,"Lv. "+(b.lv?b.lv:"—"),8,86,100,30,19,UI_INK,true);
         uiText(_detail,"体力",8,125,74,20,10,UI_MUTED);uiText(_detail,b.hp?String(b.hp):"未知",8,146,110,26,17,UI_INK);
         uiText(_detail,done?"✓ 已击败":"尚未击败",318,91,94,23,11,done?0x64836A:UI_MUTED,false,"right");
         uiLine(_detail,8,219,410);
         uiText(_detail,"讨伐情报",8,231,120,24,14,UI_INK,true);
         var field:TextField=uiText(_detail,b.mech,8,261,410,85,12,UI_INK);field.multiline=true;field.wordWrap=true;field.text=b.mech;field.mouseEnabled=true;
         field.addEventListener(MouseEvent.MOUSE_WHEEL,function(event:MouseEvent):void{field.scrollV-=event.delta;event.stopPropagation();});
         var previous:Sprite=uiButton(_detail,"↑",338,229,35,24,"up");var next:Sprite=uiButton(_detail,"↓",381,229,35,24,"down");
         previous.visible=next.visible=field.maxScrollV>1;
         previous.addEventListener(MouseEvent.CLICK,function(event:MouseEvent):void{field.scrollV=Math.max(1,field.scrollV-3);});
         next.addEventListener(MouseEvent.CLICK,function(event:MouseEvent):void{field.scrollV=Math.min(field.maxScrollV,field.scrollV+3);});
         var reward:uint=uint(SPT_REWARDS[b.sptId]);if(!reward&&int(b.sptId)==1)reward=46;
         uiText(_detail,"首胜奖励",8,354,110,19,10,UI_MUTED);
         uiText(_detail,reward?PetXMLInfo.getName(reward):"首领专属奖励",8,375,225,23,13,UI_INK,true);
         uiButton(_detail,b.maps.length>1?"选择挑战地点":done?"再次挑战":"追踪首领",250,365,168,34,"challenge",true).addEventListener(MouseEvent.CLICK,onChallenge);
      }
      private function onChallenge(event:MouseEvent):void
      {
         if(_selectedBoss.maps.length>1){showLocationMenu(_selectedBoss);return;}
         travel(_selectedBoss.mapId);
      }
      private function travel(mapId:uint):void
      {
         hide();if(UniverseState.scene(mapId)!=null&&!UniverseState.canTravel(mapId))UniverseAtlas.openAt(mapId);else MapManager.changeMap(mapId);
      }
      private function showLocationMenu(b:Object):void
      {
         if(_locationPopup&&_locationPopup.parent)_locationPopup.parent.removeChild(_locationPopup);
         _locationPopup=new Sprite();uiRect(_locationPopup,0,0,960,560,0x202735,0.7);addChild(_locationPopup);
         var p:Sprite=new Sprite();p.x=295;p.y=150;_locationPopup.addChild(p);
         uiFrame(p,370,110+b.maps.length*40,b.name,"选择挑战地点",0);
         for(var i:int=0;i<b.maps.length;i++){
            var row:Sprite=uiButton(p,b.maps[i].loc,25,95+i*40,320,32,String(b.maps[i].mapId));
            row.addEventListener(MouseEvent.CLICK,function(event:MouseEvent):void{travel(uint(event.currentTarget.name));});
         }
         uiClose(p,323,20).addEventListener(MouseEvent.CLICK,function(event:MouseEvent):void{removeChild(_locationPopup);_locationPopup=null;});
      }
      // @PANEL_ART@
   }
}
