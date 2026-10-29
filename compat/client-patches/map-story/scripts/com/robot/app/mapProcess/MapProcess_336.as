package com.robot.app.mapProcess
{
   import com.robot.app.task.control.TaskController_131;
   import com.robot.core.animate.AnimateManager;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.group.manager.GroupManager;
   import com.robot.core.info.pet.PetListInfo;
   import com.robot.core.manager.MapManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.manager.TasksManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.mode.AppModel;
   import com.robot.core.npc.NPC;
   import com.robot.core.npc.NpcDialog;
   import flash.events.Event;
   
   public class MapProcess_336 extends BaseMapProcess
   {
      
      private var talkNpc:Boolean;
      
      private var fightBoss:Boolean;
      
      private var _taskModle:AppModel;
      private var active:Boolean;
      
      public function MapProcess_336()
      {
         super();
      }
      
      private function initTask131() : void
      {
         if(TasksManager.getTaskStatus(TaskController_131.TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            TasksManager.getProStatusList(TaskController_131.TASK_ID,function(param1:Array):void
            {
               if(!active) return;
               if(Boolean(param1[0]) && !param1[1])
               {
                  talkNpc = true;
                  conLevel["guide_mc"].visible = true;
               }
               else
               {
                  talkNpc = false;
                  conLevel["ai_mc"].mouseEnabled = false;
                  conLevel["ai_mc"].mouseChildren = false;
               }
               if(Boolean(param1[1]) && !param1[2])
               {
                  fightBoss = true;
               }
            });
         }
      }
      
      override protected function init() : void
      {
         active = true;
         conLevel["guide_mc"].visible = false;
         this.initTask131();
      }
      
      private function showMonster() : void
      {
         if(!this._taskModle)
         {
            this._taskModle = new AppModel(ClientConfig.getTaskModule("MonsterShow"),"正在打开精灵图鉴");
            this._taskModle.setup();
         }
         this._taskModle.sharedEvents.removeEventListener("MONSTERSHOWCLOSE",this.onCloseHandler);
         this._taskModle.sharedEvents.addEventListener("MONSTERSHOWCLOSE",this.onCloseHandler);
         this._taskModle.show();
      }
      
      private function onCloseHandler(param1:Event) : void
      {
         var e:Event = param1;
         if(!active || this._taskModle == null) return;
         this._taskModle.sharedEvents.removeEventListener("MONSTERSHOWCLOSE",this.onCloseHandler);
         NpcDialog.show(NPC.LEGION,["你将要面对的是格斯星球上一种群居性精灵寄生岩，一旦遇到危险他们通常会在一起进行反击，你们可要当心了。"],["嗯！我准备好了。"],[function():void
         {
            if(!active) return;
            TasksManager.complete(TaskController_131.TASK_ID,1,function(success:Boolean):void
            {
               if(!active) return;
               if(success)
               {
                  fightBoss = true;
                  conLevel["lodging_mc"].mouseEnabled = true;
                  conLevel["lodging_mc"].mouseChildren = true;
               }
               else initTask131();
            },true);
         }]);
      }
      
      public function onAIClick() : void
      {
         if(this.talkNpc)
         {
            this.talkNpc = false;
            conLevel["guide_mc"].visible = false;
            NpcDialog.show(NPC.LEGION,["英佩恩堡垒上的训练室为来到这里的赛尔准备了最新模拟训练技术，这里收入了火星港精灵资料库中上万种精灵的数据，它们都可以做你的对手。"],["太棒了！"],[function():void
            {
               if(!active) return;
               NpcDialog.show(NPC.LEGION,["大多数的精灵数据正在重新调整中，我们还没有办法完全把所有的训练项目都上线。但准将为你准备的编队训练项目已经可以使用了。"],["那我要如何开始呢？"],[function():void
               {
                  if(!active) return;
                  NpcDialog.show(NPC.LEGION,["既然是编队训练，首先你必须和其他赛尔们组成一个队伍。你知道如何组成队伍吗？"],["我想听听看！（推荐）","我已经知道了，不用你教。"],[function():void
                  {
                     if(!active) return;
                     AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("groupguide"),function():void
                     {
                        if(active) showMonster();
                     });
                  },function():void
                  {
                     if(active) showMonster();
                  }]);
               }]);
            }]);
         }
         else
         {
            conLevel["ai_mc"].mouseEnabled = false;
            conLevel["ai_mc"].mouseChildren = false;
         }
      }
      
      public function onBossClick() : void
      {
         if(GroupManager.isInGroup)
         {
            MapManager.changeMap(337);
         }
         else
         {
            NpcDialog.show(NPC.LEGION,["你需要再找些伙伴来才能挑战这些精灵。"],["哦！我知道了！"]);
         }
      }
      
      public function onBossClick1() : void
      {
         var _loc2_:PetListInfo = null;
         var _loc1_:Boolean = false;
         if(Boolean(GroupManager.isInGroup) && Boolean(PetManager.getBagMap()))
         {
            for each(_loc2_ in PetManager.getBagMap())
            {
               if(_loc2_.id == 397 || _loc2_.id == 398 || _loc2_.id == 432)
               {
                  _loc1_ = true;
                  break;
               }
            }
            if(!_loc1_)
            {
               NpcDialog.show(NPC.LEGION,["你必须带上火星港暑假训练计划的精灵杰拉德，才能进入这里训练哦。"],["哦！我知道了！"]);
            }
            else
            {
               MapManager.changeMap(343);
            }
         }
         else
         {
            NpcDialog.show(NPC.LEGION,["你必须组成队伍才能进入这间特别训练室！"],["哦！我知道了！"]);
         }
      }
      
      override public function destroy() : void
      {
         active = false;
         if(this._taskModle != null)
         {
            this._taskModle.sharedEvents.removeEventListener("MONSTERSHOWCLOSE",this.onCloseHandler);
            this._taskModle.destroy();
            this._taskModle = null;
         }
         this.talkNpc = false;
         this.fightBoss = false;
      }
   }
}

