package com.robot.core.utils
{
   import com.robot.core.manager.*;
   import org.taomee.debug.*;
   
   public class CronTimeVo
   {
      
      public static const NULL:int = -1;
      
      public static const HIT:int = 1;
      
      public static const INCOMING:int = 2;
      
      public static const PAST:int = 3;
      
      public static const INDEX_MIN:int = 0;
      
      public static const INDEX_HOUR:int = 1;
      
      public static const INDEX_DOM:int = 2;
      
      public static const INDEX_MON:int = 3;
      
      public static const INDEX_DOW:int = 4;
      
      public static const INDEX_YEAR:int = 5;
      
      public static var DEBUG:Boolean = false;
      
      private var start_min:int = 0;
      
      private var end_min:int;
      
      private var interval_min:int;
      
      private var sym_min:String;
      
      private var min_space:Array;
      
      private var start_hour:int = 0;
      
      private var end_hour:int;
      
      private var interval_hour:int;
      
      private var sym_hour:String;
      
      private var hour_space:Array;
      
      private var start_dom:int = 1;
      
      private var end_dom:int;
      
      private var interval_dom:int;
      
      private var sym_dom:String;
      
      private var dom_space:Array;
      
      private var start_mon:int = 1;
      
      private var end_mon:int;
      
      private var interval_mon:int;
      
      private var sym_mon:String;
      
      private var mon_space:Array;
      
      private var start_dow:int = 1;
      
      private var d:int;
      
      private var interval_dow:int;
      
      private var sym_dow:String;
      
      private var dow_space:Array;
      
      private var start_year:int = 1;
      
      private var end_year:int;
      
      private var interval_year:int;
      
      private var sym_year:String;
      
      private var year_space:Array;
      
      public function CronTimeVo(param1:String, param2:String, param3:String, param4:String, param5:String, param6:String = "*")
      {
         super();
         this.readArg(param1,INDEX_MIN);
         this.readArg(param2,INDEX_HOUR);
         this.readArg(param3,INDEX_DOM);
         this.readArg(param4,INDEX_MON);
         this.readArg(param5,INDEX_DOW);
         this.readArg(param6,INDEX_YEAR);
      }
      
      public static function getTimeArgStart(param1:int) : int
      {
         var _loc2_:int = 0;
         switch(param1)
         {
            case INDEX_MIN:
               _loc2_ = 0;
               break;
            case INDEX_HOUR:
               _loc2_ = 0;
               break;
            case INDEX_DOM:
               _loc2_ = 1;
               break;
            case INDEX_MON:
               _loc2_ = 1;
               break;
            case INDEX_DOW:
               _loc2_ = 0;
               break;
            case INDEX_YEAR:
               _loc2_ = 2012;
         }
         return _loc2_;
      }
      
      public static function getTimeArgEnd(param1:int) : int
      {
         var _loc2_:int = 0;
         switch(param1)
         {
            case INDEX_MIN:
               _loc2_ = 60;
               break;
            case INDEX_HOUR:
               _loc2_ = 24;
               break;
            case INDEX_DOM:
               _loc2_ = 31;
               break;
            case INDEX_MON:
               _loc2_ = 12;
               break;
            case INDEX_DOW:
               _loc2_ = 6;
               break;
            case INDEX_YEAR:
               _loc2_ = 2020;
         }
         return _loc2_;
      }
      
      public function isTimeActive(param1:Date = null) : Boolean
      {
         if(param1 == null)
         {
            param1 = SystemTimerManager.sysBJDate;
         }
         return this.isActive(param1);
      }
      
      public function isActive(param1:Date) : Boolean
      {
         var _loc2_:Boolean = Boolean(this.validBit(this.min_space,param1.minutes,this.sym_min));
         var _loc3_:Boolean = Boolean(this.validBit(this.hour_space,param1.hours,this.sym_hour));
         var _loc4_:Boolean = Boolean(this.validBit(this.dom_space,param1.date,this.sym_dom));
         var _loc5_:Boolean = Boolean(this.validBit(this.mon_space,param1.month + 1,this.sym_mon));
         var _loc6_:Boolean = Boolean(this.validBit(this.dow_space,param1.day,this.sym_dow));
         var _loc7_:Boolean = Boolean(this.validBit(this.year_space,param1.fullYear,this.sym_year));
         if(DEBUG)
         {
            DebugTrace.show("active");
            DebugTrace.show("bit_min",_loc2_);
            DebugTrace.show("bit_hour",_loc3_);
            DebugTrace.show("bit_dom",_loc4_);
            DebugTrace.show("bit_mon",_loc5_);
            DebugTrace.show("bit_dow",_loc6_);
         }
         return _loc2_ && _loc3_ && _loc4_ && _loc5_ && _loc6_ && _loc7_;
      }
      
      public function getInComingLeftTime(param1:Date) : int
      {
         var _loc2_:Date = new Date(this.start_year,this.start_mon - 1,this.start_dom,this.start_hour,this.start_min);
         return (_loc2_.time - param1.time) / 1000;
      }
      
      public function checkTimeHit(param1:Date) : int
      {
         if(this.isActive(param1))
         {
            return HIT;
         }
         if("*" != this.sym_year && -1 == this.year_space.indexOf(param1.fullYearUTC))
         {
            return this.validBitHit(this.year_space,param1.fullYearUTC);
         }
         if("*" != this.sym_mon && -1 == this.mon_space.indexOf(param1.month + 1))
         {
            if(this.year_space.indexOf(param1.fullYearUTC) == this.year_space.length - 1)
            {
               return this.validBitHit(this.mon_space,param1.month + 1);
            }
            return INCOMING;
         }
         if("*" != this.sym_dom && -1 == this.dom_space.indexOf(param1.date))
         {
            if(this.mon_space.indexOf(param1.month + 1) == this.mon_space.length - 1)
            {
               return this.validBitHit(this.dom_space,param1.date);
            }
            return INCOMING;
         }
         if("*" != this.sym_hour && -1 == this.hour_space.indexOf(param1.hours))
         {
            if(this.dom_space.indexOf(param1.date) == this.dom_space.length - 1)
            {
               return this.validBitHit(this.hour_space,param1.hours);
            }
            return INCOMING;
         }
         if("*" != this.sym_min && -1 == this.min_space.indexOf(param1.minutes))
         {
            if(this.hour_space.indexOf(param1.hours) == this.hour_space.length - 1)
            {
               return this.validBitHit(this.min_space,param1.minutes);
            }
            return INCOMING;
         }
         return NULL;
      }
      
      private function validBitHit(param1:Array, param2:int) : int
      {
         if(param2 < param1[0])
         {
            return INCOMING;
         }
         return PAST;
      }
      
      private function validBit(param1:Array, param2:int, param3:String) : Boolean
      {
         var _loc4_:int = 0;
         if("*" == param3)
         {
            return true;
         }
         _loc4_ = int(param1.indexOf(param2));
         return _loc4_ >= 0;
      }
      
      private function readArg(param1:String, param2:int) : Boolean
      {
         var _loc3_:Array = null;
         var _loc4_:int = 0;
         var _loc5_:int = 0;
         var _loc6_:String = "1";
         var _loc7_:Array = param1.split("/");
         var _loc8_:String = _loc7_[0] as String;
         if(2 == _loc7_.length)
         {
            _loc6_ = _loc7_[1] as String;
         }
         var _loc9_:int = int(parseInt(_loc6_));
         var _loc10_:Array = [];
         if(_loc8_.indexOf("-") > 0)
         {
            _loc3_ = this.toInt(_loc8_.split("-"));
            _loc4_ = Math.max(_loc3_[0],getTimeArgStart(param2));
            _loc5_ = Math.min(_loc3_[1],getTimeArgEnd(param2));
            _loc10_ = this.disperseSpace(_loc4_,_loc5_,_loc9_);
         }
         else if(_loc8_.indexOf(",") > 0)
         {
            _loc10_ = this.toInt(_loc8_.split(","));
         }
         else
         {
            _loc10_.push(parseInt(_loc8_));
         }
         this.setArg(_loc10_,_loc9_,_loc8_,param2);
         return true;
      }
      
      private function setArg(param1:Array, param2:int, param3:String, param4:int) : void
      {
         param1.sort();
         switch(param4)
         {
            case INDEX_MIN:
               this.interval_min = param2;
               this.sym_min = param3;
               this.min_space = param1;
               break;
            case INDEX_HOUR:
               this.interval_hour = param2;
               this.sym_hour = param3;
               this.hour_space = param1;
               break;
            case INDEX_DOM:
               this.interval_dom = param2;
               this.sym_dom = param3;
               this.dom_space = param1;
               break;
            case INDEX_MON:
               this.interval_mon = param2;
               this.sym_mon = param3;
               this.mon_space = param1;
               break;
            case INDEX_DOW:
               this.interval_dow = param2;
               this.sym_dow = param3;
               this.dow_space = param1;
               break;
            case INDEX_YEAR:
               this.interval_year = param2;
               this.sym_year = param3;
               this.year_space = param1;
         }
      }
      
      private function disperseSpace(param1:int, param2:int, param3:int) : Array
      {
         var _loc4_:int = 0;
         var _loc5_:Array = [];
         _loc4_ = param1;
         while(_loc4_ <= param2)
         {
            _loc5_.push(_loc4_);
            _loc4_ += param3;
         }
         return _loc5_;
      }
      
      private function toInt(param1:Array) : Array
      {
         var _loc2_:String = null;
         var _loc3_:Array = [];
         for each(_loc2_ in param1)
         {
            _loc3_.push(parseInt(_loc2_));
         }
         return _loc3_;
      }
      
      public function toString() : String
      {
         return this.sym_min + " " + this.sym_hour + " " + this.sym_dom + " " + this.sym_mon + " " + this.sym_dow;
      }
   }
}

