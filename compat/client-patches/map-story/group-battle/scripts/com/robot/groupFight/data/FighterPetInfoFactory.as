package com.robot.groupFight.data
{
   import com.robot.app.group.FightMapBlockBg;
   import com.robot.core.group.event.GroupFightEvent;
   import com.robot.core.group.fightInfo.startFight.GroupFightPetInfo;
   import com.robot.core.group.fightInfo.startFight.GroupFightStartInfo;
   import com.robot.core.manager.MainManager;
   import com.robot.groupFight.manager.GroupArrayManager;
   import org.taomee.ds.HashMap;
   import org.taomee.manager.EventManager;
   
   public class FighterPetInfoFactory
   {
      
      public static var fighterMap:HashMap;
      
      public static var membMap:HashMap;
      
      public static var opponentMap:HashMap;
      
      public static var playerFtPetInfo:GroupFightPetInfo;
      
      public static var gfUserInfo:GroupFightUserInfo;
      
      private static var pointMap:HashMap;
      
      private static var oppPetList:Array = [];
      
      public function FighterPetInfoFactory()
      {
         super();
      }
      
      public static function setup(data:GroupFightStartInfo) : void
      {
         var info:GroupFightPetInfo = null;
         fighterMap = new HashMap();
         membMap = new HashMap();
         opponentMap = new HashMap();
         gfUserInfo = new GroupFightUserInfo();
         pointMap = FightMapBlockBg.pointMap;
         for each(info in data.groupOneList)
         {
            if(info.userID == MainManager.actorID)
            {
               playerFtPetInfo = info;
               addData(data);
               return;
            }
         }
         addOppData(data);
      }
      
      private static function addData(data:GroupFightStartInfo) : void
      {
         var info:GroupFightPetInfo = null;
         var gcnt:uint = 0;
         var ginfo:GroupFightPetInfo = null;
         var pos:String = null;
         var gpos:String = null;
         var cnt:uint = data.groupOneList.length + data.groupTwoList.length - 1;
         for each(info in data.groupOneList)
         {
            pos = GroupArrayManager.rightNormalArr[info.pos][0] + "_" + GroupArrayManager.rightNormalArr[info.pos][1];
            info.point = pointMap.getValue(pos);
            info.index = cnt;
            info.isMember = true;
            membMap.add(info.userID,info);
            fighterMap.add(info.userID,info);
            cnt--;
         }
         gcnt = uint(data.groupTwoList.length);
         for each(ginfo in data.groupTwoList)
         {
            gpos = GroupArrayManager.leftNormalArr[ginfo.pos][0] + "_" + GroupArrayManager.leftNormalArr[ginfo.pos][1];
            ginfo.point = pointMap.getValue(gpos);
            ginfo.index = gcnt;
            opponentMap.add(ginfo.userID,ginfo);
            fighterMap.add(ginfo.userID,ginfo);
            oppPetList.push(ginfo.petID);
            gcnt--;
         }
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.OPP_FIGHTER_PET_LIST,oppPetList));
      }
      
      private static function addOppData(data:GroupFightStartInfo) : void
      {
         var info:GroupFightPetInfo = null;
         var gcnt:uint = 0;
         var ginfo:GroupFightPetInfo = null;
         var pos:String = null;
         var gpos:String = null;
         var cnt:uint = uint(data.groupOneList.length);
         for each(info in data.groupOneList)
         {
            pos = GroupArrayManager.leftNormalArr[info.pos][0] + "_" + GroupArrayManager.leftNormalArr[info.pos][1];
            info.point = pointMap.getValue(pos);
            info.index = cnt;
            opponentMap.add(info.userID,info);
            fighterMap.add(info.userID,info);
            cnt--;
         }
         gcnt = data.groupOneList.length + data.groupTwoList.length - 1;
         for each(ginfo in data.groupTwoList)
         {
            gpos = GroupArrayManager.rightNormalArr[ginfo.pos][0] + "_" + GroupArrayManager.rightNormalArr[ginfo.pos][1];
            ginfo.point = pointMap.getValue(gpos);
            ginfo.index = gcnt;
            ginfo.isMember = true;
            membMap.add(ginfo.userID,ginfo);
            fighterMap.add(ginfo.userID,ginfo);
            oppPetList.push(ginfo.petID);
            gcnt--;
         }
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.OPP_FIGHTER_PET_LIST,oppPetList));
      }
      
      public static function addMembData(info:GroupFightPetInfo) : void
      {
         membMap.add(info.userID,info);
         fighterMap.add(info.userID,info);
      }
      
      public static function removeMembData(info:GroupFightPetInfo) : void
      {
         membMap.remove(info.userID);
         fighterMap.remove(info.userID);
      }
      
      public static function addOpponentData(info:GroupFightPetInfo) : void
      {
         opponentMap.add(info.userID,info);
         fighterMap.add(info.userID,info);
      }
      
      public static function removeOpponentData(info:GroupFightPetInfo) : void
      {
         opponentMap.remove(info.userID);
         fighterMap.remove(info.userID);
      }
      
      public static function clear() : void
      {
         fighterMap = null;
         membMap = null;
         opponentMap = null;
         playerFtPetInfo = null;
         gfUserInfo = null;
         oppPetList = [];
         pointMap = null;
      }
      
      public static function checkIsPetAllDie() : uint
      {
         for each(var pet:Object in gfUserInfo.monInfoMap.getValues())
         {
            if(pet.hp > 0) return uint(pet.catchTime);
         }
         EventManager.dispatchEvent(new GroupFightEvent(GroupFightEvent.NO_FIGHT_PET));
         return 0;
      }
   }
}

