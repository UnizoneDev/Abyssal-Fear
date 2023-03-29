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

1028
%{
#include "StdH.h"
#include "Models/NPCs/Kahari/Kahari.h"
%}

uses "EntitiesMP/EnemyBase";

%{

// info structure
static EntityInfo eiKahari = {
  EIBT_FLESH, 200.0f,
  0.0f, 1.5f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}

class CKahari: CEnemyBase {
name      "Kahari";
thumbnail "Thumbnails\\Kahari.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  
components:
  1 class   CLASS_BASE				"Classes\\EnemyBase.ecl",
  2 model   MODEL_KAHARI		    "Models\\NPCs\\Kahari\\Kahari.mdl",
  3 texture TEXTURE_KAHARI   		"Models\\NPCs\\Kahari\\Kahari.tex",

  10 sound   SOUND_HIT              "Models\\NPCs\\Abomination\\Sounds\\Hit.wav",
  11 sound   SOUND_SWING            "Models\\Weapons\\Knife\\Sounds\\Swing.wav",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A kahari sliced %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiKahari;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmKahari, "Data\\Messages\\NPCs\\Kahari.txt");
    return fnmKahari;
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
    // twitcher can't harm twitcher
    if (!IsOfClass(penInflictor, "Kahari")) {
      CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection);
      // if died of chainsaw
      if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
        // must always blowup
        m_fBlowUpAmount = 0;
      }
    }
  };


  // damage anim
  INDEX AnimForDamage(FLOAT fDamage) {
    INDEX iAnim;
    iAnim = KAHARI_ANIM_WOUND;
    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  // death
  INDEX AnimForDeath(void) {
    INDEX iAnim;
    FLOAT3D vFront;
      GetHeadingDirection(0, vFront);
      FLOAT fDamageDir = m_vDamage%vFront;

      if (fDamageDir<0) {
          iAnim = KAHARI_ANIM_DEATHFRONT;
        } else {
          iAnim = KAHARI_ANIM_DEATHBACK;
        }

    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  FLOAT WaitForDust(FLOAT3D &vStretch) {
    vStretch=FLOAT3D(1,1,2);
    vStretch=vStretch*0.3f; 
    return -1.0f;
  };

  void DeathNotify(void) {
    if(GetModelObject()->GetAnim()==KAHARI_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(KAHARI_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else
    {
      ChangeCollisionBoxIndexWhenPossible(KAHARI_COLLISION_BOX_BACKDEATH_BOX);
    }
    
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartModelAnim(KAHARI_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
  };

  void WalkingAnim(void) {
    StartModelAnim(KAHARI_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
  };

  void RunningAnim(void) {
      StartModelAnim(KAHARI_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
    StartModelAnim(KAHARI_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
  };


  procedures:


  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    // hit
    if (CalcDist(m_penEnemy) < 2.5f) {
        switch(IRnd()%2)
        {
            case 0: jump SlashEnemySingle(); break;
            case 1: jump SlashEnemySingle2(); break;
            default: ASSERTALWAYS("Kahari unknown melee attack");
        }
    // jump
    } else if (CalcDist(m_penEnemy) < 16.0f) {
      jump JumpOnEnemy();
    }
    return EReturn();
  };

  // jump on enemy
  JumpOnEnemy(EVoid) {
    StartModelAnim(KAHARI_ANIM_LEAPATTACK, 0);

    // jump
    FLOAT3D vDir = (m_penEnemy->GetPlacement().pl_PositionVector -
                    GetPlacement().pl_PositionVector).Normalize();
    vDir *= !GetRotationMatrix();
    vDir *= m_fCloseRunSpeed*2.0f;
    vDir(2) = 2.5f;
    SetDesiredTranslation(vDir);

    // animation - IGNORE DAMAGE WOUND -
    SpawnReminder(this, 0.5f, 0);
    m_iChargeHitAnimation = KAHARI_ANIM_LEAPATTACK;
    m_fChargeHitDamage = 25.0f;
    m_fChargeHitAngle = 0.0f;
    m_fChargeHitSpeed = 8.0f;
    autocall CEnemyBase::ChargeHitEnemy() EReturn;
    autowait(0.35f);
    return EReturn();
  };

  SlashEnemySingle(EVoid) {
    // close attack
    StartModelAnim(KAHARI_ANIM_MELEE1, 0);
    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < 2.8f) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      PlaySound(m_soSound, SOUND_HIT, SOF_3D);
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, FLOAT3D(0, 0, 0), vDirection);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();
    return EReturn();
  }

  SlashEnemySingle2(EVoid) {
    // close attack
    StartModelAnim(KAHARI_ANIM_MELEE2, 0);
    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < 2.8f) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      PlaySound(m_soSound, SOUND_HIT, SOF_3D);
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, FLOAT3D(0, 0, 0), vDirection);
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
    SetHealth(600.0f);
    m_fMaxHealth = 600.0f;
    m_fDamageWounded = 240.0f;
    m_iScore = 10000;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    
        
        SetModel(MODEL_KAHARI);
        SetModelMainTexture(TEXTURE_KAHARI);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();

        m_fWalkSpeed = FRnd() + 2.5f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
        m_fAttackRunSpeed = FRnd() + 7.5f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
        m_fCloseRunSpeed = FRnd() + 7.5f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
        
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 25.0f;
        m_fStopDistance = 1.75f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 1.0f;
        m_fIgnoreRange = 200.0f;
        // damage/explode properties
        m_fBlowUpAmount = 80.0f;
        m_fBodyParts = 4;

    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};