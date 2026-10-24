package com.robot.module.app.taskRecord.menu
{
   public class NodeDataReader
   {
      
      private var _xml:XML;
      
      public function NodeDataReader(xml:XML)
      {
         super();
         _xml = xml;
      }
      
      private function readNodeData() : Array
      {
         var xml:XML = null;
         var arr:Array = null;
         var arr1:Array = null;
         var arr2:Array = null;
         var arr3:Array = null;
         var reader:NodeDataReader = null;
         var rAr:Array = [];
         for each(xml in _xml["task"])
         {
            reader = new NodeDataReader(xml);
            rAr.push(reader.read());
         }
         if(String(_xml.@itemtype) == "2" && String(_xml.@starid) != "")
         {
            return rAr;
         }
         arr = rAr.sortOn("offline",Array.NUMERIC | Array.DESCENDING);
         arr1 = arr.sortOn("newOnline",Array.NUMERIC);
         arr2 = arr1.sortOn("id",Array.NUMERIC | Array.DESCENDING);
         return arr2.sortOn("onlineData",Array.NUMERIC | Array.DESCENDING);
      }
      
      public function read() : NodeData
      {
         var nodeData:NodeData = new NodeData();
         nodeData.id = _xml.@id;
         nodeData.energy = _xml.@energy;
         nodeData.icon = _xml.@icon;
         nodeData.intro = _xml.@intro;
         nodeData.itemtype = _xml.@itemtype;
         nodeData.mapId = _xml.@mapId;
         nodeData.name = _xml.@name;
         nodeData.tip = _xml.@tip;
         nodeData.stopDes = _xml.@stopDes;
         nodeData.startDes = _xml.@startDes;
         nodeData.starlevel = _xml.@starlevel;
         nodeData.spanlevel = _xml.@spanlevel;
         nodeData.pet = _xml.@pet;
         nodeData.parentId = _xml.@parentId;
         nodeData.outPut = _xml.@outPut;
         nodeData.onlineData = _xml.@onlineData;
         nodeData.offline = _xml.@offline;
         nodeData.npc = _xml.@npc;
         nodeData.newOnline = _xml.@newOnline;
         nodeData.starid = _xml.@starid;
         nodeData.isVip = _xml.@isVip;
         nodeData.nodeDataArray = readNodeData();
         return nodeData;
      }
   }
}

