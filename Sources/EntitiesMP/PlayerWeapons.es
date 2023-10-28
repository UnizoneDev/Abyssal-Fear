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

402
%{
#include "StdH.h"
#include "GameMP/SEColors.h"
  
#include <Engine/Build.h>

#include "EntitiesMP/Player.h"
#include "EntitiesMP/Bullet.h"
#include "Models/Items/ItemHolder/ItemHolder.h"
#include "Models/Weapons/Knife/KnifeViewmodel.h"
#include "Models/Weapons/Knife/KnifeWeapon.h"
#include "Models/Weapons/Axe/AxeViewmodel.h"
#include "Models/Weapons/Axe/AxeWeapon.h"
#include "Models/Weapons/Pistol/PistolViewmodel.h"
#include "Models/Weapons/Pistol/PistolItem.h"
#include "Models/Weapons/Shotgun/ShotgunViewmodel.h"
#include "Models/Weapons/Shotgun/ShotgunItem.h"
#include "Models/Weapons/SMG/SMGViewmodel.h"
#include "Models/Weapons/SMG/SMGItem.h"
#include "Models/Weapons/MetalPipe/MetalPipeViewmodel.h"
#include "Models/Weapons/MetalPipe/PipeWeapon.h"
#include "Models/Weapons/StrongPistol/StrongPistolItem.h"
#include "Models/Weapons/StrongPistol/StrongPistolViewmodel.h"

// Mission Pack player body instead of the old one
#include "Models/Player/Uni/Body.h"
#include "Models/Player/Uni/Player.h"

#include "EntitiesMP/Switch.h"
#include "EntitiesMP/PlayerView.h"
#include "EntitiesMP/PlayerAnimator.h"
#include "EntitiesMP/MovingBrush.h"
#include "EntitiesMP/MessageHolder.h"
#include "EntitiesMP/EnemyBase.h"
#include "EntitiesMP/ControllableTurret.h"
extern INDEX hud_bShowWeapon;

extern const INDEX aiWeaponsRemap[9] = { 0,  1,  2,  3,  7,  4,  8,  5,  6 };

%}

uses "EntitiesMP/Player";
uses "EntitiesMP/PlayerWeaponsEffects";
uses "EntitiesMP/Projectile";
uses "EntitiesMP/Bullet";
uses "EntitiesMP/BasicEffects";
uses "EntitiesMP/WeaponItem";
uses "EntitiesMP/AmmoItem";
uses "EntitiesMP/ModelHolder2";


// input parameter for weapons
event EWeaponsInit {
  CEntityPointer penOwner,        // who owns it
};

// select weapon
event ESelectWeapon {
  INDEX iWeapon,          // weapon to select
};

// boring weapon animations
event EBoringWeapon {};

// fire weapon
event EFireWeapon {};
// release weapon
event EReleaseWeapon {};

// altfire weapon
event EAltFireWeapon {};
// altrelease weapon
event EAltReleaseWeapon {};

// reload weapon
event EReloadWeapon {};
// holster weapon
event EHolsterWeapon {};
// drop weapon
event EDropWeapon {};
// weapon changed - used to notify other entities
event EWeaponChanged {};

// weapons (do not change order! - needed by HUD.cpp)
enum WeaponType {
  0 WEAPON_NONE               "", // don't consider this in WEAPONS_ALLAVAILABLEMASK
  1 WEAPON_HOLSTERED          "",
  2 WEAPON_KNIFE              "",
  3 WEAPON_AXE                "",
  4 WEAPON_PISTOL             "",
  5 WEAPON_SHOTGUN            "",
  6 WEAPON_SMG                "",
  7 WEAPON_PIPE               "",
  8 WEAPON_STRONGPISTOL       "",
  9 WEAPON_LAST               "",
}; // see 'WEAPONS_ALLAVAILABLEMASK' -> (11111111 == 0x3FFFFF)

%{
// AVAILABLE WEAPON MASK
#define WEAPONS_ALLAVAILABLEMASK 0x3FFFFF

/*
#if BUILD_TEST
  #define WEAPONS_DISABLEDMASK (0)
#else 
  #define WEAPONS_DISABLEDMASK (0)
#endif
  */

#define MAX_WEAPONS 30


// fire flare specific
#define FLARE_REMOVE 1
#define FLARE_ADD 2

// animation light specific
#define LIGHT_ANIM_MINIGUN 2
#define LIGHT_ANIM_TOMMYGUN 3
#define LIGHT_ANIM_COLT_SHOTGUN 4
#define LIGHT_ANIM_NONE 5


// mana for ammo adjustment (multiplier)
#define MANA_AMMO (0.1f)

// position of weapon model -- weapon 0 is never used
static FLOAT wpn_fH[MAX_WEAPONS+1];
static FLOAT wpn_fP[MAX_WEAPONS+1];
static FLOAT wpn_fB[MAX_WEAPONS+1];
static FLOAT wpn_fX[MAX_WEAPONS+1];
static FLOAT wpn_fY[MAX_WEAPONS+1];
static FLOAT wpn_fZ[MAX_WEAPONS+1];
static FLOAT wpn_fFOV[MAX_WEAPONS+1];
static FLOAT wpn_fClip[MAX_WEAPONS+1];
static FLOAT wpn_fFX[MAX_WEAPONS+1];  // firing source
static FLOAT wpn_fFY[MAX_WEAPONS+1];
//static FLOAT wpn_fFZ[MAX_WEAPONS+1];
static INDEX wpn_iCurrent;
extern FLOAT hud_tmWeaponsOnScreen;
extern FLOAT wpn_fRecoilSpeed[17];
extern FLOAT wpn_fRecoilLimit[17];
extern FLOAT wpn_fRecoilDampUp[17];
extern FLOAT wpn_fRecoilDampDn[17];
extern FLOAT wpn_fRecoilOffset[17];
extern FLOAT wpn_fRecoilFactorP[17];
extern FLOAT wpn_fRecoilFactorZ[17];

static FLOAT afShotgunPellets[] =
{ -0.3f,+0.1f,  +0.0f,+0.1f,  +0.1f,+0.1f,  +0.3f,+0.1f,
  -0.4f,-0.1f,  -0.1f,-0.1f,  +0.0f,-0.1f,  +0.4f,-0.1f
};

// crosshair console variables
static INDEX hud_bCrosshairFixed    = FALSE;
static INDEX hud_bCrosshairColoring = TRUE;
static FLOAT hud_fCrosshairScale    = 1.0f;
static FLOAT hud_fCrosshairOpacity  = 1.0f;
static FLOAT hud_fCrosshairRatio    = 0.5f;  // max distance size ratio
// misc HUD vars
static INDEX hud_bShowPlayerName = TRUE;
static INDEX hud_bShowCoords     = FALSE;
static FLOAT plr_tmSnoopingDelay = 1.0f; // seconds 
extern FLOAT plr_tmSnoopingTime  = 1.0f; // seconds 

// some static vars
static INDEX _iLastCrosshairType=-1;
static CTextureObject _toCrosshair;

// must do this to keep dependency catcher happy
CTFileName fn1 = CTFILENAME("Textures\\Interface\\Crosshairs\\Crosshair1.tex");
CTFileName fn2 = CTFILENAME("Textures\\Interface\\Crosshairs\\Crosshair2.tex");
CTFileName fn3 = CTFILENAME("Textures\\Interface\\Crosshairs\\Crosshair3.tex");
CTFileName fn4 = CTFILENAME("Textures\\Interface\\Crosshairs\\Crosshair4.tex");

void CPlayerWeapons_Precache(ULONG ulAvailable)
{
  CDLLEntityClass *pdec = &CPlayerWeapons_DLLClass;

  // precache general stuff always
  pdec->PrecacheTexture(TEX_REFL_BWRIPLES01      );
  pdec->PrecacheTexture(TEX_REFL_BWRIPLES02      );
  pdec->PrecacheTexture(TEX_REFL_LIGHTMETAL01    );
  pdec->PrecacheTexture(TEX_REFL_LIGHTBLUEMETAL01);
  pdec->PrecacheTexture(TEX_REFL_DARKMETAL       );
  pdec->PrecacheTexture(TEX_REFL_PURPLE01        );
  pdec->PrecacheTexture(TEX_SPEC_WEAK            );
  pdec->PrecacheTexture(TEX_SPEC_MEDIUM          );
  pdec->PrecacheTexture(TEX_SPEC_STRONG          );
  pdec->PrecacheTexture(TEXTURE_HAND             );
  pdec->PrecacheTexture(TEXTURE_FLARE01          );
  pdec->PrecacheModel(MODEL_FLARE01);
  pdec->PrecacheClass(CLASS_BULLET);
  pdec->PrecacheSound(SOUND_SILENCE);
  pdec->PrecacheSound(SOUND_DRYFIRE);
  pdec->PrecacheModel(MODEL_ITEM);

  // precache other weapons if available
  if ( ulAvailable&(1<<(WEAPON_KNIFE-1)) ) {
    pdec->PrecacheModel(MODEL_KNIFE                 );
    pdec->PrecacheModel(MODEL_KNIFEITEM             );
    pdec->PrecacheTexture(TEXTURE_KNIFEITEM         );
    pdec->PrecacheSound(SOUND_KNIFE_SWING           );
    pdec->PrecacheSound(SOUND_KNIFE_SLASH           );
    pdec->PrecacheSound(SOUND_KNIFE_HIT             );
  }

  if ( ulAvailable&(1<<(WEAPON_PISTOL-1)) ) {
    pdec->PrecacheModel(MODEL_PISTOL               );
    pdec->PrecacheModel(MODEL_PISTOLITEM           );
    pdec->PrecacheTexture(TEXTURE_PISTOLITEM       );
    pdec->PrecacheSound(SOUND_PISTOL_FIRE          );
    pdec->PrecacheSound(SOUND_PISTOL_RELOAD        );
    pdec->PrecacheSound(SOUND_PIPE_HIT1          );
    pdec->PrecacheSound(SOUND_PIPE_HIT2          );
    pdec->PrecacheSound(SOUND_PIPE_HIT3          );
    pdec->PrecacheSound(SOUND_PIPE_HIT4          );
    pdec->PrecacheSound(SOUND_KNIFE_SWING        );
    pdec->PrecacheSound(SOUND_PIPE_BANG          );
  }

  // precache other weapons if available
  if ( ulAvailable&(1<<(WEAPON_AXE-1)) ) {
    pdec->PrecacheModel(MODEL_AXE                 );
    pdec->PrecacheModel(MODEL_AXEITEM             );
    pdec->PrecacheSound(SOUND_KNIFE_SWING         );
    pdec->PrecacheSound(SOUND_KNIFE_SLASH         );
    pdec->PrecacheSound(SOUND_KNIFE_HIT           );
  }

  if ( ulAvailable&(1<<(WEAPON_SHOTGUN-1)) ) {
    pdec->PrecacheModel(MODEL_SHOTGUN               );
    pdec->PrecacheModel(MODEL_SHOTGUNITEM           );
    pdec->PrecacheTexture(TEXTURE_SHOTGUNITEM       );
    pdec->PrecacheSound(SOUND_SHOTGUN_FIRE          );
    pdec->PrecacheSound(SOUND_SHOTGUN_RELOAD        );
  }

  if ( ulAvailable&(1<<(WEAPON_SMG-1)) ) {
    pdec->PrecacheModel(MODEL_SMG               );
    pdec->PrecacheModel(MODEL_SMGITEM           );
    pdec->PrecacheTexture(TEXTURE_SMGITEM       );
    pdec->PrecacheSound(SOUND_SMG_FIRE          );
    pdec->PrecacheSound(SOUND_SMG_RELOAD        );
  }

  if ( ulAvailable&(1<<(WEAPON_PIPE-1)) ) {
    pdec->PrecacheModel(MODEL_PIPE               );
    pdec->PrecacheModel(MODEL_PIPEITEM           );
    pdec->PrecacheTexture(TEXTURE_PIPEITEM       );
    pdec->PrecacheSound(SOUND_PIPE_HIT1          );
    pdec->PrecacheSound(SOUND_PIPE_HIT2          );
    pdec->PrecacheSound(SOUND_PIPE_HIT3          );
    pdec->PrecacheSound(SOUND_PIPE_HIT4          );
    pdec->PrecacheSound(SOUND_KNIFE_SWING        );
    pdec->PrecacheSound(SOUND_PIPE_BANG          );
  }

  if ( ulAvailable&(1<<(WEAPON_STRONGPISTOL-1)) ) {
    pdec->PrecacheModel(MODEL_STRONGPISTOL         );
    pdec->PrecacheModel(MODEL_STRONGPISTOLITEM     );
    pdec->PrecacheTexture(TEXTURE_STRONGPISTOLITEM );
    pdec->PrecacheSound(SOUND_STRONGPISTOL_FIRE    );
    pdec->PrecacheSound(SOUND_PISTOL_RELOAD        );
    pdec->PrecacheSound(SOUND_PIPE_HIT1          );
    pdec->PrecacheSound(SOUND_PIPE_HIT2          );
    pdec->PrecacheSound(SOUND_PIPE_HIT3          );
    pdec->PrecacheSound(SOUND_PIPE_HIT4          );
    pdec->PrecacheSound(SOUND_KNIFE_SWING        );
    pdec->PrecacheSound(SOUND_PIPE_BANG          );
  }

  // precache animator too
  extern void CPlayerAnimator_Precache(ULONG ulAvailable);
  CPlayerAnimator_Precache(ulAvailable);
}

void CPlayerWeapons_Init(void) {
  // declare weapon position controls
  _pShell->DeclareSymbol("user INDEX wpn_iCurrent;", &wpn_iCurrent);

  #include "Common/WeaponPositions.h"
  
  // declare crosshair and its coordinates
  _pShell->DeclareSymbol("persistent user INDEX hud_bCrosshairFixed;",    &hud_bCrosshairFixed);
  _pShell->DeclareSymbol("persistent user INDEX hud_bCrosshairColoring;", &hud_bCrosshairColoring);
  _pShell->DeclareSymbol("persistent user FLOAT hud_fCrosshairScale;",    &hud_fCrosshairScale);
  _pShell->DeclareSymbol("persistent user FLOAT hud_fCrosshairRatio;",    &hud_fCrosshairRatio);
  _pShell->DeclareSymbol("persistent user FLOAT hud_fCrosshairOpacity;",  &hud_fCrosshairOpacity);
                                  
  _pShell->DeclareSymbol("persistent user INDEX hud_bShowPlayerName;", &hud_bShowPlayerName);
  _pShell->DeclareSymbol("persistent user INDEX hud_bShowCoords;",     &hud_bShowCoords);

  _pShell->DeclareSymbol("persistent user FLOAT plr_tmSnoopingTime;",  &plr_tmSnoopingTime);
  _pShell->DeclareSymbol("persistent user FLOAT plr_tmSnoopingDelay;", &plr_tmSnoopingDelay);

  // precache base weapons
  CPlayerWeapons_Precache(0x01);
}

// decrement ammo taking infinite ammo options in account
void DecAmmo(INDEX &ctAmmo, INDEX iDec = 1)
{
  if (!GetSP()->sp_bInfiniteAmmo) {
    ctAmmo-=iDec;
  }
}

%}

class export CPlayerWeapons : CRationalEntity {
name      "Player Weapons";
thumbnail "";
features "CanBePredictable";

properties:
  1 CEntityPointer m_penPlayer,       // player which owns it
  2 BOOL m_bFireWeapon = FALSE,       // weapon is firing
  270 BOOL m_bAltFireWeapon = FALSE,       // weapon is firing
  3 BOOL m_bHasAmmo    = FALSE,       // weapon has ammo
  272 BOOL m_bHasInsertedAmmo    = FALSE,       // weapon has ammo
  4 enum WeaponType m_iCurrentWeapon  = WEAPON_HOLSTERED,    // currently active weapon (internal)
  5 enum WeaponType m_iWantedWeapon   = WEAPON_HOLSTERED,     // wanted weapon (internal)
  6 enum WeaponType m_iPreviousWeapon = WEAPON_HOLSTERED,   // previous active weapon (internal)
 11 INDEX m_iAvailableWeapons = 0x01,   // avaible weapons
 12 BOOL  m_bChangeWeapon = FALSE,      // change current weapon
 13 BOOL  m_bReloadWeapon = FALSE,      // reload weapon
 271 BOOL m_bHolsterWeapon = FALSE,     // weapon is holstering
 15 INDEX m_iAnim         = 0,          // temporary anim variable
 16 FLOAT m_fAnimWaitTime = 0.0f,       // animation wait time
 17 FLOAT m_tmRangeSoundSpawned = 0.0f, // for not spawning range sounds too often

 18 CTString m_strLastTarget   = "",      // string for last target
 19 FLOAT m_tmTargetingStarted = -99.0f,  // when targeting started
 20 FLOAT m_tmLastTarget       = -99.0f,  // when last target was seen
 21 FLOAT m_tmSnoopingStarted  = -99.0f,  // is player spying another player
 22 CEntityPointer m_penTargeting,        // who is the target
 
 25 CModelObject m_moWeapon,               // current weapon model
 26 CModelObject m_moWeaponSecond,         // current weapon second (additional) model
 27 FLOAT m_tmWeaponChangeRequired = 0.0f, // time when weapon change was required

 30 CEntityPointer m_penRayHit,         // entity hit by ray
 31 FLOAT m_fRayHitDistance = 100.0f,   // distance from hit point
 32 FLOAT m_fEnemyHealth    = 0.0f,     // normalized health of enemy in target (for coloring of crosshair)
 33 FLOAT3D m_vRayHit     = FLOAT3D(0,0,0), // coordinates where ray hit
 34 FLOAT3D m_vRayHitLast = FLOAT3D(0,0,0), // for lerping
 35 FLOAT3D m_vBulletSource = FLOAT3D(0,0,0), // bullet launch position remembered here
 36 FLOAT3D m_vBulletTarget = FLOAT3D(0,0,0), // bullet hit (if hit) position remembered here

 // ammo for all weapons
 40 INDEX m_iBullets                 = 0,
 41 INDEX m_iMaxBullets              = MAX_BULLETS,
 42 INDEX m_iShells                  = 0,
 43 INDEX m_iMaxShells               = MAX_SHELLS,
 44 INDEX m_iMediumBullets           = 0,
 45 INDEX m_iMaxMediumBullets        = MAX_MEDIUM_BULLETS,
 46 INDEX m_iStrongBullets           = 0,
 47 INDEX m_iMaxStrongBullets        = MAX_STRONG_BULLETS,

215 INDEX m_iPistolBullets = 0,
216 INDEX m_iMaxPistolBullets = MAX_PISTOL_BULLETS,
217 INDEX m_iShotgunShells = 0,
218 INDEX m_iMaxShotgunShells = MAX_SHOTGUN_SHELLS,
219 INDEX m_iSMGBullets = 0,
220 INDEX m_iMaxSMGBullets = MAX_SMG_BULLETS,
221 INDEX m_iStrongPistolBullets = 0,
222 INDEX m_iMaxStrongPistolBullets = MAX_STRONG_PISTOL_BULLETS,
// lerped bullets fire
230 FLOAT3D m_iLastBulletPosition = FLOAT3D(32000.0f, 32000.0f, 32000.0f),
// fire flare
251 INDEX m_iFlare = FLARE_REMOVE,       // 0-none, 1-remove, 2-add
252 INDEX m_iSecondFlare = FLARE_REMOVE, // 0-none, 1-remove, 2-add
// cannon
260 FLOAT m_fWeaponDrawPowerOld = 0,
261 FLOAT m_fWeaponDrawPower = 0,
262 FLOAT m_tmDrawStartTime = 0.0f,

273 INDEX m_ulMeleeWeapons = 0x00,
274 INDEX m_ulSmallGuns = 0x00,
275 INDEX m_ulBigGuns = 0x00,
276 BOOL m_bDropWeapon = FALSE,       // weapon is being dropped
277 BOOL m_bMeleeHitEnemy = FALSE,
278 BOOL m_bMeleeHitModel = FALSE,
279 BOOL m_bMeleeHitBrush = FALSE,

{
  CEntity *penBullet;
  CPlacement3D plBullet;
  FLOAT3D vBulletDestination;
}

components:
  1 class   CLASS_PROJECTILE        "Classes\\Projectile.ecl",
  2 class   CLASS_BULLET            "Classes\\Bullet.ecl",
  3 class   CLASS_WEAPONEFFECT      "Classes\\PlayerWeaponsEffects.ecl",
  4 class   CLASS_PIPEBOMB          "Classes\\Pipebomb.ecl",
  5 class   CLASS_GHOSTBUSTERRAY    "Classes\\GhostBusterRay.ecl",
  6 class   CLASS_CANNONBALL        "Classes\\CannonBall.ecl",
  7 class   CLASS_WEAPONITEM        "Classes\\WeaponItem.ecl",
  8 class   CLASS_BASIC_EFFECT      "Classes\\BasicEffect.ecl",

// ************** HAND **************
 10 texture TEXTURE_HAND                "Models\\Weapons\\Arm.tex",

// ************** KNIFE **************
 20 model   MODEL_KNIFEITEM             "Models\\Weapons\\Knife\\KnifeWeapon.mdl",
 21 texture TEXTURE_KNIFEITEM           "Models\\Weapons\\Knife\\KnifeWeapon.tex",
 22 model   MODEL_KNIFE                 "Models\\Weapons\\Knife\\KnifeViewmodel.mdl",
 23 sound   SOUND_KNIFE_SWING           "Models\\Weapons\\Knife\\Sounds\\Swing.wav",
 24 sound   SOUND_KNIFE_SLASH           "Models\\Weapons\\Knife\\Sounds\\Slash.wav",
 25 sound   SOUND_KNIFE_HIT             "Models\\Weapons\\Knife\\Sounds\\Hit.wav",
 
// ************** PISTOL **************
 30 model   MODEL_PISTOL                "Models\\Weapons\\Pistol\\PistolViewmodel.mdl",
 31 model   MODEL_PISTOLITEM            "Models\\Weapons\\Pistol\\PistolItem.mdl",
 32 texture TEXTURE_PISTOLITEM          "Models\\Weapons\\Pistol\\Pistol.tex",
 33 sound   SOUND_PISTOL_FIRE           "Models\\NPCs\\Gunman\\Sounds\\PistolAttack.wav",
 34 sound   SOUND_PISTOL_RELOAD         "Models\\NPCs\\Gunman\\Sounds\\PistolReload.wav",
 35 sound   SOUND_DRYFIRE               "Models\\NPCs\\Gunman\\Sounds\\DryFire.wav",

// ************** AXE **************
 40 model   MODEL_AXEITEM             "Models\\Weapons\\Axe\\AxeWeapon.mdl",
 41 model   MODEL_AXE                 "Models\\Weapons\\Axe\\AxeViewmodel.mdl",

// ************** SHOTGUN **************
 50 model   MODEL_SHOTGUN                "Models\\Weapons\\Shotgun\\ShotgunViewmodel.mdl",
 51 model   MODEL_SHOTGUNITEM            "Models\\Weapons\\Shotgun\\ShotgunItem.mdl",
 52 texture TEXTURE_SHOTGUNITEM          "Models\\Weapons\\Shotgun\\Shotgun.tex",
 53 sound   SOUND_SHOTGUN_FIRE           "Models\\NPCs\\Gunman\\Sounds\\ShotgunAttack.wav",
 54 sound   SOUND_SHOTGUN_RELOAD         "Models\\NPCs\\Gunman\\Sounds\\ShotgunReload.wav",

// ************** SMG **************
 60 model   MODEL_SMG                "Models\\Weapons\\SMG\\SMGViewmodel.mdl",
 61 model   MODEL_SMGITEM            "Models\\Weapons\\SMG\\SMGItem.mdl",
 62 texture TEXTURE_SMGITEM          "Models\\Weapons\\SMG\\SMG.tex",
 63 sound   SOUND_SMG_FIRE           "Models\\NPCs\\Gunman\\Sounds\\SMGAttack.wav",
 64 sound   SOUND_SMG_RELOAD         "Models\\NPCs\\Gunman\\Sounds\\SMGReload.wav",

// ************** METAL PIPE **************
 70 model   MODEL_PIPEITEM             "Models\\Weapons\\MetalPipe\\PipeWeapon.mdl",
 71 texture TEXTURE_PIPEITEM           "Models\\Weapons\\MetalPipe\\PipeWeapon.tex",
 72 model   MODEL_PIPE                 "Models\\Weapons\\MetalPipe\\MetalPipeViewmodel.mdl",
 73 sound   SOUND_PIPE_HIT1            "Sounds\\Weapons\\Punch1.wav",
 74 sound   SOUND_PIPE_HIT2            "Sounds\\Weapons\\Punch2.wav",
 75 sound   SOUND_PIPE_HIT3            "Sounds\\Weapons\\Punch3.wav",
 76 sound   SOUND_PIPE_BANG            "Sounds\\Weapons\\MetalPipeBang.wav",
 77 sound   SOUND_PIPE_HIT4            "Sounds\\Weapons\\Punch4.wav",

// ************** STRONG PISTOL **************
 80 model   MODEL_STRONGPISTOL                "Models\\Weapons\\StrongPistol\\StrongPistolViewmodel.mdl",
 81 model   MODEL_STRONGPISTOLITEM            "Models\\Weapons\\StrongPistol\\StrongPistolItem.mdl",
 82 texture TEXTURE_STRONGPISTOLITEM          "Models\\Weapons\\StrongPistol\\StrongPistol.tex",
 83 sound   SOUND_STRONGPISTOL_FIRE           "Models\\NPCs\\Gunman\\Sounds\\StrongPistolAttack.wav",

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

// ************** FLARES **************
250 model   MODEL_FLARE01               "Models\\Effects\\Weapons\\Flare01\\FlareMuzzle.mdl",
251 texture TEXTURE_FLARE01             "Models\\Effects\\Weapons\\Flare01\\Flare.tex",

280 sound   SOUND_SILENCE               "Sounds\\Misc\\Silence.wav",
281 model   MODEL_ITEM                  "Models\\Items\\ItemHolder\\ItemHolder.mdl"


functions:

 // add to prediction any entities that this entity depends on
  void AddDependentsToPrediction(void)
  {
    m_penPlayer->AddToPrediction();
  }
  void Precache(void)
  {
    CPlayerWeapons_Precache(m_iAvailableWeapons);
  }
  CPlayer *GetPlayer(void)
  {
    ASSERT(m_penPlayer!=NULL);
    return (CPlayer *)&*m_penPlayer;
  }
  CPlayerAnimator *GetAnimator(void)
  {
    ASSERT(m_penPlayer!=NULL);
    return ((CPlayerAnimator*)&*((CPlayer&)*m_penPlayer).m_penAnimator);
  }

  // recoil
  void DoRecoil(void)
  {
//    CPlayerAnimator &plan = (CPlayerAnimator&)*((CPlayer&)*m_penPlayer).m_penAnimator;
//    plan.m_fRecoilSpeed += wpn_fRecoilSpeed[m_iCurrentWeapon];
  }

  // 
  BOOL HoldingFire(void)
  {
    return m_bFireWeapon && !m_bChangeWeapon;
  }

  BOOL HoldingAltFire(void)
  {
    return m_bAltFireWeapon && !m_bChangeWeapon;
  }


  // render weapon model(s)
  void RenderWeaponModel( CPerspectiveProjection3D &prProjection, CDrawPort *pdp,
                          FLOAT3D vViewerLightDirection, COLOR colViewerLight, COLOR colViewerAmbient,
                          BOOL bRender, INDEX iEye)
  {
    _mrpModelRenderPrefs.SetRenderType( RT_TEXTURE|RT_SHADING_PHONG);

    // flare attachment
    ControlFlareAttachment();

    if( !bRender || m_iCurrentWeapon==WEAPON_NONE || m_iCurrentWeapon==WEAPON_HOLSTERED
     || GetPlayer()->GetSettings()->ps_ulFlags&PSF_HIDEWEAPON) { return; }

    // nuke and iron cannons have the same view settings
    INDEX iWeaponData = m_iCurrentWeapon;

    // store FOV for Crosshair
    const FLOAT fFOV = ((CPerspectiveProjection3D &)prProjection).FOVL();
    CPlacement3D plView;
    plView = ((CPlayer&)*m_penPlayer).en_plViewpoint;
    plView.RelativeToAbsolute(m_penPlayer->GetPlacement());

    CPlacement3D plWeapon;
    plWeapon = CPlacement3D ( FLOAT3D(wpn_fX[iWeaponData],
                                      wpn_fY[iWeaponData],
                                      wpn_fZ[iWeaponData]),
                               ANGLE3D(AngleDeg(wpn_fH[iWeaponData]),
                                       AngleDeg(wpn_fP[iWeaponData]),
                                       AngleDeg(wpn_fB[iWeaponData])));

    // make sure that weapon will be bright enough
    UBYTE ubLR,ubLG,ubLB, ubAR,ubAG,ubAB;
    ColorToRGB( colViewerLight,   ubLR,ubLG,ubLB);
    ColorToRGB( colViewerAmbient, ubAR,ubAG,ubAB);
    INDEX iMinDL = Min( Min(ubLR,ubLG),ubLB) -32;
    INDEX iMinDA = Min( Min(ubAR,ubAG),ubAB) -32;
    if( iMinDL<0) {
      ubLR = ClampUp( ubLR-iMinDL, (INDEX)255);
      ubLG = ClampUp( ubLG-iMinDL, (INDEX)255);
      ubLB = ClampUp( ubLB-iMinDL, (INDEX)255);
    }
    if( iMinDA<0) {
      ubAR = ClampUp( ubAR-iMinDA, (INDEX)255);
      ubAG = ClampUp( ubAG-iMinDA, (INDEX)255);
      ubAB = ClampUp( ubAB-iMinDA, (INDEX)255);
    }
    const COLOR colLight   = RGBToColor( ubLR,ubLG,ubLB);
    const COLOR colAmbient = RGBToColor( ubAR,ubAG,ubAB);
    const FLOAT tmNow = _pTimer->GetLerpedCurrentTick();

    UBYTE ubBlend = INVISIBILITY_ALPHA_LOCAL;
    FLOAT tmInvisibility = ((CPlayer *)&*m_penPlayer)->m_tmInvisibility;
    //FLOAT tmSeriousDamage = ((CPlayer *)&*m_penPlayer)->m_tmSeriousDamage;
    //FLOAT tmInvulnerability = ((CPlayer *)&*m_penPlayer)->m_tmInvulnerability;
    if (tmInvisibility>tmNow) {
      FLOAT fIntensity=0.0f;      
      if((tmInvisibility-tmNow)<3.0f)
      {
        fIntensity = 0.5f-0.5f*cos((tmInvisibility-tmNow)*(6.0f*3.1415927f/3.0f));
        ubBlend =(INDEX)(INVISIBILITY_ALPHA_LOCAL+(FLOAT)(254-INVISIBILITY_ALPHA_LOCAL)*fIntensity);      
      }      
    }

    // prepare render model structure
    CRenderModel rmMain;
    prProjection.ViewerPlacementL() =  plView;
    prProjection.FrontClipDistanceL() = wpn_fClip[iWeaponData];
    prProjection.DepthBufferNearL() = 0.0f;
    prProjection.DepthBufferFarL() = 0.1f;
    ((CPerspectiveProjection3D &)prProjection).FOVL() = AngleDeg(wpn_fFOV[iWeaponData]);

    CAnyProjection3D apr;
    apr = prProjection;
    Stereo_AdjustProjection(*apr, iEye, 0.1f);
    BeginModelRenderingView(apr, pdp);

    WeaponMovingOffset(plWeapon.pl_PositionVector);
    plWeapon.RelativeToAbsoluteSmooth(plView);
    rmMain.SetObjectPlacement(plWeapon);

    rmMain.rm_colLight   = colLight;  
    rmMain.rm_colAmbient = colAmbient;
    rmMain.rm_vLightDirection = vViewerLightDirection;
    rmMain.rm_ulFlags |= RMF_WEAPON; // TEMP: for Truform
    if (tmInvisibility>tmNow) {
      rmMain.rm_colBlend = (rmMain.rm_colBlend&0xffffff00)|ubBlend;
    }      
    
    m_moWeapon.SetupModelRendering(rmMain);
    m_moWeapon.RenderModel(rmMain);

    EndModelRenderingView();

    // restore FOV for Crosshair
    ((CPerspectiveProjection3D &)prProjection).FOVL() = fFOV;
  };


  // Weapon moving offset
  void WeaponMovingOffset(FLOAT3D &plPos)
  {
    CPlayerAnimator &plan = (CPlayerAnimator&)*((CPlayer&)*m_penPlayer).m_penAnimator;
    FLOAT fXOffset = Lerp(plan.m_fMoveLastBanking, plan.m_fMoveBanking, _pTimer->GetLerpFactor()) * -0.02f;
    FLOAT fYOffset = Lerp(plan.m_fWeaponYLastOffset, plan.m_fWeaponYOffset, _pTimer->GetLerpFactor()) * 0.15f;
    fYOffset += (fXOffset * fXOffset) * 30.0f;
    plPos(1) += fXOffset;
    plPos(2) += fYOffset;
    
  };

  // check target for time prediction updating
  void CheckTargetPrediction(CEntity *penTarget)
  {
    // if target is not predictable
    if (!penTarget->IsPredictable()) {
      // do nothing
      return;
    }

    extern FLOAT cli_tmPredictFoe;
    extern FLOAT cli_tmPredictAlly;
    extern FLOAT cli_tmPredictEnemy;

    // get your and target's bases for prediction
    CEntity *penMe = GetPlayer();
    if (IsPredictor()) {
      penMe = penMe->GetPredicted();
    }
    CEntity *penYou = penTarget;
    if (penYou->IsPredictor()) {
      penYou = penYou->GetPredicted();
    }

    // if player
    if (IsOfClass(penYou, "Player")) {
      // if ally player 
      if (GetSP()->sp_bCooperative) {
        // if ally prediction is on and this player is local
        if (cli_tmPredictAlly>0 && _pNetwork->IsPlayerLocal(penMe)) {
          // predict the ally
          penYou->SetPredictionTime(cli_tmPredictAlly);
        }
      // if foe player
      } else {
        // if foe prediction is on
        if (cli_tmPredictFoe>0) {
          // if this player is local
          if (_pNetwork->IsPlayerLocal(penMe)) {
            // predict the foe
            penYou->SetPredictionTime(cli_tmPredictFoe);
          }
          // if the target is local
          if (_pNetwork->IsPlayerLocal(penYou)) {
            // predict self
            penMe->SetPredictionTime(cli_tmPredictFoe);
          }
        }
      }
    } else {
      // if enemy prediction is on an it is an enemy
      if( cli_tmPredictEnemy>0 && IsDerivedFromClass( penYou, "Enemy Base")) {
        // if this player is local
        if (_pNetwork->IsPlayerLocal(penMe)) {
          // set enemy prediction time
          penYou->SetPredictionTime(cli_tmPredictEnemy);
        }
      }
    }
  }

  // cast a ray from weapon
  void UpdateTargetingInfo(void)
  {
    // crosshair start position from weapon
    CPlacement3D plCrosshair;
    FLOAT fFX = wpn_fFX[m_iCurrentWeapon];  // get weapon firing position
    FLOAT fFY = wpn_fFY[m_iCurrentWeapon];
    if (GetPlayer()->m_iViewState == PVT_3RDPERSONVIEW) {
      fFX = fFY = 0;
    }
    CalcWeaponPosition(FLOAT3D(fFX, fFY, 0), plCrosshair, FALSE);
    // cast ray
    CCastRay crRay( m_penPlayer, plCrosshair);
    crRay.cr_bHitTranslucentPortals = FALSE;
    crRay.cr_bPhysical = FALSE;
    crRay.cr_ttHitModels = CCastRay::TT_COLLISIONBOX;
    GetWorld()->CastRay(crRay);
    // store required cast ray results
    m_vRayHitLast = m_vRayHit;  // for lerping purposes
    m_vRayHit   = crRay.cr_vHit;
    m_penRayHit = crRay.cr_penHit;
    m_fRayHitDistance = crRay.cr_fHitDistance;
    m_fEnemyHealth = 0.0f;

    // set some targeting properties (snooping and such...)
    TIME tmNow = _pTimer->CurrentTick();
    if( m_penRayHit!=NULL)
    {
      CEntity *pen = m_penRayHit;
      // if alive 
      if( pen->GetFlags()&ENF_ALIVE)
      {
        // check the target for time prediction updating
        CheckTargetPrediction(pen);

        // if player
        if( IsOfClass( pen, "Player")) {
          // rememer when targeting begun  
          if( m_tmTargetingStarted==0) {
            m_penTargeting = pen;
            m_tmTargetingStarted = tmNow;
          }
          // keep player name, mana and health for eventual printout or coloring
          m_fEnemyHealth = ((CPlayer*)pen)->GetHealth() / ((CPlayer*)pen)->m_fMaxHealth;
          m_strLastTarget.PrintF( "%s", ((CPlayer*)pen)->GetPlayerName());
          if( GetSP()->sp_gmGameMode==CSessionProperties::GM_SCOREMATCH) {
            // add mana to player name
            CTString strMana="";
            strMana.PrintF( " (%d)", ((CPlayer*)pen)->m_iMana);
            m_strLastTarget += strMana;
          }
          if( hud_bShowPlayerName) { m_tmLastTarget = tmNow+1.5f; }
        }
        // not targeting player
        else {
          // reset targeting
          m_tmTargetingStarted = 0; 
        }
        // keep enemy health for eventual crosshair coloring
        if( IsDerivedFromClass( pen, "Enemy Base")) {
          m_fEnemyHealth = ((CEnemyBase*)pen)->GetHealth() / ((CEnemyBase*)pen)->m_fMaxHealth;
        }
         // cannot snoop while firing
        if( m_bFireWeapon || m_bAltFireWeapon) { m_tmTargetingStarted = 0; }
      }
      // if not alive
      else
      {
        // not targeting player
        m_tmTargetingStarted = 0; 

        // check switch relaying by moving brush
        if( IsOfClass( pen, "Moving Brush") && ((CMovingBrush&)*pen).m_penSwitch!=NULL) {
          pen = ((CMovingBrush&)*pen).m_penSwitch;
        }
        // if switch and near enough
        if( IsOfClass( pen, "Switch")) {
          CSwitch &enSwitch = (CSwitch&)*pen;

          // if switch is useable
          if ((m_fRayHitDistance < enSwitch.GetDistance()) && enSwitch.m_bUseable) {
            // show switch message
            if( enSwitch.m_strMessage!="") { m_strLastTarget = enSwitch.m_strMessage; }
            else { m_strLastTarget = TRANS("Use"); }
            m_tmLastTarget = tmNow+0.5f;
          }
        }
        // if controllable turret and near enough
        if( IsOfClass( pen, "ControllableTurret")) {
          CControllableTurret &enTurret = (CControllableTurret&)*pen;

          // if switch is useable
          if ((m_fRayHitDistance < enTurret.GetDistance()) && enTurret.m_bUseable) {
            // show turret message
            if( enTurret.m_strMessage!="") { m_strLastTarget = enTurret.m_strMessage; }
            else { m_strLastTarget = TRANS("Use"); }
            m_tmLastTarget = tmNow+0.5f;
          }
        }
      }
    }
    // if didn't hit anything
    else {
      // not targeting player
      m_tmTargetingStarted = 0; 
      // remember position ahead
      FLOAT3D vDir = crRay.cr_vTarget-crRay.cr_vOrigin;
      vDir.Normalize();
      m_vRayHit = crRay.cr_vOrigin+vDir*50.0f;
    }

    // determine snooping time
    TIME tmDelta = tmNow - m_tmTargetingStarted; 
    if( m_tmTargetingStarted>0 && plr_tmSnoopingDelay>0 && tmDelta>plr_tmSnoopingDelay) {
      m_tmSnoopingStarted = tmNow;
    }
  }



  // Render Crosshair
  void RenderCrosshair( CProjection3D &prProjection, CDrawPort *pdp, CPlacement3D &plViewSource)
  {
    INDEX iCrossHair = GetPlayer()->GetSettings()->ps_iCrossHairType+1;

    // adjust crosshair type
    if( iCrossHair<=0) {
      iCrossHair  = 0;
      _iLastCrosshairType = 0;
    }

    // create new crosshair texture (if needed)
    if( _iLastCrosshairType != iCrossHair) {
      _iLastCrosshairType = iCrossHair;
      CTString fnCrosshair;
      fnCrosshair.PrintF( "Textures\\Interface\\Crosshairs\\Crosshair%d.tex", iCrossHair);
      try {
        // load new crosshair texture
        _toCrosshair.SetData_t( fnCrosshair);
      } catch( char *strError) { 
        // didn't make it! - reset crosshair
        CPrintF( strError);
        iCrossHair = 0;
        return;
      }
    }
    COLOR colCrosshair = C_WHITE;
    TIME  tmNow = _pTimer->CurrentTick();

    // if hit anything
    FLOAT3D vOnScreen;
    FLOAT   fDistance = m_fRayHitDistance;
    //const FLOAT3D vRayHit = Lerp( m_vRayHitLast, m_vRayHit, _pTimer->GetLerpFactor());
    const FLOAT3D vRayHit = m_vRayHit;  // lerping doesn't seem to work ???
    // if hit anything
    if( m_penRayHit!=NULL) {

      CEntity *pen = m_penRayHit;
      // do screen projection
      prProjection.ViewerPlacementL() = plViewSource;
      prProjection.ObjectPlacementL() = CPlacement3D( FLOAT3D(0.0f, 0.0f, 0.0f), ANGLE3D( 0, 0, 0));
      prProjection.Prepare();
      prProjection.ProjectCoordinate( vRayHit, vOnScreen);
      // if required, show enemy health thru crosshair color
      if( hud_bCrosshairColoring && m_fEnemyHealth>0) {
             if( m_fEnemyHealth<0.25f) { colCrosshair = C_RED;    }
        else if( m_fEnemyHealth<0.60f) { colCrosshair = C_YELLOW; }
        else                         { colCrosshair = C_GREEN;  }
      }
    }
    // if didn't hit anything
    else
    {
      // far away in screen center
      vOnScreen(1) = (FLOAT)pdp->GetWidth()  *0.5f;
      vOnScreen(2) = (FLOAT)pdp->GetHeight() *0.5f;
      fDistance    = 100.0f;
    }

    // if croshair should be of fixed position
    if( hud_bCrosshairFixed || GetPlayer()->m_iViewState == PVT_3RDPERSONVIEW) {
      // reset it to screen center
      vOnScreen(1) = (FLOAT)pdp->GetWidth()  *0.5f;
      vOnScreen(2) = (FLOAT)pdp->GetHeight() *0.5f;
      //fDistance    = 100.0f;
    }
    
    // clamp console variables
    hud_fCrosshairScale   = Clamp( hud_fCrosshairScale,   0.1f, 2.0f);
    hud_fCrosshairRatio   = Clamp( hud_fCrosshairRatio,   0.1f, 1.0f);
    hud_fCrosshairOpacity = Clamp( hud_fCrosshairOpacity, 0.1f, 1.0f);
    const ULONG ulAlpha = NormFloatToByte( hud_fCrosshairOpacity);
    // draw crosshair if needed
    if( iCrossHair>0) {
      // determine crosshair size
      const FLOAT fMinD =   1.0f;
      const FLOAT fMaxD = 100.0f;
      fDistance = Clamp( fDistance, fMinD, fMaxD);
      const FLOAT fRatio   = (fDistance-fMinD) / (fMaxD-fMinD);
      const FLOAT fMaxSize = (FLOAT)pdp->GetWidth() / 640.0f;
      const FLOAT fMinSize = fMaxSize * hud_fCrosshairRatio;
      const FLOAT fSize    = 16 * Lerp( fMaxSize, fMinSize, fRatio) * hud_fCrosshairScale;
      // draw crosshair
      const FLOAT fI0 = + (PIX)vOnScreen(1) - fSize;
      const FLOAT fI1 = + (PIX)vOnScreen(1) + fSize;
      const FLOAT fJ0 = - (PIX)vOnScreen(2) - fSize +pdp->GetHeight();
      const FLOAT fJ1 = - (PIX)vOnScreen(2) + fSize +pdp->GetHeight();
      pdp->InitTexture( &_toCrosshair);
      pdp->AddTexture( fI0, fJ0, fI1, fJ1, colCrosshair|ulAlpha);
      pdp->FlushRenderingQueue();
    }

    // if there is still time
    TIME tmDelta = m_tmLastTarget - tmNow;
    if( tmDelta>0) {
      // printout current target info
      SLONG slDPWidth  = pdp->GetWidth();
      SLONG slDPHeight = pdp->GetHeight();
      FLOAT fScaling   = (FLOAT)slDPWidth/640.0f;
      // set font and scale
      pdp->SetFont( _pfdDisplayFont);
      pdp->SetTextScaling( fScaling);
      pdp->SetTextAspect( 1.0f);
      // do faded printout
      ULONG ulA = (FLOAT)ulAlpha * Clamp( 2*tmDelta, 0.0f, 1.0f);
      pdp->PutTextC( m_strLastTarget, slDPWidth*0.5f, slDPHeight*0.75f, SE_COL_BLUE_NEUTRAL|ulA);
    }

    // printout crosshair world coordinates if needed
    if( hud_bShowCoords) { 
      CTString strCoords;
      SLONG slDPWidth  = pdp->GetWidth();
      SLONG slDPHeight = pdp->GetHeight();
      // set font and scale
      pdp->SetFont( _pfdDisplayFont);
      pdp->SetTextAspect( 1.0f);
      pdp->SetTextScaling( (FLOAT)slDPWidth/640.0f);
      // do printout only if coordinates are valid
      const FLOAT fMax = Max( Max( vRayHit(1), vRayHit(2)), vRayHit(3));
      const FLOAT fMin = Min( Min( vRayHit(1), vRayHit(2)), vRayHit(3));
      if( fMax<+100000 && fMin>-100000) {
        strCoords.PrintF( "%.0f,%.0f,%.0f", vRayHit(1), vRayHit(2), vRayHit(3));
        pdp->PutTextC( strCoords, slDPWidth*0.5f, slDPHeight*0.10f, C_WHITE|CT_OPAQUE);
      }
    }
  };



/************************************************************
 *                      FIRE FLARE                          *
 ************************************************************/
  // show flare
  void ShowFlare(CModelObject &moWeapon, INDEX iAttachObject, INDEX iAttachFlare, FLOAT fSize) {
    CModelObject *pmo = &(moWeapon.GetAttachmentModel(iAttachObject)->amo_moModelObject);
    CAttachmentModelObject *pamo = pmo->GetAttachmentModel(iAttachFlare);
    pamo->amo_plRelative.pl_OrientationAngle(3) = (rand()*360.0f)/RAND_MAX;
    pmo = &(pamo->amo_moModelObject);
    pmo->StretchModel(FLOAT3D(fSize, fSize, fSize));
  };


  // hide flare
  void HideFlare(CModelObject &moWeapon, INDEX iAttachObject, INDEX iAttachFlare) {
    CModelObject *pmo = &(moWeapon.GetAttachmentModel(iAttachObject)->amo_moModelObject);
    pmo = &(pmo->GetAttachmentModel(iAttachFlare)->amo_moModelObject);
    pmo->StretchModel(FLOAT3D(0, 0, 0));
  };

  void SetFlare(INDEX iFlare, INDEX iAction)
  {
    // if not a prediction head
    if (!IsPredictionHead()) {
      // do nothing
      return;
    }

    // get your prediction tail
    CPlayerWeapons *pen = (CPlayerWeapons*)GetPredictionTail();
    if (iFlare==0) {
      pen->m_iFlare = iAction;
      pen->GetPlayer()->GetPlayerAnimator()->m_iFlare = iAction;
    } else {
      pen->m_iSecondFlare = iAction;
      pen->GetPlayer()->GetPlayerAnimator()->m_iSecondFlare = iAction;
    }
  }

  // flare attachment
  void ControlFlareAttachment(void) {
    // if not a prediction head
/*    if (!IsPredictionHead()) {
      // do nothing
      return;
    }
    */

    // get your prediction tail
    CPlayerWeapons *pen = (CPlayerWeapons *)GetPredictionTail();

    // add flare
    if (pen->m_iFlare==FLARE_ADD) {
      pen->m_iFlare = FLARE_REMOVE;
      switch(m_iCurrentWeapon) {
        case WEAPON_PISTOL:
          ShowFlare(m_moWeapon, PISTOLVIEWMODEL_ATTACHMENT_THEPISTOL, PISTOLITEM_ATTACHMENT_FLARE_MUZZLE, 0.5f);
          break;
        case WEAPON_SHOTGUN:
          ShowFlare(m_moWeapon, SHOTGUNVIEWMODEL_ATTACHMENT_SHOTGUN, SHOTGUNITEM_ATTACHMENT_FLARE_MUZZLE, 0.75f);
          break;
        case WEAPON_SMG:
          ShowFlare(m_moWeapon, SMGVIEWMODEL_ATTACHMENT_THESMG, SMGITEM_ATTACHMENT_FLARE_MUZZLE, 0.5f);
          break;
        case WEAPON_STRONGPISTOL:
          ShowFlare(m_moWeapon, STRONGPISTOLVIEWMODEL_ATTACHMENT_THEPISTOL, STRONGPISTOLITEM_ATTACHMENT_FLARE_MUZZLE, 0.75f);
          break;
      }
    // remove
    } else if (pen->m_iFlare==FLARE_REMOVE) {
      switch(m_iCurrentWeapon) {
        case WEAPON_PISTOL:
          HideFlare(m_moWeapon, PISTOLVIEWMODEL_ATTACHMENT_THEPISTOL, PISTOLITEM_ATTACHMENT_FLARE_MUZZLE);
          break;
        case WEAPON_SHOTGUN:
          HideFlare(m_moWeapon, SHOTGUNVIEWMODEL_ATTACHMENT_SHOTGUN, SHOTGUNITEM_ATTACHMENT_FLARE_MUZZLE);
          break;
        case WEAPON_SMG:
          HideFlare(m_moWeapon, SMGVIEWMODEL_ATTACHMENT_THESMG, SMGITEM_ATTACHMENT_FLARE_MUZZLE);
          break;
        case WEAPON_STRONGPISTOL:
          HideFlare(m_moWeapon, STRONGPISTOLVIEWMODEL_ATTACHMENT_THEPISTOL, STRONGPISTOLITEM_ATTACHMENT_FLARE_MUZZLE);
          break;
      }
    } else {
      ASSERT(FALSE);
    }
  };


  // play light animation
  void PlayLightAnim(INDEX iAnim, ULONG ulFlags) {
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    if (pl.m_aoLightAnimation.GetData()!=NULL) {
      pl.m_aoLightAnimation.PlayAnim(iAnim, ulFlags);
    }
  };


  // Set weapon model for current weapon.
  void SetCurrentWeaponModel(void) {
    // WARNING !!! ---> Order of attachment must be the same with order in RenderWeaponModel()
    switch (m_iCurrentWeapon) {
      case WEAPON_NONE:
        break;
      case WEAPON_HOLSTERED:
        break;
      // knife
      case WEAPON_KNIFE: {
        SetComponents(this, m_moWeapon, MODEL_KNIFE, TEXTURE_HAND, 0, 0, 0);
        AddAttachmentToModel(this, m_moWeapon, KNIFEVIEWMODEL_ATTACHMENT_THEKNIFE, MODEL_KNIFEITEM, 
                             TEXTURE_KNIFEITEM, 0, 0, 0);
        m_moWeapon.PlayAnim(KNIFEVIEWMODEL_ANIM_IDLE, 0);
        break; }
      // axe
      case WEAPON_AXE: {
        SetComponents(this, m_moWeapon, MODEL_AXE, TEXTURE_HAND, 0, 0, 0);
        AddAttachmentToModel(this, m_moWeapon, AXEVIEWMODEL_ATTACHMENT_THEAXE, MODEL_AXEITEM, 
                             TEXTURE_KNIFEITEM, 0, 0, 0);
        m_moWeapon.PlayAnim(AXEVIEWMODEL_ANIM_IDLE, 0);
        break; }
      // pistol
      case WEAPON_PISTOL: {
        SetComponents(this, m_moWeapon, MODEL_PISTOL, TEXTURE_HAND, 0, 0, 0);
        AddAttachmentToModel(this, m_moWeapon, PISTOLVIEWMODEL_ATTACHMENT_THEPISTOL, MODEL_PISTOLITEM, TEXTURE_PISTOLITEM, 0, 0, 0);
        CModelObject &mo = m_moWeapon.GetAttachmentModel(PISTOLVIEWMODEL_ATTACHMENT_THEPISTOL)->amo_moModelObject;
        AddAttachmentToModel(this, mo, PISTOLITEM_ATTACHMENT_FLARE_MUZZLE, MODEL_FLARE01, TEXTURE_FLARE01, 0, 0, 0);
        m_moWeapon.PlayAnim(PISTOLVIEWMODEL_ANIM_IDLE, 0);
        break; }
      // shotgun
      case WEAPON_SHOTGUN: {
        SetComponents(this, m_moWeapon, MODEL_SHOTGUN, TEXTURE_HAND, 0, 0, 0);
        AddAttachmentToModel(this, m_moWeapon, SHOTGUNVIEWMODEL_ATTACHMENT_SHOTGUN, MODEL_SHOTGUNITEM, TEXTURE_SHOTGUNITEM, 0, 0, 0);
        CModelObject &mo = m_moWeapon.GetAttachmentModel(SHOTGUNVIEWMODEL_ATTACHMENT_SHOTGUN)->amo_moModelObject;
        AddAttachmentToModel(this, mo, SHOTGUNITEM_ATTACHMENT_FLARE_MUZZLE, MODEL_FLARE01, TEXTURE_FLARE01, 0, 0, 0);
        m_moWeapon.PlayAnim(SHOTGUNVIEWMODEL_ANIM_IDLE, 0);
        break; }
      // smg
      case WEAPON_SMG: {
        SetComponents(this, m_moWeapon, MODEL_SMG, TEXTURE_HAND, 0, 0, 0);
        AddAttachmentToModel(this, m_moWeapon, SMGVIEWMODEL_ATTACHMENT_THESMG, MODEL_SMGITEM, TEXTURE_SMGITEM, 0, 0, 0);
        CModelObject &mo = m_moWeapon.GetAttachmentModel(SMGVIEWMODEL_ATTACHMENT_THESMG)->amo_moModelObject;
        AddAttachmentToModel(this, mo, SMGITEM_ATTACHMENT_FLARE_MUZZLE, MODEL_FLARE01, TEXTURE_FLARE01, 0, 0, 0);
        m_moWeapon.PlayAnim(SMGVIEWMODEL_ANIM_IDLE, 0);
        break; }
      // pipe
      case WEAPON_PIPE: {
        SetComponents(this, m_moWeapon, MODEL_PIPE, TEXTURE_HAND, 0, 0, 0);
        AddAttachmentToModel(this, m_moWeapon, METALPIPEVIEWMODEL_ATTACHMENT_THEPIPE, MODEL_PIPEITEM, 
                             TEXTURE_PIPEITEM, TEX_REFL_LIGHTMETAL01, TEX_SPEC_MEDIUM, 0);
        m_moWeapon.PlayAnim(METALPIPEVIEWMODEL_ANIM_IDLE, 0);
        break; }
      // strong pistol
      case WEAPON_STRONGPISTOL: {
        SetComponents(this, m_moWeapon, MODEL_STRONGPISTOL, TEXTURE_HAND, 0, 0, 0);
        AddAttachmentToModel(this, m_moWeapon, STRONGPISTOLVIEWMODEL_ATTACHMENT_THEPISTOL, MODEL_STRONGPISTOLITEM, 
                             TEXTURE_STRONGPISTOLITEM, 0, 0, 0);
        CModelObject &mo = m_moWeapon.GetAttachmentModel(STRONGPISTOLVIEWMODEL_ATTACHMENT_THEPISTOL)->amo_moModelObject;
        AddAttachmentToModel(this, mo, STRONGPISTOLITEM_ATTACHMENT_FLARE_MUZZLE, MODEL_FLARE01, TEXTURE_FLARE01, 0, 0, 0);
        m_moWeapon.PlayAnim(STRONGPISTOLVIEWMODEL_ANIM_IDLE, 0);
        break; }
    }
  };

  /*
   *  >>>---  SUPPORT (COMMON) FUNCTIONS  ---<<<
   */

  // calc weapon position for 3rd person view
  void CalcWeaponPosition3rdPersonView(FLOAT3D vPos, CPlacement3D &plPos, BOOL bResetZ) {
    plPos.pl_OrientationAngle = ANGLE3D(0, 0, 0);
    // weapon handle
      plPos.pl_PositionVector = FLOAT3D( wpn_fX[m_iCurrentWeapon], wpn_fY[m_iCurrentWeapon],
                                         wpn_fZ[m_iCurrentWeapon]);

    // weapon offset
    plPos.RelativeToAbsoluteSmooth(CPlacement3D(vPos, ANGLE3D(0, 0, 0)));
    
    plPos.pl_PositionVector(1) *= SinFast(wpn_fFOV[m_iCurrentWeapon]/2) / SinFast(90.0f/2);
    plPos.pl_PositionVector(2) *= SinFast(wpn_fFOV[m_iCurrentWeapon]/2) / SinFast(90.0f/2);
    plPos.pl_PositionVector(3) *= SinFast(wpn_fFOV[m_iCurrentWeapon]/2) / SinFast(90.0f/2);

    if (bResetZ) {
      plPos.pl_PositionVector(3) = 0.0f;
    }

    // player view and absolute position
    CPlacement3D plView = ((CPlayer &)*m_penPlayer).en_plViewpoint;
    plView.pl_PositionVector(2)= 1.25118f;
    plPos.RelativeToAbsoluteSmooth(plView);
    plPos.RelativeToAbsoluteSmooth(m_penPlayer->GetPlacement());
  };

  // calc weapon position
  void CalcWeaponPosition(FLOAT3D vPos, CPlacement3D &plPos, BOOL bResetZ) {
    plPos.pl_OrientationAngle = ANGLE3D(0, 0, 0);
    // weapon handle
    plPos.pl_PositionVector = FLOAT3D( wpn_fX[m_iCurrentWeapon], wpn_fY[m_iCurrentWeapon],
                                       wpn_fZ[m_iCurrentWeapon]);
    
    plPos.RelativeToAbsoluteSmooth(CPlacement3D(vPos, ANGLE3D(0, 0, 0)));

    plPos.pl_PositionVector(1) *= SinFast(wpn_fFOV[m_iCurrentWeapon]/2) / SinFast(90.0f/2);
    plPos.pl_PositionVector(2) *= SinFast(wpn_fFOV[m_iCurrentWeapon]/2) / SinFast(90.0f/2);
    plPos.pl_PositionVector(3) *= SinFast(wpn_fFOV[m_iCurrentWeapon]/2) / SinFast(90.0f/2);

    if (bResetZ) {
      plPos.pl_PositionVector(3) = 0.0f;
    }

    // player view and absolute position
    CPlacement3D plView = ((CPlayer &)*m_penPlayer).en_plViewpoint;
    plView.pl_PositionVector(2)+= ((CPlayerAnimator&)*((CPlayer &)*m_penPlayer).m_penAnimator).
      m_fEyesYOffset;
    plPos.RelativeToAbsoluteSmooth(plView);
    plPos.RelativeToAbsoluteSmooth(m_penPlayer->GetPlacement());
  };

  // calc lerped weapon position
  void CalcLerpedWeaponPosition(FLOAT3D vPos, CPlacement3D &plPos, BOOL bResetZ)
  {
    plPos.pl_OrientationAngle = ANGLE3D(0, 0, 0);
    // weapon handle

    plPos.pl_PositionVector = FLOAT3D( wpn_fX[m_iCurrentWeapon], wpn_fY[m_iCurrentWeapon],
                                       wpn_fZ[m_iCurrentWeapon]);

    plPos.RelativeToAbsoluteSmooth(CPlacement3D(vPos, ANGLE3D(0, 0, 0)));

    plPos.pl_PositionVector(1) *= SinFast(wpn_fFOV[m_iCurrentWeapon]/2) / SinFast(90.0f/2);
    plPos.pl_PositionVector(2) *= SinFast(wpn_fFOV[m_iCurrentWeapon]/2) / SinFast(90.0f/2);
    plPos.pl_PositionVector(3) *= SinFast(wpn_fFOV[m_iCurrentWeapon]/2) / SinFast(90.0f/2);

    if (bResetZ) {
      plPos.pl_PositionVector(3) = 0.0f;
    }

    // player view and absolute position
    CPlacement3D plRes;
    GetPlayer()->GetLerpedWeaponPosition( plPos.pl_PositionVector, plRes);
    plPos=plRes;
  };

  // calc weapon position
  void CalcWeaponPositionImprecise (FLOAT3D vPos, CPlacement3D &plPos, BOOL bResetZ, FLOAT fImprecissionAngle) {
    plPos.pl_OrientationAngle = ANGLE3D((FRnd()-0.5f)*fImprecissionAngle, (FRnd()-0.5f)*fImprecissionAngle, 0);
    // weapon handle

    plPos.pl_PositionVector = FLOAT3D( wpn_fX[m_iCurrentWeapon], wpn_fY[m_iCurrentWeapon],
                                       wpn_fZ[m_iCurrentWeapon]);

    plPos.RelativeToAbsoluteSmooth(CPlacement3D(vPos, ANGLE3D(0, 0, 0)));

    plPos.pl_PositionVector(1) *= SinFast(wpn_fFOV[m_iCurrentWeapon]/2) / SinFast(90.0f/2);
    plPos.pl_PositionVector(2) *= SinFast(wpn_fFOV[m_iCurrentWeapon]/2) / SinFast(90.0f/2);
    plPos.pl_PositionVector(3) *= SinFast(wpn_fFOV[m_iCurrentWeapon]/2) / SinFast(90.0f/2);

    if (bResetZ) {
      plPos.pl_PositionVector(3) = 0.0f;
    }

    // player view and absolute position
    CPlacement3D plView = ((CPlayer &)*m_penPlayer).en_plViewpoint;
    plView.pl_PositionVector(2)+= ((CPlayerAnimator&)*((CPlayer &)*m_penPlayer).m_penAnimator).
      m_fEyesYOffset;
    plPos.RelativeToAbsoluteSmooth(plView);
    plPos.RelativeToAbsoluteSmooth(m_penPlayer->GetPlacement());
  };

  // setup 3D sound parameters
  void Setup3DSoundParameters(void) {
    CPlayer &pl = (CPlayer&)*m_penPlayer;

    // initialize sound 3D parameters
    pl.m_soWeapon0.Set3DParameters(50.0f, 5.0f, 1.0f, 1.0f);
    pl.m_soWeapon1.Set3DParameters(50.0f, 5.0f, 1.0f, 1.0f);
    pl.m_soWeapon2.Set3DParameters(50.0f, 5.0f, 1.0f, 1.0f);
    pl.m_soWeapon3.Set3DParameters(50.0f, 5.0f, 1.0f, 1.0f);
    pl.m_soWeaponAmbient.Set3DParameters(30.0f, 3.0f, 0.0f, 1.0f);
  };


  /*
   *  >>>---  FIRE FUNCTIONS  ---<<<
   */

  // cut in front of you with knife
  BOOL CutWithKnife(FLOAT fX, FLOAT fY, FLOAT fRange, FLOAT fWide, FLOAT fThickness, FLOAT fDamage, enum DamageType dmtType) 
  {
    // knife start position
    CPlacement3D plKnife;
    CalcWeaponPosition(FLOAT3D(fX, fY, 0), plKnife, TRUE);

    // create a set of rays to test
    const FLOAT3D &vBase = plKnife.pl_PositionVector;
    FLOATmatrix3D m;
    MakeRotationMatrixFast(m, plKnife.pl_OrientationAngle);
    FLOAT3D vRight = m.GetColumn(1)*fWide;
    FLOAT3D vUp    = m.GetColumn(2)*fWide;
    FLOAT3D vFront = -m.GetColumn(3)*fRange;

    FLOAT3D vDest[5];
    vDest[0] = vBase+vFront;
    vDest[1] = vBase+vFront+vUp;
    vDest[2] = vBase+vFront-vUp;
    vDest[3] = vBase+vFront+vRight;
    vDest[4] = vBase+vFront-vRight;

    CEntity *penClosest = NULL;
    FLOAT fDistance = UpperLimit(0.0f);
    FLOAT3D vHit;
    FLOAT3D vDir;
    // for each ray
    for (INDEX i=0; i<5; i++) {
      // cast a ray to find if any model
      CCastRay crRay( m_penPlayer, vBase, vDest[i]);
      crRay.cr_bHitTranslucentPortals = FALSE;
      crRay.cr_fTestR = fThickness;
      crRay.cr_ttHitModels = CCastRay::TT_COLLISIONBOX;
      GetWorld()->CastRay(crRay);
      
      // if hit something
      if (crRay.cr_penHit!=NULL /*&& crRay.cr_penHit->GetRenderType()==RT_MODEL*/ && crRay.cr_fHitDistance<fDistance) {
        penClosest = crRay.cr_penHit;
        fDistance = crRay.cr_fHitDistance;
        vDir = vDest[i]-vBase;
        vHit = crRay.cr_vHit;
        
        if (i==0) {
          if(crRay.cr_penHit->GetRenderType()==RT_BRUSH)
          {
            m_bMeleeHitBrush= TRUE;
            INDEX iSurfaceType=crRay.cr_pbpoBrushPolygon->bpo_bppProperties.bpp_ubSurfaceType;
            EffectParticlesType eptType=GetParticleEffectTypeForSurface(iSurfaceType);
            
            FLOAT3D vNormal=crRay.cr_pbpoBrushPolygon->bpo_pbplPlane->bpl_plAbsolute;
            FLOAT3D vReflected = vDir-vNormal*(2.0f*(vNormal%vDir));
            ((CPlayer&)*m_penPlayer).AddBulletSpray( vBase+vFront, eptType, vReflected);
          }
          else if(crRay.cr_penHit->GetRenderType()==RT_MODEL)
          {
            BOOL bRender=TRUE;
            FLOAT3D vSpillDir=-((CPlayer&)*m_penPlayer).en_vGravityDir*0.5f;
            SprayParticlesType sptType=SPT_NONE;
            COLOR colParticles=C_WHITE|CT_OPAQUE;
            FLOAT fPower=2.0f;
            if( IsOfClass(crRay.cr_penHit, "ModelHolder2"))
            {
              m_bMeleeHitModel = TRUE;
              bRender=FALSE;
              CModelDestruction *penDestruction = ((CModelHolder2&)*crRay.cr_penHit).GetDestruction();
              if( penDestruction!=NULL)
              {
                bRender=TRUE;
                sptType= penDestruction->m_sptType;
              }
              CModelHolder2 *pmh2=(CModelHolder2*)crRay.cr_penHit;
              colParticles=pmh2->m_colBurning;
            }
            else if( IsDerivedFromClass(crRay.cr_penHit, "Enemy Base"))
            {
              m_bMeleeHitEnemy = TRUE;
            }
            FLOATaabbox3D boxCutted=FLOATaabbox3D(FLOAT3D(0,0,0),FLOAT3D(1,1,1));
            if(bRender)
            {
              crRay.cr_penHit->en_pmoModelObject->GetCurrentFrameBBox( boxCutted);
              ((CPlayer&)*m_penPlayer).AddGoreSpray( vBase+vFront, vHit, sptType,
                vSpillDir, boxCutted, fPower, colParticles);
            }
          }
          // don't search any more
          break;
        }        
      }
    }
    // if any model hit
    if (penClosest!=NULL) {
      // in deathmatches check for backstab
      if (!(GetSP()->sp_bCooperative) && IsOfClass(penClosest, "Player")) {
        FLOAT3D vToTarget = penClosest->GetPlacement().pl_PositionVector - m_penPlayer->GetPlacement().pl_PositionVector;
        FLOAT3D vTargetHeading = FLOAT3D(0.0, 0.0, -1.0f)*penClosest->GetRotationMatrix();
        vToTarget.Normalize(); vTargetHeading.Normalize();
        if (vToTarget%vTargetHeading>0.64279) //CosFast(50.0f)
        {
          PrintCenterMessage(this, m_penPlayer, TRANS("Backstab!"), 4.0f, MSS_NONE, FNT_NORMAL, 0.5f, 0.85f);
          fDamage *= 4.0f;
        }
      }
      const FLOAT fDamageMul = GetSeriousDamageMultiplier(m_penPlayer);
      InflictDirectDamage(penClosest, m_penPlayer, dmtType, fDamage*fDamageMul, vHit, vDir, DBPT_GENERIC);
      return TRUE;
    }
    return FALSE;
  };

  // prepare Bullet
  void PrepareBullet(FLOAT fX, FLOAT fY, FLOAT fDamage) {
    // bullet start position
    CalcWeaponPosition(FLOAT3D(fX, fY, 0), plBullet, TRUE);
    // create bullet
    penBullet = CreateEntity(plBullet, CLASS_BULLET);
    // init bullet
    EBulletInit eInit;
    eInit.penOwner = m_penPlayer;
    eInit.fDamage = fDamage;
    penBullet->Initialize(eInit);
  };

  // fire one bullet
  void FireOneBullet(FLOAT fX, FLOAT fY, FLOAT fRange, FLOAT fDamage, enum DamageType dmtType) {
    PrepareBullet(fX, fY, fDamage);
    ((CBullet&)*penBullet).CalcTarget(fRange);
    ((CBullet&)*penBullet).m_fBulletSize = 0.1f;
    ((CBullet&)*penBullet).m_EdtDamage = dmtType;
    // launch bullet
    ((CBullet&)*penBullet).LaunchBullet(TRUE, FALSE, TRUE);
    ((CBullet&)*penBullet).DestroyBullet();
  };

  // fire bullets (x offset is used for double shotgun)
  void FireBullets(FLOAT fX, FLOAT fY, FLOAT fRange, FLOAT fDamage, INDEX iBullets,
    FLOAT *afPositions, FLOAT fStretch, FLOAT fJitter, enum DamageType dmtType) {
    PrepareBullet(fX, fY, fDamage);
    ((CBullet&)*penBullet).CalcTarget(fRange);
    ((CBullet&)*penBullet).m_fBulletSize = GetSP()->sp_bCooperative ? 0.1f : 0.3f;
    ((CBullet&)*penBullet).m_EdtDamage = dmtType;
    // launch slugs
    INDEX iSlug;
    for (iSlug=0; iSlug<iBullets; iSlug++) {
      // launch bullet
      ((CBullet&)*penBullet).CalcJitterTargetFixed(
        afPositions[iSlug*2+0]*fRange*fStretch, afPositions[iSlug*2+1]*fRange*fStretch,
        fJitter*fRange*fStretch);
      ((CBullet&)*penBullet).LaunchBullet(iSlug<2, FALSE, TRUE);
    }
    ((CBullet&)*penBullet).DestroyBullet();
  }

  // fire one bullet for machine guns (tommygun and minigun)
  void FireMachineBullet(FLOAT fX, FLOAT fY, FLOAT fRange, FLOAT fDamage, 
    FLOAT fJitter, FLOAT fBulletSize, enum DamageType dmtType)
  {
    fJitter*=fRange;  // jitter relative to range
    PrepareBullet(fX, fY, fDamage);
    ((CBullet&)*penBullet).CalcTarget(fRange);
    ((CBullet&)*penBullet).m_fBulletSize = fBulletSize;
    ((CBullet&)*penBullet).m_EdtDamage = dmtType;
    ((CBullet&)*penBullet).CalcJitterTarget(fJitter);
    ((CBullet&)*penBullet).LaunchBullet(TRUE, FALSE, TRUE);
    ((CBullet&)*penBullet).DestroyBullet();
  }


  // weapon sound when firing
  void SpawnRangeSound( FLOAT fRange)
  {
    if( _pTimer->CurrentTick()>m_tmRangeSoundSpawned+0.5f) {
      m_tmRangeSoundSpawned = _pTimer->CurrentTick();
      ::SpawnRangeSound( m_penPlayer, m_penPlayer, SNDT_PLAYER, fRange);
    }
  };


  /*
   *  >>>---  WEAPON INTERFACE FUNCTIONS  ---<<<
   */
  // clear weapons
  void ClearWeapons(void) {
    // give/take weapons
    m_iAvailableWeapons = 0x01;
    m_ulMeleeWeapons = 0x00;
    m_ulSmallGuns = 0x00;
    m_ulBigGuns = 0x00;
    m_iPistolBullets = 0;
    m_iShotgunShells = 0;
    m_iSMGBullets = 0;
    m_iStrongPistolBullets = 0;
    m_iBullets = 0;
    m_iShells = 0;
    m_iMediumBullets = 0;
    m_iStrongBullets = 0;
  };

  void ResetWeaponMovingOffset(void)
  {
    // reset weapon draw offset
    m_fWeaponDrawPowerOld = m_fWeaponDrawPower = m_tmDrawStartTime = 0;
  }

  // initialize weapons
  void InitializeWeapons(INDEX iGiveWeapons, INDEX iTakeWeapons, INDEX iTakeAmmo, FLOAT fMaxAmmoRatio)
  {
    ResetWeaponMovingOffset();
    // remember old weapons
    ULONG ulOldWeapons = m_iAvailableWeapons;
    // give/take weapons
    m_iAvailableWeapons &= ~iTakeWeapons;
    m_iAvailableWeapons |= 0x01|iGiveWeapons;
    m_iAvailableWeapons &= WEAPONS_ALLAVAILABLEMASK;
    // m_iAvailableWeapons &= ~WEAPONS_DISABLEDMASK;
    // find which weapons are new
    ULONG ulNewWeapons = m_iAvailableWeapons&~ulOldWeapons;
    // for each new weapon
    for(INDEX iWeapon=WEAPON_HOLSTERED; iWeapon<WEAPON_LAST; iWeapon++) {
      if ( ulNewWeapons & (1<<(iWeapon-1)) ) {
        // add default amount of ammo
        AddDefaultAmmoForWeapon(iWeapon, fMaxAmmoRatio);
      }
    }

    // take away ammo
    if( iTakeAmmo & (1<<AMMO_BULLETS))                {m_iBullets    = 0;}
    if( iTakeAmmo & (1<<AMMO_SHELLS))                 {m_iShells     = 0;}
    if( iTakeAmmo & (1<<AMMO_MEDIUM_BULLETS))         {m_iMediumBullets    = 0;}
    if( iTakeAmmo & (1<<AMMO_STRONG_BULLETS))         {m_iStrongBullets    = 0;}
    if( iTakeAmmo & (1<<AMMO_PISTOL_BULLETS))         {m_iPistolBullets    = 0;}
    if( iTakeAmmo & (1<<AMMO_SHOTGUN_SHELLS))         {m_iShotgunShells     = 0;}
    if( iTakeAmmo & (1<<AMMO_SMG_BULLETS))            {m_iSMGBullets    = 0;}
    if( iTakeAmmo & (1<<AMMO_STRONG_PISTOL_BULLETS))  {m_iStrongPistolBullets    = 0;}

    // precache eventual new weapons
    Precache();

    // select best weapon
    SelectNewWeapon();
    m_iCurrentWeapon=m_iWantedWeapon;
    wpn_iCurrent = m_iCurrentWeapon;
    m_bChangeWeapon = FALSE;
    // set weapon model for current weapon
    SetCurrentWeaponModel();
    PlayDefaultAnim();
    // remove weapon attachment
    ((CPlayerAnimator&)*((CPlayer&)*m_penPlayer).m_penAnimator).RemoveWeapon();
    // add weapon attachment
    ((CPlayerAnimator&)*((CPlayer&)*m_penPlayer).m_penAnimator).SetWeapon();
  };

  // get weapon ammo
  INDEX GetAmmo(void)
  {
    switch (m_iCurrentWeapon) {
      case WEAPON_HOLSTERED:       return 0;
      case WEAPON_KNIFE:           return 0;
      case WEAPON_AXE:             return 0;
      case WEAPON_PISTOL:          return m_iBullets;
      case WEAPON_SHOTGUN:         return m_iShells;
      case WEAPON_SMG:             return m_iMediumBullets;
      case WEAPON_PIPE:            return 0;
      case WEAPON_STRONGPISTOL:    return m_iStrongBullets;
    }
    return 0;
  };

  INDEX GetInsertedAmmo(void)
  {
    switch (m_iCurrentWeapon) {
      case WEAPON_HOLSTERED:       return 0;
      case WEAPON_KNIFE:           return 0;
      case WEAPON_AXE:             return 0;
      case WEAPON_PISTOL:          return m_iPistolBullets;
      case WEAPON_SHOTGUN:         return m_iShotgunShells;
      case WEAPON_SMG:             return m_iSMGBullets;
      case WEAPON_PIPE:            return 0;
      case WEAPON_STRONGPISTOL:    return m_iStrongPistolBullets;
    }
    return 0;
  };

  // get weapon max ammo (capacity)
  INDEX GetMaxAmmo(void)
  {
    switch (m_iCurrentWeapon) {
      case WEAPON_HOLSTERED:       return 0;
      case WEAPON_KNIFE:           return 0;
      case WEAPON_AXE:             return 0;
      case WEAPON_PISTOL:          return m_iMaxBullets;
      case WEAPON_SHOTGUN:         return m_iMaxShells;
      case WEAPON_SMG:             return m_iMaxMediumBullets;
      case WEAPON_PIPE:            return 0;
      case WEAPON_STRONGPISTOL:    return m_iMaxStrongBullets;
    }
    return 0;
  };

  INDEX GetMaxInsertedAmmo(void)
  {
    switch (m_iCurrentWeapon) {
      case WEAPON_HOLSTERED:       return 0;
      case WEAPON_KNIFE:           return 0;
      case WEAPON_AXE:             return 0;
      case WEAPON_PISTOL:          return m_iMaxPistolBullets;
      case WEAPON_SHOTGUN:         return m_iMaxShotgunShells;
      case WEAPON_SMG:             return m_iMaxSMGBullets;
      case WEAPON_PIPE:            return 0;
      case WEAPON_STRONGPISTOL:    return m_iMaxStrongPistolBullets;
    }
    return 0;
  };

  void CheatOpen(void)
  {
    if (IsOfClass(m_penRayHit, "Moving Brush")) {
      m_penRayHit->SendEvent(ETrigger());
    }
  }

  // cheat give all
  void CheatGiveAll(void) {
    // all weapons
    m_iAvailableWeapons = WEAPONS_ALLAVAILABLEMASK;
    // m_iAvailableWeapons &= ~WEAPONS_DISABLEDMASK;
    m_ulMeleeWeapons = (1 << WEAPON_KNIFE|WEAPON_AXE|WEAPON_PIPE);
    m_ulSmallGuns = (1 << WEAPON_PISTOL|WEAPON_STRONGPISTOL);
    m_ulBigGuns = (1 << WEAPON_SHOTGUN|WEAPON_SMG);
    // ammo for all weapons
    m_iBullets = m_iMaxBullets;
    m_iShells = m_iMaxShells;
    m_iMediumBullets = m_iMaxMediumBullets;
    m_iStrongBullets = m_iMaxStrongBullets;
    m_iPistolBullets = m_iMaxPistolBullets;
    m_iShotgunShells = m_iMaxShotgunShells;
    m_iSMGBullets = m_iMaxSMGBullets;
    m_iStrongPistolBullets = m_iMaxStrongPistolBullets;
    Precache();
  };

  // add a given amount of mana to the player
  void AddManaToPlayer(INDEX iMana)
  {
    ((CPlayer&)*m_penPlayer).m_iMana += iMana;
    ((CPlayer&)*m_penPlayer).m_fPickedMana += iMana;
  }


  /*
   *  >>>---  RECEIVE FUNCTIONS  ---<<<
   */

  // clamp ammounts of all ammunition to maximum values
  void ClampAllAmmo(void)
  {
    m_iBullets       = ClampUp(m_iBullets,       m_iMaxBullets);
    m_iShells        = ClampUp(m_iShells,        m_iMaxShells);
    m_iMediumBullets = ClampUp(m_iMediumBullets, m_iMaxMediumBullets);
    m_iStrongBullets = ClampUp(m_iStrongBullets, m_iMaxStrongBullets);
    m_iPistolBullets = ClampUp(m_iPistolBullets, m_iMaxPistolBullets);
    m_iShotgunShells = ClampUp(m_iShotgunShells, m_iMaxShotgunShells);
    m_iSMGBullets    = ClampUp(m_iSMGBullets,    m_iMaxSMGBullets);
    m_iStrongPistolBullets = ClampUp(m_iStrongPistolBullets, m_iMaxStrongPistolBullets);
  }

  // add default ammount of ammunition when receiving a weapon
  void AddDefaultAmmoForWeapon(INDEX iWeapon, FLOAT fMaxAmmoRatio)
  {
    INDEX iAmmoPicked;
    INDEX iInsertedAmmoPicked;
    // add ammo
    switch (iWeapon) {
      // unlimited ammo
      case WEAPON_HOLSTERED:
      case WEAPON_KNIFE:
      case WEAPON_AXE:
      case WEAPON_PIPE:
        break;
      case WEAPON_PISTOL:
        iAmmoPicked = Max(10.0f, m_iMaxBullets*fMaxAmmoRatio);
        iInsertedAmmoPicked = Max(17.0f, m_iMaxPistolBullets*fMaxAmmoRatio);
        m_iBullets += iAmmoPicked;
        m_iPistolBullets += iInsertedAmmoPicked;
        AddManaToPlayer( iAmmoPicked*50.0f*MANA_AMMO);
        AddManaToPlayer( iInsertedAmmoPicked*50.0f*MANA_AMMO);
        break;
      case WEAPON_SHOTGUN:
        iAmmoPicked = Max(10.0f, m_iMaxShells*fMaxAmmoRatio);
        iInsertedAmmoPicked = Max(8.0f, m_iMaxShotgunShells*fMaxAmmoRatio);
        m_iShells += iAmmoPicked;
        m_iShotgunShells += iInsertedAmmoPicked;
        AddManaToPlayer( iAmmoPicked*50.0f*MANA_AMMO);
        AddManaToPlayer( iInsertedAmmoPicked*50.0f*MANA_AMMO);
        break;
      case WEAPON_SMG:
        iAmmoPicked = Max(10.0f, m_iMaxMediumBullets*fMaxAmmoRatio);
        iInsertedAmmoPicked = Max(30.0f, m_iMaxSMGBullets*fMaxAmmoRatio);
        m_iMediumBullets += iAmmoPicked;
        m_iSMGBullets += iInsertedAmmoPicked;
        AddManaToPlayer( iAmmoPicked*50.0f*MANA_AMMO);
        AddManaToPlayer( iInsertedAmmoPicked*50.0f*MANA_AMMO);
        break;
      case WEAPON_STRONGPISTOL:
        iAmmoPicked = Max(7.0f, m_iMaxStrongBullets*fMaxAmmoRatio);
        iInsertedAmmoPicked = Max(7.0f, m_iMaxStrongPistolBullets*fMaxAmmoRatio);
        m_iStrongBullets += iAmmoPicked;
        m_iStrongPistolBullets += iInsertedAmmoPicked;
        AddManaToPlayer( iAmmoPicked*50.0f*MANA_AMMO);
        AddManaToPlayer( iInsertedAmmoPicked*50.0f*MANA_AMMO);
        break;
      // error
      default:
      ASSERTALWAYS("Unknown weapon type");
        break;
    }

    // make sure we don't have more ammo than maximum
    ClampAllAmmo();
  }

  // drop current weapon (in deathmatch)
  void DropWeapon(void) 
  {
    if(m_iCurrentWeapon==WEAPON_HOLSTERED)
    {
      return;
    }

    CEntityPointer penWeapon = CreateEntity(GetPlayer()->GetPlacement(), CLASS_WEAPONITEM);
    CWeaponItem *pwi = (CWeaponItem*)&*penWeapon;

    WeaponItemType wit = WIT_PISTOL;
    switch (m_iCurrentWeapon) {
      default:
        ASSERT(FALSE);
      case WEAPON_KNIFE: wit = WIT_KNIFE; break;
      case WEAPON_AXE: wit = WIT_AXE; break;
      case WEAPON_PISTOL: wit = WIT_PISTOL; break;
      case WEAPON_SHOTGUN: wit = WIT_SHOTGUN; break;
      case WEAPON_SMG: wit = WIT_SMG; break;
      case WEAPON_PIPE: wit = WIT_PIPE; break;
      case WEAPON_STRONGPISTOL: wit = WIT_STRONGPISTOL; break;
    }

    switch(wit) {
      default:
        ASSERT(FALSE);
      case WIT_KNIFE: m_ulMeleeWeapons &= ~(1 << WEAPON_KNIFE); break;
      case WIT_AXE: m_ulMeleeWeapons &= ~(1 << WEAPON_AXE); break;
      case WIT_PISTOL: m_ulSmallGuns &= ~(1 << WEAPON_PISTOL); break;
      case WIT_SHOTGUN: m_ulBigGuns &= ~(1 << WEAPON_SHOTGUN); break;
      case WIT_SMG: m_ulBigGuns &= ~(1 << WEAPON_SMG); break;
      case WIT_PIPE: m_ulMeleeWeapons &= ~(1 << WEAPON_PIPE); break;
      case WIT_STRONGPISTOL: m_ulSmallGuns &= ~(1 << WEAPON_STRONGPISTOL); break;
    }


    pwi->m_EwitType = wit;
    pwi->m_bDropped = TRUE;
    pwi->m_fCustomRespawnTime = 1024.0f;
    pwi->CEntity::Initialize();
    
    const FLOATmatrix3D &m = GetPlayer()->GetRotationMatrix();
    FLOAT3D vSpeed = FLOAT3D(7.0f, 10.0f, -9.0f);
    pwi->GiveImpulseTranslationAbsolute(vSpeed*m);
  }

  // receive weapon
  BOOL ReceiveWeapon(const CEntityEvent &ee) {
    ASSERT(ee.ee_slEvent == EVENTCODE_EWeaponItem);
    
    EWeaponItem &Ewi = (EWeaponItem&)ee;
    INDEX wit = Ewi.iWeapon;
    switch (Ewi.iWeapon) {
      case WIT_KNIFE: Ewi.iWeapon = WEAPON_KNIFE; break;
      case WIT_PISTOL: Ewi.iWeapon = WEAPON_PISTOL; break;
      case WIT_AXE: Ewi.iWeapon = WEAPON_AXE; break;
      case WIT_SHOTGUN: Ewi.iWeapon = WEAPON_SHOTGUN; break;
      case WIT_SMG: Ewi.iWeapon = WEAPON_SMG; break;
      case WIT_PIPE: Ewi.iWeapon = WEAPON_PIPE; break;
      case WIT_STRONGPISTOL: Ewi.iWeapon = WEAPON_STRONGPISTOL; break;
      default:
        ASSERTALWAYS("Unknown weapon type");
    }

    if((m_ulMeleeWeapons != 0x00) && (m_ulSmallGuns != 0x00) && (m_ulBigGuns != 0x00))
    {
      return FALSE;
    }

    switch(wit) {
      default:
        ASSERT(FALSE);
      case WIT_KNIFE: m_ulMeleeWeapons |= (1 << WEAPON_KNIFE); break;
      case WIT_AXE: m_ulMeleeWeapons |= (1 << WEAPON_AXE); break;
      case WIT_PISTOL: m_ulSmallGuns |= (1 << WEAPON_PISTOL); break;
      case WIT_SHOTGUN: m_ulBigGuns |= (1 << WEAPON_SHOTGUN); break;
      case WIT_SMG: m_ulBigGuns |= (1 << WEAPON_SMG); break;
      case WIT_PIPE: m_ulMeleeWeapons |= (1 << WEAPON_PIPE); break;
      case WIT_STRONGPISTOL: m_ulSmallGuns |= (1 << WEAPON_STRONGPISTOL); break;
    }

    ULONG ulOldWeapons = m_iAvailableWeapons;
    m_iAvailableWeapons |= 1<<(Ewi.iWeapon-1);

    // precache eventual new weapons
    Precache();

    CTFileName fnmMsg;
    switch (wit) {
      case WIT_KNIFE:            
        ((CPlayer&)*m_penPlayer).ItemPicked(TRANS("Old Knife"), 0);
        fnmMsg = CTFILENAME("Data\\Messages\\Weapons\\Knife.txt"); 
        break;
      case WIT_PISTOL:            
        ((CPlayer&)*m_penPlayer).ItemPicked(TRANS("9mm Pistol"), 0);
        fnmMsg = CTFILENAME("Data\\Messages\\Weapons\\Pistol.txt"); 
        break;
      case WIT_AXE:            
        ((CPlayer&)*m_penPlayer).ItemPicked(TRANS("Old Axe"), 0);
        fnmMsg = CTFILENAME("Data\\Messages\\Weapons\\Axe.txt"); 
        break;
      case WIT_SHOTGUN:            
        ((CPlayer&)*m_penPlayer).ItemPicked(TRANS("12 Gauge Shotgun"), 0);
        fnmMsg = CTFILENAME("Data\\Messages\\Weapons\\Shotgun.txt"); 
        break;
      case WIT_SMG:            
        ((CPlayer&)*m_penPlayer).ItemPicked(TRANS("9mm Submachine Gun"), 0);
        fnmMsg = CTFILENAME("Data\\Messages\\Weapons\\SMG.txt"); 
        break;
      case WIT_PIPE:            
        ((CPlayer&)*m_penPlayer).ItemPicked(TRANS("Metal Pipe"), 0);
        fnmMsg = CTFILENAME("Data\\Messages\\Weapons\\Pipe.txt"); 
        break;
      case WIT_STRONGPISTOL:            
        ((CPlayer&)*m_penPlayer).ItemPicked(TRANS("High-Caliber Pistol"), 0);
        fnmMsg = CTFILENAME("Data\\Messages\\Weapons\\StrongPistol.txt"); 
        break;
      default:
        ASSERTALWAYS("Unknown weapon type");
    }
    // send computer message
    if (GetSP()->sp_bCooperative) {
      EComputerMessage eMsg;
      eMsg.fnmMessage = fnmMsg;
      m_penPlayer->SendEvent(eMsg);
    }

    // must be -1 for default (still have to implement dropping weapons in deathmatch !!!!)
    ASSERT(Ewi.iAmmo==-1);
    // add the ammunition
    if(Ewi.bDropped == FALSE) {
      AddDefaultAmmoForWeapon(Ewi.iWeapon, 0);
    } else {
      return TRUE;
    }
    

    // if this weapon should be auto selected
    BOOL bAutoSelect = FALSE;
    INDEX iSelectionSetting = GetPlayer()->GetSettings()->ps_iWeaponAutoSelect;
    if (iSelectionSetting==PS_WAS_ALL) {
      bAutoSelect = TRUE;
    } else if (iSelectionSetting==PS_WAS_ONLYNEW) {
      if (m_iAvailableWeapons&~ulOldWeapons) {
        bAutoSelect = TRUE;
      }
    } else if (iSelectionSetting==PS_WAS_BETTER) {
      if (FindRemapedPos(m_iCurrentWeapon)<FindRemapedPos((WeaponType)Ewi.iWeapon)) {
        bAutoSelect = TRUE;
      }
    }
    if (bAutoSelect) {
      // select it
      if (WeaponSelectOk((WeaponType)Ewi.iWeapon)) {
        SendEvent(EBegin());
      }
    }

    return TRUE;
  };

  // receive ammo
  BOOL ReceiveAmmo(const CEntityEvent &ee) {
    ASSERT(ee.ee_slEvent == EVENTCODE_EAmmoItem);

    // if infinite ammo is on
    if (GetSP()->sp_bInfiniteAmmo) {
      // pick all items anyway (items that exist in this mode are only those that
      // trigger something when picked - so they must be picked)
      return TRUE;
    }

    
    EAmmoItem &Eai = (EAmmoItem&)ee;
    // add ammo
     switch (Eai.EaitType) {
      // shells
      case AIT_BULLETS:
        if (m_iBullets>=m_iMaxBullets) { m_iBullets = m_iMaxBullets; return FALSE; }
        m_iBullets += Eai.iQuantity;
        ((CPlayer&)*m_penPlayer).ItemPicked(TRANS("Bullets"), Eai.iQuantity);
        AddManaToPlayer(Eai.iQuantity*AV_BULLETS*MANA_AMMO);
        break;
      case AIT_SHELLS:
        if (m_iShells>=m_iMaxShells) { m_iShells = m_iMaxShells; return FALSE; }
        m_iShells += Eai.iQuantity;
        ((CPlayer&)*m_penPlayer).ItemPicked(TRANS("Shells"), Eai.iQuantity);
        AddManaToPlayer(Eai.iQuantity*AV_SHELLS*MANA_AMMO);
        break;
      case AIT_MEDIUM_BULLETS:
        if (m_iMediumBullets>=m_iMaxMediumBullets) { m_iMediumBullets = m_iMaxMediumBullets; return FALSE; }
        m_iMediumBullets += Eai.iQuantity;
        ((CPlayer&)*m_penPlayer).ItemPicked(TRANS("Medium Bullets"), Eai.iQuantity);
        AddManaToPlayer(Eai.iQuantity*AV_MEDIUM_BULLETS*MANA_AMMO);
        break;
      case AIT_STRONG_BULLETS:
        if (m_iStrongBullets>=m_iMaxStrongBullets) { m_iStrongBullets = m_iMaxStrongBullets; return FALSE; }
        m_iStrongBullets += Eai.iQuantity;
        ((CPlayer&)*m_penPlayer).ItemPicked(TRANS("Strong Bullets"), Eai.iQuantity);
        AddManaToPlayer(Eai.iQuantity*AV_STRONG_BULLETS*MANA_AMMO);
        break;
      default:
        ASSERTALWAYS("Unknown ammo type");
    }
    // make sure we don't have more ammo than maximum
    ClampAllAmmo();
    return TRUE;
  };

  /*
   *  >>>---  WEAPON CHANGE FUNCTIONS  ---<<<
   */
  // get weapon from selected number
  WeaponType GetStrongerWeapon(INDEX iWeapon) {
    switch(iWeapon) {
      case 0: return WEAPON_HOLSTERED;
      case 1: return WEAPON_AXE;
      case 2: return WEAPON_STRONGPISTOL;
      case 3: return WEAPON_SHOTGUN;
    }
    return WEAPON_NONE;
  };

  // get selected number for weapon
  INDEX GetSelectedWeapon(WeaponType EwtSelectedWeapon) {
    switch(EwtSelectedWeapon) {
      case WEAPON_HOLSTERED: return 0;
      case WEAPON_KNIFE: case WEAPON_AXE: case WEAPON_PIPE: return 1;
      case WEAPON_PISTOL: case WEAPON_STRONGPISTOL: return 2;
      case WEAPON_SHOTGUN: case WEAPON_SMG: return 3;
    }
    return 0;
  };

  // get secondary weapon from selected one
  WeaponType GetAltWeapon(WeaponType EwtWeapon) {
    switch (EwtWeapon) {
      case WEAPON_HOLSTERED: return WEAPON_HOLSTERED;
      case WEAPON_KNIFE: return WEAPON_AXE;
      case WEAPON_AXE: return WEAPON_KNIFE;
      case WEAPON_PISTOL: return WEAPON_STRONGPISTOL;
      case WEAPON_SHOTGUN: return WEAPON_SMG;
      case WEAPON_SMG: return WEAPON_SHOTGUN;
      case WEAPON_PIPE: return WEAPON_PIPE;
      case WEAPON_STRONGPISTOL: return WEAPON_PISTOL;
    }
    return WEAPON_NONE;
  };

  // select new weapon if possible
  BOOL WeaponSelectOk(WeaponType wtToTry)
  {
    // if player has weapon and has enough ammo
    if (((1<<(INDEX(wtToTry)-1))&m_iAvailableWeapons) ) {
      // if different weapon
      if (wtToTry!=m_iCurrentWeapon) {
        // initiate change
        //m_bHasAmmo = FALSE;
        m_iWantedWeapon = wtToTry;
        m_bChangeWeapon = TRUE;
      }
      // selection ok
      return TRUE;
    // if no weapon or not enough ammo
    } else {
      // selection not ok
      return FALSE;
    }
  }

  // select new weapon when no more ammo
  void SelectNewWeapon() 
  {
    switch (m_iCurrentWeapon) {
      case WEAPON_NONE: 
      case WEAPON_HOLSTERED: case WEAPON_KNIFE: case WEAPON_AXE: case WEAPON_PISTOL: case WEAPON_SHOTGUN: case WEAPON_SMG: case WEAPON_PIPE: case WEAPON_STRONGPISTOL:
        WeaponSelectOk(WEAPON_STRONGPISTOL)||
        WeaponSelectOk(WEAPON_PIPE)||
        WeaponSelectOk(WEAPON_SMG)||
        WeaponSelectOk(WEAPON_SHOTGUN)||
        WeaponSelectOk(WEAPON_PISTOL)||
        WeaponSelectOk(WEAPON_AXE)||
        WeaponSelectOk(WEAPON_KNIFE)||
        WeaponSelectOk(WEAPON_HOLSTERED);
        break;
      default:
        WeaponSelectOk(WEAPON_KNIFE);
        ASSERT(FALSE);
    }
  };

  // does weapon have ammo
  BOOL HasAmmo(WeaponType EwtWeapon) {
    switch (EwtWeapon) {
      case WEAPON_HOLSTERED: case WEAPON_KNIFE: case WEAPON_AXE: case WEAPON_PIPE: return TRUE;
      case WEAPON_PISTOL: return (m_iBullets>0);
      case WEAPON_SHOTGUN: return (m_iShells>0);
      case WEAPON_SMG: return (m_iMediumBullets>0);
      case WEAPON_STRONGPISTOL: return (m_iStrongBullets>0);
    }
    return FALSE;
  };

  // does weapon have inserted ammo
  BOOL HasInsertedAmmo(WeaponType EwtWeapon) {
    switch (EwtWeapon) {
      case WEAPON_HOLSTERED: case WEAPON_KNIFE: case WEAPON_AXE: case WEAPON_PIPE: return TRUE;
      case WEAPON_PISTOL: return (m_iPistolBullets>0);
      case WEAPON_SHOTGUN: return (m_iShotgunShells>0);
      case WEAPON_SMG: return (m_iSMGBullets>0);
      case WEAPON_STRONGPISTOL: return (m_iStrongPistolBullets>0);
    }
    return FALSE;
  };

  /*
   *  >>>---   DEFAULT ANIM   ---<<<
   */
  void PlayDefaultAnim(void) {
    switch(m_iCurrentWeapon) {
      case WEAPON_NONE: case WEAPON_HOLSTERED:
        break;
      case WEAPON_KNIFE:
        m_moWeapon.PlayAnim(KNIFEVIEWMODEL_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART|AOF_SMOOTHCHANGE);
        break;
      case WEAPON_AXE:
        m_moWeapon.PlayAnim(AXEVIEWMODEL_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART|AOF_SMOOTHCHANGE);
        break;
      case WEAPON_PISTOL:
        m_moWeapon.PlayAnim(PISTOLVIEWMODEL_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART|AOF_SMOOTHCHANGE);
        break;
      case WEAPON_SHOTGUN:
        m_moWeapon.PlayAnim(SHOTGUNVIEWMODEL_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART|AOF_SMOOTHCHANGE);
        break;
      case WEAPON_SMG:
        m_moWeapon.PlayAnim(SMGVIEWMODEL_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART|AOF_SMOOTHCHANGE);
        break;
      case WEAPON_PIPE:
        m_moWeapon.PlayAnim(METALPIPEVIEWMODEL_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART|AOF_SMOOTHCHANGE);
        break;
      case WEAPON_STRONGPISTOL:
        m_moWeapon.PlayAnim(STRONGPISTOLVIEWMODEL_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART|AOF_SMOOTHCHANGE);
        break;
      default:
        ASSERTALWAYS("Unknown weapon.");
    }
  };

  /*
   *  >>>---   WEAPON BORING   ---<<<
   */

  FLOAT KnifeBoring(void) {
    // play boring anim
    INDEX iAnim = KNIFEVIEWMODEL_ANIM_IDLE;
    m_moWeapon.PlayAnim(iAnim, AOF_SMOOTHCHANGE);
    return m_moWeapon.GetAnimLength(iAnim);
  };

  FLOAT AxeBoring(void) {
    // play boring anim
    INDEX iAnim = AXEVIEWMODEL_ANIM_IDLE;
    m_moWeapon.PlayAnim(iAnim, AOF_SMOOTHCHANGE);
    return m_moWeapon.GetAnimLength(iAnim);
  };

  FLOAT PistolBoring(void) {
    // play boring anim
    INDEX iAnim = PISTOLVIEWMODEL_ANIM_IDLE;
    m_moWeapon.PlayAnim(iAnim, AOF_SMOOTHCHANGE);
    return m_moWeapon.GetAnimLength(iAnim);
  };

  FLOAT ShotgunBoring(void) {
    // play boring anim
    INDEX iAnim = SHOTGUNVIEWMODEL_ANIM_IDLE;
    m_moWeapon.PlayAnim(iAnim, AOF_SMOOTHCHANGE);
    return m_moWeapon.GetAnimLength(iAnim);
  };

  FLOAT SMGBoring(void) {
    // play boring anim
    INDEX iAnim = SMGVIEWMODEL_ANIM_IDLE;
    m_moWeapon.PlayAnim(iAnim, AOF_SMOOTHCHANGE);
    return m_moWeapon.GetAnimLength(iAnim);
  };

  FLOAT PipeBoring(void) {
    // play boring anim
    INDEX iAnim = METALPIPEVIEWMODEL_ANIM_IDLE;
    m_moWeapon.PlayAnim(iAnim, AOF_SMOOTHCHANGE);
    return m_moWeapon.GetAnimLength(iAnim);
  };

  FLOAT StrongPistolBoring(void) {
    // play boring anim
    INDEX iAnim = STRONGPISTOLVIEWMODEL_ANIM_IDLE;
    m_moWeapon.PlayAnim(iAnim, AOF_SMOOTHCHANGE);
    return m_moWeapon.GetAnimLength(iAnim);
  };

  // find the weapon position in the remap array
  WeaponType FindRemapedPos(WeaponType wt)
  {
    for (INDEX i=0; i<9; i++)
    {
      if (aiWeaponsRemap[i]==wt) {
        return (WeaponType)i;
      }
    }
    ASSERT("Non-existant weapon in remap array!");
    return (WeaponType)0;
  }

  // get secondary weapon for a given primary weapon
  WeaponType PrimaryToSecondary(WeaponType wt)
  {
    if (wt==WEAPON_AXE) {
      return WEAPON_KNIFE;
    } else if (wt==WEAPON_STRONGPISTOL) {
      return WEAPON_PISTOL;
    } else if (wt==WEAPON_SMG) {
      return WEAPON_SHOTGUN;
    } else {
      return wt;
    }
  }
  // get primary weapon for a given secondary weapon
  WeaponType SecondaryToPrimary(WeaponType wt)
  {
    if (wt==WEAPON_KNIFE) {
      return WEAPON_AXE;
    } else if (wt==WEAPON_PISTOL) {
      return WEAPON_STRONGPISTOL;
    } else if (wt==WEAPON_SHOTGUN) {
      return WEAPON_SMG;
    } else {
      return wt;
    }
  }
  
  /*
   *  >>>---   WEAPON CHANGE FUNCTIONS   ---<<<
   */
  
  WeaponType FindWeaponInDirection(INDEX iDir)
  {
    INDEX wtOrg = FindRemapedPos(m_iWantedWeapon);
    INDEX wti = wtOrg;
    FOREVER {
      (INDEX&)wti += iDir;
      if (wti<WEAPON_NONE + 1) {
        wti = WEAPON_STRONGPISTOL;
      }
      if (wti>8) {
        wti = WEAPON_HOLSTERED;
      }
      if (wti==wtOrg) {
        break;
      }
      WeaponType wt = (WeaponType) aiWeaponsRemap[wti];
      if ( ( ((1<<(wt-1))&m_iAvailableWeapons) ) ) {
        return wt;
      }
    }
    return m_iWantedWeapon;
  }

  // select new weapon
  void SelectWeaponChange(INDEX iSelect)
  {
    WeaponType EwtTemp;
    // mark that weapon change is required
    m_tmWeaponChangeRequired = _pTimer->CurrentTick();

    // if storing current weapon
    if (iSelect==0) {
      m_bChangeWeapon = TRUE;
      m_iWantedWeapon = WEAPON_NONE;
      return;
    }

    // if restoring best weapon
    if (iSelect==-4) {
      SelectNewWeapon() ;
      return;
    }

    // if flipping weapon
    if (iSelect==-3) {
      EwtTemp = GetAltWeapon(m_iWantedWeapon);

    // if selecting previous weapon
    } else if (iSelect==-2) {
      EwtTemp = FindWeaponInDirection(-1);

    // if selecting next weapon
    } else if (iSelect==-1) {
      EwtTemp = FindWeaponInDirection(+1);

    // if selecting directly
    } else {
      // flip current weapon
      if (iSelect == GetSelectedWeapon(m_iWantedWeapon)) {
        EwtTemp = GetAltWeapon(m_iWantedWeapon);

      // change to wanted weapon
      } else {
        EwtTemp = GetStrongerWeapon(iSelect);

        // if weapon don't exist or don't have ammo flip it
        if ( !((1<<(EwtTemp-1))&m_iAvailableWeapons) ) {
          EwtTemp = GetAltWeapon(EwtTemp);
        }
      }
    }

    // wanted weapon exist and has ammo
    BOOL bChange = ( ((1<<(EwtTemp-1))&m_iAvailableWeapons) );
    if (bChange) {
      m_iWantedWeapon = EwtTemp;
      m_bChangeWeapon = TRUE;
    }
  };

procedures:
  /*
   *  >>>---   WEAPON CHANGE PROCEDURE  ---<<<
   */
  ChangeWeapon() {
    if (m_iCurrentWeapon!=m_iWantedWeapon) {
      m_penPlayer->SendEvent(EWeaponChanged());
    }
    // weapon is changed
    m_bChangeWeapon = FALSE;
    // if this is not current weapon change it
    if (m_iCurrentWeapon!=m_iWantedWeapon) {

      // store current weapon
      m_iPreviousWeapon = m_iCurrentWeapon;
      autocall PutDown() EEnd;
      // set new weapon
      m_iCurrentWeapon = m_iWantedWeapon;
      // remember current weapon for console usage
      wpn_iCurrent = m_iCurrentWeapon;
      autocall BringUp() EEnd;
    }
    jump Idle();
  };


  // put weapon down
  PutDown() {
    // start weapon put down animation
    switch (m_iCurrentWeapon) {
      case WEAPON_NONE:
      case WEAPON_HOLSTERED:
        break;
      case WEAPON_KNIFE:
        m_iAnim = KNIFEVIEWMODEL_ANIM_LOWER;
        break;
      case WEAPON_AXE: 
        m_iAnim = AXEVIEWMODEL_ANIM_LOWER;
        break;
      case WEAPON_PISTOL:
        m_iAnim = PISTOLVIEWMODEL_ANIM_LOWER;
        break;
      case WEAPON_SHOTGUN:
        m_iAnim = SHOTGUNVIEWMODEL_ANIM_LOWER;
        break;
      case WEAPON_SMG:
        m_iAnim = SMGVIEWMODEL_ANIM_LOWER;
        break;
      case WEAPON_PIPE:
        m_iAnim = METALPIPEVIEWMODEL_ANIM_LOWER;
        break;
      case WEAPON_STRONGPISTOL:
        m_iAnim = STRONGPISTOLVIEWMODEL_ANIM_LOWER;
        break;
      default: ASSERTALWAYS("Unknown weapon.");
    }
    // start animator
    CPlayerAnimator &plan = (CPlayerAnimator&)*((CPlayer&)*m_penPlayer).m_penAnimator;
    plan.BodyPushAnimation();
    if (m_iCurrentWeapon==WEAPON_NONE) {
      return EEnd();
    }

    m_moWeapon.PlayAnim(m_iAnim, 0);
    autowait(m_moWeapon.GetAnimLength(m_iAnim));
    return EEnd();
  };

  // bring up weapon
  BringUp() {
    // reset weapon draw offset
    ResetWeaponMovingOffset();
    // set weapon model for current weapon
    SetCurrentWeaponModel();
    // start current weapon bring up animation
    switch (m_iCurrentWeapon) {
      case WEAPON_HOLSTERED:
        break;
      case WEAPON_KNIFE: 
        m_iAnim = KNIFEVIEWMODEL_ANIM_RAISE;
        break;
      case WEAPON_AXE: 
        m_iAnim = AXEVIEWMODEL_ANIM_RAISE;
        break;
      case WEAPON_PISTOL:
        m_iAnim = PISTOLVIEWMODEL_ANIM_RAISE;
        break;
      case WEAPON_SHOTGUN:
        m_iAnim = SHOTGUNVIEWMODEL_ANIM_RAISE;
        break;
      case WEAPON_SMG:
        m_iAnim = SMGVIEWMODEL_ANIM_RAISE;
        break;
      case WEAPON_PIPE:
        m_iAnim = METALPIPEVIEWMODEL_ANIM_RAISE;
        break;
      case WEAPON_STRONGPISTOL:
        m_iAnim = STRONGPISTOLVIEWMODEL_ANIM_RAISE;
        break;
      case WEAPON_NONE:
        break;
      default: ASSERTALWAYS("Unknown weapon.");
    }
    // start animator
    CPlayerAnimator &plan = (CPlayerAnimator&)*((CPlayer&)*m_penPlayer).m_penAnimator;
    plan.BodyPullAnimation();

    m_moWeapon.PlayAnim(m_iAnim, 0);
    autowait(m_moWeapon.GetAnimLength(m_iAnim));

    // mark that weapon change has ended
    m_tmWeaponChangeRequired -= hud_tmWeaponsOnScreen/2;

    return EEnd();
  };


  /*
   *  >>>---   FIRE WEAPON   ---<<<
   */
  Fire()
  {
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    PlaySound(pl.m_soWeapon0, SOUND_SILENCE, SOF_3D|SOF_VOLUMETRIC);      // stop possible sounds
    // force ending of weapon change
    m_tmWeaponChangeRequired = 0;

    m_bFireWeapon = TRUE;

    // setup 3D sound parameters
    Setup3DSoundParameters();

    // clear last lerped bullet position
    m_iLastBulletPosition = FLOAT3D(32000.0f, 32000.0f, 32000.0f);

    while (HoldingFire()) {
      // boring animation
      ((CPlayerAnimator&)*((CPlayer&)*m_penPlayer).m_penAnimator).m_fLastActionTime = _pTimer->CurrentTick();
      wait() {
        on (EBegin) : {
          // fire one shot
          switch (m_iCurrentWeapon) {
            case WEAPON_HOLSTERED: call DummyHolstered(); break;
            case WEAPON_KNIFE:  call SwingKnife(); break;
            case WEAPON_AXE:    call SwingAxe(); break;
            case WEAPON_PISTOL: call FirePistol(); break;
            case WEAPON_SHOTGUN: call FireShotgun(); break;
            case WEAPON_SMG: call FireSMG(); break;
            case WEAPON_PIPE:  call SwingPipe(); break;
            case WEAPON_STRONGPISTOL: call FireStrongPistol(); break;
            default: ASSERTALWAYS("Unknown weapon.");
          }
          resume;
        }
        on (EEnd) : {
          stop;
        }
      }
    }
    jump Idle();
  };


  /*
   *  >>>---   FIRE WEAPON   ---<<<
   */
  AltFire()
  {
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    PlaySound(pl.m_soWeapon0, SOUND_SILENCE, SOF_3D|SOF_VOLUMETRIC);      // stop possible sounds
    // force ending of weapon change
    m_tmWeaponChangeRequired = 0;

    m_bAltFireWeapon = TRUE;

    // setup 3D sound parameters
    Setup3DSoundParameters();

    // clear last lerped bullet position
    m_iLastBulletPosition = FLOAT3D(32000.0f, 32000.0f, 32000.0f);

    while (HoldingAltFire()) {
      // boring animation
      ((CPlayerAnimator&)*((CPlayer&)*m_penPlayer).m_penAnimator).m_fLastActionTime = _pTimer->CurrentTick();
      wait() {
        on (EBegin) : {
          // fire one shot
          switch (m_iCurrentWeapon) {
            case WEAPON_HOLSTERED: call AltHolstered(); break;
            case WEAPON_KNIFE:   call StabKnife(); break;
            case WEAPON_AXE:     call AltAxe(); break;
            case WEAPON_PISTOL:  call AltPistol(); break;
            case WEAPON_SHOTGUN: call AltShotgun(); break;
            case WEAPON_SMG:     call AltSMG(); break;
            case WEAPON_PIPE:    call AltPipe(); break;
            case WEAPON_STRONGPISTOL:  call AltStrongPistol(); break;
            default: ASSERTALWAYS("Unknown weapon.");
          }
          resume;
        }
        on (EEnd) : {
          stop;
        }
      }
    }
    jump Idle();
  };

  Holster() {
    m_bHolsterWeapon = TRUE;
    
    m_iPreviousWeapon = m_iCurrentWeapon;
    autocall PutDown() EEnd;

    //holster
    if (m_iCurrentWeapon != WEAPON_HOLSTERED) {
      m_iCurrentWeapon = WEAPON_HOLSTERED;
      m_bChangeWeapon = FALSE;
    } else {
      SelectNewWeapon();
      m_iCurrentWeapon=m_iWantedWeapon;
      wpn_iCurrent = m_iCurrentWeapon;
      m_bChangeWeapon = FALSE;
    }

    autocall BringUp() EEnd;
    m_bHolsterWeapon = FALSE;

    jump Idle();
  };

  DropWeaponEvent() {
    m_bDropWeapon = TRUE;
    if(m_iCurrentWeapon==WEAPON_HOLSTERED)
    {
      autowait(0.25);
      m_bDropWeapon = FALSE;
      jump Idle();
    }
    
    m_iPreviousWeapon = m_iCurrentWeapon;
    autocall PutDown() EEnd;

    DropWeapon();

    m_iAvailableWeapons &= ~(1 << (m_iCurrentWeapon - 1));

    SelectNewWeapon();
    
    m_iCurrentWeapon=m_iWantedWeapon;
    wpn_iCurrent = m_iCurrentWeapon;
    m_bChangeWeapon = FALSE;

    autocall BringUp() EEnd;
    m_bDropWeapon = FALSE;

    jump Idle();
  };

  // ***************** HOLSTERED DUMMY *****************
  DummyHolstered() {
    autowait(0.25);
    return EEnd();
  };

  AltHolstered() {
    autowait(0.25);
    return EEnd();
  };

    
  // ***************** SWING KNIFE *****************
  SwingKnife() {

    INDEX iSwing = IRnd()%2;

    // animator swing
    GetAnimator()->FireAnimation(BODY_ANIM_KNIFE_ATTACK, 0);
    // sound
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    // depending on stand choose random attack

    if(iSwing == 1) {
      m_iAnim = KNIFEVIEWMODEL_ANIM_ATTACK;
    } else {
      m_iAnim = KNIFEVIEWMODEL_ANIM_SLASH;
    }
     m_fAnimWaitTime = 0.25f;
    PlaySound(pl.m_soWeapon0, SOUND_KNIFE_SWING, SOF_3D|SOF_VOLUMETRIC);
    if(_pNetwork->IsPlayerLocal(m_penPlayer)) {IFeel_PlayEffect("Knife_back");}
    
    m_moWeapon.PlayAnim(m_iAnim, 0);
    m_bMeleeHitEnemy = FALSE;
    m_bMeleeHitModel = FALSE;
    m_bMeleeHitBrush = FALSE;
    autowait(0.15f);

    if (CutWithKnife(0, 0, 3.0f, 2.0f, 0.5f, ((GetSP()->sp_bCooperative) ? 16.0f : 8.0f), DMT_SHARP)) {
      if (m_bMeleeHitEnemy)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_KNIFE_SLASH, SOF_3D|SOF_VOLUMETRIC);
      }
      if (m_bMeleeHitModel || m_bMeleeHitBrush)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_KNIFE_HIT, SOF_3D|SOF_VOLUMETRIC);
      }

      autowait(m_fAnimWaitTime);
    } else if (TRUE) {
      autowait(m_fAnimWaitTime/2);
      CutWithKnife(0, 0, 3.0f, 2.0f, 0.5f, ((GetSP()->sp_bCooperative) ? 16.0f : 8.0f), DMT_SHARP);
      if (m_bMeleeHitEnemy)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_KNIFE_SLASH, SOF_3D|SOF_VOLUMETRIC);
      }
      if (m_bMeleeHitModel || m_bMeleeHitBrush)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_KNIFE_HIT, SOF_3D|SOF_VOLUMETRIC);
      }
      autowait(m_fAnimWaitTime/2);
    }

    if (m_moWeapon.GetAnimLength(m_iAnim)-m_fAnimWaitTime>=_pTimer->TickQuantum) {
      autowait(m_moWeapon.GetAnimLength(m_iAnim)-m_fAnimWaitTime);
    }
    return EEnd();
  };

  // ***************** STAB KNIFE *****************
  StabKnife() {
    // animator swing
    GetAnimator()->FireAnimation(BODY_ANIM_KNIFE_ATTACK, 0);
    // sound
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    // depending on stand choose random attack
    m_iAnim = KNIFEVIEWMODEL_ANIM_STAB; m_fAnimWaitTime = 0.25f;
    PlaySound(pl.m_soWeapon0, SOUND_KNIFE_SWING, SOF_3D|SOF_VOLUMETRIC);
    if(_pNetwork->IsPlayerLocal(m_penPlayer)) {IFeel_PlayEffect("Knife_back");}
    
    m_moWeapon.PlayAnim(m_iAnim, 0);
    m_bMeleeHitEnemy = FALSE;
    m_bMeleeHitModel = FALSE;
    m_bMeleeHitBrush = FALSE;
    autowait(0.15f);

    if (CutWithKnife(0, 0, 3.0f, 2.0f, 0.5f, ((GetSP()->sp_bCooperative) ? 20.0f : 10.0f), DMT_SHARP)) {
      if (m_bMeleeHitEnemy)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_KNIFE_SLASH, SOF_3D|SOF_VOLUMETRIC);
      }
      if (m_bMeleeHitModel || m_bMeleeHitBrush)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_KNIFE_HIT, SOF_3D|SOF_VOLUMETRIC);
      }
      autowait(m_fAnimWaitTime);
    } else if (TRUE) {
      autowait(m_fAnimWaitTime/2);
      CutWithKnife(0, 0, 3.0f, 2.0f, 0.5f, ((GetSP()->sp_bCooperative) ? 20.0f : 10.0f), DMT_SHARP);
      if (m_bMeleeHitEnemy)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_KNIFE_SLASH, SOF_3D|SOF_VOLUMETRIC);
      }
      if (m_bMeleeHitModel || m_bMeleeHitBrush)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_KNIFE_HIT, SOF_3D|SOF_VOLUMETRIC);
      }
      autowait(m_fAnimWaitTime/2);
    }

    if (m_moWeapon.GetAnimLength(m_iAnim)-m_fAnimWaitTime>=_pTimer->TickQuantum) {
      autowait(m_moWeapon.GetAnimLength(m_iAnim)-m_fAnimWaitTime);
    }
    return EEnd();
  };

  // ***************** SWING AXE *****************
  SwingAxe() {
    // animator swing
    GetAnimator()->FireAnimation(BODY_ANIM_KNIFE_ATTACK, 0);
    // sound
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    
    m_iAnim = AXEVIEWMODEL_ANIM_ATTACK; m_fAnimWaitTime = 0.45f;
    PlaySound(pl.m_soWeapon0, SOUND_KNIFE_SWING, SOF_3D|SOF_VOLUMETRIC);
      if(_pNetwork->IsPlayerLocal(m_penPlayer))
        {IFeel_PlayEffect("Knife_back");}
    m_moWeapon.PlayAnim(m_iAnim, 0);
    m_bMeleeHitEnemy = FALSE;
    m_bMeleeHitModel = FALSE;
    m_bMeleeHitBrush = FALSE;
    autowait(0.175f);
    if (CutWithKnife(0, 0, 3.0f, 2.0f, 0.5f, ((GetSP()->sp_bCooperative) ? 50.0f : 30.0f), DMT_AXE)) {
      if (m_bMeleeHitEnemy)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_KNIFE_SLASH, SOF_3D|SOF_VOLUMETRIC);
      }
      if (m_bMeleeHitModel || m_bMeleeHitBrush)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_KNIFE_HIT, SOF_3D|SOF_VOLUMETRIC);
      }
      autowait(m_fAnimWaitTime);
    } else if (TRUE) {
      autowait(m_fAnimWaitTime/2);
      CutWithKnife(0, 0, 3.0f, 2.0f, 0.5f, ((GetSP()->sp_bCooperative) ? 50.0f : 30.0f), DMT_AXE);
      if (m_bMeleeHitEnemy)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_KNIFE_SLASH, SOF_3D|SOF_VOLUMETRIC);
      }
      if (m_bMeleeHitModel || m_bMeleeHitBrush)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_KNIFE_HIT, SOF_3D|SOF_VOLUMETRIC);
      }
      autowait(m_fAnimWaitTime/2);
    }

    if (m_moWeapon.GetAnimLength(m_iAnim)-m_fAnimWaitTime>=_pTimer->TickQuantum) {
      autowait(m_moWeapon.GetAnimLength(m_iAnim)-m_fAnimWaitTime);
    }
    return EEnd();
  };

  // ***************** AXE ALTFIRE DUMMY *****************
  AltAxe() {
    autowait(0.25);
    return EEnd();
  };
  
  // ***************** FIRE PISTOL *****************
  FirePistol() {
    if (m_iPistolBullets <= 0 && m_iBullets <= 0)
    {
      // sound
      CPlayer &pl = (CPlayer&)*m_penPlayer;
      PlaySound(pl.m_soWeapon2, SOUND_DRYFIRE, SOF_3D|SOF_VOLUMETRIC);
      autowait(0.35f);
      return EEnd();
    }
    else if (m_iPistolBullets <= 0)
    {
      // sound
      CPlayer &pl = (CPlayer&)*m_penPlayer;
      PlaySound(pl.m_soWeapon2, SOUND_DRYFIRE, SOF_3D|SOF_VOLUMETRIC);
      autowait(0.35f);
      return EEnd();
    }

    if (m_iPistolBullets>0) {
    GetAnimator()->FireAnimation(BODY_ANIM_COLT_FIRERIGHT, 0);

    // fire bullet
    FireOneBullet(wpn_fFX[WEAPON_PISTOL], wpn_fFY[WEAPON_PISTOL], 500.0f,
    ((GetSP()->sp_bCooperative) ? 40.0f : 25.0f), DMT_BULLET);

    if(_pNetwork->IsPlayerLocal(m_penPlayer)) {IFeel_PlayEffect("Pistol_fire");}
    DoRecoil();
    SpawnRangeSound(40.0f);
    DecAmmo(m_iPistolBullets, 1);
    SetFlare(0, FLARE_ADD);
    PlayLightAnim(LIGHT_ANIM_COLT_SHOTGUN, 0);

    // sound
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    PlaySound(pl.m_soWeapon0, SOUND_PISTOL_FIRE, SOF_3D|SOF_VOLUMETRIC);

    // pistol fire
    INDEX iAnim = PISTOLVIEWMODEL_ANIM_FIRE;
    m_moWeapon.PlayAnim(iAnim, 0);
    autowait(m_moWeapon.GetAnimLength(iAnim)-0.125f);
    m_bFireWeapon = FALSE;
    m_moWeapon.PlayAnim(PISTOLVIEWMODEL_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART|AOF_SMOOTHCHANGE);
    }

    return EEnd();
  };

  // reload pistol
  ReloadPistol() {
    if (m_iPistolBullets>=17) {
      return EEnd();
    }

    if(m_iBullets <= 0) {
      return EEnd();
    }

    // sound
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    PlaySound(pl.m_soWeapon1, SOUND_PISTOL_RELOAD, SOF_3D|SOF_VOLUMETRIC);
    m_moWeapon.PlayAnim(PISTOLVIEWMODEL_ANIM_LOWER, 0);
    autowait(m_moWeapon.GetAnimLength(PISTOLVIEWMODEL_ANIM_LOWER)+0.125f);
    if(_pNetwork->IsPlayerLocal(m_penPlayer)) {IFeel_PlayEffect("Pistol_reload");}

    while(m_iPistolBullets < 17)
    {
      if(m_iBullets <= 0)
      {
        m_moWeapon.PlayAnim(PISTOLVIEWMODEL_ANIM_RAISE, 0);
        autowait(m_moWeapon.GetAnimLength(PISTOLVIEWMODEL_ANIM_RAISE));

        return EEnd();
      }

      DecAmmo(m_iBullets, 1);
      m_iPistolBullets++;
    }

    m_moWeapon.PlayAnim(PISTOLVIEWMODEL_ANIM_RAISE, 0);
    autowait(m_moWeapon.GetAnimLength(PISTOLVIEWMODEL_ANIM_RAISE));

    return EEnd();
  };

  // ***************** PISTOL WHIP *****************
  AltPistol() {
    // animator swing
    GetAnimator()->FireAnimation(BODY_ANIM_KNIFE_ATTACK, 0);
    // sound
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    
    m_iAnim = PISTOLVIEWMODEL_ANIM_MELEE; m_fAnimWaitTime = 0.35f;
    PlaySound(pl.m_soWeapon2, SOUND_KNIFE_SWING, SOF_3D|SOF_VOLUMETRIC);
      if(_pNetwork->IsPlayerLocal(m_penPlayer))
        {IFeel_PlayEffect("Knife_back");}
    m_moWeapon.PlayAnim(m_iAnim, 0);
    m_bMeleeHitEnemy = FALSE;
    m_bMeleeHitModel = FALSE;
    m_bMeleeHitBrush = FALSE;
    autowait(0.25f);
    if (CutWithKnife(0, 0, 3.0f, 2.0f, 0.5f, ((GetSP()->sp_bCooperative) ? 20.0f : 10.0f), DMT_BLUNT)) {
      if (m_bMeleeHitEnemy)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        switch(IRnd()%4)
        {
          case 0: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT1, SOF_3D|SOF_VOLUMETRIC); break;
          case 1: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT2, SOF_3D|SOF_VOLUMETRIC); break;
          case 2: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT3, SOF_3D|SOF_VOLUMETRIC); break;
          case 3: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT4, SOF_3D|SOF_VOLUMETRIC); break;
          default: ASSERTALWAYS("MetalPipe unknown hit sound");
        }
      }
      if (m_bMeleeHitModel || m_bMeleeHitBrush)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon3, SOUND_PIPE_BANG, SOF_3D|SOF_VOLUMETRIC);
      }
      autowait(m_fAnimWaitTime);
    } else if (TRUE) {
      autowait(m_fAnimWaitTime/2);
      CutWithKnife(0, 0, 3.0f, 2.0f, 0.5f, ((GetSP()->sp_bCooperative) ? 20.0f : 10.0f), DMT_BLUNT);
      if (m_bMeleeHitEnemy)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        switch(IRnd()%4)
        {
          case 0: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT1, SOF_3D|SOF_VOLUMETRIC); break;
          case 1: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT2, SOF_3D|SOF_VOLUMETRIC); break;
          case 2: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT3, SOF_3D|SOF_VOLUMETRIC); break;
          case 3: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT4, SOF_3D|SOF_VOLUMETRIC); break;
          default: ASSERTALWAYS("MetalPipe unknown hit sound");
        }
      }
      if (m_bMeleeHitModel || m_bMeleeHitBrush)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon3, SOUND_PIPE_BANG, SOF_3D|SOF_VOLUMETRIC);
      }
      autowait(m_fAnimWaitTime/2);
    }

    if (m_moWeapon.GetAnimLength(m_iAnim)-m_fAnimWaitTime>=_pTimer->TickQuantum) {
      autowait(m_moWeapon.GetAnimLength(m_iAnim)-m_fAnimWaitTime);
    }
    return EEnd();
  };

  // ***************** FIRE SHOTGUN *****************
  FireShotgun() {
    if (m_iShotgunShells <= 0 && m_iShells <= 0)
    {
      // sound
      CPlayer &pl = (CPlayer&)*m_penPlayer;
      PlaySound(pl.m_soWeapon2, SOUND_DRYFIRE, SOF_3D|SOF_VOLUMETRIC);
      autowait(0.35f);
      return EEnd();
    }
    else if (m_iShotgunShells <= 0)
    {
      // sound
      CPlayer &pl = (CPlayer&)*m_penPlayer;
      PlaySound(pl.m_soWeapon2, SOUND_DRYFIRE, SOF_3D|SOF_VOLUMETRIC);
      autowait(0.35f);
      return EEnd();
    }

    if (m_iShotgunShells > 0) {
    GetAnimator()->FireAnimation(BODY_ANIM_SHOTGUN_FIRELONG, 0);

    // fire bullets
    FireBullets(wpn_fFX[WEAPON_SHOTGUN], wpn_fFY[WEAPON_SHOTGUN], 
        500.0f, 8.0f, 8, afShotgunPellets, 0.2f, 0.05f, DMT_PELLET);


    if(_pNetwork->IsPlayerLocal(m_penPlayer)) {IFeel_PlayEffect("Colt_fire");}
    DoRecoil();
    SpawnRangeSound(60.0f);
    DecAmmo(m_iShotgunShells, 1);
    SetFlare(0, FLARE_ADD);
    PlayLightAnim(LIGHT_ANIM_COLT_SHOTGUN, 0);

    // sound
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    PlaySound(pl.m_soWeapon0, SOUND_SHOTGUN_FIRE, SOF_3D|SOF_VOLUMETRIC);

    // shotgun fire
    INDEX iAnim = SHOTGUNVIEWMODEL_ANIM_FIRE;
    m_moWeapon.PlayAnim(iAnim, 0);

    // start pump animation
    CModelObject *pmo1 = &(m_moWeapon.GetAttachmentModel(SHOTGUNVIEWMODEL_ATTACHMENT_SHOTGUN)->amo_moModelObject);
    pmo1->PlayAnim(SHOTGUNITEM_ANIM_PUMP, AOF_NORESTART);

    autowait(m_moWeapon.GetAnimLength(iAnim)+0.075f);
    m_moWeapon.PlayAnim(SHOTGUNVIEWMODEL_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART);
    CModelObject *pmo1 = &(m_moWeapon.GetAttachmentModel(SHOTGUNVIEWMODEL_ATTACHMENT_SHOTGUN)->amo_moModelObject);
    pmo1->PlayAnim(SHOTGUNITEM_ANIM_DEFAULT, AOF_NORESTART);
    }

    return EEnd();
  };

  // ***************** SHOTGUN ALTFIRE DUMMY *****************
  AltShotgun() {
    autowait(0.25);
    return EEnd();
  };

  // reload shotgun
  ReloadShotgun() {
    if (m_iShotgunShells>=8) {
      return EEnd();
    }

    if(m_iShells <= 0) {
        return EEnd();
    }

    m_moWeapon.PlayAnim(SHOTGUNVIEWMODEL_ANIM_LOWER, 0);
    autowait(m_moWeapon.GetAnimLength(SHOTGUNVIEWMODEL_ANIM_LOWER)+0.125f);
    if(_pNetwork->IsPlayerLocal(m_penPlayer)) {IFeel_PlayEffect("Shotgun_reload");}

    while(m_iShotgunShells < 8)
    {
      if(m_iShells <= 0)
      {
        m_moWeapon.PlayAnim(SHOTGUNVIEWMODEL_ANIM_RAISE, 0);
        autowait(m_moWeapon.GetAnimLength(SHOTGUNVIEWMODEL_ANIM_RAISE));

        return EEnd();
      }

      // sound
      CPlayer &pl = (CPlayer&)*m_penPlayer;
      PlaySound(pl.m_soWeapon1, SOUND_SHOTGUN_RELOAD, SOF_3D|SOF_VOLUMETRIC);

      DecAmmo(m_iShells, 1);
      m_iShotgunShells++;
      
      autowait(0.45f);

      if (m_bFireWeapon && m_iShotgunShells > 0) {
        jump FireShotgun();
        return EEnd();
      }
    }

    m_moWeapon.PlayAnim(SHOTGUNVIEWMODEL_ANIM_RAISE, 0);
    autowait(m_moWeapon.GetAnimLength(SHOTGUNVIEWMODEL_ANIM_RAISE));

    return EEnd();
  };

  // ***************** FIRE SMG *****************

  FireSMG() {
    if (m_iSMGBullets <= 0 && m_iMediumBullets <= 0)
    {
      // sound
      CPlayer &pl = (CPlayer&)*m_penPlayer;
      PlaySound(pl.m_soWeapon2, SOUND_DRYFIRE, SOF_3D|SOF_VOLUMETRIC);
      autowait(0.35f);
      return EEnd();
    }
    else if (m_iSMGBullets <= 0)
    {
      // sound
      CPlayer &pl = (CPlayer&)*m_penPlayer;
      PlaySound(pl.m_soWeapon2, SOUND_DRYFIRE, SOF_3D|SOF_VOLUMETRIC);
      autowait(0.35f);
      return EEnd();
    }

    // fire one bullet
    if (m_iSMGBullets>0) {
      FireMachineBullet(wpn_fFX[WEAPON_SMG], wpn_fFY[WEAPON_SMG], 
        500.0f, 8.0f, ((GetSP()->sp_bCooperative) ? 0.01f : 0.03f),
        ((GetSP()->sp_bCooperative) ? 0.5f : 0.0f), DMT_BULLET);
      SpawnRangeSound(50.0f);
      if(_pNetwork->IsPlayerLocal(m_penPlayer)) {IFeel_PlayEffect("SMG_fire");}
      DecAmmo(m_iSMGBullets, 1);
      SetFlare(0, FLARE_ADD);
      PlayLightAnim(LIGHT_ANIM_TOMMYGUN, 0);

      // sound
      CPlayer &pl = (CPlayer&)*m_penPlayer;
      PlaySound(pl.m_soWeapon0, SOUND_SMG_FIRE, SOF_3D|SOF_VOLUMETRIC);
      m_moWeapon.PlayAnim(SMGVIEWMODEL_ANIM_FIRE, AOF_LOOPING|AOF_NORESTART);

      autowait(0.125f);

      PlayLightAnim(LIGHT_ANIM_NONE, 0);
      m_moWeapon.PlayAnim(SMGVIEWMODEL_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART);
    } else {
      ASSERTALWAYS("SMG - Auto weapon change not working.");
      m_bFireWeapon = m_bHasAmmo = FALSE;
    }
    return EEnd();
  };

  // reload SMG
  ReloadSMG() {
    if (m_iSMGBullets>=30) {
      return EEnd();
    }

    if(m_iMediumBullets <= 0) {
      return EEnd();
    }

    // sound
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    PlaySound(pl.m_soWeapon1, SOUND_SMG_RELOAD, SOF_3D|SOF_VOLUMETRIC);
    m_moWeapon.PlayAnim(SMGVIEWMODEL_ANIM_LOWER, 0);
    autowait(m_moWeapon.GetAnimLength(SMGVIEWMODEL_ANIM_LOWER)+0.125f);
    if(_pNetwork->IsPlayerLocal(m_penPlayer)) {IFeel_PlayEffect("SMG_reload");}

    while(m_iSMGBullets < 30)
    {
      if(m_iMediumBullets <= 0)
      {
        m_moWeapon.PlayAnim(SMGVIEWMODEL_ANIM_RAISE, 0);
        autowait(m_moWeapon.GetAnimLength(SMGVIEWMODEL_ANIM_RAISE));

        return EEnd();
      }

      DecAmmo(m_iMediumBullets, 1);
      m_iSMGBullets++;
    }

    m_moWeapon.PlayAnim(SMGVIEWMODEL_ANIM_RAISE, 0);
    autowait(m_moWeapon.GetAnimLength(SMGVIEWMODEL_ANIM_RAISE));

    return EEnd();
  };

  // ***************** SMG ALTFIRE DUMMY *****************
  AltSMG() {
    autowait(0.25);
    return EEnd();
  };

  // ***************** SWING PIPE *****************
  SwingPipe() {
    // animator swing
    GetAnimator()->FireAnimation(BODY_ANIM_KNIFE_ATTACK, 0);
    // sound
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    
    m_iAnim = METALPIPEVIEWMODEL_ANIM_ATTACK; m_fAnimWaitTime = 0.35f;
    PlaySound(pl.m_soWeapon0, SOUND_KNIFE_SWING, SOF_3D|SOF_VOLUMETRIC);
      if(_pNetwork->IsPlayerLocal(m_penPlayer))
        {IFeel_PlayEffect("Knife_back");}
    m_moWeapon.PlayAnim(m_iAnim, 0);
    m_bMeleeHitEnemy = FALSE;
    m_bMeleeHitModel = FALSE;
    m_bMeleeHitBrush = FALSE;
    autowait(0.25f);
    if (CutWithKnife(0, 0, 3.0f, 3.0f, 0.5f, ((GetSP()->sp_bCooperative) ? 25.0f : 15.0f), DMT_BLUNT)) {
      if (m_bMeleeHitEnemy)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        switch(IRnd()%4)
        {
          case 0: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT1, SOF_3D|SOF_VOLUMETRIC); break;
          case 1: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT2, SOF_3D|SOF_VOLUMETRIC); break;
          case 2: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT3, SOF_3D|SOF_VOLUMETRIC); break;
          case 3: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT4, SOF_3D|SOF_VOLUMETRIC); break;
          default: ASSERTALWAYS("MetalPipe unknown hit sound");
        }
      }
      if (m_bMeleeHitModel || m_bMeleeHitBrush)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_PIPE_BANG, SOF_3D|SOF_VOLUMETRIC);
      }
      autowait(m_fAnimWaitTime);
    } else if (TRUE) {
      autowait(m_fAnimWaitTime/2);
      CutWithKnife(0, 0, 3.0f, 3.0f, 0.5f, ((GetSP()->sp_bCooperative) ? 25.0f : 15.0f), DMT_BLUNT);
      if (m_bMeleeHitEnemy)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        switch(IRnd()%4)
        {
          case 0: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT1, SOF_3D|SOF_VOLUMETRIC); break;
          case 1: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT2, SOF_3D|SOF_VOLUMETRIC); break;
          case 2: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT3, SOF_3D|SOF_VOLUMETRIC); break;
          case 3: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT4, SOF_3D|SOF_VOLUMETRIC); break;
          default: ASSERTALWAYS("MetalPipe unknown hit sound");
        }
      }
      if (m_bMeleeHitModel || m_bMeleeHitBrush)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon1, SOUND_PIPE_BANG, SOF_3D|SOF_VOLUMETRIC);
      }
      autowait(m_fAnimWaitTime/2);
    }

    if (m_moWeapon.GetAnimLength(m_iAnim)-m_fAnimWaitTime>=_pTimer->TickQuantum) {
      autowait(m_moWeapon.GetAnimLength(m_iAnim)-m_fAnimWaitTime);
    }
    return EEnd();
  };

  // ***************** PIPE ALTFIRE BLOCK *****************
  AltPipe() {
    m_moWeapon.PlayAnim(METALPIPEVIEWMODEL_ANIM_BLOCKRAISE, 0);
    autowait(m_moWeapon.GetAnimLength(METALPIPEVIEWMODEL_ANIM_BLOCKRAISE));
    
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    pl.m_bIsBlocking = TRUE;

    m_moWeapon.PlayAnim(METALPIPEVIEWMODEL_ANIM_BLOCKIDLE, AOF_LOOPING|AOF_NORESTART);

    while(m_bAltFireWeapon)
    {
      CPlayer &pl = (CPlayer&)*m_penPlayer;
      pl.m_bIsBlocking = TRUE;
      autowait(m_fAnimWaitTime/2);
    }

    m_moWeapon.PlayAnim(METALPIPEVIEWMODEL_ANIM_BLOCKLOWER, 0);
    autowait(m_moWeapon.GetAnimLength(METALPIPEVIEWMODEL_ANIM_BLOCKLOWER));

    CPlayer &pl = (CPlayer&)*m_penPlayer;
    pl.m_bIsBlocking = FALSE;

    m_moWeapon.PlayAnim(METALPIPEVIEWMODEL_ANIM_IDLE, 0);

    return EEnd();
  };

  // ***************** FIRE STRONG PISTOL *****************
  FireStrongPistol() {
    if (m_iStrongPistolBullets <= 0 && m_iStrongBullets <= 0)
    {
      // sound
      CPlayer &pl = (CPlayer&)*m_penPlayer;
      PlaySound(pl.m_soWeapon2, SOUND_DRYFIRE, SOF_3D|SOF_VOLUMETRIC);
      autowait(0.35f);
      return EEnd();
    }
    else if (m_iStrongPistolBullets <= 0)
    {
      // sound
      CPlayer &pl = (CPlayer&)*m_penPlayer;
      PlaySound(pl.m_soWeapon2, SOUND_DRYFIRE, SOF_3D|SOF_VOLUMETRIC);
      autowait(0.35f);
      return EEnd();
    }

    if (m_iStrongPistolBullets>0) {
    GetAnimator()->FireAnimation(BODY_ANIM_COLT_FIRERIGHT, 0);

    // fire bullet
    FireOneBullet(wpn_fFX[WEAPON_STRONGPISTOL], wpn_fFY[WEAPON_STRONGPISTOL], 500.0f,
    ((GetSP()->sp_bCooperative) ? 50.0f : 30.0f), DMT_BULLET);

    if(_pNetwork->IsPlayerLocal(m_penPlayer)) {IFeel_PlayEffect("StrongPistol_fire");}
    DoRecoil();
    SpawnRangeSound(40.0f);
    DecAmmo(m_iStrongPistolBullets, 1);
    SetFlare(0, FLARE_ADD);
    PlayLightAnim(LIGHT_ANIM_COLT_SHOTGUN, 0);

    // sound
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    PlaySound(pl.m_soWeapon0, SOUND_STRONGPISTOL_FIRE, SOF_3D|SOF_VOLUMETRIC);

    // pistol fire
    INDEX iAnim = STRONGPISTOLVIEWMODEL_ANIM_FIRE;
    m_moWeapon.PlayAnim(iAnim, 0);
    autowait(m_moWeapon.GetAnimLength(iAnim));
    m_bFireWeapon = FALSE;
    m_moWeapon.PlayAnim(STRONGPISTOLVIEWMODEL_ANIM_IDLE, AOF_LOOPING|AOF_NORESTART|AOF_SMOOTHCHANGE);
    }

    return EEnd();
  };

  // reload strong pistol
  ReloadStrongPistol() {
    if (m_iStrongPistolBullets>=7) {
      return EEnd();
    }

    if(m_iStrongBullets <= 0) {
      return EEnd();
    }

    // sound
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    PlaySound(pl.m_soWeapon1, SOUND_PISTOL_RELOAD, SOF_3D|SOF_VOLUMETRIC);
    m_moWeapon.PlayAnim(STRONGPISTOLVIEWMODEL_ANIM_LOWER, 0);
    autowait(m_moWeapon.GetAnimLength(STRONGPISTOLVIEWMODEL_ANIM_LOWER)+0.125f);
    if(_pNetwork->IsPlayerLocal(m_penPlayer)) {IFeel_PlayEffect("StrongPistol_reload");}

    while(m_iStrongPistolBullets < 7)
    {
      if(m_iStrongBullets <= 0)
      {
        m_moWeapon.PlayAnim(STRONGPISTOLVIEWMODEL_ANIM_RAISE, 0);
        autowait(m_moWeapon.GetAnimLength(STRONGPISTOLVIEWMODEL_ANIM_RAISE));

        return EEnd();
      }

      DecAmmo(m_iStrongBullets, 1);
      m_iStrongPistolBullets++;
    }

    m_moWeapon.PlayAnim(STRONGPISTOLVIEWMODEL_ANIM_RAISE, 0);
    autowait(m_moWeapon.GetAnimLength(STRONGPISTOLVIEWMODEL_ANIM_RAISE));

    return EEnd();
  };

  // ***************** STRONG PISTOL WHIP *****************
  AltStrongPistol() {
    // animator swing
    GetAnimator()->FireAnimation(BODY_ANIM_KNIFE_ATTACK, 0);
    // sound
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    
    m_iAnim = STRONGPISTOLVIEWMODEL_ANIM_MELEE; m_fAnimWaitTime = 0.35f;
    PlaySound(pl.m_soWeapon2, SOUND_KNIFE_SWING, SOF_3D|SOF_VOLUMETRIC);
      if(_pNetwork->IsPlayerLocal(m_penPlayer))
        {IFeel_PlayEffect("Knife_back");}
    m_moWeapon.PlayAnim(m_iAnim, 0);
    m_bMeleeHitEnemy = FALSE;
    m_bMeleeHitModel = FALSE;
    m_bMeleeHitBrush = FALSE;
    autowait(0.25f);
    if (CutWithKnife(0, 0, 3.0f, 2.0f, 0.5f, ((GetSP()->sp_bCooperative) ? 25.0f : 10.0f), DMT_BLUNT)) {
      if (m_bMeleeHitEnemy)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        switch(IRnd()%4)
        {
          case 0: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT1, SOF_3D|SOF_VOLUMETRIC); break;
          case 1: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT2, SOF_3D|SOF_VOLUMETRIC); break;
          case 2: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT3, SOF_3D|SOF_VOLUMETRIC); break;
          case 3: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT4, SOF_3D|SOF_VOLUMETRIC); break;
          default: ASSERTALWAYS("MetalPipe unknown hit sound");
        }
      }
      if (m_bMeleeHitModel || m_bMeleeHitBrush)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon3, SOUND_PIPE_BANG, SOF_3D|SOF_VOLUMETRIC);
      }
      autowait(m_fAnimWaitTime);
    } else if (TRUE) {
      autowait(m_fAnimWaitTime/2);
      CutWithKnife(0, 0, 3.0f, 2.0f, 0.5f, ((GetSP()->sp_bCooperative) ? 25.0f : 10.0f), DMT_BLUNT);
      if (m_bMeleeHitEnemy)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        switch(IRnd()%4)
        {
          case 0: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT1, SOF_3D|SOF_VOLUMETRIC); break;
          case 1: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT2, SOF_3D|SOF_VOLUMETRIC); break;
          case 2: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT3, SOF_3D|SOF_VOLUMETRIC); break;
          case 3: PlaySound(pl.m_soWeapon1, SOUND_PIPE_HIT4, SOF_3D|SOF_VOLUMETRIC); break;
          default: ASSERTALWAYS("MetalPipe unknown hit sound");
        }
      }
      if (m_bMeleeHitModel || m_bMeleeHitBrush)
      {
        CPlayer &pl = (CPlayer&)*m_penPlayer;
        PlaySound(pl.m_soWeapon3, SOUND_PIPE_BANG, SOF_3D|SOF_VOLUMETRIC);
      }
      autowait(m_fAnimWaitTime/2);
    }

    if (m_moWeapon.GetAnimLength(m_iAnim)-m_fAnimWaitTime>=_pTimer->TickQuantum) {
      autowait(m_moWeapon.GetAnimLength(m_iAnim)-m_fAnimWaitTime);
    }
    return EEnd();
  };

  Reload() {
    m_bReloadWeapon = FALSE;

    // reload
    if (m_iCurrentWeapon == WEAPON_PISTOL) {
      autocall ReloadPistol() EEnd;
    } else if (m_iCurrentWeapon == WEAPON_SHOTGUN) {
      autocall ReloadShotgun() EEnd;
    } else if (m_iCurrentWeapon == WEAPON_SMG) {
      autocall ReloadSMG() EEnd;
    } else if (m_iCurrentWeapon == WEAPON_STRONGPISTOL) {
      autocall ReloadStrongPistol() EEnd;
    } 

    jump Idle();
  };

  /*
   *  >>>---   BORING WEAPON ANIMATION   ---<<<
   */
  BoringWeaponAnimation() {
    // select new mode change animation
    FLOAT fWait = 0.0f;
    switch (m_iCurrentWeapon) {
      case WEAPON_HOLSTERED: fWait = 0.05f; break;
      case WEAPON_KNIFE: fWait = KnifeBoring(); break;
      case WEAPON_AXE: fWait = AxeBoring(); break;
      case WEAPON_PISTOL: fWait = PistolBoring(); break;
      case WEAPON_SHOTGUN: fWait = ShotgunBoring(); break;
      case WEAPON_SMG: fWait = SMGBoring(); break;
      case WEAPON_PIPE: fWait = PipeBoring(); break;
      case WEAPON_STRONGPISTOL: fWait = StrongPistolBoring(); break;
      default: ASSERTALWAYS("Unknown weapon.");
    }
    if (fWait > 0.0f) { autowait(fWait); }

    return EBegin();
  };



  /*
   *  >>>---   NO WEAPON ACTION   ---<<<
   */
  Idle() {

    wait() {
      on (EBegin) : {
        // play default anim
        PlayDefaultAnim();

        // weapon changed
        if (m_bChangeWeapon) {
          jump ChangeWeapon();
        }

        // fire pressed start firing
        if (m_bFireWeapon) {
          jump Fire();
        }

        // altfire pressed start altfiring
        if (m_bAltFireWeapon) {
          jump AltFire();
        }

        // holster pressed start holstering
        if (m_bHolsterWeapon) {
          jump Holster();
        }

        // drop pressed start dropping
        if (m_bDropWeapon) {
          jump DropWeaponEvent();
        }
        resume;
      }
      // select weapon
      on (ESelectWeapon eSelect) : {
        // try to change weapon
        SelectWeaponChange(eSelect.iWeapon);
        if (m_bChangeWeapon) {
          jump ChangeWeapon();
        }
        resume;
      }
      // fire pressed
      on (EFireWeapon) : {
        jump Fire();
      }
      // altfire pressed
      on (EAltFireWeapon) : {
        jump AltFire();
      }

      // reload pressed
      on (EReloadWeapon) : {
        jump Reload();
      }

      // holster pressed
      on (EHolsterWeapon) : {
          jump Holster();
      }

      // holster pressed
      on (EDropWeapon) : {
          jump DropWeaponEvent();
      }

      // boring weapon animation
      on (EBoringWeapon) : {
        call BoringWeaponAnimation();
      }
    }
  };

  // weapons wait here while player is dead, so that stupid animations wouldn't play
  Stopped()
  {
    // kill all possible sounds, animations, etc
    ResetWeaponMovingOffset();
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    pl.m_soWeapon0.Stop();
    pl.m_soWeapon1.Stop();
    pl.m_soWeapon2.Stop();
    pl.m_soWeapon3.Stop();
    PlayLightAnim(LIGHT_ANIM_NONE, 0);
    wait() {
      // after level change
      on (EPostLevelChange) : { return EBegin(); };
      on (EStart) : { return EBegin(); };
      otherwise() : { resume; };
    }
  }



  /*
   *  >>>---   M  A  I  N   ---<<<
   */
  Main(EWeaponsInit eInit) {
    // remember the initial parameters
    ASSERT(eInit.penOwner!=NULL);
    m_penPlayer = eInit.penOwner;

    // declare yourself as a void
    InitAsVoid();
    SetFlags(GetFlags()|ENF_CROSSESLEVELS|ENF_NOTIFYLEVELCHANGE);
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set weapon model for current weapon
    SetCurrentWeaponModel();

    // play default anim
    PlayDefaultAnim();    

    wait() {
      on (EBegin) : { call Idle(); }
      on (ESelectWeapon eSelect) : {
        // try to change weapon
        SelectWeaponChange(eSelect.iWeapon);
        resume;
      };
      // before level change
      on (EPreLevelChange) : { 
        // stop everything
        m_bFireWeapon = FALSE;
        m_bAltFireWeapon = FALSE;
        call Stopped();
        resume;
      }
      on (EFireWeapon) : {
        // start firing
        m_bFireWeapon = TRUE;
        resume;
      }
      on (EReleaseWeapon) : {
        // stop firing
        m_bFireWeapon = FALSE;
        resume;
      }
      on (EAltFireWeapon) : {
        // start altfiring
        m_bAltFireWeapon = TRUE;
        resume;
      }
      on (EAltReleaseWeapon) : {
        // stop altfiring
        m_bAltFireWeapon = FALSE;
        resume;
      }
      on (EReloadWeapon) : {
        // reload wepon
        m_bReloadWeapon = TRUE;
        resume;
      }
      on (EHolsterWeapon) : {
        // start holstering
        m_bHolsterWeapon = TRUE;
        resume;
      }
      on (EDropWeapon) : {
        // start dropping
        m_bDropWeapon = TRUE;
        resume;
      }
      on (EStop) : { call Stopped(); }
      on (EEnd) : { stop; }
    }

    // cease to exist
    Destroy();
    return;
  };
};
