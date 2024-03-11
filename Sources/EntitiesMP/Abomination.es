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

1003
%{
#include "StdH.h"
#include "Models/NPCs/Abomination/Abomination.h"
%}

uses "EntitiesMP/EnemyBase";
uses "EntitiesMP/Projectile";

enum AbominationType {
  0 ABC_STANDARD   "Standard",    // standard variant
  1 ABC_GLUTTON    "Glutton",     // gluttony variant
};

%{

// info structure
static EntityInfo eiAbomination = {
  EIBT_FLESH, 1000.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

// info structure
static EntityInfo eiAbominationGlutton = {
  EIBT_FLESH, 1500.0f,
  0.0f, 2.5f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}


class CAbomination: CEnemyBase {
name      "Abomination";
thumbnail "Thumbnails\\Abomination.tbn";

properties:
  1 enum AbominationType m_abChar "Character" 'C' = ABC_STANDARD,      // character
  2 BOOL m_bFistHit = FALSE,
  3 BOOL m_bMoveFast "Move Fast" = FALSE,
  4 BOOL m_bCanCharge "Can Charge" = FALSE,
  
components:
  1 class   CLASS_BASE            "Classes\\EnemyBase.ecl",
  2 class   CLASS_PROJECTILE      "Classes\\Projectile.ecl",

 10 model   MODEL_ABOMINATION               "Models\\NPCs\\Abomination\\Abomination.mdl",
 11 texture TEXTURE_ABOMINATION             "Models\\NPCs\\Abomination\\Abomination.tex",
 12 texture TEXTURE_ABOMINATION_GLUTTON     "Models\\NPCs\\Abomination\\AbominationStrong.tex",

 // ************** SOUNDS **************
 50 sound   SOUND_HIT       "Models\\NPCs\\Abomination\\Sounds\\Hit.wav",
 51 sound   SOUND_IDLE1      "Models\\NPCs\\Abomination\\Sounds\\Idle1.wav",
 52 sound   SOUND_IDLE2      "Models\\NPCs\\Abomination\\Sounds\\Idle2.wav",
 53 sound   SOUND_SIGHT1     "Models\\NPCs\\Abomination\\Sounds\\Sight1.wav",
 54 sound   SOUND_SIGHT2     "Models\\NPCs\\Abomination\\Sounds\\Sight2.wav",
 55 sound   SOUND_WOUND     "Models\\NPCs\\Abomination\\Sounds\\Wound.wav",
 56 sound   SOUND_DEATH     "Models\\NPCs\\Abomination\\Sounds\\Death.wav",
 57 sound   SOUND_SWING     "Models\\Weapons\\Knife\\Sounds\\Swing.wav",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("An Abomination pulverized %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    if (m_abChar==ABC_STANDARD) {
      return &eiAbomination;
    } else {
      return &eiAbominationGlutton;
    }
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmAbominationGlutton, "Data\\Messages\\NPCs\\AbominationGlutton.txt");
    static DECLARE_CTFILENAME(fnmAbomination , "Data\\Messages\\NPCs\\Abomination.txt");
    switch(m_abChar) {
    default: ASSERT(FALSE);
    case ABC_GLUTTON: return fnmAbominationGlutton;
    case ABC_STANDARD : return fnmAbomination;
    }
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_HIT);
    PrecacheSound(SOUND_SWING);
    PrecacheSound(SOUND_IDLE1);
    PrecacheSound(SOUND_IDLE2);
    PrecacheSound(SOUND_SIGHT1);
    PrecacheSound(SOUND_SIGHT2);
    PrecacheSound(SOUND_WOUND);
    PrecacheSound(SOUND_DEATH);
    PrecacheClass(CLASS_PROJECTILE, PRT_MUTANT_SPIT);
  };

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    CEnemyBase::FillEntityStatistics(pes);
    switch(m_abChar) {
    case ABC_STANDARD: { pes->es_strName+=" Beast"; } break;
    case ABC_GLUTTON : { pes->es_strName+=" Mutant"; } break;
    }
    return TRUE;
  }

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
    // abomination can't harm abomination
    if (!IsOfClass(penInflictor, "Abomination")) {
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
    iAnim = ABOMINATION_ANIM_WOUND;
    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  // death
  INDEX AnimForDeath(void) {
    INDEX iAnim;
    iAnim = ABOMINATION_ANIM_DEATH;
    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  FLOAT WaitForDust(FLOAT3D &vStretch) {
    vStretch=FLOAT3D(1,1,2);
    vStretch=vStretch*0.3f; 
    return -1.0f;
  };

  void DeathNotify(void) {
    ChangeCollisionBoxIndexWhenPossible(ABOMINATION_COLLISION_BOX_DEATH_BOX);
    en_fDensity = 700.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartModelAnim(ABOMINATION_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
  };

  void WalkingAnim(void) {
    StartModelAnim(ABOMINATION_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
  };

  void RunningAnim(void) {
      if (m_bMoveFast) {
        StartModelAnim(ABOMINATION_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
      } else {
        StartModelAnim(ABOMINATION_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
      }
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
      StartModelAnim(ABOMINATION_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
  };

  void CrouchingAnim(void) {
      StartModelAnim(ABOMINATION_ANIM_CROUCH, AOF_LOOPING|AOF_NORESTART);
  };

  void CrawlingAnim(void) {
      StartModelAnim(ABOMINATION_ANIM_CRAWL, AOF_LOOPING|AOF_NORESTART);
  };

  // virtual sound functions
  void IdleSound(void) {
    switch(IRnd()%2)
    {
      case 0: PlaySound(m_soSound, SOUND_IDLE1, SOF_3D); break;
      case 1: PlaySound(m_soSound, SOUND_IDLE2, SOF_3D); break;
      default: ASSERTALWAYS("Abomination unknown idle sound");
    }
  };

  void SightSound(void) {
    switch(IRnd()%2)
    {
      case 0: PlaySound(m_soSound, SOUND_SIGHT1, SOF_3D); break;
      case 1: PlaySound(m_soSound, SOUND_SIGHT2, SOF_3D); break;
      default: ASSERTALWAYS("Abomination unknown sight sound");
    }
  };

  void WoundSound(void) {
    PlaySound(m_soSound, SOUND_WOUND, SOF_3D);
  };

  void DeathSound(void) {
    PlaySound(m_soSound, SOUND_DEATH, SOF_3D);
  };


  procedures:

  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    if (CalcDist(m_penEnemy) < 2.75f) {
      switch(IRnd()%2)
      {
        case 0: jump PunchEnemy(); break;
        case 1: jump SlamEnemy(); break;
        default: ASSERTALWAYS("Abomination unknown melee attack");
      }
    } else if (CalcDist(m_penEnemy) < 16.0f && m_bCanCharge && IsInPlaneFrustum(m_penEnemy, CosFast(30.0f))) {
      jump JumpOnEnemy();
    }
    return EReturn();
  };

  PunchEnemy(EVoid) {
    // close attack
    StartModelAnim(ABOMINATION_ANIM_MELEE, 0);
    m_bFistHit = FALSE;
    autowait(0.55f);
    if (CalcDist(m_penEnemy) < 2.75f) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < 2.75f) {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        if (m_abChar==ABC_GLUTTON) {
          InflictDirectDamage(m_penEnemy, this, DMT_STING, 30.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        } else {
          InflictDirectDamage(m_penEnemy, this, DMT_STING, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }
    
    autowait(0.45f);
    MaybeSwitchToAnotherPlayer();
    return EReturn();
  }

  SlamEnemy(EVoid) {
    // close attack
    StartModelAnim(ABOMINATION_ANIM_SLAM, 0);
    m_bFistHit = FALSE;
    autowait(0.55f);
    if (CalcDist(m_penEnemy) < 2.75f) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < 2.75f) {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        if (m_abChar==ABC_GLUTTON) {
          InflictDirectDamage(m_penEnemy, this, DMT_PUNCH, 25.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        } else {
          InflictDirectDamage(m_penEnemy, this, DMT_PUNCH, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }
    
    autowait(0.45f);
    MaybeSwitchToAnotherPlayer();
    return EReturn();
  }

  // jump on enemy
  JumpOnEnemy(EVoid) {
    StartModelAnim(ABOMINATION_ANIM_CHARGE, 0);

    // charge without jumping
    FLOAT3D vDir = (m_penEnemy->GetPlacement().pl_PositionVector -
                    GetPlacement().pl_PositionVector).Normalize();
    vDir *= !GetRotationMatrix();
    vDir *= m_fCloseRunSpeed*2.0f;
    SetDesiredTranslation(vDir);

    // animation - IGNORE DAMAGE WOUND -
    SpawnReminder(this, 0.5f, 0);
    m_iChargeHitAnimation = ABOMINATION_ANIM_CHARGE;
    m_fChargeHitDamage = 35.0f;
    m_fChargeHitAngle = 0.0f;
    m_fChargeHitSpeed = 8.0f;
    autocall ChargeHitEnemy() EReturn;
    autowait(0.35f);
    return EReturn();
  };


  Fire(EVoid) : CEnemyBase::Fire
  {
    if (m_abChar==ABC_GLUTTON) {
      autocall AbominationSpitAttack() EEnd;
    }
    return EReturn();
  };

  // Abomination Blood Spit attack
  AbominationSpitAttack(EVoid) {
    autowait(0.35f + FRnd()/4);

    StartModelAnim(ABOMINATION_ANIM_SPIT, 0);
    autowait(0.375f);
    ShootProjectile(PRT_MUTANT_SPIT, FLOAT3D(-0.25f, 4.75f, 0.0f), ANGLE3D(2.0f, 0, 0));
    ShootProjectile(PRT_MUTANT_SPIT, FLOAT3D(0.0f, 4.75f, 0.0f), ANGLE3D(0, 0, 0));
    ShootProjectile(PRT_MUTANT_SPIT, FLOAT3D(0.25f, 4.75f, 0.0f), ANGLE3D(-2.0f, 0, 0));
    PlaySound(m_soSound, SOUND_HIT, SOF_3D);

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();
    return EEnd();
  };

  // --------------------------------------------------------------------------------------
  // Call this to jump onto player - set charge properties before calling and spawn a reminder.
  // --------------------------------------------------------------------------------------
  ChargeHitEnemy(EVoid) : CEnemyBase::ChargeHitEnemy
  {
    m_tmChargeHitStarted = _pTimer->CurrentTick(); // Remember startup time.

    // wait for length of hit animation
    // TODO: Make it better!
    wait(ClampUp(GetAnimLength(m_iChargeHitAnimation), m_tmMaxChargeHitLength)) // [SSE] Charge Hit Restriction
    {
      on (EBegin) : { resume; }
      on (ETimer) : { stop; }
      // ignore damages
      on (EDamage) : { resume; }
      // if user-set reminder expired
      on (EReminder) : {
        // stop moving
        StopMoving();
        resume;
      }
      // if you touch some entity
      on (ETouch etouch) :
      {
        // if it is alive and in front
        if ((etouch.penOther->GetFlags()&ENF_ALIVE) && IsInPlaneFrustum(etouch.penOther, CosFast(60.0f))) {
          PlaySound(m_soSound, SOUND_HIT, SOF_3D);
          // get your direction
          FLOAT3D vSpeed;
          GetHeadingDirection(m_fChargeHitAngle, vSpeed);
          // damage entity in that direction
          InflictDirectDamage(etouch.penOther, this, DMT_CLOSERANGE, m_fChargeHitDamage, FLOAT3D(0, 0, 0), vSpeed, DBPT_GENERIC);
          // push it away
          vSpeed = vSpeed * m_fChargeHitSpeed;
          KickEntity(etouch.penOther, vSpeed);
          // stop waiting
          stop;
        }
        pass;
      }
    }

    // if the anim is not yet finished
    if (!IsAnimFinished()) 
    {
      FLOAT tmDelta = _pTimer->CurrentTick() - m_tmChargeHitStarted;
  
      // wait the rest of time till the anim end
      wait(tmDelta <= m_tmMaxChargeHitLength ? ClampUp(GetCurrentAnimLength(), m_tmMaxChargeHitLength) - tmDelta : _pTimer->TickQuantum) // [SSE] Charge Hit Restriction
      {
        on (EBegin) : { resume; }
        on (ETimer) : { stop; }
        // if timer expired
        on (EReminder) : {
          // stop moving
          StopMoving();
          resume;
        }
      }
    }

    // return to caller
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
    if (m_abChar==ABC_GLUTTON) {
      SetHealth(750.0f);
      m_fMaxHealth = 750.0f;
      // damage/explode properties
      m_fBlowUpAmount = 130.0f;
      m_fBodyParts = 8;
      m_fBlowUpSize = 3.0f;
      m_fDamageWounded = 300.0f;
      en_fDensity = 4000.0f;
    } else {
      SetHealth(400.0f);
      m_fMaxHealth = 400.0f;
      // damage/explode properties
      m_fBlowUpAmount = 100.0f;
      m_fBodyParts = 8;
      m_fBlowUpSize = 3.0f;
      m_fDamageWounded = 190.0f;
      en_fDensity = 2750.0f;
    }

        // set your appearance
        SetModel(MODEL_ABOMINATION);
        // set your texture
        if (m_abChar==ABC_GLUTTON) {
            SetModelMainTexture(TEXTURE_ABOMINATION_GLUTTON);
            GetModelObject()->StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
            ModelChangeNotify();
            m_iScore = 8000;
        } else {
            SetModelMainTexture(TEXTURE_ABOMINATION);
            GetModelObject()->StretchModel(FLOAT3D(1.0f, 1.0f, 1.0f));
            ModelChangeNotify();
            m_iScore = 3000;
        } 
        // setup moving speed
        m_fWalkSpeed = FRnd() + 2.0f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
        m_fAttackRunSpeed = FRnd() + 4.0f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);
        m_fCloseRunSpeed = FRnd() + 4.0f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 250.0f);

        if (m_bMoveFast) {
          m_fWalkSpeed = FRnd() + 3.0f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*25.0f + 600.0f);
          m_fAttackRunSpeed = FRnd() + 6.0f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*60 + 300.0f);
          m_fCloseRunSpeed = FRnd() + 6.0f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*60 + 300.0f);
        }

        // setup attack distances
        if (m_abChar==ABC_GLUTTON) {
          m_fAttackDistance = 300.0f;
          m_fCloseDistance = 25.0f;
          m_fStopDistance = 2.5f;
          m_fAttackFireTime = 1.5f;
          m_fCloseFireTime = 1.5f;
          m_fIgnoreRange = 600.0f;
        }
        else {
          m_fAttackDistance = 100.0f;
          m_fCloseDistance = 25.0f;
          m_fStopDistance = 2.5f;
          m_fAttackFireTime = 1.5f;
          m_fCloseFireTime = 1.5f;
          m_fIgnoreRange = 200.0f;
        }

    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};