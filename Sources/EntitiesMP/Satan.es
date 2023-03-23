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

1013
%{
#include "StdH.h"
#include "Models/NPCs/Satan/Satan.h"
%}

uses "EntitiesMP/EnemyBase";

%{

// info structure
static EntityInfo eiSatan = {
  EIBT_FLESH, 750.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

#define MF_MOVEZ    (1L<<0)
#define MF_ROTATEH  (1L<<1)
#define MF_MOVEXZY  (1L<<2)
#define MF_MOVEY    (1L<<3)
#define MF_MOVEX    (1L<<4)

%}


class CSatan: CEnemyBase {
name      "Satan";
thumbnail "Thumbnails\\Satan.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  2 BOOL m_bStartsOutSlow "Starts out slow" = FALSE,

components:
  1 class   CLASS_BASE            "Classes\\EnemyBase.ecl",

 10 model   MODEL_SATAN               "Models\\NPCs\\Satan\\Satan.mdl",
 11 texture TEXTURE_SATAN             "Models\\NPCs\\Satan\\Satan.tex",

 // ************** SOUNDS **************
 50 sound   SOUND_HIT       "Models\\NPCs\\Abomination\\Sounds\\Hit.wav",
 51 sound   SOUND_SWING     "Models\\Weapons\\Knife\\Sounds\\Swing.wav",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("Satan truly made %s feel agony"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiSatan;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmSatan, "Data\\Messages\\NPCs\\Satan.txt");
    return fnmSatan;
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_HIT);
    PrecacheSound(SOUND_SWING);
  };

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    CEnemyBase::FillEntityStatistics(pes);
    return TRUE;
  }

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection) 
  {
    // satan can't harm himself
    if (!IsOfClass(penInflictor, "Satan")) {
      CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection);
    }
  };


  // damage anim
  INDEX AnimForDamage(FLOAT fDamage) {
    INDEX iAnim;
    iAnim = SATAN_ANIM_WOUND;
    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  // death
  INDEX AnimForDeath(void) {
    INDEX iAnim;
    iAnim = SATAN_ANIM_DEFAULT;

    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  FLOAT WaitForDust(FLOAT3D &vStretch) {
    vStretch=FLOAT3D(1,1,2);
    vStretch=vStretch*0.3f; 
    return -1.0f;
  };

  void DeathNotify(void) {
    ChangeCollisionBoxIndexWhenPossible(SATAN_COLLISION_BOX_DEATH_BOX);
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartModelAnim(SATAN_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
  };

  void WalkingAnim(void) {
    StartModelAnim(SATAN_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
  };

  void RunningAnim(void) {
    if(!m_bStartsOutSlow) {
      StartModelAnim(SATAN_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    } else {
      StartModelAnim(SATAN_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
    RunningAnim();
  };


  procedures:


  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    // close attack
    StartModelAnim(SATAN_ANIM_STAB, 0);
    m_bFistHit = FALSE;
    autowait(0.50f);
    if (CalcDist(m_penEnemy) < 2.5f) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      PlaySound(m_soSound, SOUND_HIT, SOF_3D);
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 25.0f, FLOAT3D(0, 0, 0), vDirection);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();
    return EReturn();
  };


  Fire(EVoid) : CEnemyBase::Fire
  {
    return EReturn();
  };


/************************************************************
 *                       M  A  I  N                         *
 ************************************************************/
  Main(EVoid) {
    // declare yourself as a model
    InitAsModel();
    SetPhysicsFlags(EPF_MODEL_WALKING|EPF_HASLUNGS);
    SetCollisionFlags(ECF_MODEL);
    SetFlags(GetFlags()|ENF_ALIVE);
    m_ftFactionType = FT_GREATER;
    SetHealth(5000.0f);
    m_fMaxHealth = 5000.0f;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance
    SetModel(MODEL_SATAN);
        // set your texture
        SetModelMainTexture(TEXTURE_SATAN);
        // setup moving speed
        m_fWalkSpeed = FRnd() + 1.0f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
        m_fAttackRunSpeed = FRnd() + 1.5f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 245.0f);
        m_fCloseRunSpeed = FRnd() + 1.5f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 245.0f);
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 3.0f;
        m_fStopDistance = 1.5f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 1.0f;
        m_fIgnoreRange = 200.0f;
        // damage/explode properties
        m_fBlowUpAmount = 120.0f;
        m_fBodyParts = 4;
        m_fDamageWounded = 1000.0f;
        m_iScore = 1000000;

    // set stretch factors for height and width
    GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
    ModelChangeNotify();
    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};