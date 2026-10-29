package com.robot.groupFight.data
{
   import com.robot.core.manager.MainManager;
   import com.robot.groupFight.mode.BaseGroupFighterModel;
   import com.robot.groupFight.mode.PlayerGroupFighterModel;
   import com.robot.groupFight.view.BaseFighterPetWin;
   import org.taomee.ds.HashMap;
   
   public class FighterModelFactory
   {
      
      public static var playerMode:PlayerGroupFighterModel;
      
      public static var gpRdyToFtUsInfoMap:HashMap = new HashMap();
      
      public static var invitorID:uint = 1;
      
      public static var fighterModelMap:HashMap = new HashMap();
      
      public static var allPetWinList:Array = [];
      
      public static var membPetWinList:Array = [];
      
      public static var oppPetWinList:Array = [];
      
      public function FighterModelFactory()
      {
         super();
      }
      
      public static function addModel(sidePos:String, model:BaseGroupFighterModel) : void
      {
         fighterModelMap.add(sidePos,model);
         if(model.info.userID == MainManager.actorID)
         {
            if(model is PlayerGroupFighterModel)
            {
               playerMode = model as PlayerGroupFighterModel;
            }
         }
      }
      
      public static function removeModel(sidePos:String) : void
      {
         fighterModelMap.remove(sidePos);
      }
      
      public static function clear() : void
      {
         fighterModelMap.clear();
         gpRdyToFtUsInfoMap.clear();
         playerMode = null;
         allPetWinList = [];
         membPetWinList = [];
         oppPetWinList = [];
      }
      
      public static function addPetWin(win:BaseFighterPetWin, isMemb:Boolean = true) : void
      {
         removePetWin(win);
         if(isMemb)
         {
            membPetWinList.push(win);
         }
         else
         {
            oppPetWinList.push(win);
         }
         allPetWinList.push(win);
      }
      
      public static function removePetWin(win:BaseFighterPetWin) : void
      {
         removePetWinInArr(win,allPetWinList);
         removePetWinInArr(win,membPetWinList);
         removePetWinInArr(win,oppPetWinList);
      }
      
      private static function removePetWinInArr(win:BaseFighterPetWin, arr:Array) : void
      {
         var i:int = arr.indexOf(win);
         if(i != -1)
         {
            arr.splice(i,1);
         }
      }
   }
}

