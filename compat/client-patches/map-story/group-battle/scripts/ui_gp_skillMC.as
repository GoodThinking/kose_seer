package
{
   import flash.display.MovieClip;
   import flash.text.TextField;
   
   [Embed(source="/_assets/assets.swf", symbol="symbol465")]
   public dynamic class ui_gp_skillMC extends MovieClip
   {
      
      public var name_txt:TextField;
      
      public var pp_txt:TextField;
      
      public var iconMC:GpSkillProIcon;
      
      public var damage_txt:TextField;
      
      public var bgMC:MovieClip;
      
      public function ui_gp_skillMC()
      {
         super();
         addFrameScript(0,this.frame1);
      }
      
      internal function frame1() : *
      {
         stop();
      }
   }
}

