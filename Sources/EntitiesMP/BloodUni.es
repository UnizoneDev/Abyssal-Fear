/* Copyright (c) 2021-2023 Uni Musuotankarep
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

1032
%{
#include "StdH.h"
%}

uses "EntitiesMP/BasicEffects";
uses "EntitiesMP/Debris";

// input parameter for spawning an enhanced blood spray
event ESpawnBlood {
  FLOAT fDamagePower,              // factor saying how powerfull damage has been
  FLOAT fSizeMultiplier,           // stretch factor
  FLOAT3D vDirection,              // dammage direction  
  CEntityPointer penOwner,         // who spawned the spray
  COLOR colCentralColor,           // central color of particles that is randomized a little
  FLOAT fLaunchPower,
  COLOR colBurnColor,              // burn color
  BOOL bGenerateStain,
  INDEX iAmount,
  BOOL bGenerateStreams,
};

%{
  void CBloodUni_OnPrecache(CDLLEntityClass *pdec, INDEX iUser) 
  {
    pdec->PrecacheClass(CLASS_BASIC_EFFECT, BET_BLOODSPILL);
    pdec->PrecacheClass(CLASS_BASIC_EFFECT, BET_BLOODSTAIN);
    pdec->PrecacheClass(CLASS_BASIC_EFFECT, BET_BLOODSTAINGROW);
    pdec->PrecacheClass(CLASS_BASIC_EFFECT, BET_BLOODEXPLODE);
  }
%}

class CBloodUni: CMovableModelEntity {
name      "BloodUni";
thumbnail "";
features  "ImplementsOnPrecache", "CanBePredictable";
properties:

  1 FLOAT3D m_vDirection = FLOAT3D(0,0,0),                           // dammage direction
  2 CEntityPointer m_penOwner,                                       // who spawned the spray
  3 FLOAT m_fDamagePower = 1.0f,                                     // power of inflicted damage
  4 FLOATaabbox3D m_boxSizedOwner = FLOATaabbox3D(FLOAT3D(0,0,0), 0.01f), // bounding box of blood spray's owner
  5 FLOAT3D m_vGDir = FLOAT3D(0,0,0),                                // gravity direction
  6 FLOAT m_fGA = 0.0f,                                             // gravity strength
  7 FLOAT m_fLaunchPower = 1.0f,
  8 COLOR m_colCentralColor = COLOR(C_WHITE|CT_OPAQUE),
  9 FLOATaabbox3D m_boxOriginalOwner = FLOATaabbox3D(FLOAT3D(0,0,0), 0.01f),
 10 BOOL m_bGenerateStain = TRUE,
 11 COLOR m_colBurnColor = COLOR(C_WHITE|CT_OPAQUE),
 12 FLOAT m_tmStarted = 0.0f,                                        // time when spawned
 13 INDEX m_iAmount = 1,
 14 BOOL m_bGenerateStreams = TRUE,
 15 FLOAT3D m_vLastStain  = FLOAT3D(0,0,0), // where last stain was left


components:
  1 class   CLASS_BASIC_EFFECT  "Classes\\BasicEffect.ecl",
  2 model   MODEL_BLOOD         "Models\\Editor\\Axis.mdl",
  3 texture TEXTURE_BLOOD       "Models\\Editor\\Vector.tex"

functions:

  // particles
  void RenderParticles(void)
  {
    Particles_BloodDroplet(GetLerpedPlacement().pl_PositionVector, m_vGDir, m_fGA,
        m_boxSizedOwner, m_vDirection, m_tmStarted, m_fDamagePower, m_colBurnColor, m_iAmount);
  };

  void LeaveStain( BOOL bGrow)
  {
    ESpawnEffect ese;
    FLOAT3D vPoint;
    FLOATplane3D vPlaneNormal;
    FLOAT fDistanceToEdge;
    // get your size
    FLOATaabbox3D box;
    GetBoundingBox(box);
  
    // on plane
    if ( GetNearestPolygon(vPoint, vPlaneNormal, fDistanceToEdge)) {
      // if near to polygon and away from last stain point
      if ( (vPoint-GetPlacement().pl_PositionVector).Length()<0.5f
        && (m_vLastStain-vPoint).Length()>1.0f ) {
        m_vLastStain = vPoint;
        FLOAT fStretch = box.Size().Length();
        ese.colMuliplier = C_WHITE|CT_OPAQUE;
        // stain
        if (bGrow) {
          ese.betType    = BET_BLOODSTAINGROW;
          ese.vStretch   = FLOAT3D( fStretch*1.5f, fStretch*1.5f, 1.0f);
        } else {
          ese.betType    = BET_BLOODSTAIN;
          ese.vStretch   = FLOAT3D( fStretch*0.75f, fStretch*0.75f, 1.0f);
        }
        ese.vNormal    = FLOAT3D( vPlaneNormal);
        ese.vDirection = FLOAT3D( 0, 0, 0);
        FLOAT3D vPos = vPoint+ese.vNormal/50.0f*(FRnd()+0.5f);
        CEntityPointer penEffect = CreateEntity( CPlacement3D(vPos, ANGLE3D(0,0,0)), CLASS_BASIC_EFFECT);
        penEffect->Initialize(ese);
      }
    }
  };

/************************************************************
 *                          MAIN                            *
 ************************************************************/

procedures:

  Main(ESpawnBlood eBlood)
  {
    // set appearance
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);
    SetPredictable(TRUE);

    // set appearance
    SetModel(MODEL_BLOOD);
    SetModelMainTexture(TEXTURE_BLOOD);

    // setup variables
    m_vDirection = eBlood.vDirection;
    m_penOwner = eBlood.penOwner;
    m_fDamagePower = eBlood.fDamagePower;
    m_fLaunchPower = eBlood.fLaunchPower;
    m_colBurnColor = eBlood.colBurnColor;
    m_tmStarted = _pTimer->CurrentTick();
    m_colCentralColor = eBlood.colCentralColor;
    m_bGenerateStain = eBlood.bGenerateStain;
    m_iAmount = eBlood.iAmount;
    m_bGenerateStreams = eBlood.bGenerateStreams;

    // if owner doesn't exist (could be destroyed in initialization)
    if( eBlood.penOwner==NULL || eBlood.penOwner->en_pmoModelObject == NULL)
    {
      // don't do anything
      Destroy();
      return;
    }

    if(eBlood.penOwner->en_RenderType == RT_SKAMODEL) {
      eBlood.penOwner->GetModelInstance()->GetCurrentColisionBox( m_boxSizedOwner);
    } else {
      eBlood.penOwner->en_pmoModelObject->GetCurrentFrameBBox( m_boxSizedOwner);
      m_boxOriginalOwner=m_boxSizedOwner;
      m_boxSizedOwner.StretchByVector(eBlood.penOwner->en_pmoModelObject->mo_Stretch*eBlood.fSizeMultiplier);
      m_boxOriginalOwner.StretchByVector(eBlood.penOwner->en_pmoModelObject->mo_Stretch);
    }

    if (m_penOwner->GetPhysicsFlags()&EPF_MOVABLE) {
      m_vGDir = ((CMovableEntity *)&*m_penOwner)->en_vGravityDir;
      m_fGA = ((CMovableEntity *)&*m_penOwner)->en_fGravityA;
    } else {
      FLOATmatrix3D &m = m_penOwner->en_mRotation;
      m_vGDir = FLOAT3D(-m(1,2), -m(2,2), -m(3,2));
      m_fGA = 30.0f;
    }

    FLOAT fWaitTime=FRnd()*4.0f + 4.0f;

    wait (fWaitTime) {
      on (EBegin) : { resume; }
      on (ETouch eTouch) : {
        if (eTouch.penOther->GetRenderType()==CEntity::RT_BRUSH) {
          if(m_bGenerateStain) {
            LeaveStain(FALSE);
          }
        }
        resume;
      }
      on (ETimer) : { stop; }
    }

    Destroy();
    return;
  }
};