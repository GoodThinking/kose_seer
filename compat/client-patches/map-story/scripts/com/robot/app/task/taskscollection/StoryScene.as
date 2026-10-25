package com.robot.app.task.taskscollection
{
   import com.robot.app.ogre.OgreController;
   import com.robot.app.toolBar.ToolBarController;
   import com.robot.core.manager.LevelManager;
   import com.robot.core.manager.MainManager;
   import com.robot.core.manager.map.config.BaseMapProcess;
   import com.robot.core.manager.map.config.MapProcessConfig;
   import com.robot.core.mode.OgreModel;
   import flash.display.DisplayObject;
   import flash.display.MovieClip;

   // A chapter restores only state that this scene changed; late callbacks cannot touch a new map.
   public class StoryScene
   {
      private var _owner:BaseMapProcess;
      private var _disposed:Boolean;
      private var _inputLocked:Boolean;
      private var _usersHidden:Boolean;
      private var _ogresHidden:Boolean;
      private var _ogresWereVisible:Boolean;
      private var _actor:DisplayObject;
      private var _pet:DisplayObject;
      private var _actorWasVisible:Boolean;
      private var _petWasVisible:Boolean;

      public function StoryScene(owner:BaseMapProcess)
      {
         _owner = owner;
      }

      public function get active() : Boolean
      {
         return !_disposed && _owner != null && MapProcessConfig.currentProcessInstance === _owner;
      }

      public function setScene(movie:MovieClip, visible:Boolean = false, frame:uint = 1, showUsers:Boolean = true, showSelf:Boolean = true, showOgres:Boolean = true) : void
      {
         if(!active) return;
         movie.visible = visible;
         movie.gotoAndStop(frame);
         if(!showUsers)
         {
            _usersHidden = true;
            ToolBarController.showOrHideAllUser(false);
         }
         else if(_usersHidden)
         {
            _usersHidden = false;
            ToolBarController.showOrHideAllUser(true);
         }
         if(!showSelf) hideActors();
         else restoreActors();
         if(!showOgres && !_ogresHidden)
         {
            _ogresWereVisible = OgreModel.isShow;
            _ogresHidden = true;
            OgreController.isShow = false;
         }
      }

      public function hideActors() : void
      {
         if(!active || _actor != null) return;
         _actor = MainManager.actorModel;
         _actorWasVisible = _actor.visible;
         _actor.visible = false;
         _pet = MainManager.actorModel.pet;
         if(_pet != null)
         {
            _petWasVisible = _pet.visible;
            _pet.visible = false;
         }
      }

      public function restoreActors() : void
      {
         if(_actor != null) _actor.visible = _actorWasVisible;
         if(_pet != null) _pet.visible = _petWasVisible;
         _actor = null;
         _pet = null;
      }

      public function lockInput() : void
      {
         if(!active || _inputLocked) return;
         _inputLocked = true;
         LevelManager.closeMouseEvent();
      }

      public function unlockInput() : void
      {
         if(!_inputLocked) return;
         _inputLocked = false;
         LevelManager.openMouseEvent();
      }

      public function releaseState() : void
      {
         unlockInput();
         restoreActors();
         if(_usersHidden)
         {
            _usersHidden = false;
            ToolBarController.showOrHideAllUser(true);
         }
         if(_ogresHidden)
         {
            _ogresHidden = false;
            OgreController.isShow = _ogresWereVisible;
         }
      }

      public function dispose() : void
      {
         if(_disposed) return;
         releaseState();
         _disposed = true;
         _owner = null;
      }
   }
}
