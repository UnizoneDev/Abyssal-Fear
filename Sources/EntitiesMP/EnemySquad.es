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
  m_cenMembers.Add(penMember);
}

void RemoveSquadMember(CEnemySquad *penMember)
{
  m_cenMembers.Remove(penMember);
}

void CountSquadMembers(void)
{
  m_cenMembers.Count();
}

virtual void BlockingAnim(void) {};
virtual void LeaderCommandAnim(void) {};
virtual void CoveringAnim(void) {};
virtual void PeakLeftAnim(void) {};
virtual void PeakRightAnim(void) {};
virtual void ReloadAnim(void) {};
virtual void QuestionSound(void) {};
virtual void AnswerSound(void) {};
virtual void TauntSound(void) {};
virtual void LeaderAlertSound(void) {};

/////////////////////////
//  Main AI Functions  //
/////////////////////////

procedures:

  CheckLeaderDeath(EVoid) {
    m_bCoward = IsLeaderDead();
    
    autowait(3.0f);

    m_bCoward = FALSE;

    return EBegin();
  };

  ObeyLeaderCommands(ELeaderCommand eLeaderCommand) {
    switch(eLeaderCommand.iCommandType)
    {
      // case 1 is to take cover
      // case 2 is to move in
      // case 3 is to run away
      default: ASSERT(FALSE);
      case 1: break;
      case 2: break;
      case 3: break;
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
      // if should start being dormant
      on (EStartDormancy) : {
        // start being dormant
        m_bDormant = TRUE;
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