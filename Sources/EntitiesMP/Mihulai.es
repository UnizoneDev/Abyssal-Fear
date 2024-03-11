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

1042
%{
#include "StdH.h"
#include "Models/NPCs/Mihulai/Mihulai.h"
%}

uses "EntitiesMP/EnemyBase";

enum MihulaiType {
  0 MHC_NORMAL1   "Normal 1",    // standard variant 1
  1 MHC_NORMAL2   "Normal 2",    // standard variant 2
};

%{

  static INDEX idMihulaiAnim_TPose   = -1;
  static INDEX idMihulaiAnim_Stand   = -1;
  static INDEX idMihulaiAnim_Walk    = -1;
  static INDEX idMihulaiAnim_Wound   = -1;
  static INDEX idMihulaiAnim_Jump    = -1;
  static INDEX idMihulaiAnim_Melee   = -1;
  static INDEX idMihulaiAnim_Death   = -1;
  static INDEX idMihulaiBox_Stand    = -1;
  static INDEX idMihulaiBox_Death    = -1;

// info structure
static EntityInfo eiMihulai = {
  EIBT_FLESH, 175.0f,
  0.0f, 1.25f, 0.0f,    // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}

class CMihulai: CEnemyBase {
name      "Mihulai";
thumbnail "Thumbnails\\Mihulai.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  2 enum MihulaiType m_mhChar "Character" 'C' = MHC_NORMAL1,      // character
  
components:
  1 class   CLASS_BASE				"Classes\\EnemyBase.ecl",
  2 skamodel MODEL_MIHULAI		    "Models\\NPCs\\MihulaiSKA\\Mihulai.smc",
  3 skamodel MODEL_MIHULAIRED       "Models\\NPCs\\MihulaiSKA\\MihulaiRed.smc",

  10 sound   SOUND_HIT              "Models\\NPCs\\Abomination\\Sounds\\Hit.wav",
  11 sound   SOUND_SWING            "Models\\Weapons\\Knife\\Sounds\\Swing.wav",

functions:

  void CMihulai(void) {
  // Get mihulai animation IDs
  idMihulaiAnim_TPose       = ska_GetIDFromStringTable("TPOSE");
  idMihulaiAnim_Stand       = ska_GetIDFromStringTable("STAND");
  idMihulaiAnim_Walk        = ska_GetIDFromStringTable("WALK");
  idMihulaiAnim_Wound       = ska_GetIDFromStringTable("WOUND");
  idMihulaiAnim_Jump        = ska_GetIDFromStringTable("JUMP");
  idMihulaiAnim_Melee       = ska_GetIDFromStringTable("MELEE");
  idMihulaiAnim_Death       = ska_GetIDFromStringTable("DEATH");

  // Get mihulai collision box IDs
  idMihulaiBox_Stand       = ska_GetIDFromStringTable("Stand");
  idMihulaiBox_Death       = ska_GetIDFromStringTable("Death");
};

  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A Mihulai slashed %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiMihulai;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmMihulai, "Data\\Messages\\NPCs\\Mihulai.txt");
    return fnmMihulai;
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
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
    // twitcher can't harm twitcher
    if (!IsOfClass(penInflictor, "Mihulai")) {
      CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
      // if died of chainsaw
      if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
        // must always blowup
        m_fBlowUpAmount = 0;
      }

      if(GetHealth() <= 50.0f) {
        SpawnReminder(this, 5.0f, MIHULAI_RUNAWAY_VAL);
        m_bCoward = TRUE;
      }
    }
  };


  // damage anim
  INDEX AnimForDamage(FLOAT fDamage, enum DamageBodyPartType dbptType) {
    INDEX iAnim;
    iAnim = idMihulaiAnim_Wound;
    GetModelInstance()->AddAnimation(iAnim,AN_CLEAR,1,0);
    return iAnim;
  };

  // death
  INDEX AnimForDeath(void) {
    INDEX iAnim;
    iAnim = idMihulaiAnim_Death;
    GetModelInstance()->AddAnimation(iAnim,AN_CLEAR,1,0);
    return iAnim;
  };

  FLOAT WaitForDust(FLOAT3D &vStretch) {
    vStretch=FLOAT3D(1,1,2);
    vStretch=vStretch*0.3f; 
    return -1.0f;
  };

  void DeathNotify(void) {
    INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idMihulaiBox_Death);
    ASSERT(iBoxIndex>=0);
    ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
    SetSkaColisionInfo();
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    GetModelInstance()->AddAnimation(idMihulaiAnim_Stand,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  void WalkingAnim(void) {
    GetModelInstance()->AddAnimation(idMihulaiAnim_Walk,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  void RunningAnim(void) {
    GetModelInstance()->AddAnimation(idMihulaiAnim_Walk,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
    GetModelInstance()->AddAnimation(idMihulaiAnim_Jump,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
  };

  // --------------------------------------------------------------------------------------
  /* Handle an event, return false if the event is not handled. */
  // --------------------------------------------------------------------------------------
  BOOL HandleEvent(const CEntityEvent &ee)
  {
    if (ee.ee_slEvent == EVENTCODE_EReminder) {
      EReminder eReminder = ((EReminder &) ee);
      if(eReminder.iValue == MIHULAI_RUNAWAY_VAL) {
        m_bCoward = FALSE;
        return TRUE;
      }
    }

    return CEnemyBase::HandleEvent(ee);
  }


  procedures:


  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    if (CalcDist(m_penEnemy) < 2.75f) {
      jump SlashEnemySingle();
    } else if (CalcDist(m_penEnemy) < 12.0f) {
      jump JumpOnEnemy();
    }
    return EReturn();
  };

  // jump on enemy
  JumpOnEnemy(EVoid) {
    GetModelInstance()->AddAnimation(idMihulaiAnim_Jump,AN_CLEAR,1,0);

    // jump
    FLOAT3D vDir = (m_penEnemy->GetPlacement().pl_PositionVector -
                    GetPlacement().pl_PositionVector).Normalize();
    vDir *= !GetRotationMatrix();
    vDir *= m_fCloseRunSpeed*1.5f;
    vDir(2) = 2.5f;
    SetDesiredTranslation(vDir);
    PlaySound(m_soSound, SOUND_SWING, SOF_3D);

    // animation - IGNORE DAMAGE WOUND -
    SpawnReminder(this, 0.5f, 0);
    m_iChargeHitAnimation = idMihulaiAnim_Jump;
    m_fChargeHitDamage = 9.0f;
    m_fChargeHitAngle = 0.0f;
    m_fChargeHitSpeed = 15.0f;
    autocall ChargeHitEnemy() EReturn;
    autowait(0.3f);
    return EReturn();
  };

  SlashEnemySingle(EVoid) {
    // close attack
    GetModelInstance()->AddAnimation(idMihulaiAnim_Melee,AN_CLEAR,1,0);

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
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 4.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();
    return EReturn();
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
    InitAsSkaModel();
    SetPhysicsFlags(EPF_MODEL_WALKING|EPF_HASLUNGS);
    SetCollisionFlags(ECF_MODEL);
    SetFlags(GetFlags()|ENF_ALIVE);
    m_ftFactionType = FT_WILDLIFE;
    SetHealth(100.0f);
    m_fMaxHealth = 100.0f;
    m_fDamageWounded = 40.0f;
    m_iScore = 2500;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 500.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    
        
        
        if(m_mhChar == MHC_NORMAL1) {
          SetSkaModel(MODEL_MIHULAI);
        } else {
          SetSkaModel(MODEL_MIHULAIRED);
        }
        GetModelInstance()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();

        m_fWalkSpeed = FRnd() + 3.5f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*25.0f + 600.0f);
        m_fAttackRunSpeed = FRnd() + 7.5f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*75 + 500.0f);
        m_fCloseRunSpeed = FRnd() + 7.5f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*75 + 500.0f);
        
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 25.0f;
        m_fStopDistance = 1.75f;
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