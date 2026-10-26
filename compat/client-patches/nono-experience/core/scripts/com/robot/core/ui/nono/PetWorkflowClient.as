package com.robot.core.ui.nono
{
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.PetManager;
   import com.robot.core.net.SocketConnection;
   import flash.events.Event;
   import flash.utils.ByteArray;
   import flash.utils.clearTimeout;
   import flash.utils.setTimeout;
   import flash.utils.getTimer;
   import org.taomee.events.SocketEvent;
   import org.taomee.events.SocketErrorEvent;
   import org.taomee.net.SocketDispatcher;

   public class PetWorkflowClient
   {
      private static var pending:Object = {};
      private static var sequence:uint = 0;
      private static var listening:Boolean = false;
      public static var inBattle:Boolean = false;

      public static function busy(command:uint):Boolean { return pending[command] != null; }

      public static function request(command:uint,input:Object,callback:Function):Boolean
      {
         if(busy(command))return false;
         if(!listening){SocketDispatcher.getInstance().addEventListener(SocketErrorEvent.ERROR,onError);listening=true;}
         var id:String = MainManager.actorID+":"+getTimer()+":"+(++sequence);
         input.version=1;input.requestId=id;
         var job:Object={id:id,actor:MainManager.actorID,callback:callback,command:command};
         job.listener=function(event:SocketEvent):void{receive(job,event);};
         pending[command]=job;
         SocketConnection.addCmdListener(command,job.listener);
         job.socket=SocketConnection.mainSocket;
         job.closed=function(event:Event):void{finish(job,{ok:false,uncertain:true,error:"连接已断开，请重新读取实际状态；不会自动重试。"});};
         job.socket.addEventListener(Event.CLOSE,job.closed);
         job.timeout=setTimeout(function():void{finish(job,{ok:false,uncertain:true,error:"未收到结果，请刷新实际状态；不会自动重试。"});},8000);
         var bytes:ByteArray=new ByteArray();bytes.writeUTFBytes(JSON.stringify(input));
         try { SocketConnection.send(command,bytes); }
         catch(error:Error){finish(job,{ok:false,uncertain:true,error:"请求未确认，请重新读取实际状态。"});}
         return true;
      }

      private static function receive(job:Object,event:SocketEvent):void
      {
         if(pending[job.command]!==job)return;
         try {
            var bytes:ByteArray=event.data as ByteArray;
            if(bytes==null||bytes.bytesAvailable<8)throw new Error("Incomplete workflow response");
            var length:uint=bytes.readUnsignedInt();
            if(length>bytes.bytesAvailable-4)throw new Error("Invalid workflow length");
            var value:Object=JSON.parse(bytes.readUTFBytes(length));
            if(value.requestId!==job.id)return;
            if(value.version!==1)throw new Error("Workflow version changed");
            var count:uint=bytes.readUnsignedInt();
            if(count>6)throw new Error("Invalid workflow bag size");
            if(job.actor==MainManager.actorID&&count>0)PetManager.replaceBagSnapshot(bytes,count);
            finish(job,value);
         } catch(error:Error) { finish(job,{ok:false,uncertain:true,error:"响应不完整，请刷新实际状态；不会自动重试。"}); }
      }

      private static function finish(job:Object,value:Object):void
      {
         if(pending[job.command]!==job)return;
         clearTimeout(job.timeout);
         SocketConnection.removeCmdListener(job.command,job.listener);
         job.socket.removeEventListener(Event.CLOSE,job.closed);
         delete pending[job.command];
         if(job.actor==MainManager.actorID)job.callback(value);
      }

      private static function onError(event:SocketErrorEvent):void
      {
         if(event.headInfo==null)return;
         var job:Object=pending[event.headInfo.cmdID];
         if(job!=null)finish(job,{ok:false,uncertain:true,error:"服务未确认操作，请重新读取实际状态。"});
      }
   }
}
