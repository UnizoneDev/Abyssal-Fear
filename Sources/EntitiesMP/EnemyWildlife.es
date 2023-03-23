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

%{

%}


class export CEnemyWildlife : CEnemyBase {
name      "Enemy Wildlife";
thumbnail "";

properties:
  1 BOOL m_bIsFull = FALSE,			                    // Did I eat enough food?
  2 CEntityPointer m_penFoodTarget,                     // What do I currently want to consume?

components:
  1 class   CLASS_BASE    "Classes\\EnemyBase.ecl",


functions:

/////////////////////////
//  Utility Functions  //
/////////////////////////

BOOL CheckIfFull(void)
{
  return m_bIsFull;
}

BOOL CheckIfHungry(void)
{
  return m_penFoodTarget != NULL;
}

virtual void EatingAnim(void) {};
virtual void DrinkingAnim(void) {};
virtual void EatingSound(void) {};
virtual void DrinkingSound(void) {};

/////////////////////////
//  Main AI Functions  //
/////////////////////////

procedures:
  
  MoveToFood(EVoid) {
    while (m_penFoodTarget!=NULL && IsOfClass(m_penFoodTarget, "ExplosiveBarrel"))
    {
      m_vStartPosition = m_penFoodTarget->GetPlacement().pl_PositionVector;

      FLOAT fR = FRnd()*1.0f;
      FLOAT fA = FRnd()*360.0f;
      m_vDesiredPosition = m_vStartPosition+FLOAT3D(CosFast(fA)*fR, 0, SinFast(fA)*fR);

      FLOAT fSpeedMultiplier = 1.0F;
      
      // use attack speeds
      m_fMoveSpeed = GetProp(m_fAttackRunSpeed) * fSpeedMultiplier;
      m_aRotateSpeed = GetProp(m_aAttackRotateSpeed);
      // start running anim
      RunningAnim();

      autocall CEnemyBase::MoveToDestination() EReturn;

      if(CheckIfHungry()) {
        return EBegin();
      }
    }

    return EBegin();
  };

  CheckForFood(EVoid) {
    if(!CheckIfFull()) {
      autocall MoveToFood() EReturn;
    }

    return EBegin();
  };

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
    }
  };

};