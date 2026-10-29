package com.robot.groupFight.control
{
   import com.robot.core.CommandID;
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.group.fightInfo.fighting.dieSprite.SpriteDieInfo;
   import com.robot.core.group.fightInfo.fighting.dieSprite.SpriteDieListInfo;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.SimpleAlarm;
   import com.robot.groupFight.data.FighterModelFactory;
   import com.robot.groupFight.data.FighterPetInfoFactory;
   import com.robot.groupFight.manager.TimerManager;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   import com.robot.groupFight.mode.PlayerGroupFighterModel;
   import com.robot.groupFight.view.BaseFighterPetWin;
   import com.robot.groupFight.view.PlayerFighterPetWin;
   import flash.display.Bitmap;
   import flash.display.MovieClip;
   import flash.display.Sprite;
   import flash.geom.Point;
   import gs.TweenLite;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.EventManager;
   import org.taomee.utils.DisplayUtil;
   
   public class SpriteDieController
   {
      
      public static var diedSpriteList:Array = [];
      
      public static var offLineSpriteList:Array = [];
      private static var flying:Array = [];
      
      public function SpriteDieController()
      {
         super();
      }
      
      public static function setup() : void
      {
         SocketConnection.addCmdListener(CommandID.GROUP_FT_SPRITE_DIE,onSpriteDie);
      }
      
      public static function destroy() : void
      {
         SocketConnection.removeCmdListener(CommandID.GROUP_FT_SPRITE_DIE,onSpriteDie);
         for each(var container:Sprite in flying)
         {
            TweenLite.killTweensOf(container);
            DisplayUtil.removeAllChild(container);
            DisplayUtil.removeForParent(container);
         }
         flying = [];
         offLineSpriteList = [];
         diedSpriteList = [];
      }
      
      private static function onSpriteDie(evt:SocketEvent) : void
      {
         var info:SpriteDieInfo = null;
         var m:BaseGroupFighterModel = null;
         var infoList:SpriteDieListInfo = evt.data as SpriteDieListInfo;
         for each(info in infoList.list)
         {
            if(info.evt == 1)
            {
               diedSpriteList.push(info);
            }
            if(info.evt == 2)
            {
               m = FighterModelFactory.fighterModelMap.getValue(info.side + "_" + info.pos);
               if(Boolean(m))
               {
                  SimpleAlarm.show("<font color=\'#ff0000\'>" + m.info.userID + "</font>掉线了!");
                  trace("玩家【" + m.info.userID + "】掉线");
                  offLineSpriteList.push(m);
               }
            }
         }
      }
      
      public static function dealWithDiePet() : void
      {
         var info:SpriteDieInfo = null;
         var side:uint = 0;
         var pos:uint = 0;
         var model:BaseGroupFighterModel = null;
         var win:BaseFighterPetWin = null;
         var petMC:MovieClip = null;
         var bitmap:Bitmap = null;
         var container:Sprite = null;
         var p:Point = null;
         var m:PlayerGroupFighterModel = null;
         var pInfo:PetInfo = null;
         var mc:Sprite = null;
         var bm:BaseGroupFighterModel = null;
         while(diedSpriteList.length > 0)
         {
            info = diedSpriteList.shift();
            side = uint(info.side);
            pos = uint(info.pos);
            model = FighterModelFactory.fighterModelMap.getValue(side + "_" + pos);
            if(model != null)
            {
               win = model.petWin;
               petMC = win.petMC;
               if(petMC != null)
               {
                  bitmap = DisplayUtil.copyDisplayAsBmp(petMC);
                  container = new Sprite();
                  flying.push(container);
                  DisplayUtil.removeForParent(model.petWin.petMC);
                  container.addChild(bitmap);
                  bitmap.scaleX = 1.5;
                  bitmap.scaleY = 1.5;
                  bitmap.x = -bitmap.width / 2;
                  bitmap.y = -bitmap.height / 2;
                  container.x = win.x;
                  container.y = win.y;
                  LevelManager.fightLevel.addChild(container);
                  if(model is PlayerGroupFighterModel)
                  {
                     m = model as PlayerGroupFighterModel;
                     pInfo = FighterPetInfoFactory.gfUserInfo.monInfoMap.getValue(m.info.catchTime);
                     pInfo.hp = 0;
                     if(info.datad == 0)
                     {
                        m.subject.closePanel();
                        m.ctlPanel.removeEvent();
                        TimerManager.eacapeWait();
                     }
                     else if(info.datad == 1)
                     {
                        m.ctlPanel.showPet(true);
                        trace("正在开始自动换宠...");
                     }
                     mc = (m.petWin as PlayerFighterPetWin).footCclMC;
                     DisplayUtil.removeForParent(mc);
                     mc = null;
                  }
                  model.petWin.removeAllEffect();
                  model.petWin.removeWaitClock();
                  FighterModelFactory.removePetWin(model.petWin);
                  if(model.info.isMember)
                  {
                     p = new Point(950,100);
                     TweenLite.to(container,0.3,{
                        "x":p.x,
                        "y":p.y,
                        "rotation":360,
                        "onComplete":flyRight,
                        "onCompleteParams":[container]
                     });
                  }
                  else
                  {
                     p = new Point(10,460);
                     TweenLite.to(container,0.3,{
                        "x":p.x,
                        "y":p.y,
                        "rotation":360,
                        "onComplete":flyLeft,
                        "onCompleteParams":[container]
                     });
                  }
               }
            }
         }
         while(offLineSpriteList.length > 0)
         {
            bm = offLineSpriteList.shift();
            FighterModelFactory.removePetWin(bm.petWin);
            FighterModelFactory.removeModel(bm.info.side + "_" + bm.info.pos);
            bm.destroy();
         }
      }
      
      private static function flyRight(container:Sprite) : void
      {
         var p:Point = new Point(480,10);
         TweenLite.to(container,0.3,{
            "x":p.x,
            "y":p.y,
            "rotation":360,
            "onComplete":flyRightEnd,
            "onCompleteParams":[container]
         });
      }
      
      private static function flyRightEnd(container:Sprite) : void
      {
         var p:Point = new Point(-10,280);
         TweenLite.to(container,0.3,{
            "x":p.x,
            "y":p.y,
            "rotation":360,
            "onComplete":flyEnd,
            "onCompleteParams":[container]
         });
      }
      
      private static function flyLeft(container:Sprite) : void
      {
         var p:Point = new Point(480,550);
         TweenLite.to(container,0.3,{
            "x":p.x,
            "y":p.y,
            "rotation":360,
            "onComplete":flyLeftEnd,
            "onCompleteParams":[container]
         });
      }
      
      private static function flyLeftEnd(container:Sprite) : void
      {
         var p:Point = new Point(970,280);
         TweenLite.to(container,0.3,{
            "x":p.x,
            "y":p.y,
            "rotation":360,
            "onComplete":flyEnd,
            "onCompleteParams":[container]
         });
      }
      
      private static function flyEnd(container:Sprite) : void
      {
         var index:int = flying.indexOf(container);
         if(index != -1) flying.splice(index,1);
         DisplayUtil.removeAllChild(container);
         DisplayUtil.removeForParent(container);
         container = null;
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.DIE_SPRITE_FLYEND));
      }
   }
}

