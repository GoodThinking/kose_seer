package com.robot.app.task.petstory.util
{
   import com.robot.app.ogre.*;
   import com.robot.app.toolBar.*;
   import com.robot.core.aimat.*;
   import com.robot.core.animate.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.MapLibManager;
   import com.robot.core.mode.*;
   import flash.display.*;
   import flash.geom.*;
   import flash.utils.*;
   import org.taomee.debug.*;
   import org.taomee.effect.*;
   import org.taomee.utils.*;
   
   public class FightGang
   {
      
      private var InfoList:Array;
      
      private var OgreList:Array;
      
      private var nTime:uint;
      
      private var effectiveDistance:int;
      
      private var seerInfo:InfoNode;
      
      private var successHandler:Function;
      
      private var failedHandler:Function;
      
      private var isPlayEff:Boolean;
      
      public function FightGang(param1:int = 120, param2:int = 50, param3:int = 5)
      {
         super();
         this.InfoList = [];
         this.seerInfo = new InfoNode();
         this.seerInfo.id = 0;
         this.seerInfo.idx = 0;
         this.seerInfo.blood = param2;
         this.seerInfo.life = param2;
         this.seerInfo.attack = param3;
         this.effectiveDistance = param1;
      }
      
      public function createOgre(param1:int, param2:Point, param3:int = 10, param4:int = 5) : void
      {
         var _loc5_:InfoNode = new InfoNode();
         _loc5_.id = param1;
         _loc5_.idx = this.InfoList.length + 1;
         _loc5_.point = param2;
         _loc5_.blood = param3;
         _loc5_.life = param3;
         _loc5_.attack = param4;
         this.InfoList.push(_loc5_);
      }
      
      public function beginFight() : FightGang
      {
         var _loc2_:MovieClip = null;
         var _loc1_:OgreModel = null;
         _loc2_ = null;
         var _loc3_:InfoNode = null;
         this.OgreList = [];
         OgreController.isShow = true;
         ToolBarController.aimatOn();
         MainManager.actorModel.filters = null;
         for each(_loc3_ in this.InfoList)
         {
            _loc3_.life = _loc3_.blood;
            _loc1_ = new OgreModel(_loc3_.idx);
            _loc1_.name = "ogre" + _loc3_.idx;
            _loc1_.isPurseFlag = true;
            _loc2_ = this.getMapFightClip("bloodMc");
            _loc1_.sprite.addChild(_loc2_);
            _loc2_.x -= 30;
            _loc2_.y -= _loc1_.height + 50;
            this.setBloodClipInfo(_loc2_,_loc3_.life,_loc3_.blood);
            _loc1_.show(_loc3_.id,_loc3_.point);
            this.OgreList.push(_loc1_);
         }
         if(this.OgreList.length > 0)
         {
            this.seerInfo.life = this.seerInfo.blood;
            _loc2_ = this.getMapFightClip("bloodMc");
            _loc2_.x -= 30;
            _loc2_.y -= MainManager.actorModel.height + 10;
            MainManager.actorModel.sprite.addChild(_loc2_);
            this.setBloodClipInfo(_loc2_,this.seerInfo.life,this.seerInfo.blood);
            AimatController.addEventListener(AimatEvent.PLAY_END,this.onAimatEnd);
            this.nTime = setInterval(this.checkMonster,1000);
         }
         this.isPlayEff = false;
         return this;
      }
      
      private function getOrgeInfo(param1:OgreModel) : InfoNode
      {
         var _loc2_:InfoNode = null;
         for each(_loc2_ in this.InfoList)
         {
            if(param1.name == "ogre" + _loc2_.idx)
            {
               return _loc2_;
            }
         }
         return null;
      }
      
      private function getRotation(param1:Point, param2:Point) : Number
      {
         var _loc3_:Number = (param1.y - param2.y) / (param1.x - param2.x);
         var _loc4_:Number = Math.abs(Math.atan(_loc3_) / (Math.PI / 180));
         var _loc5_:Number = Math.abs(Math.atan(0) / (Math.PI / 180));
         var _loc6_:Number = Math.abs(_loc4_ - _loc5_);
         if(param2.y <= param1.y)
         {
            if(param2.x <= param1.x)
            {
               _loc6_ += 180;
            }
            else
            {
               _loc6_ *= -1;
            }
         }
         else if(param2.x <= param1.x)
         {
            _loc6_ = 180 - _loc6_;
         }
         return _loc6_;
      }
      
      private function setBloodClipInfo(param1:MovieClip, param2:int, param3:int) : void
      {
         var _loc4_:uint = uint(101 - uint(100 * (param2 / param3)));
         param1.name = "bloodMc";
         param1["perMc"].gotoAndStop(_loc4_);
         param1["perTxt"].text = "" + param2 + "/" + param3;
      }
      
      private function checkMonster() : void
      {
         var _loc1_:Number = NaN;
         var _loc2_:MovieClip = null;
         var _loc3_:MovieClip = null;
         var _loc4_:OgreModel = null;
         var _loc5_:OgreModel = null;
         var _loc6_:MovieClip = MainManager.actorModel.sprite.getChildByName("bloodMc") as MovieClip;
         if(Boolean(_loc6_))
         {
            for each(_loc4_ in this.OgreList)
            {
               _loc1_ = Number(Point.distance(_loc4_.pos,MainManager.actorModel.pos));
               if(_loc1_ <= this.effectiveDistance)
               {
                  if(_loc4_.sprite.getChildByName("killMc") == null)
                  {
                     _loc2_ = this.getMapFightClip("killMc");
                     _loc2_.name = "killMc";
                     _loc2_.rotation = this.getRotation(_loc4_.pos,MainManager.actorModel.pos);
                     _loc2_.y -= 40;
                     _loc4_.sprite.addChild(_loc2_);
                     if(MainManager.actorModel.sprite.getChildByName("hitsMc") == null)
                     {
                        _loc3_ = this.getMapFightClip("hitsMc");
                        _loc3_.name = "hitsMc";
                        _loc3_.y -= 10;
                        MainManager.actorModel.sprite.addChild(_loc3_);
                        this.seerInfo.life -= this.getOrgeInfo(_loc4_).attack;
                        if(this.seerInfo.life < 0)
                        {
                           this.seerInfo.life = 0;
                        }
                        this.setBloodClipInfo(_loc6_,this.seerInfo.life,this.seerInfo.blood);
                        if(this.seerInfo.life <= 0)
                        {
                           clearInterval(this.nTime);
                           this.nTime = 0;
                           DisplayUtil.removeForParent(_loc6_);
                           MainManager.actorModel.stopAutoWalk();
                           MainManager.actorModel.filters = [ColorFilter.setGrayscale()];
                           for each(_loc5_ in this.OgreList)
                           {
                              _loc5_.isPurseFlag = false;
                           }
                           DebugTrace.show("战斗失败");
                           this.stopFight();
                           if(this.failedHandler != null)
                           {
                              this.failedHandler();
                           }
                           return;
                        }
                     }
                  }
               }
            }
         }
      }
      
      private function onAimatEnd(param1:AimatEvent) : void
      {
         var _loc2_:OgreModel = null;
         DebugTrace.show("剩余对手个数：" + this.OgreList.length);
         for each(_loc2_ in this.OgreList)
         {
            if(_loc2_.hitTestPoint(param1.info.endPos.x,param1.info.endPos.y))
            {
               this.killMonster(_loc2_);
               break;
            }
         }
      }
      
      private function killMonster(param1:OgreModel) : void
      {
         var _loc2_:InfoNode = null;
         var _loc3_:OgreModel = param1;
         var _loc4_:MovieClip = _loc3_.sprite.getChildByName("bloodMc") as MovieClip;
         if(Boolean(_loc4_))
         {
            _loc2_ = this.getOrgeInfo(_loc3_);
            if(_loc2_ != null && _loc2_.life > 0)
            {
               _loc2_.life -= this.seerInfo.attack;
               if(_loc2_.life < 0)
               {
                  _loc2_.life = 0;
               }
               this.setBloodClipInfo(_loc4_,_loc2_.life,_loc2_.blood);
               if(_loc2_.life <= 0)
               {
                  this.playMonsterDefeat(_loc3_,_loc4_);
               }
            }
         }
      }
      
      private function playMonsterDefeat(param1:OgreModel, param2:MovieClip) : void
      {
         var obj:OgreModel = null;
         obj = param1;
         var bloodMc:MovieClip = param2;
         var dispMc:MovieClip = null;
         if(Boolean(this.isPlayEff) || this.OgreList.indexOf(obj) < 0)
         {
            return;
         }
         this.isPlayEff = true;
         bloodMc.visible = false;
         obj.isPurseFlag = false;
         dispMc = this.getMapFightClip("dispMc");
         obj.sprite.addChild(dispMc);
         AnimateManager.playMcAnimate(dispMc,0,"",function():void
         {
            var _loc1_:int = int(OgreList.indexOf(obj));
            if(_loc1_ >= 0)
            {
               OgreList.splice(_loc1_,1);
            }
            obj.destroy();
            isPlayEff = false;
            if(OgreList.length == 0)
            {
               DebugTrace.show("战斗胜利");
               stopFight();
               if(successHandler != null)
               {
                  successHandler();
               }
               return;
            }
            playPendingMonsterDefeat();
         },false,false);
      }
      
      private function playPendingMonsterDefeat() : void
      {
         var _loc1_:OgreModel = null;
         var _loc2_:InfoNode = null;
         var _loc3_:MovieClip = null;
         for each(_loc1_ in this.OgreList)
         {
            _loc2_ = this.getOrgeInfo(_loc1_);
            if(_loc2_ != null && _loc2_.life <= 0)
            {
               _loc3_ = _loc1_.sprite.getChildByName("bloodMc") as MovieClip;
               if(_loc3_ != null)
               {
                  this.playMonsterDefeat(_loc1_,_loc3_);
                  return;
               }
            }
         }
      }
      
      public function addResponse(param1:Function, param2:Function) : void
      {
         this.successHandler = param1;
         this.failedHandler = param2;
      }
      
      private function getMapFightClip(param1:String) : MovieClip
      {
         var _loc2_:MovieClip = null;
         if(MapManager.currentMap != null && MapLibManager.loader != null)
         {
            _loc2_ = MapLibManager.getMovieClip(param1);
         }
         if(_loc2_ == null)
         {
            throw new Error("当前地图缺少正式战斗素材: " + param1);
         }
         return _loc2_;
      }
      
      public function stopFight() : void
      {
         var _loc1_:OgreModel = null;
         AimatController.removeEventListener(AimatEvent.PLAY_END,this.onAimatEnd);
         AimatController.close();
         if(this.nTime > 0)
         {
            clearInterval(this.nTime);
            this.nTime = 0;
         }
         var _loc2_:MovieClip = MainManager.actorModel.sprite.getChildByName("bloodMc") as MovieClip;
         if(Boolean(_loc2_))
         {
            DisplayUtil.removeForParent(_loc2_);
         }
         if(Boolean(this.OgreList))
         {
            for each(_loc1_ in this.OgreList)
            {
               _loc1_.isPurseFlag = false;
               _loc1_.destroy();
            }
            this.OgreList.length = 0;
            this.OgreList = null;
         }
      }
      
      public function destroyFight() : void
      {
         this.stopFight();
         if(Boolean(this.InfoList))
         {
            this.InfoList.length = 0;
            this.InfoList = null;
         }
         if(Boolean(this.OgreList))
         {
            this.OgreList.length = 0;
            this.OgreList = null;
         }
         this.successHandler = null;
         this.failedHandler = null;
         this.seerInfo = null;
         MainManager.actorModel.filters = null;
         DebugTrace.show("战斗销毁");
      }
   }
}

import flash.geom.Point;

final class InfoNode
{
   
   public var idx:int;
   
   public var id:int;
   
   public var point:Point;
   
   public var blood:int;
   
   public var life:int;
   
   public var attack:int;
   
   public function InfoNode()
   {
      super();
   }
}
