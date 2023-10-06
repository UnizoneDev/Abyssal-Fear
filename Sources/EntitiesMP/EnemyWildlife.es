/* Copyright (c) 2021-2023 Uni Musuotankarep.
This program is free software; you can redistribute it and/or modify
it under the terms of version 2 of the GNU General Public License as published by
the Free Software Foundation


This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License along
with this program; if not, write to the Free Software Foundation, Inc.,
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA. */

1026
%{
#include "StdH.h"
extern void JumpFromBouncer(CEntity *penToBounce, CEntity *penBouncer);
%}

uses "EntitiesMP/EnemyBase";
uses "EntitiesMP/WildlifeFood";

%{

%}


class export CEnemyWildlife : CEnemyBase {
name      "Enemy Wildlife";
thumbnail "";

properties:
  1 INDEX m_iFullFromHunger = 0,			            // Did I eat enough food?
  2 BOOL m_bWantsFood = FALSE,

components:
  1 class   CLASS_BASE    "Classes\\EnemyBase.ecl",


functions:

/////////////////////////
//  Utility Functions  //
/////////////////////////

BOOL CheckIfFull(void)
{
  if(m_iFullFromHunger > 5) {
    m_bWantsFood = FALSE;
    return TRUE;
  } else {
    return FALSE;
  }
}

virtual void EatingAnim(void) {};
virtual void DrinkingAnim(void) {};
virtual void EatingSound(void) {};
virtual void DrinkingSound(void) {};

/////////////////////////
//  Main AI Functions  //
/////////////////////////

  // --------------------------------------------------------------------------------------
  // Check if we maybe switch to some other food (for hungry beasts not just in coop).
  // --------------------------------------------------------------------------------------
  void MaybeSwitchToAnotherFood(void)
  {
    // if full of food
    if(CheckIfFull()) {
      return;
    }

    // If current player is inside threat distance then do not switch.
    if ( IsOfClass(m_penEnemy, "Player") || IsDerivedFromClass(m_penEnemy, "Enemy Base") ) {
      if (CalcDist(m_penEnemy) < GetThreatDistance()) {
        return;
      }
    }

    // maybe switch
    CEntity *penNewEnemy = GetWatcher()->CheckAnotherFood(m_penEnemy);
    if (penNewEnemy!=m_penEnemy && penNewEnemy != NULL) {
      m_penEnemy = penNewEnemy;
      SendEvent(EReconsiderBehavior());
    }
  }

  // --------------------------------------------------------------------------------------
  // Check if an entity is valid for being your new enemy.
  // --------------------------------------------------------------------------------------
  BOOL IsValidForEnemy(CEntity *penNewTarget)
  {
    // nothing is not allowed
    if (penNewTarget == NULL)
    {
      return FALSE;
    }

    // don't target the dead
    if (!(penNewTarget->GetFlags()&ENF_ALIVE))
    {
      return FALSE;
    }

    if (IsOfClass(penNewTarget, "Player"))
    {
      if((this->GetFaction() == FT_ALLY) || (this->GetFaction() == FT_VICTIM))
      {
        return FALSE;
      }

      return TRUE;
    }

    if (IsDerivedFromClass(penNewTarget, "Enemy Base")) {
      CEnemyBase &enEB = (CEnemyBase&)*penNewTarget;

      // don't target templates
      if (enEB.m_bTemplate) {
        return FALSE;
      }

      // don't target if the faction is not valid
      if(!enEB.IsFactionValid())
      {
        return FALSE;
      }

      // don't target your allies
      if(enEB.GetFaction() == this->GetFaction())
      {
        return FALSE;
      }

      // make exceptions for targets
      if((enEB.GetFaction() == FT_SHADOW) || (enEB.GetFaction() == FT_WILDLIFE))
      {
        return FALSE;
      }

      if((this->GetFaction() == FT_WILDLIFE || this->GetFaction() == FT_SHADOW) && (enEB.GetFaction() == FT_LESSER || enEB.GetFaction() == FT_GREATER))
      {
        return FALSE;
      }

      return TRUE;
    }

    if (IsOfClass(penNewTarget, "Wildlife Food")  && !CheckIfFull())
    {
      m_bWantsFood = TRUE;
      return TRUE;
    }

    return FALSE;
  }

procedures:

/************************************************************
 *                M  A  I  N    L  O  O  P                  *
 ************************************************************/

  Die(EDeath eDeath) : CEnemyBase::Die {
    jump CEnemyBase::Die(eDeath);
  };

  // main loop
  MainLoop(EVoid) : CEnemyBase::MainLoop {
    jump CEnemyBase::MainLoop();
  };

  // dummy main
  Main(EVoid) {
    return;
  };

  EatFood(EVoid)
  {
    // if we touched food and are hungry
    if (IsOfClass(m_penEnemy, "Wildlife Food") && !CheckIfFull())
    {
      if(!CheckIfFull()) {
        StopMoving();
        EatingAnim();
        autowait(0.2f);
        EatingSound();
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, GetPlacement().pl_PositionVector, -en_vGravityDir, DBPT_GENERIC);
        autowait(0.4f);
        m_iFullFromHunger++;
      }
    }
  }

  FindFood(EVoid)
  {
    if(!IsOfClass(m_penEnemy, "Wildlife Food")) {
      return EReturn();
    }

    // if the food is dead or deleted
    if (!(m_penEnemy->GetFlags()&ENF_ALIVE) || m_penEnemy->GetFlags()&ENF_DELETED) {
      return EReturn();
    }

    m_vDesiredPosition = m_penEnemy->GetPlacement().pl_PositionVector;
    m_fMoveFrequency = 0.1f;

    while (TRUE)
    {
      // adjust direction and speed
      m_fMoveSpeed = m_fCloseRunSpeed;
      m_aRotateSpeed = m_aCloseRotateSpeed;
      FLOAT3D vTranslation = GetDesiredTranslation();
      SetDesiredMovement(); 
      SetDesiredTranslation(vTranslation);

      wait(m_fMoveFrequency)
      {
        on (EBegin) : { resume; };
        on (ESound) : { resume; }     // ignore all sounds
        on (EWatch) : { resume; }     // ignore watch
        on (ETimer) : { stop; }       // timer tick expire
        on (ETouch etouch) :
        {
          // if we touched food, then eat it
          if ( IsDerivedFromClass( etouch.penOther, "Wildlife Food") && !CheckIfFull())
          {            
            jump EatFood();
          }
          // we didn't touch ground nor player, ignore
          resume;
        }
      }
    }

    return EReturn();
  };

  // --------------------------------------------------------------------------------------
  // Move.
  // --------------------------------------------------------------------------------------
  Active(EVoid) : CEnemyBase::Active
  {
    m_bIsActive = TRUE; // [SSE]
    
    m_fDamageConfused = 0.0f;
    // logic loop
    wait () {
      // initially
      on (EBegin) : {
        // start new behavior
        SendEvent(EReconsiderBehavior());
        resume;
      }

      // if new behavior is requested
      on (EReconsiderBehavior) : {
        // if we have an enemy
        if (m_penEnemy != NULL) {
          if(m_bWantsFood) {
            call FindFood();
          } else {
            // attack it
            call CEnemyBase::AttackEnemy();
          }
        // if we have a marker to walk to
        } else if (m_penMarker != NULL) {
          // go to the marker
          call CEnemyBase::MoveThroughMarkers();
        // if on start position
        } else if (m_bOnStartPosition) {
          // just wait here
          m_bOnStartPosition = FALSE;
          call CEnemyBase::BeIdle();
        // otherwise
        } else {
          // return to start position
          call CEnemyBase::ReturnToStartPosition();
        }
        resume;
      }

      // on return from some of the sub-procedures
      on (EReturn) : {
        // start new behavior
        SendEvent(EReconsiderBehavior());
        resume;
      }

      // if attack restart is requested
      on (ERestartAttack) : {
        // start new behavior
        SendEvent(EReconsiderBehavior());
        resume;
      }

      // if enemy has been seen
      on (EWatch eWatch) : {
        // if new enemy
        if (eWatch.penSeen != NULL) {
          if (SetTargetSoft(eWatch.penSeen)) {
            // if blind till now and start tactics on sense
            if (m_bBlind && m_bTacticsStartOnSense ) {
              StartTacticsNow();
            }
            // react to it
            call CEnemyBase::NewEnemySpotted();
          }
        }
        resume;
      }

      // if you get damaged by someone
      on (EDamage eDamage) :
      {
        // if dormant then ignore the damage
        if (m_bDormant) {
          resume;
        }
        if (ShouldSelectTargetOnDamage()) {
          // eventually set new hard target
          if (SetTargetHard(eDamage.penInflictor)) {
            SendEvent(EReconsiderBehavior());
          }
        }
        
        if (!CanBeWounded()) {
          resume;
        }

        // if confused
        m_fDamageConfused -= eDamage.fAmount;
        if (m_fDamageConfused < 0.001f)
        {
          m_fDamageConfused = GetDamageWounded();
          // notify wounding to others
          WoundedNotify(eDamage);
          
          WoundSound(); // make pain sound
          
          // play wounding animation
          call CEnemyBase::BeWounded(eDamage);
        }

        resume;
      }

      on (EForceWound) :
      {
        call CEnemyBase::BeWounded(EDamage());
        resume;
      }

      // if you hear something
      on (ESound eSound) :
      {
        // if deaf then ignore the sound
        if (m_bDeaf) {
          resume;
        }

        // if the target is visible and can be set as new enemy
        if (IsVisible(eSound.penTarget) && SetTargetSoft(eSound.penTarget)) {
          // react to it
          call CEnemyBase::NewEnemySpotted();
        }

        resume;
      }
      // if you smell something
      on (ESmell eSmell) :
      {
        // if deaf then ignore the sound
        if (m_bAnosmic) {
          resume;
        }

        // if the target can be set as new enemy
        if (SetTargetSoft(eSmell.penTarget)) {
          // react to it
          call CEnemyBase::NewEnemySpotted();
        }

        resume;
      }
      // on touch
      on (ETouch eTouch) : {
        // if dormant then ignore the touch
        if (m_bDormant) {
          resume;
        }
        // set the new target if needed
        BOOL bTargetChanged = SetTargetHard(eTouch.penOther);
        // if target changed
        if (bTargetChanged) {
          // make sound that you spotted the player
          SightSound();
          // start new behavior
          SendEvent(EReconsiderBehavior());
        }
        pass;
      }

      // if triggered manually
      on (ETrigger eTrigger) : {
        CEntity *penCaused = FixupCausedToPlayer(this, eTrigger.penCaused);
        // if can set the trigerer as soft target
        if (SetTargetSoft(penCaused)) {
          // make sound that you spotted the player
          SightSound();
          // start new behavior
          SendEvent(EReconsiderBehavior());
        }
        resume;
      }

      // on stop -> stop enemy
      on (EStop) : {
        jump Inactive();
      }

      // warn for all obsolete events
      on (EStartAttack) : {
        //CPrintF("%s: StartAttack event is obsolete!\n", GetName());
        resume;
      }
      on (EStopAttack) : {
        //CPrintF("%s: StopAttack event is obsolete!\n", GetName());
        resume;
      }
    }
  };

  // --------------------------------------------------------------------------------------
  // Not doing anything, waiting until some player comes close enough to start patroling or similar.
  // --------------------------------------------------------------------------------------
  Inactive(EVoid) : CEnemyBase::Inactive
  {
    m_bIsActive = FALSE; // [SSE]
    
    // stop moving
    StopMoving();                 
    StandingAnim();
    // start watching
    GetWatcher()->SendEvent(EStart());
    // wait forever
    wait() {
      on (EBegin) : { resume; }
      // if watcher detects that a player is near
      on (EStart) : { 
        // become active (patroling etc.)
        jump Active(); 
      }
      // if returned from wounding
      on (EReturn) : { 
        // become active (this will attack the enemy)
        jump Active(); 
      }
      // if triggered manually
      on (ETrigger eTrigger) : {

        CEntity *penCaused = FixupCausedToPlayer(this, eTrigger.penCaused);
        // if can set the trigerer as soft target
        if (SetTargetSoft(penCaused)) {
          // become active (this will attack the player)
          jump Active(); 
        }
      }
      // if you get damaged by someone
      on (EDamage eDamage) : {
        // if dormant then ignore the damage
        if (m_bDormant) {
          resume;
        }

        if (!ShouldSelectTargetOnDamage()) {
          resume;
        }

        // if can set the damager as hard target
        if (SetTargetHard(eDamage.penInflictor))
        {
          // notify wounding to others
          WoundedNotify(eDamage);

          // HACK! Always notify others because the Innactive state, but don't play wounded if Should not.
          if (!CanBeWounded()) {
            SendEvent(EReturn());
            resume;
          }

          WoundSound(); // make pain sound

          // play wounding animation
          call CEnemyBase::BeWounded(eDamage);
        }

        return;
      }
      // if you smell something
      on (ESmell eSmell) :
      {
        // if deaf then ignore the sound
        if (m_bAnosmic) {
          resume;
        }

        // if the target can be set as new enemy
        if (SetTargetSoft(eSmell.penTarget)) {
          // become active (this will attack the player)
          jump Active(); 
        }

        resume;
      }
    }
  };

  // --------------------------------------------------------------------------------------
  // Standard AI behavior.
  // --------------------------------------------------------------------------------------
  StandardBehavior(EVoid) : CEnemyBase::StandardBehavior
  {
    // this is the main enemy loop
    wait() {
      // initially
      on (EBegin) : {
        // start in active or inactive state
        if (m_penEnemy!=NULL) {
          call Active();
        } else {
          call Inactive();
        }
      };

      // if dead
      on (EDeath eDeath) : {
        // die
        jump Die(eDeath);
      }
      // if an entity exits a teleport nearby
      on (ETeleport et) : {
        // proceed message to watcher (so watcher can quickly recheck for players)
        GetWatcher()->SendEvent(et);
        resume;
      }
      // if should stop being blind
      on (EStopBlindness) : {
        // stop being blind
        m_bBlind = FALSE;
        resume;
      }
      // if should stop being deaf
      on (EStopDeafness) : {
        // stop being deaf
        m_bDeaf = FALSE;
        resume;
      }
      // if should stop being dormant
      on (EStopDormancy) : {
        // stop being dormant
        m_bDormant = FALSE;
        resume;
      }
      // if should stop being anosmic
      on (EStopAnosmia) : {
        // stop being anosmic
        m_bAnosmic = FALSE;
        resume;
      }
      // support for jumping using bouncers
      on (ETouch eTouch) : {
        IfTargetCrushed(eTouch.penOther, (FLOAT3D&)eTouch.plCollision);
        if (IsOfClass(eTouch.penOther, "Bouncer")) {
          JumpFromBouncer(this, eTouch.penOther);
        }
        resume;
      }
    }
  };

};