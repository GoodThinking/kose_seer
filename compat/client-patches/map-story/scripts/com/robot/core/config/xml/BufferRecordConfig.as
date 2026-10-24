package com.robot.core.config.xml
{
   import com.robot.core.config.xmlInfo.*;
   import flash.net.*;
   import flash.utils.*;
   import org.taomee.debug.*;
   
   public class BufferRecordConfig
   {
      
      private static var time:uint;
      
      private static var _xmlClass:Class = BufferRecordConfig__xmlClass;
      
      private static var _xml:XML = XML(new _xmlClass());
      
      private static var _cacheInfoArr:Array = [];
      
      private static var _proDic:Dictionary = new Dictionary();
      
      private static var _bitbuffDic:Dictionary = new Dictionary();
      
      setup();
      
      public function BufferRecordConfig()
      {
         super();
      }
      
      public static function getBitIndexByID(param1:uint) : uint
      {
         if(_proDic[param1] == null)
         {
            throw new Error("bufferrecord.xml====没有配置存储,buffer id = " + param1.toString());
         }
         return _proDic[param1].bitindex;
      }
      
      public static function getBitBuffIndexByID(param1:uint) : uint
      {
         if(_bitbuffDic[param1] == null)
         {
            throw new Error("bufferrecord.xml====没有配置存储,bitbuff id = " + param1.toString());
         }
         return _bitbuffDic[param1].bitindex;
      }
      
      public static function getBitBuffID(param1:uint) : uint
      {
         var _loc2_:BufferInfo = null;
         for each(_loc2_ in _bitbuffDic)
         {
            if(_loc2_.bitindex == param1)
            {
               return _loc2_.id;
            }
         }
         throw new Error("bufferrecord.xml====没有配置存储,bitbuff index = " + param1.toString());
      }
      
      public static function getBitBuffArray() : Array
      {
         var _loc1_:BufferInfo = null;
         var _loc2_:Array = [];
         for each(_loc1_ in _bitbuffDic)
         {
            _loc2_.push(_loc1_.bitindex);
         }
         DebugTrace.show("bufferrecord.xml解析时间：" + (getTimer() - time) / 1000);
         return _loc2_;
      }
      
      public static function setup() : void
      {
         time = getTimer();
         parseItemXMLList(_xml);
         _xml = null;
         _xmlClass = null;
      }
      
      public static function exportByteArray(... rest) : ByteArray
      {
         var _loc2_:XML = null;
         var _loc3_:ByteArray = null;
         registerClassAlias("com.robot.core.config.xmlInfo.BufferInfo",BufferInfo);
         _cacheInfoArr = [];
         for each(_loc2_ in rest)
         {
            parseItemXMLList(_loc2_);
         }
         _loc3_ = new ByteArray();
         _loc3_.writeObject(_cacheInfoArr);
         _loc3_.compress();
         return _loc3_;
      }
      
      private static function parseItemXMLList(param1:XML) : void
      {
         var _loc2_:XML = null;
         var _loc3_:BufferInfo = null;
         var _loc4_:XMLList = _xml.descendants("bitbuff");
         var _loc5_:XMLList = _xml.descendants("pro");
         for each(_loc2_ in _loc4_)
         {
            _loc3_ = new BufferInfo();
            _loc3_.bitindex = _loc2_.@bitindex;
            _loc3_.id = _loc2_.@id;
            _loc3_.isbitbuff = true;
            _cacheInfoArr.push(_loc3_);
            _bitbuffDic[_loc3_.id] = _loc3_;
         }
         for each(_loc2_ in _loc5_)
         {
            _loc3_ = new BufferInfo();
            _loc3_.bitindex = _loc2_.@bitindex;
            _loc3_.isbitbuff = false;
            _loc3_.id = _loc2_.@id;
            _proDic[_loc3_.id] = _loc3_;
            _cacheInfoArr.push(_loc3_);
         }
      }
   }
}

