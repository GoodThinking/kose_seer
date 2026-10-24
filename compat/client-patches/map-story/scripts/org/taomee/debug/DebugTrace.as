package org.taomee.debug
{
   public class DebugTrace
   {
      
      public function DebugTrace()
      {
         super();
      }
      
      public static function show(... rest) : int
      {
         var _loc2_:String = "";
         var _loc3_:int = 0;
         while(_loc3_ < rest.length)
         {
            if(_loc3_ > 0)
            {
               _loc2_ += " ";
            }
            _loc2_ += rest[_loc3_];
            _loc3_++;
         }
         return 1;
      }
   }
}

