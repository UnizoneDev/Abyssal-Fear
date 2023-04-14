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

601
%{
#include "StdH.h"
#include "Models/Effects/Teleport01/Teleport.h"
#include "Models/Effects/ExplosionGrenade/ExplosionGrenade.h"
#include "Models/Effects/ShockWave01/ShockWave.h"
#include "Models/Effects/BloodOnTheWall01/Blood.h"
#include "EntitiesMP/MovingBrush.h"

#define EXPLOSION_GRENADE_TEXTURE_ANIM_FAST 0
#define EXPLOSION_GRENADE_TEXTURE_ANIM_MEDIUM 1
#define EXPLOSION_GRENADE_TEXTURE_ANIM_SLOW 2

#define SHOCKWAVE_TEXTURE_ANIM_FAST 0
#define SHOCKWAVE_TEXTURE_ANIM_MEDIUM 1
#define SHOCKWAVE_TEXTURE_ANIM_SLOW 2
%}

uses "EntitiesMP/Light";

enum BasicEffectType {
  0 BET_NONE                 "None",     // no effect (never spawned)
  1 BET_EXPLOSIONSTAIN       "Explosionstain",     // explosion stain on brush
  2 BET_SHOCKWAVE            "Shockwave",     // shock wave
  3 BET_LASERWAVE            "Laserwave",     // laser wave
  4 BET_BLOODSPILL           "Blood spill",     // blood spill from bullet exit wound
  5 BET_BLOODSTAIN           "Blood stain",     // blood stain
  6 BET_BLOODSTAINGROW       "Blood staingrow",     // blood stain which grows bigger
  7 BET_BLOODEXPLODE         "Blood explode",     // blood explosion at bullet entry wound
  8 BET_TELEPORT             "Teleport",     // teleportation
  9 BET_BULLETTRAIL          "Bullet trail",     // white trail where bullet has passed
 10 BET_BULLETSTAINSTONE     "Bullet stain stone",     // bullet stain with ricochet on stone
 11 BET_BULLETSTAINSAND      "Bullet stain sand",     // bullet stain with ricochet on sand
 12 BET_BULLETSTAINWATER     "Bullet stain water",     // bullet stain with ricochet on water surface
 13 BET_BULLETSTAINUNDERWATER "Bullet stain underwater",    // bullet stain with ricochet on underwater surface
 14 BET_BULLETSTAINSTONENOSOUND "Bullet stain stone nosound",  // bullet stain on stone with no sound
 15 BET_BULLETSTAINSANDNOSOUND  "Bullet stain sand nosound",  // bullet stain on sand with no sound
 16 BET_BULLETSTAINWATERNOSOUND "Bullet stain water nosound",  // bullet stain on water surface with no sound
 17 BET_BULLETSTAINUNDERWATERNOSOUND "Bullet stain underwater no sound", // bullet stain on under water surface with no sound
 18 BET_BULLETSTAINREDSAND      "Bullet stain red sand",     // bullet stain with ricochet on red sand
 19 BET_BULLETSTAINREDSANDNOSOUND "Bullet stain red sand no sound",   // bullet stain with ricochet on red sand without sound
 20 BET_BULLETSTAINGRASS        "Bullet stain grass",     // bullet stain with ricochet on grass
 21 BET_BULLETSTAINWOOD         "Bullet stain wood",     // bullet stain with ricochet on wood
 22 BET_BULLETSTAINGRASSNOSOUND "Bullet stain grass no sound",     // bullet stain on grass with no sound
 23 BET_BULLETSTAINWOODNOSOUND  "Bullet stain wood no sound",     // bullet stain on wood with no sound
 24 BET_EXPLOSION_DEBRIS        "Explosion debris",     // debrises flying out of explosion
 25 BET_EXPLOSION_SMOKE         "Explosion smoke",     // smoke left behind explosion
 26 BET_SUMMONERSTAREXPLOSION   "Summoner star explosion",     // magic explosion of starts for summoner
 27 BET_COLLECT_ENERGY          "Collect energy",
 28 BET_GROWING_SWIRL           "Growing swirl",
 29 BET_DISAPPEAR_DUST          "Disappear dust",
 30 BET_DUST_FALL               "Dust fall",
 31 BET_BULLETSTAINSNOW         "Bullet stain snow", 
 32 BET_BULLETSTAINSNOWNOSOUND  "Bullet stain snow", 
 33 BET_BULLETSTAINMETAL         "Bullet stain metal", 
 34 BET_BULLETSTAINMETALNOSOUND  "Bullet stain metal no sound", 
 35 BET_BULLETSTAINCARPET         "Bullet stain carpet", 
 36 BET_BULLETSTAINCARPETNOSOUND  "Bullet stain carpet no sound", 
 37 BET_BULLETSTAINBLOOD         "Bullet stain blood",     // bullet stain with ricochet on blood surface
 38 BET_BULLETSTAINUNDERBLOOD    "Bullet stain underblood",    // bullet stain with ricochet on underblood surface
 39 BET_BULLETSTAINBLOODNOSOUND      "Bullet stain blood nosound",  // bullet stain on blood surface with no sound
 40 BET_BULLETSTAINUNDERBLOODNOSOUND "Bullet stain underblood no sound", // bullet stain on under blood surface with no sound
 41 BET_BULLETSTAINGLASS         "Bullet stain glass", 
 42 BET_BULLETSTAINGLASSNOSOUND  "Bullet stain glass no sound", 
 43 BET_FIREBALL                 "Fireball explode",     // fireball explosion
 44 BET_FIREBALL_PLANE           "Fireball plane",     // fireball explosion on plane
 45 BET_BULLETSTAINDIRT         "Bullet stain dirt", 
 46 BET_BULLETSTAINDIRTNOSOUND  "Bullet stain dirt no sound", 
 47 BET_BULLETSTAINTILE         "Bullet stain tile", 
 48 BET_BULLETSTAINTILENOSOUND  "Bullet stain tile no sound",
 49 BET_BULLETSTAINCHAINLINK    "Bullet stain chainlink", 
 50 BET_BULLETSTAINCHAINLINKNOSOUND  "Bullet stain chainlink no sound",
 51 BET_EXPLOSIVEBARREL                 "Explosive barrel explode",     // explosive explosion
 52 BET_EXPLOSIVEBARREL_PLANE           "Explosive barrel plane",     // explosive explosion on plane
 53 BET_BULLETSTAINACID         "Bullet stain acid",     // bullet stain with ricochet on acid surface
 54 BET_BULLETSTAINUNDERACID    "Bullet stain underacid",    // bullet stain with ricochet on underacid surface
 55 BET_BULLETSTAINACIDNOSOUND      "Bullet stain acid nosound",  // bullet stain on acid surface with no sound
 56 BET_BULLETSTAINUNDERACIDNOSOUND "Bullet stain underacid no sound", // bullet stain on under acid surface with no sound
 57 BET_BULLETSTAINGRATE    "Bullet stain grate", 
 58 BET_BULLETSTAINGRATENOSOUND  "Bullet stain grate no sound",
 59 BET_BULLETSTAINMUD    "Bullet stain mud", 
 60 BET_BULLETSTAINMUDNOSOUND  "Bullet stain mud no sound",
 61 BET_BOMB "Bomb",     // small bomb explosion
};


// input parameter for spwaning a basic effect
event ESpawnEffect {
  enum BasicEffectType betType,   // type of effect
  FLOAT3D vNormal,                // normal for orientative effects
  FLOAT3D vDirection,             // direction oriented effects
  FLOAT3D vStretch,               // stretch effect model
  COLOR colMuliplier,             // color multiplier
};

%{
void CBasicEffect_OnPrecache(CDLLEntityClass *pdec, INDEX iUser) 
{
  switch ((BasicEffectType)iUser) {
  case BET_EXPLOSIONSTAIN:
    pdec->PrecacheModel(MODEL_EXPLOSION_STAIN);
    pdec->PrecacheTexture(TEXTURE_EXPLOSION_STAIN);
    break;
  case BET_SHOCKWAVE:
    pdec->PrecacheModel(MODEL_SHOCKWAVE);
    pdec->PrecacheTexture(TEXTURE_SHOCKWAVE);
    break;
  case BET_LASERWAVE:
    pdec->PrecacheModel(MODEL_LASERWAVE);
    pdec->PrecacheTexture(TEXTURE_LASERWAVE);
    break;
  case BET_BULLETSTAINSTONE:
  case BET_BULLETSTAINSAND:
  case BET_BULLETSTAINREDSAND:
  case BET_BULLETSTAINWATER:
  case BET_BULLETSTAINUNDERWATER:
  case BET_BULLETSTAINSTONENOSOUND:
  case BET_BULLETSTAINSANDNOSOUND:
  case BET_BULLETSTAINREDSANDNOSOUND:
  case BET_BULLETSTAINWATERNOSOUND:
  case BET_BULLETSTAINUNDERWATERNOSOUND:
  case BET_BULLETSTAINGRASS:
  case BET_BULLETSTAINWOOD:
  case BET_BULLETSTAINGRASSNOSOUND:
  case BET_BULLETSTAINWOODNOSOUND:
  case BET_BULLETSTAINSNOW:
  case BET_BULLETSTAINSNOWNOSOUND:
  case BET_BULLETSTAINMETAL:
  case BET_BULLETSTAINCARPET:
  case BET_BULLETSTAINMETALNOSOUND:
  case BET_BULLETSTAINCARPETNOSOUND:
  case BET_BULLETSTAINBLOOD:
  case BET_BULLETSTAINUNDERBLOOD:
  case BET_BULLETSTAINBLOODNOSOUND:
  case BET_BULLETSTAINUNDERBLOODNOSOUND:
  case BET_BULLETSTAINGLASS:
  case BET_BULLETSTAINGLASSNOSOUND:
  case BET_BULLETSTAINDIRT:
  case BET_BULLETSTAINTILE:
  case BET_BULLETSTAINDIRTNOSOUND:
  case BET_BULLETSTAINTILENOSOUND:
  case BET_BULLETSTAINCHAINLINK:
  case BET_BULLETSTAINCHAINLINKNOSOUND:
  case BET_BULLETSTAINACID:
  case BET_BULLETSTAINUNDERACID:
  case BET_BULLETSTAINACIDNOSOUND:
  case BET_BULLETSTAINUNDERACIDNOSOUND:
  case BET_BULLETSTAINGRATE:
  case BET_BULLETSTAINGRATENOSOUND:
  case BET_BULLETSTAINMUD:
  case BET_BULLETSTAINMUDNOSOUND:
    pdec->PrecacheModel(MODEL_BULLET_HIT);
    pdec->PrecacheTexture(TEXTURE_BULLET_HIT);
    pdec->PrecacheTexture(TEXTURE_BULLET_SAND);
    pdec->PrecacheTexture(TEXTURE_BULLET_METAL);
    pdec->PrecacheTexture(TEXTURE_BULLET_GLASS);
    pdec->PrecacheModel(MODEL_SHOCKWAVE);
    pdec->PrecacheTexture(TEXTURE_WATER_WAVE);
    pdec->PrecacheTexture(TEXTURE_BLOOD_WAVE);
    pdec->PrecacheTexture(TEXTURE_ACID_WAVE);
    pdec->PrecacheSound(SOUND_BULLET_STONE);
    pdec->PrecacheSound(SOUND_BULLET_SAND);
    pdec->PrecacheSound(SOUND_BULLET_WATER);
    pdec->PrecacheModel(MODEL_BULLET_STAIN);
    pdec->PrecacheTexture(TEXTURE_BULLET_STAIN);
    pdec->PrecacheSound(SOUND_BULLET_GRASS);
    pdec->PrecacheSound(SOUND_BULLET_WOOD);
    pdec->PrecacheSound(SOUND_BULLET_SNOW);
    pdec->PrecacheSound(SOUND_BULLET_METAL);
    pdec->PrecacheSound(SOUND_BULLET_CARPET);
    pdec->PrecacheSound(SOUND_BULLET_BLOOD);
    pdec->PrecacheSound(SOUND_BULLET_GLASS);
    pdec->PrecacheSound(SOUND_BULLET_DIRT);
    pdec->PrecacheSound(SOUND_BULLET_TILE);
    pdec->PrecacheSound(SOUND_BULLET_CHAINLINK);
    pdec->PrecacheSound(SOUND_BULLET_ACID);
    pdec->PrecacheSound(SOUND_BULLET_GRATE);
    pdec->PrecacheSound(SOUND_BULLET_MUD);
    break;
  case BET_BULLETTRAIL:
    pdec->PrecacheModel(MODEL_BULLET_TRAIL);
    pdec->PrecacheTexture(TEXTURE_BULLET_TRAIL);
    break;
  case BET_BLOODEXPLODE:
    pdec->PrecacheModel(MODEL_BLOOD_EXPLODE);
    pdec->PrecacheTexture(TEXTURE_BLOOD_EXPLODE);
    pdec->PrecacheSound(SOUND_BULLET_FLESH);
    break;
  case BET_BLOODSTAIN:
  case BET_BLOODSTAINGROW:
  case BET_BLOODSPILL:
    pdec->PrecacheModel(MODEL_BLOOD_STAIN);
    pdec->PrecacheTexture(TEXTURE_BLOOD_STAIN1);
    pdec->PrecacheTexture(TEXTURE_BLOOD_STAIN2);
    pdec->PrecacheTexture(TEXTURE_BLOOD_STAIN3);
    pdec->PrecacheTexture(TEXTURE_BLOOD_SPILL1);
    pdec->PrecacheTexture(TEXTURE_BLOOD_SPILL2);
    break;
  case BET_TELEPORT:
    pdec->PrecacheModel(MODEL_TELEPORT_EFFECT);
    pdec->PrecacheTexture(TEXTURE_TELEPORT_EFFECT);
    pdec->PrecacheSound(SOUND_TELEPORT);
    break;
  case BET_FIREBALL:
  case BET_FIREBALL_PLANE:
    pdec->PrecacheSound(SOUND_FIREBALL_EXPLOSION);
    pdec->PrecacheModel(MDL_FIREBALL_EXPLOSION);
    pdec->PrecacheTexture(TXT_FIREBALL_EXPLOSION);
    pdec->PrecacheModel(MDL_PARTICLES_EXPLOSION);
    pdec->PrecacheTexture(TXT_PARTICLES_EXPLOSION);
    pdec->PrecacheModel(MDL_FIREBALL3D_EXPLOSION);
    pdec->PrecacheTexture(TXT_FIREBALL_EXPLOSION);
    pdec->PrecacheModel(MDL_PARTICLES3D_EXPLOSION);
    pdec->PrecacheTexture(TXT_PARTICLES_EXPLOSION);
    break;
  case BET_BOMB:
  case BET_EXPLOSIVEBARREL:
  case BET_EXPLOSIVEBARREL_PLANE:
    pdec->PrecacheSound(SOUND_EXPLOSION);
    pdec->PrecacheModel(MDL_ROCKET_EXPLOSION);
    pdec->PrecacheTexture(TXT_ROCKET_EXPLOSION);
    pdec->PrecacheModel(MDL_PARTICLES_EXPLOSION);
    pdec->PrecacheTexture(TXT_PARTICLES_EXPLOSION);
    pdec->PrecacheModel(MDL_ROCKET3D_EXPLOSION);
    pdec->PrecacheTexture(TXT_ROCKET_EXPLOSION);
    pdec->PrecacheModel(MDL_PARTICLES3D_EXPLOSION);
    pdec->PrecacheTexture(TXT_PARTICLES_EXPLOSION);
    break;
  default:
    ASSERT(FALSE);
  }
}
%}

class CBasicEffect : CRationalEntity {
name      "BasicEffect";
thumbnail "";
features "ImplementsOnPrecache", "CanBePredictable";

properties:
  1 enum BasicEffectType m_betType = BET_NONE, // type of effect
  2 FLOAT m_fWaitTime = 0.0f,       // wait time
  3 FLOAT m_fFadeTime = 0.0f,       // fade away time
  4 BOOL  m_bFade = FALSE,          // fade is enabled
  5 FLOAT m_fFadeStartTime  = 0.0f,        // fade away start time
  9 FLOAT m_fFadeStartAlpha = 1.0f,        // alpha value 
  6 FLOAT3D m_vNormal    = FLOAT3D(0,0,0), // normal for orientative effects
  7 FLOAT3D m_vStretch   = FLOAT3D(0,0,0), // stretch effect
  8 FLOAT3D m_vDirection = FLOAT3D(0,0,0), // direction oriented effects
  10 FLOAT m_fDepthSortOffset = 0.0f,
  11 FLOAT m_fFadeInSpeed = 0.0f,
  12 FLOAT m_tmSpawn = 0.0f,  // when it was spawned
  13 FLOAT m_tmWaitAfterDeath = 0.0f,       // after death wait time

 20 BOOL m_bLightSource = FALSE,    // effect is also light source
 21 CAnimObject m_aoLightAnimation, // light animation object
 22 INDEX m_iLightAnimation = -1,   // lignt animation index
 23 COLOR m_colMultiplyColor = 0xFFFFFFFF, // color multiplier

 30 CSoundObject m_soEffect,        // sound channel
 31 FLOAT m_fSoundTime = 0.0f,      // wait for sound to end

 40 enum EffectParticlesType m_eptType = EPT_NONE, // type of particle effect
 41 FLOAT m_tmWhenShot = 0.0f, // when entity was shot
 42 FLOAT3D m_vGravity = FLOAT3D(0,0,0), // simulated direction of gravity

{
  CLightSource m_lsLightSource;
}

components:

// ********** PROJECTILE EXPLOSIONS **********
  1 model   MDL_ROCKET_EXPLOSION      "Models\\Effects\\ExplosionFireball\\ExplosionFireball.mdl",
  2 model   MDL_ROCKET3D_EXPLOSION    "Models\\Effects\\ExplosionFireball\\ExplosionFireball3D.mdl",
  3 texture TXT_ROCKET_EXPLOSION      "Models\\Effects\\ExplosionBig\\ExplosionBig.tex",
  7 model   MDL_PARTICLES_EXPLOSION   "Models\\Effects\\ExplosionParticles\\Particles.mdl",
  8 model   MDL_PARTICLES3D_EXPLOSION "Models\\Effects\\ExplosionParticles\\Particles3D.mdl",
  9 texture TXT_PARTICLES_EXPLOSION   "Models\\Effects\\ExplosionParticles\\ExplosionParticles.tex",
 10 sound   SOUND_EXPLOSION           "Sounds\\Weapons\\Explosion1.wav",
121 model   MDL_FIREBALL_EXPLOSION      "Models\\Effects\\ExplosionFireball\\ExplosionFireball.mdl",
122 model   MDL_FIREBALL3D_EXPLOSION    "Models\\Effects\\ExplosionFireball\\ExplosionFireball3D.mdl",
123 texture TXT_FIREBALL_EXPLOSION      "Models\\Effects\\ExplosionFireball\\ExplosionFireball.tex",
124 sound   SOUND_FIREBALL_EXPLOSION    "Sounds\\Weapons\\FireballHit.wav",

// ********** BULLET HIT **********
 15 model   MODEL_BULLET_HIT      "Models\\Effects\\BulletParticles\\BulletParticles.mdl",
 16 texture TEXTURE_BULLET_HIT    "Models\\Effects\\BulletParticles\\BulletParticles.tex",
 18 model   MODEL_BULLET_STAIN    "Models\\Effects\\BulletOnTheWall\\Bullet.mdl",
 19 texture TEXTURE_BULLET_STAIN  "Models\\Effects\\BulletOnTheWall\\Bullet.tex",
 102 texture TEXTURE_BULLET_METAL  "Models\\Effects\\BulletOnTheWall\\BulletMetal.tex",
 131 texture TEXTURE_BULLET_GLASS  "Models\\Effects\\BulletOnTheWall\\BulletGlass.tex",
 70 texture TEXTURE_BULLET_TRAIL  "Models\\Effects\\BulletTrail\\BulletTrail.tex",
 71 model   MODEL_BULLET_TRAIL    "Models\\Effects\\BulletTrail\\BulletTrail.mdl",

 90 sound   SOUND_BULLET_STONE    "Sounds\\Weapons\\BulletHitStone.wav",
 91 sound   SOUND_BULLET_SAND     "Sounds\\Weapons\\BulletHitSand.wav",
 92 sound   SOUND_BULLET_WATER    "Sounds\\Weapons\\BulletHitWater.wav",
 93 sound   SOUND_BULLET_FLESH    "Sounds\\Weapons\\BulletHitFlesh.wav",
 94 texture TEXTURE_BULLET_SAND   "Models\\Effects\\BulletOnTheWall\\BulletSand.tex",
 95 sound   SOUND_BULLET_GRASS    "Sounds\\Weapons\\BulletHitGrass.wav",
 96 sound   SOUND_BULLET_WOOD     "Sounds\\Weapons\\BulletHitWood.wav",
 97 sound   SOUND_BULLET_SNOW     "Sounds\\Weapons\\BulletHitSnow.wav",
 98 sound   SOUND_BULLET_METAL    "Sounds\\Weapons\\BulletHitMetal.wav",
 99 sound   SOUND_BULLET_CARPET   "Sounds\\Weapons\\BulletHitCarpet.wav",
 100 sound  SOUND_BULLET_BLOOD    "Sounds\\Weapons\\BulletHitBlood.wav",
 101 sound  SOUND_BULLET_GLASS    "Sounds\\Weapons\\BulletHitGlass.wav",
 125 sound  SOUND_BULLET_DIRT     "Sounds\\Weapons\\BulletHitDirt.wav",
 126 sound  SOUND_BULLET_TILE     "Sounds\\Weapons\\BulletHitTile.wav",
 127 sound  SOUND_BULLET_CHAINLINK "Sounds\\Weapons\\BulletHitChainlink.wav",
 128 sound  SOUND_BULLET_ACID     "Sounds\\Weapons\\BulletHitAcid.wav",
 129 sound  SOUND_BULLET_GRATE    "Sounds\\Weapons\\BulletHitGrate.wav",
 133 sound  SOUND_BULLET_MUD      "Sounds\\Weapons\\BulletHitMud.wav",

// ********** BLOOD **********
 21 model   MODEL_BLOOD_EXPLODE   "Models\\Effects\\BloodCloud\\BloodCloud.mdl",
 22 texture TEXTURE_BLOOD_EXPLODE "Models\\Effects\\BloodCloud\\BloodCloud.tex",
 23 model   MODEL_BLOOD_STAIN     "Models\\Effects\\BloodOnTheWall01\\Blood.mdl",
 24 texture TEXTURE_BLOOD_STAIN1  "Models\\Effects\\BloodOnTheWall01\\BloodStain01.tex",
 25 texture TEXTURE_BLOOD_STAIN2  "Models\\Effects\\BloodOnTheWall01\\BloodStain02.tex",
 26 texture TEXTURE_BLOOD_STAIN3  "Models\\Effects\\BloodOnTheWall01\\BloodStain03.tex",
 28 texture TEXTURE_BLOOD_SPILL1  "Models\\Effects\\BloodOnTheWall01\\BloodSpill02.tex",
 29 texture TEXTURE_BLOOD_SPILL2  "Models\\Effects\\BloodOnTheWall01\\BloodSpill05.tex",
 
// ********** SHOCK WAVE **********
 40 model   MODEL_SHOCKWAVE       "Models\\Effects\\ShockWave\\ShockWave.mdl",
 41 texture TEXTURE_SHOCKWAVE     "Models\\Effects\\ShockWave\\ShockWave.tex",

// ********** EXPLOSION STAIN **********
 45 model   MODEL_EXPLOSION_STAIN     "Models\\Effects\\BurnedStainOnTheWall\\BurnedStainOnTheWall.mdl",
 46 texture TEXTURE_EXPLOSION_STAIN   "Models\\Effects\\BurnedStainOnTheWall\\BurnedStainOnTheWall.tex",

// ********** LASER WAVE **********
 50 model   MODEL_LASERWAVE       "Models\\Effects\\ShockWaveGreen\\ShockWaveGreen.mdl",
 51 texture TEXTURE_LASERWAVE     "Models\\Effects\\ShockWaveGreen\\ShockWaveGreen.tex",

// ********** TELEPORT **********
 61 model   MODEL_TELEPORT_EFFECT        "Models\\Effects\\Teleport01\\Teleport.mdl",
 62 texture TEXTURE_TELEPORT_EFFECT      "Textures\\Effects\\Effect01\\Effect.tex",
 63 sound   SOUND_TELEPORT               "Sounds\\Misc\\Teleport.wav",

// ********** Water shockwave texture **********
 120 texture TEXTURE_WATER_WAVE          "Models\\Effects\\ShockWave\\WaterWave.tex",
 130 texture TEXTURE_BLOOD_WAVE          "Models\\Effects\\ShockWave\\BloodWave.tex",
 132 texture TEXTURE_ACID_WAVE           "Models\\Effects\\ShockWave\\AcidWave.tex",

functions:

  // dump sync data to text file
  export void DumpSync_t(CTStream &strm, INDEX iExtensiveSyncCheck)  // throw char *
  {
    CRationalEntity::DumpSync_t(strm, iExtensiveSyncCheck);
    strm.FPrintF_t("Type: %d\n", m_betType);
  }

  /* Read from stream. */
  void Read_t( CTStream *istr) // throw char *
  {
    CRationalEntity::Read_t(istr);
    // setup light source
    if( m_bLightSource) {
      SetupLightSource();
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

  // Setup light source
  void SetupLightSource(void)
  {
    if( m_iLightAnimation>=0)
    { // set light animation if available
      try {
        m_aoLightAnimation.SetData_t(CTFILENAME("Animations\\BasicEffects.ani"));
      } catch (char *strError) {
        WarningMessage(TRANS("Cannot load Animations\\BasicEffects.ani: %s"), strError);
      }
      // play light animation
      if (m_aoLightAnimation.GetData()!=NULL) {
        m_aoLightAnimation.PlayAnim(m_iLightAnimation, 0);
      }
    }

    // setup light source
    CLightSource lsNew;
    lsNew.ls_ulFlags = LSF_NONPERSISTENT|LSF_DYNAMIC;
    lsNew.ls_rHotSpot = 0.0f;
    switch (m_betType) {
      case BET_LASERWAVE:
        lsNew.ls_colColor = RGBToColor(0, 64, 0);
        lsNew.ls_rFallOff = 1.5f;
        lsNew.ls_plftLensFlare = NULL;
        break;
      case BET_FIREBALL:
        lsNew.ls_colColor = RGBToColor(100, 100, 100);
        lsNew.ls_rHotSpot = 3.0f;
        lsNew.ls_rFallOff = 12.5f;
        lsNew.ls_plftLensFlare = NULL;
        break;
      case BET_BOMB:
        lsNew.ls_colColor = RGBToColor(100, 100, 100);
        lsNew.ls_rFallOff = 8.0f;
        lsNew.ls_plftLensFlare = NULL;
        break;
      default:
        ASSERTALWAYS("Unknown light source");
    }
    lsNew.ls_ubPolygonalMask = 0;
    lsNew.ls_paoLightAnimation = NULL;

    // setup light animation
    lsNew.ls_paoLightAnimation = NULL;
    if (m_aoLightAnimation.GetData()!=NULL) {
      lsNew.ls_paoLightAnimation = &m_aoLightAnimation;
    }

    m_lsLightSource.ls_penEntity = this;
    m_lsLightSource.SetLightSource(lsNew);
  }


/* RENDER PARTICLES */


  void RenderParticles(void)
  {
    if( m_eptType != EPT_NONE)
    {
      FLOAT fStretch=0.3f;
      Particles_BulletSpray(en_ulID, GetLerpedPlacement().pl_PositionVector, m_vGravity, 
        m_eptType, m_tmSpawn, m_vStretch, fStretch);
    }
    if(m_betType==BET_EXPLOSION_DEBRIS)
    {
      Particles_ExplosionDebris1(this, m_tmSpawn, m_vStretch, m_colMultiplyColor);
      Particles_ExplosionDebris2(this, m_tmSpawn, m_vStretch, m_colMultiplyColor);
      Particles_ExplosionDebris3(this, m_tmSpawn, m_vStretch, m_colMultiplyColor);
    }
    if(m_betType==BET_COLLECT_ENERGY)
    {
      Particles_CollectEnergy(this, m_tmSpawn, m_tmSpawn+m_fWaitTime);
    }
	  if(m_betType==BET_EXPLOSION_SMOKE && _pTimer->GetLerpedCurrentTick()>(m_tmSpawn+m_fWaitTime) )
    {
      Particles_ExplosionSmoke(this, m_tmSpawn+m_fWaitTime, m_vStretch, m_colMultiplyColor);
    }
    if(m_betType==BET_SUMMONERSTAREXPLOSION)
    {
      Particles_SummonerExplode(this, GetPlacement().pl_PositionVector,
                                60.0f, 1.0f, m_tmSpawn, m_fWaitTime);
    }
    if(m_betType==BET_GROWING_SWIRL)
    {
      FLOAT fStretch=(m_vStretch(1)+m_vStretch(2)+m_vStretch(3))/3.0f;
      Particles_GrowingSwirl(this, fStretch, m_tmSpawn);
    }
    if(m_betType==BET_DISAPPEAR_DUST)
    {
      FLOAT fStretch=(m_vStretch(1)+m_vStretch(2)+m_vStretch(3))/3.0f;
      Particles_DisappearDust(this, fStretch, m_tmSpawn);
    }
    if(m_betType==BET_DUST_FALL)
    {
      Particles_DustFall(this, m_tmSpawn, m_vStretch);
    }    
  }



/************************************************************
 *                        FADE OUT                          *
 ************************************************************/

  BOOL AdjustShadingParameters(FLOAT3D &vLightDirection, COLOR &colLight, COLOR &colAmbient)
  {
    if( m_bFade) {
      FLOAT m_fTimeRemain = m_fFadeStartTime + m_fFadeTime - _pTimer->CurrentTick();
      if (m_fTimeRemain < 0.0f) { m_fTimeRemain = 0.0f; }
      COLOR col = GetModelColor() & ~CT_AMASK;
      col |= (ULONG)(m_fFadeStartAlpha* m_fTimeRemain/m_fFadeTime *255.0f);
      SetModelColor(col);
    } else if (m_fFadeInSpeed>0) {
      TIME tmAge = _pTimer->GetLerpedCurrentTick()-m_tmSpawn;
      COLOR col = GetModelColor() ;
      col = (col &~CT_AMASK) |
        (ULONG)((255)*Clamp(tmAge*m_fFadeInSpeed/m_fWaitTime, 0.0f, 1.0f));
      SetModelColor(col);
    }

    return FALSE;
  };

  // get offset for depth-sorting of alpha models (in meters, positive is nearer)
  FLOAT GetDepthSortOffset(void)
  {
    return m_fDepthSortOffset;
  }



/************************************************************
 *                GLOBAL SUPPORT FUNCTIONS                  *
 ************************************************************/

  void SetNonLoopingTexAnims(void)
  {
    CModelObject *pmo = GetModelObject();
    pmo->mo_toTexture.PlayAnim(0, 0);
    FOREACHINLIST(CAttachmentModelObject, amo_lnInMain, pmo->mo_lhAttachments, itamo) {
      CModelObject *pmoAtt = &itamo->amo_moModelObject;
      pmoAtt->mo_toTexture.PlayAnim(0, 0);
    }
  }

  void SetNormalForHalfFaceForward(void)
  {
    CPlacement3D pl = GetPlacement();
    UpVectorToAngles(m_vNormal, pl.pl_OrientationAngle);
    SetPlacement(pl);
  };

  void SetNormal(void)
  {
    CPlacement3D pl = GetPlacement();
    DirectionVectorToAngles(m_vNormal, pl.pl_OrientationAngle);
    SetPlacement(pl);
  };

  void SetNormalWithRandomBanking(void)
  {
    CPlacement3D pl = GetPlacement();
    DirectionVectorToAngles(m_vNormal, pl.pl_OrientationAngle);
    pl.pl_OrientationAngle(3) = FRnd()*360.0f;
    SetPlacement(pl);
  };

  void FindGravityVectorFromSector(void)
  {
    CBrushSector *pbscContent = NULL;
    {FOREACHSRCOFDST(en_rdSectors, CBrushSector, bsc_rsEntities, pbsc)
      pbscContent = &*pbsc;
      break;
    ENDFOR;}

    if( pbscContent == NULL)
    {
      return;
    }
    INDEX iForceType = pbscContent->GetForceType();
    CEntity *penBrush = pbscContent->bsc_pbmBrushMip->bm_pbrBrush->br_penEntity;
    CForceStrength fsGravity;
    CForceStrength fsField;
    penBrush->GetForce( iForceType, en_plPlacement.pl_PositionVector, fsGravity, fsField);
    // remember gravity vector
    m_vGravity = fsGravity.fs_vDirection;
  };

  void SetNormalAndDirection(void)
  {
    // special case for stains without sliding
    if( m_vDirection.Length() < 0.01f) {
      SetNormalWithRandomBanking();
      return;
    }

    FLOAT3D vX;
    FLOAT3D vY = -m_vDirection;
    FLOAT3D vZ = -m_vNormal;
    vZ.Normalize();
    vX = vY*vZ;
    vX.Normalize();
    vY = vZ*vX;
    vY.Normalize();

    FLOATmatrix3D m;
    m(1,1) = vX(1); m(1,2) = vY(1); m(1,3) = vZ(1);
    m(2,1) = vX(2); m(2,2) = vY(2); m(2,3) = vZ(2);
    m(3,1) = vX(3); m(3,2) = vY(3); m(3,3) = vZ(3);

    CPlacement3D pl = GetPlacement();
    DecomposeRotationMatrixNoSnap(pl.pl_OrientationAngle, m);
    SetPlacement(pl);
  };

  void RandomBanking(void)
  {
    CPlacement3D pl = GetPlacement();
    pl.pl_OrientationAngle(3) = FRnd()*360.0f;
    SetPlacement(pl);
  };

  void Stretch(void) {
    ASSERT(m_vStretch(1)>0.01f && m_vStretch(3)>0.01f && m_vStretch(3)>0.01f);
    GetModelObject()->mo_Stretch = m_vStretch;
  };

  // parent the effect if needed and adjust size not to get out of the polygon
  void ParentToNearestPolygonAndStretch(void) 
  {
    // find nearest polygon
    FLOAT3D vPoint; 
    FLOATplane3D plPlaneNormal;
    FLOAT fDistanceToEdge;
    CBrushPolygon *pbpoNearBrush = GetNearestPolygon( vPoint, plPlaneNormal, fDistanceToEdge);

    if( (m_betType>=BET_BULLETSTAINSTONE && m_betType<=BET_BULLETSTAINREDSANDNOSOUND) ||
        (m_betType>=BET_BULLETSTAINGRASS && m_betType<=BET_BULLETSTAINWOODNOSOUND) ||
        (m_betType>=BET_BULLETSTAINSNOW  && m_betType<=BET_BULLETSTAINSNOWNOSOUND) ||
        (m_betType>=BET_BULLETSTAINMETAL && m_betType<=BET_BULLETSTAINMUDNOSOUND) )
    {
      if( pbpoNearBrush != NULL)
      {
        CBrushSector *pbscContent = pbpoNearBrush->bpo_pbscSector;
        INDEX iForceType = pbscContent->GetForceType();
        CEntity *penNearBrush = pbscContent->bsc_pbmBrushMip->bm_pbrBrush->br_penEntity;
        CForceStrength fsGravity;
        CForceStrength fsField;
        penNearBrush->GetForce( iForceType, en_plPlacement.pl_PositionVector, fsGravity, fsField);
        // remember gravity vector
        m_vGravity = fsGravity.fs_vDirection;
      }
    }

    // if there is none, or if it is portal, or it is not near enough
    if (pbpoNearBrush==NULL || (pbpoNearBrush->bpo_ulFlags&BPOF_PORTAL) 
      || (vPoint-GetPlacement().pl_PositionVector).ManhattanNorm()>0.1f*3) {
      // dissapear
      SwitchToEditorModel();
    // if polygon is found
    } else {
      CEntity *penNearBrush = pbpoNearBrush->bpo_pbscSector->bsc_pbmBrushMip->bm_pbrBrush->br_penEntity;
      FLOATaabbox3D box;
      en_pmoModelObject->GetCurrentFrameBBox( box);
      box.StretchByVector( en_pmoModelObject->mo_Stretch);
      FLOAT fOrgSize = box.Size().MaxNorm();
      FLOAT fMaxSize = fDistanceToEdge*2.0f;
      // if minimum distance from polygon edges is too small
      if( fMaxSize<fOrgSize*0.25f) {
        // dissapear
        SwitchToEditorModel();
      // if the distance is acceptable
        } else {
        // set your size to not get out of it
        FLOAT fStretch = fMaxSize/fOrgSize;
        fStretch = ClampUp( fStretch, 1.0f);
        m_vStretch = en_pmoModelObject->mo_Stretch*fStretch;
        Stretch();
        ModelChangeNotify();
        // set parent to that brush
        SetParent( penNearBrush);
      }
    }
  }


/************************************************************
 *       PROJECTILE/GRENADE/FIREBALL EXPLOSION,  STAIN      *
 ************************************************************/

  void ProjectileExplosion(void)
  {
    SetPredictable(TRUE);
    Stretch();
    SetModel(MDL_ROCKET_EXPLOSION);
    SetModelMainTexture(TXT_ROCKET_EXPLOSION);
    AddAttachment(0, MDL_PARTICLES_EXPLOSION, TXT_PARTICLES_EXPLOSION);
    RandomBanking();
    SetNonLoopingTexAnims();
    m_soEffect.Set3DParameters(150.0f, 3.0f, 1.0f, 1.0f);
    PlaySound(m_soEffect, SOUND_EXPLOSION, SOF_3D);
    m_fSoundTime = GetSoundLength(SOUND_EXPLOSION);
    m_fWaitTime = 0.95f;
    m_bLightSource = TRUE;
    m_iLightAnimation = 0;
  };

  void ProjectilePlaneExplosion(void) {
    SetPredictable(TRUE);
    Stretch();
    SetModel(MDL_ROCKET3D_EXPLOSION);
    SetModelMainTexture(TXT_ROCKET_EXPLOSION);
    AddAttachment(0, MDL_PARTICLES3D_EXPLOSION, TXT_PARTICLES_EXPLOSION);
    SetNormalWithRandomBanking();
    SetNonLoopingTexAnims();
    m_fWaitTime = 0.95f;
    m_bLightSource = FALSE;
  };

  void BombExplosion(void) {
    SetPredictable(TRUE);
    Stretch();
    SetModel(MDL_ROCKET3D_EXPLOSION);
    SetModelMainTexture(TXT_ROCKET_EXPLOSION);
    SetNonLoopingTexAnims();
    FLOAT fSizeFactor = m_vStretch.MaxNorm();
    m_soEffect.Set3DParameters(50.0f*fSizeFactor, 10.0f*fSizeFactor, 1.0f*fSizeFactor, 1.0f);
    PlaySound(m_soEffect, SOUND_EXPLOSION, SOF_3D);
    m_fSoundTime = GetSoundLength(SOUND_EXPLOSION);
    m_fWaitTime = 0.95f;
    m_bLightSource = TRUE;
    m_iLightAnimation = 1;
  };

  void ExplosionDebris(void)
  {
    SetPredictable(TRUE);
    SetModel(MODEL_BULLET_HIT);
    SetModelMainTexture(TEXTURE_BULLET_HIT);
    m_fWaitTime = 0.95f;
    m_bLightSource = FALSE;
  };
  
  void CollectEnergy(void)
  {
    SetPredictable(TRUE);
    SetModel(MODEL_BULLET_HIT);
    SetModelMainTexture(TEXTURE_BULLET_HIT);
    m_fWaitTime = 2;
    m_bLightSource = FALSE;
  }
  
  void GrowingSwirl(void)
  {
    SetPredictable(TRUE);
    SetModel(MODEL_BULLET_HIT);
    SetModelMainTexture(TEXTURE_BULLET_HIT);
    m_fWaitTime = 10.0f;
    m_bLightSource = FALSE;
  }

  void DisappearDust(void)
  {
    SetPredictable(TRUE);
    SetModel(MODEL_BULLET_HIT);
    SetModelMainTexture(TEXTURE_BULLET_HIT);
    m_fWaitTime = 10.0f;
    m_bLightSource = FALSE;
  }

  void DustFall(void)
  {
    SetPredictable(TRUE);
    SetModel(MODEL_BULLET_HIT);
    SetModelMainTexture(TEXTURE_BULLET_HIT);
    m_fWaitTime = 10.0f;
    m_bLightSource = FALSE;
  }

  void ExplosionSmoke(void)
  {
    SetPredictable(TRUE);
    SetModel(MODEL_BULLET_HIT);
    SetModelMainTexture(TEXTURE_BULLET_HIT);
    m_fWaitTime=0.25f;
    m_tmWaitAfterDeath=8.0f;
    m_bLightSource = FALSE;
  };

  void Stain(void) {
    SetModel(MODEL_EXPLOSION_STAIN);
    SetModelMainTexture(TEXTURE_EXPLOSION_STAIN);
    SetNormalWithRandomBanking();
    m_fWaitTime = 5.0f;
    m_fFadeTime = 2.5f;
    m_bLightSource = FALSE;
    ParentToNearestPolygonAndStretch();
  };

  void FireballExplosion(void)
  {
    SetPredictable(TRUE);
    Stretch();
    SetModel(MDL_FIREBALL_EXPLOSION);
    SetModelMainTexture(TXT_FIREBALL_EXPLOSION);
    AddAttachment(0, MDL_PARTICLES_EXPLOSION, TXT_PARTICLES_EXPLOSION);
    RandomBanking();
    SetNonLoopingTexAnims();
    m_soEffect.Set3DParameters(150.0f, 3.0f, 1.0f, 1.0f);
    PlaySound(m_soEffect, SOUND_FIREBALL_EXPLOSION, SOF_3D);
    m_fSoundTime = GetSoundLength(SOUND_FIREBALL_EXPLOSION);
    m_fWaitTime = 0.95f;
    m_bLightSource = TRUE;
    m_iLightAnimation = 0;
  };

  void FireballPlaneExplosion(void) {
    SetPredictable(TRUE);
    Stretch();
    SetModel(MDL_FIREBALL3D_EXPLOSION);
    SetModelMainTexture(TXT_FIREBALL_EXPLOSION);
    AddAttachment(0, MDL_PARTICLES3D_EXPLOSION, TXT_PARTICLES_EXPLOSION);
    SetNormalWithRandomBanking();
    SetNonLoopingTexAnims();
    m_fWaitTime = 0.95f;
    m_bLightSource = FALSE;
  };



/************************************************************
 *                   SHOCK / LASER WAVE                     *
 ************************************************************/
  void ShockWave(void) {
    SetPredictable(TRUE);
    SetModel(MODEL_SHOCKWAVE);
    CModelObject &moShockwave = *GetModelObject();
    moShockwave.PlayAnim(SHOCKWAVE_ANIM_FAST, 0);
    SetModelMainTexture(TEXTURE_SHOCKWAVE);
    SetNormal();
    SetNonLoopingTexAnims();
    m_fWaitTime = 0.4f;
    m_fFadeTime = 0.1f;
    m_bLightSource = FALSE;
  };

  void LaserWave(void) {
    SetModel(MODEL_LASERWAVE);
    GetModelObject()->StretchModel(FLOAT3D(0.75f, 0.75f, 0.75f));
    ModelChangeNotify();
    SetModelMainTexture(TEXTURE_LASERWAVE);
    SetNormalWithRandomBanking();
    SetNonLoopingTexAnims();
    m_fWaitTime = 0.05f;
    m_fFadeTime = 0.25f;
    m_bLightSource = TRUE;
    ParentToNearestPolygonAndStretch();
  };



  /************************************************************
   *                   TELEPORT                               *
   ************************************************************/
  void TeleportEffect(void)
  {
    SetPredictable(TRUE);
    Stretch();
    SetModel(MODEL_TELEPORT_EFFECT);
    CModelObject &mo = *GetModelObject();
    SetModelMainTexture(TEXTURE_TELEPORT_EFFECT);
    mo.PlayAnim(TELEPORT_ANIM_ACTIVATE, 0);
    RandomBanking();
    FLOAT fSize = m_vStretch.MaxNorm();
    m_soEffect.Set3DParameters(40.0f*fSize, 10.0f*fSize, 1.0f, 1.0f);
    PlaySound(m_soEffect, SOUND_TELEPORT, SOF_3D);
    m_fSoundTime = GetSoundLength(SOUND_TELEPORT);
    m_fWaitTime = 0.8f;
    m_bLightSource = FALSE;
  };

  /************************************************************
   *                SUMMONER STAR EXPLOSION                   *
   ************************************************************/
  void SummonerStarExplosion()
  {
    SetPredictable(TRUE);
    SetModel(MODEL_BULLET_HIT);
    SetModelMainTexture(TEXTURE_BULLET_HIT);
    m_fWaitTime=16.0f;
    m_tmWaitAfterDeath=8.0f;
    m_bLightSource = FALSE;
    m_vStretch = FLOAT3D(1.0f, 1.0f, 1.0f);
    Stretch();
  };

  /************************************************************
 *                   BULLET HIT / STAIN                     *
 ************************************************************/
  void BulletStainSand(BOOL bSound)
  {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_SAND, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_SAND);
    }
    
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_SAND);
    CModelObject &moHole = *GetModelObject();
    moHole.StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();

    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    m_eptType = EPT_BULLET_SAND;
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  }

  void BulletStainRedSand(BOOL bSound)
  {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_SAND, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_SAND);
    }
    
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_SAND);
    CModelObject &moHole = *GetModelObject();
    moHole.StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();
    moHole.mo_colBlendColor = 0x805030FF;

    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    m_eptType = EPT_BULLET_RED_SAND;
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  }

  void BulletStainStone(BOOL bSound, BOOL bSmoke)
  {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_STONE, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_STONE);
    }
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_STAIN);
    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    if( bSmoke)
    {
      m_eptType = EPT_BULLET_STONE;
    }
    else
    {
      m_eptType = EPT_BULLET_UNDER_WATER;
    }
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  }

  void BulletStainWater(BOOL bSound)
  {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_WATER, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_WATER);
    }

    SetModel(MODEL_SHOCKWAVE);
    SetModelMainTexture(TEXTURE_WATER_WAVE);
    CModelObject &moShockwave = *GetModelObject();
    moShockwave.PlayAnim(SHOCKWAVE_ANIM_MEDIUM, 0);
    moShockwave.StretchModel(FLOAT3D(0.25f, 0.25f, 0.25f));
    ModelChangeNotify();

    SetNormalWithRandomBanking();
    FindGravityVectorFromSector();
    m_fWaitTime = 0.5f;
    m_fFadeTime = 0.5f;
    m_bLightSource = FALSE;
    m_tmWaitAfterDeath = 1.0f;
    m_eptType = EPT_BULLET_WATER;
  }

  void BulletStainBlood(BOOL bSound)
  {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_BLOOD, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_BLOOD);
    }

    SetModel(MODEL_SHOCKWAVE);
    SetModelMainTexture(TEXTURE_BLOOD_WAVE);
    CModelObject &moShockwave = *GetModelObject();
    moShockwave.PlayAnim(SHOCKWAVE_ANIM_MEDIUM, 0);
    moShockwave.StretchModel(FLOAT3D(0.25f, 0.25f, 0.25f));
    ModelChangeNotify();

    SetNormalWithRandomBanking();
    FindGravityVectorFromSector();
    m_fWaitTime = 0.5f;
    m_fFadeTime = 0.5f;
    m_bLightSource = FALSE;
    m_tmWaitAfterDeath = 1.0f;
    m_eptType = EPT_BULLET_BLOOD;
  }

  void BulletStainAcid(BOOL bSound)
  {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_ACID, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_ACID);
    }

    SetModel(MODEL_SHOCKWAVE);
    SetModelMainTexture(TEXTURE_ACID_WAVE);
    CModelObject &moShockwave = *GetModelObject();
    moShockwave.PlayAnim(SHOCKWAVE_ANIM_MEDIUM, 0);
    moShockwave.StretchModel(FLOAT3D(0.25f, 0.25f, 0.25f));
    ModelChangeNotify();

    SetNormalWithRandomBanking();
    FindGravityVectorFromSector();
    m_fWaitTime = 0.5f;
    m_fFadeTime = 0.5f;
    m_bLightSource = FALSE;
    m_tmWaitAfterDeath = 1.0f;
    m_eptType = EPT_BULLET_ACID;
  }

  void BulletTrail(void) {
    Stretch();
    SetModel(MODEL_BULLET_TRAIL);
    SetModelMainTexture(TEXTURE_BULLET_TRAIL);
    CModelObject &mo = *GetModelObject();
    mo.mo_colBlendColor = m_colMultiplyColor;
    SetNormalForHalfFaceForward();
    m_fWaitTime = 0.1f;
    m_bLightSource = FALSE;
  };

  void BulletStainGrass(BOOL bSound) {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_GRASS, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_GRASS);
    }
    
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_STAIN);
    CModelObject &moHole = *GetModelObject();
    moHole.StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();
    moHole.mo_colBlendColor = 0x80f080FF;

    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    m_eptType = EPT_BULLET_GRASS;
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  };

  void BulletStainWood(BOOL bSound) {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_WOOD, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_WOOD);
    }
    
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_STAIN);
    CModelObject &moHole = *GetModelObject();
    moHole.StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();
    moHole.mo_colBlendColor = 0xffc080FF;

    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    m_eptType = EPT_BULLET_WOOD;
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  };

  void BulletStainSnow(BOOL bSound) {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_SNOW, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_SNOW);
    }
    
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_STAIN);
    CModelObject &moHole = *GetModelObject();
    moHole.StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();
    moHole.mo_colBlendColor = 0x7f7f7fFF;

    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    m_eptType = EPT_BULLET_SNOW;
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  };

  void BulletStainMetal(BOOL bSound) {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_METAL, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_METAL);
    }
    
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_METAL);
    CModelObject &moHole = *GetModelObject();
    moHole.StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();
    moHole.mo_colBlendColor = 0x7f7f7fFF;

    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    m_eptType = EPT_BULLET_METAL;
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  };

  void BulletStainCarpet(BOOL bSound) {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_CARPET, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_CARPET);
    }
    
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_STAIN);
    CModelObject &moHole = *GetModelObject();
    moHole.StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();
    moHole.mo_colBlendColor = 0x7f7f7fFF;

    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    m_eptType = EPT_BULLET_CARPET;
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  };

  void BulletStainGlass(BOOL bSound) {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_GLASS, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_GLASS);
    }
    
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_GLASS);
    CModelObject &moHole = *GetModelObject();
    moHole.StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();
    moHole.mo_colBlendColor = 0x999999FF;

    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    m_eptType = EPT_BULLET_GLASS;
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  };

  void BulletStainDirt(BOOL bSound) {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_DIRT, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_DIRT);
    }
    
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_STAIN);
    CModelObject &moHole = *GetModelObject();
    moHole.StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();
    moHole.mo_colBlendColor = 0x7f7f7fFF;

    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    m_eptType = EPT_BULLET_DIRT;
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  };

  void BulletStainTile(BOOL bSound) {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_TILE, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_TILE);
    }
    
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_STAIN);
    CModelObject &moHole = *GetModelObject();
    moHole.StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();
    moHole.mo_colBlendColor = 0x7f7f7fFF;

    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    m_eptType = EPT_BULLET_TILE;
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  };

  void BulletStainChainlink(BOOL bSound) {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_CHAINLINK, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_CHAINLINK);
    }
    
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_METAL);
    CModelObject &moHole = *GetModelObject();
    moHole.StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();
    moHole.mo_colBlendColor = 0x7f7f7fFF;

    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    m_eptType = EPT_BULLET_CHAINLINK;
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  };

  void BulletStainGrate(BOOL bSound) {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_GRATE, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_GRATE);
    }
    
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_METAL);
    CModelObject &moHole = *GetModelObject();
    moHole.StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();
    moHole.mo_colBlendColor = 0x7f7f7fFF;

    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    m_eptType = EPT_BULLET_GRATE;
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  };

  void BulletStainMud(BOOL bSound) {
    if( bSound)
    {
      m_soEffect.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
      PlaySound(m_soEffect, SOUND_BULLET_MUD, SOF_3D);
      m_fSoundTime = GetSoundLength(SOUND_BULLET_MUD);
    }
    
    SetModel(MODEL_BULLET_STAIN);
    SetModelMainTexture(TEXTURE_BULLET_STAIN);
    CModelObject &moHole = *GetModelObject();
    moHole.StretchModel(FLOAT3D(1.5f, 1.5f, 1.5f));
    ModelChangeNotify();
    moHole.mo_colBlendColor = 0x7f7f7fFF;

    SetNormalWithRandomBanking();
    m_fWaitTime = 2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    m_eptType = EPT_BULLET_MUD;
    FLOAT3D vTemp = m_vStretch;
    ParentToNearestPolygonAndStretch();
    m_vStretch = vTemp;
  };

/************************************************************
 *                  BLOOD SPILL / STAIN                     *
 ************************************************************/


  // bullet hitpoint wound
  void BloodExplode(void)
  {
    // readout blood type
    const INDEX iBloodType = GetSP()->sp_iBlood;
    if( iBloodType<1) { return; }

    SetPredictable(TRUE);
    Stretch();
    SetModel(MODEL_BLOOD_EXPLODE);
    
    SetModelMainTexture(TEXTURE_BLOOD_EXPLODE);
    if( iBloodType==2) { SetModelColor( RGBAToColor( 250,20,20,255)); }
    else               { SetModelColor( RGBAToColor( 0,250,0,255)); }

    //RandomBanking();
    m_soEffect.Set3DParameters(7.5f, 5.0f, 1.0f, 1.0f);
    PlaySound(m_soEffect, SOUND_BULLET_FLESH, SOF_3D);
    m_fSoundTime = GetSoundLength(SOUND_BULLET_FLESH);
    m_fWaitTime = 0.25f;
    m_fFadeTime = 0.75f;
    m_bLightSource = FALSE;
  }


  // blood stain on wall/floor
  void BloodStain(void)
  {
    // readout blood type
    const INDEX iBloodType = GetSP()->sp_iBlood;
    if( iBloodType<1) { return; }

    Stretch();
    SetModel(MODEL_BLOOD_STAIN);
    
    switch( IRnd()&2) {
    case 1:  { SetModelMainTexture(TEXTURE_BLOOD_STAIN1);   break; }
    case 2:  { SetModelMainTexture(TEXTURE_BLOOD_STAIN2);   break; }
    default: { SetModelMainTexture(TEXTURE_BLOOD_STAIN3);   break; }
    }
    if( iBloodType==2) { SetModelColor( RGBAToColor( 250,20,20,255)); }
    else               { SetModelColor( RGBAToColor( 0,250,0,255)); }

    SetNormalAndDirection();
    m_fWaitTime = 12.0f + FRnd()*3.0f;
    m_fFadeTime = 3.0f;
    m_bLightSource = FALSE;
    m_fDepthSortOffset = -0.1f;
    ParentToNearestPolygonAndStretch();
  }


  // blood stain on wall/floor that grows
  void BloodStainGrow(void)
  {
    // readout blood type
    const INDEX iBloodType = GetSP()->sp_iBlood;
    if( iBloodType<1) { return; }

    SetPredictable(TRUE);
    Stretch();
    SetModel(MODEL_BLOOD_STAIN);
    SetModelMainTexture(TEXTURE_BLOOD_STAIN3);
      if( iBloodType==2) { SetModelColor( RGBAToColor( 250,20,20,255)); }
      else               { SetModelColor( RGBAToColor( 0,250,0,255)); }
    SetNormalAndDirection();
    m_bLightSource = FALSE;
    m_fDepthSortOffset = -0.1f;
    ParentToNearestPolygonAndStretch();

    m_fWaitTime = 15.0f + FRnd()*2.0f;
    m_fFadeTime = 2.0f;
    m_fFadeInSpeed = 4.0f;
    CModelObject &mo = *GetModelObject();
    mo.PlayAnim(BLOOD_ANIM_GROW, 0);
  }


  // bullet exit wound blood on wall/floor
  void BloodSpill(COLOR colBloodSpillColor)
  {
    // readout blood type
    const INDEX iBloodType = GetSP()->sp_iBlood;
    if( iBloodType<1) { return; }

    Stretch();
    SetModel(MODEL_BLOOD_STAIN);
    
    switch( IRnd()%4) {
    case 1:  { SetModelMainTexture(TEXTURE_BLOOD_SPILL1); break; }
    case 2:  { SetModelMainTexture(TEXTURE_BLOOD_SPILL2); break; }
    case 3:  { SetModelMainTexture(TEXTURE_BLOOD_SPILL1); break; }
    default: { SetModelMainTexture(TEXTURE_BLOOD_SPILL2); break; }
    }
    if( iBloodType==2)
    {
        SetModelColor( colBloodSpillColor);
    }
    else               { SetModelColor( RGBAToColor( 0,250,0,255)); }

    SetNormalAndDirection();
    m_fWaitTime = 15.0f + FRnd()*2.0f;
    m_fFadeTime = 2.0f;
    m_bLightSource = FALSE;
    ParentToNearestPolygonAndStretch();
  }

procedures:


/************************************************************
 *                    M  A  I  N                            *
 ************************************************************/

  Main(ESpawnEffect eSpawn)
  {
    if(eSpawn.betType==BET_EXPLOSION_DEBRIS ||
       eSpawn.betType==BET_EXPLOSION_SMOKE ||
       eSpawn.betType==BET_SUMMONERSTAREXPLOSION  ||
       eSpawn.betType==BET_COLLECT_ENERGY ||
       eSpawn.betType==BET_GROWING_SWIRL||
       eSpawn.betType==BET_DISAPPEAR_DUST||
       eSpawn.betType==BET_DUST_FALL)
    {
      InitAsEditorModel();
    }
    else
    {
      InitAsModel();
    }
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);
    SetFlags(GetFlags() | ENF_SEETHROUGH);

    // set appearance
    m_tmSpawn = _pTimer->CurrentTick();
    m_vNormal = eSpawn.vNormal;
    m_vDirection = eSpawn.vDirection;
    m_vStretch = eSpawn.vStretch;
    m_betType = eSpawn.betType;
    m_colMultiplyColor = eSpawn.colMuliplier;
    
    switch (m_betType) {
      case BET_EXPLOSIONSTAIN: Stain(); break;
      case BET_SHOCKWAVE: ShockWave(); break;
      case BET_LASERWAVE: LaserWave(); break;
      case BET_BULLETTRAIL: BulletTrail(); break;
      case BET_BULLETSTAINSAND: BulletStainSand(TRUE); break;
      case BET_BULLETSTAINREDSAND: BulletStainRedSand(TRUE); break;
      case BET_BULLETSTAINSTONE: BulletStainStone(TRUE, TRUE); break;
      case BET_BULLETSTAINWATER: BulletStainWater(TRUE); break;
      case BET_BULLETSTAINUNDERWATER: BulletStainStone(TRUE, FALSE); break;
      case BET_BULLETSTAINBLOOD: BulletStainBlood(TRUE); break;
      case BET_BULLETSTAINUNDERBLOOD: BulletStainStone(TRUE, FALSE); break;
      case BET_BULLETSTAINSANDNOSOUND: BulletStainSand(FALSE); break;
      case BET_BULLETSTAINREDSANDNOSOUND: BulletStainRedSand(FALSE); break;
      case BET_BULLETSTAINSTONENOSOUND: BulletStainStone(FALSE, TRUE); break;
      case BET_BULLETSTAINWATERNOSOUND: BulletStainWater(FALSE); break;
      case BET_BULLETSTAINUNDERWATERNOSOUND: BulletStainStone(FALSE, FALSE); break;
      case BET_BULLETSTAINBLOODNOSOUND: BulletStainBlood(FALSE); break;
      case BET_BULLETSTAINUNDERBLOODNOSOUND: BulletStainStone(FALSE, FALSE); break;
      case BET_BULLETSTAINACID: BulletStainAcid(TRUE); break;
      case BET_BULLETSTAINUNDERACID: BulletStainStone(TRUE, FALSE); break;
      case BET_BULLETSTAINACIDNOSOUND: BulletStainAcid(FALSE); break;
      case BET_BULLETSTAINUNDERACIDNOSOUND: BulletStainStone(FALSE, FALSE); break;
      case BET_BLOODSPILL: BloodSpill(m_colMultiplyColor); break;
      case BET_BLOODSTAIN: BloodStain(); break;
      case BET_BLOODSTAINGROW: BloodStainGrow(); break;
      case BET_BLOODEXPLODE: BloodExplode(); break;
      case BET_TELEPORT: TeleportEffect(); break;
      case BET_BULLETSTAINGRASS: BulletStainGrass(TRUE); break;
      case BET_BULLETSTAINGRASSNOSOUND: BulletStainGrass(FALSE); break;
      case BET_BULLETSTAINWOOD: BulletStainWood(TRUE); break;
      case BET_BULLETSTAINWOODNOSOUND: BulletStainWood(FALSE); break;
      case BET_EXPLOSION_DEBRIS: ExplosionDebris(); break;
      case BET_COLLECT_ENERGY: CollectEnergy(); break;
      /*case BET_SNIPER_RESIDUE: SniperResidue(); break;*/
      case BET_EXPLOSION_SMOKE: ExplosionSmoke(); break;
      case BET_SUMMONERSTAREXPLOSION: SummonerStarExplosion(); break;
      case BET_GROWING_SWIRL: GrowingSwirl(); break;
      case BET_DISAPPEAR_DUST: DisappearDust(); break;
      case BET_DUST_FALL: DustFall(); break;
      case BET_BULLETSTAINSNOW: BulletStainSnow(TRUE); break;
      case BET_BULLETSTAINSNOWNOSOUND: BulletStainSnow(FALSE); break;
      case BET_BULLETSTAINMETAL: BulletStainMetal(TRUE); break;
      case BET_BULLETSTAINMETALNOSOUND: BulletStainMetal(FALSE); break;
      case BET_BULLETSTAINCARPET: BulletStainCarpet(TRUE); break;
      case BET_BULLETSTAINCARPETNOSOUND: BulletStainCarpet(FALSE); break;
      case BET_BULLETSTAINGLASS: BulletStainGlass(TRUE); break;
      case BET_BULLETSTAINGLASSNOSOUND: BulletStainGlass(FALSE); break;
      case BET_BULLETSTAINDIRT: BulletStainDirt(TRUE); break;
      case BET_BULLETSTAINDIRTNOSOUND: BulletStainDirt(FALSE); break;
      case BET_BULLETSTAINTILE: BulletStainTile(TRUE); break;
      case BET_BULLETSTAINTILENOSOUND: BulletStainTile(FALSE); break;
      case BET_FIREBALL: FireballExplosion(); break;
      case BET_FIREBALL_PLANE: FireballPlaneExplosion(); break;
      case BET_BULLETSTAINCHAINLINK: BulletStainChainlink(TRUE); break;
      case BET_BULLETSTAINCHAINLINKNOSOUND: BulletStainChainlink(FALSE); break;
      case BET_EXPLOSIVEBARREL: ProjectileExplosion(); break;
      case BET_EXPLOSIVEBARREL_PLANE: ProjectilePlaneExplosion(); break;
      case BET_BULLETSTAINGRATE: BulletStainGrate(TRUE); break;
      case BET_BULLETSTAINGRATENOSOUND: BulletStainGrate(FALSE); break;
      case BET_BULLETSTAINMUD: BulletStainMud(TRUE); break;
      case BET_BULLETSTAINMUDNOSOUND: BulletStainMud(FALSE); break;
      case BET_BOMB: BombExplosion(); break;
      default:
        ASSERTALWAYS("Unknown effect type");
    }

    // setup light source
    if (m_bLightSource) { SetupLightSource(); }

    wait() {
      on (EBegin) : { call EffectLoop(); }
      on (EBrushDestroyed) : { stop; }
      on (EStop) : { stop; }
      on (EReturn) : { stop; }
    }

    // cease to exist
    Destroy();
    return;
  }


  // standard effect loop
  EffectLoop() 
  {
    // wait
    if (m_fWaitTime>0.0f) {
      autowait(m_fWaitTime);
    }
    // fading
    if (m_fFadeTime>0.0f) {
      m_fFadeStartTime  = _pTimer->CurrentTick();
      m_fFadeStartAlpha = ((GetModelColor()&CT_AMASK)>>CT_ASHIFT) / 255.0f;
      m_bFade = TRUE;
      autowait(m_fFadeTime);
      m_bFade = FALSE;
    }
    
    // wait for sound to end
    if (m_fSoundTime > m_fWaitTime+m_fFadeTime) {
      SwitchToEditorModel();
      autowait(m_fSoundTime - (m_fWaitTime+m_fFadeTime));
    }

    if (m_tmWaitAfterDeath>0.0f) {
      if( en_RenderType != RT_EDITORMODEL)
      {
        SwitchToEditorModel();
      }
      autowait(m_tmWaitAfterDeath);
    }

    return EReturn();
  }

};
