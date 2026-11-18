package com.robot.app.task.petstory.app.train
{
   import com.robot.core.config.xml.PetBookXMLInfo;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.manager.UIManager;
   import flash.display.SimpleButton;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.filters.GlowFilter;
   import flash.geom.Rectangle;
   import flash.text.TextField;
   import flash.text.TextFormat;
   import org.taomee.utils.DisplayUtil;

   public class TrainGradePanel
   {
      private static var _instance:TrainGradePanel;
      private static var _tab:uint = 0;

      private var _root:Sprite;
      private var _body:Sprite;

      public static function show(defaultTab:int = -1) : void
      {
         if(defaultTab == 0 || defaultTab == 1)
         {
            _tab = uint(defaultTab);
         }
         else
         {
            _tab = TrainData.mode;
         }
         if(_instance != null)
         {
            _instance.close();
         }
         new TrainGradePanel();
      }

      public function TrainGradePanel()
      {
         super();
         if(_instance != null)
         {
            _instance.close();
         }
         _instance = this;
         this.buildUI();
      }

      private function buildUI() : void
      {
         var w:Number = 680;
         var h:Number = 436;
         this._root = new Sprite();
         var bg:Sprite = UIManager.getSprite("Panel_Background");
         bg.scale9Grid = new Rectangle(40,40,bg.width - 80,bg.height - 80);
         bg.width = w;
         bg.height = h;
         this._root.addChild(bg);

         var titleBar:Sprite = UIManager.getSprite("Panel_TitleBar");
         if(titleBar)
         {
            titleBar.x = 26;
            titleBar.y = 10;
            titleBar.width = w - 52;
            titleBar.mouseEnabled = false;
            titleBar.mouseChildren = false;
            this._root.addChild(titleBar);
         }

         this._root.graphics.lineStyle(1,2321320,0.9);
         this._root.graphics.beginFill(406878,0.88);
         this._root.graphics.drawRoundRect(24,48,w - 48,h - 70,10,10);
         this._root.graphics.endFill();

         var titleTxt:TextField = this.makeText("精灵学院 · 学习力与经验综合特训中心",38,14,480,26,17,16777215,true);
         titleTxt.filters = [new GlowFilter(676487,0.95,4,4,8)];
         this._root.addChild(titleTxt);

         var closeBtn:SimpleButton = UIManager.getButton("Close_Btn");
         if(closeBtn)
         {
            closeBtn.x = w - 48;
            closeBtn.y = 14;
            closeBtn.width = 24;
            closeBtn.height = 24;
            closeBtn.addEventListener(MouseEvent.CLICK,this.onCloseClick);
            this._root.addChild(closeBtn);
         }

         this._body = new Sprite();
         this._body.x = 34;
         this._body.y = 56;
         this._root.addChild(this._body);

         this._root.x = int((MainManager.getStage().stageWidth - w) / 2);
         this._root.y = int((MainManager.getStage().stageHeight - h) / 2);
         LevelManager.appLevel.addChild(this._root);
         this.render();
      }

      private function render() : void
      {
         if(!this._body)
         {
            return;
         }
         while(this._body.numChildren > 0)
         {
            this._body.removeChildAt(0);
         }

         // 顶部双模式切换栏
         this.makeButton(this._body,(_tab == 0 ? "▶ " : "") + "模式一：刷学习力（六项定向训练）",0,0,296,30,function():void
         {
            _tab = 0;
            render();
         },_tab == 0 ? 16772252 : 14086655);

         this.makeButton(this._body,(_tab == 1 ? "▶ " : "") + "模式二：刷经验（按属性与阶段等级）",314,0,298,30,function():void
         {
            _tab = 1;
            render();
         },_tab == 1 ? 16772252 : 14086655);

         var pet:PetInfo = this.getLeadPet();
         var petSummary:String = "当前首发：未携带精灵（请先在背包放入出战精灵）";
         if(pet != null)
         {
            var totalEv:uint = uint(pet.ev_hp + pet.ev_attack + pet.ev_defence + pet.ev_sa + pet.ev_sd + pet.ev_sp);
            petSummary = "当前首发：" + PetXMLInfo.getName(pet.id) + " (Lv." + pet.level + " · " + PetXMLInfo.getTypeCN(pet.id) + "系)   |   " +
               "学习力：体" + pet.ev_hp + " 攻" + pet.ev_attack + " 防" + pet.ev_defence + " 特攻" + pet.ev_sa + " 特防" + pet.ev_sd + " 速" + pet.ev_sp + " (总" + totalEv + "/510)";
         }
         var infoBar:TextField = this.makeText(petSummary,0,38,612,22,12,11525887,true);
         this._body.addChild(infoBar);

         if(_tab == 0)
         {
            this.renderEvTab();
         }
         else
         {
            this.renderExpTab(pet);
         }
      }

      private function renderEvTab() : void
      {
         var gradeTitle:TextField = this.makeText("第一步：选择学习力训练强度（训练室靶子固定低伤，一招即可击败）",0,68,610,22,14,16772252,true);
         this._body.addChild(gradeTitle);

         this.makeButton(this._body,(TrainData.trainGrade == 0 ? "★ " : "") + "初级训练室（Lv.15 一阶靶子 · 单场 +5 学习力）",0,96,296,30,function():void
         {
            TrainData.trainGrade = 0;
            render();
         },TrainData.trainGrade == 0 ? 16772252 : 16777215);

         this.makeButton(this._body,(TrainData.trainGrade == 1 ? "★ " : "") + "高级训练室（Lv.30 三阶靶子 · 单场 +10 学习力）",314,96,298,30,function():void
         {
            TrainData.trainGrade = 1;
            render();
         },TrainData.trainGrade == 1 ? 16772252 : 16777215);

         var roomTitle:TextField = this.makeText("第二步：点击要刷的单项学习力直接进入对应训练室",0,138,610,22,14,16772252,true);
         this._body.addChild(roomTitle);

         var rooms:Array = TrainData.trainGrade == 0 ? [488,489,490,491,492,493] : [470,471,472,473,474,475];
         var labels:Array = [
            "训练【攻击】学习力 (" + (TrainData.trainGrade == 0 ? "皮皮/比比鼠 +5攻" : "波克尔/天雷鼠 +10攻") + ")",
            "训练【防御】学习力 (" + (TrainData.trainGrade == 0 ? "查斯/伊达 +5防" : "查尔顿/哈伊卡 +10防") + ")",
            "训练【特攻】学习力 (" + (TrainData.trainGrade == 0 ? "利利/格林 +5特攻" : "电击兔/洛吉拉斯 +10特攻") + ")",
            "训练【特防】学习力 (" + (TrainData.trainGrade == 0 ? "伊娃/辛克 +5特防" : "巴拉龟/伊娅丝 +10特防") + ")",
            "训练【速度】学习力 (" + (TrainData.trainGrade == 0 ? "毛毛/幽浮 +5速度" : "巴洛卡/西萨琉拉 +10速度") + ")",
            "训练【体力】学习力 (" + (TrainData.trainGrade == 0 ? "奇洛/丁格 +5体力" : "塔奇拉顿/丁鲁特 +10体力") + ")"
         ];

         var i:uint = 0;
         while(i < 6)
         {
            var col:uint = i % 2;
            var row:uint = uint(Math.floor(i / 2));
            var targetMap:uint = uint(rooms[i]);
            this.makeRoomButton(String(labels[i]),col * 314,168 + row * 44,298,34,targetMap);
            i++;
         }

         var tip:TextField = this.makeText("提示：双倍学习力道具或十倍学习力加成卡可在训练室叠加生效，最高单项255、总计510。",0,308,612,22,12,13495295,false);
         this._body.addChild(tip);

         this.makeButton(this._body,"打开原版院长特瑞选房界面",180,332,250,28,function():void
         {
            close();
            new TrainItemPanel();
         },14086655);
      }

      private function makeRoomButton(label:String, x:Number, y:Number, w:Number, h:Number, targetMap:uint) : void
      {
         this.makeButton(this._body,label,x,y,w,h,function():void
         {
            TrainData.mode = 0;
            TrainData.roomId = targetMap;
            TrainData.times = 0;
            TrainData.totalTimes = 0;
            close();
            if(MapManager.currentMap && MapManager.currentMap.id == targetMap)
            {
               TrainControl.refreshTrainingTarget();
            }
            else
            {
               MapManager.changeMap(targetMap);
            }
         },16777215);
      }

      private function renderExpTab(pet:PetInfo) : void
      {
         var atkType:uint = pet != null ? uint(PetXMLInfo.getType(pet.id)) : 0;
         var recTypes:Array = TrainData.getRecommendedTargetsForAttackType(atkType);
         var recNames:Array = [];
         var r:uint = 0;
         while(r < recTypes.length)
         {
            recNames.push(TrainData.TYPE_NAMES[uint(recTypes[r])]);
            r++;
         }

         var recStr:String = pet != null
            ? ("★ 克制推荐：你的【" + PetXMLInfo.getTypeCN(pet.id) + "系】技能打【" + recNames.join(" / ") + "】享 2 倍克制伤害！")
            : "第一步：选择陪练精灵属性（带 ★ 为你当前首发精灵克制的系别）";
         var recTxt:TextField = this.makeText(recStr,0,64,418,22,13,16772252,true);
         this._body.addChild(recTxt);

         this.makeButton(this._body,"一键选克制属性 + 适配等级",424,60,188,26,function():void
         {
            if(recTypes.length > 0)
            {
               TrainData.expType = uint(recTypes[0]);
            }
            if(pet != null)
            {
               if(pet.level < 25) TrainData.expTier = 1;
               else if(pet.level < 45) TrainData.expTier = 2;
               else if(pet.level < 65) TrainData.expTier = 3;
               else if(pet.level < 82) TrainData.expTier = 4;
               else TrainData.expTier = 5;
            }
            render();
         },16772252);

         // 16 大属性 4x4 矩阵
         var t:uint = 1;
         while(t <= 16)
         {
            var idx:uint = t - 1;
            var col:uint = idx % 4;
            var row:uint = uint(Math.floor(idx / 4));
            var isRec:Boolean = recTypes.indexOf(t) >= 0;
            var isSelected:Boolean = TrainData.expType == t;
            var btnLabel:String = (isSelected ? "▶" : (isRec ? "★" : "")) + TrainData.TYPE_NAMES[t];
            this.makeTypeButton(btnLabel,col * 154,92 + row * 31,146,27,t,isSelected ? 16772252 : (isRec ? 11534255 : 16777215));
            t++;
         }

         var tierHeader:TextField = this.makeText("第二步：选择陪练阶段等级（纯经验特训，绝不乱加杂项学习力）",0,220,610,22,13,16772252,true);
         this._body.addChild(tierHeader);

         var tierLabels:Array = ["Lv.20 初阶","Lv.40 中阶","Lv.60 高阶","Lv.80 精英","Lv.100 满级"];
         var lvIdx:uint = 1;
         while(lvIdx <= 5)
         {
            var selectedTier:Boolean = TrainData.expTier == lvIdx;
            var pId:uint = TrainData.getExpPetId(TrainData.expType,lvIdx);
            var pName:String = PetBookXMLInfo.getName(pId);
            if(!pName || pName == "")
            {
               pName = PetXMLInfo.getName(pId);
            }
            var tierText:String = (selectedTier ? "▶ " : "") + tierLabels[lvIdx - 1] + " (" + pName + ")";
            this.makeTierButton(tierText,(lvIdx - 1) * 123,245,119,30,lvIdx,selectedTier ? 16772252 : 16777215);
            lvIdx++;
         }

         var curPetId:uint = TrainData.getExpPetId(TrainData.expType,TrainData.expTier);
         var curPetName:String = PetBookXMLInfo.getName(curPetId);
         if(!curPetName || curPetName == "")
         {
            curPetName = PetXMLInfo.getName(curPetId);
         }
         var summaryText:String = "当前选定陪练：【" + TrainData.TYPE_NAMES[TrainData.expType] + " · " + curPetName + " (Lv." + TrainData.TIER_LEVELS[TrainData.expTier] + ")】\n" +
            "收益说明：" + TrainData.TIER_EXP_DESC[TrainData.expTier] + "，不增加杂项学习力！";
         var summaryField:TextField = this.makeText(summaryText,0,282,612,42,13,14086655,true);
         summaryField.multiline = true;
         summaryField.wordWrap = true;
         this._body.addChild(summaryField);

         this.makeButton(this._body,"▶ 进入训练室开始【" + curPetName + " Lv." + TrainData.TIER_LEVELS[TrainData.expTier] + "】经验特训",126,330,360,32,function():void
         {
            TrainData.mode = 1;
            if(TrainData.roomId == 0)
            {
               TrainData.roomId = 488;
            }
            TrainData.times = 0;
            TrainData.totalTimes = 0;
            var targetRoom:uint = TrainData.roomId;
            if(MapManager.currentMap && ((MapManager.currentMap.id >= 488 && MapManager.currentMap.id <= 493) || (MapManager.currentMap.id >= 470 && MapManager.currentMap.id <= 475)))
            {
               targetRoom = MapManager.currentMap.id;
               TrainData.roomId = targetRoom;
               close();
               TrainControl.refreshTrainingTarget();
            }
            else
            {
               close();
               MapManager.changeMap(targetRoom);
            }
         },16772252);
      }

      private function makeTypeButton(label:String, x:Number, y:Number, w:Number, h:Number, typeId:uint, color:uint) : void
      {
         this.makeButton(this._body,label,x,y,w,h,function():void
         {
            TrainData.expType = typeId;
            render();
         },color);
      }

      private function makeTierButton(label:String, x:Number, y:Number, w:Number, h:Number, tierId:uint, color:uint) : void
      {
         this.makeButton(this._body,label,x,y,w,h,function():void
         {
            TrainData.expTier = tierId;
            render();
         },color);
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

      private function makeText(str:String, x:Number, y:Number, w:Number, h:Number, size:uint = 13, color:uint = 16777215, bold:Boolean = false) : TextField
      {
         var tf:TextField = new TextField();
         var fmt:TextFormat = new TextFormat("宋体",size,color,bold);
         tf.defaultTextFormat = fmt;
         tf.text = str;
         tf.setTextFormat(fmt);
         tf.x = x;
         tf.y = y;
         tf.width = w;
         tf.height = h;
         tf.selectable = false;
         tf.mouseEnabled = false;
         tf.filters = [new GlowFilter(668267,0.85,3,3,4)];
         return tf;
      }

      private function makeButton(parent:Sprite, label:String, x:Number, y:Number, w:Number, h:Number, onClick:Function, textColor:uint = 16777215) : Sprite
      {
         var holder:Sprite = new Sprite();
         holder.x = x;
         holder.y = y;
         var up:* = UIManager.getDisplayObject("Button_upSkin");
         var over:* = UIManager.getDisplayObject("Button_overSkin");
         var down:* = UIManager.getDisplayObject("Button_downSkin");
         up.width = over.width = down.width = w;
         up.height = over.height = down.height = h;
         holder.addChild(new SimpleButton(up,over,down,up));

         var tf:TextField = new TextField();
         var fmt:TextFormat = new TextFormat("宋体",12,textColor,true);
         fmt.align = "center";
         tf.defaultTextFormat = fmt;
         tf.text = label;
         tf.setTextFormat(fmt);
         tf.width = w;
         tf.height = h - 4;
         tf.y = Math.max(2,int((h - 18) / 2));
         tf.selectable = false;
         tf.mouseEnabled = false;
         tf.filters = [new GlowFilter(668267,0.9,3,3,4)];
         holder.addChild(tf);

         holder.buttonMode = true;
         holder.mouseChildren = false;
         holder.addEventListener(MouseEvent.CLICK,function(e:MouseEvent):void
         {
            if(onClick != null)
            {
               onClick();
            }
         });
         parent.addChild(holder);
         return holder;
      }

      private function onCloseClick(e:MouseEvent) : void
      {
         this.close();
      }

      public function close() : void
      {
         if(this._root)
         {
            DisplayUtil.removeForParent(this._root);
            this._root = null;
         }
         this._body = null;
         if(_instance == this)
         {
            _instance = null;
         }
      }
   }
}
