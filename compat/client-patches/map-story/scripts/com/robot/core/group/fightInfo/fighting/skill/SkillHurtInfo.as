package com.robot.core.group.fightInfo.fighting.skill
{
   import com.robot.core.info.fightInfo.PetStatusEffectInfo;
   import com.robot.core.utils.FightEffectName;
   import flash.utils.IDataInput;
   import org.taomee.ds.HashMap;
   
   public class SkillHurtInfo
   {
      
      private var _isAttackor:Boolean = true;
      
      private var _side:uint;
      
      private var _pos:uint;
      
      private var _userID:uint;
      
      private var _statusList:Array;
      
      private var _batLvList:Array;
      
      private var _petID:uint;
      
      private var _moveID:uint;
      
      private var _hp:uint;
      
      private var _maxHp:uint;
      
      private var _moveCnt:uint;
      
      private var _moveMap:HashMap;
      
      private var _flag:uint;
      
      private var _isCrit:Boolean = false;
      
      private var _effectName:String;
      
      private var _atk_times:uint;
      
      private var _dmg:int;
      
      private var _chgHp:int;
      
      private var _sideEffects:Array;
      
      public function SkillHurtInfo(param1:IDataInput = null)
      {
         var _loc7_:uint = 0;
         super();
         if(param1.readUnsignedByte() == 1)
         {
            this._isAttackor = false;
         }
         this._side = param1.readUnsignedByte();
         this._pos = param1.readUnsignedByte();
         this._userID = param1.readUnsignedInt();
         this._statusList = [];
         var _loc2_:uint = 0;
         while(_loc2_ < 22)
         {
            this._statusList.push(param1.readUnsignedByte());
            _loc2_++;
         }
         this._batLvList = [];
         var _loc3_:uint = 0;
         while(_loc3_ < 6)
         {
            this._batLvList.push(param1.readUnsignedByte());
            _loc3_++;
         }
         this._petID = param1.readUnsignedInt();
         this._moveID = param1.readUnsignedInt();
         this._hp = param1.readUnsignedInt();
         this._maxHp = param1.readUnsignedInt();
         this._moveCnt = param1.readUnsignedInt();
         this._moveMap = new HashMap();
         var _loc4_:uint = 0;
         while(_loc4_ < this._moveCnt)
         {
            this._moveMap.add(param1.readUnsignedInt(),param1.readUnsignedInt());
            _loc4_++;
         }
         this._flag = param1.readUnsignedInt();
         if(this._isAttackor)
         {
            this._isCrit = Boolean(param1.readUnsignedInt());
            this._effectName = FightEffectName.getName(param1.readUnsignedInt());
            this._atk_times = param1.readUnsignedInt();
            this._dmg = param1.readInt();
            this._chgHp = param1.readInt();
         }
         this._sideEffects = [];
         _loc7_ = param1.readUnsignedInt();
         _loc2_ = 0;
         while(_loc2_ < _loc7_)
         {
            this._sideEffects.push(new PetStatusEffectInfo(param1));
            _loc2_++;
         }
      }
      
      public function get isAttackor() : Boolean
      {
         return this._isAttackor;
      }
      
      public function get side() : uint
      {
         return this._side;
      }
      
      public function get pos() : uint
      {
         return this._pos;
      }
      
      public function get userID() : uint
      {
         return this._userID;
      }
      
      public function get statusList() : Array
      {
         return this._statusList;
      }
      
      public function get sideEffects() : Array
      {
         return this._sideEffects;
      }
      
      public function get batLvList() : Array
      {
         return this._batLvList;
      }
      
      public function get petID() : uint
      {
         return this._petID;
      }
      
      public function get moveID() : uint
      {
         return this._moveID;
      }
      
      public function get hp() : uint
      {
         return this._hp;
      }
      
      public function get maxHp() : uint
      {
         return this._maxHp;
      }
      
      public function get moveCnt() : uint
      {
         return this._moveCnt;
      }
      
      public function get moveMap() : HashMap
      {
         return this._moveMap;
      }
      
      public function get flag() : uint
      {
         return this._flag;
      }
      
      public function get isCrit() : Boolean
      {
         return this._isCrit;
      }
      
      public function get effectName() : String
      {
         return this._effectName;
      }
      
      public function get atkTimes() : uint
      {
         return this._atk_times;
      }
      
      public function get dmg() : int
      {
         return this._dmg;
      }
      
      public function get chgHp() : int
      {
         return this._chgHp;
      }
   }
}

