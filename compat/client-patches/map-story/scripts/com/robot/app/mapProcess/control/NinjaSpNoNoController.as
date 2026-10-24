package com.robot.app.mapProcess.control
{
   import com.robot.app.buyItem.*;
   import com.robot.app.fight.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.animate.*;
   import com.robot.core.config.*;
   import com.robot.core.config.xml.*;
   import com.robot.core.controller.*;
   import com.robot.core.dispatcher.*;
   import com.robot.core.event.*;
   import com.robot.core.info.fightInfo.attack.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.*;
   import com.robot.core.net.*;
   import com.robot.core.newloader.*;
   import com.robot.core.npc.*;
   import com.robot.core.ui.alert.*;
   import com.robot.core.utils.*;
   import flash.display.*;
   import flash.events.*;
   import flash.geom.*;
   import flash.ui.*;
   import org.taomee.events.*;
   import org.taomee.manager.*;
   import org.taomee.utils.*;
   
   public class NinjaSpNoNoController
   {
      
      private static var _instance:NinjaSpNoNoController;
      
      private var isExt:Boolean;
      
      private var _map:BaseMapProcess;
      
      public const bufferArr:Array = [106,107,108,109,110,111,114,115];
      
      public const petIdArr:Array = [673,674,675,676];
      
      public const skillIdArr:Array = [11673,11679];
      
      private var ninjaMc:MovieClip;
      
      private var isFeiBiaoAble:Boolean;
      
      private var kjBtn:SimpleButton;
      
      private var maskBreakMc:MovieClip;
      
      private var isHasPetB:Boolean;
      
      private var shaPanBtn:SimpleButton;
      
      private var zhenYaniBtn:SimpleButton;
      
      private var feiBiaoCon:MovieClip;
      
      private var curtFeiBiaoMc:MovieClip;
      
      private var aniMc01:MovieClip;
      
      private var arrowMc:MovieClip;
      
      private var panelBtn:SimpleButton;
      
      private var yesMc:MovieClip;
      
      private var mcLoader:MCLoader;
      
      private var monsterPointArr:Array = [new Point(190,445),new Point(730,440)];
      
      private var monsterMcA:Array;
      
      public function NinjaSpNoNoController()
      {
         super();
         if(_instance != null)
         {
            throw new Error("该类是单例模式");
         }
         _instance = this;
         NinjaTalks.init();
      }
      
      public static function get instance() : NinjaSpNoNoController
      {
         if(_instance == null)
         {
            _instance = new NinjaSpNoNoController();
         }
         return _instance;
      }
      
      public function init() : void
      {
         EventManager.addEventListener(ItemAction.BUY_ONE,this.onGetZhenYuanHandler);
      }
      
      private function onGetZhenYuanHandler(param1:DynamicEvent) : void
      {
         var _loc2_:uint = 0;
         var _loc3_:uint = param1.paramObject as uint;
         if(_loc3_ > 400715 && _loc3_ < 400725)
         {
            _loc2_ = uint(_loc3_ - 400715);
            if(_loc3_ == 400716)
            {
               EventManager.addEventListener("close_Zhen_Yan_Panel",this.onCloseZhenYanPanel);
            }
            ModuleManager.showModule(ClientConfig.getAppModule("NinjaSpZhenYanPanel"),"正在打开",_loc2_);
         }
      }
      
      private function onCloseZhenYanPanel(param1:Event) : void
      {
         EventManager.removeEventListener("close_Zhen_Yan_Panel",this.onCloseZhenYanPanel);
         this.onClickKjHandler1(null);
      }
      
      public function initMap60(param1:BaseMapProcess) : void
      {
         this._map = param1;
         this.ninjaMc = this._map.depthLevel["ninjaMc"];
         ToolTipManager.add(this.ninjaMc,"忍魂密室");
         this.ninjaMc.buttonMode = true;
         this.ninjaMc.addEventListener(MouseEvent.ROLL_OUT,this.onRollOutNinjaHandler);
         this.ninjaMc.addEventListener(MouseEvent.ROLL_OVER,this.onRollOverNinjaHandler);
         this.ninjaMc.addEventListener(MouseEvent.CLICK,this.onClickNinjaHandler);
      }
      
      private function onRollOverNinjaHandler(param1:MouseEvent) : void
      {
         this.ninjaMc.gotoAndStop(2);
      }
      
      private function onRollOutNinjaHandler(param1:MouseEvent) : void
      {
         this.ninjaMc.gotoAndStop(1);
      }
      
      private function onClickNinjaHandler(param1:MouseEvent) : void
      {
         MapManager.changeMap(10881);
      }
      
      public function initMap480Main(param1:BaseMapProcess, param2:Boolean = false) : void
      {
         this._map = param1;
         this.isExt = param2;
         this.mcLoader = new MCLoader();
         this.mcLoader.doLoad(ClientConfig.getFullMovie("NinjaPopMc"));
         this.kjBtn = this._map.conLevel["kjBtn"];
         this.maskBreakMc = this._map.conLevel["maskBreakMc"];
         this.maskBreakMc.visible = false;
         this.shaPanBtn = this._map.conLevel["shaPanBtn"];
         ToolTipManager.add(this.shaPanBtn,"忍魂沙盘");
         this.zhenYaniBtn = this._map.conLevel["zhenYaniBtn"];
         ToolTipManager.add(this.zhenYaniBtn,"真言位谱");
         this.panelBtn = this._map.conLevel["panelBtn"];
         this.panelBtn.addEventListener(MouseEvent.CLICK,this.onClickPanelHandler);
         ToolTipManager.add(this.panelBtn,"忍者精灵训练");
         this.feiBiaoCon = this._map.conLevel["feiBiaoCon"];
         this.aniMc01 = this._map.animatorLevel["aniMc01"];
         this.aniMc01.gotoAndStop(1);
         this.aniMc01.visible = false;
         this.arrowMc = this._map.conLevel["arrowMc"];
         this.arrowMc.mouseEnabled = false;
         this.arrowMc.visible = false;
         this.yesMc = this._map.conLevel["yesMc"];
         this.yesMc.mouseChildren = false;
         this.yesMc.mouseEnabled = false;
         this.yesMc.visible = false;
         this.initMonsters();
         var _loc3_:Array = new Array();
         _loc3_.push(BufferRecordManager.getState(MainManager.actorInfo,this.bufferArr[0]));
         _loc3_.push(BufferRecordManager.getState(MainManager.actorInfo,this.bufferArr[1]));
         _loc3_.push(BufferRecordManager.getState(MainManager.actorInfo,this.bufferArr[2]));
         _loc3_.push(BufferRecordManager.getState(MainManager.actorInfo,this.bufferArr[3]));
         _loc3_.push(BufferRecordManager.getState(MainManager.actorInfo,this.bufferArr[4]));
         _loc3_.push(BufferRecordManager.getState(MainManager.actorInfo,this.bufferArr[5]));
         if(!_loc3_[0])
         {
            this.initMap480Handler0();
         }
         else if(Boolean(_loc3_[0]) && !_loc3_[1])
         {
            this.initMap480Handler1();
         }
         else if(Boolean(_loc3_[0]) && Boolean(_loc3_[1]) && !_loc3_[2])
         {
            this.initMap480Handler1_1();
         }
         else if(Boolean(_loc3_[0]) && Boolean(_loc3_[1]) && Boolean(_loc3_[2]) && !_loc3_[3])
         {
            if(!_loc3_[4])
            {
               this.isHasPetB = false;
            }
            this.initMap480Handler7();
         }
         else if(Boolean(_loc3_[0]) && Boolean(_loc3_[1]) && Boolean(_loc3_[2]) && Boolean(_loc3_[3]))
         {
            if(!_loc3_[4])
            {
               this.isHasPetB = true;
            }
            this.initMap480Handler7();
         }
      }
      
      private function onClickZhenYanHandler(param1:MouseEvent) : void
      {
         BufferRecordManager.setState(MainManager.actorInfo,this.bufferArr[4],true);
         this.initMap480Handler7();
         this.arrowMc.visible = false;
         ModuleManager.showModule(ClientConfig.getAppModule("NinjaSpGoBossPanel"),"正在打开");
      }
      
      private function onClickPanelHandler(param1:MouseEvent) : void
      {
         ModuleManager.showModule(ClientConfig.getAppModule("NinjaReelPanel"),"正在打开");
      }
      
      private function initMonsters() : void
      {
         var _loc1_:uint = 0;
         var _loc2_:OgreModel = null;
         this.monsterMcA = new Array();
         var _loc3_:Array = [0,2];
         var _loc4_:uint = 0;
         while(_loc4_ < 2)
         {
            _loc1_ = uint(_loc3_[uint(Math.random() * 2)]);
            _loc2_ = new OgreModel(_loc1_);
            _loc2_.name = "pet_" + _loc1_;
            _loc2_.show(673,this.monsterPointArr[_loc4_]);
            _loc2_.addEventListener(MouseEvent.CLICK,this.onFIghtHandler);
            this.monsterMcA.push(_loc2_);
            _loc4_++;
         }
      }
      
      private function onFIghtHandler(param1:MouseEvent) : void
      {
         var _loc2_:String = null;
         var _loc3_:OgreModel = param1.currentTarget as OgreModel;
         var _loc4_:String = _loc3_.name;
         var _loc5_:uint = uint(_loc4_.slice(4,5));
         if(_loc5_ == 0)
         {
            _loc2_ = "伊迦";
         }
         else if(_loc5_ == 0)
         {
            _loc2_ = "迦勒";
         }
         FightManager.fightWithBoss(_loc2_,_loc5_);
      }
      
      private function initMap480Handler0() : void
      {
         MainManager.actorModel.visible = false;
         MouseController.removeMouseEvent();
         this.aniMc01.visible = true;
         this.maskBreakMc.visible = true;
         ToolBarController.showOrHideAllUser(false);
         AnimateManager.playMcAnimate(this.aniMc01,0,"",function():void
         {
            MouseController.addMouseEvent();
            MainManager.actorModel.visible = true;
            DisplayUtil.removeForParent(aniMc01);
            kjBtn.addEventListener(MouseEvent.CLICK,onClickKjHandler0);
            onClickKjHandler0(null);
         });
      }
      
      private function onClickKjHandler0(param1:MouseEvent) : void
      {
         var i:uint = 0;
         i = 0;
         var e:MouseEvent = param1;
         i = 0;
         NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
         {
            ++i;
            NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
            {
               yesMc.visible = true;
               ++i;
               NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
               {
                  yesMc.visible = false;
                  ++i;
                  NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
                  {
                     ++i;
                     NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
                     {
                        ++i;
                        NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
                        {
                           ++i;
                           NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
                           {
                              ++i;
                              NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
                              {
                                 AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("NinjaAni01"),function():void
                                 {
                                    ++i;
                                    NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
                                    {
                                       ++i;
                                       NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
                                       {
                                          BufferRecordManager.setState(MainManager.actorInfo,bufferArr[0],true,function():void
                                          {
                                             i = 10;
                                             NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
                                             {
                                                initMap480Handler1();
                                             }]);
                                          });
                                       }]);
                                    }]);
                                 });
                              }]);
                           }]);
                        }]);
                     }]);
                  }]);
               }]);
            }]);
         }]);
      }
      
      private function initMap480Handler1() : void
      {
         var _loc1_:MovieClip = null;
         this.maskBreakMc.visible = true;
         this.maskBreakMc.buttonMode = true;
         this.maskBreakMc.addEventListener(MouseEvent.CLICK,this.onClickMaskBreakHandler);
         for each(_loc1_ in this.feiBiaoCon)
         {
            _loc1_.mouseChildren = false;
            _loc1_.gotoAndStop(1);
         }
         this.feiBiaoCon.addEventListener(MouseEvent.CLICK,this.onClickFeiBiaoHandler);
         this.kjBtn.removeEventListener(MouseEvent.CLICK,this.onClickKjHandler0);
         this.kjBtn.addEventListener(MouseEvent.CLICK,this.onClickKjHandler1);
      }
      
      private function onClickFeiBiaoHandler(param1:MouseEvent) : void
      {
         Mouse.hide();
         var _loc2_:MovieClip = param1.target as MovieClip;
         var _loc3_:String = _loc2_.name;
         if(_loc3_.slice(0,4) == "fbMc")
         {
            this.isFeiBiaoAble = true;
            this.curtFeiBiaoMc = _loc2_;
            this.feiBiaoCon.removeEventListener(MouseEvent.CLICK,this.onClickFeiBiaoHandler);
            MainManager.getStage().addEventListener(MouseEvent.MOUSE_MOVE,this.onFeiBiaoMoveHandler);
         }
      }
      
      private function initMap480Handler1_1() : void
      {
         this.kjBtn.removeEventListener(MouseEvent.CLICK,this.onClickKjHandler0);
         this.kjBtn.addEventListener(MouseEvent.CLICK,this.onClickKjHandler1);
      }
      
      private function onFeiBiaoMoveHandler(param1:MouseEvent) : void
      {
         var mc:MovieClip = null;
         var e:MouseEvent = param1;
         this.curtFeiBiaoMc.x = e.stageX - this.curtFeiBiaoMc.parent.x;
         this.curtFeiBiaoMc.y = e.stageY - this.curtFeiBiaoMc.parent.y;
         if(!this.maskBreakMc.hitTestObject(this.curtFeiBiaoMc))
         {
            e.updateAfterEvent();
         }
         else
         {
            Mouse.show();
            for each(mc in this.feiBiaoCon)
            {
               mc.gotoAndStop(2);
            }
            this.feiBiaoCon.removeEventListener(MouseEvent.CLICK,this.onClickFeiBiaoHandler);
            MainManager.getStage().removeEventListener(MouseEvent.MOUSE_MOVE,this.onFeiBiaoMoveHandler);
            this.curtFeiBiaoMc.visible = false;
            this.curtFeiBiaoMc = null;
            AnimateManager.playMcAnimate(this.maskBreakMc,0,"",function():void
            {
               maskBreakMc.visible = false;
               EventManager.addEventListener("Error17035",onError_17035);
               NinjaSocketCtrl.instance.addEventListener(NinjaSocketCtrl.GET_ZHEN_YAN,onGetZhenYanHandler);
               NinjaSocketCtrl.instance.getZhenYan();
            });
         }
      }
      
      private function onError_17035(param1:Event) : void
      {
         var e:Event = param1;
         EventManager.removeEventListener("Error17035",this.onError_17035);
         NinjaSocketCtrl.instance.removeEventListener(NinjaSocketCtrl.GET_ZHEN_YAN,this.onGetZhenYanHandler);
         BufferRecordManager.setState(MainManager.actorInfo,this.bufferArr[1],true,function():void
         {
            EventManager.dispatchEvent(new DynamicEvent(ItemAction.BUY_ONE,400716));
         });
      }
      
      private function onClickKjHandler1(param1:MouseEvent) : void
      {
         var i:uint = 0;
         i = 0;
         var e:MouseEvent = param1;
         var bool:Boolean = Boolean(BufferRecordManager.getState(MainManager.actorInfo,this.bufferArr[1]));
         if(bool)
         {
            i = 11;
            NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
            {
               i = 12;
               NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],null,null,false,function():void
               {
                  EventManager.addEventListener("close_pet_jump",onClosePetJumpHandler);
                  ModuleManager.showModule(ClientConfig.getAppModule("NinjaSpPetJumpPanel"),"正在打开");
               });
            }]);
         }
         else
         {
            i = 10;
            NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
            {
            }]);
         }
      }
      
      private function onClosePetJumpHandler(param1:Event) : void
      {
         EventManager.removeEventListener("close_pet_jump",this.onClosePetJumpHandler);
         EventManager.addEventListener("close_NinjaSpComicPanel",this.onCloseNinjaSpComicPanel);
         ModuleManager.showModule(ClientConfig.getAppModule("NinjaSpComicPanel"),"正在打开");
      }
      
      private function onCloseNinjaSpComicPanel(param1:Event) : void
      {
         EventManager.removeEventListener("close_NinjaSpComicPanel",this.onCloseNinjaSpComicPanel);
         this.initMap480Handler2();
      }
      
      private function onClickKjHandler2(param1:MouseEvent) : void
      {
         this.onTalkHandler3();
      }
      
      private function onClickMaskBreakHandler(param1:MouseEvent) : void
      {
         if(!this.isFeiBiaoAble)
         {
            Alarm.show("到处找找有什么利器，好像有东西在发光。");
         }
      }
      
      private function onGetZhenYanHandler(param1:DynamicEvent) : void
      {
         var e:DynamicEvent = param1;
         EventManager.removeEventListener("Error17035",this.onError_17035);
         NinjaSocketCtrl.instance.removeEventListener(NinjaSocketCtrl.GET_ZHEN_YAN,this.onGetZhenYanHandler);
         BufferRecordManager.setState(MainManager.actorInfo,this.bufferArr[1],true,function():void
         {
            ItemInBagAlert.show(400716,"获得" + TextFormatUtil.getRedTxt("临字真言水晶"),function():void
            {
               EventManager.dispatchEvent(new DynamicEvent(ItemAction.BUY_ONE,400716));
            });
         });
      }
      
      private function initMap480Handler2() : void
      {
         EventManager.addEventListener("Error17036",this.onError_17036);
         NinjaSocketCtrl.instance.addEventListener(NinjaSocketCtrl.GET_PET,this.onGetPetHandler);
         NinjaSocketCtrl.instance.getPet(0);
      }
      
      private function onError_17036(param1:Event) : void
      {
         var e:Event = param1;
         EventManager.removeEventListener("Error17036",this.onError_17036);
         NinjaSocketCtrl.instance.removeEventListener(NinjaSocketCtrl.GET_PET,this.onGetPetHandler);
         BufferRecordManager.setState(MainManager.actorInfo,this.bufferArr[2],true,function():void
         {
            initMap480Handler3();
            onTalkHandler3();
         });
      }
      
      private function onGetPetHandler(param1:DynamicEvent) : void
      {
         var e:DynamicEvent = null;
         e = param1;
         EventManager.removeEventListener("Error17036",this.onError_17036);
         NinjaSocketCtrl.instance.removeEventListener(NinjaSocketCtrl.GET_PET,this.onGetPetHandler);
         BufferRecordManager.setState(MainManager.actorInfo,this.bufferArr[2],true,function():void
         {
            var arr:Array = null;
            var petId:uint = 0;
            var catchTime:uint = 0;
            var name:String = null;
            var i:uint = 0;
            initMap480Handler3();
            arr = e.paramObject as Array;
            petId = uint(arr[0]);
            catchTime = uint(arr[1]);
            name = PetXMLInfo.getName(petId);
            if(PetManager.length < 6)
            {
               PetManager.storageToInBag(catchTime);
               PetInBagAlert.show(petId,name + "已经放入了你的精灵背包！",null,function():void
               {
                  onTalkHandler3();
               });
            }
            else
            {
               PetInStorageAlert.show(petId,name + "已经放入了你的精灵仓库！",null,function():void
               {
                  onTalkHandler3();
               });
            }
         });
      }
      
      private function initMap480Handler3() : void
      {
         this.kjBtn.removeEventListener(MouseEvent.CLICK,this.onClickKjHandler1);
         this.kjBtn.addEventListener(MouseEvent.CLICK,this.onClickKjHandler2);
      }
      
      private function onTalkHandler3() : void
      {
         var i:uint = 0;
         i = 0;
         if(this.isExt)
         {
            NinjaSpNoNoController_2.start();
            return;
         }
         this.initMap480Handler7();
         i = 13;
         NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
         {
            i = 14;
            NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
            {
               initMap480Handler4();
            },function():void
            {
               onTalkHandlerOther();
            }]);
         }]);
      }
      
      private function initMap480Handler4() : void
      {
         var _loc1_:MovieClip = null;
         _loc1_ = Boolean(this.mcLoader) && Boolean(this.mcLoader.loader) ? this.mcLoader.loader.content as MovieClip : null;
         if(Boolean(_loc1_ && MapManager.currentMap) && Boolean(MapManager.currentMap.topLevel) && _loc1_.parent != MapManager.currentMap.topLevel)
         {
            MapManager.currentMap.topLevel.addChild(_loc1_);
         }
         this.initMap503Handler(MapManager.currentMap);
      }
      
      private function onMapSwitchCompleteHandler(param1:MapEvent) : void
      {
         var _loc2_:MovieClip = this.mcLoader.loader.content as MovieClip;
         if(Boolean(_loc2_))
         {
            MapManager.currentMap.topLevel.addChild(_loc2_);
         }
         if(param1.mapModel.id == 10041)
         {
            MapManager.removeEventListener(MapEvent.MAP_SWITCH_COMPLETE,this.onMapSwitchCompleteHandler);
            this.initMap503Handler(MapManager.currentMap);
         }
      }
      
      private function initMap503Handler(param1:MapModel) : void
      {
         var map:MapModel = param1;
         var i:uint = 15;
         NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],null,null,false,function():void
         {
            onFightSuccess();
         });
      }
      
      private function onFightComplete(param1:PetFightEvent) : void
      {
         var _loc2_:FightOverInfo = null;
         FightDispatcher.removeEventListener(PetFightEvent.FIGHT_RESULT,this.onFightComplete);
         _loc2_ = param1.dataObj as FightOverInfo;
         if(_loc2_ != null && _loc2_.winnerID == MainManager.actorID)
         {
            this.onFightSuccess();
         }
      }
      
      private function onFightSuccess() : void
      {
         var i:uint = 16;
         NpcDialog.show(NPC.NINJA_PET_B,NinjaTalks.dA[i],null,null,false,function():void
         {
            MapManager.removeEventListener(MapEvent.MAP_SWITCH_COMPLETE,onMapSwitchCompleteHandler1);
            NinjaSocketCtrl.instance.removeEventListener(NinjaSocketCtrl.GET_PET,onGetPetHandler1);
            NinjaSocketCtrl.instance.addEventListener(NinjaSocketCtrl.GET_PET,onGetPetHandler1);
            NinjaSocketCtrl.instance.getPet(1);
         });
      }
      
      private function onMapSwitchCompleteHandler1(param1:MapEvent) : void
      {
         if(param1.mapModel.id == 480)
         {
            MapManager.removeEventListener(MapEvent.MAP_SWITCH_COMPLETE,this.onMapSwitchCompleteHandler1);
            NinjaSocketCtrl.instance.addEventListener(NinjaSocketCtrl.GET_PET,this.onGetPetHandler1);
            NinjaSocketCtrl.instance.getPet(1);
         }
      }
      
      private function onGetPetHandler1(param1:DynamicEvent) : void
      {
         var e:DynamicEvent = null;
         e = param1;
         BufferRecordManager.setState(MainManager.actorInfo,this.bufferArr[3],true,function():void
         {
            var i:uint = 17;
            NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],null,null,false,function():void
            {
               var arr:Array = null;
               var petId:uint = 0;
               var catchTime:uint = 0;
               var name:String = null;
               isHasPetB = true;
               arr = e.paramObject as Array;
               petId = uint(arr[0]);
               catchTime = uint(arr[1]);
               name = PetXMLInfo.getName(petId);
               if(PetManager.length < 6)
               {
                  PetManager.storageToInBag(catchTime);
                  PetInBagAlert.show(petId,name + "已经放入了你的精灵背包！",null,function():void
                  {
                     onTalkHandlerOther();
                  });
               }
               else
               {
                  PetInStorageAlert.show(petId,name + "已经放入了你的精灵仓库！",null,function():void
                  {
                     onTalkHandlerOther();
                  });
               }
            });
         });
      }
      
      private function onTalkHandlerOther() : void
      {
         var i:uint = 0;
         i = 0;
         i = 18;
         NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
         {
            i = 19;
            NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],null,null,false,function():void
            {
               i = 20;
               NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
               {
                  initMap480Handler5();
               }]);
            });
         }]);
      }
      
      private function initMap480Handler5() : void
      {
         var bool:Boolean = Boolean(BufferRecordManager.getState(MainManager.actorInfo,this.bufferArr[4]));
         if(bool)
         {
            this.initMap480Handler6();
         }
         else
         {
            BufferRecordManager.setState(MainManager.actorInfo,this.bufferArr[4],true,function():void
            {
               initMap480Handler6();
            });
         }
      }
      
      private function initMap480Handler6() : void
      {
         this.arrowMc.visible = true;
      }
      
      private function initMap480Handler7() : void
      {
         this.zhenYaniBtn.addEventListener(MouseEvent.CLICK,this.onClickZhenYanHandler);
         this.shaPanBtn.addEventListener(MouseEvent.CLICK,this.onClickShaPanHandler);
         this.kjBtn.removeEventListener(MouseEvent.CLICK,this.onClickKjHandler2);
         this.kjBtn.addEventListener(MouseEvent.CLICK,this.onClickKjHandler3);
      }
      
      private function onClickShaPanHandler(param1:MouseEvent) : void
      {
         ModuleManager.showModule(ClientConfig.getAppModule("NinjaSpNonoPanel"),"正在打开");
      }
      
      private function onClickKjHandler3(param1:MouseEvent) : void
      {
         var i:int = 0;
         i = 0;
         var e:MouseEvent = param1;
         i = 21;
         this.isHasPetB = BufferRecordManager.getState(MainManager.actorInfo,this.bufferArr[3]);
         if(this.isHasPetB)
         {
            NinjaTalks.qA[i] = ["学习忍者精灵特技","怎么获得忍魂套装","没什么事，我就看看这装备而已"];
         }
         else
         {
            NinjaTalks.qA[i] = ["学习忍者精灵特技","怎么获得忍魂套装","没什么事，我就看看这装备而已","我要去救迦勒"];
         }
         NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
         {
            initMap480Handler8();
         },function():void
         {
            i = 28;
            NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
            {
               ModuleManager.showModule(ClientConfig.getAppModule("NinjaSpGoBossPanel"),"正在打开");
            }]);
         },function():void
         {
         },function():void
         {
            i = 29;
            NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
            {
               initMap480Handler9();
            }]);
         }]);
      }
      
      private function initMap480Handler8() : void
      {
         var i:int = 0;
         i = 0;
         var indexOfPetId:Number = NaN;
         var mbfArr:Array = null;
         var petId:uint = 0;
         var petName:String = null;
         var skillName:String = null;
         if(!MainManager.actorModel.pet)
         {
            i = 22;
            NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
            {
            }]);
         }
         else
         {
            indexOfPetId = Number(this.petIdArr.indexOf(MainManager.actorModel.pet.info.petID));
            if(indexOfPetId == -1)
            {
               i = 22;
               NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
               {
               }]);
               return;
            }
            mbfArr = new Array();
            mbfArr[0] = false;
            mbfArr[1] = false;
            if(indexOfPetId == 0 || indexOfPetId == 1)
            {
               if(Boolean(mbfArr[0]))
               {
                  i = 31;
                  NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
                  {
                  }]);
                  return;
               }
            }
            else if(indexOfPetId == 2 || indexOfPetId == 3)
            {
               if(Boolean(mbfArr[1]))
               {
                  i = 31;
                  NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
                  {
                  }]);
                  return;
               }
            }
            i = 23;
            petId = uint(MainManager.actorModel.pet.info.petID);
            petName = PetXMLInfo.getName(petId);
            if(this.petIdArr.indexOf(petId) < 2)
            {
               skillName = SkillXMLInfo.getName(NinjaSpNoNoController.instance.skillIdArr[0]);
            }
            else
            {
               skillName = SkillXMLInfo.getName(NinjaSpNoNoController.instance.skillIdArr[1]);
            }
            NinjaTalks.dA[i] = [petName + "能够学习的特技：" + skillName + "。 条件是，必须达到60级，并且有超能NONO的力量辅助。是否现在学习?"];
            NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
            {
               if(!MainManager.actorModel.nono)
               {
                  i = 24;
                  NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],NinjaTalks.qA[i],[function():void
                  {
                  }]);
                  return;
               }
               if(Boolean(PetManager.showInfo))
               {
                  if(PetManager.showInfo.level < 60)
                  {
                     i = 25;
                     NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],null,null,false,function():void
                     {
                     });
                     return;
                  }
               }
               i = 26;
               NpcDialog.show(NPC.NINJA_NPC,NinjaTalks.dA[i],null,null,false,function():void
               {
                  NinjaSocketCtrl.instance.addEventListener(NinjaSocketCtrl.GET_NINJA_SKILL,onGetNinjaSkillHandler);
                  NinjaSocketCtrl.instance.getNinjaSkill();
               });
            }]);
         }
      }
      
      private function onGetNinjaSkillHandler(param1:DynamicEvent) : void
      {
         var petid:uint = 0;
         var mbfArr:Array = null;
         var indexOf:uint = 0;
         var e:DynamicEvent = param1;
         NinjaSocketCtrl.instance.removeEventListener(NinjaSocketCtrl.GET_NINJA_SKILL,this.onGetNinjaSkillHandler);
         petid = e.paramObject as uint;
         mbfArr = new Array();
         mbfArr[0] = BufferRecordManager.getState(MainManager.actorInfo,this.bufferArr[6]);
         mbfArr[1] = BufferRecordManager.getState(MainManager.actorInfo,this.bufferArr[7]);
         if(this.petIdArr.indexOf(petid) != -1)
         {
            indexOf = uint(this.petIdArr.indexOf(petid));
            if(indexOf == 0 || indexOf == 1)
            {
               if(!mbfArr[0])
               {
                  AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("NinjaAni02"),function():void
                  {
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("NinjaGetPetA"),function():void
                     {
                     });
                  });
                  BufferRecordManager.setState(MainManager.actorInfo,this.bufferArr[6],true);
                  return;
               }
            }
            else if(indexOf == 2 || indexOf == 3)
            {
               if(!mbfArr[1])
               {
                  AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("NinjaAni02"),function():void
                  {
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("NinjaGetPetB"),function():void
                     {
                     });
                  });
                  BufferRecordManager.setState(MainManager.actorInfo,this.bufferArr[7],true);
                  return;
               }
            }
         }
      }
      
      private function initMap480Handler9() : void
      {
         this.initMap480Handler4();
      }
      
      private function maskBreakHandler() : void
      {
         BufferRecordManager.setState(MainManager.actorInfo,this.bufferArr[1],true);
      }
      
      private function clearAllBuff() : void
      {
         BufferRecordManager.setState(MainManager.actorInfo,this.bufferArr[0],false,function():void
         {
            BufferRecordManager.setState(MainManager.actorInfo,bufferArr[1],false,function():void
            {
               BufferRecordManager.setState(MainManager.actorInfo,bufferArr[2],false,function():void
               {
                  BufferRecordManager.setState(MainManager.actorInfo,bufferArr[3],false,function():void
                  {
                     BufferRecordManager.setState(MainManager.actorInfo,bufferArr[4],false,function():void
                     {
                        BufferRecordManager.setState(MainManager.actorInfo,bufferArr[5],false,function():void
                        {
                           BufferRecordManager.setState(MainManager.actorInfo,bufferArr[6],false,function():void
                           {
                              BufferRecordManager.setState(MainManager.actorInfo,bufferArr[7],false,function():void
                              {
                                 SocketConnection.addCmdListener(9050,onCleanCompHandler);
                                 SocketConnection.send(9050,0);
                              });
                           });
                        });
                     });
                  });
               });
            });
         });
      }
      
      private function clearToGetPet() : void
      {
         SocketConnection.addCmdListener(9050,this.onCleanCompHandler2);
         SocketConnection.send(9050,511);
      }
      
      private function onCleanCompHandler(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(9050,this.onCleanCompHandler);
         Alarm.show("本案所有buff清除完毕");
      }
      
      private function onCleanCompHandler2(param1:SocketEvent) : void
      {
         SocketConnection.removeCmdListener(9050,this.onCleanCompHandler2);
         Alarm.show("现在可以领取套件");
      }
      
      public function destory() : void
      {
         EventManager.removeEventListener("close_Zhen_Yan_Panel",this.onCloseZhenYanPanel);
         EventManager.removeEventListener("close_pet_jump",this.onClosePetJumpHandler);
         ModuleManager.remove(ClientConfig.getAppModule("NinjaReelPanel"));
         ModuleManager.remove(ClientConfig.getAppModule("NinjaSpGoBossPanel"));
         ModuleManager.remove(ClientConfig.getAppModule("NinjaSpNonoPanel"));
         ToolBarController.showOrHideAllUser(true);
         NinjaSocketCtrl.instance.destory();
         this.isFeiBiaoAble = false;
         Mouse.show();
      }
   }
}

