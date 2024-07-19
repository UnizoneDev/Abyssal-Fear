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

1049
%{
#include "StdH.h"
%}

uses "EntitiesMP/EnemyBase";

%{

  static INDEX idSnatcherAnim_TPose = -1;
  static INDEX idSnatcherAnim_Chew  = -1;
  static INDEX idSnatcherAnim_Death = -1;
  static INDEX idSnatcherBox_Still  = -1;

// info structure
static EntityInfo eiSnatcher = {
  EIBT_FLESH, 400.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}

class CSnatcher: CEnemyBase {
name      "Snatcher";
thumbnail "Thumbnails\\Snatcher.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,

components:
  1 class   CLASS_BASE            "Classes\\EnemyBase.ecl",
  2 skamodel MODEL_SNATCHER       "Models\\NPCs\\Snatcher\\Snatcher.smc",
  3 sound   SOUND_HIT             "Models\\NPCs\\Snatcher\\Sounds\\MetalTongueGrab.wav",
  4 sound   SOUND_MOVE            "Models\\NPCs\\Snatcher\\Sounds\\MetalTongueMove.wav",
  5 sound   SOUND_SIGHT           "Models\\NPCs\\Snatcher\\Sounds\\Sight.wav",
  6 sound   SOUND_WOUND           "Models\\NPCs\\Snatcher\\Sounds\\Wound.wav",
  7 sound   SOUND_DEATH           "Models\\NPCs\\Snatcher\\Sounds\\Death.wav",

functions:

void CSnatcher(void) {
  // Get snatcher animation IDs
  idSnatcherAnim_TPose       = ska_GetIDFromStringTable("TPOSE");
  idSnatcherAnim_Chew        = ska_GetIDFromStringTable("CHEW");
  idSnatcherAnim_Death       = ska_GetIDFromStringTable("DEATH");

  // Get snatcher collision box IDs
  idSnatcherBox_Still       = ska_GetIDFromStringTable("Still");
};

// describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A Snatcher ate %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiSnatcher;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmSnatcher, "Data\\Messages\\NPCs\\Snatcher.txt");
    return fnmSnatcher;
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_HIT);
    PrecacheSound(SOUND_MOVE);
    PrecacheSound(SOUND_SIGHT);
    PrecacheSound(SOUND_WOUND);
    PrecacheSound(SOUND_DEATH);
  };

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    CEnemyBase::FillEntityStatistics(pes);
    return TRUE;
  }

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
    CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
  };

  // damage anim
  INDEX AnimForDamage(FLOAT fDamage, enum DamageBodyPartType dbptType) {
    INDEX iAnim;
    iAnim = idSnatcherAnim_TPose;
    StartSkaModelAnim(iAnim,AN_CLEAR,1,0);

    return iAnim;
  };

  // damage anim
  INDEX AnimForDeath(void) {
    INDEX iAnim;
    iAnim = idSnatcherAnim_Death;
    StartSkaModelAnim(iAnim,AN_CLEAR,1,0);

    return iAnim;
  };

  FLOAT WaitForDust(FLOAT3D &vStretch) {
    vStretch=FLOAT3D(1,1,2);
    vStretch=vStretch*0.3f; 
    return -1.0f;
  };

  void DeathNotify(void) {
    // yell
    ESound eSound;
    eSound.EsndtSound = SNDT_SHOUT;
    eSound.penTarget = m_penEnemy;
    SendEventInRange(eSound, FLOATaabbox3D(GetPlacement().pl_PositionVector, 15.0f));

    if(GetModelInstance()->IsAnimationPlaying(idSnatcherAnim_Death))
    {
      INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idSnatcherBox_Still);
      ASSERT(iBoxIndex>=0);
      ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      SetSkaColisionInfo();
    }
    
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartSkaModelAnim(idSnatcherAnim_TPose,AN_CLEAR,1,0);
  };

  void WalkingAnim(void) {
    StandingAnim();
  };

  void RunningAnim(void) {
    StandingAnim();
  };

  void RotatingAnim(void) {
    StandingAnim();
  };

  void SightSound(void) {
    PlaySound(m_soVoice, SOUND_SIGHT, SOF_3D);
  };

  void WoundSound(void) {
    PlaySound(m_soVoice, SOUND_WOUND, SOF_3D);
  };

  void DeathSound(void) {
    PlaySound(m_soVoice, SOUND_DEATH, SOF_3D);
  };

  procedures:

  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    jump SnatcherGrab();
    return EReturn();
  };

  SnatcherGrab(EVoid) {
    StartSkaModelAnim(idSnatcherAnim_Chew,AN_CLEAR,1,0);
    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 5.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
      }
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  };



/************************************************************
 *                       M  A  I  N                         *
 ************************************************************/
  Main(EVoid) {
    InitAsSkaModel();

    SetPhysicsFlags(EPF_MODEL_FIXED);
    SetCollisionFlags(ECF_MODEL);
    SetFlags(GetFlags()|ENF_ALIVE);
    m_ftFactionType = FT_SNATCHER;
    SetHealth(100.0f);
    m_fMaxHealth = 100.0f;
    m_fDamageWounded = 75.0f;
    m_iScore = 5000;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 1000.0f;
    m_fBlowUpSize = 2.0f;
    SetSkaModel(MODEL_SNATCHER);
    GetModelInstance()->StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();
    m_bRestrained = TRUE;

    m_fWalkSpeed = 0.0f;
    m_aWalkRotateSpeed = AngleDeg(0.0f);
    m_fAttackRunSpeed = 0.0f;
    m_aAttackRotateSpeed = AngleDeg(0.0f);
    m_fCloseRunSpeed = 0.0f;
    m_aCloseRotateSpeed = AngleDeg(0.0f);
        
    // setup attack distances
    m_fCloseDistance = 1.5f;
    m_fStopDistance = 0.5f;
    m_fAttackFireTime = 0.5f;
    m_fCloseFireTime = 2.0f;
    m_fIgnoreRange = 200.0f;
    // damage/explode properties
    m_fBlowUpAmount = 100.0f;
    m_fBodyParts = 4;

    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};