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

1041
%{
#include "StdH.h"

#include "EntitiesMP/Player.h"

#include "Models/NPCs/Utamahi/Utamahi.h"
%}

uses "EntitiesMP/EnemyBase";

%{

// info structure
static EntityInfo eiUtamahi = {
  EIBT_FLESH, 400.0f,
  0.0f, 1.5f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}

class CUtamahi: CEnemyBase {
name      "Utamahi";
thumbnail "Thumbnails\\Utamahi.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  
components:
  1 class   CLASS_BASE				"Classes\\EnemyBase.ecl",
  2 model   MODEL_UTAMAHI		    "Models\\NPCs\\Utamahi\\Utamahi.mdl",
  3 texture TEXTURE_UTAMAHI         "Models\\NPCs\\Utamahi\\Utamahi.tex",

  10 sound   SOUND_SLICE1           "Models\\NPCs\\Twitcher\\Sounds\\Slice1.wav",
  11 sound   SOUND_SLICE2           "Models\\NPCs\\Twitcher\\Sounds\\Slice2.wav",
  12 sound   SOUND_SLICE3           "Models\\NPCs\\Twitcher\\Sounds\\Slice3.wav",
  13 sound   SOUND_SWING            "Models\\Weapons\\Knife\\Sounds\\Swing.wav",
  14 sound   SOUND_CLASH1           "Sounds\\Weapons\\MetalBladeClash1.wav",
  15 sound   SOUND_CLASH2           "Sounds\\Weapons\\MetalBladeClash2.wav",
  16 sound   SOUND_CLASH3           "Sounds\\Weapons\\MetalBladeClash3.wav",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("An Utamahi sliced %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiUtamahi;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmUtamahi, "Data\\Messages\\NPCs\\Utamahi.txt");
    return fnmUtamahi;
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_SLICE1);
    PrecacheSound(SOUND_SLICE2);
    PrecacheSound(SOUND_SLICE3);
    PrecacheSound(SOUND_CLASH1);
    PrecacheSound(SOUND_CLASH2);
    PrecacheSound(SOUND_CLASH3);
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
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
    // twitcher can't harm twitcher
    if (!IsOfClass(penInflictor, "Utamahi")) {
      CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
      // if died of chainsaw
      if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
        // must always blowup
        m_fBlowUpAmount = 0;
      }
    }
  };


  // damage anim
  INDEX AnimForDamage(FLOAT fDamage, enum DamageBodyPartType dbptType) {
    INDEX iAnim;
    iAnim = UTAMAHI_ANIM_WOUND;
    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  // death
  INDEX AnimForDeath(void) {
    INDEX iAnim;
    iAnim = UTAMAHI_ANIM_DEATH;
    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  FLOAT WaitForDust(FLOAT3D &vStretch) {
    vStretch=FLOAT3D(1,1,2);
    vStretch=vStretch*0.3f; 
    return -1.0f;
  };

  void DeathNotify(void) {
    ChangeCollisionBoxIndexWhenPossible(UTAMAHI_COLLISION_BOX_DEATH_BOX);
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartModelAnim(UTAMAHI_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
  };

  void WalkingAnim(void) {
    StartModelAnim(UTAMAHI_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
  };

  void RunningAnim(void) {
    StartModelAnim(UTAMAHI_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
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
    jump SlashEnemySingle();
    return EReturn();
  };

  SlashEnemySingle(EVoid) {
    // close attack
    switch(IRnd()%2)
    {
      case 0: StartModelAnim(UTAMAHI_ANIM_MELEE1, 0); break;
      case 1: StartModelAnim(UTAMAHI_ANIM_MELEE2, 0); break;
      default: ASSERTALWAYS("Utamahi unknown melee animation");
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vProperDamageDir = (vDirection.ManhattanNorm() > m_fBlockDirAmount) ? vDirection : -en_vGravityDir;
        vProperDamageDir = (vProperDamageDir - en_vGravityDir * m_fBlockDirAmount).Normalize();

        if(IsOfClass(m_penEnemy, "Player")) {
          CPlayer &pl = (CPlayer&)*m_penEnemy;

          if(pl.m_bIsBlocking == TRUE) {
            if (pl.GetPlaneFrustumAngle(vProperDamageDir) < Cos(pl.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        } else if(IsDerivedFromClass(m_penEnemy, "Enemy Base")) {
          CEnemyBase &eb = (CEnemyBase&)*m_penEnemy;

          if(eb.m_bIsBlocking == TRUE) {
            if (eb.GetPlaneFrustumAngle(vProperDamageDir) < Cos(eb.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        }

        InflictDirectDamage(m_penEnemy, this, DMT_SHARP, 10.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();
    return EReturn();
  }

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
    SetHealth(450.0f);
    m_fMaxHealth = 450.0f;
    m_fDamageWounded = 145.0f;
    m_iScore = 10000;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    
        
        SetModel(MODEL_UTAMAHI);
        SetModelMainTexture(TEXTURE_UTAMAHI);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();

        m_fWalkSpeed = FRnd() + 3.0f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
        m_fAttackRunSpeed = FRnd() + 6.5f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 300.0f);
        m_fCloseRunSpeed = FRnd() + 6.5f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 300.0f);
        
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 3.25f;
        m_fStopDistance = 1.5f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 1.0f;
        m_fIgnoreRange = 200.0f;
        // damage/explode properties
        m_fBlowUpAmount = 250.0f;
        m_fBodyParts = 4;

    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};