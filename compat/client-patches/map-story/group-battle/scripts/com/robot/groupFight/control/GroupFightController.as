package com.robot.groupFight.control
{
   import com.robot.app.group.FightMapBlockBg;
   import com.robot.core.CommandID;
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.group.fightInfo.fightOver.GroupFightOverInfo;
   import com.robot.core.group.fightInfo.fighting.GpFtRelateNoticeInfo;
   import com.robot.core.group.fightInfo.fighting.GroupChgPetInfo;
   import com.robot.core.group.fightInfo.fighting.item.GroupUseItemInfo;
   import com.robot.core.group.fightInfo.startFight.GroupFightPetInfo;
   import com.robot.core.group.fightInfo.startFight.GroupFightStartInfo;
   import com.robot.core.info.pet.PetInfo;
   import com.robot.core.info.pet.PetSkillInfo;
   import com.robot.core.manager.PetManager;
   import com.robot.groupFight.control.panel.ui.fightPanel.SkillBtnView;
   import com.robot.groupFight.manager.SkillAnimateManager;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.MapManager;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.ui.alert.SimpleAlarm;
   import com.robot.groupFight.GroupFightDLL;
   import com.robot.groupFight.control.panel.ui.petItem.petItemCon.UsePetItemController;
   import com.robot.groupFight.data.FighterModelFactory;
   import com.robot.groupFight.data.FighterPetInfoFactory;
   import com.robot.groupFight.manager.GpSkillWaiteManager;
   import com.robot.groupFight.manager.GroupChatManager;
   import com.robot.groupFight.manager.TimerManager;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   import com.robot.groupFight.mode.PlayerGroupFighterModel;
   import flash.display.Bitmap;
   import flash.display.BitmapData;
   import flash.display.Sprite;
   import flash.filters.BlurFilter;
   import flash.filters.ColorMatrixFilter;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.EventManager;
   import org.taomee.utils.DisplayUtil;
   
   public class GroupFightController
   {
      
      public static var isStartFihgt:Boolean = false;
      
      public static var hasSkill:Boolean = false;
      
      private var _mainPanel:Sprite;
      
      private var _outModelList:Array = [];
      
      public function GroupFightController()
      {
         super();
         this.createMainUI();
         this.addEvent();
      }
      
      public function destroy() : void
      {
         var model:BaseGroupFighterModel = null;
         this.removeEvent();
         SkillAnimateManager.stopAll();
         SkillMouseController.undo();
         GpSkillWaiteManager.destroy();
         FighterPetInfoFactory.clear();
         for each(model in FighterModelFactory.fighterModelMap.getValues())
         {
            if(Boolean(model))
            {
               model.destroy();
            }
         }
         FighterModelFactory.clear();
         TimerManager.destroy();
         GroupChatManager.getInstance().destroy();
         SkillPlayController.getInstance().destroy();
         if(this._mainPanel != null)
         {
            DisplayUtil.removeAllChild(this._mainPanel);
            DisplayUtil.removeForParent(this._mainPanel);
            this._mainPanel = null;
         }
         this._outModelList = [];
      }
      
      public function setup(data:GroupFightStartInfo) : void
      {
         var info:GroupFightPetInfo = null;
         FightMapBlockBg.drawBg();
         FighterPetInfoFactory.setup(data);
         SkillPlayController.getInstance().setup();
         LevelManager.fightLevel.addChild(this._mainPanel);
         GroupChatManager.getInstance().setup(this._mainPanel["msgMC"]);
         for each(info in data.groupOneList)
         {
            if(info.userID == MainManager.actorID)
            {
               this.initFightersData(data);
               return;
            }
         }
         this.initOppFightersData(data);
      }
      
      private function addEvent() : void
      {
         SocketConnection.addCmdListener(CommandID.GROUP_FT_OVER,this.onFightOver);
         SocketConnection.addCmdListener(CommandID.GROUP_FT_USE_ITEM,this.onUsePetItem);
         SocketConnection.addCmdListener(CommandID.GROUP_FT_CHG_PET,this.onChgPet);
         SocketConnection.addCmdListener(CommandID.GROUP_FT_CHG_PET_SUC,this.onChgPetSuc);
         SocketConnection.addCmdListener(CommandID.GROUP_FT_ESCAPE_SUC,this.onEscapeFight);
         SocketConnection.addCmdListener(CommandID.GROUP_FT_RELATION_NOTICE,this.onFighterRelation);
         SocketConnection.addCmdListener(CommandID.GROUP_FT_OVERTIME_NOTICE,this.onFighterOverTime);
         EventManager.addEventListener(GroupFightEvent.SKILL_ATTACK_DONE,this.onSkillAttackDone);
         SocketConnection.addCmdListener(CommandID.GET_PET_INFO,this.onPetSnapshot);
      }
      
      public function removeEvent() : void
      {
         SocketConnection.removeCmdListener(CommandID.GROUP_FT_OVER,this.onFightOver);
         SocketConnection.removeCmdListener(CommandID.GROUP_FT_USE_ITEM,this.onUsePetItem);
         SocketConnection.removeCmdListener(CommandID.GROUP_FT_CHG_PET,this.onChgPet);
         SocketConnection.removeCmdListener(CommandID.GROUP_FT_CHG_PET_SUC,this.onChgPetSuc);
         SocketConnection.removeCmdListener(CommandID.GROUP_FT_ESCAPE_SUC,this.onEscapeFight);
         SocketConnection.removeCmdListener(CommandID.GROUP_FT_RELATION_NOTICE,this.onFighterRelation);
         SocketConnection.removeCmdListener(CommandID.GROUP_FT_OVERTIME_NOTICE,this.onFighterOverTime);
         EventManager.removeEventListener(GroupFightEvent.SKILL_ATTACK_DONE,this.onSkillAttackDone);
         SocketConnection.removeCmdListener(CommandID.GET_PET_INFO,this.onPetSnapshot);
      }
      
      private function createMainUI() : void
      {
         this._mainPanel = new ui_gp_mainPanel();
         this.initBackground();
         TimerManager.setup(this._mainPanel["time_txt"]);
         GpSkillWaiteManager.setup();
      }
      
      private function initBackground() : void
      {
         DisplayUtil.removeAllChild(this._mainPanel["bgContainer"]);
         var bmpData:BitmapData = new BitmapData(MainManager.getStageWidth(),MainManager.getStageHeight());
         bmpData.draw(MapManager.currentMap.root.getChildAt(0));
         var bmp:Bitmap = new Bitmap(bmpData);
         var matrix:Array = [0.7,0.4,0.1,0,0,0.6,0.4,0.1,0,-10,0.5,0.4,0.1,0,-25,0,0,0,1,0];
         bmp.filters = [new ColorMatrixFilter(matrix),new BlurFilter(4,4,3)];
         this._mainPanel["bgContainer"].addChild(bmp);
         this._mainPanel["bgContainer"].addChild(FightMapBlockBg.drawBg());
      }
      
      private function initFightersData(data:GroupFightStartInfo) : void
      {
         this.initFighterModel(data.groupOneList,true);
         this.initFighterModel(data.groupTwoList,false);
      }
      
      private function initOppFightersData(data:GroupFightStartInfo) : void
      {
         this.initFighterModel(data.groupOneList,false);
         this.initFighterModel(data.groupTwoList,true);
      }
      
      private function initFighterModel(arr:Array, isMemb:Boolean = false) : void
      {
         var info:GroupFightPetInfo = null;
         var model:BaseGroupFighterModel = null;
         var key:String = null;
         for each(info in arr)
         {
            info.isMember = isMemb;
            if(info.userID == MainManager.actorID)
            {
               model = new PlayerGroupFighterModel(info,this._mainPanel);
            }
            else
            {
               model = new BaseGroupFighterModel(info,this._mainPanel);
            }
            key = info.side + "_" + info.pos;
            FighterModelFactory.addModel(key,model);
            FighterModelFactory.allPetWinList.push(model.petWin);
            if(isMemb)
            {
               FighterModelFactory.membPetWinList.push(model.petWin);
            }
            else
            {
               FighterModelFactory.oppPetWinList.push(model.petWin);
            }
            if(info.errorType == 1)
            {
               if(model is PlayerGroupFighterModel)
               {
                  EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.LOAD_ASSETS_TIME_OUT));
               }
               if(Boolean(model))
               {
                  model.petWin.destroy();
                  FighterModelFactory.removePetWin(model.petWin);
               }
            }
         }
      }
      
      private function onFightOver(evt:SocketEvent) : void
      {
         var gData:GroupFightOverInfo = evt.data as GroupFightOverInfo;
         if(isStartFihgt)
         {
            EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.FIGHT_OVER,gData));
         }
         else
         {
            EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.FIGHT_CLOSE,{"data":gData}));
         }
      }
      
      private function onChgPet(evt:SocketEvent) : void
      {
         var by:ByteArray = evt.data as ByteArray;
         var b:uint = by.readUnsignedByte();
         if(b == 0)
         {
            hasSkill = true;
         }
         else
         {
            hasSkill = false;
         }
      }
      
      private function onChgPetSuc(evt:SocketEvent) : void
      {
         var m:PlayerGroupFighterModel = null;
         var chgPetInfo:GroupChgPetInfo = evt.data as GroupChgPetInfo;
         var gpPetInfo:GroupFightPetInfo = FighterPetInfoFactory.fighterMap.getValue(chgPetInfo.userID);
         var model:BaseGroupFighterModel = FighterModelFactory.fighterModelMap.getValue(gpPetInfo.side + "_" + gpPetInfo.pos);
         model.info.petID = chgPetInfo.petID;
         model.info.level = chgPetInfo.level;
         model.info.hp = chgPetInfo.hp;
         model.info.maxHP = chgPetInfo.maxHp;
         model.info.catchTime = chgPetInfo.catchTime;
         model.petWin.update(model.info);
         model.bloodWin.update(model.info);
         trace("换精灵成功====" + chgPetInfo.catchTime);
         FighterModelFactory.addPetWin(model.petWin,model.info.isMember);
         if(model is PlayerGroupFighterModel)
         {
            FighterPetInfoFactory.playerFtPetInfo = model.info;
            m = model as PlayerGroupFighterModel;
            m.ctlPanel.showFight();
            if(!hasSkill)
            {
               TimerManager.wait();
               m.subject.closePanel();
            }
         }
      }
      
      private function onEscapeFight(evt:SocketEvent) : void
      {
         var by:ByteArray = evt.data as ByteArray;
         this.onByData(by,0);
      }
      
      private function onFighterOverTime(evt:SocketEvent) : void
      {
         var by:ByteArray = evt.data as ByteArray;
         this.onByData(by,1);
      }
      
      private function onByData(by:ByteArray, evtType:uint) : void
      {
         var m:PlayerGroupFighterModel = null;
         var s:Sprite = null;
         var userID:uint = by.readUnsignedInt();
         var nick:String = by.readUTFBytes(16);
         var side:uint = by.readUnsignedByte();
         var pos:uint = by.readUnsignedByte();
         if(GroupFightDLL.isLoadComplete == false)
         {
            EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.LOAD_ASSETS_TIME_OUT));
            return;
         }
         var model:BaseGroupFighterModel = FighterModelFactory.fighterModelMap.getValue(side + "_" + pos);
         if(Boolean(model))
         {
            this._outModelList.push(model);
         }
         if(model is PlayerGroupFighterModel)
         {
            m = model as PlayerGroupFighterModel;
            m.subject.closePanel();
            m.ctlPanel.removeEvent();
            TimerManager.eacapeWait();
            if(evtType == 1)
            {
               SimpleAlarm.show("你在对战中超时了，退出了对战，请耐心等待对战结束!!!");
            }
         }
         else
         {
            switch(evtType)
            {
               case 0:
                  SimpleAlarm.show("你的队友<font color=\'#ff0000\'>" + nick + "</font>在对战中逃跑了!!!");
                  break;
               case 1:
                  SimpleAlarm.show("你的队友<font color=\'#ff0000\'>" + nick + "</font>因在对战中超时，退出了对战!!!");
            }
         }
      }
      
      private function onFighterRelation(evt:SocketEvent) : void
      {
         var model:BaseGroupFighterModel = null;
         var relationID:uint = 0;
         var pos:uint = 0;
         var m:BaseGroupFighterModel = null;
         var rInfo:GpFtRelateNoticeInfo = evt.data as GpFtRelateNoticeInfo;
         for each(model in FighterModelFactory.fighterModelMap.getValues())
         {
            if(Boolean(model) && Boolean(model.info))
            {
               if(model.info.side == rInfo.side)
               {
                  model.petWin.removeRelateEffect();
               }
            }
         }
         for each(relationID in rInfo.relationMap.getKeys())
         {
            for each(pos in rInfo.relationMap.getValue(relationID))
            {
               m = FighterModelFactory.fighterModelMap.getValue(rInfo.side + "_" + pos);
               m.petWin.showRelateEffect(relationID);
            }
         }
      }
      
      private function onSkillAttackDone(evt:GroupFightEvent) : void
      {
         var model:BaseGroupFighterModel = null;
         while(this._outModelList.length > 0)
         {
            model = this._outModelList.shift();
            FighterModelFactory.removePetWin(model.petWin);
            FighterModelFactory.removeModel(model.info.side + "_" + model.info.pos);
            model.destroy();
         }
      }
      
      private function onUsePetItem(evt:SocketEvent) : void
      {
         var info:GroupUseItemInfo = evt.data as GroupUseItemInfo;
         var gpPetInfo:GroupFightPetInfo = FighterPetInfoFactory.fighterMap.getValue(info.userID);
         var model:BaseGroupFighterModel = FighterModelFactory.fighterModelMap.getValue(info.side + "_" + info.pos);
         UsePetItemController.useItem(model,info);
      }

      private function onPetSnapshot(event:SocketEvent) : void
      {
         var pet:PetInfo = event.data as PetInfo;
         if(pet == null || !PetManager.containsBagForCapTime(pet.catchTime) || FighterPetInfoFactory.gfUserInfo == null) return;
         PetManager.updateBagPet(pet);
         FighterPetInfoFactory.gfUserInfo.monInfoMap.add(pet.catchTime,pet);
         var player:PlayerGroupFighterModel = FighterModelFactory.playerMode;
         if(player == null || player.ctlPanel == null || player.info.catchTime != pet.catchTime) return;
         for each(var skill:PetSkillInfo in pet.skillArray)
         {
            for each(var button:SkillBtnView in player.skillBtnViews)
            {
               if(button.skillID == skill.id) button.changePP(skill.pp,false);
            }
         }
      }
      
      public function get mainPanel() : Sprite
      {
         return this._mainPanel;
      }
   }
}

