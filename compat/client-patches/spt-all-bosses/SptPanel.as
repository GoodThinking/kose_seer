package com.robot.module.app
{
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.manager.TasksManager;
   import flash.display.DisplayObject;
   import flash.display.Loader;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.events.IOErrorEvent;
   import flash.events.MouseEvent;
   import flash.net.URLRequest;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import flash.text.TextFormatAlign;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;

   [SWF(width="960", height="560", backgroundColor="#000000", frameRate="24")]
   public class SptPanel extends Sprite implements IModule
   {
      // 全服所有 88 只 BOSS 全景档案（覆盖全部星系、神兽、暗黑之门与精英首领）
      private const BOSSES:Array = [{"id": 47, "name": "蘑菇怪", "galaxy": "帕诺星系", "loc": "克洛斯星-克洛斯星林间", "mapId": 12, "lv": 80, "hp": 0, "sptId": 301}, {"id": 34, "name": "钢牙鲨", "galaxy": "帕诺星系", "loc": "海洋星-海洋星海底", "mapId": 22, "lv": 80, "hp": 0, "sptId": 302}, {"id": 42, "name": "里奥斯", "galaxy": "帕诺星系", "loc": "火山星-火山星山洞深处", "mapId": 17, "lv": 80, "hp": 0, "sptId": 303}, {"id": 50, "name": "阿克希亚", "galaxy": "帕诺星系", "loc": "塞西利亚星", "mapId": 40, "lv": 80, "hp": 0, "sptId": 304}, {"id": 69, "name": "提亚斯", "galaxy": "帕诺星系", "loc": "云霄星-云霄星最高层", "mapId": 27, "lv": 80, "hp": 0, "sptId": 305}, {"id": 70, "name": "雷伊", "galaxy": "帕诺星系", "loc": "赫尔卡星-赫尔卡星荒地", "mapId": 32, "lv": 80, "hp": 0, "sptId": 306}, {"id": 88, "name": "纳多雷", "galaxy": "帕诺星系", "loc": "双子阿尔法星-阿尔法星岩地", "mapId": 106, "lv": 80, "hp": 0, "sptId": 307}, {"id": 113, "name": "雷纳多", "galaxy": "帕诺星系", "loc": "双子贝塔星-贝塔星荒原", "mapId": 49, "lv": 80, "hp": 0, "sptId": 308}, {"id": 132, "name": "尤纳斯", "galaxy": "帕诺星系", "loc": "拜伦号", "mapId": 314, "lv": 80, "hp": 0, "sptId": 309}, {"id": 187, "name": "魔狮迪露", "galaxy": "帕诺星系", "loc": "斯诺星-斯诺岩洞", "mapId": 53, "lv": 80, "hp": 0, "sptId": 310}, {"id": 261, "name": "盖亚", "galaxy": "帕诺星系", "loc": "露希欧星", "mapId": 54, "lv": 80, "hp": 0, "sptId": 99}, {"id": 216, "name": "哈莫雷特", "galaxy": "卡兰星系", "loc": "尼古尔星/塔克星", "mapId": 57, "lv": 80, "hp": 0, "sptId": 311}, {"id": 264, "name": "奈尼芬多", "galaxy": "卡兰星系", "loc": "艾迪星", "mapId": 325, "lv": 80, "hp": 0, "sptId": 312}, {"id": 169, "name": "卡特斯", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场试炼之门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 50}, {"id": 171, "name": "魔牙鲨", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第1门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 51}, {"id": 174, "name": "贝鲁基德", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第2门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 53}, {"id": 177, "name": "巴弗洛", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第3门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 55}, {"id": 183, "name": "奇拉塔顿", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第3门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 56}, {"id": 195, "name": "西萨拉斯", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第4门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 59}, {"id": 192, "name": "克林卡修", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第4门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 60}, {"id": 222, "name": "卡库", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第5门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 76}, {"id": 224, "name": "赫德卡", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第5门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 77}, {"id": 227, "name": "伊兰罗尼", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第5门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 78}, {"id": 356, "name": "斯加尔卡", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第6门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 700024}, {"id": 297, "name": "艾尔伊洛", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第6门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 700025}, {"id": 359, "name": "布林克克", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第6门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 700026}, {"id": 438, "name": "魔花使者", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第7门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 7000261}, {"id": 441, "name": "莫尔加斯", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第7门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 7000262}, {"id": 435, "name": "萨诺拉斯", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第7门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 7000263}, {"id": 347, "name": "远古鱼龙", "galaxy": "卡兰星系", "loc": "尼古尔星-尼古尔海底", "mapId": 442, "lv": 80, "hp": 0, "sptId": 700028}, {"id": 393, "name": "上古炎兽", "galaxy": "帕诺星系", "loc": "火山星-火山星山洞", "mapId": 16, "lv": 80, "hp": 0, "sptId": 7000451}, {"id": 421, "name": "厄尔塞拉", "galaxy": "卡兰星系", "loc": "塔克星-光之迷城", "mapId": 61, "lv": 80, "hp": 0, "sptId": 316}, {"id": 274, "name": "塔克林", "galaxy": "卡兰星系", "loc": "艾迪星-虚幻的地下城市", "mapId": 327, "lv": 80, "hp": 0, "sptId": 313}, {"id": 391, "name": "塔西亚", "galaxy": "卡兰星系", "loc": "哈莫星-龙王圣殿", "mapId": 348, "lv": 80, "hp": 0, "sptId": 314}, {"id": 413, "name": "塞维尔", "galaxy": "卡兰星系", "loc": "哈莫星-龙王圣殿", "mapId": 348, "lv": 80, "hp": 0, "sptId": 315}, {"id": 490, "name": "劳克蒙德", "galaxy": "罗格星系", "loc": "比格星-沃尔夫洞穴", "mapId": 423, "lv": 80, "hp": 0, "sptId": 317}, {"id": 672, "name": "亚伦斯", "galaxy": "罗格星系", "loc": "拓梯星-活力源泉", "mapId": 430, "lv": 80, "hp": 0, "sptId": 322}, {"id": 597, "name": "史密斯", "galaxy": "罗格星系", "loc": "般若星", "mapId": 481, "lv": 80, "hp": 0, "sptId": 700021}, {"id": 538, "name": "克拉尼特", "galaxy": "罗格星系", "loc": "戴斯星", "mapId": 435, "lv": 80, "hp": 0, "sptId": 318}, {"id": 587, "name": "墨杜萨", "galaxy": "罗格星系", "loc": "墨杜萨星", "mapId": 437, "lv": 80, "hp": 0, "sptId": 320}, {"id": 798, "name": "卡修斯", "galaxy": "裂空星系", "loc": "怀特星-炫彩山山脚", "mapId": 445, "lv": 80, "hp": 0, "sptId": 325}, {"id": 462, "name": "月光兽-阿尔达拉", "galaxy": "裂空星系", "loc": "异能星-月1/15号", "mapId": 668, "lv": 80, "hp": 0, "sptId": 7000391}, {"id": 501, "name": "巴斯特", "galaxy": "神兽空间", "loc": "玄武传送阵", "mapId": 666, "lv": 80, "hp": 0, "sptId": 700016}, {"id": 502, "name": "朵拉格", "galaxy": "神兽空间", "loc": "青龙传送阵", "mapId": 666, "lv": 80, "hp": 0, "sptId": 700018}, {"id": 617, "name": "肯佩德", "galaxy": "罗格星系", "loc": "拉铂尔星第一层", "mapId": 441, "lv": 80, "hp": 0, "sptId": 321}, {"id": 299, "name": "猛虎王", "galaxy": "发明室", "loc": "发明家肖恩签到3天", "mapId": 107, "lv": 80, "hp": 0, "sptId": 6020554}, {"id": 300, "name": "谱尼", "galaxy": "太空站左翼", "loc": "勇者之塔神秘领域", "mapId": 108, "lv": 80, "hp": 0, "sptId": 517}, {"id": 479, "name": "冰洛伏特", "galaxy": "卡兰星系", "loc": "斯科尔高空塔", "mapId": 331, "lv": 80, "hp": 0, "sptId": 700050}, {"id": 468, "name": "罗德利斯", "galaxy": "精灵太空站", "loc": "太空站拓展", "mapId": 405, "lv": 80, "hp": 0, "sptId": 700037}, {"id": 622, "name": "加鲁德", "galaxy": "精灵太空站", "loc": "王者之塔", "mapId": 465, "lv": 80, "hp": 0, "sptId": 700058}, {"id": 453, "name": "菲拉斯特", "galaxy": "精灵太空站", "loc": "命运之轮·第10层", "mapId": 10036, "lv": 80, "hp": 0, "sptId": 700166}, {"id": 426, "name": "迪尔科特", "galaxy": "精灵太空站", "loc": "太空站拓展", "mapId": 405, "lv": 80, "hp": 0, "sptId": 700053}, {"id": 591, "name": "杰洛恩", "galaxy": "精灵太空站", "loc": "太空站左翼", "mapId": 108, "lv": 80, "hp": 0, "sptId": 700052}, {"id": 503, "name": "白虎", "galaxy": "罗格星系", "loc": "白虎空间", "mapId": 483, "lv": 80, "hp": 0, "sptId": 7000162}, {"id": 504, "name": "菲尼克斯", "galaxy": "神兽空间", "loc": "朱雀空间", "mapId": 318, "lv": 80, "hp": 0, "sptId": 7000175}, {"id": 715, "name": "德拉萨", "galaxy": "裂空星系", "loc": "怀特矿场", "mapId": 486, "lv": 80, "hp": 0, "sptId": 323}, {"id": 811, "name": "始祖灵兽", "galaxy": "帕诺星系", "loc": "克罗斯地心", "mapId": 13, "lv": 80, "hp": 0, "sptId": 700059}, {"id": 875, "name": "布莱克", "galaxy": "裂空星系", "loc": "光明圣坛", "mapId": 9507, "lv": 80, "hp": 0, "sptId": 329}, {"id": 1633, "name": "缪斯", "galaxy": "卡兰星系", "loc": "天蛇灵宫", "mapId": 932, "lv": 80, "hp": 0, "sptId": 0}, {"id": 656, "name": "帕多尼", "galaxy": "暗黑武斗场", "loc": "暗黑武斗场第八门", "mapId": 102, "lv": 80, "hp": 0, "sptId": 7000264}, {"id": 532, "name": "奇格萨", "galaxy": "帕诺星系", "loc": "赫尔卡星飞船", "mapId": 43, "lv": 80, "hp": 0, "sptId": 700066}, {"id": 527, "name": "火魔至尊", "galaxy": "罗格星系", "loc": "戴斯星", "mapId": 435, "lv": 80, "hp": 0, "sptId": 700435527}, {"id": 804, "name": "迪符特", "galaxy": "裂空星系", "loc": "怀特星山神圣殿", "mapId": 450, "lv": 80, "hp": 0, "sptId": 326}, {"id": 408, "name": "沙恩克", "galaxy": "罗格星系", "loc": "海兹尔星", "mapId": 439, "lv": 80, "hp": 0, "sptId": 700164}, {"id": 755, "name": "斯普林特", "galaxy": "卡兰星系", "loc": "塔克星-地底古迹", "mapId": 495, "lv": 80, "hp": 0, "sptId": 324}, {"id": 115, "name": "巨型树妖", "galaxy": "赛尔号飞船", "loc": "海盗训练室", "mapId": 502, "lv": 80, "hp": 0, "sptId": 151}, {"id": 163, "name": "达鲁切尔", "galaxy": "帕诺星系", "loc": "斯诺星-斯诺星一层", "mapId": 51, "lv": 80, "hp": 0, "sptId": 700048}, {"id": 659, "name": "加洛德", "galaxy": "暗黑武斗场", "loc": "第八门-第一关", "mapId": 102, "lv": 80, "hp": 0, "sptId": 7000265}, {"id": 661, "name": "萨多拉尼", "galaxy": "暗黑武斗场", "loc": "第八门-第二关", "mapId": 102, "lv": 80, "hp": 0, "sptId": 7000266}, {"id": 779, "name": "迪普利德", "galaxy": "暗黑武斗场", "loc": "第九门-第一关", "mapId": 102, "lv": 80, "hp": 0, "sptId": 7000267}, {"id": 784, "name": "拜洛亚斯", "galaxy": "暗黑武斗场", "loc": "第九门-第二关", "mapId": 102, "lv": 80, "hp": 0, "sptId": 7000268}, {"id": 782, "name": "阿克诺亚", "galaxy": "暗黑武斗场", "loc": "第九门-第三关", "mapId": 102, "lv": 80, "hp": 0, "sptId": 7000269}, {"id": 166, "name": "纽斯", "galaxy": "赛尔号飞船", "loc": "传送仓", "mapId": 1, "lv": 80, "hp": 0, "sptId": 7000441}, {"id": 58, "name": "艾里逊", "galaxy": "蝎子号", "loc": "蝎子号", "mapId": 412, "lv": 80, "hp": 0, "sptId": 7000445}, {"id": 865, "name": "爱丽丝", "galaxy": "艾迪星", "loc": "第一层", "mapId": 325, "lv": 80, "hp": 0, "sptId": 7000449}, {"id": 518, "name": "叽哩呱啦", "galaxy": "瞭望舱", "loc": "瞭望舱", "mapId": 7, "lv": 80, "hp": 0, "sptId": 700060}, {"id": 432, "name": "肖恩", "galaxy": "发明室", "loc": "肖恩的基地", "mapId": 1209, "lv": 80, "hp": 0, "sptId": 700061}, {"id": 73, "name": "派特博士", "galaxy": "实验室", "loc": "派特博士的基地", "mapId": 426, "lv": 80, "hp": 0, "sptId": 700076}, {"id": 2394, "name": "罗杰船长", "galaxy": "赛尔号飞船", "loc": "船长室", "mapId": 4, "lv": 80, "hp": 0, "sptId": 700079}, {"id": 125, "name": "迪恩道馆", "galaxy": "赛尔号飞船", "loc": "资料室", "mapId": 9, "lv": 80, "hp": 0, "sptId": 700183}, {"id": 898, "name": "赛伯斯特", "galaxy": "精灵太空站", "loc": "太空站首层·点击赛伯斯特", "mapId": 102, "lv": 80, "hp": 0, "sptId": 7002514}, {"id": 83, "name": "依依", "galaxy": "帕诺星系", "loc": "克洛斯星-克洛斯星林间", "mapId": 12, "lv": 5, "hp": null, "sptId": 183}, {"id": 178, "name": "达比拉", "galaxy": "帕诺星系", "loc": "斯诺星-斯诺岩洞", "mapId": 53, "lv": 15, "hp": null, "sptId": 278}, {"id": 74, "name": "果冻鸭", "galaxy": "罗格星系", "loc": "地图 34", "mapId": 34, "lv": 45, "hp": 3500, "sptId": 30}, {"id": 474, "name": "该伊", "galaxy": "罗格星系", "loc": "巨型陨石内部", "mapId": 415, "lv": 70, "hp": 6000, "sptId": 32}, {"id": 471, "name": "伊特", "galaxy": "罗格星系", "loc": "觅食林", "mapId": 414, "lv": 70, "hp": 6000, "sptId": 33}, {"id": 91, "name": "悠悠", "galaxy": "卡兰星系", "loc": "推特星-推特星遗迹", "mapId": 105, "lv": 50, "hp": 4000, "sptId": 35}, {"id": 153, "name": "小莹蜂", "galaxy": "野外精英", "loc": "云霄星高空", "mapId": 26, "lv": 13, "hp": null, "sptId": 253}];

      private var _modalBg:Sprite;
      private var _panel:Sprite;
      private var _cardsArea:Sprite;
      private var _pageTxt:TextField;
      private var _summaryTxt:TextField;

      private var _currentGalaxy:String = "全部";
      private var _currentFilter:String = "全部";
      private var _curPage:int = 1;
      private var _pageSize:int = 6;
      private var _filteredBosses:Array = [];

      private const GALAXIES:Array = ["全部", "帕诺星系", "卡兰星系", "罗格星系", "裂空星系", "神兽空间", "暗黑武斗场", "野外精英"];

      public function SptPanel()
      {
         super();
      }

      public function setup():void
      {
         initUI();
      }

      public function init(param1:Object = null):void
      {
      }

      public function show():void
      {
         LevelManager.showOrRemoveMapLevelandToolslevel(false, true);
         LevelManager.appLevel.addChild(this);
         updateFilter();
      }

      public function hide():void
      {
         LevelManager.showOrRemoveMapLevelandToolslevel(true);
         DisplayUtil.removeForParent(this);
         ModuleManager.destroyForInstance(this);
      }

      public function destroy():void
      {
         this._filteredBosses = null;
      }

      private function initUI():void
      {
         while(this.numChildren > 0) this.removeChildAt(0);

         // 1. 半透明遮罩
         _modalBg = new Sprite();
         _modalBg.graphics.beginFill(0x000000, 0.65);
         _modalBg.graphics.drawRect(0, 0, 960, 560);
         _modalBg.graphics.endFill();
         addChild(_modalBg);

         // 2. 主面板居中 880x520
         _panel = new Sprite();
         _panel.x = (960 - 880) / 2;
         _panel.y = (560 - 520) / 2;
         drawPanelFrame(_panel, 880, 520);
         addChild(_panel);

         // 3. 顶部标题栏
         drawHeader();

         // 4. 星系标签栏
         drawGalaxyTabs();

         // 5. 状态过滤栏
         drawFilterBar();

         // 6. 卡片展示区 6 张大卡 (3x2)
         _cardsArea = new Sprite();
         _cardsArea.x = 24;
         _cardsArea.y = 120;
         _panel.addChild(_cardsArea);

         // 7. 底部翻页栏
         drawFooter();
      }

      private function drawPanelFrame(s:Sprite, w:Number, h:Number):void
      {
         s.graphics.clear();
         s.graphics.beginFill(0x13385e, 1.0);
         s.graphics.drawRoundRect(0, 0, w, h, 20, 20);
         s.graphics.endFill();

         s.graphics.lineStyle(2, 0x00d8ff, 0.9);
         s.graphics.beginFill(0x071526, 0.98);
         s.graphics.drawRoundRect(4, 4, w - 8, h - 8, 16, 16);
         s.graphics.endFill();

         drawRivet(s, 16, 16);
         drawRivet(s, w - 16, 16);
         drawRivet(s, 16, h - 16);
         drawRivet(s, w - 16, h - 16);
      }

      private function drawRivet(s:Sprite, x:Number, y:Number):void
      {
         s.graphics.lineStyle(1, 0x004c80);
         s.graphics.beginFill(0x69b4ff);
         s.graphics.drawCircle(x, y, 4);
         s.graphics.endFill();
      }

      private function drawHeader():void
      {
         var h:Sprite = new Sprite();
         h.graphics.lineStyle(2, 0x00f0ff, 0.9);
         h.graphics.beginFill(0x0d2e50, 1.0);
         h.graphics.moveTo(240, 4);
         h.graphics.lineTo(280, 40);
         h.graphics.lineTo(600, 40);
         h.graphics.lineTo(640, 4);
         h.graphics.endFill();
         _panel.addChild(h);

         var title:TextField = new TextField();
         title.defaultTextFormat = new TextFormat("Microsoft YaHei, SimHei", 18, 0xffd200, true, null, null, null, null, TextFormatAlign.CENTER);
         title.text = "赛尔先锋队 · 星际首领挑战终端";
         title.width = 360;
         title.height = 30;
         title.x = 260;
         title.y = 10;
         title.selectable = false;
         title.mouseEnabled = false;
         _panel.addChild(title);

         var closeBtn:Sprite = new Sprite();
         closeBtn.graphics.lineStyle(1.5, 0xff8282);
         closeBtn.graphics.beginFill(0x9e1b1b, 1.0);
         closeBtn.graphics.drawCircle(852, 24, 12);
         closeBtn.graphics.endFill();
         closeBtn.buttonMode = true;

         var closeTxt:TextField = new TextField();
         closeTxt.defaultTextFormat = new TextFormat("Arial", 14, 0xffffff, true, null, null, null, null, TextFormatAlign.CENTER);
         closeTxt.text = "✕";
         closeTxt.width = 24;
         closeTxt.height = 20;
         closeTxt.x = 840;
         closeTxt.y = 14;
         closeTxt.selectable = false;
         closeTxt.mouseEnabled = false;
         closeBtn.addChild(closeTxt);

         closeBtn.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
            hide();
         });
         _panel.addChild(closeBtn);
      }

      private function drawGalaxyTabs():void
      {
         var tabContainer:Sprite = new Sprite();
         tabContainer.x = 24;
         tabContainer.y = 48;
         _panel.addChild(tabContainer);

         var curX:Number = 0;
         for(var i:int = 0; i < GALAXIES.length; i++)
         {
            var gName:String = GALAXIES[i];
            var btn:Sprite = new Sprite();
            btn.x = curX;
            var w:Number = 100;
            drawTabBtn(btn, w, 26, gName, _currentGalaxy == gName);
            btn.buttonMode = true;

            (function(targetGalaxy:String):void {
               btn.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
                  _currentGalaxy = targetGalaxy;
                  _curPage = 1;
                  updateFilter();
                  drawGalaxyTabs();
               });
            })(gName);

            tabContainer.addChild(btn);
            curX += w + 6;
         }}

      private function drawTabBtn(s:Sprite, w:Number, h:Number, label:String, active:Boolean):void
      {
         s.graphics.clear();
         s.graphics.lineStyle(1.5, active ? 0x00d8ff : 0x1e4e7e);
         s.graphics.beginFill(active ? 0x154573 : 0x0a1a2c, 0.95);
         s.graphics.drawRoundRect(0, 0, w, h, 6, 6);
         s.graphics.endFill();

         while(s.numChildren > 0) s.removeChildAt(0);
         var tf:TextField = createLabel(s, 0, 3, w, h, 12, active ? 0xffffff : 0x7da4c7, true, TextFormatAlign.CENTER);
         tf.text = label;
      }

      private function drawFilterBar():void
      {
         var bar:Sprite = new Sprite();
         bar.x = 24;
         bar.y = 82;
         _panel.addChild(bar);

         bar.graphics.lineStyle(1, 0x16395c);
         bar.graphics.beginFill(0x081524, 0.9);
         bar.graphics.drawRoundRect(0, 0, 832, 32, 6, 6);
         bar.graphics.endFill();

         _summaryTxt = createLabel(bar, 12, 6, 400, 22, 12, 0x8cb9e5, false);

         var filterStates:Array = ["全部", "未击败", "已击败"];
         var fX:Number = 480;
         for(var i:int = 0; i < filterStates.length; i++)
         {
            var stName:String = filterStates[i];
            var fBtn:Sprite = new Sprite();
            fBtn.x = fX; fBtn.y = 4;
            fBtn.graphics.lineStyle(1, _currentFilter == stName ? 0xffc000 : 0x1e4e7e);
            fBtn.graphics.beginFill(_currentFilter == stName ? 0x224269 : 0x0c2035);
            fBtn.graphics.drawRoundRect(0, 0, 65, 24, 4, 4);
            fBtn.graphics.endFill();
            fBtn.buttonMode = true;

            var tf:TextField = createLabel(fBtn, 0, 2, 65, 22, 11, _currentFilter == stName ? 0xffe082 : 0x90b5d8, true, TextFormatAlign.CENTER);
            tf.text = stName;

            (function(targetSt:String):void {
               fBtn.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
                  _currentFilter = targetSt;
                  _curPage = 1;
                  updateFilter();
                  drawFilterBar();
               });
            })(stName);

            bar.addChild(fBtn);
            fX += 72;
         }

         var sLabel:TextField = createLabel(bar, 700, 6, 120, 22, 11, 0x00d8ff, false, TextFormatAlign.RIGHT);
         sLabel.text = "共收录 88 只BOSS";
      }

      private function isBossDefeated(b:Object):Boolean
      {
         var sptId:int = b.sptId;
         if(sptId >= 1 && sptId <= 200)
         {
            var ach:Array = MainManager.actorInfo.bossAchievement;
            if(ach && ach[sptId - 1] == true)
            {
               return true;
            }
         }
         if(b.taskId && TasksManager.getTaskStatus(b.taskId) == TasksManager.COMPLETE)
         {
            return true;
         }
         return false;
      }

      private function updateFilter():void
      {
         _filteredBosses = [];
         for(var i:int = 0; i < BOSSES.length; i++)
         {
            var b:Object = BOSSES[i];
            if(_currentGalaxy != "全部" && b.galaxy != _currentGalaxy)
            {
               continue;
            }
            var def:Boolean = isBossDefeated(b);
            if(_currentFilter == "已击败" && !def) continue;
            if(_currentFilter == "未击败" && def) continue;

            _filteredBosses.push(b);
         }

         _summaryTxt.text = "当前星系：" + _currentGalaxy + " | 筛选：" + _currentFilter + " | 共 " + _filteredBosses.length + " 个首领";
         renderCards();
         updatePagination();
      }

      private function renderCards():void
      {
         while(_cardsArea.numChildren > 0) _cardsArea.removeChildAt(0);

         var startIdx:int = (_curPage - 1) * _pageSize;
         var endIdx:int = Math.min(_filteredBosses.length, startIdx + _pageSize);

         for(var i:int = startIdx; i < endIdx; i++)
         {
            var b:Object = _filteredBosses[i];
            var slot:int = i - startIdx;
            var col:int = slot % 3;
            var row:int = slot / 3;

            var card:Sprite = createBossCard(b);
            card.x = col * 278;
            card.y = row * 168;
            _cardsArea.addChild(card);
         }
      }

      private function createBossCard(b:Object):Sprite
      {
         var c:Sprite = new Sprite();
         var w:Number = 268;
         var h:Number = 158;
         var defeated:Boolean = isBossDefeated(b);

         c.graphics.lineStyle(1.5, defeated ? 0x256b3e : 0x00d8ff, 0.8);
         c.graphics.beginFill(defeated ? 0x071a2b : 0x091e35, 0.95);
         c.graphics.drawRoundRect(0, 0, w, h, 8, 8);
         c.graphics.endFill();

         c.graphics.beginFill(defeated ? 0x103622 : 0x0d2e50);
         c.graphics.drawRoundRect(0, 0, w, 24, 6, 6);
         c.graphics.endFill();

         var nameTxt:TextField = createLabel(c, 10, 3, 160, 20, 13, defeated ? 0x84f0a7 : 0xffd200, true);
         nameTxt.text = b.name;

         var gBadge:TextField = createLabel(c, 170, 3, 90, 20, 11, 0x64b5f6, false, TextFormatAlign.RIGHT);
         gBadge.text = b.galaxy;

         var avatarSlot:Sprite = new Sprite();
         avatarSlot.x = 42; avatarSlot.y = 74;
         avatarSlot.graphics.lineStyle(1.5, defeated ? 0x256b3e : 0x00d8ff, 0.6);
         avatarSlot.graphics.beginFill(0x061424);
         avatarSlot.graphics.drawCircle(0, 0, 28);
         avatarSlot.graphics.endFill();

         var l:Loader = new Loader();
         l.contentLoaderInfo.addEventListener(Event.COMPLETE, function(e:Event):void {
            if(l.content)
            {
               l.content.scaleX = l.content.scaleY = 0.95;
               l.content.x = -24;
               l.content.y = -24;
            }
         });
         l.contentLoaderInfo.addEventListener(IOErrorEvent.IO_ERROR, function(e:IOErrorEvent):void {});
         l.load(new URLRequest(ClientConfig.getPetHeadPath(b.id)));
         avatarSlot.addChild(l);
         c.addChild(avatarSlot);

         var locTxt:TextField = createLabel(c, 82, 34, 176, 20, 11, 0xa0c5e8);
         locTxt.text = "地点：" + b.loc;

         var lvTxt:TextField = createLabel(c, 82, 54, 176, 20, 11, 0xffb870);
         lvTxt.text = "等级：Lv." + b.lv + (b.hp > 0 ? (" · 体力 " + b.hp) : "");

         var stTxt:TextField = createLabel(c, 82, 74, 176, 20, 11, defeated ? 0x75e29f : 0xff9000, true);
         stTxt.text = defeated ? "状态：✓ 已击败" : "状态：未战胜";

         if(defeated)
         {
            var stamp:Sprite = new Sprite();
            stamp.graphics.lineStyle(1.5, 0xef5350, 0.85);
            stamp.graphics.beginFill(0xb71c1c, 0.75);
            stamp.graphics.drawRoundRect(-30, -10, 60, 20, 4, 4);
            stamp.graphics.endFill();
            stamp.x = 220; stamp.y = 66;
            stamp.rotation = -12;
            var stpTxt:TextField = createLabel(stamp, -30, -8, 60, 18, 10, 0xffffff, true, TextFormatAlign.CENTER);
            stpTxt.text = "已击破";
            c.addChild(stamp);
         }

         var goBtn:Sprite = new Sprite();
         goBtn.x = 14; goBtn.y = 114;
         goBtn.graphics.lineStyle(1.5, 0xffee82);
         goBtn.graphics.beginFill(0xff9000);
         goBtn.graphics.drawRoundRect(0, 0, w - 28, 30, 15, 15);
         goBtn.graphics.endFill();
         goBtn.buttonMode = true;

         var btnTxt:TextField = createLabel(goBtn, 0, 5, w - 28, 22, 13, 0xffffff, true, TextFormatAlign.CENTER);
         btnTxt.text = "【前往挑战】直达地图 " + b.mapId;

         (function(targetBoss:Object):void {
            goBtn.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
               hide();
               if(targetBoss.mapId == 514)
               {
                  MapManager.changeLocalMap(514);
               }
               else if(targetBoss.mapId > 0)
               {
                  MapManager.changeMap(targetBoss.mapId);
               }
            });
         })(b);

         c.addChild(goBtn);
         return c;
      }

      private function drawFooter():void
      {
         var ft:Sprite = new Sprite();
         ft.x = 24; ft.y = 470;
         _panel.addChild(ft);

         var prevBtn:Sprite = new Sprite();
         drawNavBtn(prevBtn, 0, 0, 80, 32, "◀ 上一页");
         prevBtn.buttonMode = true;
         prevBtn.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
            if(_curPage > 1)
            {
               _curPage--;
               renderCards();
               updatePagination();
            }
         });
         ft.addChild(prevBtn);

         _pageTxt = createLabel(ft, 350, 4, 132, 24, 14, 0xffd200, true, TextFormatAlign.CENTER);

         var nextBtn:Sprite = new Sprite();
         drawNavBtn(nextBtn, 752, 0, 80, 32, "下一页 ▶");
         nextBtn.buttonMode = true;
         nextBtn.addEventListener(MouseEvent.CLICK, function(e:MouseEvent):void {
            var totalPage:int = Math.max(1, Math.ceil(_filteredBosses.length / _pageSize));
            if(_curPage < totalPage)
            {
               _curPage++;
               renderCards();
               updatePagination();
            }
         });
         ft.addChild(nextBtn);
      }

      private function drawNavBtn(s:Sprite, x:Number, y:Number, w:Number, h:Number, label:String):void
      {
         s.x = x; s.y = y;
         s.graphics.lineStyle(1.5, 0x00d8ff);
         s.graphics.beginFill(0x154573);
         s.graphics.drawRoundRect(0, 0, w, h, 6, 6);
         s.graphics.endFill();

         var tf:TextField = createLabel(s, 0, 5, w, h, 12, 0xffffff, true, TextFormatAlign.CENTER);
         tf.text = label;
      }

      private function updatePagination():void
      {
         var totalPage:int = Math.max(1, Math.ceil(_filteredBosses.length / _pageSize));
         _pageTxt.text = _curPage + " / " + totalPage;
      }

      private function createLabel(parent:Sprite, x:Number, y:Number, w:Number, h:Number, size:int, color:uint, bold:Boolean = false, align:String = "left"):TextField
      {
         var t:TextField = new TextField();
         t.x = x; t.y = y; t.width = w; t.height = h;
         t.defaultTextFormat = new TextFormat("Microsoft YaHei, SimHei, Arial", size, color, bold, null, null, null, null, align);
         t.selectable = false;
         t.mouseEnabled = false;
         parent.addChild(t);
         return t;
      }
   }
}
