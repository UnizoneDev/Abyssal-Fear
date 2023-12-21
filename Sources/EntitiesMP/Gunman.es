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

#include "EntitiesMP/Player.h"

#include "Models/NPCs/Gunman/Gunman.h"
#include "Models/NPCs/GunmanBladed/GunmanBladed.h"
#include "Models/Items/ItemHolder/ItemHolder.h"
#include "Models/Items/Ammo/PistolClip/PistolClip.h"
#include "Models/Items/Ammo/SMGClip/SMGAmmo.h"
#include "Models/Items/Ammo/ShotgunShells/ShotgunAmmo.h"
#include "Models/Items/Ammo/StrongPistolClip/StrongPistolClip.h"
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
  4 GMC_BLADED   "Bladed",          // melee only variant
  5 GMC_SMG      "SMG Grunt",       // SMG variant
};

enum GunmanSMGFireType {
  0 GSFT_THREE   "Three Round Burst",  // normal variant
  1 GSFT_FIVE    "Five Round Burst",   // strong variant
  2 GSFT_AUTO    "Full Automatic",     // enraged variant
};

enum GunmanPistolFireType {
  0 GPFT_ONE     "Single Shot",         // normal variant
  1 GPFT_THREE   "Three Round Burst",   // strong variant
  2 GPFT_AUTO    "Full Automatic",      // enraged variant
};

%{

// info structure
static EntityInfo eiGunman = {
  EIBT_FLESH, 275.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}


class CGunman: CEnemySquad {
name      "Gunman";
thumbnail "Thumbnails\\Gunman.tbn";

properties:
  1 BOOL m_bShouldReload = FALSE,
  2 BOOL m_bFistHit = FALSE,
  3 enum GunmanType m_gmChar "Character" 'C' = GMC_PISTOL,   // character
  4 enum KeyItemType m_kitType "Key Type" 'K' = KIT_CROSSWOODEN, // key type
  5 INDEX m_iAmmoAmount = 0,
  6 enum GunmanSMGFireType m_gsfType "SMG Fire Type" = GSFT_THREE,
  7 FLOAT m_fFireTime = 0.0f,           // time to fire bullets
  8 FLOAT m_fCustomFireTime "Fire Time" = 2.0f,  // settable time to fire bullets
  9 enum GunmanPistolFireType m_gpfType "Pistol Fire Type" = GPFT_ONE,
  
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
 18 model   MODEL_GUNMAN_BLADED        "Models\\NPCs\\GunmanBladed\\GunmanBladed.mdl",
 90 model   MODEL_SMG                  "Models\\Weapons\\SMG\\SMGItem.mdl",
 91 texture TEXTURE_SMG                "Models\\Weapons\\SMG\\SMG.tex",
 92 texture TEXTURE_GUNMAN_SMG         "Models\\NPCs\\Gunman\\GunmanSMG.tex",

 20 sound   SOUND_FIRE                 "Models\\NPCs\\Gunman\\Sounds\\PistolAttack.wav",
 21 sound   SOUND_HIT                  "Models\\NPCs\\Gunman\\Sounds\\Kick.wav",
 22 sound   SOUND_SWING                "Models\\Weapons\\Knife\\Sounds\\Swing.wav", 
 23 sound   SOUND_FIRE_SHOTGUN         "Models\\NPCs\\Gunman\\Sounds\\ShotgunAttack.wav",
 24 sound   SOUND_SLICE1               "Models\\NPCs\\Twitcher\\Sounds\\Slice1.wav",
 82 sound   SOUND_SLICE2               "Models\\NPCs\\Twitcher\\Sounds\\Slice2.wav",
 83 sound   SOUND_SLICE3               "Models\\NPCs\\Twitcher\\Sounds\\Slice3.wav",
 84 sound   SOUND_CLASH1               "Sounds\\Weapons\\MetalBladeClash1.wav",
 85 sound   SOUND_CLASH2               "Sounds\\Weapons\\MetalBladeClash2.wav",
 86 sound   SOUND_CLASH3               "Sounds\\Weapons\\MetalBladeClash3.wav",
 87 sound   SOUND_FIRE_SMG             "Models\\NPCs\\Gunman\\Sounds\\SMGAttack.wav",
 93 sound   SOUND_RELOAD               "Models\\NPCs\\Gunman\\Sounds\\PistolReload.wav",
 94 sound   SOUND_RELOAD_SHOTGUN       "Models\\NPCs\\Gunman\\Sounds\\ShotgunReload.wav",
 95 sound   SOUND_RELOAD_SMG           "Models\\NPCs\\Gunman\\Sounds\\SMGReload.wav",

 50 model   MODEL_ITEM            "Models\\Items\\ItemHolder\\ItemHolder.mdl",
 51 model   MODEL_BULLETS         "Models\\Items\\Ammo\\PistolClip\\PistolClip.mdl",
 52 texture TEXTURE_BULLETS       "Models\\Weapons\\Pistol\\Pistol.tex",

 53 model   MODEL_SHELLS         "Models\\Items\\Ammo\\ShotgunShells\\ShotgunAmmo.mdl",
 54 texture TEXTURE_SHELLS       "Models\\Items\\Ammo\\ShotgunShells\\ShotgunShell.tex",

 55 model   MODEL_MEDIUM_BULLETS         "Models\\Items\\Ammo\\SMGClip\\SMGAmmo.mdl",
 56 texture TEXTURE_MEDIUM_BULLETS       "Models\\Weapons\\SMG\\SMG.tex",

 88 model   MODEL_STRONG_BULLETS         "Models\\Items\\Ammo\\StrongPistolClip\\StrongPistolClip.mdl",
 89 texture TEXTURE_STRONG_BULLETS       "Models\\Weapons\\StrongPistol\\StrongPistol.tex",

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
    static DECLARE_CTFILENAME(fnmGunmanSMGGrunt, "Data\\Messages\\NPCs\\GunmanSMGGrunt.txt");
    static DECLARE_CTFILENAME(fnmGunmanShotgunner, "Data\\Messages\\NPCs\\GunmanShotgunner.txt");
    static DECLARE_CTFILENAME(fnmGunmanLeader, "Data\\Messages\\NPCs\\GunmanLeader.txt");
    static DECLARE_CTFILENAME(fnmGunmanSecurity, "Data\\Messages\\NPCs\\GunmanSecurity.txt");
    static DECLARE_CTFILENAME(fnmGunman, "Data\\Messages\\NPCs\\Gunman.txt");
    static DECLARE_CTFILENAME(fnmGunmanBladed, "Data\\Messages\\NPCs\\GunmanBladed.txt");
    switch(m_gmChar) {
    default: ASSERT(FALSE);
    case GMC_SMG : return fnmGunmanSMGGrunt;
    case GMC_SHOTGUN : return fnmGunmanShotgunner;
    case GMC_LEADER: return fnmGunmanLeader;
    case GMC_KEY: return fnmGunmanSecurity;
    case GMC_PISTOL : return fnmGunman;
    case GMC_BLADED : return fnmGunmanBladed;
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
    PrecacheSound(SOUND_SLICE1);
    PrecacheSound(SOUND_SLICE2);
    PrecacheSound(SOUND_SLICE3);
    PrecacheSound(SOUND_CLASH1);
    PrecacheSound(SOUND_CLASH2);
    PrecacheSound(SOUND_CLASH3);
    PrecacheSound(SOUND_FIRE_SHOTGUN);
    PrecacheSound(SOUND_FIRE_SMG);
    PrecacheSound(SOUND_RELOAD);
    PrecacheSound(SOUND_RELOAD_SHOTGUN);
    PrecacheSound(SOUND_RELOAD_SMG);
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
    PrecacheModel(MODEL_STRONG_BULLETS);
    PrecacheTexture(TEXTURE_STRONG_BULLETS);
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
    case GMC_SMG : { pes->es_strName+=" SMG Grunt"; } break;
    case GMC_SHOTGUN : { pes->es_strName+=" Shotgunner"; } break;
    case GMC_LEADER: { pes->es_strName+=" Leader"; } break;
    case GMC_KEY: { pes->es_strName+=" Security"; } break;
    case GMC_PISTOL : { pes->es_strName+=" Officer"; } break;
    case GMC_BLADED : { pes->es_strName+=" Bladed"; }
    }
    return TRUE;
  }

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
    // gunman can't harm gunman
    if (!IsOfClass(penInflictor, "Gunman")) {
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
    if (m_gmChar == GMC_SMG)
    {
      iAnim = GUNMAN_ANIM_WOUNDSMG;
    }
    else if (m_gmChar == GMC_BLADED)
    {
      iAnim = GUNMANBLADED_ANIM_WOUND;
    }
    else if (m_gmChar == GMC_SHOTGUN)
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
    FLOAT3D vFront;
    GetHeadingDirection(0, vFront);
    FLOAT fDamageDir = m_vDamage%vFront;

    if (m_gmChar == GMC_BLADED) {
      if (fDamageDir<0) {
          iAnim = GUNMANBLADED_ANIM_DEATHFRONT;
      } else {
          iAnim = GUNMANBLADED_ANIM_DEATHBACK;
      }
    } else if (m_gmChar == GMC_SHOTGUN) {
      if (fDamageDir<0) {
          iAnim = GUNMAN_ANIM_DEATHSHOTGUN;
      } else {
          iAnim = GUNMAN_ANIM_DEATHBACKSHOTGUN;
      }
    } else {
      if (fDamageDir<0) {
          iAnim = GUNMAN_ANIM_DEATH;
      } else {
          iAnim = GUNMAN_ANIM_DEATHBACK;
      }
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
    if(GetModelObject()->GetAnim()==GUNMAN_ANIM_DEATHBACK ||
       GetModelObject()->GetAnim()==GUNMAN_ANIM_DEATHBACKSHOTGUN) {
      ChangeCollisionBoxIndexWhenPossible(GUNMAN_COLLISION_BOX_DEATH_BACKBOX);
    } else {
      ChangeCollisionBoxIndexWhenPossible(GUNMAN_COLLISION_BOX_DEATH_FRONTBOX);
    }
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    if (m_gmChar == GMC_SMG)
    {
      StartModelAnim(GUNMAN_ANIM_STANDSMG, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_gmChar == GMC_BLADED)
    {
      StartModelAnim(GUNMANBLADED_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_gmChar == GMC_SHOTGUN)
    {
      StartModelAnim(GUNMAN_ANIM_STANDSHOTGUN, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(GUNMAN_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void WalkingAnim(void) {
    if (m_gmChar == GMC_SMG)
    {
      StartModelAnim(GUNMAN_ANIM_WALKSMG, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_gmChar == GMC_BLADED)
    {
      StartModelAnim(GUNMANBLADED_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_gmChar == GMC_SHOTGUN)
    {
      StartModelAnim(GUNMAN_ANIM_WALKSHOTGUN, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(GUNMAN_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void RunningAnim(void) {
    if (m_gmChar == GMC_SMG)
    {
      StartModelAnim(GUNMAN_ANIM_RUNSMG, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_gmChar == GMC_BLADED)
    {
      StartModelAnim(GUNMANBLADED_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_gmChar == GMC_SHOTGUN)
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
    if (m_gmChar == GMC_BLADED)
    {
      StartModelAnim(GUNMANBLADED_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(GUNMAN_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void BacksteppingAnim(void) {
    if (m_gmChar == GMC_SMG)
    {
      StartModelAnim(GUNMAN_ANIM_BACKPEDALSMG, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_gmChar == GMC_SHOTGUN)
    {
      StartModelAnim(GUNMAN_ANIM_BACKPEDALSHOTGUN, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(GUNMAN_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
  };


  BOOL CanFireAtPlayer(void)
  {
    // get ray source and target
    FLOAT3D vSource, vTarget;
    GetPositionCastRay(this, m_penEnemy, vSource, vTarget);

    // bullet start position
    CPlacement3D plBullet;
    plBullet.pl_OrientationAngle = ANGLE3D(0,0,0);
    plBullet.pl_PositionVector = FLOAT3D(0, 1.35f, 0);
    
    plBullet.RelativeToAbsolute(GetPlacement());
    vSource = plBullet.pl_PositionVector;

    // cast the ray
    CCastRay crRay(this, vSource, vTarget);
    crRay.cr_ttHitModels = CCastRay::TT_NONE;     // check for brushes only
    crRay.cr_bHitTranslucentPortals = FALSE;
    crRay.cr_bHitBlockSightPortals = TRUE;
    en_pwoWorld->CastRay(crRay);

    // if hit nothing (no brush) the entity can be seen
    return (crRay.cr_penHit==NULL);     
  }


  procedures:


  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit
  {
    if(m_iAmmoAmount <= 0 && m_gmChar != GMC_BLADED) {
      autocall ReloadGunmanWeapon() EEnd;
      return EReturn();
    }

    if (m_gmChar == GMC_SMG)
    {
      autocall GunmanSMGMeleeAttack() EEnd;
      return EReturn();
    }
    else if (m_gmChar == GMC_BLADED)
    {
      autocall GunmanBladedAttack() EEnd;
      return EReturn();
    }
    else if (m_gmChar == GMC_SHOTGUN)
    {
      autocall GunmanShotgunMeleeAttack() EEnd;
      return EReturn();
    }
    else if (m_gmChar == GMC_LEADER)
    {
      autocall GunmanKickAttack() EEnd;
      return EReturn();
    }
    else if (m_gmChar == GMC_KEY)
    {
      autocall GunmanKickAttack() EEnd;
      return EReturn();
    }
    else if (m_gmChar == GMC_PISTOL)
    {
      autocall GunmanKickAttack() EEnd;
      return EReturn();
    }
  };


  Fire(EVoid) : CEnemyBase::Fire
  {
    if(m_iAmmoAmount <= 0 && m_gmChar != GMC_BLADED) {
      autocall ReloadGunmanWeapon() EEnd;
      return EReturn();
    }

    if(!CanFireAtPlayer()) {
      return EReturn();
    }

    if (m_gmChar == GMC_SMG)
    {
      m_fFireTime = m_fCustomFireTime;
      autocall GunmanSMGFireChoice() EEnd;
      return EReturn();
    }
    else if (m_gmChar == GMC_BLADED)
    {
      return EReturn();
    }
    else if (m_gmChar == GMC_SHOTGUN)
    {
      autocall GunmanShotgunAttack() EEnd;
      return EReturn();
    }
    else if (m_gmChar == GMC_LEADER)
    {
      switch(IRnd()%3)
      {
        case 0: jump GunmanLeaderPistolAttack(); break;
        case 1: jump StrafeLeftPistol(); break;
        case 2: jump StrafeRightPistol(); break;
        default: ASSERTALWAYS("Gunman Leader unknown ranged attack");
      }
      return EReturn();
    } 
    else if (m_gmChar == GMC_KEY)
    {
      autocall GunmanPistolAttack() EEnd;
      return EReturn();
    }
    else if (m_gmChar == GMC_PISTOL)
    {
      m_fFireTime = m_fCustomFireTime;
      autocall GunmanPistolFireChoice() EEnd;
      return EReturn();
    }
  };


  ReloadGunmanWeapon(EVoid) {
    StartModelAnim(GUNMAN_ANIM_DEFAULT, 0);

    if(m_gmChar == GMC_SMG) {
      PlaySound(m_soSound, SOUND_RELOAD_SMG, SOF_3D);
    } else if (m_gmChar == GMC_SHOTGUN) {
      PlaySound(m_soSound, SOUND_RELOAD_SHOTGUN, SOF_3D);
    } else {
      PlaySound(m_soSound, SOUND_RELOAD, SOF_3D);
    }

    autowait(0.45f);

    switch(m_gmChar) {
      case GMC_SMG:
      m_iAmmoAmount = 30;
      break;

      case GMC_SHOTGUN:
      m_iAmmoAmount = 8;
      break;
      
      case GMC_KEY:
      case GMC_LEADER:
      case GMC_PISTOL:
      m_iAmmoAmount = 17;
      break;
    }

    autowait(0.35f);

    return EReturn();
  };


  GunmanSMGFireChoice(EVoid) {
    if(m_gsfType == GSFT_AUTO) {
      autocall GunmanSMGAttackAutomatic() EEnd;
    } else if(m_gsfType == GSFT_FIVE) {
      autocall GunmanSMGAttackFiveRoundBurst() EEnd;
    } else if(m_gsfType == GSFT_THREE) {
      autocall GunmanSMGAttack() EEnd;
    }
    return EReturn();
  };


  GunmanPistolFireChoice(EVoid) {
    if(m_gpfType == GPFT_AUTO) {
      autocall GunmanPistolAttackAutomatic() EEnd;
    } else if(m_gpfType == GPFT_THREE) {
      autocall GunmanLeaderPistolAttack() EEnd;
    } else if(m_gpfType == GPFT_ONE) {
      autocall GunmanPistolAttack() EEnd;
    }
    return EReturn();
  };


  GunmanKickAttack(EVoid) {
    // close attack
    StartModelAnim(GUNMAN_ANIM_KICK, 0);
    m_bFistHit = FALSE;
    autowait(0.30f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 6.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
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
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 9.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
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

  GunmanSMGMeleeAttack(EVoid) {
    // close attack
    StartModelAnim(GUNMAN_ANIM_MELEESMG, 0);
    m_bFistHit = FALSE;
    autowait(0.30f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 7.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
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

  GunmanBladedAttack(EVoid) {
    // close attack
    switch(IRnd()%2)
    {
        case 0: StartModelAnim(GUNMANBLADED_ANIM_MELEE1, 0); break;
        case 1: StartModelAnim(GUNMANBLADED_ANIM_MELEE2, 0); break;
        default: ASSERTALWAYS("Gunman bladed unknown animation");
    }

    m_bFistHit = FALSE;
    autowait(0.30f);
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
  };


  // Gunman pistol attack
  GunmanPistolAttack(EVoid) {
    m_fLockOnEnemyTime = 0.5f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StandingAnim();
    autowait(0.2f + FRnd()/4);

    if(m_iAmmoAmount > 0) {
      m_fLockOnEnemyTime = 0.125f;
      autocall CEnemyBase::LockOnEnemy() EReturn;
      StartModelAnim(GUNMAN_ANIM_SHOOTPISTOL, 0);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE, SOF_3D);
      m_iAmmoAmount--;
    }

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();

    return EEnd();
  };

  // --------------------------------------------------------------------------------------
  // Call this to make the enemy strafe to the left
  // --------------------------------------------------------------------------------------
  StrafeLeftPistol(EVoid) 
  {
    // stop moving
    StopMoving();
    // play animation for locking
    if(m_iAmmoAmount > 0) {
      StartModelAnim(GUNMAN_ANIM_STRAFELEFTPISTOL, AOF_LOOPING|AOF_NORESTART);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE, SOF_3D);
      m_iAmmoAmount--;
    }
    // wait charge time
    m_fLockStartTime = _pTimer->CurrentTick();
    while (m_fLockStartTime+GetProp(m_fLockOnEnemyTime) > _pTimer->CurrentTick()) {
      // each tick
      m_fMoveFrequency = 0.05f;
      wait (m_fMoveFrequency) {
        on (ETimer) : { stop; }
        on (EBegin) : {
          FLOAT fSpeedMultiplier = 1.0f;
          m_fMoveSpeed = GetProp(m_fWalkSpeed) * fSpeedMultiplier;
          m_aRotateSpeed = 0.0f;
          m_vDesiredPosition = FLOAT3D(-m_fMoveSpeed, 0.0f, 0.0f);
          // start moving
          SetDesiredTranslation(m_vDesiredPosition);
          resume;
        }
      }
    }
    // stop rotating
    StopRotating();

    // return to caller
    return EReturn();
  };

  // --------------------------------------------------------------------------------------
  // Call this to make the enemy strafe to the right
  // --------------------------------------------------------------------------------------
  StrafeRightPistol(EVoid) 
  {
    // stop moving
    StopMoving();
    // play animation for locking
    if(m_iAmmoAmount > 0) {
      StartModelAnim(GUNMAN_ANIM_STRAFERIGHTPISTOL, AOF_LOOPING|AOF_NORESTART);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE, SOF_3D);
      m_iAmmoAmount--;
    }
    // wait charge time
    m_fLockStartTime = _pTimer->CurrentTick();
    while (m_fLockStartTime+GetProp(m_fLockOnEnemyTime) > _pTimer->CurrentTick()) {
      // each tick
      m_fMoveFrequency = 0.05f;
      wait (m_fMoveFrequency) {
        on (ETimer) : { stop; }
        on (EBegin) : {
          FLOAT fSpeedMultiplier = 1.0f;
          m_fMoveSpeed = GetProp(m_fWalkSpeed) * fSpeedMultiplier;
          m_aRotateSpeed = 0.0f;
          m_vDesiredPosition = FLOAT3D(+m_fMoveSpeed, 0.0f, 0.0f);
          // start moving
          SetDesiredTranslation(m_vDesiredPosition);
          resume;
        }
      }
    }
    // stop rotating
    StopRotating();

    // return to caller
    return EReturn();
  };

  // Gunman pistol attack
  GunmanLeaderPistolAttack(EVoid) {
    m_fLockOnEnemyTime = 0.5f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StandingAnim();
    autowait(0.2f + FRnd()/4);

    if(m_iAmmoAmount > 0) {
      m_fLockOnEnemyTime = 0.125f;
      autocall CEnemyBase::LockOnEnemy() EReturn;
      StartModelAnim(GUNMAN_ANIM_LEADERSHOOTPISTOL, 0);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE, SOF_3D);
      m_iAmmoAmount--;
    }

    autowait(0.2f + FRnd()/4);

    if(m_iAmmoAmount > 0) {
      m_fLockOnEnemyTime = 0.125f;
      autocall CEnemyBase::LockOnEnemy() EReturn;
      StartModelAnim(GUNMAN_ANIM_LEADERSHOOTPISTOL, 0);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE, SOF_3D);
      m_iAmmoAmount--;
    }

    autowait(0.2f + FRnd()/4);

    if(m_iAmmoAmount > 0) {
      m_fLockOnEnemyTime = 0.125f;
      autocall CEnemyBase::LockOnEnemy() EReturn;
      StartModelAnim(GUNMAN_ANIM_LEADERSHOOTPISTOL, 0);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE, SOF_3D);
      m_iAmmoAmount--;
    }

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();

    m_fLockOnEnemyTime = 1.0f;

    return EReturn();
  };

  // Gunman Pistol attack
  GunmanPistolAttackAutomatic(EVoid) {
    m_fLockOnEnemyTime = 0.5f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StandingAnim();
    autowait(0.25f + FRnd()/4);

    m_fFireTime += _pTimer->CurrentTick();

    while(m_fFireTime > _pTimer->CurrentTick()) {
      m_fLockOnEnemyTime = 0.1f;
      autocall CEnemyBase::LockOnEnemy() EReturn;

      m_fMoveFrequency = 0.1f;
      wait(m_fMoveFrequency) {
        on (EBegin) : {
          if(m_iAmmoAmount > 0) {
            StartModelAnim(GUNMAN_ANIM_LEADERSHOOTPISTOL, 0);
            ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0.0f, 0, 0));
            PlaySound(m_soSound, SOUND_FIRE, SOF_3D);
            m_iAmmoAmount--;
          }

          resume;
        }
        on (ETimer) : { stop; }
      }
    }

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();

    m_fLockOnEnemyTime = 1.0f;

    return EEnd();
  };

  // Gunman shotgun attack
  GunmanShotgunAttack(EVoid) {
    m_fLockOnEnemyTime = 0.5f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StandingAnim();
    autowait(0.25f + FRnd()/4);

    if(m_iAmmoAmount > 0) {
      m_fLockOnEnemyTime = 0.125f;
      autocall CEnemyBase::LockOnEnemy() EReturn;
      StartModelAnim(GUNMAN_ANIM_SHOOTSHOTGUN, 0);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(-0.5f, 1.35f, 0.0f), ANGLE3D(4.0f, 0, 0));
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(-0.25f, 1.35f, 0.0f), ANGLE3D(2.0f, 0, 0));
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.25f, 1.35f, 0.0f), ANGLE3D(-2.0f, 0, 0));
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.5f, 1.35f, 0.0f), ANGLE3D(-4.0f, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE_SHOTGUN, SOF_3D);
      m_iAmmoAmount--;
    }

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();

    return EEnd();
  };

  // Gunman SMG attack
  GunmanSMGAttack(EVoid) {
    m_fLockOnEnemyTime = 0.5f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StandingAnim();
    autowait(0.25f + FRnd()/4);

    if(m_iAmmoAmount > 0) {
      m_fLockOnEnemyTime = 0.05f;
      autocall CEnemyBase::LockOnEnemy() EReturn;
      StartModelAnim(GUNMAN_ANIM_SHOOTSMG, 0);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0.0f, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE_SMG, SOF_3D);
      m_iAmmoAmount--;
    }
    autowait(0.05f);
    if(m_iAmmoAmount > 0) {
      m_fLockOnEnemyTime = 0.05f;
      autocall CEnemyBase::LockOnEnemy() EReturn;
      StartModelAnim(GUNMAN_ANIM_SHOOTSMG, 0);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0.0f, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE_SMG, SOF_3D);
      m_iAmmoAmount--;
    }
    autowait(0.05f);
    if(m_iAmmoAmount > 0) {
      m_fLockOnEnemyTime = 0.05f;
      autocall CEnemyBase::LockOnEnemy() EReturn;
      StartModelAnim(GUNMAN_ANIM_SHOOTSMG, 0);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0.0f, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE_SMG, SOF_3D);
      m_iAmmoAmount--;
    }

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();

    return EEnd();
  };

  // Gunman SMG attack
  GunmanSMGAttackFiveRoundBurst(EVoid) {
    m_fLockOnEnemyTime = 0.75f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StandingAnim();
    autowait(0.25f + FRnd()/4);


    if(m_iAmmoAmount > 0) {
      m_fLockOnEnemyTime = 0.05f;
      autocall CEnemyBase::LockOnEnemy() EReturn;
      StartModelAnim(GUNMAN_ANIM_SHOOTSMG, 0);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0.0f, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE_SMG, SOF_3D);
      m_iAmmoAmount--;
    }
    autowait(0.05f);
    if(m_iAmmoAmount > 0) {
      m_fLockOnEnemyTime = 0.05f;
      autocall CEnemyBase::LockOnEnemy() EReturn;
      StartModelAnim(GUNMAN_ANIM_SHOOTSMG, 0);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0.0f, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE_SMG, SOF_3D);
      m_iAmmoAmount--;
    }
    autowait(0.05f);
    if(m_iAmmoAmount > 0) {
      m_fLockOnEnemyTime = 0.05f;
      autocall CEnemyBase::LockOnEnemy() EReturn;
      StartModelAnim(GUNMAN_ANIM_SHOOTSMG, 0);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0.0f, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE_SMG, SOF_3D);
      m_iAmmoAmount--;
    }
    autowait(0.05f);
    if(m_iAmmoAmount > 0) {
      m_fLockOnEnemyTime = 0.05f;
      autocall CEnemyBase::LockOnEnemy() EReturn;
      StartModelAnim(GUNMAN_ANIM_SHOOTSMG, 0);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0.0f, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE_SMG, SOF_3D);
      m_iAmmoAmount--;
    }
    autowait(0.05f);
    if(m_iAmmoAmount > 0) {
      m_fLockOnEnemyTime = 0.05f;
      autocall CEnemyBase::LockOnEnemy() EReturn;
      StartModelAnim(GUNMAN_ANIM_SHOOTSMG, 0);
      ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0.0f, 0, 0));
      PlaySound(m_soSound, SOUND_FIRE_SMG, SOF_3D);
      m_iAmmoAmount--;
    }

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();

    return EEnd();
  };

  // Gunman SMG attack
  GunmanSMGAttackAutomatic(EVoid) {
    m_fLockOnEnemyTime = 0.5f;
    autocall CEnemyBase::LockOnEnemy() EReturn;
    StandingAnim();
    autowait(0.25f + FRnd()/4);

    m_fFireTime += _pTimer->CurrentTick();

    while(m_fFireTime > _pTimer->CurrentTick()) {
      m_fLockOnEnemyTime = 0.05f;
      autocall CEnemyBase::LockOnEnemy() EReturn;

      m_fMoveFrequency = 0.05f;
      wait(m_fMoveFrequency) {
        on (EBegin) : {
          if(m_iAmmoAmount > 0) {
            StartModelAnim(GUNMAN_ANIM_SHOOTSMG, 0);
            ShootProjectile(PRT_GUNMAN_BULLET, FLOAT3D(0.0f, 1.35f, 0.0f), ANGLE3D(0.0f, 0, 0));
            PlaySound(m_soSound, SOUND_FIRE_SMG, SOF_3D);
            m_iAmmoAmount--;
          }

          resume;
        }
        on (ETimer) : { stop; }
      }
    }

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
    m_fDamageWounded = 45.0f;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;
    m_sptType = SPT_ELECTRICITY_SPARKS_NO_BLOOD;
    m_bShouldReload = FALSE;
    m_iAmmoAmount = 0;

    // set your appearance
    SetModel(MODEL_GUNMAN);
    // set your texture

    switch(m_gmChar)
    {
      case GMC_SMG:
        SetHealth(250.0f);
        m_fMaxHealth = 250.0f;
        SetModelMainTexture(TEXTURE_GUNMAN_SMG);
        AddAttachment(GUNMAN_ATTACHMENT_SMG, MODEL_SMG, TEXTURE_SMG);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
        m_bIsLeader = FALSE;
        m_iScore = 2500;
        m_fDamageWounded = 110.0f;
        m_iAmmoAmount = 30;
      break;

      case GMC_BLADED:
        SetHealth(200.0f);
        m_fMaxHealth = 200.0f;
        SetModel(MODEL_GUNMAN_BLADED);
        SetModelMainTexture(TEXTURE_GUNMAN);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
        m_bIsLeader = FALSE;
        m_iScore = 1500;
        m_fDamageWounded = 60.0f;
      break;

      case GMC_SHOTGUN:
        SetHealth(200.0f);
        m_fMaxHealth = 200.0f;
        SetModelMainTexture(TEXTURE_GUNMAN);
        AddAttachment(GUNMAN_ATTACHMENT_SHOTGUN, MODEL_SHOTGUN, TEXTURE_SHOTGUN);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
        m_bIsLeader = FALSE;
        m_iScore = 2500;
        m_fDamageWounded = 70.0f;
        m_iAmmoAmount = 8;
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
        m_fDamageWounded = 70.0f;
        m_iAmmoAmount = 17;
      break;

      case GMC_KEY:
        SetModelMainTexture(TEXTURE_GUNMAN_SECURITY);
        AddAttachment(GUNMAN_ATTACHMENT_PISTOL, MODEL_PISTOL, TEXTURE_PISTOL);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
        m_bIsLeader = FALSE;
        m_iScore = 1000;
        m_iAmmoAmount = 17;
      break;

      case GMC_PISTOL:
        SetModelMainTexture(TEXTURE_GUNMAN);
        AddAttachment(GUNMAN_ATTACHMENT_PISTOL, MODEL_PISTOL, TEXTURE_PISTOL);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
        m_bIsLeader = FALSE;
        m_iScore = 500;
        m_iAmmoAmount = 17;
      break;
    }
        
        // setup moving speed
        if(m_gmChar == GMC_BLADED) {
          // setup moving speed
          m_fWalkSpeed = FRnd() + 3.5f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
          m_fAttackRunSpeed = FRnd() + 7.0f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*70 + 275.0f);
          m_fCloseRunSpeed = FRnd() + 7.0f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*70 + 275.0f);
        } else {
          m_fWalkSpeed = FRnd() + 2.5f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
          m_fAttackRunSpeed = FRnd() + 5.0f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 245.0f);
          m_fCloseRunSpeed = FRnd() + 5.0f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 245.0f);
        }
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

    StandingAnim();

    // continue behavior in base class
    jump CEnemySquad::MainLoop();
  };
};