package com.robot.module.app
{
   import com.robot.app.fightNote.FightInviteManager;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.ModuleManager;
   import com.robot.core.manager.UIManager;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.DisplayObject;
   import flash.display.DisplayObjectContainer;
   import flash.display.InteractiveObject;
   import flash.display.MovieClip;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.geom.ColorTransform;
   import flash.text.TextField;
   import org.taomee.effect.ColorFilter;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.module.IModule;
   import org.taomee.utils.DisplayUtil;

   // 训练师之门：沿用官方面板的美术。单属性之门的 15 张卡片对应服务端 BOSS 102/201–214，战斗系之门没有，
   // 迷之门放超能冰系的弗洛斯；双属性之门、勇者模式和勋章没有做，显示为未开放
   public class TrainDoorEnterPanel extends Sprite implements IModule
   {

      // 卡片 t_1–t_15：属性、守护精灵、BOSS 编号、等级、只受这些属性技能的伤害、首胜奖励
      // 与 compat/server-patches/train-door/gates.json、boss-locks/locks.json 和物品表一致，构建时校验
      private static const DOORS:Array = [["草","塔奇多克",201,92,[3,4],"塔奇多克的精元"],["火","火噜噜",202,100,[2,7],"火噜噜的精元"],["超能","查德洛",203,100,[12,13],"查德洛的精元"],["水","多尔尼",204,100,[1,5],"多尔尼的精元"],["飞行","加耶罗",205,92,[5,9],"加耶罗的精元"],["地面","岩锤怪",206,100,[1,2],"岩锤怪的精元"],["机械","LYN",207,85,[3,7],"LYN的精元"],["暗影","达克其",208,92,[5,12],"达克其的精元"],["冰","菲尔洛",209,92,[3,11],"菲尔洛的精元"],["光","卡莱洛",210,100,[1],"卡莱洛的精元"],["龙","哈尼卡",211,85,[11,15],"哈尼卡的精元"],["普通","瓦尔普",212,75,[8,11],"瓦尔普的精元"],null,["电","佩吉克",213,85,[7],"佩吉克的精元"],["超能冰","弗洛斯",214,92,[3,6],"弗洛斯的精元"]];

      private static const TYPE_NAMES:Array = ["","草","水","火","飞行","电","机械","地面","普通","冰","超能","战斗","光","暗影","神秘","龙","圣灵"];

      private static const PAGE_INIT_X:int = 63;

      private static const PAGE_END_X:int = -1082;

      // 主界面精灵属性图标（ui.swf 的 Icon_PetType_N）高 18、看得见的宽度如下；新建的按钮在 Ruffle 里当帧量不出尺寸
      private static const ICON_WIDTHS:Array = [0,12.1,9.9,10.1,16.1,14.65,13.95,17.2,16,12.75,22.8,18.55,21,13.1,16.75,18,18.25];

      private static const ICON_SCALE:Number = 1.9;

      // 未开放的内容压暗；卡片里有带滤镜的嵌套美术，Ruffle 算不出尺寸，灰度滤镜不生效
      private static const FADE:ColorTransform = new ColorTransform(0.3,0.3,0.3,1,40,40,40);

      private var _box:Sprite;

      private var _ui:TrainDoorEnterUI;

      private var _txt:TextField;

      private var _icons:Sprite;

      private var _cards:Array = [];

      private var _index:int = 1;

      private var _curX:int = 63;

      public function TrainDoorEnterPanel()
      {
         super();
      }

      public function setup() : void
      {
         var i:int = 0;
         var card:MovieClip = null;
         var child:DisplayObject = null;
         var door:Array = null;
         this._ui = new TrainDoorEnterUI();
         // 左右两半各有一个叫 txt 的文本框；右半是双属性之门，整体压暗
         for(i = 0; i < this._ui.numChildren; i++)
         {
            child = this._ui.getChildAt(i);
            if(child.name == "txt" && child.x < 480)
            {
               this._txt = child as TextField;
            }
            else if(child.name == "txt")
            {
               (child as TextField).htmlText = "<font color=\'#ffff00\'>双属性之门</font><font color=\'#ffffff\'>暂未开放，敬请期待！</font>";
            }
            else if(child != this._ui.closeBtn && (child.x >= 480 || child.getBounds(this._ui).left >= 480))
            {
               if(child is MovieClip)
               {
                  (child as MovieClip).gotoAndStop(1);
               }
               child.transform.colorTransform = FADE;
               if(child is InteractiveObject)
               {
                  (child as InteractiveObject).mouseEnabled = false;
               }
               if(child is DisplayObjectContainer)
               {
                  (child as DisplayObjectContainer).mouseChildren = false;
               }
            }
         }
         this._ui.achieve0.visible = false;
         this._ui.achieve1.visible = false;
         this._ui.misteryTxt.visible = false;
         this._ui.kind.visible = false;
         // 图标不能加进 _ui：卡片栏的遮罩（clipDepth）会盖住后加的子对象
         this._icons = new Sprite();
         this._icons.x = this._ui.kind.x;
         this._icons.y = this._ui.kind.y;
         this._icons.mouseEnabled = false;
         this._icons.mouseChildren = false;
         this._box = new Sprite();
         this._box.addChild(this._ui);
         this._box.addChild(this._icons);
         (this._ui.btns["btn_1"] as SimpleButton).filters = [ColorFilter.setGrayscale()];
         (this._ui.btns["ballMC"] as MovieClip).gotoAndStop(1);
         for(i = 1; i <= 15; i++)
         {
            card = this._ui.page["t_" + i];
            card.gotoAndStop(1);
            door = DOORS[i - 1];
            if(door)
            {
               card.buttonMode = true;
               card.addEventListener(MouseEvent.CLICK,this.onCard);
               ToolTipManager.add(card,"系列:" + this.doorName(i) + "\n适用精灵:" + this.typeNames(door[4],""));
            }
            else
            {
               card.transform.colorTransform = FADE;
               ToolTipManager.add(card,"系列:战斗系\n暂未开放，敬请期待！");
            }
            this._cards.push(card);
         }
         this._ui.page.x = PAGE_INIT_X;
         this._ui.closeBtn.addEventListener(MouseEvent.CLICK,this.onClose);
         this._ui.okBtn.addEventListener(MouseEvent.CLICK,this.onOk);
         this._ui.next.addEventListener(MouseEvent.MOUSE_DOWN,this.onNext);
         this._ui.prev.addEventListener(MouseEvent.MOUSE_DOWN,this.onPrev);
         (this._ui.btns["btn_1"] as SimpleButton).addEventListener(MouseEvent.CLICK,this.onBrave);
         this.select(1);
      }

      private function doorName(index:int) : String
      {
         return index == 15 ? "迷之门（" + DOORS[14][0] + "系）" : DOORS[index - 1][0] + "系";
      }

      private function typeNames(types:Array, suffix:String) : String
      {
         var names:Array = [];
         for(var i:int = 0; i < types.length; i++)
         {
            names.push(TYPE_NAMES[types[i]] + suffix);
         }
         return names.join("、");
      }

      private function onCard(e:MouseEvent) : void
      {
         this.select(int(String(e.currentTarget.name).split("_")[1]));
      }

      private function select(index:int) : void
      {
         var i:int = 0;
         var icon:SimpleButton = null;
         var x:Number = 9;
         var door:Array = DOORS[index - 1];
         this._index = index;
         for(i = 0; i < this._cards.length; i++)
         {
            this._cards[i].gotoAndStop(i + 1 == index ? 2 : 1);
         }
         this._ui.picMC.gotoAndStop(index);
         this._txt.htmlText = "<font color=\'#ffffff\'>守护精灵：<font color=\'#00ffff\'>" + door[1] + "</font>（" + door[3] + "级）<br>首胜奖励：<font color=\'#ffff00\'>" + door[5] + "</font><br><br><font color=\'#ffff00\'>【属性护盾】</font>只受" + this.typeNames(door[4],"系") + "技能的伤害，也不会陷入异常状态。</font>";
         // 适合使用精灵：按锁的属性画图标，图标取自主界面的精灵属性图标
         while(this._icons.numChildren > 0)
         {
            this._icons.removeChildAt(0);
         }
         for(i = 0; i < door[4].length; i++)
         {
            icon = UIManager.getButton("Icon_PetType_" + door[4][i]);
            icon.scaleX = icon.scaleY = ICON_SCALE;
            icon.x = x;
            icon.y = 8;
            x += ICON_WIDTHS[door[4][i]] * ICON_SCALE + 6;
            this._icons.addChild(icon);
         }
      }

      private function onNext(e:MouseEvent) : void
      {
         this._curX = Math.max(PAGE_END_X,this._curX - 382);
         this._ui.page.x = this._curX;
      }

      private function onPrev(e:MouseEvent) : void
      {
         this._curX = Math.min(PAGE_INIT_X,this._curX + 382);
         this._ui.page.x = this._curX;
      }

      private function onBrave(e:MouseEvent) : void
      {
         Alarm.show("勇者模式暂未开放，敬请期待！");
      }

      private function onOk(e:MouseEvent) : void
      {
         var door:Array = DOORS[this._index - 1];
         this.onClose(null);
         FightInviteManager.fightWithBoss(door[1],door[2]);
      }

      private function onClose(e:MouseEvent) : void
      {
         LevelManager.showOrRemoveMapLevelandToolslevel(true);
         ModuleManager.destroyForInstance(this);
      }

      public function init(data:Object = null) : void
      {
      }

      public function show() : void
      {
         LevelManager.showOrRemoveMapLevelandToolslevel(false);
         LevelManager.appLevel.addChild(this._box);
      }

      public function hide() : void
      {
         DisplayUtil.removeForParent(this._box);
      }

      public function destroy() : void
      {
         this.hide();
         for(var i:int = 0; i < this._cards.length; i++)
         {
            this._cards[i].removeEventListener(MouseEvent.CLICK,this.onCard);
            ToolTipManager.remove(this._cards[i]);
         }
         this._cards.length = 0;
         this._ui.closeBtn.removeEventListener(MouseEvent.CLICK,this.onClose);
         this._ui.okBtn.removeEventListener(MouseEvent.CLICK,this.onOk);
         this._ui.next.removeEventListener(MouseEvent.MOUSE_DOWN,this.onNext);
         this._ui.prev.removeEventListener(MouseEvent.MOUSE_DOWN,this.onPrev);
         (this._ui.btns["btn_1"] as SimpleButton).removeEventListener(MouseEvent.CLICK,this.onBrave);
         this._box = null;
         this._ui = null;
         this._txt = null;
         this._icons = null;
      }
   }
}
