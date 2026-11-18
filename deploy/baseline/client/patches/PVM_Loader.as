package com.taomee.pandaVersion
{
   import com.common.byteLoader.ByteLoader;
   import com.common.byteLoader.ByteLoaderEvent;
   import com.common.util.LoaderUtil;
   import flash.events.Event;
   import flash.events.EventDispatcher;
   import flash.net.URLRequest;
   import flash.utils.ByteArray;
   import flash.utils.Dictionary;

   public class PVM_Loader extends EventDispatcher implements IPVM_Loader
   {
      private var _auoLoadBody:Boolean = false;
      private var hasHeaderloaded:Boolean = false;
      private var _fileURL:String;
      private var _newURL:String;
      private var _headerFileDic:Dictionary = new Dictionary();
      private var _versionNameSpace:String;
      private var _HeaderCount:uint;
      private var _lastAmendTime:uint;
      private var fileLoader:ByteLoader;
      public var BC_List:Object;

      public function PVM_Loader(versionNameSpace:String, auoLoadBody:Boolean = false)
      {
         super();
         _versionNameSpace = versionNameSpace;
         _auoLoadBody = auoLoadBody;
      }

      private function _ioErrorFun(E:Event) : void
      {
         dispatchEvent(new PVM_Event(PVM_Event.ON_LOAD_ERROR));
      }

      private function parseHeader() : void
      {
         _lastAmendTime = fileLoader.readUnsignedInt();
         _HeaderCount = fileLoader.readShort();
         _headerFileDic = new Dictionary();
         for(var i:int = 0; i < _HeaderCount; i++)
         {
            _headerFileDic[fileLoader.readUTFBytes(20)] = fileLoader.readUnsignedInt();
         }
      }

      private function _onComplete(E:Event) : void
      {
         BC.removeEvent(this);
         parseHeader();
         var version:PVM = PVM.getInstance(_versionNameSpace);
         if(!hasHeaderloaded)
         {
            hasHeaderloaded = true;
            _newURL = _fileURL + (_fileURL.indexOf("?") > -1 ? "&" : "?") + _lastAmendTime;
            version.flushHeader(_lastAmendTime, _headerFileDic);
            dispatchEvent(new PVM_Event(PVM_Event.ON_HEADER_AMEND_LOADED));
            dispatchEvent(new PVM_Event(PVM_Event.ON_HEADER_LOADED));
            if(_auoLoadBody)
            {
               loadBody();
            }
            return;
         }
         var body:ByteArray = new ByteArray();
         fileLoader.readBytes(body);
         body.position = 0;
         body.uncompress();
         version.flushBady(body.readObject());
         dispatchEvent(new PVM_Event(PVM_Event.ON_LOADED));
      }

      private function _onTimeoutFun(E:ByteLoaderEvent) : void
      {
         fileLoader.reTry();
         dispatchEvent(new PVM_Event(PVM_Event.ON_LOAD_TIMEOUT));
      }

      private function loadRequest(url:String) : void
      {
         // Parse only complete buffers, and do not reuse a URLStream inside its events.
         fileLoader = new ByteLoader(true);
         LoaderUtil.addLoaderEvents(this, fileLoader, _onComplete, _ioErrorFun);
         BC.addEvent(this, fileLoader, ByteLoaderEvent.ON_TIME_OUT, _onTimeoutFun);
         fileLoader.load(new URLRequest(url));
      }

      public function load(fileURL:String) : void
      {
         _fileURL = fileURL;
         hasHeaderloaded = false;
         loadRequest(_fileURL + (_fileURL.indexOf("?") > -1 ? "&" : "?") + int(Math.random() * 10000000));
      }

      public function loadBody() : void
      {
         if(!hasHeaderloaded)
         {
            throw "必须HEADER部分加载完成后才能对BODY进行加载.";
         }
         loadRequest(_newURL);
      }

      public function get byteLoader() : ByteLoader
      {
         return fileLoader;
      }

      public function close() : void
      {
         BC.removeEvent(this);
         fileLoader.close();
      }
   }
}
