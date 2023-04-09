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

1004
%{
#include "StdH.h"
#include "Models/NPCs/Gunman/Gunman.h"
#include "Models/Items/ItemHolder/ItemHolder.h"
#include "Models/Items/Ammo/PistolClip/PistolClip.h"
#include "Models/Items/Ammo/SMGClip/SMGAmmo.h"
#include "Models/Items/Ammo/ShotgunShells/ShotgunAmmo.h"
#include "Models/Items/Keys/WoodenCross/WoodenCross.h"
#include "Models/Items/Keys/GoldenSwastika/Swastika.h"
#include "Models/Items/Keys/GoldenCross/GoldenCross.h"
%}

uses "EntitiesMP/EnemySquad";
uses "EntitiesMP/Projectile";
uses "EntitiesMP/AmmoItem";
uses "EntitiesMP/KeyItem";

enum GunmanType {
  0 GMC_PISTOL   "Standard",        // standard variant
  1 GMC_KEY      "Security",        // key dropping variant
  2 GMC_LEADER   "Squad Leader",    // variant that can give out commands to his members
  3 GMC_SHOTGUN  "Shotgunner",      // shotgun variant
};

%{

// info structure
static EntityInfo eiGunman = {
  EIBT_FLESH, 200.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}


class CGunman: CEnemySquad {
name      "Gunman";
thumbnail "Thumbnails\\Gunman.tbn";

properties:
  1 FLOAT3D m_vStrafeCheckPosition = FLOAT3D(0,0,0),         // check strafe position
  2 BOOL m_bFistHit = FALSE,
  3 enum GunmanType m_gmChar "Character" 'C' = GMC_PISTOL,   // character
  4 enum KeyItemType m_kitType "Key Type" 'K' = KIT_CROSSWOODEN, // key type
  
components:
  1 class   CLASS_BASE            "Classes\\EnemySquad.ecl",
  2 class   CLASS_PROJECTILE      "Classes\\Projectile.ecl",
  3 class   CLASS_AMMO            "Classes\\AmmoItem.ecl",
  4 class   CLASS_KEY             "Classes\\KeyItem.ecl",

 10 model   MODEL_GUNMAN               "Models\\NPCs\\Gunman\\Gunman.mdl",
 11 texture TEXTURE_GUNMAN             "Models\\NPCs\\Gunman\\Gunman.tex",
 12 model   MODEL_PISTOL               "Models\\Weapons\\Pistol\\PistolItem.mdl",
 13 texture TEXTURE_PISTOL             "Models\\Weapons\\Pistol\\Pistol.tex",
 14 texture TEXTURE_GUNMAN_SECURITY    "Models\\NPCs\\Gunman\\GunmanSecurity.tex",
 15 texture TEXTURE_GUNMAN_LEADER      "Models\\NPCs\\Gunman\\GunmanLeader.tex",
 16 model   MODEL_SHOTGUN              "Models\\Weapons\\Shotgun\\ShotgunItem.mdl",
 17 texture TEXTURE_SHOTGUN            "Models\\Weapons\\Shotgun\\Shotgun.tex",

 20 sound   SOUND_FIRE                 "Models\\NPCs\\Gunman\\Sounds\\PistolAttack.wav",
 21 sound   SOUND_HIT                  "Models\\NPCs\\Gunman\\Sounds\\Kick.wav",
 22 sound   SOUND_SWING                "Models\\Weapons\\Knife\\Sounds\\Swing.wav", 
 23 sound   SOUND_FIRE_SHOTGUN         "Models\\NPCs\\Gunman\\Sounds\\ShotgunAttack.wav",

 50 model   MODEL_ITEM            "Models\\Items\\ItemHolder\\ItemHolder.mdl",
 51 model   MODEL_BULLETS         "Models\\Items\\Ammo\\PistolClip\\PistolClip.mdl",
 52 texture TEXTURE_BULLETS       "Models\\Weapons\\Pistol\\Pistol.tex",

 53 model   MODEL_SHELLS         "Models\\Items\\Ammo\\ShotgunShells\\ShotgunAmmo.mdl",
 54 texture TEXTURE_SHELLS       "Models\\Items\\Ammo\\ShotgunShells\\ShotgunShell.tex",

 55 model   MODEL_MEDIUM_BULLETS         "Models\\Items\\Ammo\\SMGClip\\SMGAmmo.mdl",
 56 texture TEXTURE_MEDIUM_BULLETS       "Models\\Weapons\\SMG\\SMG.tex",

 61 model   MODEL_CROSSWOODEN          "Models\\Items\\Keys\\WoodenCross\\WoodenCross.mdl",
 62 texture TEXTURE_CROSSWOODEN        "Models\\Items\\Keys\\WoodenCross\\wood1.tex",
 63 model   MODEL_SWASTIKAGOLDEN       "Models\\Items\\Keys\\GoldenSwastika\\Swastika.mdl",
 64 texture TEXTURE_SWASTIKAGOLDEN     "Models\\Items\\Keys\\GoldenSwastika\\gold1.tex",
 65 model   MODEL_CROSSGOLDEN          "Models\\Items\\Keys\\GoldenCross\\GoldenCross.mdl",
 66 model   MODEL_KEYRUSTED            "Models\\Items\\Keys\\RustedKey\\RustedKey.mdl",
 67 texture TEXTURE_KEYRUSTED          "Models\\Items\\Keys\\RustedKey\\rust1.tex",
 68 model   MODEL_KEYSILVER            "Models\\Items\\Keys\\SilverKey\\SilverKey.mdl",
 69 texture TEXTURE_KEYSILVER          "Models\\Items\\Keys\\SilverKey\\metal11.tex",
 70 model   MODEL_KEYGOLDEN            "Models\\Items\\Keys\\GoldenKey\\GoldenKey.mdl",

 80 texture TEX_REFL_GOLD01       "ModelsMP\\ReflectionTextures\\Gold01.tex",
 81 texture TEX_SPEC_STRONG       "ModelsMP\\SpecularTextures\\Strong.tex",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A Gunman violently arrested %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiGunman;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmGunmanShotgunner, "Data\\Messages\\NPCs\\GunmanShotgunner.txt");
    static DECLARE_CTFILENAME(fnmGunmanLeader, "Data\\Messages\\NPCs\\GunmanLeader.txt");
    static DECLARE_CTFILENAME(fnmGunmanSecurity, "Data\\Messages\\NPCs\\GunmanSecurity.txt");
    static DECLARE_CTFILENAME(fnmGunman, "Data\\Messages\\NPCs\\Gunman.txt");
    switch(m_gmChar) {
    default: ASSERT(FALSE);
    case GMC_SHOTGUN : return fnmGunmanShotgunner;
    case GMC_LEADER: return fnmGunmanLeader;
    case GMC_KEY: return fnmGunmanSecurity;
    case GMC_PISTOL : return fnmGunman;
    }
  };

  /* Drop items */
  void DropItems(void) {
    if(m_gmChar == GMC_KEY)
    {
      CEntityPointer pen = SpawnKey();
      pen->Initialize();

      CKeyItem *penKey = (CKeyItem*)&*pen;
      penKey->m_bDropped = TRUE;
      penKey->m_bPickupOnce = TRUE;
      penKey->m_kitType = m_kitType;

      pen->Reinitialize();
    }
  }

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_FIRE);
    PrecacheSound(SOUND_HIT);
    PrecacheSound(SOUND_SWING);
    PrecacheSound(SOUND_FIRE_SHOTGUN);
    PrecacheClass(CLASS_PROJECTILE, PRT_GUNMAN_BULLET);
    PrecacheClass(CLASS_AMMO, AIT_BULLETS);
    PrecacheClass(CLASS_AMMO, AIT_SHELLS);
    PrecacheClass(CLASS_AMMO, AIT_MEDIUM_BULLETS);
    PrecacheModel(MODEL_ITEM);
    PrecacheModel(MODEL_BULLETS);
    PrecacheTexture(TEXTURE_BULLETS);
    PrecacheModel(MODEL_MEDIUM_BULLETS);
    PrecacheTexture(TEXTURE_MEDIUM_BULLETS);
    PrecacheModel(MODEL_SHELLS);
    PrecacheTexture(TEXTURE_SHELLS);
    PrecacheClass(CLASS_KEY);
    PrecacheModel(MODEL_CROSSWOODEN);
    PrecacheTexture(TEXTURE_CROSSWOODEN);
    PrecacheModel(MODEL_SWASTIKAGOLDEN);
    PrecacheTexture(TEXTURE_SWASTIKAGOLDEN);
    PrecacheModel(MODEL_CROSSGOLDEN);
    PrecacheModel(MODEL_KEYRUSTED);
    PrecacheTexture(TEXTURE_KEYRUSTED);
    PrecacheModel(MODEL_KEYSILVER);
    PrecacheTexture(TEXTURE_KEYSILVER);
    PrecacheModel(MODEL_KEYGOLDEN);
    PrecacheTexture(TEX_REFL_GOLD01);
    PrecacheTexture(TEX_SPEC_STRONG);
  };

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    CEnemyBase::FillEntityStatistics(pes);
    switch(m_gmChar) {
    case GMC_SHOTGUN : { pes->es_strName+=" Shotgunner"; } break;
    case GMC_LEADER: { pes->es_strName+=" Leader"; } break;
    case GMC_KEY: { pes->es_strName+=" Security"; } break;
    case GMC_PISTOL : { pes->es_strName+=" Officer"; } break;
    }
    return TRUE;
  }

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection) 
  {
    // gunman can't harm gunman
    if (!IsOfClass(penInflictor, "Gunman")) {
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
    if (m_gmChar == GMC_SHOTGUN)
    {
      iAnim = GUNMAN_ANIM_WOUNDSHOTGUN;
    }
    else
    {
      iAnim = GUNMAN_ANIM_WOUND;
    }
    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  // death
  INDEX AnimForDeath(void) {
    INDEX iAnim;
    iAnim = GUNMAN_ANIM_DEATH;

    StartModelAnim(iAnim, 0);
    return iAnim;
  };

  FLOAT WaitForDust(FLOAT3D &vStretch) {
    vStretch=FLOAT3D(1,1,2);
    vStretch=vStretch*0.3f; 
    return -1.0f;
  };

  void DeathNotify(void) {
    ChangeCollisionBoxIndexWhenPossible(GUNMAN_COLLISION_BOX_DEATH_BOX);
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    if (m_gmChar == GMC_SHOTGUN)
    {
      StartModelAnim(GUNMAN_ANIM_STANDSHOTGUN, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(GUNMAN_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void WalkingAnim(void) {
    if (m_gmChar == GMC_SHOTGUN)
    {
      StartModelAnim(GUNMAN_ANIM_WALKSHOTGUN, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(GUNMAN_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void RunningAnim(void) {
    if (m_gmChar == GMC_SHOTGUN)
    {
      StartModelAnim(GUNMAN_ANIM_RUNSHOTGUN, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(GUNMAN_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void StrafeLeftAnim(void) {
    if (m_gmChar == GMC_SHOTGUN)
    {
      StartModelAnim(GUNMAN_ANIM_STRAFELEFTSHOTGUN, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(GUNMAN_ANIM_STRAFELEFT, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void StrafeRightAnim(void) {
    if (m_gmChar == GMC_SHOTGUN)
    {
      StartModelAnim(GUNMAN_ANIM_STRAFERIGHTSHOTGUN, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(GUNMAN_ANIM_STRAFERIGHT, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void JumpingAnim(void) {
    RunningAnim();
  };

  void BacksteppingAnim(void) {
    if (m_gmChar == GMC_SHOTGUN)
    {
      StartModelAnim(GUNMAN_ANIM_BACKPEDALSHOTGUN, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(GUNMAN_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
  };


  procedures:


  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit
  {
    if (m_gmChar == GMC_SHOTGUN)
    {
      autocall GunmanShotgunMeleeAttack() EEnd;
      return EReturn();
    }
    else if (GMC_LEADER)
    {
      autocall GunmanKickAttack() EEnd;
      return EReturn();
    }
    else if (GMC_KEY)
    {
      autocall GunmanKickAttack() EEnd;
      return EReturn();
    }
    else if (GMC_PISTOL)
    {
      autocall GunmanKickAttack() EEnd;
      return EReturn();
    }
  };


  Fire(EVoid) : CEnemyBase::Fire
  {
    if (m_gmChar == GMC_SHOTGUN)
    {
      autocall GunmanShotgunAttack() EEnd;
      return EReturn();
    }
    else if (m_gmChar == GMC_LEADER)
    {
      autocall GunmanLeaderPistolAttack() EEnd;
      return EReturn();
    } 
    else if (m_gmChar == GMC_KEY)
    {
      autocall GunmanPistolAttack() EEnd;
      return EReturn();
    }
    else if (m_gmChar == GMC_PISTOL)
    {
      autocall GunmanPistolAttack() EEnd;
      return EReturn();
    }
  };


  GunmanKickAttack(EVoid) {
    // close attack
    StartModelAnim(GUNMAN_ANIM_KICK, 0);
    m_bFistHit = FALSE;
    autowait(0.30f);
    if (CalcDist(m_penEnemy) < 3.5f) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      PlaySound(m_soSound, SOUND_HIT, SOF_3D);
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 10.0f, FLOAT3D(0, 0, 0), vDirection);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();

    m_fLockOnEnemyTime = 1.0f;
    autocall CEnemyBase::StepBackwards() EReturn;

    return EReturn();
  };


  GunmanShotgunMeleeAttack(EVoid) {
    // close attack
    StartModelAnim(GUNMAN_ANIM_MELEESHOTGUN, 0);
    m_bFistHit = FALSE;
    autowait(0.30f);
    if (CalcDist(m_penEnemy) < 3.5f) {
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

    m_fLockOnEnemyTime = 1.0f;
    autocall CEnemyBase::StepBackwards() EReturn;

    return EReturn();
  };


  // Gunman pistol attack
  GunmanPistolAttack(EVoid) {
    m_fLockOnEnemyTime = 0.5f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StandingAnim();
    autowait(0.2f + FRnd()/4);

    StartModelAnim(GUNMAN_ANIM_SHOOTPISTOL, 0);
    ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.0f, 0.0f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_FIRE, SOF_3D);

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();

    return EEnd();
  };

  // Gunman pistol attack
  GunmanLeaderPistolAttack(EVoid) {
    m_fLockOnEnemyTime = 0.5f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StandingAnim();
    autowait(0.2f + FRnd()/4);

    StartModelAnim(GUNMAN_ANIM_SHOOTPISTOL, 0);
    ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.0f, 0.0f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_FIRE, SOF_3D);

    autowait(0.2f + FRnd()/4);

    StartModelAnim(GUNMAN_ANIM_SHOOTPISTOL, 0);
    ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.0f, 0.0f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_FIRE, SOF_3D);

    autowait(0.2f + FRnd()/4);

    StartModelAnim(GUNMAN_ANIM_SHOOTPISTOL, 0);
    ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.0f, 0.0f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_FIRE, SOF_3D);

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();

    m_fLockOnEnemyTime = 1.0f;
    autocall CEnemyBase::StrafeLeft() EReturn;
    autocall CEnemyBase::StrafeRight() EReturn;

    return EEnd();
  };

  // Gunman shotgun attack
  GunmanShotgunAttack(EVoid) {
    m_fLockOnEnemyTime = 0.5f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StandingAnim();
    autowait(0.25f + FRnd()/4);

    StartModelAnim(GUNMAN_ANIM_SHOOTSHOTGUN, 0);
    ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(-1.0f, 1.0f, 0.0f), ANGLE3D(-8.0f, 0, 0));
    ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(-0.5f, 1.0f, 0.0f), ANGLE3D(-4.0f, 0, 0));
    ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.5f, 1.0f, 0.0f), ANGLE3D(4.0f, 0, 0));
    ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(1.0f, 1.0f, 0.0f), ANGLE3D(8.0f, 0, 0));
    PlaySound(m_soSound, SOUND_FIRE_SHOTGUN, SOF_3D);

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();

    return EEnd();
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
    m_ftFactionType = FT_LESSER;
    SetHealth(150.0f);
    m_fMaxHealth = 150.0f;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance
    SetModel(MODEL_GUNMAN);
    // set your texture

    switch(m_gmChar)
    {
      case GMC_SHOTGUN:
        SetHealth(220.0f);
        m_fMaxHealth = 220.0f;
        SetModelMainTexture(TEXTURE_GUNMAN);
        AddAttachment(GUNMAN_ATTACHMENT_SHOTGUN, MODEL_SHOTGUN, TEXTURE_SHOTGUN);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
        m_iScore = 2500;
      break;

      case GMC_LEADER:
        SetHealth(175.0f);
        m_fMaxHealth = 175.0f;
        SetModelMainTexture(TEXTURE_GUNMAN_LEADER);
        AddAttachment(GUNMAN_ATTACHMENT_PISTOL, MODEL_PISTOL, TEXTURE_PISTOL);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
        m_bIsLeader = TRUE;
        m_iScore = 2500;
      break;

      case GMC_KEY:
        SetModelMainTexture(TEXTURE_GUNMAN_SECURITY);
        AddAttachment(GUNMAN_ATTACHMENT_PISTOL, MODEL_PISTOL, TEXTURE_PISTOL);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
        m_iScore = 1000;
      break;

      case GMC_PISTOL:
        SetModelMainTexture(TEXTURE_GUNMAN);
        AddAttachment(GUNMAN_ATTACHMENT_PISTOL, MODEL_PISTOL, TEXTURE_PISTOL);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
        m_iScore = 500;
      break;
    }
        
        // setup moving speed
        m_fWalkSpeed = FRnd() + 2.5f;
        m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
        m_fAttackRunSpeed = FRnd() + 5.0f;
        m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 245.0f);
        m_fCloseRunSpeed = FRnd() + 5.0f;
        m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 245.0f);
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 2.5f;
        m_fStopDistance = 1.5f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 1.0f;
        m_fIgnoreRange = 200.0f;
        // damage/explode properties
        m_fBlowUpAmount = 140.0f;
        m_fBodyParts = 4;
        m_fDamageWounded = 45.0f;

    StandingAnim();

    // continue behavior in base class
    jump CEnemySquad::MainLoop();
  };
};