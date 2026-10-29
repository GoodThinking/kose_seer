package com.robot.groupFight.view
{
   import com.robot.core.animate.MCStopPlayManager;
   import com.robot.core.config.PetStatusEffectConfig;
   import com.robot.core.group.fightInfo.startFight.GroupFightPetInfo;
   import com.robot.core.info.fightInfo.PetStatusEffectInfo;
   import com.robot.core.utils.Direction;
   import com.robot.groupFight.manager.SkillAnimateManager;
   import com.robot.groupFight.manager.assetManager.PetAssetsManager;
   import com.robot.groupFight.view.interfaces.IPetRelation;
   import com.robot.groupFight.view.relation.PetRelationEffect;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.events.Event;
   import flash.filters.GlowFilter;
   import flash.geom.Point;
   import flash.utils.getQualifiedClassName;
   import gs.TweenLite;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.DisplayUtil;
   
   public class BaseFighterPetWin extends Sprite implements IFighterView
   {
      
      public static const WIN_WIDTH:uint = 40;
      
      public static const WIN_HEIGHT:uint = 55;
      
      private static const SCALE:Number = 1.3;
      
      protected var openningMovie:MovieClip;
      
      protected var filte:GlowFilter = new GlowFilter(3355443,0.9,3,3,3.1);
      
      protected var _petMC:MovieClip;
      
      protected var effectMcCter:Sprite;
      
      protected var waitClockMC:MovieClip;
      
      public var petContainer:Sprite;
      
      public var attackMC:MovieClip;
      
      public var attackedMC:MovieClip;
      
      private var _isOpened:Boolean = false;
      
      private var _info:GroupFightPetInfo;
      
      private var _dir:String;
      
      private var _own:BaseFighterPetWin;
      
      private var _relateEffect:IPetRelation;
      
      private var speed:Number = 0.5;
      
      private var phyFun:Function;
      
      private var backFun:Function;
      
      protected var effectIconClsNames:Array = [];
      
      protected var effectIcons:Array = [];
      
      public function BaseFighterPetWin(info:GroupFightPetInfo)
      {
         super();
         this._info = info;
         this.petContainer = new Sprite();
         this.addChild(this.petContainer);
         this.effectMcCter = new Sprite();
         this.addChild(this.effectMcCter);
         this.x = this._info.point.x;
         this.y = this._info.point.y;
         this._own = this;
         this.waitClockMC = new WaitClockMC();
      }
      
      public function destroy() : void
      {
         TweenLite.killTweensOf(this);
         this.phyFun = null;
         this.backFun = null;
         this.removeAllEffect();
         if(this.openningMovie != null)
         {
            this.openningMovie.removeEventListener(Event.ENTER_FRAME,this.onOpeningFrame);
            this.openningMovie.stop();
            DisplayUtil.removeForParent(this.openningMovie);
            this.openningMovie = null;
         }
         if(Boolean(this._petMC))
         {
            MCStopPlayManager.clear(this._petMC);
            DisplayUtil.removeForParent(this._petMC);
            this._petMC = null;
         }
         if(Boolean(this.petContainer))
         {
            DisplayUtil.removeForParent(this.petContainer);
            this.petContainer = null;
         }
         if(Boolean(this.effectMcCter))
         {
            DisplayUtil.removeAllChild(this.effectMcCter);
            DisplayUtil.removeForParent(this.effectMcCter);
            this.effectMcCter = null;
         }
         if(Boolean(this.waitClockMC))
         {
            DisplayUtil.removeForParent(this.waitClockMC);
            this.waitClockMC = null;
         }
         if(Boolean(this._relateEffect))
         {
            this._relateEffect.destroy();
            this._relateEffect = null;
         }
         this.attackMC = null;
         this.attackedMC = null;
         this._info = null;
      }
      
      public function get petMC() : MovieClip
      {
         return this._petMC;
      }
      
      public function get info() : GroupFightPetInfo
      {
         return this._info;
      }
      
      public function set info(i:GroupFightPetInfo) : void
      {
         this._info = i;
      }
      
      public function playAttack(fun:Function = null) : void
      {
         var skillAnimate:SkillAnimateManager;
         this._petMC.visible = false;
         this.attackMC.scaleX = SCALE;
         this.attackMC.scaleY = SCALE;
         this.petContainer.addChild(this.attackMC);
         skillAnimate = new SkillAnimateManager();
         skillAnimate.playMC(this.attackMC,function():void
         {
            DisplayUtil.removeForParent(attackMC);
            _petMC.visible = true;
            petContainer.addChild(_petMC);
            if(fun != null)
            {
               fun();
            }
         });
      }
      
      public function playAttacked(fun:Function = null) : void
      {
         var skillAnimate:SkillAnimateManager;
         this._petMC.visible = false;
         this.attackedMC.scaleX = SCALE;
         this.attackedMC.scaleY = SCALE;
         this.petContainer.addChild(this.attackedMC);
         skillAnimate = new SkillAnimateManager();
         skillAnimate.playMC(this.attackedMC,function():void
         {
            DisplayUtil.removeForParent(attackedMC);
            _petMC.visible = true;
            petContainer.addChild(_petMC);
            if(fun != null)
            {
               fun();
            }
         });
      }
      
      public function playPhyAttack(attackedP:Point, phyFunc:Function = null, backFunc:Function = null) : void
      {
         var p:Point = null;
         this.phyFun = phyFunc;
         this.backFun = backFunc;
         var dir:String = Direction.getStr(this._info.point,attackedP);
         this._petMC.gotoAndStop(dir);
         MCStopPlayManager.playChildMC(this._petMC);
         this.petContainer.addChild(this._petMC);
         var dis:Number = 20;
         if(!this._info.isMember)
         {
            p = new Point(attackedP.x - dis,attackedP.y - dis);
         }
         else
         {
            p = new Point(attackedP.x + dis,attackedP.y + dis);
         }
         TweenLite.to(this._own,this.speed,{
            "x":p.x,
            "y":p.y,
            "onComplete":this.onTweenComplete
         });
      }
      
      private function onTweenComplete() : void
      {
         this.playAttack(function():void
         {
            var dir:String = null;
            if(phyFun != null)
            {
               dir = Direction.getStr(new Point(_own.x,_own.y),_info.point);
               _petMC.gotoAndStop(dir);
               TweenLite.to(_own,speed * 2,{
                  "x":_info.point.x,
                  "y":_info.point.y,
                  "onComplete":onBackComplete
               });
               phyFun();
            }
         });
      }
      
      private function onBackComplete() : void
      {
         this._petMC.gotoAndStop(this._dir);
         MCStopPlayManager.stopChildMC(this._petMC);
         if(this.backFun != null)
         {
            this.backFun();
         }
      }
      
      public function update(info:GroupFightPetInfo) : void
      {
         this._info = info;
         var mc:MovieClip = PetAssetsManager.getInstance().getAssetsByID(info.petID);
         this._petMC = mc;
         if(info.isMember)
         {
            this._petMC.gotoAndStop("leftup");
            this.attackMC = PetAssetsManager.getInstance().getRightAttackMC(this._info.petID);
            this.attackedMC = PetAssetsManager.getInstance().getRightAttackedMC(this._info.petID);
            this._dir = "leftup";
         }
         else
         {
            this._petMC.gotoAndStop("right");
            this.attackMC = PetAssetsManager.getInstance().getLeftAttackMC(this._info.petID);
            this.attackedMC = PetAssetsManager.getInstance().getLeftAttackedMC(this._info.petID);
            this._dir = "right";
         }
         this._petMC.scaleX = SCALE;
         this._petMC.scaleY = SCALE;
         if(this._isOpened)
         {
            this.setPetMC(mc);
         }
         else if(info.isMember)
         {
            this.showOpening();
         }
         else
         {
            this.setPetMC(mc);
         }
      }
      
      protected function setPetMC(mc:MovieClip) : void
      {
         DisplayUtil.removeAllChild(this.petContainer);
         mc.filters = [this.filte];
         this.addPetMC();
      }
      
      protected function showOpening() : void
      {
         if(!this.openningMovie)
         {
            this.openningMovie = new GpOpenningMovie_mc();
         }
         this.openningMovie.scaleX = 0.7;
         this.openningMovie.scaleY = 0.7;
         this.petContainer.addChild(this.openningMovie);
         this.openningMovie.addEventListener(Event.ENTER_FRAME,this.onOpeningFrame);
      }

      private function onOpeningFrame(event:Event) : void
      {
         if(this.openningMovie.currentFrame == 55) this.addPetMC();
         else if(this.openningMovie.currentFrame == this.openningMovie.totalFrames)
         {
            this.openningMovie.removeEventListener(Event.ENTER_FRAME,this.onOpeningFrame);
            DisplayUtil.removeForParent(this.openningMovie);
            this.openningMovie = null;
         }
      }
      
      protected function addPetMC() : void
      {
         this.petContainer.addChild(this._petMC);
         this._petMC.x = 0;
         this._petMC.y = 0;
         MCStopPlayManager.stopChildMC(this._petMC);
         this._isOpened = true;
         this.addEffectIcon();
      }
      
      protected function addEffectIcon() : void
      {
         this.effectMcCter.y = -this._petMC.height / 2;
      }
      
      public function addEffect(cls:Class, info:PetStatusEffectInfo) : void
      {
         var mc:MovieClip = new cls() as MovieClip;
         var clsName:String = getQualifiedClassName(mc);
         this.effectIconClsNames.push(clsName);
         this.effectIcons.push(mc);
         this.effectMcCter.addChild(mc);
         ToolTipManager.add(mc,PetStatusEffectConfig.tip(info));
      }
      
      public function removeAllEffect() : void
      {
         var i:MovieClip = null;
         this.effectIconClsNames = [];
         for each(i in this.effectIcons)
         {
            ToolTipManager.remove(i);
            DisplayUtil.removeForParent(i);
         }
         DisplayUtil.removeAllChild(this.effectMcCter);
         this.effectIcons = [];
      }
      
      public function addWaitClock(time:uint) : void
      {
         if(!this.waitClockMC || !this._petMC)
         {
            return;
         }
         this.addChild(this.waitClockMC);
         this.waitClockMC.y = -90;
         if(time == 0)
         {
            DisplayUtil.removeForParent(this.waitClockMC,false);
         }
      }
      
      public function removeWaitClock() : void
      {
         DisplayUtil.removeForParent(this.waitClockMC,false);
      }
      
      public function showRelateEffect(id:uint) : void
      {
         if(Boolean(this._relateEffect))
         {
            this._relateEffect.destroy();
            this._relateEffect = null;
         }
         if(Boolean(this._petMC))
         {
            this._relateEffect = new PetRelationEffect(this._petMC);
            this._relateEffect.show(id);
         }
      }
      
      public function removeRelateEffect() : void
      {
         if(Boolean(this._relateEffect))
         {
            this._relateEffect.destroy();
         }
      }
   }
}

