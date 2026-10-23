package com.robot.module.app
{
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.manager.TasksManager;
   import flash.display.DisplayObject;
   import flash.display.Loader;
   import flash.display.Shape;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.IOErrorEvent;
   import flash.events.MouseEvent;
   import flash.net.URLRequest;
   import flash.system.ApplicationDomain;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.text.TextFormatAlign;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;
   
   [SWF(frameRate="24",backgroundColor="#000000",width="960",height="560")]
   public class SptPanel extends Sprite implements IModule
   {
      
      private const BOSSES:Array = [{
         "id":47,
         "name":"蘑菇怪",
         "galaxy":"帕诺星系",
         "loc":"克洛斯星-克洛斯星林间",
         "mapId":12,
         "lv":80,
         "hp":0,
         "sptId":1
      },{
         "id":34,
         "name":"钢牙鲨",
         "galaxy":"帕诺星系",
         "loc":"海洋星-海洋星海底",
         "mapId":22,
         "lv":80,
         "hp":0,
         "sptId":2
      },{
         "id":42,
         "name":"里奥斯",
         "galaxy":"帕诺星系",
         "loc":"火山星-火山星山洞深处",
         "mapId":17,
         "lv":80,
         "hp":0,
         "sptId":3
      },{
         "id":50,
         "name":"阿克希亚",
         "galaxy":"帕诺星系",
         "loc":"塞西利亚星",
         "mapId":40,
         "lv":80,
         "hp":0,
         "sptId":4
      },{
         "id":69,
         "name":"提亚斯",
         "galaxy":"帕诺星系",
         "loc":"云霄星-云霄星最高层",
         "mapId":27,
         "lv":80,
         "hp":0,
         "sptId":5
      },{
         "id":70,
         "name":"雷伊",
         "galaxy":"帕诺星系",
         "loc":"赫尔卡星-赫尔卡星荒地",
         "mapId":32,
         "lv":80,
         "hp":0,
         "sptId":6
      },{
         "id":88,
         "name":"纳多雷",
         "galaxy":"帕诺星系",
         "loc":"双子阿尔法星-阿尔法星岩地",
         "mapId":106,
         "lv":80,
         "hp":0,
         "sptId":7
      },{
         "id":113,
         "name":"雷纳多",
         "galaxy":"帕诺星系",
         "loc":"双子贝塔星-贝塔星荒原",
         "mapId":49,
         "lv":80,
         "hp":0,
         "sptId":8
      },{
         "id":132,
         "name":"尤纳斯",
         "galaxy":"帕诺星系",
         "loc":"拜伦号",
         "mapId":314,
         "lv":80,
         "hp":0,
         "sptId":9
      },{
         "id":187,
         "name":"魔狮迪露",
         "galaxy":"帕诺星系",
         "loc":"斯诺星-斯诺岩洞",
         "mapId":53,
         "lv":80,
         "hp":0,
         "sptId":10
      },{
         "id":261,
         "name":"盖亚",
         "galaxy":"帕诺星系",
         "loc":"露希欧星",
         "mapId":54,
         "lv":80,
         "hp":0,
         "sptId":14
      },{
         "id":216,
         "name":"哈莫雷特",
         "galaxy":"卡兰星系",
         "loc":"尼古尔星/塔克星",
         "mapId":57,
         "lv":80,
         "hp":0,
         "sptId":11
      },{
         "id":264,
         "name":"奈尼芬多",
         "galaxy":"卡兰星系",
         "loc":"艾迪星",
         "mapId":325,
         "lv":80,
         "hp":0,
         "sptId":12
      },{
         "id":169,
         "name":"卡特斯",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场试炼之门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":28
      },{
         "id":171,
         "name":"魔牙鲨",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第1门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":36
      },{
         "id":174,
         "name":"贝鲁基德",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第2门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":37
      },{
         "id":177,
         "name":"巴弗洛",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第3门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":38
      },{
         "id":183,
         "name":"奇拉塔顿",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第3门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":39
      },{
         "id":195,
         "name":"西萨拉斯",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第4门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":40
      },{
         "id":192,
         "name":"克林卡修",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第4门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":41
      },{
         "id":222,
         "name":"卡库",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第5门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":42
      },{
         "id":224,
         "name":"赫德卡",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第5门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":43
      },{
         "id":227,
         "name":"伊兰罗尼",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第5门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":44
      },{
         "id":356,
         "name":"斯加尔卡",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第6门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":45
      },{
         "id":297,
         "name":"艾尔伊洛",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第6门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":46
      },{
         "id":359,
         "name":"布林克克",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第6门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":47
      },{
         "id":438,
         "name":"魔花使者",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第7门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":48
      },{
         "id":441,
         "name":"莫尔加斯",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第7门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":49
      },{
         "id":435,
         "name":"萨诺拉斯",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第7门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":50
      },{
         "id":347,
         "name":"远古鱼龙",
         "galaxy":"卡兰星系",
         "loc":"尼古尔星-尼古尔海底",
         "mapId":442,
         "lv":80,
         "hp":0,
         "sptId":17
      },{
         "id":393,
         "name":"上古炎兽",
         "galaxy":"帕诺星系",
         "loc":"火山星-火山星山洞",
         "mapId":16,
         "lv":80,
         "hp":0,
         "sptId":18
      },{
         "id":421,
         "name":"厄尔塞拉",
         "galaxy":"卡兰星系",
         "loc":"塔克星-光之迷城",
         "mapId":61,
         "lv":80,
         "hp":0,
         "sptId":13
      },{
         "id":274,
         "name":"塔克林",
         "galaxy":"卡兰星系",
         "loc":"艾迪星-虚幻的地下城市",
         "mapId":327,
         "lv":80,
         "hp":0,
         "sptId":15
      },{
         "id":391,
         "name":"塔西亚",
         "galaxy":"卡兰星系",
         "loc":"哈莫星-龙王圣殿",
         "mapId":348,
         "lv":80,
         "hp":0,
         "sptId":16
      },{
         "id":413,
         "name":"塞维尔",
         "galaxy":"卡兰星系",
         "loc":"哈莫星-龙王圣殿",
         "mapId":348,
         "lv":80,
         "hp":0,
         "sptId":19
      },{
         "id":490,
         "name":"劳克蒙德",
         "galaxy":"罗格星系",
         "loc":"比格星-沃尔夫洞穴",
         "mapId":423,
         "lv":80,
         "hp":0,
         "sptId":0
      },{
         "id":672,
         "name":"亚伦斯",
         "galaxy":"罗格星系",
         "loc":"拓梯星-活力源泉",
         "mapId":430,
         "lv":80,
         "hp":0,
         "sptId":31
      },{
         "id":597,
         "name":"史密斯",
         "galaxy":"罗格星系",
         "loc":"般若星",
         "mapId":481,
         "lv":80,
         "hp":0,
         "sptId":72
      },{
         "id":538,
         "name":"克拉尼特",
         "galaxy":"罗格星系",
         "loc":"戴斯星",
         "mapId":435,
         "lv":80,
         "hp":0,
         "sptId":26
      },{
         "id":587,
         "name":"墨杜萨",
         "galaxy":"罗格星系",
         "loc":"墨杜萨星",
         "mapId":437,
         "lv":80,
         "hp":0,
         "sptId":27
      },{
         "id":798,
         "name":"卡修斯",
         "galaxy":"裂空星系",
         "loc":"怀特星-炫彩山山脚",
         "mapId":445,
         "lv":80,
         "hp":0,
         "sptId":57
      },{
         "id":462,
         "name":"月光兽-阿尔达拉",
         "galaxy":"裂空星系",
         "loc":"异能星-月1/15号",
         "mapId":668,
         "lv":80,
         "hp":0,
         "sptId":79
      },{
         "id":501,
         "name":"巴斯特",
         "galaxy":"神兽空间",
         "loc":"玄武传送阵",
         "mapId":666,
         "lv":80,
         "hp":0,
         "sptId":29
      },{
         "id":502,
         "name":"朵拉格",
         "galaxy":"神兽空间",
         "loc":"青龙传送阵",
         "mapId":666,
         "lv":80,
         "hp":0,
         "sptId":61
      },{
         "id":617,
         "name":"肯佩德",
         "galaxy":"罗格星系",
         "loc":"拉铂尔星第一层",
         "mapId":441,
         "lv":80,
         "hp":0,
         "sptId":73
      },{
         "id":299,
         "name":"猛虎王",
         "galaxy":"太空站挑战",
         "loc":"发明家肖恩签到3天",
         "mapId":107,
         "lv":80,
         "hp":0,
         "sptId":66
      },{
         "id":300,
         "name":"谱尼",
         "galaxy":"神兽空间",
         "loc":"勇者之塔神秘领域",
         "mapId":108,
         "lv":80,
         "hp":0,
         "sptId":63
      },{
         "id":479,
         "name":"冰洛伏特",
         "galaxy":"卡兰星系",
         "loc":"斯科尔高空塔",
         "mapId":331,
         "lv":80,
         "hp":0,
         "sptId":23
      },{
         "id":468,
         "name":"罗德利斯",
         "galaxy":"太空站挑战",
         "loc":"太空站拓展",
         "mapId":405,
         "lv":80,
         "hp":0,
         "sptId":24
      },{
         "id":622,
         "name":"加鲁德",
         "galaxy":"太空站挑战",
         "loc":"王者之塔",
         "mapId":465,
         "lv":80,
         "hp":0,
         "sptId":67
      },{
         "id":453,
         "name":"菲拉斯特",
         "galaxy":"太空站挑战",
         "loc":"命运之轮·第10层",
         "mapId":10036,
         "lv":80,
         "hp":0,
         "sptId":68
      },{
         "id":426,
         "name":"迪尔科特",
         "galaxy":"太空站挑战",
         "loc":"太空站拓展",
         "mapId":405,
         "lv":80,
         "hp":0,
         "sptId":25
      },{
         "id":591,
         "name":"杰洛恩",
         "galaxy":"太空站挑战",
         "loc":"太空站左翼",
         "mapId":108,
         "lv":80,
         "hp":0,
         "sptId":69
      },{
         "id":503,
         "name":"白虎",
         "galaxy":"神兽空间",
         "loc":"白虎空间",
         "mapId":483,
         "lv":80,
         "hp":0,
         "sptId":62
      },{
         "id":504,
         "name":"菲尼克斯",
         "galaxy":"神兽空间",
         "loc":"朱雀空间",
         "mapId":318,
         "lv":80,
         "hp":0,
         "sptId":60
      },{
         "id":715,
         "name":"德拉萨",
         "galaxy":"裂空星系",
         "loc":"怀特矿场",
         "mapId":486,
         "lv":80,
         "hp":0,
         "sptId":58
      },{
         "id":811,
         "name":"始祖灵兽",
         "galaxy":"帕诺星系",
         "loc":"克罗斯地心",
         "mapId":13,
         "lv":80,
         "hp":0,
         "sptId":20
      },{
         "id":875,
         "name":"布莱克",
         "galaxy":"裂空星系",
         "loc":"光明圣坛",
         "mapId":9507,
         "lv":80,
         "hp":0,
         "sptId":64
      },{
         "id":1633,
         "name":"缪斯",
         "galaxy":"卡兰星系",
         "loc":"天蛇灵宫",
         "mapId":932,
         "lv":80,
         "hp":0,
         "sptId":65
      },{
         "id":656,
         "name":"帕多尼",
         "galaxy":"暗黑武斗场",
         "loc":"暗黑武斗场第八门",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":51
      },{
         "id":532,
         "name":"奇格萨",
         "galaxy":"帕诺星系",
         "loc":"赫尔卡星飞船",
         "mapId":43,
         "lv":80,
         "hp":0,
         "sptId":77
      },{
         "id":527,
         "name":"火魔至尊",
         "galaxy":"罗格星系",
         "loc":"戴斯星",
         "mapId":435,
         "lv":80,
         "hp":0,
         "sptId":74
      },{
         "id":804,
         "name":"迪符特",
         "galaxy":"裂空星系",
         "loc":"怀特星山神圣殿",
         "mapId":450,
         "lv":80,
         "hp":0,
         "sptId":59
      },{
         "id":408,
         "name":"沙恩克",
         "galaxy":"罗格星系",
         "loc":"海兹尔星",
         "mapId":439,
         "lv":80,
         "hp":0,
         "sptId":75
      },{
         "id":755,
         "name":"斯普林特",
         "galaxy":"卡兰星系",
         "loc":"塔克星-地底古迹",
         "mapId":495,
         "lv":80,
         "hp":0,
         "sptId":76
      },{
         "id":115,
         "name":"巨型树妖",
         "galaxy":"太空站挑战",
         "loc":"海盗训练室",
         "mapId":502,
         "lv":80,
         "hp":0,
         "sptId":71
      },{
         "id":163,
         "name":"达鲁切尔",
         "galaxy":"帕诺星系",
         "loc":"斯诺星-斯诺星一层",
         "mapId":51,
         "lv":80,
         "hp":0,
         "sptId":78
      },{
         "id":659,
         "name":"加洛德",
         "galaxy":"暗黑武斗场",
         "loc":"第八门-第一关",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":52
      },{
         "id":661,
         "name":"萨多拉尼",
         "galaxy":"暗黑武斗场",
         "loc":"第八门-第二关",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":53
      },{
         "id":779,
         "name":"迪普利德",
         "galaxy":"暗黑武斗场",
         "loc":"第九门-第一关",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":54
      },{
         "id":784,
         "name":"拜洛亚斯",
         "galaxy":"暗黑武斗场",
         "loc":"第九门-第二关",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":55
      },{
         "id":782,
         "name":"阿克诺亚",
         "galaxy":"暗黑武斗场",
         "loc":"第九门-第三关",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":56
      },{
         "id":898,
         "name":"赛伯斯特",
         "galaxy":"太空站挑战",
         "loc":"太空站首层·点击赛伯斯特",
         "mapId":102,
         "lv":80,
         "hp":0,
         "sptId":70
      }];
      
      private var _modalBg:Sprite;
      
      private var _panel:Sprite;
      
      private var _cardsArea:Sprite;
      
      private var _tabsContainer:Sprite;
      
      private var _filterBar:Sprite;
      
      private var _tabBtns:Array = [];
      
      private var _filterBtns:Array = [];
      
      private var _pageTxt:TextField;
      
      private var _summaryTxt:TextField;
      
      private var _currentGalaxy:String = "帕诺星系";
      
      private var _currentFilter:String = "全部";
      
      private var _curPage:int = 1;
      
      private var _pageSize:int = 6;
      
      private var _filteredBosses:Array = [];
      
      private const GALAXIES:Array = ["全部","帕诺星系","卡兰星系","罗格星系","裂空星系","神兽空间","太空站挑战","暗黑武斗场"];
      
      public function SptPanel()
      {
         super();
      }
      
      public function setup() : void
      {
         initUI();
         updateFilter();
      }
      
      public function init(param1:Object = null) : void
      {
         updateFilter();
      }
      
      public function show() : void
      {
         try
         {
            LevelManager.showOrRemoveMapLevelandToolslevel(false,true);
            LevelManager.appLevel.addChild(this);
            updateFilter();
         }
         catch(e:Error)
         {
         }
      }
      
      public function hide() : void
      {
         try
         {
            LevelManager.showOrRemoveMapLevelandToolslevel(true);
            DisplayUtil.removeForParent(this);
            ModuleManager.destroyForInstance(this);
         }
         catch(e:Error)
         {
         }
      }
      
      public function destroy() : void
      {
         this._filteredBosses = null;
         this._tabBtns = null;
         this._filterBtns = null;
      }
      
      private function initUI() : void
      {
         while(this.numChildren > 0)
         {
            this.removeChildAt(0);
         }
         _modalBg = new Sprite();
         _modalBg.graphics.beginFill(0,0.72);
         _modalBg.graphics.drawRect(0,0,960,560);
         _modalBg.graphics.endFill();
         addChild(_modalBg);
         _panel = new Sprite();
         _panel.x = (960 - 820) / 2;
         _panel.y = (560 - 480) / 2;
         drawPanelFrame(_panel,820,480);
         addChild(_panel);
         drawHeader();
         _tabsContainer = new Sprite();
         _tabsContainer.x = 24;
         _tabsContainer.y = 44;
         _panel.addChild(_tabsContainer);
         renderGalaxyTabs();
         _filterBar = new Sprite();
         _filterBar.x = 24;
         _filterBar.y = 76;
         _panel.addChild(_filterBar);
         renderFilterBar();
         _cardsArea = new Sprite();
         _cardsArea.x = 24;
         _cardsArea.y = 112;
         _panel.addChild(_cardsArea);
         drawFooter();
      }
      
      private function drawPanelFrame(s:Sprite, w:Number, h:Number) : void
      {
         s.graphics.clear();
         s.graphics.beginFill(1259614,1);
         s.graphics.drawRoundRect(0,0,w,h,16,16);
         s.graphics.endFill();
         s.graphics.lineStyle(2,55551,0.9);
         s.graphics.beginFill(464166,0.98);
         s.graphics.drawRoundRect(3,3,w - 6,h - 6,14,14);
         s.graphics.endFill();
         drawRivet(s,14,14);
         drawRivet(s,w - 14,14);
         drawRivet(s,14,h - 14);
         drawRivet(s,w - 14,h - 14);
      }
      
      private function drawRivet(s:Sprite, x:Number, y:Number) : void
      {
         s.graphics.lineStyle(1,19584);
         s.graphics.beginFill(6927615);
         s.graphics.drawCircle(x,y,3);
         s.graphics.endFill();
      }
      
      private function drawHeader() : void
      {
         var title:TextField;
         var closeBtn:Sprite;
         var closeTxt:TextField;
         var h:Sprite = new Sprite();
         h.graphics.lineStyle(2,61695,0.9);
         h.graphics.beginFill(863824,1);
         h.graphics.moveTo(220,3);
         h.graphics.lineTo(260,36);
         h.graphics.lineTo(560,36);
         h.graphics.lineTo(600,3);
         h.graphics.endFill();
         _panel.addChild(h);
         title = new TextField();
         title.defaultTextFormat = new TextFormat("Microsoft YaHei, SimHei",17,16765440,true,null,null,null,null,TextFormatAlign.CENTER);
         title.text = "赛尔先锋队 · 星际首领挑战终端";
         title.width = 340;
         title.height = 26;
         title.x = 240;
         title.y = 8;
         title.selectable = false;
         title.mouseEnabled = false;
         _panel.addChild(title);
         closeBtn = new Sprite();
         closeBtn.graphics.lineStyle(1.5,16745090);
         closeBtn.graphics.beginFill(10361627,1);
         closeBtn.graphics.drawCircle(796,20,12);
         closeBtn.graphics.endFill();
         closeBtn.buttonMode = true;
         closeTxt = new TextField();
         closeTxt.defaultTextFormat = new TextFormat("Arial",14,16777215,true,null,null,null,null,TextFormatAlign.CENTER);
         closeTxt.text = "✕";
         closeTxt.width = 24;
         closeTxt.height = 20;
         closeTxt.x = 784;
         closeTxt.y = 10;
         closeTxt.selectable = false;
         closeTxt.mouseEnabled = false;
         closeBtn.addChild(closeTxt);
         closeBtn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            hide();
         });
         _panel.addChild(closeBtn);
      }
      
      private function renderGalaxyTabs() : void
      {
         var curX:Number;
         var i:int;
         var gName:String;
         var btn:Sprite;
         var w:Number;
         while(_tabsContainer.numChildren > 0)
         {
            _tabsContainer.removeChildAt(0);
         }
         _tabBtns = [];
         curX = 0;
         i = 0;
         while(i < GALAXIES.length)
         {
            gName = GALAXIES[i];
            btn = new Sprite();
            btn.x = curX;
            w = 91;
            drawTabBtn(btn,w,26,gName,_currentGalaxy == gName);
            btn.buttonMode = true;
            (function(targetGalaxy:String):void
            {
               btn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
               {
                  _currentGalaxy = targetGalaxy;
                  _curPage = 1;
                  renderGalaxyTabs();
                  updateFilter();
               });
            })(gName);
            _tabsContainer.addChild(btn);
            _tabBtns.push(btn);
            curX += w + 6;
            i++;
         }
      }
      
      private function drawTabBtn(s:Sprite, w:Number, h:Number, label:String, active:Boolean) : void
      {
         s.graphics.clear();
         s.graphics.lineStyle(1.5,active ? 55551 : 1986174);
         s.graphics.beginFill(active ? 1394035 : 662060,0.95);
         s.graphics.drawRoundRect(0,0,w,h,6,6);
         s.graphics.endFill();
         while(s.numChildren > 0)
         {
            s.removeChildAt(0);
         }
         var tf:TextField = createLabel(s,0,3,w,h,12,active ? 16777215 : 8234183,true,TextFormatAlign.CENTER);
         tf.text = label;
      }
      
      private function renderFilterBar() : void
      {
         var filterStates:Array;
         var fX:Number;
         var i:int;
         var stName:String;
         var fBtn:Sprite;
         var tf:TextField;
         var sLabel:TextField;
         while(_filterBar.numChildren > 0)
         {
            _filterBar.removeChildAt(0);
         }
         _filterBar.graphics.clear();
         _filterBar.graphics.lineStyle(1,1456476);
         _filterBar.graphics.beginFill(529700,0.9);
         _filterBar.graphics.drawRoundRect(0,0,772,30,6,6);
         _filterBar.graphics.endFill();
         _summaryTxt = createLabel(_filterBar,10,5,380,22,12,9222629,false);
         filterStates = ["全部","未击败","已击败"];
         fX = 430;
         i = 0;
         while(i < filterStates.length)
         {
            stName = filterStates[i];
            fBtn = new Sprite();
            fBtn.x = fX;
            fBtn.y = 4;
            fBtn.graphics.lineStyle(1,_currentFilter == stName ? 16760832 : 1986174);
            fBtn.graphics.beginFill(_currentFilter == stName ? 2245225 : 794677);
            fBtn.graphics.drawRoundRect(0,0,65,22,4,4);
            fBtn.graphics.endFill();
            fBtn.buttonMode = true;
            tf = createLabel(fBtn,0,2,65,20,11,_currentFilter == stName ? 16769154 : 9483736,true,TextFormatAlign.CENTER);
            tf.text = stName;
            (function(targetSt:String):void
            {
               fBtn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
               {
                  _currentFilter = targetSt;
                  _curPage = 1;
                  renderFilterBar();
                  updateFilter();
               });
            })(stName);
            _filterBar.addChild(fBtn);
            fX += 71;
            i++;
         }
         sLabel = createLabel(_filterBar,650,5,112,22,11,55551,false,TextFormatAlign.RIGHT);
         sLabel.text = "共收录 " + BOSSES.length + " 只首领";
      }
      
      private function isBossDefeated(b:Object) : Boolean
      {
         var sptId:int;
         var ach:Array;
         try
         {
            sptId = int(b.sptId);
            if(sptId >= 1 && sptId <= 200)
            {
               ach = MainManager.actorInfo.bossAchievement;
               if(ach && ach[sptId - 1] == true)
               {
                  return true;
               }
            }
            if(b.taskId && TasksManager.getTaskStatus(b.taskId) == TasksManager.COMPLETE)
            {
               return true;
            }
         }
         catch(err:Error)
         {
         }
         return false;
      }
      
      private function updateFilter() : void
      {
         _filteredBosses = [];
         var i:int = 0;
         while(i < BOSSES.length)
         {
            var b:Object = BOSSES[i];
            if(!(_currentGalaxy != "全部" && b.galaxy != _currentGalaxy))
            {
               var def:Boolean = isBossDefeated(b);
               if(!(_currentFilter == "已击败" && !def))
               {
                  if(!(_currentFilter == "未击败" && def))
                  {
                     _filteredBosses.push(b);
                  }
               }
            }
            i++;
         }
         if(_summaryTxt)
         {
            _summaryTxt.text = "当前星系：" + _currentGalaxy + " | 筛选：" + _currentFilter + " | 共 " + _filteredBosses.length + " 个首领";
         }
         renderCards();
         updatePagination();
      }
      
      private function renderCards() : void
      {
         while(_cardsArea.numChildren > 0)
         {
            _cardsArea.removeChildAt(0);
         }
         if(_filteredBosses.length == 0)
         {
            var emptyBox:Sprite = new Sprite();
            emptyBox.x = 80;
            emptyBox.y = 100;
            var emptyTxt:TextField = createLabel(emptyBox,0,0,612,60,15,8234183,true,TextFormatAlign.CENTER);
            if(_currentFilter == "已击败")
            {
               emptyTxt.text = "当前星系下暂无已击败记录！\n点击上方【全部】或【未击败】查看星际首领并前往挑战！";
            }
            else
            {
               emptyTxt.text = "未找到符合条件的首领！可在上方星系标签栏切换分类。";
            }
            _cardsArea.addChild(emptyBox);
            return;
         }
         var startIdx:int = (_curPage - 1) * _pageSize;
         var endIdx:int = Math.min(_filteredBosses.length,startIdx + _pageSize);
         var i:int = startIdx;
         while(i < endIdx)
         {
            var b:Object = _filteredBosses[i];
            var slot:int = i - startIdx;
            var col:int = slot % 3;
            var row:int = Math.floor(slot / 3);
            var card:Sprite = createBossCard(b);
            card.x = col * 261;
            card.y = row * 160;
            _cardsArea.addChild(card);
            i++;
         }
      }
      
      private function createBossCard(b:Object) : Sprite
      {
         var nameTxt:TextField;
         var gBadge:TextField;
         var avatarBox:Sprite;
         var maskShape:Shape;
         var avatarImgHolder:Sprite;
         var locTxt:TextField;
         var lvTxt:TextField;
         var stTxt:TextField;
         var goBtn:Sprite;
         var btnLabel:TextField;
         var c:Sprite = new Sprite();
         var w:Number = 250;
         var h:Number = 152;
         var defeated:Boolean = isBossDefeated(b);
         c.graphics.lineStyle(1.5,defeated ? 2452286 : 55551,0.85);
         c.graphics.beginFill(defeated ? 465451 : 597557,0.95);
         c.graphics.drawRoundRect(0,0,w,h,8,8);
         c.graphics.endFill();
         c.graphics.beginFill(defeated ? 1062434 : 863824);
         c.graphics.drawRoundRect(0,0,w,24,6,6);
         c.graphics.endFill();
         nameTxt = createLabel(c,10,3,145,20,12,defeated ? 8712359 : 16765440,true);
         nameTxt.text = b.name;
         gBadge = createLabel(c,155,3,85,20,11,6600182,false,TextFormatAlign.RIGHT);
         gBadge.text = b.galaxy;
         avatarBox = new Sprite();
         avatarBox.x = 10;
         avatarBox.y = 32;
         avatarBox.graphics.lineStyle(1.5,defeated ? 2452286 : 55551,0.7);
         avatarBox.graphics.beginFill(398372,1);
         avatarBox.graphics.drawRoundRect(0,0,64,64,6,6);
         avatarBox.graphics.endFill();
         maskShape = new Shape();
         maskShape.x = 10;
         maskShape.y = 32;
         maskShape.graphics.beginFill(16777215,1);
         maskShape.graphics.drawRoundRect(0,0,64,64,6,6);
         maskShape.graphics.endFill();
         c.addChild(maskShape);
         avatarImgHolder = new Sprite();
         avatarImgHolder.x = 10;
         avatarImgHolder.y = 32;
         avatarImgHolder.mask = maskShape;
         loadBossAvatar(avatarImgHolder,b.id);
         c.addChild(avatarBox);
         c.addChild(avatarImgHolder);
         locTxt = createLabel(c,82,32,160,20,11,9483736,false);
         locTxt.text = "位置：" + (b.loc ? b.loc : "星际区域");
         lvTxt = createLabel(c,82,52,160,20,11,57855,false);
         lvTxt.text = "等级：" + (b.lv ? b.lv + " 级" : "首领难度");
         stTxt = createLabel(c,82,72,160,20,11,defeated ? 7725727 : 16748544,true);
         stTxt.text = defeated ? "状态：✓ 已击败" : "状态：未战胜";
         goBtn = new Sprite();
         goBtn.x = 10;
         goBtn.y = 110;
         goBtn.graphics.lineStyle(1,defeated ? 1986174 : 16755200);
         goBtn.graphics.beginFill(defeated ? 1058882 : 8012544);
         goBtn.graphics.drawRoundRect(0,0,w - 20,28,4,4);
         goBtn.graphics.endFill();
         goBtn.buttonMode = true;
         btnLabel = createLabel(goBtn,0,4,w - 20,22,12,defeated ? 9222629 : 16773299,true,TextFormatAlign.CENTER);
         btnLabel.text = defeated ? "再次挑战" : "前往挑战首领";
         (function(targetBoss:Object):void
         {
            goBtn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
            {
               hide();
               if(targetBoss.mapId)
               {
                  MapManager.changeMap(targetBoss.mapId);
               }
            });
         })(b);
         c.addChild(goBtn);
         return c;
      }
      
      private function loadBossAvatar(holder:Sprite, petId:int) : void
      {
         var l:Loader = new Loader();
         l.contentLoaderInfo.addEventListener(Event.COMPLETE,function(e:Event):void
         {
            var domain:ApplicationDomain;
            var cls:Class;
            var itemObj:DisplayObject;
            var sc:Number;
            try
            {
               domain = l.contentLoaderInfo.applicationDomain;
               cls = null;
               if(domain)
               {
                  if(domain.hasDefinition("item"))
                  {
                     cls = domain.getDefinition("item") as Class;
                  }
                  else if(domain.hasDefinition("pet"))
                  {
                     cls = domain.getDefinition("pet") as Class;
                  }
               }
               if(cls != null)
               {
                  itemObj = new cls() as DisplayObject;
                  if(itemObj)
                  {
                     sc = Math.min(54 / itemObj.width,54 / itemObj.height);
                     if(isNaN(sc) || sc <= 0 || !isFinite(sc))
                     {
                        sc = 0.5;
                     }
                     itemObj.scaleX = itemObj.scaleY = sc;
                     itemObj.x = 5 + (54 - itemObj.width) / 2;
                     itemObj.y = 5 + (54 - itemObj.height) / 2;
                     holder.addChild(itemObj);
                     return;
                  }
               }
               if(l.content)
               {
                  l.content.width = 54;
                  l.content.height = 54;
                  l.content.x = 5;
                  l.content.y = 5;
                  holder.addChild(l.content);
               }
            }
            catch(err:Error)
            {
            }
         });
         l.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR,function(e:IOErrorEvent):void
         {
            var l2:Loader;
            try
            {
               l2 = new Loader();
               l2.contentLoaderInfo.addEventListener(Event.COMPLETE,function(ev:Event):void
               {
                  var d2:ApplicationDomain;
                  var pCls:Class;
                  var pObj:DisplayObject;
                  try
                  {
                     d2 = l2.contentLoaderInfo.applicationDomain;
                     if(d2 && d2.hasDefinition("pet"))
                     {
                        pCls = d2.getDefinition("pet") as Class;
                        pObj = new pCls() as DisplayObject;
                        pObj.width = pObj.height = 54;
                        pObj.x = pObj.y = 5;
                        holder.addChild(pObj);
                     }
                  }
                  catch(err2:Error)
                  {
                  }
               });
               l2.load(new URLRequest("/resource/groupFightResource/pet/" + petId + ".swf"));
            }
            catch(err3:Error)
            {
            }
         });
         l.load(new URLRequest("/resource/pet/head/" + petId + ".swf"));
      }
      
      private function drawFooter() : void
      {
         var prevBtn:Sprite;
         var nextBtn:Sprite;
         var ft:Sprite = new Sprite();
         ft.x = 24;
         ft.y = 438;
         _panel.addChild(ft);
         prevBtn = createPageButton(ft,40,0,"◀ 上一页");
         prevBtn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            if(_curPage > 1)
            {
               --_curPage;
               renderCards();
               updatePagination();
            }
         });
         nextBtn = createPageButton(ft,644,0,"下一页 ▶");
         nextBtn.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            var total:int = Math.max(1,Math.ceil(_filteredBosses.length / _pageSize));
            if(_curPage < total)
            {
               ++_curPage;
               renderCards();
               updatePagination();
            }
         });
         _pageTxt = createLabel(ft,320,4,132,24,14,16765440,true,TextFormatAlign.CENTER);
         _pageTxt.text = "1 / 1";
      }
      
      private function createPageButton(parent:Sprite, x:Number, y:Number, label:String) : Sprite
      {
         var s:Sprite = new Sprite();
         s.x = x;
         s.y = y;
         s.graphics.lineStyle(1,55551);
         s.graphics.beginFill(795968);
         s.graphics.drawRoundRect(0,0,88,28,4,4);
         s.graphics.endFill();
         s.buttonMode = true;
         var t:TextField = createLabel(s,0,4,88,22,12,16777215,true,TextFormatAlign.CENTER);
         t.text = label;
         parent.addChild(s);
         return s;
      }
      
      private function updatePagination() : void
      {
         var totalPages:int = Math.max(1,Math.ceil(_filteredBosses.length / _pageSize));
         if(_pageTxt)
         {
            _pageTxt.text = _curPage + " / " + totalPages;
         }
      }
      
      private function createLabel(parent:Sprite, x:Number, y:Number, w:Number, h:Number, size:int, color:uint, bold:Boolean = false, align:String = "left") : TextField
      {
         var t:TextField = new TextField();
         t.x = x;
         t.y = y;
         t.width = w;
         t.height = h;
         t.defaultTextFormat = new TextFormat("Microsoft YaHei, SimHei, Arial",size,color,bold,null,null,null,null,align);
         t.selectable = false;
         t.mouseEnabled = false;
         parent.addChild(t);
         return t;
      }
   }
}

