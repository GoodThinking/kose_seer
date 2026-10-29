package com.robot.core.group.fightInfo.fightOver
{
   import com.robot.core.event.RobotEvent;
   import com.robot.core.manager.MainManager;
   import flash.utils.IDataInput;
   import org.taomee.manager.EventManager;
   
   public class GroupFightOverInfo
   {
      
      private var _type:uint;
      
      private var _endReason:uint;
      
      private var _winner:uint;
      
      private var _dualTimes:uint;
      
      private var _trinalTimes:uint;
      
      private var _autoBtlTimes:uint;
      
      private var _btlDetectTimes:uint;
      
      private var _engAbsorbTimes:uint;
      
      private var _dualEvTimes:uint;
      
      public function GroupFightOverInfo(param1:IDataInput = null)
      {
         super();
         this._type = param1.readUnsignedByte();
         this._endReason = param1.readUnsignedInt();
         this._winner = param1.readUnsignedInt();
         param1.readUnsignedInt();
         this._dualTimes = param1.readUnsignedInt();
         this._trinalTimes = param1.readUnsignedInt();
         this._autoBtlTimes = param1.readUnsignedInt();
         this._btlDetectTimes = param1.readUnsignedInt();
         this._engAbsorbTimes = param1.readUnsignedInt();
         this._dualEvTimes = param1.readUnsignedInt();
         MainManager.actorInfo.twoTimes = this._dualTimes;
         MainManager.actorInfo.threeTimes = this._trinalTimes;
         MainManager.actorInfo.autoFightTimes = this._autoBtlTimes;
         MainManager.actorInfo.energyTimes = this._engAbsorbTimes;
         MainManager.actorInfo.learnTimes = this._dualEvTimes;
         EventManager.dispatchEvent(new RobotEvent(RobotEvent.ENERGY_TIMES_CHANGE));
         EventManager.dispatchEvent(new RobotEvent(RobotEvent.SPEEDUP_CHANGE));
         EventManager.dispatchEvent(new RobotEvent(RobotEvent.AUTO_FIGHT_CHANGE));
         EventManager.dispatchEvent(new RobotEvent(RobotEvent.STUDY_TIMES_CHANGE));
         EventManager.dispatchEvent(new RobotEvent(RobotEvent.SHOW_FIGHT_HP_CHANGE));
      }
      
      public function get type() : uint
      {
         return this._type;
      }
      
      public function get endReason() : uint
      {
         return this._endReason;
      }
      
      public function get winnerID() : uint
      {
         return this._winner;
      }
      
      public function get dualTimes() : uint
      {
         return this._dualTimes;
      }
      
      public function get trinalTimes() : uint
      {
         return this._trinalTimes;
      }
      
      public function get autoBtlTimes() : uint
      {
         return this._autoBtlTimes;
      }
      
      public function get engAbsorbTimes() : uint
      {
         return this._engAbsorbTimes;
      }
      
      public function get dualEvTimes() : uint
      {
         return this._dualEvTimes;
      }
   }
}

