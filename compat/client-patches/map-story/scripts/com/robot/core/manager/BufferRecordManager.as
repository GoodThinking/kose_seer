package com.robot.core.manager
{
   import com.robot.core.CommandID;
   import com.robot.core.config.xml.BufferRecordConfig;
   import com.robot.core.info.UserInfo;
   import com.robot.core.net.SocketConnection;
   import com.robot.core.net.SocketLoader;
   import com.robot.core.ui.alert.Alarm;
   import flash.events.Event;
   import flash.events.EventDispatcher;
   import flash.utils.ByteArray;
   import org.taomee.events.SocketErrorEvent;
   import org.taomee.events.SocketEvent;
   import org.taomee.net.SocketDispatcher;

   public class BufferRecordManager
   {
      private static const LENGTH:uint = 1600;
      public static const VALUE_CHANGE:String = "value_change";
      private static var _instance:EventDispatcher;
      private static var _pending:Array = [];
      private static var _current:Object;
      private static var _loader:SocketLoader;

      public static function getState(info:UserInfo, recordID:uint) : Boolean
      {
         return info.bufferRecordArr[uint(BufferRecordConfig.getBitIndexByID(recordID))];
      }

      public static function getMyState(recordID:uint) : Boolean
      {
         return getState(MainManager.actorInfo,recordID);
      }

      public static function setMyState(recordID:uint, value:Boolean, callback:* = null) : void
      {
         setState(MainManager.actorInfo,recordID,value,callback);
      }

      public static function setState(info:UserInfo, recordID:uint, value:Boolean, callback:* = null) : void
      {
         var index:uint = uint(BufferRecordConfig.getBitIndexByID(recordID));
         if(index >= LENGTH)
         {
            throw new Error("bitIndex 不能超过" + LENGTH + "，检查bufferrecord.xml文件");
         }
         var bytes:ByteArray = new ByteArray();
         bytes.writeUnsignedInt(1);
         bytes.writeUnsignedInt(index);
         bytes.writeUnsignedInt(value ? 1 : 0);
         enqueue(info,bytes,callback as Function);
      }

      public static function setStates(info:UserInfo, recordIDs:Array, values:Array, callback:* = null) : void
      {
         if(recordIDs.length == 0 || recordIDs.length != values.length)
         {
            throw new Error("bit位对应的bool的值不对应，请检查");
         }
         var bytes:ByteArray = new ByteArray();
         bytes.writeUnsignedInt(recordIDs.length);
         for(var i:uint = 0; i < recordIDs.length; i++)
         {
            var index:uint = uint(BufferRecordConfig.getBitIndexByID(recordIDs[i]));
            if(index >= LENGTH || !(values[i] == 1 || values[i] == 0))
            {
               throw new Error("无效的剧情记录bit位或布尔值");
            }
            bytes.writeUnsignedInt(index);
            bytes.writeUnsignedInt(uint(values[i]));
         }
         enqueue(info,bytes,callback as Function);
      }

      private static function enqueue(info:UserInfo, bytes:ByteArray, callback:Function) : void
      {
         _pending.push({info:info,bytes:bytes,callback:callback});
         sendNext();
      }

      private static function sendNext() : void
      {
         if(_current != null || _pending.length == 0)
         {
            return;
         }
         _current = _pending.shift();
         _loader = new SocketLoader(CommandID.BUFFERRECORD);
         _loader.addEventListener(SocketEvent.COMPLETE,onRecordSaved);
         SocketDispatcher.getInstance().addEventListener(SocketErrorEvent.ERROR,onRecordError,false,int.MAX_VALUE);
         SocketConnection.mainSocket.addEventListener(Event.CLOSE,onDisconnect);
         try
         {
            _loader.load(_current.bytes);
         }
         catch(error:Error)
         {
            _pending.length = 0;
            releaseCurrent();
            if(SocketConnection.mainSocket.connected)
            {
               Alarm.show("剧情机关进度保存失败，请重新进入地图后重试。");
            }
            throw error;
         }
      }

      private static function releaseCurrent() : void
      {
         SocketDispatcher.getInstance().removeEventListener(SocketErrorEvent.ERROR,onRecordError);
         SocketConnection.mainSocket.removeEventListener(Event.CLOSE,onDisconnect);
         if(_loader != null)
         {
            _loader.removeEventListener(SocketEvent.COMPLETE,onRecordSaved);
            _loader.destroy();
            _loader = null;
         }
         _current = null;
      }

      private static function onRecordSaved(event:SocketEvent) : void
      {
         var job:Object = _current;
         releaseCurrent();
         var bytes:ByteArray = job.bytes as ByteArray;
         bytes.position = 0;
         var count:uint = bytes.readUnsignedInt();
         for(var i:uint = 0; i < count; i++)
         {
            var index:uint = bytes.readUnsignedInt();
            job.info.bufferRecordArr[index] = bytes.readUnsignedInt() != 0;
         }
         try
         {
            if(job.callback != null)
            {
               job.callback();
            }
            dispatchEvent(new Event(VALUE_CHANGE));
         }
         finally
         {
            sendNext();
         }
      }

      private static function onRecordError(event:SocketErrorEvent) : void
      {
         if(event.headInfo != null && event.headInfo.cmdID == CommandID.BUFFERRECORD)
         {
            releaseCurrent();
            sendNext();
         }
      }

      private static function onDisconnect(event:Event) : void
      {
         _pending.length = 0;
         releaseCurrent();
      }

      private static function getInstance() : EventDispatcher
      {
         if(_instance == null)
         {
            _instance = new EventDispatcher();
         }
         return _instance;
      }

      public static function addEventListener(type:String, listener:Function, useCapture:Boolean = false, priority:int = 0, useWeakReference:Boolean = false) : void
      {
         getInstance().addEventListener(type,listener,useCapture,priority,useWeakReference);
      }

      public static function removeEventListener(type:String, listener:Function, useCapture:Boolean = false) : void
      {
         getInstance().removeEventListener(type,listener,useCapture);
      }

      public static function dispatchEvent(event:Event) : void
      {
         getInstance().dispatchEvent(event);
      }

      public static function hasEventListener(type:String) : Boolean
      {
         return getInstance().hasEventListener(type);
      }
   }
}
