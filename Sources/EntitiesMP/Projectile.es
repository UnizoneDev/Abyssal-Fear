/* Copyright (c) 2002-2012 Croteam Ltd. 
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

501
%{
#include "StdH.h"
#include "EntitiesMP/EnemyBase.h"
#include "Models/Weapons/Pistol/Projectile/Bullet.h"
#include "Models/NPCs/DoomImp/Projectile/ImpFireball.h"
#include "Models/NPCs/Abomination/Projectile/MutantBloodSpit.h"

#include "EntitiesMP/PlayerWeapons.h"
#include "EntitiesMP/Shooter.h"

#define DEVIL_LASER_SPEED 100.0f
#define DEVIL_ROCKET_SPEED 60.0f
%}

uses "EntitiesMP/BasicEffects";
uses "EntitiesMP/Light";
uses "EntitiesMP/Flame";
uses "EntitiesMP/BloodSpray";

enum ProjectileType {
  0 PRT_FLAME                 "Flame",   // player flamer flame
  1 PRT_SHOOTER_FLAME         "Shooter Flame", // shooter's flame
  2 PRT_AFTERBURNER_DEBRIS    "Afterburner debris",
  3 PRT_GUNMAN_BULLET         "Gunman Bullet",
  4 PRT_DOOMIMP_FIREBALL      "Doom Imp Fireball",
  5 PRT_MUTANT_SPIT           "Mutant Spit",
  6 PRT_SHOOTER_FIREBALL      "Shooter Fireball",
  7 PRT_SHOOTER_SPIT          "Shooter Spit",
  8 PRT_SHAMBLER_BLOOD_BUNDLE "Shambler Blood Bundle",
};

enum ProjectileMovingType {
  0 PMT_FLYING        "",      // flying through space
  1 PMT_SLIDING       "",      // sliding on floor
  2 PMT_GUIDED        "",      // guided projectile
  3 PMT_GUIDED_FAST    "",     // fast guided projectile
  4 PMT_FLYING_REBOUNDING "",  // flying and rebounding from walls a few times
  5 PMT_GUIDED_SLIDING "",     // sliding on floor and guided at the same time
  6 PMT_BLOODBUNDLE "",        // projectile that is throw at an arc
};


// input parameter for launching the projectile
event ELaunchProjectile {
  CEntityPointer penLauncher,     // who launched it
  enum ProjectileType prtType,    // type of projectile
  FLOAT fSpeed,                   // optional - projectile speed (only for some projectiles)
  FLOAT fStretch,                 // optional - projectile stretch (only for some projectiles)
};


%{
#define DRAGONMAN_NORMAL 0
#define DRAGONMAN_STRONG 1

#define ELEMENTAL_LARGE   2
#define ELEMENTAL_BIG     1
#define ELEMENTAL_NORMAL  0

#define ELEMENTAL_STONEMAN 0
#define ELEMENTAL_LAVAMAN  1
#define ELEMENTAL_ICEMAN   2

void CProjectile_OnInitClass(void)
{
}

void CProjectile_OnPrecache(CDLLEntityClass *pdec, INDEX iUser) 
{
  pdec->PrecacheTexture(TEX_REFL_BWRIPLES01);
  pdec->PrecacheTexture(TEX_REFL_BWRIPLES02);
  pdec->PrecacheTexture(TEX_REFL_LIGHTMETAL01);
  pdec->PrecacheTexture(TEX_REFL_LIGHTBLUEMETAL01);
  pdec->PrecacheTexture(TEX_REFL_DARKMETAL);
  pdec->PrecacheTexture(TEX_REFL_PURPLE01);

  pdec->PrecacheTexture(TEX_SPEC_WEAK);
  pdec->PrecacheTexture(TEX_SPEC_MEDIUM);
  pdec->PrecacheTexture(TEX_SPEC_STRONG);

  switch ((ProjectileType)iUser) {
  case PRT_FLAME:
    pdec->PrecacheModel(MODEL_FLAME);
    pdec->PrecacheClass(CLASS_FLAME);
    break;
  case PRT_SHOOTER_FLAME:
    pdec->PrecacheModel(MODEL_FLAME);
    pdec->PrecacheClass(CLASS_FLAME);
    break;
  case PRT_AFTERBURNER_DEBRIS:
    pdec->PrecacheModel(MODEL_MARKER);
    pdec->PrecacheTexture(TEXTURE_MARKER);    
    break;
  case PRT_GUNMAN_BULLET:
    pdec->PrecacheModel(MODEL_BULLET);
    pdec->PrecacheTexture(TEX_BULLET);    
    break;
  case PRT_DOOMIMP_FIREBALL:
  case PRT_SHOOTER_FIREBALL:
    pdec->PrecacheModel(MODEL_FIREBALL);
    pdec->PrecacheTexture(TEX_FIREBALL);  
    pdec->PrecacheClass(CLASS_BASIC_EFFECT, BET_FIREBALL);
    pdec->PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSIONSTAIN);
    pdec->PrecacheClass(CLASS_BASIC_EFFECT, BET_SHOCKWAVE);
    pdec->PrecacheClass(CLASS_BASIC_EFFECT, BET_FIREBALL_PLANE);
    break;
  case PRT_MUTANT_SPIT:
  case PRT_SHOOTER_SPIT:
  case PRT_SHAMBLER_BLOOD_BUNDLE:
    pdec->PrecacheModel(MODEL_BLOODSPIT);
    pdec->PrecacheTexture(TEX_BLOODSPIT);
    pdec->PrecacheClass(CLASS_BLOOD_SPRAY);
    break;
  default:
    ASSERT(FALSE);
  }
}
%}


class export CProjectile : CMovableModelEntity {
name      "Projectile";
thumbnail "";
features "ImplementsOnInitClass", "ImplementsOnPrecache", "CanBePredictable";

properties:
  1 CEntityPointer m_penLauncher,     // who lanuched it
  2 enum ProjectileType m_prtType = PRT_GUNMAN_BULLET,       // type of the projectile
  3 enum ProjectileMovingType m_pmtMove = PMT_FLYING, // projectile moving type
  4 CEntityPointer m_penParticles,    // another entity for particles
  5 CEntityPointer m_penTarget,       // guided projectile's target
  6 CEntityPointer m_penLastDamaged,  // last entity this projectile damaged

 10 FLOAT m_fSpeed = 0.0f,                   // projectile speed (optional, only for some projectiles)
 11 FLOAT m_fIgnoreTime = 0.0f,              // time when laucher will be ignored
 12 FLOAT m_fFlyTime = 0.0f,                 // fly time before explode/disappear
 13 FLOAT m_fStartTime = 0.0f,               // start time when launched
 14 FLOAT m_fDamageAmount = 0.0f,            // damage amount when hit something
 15 FLOAT m_fRangeDamageAmount = 0.0f,       // range damage amount
 16 FLOAT m_fDamageHotSpotRange = 0.0f,      // hot spot range damage for exploding projectile
 17 FLOAT m_fDamageFallOffRange = 0.0f,      // fall off range damage for exploding projectile
 18 FLOAT m_fSoundRange = 0.0f,              // sound range where explosion can be heard
 19 BOOL m_bExplode = FALSE,                 // explode -> range damage
 20 BOOL m_bLightSource = FALSE,             // projectile is also light source
 21 BOOL m_bCanHitHimself = FALSE,           // projectile can him himself
 22 BOOL m_bCanBeDestroyed = FALSE,          // projectile can be destroyed from something else
 23 FLOAT m_fWaitAfterDeath = 0.0f,          // wait after death for particles
 24 FLOAT m_aRotateSpeed = 0.0f,             // speed of rotation for guided projectiles
 25 FLOAT m_tmExpandBox = 0.0f,              // expand collision after a few seconds
 26 FLOAT m_tmInvisibility = 0.0f,           // don't render before given time
 27 INDEX m_iRebounds = 0,                   // how many times to rebound
 28 FLOAT m_fStretch=1.0f,                   // stretch

 30 CSoundObject m_soEffect,          // sound channel
 31 CSoundObject m_soExplosion,       // sound channel

 35 FLOAT m_fGuidedMaxSpeedFactor = 30.0f,   // speed factor for guided projectiles

 50 BOOL bLockedOn = TRUE,
 51 BOOL m_bLeftFlame = FALSE,
{
  CLightSource m_lsLightSource;
}

components:
  1 class   CLASS_BASIC_EFFECT  "Classes\\BasicEffect.ecl",
  2 class   CLASS_LIGHT         "Classes\\Light.ecl",
  3 class   CLASS_PROJECTILE    "Classes\\Projectile.ecl",
  4 class   CLASS_BLOOD_SPRAY   "Classes\\BloodSpray.ecl",

// ********* PLAYER FLAME *********
  5 model   MODEL_FLAME         "ModelsMP\\Weapons\\Flamer\\Projectile\\Invisible.mdl",
  6 class   CLASS_FLAME         "Classes\\Flame.ecl",

// ********** FIREBALL **********
  7 model   MODEL_FIREBALL      "Models\\NPCs\\DoomImp\\Projectile\\ImpFireball.mdl",
  8 texture TEX_FIREBALL        "Models\\NPCs\\DoomImp\\Projectile\\FireballImp.tex",

// ********** BULLET **********
  9 model   MODEL_BULLET        "Models\\Weapons\\Pistol\\Projectile\\Bullet.mdl",
 10 texture TEX_BULLET          "Models\\Weapons\\Pistol\\Projectile\\Bullet.tex",

// ********** BULLET **********
 11 model   MODEL_BLOODSPIT        "Models\\NPCs\\Abomination\\Projectile\\MutantBloodSpit.mdl",
 12 texture TEX_BLOODSPIT          "Models\\NPCs\\Abomination\\Projectile\\BloodProjectileEffect.tex",

// ********** SHOOTERS **********
160 model   MODEL_SHTR_WOODEN_DART  "ModelsMP\\Enemies\\Shooters\\Arrow01.mdl",
161 texture TEX_SHTR_WOODEN_DART    "ModelsMP\\Enemies\\Shooters\\Arrow01.tex",

// ************** REFLECTIONS **************
200 texture TEX_REFL_BWRIPLES01         "Models\\ReflectionTextures\\BWRiples01.tex",
201 texture TEX_REFL_BWRIPLES02         "Models\\ReflectionTextures\\BWRiples02.tex",
202 texture TEX_REFL_LIGHTMETAL01       "Models\\ReflectionTextures\\LightMetal01.tex",
203 texture TEX_REFL_LIGHTBLUEMETAL01   "Models\\ReflectionTextures\\LightBlueMetal01.tex",
204 texture TEX_REFL_DARKMETAL          "Models\\ReflectionTextures\\DarkMetal.tex",
205 texture TEX_REFL_PURPLE01           "Models\\ReflectionTextures\\Purple01.tex",

// ************** SPECULAR **************
210 texture TEX_SPEC_WEAK               "Models\\SpecularTextures\\Weak.tex",
211 texture TEX_SPEC_MEDIUM             "Models\\SpecularTextures\\Medium.tex",
212 texture TEX_SPEC_STRONG             "Models\\SpecularTextures\\Strong.tex",

220 model   MODEL_MARKER     "Models\\Editor\\Axis.mdl",
221 texture TEXTURE_MARKER   "Models\\Editor\\Vector.tex"

functions:
  // premoving
  void PreMoving(void) {
    if (m_tmExpandBox>0) {
      if (_pTimer->CurrentTick()>m_fStartTime+m_tmExpandBox) {
        ChangeCollisionBoxIndexWhenPossible(1);
        m_tmExpandBox = 0;
      }
    }
    CMovableModelEntity::PreMoving();
  }

  // postmoving
  void PostMoving(void) {
    CMovableModelEntity::PostMoving();
    // if flamer flame
    if (m_prtType==PRT_FLAME || m_prtType==PRT_SHOOTER_FLAME || m_prtType==PRT_DOOMIMP_FIREBALL || m_prtType==PRT_SHOOTER_FIREBALL) {
      // if came to water
      CContentType &ctDn = GetWorld()->wo_actContentTypes[en_iDnContent];
      // stop existing
      if (!(ctDn.ct_ulFlags&CTF_BREATHABLE_LUNGS)) {
        m_fWaitAfterDeath = 0.0f;   // immediate stop
        SendEvent(EEnd());
      }
    }
  };

  /* Read from stream. */
  void Read_t( CTStream *istr) // throw char *
  {
    CMovableModelEntity::Read_t(istr);
    // setup light source
    if( m_bLightSource) {
      SetupLightSource(TRUE);
    }
  }

  // dump sync data to text file
  export void DumpSync_t(CTStream &strm, INDEX iExtensiveSyncCheck)  // throw char *
  {
    CMovableModelEntity ::DumpSync_t(strm, iExtensiveSyncCheck);
    strm.FPrintF_t("projectile type: %d\n", m_prtType);
    strm.FPrintF_t("launcher:");
    if (m_penLauncher!=NULL) {
      strm.FPrintF_t("id:%05d '%s'(%s) (%g, %g, %g)\n", 
        m_penLauncher->en_ulID,
        m_penLauncher->GetName(), m_penLauncher->GetClass()->ec_pdecDLLClass->dec_strName,
        m_penLauncher->GetPlacement().pl_PositionVector(1),
        m_penLauncher->GetPlacement().pl_PositionVector(2),
        m_penLauncher->GetPlacement().pl_PositionVector(3));
    } else {
      strm.FPrintF_t("<none>\n");
    }
  }

  /* Get static light source information. */
  CLightSource *GetLightSource(void)
  {
    if( m_bLightSource && !IsPredictor()) {
      return &m_lsLightSource;
    } else {
      return NULL;
    }
  }

  export void Copy(CEntity &enOther, ULONG ulFlags)
  {
    CMovableModelEntity::Copy(enOther, ulFlags);
    CProjectile *penOther = (CProjectile *)(&enOther);
    if (ulFlags&COPY_PREDICTOR) {
      //m_lsLightSource;
      //SetupLightSource(); //? is this ok !!!!
      m_bLightSource = FALSE;
    }
  }

  BOOL AdjustShadingParameters(FLOAT3D &vLightDirection, COLOR &colLight, COLOR &colAmbient)
  {
    // if time now is inside invisibility time, don't render model
    CModelObject *pmo = GetModelObject();
    if ( (pmo != NULL) && (_pTimer->GetLerpedCurrentTick() < (m_fStartTime+m_tmInvisibility) ) )
    {
      // make it invisible
      pmo->mo_colBlendColor = 0;
    }
    else
    {
      // make it visible
      pmo->mo_colBlendColor = C_WHITE|CT_OPAQUE;
    }
    return CEntity::AdjustShadingParameters(vLightDirection, colLight, colAmbient);
  }

  // Setup light source
  void SetupLightSource(BOOL bLive)
  {
    // setup light source
    CLightSource lsNew;
    lsNew.ls_ulFlags = LSF_NONPERSISTENT|LSF_DYNAMIC;
    lsNew.ls_rHotSpot = 0.0f;
    switch (m_prtType) {
      case PRT_FLAME:
        lsNew.ls_colColor = C_dORANGE;
        lsNew.ls_rFallOff = 1.0f;
        lsNew.ls_plftLensFlare = NULL;
        break;
      case PRT_SHOOTER_FLAME:
        lsNew.ls_colColor = C_dORANGE;
        lsNew.ls_rFallOff = 1.0f;
        lsNew.ls_plftLensFlare = NULL;
        break;
      case PRT_GUNMAN_BULLET:
        lsNew.ls_colColor = C_WHITE;
        lsNew.ls_rFallOff = 1.0f;
        lsNew.ls_plftLensFlare = NULL;
        break;
      case PRT_DOOMIMP_FIREBALL:
      case PRT_SHOOTER_FIREBALL:
        lsNew.ls_colColor = C_dORANGE;
        lsNew.ls_rFallOff = 1.0f;
        lsNew.ls_plftLensFlare = NULL;
        break;
      default:
        ASSERTALWAYS("Unknown light source");
    }
    lsNew.ls_ubPolygonalMask = 0;
    lsNew.ls_paoLightAnimation = NULL;

    m_lsLightSource.ls_penEntity = this;
    m_lsLightSource.SetLightSource(lsNew);
  }

  // render particles
  void RenderParticles(void) {
    switch (m_prtType) {
      case PRT_SHOOTER_FLAME: {
        // elapsed time
        FLOAT fTimeElapsed, fParticlesTimeElapsed;
        fTimeElapsed = _pTimer->GetLerpedCurrentTick() - m_fStartTime;
        // not NULL or deleted
        if (m_penParticles!=NULL && !(m_penParticles->GetFlags()&ENF_DELETED)) {
          // draw particles with another projectile
          if (IsOfClass(m_penParticles, "Projectile")) {
            fParticlesTimeElapsed = _pTimer->GetLerpedCurrentTick() - ((CProjectile&)*m_penParticles).m_fStartTime;
            Particles_ShooterFlame(GetLerpedPlacement(), m_penParticles->GetLerpedPlacement(),
                                   fTimeElapsed, fParticlesTimeElapsed);
          } else if (IsOfClass(m_penParticles, "Shooter")) {
            Particles_ShooterFlame(GetLerpedPlacement(),
              ((CShooter&)*m_penParticles).GetPlacement(),
                                   fTimeElapsed, 0.0f);
          }
        }
        break;
      }
      case PRT_AFTERBURNER_DEBRIS:
        Particles_AfterBurner(this, m_fStartTime, m_fStretch);
        break;
      case PRT_GUNMAN_BULLET: 
        Particles_BombTrail(this); 
        break;
      case PRT_DOOMIMP_FIREBALL:
      case PRT_SHOOTER_FIREBALL:
        Particles_Fireball01Trail(this);
        break;
    }
  }


  void FireballExplosion(void) {
  ESpawnEffect ese;
  FLOAT3D vPoint;
  FLOATplane3D vPlaneNormal;
  FLOAT fDistanceToEdge;

  // explosion
  ese.colMuliplier = C_WHITE|CT_OPAQUE;
  ese.betType = BET_FIREBALL;
  ese.vStretch = FLOAT3D(1,1,1);
  SpawnEffect(GetPlacement(), ese);
  // spawn sound event in range
  if( IsDerivedFromClass( m_penLauncher, "Player")) {
    SpawnRangeSound( m_penLauncher, this, SNDT_PLAYER, m_fSoundRange);
  }

  // explosion debris
  ese.betType = BET_EXPLOSION_DEBRIS;
  SpawnEffect(GetPlacement(), ese);

  // explosion smoke
  ese.betType = BET_EXPLOSION_SMOKE;
  SpawnEffect(GetPlacement(), ese);

  // on plane
  if (GetNearestPolygon(vPoint, vPlaneNormal, fDistanceToEdge)) {
    if ((vPoint-GetPlacement().pl_PositionVector).Length() < 3.5f) {
      // stain
      ese.betType = BET_EXPLOSIONSTAIN;
      ese.vNormal = FLOAT3D(vPlaneNormal);
      SpawnEffect(CPlacement3D(vPoint, ANGLE3D(0, 0, 0)), ese);
      // shock wave
      ese.betType = BET_SHOCKWAVE;
      ese.vNormal = FLOAT3D(vPlaneNormal);
      SpawnEffect(CPlacement3D(vPoint, ANGLE3D(0, 0, 0)), ese);
      // second explosion on plane
      ese.betType = BET_FIREBALL_PLANE;
      ese.vNormal = FLOAT3D(vPlaneNormal);
      SpawnEffect(CPlacement3D(vPoint+ese.vNormal/50.0f, ANGLE3D(0, 0, 0)), ese);
    }
  }
};


void MutantBloodExplosion(void) {
  // spawn particle debris
  CPlacement3D plSpray = GetPlacement();
  CEntityPointer penSpray = CreateEntity( plSpray, CLASS_BLOOD_SPRAY);
  penSpray->SetParent( this);
  ESpawnSpray eSpawnSpray;
  eSpawnSpray.colBurnColor=C_WHITE|CT_OPAQUE;
  eSpawnSpray.fDamagePower = 4.0f;
  eSpawnSpray.fSizeMultiplier = 0.5f;
  eSpawnSpray.sptType = SPT_BLOOD;
  eSpawnSpray.vDirection = en_vCurrentTranslationAbsolute/32.0f;
  eSpawnSpray.penOwner = this;
  penSpray->Initialize( eSpawnSpray);
};


/************************************************************
 *                    PLAYER FLAME                          *
 ************************************************************/
void PlayerFlame(void) {
  // set appearance
  InitAsEditorModel();
  SetPhysicsFlags(EPF_MODEL_SLIDING&~EPF_TRANSLATEDBYGRAVITY&~EPF_ORIENTEDBYGRAVITY);
  //SetPhysicsFlags(EPF_PROJECTILE_FLYING);
  SetCollisionFlags(ECF_PROJECTILE_MAGIC);
  SetFlags(GetFlags() | ENF_SEETHROUGH);
  SetModel(MODEL_FLAME);
  //SetModel(MODEL_BEAST_FIRE);
  //SetModelMainTexture(TEXTURE_ROCKET);

  // add player's forward velocity to flame
  CMovableEntity *penPlayer = (CMovableEntity*)(CEntity*)m_penLauncher;
  FLOAT3D vDirection = penPlayer->en_vCurrentTranslationAbsolute;
  FLOAT3D vFront = -GetRotationMatrix().GetColumn(3);
  FLOAT fSpeedFwd = ClampDn( vDirection%vFront, 0.0f);
  // start moving
  LaunchAsPropelledProjectile(FLOAT3D(0.0f, 0.0f, -(25.0f+fSpeedFwd)), penPlayer);
  SetDesiredRotation(ANGLE3D(0, 0, 0));
  m_fFlyTime = 1.0f;
  m_fDamageAmount = (GetSP()->sp_bCooperative) ? 10.0f : 4.0f;
  m_fSoundRange = 0.0f;
  m_bExplode = FALSE;
  m_bLightSource = TRUE;
  m_bCanHitHimself = FALSE;
  m_bCanBeDestroyed = FALSE;
  m_fWaitAfterDeath = 0.3f;
  m_tmExpandBox = 0.1f;
  m_pmtMove = PMT_SLIDING;
};

/************************************************************
 *                    S H O O T E R S                       *
 ************************************************************/

void ShooterFlame(void) {
  // set appearance
  InitAsModel();
  SetPhysicsFlags(EPF_PROJECTILE_FLYING);
  SetCollisionFlags(ECF_PROJECTILE_SOLID);
  SetFlags(GetFlags() | ENF_SEETHROUGH);
  SetModel(MODEL_FLAME);
  // start moving
  LaunchAsPropelledProjectile(FLOAT3D(0.0f, 0.0f, -10.0f), (CMovableEntity*)(CEntity*)m_penLauncher);
  SetDesiredRotation(ANGLE3D(0, 0, 0));
  m_fFlyTime = 1.0f;
  m_fDamageAmount = 3.0f;
  m_fSoundRange = 0.0f;
  m_bExplode = FALSE;
  m_bLightSource = TRUE;
  m_bCanHitHimself = FALSE;
  m_bCanBeDestroyed = FALSE;
  m_fWaitAfterDeath = 0.3f;
  m_pmtMove = PMT_FLYING;
};

void AfterburnerDebris(void)
{
  Particles_AfterBurner_Prepare(this);
  // set appearance
  InitAsEditorModel();
  SetPhysicsFlags(EPF_MODEL_FALL);
  SetCollisionFlags(ECF_PROJECTILE_MAGIC);
  SetModel(MODEL_MARKER);
  SetModelMainTexture(TEXTURE_MARKER);
  // start moving
  LaunchAsFreeProjectile(FLOAT3D(0.0f, 0.0f, -m_fSpeed), (CMovableEntity*)&*m_penLauncher);
  SetDesiredRotation(ANGLE3D(0, FRnd()*360.0f-180.0f, FRnd()*360.0f-180.0f));
  m_fFlyTime = 10.0f;
  m_fDamageAmount = 0.0f;
  m_fRangeDamageAmount = 0.0f;
  m_fDamageHotSpotRange = 0.0f;
  m_fDamageFallOffRange = 0.0f;
  m_fSoundRange = 0.0f;
  m_bExplode = TRUE;
  m_bLightSource = FALSE;
  m_bCanHitHimself = FALSE;
  m_bCanBeDestroyed = FALSE;
  m_fWaitAfterDeath = 2.0f;
  m_pmtMove = PMT_FLYING;
};

/************************************************************
 *                  GUNMAN PROJECTILE                       *
 ************************************************************/
void GunmanBullet(void) {
  // set appearance
  InitAsModel();
  SetPhysicsFlags(EPF_PROJECTILE_FLYING);
  SetCollisionFlags(ECF_PROJECTILE_SOLID);
  SetModel(MODEL_BULLET);
  SetModelMainTexture(TEX_BULLET);
  // start moving
  LaunchAsPropelledProjectile(FLOAT3D(0.0f, 0.0f, -30.0f), (CMovableEntity*)(CEntity*)m_penLauncher);
  SetDesiredRotation(ANGLE3D(0, 0, 0));
  m_fFlyTime = 5.0f;
  m_fDamageAmount = 10.0f;
  m_fSoundRange = 0.0f;
  m_bExplode = FALSE;
  m_bLightSource = FALSE;
  m_bCanHitHimself = FALSE;
  m_bCanBeDestroyed = FALSE;
  m_fWaitAfterDeath = 0.0f;
  m_pmtMove = PMT_FLYING;
};

/************************************************************
 *                  DOOMIMP PROJECTILE                      *
 ************************************************************/
void DoomImpFireball(void) {
  // set appearance
  InitAsModel();
  SetPhysicsFlags(EPF_PROJECTILE_FLYING);
  SetCollisionFlags(ECF_PROJECTILE_MAGIC);
  SetModel(MODEL_FIREBALL);
  SetModelMainTexture(TEX_FIREBALL);
  // start moving
  LaunchAsPropelledProjectile(FLOAT3D(0.0f, 0.0f, -15.0f), (CMovableEntity*)(CEntity*)m_penLauncher);
  SetDesiredRotation(ANGLE3D(0, 0, 0));
  m_fFlyTime = 5.0f;
  m_fDamageAmount = 10.0f;
  m_fSoundRange = 0.0f;
  m_bExplode = FALSE;
  m_bLightSource = TRUE;
  m_bCanHitHimself = FALSE;
  m_bCanBeDestroyed = FALSE;
  m_fWaitAfterDeath = 0.0f;
  m_pmtMove = PMT_FLYING;
};

/************************************************************
 *                   MUTANT PROJECTILE                      *
 ************************************************************/
void MutantBloodSpit(void) {
  // set appearance
  InitAsModel();
  SetPhysicsFlags(EPF_PROJECTILE_FLYING);
  SetCollisionFlags(ECF_PROJECTILE_MAGIC);
  SetModel(MODEL_BLOODSPIT);
  SetModelMainTexture(TEX_BLOODSPIT);
  // start moving
  LaunchAsPropelledProjectile(FLOAT3D(0.0f, 0.0f, -15.0f), (CMovableEntity*)(CEntity*)m_penLauncher);
  SetDesiredRotation(ANGLE3D(0, 0, 0));
  m_fFlyTime = 5.0f;
  m_fDamageAmount = 15.0f;
  m_fSoundRange = 0.0f;
  m_bExplode = FALSE;
  m_bLightSource = FALSE;
  m_bCanHitHimself = FALSE;
  m_bCanBeDestroyed = FALSE;
  m_fWaitAfterDeath = 0.0f;
  m_pmtMove = PMT_FLYING;
};

/*********************************************************************
 *                  SHOOTER FIREBALL PROJECTILE                      *
 *********************************************************************/
void ShooterFireball(void) {
  // set appearance
  InitAsModel();
  SetPhysicsFlags(EPF_PROJECTILE_FLYING);
  SetCollisionFlags(ECF_PROJECTILE_MAGIC);
  SetModel(MODEL_FIREBALL);
  SetModelMainTexture(TEX_FIREBALL);
  // start moving
  LaunchAsPropelledProjectile(FLOAT3D(0.0f, 0.0f, -15.0f), (CMovableEntity*)(CEntity*)m_penLauncher);
  SetDesiredRotation(ANGLE3D(0, 0, 0));
  m_fFlyTime = 5.0f;
  m_fDamageAmount = 10.0f;
  m_fSoundRange = 0.0f;
  m_bExplode = FALSE;
  m_bLightSource = TRUE;
  m_bCanHitHimself = FALSE;
  m_bCanBeDestroyed = FALSE;
  m_fWaitAfterDeath = 0.0f;
  m_pmtMove = PMT_FLYING;
};

/*******************************************************************
 *                   SHOOTER BLOOD PROJECTILE                      *
 *******************************************************************/
void ShooterBloodSpit(void) {
  // set appearance
  InitAsModel();
  SetPhysicsFlags(EPF_PROJECTILE_FLYING);
  SetCollisionFlags(ECF_PROJECTILE_MAGIC);
  SetModel(MODEL_BLOODSPIT);
  SetModelMainTexture(TEX_BLOODSPIT);
  // start moving
  LaunchAsPropelledProjectile(FLOAT3D(0.0f, 0.0f, -15.0f), (CMovableEntity*)(CEntity*)m_penLauncher);
  SetDesiredRotation(ANGLE3D(0, 0, 0));
  m_fFlyTime = 5.0f;
  m_fDamageAmount = 10.0f;
  m_fSoundRange = 0.0f;
  m_bExplode = FALSE;
  m_bLightSource = FALSE;
  m_bCanHitHimself = FALSE;
  m_bCanBeDestroyed = FALSE;
  m_fWaitAfterDeath = 0.0f;
  m_pmtMove = PMT_FLYING;
};

/************************************************************
 *                   SHAMBLER PROJECTILE                    *
 ************************************************************/
void ShamblerBloodBundle(void) {
  // set appearance
  InitAsModel();
  SetPhysicsFlags(EPF_MODEL_BOUNCING);
  SetCollisionFlags(ECF_PROJECTILE_MAGIC);
  SetModel(MODEL_BLOODSPIT);
  SetModelMainTexture(TEX_BLOODSPIT);
  // start moving
  LaunchAsFreeProjectile(FLOAT3D(0.0f, 8.0f, -20.0f), (CMovableEntity*)(CEntity*)m_penLauncher);
  SetDesiredRotation(ANGLE3D(0, FRnd()*120.0f+120.0f, FRnd()*250.0f-125.0f));
  en_fBounceDampNormal   = 0.75f;
  en_fBounceDampParallel = 0.6f;
  en_fJumpControlMultiplier = 0.0f;
  en_fCollisionSpeedLimit = 45.0f;
  en_fCollisionDamageFactor = 10.0f;
  m_fFlyTime = 5.0f;
  m_fDamageAmount = 10.0f;
  m_fSoundRange = 0.0f;
  m_bExplode = FALSE;
  m_bLightSource = FALSE;
  m_bCanHitHimself = FALSE;
  m_bCanBeDestroyed = FALSE;
  m_fWaitAfterDeath = 0.0f;
  m_pmtMove = PMT_BLOODBUNDLE;
};

/************************************************************
 *             C O M M O N   F U N C T I O N S              *
 ************************************************************/

// projectile touch his valid target
void ProjectileTouch(CEntityPointer penHit)
{
  // explode if needed
  ProjectileHit();

  // direct damage
  FLOAT3D vDirection;
  FLOAT fTransLen = en_vIntendedTranslation.Length();
  if( fTransLen>0.5f)
  {
    vDirection = en_vIntendedTranslation/fTransLen;
  }
  else
  {
    vDirection = -en_vGravityDir;
  }

  // spawn flame
  const FLOAT fDamageMul = GetSeriousDamageMultiplier(m_penLauncher);
  if ((m_prtType==PRT_FLAME||m_prtType==PRT_SHOOTER_FLAME) && m_fWaitAfterDeath>0.0f) {
    // don't burn the same entity twice while passing through it
    if (m_penLastDamaged==penHit) {
      return;
    } else {
      m_penLastDamaged=penHit;
    }

    // don't spawn flame on AirElemental
    BOOL bSpawnFlame=TRUE;
    BOOL bInflictDamage=TRUE;

    EntityInfo *pei=(EntityInfo *)penHit->GetEntityInfo();
    if(pei!=NULL && pei->Eeibt==EIBT_ICE)
    {
      bSpawnFlame=FALSE;
      bInflictDamage=FALSE;
    }

    if( bSpawnFlame)
    {
      SpawnFlame(m_penLauncher, penHit, GetPlacement().pl_PositionVector);
    }
    if(bInflictDamage)
    {
      InflictDirectDamage(penHit, m_penLauncher, DMT_BURNING, m_fDamageAmount*fDamageMul,
                 GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
    }
  
  // don't damage the same entity twice (wind blast)
  } else {
    InflictDirectDamage(penHit, m_penLauncher, DMT_PROJECTILE, m_fDamageAmount*fDamageMul,
               GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
  }
};


// projectile hit (or time expired or can't move any more)
void ProjectileHit(void)
{
  // explode ...
  if (m_bExplode) {
    const FLOAT fDamageMul = GetSeriousDamageMultiplier(m_penLauncher);
    InflictRangeDamage(m_penLauncher, DMT_EXPLOSION, m_fRangeDamageAmount*fDamageMul,
        GetPlacement().pl_PositionVector, m_fDamageHotSpotRange, m_fDamageFallOffRange, DBPT_GENERIC);
  }
  // sound event
  if (m_fSoundRange>0.0f && IsDerivedFromClass( m_penLauncher, "Player"))
  {
    ESound eSound;
    eSound.EsndtSound = SNDT_EXPLOSION;
    eSound.penTarget = m_penLauncher;
    SendEventInRange(eSound, FLOATaabbox3D(GetPlacement().pl_PositionVector, m_fSoundRange));
  }
};


// spawn effect
void SpawnEffect(const CPlacement3D &plEffect, const ESpawnEffect &eSpawnEffect) {
  CEntityPointer penEffect = CreateEntity(plEffect, CLASS_BASIC_EFFECT);
  penEffect->Initialize(eSpawnEffect);
};



// Calculate current rotation speed to rich given orientation in future
ANGLE GetRotationSpeed(ANGLE aWantedAngle, ANGLE aRotateSpeed, FLOAT fWaitFrequency)
{
  ANGLE aResult;
  // if desired position is smaller
  if ( aWantedAngle<-aRotateSpeed*fWaitFrequency)
  {
    // start decreasing
    aResult = -aRotateSpeed;
  }
  // if desired position is bigger
  else if (aWantedAngle>aRotateSpeed*fWaitFrequency)
  {
    // start increasing
    aResult = +aRotateSpeed;
  }
  // if desired position is more-less ahead
  else
  {
    aResult = aWantedAngle/fWaitFrequency;
  }
  return aResult;
}


/* Receive damage */
void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
                   FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
{
  if (m_prtType==PRT_FLAME && IsOfClass(penInflictor, "Moving Brush"))
  {
    Destroy();    
  }

  CMovableModelEntity::ReceiveDamage(penInflictor, 
    dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
}

/************************************************************
 *                   P R O C E D U R E S                    *
 ************************************************************/
procedures:
  // --->>> PROJECTILE FLY IN SPACE
  ProjectileFly(EVoid) {
    // if already inside some entity
    CEntity *penObstacle;
    if (CheckForCollisionNow(0, &penObstacle)) {
      // explode now
      ProjectileTouch(penObstacle);
      // if flame, continue existing
      /*if (m_prtType==PRT_FLAME && ((CEntity &)*&penObstacle).en_RenderType==RT_MODEL) {
        resume;
      }*/
      return EEnd();
    }
    // fly loop
    wait(m_fFlyTime) {
      on (EBegin) : { resume; }
      on (EPass epass) : {
        BOOL bHit;
        // ignore launcher within 1 second
        bHit = epass.penOther!=m_penLauncher || _pTimer->CurrentTick()>m_fIgnoreTime;
        // ignore another projectile of same type
        bHit &= !((!m_bCanHitHimself && IsOfClass(epass.penOther, "Projectile") &&
                ((CProjectile*)&*epass.penOther)->m_prtType==m_prtType));
        // ignore twister
        bHit &= !IsOfClass(epass.penOther, "Twister");
        if (bHit) {
          ProjectileTouch(epass.penOther);
          // player flame passes through enemies
          //if (m_prtType==PRT_FLAME && IsDerivedFromClass((CEntity *)&*(epass.penOther), "Enemy Base")) { resume; }
          stop;
        }
        resume;
      }
      on (ETouch etouch) : {
        // clear time limit for launcher
        m_fIgnoreTime = 0.0f;
        // ignore another projectile of same type
        BOOL bHit;
        bHit = !((!m_bCanHitHimself && IsOfClass(etouch.penOther, "Projectile") &&
                 ((CProjectile*)&*etouch.penOther)->m_prtType==m_prtType));     
        
        if (bHit) {
          ProjectileTouch(etouch.penOther);
          stop;
        }
        resume;
      }
      on (EDeath) : {
        if (m_bCanBeDestroyed) {
          ProjectileHit();
          stop;
        }
        resume;
      }
      on (ETimer) : {
        ProjectileHit();
        stop;
      }
    }
    return EEnd();
  };

  // --->>> GUIDED PROJECTILE FLY IN SPACE
  ProjectileGuidedFly(EVoid) {
    // if already inside some entity
    CEntity *penObstacle;
    if (CheckForCollisionNow(0, &penObstacle)) {
      // explode now
      ProjectileTouch(penObstacle);
      return EEnd();
    }
    // fly loop
    while( _pTimer->CurrentTick()<(m_fStartTime+m_fFlyTime))
    {
      FLOAT fWaitFrequency = 0.1f;

      if (m_penTarget!=NULL) {
        // calculate desired position and angle
        EntityInfo *pei= (EntityInfo*) (m_penTarget->GetEntityInfo());
        FLOAT3D vDesiredPosition;
        GetEntityInfoPosition( m_penTarget, pei->vSourceCenter, vDesiredPosition);
        FLOAT3D vDesiredDirection = (vDesiredPosition-GetPlacement().pl_PositionVector).Normalize();
        // for heading
        ANGLE aWantedHeading = GetRelativeHeading( vDesiredDirection);
        ANGLE aHeading = GetRotationSpeed( aWantedHeading, m_aRotateSpeed, fWaitFrequency);

        // factor used to decrease speed of projectiles oriented opposite of its target
        FLOAT fSpeedDecreasingFactor = ((180-Abs(aWantedHeading))/180.0f);
        // factor used to increase speed when far away from target
        FLOAT fSpeedIncreasingFactor = (vDesiredPosition-GetPlacement().pl_PositionVector).Length()/100;
        fSpeedIncreasingFactor = ClampDn(fSpeedIncreasingFactor, 1.0f);
        // decrease speed acodring to target's direction
        FLOAT fMaxSpeed = m_fGuidedMaxSpeedFactor*fSpeedIncreasingFactor;
        FLOAT fMinSpeedRatio = 0.5f;
        FLOAT fWantedSpeed = fMaxSpeed*( fMinSpeedRatio+(1-fMinSpeedRatio)*fSpeedDecreasingFactor);
        // adjust translation velocity
        SetDesiredTranslation( FLOAT3D(0, 0, -fWantedSpeed));
      
        // adjust rotation speed
        m_aRotateSpeed = 75.0f*(1+0.5f*fSpeedDecreasingFactor);
      
        // calculate distance factor
        FLOAT fDistanceFactor = (vDesiredPosition-GetPlacement().pl_PositionVector).Length()/50.0;
        fDistanceFactor = ClampUp(fDistanceFactor, 4.0f);
        FLOAT fRNDHeading = (FRnd()-0.5f)*180*fDistanceFactor;
        FLOAT fRNDPitch = (FRnd()-0.5f)*90*fDistanceFactor;

        // if we are looking near direction of target
        if( Abs( aWantedHeading) < 30.0f)
        {
          // calculate pitch speed
          ANGLE aWantedPitch = GetRelativePitch( vDesiredDirection);
          ANGLE aPitch = GetRotationSpeed( aWantedPitch, m_aRotateSpeed*1.5f, fWaitFrequency);
          // adjust heading and pich
          SetDesiredRotation(ANGLE3D(aHeading+fRNDHeading,aPitch+fRNDPitch,0));
        }
        // just adjust heading
        else
        {
          SetDesiredRotation(ANGLE3D(aHeading,fDistanceFactor*40,0));
        }
      }

      wait( fWaitFrequency)
      {
        on (EBegin) : { resume; }
        on (EPass epass) : {
          BOOL bHit;
          // ignore launcher within 1 second
          bHit = epass.penOther!=m_penLauncher || _pTimer->CurrentTick()>m_fIgnoreTime;
          // ignore another projectile of same type
          bHit &= !((!m_bCanHitHimself && IsOfClass(epass.penOther, "Projectile") &&
                  ((CProjectile*)&*epass.penOther)->m_prtType==m_prtType));
          if (bHit) {
            ProjectileTouch(epass.penOther);
            return EEnd();
          }
          resume;
        }
        on (EDeath) :
        {
          if (m_bCanBeDestroyed)
          {
            ProjectileHit();
            return EEnd();
          }
          resume;
        }
        on (ETimer) :
        {
          stop;
        }
      }
    }
    return EEnd();
  };

  ProjectileGuidedFastFly(EVoid) {
    // if already inside some entity
    CEntity *penObstacle;
    if (CheckForCollisionNow(0, &penObstacle)) {
      // explode now
      ProjectileTouch(penObstacle);
      return EEnd();
    }
    // fly loop
    while( _pTimer->CurrentTick()<(m_fStartTime+m_fFlyTime))
    {
      FLOAT fWaitFrequency = 0.1f;

      if (m_penTarget!=NULL) {
        // calculate desired position and angle
        EntityInfo *pei= (EntityInfo*) (m_penTarget->GetEntityInfo());
        FLOAT3D vDesiredPosition;
        GetEntityInfoPosition( m_penTarget, pei->vSourceCenter, vDesiredPosition);
        FLOAT3D vDesiredDirection = (vDesiredPosition-GetPlacement().pl_PositionVector).Normalize();
        // for heading
        ANGLE aWantedHeading = GetRelativeHeading( vDesiredDirection);
        ANGLE aHeading = GetRotationSpeed( aWantedHeading, 5.0f/*m_aRotateSpeed*/, fWaitFrequency);

        // factor used to decrease speed of projectiles oriented opposite of its target
        FLOAT fSpeedDecreasingFactor = ((180-Abs(aWantedHeading))/180.0f);
        // factor used to increase speed when far away from target
        FLOAT fSpeedIncreasingFactor = (vDesiredPosition-GetPlacement().pl_PositionVector).Length()/100;
        fSpeedIncreasingFactor = ClampDn(fSpeedIncreasingFactor, 1.0f);
        // decrease speed acording to target's direction
        FLOAT fMaxSpeed = m_fGuidedMaxSpeedFactor*fSpeedIncreasingFactor;
        FLOAT fMinSpeedRatio = 10.0f;
        FLOAT fWantedSpeed = fMaxSpeed*( fMinSpeedRatio+(1-fMinSpeedRatio)*fSpeedDecreasingFactor);
        // adjust translation velocity
        SetDesiredTranslation( FLOAT3D(0, 0, -fWantedSpeed));
      
        // adjust rotation speed
        m_aRotateSpeed = 110.0f*(1+0.5f*fSpeedDecreasingFactor);
      
        // calculate distance factor
        FLOAT fDistanceFactor = (vDesiredPosition-GetPlacement().pl_PositionVector).Length()/50.0;
        fDistanceFactor = ClampUp(fDistanceFactor, 4.0f);
        
        // if we are looking near direction of target
        if( Abs( aWantedHeading) < 30.0f)
        {
          bLockedOn = TRUE;
          // calculate pitch speed
          ANGLE aWantedPitch = GetRelativePitch( vDesiredDirection);
          ANGLE aPitch = GetRotationSpeed( aWantedPitch, m_aRotateSpeed*1.5f, fWaitFrequency);
          // adjust heading and pitch
          SetDesiredRotation(ANGLE3D(aHeading, aPitch, 0));
        }
        // just adjust heading
        else
        {
          if (bLockedOn) // we just missed the player
          {
            ANGLE3D aBankingUp;
            aBankingUp = GetPlacement().pl_OrientationAngle;
            aBankingUp(3) = 0.0f;
            SetPlacement(CPlacement3D(GetPlacement().pl_PositionVector, aBankingUp));
          }
          bLockedOn = FALSE;
          //SetDesiredRotation(ANGLE3D(aHeading,fDistanceFactor*40,0));
          SetDesiredRotation(ANGLE3D(aHeading,400,0));
        }
      }

      wait( fWaitFrequency)
      {
        on (EBegin) : { resume; }
        on (ETouch etouch) : {
          // clear time limit for launcher
          m_fIgnoreTime = 0.0f;
          // ignore itself and the demon
          BOOL bHit;
          bHit = !((!m_bCanHitHimself && IsOfClass(etouch.penOther, "Projectile") &&
            ((CProjectile*)&*etouch.penOther)->m_prtType==m_prtType));
          FLOAT3D vTrans = en_vCurrentTranslationAbsolute;
          bHit &= Abs(vTrans.Normalize() % FLOAT3D(etouch.plCollision)) > 0.35;

          if (bHit) {
            ProjectileTouch(etouch.penOther);
            return EEnd();
          }

          resume;
        }  
        on (EPass epass) : {
          BOOL bHit;
          // ignore launcher within 1 second
          bHit = epass.penOther!=m_penLauncher || _pTimer->CurrentTick()>m_fIgnoreTime;
          // ignore another projectile of same type
          bHit &= !((!m_bCanHitHimself && IsOfClass(epass.penOther, "Projectile") &&
                  ((CProjectile*)&*epass.penOther)->m_prtType==m_prtType));

          if (bHit) {
            ProjectileTouch(epass.penOther);
            return EEnd();
          }
          resume;
        }
        on (EDeath) :
        {
          if (m_bCanBeDestroyed)
          {
            ProjectileHit();
            return EEnd();
          }
          resume;
        }
        on (ETimer) :
        {
          stop;
        }
      }
    }
    return EEnd();
  };

  
  ProjectileGuidedSlide(EVoid) {
    // if already inside some entity
    CEntity *penObstacle;
    if (CheckForCollisionNow(0, &penObstacle)) {
      // explode now
      ProjectileTouch(penObstacle);
      return EEnd();
    }
    // fly loop
    while( _pTimer->CurrentTick()<(m_fStartTime+m_fFlyTime))
    {
      FLOAT fWaitFrequency = 0.1f;
      if (m_penTarget!=NULL) {
        // calculate desired position and angle
        EntityInfo *pei= (EntityInfo*) (m_penTarget->GetEntityInfo());
        FLOAT3D vDesiredPosition;
        GetEntityInfoPosition( m_penTarget, pei->vSourceCenter, vDesiredPosition);
        FLOAT3D vDesiredDirection = (vDesiredPosition-GetPlacement().pl_PositionVector).Normalize();
        // for heading
        ANGLE aWantedHeading = GetRelativeHeading( vDesiredDirection);
        ANGLE aHeading = GetRotationSpeed( aWantedHeading, m_aRotateSpeed, fWaitFrequency);

        // factor used to decrease speed of projectiles oriented opposite of its target
        FLOAT fSpeedDecreasingFactor = ((180-Abs(aWantedHeading))/180.0f);
        // factor used to increase speed when far away from target
        FLOAT fSpeedIncreasingFactor = (vDesiredPosition-GetPlacement().pl_PositionVector).Length()/100;
        fSpeedIncreasingFactor = ClampDn(fSpeedIncreasingFactor, 1.0f);
        // decrease speed acodring to target's direction
        FLOAT fMaxSpeed = 30.0f*fSpeedIncreasingFactor;
        FLOAT fMinSpeedRatio = 0.5f;
        FLOAT fWantedSpeed = fMaxSpeed*( fMinSpeedRatio+(1-fMinSpeedRatio)*fSpeedDecreasingFactor);
        // adjust translation velocity
        SetDesiredTranslation( FLOAT3D(0, 0, -fWantedSpeed));
      
        // adjust rotation speed
        m_aRotateSpeed = 75.0f*(1+0.5f*fSpeedDecreasingFactor);
      
        // calculate distance factor
        FLOAT fDistanceFactor = (vDesiredPosition-GetPlacement().pl_PositionVector).Length()/50.0;
        fDistanceFactor = ClampUp(fDistanceFactor, 4.0f);
        FLOAT fRNDHeading = (FRnd()-0.5f)*180*fDistanceFactor;
        
        // if we are looking near direction of target
        if( Abs( aWantedHeading) < 30.0f)
        {
          // adjust heading and pich
          SetDesiredRotation(ANGLE3D(aHeading+fRNDHeading,0,0));
        }
        // just adjust heading
        else
        {
          SetDesiredRotation(ANGLE3D(aHeading,0,0));
        }
      }

      wait( fWaitFrequency)
      {
        on (EBegin) : { resume; }
        on (EPass epass) : {
          BOOL bHit;
          // ignore launcher within 1 second
          bHit = epass.penOther!=m_penLauncher || _pTimer->CurrentTick()>m_fIgnoreTime;
          // ignore another projectile of same type
          bHit &= !((!m_bCanHitHimself && IsOfClass(epass.penOther, "Projectile") &&
                  ((CProjectile*)&*epass.penOther)->m_prtType==m_prtType));
          if (bHit) {
            ProjectileTouch(epass.penOther);
            return EEnd();
          }
          resume;
        }
        on (EDeath) :
        {
          if (m_bCanBeDestroyed)
          {
            ProjectileHit();
            return EEnd();
          }
          resume;
        }
        on (ETimer) :
        {
          stop;
        }
      }
    }
    return EEnd();
  };

  // --->>> PROJECTILE SLIDE ON BRUSH
  ProjectileSlide(EVoid) {
    // if already inside some entity
    CEntity *penObstacle;
    if (CheckForCollisionNow(0, &penObstacle)) {
      // explode now
      ProjectileTouch(penObstacle);
      return EEnd();
    }
    // fly loop
    wait(m_fFlyTime) {
      on (EBegin) : { resume; }
      on (EPass epass) : {
        BOOL bHit;
        // ignore launcher within 1 second
        bHit = epass.penOther!=m_penLauncher || _pTimer->CurrentTick()>m_fIgnoreTime;
        // ignore another projectile of same type
        bHit &= !((!m_bCanHitHimself && IsOfClass(epass.penOther, "Projectile") &&
                ((CProjectile*)&*epass.penOther)->m_prtType==m_prtType));
        // ignore twister
        bHit &= !IsOfClass(epass.penOther, "Twister");
        if (epass.penOther!=m_penLauncher) {
   bHit = bHit ;
        }
        if (bHit) {
          ProjectileTouch(epass.penOther);
          // player flame passes through enemies
          if (m_prtType==PRT_FLAME && IsDerivedFromClass((CEntity *)&*(epass.penOther), "Enemy Base")) {
            resume;
          }
          
          stop;
        }
        resume;
      }
      on (ETouch etouch) : {
        // clear time limit for launcher
        m_fIgnoreTime = 0.0f;
        // ignore brushes
        BOOL bHit;
        bHit = !(etouch.penOther->GetRenderType() & RT_BRUSH);
        if( m_prtType==PRT_FLAME && !bHit && !m_bLeftFlame)
        {
          SpawnFlame(m_penLauncher, etouch.penOther, GetPlacement().pl_PositionVector);
          m_bLeftFlame=TRUE;
        }
        // ignore another projectile of same type
        bHit &= !((!m_bCanHitHimself && IsOfClass(etouch.penOther, "Projectile") &&
                  ((CProjectile*)&*etouch.penOther)->m_prtType==m_prtType));
        if (bHit) {
          ProjectileTouch(etouch.penOther);
          stop;
        }
        // projectile is moving to slow (stuck somewhere) -> kill it
        if (en_vCurrentTranslationAbsolute.Length() < 0.25f*en_vDesiredTranslationRelative.Length()) {
          ProjectileHit();
          stop;
        }
        resume;
      }
      on (EDeath) : {
        if (m_bCanBeDestroyed) {
          ProjectileHit();
          stop;
        }
        resume;
      }
      on (ETimer) : {
        ProjectileHit();
        stop;
      }
    }
    return EEnd();
  };

  // --->>> PROJECTILE FLY IN SPACE WITH REBOUNDING
  ProjectileFlyRebounding(EVoid) {
    // if already inside some entity
    CEntity *penObstacle;
    if (CheckForCollisionNow(0, &penObstacle)) {
      // explode now
      ProjectileTouch(penObstacle);
      return EEnd();
    }
    // fly loop
    wait(m_fFlyTime) {
      on (EBegin) : { resume; }
      on (EPass epass) : {
        BOOL bHit;
        // ignore launcher within 1 second
        bHit = epass.penOther!=m_penLauncher || _pTimer->CurrentTick()>m_fIgnoreTime;
        // ignore another projectile of same type
        bHit &= !((!m_bCanHitHimself && IsOfClass(epass.penOther, "Projectile") &&
                ((CProjectile*)&*epass.penOther)->m_prtType==m_prtType));
        // ignore twister
        bHit &= !IsOfClass(epass.penOther, "Twister");
        if (bHit) {
          ProjectileTouch(epass.penOther);
          stop;
        }
        resume;
      }
      on (ETouch etouch) : {
        // clear time limit for launcher
        m_fIgnoreTime = 0.0f;
        
        BOOL bHit;
        
        // if brush hit
        bHit = (etouch.penOther->GetRenderType() == RT_BRUSH);
        
        if (bHit && m_iRebounds>0) {
          //reverse direction
          ReflectDirectionVectorByPlane(etouch.plCollision, en_vCurrentTranslationAbsolute);
          ReflectRotationMatrixByPlane_cols(etouch.plCollision, en_mRotation);
          m_iRebounds--;
        } else {
          // ignore another projectile of same type
          bHit = !((!m_bCanHitHimself && IsOfClass(etouch.penOther, "Projectile") &&
                   ((CProjectile*)&*etouch.penOther)->m_prtType==m_prtType));     
        
          if (bHit) {
            ProjectileTouch(etouch.penOther);
            stop;
          }
        }
        resume;
      }
      on (EDeath) : {
        if (m_bCanBeDestroyed) {
          ProjectileHit();
          stop;
        }
        resume;
      }
      on (ETimer) : {
        ProjectileHit();
        stop;
      }
    }
    return EEnd();
  };

  // --->>> PROJECTILE BURST ON CONTACT WITH BRUSHES AND ENTITIES
  ProjectileBloodBundle(EVoid) {
    // if already inside some entity
    CEntity *penObstacle;
    if (CheckForCollisionNow(0, &penObstacle)) {
      // explode now
      ProjectileTouch(penObstacle);
      return EEnd();
    }
    // fly loop
    wait(m_fFlyTime) {
      on (EBegin) : { resume; }
      on (EPass epass) : {
        BOOL bHit;
        // ignore launcher within 1 second
        bHit = epass.penOther!=m_penLauncher || _pTimer->CurrentTick()>m_fIgnoreTime;
        // ignore another projectile of same type
        bHit &= !((!m_bCanHitHimself && IsOfClass(epass.penOther, "Projectile") &&
                ((CProjectile*)&*epass.penOther)->m_prtType==m_prtType));
        // ignore twister
        bHit &= !IsOfClass(epass.penOther, "Twister");
        if (epass.penOther!=m_penLauncher) {
   bHit = bHit ;
        }
        if (bHit) {
          ProjectileTouch(epass.penOther);
          // player flame passes through enemies
          if (m_prtType==PRT_FLAME && IsDerivedFromClass((CEntity *)&*(epass.penOther), "Enemy Base")) {
            resume;
          }
          
          stop;
        }
        resume;
      }
      on (ETouch etouch) : {
        // clear time limit for launcher
        m_fIgnoreTime = 0.0f;
        // don't ignore brushes and other projectiles

        if(etouch.penOther->GetRenderType() & RT_MODEL || etouch.penOther->GetRenderType() & RT_BRUSH ||
           etouch.penOther->GetRenderType() & RT_SKAMODEL) {
          ProjectileHit();
          stop;
        }

        BOOL bHit;
        // ignore another projectile of same type
        bHit &= !((!m_bCanHitHimself && IsOfClass(etouch.penOther, "Projectile") &&
                  ((CProjectile*)&*etouch.penOther)->m_prtType==m_prtType));
        if (bHit) {
          ProjectileTouch(etouch.penOther);
          stop;
        }
        // projectile is moving to slow (stuck somewhere) -> kill it
        if (en_vCurrentTranslationAbsolute.Length() < 0.25f*en_vDesiredTranslationRelative.Length()) {
          ProjectileHit();
          stop;
        }
        resume;
      }
      on (EDeath) : {
        if (m_bCanBeDestroyed) {
          ProjectileHit();
          stop;
        }
        resume;
      }
      on (ETimer) : {
        ProjectileHit();
        stop;
      }
    }
    return EEnd();
  };

  // --->>> MAIN
  Main(ELaunchProjectile eLaunch) {
    // remember the initial parameters
    ASSERT(eLaunch.penLauncher!=NULL);
    m_penLauncher = eLaunch.penLauncher;
    m_prtType = eLaunch.prtType;
    m_fSpeed = eLaunch.fSpeed;
    m_fStretch=eLaunch.fStretch;
    SetPredictable(TRUE);
    // remember lauching time
    m_fIgnoreTime = _pTimer->CurrentTick() + 1.0f;
    m_penLastDamaged = NULL;

    switch (m_prtType) {
      case PRT_GUNMAN_BULLET: Particles_BombTrail_Prepare(this); break;
      case PRT_DOOMIMP_FIREBALL:
      case PRT_SHOOTER_FIREBALL:
      Particles_Fireball01Trail_Prepare(this); break;
    }

    // projectile initialization
    switch (m_prtType)
    {
      case PRT_FLAME: PlayerFlame(); break;
      case PRT_SHOOTER_FLAME: ShooterFlame(); break;
      case PRT_AFTERBURNER_DEBRIS: AfterburnerDebris(); break;
      case PRT_GUNMAN_BULLET: GunmanBullet(); break;
      case PRT_DOOMIMP_FIREBALL: DoomImpFireball(); break;
      case PRT_MUTANT_SPIT: MutantBloodSpit(); break;
      case PRT_SHOOTER_FIREBALL: ShooterFireball(); break;
      case PRT_SHOOTER_SPIT: ShooterBloodSpit(); break;
      case PRT_SHAMBLER_BLOOD_BUNDLE: ShamblerBloodBundle(); break;
      default: ASSERTALWAYS("Unknown projectile type");
    }

    // setup light source
    if (m_bLightSource) { SetupLightSource(TRUE); }

    // fly
    m_fStartTime = _pTimer->CurrentTick();
    // if guided projectile
    if( m_pmtMove == PMT_GUIDED) {
      autocall ProjectileGuidedFly() EEnd;
    } else if (m_pmtMove==PMT_GUIDED_FAST) {
      autocall ProjectileGuidedFastFly() EEnd;
    } else if (m_pmtMove==PMT_FLYING) {
      autocall ProjectileFly() EEnd;
    } else if (m_pmtMove==PMT_SLIDING) {
      autocall ProjectileSlide() EEnd;
    } else if (m_pmtMove==PMT_FLYING_REBOUNDING) {
      autocall ProjectileFlyRebounding() EEnd;
    } else if (m_pmtMove==PMT_GUIDED_SLIDING) {
      autocall ProjectileGuidedSlide() EEnd;
    } else if (m_pmtMove==PMT_BLOODBUNDLE) {
      autocall ProjectileBloodBundle() EEnd;
    }  

    // projectile explosion
    switch (m_prtType) {
      case PRT_DOOMIMP_FIREBALL: 
      case PRT_SHOOTER_FIREBALL: 
      FireballExplosion(); break;
      case PRT_MUTANT_SPIT:
      case PRT_SHOOTER_SPIT:
      case PRT_SHAMBLER_BLOOD_BUNDLE:
      MutantBloodExplosion(); break;
    }

    // wait after death
    if (m_fWaitAfterDeath>0.0f) {
      SwitchToEditorModel();
      ForceFullStop();
      SetCollisionFlags(ECF_IMMATERIAL);
      // kill light source
      if (m_bLightSource) { SetupLightSource(FALSE); }
      autowait(m_fWaitAfterDeath);
    }

    Destroy();

    return;
  }
};
