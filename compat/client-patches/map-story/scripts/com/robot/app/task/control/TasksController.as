package com.robot.app.task.control
{
   import com.robot.app.mapProcess.*;
   import com.robot.app.task.taskscollection.ITask;
   import com.robot.core.*;
   import com.robot.core.config.*;
   import com.robot.core.event.*;
   import com.robot.core.manager.*;
   import com.robot.core.manager.map.config.*;
   import com.robot.core.net.*;
   import com.robot.core.ui.alert.Alarm;
   import flash.display.*;
   import flash.utils.*;
   import org.taomee.events.SocketEvent;
   import org.taomee.utils.*;
   
   public class TasksController
   {
      
      private static const TASK_STATUS_QUERY:uint = 5;
      
      private static const TASK_STATUS_TIMEOUT:uint = 3000;
      
      private static const TRACKED_TASK_IDS:Array = [530,532,535,534,540,549,558,560,561,616,619,620,624,626,628,633,637,641,642,643,648,653,655,658,647,649,654,656,662,663,669,673,678,683,687,695,705,715,730,737,741,746,753,698,707,716,735,739,743,748,755,764,768,775,788,796,801,811,816,819,758,759,760,761,762,763];
      
      private static const KAXIUSI_ENABLED_TASK_IDS:Array = [616,619,624,626,628,633,637,641,642,648,653,655,658];
      
      private static const KAXIUSI_CHAPTERS:XML = <root>
         <chapter id="2">
            <task id="616" name="黑色降临" priority="1"/>
            <task id="619" name="卡茨的爆发" priority="2"/>
            <task id="624" name="卡茨迷宫心境" priority="3"/>
            <task id="626" name="卡茨的劫难" priority="4"/>
            <task id="628" name="卡茨的逆袭" priority="5"/>
            <task id="633" name="SUN星大灾难" priority="6"/>
            <task id="637" name="黑暗力量爆发" priority="7"/>
            <task id="641" name="与魔抗衡" priority="8"/>
         </chapter>
         <chapter id="3" prerequisiteTaskID="641">
            <task id="642" name="使命的召唤" priority="1"/>
            <task id="648" name="剧毒的洛兰花" priority="1"/>
            <task id="653" name="穿越云水洞" priority="1"/>
            <task id="655" name="海盗研究所" priority="1"/>
            <task id="658" name="山顶的决战" priority="1"/>
         </chapter>
      </root>;
      
      private static var _chapters:Array = [];
      
      private static var _setupStarted:Boolean = false;
      
      private static var _setupFinished:Boolean = false;
      
      private static var _kaxiusiStatusReady:Boolean = false;
      
      private static var _statusTimeoutId:uint = 0;
      
      private static var _enterSceneTimeoutId:uint = 0;
      
      private static var _mysteryHolePanelPending:Boolean = false;
      
      private static var _trackedTaskStatusCallbacks:Array = [];
      
      public static const TASKPANEL_SHOW_COMPLETE:String = "taskPanel_show_complete";
      
      public static const TASKPANEL_SHOW_PAUSE:String = "taskPanel_show_pause";
      
      public static const TASKPANEL_CLOSE:String = "taskPanel_close";
      
      public function TasksController()
      {
         super();
      }
      
      public static function setUp() : void
      {
         var args:Array = null;
         if(_setupStarted)
         {
            return;
         }
         _setupStarted = true;
         MapManager.removeEventListener(MapEvent.MAP_PROCESS_INIT,enterScene);
         MapManager.addEventListener(MapEvent.MAP_PROCESS_INIT,enterScene);
         MapManager.addEventListener(MapEvent.MAP_SWITCH_OPEN,onLeaveScene);
         SocketConnection.removeCmdListener(CommandID.XIN_GET_QUADRUPLE_EXE_TIME,onTaskStatus);
         SocketConnection.addCmdListener(CommandID.XIN_GET_QUADRUPLE_EXE_TIME,onTaskStatus);
         args = [CommandID.XIN_GET_QUADRUPLE_EXE_TIME,TASK_STATUS_QUERY,TRACKED_TASK_IDS.length].concat(TRACKED_TASK_IDS);
         _statusTimeoutId = setTimeout(onStatusTimeout,TASK_STATUS_TIMEOUT);
         try
         {
            SocketConnection.send.apply(null,args);
         }
         catch(e:Error)
         {
            onStatusTimeout();
         }
      }

      private static function onStatusTimeout() : void
      {
         if(_statusTimeoutId != 0)
         {
            clearTimeout(_statusTimeoutId);
         }
         _statusTimeoutId = 0;
         Alarm.show("剧情任务进度读取失败，请刷新后重试。");
      }
      
      private static function onTaskStatus(param1:SocketEvent) : void
      {
         var _loc2_:ByteArray = param1.data as ByteArray;
         var _loc3_:uint = 0;
         var _loc4_:uint = 0;
         var _loc5_:uint = 0;
         var _loc6_:uint = 0;
         var _loc7_:uint = 0;
         if(_loc2_ == null)
         {
            return;
         }
         _loc2_.position = 0;
         if(_loc2_.bytesAvailable < 8)
         {
            return;
         }
         _loc3_ = _loc2_.readUnsignedInt();
         if(_loc3_ != TASK_STATUS_QUERY)
         {
            _loc2_.position = 0;
            return;
         }
         _loc4_ = _loc2_.readUnsignedInt();
         if(_loc4_ != TRACKED_TASK_IDS.length || _loc2_.bytesAvailable != _loc4_ * 8 + 200)
         {
            return;
         }
         var statuses:Array = [];
         var _loc8_:uint = 0;
         while(_loc8_ < _loc4_ && _loc2_.bytesAvailable >= 8)
         {
            _loc5_ = _loc2_.readUnsignedInt();
            _loc6_ = _loc2_.readUnsignedInt();
            if(_loc5_ != TRACKED_TASK_IDS[_loc8_] || (_loc6_ != TasksManager.UN_ACCEPT && _loc6_ != TasksManager.ALR_ACCEPT && _loc6_ != TasksManager.COMPLETE))
            {
               return;
            }
            statuses.push(_loc6_);
            _loc7_++;
            _loc8_++;
         }
         for(var statusIndex:uint = 0; statusIndex < TRACKED_TASK_IDS.length; statusIndex++)
         {
            TasksManager.setTaskStatus(TRACKED_TASK_IDS[statusIndex],statuses[statusIndex]);
         }
         if(_loc7_ == TRACKED_TASK_IDS.length && _loc2_.bytesAvailable == 200)
         {
            MainManager.actorInfo.bufferRecordArr = [];
            for(var byteIndex:uint = 0; byteIndex < 200; byteIndex++)
            {
               var bits:uint = _loc2_.readUnsignedByte();
               for(var bitIndex:uint = 0; bitIndex < 8; bitIndex++)
               {
                  MainManager.actorInfo.bufferRecordArr.push((bits & (1 << bitIndex)) != 0);
               }
            }
         }
         _loc2_.position = 0;
         if(_loc7_ == TRACKED_TASK_IDS.length)
         {
            _kaxiusiStatusReady = true;
            flushTrackedTaskStatusCallbacks();
            SocketConnection.removeCmdListener(CommandID.XIN_GET_QUADRUPLE_EXE_TIME,onTaskStatus);
            if(_statusTimeoutId != 0)
            {
               clearTimeout(_statusTimeoutId);
               _statusTimeoutId = 0;
            }
            if(_mysteryHolePanelPending)
            {
               _mysteryHolePanelPending = false;
               ModuleManager.showModule(ClientConfig.getAppModule("HolePanel"),"炫彩山山洞入口面板");
            }
            if(_setupFinished)
            {
               enterScene(null);
            }
            else
            {
               finishSetUp();
            }
         }
      }
      
      public static function runAfterTrackedTaskStatus(param1:Function, param2:BaseMapProcess = null) : void
      {
         var callback:Function = param1;
         var map:BaseMapProcess = param2;
         if(callback == null)
         {
            return;
         }
         if(_kaxiusiStatusReady)
         {
            if(map == null)
            {
               callback();
            }
            else
            {
               setTimeout(function():void
               {
                  if(MapProcessConfig.currentProcessInstance == map)
                  {
                     callback.call(map);
                  }
               },0);
            }
            return;
         }
         _trackedTaskStatusCallbacks.push({
            "callback":callback,
            "map":map
         });
      }
      
      public static function isTrackedTaskStatusReady() : Boolean
      {
         return _kaxiusiStatusReady;
      }
      
      private static function flushTrackedTaskStatusCallbacks() : void
      {
         var _loc1_:Array = _trackedTaskStatusCallbacks;
         var _loc2_:Object = null;
         _trackedTaskStatusCallbacks = [];
         for each(_loc2_ in _loc1_)
         {
            if(_loc2_.map == null || MapProcessConfig.currentProcessInstance == _loc2_.map)
            {
               if(_loc2_.map == null)
               {
                  _loc2_.callback();
               }
               else
               {
                  _loc2_.callback.call(_loc2_.map);
               }
            }
         }
      }
      
      private static function finishSetUp() : void
      {
         var _loc1_:XML = null;
         var _loc2_:TasksChapter = null;
         var _loc3_:XML = null;
         var _loc4_:Class = null;
         var _loc5_:ITask = null;
         if(_setupFinished)
         {
            return;
         }
         _setupFinished = true;
         if(_kaxiusiStatusReady)
         {
            SocketConnection.removeCmdListener(CommandID.XIN_GET_QUADRUPLE_EXE_TIME,onTaskStatus);
         }
         if(_statusTimeoutId != 0)
         {
            clearTimeout(_statusTimeoutId);
            _statusTimeoutId = 0;
         }
         for each(_loc1_ in KAXIUSI_CHAPTERS.elements("chapter"))
         {
            _loc2_ = new TasksChapter();
            _loc2_.id = int(_loc1_.@id);
            _loc2_.prerequisiteTaskID = uint(_loc1_.@prerequisiteTaskID);
            for each(_loc3_ in _loc1_.elements("task"))
            {
               _loc4_ = getDefinitionByName("com.robot.app.task.taskscollection.Task" + _loc3_.@id.toString()) as Class;
               _loc5_ = new _loc4_();
               _loc5_.id = int(_loc3_.@id);
               _loc5_.priority = int(_loc3_.@priority);
               _loc2_.tasks.push(_loc5_);
            }
            _chapters.push(_loc2_);
         }
         if(MapProcessConfig.currentProcessInstance != null)
         {
            enterScene(null);
         }
      }
      
      public static function enterScene(param1:*) : void
      {
         var _loc2_:TasksChapter = null;
         var _loc3_:MapProcess_484 = null;
         if(param1 != null)
         {
            if(_enterSceneTimeoutId != 0)
            {
               clearTimeout(_enterSceneTimeoutId);
            }
            _enterSceneTimeoutId = setTimeout(enterSceneAfterProcessAssigned,0);
            return;
         }
         if(_enterSceneTimeoutId != 0)
         {
            clearTimeout(_enterSceneTimeoutId);
            _enterSceneTimeoutId = 0;
         }
         if(Boolean(_kaxiusiStatusReady) && MapManager.currentMap != null && MapManager.currentMap.id == 484)
         {
            if(_setupFinished)
            {
               _loc3_ = MapProcessConfig.currentProcessInstance as MapProcess_484;
               if(_loc3_ != null)
               {
                  _loc3_.initKaxiusiTasksAfterStatus();
               }
            }
         }
         else if(_kaxiusiStatusReady)
         {
            for each(_loc2_ in _chapters)
            {
               _loc2_.process();
            }
         }
         if(_kaxiusiStatusReady && MapManager.currentMap != null && MapManager.currentMap.id == 5)
         {
            com.robot.app.task.taskscollection.Task658.completeTask();
         }
      }
      
      private static function enterSceneAfterProcessAssigned() : void
      {
         _enterSceneTimeoutId = 0;
         enterScene(null);
      }
      
      public static function isKaxiusiTaskEnabled(param1:uint) : Boolean
      {
         return KAXIUSI_ENABLED_TASK_IDS.indexOf(param1) != -1;
      }
      
      public static function showMysteryHolePanel() : void
      {
         if(!_kaxiusiStatusReady)
         {
            _mysteryHolePanelPending = true;
            return;
         }
         ModuleManager.showModule(ClientConfig.getAppModule("HolePanel"),"炫彩山山洞入口面板");
      }
      
      public static function hideClosedKaxiusiResources(param1:BaseMapProcess = null) : void
      {
         var _loc2_:MovieClip = null;
         var _loc3_:MovieClip = null;
         if(MapManager.currentMap == null)
         {
            return;
         }
         if(param1 == null)
         {
            param1 = MapProcessConfig.currentProcessInstance;
         }
         if(param1 == null)
         {
            return;
         }
         switch(MapManager.currentMap.id)
         {
            case 445:
               setMapResourceVisible(param1.conLevel,"kazi2MC",false);
               setMapResourceVisible(param1.conLevel,"kaziMC",false);
               setMapResourceVisible(param1.conLevel,"black1MC",false);
               setMapResourceVisible(param1.conLevel,"black2MC",false);
               break;
            case 446:
               setMapResourceFrame(param1.conLevel,"stoneMC",5);
               setMapResourceFrame(param1.conLevel,"bridleMC",7);
               setMapResourceVisible(param1.conLevel,"haidaoMC",false);
               break;
            case 447:
               setMapResourceFrame(param1.conLevel,"linesMC",3);
               break;
            case 448:
               removeMapResource(param1.conLevel,"introMC");
               setMapResourceVisible(param1.conLevel,"kazi2MC",false);
               setMapResourceVisible(param1.conLevel,"point2MC",false);
               setMapResourceVisible(param1.conLevel,"nextMapHit",true);
               _loc2_ = param1.conLevel.getChildByName("task707MC") as MovieClip;
               if(_loc2_ != null)
               {
                  setMapResourceVisible(_loc2_,"pointMC",false);
               }
               break;
            case 449:
               setMapResourceVisible(param1.conLevel,"holeHit",true);
               setMapResourceFrame(param1.conLevel,"mainMC",12);
               setMapResourceVisible(param1.conLevel,"stone1",false);
               setMapResourceVisible(param1.conLevel,"stone2",false);
               setMapResourceVisible(param1.conLevel,"stone3",false);
               _loc3_ = param1.conLevel.getChildByName("pirateMC") as MovieClip;
               if(_loc3_ != null)
               {
                  setMapResourceFrame(_loc3_,"pirate1",4);
                  setMapResourceFrame(_loc3_,"pirate2",4);
                  setMapResourceFrame(_loc3_,"pirate3",4);
                  _loc3_.mouseChildren = false;
                  _loc3_.mouseEnabled = false;
               }
               removeMapResource(param1.typeLevel,"pirMC");
               removeMapResource(param1.animatorLevel,"boatMC");
               break;
            case 478:
               removeMapResource(param1.conLevel,"seer");
               removeMapResource(param1.conLevel,"arrow");
               removeMapResource(param1.conLevel,"boss_637");
               removeMapResource(param1.conLevel,"grass");
               removeMapResource(param1.conLevel,"water");
               removeMapResource(param1.conLevel,"fire");
               setMapResourceVisible(param1.conLevel,"hot_D",false);
               setMapResourceVisible(param1.depthLevel,"gaiya",false);
               setMapResourceVisible(param1.depthLevel,"leiyi",false);
               setMapResourceVisible(param1.topLevel,"arrow_640",false);
               break;
            case 486:
               if(!_kaxiusiStatusReady || TasksManager.getTaskStatus(619) == TasksManager.ALR_ACCEPT)
               {
                  break;
               }
               setMapResourceVisible(param1.topLevel,"arrow_619",false);
               removeMapResource(param1.conLevel,"stone_0");
               removeMapResource(param1.conLevel,"stone_1");
               removeMapResource(param1.conLevel,"boss_619");
               removeMapResource(param1.animatorLevel,"cord");
               removeMapResource(param1.depthLevel,"npc_619");
               break;
            case 487:
               if(!_kaxiusiStatusReady || TasksManager.getTaskStatus(619) == TasksManager.ALR_ACCEPT)
               {
                  break;
               }
               removeMapResource(param1.depthLevel,"pet_0");
               removeMapResource(param1.depthLevel,"pet_1");
               removeMapResource(param1.depthLevel,"pet_2");
               removeMapResource(param1.depthLevel,"pet_3");
         }
      }
      
      private static function setMapResourceVisible(param1:DisplayObjectContainer, param2:String, param3:Boolean) : void
      {
         var _loc4_:DisplayObject = param1 == null ? null : param1.getChildByName(param2);
         if(_loc4_ != null)
         {
            _loc4_.visible = param3;
         }
      }
      
      private static function setMapResourceFrame(param1:DisplayObjectContainer, param2:String, param3:int) : void
      {
         var _loc4_:MovieClip = param1 == null ? null : param1.getChildByName(param2) as MovieClip;
         if(_loc4_ != null)
         {
            _loc4_.gotoAndStop(param3);
         }
      }
      
      private static function removeMapResource(param1:DisplayObjectContainer, param2:String) : void
      {
         var _loc3_:DisplayObject = param1 == null ? null : param1.getChildByName(param2);
         if(_loc3_ != null)
         {
            DisplayUtil.removeForParent(_loc3_);
         }
      }
      
      private static function onLeaveScene(event:flash.events.Event) : void
      {
         if(_setupFinished && MapManager.currentMap != null)
         {
            leaveScene();
         }
      }
      
      public static function leaveScene() : void
      {
         var _loc1_:TasksChapter = null;
         var _loc2_:ITask = null;
         for each(_loc1_ in _chapters)
         {
            for each(_loc2_ in _loc1_.tasks)
            {
               _loc2_.destoryForMap();
            }
         }
      }
      
      public static function get allChapters() : Array
      {
         return _chapters;
      }
      
      public static function taskCompleteUI() : void
      {
         var taskmc:MovieClip = null;
         taskmc = null;
         var endTask:Function = null;
         endTask = function():void
         {
            taskmc.addFrameScript(taskmc.totalFrames - 1,null);
            DisplayUtil.removeForParent(taskmc);
            taskmc = null;
         };
         taskmc = TaskIconManager.getIcon("TaskOverUI") as MovieClip;
         DisplayUtil.align(taskmc,null,AlignType.MIDDLE_CENTER);
         LevelManager.appLevel.addChild(taskmc);
         taskmc.addFrameScript(taskmc.totalFrames - 1,endTask);
      }
   }
}

