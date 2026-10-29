package com.robot.core.config.xml
{
   import org.taomee.ds.HashMap;
   
   public class GpFtRelationXMLInfo
   {
      
      private static var _hashMap:HashMap;
      
      private static var _xml:XML;
      
      private static var _xmllist:XMLList;
      
      private static var relationData:XML = <MonRelations>
	<Relation ID="1" MonID="1 4 7" WorkCnt="3" Name="好伙伴" Color="0xFF0000"/>
	<Relation ID="2" MonID="301 304 307" WorkCnt="3" Name="好伙伴" Color="0x760101"/>
	<Relation ID="3" MonID="62 108" WorkCnt="2" Name="亲密无间" Color="0xFE8989"/>
	<Relation ID="4" MonID="164 284 310 409 442" WorkCnt="3" Name="闪光一家" Color="0xFDE302"/>
	<Relation ID="5" MonID="70 261" WorkCnt="2" Name="宿敌" Color="0x06E1F9"/>
	<Relation ID="6" MonID="22 232 265" WorkCnt="3" Name="摇滚三人组" Color="0xFF9900"/>
	<Relation ID="7" MonID="59 102 143" WorkCnt="3" Name="赫尔卡三塔" Color="0x666666"/>
	<Relation ID="8" MonID="445 448" WorkCnt="2" Name="天生一对" Color="0xFF6699"/>
	<Relation ID="9" MonID="412 273 390" WorkCnt="3" Name="龙族三巨头" Color="0x01017E"/>
	<Relation ID="10" MonID="77 416" WorkCnt="2" Name="兄弟" Color="0xFF00FF"/>
</MonRelations>;
      
      setup();
      
      public function GpFtRelationXMLInfo()
      {
         super();
      }
      
      private static function setup() : void
      {
         var _loc1_:XML = null;
         _xml = relationData;
         _hashMap = new HashMap();
         _xmllist = _xml.Relation;
         for each(_loc1_ in _xmllist)
         {
            _hashMap.add(uint(_loc1_.@ID),_loc1_);
         }
         _xmllist = null;
         _xml = null;
         relationData = null;
      }
      
      public static function getRelationColor(param1:uint) : uint
      {
         var _loc2_:XML = _hashMap.getValue(param1);
         if(Boolean(_loc2_) && _loc2_.hasOwnProperty("@Color"))
         {
            return uint(_loc2_.@Color);
         }
         return 0;
      }
   }
}

