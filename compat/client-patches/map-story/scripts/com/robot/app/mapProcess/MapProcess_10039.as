package com.robot.app.mapProcess
{
   import com.robot.app.spt.FightBossController;
   import com.robot.app.task.control.TasksController;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.event.PetFightEvent;
   import com.robot.core.info.fightInfo.attack.FightOverInfo;
   import org.taomee.manager.EventManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.BasePeoleModel;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import com.robot.core.utils.CommonUI;
   import flash.display.DisplayObject;
   import flash.display.Graphics;
   import flash.display.Sprite;
   import flash.events.MouseEvent;
   import flash.geom.Rectangle;
   import org.taomee.manager.ResourceManager;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.DisplayUtil;

   // A complete project-authored trial, not a recovered historical map.
   public class MapProcess_10039 extends BaseMapProcess
   {
      private static const TASK_ID:uint = 10039;
      private var _destroyed:Boolean;
      private var _ready:Boolean;
      private var _busy:Boolean;
      private var _progress:Array;
      private var _runes:Array = [];
      private var _guardian:Sprite;
      private var _exit:Sprite;
      private var _petURL:String;

      override protected function init() : void
      {
         for each(var layer:Sprite in [conLevel,btnLevel,animatorLevel,topLevel])
            for(var i:int = 0; i < layer.numChildren; i++) layer.getChildAt(i).visible = false;
         for(i = 0; i < depthLevel.numChildren; i++)
            if(!(depthLevel.getChildAt(i) is BasePeoleModel)) depthLevel.getChildAt(i).visible = false;
         // Reuse the current client's illustrated compass and native rotating platform.
         animatorLevel["ground_mc"].visible = true;
         animatorLevel["ground_mc"].gotoAndStop(1);
         var grid:Array = MapManager.currentMap.data;
         var size:uint = MapManager.currentMap.gridSize;
         for(var gx:int = 0; gx < MapManager.currentMap.gridX; gx++)
            for(var gy:int = 0; gy < MapManager.currentMap.gridY; gy++)
               grid[gx][gy] = Math.pow((gx*size-552)/330,2) + Math.pow((gy*size-285)/190,2) < 1;

         var points:Array = [[392,190],[552,152],[710,192]];
         for(i = 0; i < 3; i++)
         {
            var rune:Sprite = new Sprite();
            rune.name = String(i);
            rune.x = points[i][0]; rune.y = points[i][1];
            rune.buttonMode = true; rune.mouseChildren = false;
            rune.addEventListener(MouseEvent.CLICK,onRune);
            ToolTipManager.add(rune,["过去星印","现在星印","未来星印"][i] + "：按顺序校准");
            _runes.push(rune); conLevel.addChild(rune);
         }
         _guardian = new Sprite();
         _guardian.name = "compassGuardian";
         _guardian.x = 552; _guardian.y = 300;
         _guardian.graphics.beginFill(0xffffff,0.01);
         _guardian.graphics.drawEllipse(-60,-95,120,120); _guardian.graphics.endFill();
         _guardian.buttonMode = true; _guardian.mouseChildren = false;
         _guardian.addEventListener(MouseEvent.CLICK,onGuardian);
         ToolTipManager.add(_guardian,"迪符特的封印投影（85级地面系）：准备克制精灵与体力药品");
         conLevel.addChild(_guardian);
         _petURL = ClientConfig.getPetSwfPath(804);
         ResourceManager.getResource(_petURL,onGuardianLoaded,"pet");
         _exit = new Sprite(); _exit.name = "trialExit";
         _exit.x = 552; _exit.y = 410;
         _exit.graphics.beginFill(0xffffff,0.01); _exit.graphics.drawEllipse(-35,-28,70,56); _exit.graphics.endFill();
         CommonUI.addYellowArrow(_exit); _exit.buttonMode = true; _exit.mouseChildren = false;
         _exit.addEventListener(MouseEvent.CLICK,onExit);
         ToolTipManager.add(_exit,"离开试炼，返回船长室（保留进度）"); conLevel.addChild(_exit);
         EventManager.addEventListener(PetFightEvent.ALARM_CLICK,onFightReturn);
         TasksController.runAfterTrackedTaskStatus(refresh,this);
      }

      private function onGuardianLoaded(content:DisplayObject) : void
      {
         if(_destroyed) return;
         DisplayUtil.stopAllMovieClip(content);
         var bounds:Rectangle = content.getBounds(content);
         var scale:Number = Math.min(125/bounds.width,115/bounds.height);
         content.scaleX = content.scaleY = scale;
         content.x = -(bounds.x+bounds.width/2)*scale;
         content.y = -bounds.bottom*scale;
         _guardian.addChild(content);
         if(_ready) drawRunes();
      }

      private function refresh() : void
      {
         if(_destroyed) return;
         TasksManager.getProStatusList(TASK_ID,function(progress:Array):void
         {
            if(_destroyed) return;
            _progress = progress; _ready = true; _busy = false;
            drawRunes();
         });
      }

      private function drawRunes() : void
      {
         var state:uint = TasksManager.getTaskStatus(TASK_ID);
         var next:uint = 0;
         while(next < 3 && _progress[next]) next++;
         CommonUI.removeYellowExcal(_guardian);
         if(state == TasksManager.UN_ACCEPT || state == TasksManager.ALR_ACCEPT && next == 3)
            CommonUI.addYellowExcal(_guardian,20,-135);
         for(var i:int = 0; i < 3; i++)
         {
            var g:Graphics = _runes[i].graphics;
            CommonUI.removeYellowArrow(_runes[i]);
            if(state == TasksManager.ALR_ACCEPT && i == next) CommonUI.addYellowArrow(_runes[i],0,-50,180);
            var lit:Boolean = _progress[i] || TasksManager.getTaskStatus(TASK_ID) == TasksManager.COMPLETE;
            g.clear(); g.lineStyle(3,0x708a9d); g.beginFill(0x1a3046);
            g.drawEllipse(-32,-19,64,38); g.endFill();
            g.lineStyle(3,lit ? 0xafffd2 : 0x669aaa);
            g.beginFill(lit ? 0x3ca995 : 0x344d65);
            g.moveTo(0,-40); g.lineTo(17,-16); g.lineTo(0,8); g.lineTo(-17,-16); g.lineTo(0,-40); g.endFill();
         }
      }

      private function onRune(event:MouseEvent) : void
      {
         if(!_ready || _busy) return;
         if(TasksManager.getTaskStatus(TASK_ID) != TasksManager.ALR_ACCEPT)
         {
            onGuardian(null); return;
         }
         var index:uint = uint(event.currentTarget.name);
         var next:uint = 0;
         while(next < 3 && _progress[next]) next++;
         if(index != next)
         {
            NpcDialog.show(NPC.SEER,[index < next ? "这座星印已经点亮，校准结果会保留。" : "星印需要依次校准：先过去，再现在，最后未来。先寻找尚未点亮的第一座星印。"],["明白了"]);
            return;
         }
         _busy = true;
         TasksManager.complete(TASK_ID,index,function(success:Boolean):void
         {
            if(_destroyed) return;
            _busy = false;
            if(!success) return;
            _progress[index] = true; drawRunes();
            NpcDialog.show(NPC.SEER,[index == 2 ? "三座星印已经连接。封印投影苏醒了！点击中央投影，就能进行最终实战。" : "星印校准成功！继续校准下一座星印。"],["继续探索"]);
         });
      }

      private function onGuardian(event:MouseEvent) : void
      {
         if(!_ready || _busy) return;
         var state:uint = TasksManager.getTaskStatus(TASK_ID);
         if(state == TasksManager.UN_ACCEPT)
         {
            NpcDialog.show(NPC.SEER,["这是时空罗盘试炼。依次点亮过去、现在、未来三座星印，再战胜中央的封印投影。首通可领取3000赛尔豆与5000经验；中途离开也会保留校准进度。"],["开始校准","先离开"],[function():void
            {
               if(_destroyed) return;
               _busy = true;
               TasksManager.accept(TASK_ID,function(success:Boolean):void
               {
                  if(_destroyed) return;
                  _busy = false;
                  if(success) refresh();
               });
            },function():void { if(!_destroyed) MapManager.changeMap(4); }]);
            return;
         }
         if(state != TasksManager.COMPLETE && !(_progress[0] && _progress[1] && _progress[2]))
         {
            NpcDialog.show(NPC.SEER,["中央投影尚未稳定。先依次点击左侧、上方、右侧的三座星印，完成校准后再来挑战。"],["继续校准"]); return;
         }
         if(state == TasksManager.ALR_ACCEPT && _progress[3])
         {
            NpcDialog.show(NPC.SEER,["实战胜利已经记录。现在可以领取首通奖励；关闭对话或离开地图不会丢失领取资格。"],["领取首通奖励","稍后领取"],[claimReward]);
            return;
         }
         NpcDialog.show(NPC.SEER,[state == TasksManager.COMPLETE ? "首通奖励已经领取。你仍然可以再次挑战封印投影，但不会重复获得首通奖励。" : "这是85级地面系迪符特的投影。准备好克制精灵与体力药品，先强化再攻击会更稳妥。真正获胜后即可领取首通奖励。"],["挑战封印投影","再准备一下"],[function():void
         {
            if(!_destroyed) FightBossController.fightBoss("封印投影",0);
         }]);
      }

      private function onFightReturn(event:PetFightEvent) : void
      {
         if(_destroyed || TasksManager.getTaskStatus(TASK_ID) != TasksManager.ALR_ACCEPT) return;
         var result:FightOverInfo = event.dataObj as FightOverInfo;
         if(result == null || result.winnerID != MainManager.actorID) return;
         claimReward();
      }

      private function claimReward() : void
      {
         if(_destroyed || _busy) return;
         _busy = true;
         TasksManager.complete(TASK_ID,4,function(success:Boolean):void
         {
            if(_destroyed) return;
            _busy = false;
            if(success) refresh();
         });
      }

      private function onExit(event:MouseEvent) : void { MapManager.changeMap(4); }

      override public function destroy() : void
      {
         _destroyed = true;
         EventManager.removeEventListener(PetFightEvent.ALARM_CLICK,onFightReturn);
         ResourceManager.cancel(_petURL,onGuardianLoaded);
         for each(var rune:Sprite in _runes)
         {
            rune.removeEventListener(MouseEvent.CLICK,onRune); ToolTipManager.remove(rune);
         }
         _guardian.removeEventListener(MouseEvent.CLICK,onGuardian); ToolTipManager.remove(_guardian);
         _exit.removeEventListener(MouseEvent.CLICK,onExit); ToolTipManager.remove(_exit);
      }
   }
}
