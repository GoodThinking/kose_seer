package
{
   import flash.display.MovieClip;
   import flash.text.TextField;
   
   [Embed(source="/_assets/assets.swf", symbol="symbol215")]
   public dynamic class SkillNameMC extends MovieClip
   {
      
      public var txt:TextField;
      
      public function SkillNameMC()
      {
         super();
         addFrameScript(0,this.frame1,4,this.frame5,44,this.frame45,49,this.frame50);
      }
      
      internal function frame1() : *
      {
         stop();
         this.txt.visible = false;
      }
      
      internal function frame5() : *
      {
         this.txt.visible = true;
      }
      
      internal function frame45() : *
      {
         this.txt.visible = false;
      }
      
      internal function frame50() : *
      {
         stop();
      }
   }
}

