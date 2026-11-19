package com.robot.app.task.petstory.app.train
{
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.PetBookXMLInfo;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.event.MCLoadEvent;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.manager.UIManager;
   import com.robot.core.newloader.MCLoader;
   import flash.display.DisplayObject;
   import flash.display.DisplayObjectContainer;
   import flash.display.MovieClip;
   import flash.display.Shape;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.filters.GlowFilter;
   import flash.geom.Rectangle;
   import flash.system.ApplicationDomain;
   import flash.text.TextField;
   import flash.text.TextFieldAutoSize;
   import flash.text.TextFormat;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.AlignType;
   import org.taomee.utils.DisplayUtil;

   // 精灵学院面板，全部使用原版美术：
   // tab 0：原版 trainGrade.swf「请选择训练室」，选初级/高级后进入原版 train.swf 六项学习力面板（TrainItemPanel）。
   // tab 1：经验训练室，底板沿用原版 train.swf 的 Train_UI（边框、院长、说明框、按钮），
   //        说明框上方标题换成「经验训练室」，16 系用原版属性图标，5 档等级与开始按钮用原版按钮底。
   public class TrainGradePanel
   {
      private static const GRADE_PATH:String = ClientConfig.getResPath("module/ext/app/trainGrade.swf");
      private static const EXP_PATH:String = ClientConfig.getResPath("module/ext/app/train.swf");
      private static const TIER_LABELS:Array = ["","Lv.20","Lv.40","Lv.60","Lv.80","Lv.100"];
      private static const LABEL_GLOW:GlowFilter = new GlowFilter(670348,1,3,3,12);
      private static const PICK_GLOW:GlowFilter = new GlowFilter(16776960,1,10,10,3);
      private static const REC_GLOW:GlowFilter = new GlowFilter(65535,0.9,8,8,2);

      private static var _instance:TrainGradePanel;
      private static var _expPicked:Boolean = false;

      private var _isExp:Boolean;
      private var _loader:MCLoader;
      private var _ui:MovieClip;
      private var _desc:TextField;
      private var _typeIcons:Array = [];
      private var _tierBtns:Array = [];
      private var _tierLabels:Array = [];
      private var _startBtn:SimpleButton;

      public function TrainGradePanel(isExp:Boolean)
      {
         super();
         this._isExp = isExp;
         this._loader = new MCLoader(isExp ? EXP_PATH : GRADE_PATH,LevelManager.topLevel,1,isExp ? "正在加载经验训练室面板" : "正在加载训练等级面板");
         this._loader.addEventListener(MCLoadEvent.SUCCESS,this.onComplete);
         this._loader.doLoad();
      }

      public static function show(defaultTab:int = -1) : void
      {
         var tab:int = defaultTab == 0 || defaultTab == 1 ? defaultTab : int(TrainData.mode);
         if(_instance != null)
         {
            _instance.close();
         }
         _instance = new TrainGradePanel(tab == 1);
      }

      private function onComplete(e:MCLoadEvent) : void
      {
         this._loader.removeEventListener(MCLoadEvent.SUCCESS,this.onComplete);
         if(_instance != this)
         {
            return;
         }
         var app:ApplicationDomain = e.getApplicationDomain();
         this._ui = new (app.getDefinition(this._isExp ? "Train_UI" : "TrainGrade_UI") as Class)() as MovieClip;
         this._ui["closeBtn"].addEventListener(MouseEvent.CLICK,this.onCloseClick);
         if(this._isExp)
         {
            this.setupExp();
         }
         else
         {
            (this._ui["grade_0"] as SimpleButton).addEventListener(MouseEvent.CLICK,this.onGrade);
            (this._ui["grade_1"] as SimpleButton).addEventListener(MouseEvent.CLICK,this.onGrade);
         }
         DisplayUtil.align(this._ui,null,AlignType.MIDDLE_CENTER);
         LevelManager.appLevel.addChild(this._ui);
         LevelManager.closeMouseEvent();
      }

      private function onGrade(e:MouseEvent) : void
      {
         TrainData.trainGrade = e.currentTarget == this._ui["grade_1"] ? 1 : 0;
         this.close();
         new TrainItemPanel();
      }

      private function setupExp() : void
      {
         var i:int = 0;
         var child:DisplayObject = null;
         var titleBox:DisplayObject = null;
         for(i = 0; i < this._ui.numChildren; i++)
         {
            child = this._ui.getChildAt(i);
            if(child is TextField)
            {
               this._desc = child as TextField;
            }
            else if(child is Shape && child.width > 400 && child.height < 150)
            {
               titleBox = child;
            }
         }
         // 原版标题「学习力训练室」与说明框是同一个图形，遮住标题只留说明框
         if(titleBox)
         {
            var mask:Shape = new Shape();
            mask.graphics.beginFill(0);
            mask.graphics.drawRect(200,84,440,82);
            mask.graphics.endFill();
            this._ui.addChild(mask);
            titleBox.mask = mask;
         }
         this._ui.addChild(this.makeTitle("经验训练室",212,30));

         var pet:PetInfo = this.getLeadPet();
         var recTypes:Array = pet != null ? TrainData.getRecommendedTargetsForAttackType(uint(PetXMLInfo.getType(pet.id))) : [];
         if(!_expPicked && pet != null)
         {
            _expPicked = true;
            TrainData.expType = uint(recTypes[0]);
            TrainData.expTier = pet.level < 25 ? 1 : (pet.level < 45 ? 2 : (pet.level < 65 ? 3 : (pet.level < 82 ? 4 : 5)));
         }

         for(i = 1; i <= 16; i++)
         {
            var icon:SimpleButton = UIManager.getButton("Icon_PetType_" + i);
            // 按钮的点击区比图标大，按 upState 的实际图形算尺寸
            var b:Rectangle = icon.upState.getBounds(icon);
            var s:Number = Math.min(42 / b.width,30 / b.height);
            icon.scaleX = icon.scaleY = s;
            icon.name = "type_" + i;
            icon.x = 236 + ((i - 1) % 8) * 49 + 24 - (b.x + b.width / 2) * s;
            icon.y = 187 + int((i - 1) / 8) * 42 - (b.y + b.height / 2) * s;
            icon.addEventListener(MouseEvent.CLICK,this.onType);
            ToolTipManager.add(icon,TrainData.TYPE_NAMES[i] + (recTypes.indexOf(i) >= 0 ? "（克制）" : ""));
            this._ui.addChild(icon);
            this._typeIcons.push(icon);
         }

         // 原版六个按钮：前五个做等级档位，最后一个做开始训练
         var btns:Array = [];
         for(i = 0; i <= 5; i++)
         {
            btns.push(this._ui["btn_" + i] as SimpleButton);
         }
         for(i = 0; i < 5; i++)
         {
            var tb:SimpleButton = btns[i];
            this.stripLabel(tb);
            tb.scaleX = 76 / tb.width;
            tb.scaleY = 0.8;
            this.place(tb,236 + i * 79,256);
            tb.addEventListener(MouseEvent.CLICK,this.onTier);
            this._tierBtns.push(tb);
            this._tierLabels.push(this.addLabel(tb,TIER_LABELS[i + 1],14));
         }
         this._startBtn = btns[5];
         this.stripLabel(this._startBtn);
         this.place(this._startBtn,432 - this._startBtn.width / 2,306);
         this._startBtn.addEventListener(MouseEvent.CLICK,this.onStart);
         this.addLabel(this._startBtn,"开始训练",17);
         this.refreshExp(recTypes);
      }

      // 选中的属性/档位金色光圈，首发精灵克制的属性青色光圈
      private function refreshExp(recTypes:Array) : void
      {
         var i:int = 0;
         for(i = 0; i < this._typeIcons.length; i++)
         {
            (this._typeIcons[i] as SimpleButton).filters = i + 1 == TrainData.expType ? [PICK_GLOW] : (recTypes.indexOf(i + 1) >= 0 ? [REC_GLOW] : []);
         }
         for(i = 0; i < this._tierBtns.length; i++)
         {
            var picked:Boolean = i + 1 == TrainData.expTier;
            (this._tierBtns[i] as SimpleButton).filters = picked ? [PICK_GLOW] : [];
            (this._tierLabels[i] as TextField).textColor = picked ? 16773120 : 16777215;
         }
         var petId:uint = TrainData.getExpPetId(TrainData.expType,TrainData.expTier);
         this._desc.htmlText = "<font face=\'宋体\' size=\'13\' color=\'#ffffff\'>陪练精灵：<font color=\'#00ffff\'>" + this.petName(petId) + "</font>  Lv." + TrainData.TIER_LEVELS[TrainData.expTier] + "（" + TrainData.TYPE_NAMES[TrainData.expType] + "）<br>" +
            "<font color=\'#ffff00\'>" + TrainData.TIER_EXP_DESC[TrainData.expTier] + "</font></font>";
      }

      private function onType(e:MouseEvent) : void
      {
         TrainData.expType = uint(String(e.currentTarget.name).split("_")[1]);
         this.refreshFromUi();
      }

      private function onTier(e:MouseEvent) : void
      {
         TrainData.expTier = uint(this._tierBtns.indexOf(e.currentTarget) + 1);
         this.refreshFromUi();
      }

      private function refreshFromUi() : void
      {
         var pet:PetInfo = this.getLeadPet();
         this.refreshExp(pet != null ? TrainData.getRecommendedTargetsForAttackType(uint(PetXMLInfo.getType(pet.id))) : []);
      }

      private function onStart(e:MouseEvent) : void
      {
         TrainData.mode = 1;
         TrainData.times = 0;
         TrainData.totalTimes = 0;
         var cur:uint = MapManager.currentMap ? uint(MapManager.currentMap.id) : 0;
         var inRoom:Boolean = cur >= 488 && cur <= 493 || cur >= 470 && cur <= 475;
         if(inRoom)
         {
            TrainData.roomId = cur;
         }
         else if(TrainData.roomId == 0)
         {
            TrainData.roomId = 488;
         }
         this.close();
         if(inRoom)
         {
            TrainControl.refreshTrainingTarget();
         }
         else
         {
            MapManager.changeMap(TrainData.roomId);
         }
      }

      // 隐藏原版按钮底图上的「训练XX学习力」文字图形，只留按钮底
      private function stripLabel(btn:SimpleButton) : void
      {
         this.hideTextShapes(btn.upState);
         this.hideTextShapes(btn.overState);
         this.hideTextShapes(btn.downState);
      }

      private function hideTextShapes(d:DisplayObject) : void
      {
         if(d is Shape && d.height < 30)
         {
            d.visible = false;
            return;
         }
         var c:DisplayObjectContainer = d as DisplayObjectContainer;
         if(c)
         {
            for(var i:int = 0; i < c.numChildren; i++)
            {
               this.hideTextShapes(c.getChildAt(i));
            }
         }
      }

      private function place(d:DisplayObject, left:Number, top:Number) : void
      {
         var r:Rectangle = d.getBounds(d.parent);
         d.x += left - r.x;
         d.y += top - r.y;
      }

      private function addLabel(btn:SimpleButton, text:String, size:uint) : TextField
      {
         var r:Rectangle = btn.getBounds(this._ui);
         var tf:TextField = new TextField();
         var fmt:TextFormat = new TextFormat("黑体",size,16777215,true,true);
         fmt.align = "center";
         tf.defaultTextFormat = fmt;
         tf.text = text;
         tf.selectable = false;
         tf.mouseEnabled = false;
         tf.width = r.width;
         tf.height = size + 8;
         tf.x = r.x;
         tf.y = r.y + (r.height - tf.height) / 2 - 1;
         tf.filters = [LABEL_GLOW];
         this._ui.addChild(tf);
         return tf;
      }

      private function makeTitle(text:String, x:Number, y:Number) : TextField
      {
         var tf:TextField = new TextField();
         tf.defaultTextFormat = new TextFormat("黑体",32,16777215,true,true);
         tf.autoSize = TextFieldAutoSize.LEFT;
         tf.text = text;
         tf.selectable = false;
         tf.mouseEnabled = false;
         tf.x = x;
         tf.y = y;
         tf.filters = [new GlowFilter(6826948,1,5,5,16),new GlowFilter(16777215,1,4,4,10)];
         return tf;
      }

      private function petName(petId:uint) : String
      {
         var name:String = PetBookXMLInfo.getName(petId);
         return name && name != "" ? name : PetXMLInfo.getName(petId);
      }

      private function getLeadPet() : PetInfo
      {
         var info:PetInfo = PetManager.getPetInfo(PetManager.defaultTime);
         if(info == null && PetManager.infos.length > 0)
         {
            info = PetManager.infos[0] as PetInfo;
         }
         return info;
      }

      private function onCloseClick(e:MouseEvent) : void
      {
         this.close();
      }

      public function close() : void
      {
         if(this._loader)
         {
            this._loader.removeEventListener(MCLoadEvent.SUCCESS,this.onComplete);
            this._loader = null;
         }
         if(this._ui)
         {
            for each(var icon:SimpleButton in this._typeIcons)
            {
               ToolTipManager.remove(icon);
            }
            DisplayUtil.removeForParent(this._ui,false);
            LevelManager.openMouseEvent();
            this._ui = null;
         }
         if(_instance == this)
         {
            _instance = null;
         }
      }
   }
}
