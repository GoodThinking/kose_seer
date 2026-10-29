package com.robot.app.task.taskscollection
{
   import com.robot.app.fight.FightManager;
   import com.robot.core.aimat.AimatController;
   import com.robot.core.animate.AnimateManager;
   import com.robot.core.config.ClientConfig;
   import com.robot.core.config.xml.PetXMLInfo;
   import com.robot.core.event.AimatEvent;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.npc.*;
   import com.robot.core.ui.alert.ItemInBagAlert;
   import com.robot.core.utils.CommonUI;
   import flash.display.MovieClip;
   import flash.events.MouseEvent;
   import flash.geom.Point;
   import flash.utils.ByteArray;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import org.taomee.events.SocketEvent;
   import org.taomee.manager.ToolTipManager;
   import org.taomee.utils.DisplayUtil;

   public class Task1143
   {
      private static const TASK_ID:uint = 1247;
      private static const COMMAND:uint = 9067;
      private static const SLOT_NAMES:Array = ["drag","run","pk"];
      private static var _current:Task1143;
      private var _map:BaseMapProcess;
      private var _scene:StoryScene;
      private var _mapId:uint;
      private var _disposed:Boolean;
      private var _priority:Boolean;
      private var _step:uint;
      private var _shots:uint;
      private var _run:uint;
      private var _pk:uint;
      private var _pendingSlot:uint = uint.MAX_VALUE;
      private var _pet:uint;
      private var _region:uint;
      private var _busy:Boolean;
      private var _refreshAgain:Boolean;
      private var _timer:uint;

      public function Task1143(owner:BaseMapProcess)
      {
         _map = owner;
         _mapId = MapManager.currentMap.id;
         _scene = new StoryScene(owner);
         if(TasksManager.getTaskStatus(811) == TasksManager.ALR_ACCEPT)
            TasksManager.getProStatusList(811,onFoxProgress);
         else begin();
      }

      public static function initFor684(owner:BaseMapProcess) : void { init(owner); }
      public static function initFor687(owner:BaseMapProcess) : void { init(owner); }
      private static function init(owner:BaseMapProcess) : void
      {
         if(_current && _current._map === owner) return;
         if(_current) _current.dispose();
         _current = new Task1143(owner);
      }
      public static function destroy(owner:BaseMapProcess) : void
      {
         if(_current && _current._map === owner)
         {
            _current.dispose();
            _current = null;
         }
      }
      public static function showPoster(owner:BaseMapProcess) : void
      {
         if(_current && _current._map === owner) _current.showHelp();
      }
      private function get active() : Boolean { return !_disposed && _scene.active; }

      private function onFoxProgress(progress:Array) : void
      {
         if(!active) return;
         _priority = _mapId == 687 ? progress[0] && progress[1] && !progress[2] : progress[0] && progress[1] && progress[2] && !progress[3];
         if(!_priority) begin();
      }
      private function begin() : void
      {
         if(!active) return;
         if(_mapId == 684)
         {
            if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.UN_ACCEPT) showBubble();
            else if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT) TasksManager.getProStatusList(TASK_ID,onLakeProgress);
         }
         else if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.COMPLETE) startRescue();
         else if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT) TasksManager.getProStatusList(TASK_ID,onTempleProgress);
         else showKing();
      }
      private function onLakeProgress(progress:Array) : void
      {
         if(!active) return;
         if(!progress[0]) showBubble();
         else CommonUI.addYellowArrow(_map.conLevel["vortex"],0,0,300);
      }
      private function onTempleProgress(progress:Array) : void
      {
         if(!active) return;
         if(progress[0] && !progress[1]) startTempleIntro();
         else showKing();
      }
      private function showBubble() : void
      {
         var bubble:MovieClip = _map.conLevel["bubble"];
         bubble.visible = true;
         bubble.gotoAndStop(1);
         bubble.buttonMode = true;
         bubble.mouseChildren = false;
         bubble.addEventListener(MouseEvent.CLICK,onBubble);
         CommonUI.addYellowExcal(bubble,450,350,1.2);
         ToolTipManager.add(bubble,"皮特萨罗的求救：点击帮助找回精灵蛋");
      }
      private function onBubble(event:MouseEvent) : void
      {
         if(!active || _busy) return;
         _busy = true;
         CommonUI.removeYellowExcal(_map.conLevel["bubble"]);
         if(_map.typeLevel.getChildByName("barrier"))
            AnimateManager.playMcAnimate(_map.conLevel["bridge"],0,"",onBridgeReady);
         else onBridgeReady();
      }
      private function onBridgeReady() : void
      {
         if(!active) return;
         _busy = false;
         DisplayUtil.removeForParent(_map.typeLevel.getChildByName("barrier"));
         MapManager.currentMap.makeMapArray();
         MainManager.actorModel.moveAndAction(new Point(440,420),onArriveBubble);
      }
      private function onArriveBubble() : void
      {
         if(!active) return;
         _busy = true;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.UN_ACCEPT) TasksManager.accept(TASK_ID,onAccepted);
         else onAccepted(true);
      }
      private function onAccepted(ok:Boolean) : void
      {
         if(!active) return;
         _busy = false;
         if(!ok) { showBubble(); return; }
         _step = 0;
         nextLake();
      }
      private function ask(npc:uint, text:String, choice:String, next:Function) : void
      {
         if(!active) return;
         NpcDialog.show(npc,[text],[choice,"稍后再说"],[next,pause]);
      }
      private function advanceLake() : void { if(active) { ++_step; nextLake(); } }
      private function nextLake() : void
      {
         if(!active) return;
         switch(_step)
         {
            case 0: ask(NPC.PITESALUO,MainManager.actorInfo.formatNick + "，你来的正好，快帮忙救救我的宝贝蛋吧！否则就会被漩涡卷入湖底了！","哇！怎么会这样啊！",advanceLake); break;
            case 1: ask(NPC.PITESALUO,"我也不知道，之前我看到一群海盗在这里鬼鬼祟祟，刚想上前阻止，他们却一下钻进了湖里~","难道是…还是先救你的宝贝蛋再说！",advanceLake); break;
            case 2: AnimateManager.playFullScreenAnimate(ClientConfig.getFullMovie("task_802_1"),onEggSaved); break;
            case 3: ask(NPC.SEER,"阿布！真是太感谢你了！幸亏你及时出现，否则我们都不知道如何是好了！","继续交谈",advanceLake); break;
            case 4: ask(NPC.ABU,"这点小事不算什么！不过湖底的海之子神殿即将大难临头了~","海之子神殿？",advanceLake); break;
            case 5: ask(NPC.ABU,"哎…说来话长，你最好还是和我下去看看吧!鱼龙王需要你的帮助！","鱼龙王，那我们马上就走！",advanceLake); break;
            case 6: AnimateManager.playMcAnimate(_map.conLevel["bubble"],3,"mc3",onBubbleFinished); break;
            case 7: ask(NPC.SEER,"看来事情相当严重啊！不知道漩涡下面究竟发生了什么，去看看再说！","立刻跳入漩涡！",finishLake); break;
         }
      }
      private function onEggSaved() : void
      {
         if(!active) return;
         _scene.hideActors();
         _map.conLevel["bubble"].gotoAndStop(2);
         _step = 3;
         nextLake();
      }
      private function onBubbleFinished() : void { if(active) { _step = 7; nextLake(); } }
      private function finishLake() : void
      {
         if(!active) return;
         _scene.releaseState();
         _map.conLevel["bubble"].visible = false;
         TasksManager.complete(TASK_ID,0,onLakeSaved);
      }
      private function onLakeSaved(ok:Boolean) : void
      {
         if(!active) return;
         if(ok) CommonUI.addYellowArrow(_map.conLevel["vortex"],0,0,300);
         else showBubble();
      }
      private function showKing() : void
      {
         var king:MovieClip = _map.conLevel["activity"];
         king.visible = true;
         king.gotoAndStop(3);
         king.buttonMode = true;
         king.mouseChildren = false;
         king.addEventListener(MouseEvent.CLICK,onKing);
         CommonUI.addYellowExcal(king,486,85,1.2);
         ToolTipManager.add(king,"鱼龙王：海之子神殿救援指引");
      }
      private function onKing(event:MouseEvent) : void
      {
         if(!active) return;
         if(TasksManager.getTaskStatus(TASK_ID) == TasksManager.ALR_ACCEPT)
         {
            if(_step == 4) { _step = 5; nextTemple(); }
            else TasksManager.getProStatusList(TASK_ID,onTempleProgress);
         }
         else showHelp();
      }
      private function startTempleIntro() : void
      {
         if(!active) return;
         _step = 0;
         _map.conLevel["activity"].visible = true;
         AnimateManager.playMcAnimate(_map.conLevel["activity"],1,"mc1",advanceTemple);
      }
      private function advanceTemple() : void { if(active) { ++_step; nextTemple(); } }
      private function nextTemple() : void
      {
         if(!active) return;
         switch(_step)
         {
            case 1: ask(NPC.SEER,"哇！远古鱼龙还有鱼龙王都出现了，看上去一场大战即将发生！","再继续观望观望！",advanceTemple); break;
            case 2: ask(NPC.YULONGWANG,"水系同胞们，现在海之子神殿已经出现有史以来最强大的敌人，宇宙中最邪恶的海盗集团抓走了我们亲人，就是想获得0xff0000海魂之力0xffffff，大家要小心附近的漩涡！","什么！宇宙海盗？",advanceTemple); break;
            case 3: ask(NPC.YULONGWANG,"现在大家都各自准备一下，相信海盗集团一定会偷袭这里，我会带领大家守护海之子神殿！散…….","保护神殿！",advanceTemple); break;
            case 4: AnimateManager.playMcAnimate(_map.conLevel["activity"],2,"mc2",markKing); break;
            case 5: ask(NPC.YULONGWANG,"珀伽索斯！！！你们休想霸占海底世界，有我鱼龙王在，海盗们你们休想得逞！","去问问发生什么事了！",advanceTemple); break;
            case 6: ask(NPC.YULONGWANG,"前不久，海盗偷袭了这里，他们的目的就是获得海之子并拿到0xff0000海魂之力0xffffff，然而守护这里却是我们鱼龙王一族的使命！","我来帮助你们！",advanceTemple); break;
            case 7: ask(NPC.YULONGWANG,"海盗还会卷土重来。用头部射击阻止拖走精灵的海盗，击败另两名潜水兵，再救出贝壳中的水系伙伴！","我一定会救出那些水系伙伴的！",finishTemple); break;
         }
      }
      private function markKing() : void
      {
         if(!active) return;
         _map.conLevel["activity"].buttonMode = true;
         _map.conLevel["activity"].mouseChildren = false;
         _map.conLevel["activity"].addEventListener(MouseEvent.CLICK,onKing);
         CommonUI.addYellowExcal(_map.conLevel["activity"],486,85,1.2);
      }
      private function finishTemple() : void { if(active) TasksManager.complete(TASK_ID,1,onTempleSaved); }
      private function onTempleSaved(ok:Boolean) : void { if(active) { if(ok) startRescue(); else showKing(); } }
      private function pause() : void
      {
         if(!active) return;
         _scene.releaseState();
         _busy = false;
         if(_mapId == 684) showBubble();
         else { _step = 0; showKing(); }
      }
      private function goLake() : void { if(active) MapManager.changeMap(684); }
      private function showHelp() : void
      {
         if(!active) return;
         if(_priority)
         {
            NpcDialog.show(NPC.SEER,["先完成眼前的神狐主线对话，再来帮助神殿伙伴。"],["明白了"]);
            return;
         }
         if(TasksManager.getTaskStatus(TASK_ID) != TasksManager.COMPLETE)
         {
            NpcDialog.show(NPC.YULONGWANG,["湖面的皮特萨罗正在求救。请先帮助阿布救回精灵蛋，再到这里了解海盗的阴谋。"],["前往湖面帮助它","先看看神殿"],[goLake]);
            return;
         }
         NpcDialog.show(NPC.YULONGWANG,["历史神殿救援已常驻开放。头部射击命中拖拽精灵的海盗三次；另两名海盗需要通过战斗击退。随后点击获救目标，可能找到晶化气泡或能捕捉的水系精灵。开始战斗前，换图、重登和整理背包都不会重抽已发现的精灵。"],["开始救援！"],[queryState]);
      }
      private function startRescue() : void
      {
         if(!active) return;
         _map.conLevel["activity"].visible = false;
         _map.conLevel["challenge"].visible = false;
         _map.conLevel["vortex"].visible = true;
         _map.conLevel["vortex"].gotoAndStop(2);
         _map.conLevel["vortex"].mouseEnabled = false;
         _map.conLevel["vortex"].mouseChildren = false;
         _map.conLevel["blood"].mouseEnabled = false;
         _map.conLevel["blood"].mouseChildren = false;
         for each(var name:String in SLOT_NAMES)
         {
            _map.conLevel[name].visible = true;
            _map.conLevel[name].buttonMode = true;
            _map.conLevel[name].mouseChildren = false;
         }
         _map.conLevel["drag"].addEventListener(MouseEvent.CLICK,onDrag);
         _map.conLevel["run"].addEventListener(MouseEvent.CLICK,onRun);
         _map.conLevel["pk"].addEventListener(MouseEvent.CLICK,onPk);
         AimatController.addEventListener(AimatEvent.PLAY_END,onShot);
         queryState();
      }
      private function onShot(event:AimatEvent) : void
      {
         if(!active || event.info.userID != MainManager.actorID || _shots >= 3) return;
         queryState();
      }
      private function onDrag(event:MouseEvent) : void
      {
         if(!active || _busy) return;
         if(_shots >= 3 || _pendingSlot == 0) request(1,0);
         else NpcDialog.show(NPC.SEER,["这名海盗正拖走水系精灵！点击底部准心，选择普通头部射击，命中海盗三次后再点击留下的贝壳。"],["我来阻止它！"]);
      }
      private function onRun(event:MouseEvent) : void
      {
         if(!active || _busy) return;
         if(_run || _pendingSlot == 1) request(1,1);
         else FightManager.fightWithBoss("海盗潜水兵",8);
      }
      private function onPk(event:MouseEvent) : void
      {
         if(!active || _busy) return;
         if(_pk || _pendingSlot == 2) request(1,2);
         else FightManager.fightWithBoss("海盗潜水兵",7);
      }
      private function queryState() : void
      {
         if(!active) return;
         if(_busy) { _refreshAgain = true; return; }
         request(0,0);
      }
      private function request(action:uint, slot:uint) : void
      {
         if(!active || _busy) return;
         _busy = true;
         SocketConnection.addCmdListener(COMMAND,onResponse);
         _timer = setTimeout(onTimeout,5000);
         SocketConnection.send(COMMAND,action,slot);
      }
      private function stopRequest() : void
      {
         if(_timer) clearTimeout(_timer);
         _timer = 0;
         SocketConnection.removeCmdListener(COMMAND,onResponse);
         _busy = false;
      }
      private function onResponse(event:SocketEvent) : void
      {
         stopRequest();
         if(!active) return;
         var bytes:ByteArray = event.data as ByteArray;
         if(!bytes || bytes.bytesAvailable != 32) { onTimeout(); return; }
         var action:uint = bytes.readUnsignedInt();
         if(action == 2) return;
         _shots = bytes.readUnsignedInt();
         _run = bytes.readUnsignedInt();
         _pk = bytes.readUnsignedInt();
         _pendingSlot = bytes.readUnsignedInt();
         _pet = bytes.readUnsignedInt();
         _region = bytes.readUnsignedInt();
         var item:uint = bytes.readUnsignedInt();
         render();
         if(action == 1)
         {
            if(item) ItemInBagAlert.show(item,"一个<font color='#ff0000'>晶化气泡</font>已经放入你的储存箱中");
            else if(_pet) FightManager.fightWithBoss(PetXMLInfo.getName(_pet),_region);
         }
         if(_refreshAgain) { _refreshAgain = false; queryState(); }
      }
      private function render() : void
      {
         _map.conLevel["drag"].gotoAndStop(_shots >= 3 || _pendingSlot == 0 ? 2 : 1);
         _map.conLevel["run"].gotoAndStop(_run || _pendingSlot == 1 ? 2 : 1);
         _map.conLevel["pk"].gotoAndStop(_pk || _pendingSlot == 2 ? 7 : 1);
         _map.conLevel["blood"].visible = _shots > 0 && _shots < 3;
         if(_shots < 3) _map.conLevel["blood"].gotoAndStop(_shots + 1);
         ToolTipManager.add(_map.conLevel["drag"],_shots >= 3 ? "海盗已被击退：点击贝壳救援" : "头部射击命中海盗三次：" + _shots + "/3");
         ToolTipManager.add(_map.conLevel["run"],_run ? "海盗已被击败：点击救援" : "海盗潜水兵：点击挑战");
         ToolTipManager.add(_map.conLevel["pk"],_pk ? "海盗已被击败：点击救援" : "海盗潜水兵：点击挑战");
         if(_pendingSlot < 3)
         {
            ToolTipManager.add(_map.conLevel[SLOT_NAMES[_pendingSlot]],"点击继续解救" + PetXMLInfo.getName(_pet) + "；不会重新抽取");
         }
      }
      private function onTimeout() : void
      {
         stopRequest();
         if(active) NpcDialog.show(NPC.SEER,["救援请求未完成，进度会保留。可以重新点击原来的目标读取结果。"],["我知道了"]);
      }
      private function dispose() : void
      {
         if(_disposed) return;
         _disposed = true;
         stopRequest();
         AimatController.removeEventListener(AimatEvent.PLAY_END,onShot);
         if(_mapId == 684)
         {
            _map.conLevel["bubble"].removeEventListener(MouseEvent.CLICK,onBubble);
            CommonUI.removeYellowExcal(_map.conLevel["bubble"]);
            CommonUI.removeYellowArrow(_map.conLevel["vortex"]);
            ToolTipManager.remove(_map.conLevel["bubble"]);
         }
         else
         {
            _map.conLevel["activity"].removeEventListener(MouseEvent.CLICK,onKing);
            CommonUI.removeYellowExcal(_map.conLevel["activity"]);
            _map.conLevel["drag"].removeEventListener(MouseEvent.CLICK,onDrag);
            _map.conLevel["run"].removeEventListener(MouseEvent.CLICK,onRun);
            _map.conLevel["pk"].removeEventListener(MouseEvent.CLICK,onPk);
            ToolTipManager.remove(_map.conLevel["activity"]);
            for each(var name:String in SLOT_NAMES) ToolTipManager.remove(_map.conLevel[name]);
         }
         _scene.dispose();
      }
   }
}
