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

1019
%{
#include "StdH.h"
#include "Models/NPCs/DeadFace/DeadFace.h"
%}

uses "EntitiesMP/EnemyBase";
uses "EntitiesMP/Projectile";

%{

// info structure
static EntityInfo eiDeadFace = {
  EIBT_FLESH, 300.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}


class CDeadFace: CEnemyBase {
name      "DeadFace";
thumbnail "Thumbnails\\DeadFace.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  
components:
  1 class   CLASS_BASE            "Classes\\EnemyBase.ecl",
  2 class   CLASS_PROJECTILE      "Classes\\Projectile.ecl",

 10 model   MODEL_DEADFACE               "Models\\NPCs\\DeadFace\\DeadFace.mdl",
 11 texture TEXTURE_DEADFACE             "Models\\NPCs\\DeadFace\\DeadFace.tex",
 12 texture TEXTURE_DEADFACE_ANGRY       "Models\\NPCs\\DeadFace\\DeadFaceAngry.tex",
 13 texture TEXTURE_DEADFACE_ANGRY2      "Models\\NPCs\\DeadFace\\DeadFaceAngry2.tex",
 14 texture TEXTURE_DEADFACE_INVISIBLE   "Models\\NPCs\\DeadFace\\DeadFaceInvisible.tex",

 // ************** SOUNDS **************
 50 sound   SOUND_HIT            "Models\\NPCs\\EvilUni\\Sounds\\Hit.wav",
 51 sound   SOUND_FIRE           "Models\\NPCs\\DoomImp\\Sounds\\Fire.wav",
 52 sound   SOUND_SWING          "Models\\Weapons\\Knife\\Sounds\\Swing.wav",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A Dead Face made %s feel true fear"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiDeadFace;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmDeadFace,   "Data\\Messages\\NPCs\\DeadFace.txt");
    return fnmDeadFace;
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheTexture(TEXTURE_DEADFACE_ANGRY);
    PrecacheTexture(TEXTURE_DEADFACE_ANGRY2);
    PrecacheTexture(TEXTURE_DEADFACE_INVISIBLE);
    PrecacheSound(SOUND_HIT);
    PrecacheSound(SOUND_FIRE);
    PrecacheSound(SOUND_SWING);
    PrecacheClass(CLASS_PROJECTILE, PRT_DOOMIMP_FIREBALL);
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
    // dead face can't harm dead face
    if (!IsOfClass(penInflictor, "DeadFace")) {
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
    INDEX iAnim = DEADFACE_ANIM_DEFAULT;
    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  // death
  INDEX AnimForDeath(void) {
    SetModelMainTexture(TEXTURE_DEADFACE_INVISIBLE);
    INDEX iAnim = DEADFACE_ANIM_DEFAULT;

    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  FLOAT WaitForDust(FLOAT3D &vStretch) {
    vStretch=FLOAT3D(1,1,2);
    vStretch=vStretch*0.3f; 
    return -1.0f;
  };

  void DeathNotify(void) {
    ChangeCollisionBoxIndexWhenPossible(DEADFACE_COLLISION_BOX_DEATH_BOX);
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    StartModelAnim(DEADFACE_ANIM_DEFAULT, AOF_LOOPING|AOF_NORESTART);
  };

  void WalkingAnim(void) {
    StartModelAnim(DEADFACE_ANIM_DEFAULT, AOF_LOOPING|AOF_NORESTART);
  };

  void RunningAnim(void) {
      StartModelAnim(DEADFACE_ANIM_DEFAULT, AOF_LOOPING|AOF_NORESTART);
  };

  void RotatingAnim(void) {
    RunningAnim();
  };


  procedures:

  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    // close attack
    StartModelAnim(DEADFACE_ANIM_DEFAULT, 0);
    SetModelMainTexture(TEXTURE_DEADFACE_ANGRY);
    m_bFistHit = FALSE;
    autowait(0.35f);
    SetModelMainTexture(TEXTURE_DEADFACE_ANGRY2);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      PlaySound(m_soSound, SOUND_HIT, SOF_3D);
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.15f);
    SetModelMainTexture(TEXTURE_DEADFACE_ANGRY);
    autowait(0.15f);
    SetModelMainTexture(TEXTURE_DEADFACE);
    MaybeSwitchToAnotherPlayer();
    return EReturn();
  };

  Fire(EVoid) : CEnemyBase::Fire
  {
    SetModelMainTexture(TEXTURE_DEADFACE_INVISIBLE);
    m_vDesiredPosition = FLOAT3D(FRnd()+3.0f-9.0f, 0.0f, FRnd()+3.0f-9.0f);
    SetDesiredTranslation(m_vDesiredPosition);

    autocall DeadFaceFireballAttack() EEnd;

    SetModelMainTexture(TEXTURE_DEADFACE_INVISIBLE);
    m_vDesiredPosition = FLOAT3D(FRnd()+3.0f-9.0f, 0.0f, FRnd()+3.0f-9.0f);
    SetDesiredTranslation(m_vDesiredPosition);

    return EReturn();
  };

  // DeadFace Fireball attack
  DeadFaceFireballAttack(EVoid) {
    autowait(0.25f + FRnd()/4);

    StartModelAnim(DEADFACE_ANIM_DEFAULT, 0);
    SetModelMainTexture(TEXTURE_DEADFACE_ANGRY);
    autowait(0.075f);
    SetModelMainTexture(TEXTURE_DEADFACE_INVISIBLE);
    
    autowait(0.25f);
    SetModelMainTexture(TEXTURE_DEADFACE_ANGRY2);
    ShootProjectile(PRT_DOOMIMP_FIREBALL, FLOAT3D(0.0f, 1.0f, 0.0f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_FIRE, SOF_3D);
    autowait(0.075f);
    SetModelMainTexture(TEXTURE_DEADFACE_INVISIBLE);
    autowait(0.25f);
    SetModelMainTexture(TEXTURE_DEADFACE_ANGRY2);
    ShootProjectile(PRT_DOOMIMP_FIREBALL, FLOAT3D(0.0f, 1.0f, 0.0f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_FIRE, SOF_3D);
    autowait(0.075f);
    SetModelMainTexture(TEXTURE_DEADFACE_INVISIBLE);
    autowait(0.25f);
    SetModelMainTexture(TEXTURE_DEADFACE_ANGRY2);
    ShootProjectile(PRT_DOOMIMP_FIREBALL, FLOAT3D(0.0f, 1.0f, 0.0f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_FIRE, SOF_3D);

    autowait(0.45f + FRnd()/3);
    SetModelMainTexture(TEXTURE_DEADFACE_ANGRY);
    autowait(0.075f);
    SetModelMainTexture(TEXTURE_DEADFACE);
    MaybeSwitchToAnotherPlayer();
    return EEnd();
  };


/************************************************************
 *                       M  A  I  N                         *
 ************************************************************/
  Main(EVoid) {
    // declare yourself as a model
    InitAsModel();
    SetPhysicsFlags(EPF_MODEL_FLYING|EPF_HASLUNGS|EPF_NOACCELERATION);
    SetCollisionFlags(ECF_MODEL);
    SetFlags(GetFlags()|ENF_ALIVE);
    m_ftFactionType = FT_GREATER;
    SetHealth(200.0f);
    m_fMaxHealth = 200.0f;
    en_tmMaxHoldBreath = 5.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance
    SetModel(MODEL_DEADFACE);
        // set your texture
        SetModelMainTexture(TEXTURE_DEADFACE);
        // setup moving speed
        m_fWalkSpeed = FRnd() + 4.0f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 600.0f);
        m_fAttackRunSpeed = FRnd() + 8.0f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 300.0f);
        m_fCloseRunSpeed = FRnd() + 8.0f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 300.0f);
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 2.5f;
        m_fStopDistance = 0.0f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 1.0f;
        m_fIgnoreRange = 200.0f;
        // damage/explode properties
        m_fBlowUpAmount = 80.0f;
        m_fBodyParts = 4;
        m_fDamageWounded = 135.0f;
        m_iScore = 5000;

    // set stretch factors for height and width
    GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
    ModelChangeNotify();
    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};