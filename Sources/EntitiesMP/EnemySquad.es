/* Copyright (c) 2021-2024 Uni Musuotankarep.
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

1022
%{
#include "StdH.h"
extern void JumpFromBouncer(CEntity *penToBounce, CEntity *penBouncer);
%}

uses "EntitiesMP/EnemyBase";

// leader death
event ELeaderDeath {
};

// leader can say MOVE IN! TAKE COVER! RUN AWAY!
event ELeaderCommand {
  INDEX iCommandType,
};

%{
#define MAX_SQUAD_MEMBERS 5
%}


class export CEnemySquad : CEnemyBase {
name      "Enemy Squad";
thumbnail "";

properties:
  1 BOOL m_bIsLeader = FALSE,			                          // Do I lead this squad?
  2 INDEX m_iSquadSlots = 0,			                          // How many members are in our team?
  3 CEntityPointer m_penSquadLeader "Squad Leader",	              // Who is the commander?
  4 INDEX m_iCommandIndex = 0,			                          // What command should I obey?
  5 CTString m_strSquadName "Squad Name" = "Enemy Squad 1",       // Which squad do I belong to?
  6 BOOL m_bRunAway = FALSE,			                          // Do I flee?
  7 BOOL m_bMoveIn = FALSE,			                              // Do I rush to my enemy's position?

  {
    // array of squad members
    CDynamicContainer<CEnemySquad> m_cenMembers;
  }

components:
  1 class   CLASS_BASE    "Classes\\EnemyBase.ecl",


functions:

/////////////////////////
//  Utility Functions  //
/////////////////////////

BOOL CheckIfLeader(void)
{
  return m_bIsLeader;
}

BOOL CheckIfInSquad(void)
{
  return m_penSquadLeader != NULL;
}

INDEX GetSquadSlots(void)
{
  return m_iSquadSlots;
}

BOOL IsLeaderDead(void)
{
    return (
        m_penSquadLeader==NULL ||
        !(m_penSquadLeader->GetFlags()&ENF_ALIVE) || 
        (m_penSquadLeader->GetFlags()&ENF_DELETED)
    );
}

BOOL IsSquadFull(void)
{
  if(m_iSquadSlots > MAX_SQUAD_MEMBERS)
  {
    return TRUE;
  }
  return FALSE;
}

void AddSquadMember(CEnemySquad *penMember)
{
  if(penMember->m_strSquadName != this->m_strSquadName)
  {
    return;
  }

  if(!IsSquadFull())
  {
    m_cenMembers.Add(penMember);
    m_iSquadSlots++;
  }
}

void RemoveSquadMember(CEnemySquad *penMember)
{
  if(penMember->m_strSquadName != this->m_strSquadName)
  {
    return;
  }

  if(m_cenMembers.Count() > 0)
  {
    m_cenMembers.Remove(penMember);
    m_iSquadSlots--;
  }
}

void CountSquadMembers(void)
{
  m_cenMembers.Count();
}

virtual void LeaderCommandAnim(void) {};
virtual void CoveringAnim(void) {};
virtual void PeakLeftAnim(void) {};
virtual void PeakRightAnim(void) {};
virtual void ReloadAnim(void) {};
virtual void QuestionSound(void) {};
virtual void AnswerSound(void) {};
virtual void LeaderAlertSound(void) {};

/////////////////////////
//  Main AI Functions  //
/////////////////////////

procedures:

  CheckLeaderDeath(EVoid) {
    if(IsLeaderDead())
    {
      autocall SquadRunAway() EReturn;
    }

    return EBegin();
  };

  SquadTakeCover(EVoid) {
    // stop moving
    StopMoving();

    return EReturn();
  };

  SquadMoveIn(EVoid) {
    // stop moving
    StopMoving();
    RunningAnim();

    m_fLockOnEnemyTime = 1.0f;
    m_fLockStartTime = _pTimer->CurrentTick();
    while (m_fLockStartTime+GetProp(m_fLockOnEnemyTime) > _pTimer->CurrentTick()) {
      m_fMoveFrequency = 0.1f;
      wait (m_fMoveFrequency) {
        on (EBegin) : {
          FLOAT fSpeedMultiplier = 1.0f;
          m_fMoveSpeed = GetProp(m_fCloseRunSpeed) * fSpeedMultiplier;
          m_vDesiredPosition = FLOAT3D(0.0f, 0.0f, -m_fMoveSpeed);
          // start moving
          m_ulMovementFlags = SetDesiredMovement(); 
          MovementAnimation(m_ulMovementFlags);
          resume; 
        }
        on (ETimer) : { stop; }
      }
    }

    return EReturn();
  };

  SquadRunAway(EVoid) {
    m_bCoward = TRUE;

    // stop moving
    StopMoving();
    RunningAnim();

    autowait(2.0f);

    m_bCoward = FALSE;

    return EReturn();
  };

  ObeyLeaderCommands(ELeaderCommand eLeaderCommand) {
    if(this->CheckIfLeader())
    {
      return EBegin();
    }
    
    switch(eLeaderCommand.iCommandType)
    {
      // case 1 is to take cover
      // case 2 is to move in
      // case 3 is to run away
      default: ASSERT(FALSE);
      case 1: jump SquadTakeCover(); break;
      case 2: jump SquadMoveIn(); break;
      case 3: jump SquadRunAway(); break;
    }

    return EBegin();
  };

/************************************************************
 *                M  A  I  N    L  O  O  P                  *
 ************************************************************/

  Die(EDeath eDeath) : CEnemyBase::Die {
    if(this->CheckIfLeader())
    {
      SendEventInRange(ELeaderDeath(), FLOATaabbox3D(GetPlacement().pl_PositionVector, 16.0f));
    }

    RemoveSquadMember(this);

    jump CEnemyBase::Die(eDeath);
  };

  // before main loop
  PreMainLoop(EVoid)
  {
    for(INDEX iSlots = 0; iSlots > MAX_SQUAD_MEMBERS; iSlots++)
    {
      AddSquadMember(this);
    }
    
    return EReturn();
  }

  // main loop
  MainLoop(EVoid) : CEnemyBase::MainLoop {
    jump CEnemyBase::MainLoop();
  };

  // dummy main
  Main(EVoid) {
    return;
  };

  // --------------------------------------------------------------------------------------
  // Move through markers.
  // --------------------------------------------------------------------------------------
  MoveThroughMarkers()  : CEnemyBase::MoveThroughMarkers
  {
    // start watching
    GetWatcher()->SendEvent(EStart());
  
    // while there is a valid marker, take values from it
    while (m_penMarker!=NULL && IsOfClass(m_penMarker, "Enemy Marker"))
    {
      CEnemyMarker *pem = (CEnemyMarker *)&*m_penMarker;

      // the marker position is our new start position for attack range
      m_vStartPosition = m_penMarker->GetPlacement().pl_PositionVector;
      // make a random position to walk to at the marker
      FLOAT fR = FRnd()*pem->m_fMarkerRange;
      FLOAT fA = FRnd()*360.0f;
      m_vDesiredPosition = m_vStartPosition+FLOAT3D(CosFast(fA)*fR, 0, SinFast(fA)*fR);
      // if running 
      if (pem->m_betRunToMarker==BET_TRUE) {
        FLOAT fSpeedMultiplier = 1.0F;
        
        // use attack speeds
        m_fMoveSpeed = GetProp(m_fAttackRunSpeed) * fSpeedMultiplier;
        m_aRotateSpeed = GetProp(m_aAttackRotateSpeed);
        // start running anim
        RunningAnim();
      // if not running
      } else {
        FLOAT fSpeedMultiplier = 1.0F;
        
        // use walk speeds
        m_fMoveSpeed = GetProp(m_fWalkSpeed) * fSpeedMultiplier;
        m_aRotateSpeed = GetProp(m_aWalkRotateSpeed);
        // start walking anim
        WalkingAnim();
      }

      if (m_bCanJump == TRUE)
      {
        // if enemy needs to jump
        if (pem->m_betJump==BET_TRUE)
        {
            m_bJump = TRUE;
            m_fJumpSpeed = m_fJumpHeight;
        }
        else
        {
            m_bJump = FALSE;
            m_fJumpSpeed = 0.0f;
        }
      }

      if (m_bCanTakeCover == TRUE)
      {
        // if enemy needs to hide behind cover
        if (pem->m_betHideBehindCover==BET_TRUE)
        {
            m_bHideBehindCover = TRUE;
        }
        else
        {
            m_bHideBehindCover = FALSE;
        }
      }

      if (m_bCanCrouch == TRUE)
      {
        // if enemy needs to crouch
        if (pem->m_betCrouch==BET_TRUE)
        {
            m_bCrouch = TRUE;
        }
        else
        {
            m_bCrouch = FALSE;
        }
      }

      if(m_bCanFlee == TRUE)
      {
        // if enemy needs to flee
        if(pem->m_betFlee==BET_TRUE)
        {
          m_bCoward = TRUE;
        }
        else
        {
          m_bCoward = FALSE;
        }
      }

      if (m_bCanClimb == TRUE)
      {
        // if enemy needs to climb
        if (pem->m_betClimb==BET_TRUE)
        {
            m_bClimb = TRUE;
        }
        else
        {
            m_bClimb = FALSE;
        }
      }

      if (m_bCanTakeCover == TRUE) {
        if(pem->m_sctCommand == SCT_TAKECOVER) {
            m_bHideBehindCover = TRUE;
        } else {
            m_bHideBehindCover = FALSE;
        }
      }

      if(pem->m_sctCommand == SCT_MOVEIN) {
          m_bMoveIn = TRUE;
      } else {
          m_bMoveIn = FALSE;
      }

      if(pem->m_sctCommand == SCT_RUNAWAY) {
          m_bRunAway = TRUE;
      } else {
          m_bRunAway = FALSE;
      }

      // move to the new destination position
      autocall CEnemyBase::MoveToDestination() EReturn;

      // read new blind/deaf values
      CEnemyMarker *pem = (CEnemyMarker *)&*m_penMarker;
      SetBoolFromBoolEType(m_bBlind, pem->m_betBlind);
      SetBoolFromBoolEType(m_bDeaf,  pem->m_betDeaf);
      SetBoolFromBoolEType(m_bDormant,  pem->m_betDormant);
      SetBoolFromBoolEType(m_bAnosmic,  pem->m_betAnosmic);

      // when reaching the marker
      SendToTarget(pem->m_penReachTarget, pem->m_eetReachType, this); // Send an event to reach target.

      // if should start tactics
      if (pem->m_bStartTactics){
        // start to see/hear/smell
        m_bBlind = FALSE;
        m_bDeaf = FALSE;
        m_bDormant = FALSE;
        m_bAnosmic = FALSE;
        m_bHideBehindCover = FALSE;
        // unconditional tactics start
        StartTacticsNow();
      }
      
      // if should patrol there
      if (pem->m_fPatrolTime>0.0f) {
        // spawn a reminder to notify us when the time is up
        SpawnReminder(this, pem->m_fPatrolTime, ENEMY_PATROL_VAL);
        // wait
        wait() {
          // initially
          on (EBegin) : { 
            // start patroling
            call CEnemyBase::DoPatrolling(); 
          }
          // if time is up
          on (EReminder eReminder) : {
            // [Cecil] Enemy loop
            if (eReminder.iValue == ENEMY_STEP_VAL) {
              pass;
            }
            // stop patroling
            stop;
          }
        }
      }

      CEnemyMarker *pem = (CEnemyMarker *)&*m_penMarker;
      // if should wait on the marker
      if (pem->m_fWaitTime > 0.0f) {
        // stop there
        StopMoving();
        StandingAnim();
        // wait
        autowait(pem->m_fWaitTime);
      }

      // wait a bit always (to prevent eventual busy-looping)
      autowait(0.05f);

      // take next marker in loop
      m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget;

      if(m_penMarker == NULL) {
        StopMoving();
        StandingAnim();
        return EReturn();
      }

      CEnemyMarker *pem = (CEnemyMarker *)&*m_penMarker;
      if(pem->m_penRandomTarget1 != NULL) {
        switch(IRnd()%2) {
          case 0: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
          case 1: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penRandomTarget1; break;
          default: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
        }
      }

      if(pem->m_penRandomTarget2 != NULL) {
        switch(IRnd()%2) {
          case 0: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
          case 1: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penRandomTarget2; break;
          default: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
        }
      }

      if(pem->m_penRandomTarget3 != NULL) {
        switch(IRnd()%2) {
          case 0: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
          case 1: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penRandomTarget3; break;
          default: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
        }
      }

      if(pem->m_penRandomTarget4 != NULL) {
        switch(IRnd()%2) {
          case 0: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
          case 1: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penRandomTarget4; break;
          default: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
        }
      }

      if(pem->m_penRandomTarget5 != NULL) {
        switch(IRnd()%2) {
          case 0: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
          case 1: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penRandomTarget5; break;
          default: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
        }
      }

      if(pem->m_penRandomTarget6 != NULL) {
        switch(IRnd()%2) {
          case 0: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
          case 1: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penRandomTarget6; break;
          default: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
        }
      }

      if(pem->m_penRandomTarget7 != NULL) {
        switch(IRnd()%2) {
          case 0: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
          case 1: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penRandomTarget7; break;
          default: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
        }
      }

      if(pem->m_penRandomTarget8 != NULL) {
        switch(IRnd()%2) {
          case 0: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
          case 1: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penRandomTarget8; break;
          default: m_penMarker = ((CEnemyMarker&)*m_penMarker).m_penTarget; break;
        }
      }

    } // when no more markers

    // stop where you are
    StopMoving();
    StandingAnim();

    // return to called
    return EReturn();
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
          call CEnemyBase::Active();
        } else {
          call CEnemyBase::Inactive();
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
      on (ELeaderDeath eLeaderDeath) : {
        call CheckLeaderDeath();
        resume;
      }
      on (ELeaderCommand eLeaderCommand) : {
        m_iCommandIndex = eLeaderCommand.iCommandType;

        call ObeyLeaderCommands(eLeaderCommand.iCommandType);
        resume;
      }
    }
  };

};