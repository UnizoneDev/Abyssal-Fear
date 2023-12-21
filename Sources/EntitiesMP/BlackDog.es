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

1029
%{
#include "StdH.h"
#include "Models/NPCs/BlackDog/BlackDog.h"
%}

uses "EntitiesMP/EnemyWildlife";

enum BlackDogType {
  0 BDT_BLACKDOG    "Black Dog",    // standard variant
  1 BDT_FLESHHOUND  "Flesh Hound",  // gluttony variant
};

%{

// info structure
static EntityInfo eiBlackDog = {
  EIBT_FLESH, 200.0f,
  0.0f, 1.5f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}

class CBlackDog: CEnemyWildlife {
name      "Black Dog";
thumbnail "Thumbnails\\BlackDog.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  2 enum BlackDogType m_bdChar "Character" 'C' = BDT_BLACKDOG,      // character
  
components:
  1 class   CLASS_BASE				"Classes\\EnemyWildlife.ecl",
  2 model   MODEL_BLACKDOG		    "Models\\NPCs\\BlackDog\\BlackDog.mdl",
  3 texture TEXTURE_BLACKDOG   		"Models\\NPCs\\BlackDog\\BlackDog.tex",
  4 texture TEXTURE_FLESHHOUND   	"Models\\NPCs\\BlackDog\\FleshHound.tex",

  10 sound   SOUND_BITE             "Models\\NPCs\\BlackDog\\Sounds\\Bite.wav",
  11 sound   SOUND_SIGHT1           "Models\\NPCs\\BlackDog\\Sounds\\Sight1.wav",
  12 sound   SOUND_SIGHT2           "Models\\NPCs\\BlackDog\\Sounds\\Sight2.wav",
  13 sound   SOUND_IDLE1            "Models\\NPCs\\BlackDog\\Sounds\\Idle1.wav",
  14 sound   SOUND_IDLE2            "Models\\NPCs\\BlackDog\\Sounds\\Idle2.wav",
  15 sound   SOUND_DEATH            "Models\\NPCs\\BlackDog\\Sounds\\Death.wav",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A black dog gnawed on %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiBlackDog;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmBlackDog, "Data\\Messages\\NPCs\\BlackDog.txt");
    return fnmBlackDog;
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_BITE);
    PrecacheSound(SOUND_SIGHT1);
    PrecacheSound(SOUND_SIGHT2);
    PrecacheSound(SOUND_IDLE1);
    PrecacheSound(SOUND_IDLE2);
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
    // twitcher can't harm twitcher
    if (!IsOfClass(penInflictor, "Black Dog")) {
      CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
      // if died of chainsaw
      if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
        // must always blowup
        m_fBlowUpAmount = 0;
      }

      if(IsDerivedFromClass(penInflictor, "Enemy Base")) {
        SetTargetHardForce(penInflictor);
      }
    }
  };


  // damage anim
  INDEX AnimForDamage(FLOAT fDamage, enum DamageBodyPartType dbptType) {
    INDEX iAnim;
    iAnim = BLACKDOG_ANIM_WOUND;
    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  // death
  INDEX AnimForDeath(void) {
    INDEX iAnim;
    iAnim = BLACKDOG_ANIM_DEATH;
    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  FLOAT WaitForDust(FLOAT3D &vStretch) {
    vStretch=FLOAT3D(1,1,2);
    vStretch=vStretch*0.3f; 
    return -1.0f;
  };

  void DeathNotify(void) {
    ChangeCollisionBoxIndexWhenPossible(BLACKDOG_COLLISION_BOX_DEATH_BOX);
    
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartModelAnim(BLACKDOG_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART);
  };

  void WalkingAnim(void) {
    StartModelAnim(BLACKDOG_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
  };

  void RunningAnim(void) {
    StartModelAnim(BLACKDOG_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
    StartModelAnim(BLACKDOG_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
  };

  void EatingAnim(void) {
    StartModelAnim(BLACKDOG_ANIM_BITE, AOF_LOOPING|AOF_NORESTART);
  };

  void SightSound(void) {
    switch(IRnd()%2)
    {
        case 0: PlaySound(m_soSound, SOUND_SIGHT1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_SIGHT2, SOF_3D); break;
        default: ASSERTALWAYS("BlackDog unknown sight sound");
    }
  };

  void IdleSound(void) {
    switch(IRnd()%2)
    {
        case 0: PlaySound(m_soSound, SOUND_IDLE1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_IDLE2, SOF_3D); break;
        default: ASSERTALWAYS("BlackDog unknown idle sound");
    }
  };

  void DeathSound(void) {
    PlaySound(m_soSound, SOUND_DEATH, SOF_3D);
  };


  procedures:


  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    // hit
    if (CalcDist(m_penEnemy) < 2.75f) {
      jump BiteEnemy();
    // jump
    } else if (CalcDist(m_penEnemy) < 14.0f) {
      jump JumpOnEnemy();
    }
    return EReturn();
  };

  // jump on enemy
  JumpOnEnemy(EVoid) {
    StartModelAnim(BLACKDOG_ANIM_LEAP, 0);

    // jump
    FLOAT3D vDir = (m_penEnemy->GetPlacement().pl_PositionVector -
                    GetPlacement().pl_PositionVector).Normalize();
    vDir *= !GetRotationMatrix();
    vDir *= m_fCloseRunSpeed*2.0f;
    vDir(2) = 3.0f;
    SetDesiredTranslation(vDir);

    // animation - IGNORE DAMAGE WOUND -
    SpawnReminder(this, 0.5f, 0);
    m_iChargeHitAnimation = BLACKDOG_ANIM_LEAP;
    if (m_bdChar==BDT_FLESHHOUND) {
      m_fChargeHitDamage = 15.0f;
    } else {
      m_fChargeHitDamage = 10.0f;
    }
    m_fChargeHitAngle = 0.0f;
    m_fChargeHitSpeed = 8.0f;
    autocall CEnemyBase::ChargeHitEnemy() EReturn;
    autowait(0.35f);

    if(!CheckIfFull()) {
      MaybeSwitchToAnotherFood();
    } else {
      MaybeSwitchToAnotherPlayer();
    }
    return EReturn();
  };

  BiteEnemy(EVoid) {
    // close attack
    StartModelAnim(BLACKDOG_ANIM_BITE, 0);
    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < 2.75f) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        PlaySound(m_soSound, SOUND_BITE, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        if (m_bdChar==BDT_FLESHHOUND) {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 12.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        } else {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 8.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
      }
    } else {
      SightSound();
    }

    autowait(0.3f);
    if(!CheckIfFull()) {
      MaybeSwitchToAnotherFood();
    } else {
      MaybeSwitchToAnotherPlayer();
    }
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
    m_ftFactionType = FT_WILDLIFE;
    if (m_bdChar==BDT_FLESHHOUND) {
      SetHealth(175.0f);
      m_fMaxHealth = 175.0f;
      m_fDamageWounded = 60.0f;
      m_iScore = 5000;
    } else {
      SetHealth(100.0f);
      m_fMaxHealth = 100.0f;
      m_fDamageWounded = 40.0f;
      m_iScore = 2500;
    }
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 800.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    
        
        SetModel(MODEL_BLACKDOG);

        if (m_bdChar==BDT_FLESHHOUND) {
          SetModelMainTexture(TEXTURE_FLESHHOUND);
        } else {
          SetModelMainTexture(TEXTURE_BLACKDOG);
        }

        GetModelObject()->StretchModel(FLOAT3D(1.0f, 1.0f, 1.0f));
        ModelChangeNotify();

        m_fWalkSpeed = FRnd() + 2.5f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
        m_fAttackRunSpeed = FRnd() + 6.5f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
        m_fCloseRunSpeed = FRnd() + 6.5f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
        
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 22.0f;
        m_fStopDistance = 1.5f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 1.0f;
        m_fIgnoreRange = 200.0f;
        // damage/explode properties
        m_fBlowUpAmount = 100.0f;
        m_fBodyParts = 4;

    StandingAnim();

    // continue behavior in base class
    jump CEnemyWildlife::MainLoop();
  };
};