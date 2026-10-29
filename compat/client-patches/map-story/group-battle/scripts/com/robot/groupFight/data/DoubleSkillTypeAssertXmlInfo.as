package com.robot.groupFight.data
{
   import flash.utils.Dictionary;
   
   public class DoubleSkillTypeAssertXmlInfo
   {
      
      private static var SkillAssert:Class = DoubleSkillTypeAssertXmlInfo_SkillAssert;
      
      private static var SKILL_ASSERT_XML:XML = XML(new SkillAssert());
      
      private static var assertMap:Dictionary = new Dictionary();
      
      private static var flag:Boolean = false;
      
      public function DoubleSkillTypeAssertXmlInfo()
      {
         super();
      }
      
      private static function parseInfo() : void
      {
         var assertxml:XML = null;
         var assertlist:XMLList = SKILL_ASSERT_XML.elements("Item");
         for each(assertxml in assertlist)
         {
            assertMap[String(assertxml.@OldUrl)] = String(assertxml.@NewUrl);
         }
      }
      
      public static function getNewUrl(key:String) : String
      {
         var arr:Array = null;
         var o:String = null;
         if(!flag)
         {
            parseInfo();
            flag = true;
         }
         if(Boolean(assertMap[key]))
         {
            return assertMap[key];
         }
         arr = key.split("_");
         for each(o in assertMap)
         {
            if(arr[0] == o)
            {
               return arr[0];
            }
            if(arr[1] == o)
            {
               return arr[1];
            }
         }
         return key;
      }
   }
}

