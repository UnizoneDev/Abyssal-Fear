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

401
%{

#include "StdH.h"
#include "GameMP/SEColors.h"

#include <Engine/Build.h>
#include <Engine/Network/Network.h>
#include <locale.h>

#include "Models/Player/Uni/Player.h"
#include "Models/Player/Uni/Body.h"
#include "Models/Player/Uni/Head.h"

#include "EntitiesMP/PlayerMarker.h"
#include "EntitiesMP/PlayerWeapons.h"
#include "EntitiesMP/PlayerAnimator.h"
#include "EntitiesMP/PlayerView.h"
#include "EntitiesMP/MovingBrush.h"
#include "EntitiesMP/Switch.h"
#include "EntitiesMP/MessageHolder.h"
#include "EntitiesMP/Camera.h"
#include "EntitiesMP/WorldLink.h"
#include "EntitiesMP/HealthItem.h"
#include "EntitiesMP/ArmorItem.h"
#include "EntitiesMP/WeaponItem.h"
#include "EntitiesMP/AmmoItem.h"
#include "EntitiesMP/PowerUpItem.h"
#include "EntitiesMP/MessageItem.h"
#include "EntitiesMP/KeyItem.h"
#include "EntitiesMP/PuzzleItem.h"
#include "EntitiesMP/MusicHolder.h"
#include "EntitiesMP/EnemyBase.h"
#include "EntitiesMP/PlayerActionMarker.h"
#include "EntitiesMP/BasicEffects.h"
#include "EntitiesMP/BackgroundViewer.h"
#include "EntitiesMP/WorldSettingsController.h"
#include "EntitiesMP/ScrollHolder.h"
#include "EntitiesMP/TextFXHolder.h"
#include "EntitiesMP/SeriousBomb.h"
#include "EntitiesMP/CreditsHolder.h"
#include "EntitiesMP/HudPicHolder.h"
#include "EntitiesMP/OverlayHolder.h"

extern void JumpFromBouncer(CEntity *penToBounce, CEntity *penBouncer);
// from game
#define GRV_SHOWEXTRAS  (1L<<0)   // add extra stuff like console, weapon, pause

#define GENDER_MALE     0
#define GENDER_FEMALE   1
#define GENDEROFFSET    100   // sound components for genders are offset by this value

%}

enum PlayerViewType {
  0 PVT_PLAYEREYES      "",
  1 PVT_PLAYERAUTOVIEW  "",
  2 PVT_SCENECAMERA     "",
  3 PVT_3RDPERSONVIEW   "",
};

enum PlayerState {
  0 PST_STAND     "",
  1 PST_CROUCH    "",
  2 PST_SWIM      "",
  3 PST_DIVE      "",
  4 PST_FALL      "",
};

// event for starting cinematic camera sequence
event ECameraStart {
  CEntityPointer penCamera,   // the camera
};

// event for ending cinematic camera sequence
event ECameraStop {
  CEntityPointer penCamera,   // the camera
};


// sent when needs to rebirth
event ERebirth {
};

// sent when player was disconnected from game
event EDisconnected {
};

// starts automatic player actions
event EAutoAction {
  CEntityPointer penFirstMarker,
};

%{
extern void DrawHUD( const CPlayer *penPlayerCurrent, CDrawPort *pdpCurrent, BOOL bSnooping, const CPlayer *penPlayerOwner);
extern void InitHUD(void);
extern void EndHUD(void);

static CTimerValue _tvProbingLast;

// used to render certain entities only for certain players (like picked items, etc.)
extern ULONG _ulPlayerRenderingMask = 0;

// temporary BOOL used to discard calculating of 3rd view when calculating absolute view placement
BOOL _bDiscard3rdView=FALSE;

#define NAME name

const FLOAT _fBlowUpAmmount = 70.0f;

// computer message adding flags
#define CMF_READ       (1L<<0)
#define CMF_ANALYZE    (1L<<1)

struct MarkerDistance {
public:
  FLOAT md_fMinD;
  CPlayerMarker *md_ppm;
  void Clear(void);
};

// export current player projection
CAnyProjection3D prPlayerProjection;


int qsort_CompareMarkerDistance(const void *pv0, const void *pv1)
{
  MarkerDistance &md0 = *(MarkerDistance*)pv0;
  MarkerDistance &md1 = *(MarkerDistance*)pv1;
  if(      md0.md_fMinD<md1.md_fMinD) return +1;
  else if( md0.md_fMinD>md1.md_fMinD) return -1;
  else                                return  0;
}

static inline FLOAT IntensityAtDistance( FLOAT fFallOff, FLOAT fHotSpot, FLOAT fDistance)
{
  // intensity is zero if further than fall-off range
  if( fDistance>fFallOff) return 0.0f;
  // intensity is maximum if closer than hot-spot range
  if( fDistance<fHotSpot) return 1.0f;
  // interpolate if between fall-off and hot-spot range
  return (fFallOff-fDistance)/(fFallOff-fHotSpot);
}

static CTString MakeEmptyString(INDEX ctLen, char ch=' ')
{
  char ach[2];
  ach[0] = ch;
  ach[1] = 0;
  CTString strSpaces;
  for (INDEX i=0; i<ctLen; i++) {
    strSpaces+=ach;
  }
  return strSpaces;
}

// take a two line string and align into one line of minimum given length
static INDEX _ctAlignWidth = 20;
static CTString AlignString(const CTString &strOrg)
{
  // split into two lines
  CTString strL = strOrg;
  strL.OnlyFirstLine();
  CTString strR = strOrg;
  strR.RemovePrefix(strL);
  strR.DeleteChar(0);
  
  // get their lengths
  INDEX iLenL = strL.LengthNaked();
  INDEX iLenR = strR.LengthNaked();

  // find number of spaces to insert
  INDEX ctSpaces = _ctAlignWidth-(iLenL+iLenR);
  if (ctSpaces<1) {
    ctSpaces=1;
  }

  // make aligned string
  return strL+MakeEmptyString(ctSpaces)+strR;
}

static CTString CenterString(const CTString &str)
{
  INDEX ctSpaces = (_ctAlignWidth-str.LengthNaked())/2;
  if (ctSpaces<0) {
    ctSpaces=0;
  }
  return MakeEmptyString(ctSpaces)+str;
}

static CTString PadStringRight(const CTString &str, INDEX iLen)
{
  INDEX ctSpaces = iLen-str.LengthNaked();
  if (ctSpaces<0) {
    ctSpaces=0;
  }
  return str+MakeEmptyString(ctSpaces);
}

static CTString PadStringLeft(const CTString &str, INDEX iLen)
{
  INDEX ctSpaces = iLen-str.LengthNaked();
  if (ctSpaces<0) {
    ctSpaces=0;
  }
  return MakeEmptyString(ctSpaces)+str;
}

static void KillAllEnemies(CEntity *penKiller)
{
  // for each entity in the world
  {FOREACHINDYNAMICCONTAINER(penKiller->GetWorld()->wo_cenEntities, CEntity, iten) {
    CEntity *pen = iten;
    if (IsDerivedFromClass(pen, "Enemy Base") && !IsOfClass(pen, "Devil")) {
      CEnemyBase *penEnemy = (CEnemyBase *)pen;
      if (penEnemy->m_penEnemy==NULL) {
        continue;
      }
      penKiller->InflictDirectDamage(pen, penKiller, DMT_DAMAGER, 
        penEnemy->GetHealth()+1, pen->GetPlacement().pl_PositionVector, FLOAT3D(0,1,0));
    }
  }}
}


#define HEADING_MAX      45.0f
#define PITCH_MAX        90.0f
#define BANKING_MAX      45.0f

// player flags
#define PLF_INITIALIZED           (1UL<<0)   // set when player entity is ready to function
#define PLF_VIEWROTATIONCHANGED   (1UL<<1)   // for adjusting view rotation separately from legs
#define PLF_JUMPALLOWED           (1UL<<2)   // if jumping is allowed
#define PLF_SYNCWEAPON            (1UL<<3)   // weapon model needs to be synchronized before rendering
#define PLF_AUTOMOVEMENTS         (1UL<<4)   // complete automatic control of movements
#define PLF_DONTRENDER            (1UL<<5)   // don't render view (used at end of level)
#define PLF_CHANGINGLEVEL         (1UL<<6)   // mark that we next are to appear at start of new level
#define PLF_APPLIEDACTION         (1UL<<7)   // used to detect when player is not connected
#define PLF_NOTCONNECTED          (1UL<<8)   // set if the player is not connected
#define PLF_LEVELSTARTED          (1UL<<9)   // marks that level start time was recorded
#define PLF_ISZOOMING             (1UL<<10)  // marks that player is zoomed in with the sniper
#define PLF_RESPAWNINPLACE        (1UL<<11)  // don't move to marker when respawning (for current death only)

// defines representing flags used to fill player buttoned actions
#define PLACT_FIRE                (1L<<0)
#define PLACT_RELOAD              (1L<<1)
#define PLACT_WEAPON_NEXT         (1L<<2)
#define PLACT_WEAPON_PREV         (1L<<3)
#define PLACT_WEAPON_FLIP         (1L<<4)
#define PLACT_USE                 (1L<<5)
#define PLACT_3RD_PERSON_VIEW     (1L<<6)
#define PLACT_CENTER_VIEW         (1L<<7)
#define PLACT_USE_HELD            (1L<<8)
#define PLACT_SNIPER_ZOOMIN       (1L<<9)
#define PLACT_SNIPER_ZOOMOUT      (1L<<10)
#define PLACT_SNIPER_USE          (1L<<11)
#define PLACT_FIREBOMB            (1L<<12)
#define PLACT_ALTFIRE             (1L<<13)
#define PLACT_HOLSTER             (1L<<14)
#define PLACT_DROP_WEAPON         (1L<<15)
#define PLACT_SELECT_WEAPON_SHIFT (16)
#define PLACT_SELECT_WEAPON_MASK  (0x1FL<<PLACT_SELECT_WEAPON_SHIFT)
                                     
#define MAX_WEAPONS 30

#define PICKEDREPORT_TIME   (2.0f)  // how long (picked-up) message stays on screen

// is player spying another player
//extern TIME _tmSnoopingStarted;
//extern CEntity *_penTargeting;


struct PlayerControls {
  FLOAT3D aRotation;
  FLOAT3D aViewRotation;
  FLOAT3D vTranslation;

  BOOL bMoveForward;
  BOOL bMoveBackward;
  BOOL bMoveLeft;
  BOOL bMoveRight;
  BOOL bMoveUp;
  BOOL bMoveDown;

  BOOL bTurnLeft;
  BOOL bTurnRight;
  BOOL bTurnUp;
  BOOL bTurnDown;
  BOOL bTurnBankingLeft;
  BOOL bTurnBankingRight;
  BOOL bCenterView;

  BOOL bLookLeft;
  BOOL bLookRight;
  BOOL bLookUp;
  BOOL bLookDown;
  BOOL bLookBankingLeft;
  BOOL bLookBankingRight;

  BOOL bSelectWeapon[MAX_WEAPONS+1];
  BOOL bWeaponNext;
  BOOL bWeaponPrev;
  BOOL bWeaponFlip;
  
  BOOL bWalk;
  BOOL bStrafe;
  BOOL bFire;
  BOOL bAltFire;
  BOOL bReload;
  BOOL bHolster;
  BOOL bDropWeapon;
  BOOL bUse;
  BOOL b3rdPersonView;

  BOOL bSniperZoomIn;
  BOOL bSniperZoomOut;
  BOOL bFireBomb;
};

static struct PlayerControls pctlCurrent;

// cheats
static INDEX cht_iGoToMarker = -1;
static INDEX cht_bKillAll    = FALSE;
static INDEX cht_bGiveAll    = FALSE;
static INDEX cht_bOpen       = FALSE;
static INDEX cht_bRefresh    = FALSE;
extern INDEX cht_bGod        = FALSE;
extern INDEX cht_bFly        = FALSE;
extern INDEX cht_bGhost      = FALSE;
extern INDEX cht_bInvisible  = FALSE;
extern FLOAT cht_fTranslationMultiplier = 1.0f;
extern INDEX cht_bEnable     = 0;   

// interface control
static INDEX hud_bShowAll	    = TRUE; // used internaly in menu/console
extern INDEX hud_bShowWeapon  = TRUE;
extern INDEX hud_bShowMessages = TRUE;
extern INDEX hud_bShowInfo    = TRUE;
extern INDEX hud_bShowLatency = FALSE;
extern INDEX hud_iShowPlayers = -1;   // auto
extern INDEX hud_iSortPlayers = -1;   // auto
extern FLOAT hud_fOpacity     = 0.9f;
extern FLOAT hud_fScaling     = 0.75f;
extern FLOAT hud_tmWeaponsOnScreen = 3.0f;
extern FLOAT hud_tmLatencySnapshot = 1.0f;
extern INDEX hud_bShowMatchInfo = TRUE;

extern FLOAT plr_fBreathingStrength = 0.0f;
extern FLOAT plr_tmSnoopingTime;
extern INDEX cht_bKillFinalBoss = FALSE;
INDEX cht_bDebugFinalBoss = FALSE;
INDEX cht_bDumpFinalBossData = FALSE;
INDEX cht_bDebugFinalBossAnimations = FALSE;
INDEX cht_bDumpPlayerShading = FALSE;

extern FLOAT wpn_fRecoilSpeed[17]   = {0};
extern FLOAT wpn_fRecoilLimit[17]   = {0};
extern FLOAT wpn_fRecoilDampUp[17]  = {0};
extern FLOAT wpn_fRecoilDampDn[17]  = {0};
extern FLOAT wpn_fRecoilOffset[17]  = {0};
extern FLOAT wpn_fRecoilFactorP[17] = {0};
extern FLOAT wpn_fRecoilFactorZ[17] = {0};

// misc
static FLOAT plr_fAcceleration  = 100.0f;
static FLOAT plr_fDeceleration  = 60.0f;
static FLOAT plr_fSpeedForward  = 8.0f;
static FLOAT plr_fSpeedBackward = 8.0f;
static FLOAT plr_fSpeedSide     = 8.0f;
static FLOAT plr_fSpeedUp       = 9.0f;
static FLOAT plr_fViewHeightStand  = 1.9f;
static FLOAT plr_fViewHeightCrouch = 0.7f;
static FLOAT plr_fViewHeightSwim   = 0.4f;
static FLOAT plr_fViewHeightDive   = 0.0f;
extern FLOAT plr_fViewDampFactor        = 0.4f;
extern FLOAT plr_fViewDampLimitGroundUp = 0.1f;
extern FLOAT plr_fViewDampLimitGroundDn = 0.4f;
extern FLOAT plr_fViewDampLimitWater    = 0.1f;
static FLOAT plr_fFrontClipDistance = 0.25f;
static FLOAT plr_fFOV = 106.26f;
static FLOAT net_tmLatencyAvg;
extern INDEX plr_bRenderPicked = FALSE;
extern INDEX plr_bRenderPickedParticles = FALSE;
extern INDEX plr_bOnlySam = FALSE;
extern INDEX ent_bReportBrokenChains = FALSE;
extern FLOAT ent_tmMentalIn   = 0.5f;
extern FLOAT ent_tmMentalOut  = 0.75f;
extern FLOAT ent_tmMentalFade = 0.5f;

extern FLOAT gfx_fEnvParticlesDensity = 1.0f;
extern FLOAT gfx_fEnvParticlesRange = 1.0f;

// prediction control vars
extern FLOAT cli_fPredictPlayersRange = 0.0f;
extern FLOAT cli_fPredictItemsRange = 3.0f;
extern FLOAT cli_tmPredictFoe = 10.0f;
extern FLOAT cli_tmPredictAlly = 10.0f;
extern FLOAT cli_tmPredictEnemy  = 10.0f;

static FLOAT plr_fSwimSoundDelay = 0.8f;
static FLOAT plr_fDiveSoundDelay = 1.6f;
static FLOAT plr_fWalkSoundDelay = 0.5f;
static FLOAT plr_fRunSoundDelay  = 0.3f;

// speeds for button rotation
static FLOAT ctl_fButtonRotationSpeedH = 300.0f;
static FLOAT ctl_fButtonRotationSpeedP = 150.0f;
static FLOAT ctl_fButtonRotationSpeedB = 150.0f;
// modifier for axis strafing
static FLOAT ctl_fAxisStrafingModifier = 1.0f;

extern INDEX sam_bDisallowExit = FALSE;
extern INDEX sam_bDisallowConsole = FALSE;
extern INDEX sam_bGoldenSwitch1 = FALSE;
extern INDEX sam_bGoldenSwitch2 = FALSE;
extern INDEX sam_bGoldenSwitch3 = FALSE;
extern INDEX sam_bGoldenSwitch4 = FALSE;

// game sets this for player hud and statistics and hiscore sound playing
DECL_DLL extern INDEX plr_iHiScore = 0.0f;

// these define address and size of player controls structure
DECL_DLL extern void *ctl_pvPlayerControls = &pctlCurrent;
DECL_DLL extern const SLONG ctl_slPlayerControlsSize = sizeof(pctlCurrent);

// called to compose action packet from current controls
DECL_DLL void ctl_ComposeActionPacket(const CPlayerCharacter &pc, CPlayerAction &paAction, BOOL bPreScan)
{
  // allow double axis controls
  paAction.pa_aRotation += paAction.pa_aViewRotation;

  CPlayerSettings *pps = (CPlayerSettings *)pc.pc_aubAppearance;
//  CPrintF("compose: prescan %d, x:%g\n", bPreScan, paAction.pa_aRotation(1));
  // if strafing
  if (pctlCurrent.bStrafe) {
    // move rotation left/right into translation left/right
    paAction.pa_vTranslation(1) = -paAction.pa_aRotation(1)*ctl_fAxisStrafingModifier;
    paAction.pa_aRotation(1) = 0;
  }
  // if centering view
  if (pctlCurrent.bCenterView) {
    // don't allow moving view up/down
    paAction.pa_aRotation(2) = 0;
  }

  // multiply axis actions with speed
  paAction.pa_vTranslation(1) *= plr_fSpeedSide;
  paAction.pa_vTranslation(2) *= plr_fSpeedUp;
  if (paAction.pa_vTranslation(3)<0) {
    paAction.pa_vTranslation(3) *= plr_fSpeedForward;
  } else {
    paAction.pa_vTranslation(3) *= plr_fSpeedBackward;
  }

  // find local player, if any
  CPlayer *penThis = NULL;
  INDEX ctPlayers = CEntity::GetMaxPlayers();
  for (INDEX iPlayer = 0; iPlayer<ctPlayers; iPlayer++) {
    CPlayer *pen=(CPlayer *)CEntity::GetPlayerEntity(iPlayer);
    if (pen!=NULL && pen->en_pcCharacter==pc) {
      penThis = pen;
      break;
    }
  }
  // if not found
  if (penThis==NULL) {
    // do nothing
    return;
  }

  // accumulate local rotation
  penThis->m_aLocalRotation    +=paAction.pa_aRotation;
  penThis->m_aLocalViewRotation+=paAction.pa_aViewRotation;
  penThis->m_vLocalTranslation +=paAction.pa_vTranslation;

  // if prescanning
  if (bPreScan) {
    // no button checking
    return;
  }

  // add button movement/rotation/look actions to the axis actions
  if(pctlCurrent.bMoveForward  ) paAction.pa_vTranslation(3) -= plr_fSpeedForward;
  if(pctlCurrent.bMoveBackward ) paAction.pa_vTranslation(3) += plr_fSpeedBackward;
  if(pctlCurrent.bMoveLeft  || pctlCurrent.bStrafe&&pctlCurrent.bTurnLeft) paAction.pa_vTranslation(1) -= plr_fSpeedSide;
  if(pctlCurrent.bMoveRight || pctlCurrent.bStrafe&&pctlCurrent.bTurnRight) paAction.pa_vTranslation(1) += plr_fSpeedSide;
  if(pctlCurrent.bMoveUp       ) paAction.pa_vTranslation(2) += plr_fSpeedUp;
  if(pctlCurrent.bMoveDown     ) paAction.pa_vTranslation(2) -= plr_fSpeedUp;

  const FLOAT fQuantum = _pTimer->TickQuantum;
  if(pctlCurrent.bTurnLeft  && !pctlCurrent.bStrafe) penThis->m_aLocalRotation(1) += ctl_fButtonRotationSpeedH*fQuantum;
  if(pctlCurrent.bTurnRight && !pctlCurrent.bStrafe) penThis->m_aLocalRotation(1) -= ctl_fButtonRotationSpeedH*fQuantum;
  if(pctlCurrent.bTurnUp           ) penThis->m_aLocalRotation(2) += ctl_fButtonRotationSpeedP*fQuantum;
  if(pctlCurrent.bTurnDown         ) penThis->m_aLocalRotation(2) -= ctl_fButtonRotationSpeedP*fQuantum;
  if(pctlCurrent.bTurnBankingLeft  ) penThis->m_aLocalRotation(3) += ctl_fButtonRotationSpeedB*fQuantum;
  if(pctlCurrent.bTurnBankingRight ) penThis->m_aLocalRotation(3) -= ctl_fButtonRotationSpeedB*fQuantum;

  if(pctlCurrent.bLookLeft         ) penThis->m_aLocalViewRotation(1) += ctl_fButtonRotationSpeedH*fQuantum;
  if(pctlCurrent.bLookRight        ) penThis->m_aLocalViewRotation(1) -= ctl_fButtonRotationSpeedH*fQuantum;
  if(pctlCurrent.bLookUp           ) penThis->m_aLocalViewRotation(2) += ctl_fButtonRotationSpeedP*fQuantum;
  if(pctlCurrent.bLookDown         ) penThis->m_aLocalViewRotation(2) -= ctl_fButtonRotationSpeedP*fQuantum;
  if(pctlCurrent.bLookBankingLeft  ) penThis->m_aLocalViewRotation(3) += ctl_fButtonRotationSpeedB*fQuantum;
  if(pctlCurrent.bLookBankingRight ) penThis->m_aLocalViewRotation(3) -= ctl_fButtonRotationSpeedB*fQuantum;

  // use current accumulated rotation
  paAction.pa_aRotation     = penThis->m_aLocalRotation;
  paAction.pa_aViewRotation = penThis->m_aLocalViewRotation;
  //paAction.pa_vTranslation  = penThis->m_vLocalTranslation;

  // if walking
  if(pctlCurrent.bWalk) {
    // make forward/backward and sidestep speeds slower
    paAction.pa_vTranslation(3) /= 2.0f;
    paAction.pa_vTranslation(1) /= 2.0f;
  }
  
  // reset all button actions
  paAction.pa_ulButtons = 0;

  // set weapon selection bits
  for(INDEX i=1; i<MAX_WEAPONS; i++) {
    if(pctlCurrent.bSelectWeapon[i]) {
      paAction.pa_ulButtons = i<<PLACT_SELECT_WEAPON_SHIFT;
      break;
    }
  }
  // set button pressed flags
  if(pctlCurrent.bWeaponNext) paAction.pa_ulButtons |= PLACT_WEAPON_NEXT;
  if(pctlCurrent.bWeaponPrev) paAction.pa_ulButtons |= PLACT_WEAPON_PREV;
  if(pctlCurrent.bWeaponFlip) paAction.pa_ulButtons |= PLACT_WEAPON_FLIP;
  if(pctlCurrent.bFire)       paAction.pa_ulButtons |= PLACT_FIRE;
  if(pctlCurrent.bAltFire)    paAction.pa_ulButtons |= PLACT_ALTFIRE;
  if(pctlCurrent.bReload)     paAction.pa_ulButtons |= PLACT_RELOAD;
  if(pctlCurrent.bUse)        paAction.pa_ulButtons |= PLACT_USE|PLACT_USE_HELD|PLACT_SNIPER_USE;
  if(pctlCurrent.b3rdPersonView) paAction.pa_ulButtons |= PLACT_3RD_PERSON_VIEW;
  if(pctlCurrent.bCenterView)    paAction.pa_ulButtons |= PLACT_CENTER_VIEW;
  // is 'use' being held?
  if(pctlCurrent.bSniperZoomIn)  paAction.pa_ulButtons |= PLACT_SNIPER_ZOOMIN;
  if(pctlCurrent.bSniperZoomOut) paAction.pa_ulButtons |= PLACT_SNIPER_ZOOMOUT;
  if(pctlCurrent.bFireBomb)      paAction.pa_ulButtons |= PLACT_FIREBOMB;
  if(pctlCurrent.bHolster)       paAction.pa_ulButtons |= PLACT_HOLSTER;
  if(pctlCurrent.bDropWeapon)    paAction.pa_ulButtons |= PLACT_DROP_WEAPON;
};

void CPlayer_Precache(void)
{
  CDLLEntityClass *pdec = &CPlayer_DLLClass;

  // precache view
  extern void CPlayerView_Precache(void);
  CPlayerView_Precache();

  // precache all player sounds
  pdec->PrecacheSound(SOUND_WATER_ENTER        );
  pdec->PrecacheSound(SOUND_WATER_LEAVE        );
  pdec->PrecacheSound(SOUND_WALK_L             );
  pdec->PrecacheSound(SOUND_WALK_R             );
  pdec->PrecacheSound(SOUND_WALK_SAND_L        );
  pdec->PrecacheSound(SOUND_WALK_SAND_R        );
  pdec->PrecacheSound(SOUND_SWIM_L             );
  pdec->PrecacheSound(SOUND_SWIM_R             );
  pdec->PrecacheSound(SOUND_DIVE_L             );
  pdec->PrecacheSound(SOUND_DIVE_R             );
  pdec->PrecacheSound(SOUND_JUMP               );
  pdec->PrecacheSound(SOUND_LAND               );
  pdec->PrecacheSound(SOUND_LAND_SAND          );
  pdec->PrecacheSound(SOUND_LAND_GRASS         );
  pdec->PrecacheSound(SOUND_LAND_WOOD          );
  pdec->PrecacheSound(SOUND_LAND_SNOW          );
  pdec->PrecacheSound(SOUND_LAND_METAL         );
  pdec->PrecacheSound(SOUND_LAND_CARPET        );
  pdec->PrecacheSound(SOUND_LAND_GLASS         );
  pdec->PrecacheSound(SOUND_LAND_DIRT          );
  pdec->PrecacheSound(SOUND_LAND_TILE          );
  pdec->PrecacheSound(SOUND_LAND_CHAINLINK     );
  pdec->PrecacheSound(SOUND_LAND_GRATE         );
  pdec->PrecacheSound(SOUND_LAND_MUD           );
  pdec->PrecacheSound(SOUND_LAND_VENT          );
  pdec->PrecacheSound(SOUND_LAND_COMPUTER      );
  pdec->PrecacheSound(SOUND_LAND_FUSEBOX       );
  pdec->PrecacheSound(SOUND_WATERAMBIENT       );
  pdec->PrecacheSound(SOUND_WATERBUBBLES       );
  pdec->PrecacheSound(SOUND_WATERWALK_L        );
  pdec->PrecacheSound(SOUND_WATERWALK_R        );
  pdec->PrecacheSound(SOUND_INFO               );
  pdec->PrecacheSound(SOUND_SECRET             );
  pdec->PrecacheSound(SOUND_WALK_GRASS_L       );
  pdec->PrecacheSound(SOUND_WALK_GRASS_R       );
  pdec->PrecacheSound(SOUND_WALK_WOOD_L        );
  pdec->PrecacheSound(SOUND_WALK_WOOD_R        );
  pdec->PrecacheSound(SOUND_WALK_SNOW_L        );
  pdec->PrecacheSound(SOUND_WALK_SNOW_R        );
  pdec->PrecacheSound(SOUND_WALK_METAL_L       );
  pdec->PrecacheSound(SOUND_WALK_METAL_R       );
  pdec->PrecacheSound(SOUND_WALK_CARPET_L      );
  pdec->PrecacheSound(SOUND_WALK_CARPET_R      );
  pdec->PrecacheSound(SOUND_WALK_GLASS_L       );
  pdec->PrecacheSound(SOUND_WALK_GLASS_R       );
  pdec->PrecacheSound(SOUND_WALK_DIRT_L        );
  pdec->PrecacheSound(SOUND_WALK_DIRT_R        );
  pdec->PrecacheSound(SOUND_WALK_TILE_L        );
  pdec->PrecacheSound(SOUND_WALK_TILE_R        );
  pdec->PrecacheSound(SOUND_WALK_CHAINLINK_L   );
  pdec->PrecacheSound(SOUND_WALK_CHAINLINK_R   );
  pdec->PrecacheSound(SOUND_WALK_GRATE_L       );
  pdec->PrecacheSound(SOUND_WALK_GRATE_R       );
  pdec->PrecacheSound(SOUND_WALK_MUD_L         );
  pdec->PrecacheSound(SOUND_WALK_MUD_R         );
  pdec->PrecacheSound(SOUND_WALK_VENT_L        );
  pdec->PrecacheSound(SOUND_WALK_VENT_R        );
  pdec->PrecacheSound(SOUND_WALK_COMPUTER_L    );
  pdec->PrecacheSound(SOUND_WALK_COMPUTER_R    );
  pdec->PrecacheSound(SOUND_WALK_FUSEBOX_L     );
  pdec->PrecacheSound(SOUND_WALK_FUSEBOX_R     );
//pdec->PrecacheSound(SOUND_HIGHSCORE          );
  pdec->PrecacheSound(SOUND_SILENCE            );
  pdec->PrecacheSound(SOUND_BLOWUP             );

  pdec->PrecacheClass(CLASS_BASIC_EFFECT, BET_TELEPORT);
  pdec->PrecacheClass(CLASS_SERIOUSBOMB);

  pdec->PrecacheModel(MODEL_FLESH);
  pdec->PrecacheTexture(TEXTURE_FLESH_RED);
  pdec->PrecacheTexture(TEXTURE_FLESH_GREEN); 

  pdec->PrecacheClass(CLASS_BASIC_EFFECT, BET_BLOODSPILL);
  pdec->PrecacheClass(CLASS_BASIC_EFFECT, BET_BLOODSTAIN);
  pdec->PrecacheClass(CLASS_BASIC_EFFECT, BET_BLOODSTAINGROW);
  pdec->PrecacheClass(CLASS_BASIC_EFFECT, BET_BLOODEXPLODE);
}

void CPlayer_OnInitClass(void)
{
  // clear current player controls
  memset(&pctlCurrent, 0, sizeof(pctlCurrent));
  // declare player control variables
  _pShell->DeclareSymbol("user INDEX ctl_bMoveForward;",  &pctlCurrent.bMoveForward);
  _pShell->DeclareSymbol("user INDEX ctl_bMoveBackward;", &pctlCurrent.bMoveBackward);
  _pShell->DeclareSymbol("user INDEX ctl_bMoveLeft;",     &pctlCurrent.bMoveLeft);
  _pShell->DeclareSymbol("user INDEX ctl_bMoveRight;",    &pctlCurrent.bMoveRight);
  _pShell->DeclareSymbol("user INDEX ctl_bMoveUp;",       &pctlCurrent.bMoveUp);
  _pShell->DeclareSymbol("user INDEX ctl_bMoveDown;",     &pctlCurrent.bMoveDown);
  _pShell->DeclareSymbol("user INDEX ctl_bTurnLeft;",         &pctlCurrent.bTurnLeft);
  _pShell->DeclareSymbol("user INDEX ctl_bTurnRight;",        &pctlCurrent.bTurnRight);
  _pShell->DeclareSymbol("user INDEX ctl_bTurnUp;",           &pctlCurrent.bTurnUp);
  _pShell->DeclareSymbol("user INDEX ctl_bTurnDown;",         &pctlCurrent.bTurnDown);
  _pShell->DeclareSymbol("user INDEX ctl_bTurnBankingLeft;",  &pctlCurrent.bTurnBankingLeft);
  _pShell->DeclareSymbol("user INDEX ctl_bTurnBankingRight;", &pctlCurrent.bTurnBankingRight);
  _pShell->DeclareSymbol("user INDEX ctl_bCenterView;",       &pctlCurrent.bCenterView);
  _pShell->DeclareSymbol("user INDEX ctl_bLookLeft;",         &pctlCurrent.bLookLeft);
  _pShell->DeclareSymbol("user INDEX ctl_bLookRight;",        &pctlCurrent.bLookRight);
  _pShell->DeclareSymbol("user INDEX ctl_bLookUp;",           &pctlCurrent.bLookUp);
  _pShell->DeclareSymbol("user INDEX ctl_bLookDown;",         &pctlCurrent.bLookDown);
  _pShell->DeclareSymbol("user INDEX ctl_bLookBankingLeft;",  &pctlCurrent.bLookBankingLeft);
  _pShell->DeclareSymbol("user INDEX ctl_bLookBankingRight;", &pctlCurrent.bLookBankingRight );
  _pShell->DeclareSymbol("user INDEX ctl_bWalk;",           &pctlCurrent.bWalk);
  _pShell->DeclareSymbol("user INDEX ctl_bStrafe;",         &pctlCurrent.bStrafe);
  _pShell->DeclareSymbol("user INDEX ctl_bFire;",           &pctlCurrent.bFire);
  _pShell->DeclareSymbol("user INDEX ctl_bAltFire;",        &pctlCurrent.bAltFire);
  _pShell->DeclareSymbol("user INDEX ctl_bReload;",         &pctlCurrent.bReload);
  _pShell->DeclareSymbol("user INDEX ctl_bUse;",            &pctlCurrent.bUse);
  _pShell->DeclareSymbol("user INDEX ctl_b3rdPersonView;",  &pctlCurrent.b3rdPersonView);
  _pShell->DeclareSymbol("user INDEX ctl_bWeaponNext;",         &pctlCurrent.bWeaponNext);
  _pShell->DeclareSymbol("user INDEX ctl_bWeaponPrev;",         &pctlCurrent.bWeaponPrev);
  _pShell->DeclareSymbol("user INDEX ctl_bWeaponFlip;",         &pctlCurrent.bWeaponFlip);
  _pShell->DeclareSymbol("user INDEX ctl_bSelectWeapon[30+1];", &pctlCurrent.bSelectWeapon);
  _pShell->DeclareSymbol("user INDEX ctl_bHolster;",            &pctlCurrent.bHolster);
  _pShell->DeclareSymbol("user INDEX ctl_bDropWeapon;",         &pctlCurrent.bDropWeapon);
  _pShell->DeclareSymbol("persistent user FLOAT ctl_fButtonRotationSpeedH;", &ctl_fButtonRotationSpeedH);
  _pShell->DeclareSymbol("persistent user FLOAT ctl_fButtonRotationSpeedP;", &ctl_fButtonRotationSpeedP);
  _pShell->DeclareSymbol("persistent user FLOAT ctl_fButtonRotationSpeedB;", &ctl_fButtonRotationSpeedB);
  _pShell->DeclareSymbol("persistent user FLOAT ctl_fAxisStrafingModifier;", &ctl_fAxisStrafingModifier);
  //new
  _pShell->DeclareSymbol("user INDEX ctl_bSniperZoomIn;",         &pctlCurrent.bSniperZoomIn);
  _pShell->DeclareSymbol("user INDEX ctl_bSniperZoomOut;",        &pctlCurrent.bSniperZoomOut);
  _pShell->DeclareSymbol("user INDEX ctl_bFireBomb;",             &pctlCurrent.bFireBomb);

  _pShell->DeclareSymbol("user FLOAT plr_fSwimSoundDelay;", &plr_fSwimSoundDelay);
  _pShell->DeclareSymbol("user FLOAT plr_fDiveSoundDelay;", &plr_fDiveSoundDelay);
  _pShell->DeclareSymbol("user FLOAT plr_fWalkSoundDelay;", &plr_fWalkSoundDelay);
  _pShell->DeclareSymbol("user FLOAT plr_fRunSoundDelay;",  &plr_fRunSoundDelay);

  _pShell->DeclareSymbol("persistent user FLOAT cli_fPredictPlayersRange;",&cli_fPredictPlayersRange);
  _pShell->DeclareSymbol("persistent user FLOAT cli_fPredictItemsRange;",  &cli_fPredictItemsRange  );
  _pShell->DeclareSymbol("persistent user FLOAT cli_tmPredictFoe;",        &cli_tmPredictFoe        );
  _pShell->DeclareSymbol("persistent user FLOAT cli_tmPredictAlly;",       &cli_tmPredictAlly       );
  _pShell->DeclareSymbol("persistent user FLOAT cli_tmPredictEnemy;",      &cli_tmPredictEnemy      );

  _pShell->DeclareSymbol("     INDEX hud_bShowAll;",     &hud_bShowAll);
  _pShell->DeclareSymbol("user INDEX hud_bShowInfo;",    &hud_bShowInfo);
  _pShell->DeclareSymbol("user const FLOAT net_tmLatencyAvg;", &net_tmLatencyAvg);
  _pShell->DeclareSymbol("persistent user INDEX hud_bShowLatency;", &hud_bShowLatency);
  _pShell->DeclareSymbol("persistent user INDEX hud_iShowPlayers;", &hud_iShowPlayers);
  _pShell->DeclareSymbol("persistent user INDEX hud_iSortPlayers;", &hud_iSortPlayers);
  _pShell->DeclareSymbol("persistent user INDEX hud_bShowWeapon;",  &hud_bShowWeapon);
  _pShell->DeclareSymbol("persistent user INDEX hud_bShowMessages;",&hud_bShowMessages);
  _pShell->DeclareSymbol("persistent user FLOAT hud_fScaling;",     &hud_fScaling);
  _pShell->DeclareSymbol("persistent user FLOAT hud_fOpacity;",     &hud_fOpacity);
  _pShell->DeclareSymbol("persistent user FLOAT hud_tmWeaponsOnScreen;",  &hud_tmWeaponsOnScreen);
  _pShell->DeclareSymbol("persistent user FLOAT hud_tmLatencySnapshot;",  &hud_tmLatencySnapshot);
  _pShell->DeclareSymbol("persistent user FLOAT plr_fBreathingStrength;", &plr_fBreathingStrength);
  _pShell->DeclareSymbol("INDEX cht_bKillFinalBoss;",  &cht_bKillFinalBoss);
  _pShell->DeclareSymbol("INDEX cht_bDebugFinalBoss;", &cht_bDebugFinalBoss);
  _pShell->DeclareSymbol("INDEX cht_bDumpFinalBossData;", &cht_bDumpFinalBossData);
  _pShell->DeclareSymbol("INDEX cht_bDebugFinalBossAnimations;", &cht_bDebugFinalBossAnimations);
  _pShell->DeclareSymbol("INDEX cht_bDumpPlayerShading;", &cht_bDumpPlayerShading);
  _pShell->DeclareSymbol("persistent user INDEX hud_bShowMatchInfo;", &hud_bShowMatchInfo);

  _pShell->DeclareSymbol("persistent user FLOAT wpn_fRecoilSpeed[17];",   &wpn_fRecoilSpeed);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fRecoilLimit[17];",   &wpn_fRecoilLimit);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fRecoilDampUp[17];",  &wpn_fRecoilDampUp);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fRecoilDampDn[17];",  &wpn_fRecoilDampDn);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fRecoilOffset[17];",  &wpn_fRecoilOffset);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fRecoilFactorP[17];", &wpn_fRecoilFactorP);
  _pShell->DeclareSymbol("persistent user FLOAT wpn_fRecoilFactorZ[17];", &wpn_fRecoilFactorZ);

  // cheats
  _pShell->DeclareSymbol("user INDEX cht_bGod;",       &cht_bGod);
  _pShell->DeclareSymbol("user INDEX cht_bFly;",       &cht_bFly);
  _pShell->DeclareSymbol("user INDEX cht_bGhost;",     &cht_bGhost);
  _pShell->DeclareSymbol("user INDEX cht_bInvisible;", &cht_bInvisible);
  _pShell->DeclareSymbol("user INDEX cht_bGiveAll;",   &cht_bGiveAll);
  _pShell->DeclareSymbol("user INDEX cht_bKillAll;",   &cht_bKillAll);
  _pShell->DeclareSymbol("user INDEX cht_bOpen;",      &cht_bOpen);
  _pShell->DeclareSymbol("user FLOAT cht_fTranslationMultiplier ;", &cht_fTranslationMultiplier);
  _pShell->DeclareSymbol("user INDEX cht_bRefresh;", &cht_bRefresh);
  // this one is masqueraded cheat enable variable
  _pShell->DeclareSymbol("INDEX cht_bEnable;", &cht_bEnable);

  // this cheat is always enabled
  _pShell->DeclareSymbol("user INDEX cht_iGoToMarker;", &cht_iGoToMarker);

  // player speed and view parameters, not declared except in internal build
  #if 0
    _pShell->DeclareSymbol("user FLOAT plr_fViewHeightStand;", &plr_fViewHeightStand);
    _pShell->DeclareSymbol("user FLOAT plr_fViewHeightCrouch;",&plr_fViewHeightCrouch);
    _pShell->DeclareSymbol("user FLOAT plr_fViewHeightSwim;",  &plr_fViewHeightSwim);
    _pShell->DeclareSymbol("user FLOAT plr_fViewHeightDive;",  &plr_fViewHeightDive);
    _pShell->DeclareSymbol("user FLOAT plr_fViewDampFactor;",         &plr_fViewDampFactor);
    _pShell->DeclareSymbol("user FLOAT plr_fViewDampLimitGroundUp;",  &plr_fViewDampLimitGroundUp);
    _pShell->DeclareSymbol("user FLOAT plr_fViewDampLimitGroundDn;",  &plr_fViewDampLimitGroundDn);
    _pShell->DeclareSymbol("user FLOAT plr_fViewDampLimitWater;",     &plr_fViewDampLimitWater);
    _pShell->DeclareSymbol("user FLOAT plr_fAcceleration;",  &plr_fAcceleration);
    _pShell->DeclareSymbol("user FLOAT plr_fDeceleration;",  &plr_fDeceleration);
    _pShell->DeclareSymbol("user FLOAT plr_fSpeedForward;",  &plr_fSpeedForward);
    _pShell->DeclareSymbol("user FLOAT plr_fSpeedBackward;", &plr_fSpeedBackward);
    _pShell->DeclareSymbol("user FLOAT plr_fSpeedSide;",     &plr_fSpeedSide);
    _pShell->DeclareSymbol("user FLOAT plr_fSpeedUp;",       &plr_fSpeedUp);
  #endif
  _pShell->DeclareSymbol("persistent user FLOAT plr_fFOV;", &plr_fFOV);
  _pShell->DeclareSymbol("persistent user FLOAT plr_fFrontClipDistance;", &plr_fFrontClipDistance);
  _pShell->DeclareSymbol("persistent user INDEX plr_bRenderPicked;", &plr_bRenderPicked);
  _pShell->DeclareSymbol("persistent user INDEX plr_bRenderPickedParticles;", &plr_bRenderPickedParticles);
  _pShell->DeclareSymbol("persistent user INDEX plr_bOnlySam;", &plr_bOnlySam);
  _pShell->DeclareSymbol("persistent user INDEX ent_bReportBrokenChains;", &ent_bReportBrokenChains);
  _pShell->DeclareSymbol("persistent user FLOAT ent_tmMentalIn  ;", &ent_tmMentalIn  );
  _pShell->DeclareSymbol("persistent user FLOAT ent_tmMentalOut ;", &ent_tmMentalOut );
  _pShell->DeclareSymbol("persistent user FLOAT ent_tmMentalFade;", &ent_tmMentalFade);
  _pShell->DeclareSymbol("persistent user FLOAT gfx_fEnvParticlesDensity;", &gfx_fEnvParticlesDensity);
  _pShell->DeclareSymbol("persistent user FLOAT gfx_fEnvParticlesRange;", &gfx_fEnvParticlesRange);

  // player appearance interface
  _pShell->DeclareSymbol("INDEX SetPlayerAppearance(INDEX, INDEX, INDEX, INDEX);", &SetPlayerAppearance);

  _pShell->DeclareSymbol("INDEX sam_bDisallowExit;", &sam_bDisallowExit);
  _pShell->DeclareSymbol("INDEX sam_bDisallowConsole;", &sam_bDisallowConsole);
  _pShell->DeclareSymbol("INDEX sam_bGoldenSwitch1;", &sam_bGoldenSwitch1);
  _pShell->DeclareSymbol("INDEX sam_bGoldenSwitch2;", &sam_bGoldenSwitch2);
  _pShell->DeclareSymbol("INDEX sam_bGoldenSwitch3;", &sam_bGoldenSwitch3);
  _pShell->DeclareSymbol("INDEX sam_bGoldenSwitch4;", &sam_bGoldenSwitch4);

  // call player weapons persistant variable initialization
  extern void CPlayerWeapons_Init(void);
  CPlayerWeapons_Init();

  // initialize HUD
  InitHUD();

  // precache
  CPlayer_Precache();
}

// clean up
void CPlayer_OnEndClass(void)
{
  EndHUD();
}

CTString GetDifficultyString(void)
{
  if (GetSP()->sp_bMental) { return TRANS("Nightmare"); }

  switch (GetSP()->sp_gdGameDifficulty) {
  case CSessionProperties::GD_TOURIST:  return TRANS("Subhuman");
  case CSessionProperties::GD_EASY:     return TRANS("Weak");
  default:
  case CSessionProperties::GD_NORMAL:   return TRANS("Normal");
  case CSessionProperties::GD_HARD:     return TRANS("Strong");
  case CSessionProperties::GD_EXTREME:  return TRANS("Powerful");
  }
}
// armor & health constants getters

FLOAT MaxArmor(void)
{
  if (GetSP()->sp_gdGameDifficulty<=CSessionProperties::GD_EASY) {
    return 200;
  } else {
    return 100;
  }
}
FLOAT TopArmor(void)
{
  if (GetSP()->sp_gdGameDifficulty<=CSessionProperties::GD_EASY) {
    return 200;
  } else {
    return 100;
  }
}
FLOAT MaxHealth(void)
{
  if (GetSP()->sp_gdGameDifficulty<=CSessionProperties::GD_EASY) {
    return 200;
  } else {
    return 100;
  }
}
FLOAT TopHealth(void)
{
  if (GetSP()->sp_gdGameDifficulty<=CSessionProperties::GD_EASY) {
    return 200;
  } else {
    return 100;
  }
}

// info structure
static EntityInfo eiPlayerGround = {
  EIBT_FLESH, 80.0f,
  0.0f, 1.7f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};
static EntityInfo eiPlayerCrouch = {
  EIBT_FLESH, 80.0f,
  0.0f, 1.2f, 0.0f,     // source (eyes)
  0.0f, 0.7f, 0.0f,     // target (body)
};
static EntityInfo eiPlayerSwim = {
  EIBT_FLESH, 40.0f,
  0.0f, 0.0f, 0.0f,     // source (eyes)
  0.0f, 0.0f, 0.0f,     // target (body)
};


// animation light specific
#define LIGHT_ANIM_MINIGUN 2
#define LIGHT_ANIM_TOMMYGUN 3
#define LIGHT_ANIM_COLT_SHOTGUN 4
#define LIGHT_ANIM_NONE 5

const char *NameForState(PlayerState pst)
{
  switch(pst) {
  case PST_STAND: return "stand";
  case PST_CROUCH: return "crouch";
  case PST_FALL: return "fall";
  case PST_SWIM: return "swim";
  case PST_DIVE: return "dive";
  default: return "???";
  };
}


// print explanation on how a player died
void PrintPlayerDeathMessage(CPlayer *ppl, const EDeath &eDeath)
{
  CTString strMyName = ppl->GetPlayerName();
  CEntity *penKiller = eDeath.eLastDamage.penInflictor;
  // if killed by a valid entity
  if (penKiller!=NULL) {
    // if killed by a player
    if (IsOfClass(penKiller, "Player")) {
      // if not self
      if (penKiller!=ppl) {
        CTString strKillerName = ((CPlayer*)penKiller)->GetPlayerName();

        if(eDeath.eLastDamage.dmtType==DMT_TELEPORT) {
          CPrintF(TRANS("%s telefragged %s\n"), strKillerName, strMyName);
        } else if(eDeath.eLastDamage.dmtType==DMT_CLOSERANGE) {
          CPrintF(TRANS("%s cut %s into pieces\n"), strKillerName, strMyName);
        } else if(eDeath.eLastDamage.dmtType==DMT_CHAINSAW) {
          CPrintF(TRANS("%s cut %s into pieces\n"), strKillerName, strMyName);
        } else if(eDeath.eLastDamage.dmtType==DMT_BULLET) {
          CPrintF(TRANS("%s poured lead into %s\n"), strKillerName, strMyName);
        } else if(eDeath.eLastDamage.dmtType==DMT_PROJECTILE || eDeath.eLastDamage.dmtType==DMT_EXPLOSION) {
          CPrintF(TRANS("%s blew %s away\n"), strKillerName, strMyName);
        } else if(eDeath.eLastDamage.dmtType==DMT_CANNONBALL) {
          CPrintF(TRANS("%s smashed %s with a cannon\n"), strKillerName, strMyName);
        } else if(eDeath.eLastDamage.dmtType==DMT_CANNONBALL_EXPLOSION) {
          CPrintF(TRANS("%s nuked %s\n"), strKillerName, strMyName);
        } else if(eDeath.eLastDamage.dmtType==DMT_AXE) {
          CPrintF(TRANS("%s sliced %s into pieces\n"), strKillerName, strMyName);
        } else if(eDeath.eLastDamage.dmtType==DMT_PELLET) {
          CPrintF(TRANS("%s poured buckshot into %s\n"), strKillerName, strMyName);
        } else {
          CPrintF(TRANS("%s killed %s\n"), strKillerName, strMyName);
        }
      } else {
        // make message from damage type
        switch(eDeath.eLastDamage.dmtType) {
        case DMT_DROWNING:  CPrintF(TRANS("%s drowned\n"), strMyName); break;
        case DMT_BURNING:   CPrintF(TRANS("%s burst into flames\n"), strMyName); break;
        case DMT_SPIKESTAB: CPrintF(TRANS("%s fell into a spike-hole\n"), strMyName); break;
        case DMT_FREEZING:  CPrintF(TRANS("%s has frozen\n"), strMyName); break;
        case DMT_ACID:      CPrintF(TRANS("%s dissolved\n"), strMyName); break;
        case DMT_PROJECTILE:
        case DMT_EXPLOSION:
          CPrintF(TRANS("%s blew himself away\n"), strMyName); break;
        default:            CPrintF(TRANS("%s has committed suicide\n"), strMyName);
        }
      }
    // if killed by an enemy
    } else if (IsDerivedFromClass(penKiller, "Enemy Base")) {
      // check for telefrag first
      if(eDeath.eLastDamage.dmtType==DMT_TELEPORT) {
        CPrintF(TRANS("%s was telefragged\n"), strMyName);
        return;
      }
      // describe how this enemy killed player
      CPrintF("%s\n", (const char*)((CEnemyBase*)penKiller)->GetPlayerKillDescription(strMyName, eDeath));

    // if killed by some other entity
    } else {
      // make message from damage type
      switch(eDeath.eLastDamage.dmtType) {
      case DMT_SPIKESTAB: CPrintF(TRANS("%s was pierced\n"), strMyName); break;
      case DMT_BRUSH:     CPrintF(TRANS("%s was squashed\n"), strMyName); break;
      case DMT_ABYSS:     CPrintF(TRANS("%s went over the edge\n"), strMyName); break;
      case DMT_IMPACT:    CPrintF(TRANS("%s swashed\n"), strMyName); break;
      case DMT_HEAT:      CPrintF(TRANS("%s stood in the sun for too long\n"), strMyName); break;
      default:            CPrintF(TRANS("%s passed away\n"), strMyName);
      }
    }
  // if no entity pointer (shouldn't happen)
  } else {
    CPrintF(TRANS("%s is missing in action\n"), strMyName);
  }
}

%}

class export CPlayer : CPlayerEntity {
name      "Player";
thumbnail "";
features  "ImplementsOnInitClass", "ImplementsOnEndClass", "CanBePredictable";

properties:
  1 CTString m_strName "Name" = "<unnamed player>",
  2 COLOR m_ulLastButtons = 0x0,              // buttons last pressed
  3 FLOAT m_fArmor = 0.0f,                    // armor
  4 CTString m_strGroup = "",                 // group name for world change
  5 INDEX m_ulKeys = 0,                       // mask for all picked-up keys
  6 FLOAT m_fMaxHealth = 1,                   // default health supply player can have
  7 INDEX m_ulFlags = 0,                      // various flags
  8 INDEX m_ulPuzzleItems = 0,                // mask for all picked-up puzzle items
  
 16 CEntityPointer m_penWeapons,              // player weapons
 17 CEntityPointer m_penAnimator,             // player animator
 18 CEntityPointer m_penView,                 // player view
 19 CEntityPointer m_pen3rdPersonView,        // player 3rd person view
 20 INDEX m_iViewState=PVT_PLAYEREYES,        // view state
 21 INDEX m_iLastViewState=PVT_PLAYEREYES,    // last view state

 26 CAnimObject m_aoLightAnimation,           // light animation object
 27 FLOAT m_fDamageAmmount = 0.0f,            // how much was last wound
 28 FLOAT m_tmWoundedTime  = 0.0f,            // when was last wound
 29 FLOAT m_tmScreamTime   = 0.0f,            // when was last wound sound played

 33 INDEX m_iGender = GENDER_MALE,            // male/female offset in various tables
 34 enum PlayerState m_pstState = PST_STAND,  // current player state
 35 FLOAT m_fFallTime = 0.0f,                 // time passed when falling
 36 FLOAT m_fSwimTime = 0.0f,                 // time when started swimming
 45 FLOAT m_tmOutOfWater = 0.0f,              // time when got out of water last time
 37 FLOAT m_tmMoveSound = 0.0f,           // last time move sound was played
 38 BOOL  m_bMoveSoundLeft = TRUE,        // left or right walk channel is current
 39 FLOAT m_tmNextAmbientOnce = 0.0f,     // next time to play local ambient sound
 43 FLOAT m_tmMouthSoundLast = 0.0f,      // time last played some repeating mouth sound

 40 CEntityPointer m_penCamera,           // camera for current cinematic sequence, or null
 41 CTString m_strCenterMessage="",       // center message
 42 FLOAT m_tmCenterMessageEnd = 0.0f,    // last time to show centered message
 48 BOOL m_bPendingMessage = FALSE,   // message sound pending to be played
 47 FLOAT m_tmMessagePlay = 0.0f,     // when to play the message sound
 200 enum MessageFont m_mfFont = FNT_NORMAL,
 
 44 CEntityPointer m_penMainMusicHolder,

 51 FLOAT m_tmLastDamage = -1.0f,
 52 FLOAT m_fMaxDamageAmmount = 0.0f,
 53 FLOAT3D m_vDamage = FLOAT3D(0,0,0),
 54 FLOAT m_tmSpraySpawned = -1.0f,
 55 FLOAT m_fSprayDamage = 0.0f,
 56 CEntityPointer m_penSpray,

 // sounds
 60 CSoundObject m_soWeapon0,
 61 CSoundObject m_soWeapon1,
 62 CSoundObject m_soWeapon2,
 63 CSoundObject m_soWeapon3,
 64 CSoundObject m_soWeaponAmbient,
 65 CSoundObject m_soPowerUpBeep,

 70 CSoundObject m_soMouth,     // breating, yelling etc.
 71 CSoundObject m_soFootL,     // walking etc.
 72 CSoundObject m_soFootR,
 73 CSoundObject m_soBody,          // splashing etc.
 74 CSoundObject m_soLocalAmbientLoop,  // local ambient that only this player hears
 75 CSoundObject m_soLocalAmbientOnce,  // local ambient that only this player hears
 76 CSoundObject m_soMessage,  // message sounds
 77 CSoundObject m_soHighScore, // high score sound
 78 CSoundObject m_soSpeech,    // for quotes
 79 CSoundObject m_soSniperZoom, // for sniper zoom sound

 81 INDEX m_iMana    = 0,        // current score worth for killed player
 94 FLOAT m_fManaFraction = 0.0f,// fractional part of mana, for slow increase with time
 84 INDEX m_iHighScore = 0,      // internal hiscore for demo playing
 85 INDEX m_iBeatenHighScore = 0,    // hiscore that was beaten
 89 FLOAT m_tmLatency = 0.0f,               // player-server latency (in seconds)
 // for latency averaging
 88 FLOAT m_tmLatencyLastAvg = 0.0f, 
 87 FLOAT m_tmLatencyAvgSum = 0.0f, 
 86 INDEX m_ctLatencyAvg = 0, 

 96 BOOL  m_bEndOfLevel = FALSE,
 97 BOOL  m_bEndOfGame  = FALSE,
 98 INDEX m_iMayRespawn = 0,     // must get to 2 to be able to respawn
 99 FLOAT m_tmSpawned = 0.0f,   // when player was spawned
 100 FLOAT3D m_vDied = FLOAT3D(0,0,0),  // where player died (for respawn in-place)
 101 FLOAT3D m_aDied = FLOAT3D(0,0,0),

 // statistics
 103 FLOAT m_tmEstTime  = 0.0f,   // time estimated for this level
 105 INDEX m_iTimeScore = 0,
 106 INDEX m_iStartTime = 0,      // game start time (ansi c time_t type)
 107 INDEX m_iEndTime   = 0,      // game end time (ansi c time_t type)
 108 FLOAT m_tmLevelStarted = 0.0f,  // game time when level started
 93 CTString m_strLevelStats = "",  // detailed statistics for each level

 // auto action vars
 110 CEntityPointer m_penActionMarker,  // current marker for auto actions
 111 FLOAT m_fAutoSpeed = 0.0f, // speed to go towards the marker
 112 INDEX m_iAutoOrgWeapon = 0, // original weapon for autoactions
 113 FLOAT3D m_vAutoSpeed = FLOAT3D(0,0,0),
 114 FLOAT m_tmSpiritStart = 0.0f,
 115 FLOAT m_tmFadeStart = 0.0f,

 // 'picked up' display vars
 120 FLOAT m_tmLastPicked = -10000.0f,  // when something was last picked up
 121 CTString m_strPickedName = "",     // name of item picked
 122 FLOAT m_fPickedAmmount = 0.0f,     // total picked ammount
 123 FLOAT m_fPickedMana = 0.0f,        // total picked mana

 // shaker values
 130 INDEX m_iLastHealth = 0,
 131 INDEX m_iLastArmor  = 0,
 132 INDEX m_iLastAmmo   = 0,
 135 FLOAT m_tmHealthChanged = -9,
 136 FLOAT m_tmArmorChanged  = -9,
 137 FLOAT m_tmAmmoChanged   = -9,
 
 138 FLOAT m_tmMinigunAutoFireStart = -1.0f,

 150 FLOAT3D m_vLastStain  = FLOAT3D(0,0,0), // where last stain was left
   
 // for mouse lag elimination via prescanning
 151 ANGLE3D m_aLastRotation = FLOAT3D(0,0,0),
 152 ANGLE3D m_aLastViewRotation = FLOAT3D(0,0,0),
 153 FLOAT3D m_vLastTranslation = FLOAT3D(0,0,0),
 154 ANGLE3D m_aLocalRotation = FLOAT3D(0,0,0),
 155 ANGLE3D m_aLocalViewRotation = FLOAT3D(0,0,0),
 156 FLOAT3D m_vLocalTranslation = FLOAT3D(0,0,0),

 // powerups (DO NOT CHANGE ORDER!) - needed by HUD.cpp
 160 FLOAT m_tmInvisibility    = 0.0f, 
 161 FLOAT m_tmInvulnerability = 0.0f, 
 162 FLOAT m_tmSeriousDamage   = 0.0f, 
 163 FLOAT m_tmSeriousSpeed    = 0.0f, 
 166 FLOAT m_tmInvisibilityMax    = 30.0f,
 167 FLOAT m_tmInvulnerabilityMax = 30.0f,
 168 FLOAT m_tmSeriousDamageMax   = 40.0f,
 169 FLOAT m_tmSeriousSpeedMax    = 20.0f,

 180 FLOAT m_tmChainShakeEnd = 0.0f, // used to determine when to stop shaking due to chainsaw damage
 181 FLOAT m_fChainShakeStrength = 1.0f, // strength of shaking
 182 FLOAT m_fChainShakeFreqMod = 1.0f,  // shaking frequency modifier
 183 FLOAT m_fChainsawShakeDX = 0.0f, 
 184 FLOAT m_fChainsawShakeDY = 0.0f,

 190 INDEX m_iSeriousBombCount = 0,      // ammount of serious bombs player owns
 191 INDEX m_iLastSeriousBombCount = 0,  // ammount of serious bombs player had before firing
 192 FLOAT m_tmSeriousBombFired = -10.0f,  // when the bomb was last fired

 201 FLOAT m_fMessagePosX = 0.0f,
 202 FLOAT m_fMessagePosY = 0.0f,

 203 BOOL m_bIsBlocking = FALSE,
 204 FLOAT m_fBlockAmount = 90.0f,
 205 FLOAT m_fBlockDirAmount = 0.5f,
 206 FLOAT m_fClimbDir = 0.0f,
 207 BOOL m_bIsStung = FALSE,
 208 FLOAT m_tmStungTime = 0.0f,            // when was last sting

{
  ShellLaunchData ShellLaunchData_array;  // array of data describing flying empty shells
  INDEX m_iFirstEmptySLD;                         // index of last added empty shell

  BulletSprayLaunchData BulletSprayLaunchData_array;  // array of data describing flying bullet sprays
  INDEX m_iFirstEmptyBSLD;                            // index of last added bullet spray

  GoreSprayLaunchData GoreSprayLaunchData_array;   // array of data describing gore sprays
  INDEX m_iFirstEmptyGSLD;                         // index of last added gore spray

  ULONG ulButtonsNow;  ULONG ulButtonsBefore;
  ULONG ulNewButtons;
  ULONG ulReleasedButtons;

  BOOL  bUseButtonHeld;

  // listener
  CSoundListener sliSound;
  // light
  CLightSource m_lsLightSource;

  TIME m_tmPredict;  // time to predict the entity to

  // statistics
  PlayerStats m_psLevelStats;
  PlayerStats m_psLevelTotal;
  PlayerStats m_psGameStats;
  PlayerStats m_psGameTotal;

  CModelObject m_moRender;                  // model object to render - this one can be customized
}

components:
  1 class   CLASS_PLAYER_WEAPONS  "Classes\\PlayerWeapons.ecl",
  2 class   CLASS_PLAYER_ANIMATOR "Classes\\PlayerAnimator.ecl",
  3 class   CLASS_PLAYER_VIEW     "Classes\\PlayerView.ecl",
  4 class   CLASS_BASIC_EFFECT    "Classes\\BasicEffect.ecl",
  5 class   CLASS_BLOOD_SPRAY     "Classes\\BloodSpray.ecl", 
  6 class   CLASS_SERIOUSBOMB     "Classes\\SeriousBomb.ecl",

// gender specific sounds - make sure that offset is exactly 100 
 50 sound SOUND_WATER_ENTER     "Sounds\\Player\\WaterEnter.wav",
 51 sound SOUND_WATER_LEAVE     "Sounds\\Player\\WaterLeave.wav",
 52 sound SOUND_WALK_L          "Sounds\\Player\\WalkL.wav",
 53 sound SOUND_WALK_R          "Sounds\\Player\\WalkR.wav",
 54 sound SOUND_SWIM_L          "Sounds\\Player\\SwimL.wav",
 55 sound SOUND_SWIM_R          "Sounds\\Player\\SwimR.wav",
 56 sound SOUND_DIVE_L          "Sounds\\Player\\Dive.wav",
 57 sound SOUND_DIVE_R          "Sounds\\Player\\Dive.wav",
 62 sound SOUND_JUMP            "Sounds\\Player\\Jump.wav",
 63 sound SOUND_LAND            "Sounds\\Player\\Land.wav",
 70 sound SOUND_WATERWALK_L     "Sounds\\Player\\WalkWaterL.wav",
 71 sound SOUND_WATERWALK_R     "Sounds\\Player\\WalkWaterR.wav",
 75 sound SOUND_WALK_SAND_L     "Sounds\\Player\\WalkSandL.wav",
 76 sound SOUND_WALK_SAND_R     "Sounds\\Player\\WalkSandR.wav",
//178 sound SOUND_HIGHSCORE       "Sounds\\Player\\HighScore.wav",
 86 sound SOUND_WALK_GRASS_L    "Sounds\\Player\\WalkGrassL.wav",
 87 sound SOUND_WALK_GRASS_R    "Sounds\\Player\\WalkGrassR.wav",
 88 sound SOUND_WALK_WOOD_L     "Sounds\\Player\\WalkWoodL.wav",
 89 sound SOUND_WALK_WOOD_R     "Sounds\\Player\\WalkWoodR.wav",
 90 sound SOUND_WALK_SNOW_L     "Sounds\\Player\\WalkSnowL.wav",
 91 sound SOUND_WALK_SNOW_R     "Sounds\\Player\\WalkSnowR.wav",
 92 sound SOUND_WALK_METAL_L    "Sounds\\Player\\WalkMetalL.wav",
 93 sound SOUND_WALK_METAL_R    "Sounds\\Player\\WalkMetalR.wav",
 94 sound SOUND_WALK_CARPET_L   "Sounds\\Player\\WalkCarpetL.wav",
 95 sound SOUND_WALK_CARPET_R   "Sounds\\Player\\WalkCarpetR.wav",
 96 sound SOUND_WALK_GLASS_L    "Sounds\\Player\\WalkGlassL.wav",
 97 sound SOUND_WALK_GLASS_R    "Sounds\\Player\\WalkGlassR.wav",
 98 sound SOUND_WALK_DIRT_L     "Sounds\\Player\\WalkDirtL.wav",
 99 sound SOUND_WALK_DIRT_R     "Sounds\\Player\\WalkDirtR.wav",
100 sound SOUND_WALK_TILE_L     "Sounds\\Player\\WalkTileL.wav",
101 sound SOUND_WALK_TILE_R     "Sounds\\Player\\WalkTileR.wav",
102 sound SOUND_WALK_CHAINLINK_L "Sounds\\Player\\WalkChainlinkL.wav",
103 sound SOUND_WALK_CHAINLINK_R "Sounds\\Player\\WalkChainlinkR.wav",
115 sound SOUND_WALK_GRATE_L    "Sounds\\Player\\WalkGrateL.wav",
116 sound SOUND_WALK_GRATE_R    "Sounds\\Player\\WalkGrateR.wav",
118 sound SOUND_WALK_MUD_L      "Sounds\\Player\\WalkMudL.wav",
119 sound SOUND_WALK_MUD_R      "Sounds\\Player\\WalkMudR.wav",
123 sound SOUND_WALK_VENT_L     "Sounds\\Player\\WalkVentL.wav",
124 sound SOUND_WALK_VENT_R     "Sounds\\Player\\WalkVentR.wav",
125 sound SOUND_WALK_COMPUTER_L "Sounds\\Player\\WalkComputerL.wav",
126 sound SOUND_WALK_COMPUTER_R "Sounds\\Player\\WalkComputerR.wav",
127 sound SOUND_WALK_FUSEBOX_L  "Sounds\\Player\\WalkFuseboxL.wav",
128 sound SOUND_WALK_FUSEBOX_R  "Sounds\\Player\\WalkFuseboxR.wav",
104 sound SOUND_LAND_SAND       "Sounds\\Player\\LandSand.wav",
105 sound SOUND_LAND_GRASS      "Sounds\\Player\\LandGrass.wav",
106 sound SOUND_LAND_WOOD       "Sounds\\Player\\LandWood.wav",
107 sound SOUND_LAND_SNOW       "Sounds\\Player\\LandSnow.wav",
108 sound SOUND_LAND_METAL      "Sounds\\Player\\LandMetal.wav",
109 sound SOUND_LAND_CARPET     "Sounds\\Player\\LandCarpet.wav",
110 sound SOUND_LAND_GLASS      "Sounds\\Player\\LandGlass.wav",
111 sound SOUND_LAND_DIRT       "Sounds\\Player\\LandDirt.wav",
112 sound SOUND_LAND_TILE       "Sounds\\Player\\LandTile.wav",
113 sound SOUND_LAND_CHAINLINK  "Sounds\\Player\\LandChainlink.wav",
117 sound SOUND_LAND_GRATE      "Sounds\\Player\\LandGrate.wav",
120 sound SOUND_LAND_MUD        "Sounds\\Player\\LandMud.wav",
121 sound SOUND_LAND_VENT       "Sounds\\Player\\LandVent.wav",
122 sound SOUND_LAND_COMPUTER   "Sounds\\Player\\LandComputer.wav",
129 sound SOUND_LAND_FUSEBOX    "Sounds\\Player\\LandFusebox.wav",
114 sound SOUND_BLOWUP          "Sounds\\Player\\BlowUp.wav",

// gender-independent sounds
214 sound SOUND_SILENCE         "Sounds\\Misc\\Silence.wav",
217 sound SOUND_INFO            "Sounds\\Player\\Info.wav",
218 sound SOUND_WATERAMBIENT    "Sounds\\Player\\Underwater.wav",
219 sound SOUND_WATERBUBBLES    "Sounds\\Player\\Bubbles.wav",
221 sound SOUND_SECRET          "Sounds\\Player\\Secret.wav",

// ************** FLESH PARTS **************
230 model   MODEL_FLESH          "Models\\Effects\\Debris\\FleshDebris.mdl",

231 texture TEXTURE_FLESH_RED    "Models\\Effects\\Debris\\FleshDebrisRed.tex",
232 texture TEXTURE_FLESH_GREEN  "Models\\Effects\\Debris\\FleshDebrisGreen.tex",


functions:

  FLOAT GetClimbingDirection(void) {
    return m_fClimbDir;
  };

  INDEX GenderSound(INDEX iSound)
  {
    return iSound+m_iGender*GENDEROFFSET;
  }

  void AddBouble( FLOAT3D vPos, FLOAT3D vSpeedRelative)
  {
    ShellLaunchData &sld = m_asldData[m_iFirstEmptySLD];
    sld.sld_vPos = vPos;
    const FLOATmatrix3D &m = GetRotationMatrix();
    FLOAT3D vUp( m(1,2), m(2,2), m(3,2));
    sld.sld_vUp = vUp;
    sld.sld_vSpeed = vSpeedRelative*m;
    sld.sld_tmLaunch = _pTimer->CurrentTick();
    sld.sld_estType = ESL_BUBBLE;
    // move to next shell position
    m_iFirstEmptySLD = (m_iFirstEmptySLD+1) % MAX_FLYING_SHELLS;
  }

  void ClearShellLaunchData( void)
  {
    // clear flying shells data array
    m_iFirstEmptySLD = 0;
    for( INDEX iShell=0; iShell<MAX_FLYING_SHELLS; iShell++)
    {
      m_asldData[iShell].sld_tmLaunch = -100.0f;
    }
  }

  void AddBulletSpray( FLOAT3D vPos, EffectParticlesType eptType, FLOAT3D vStretch)
  {
    BulletSprayLaunchData &bsld = m_absldData[m_iFirstEmptyBSLD];
    bsld.bsld_vPos = vPos;
    bsld.bsld_vG = en_vGravityDir;
    bsld.bsld_eptType=eptType;
    bsld.bsld_iRndBase=FRnd()*123456;
    bsld.bsld_tmLaunch = _pTimer->CurrentTick();
    bsld.bsld_vStretch=vStretch;
    // move to bullet spray position
    m_iFirstEmptyBSLD = (m_iFirstEmptyBSLD+1) % MAX_BULLET_SPRAYS;
  }

  void ClearBulletSprayLaunchData( void)
  {
    m_iFirstEmptyBSLD = 0;
    for( INDEX iBulletSpray=0; iBulletSpray<MAX_BULLET_SPRAYS; iBulletSpray++)
    {
      m_absldData[iBulletSpray].bsld_tmLaunch = -100.0f;
    }
  }

  void AddGoreSpray( FLOAT3D vPos, FLOAT3D v3rdPos, SprayParticlesType sptType, FLOAT3D vSpilDirection,
    FLOATaabbox3D boxHitted, FLOAT fDamagePower, COLOR colParticles)
  {
    GoreSprayLaunchData &gsld = m_agsldData[m_iFirstEmptyGSLD];
    gsld.gsld_vPos = vPos;
    gsld.gsld_v3rdPos = v3rdPos;
    gsld.gsld_vG = en_vGravityDir;
    gsld.gsld_fGA = en_fGravityA;
    gsld.gsld_sptType = sptType;
    gsld.gsld_boxHitted = boxHitted;
    gsld.gsld_vSpilDirection = vSpilDirection;
    gsld.gsld_fDamagePower=fDamagePower;
    gsld.gsld_tmLaunch = _pTimer->CurrentTick();
    gsld.gsld_colParticles = colParticles;
    // move to bullet spray position
    m_iFirstEmptyGSLD = (m_iFirstEmptyGSLD+1) % MAX_GORE_SPRAYS;
  }

  void ClearGoreSprayLaunchData( void)
  {
    m_iFirstEmptyGSLD = 0;
    for( INDEX iGoreSpray=0; iGoreSpray<MAX_GORE_SPRAYS; iGoreSpray++)
    {
      m_agsldData[iGoreSpray].gsld_tmLaunch = -100.0f;
    }
  }

  void CPlayer(void) 
  {
    // clear flying shells data array
    bUseButtonHeld = FALSE;
    ClearShellLaunchData();
    ClearBulletSprayLaunchData();
    ClearGoreSprayLaunchData();
    m_tmPredict = 0;
  }

  class CPlayerWeapons *GetPlayerWeapons(void)
  {
    ASSERT(m_penWeapons!=NULL);
    return (CPlayerWeapons *)&*m_penWeapons;
  }
  class CPlayerAnimator *GetPlayerAnimator(void)
  {
    ASSERT(m_penAnimator!=NULL);
    return (CPlayerAnimator *)&*m_penAnimator;
  }

  CPlayerSettings *GetSettings(void)
  {
    return (CPlayerSettings *)en_pcCharacter.pc_aubAppearance;
  }

  export void Copy(CEntity &enOther, ULONG ulFlags)
  {
    CPlayerEntity::Copy(enOther, ulFlags);
    CPlayer *penOther = (CPlayer *)(&enOther);
    m_moRender.Copy(penOther->m_moRender);
    m_psLevelStats = penOther->m_psLevelStats;
    m_psLevelTotal = penOther->m_psLevelTotal;
    m_psGameStats  = penOther->m_psGameStats ;
    m_psGameTotal  = penOther->m_psGameTotal ;

    // if creating predictor
    if (ulFlags&COPY_PREDICTOR)
    {
      // copy positions of launched empty shells
      memcpy( m_asldData, penOther->m_asldData, sizeof( m_asldData));
      m_iFirstEmptySLD = penOther->m_iFirstEmptySLD;
      //m_lsLightSource;
      SetupLightSource(); //? is this ok !!!!
    }
  }

  // update smoothed (average latency)
  void UpdateLatency(FLOAT tmLatencyNow)
  {
    TIME tmNow = _pTimer->GetHighPrecisionTimer().GetSeconds();

    // if not enough time passed
    if (tmNow<m_tmLatencyLastAvg+hud_tmLatencySnapshot) {
      // just sum
      m_tmLatencyAvgSum += tmLatencyNow;
      m_ctLatencyAvg++;

    // if enough time passed
    } else {
      // calculate average
      m_tmLatency = m_tmLatencyAvgSum/m_ctLatencyAvg;
      // reset counters
      m_tmLatencyAvgSum = 0.0f;
      m_ctLatencyAvg = 0;
      m_tmLatencyLastAvg = tmNow;
    }

    if (_pNetwork->IsPlayerLocal(this)) {
      en_tmPing = m_tmLatency;
      net_tmLatencyAvg = en_tmPing;
    }
  }

  // check character data for invalid values
  void ValidateCharacter(void)
  {
    // if in single player or flyover
    if (GetSP()->sp_bSinglePlayer) {
      // always use default model
      CPlayerSettings *pps = (CPlayerSettings *)en_pcCharacter.pc_aubAppearance;
      memset(pps->ps_achModelFile, 0, sizeof(pps->ps_achModelFile));
    }
  }
  // parse gender from your name
  void ParseGender(CTString &strName)
  {
    if (strName.RemovePrefix("#male#")) {
      m_iGender = GENDER_MALE;
    } else if (strName.RemovePrefix("#female#")) {
      m_iGender = GENDER_FEMALE;
    } else {
      m_iGender = GENDER_MALE;
    }
  }

  void CheckHighScore(void)
  {
    // if not playing a demo
    if (!_pNetwork->IsPlayingDemo()) {
      // update our local high score with the external
      if (plr_iHiScore>m_iHighScore) {
        m_iHighScore = plr_iHiScore;
      }
    }

    // if current score is better than highscore
    if (m_psGameStats.ps_iScore>m_iHighScore) {
      // if it is a highscore greater than the last one beaten
      if (m_iHighScore>m_iBeatenHighScore) {
        // remember that it was beaten
        m_iBeatenHighScore = m_iHighScore;
        // tell that to player
        m_soHighScore.Set3DParameters(25.0f, 5.0f, 1.0f, 1.0f);
        //PlaySound(m_soHighScore, SOUND_HIGHSCORE, 0); !!!!####!!!!
      }
    }
  }

  CTString GetPredictName(void) const
  {
    if (IsPredicted()) {
      return "PREDICTED";
    } else if (IsPredictor()) {
      return "predictor";
    } else if (GetFlags()&ENF_WILLBEPREDICTED){
      return "WILLBEPREDICTED";
    } else {
      return "no prediction";
    }
  }
  /* Write to stream. */
  void Write_t( CTStream *ostr) // throw char *
  {
    CPlayerEntity::Write_t(ostr);
    ostr->Write_t(&m_psLevelStats, sizeof(m_psLevelStats));
    ostr->Write_t(&m_psLevelTotal, sizeof(m_psLevelTotal));
    ostr->Write_t(&m_psGameStats , sizeof(m_psGameStats ));
    ostr->Write_t(&m_psGameTotal , sizeof(m_psGameTotal ));
  }
  /* Read from stream. */
  void Read_t( CTStream *istr) // throw char *
  { 
    CPlayerEntity::Read_t(istr);
    // clear flying shells data array
    ClearShellLaunchData();
    ClearBulletSprayLaunchData();
    ClearGoreSprayLaunchData();

    istr->Read_t(&m_psLevelStats, sizeof(m_psLevelStats));
    istr->Read_t(&m_psLevelTotal, sizeof(m_psLevelTotal));
    istr->Read_t(&m_psGameStats , sizeof(m_psGameStats ));
    istr->Read_t(&m_psGameTotal , sizeof(m_psGameTotal ));

    // set your real appearance if possible
    ValidateCharacter();
    CTString strDummy;
    SetPlayerAppearance(&m_moRender, &en_pcCharacter, strDummy, /*bPreview=*/FALSE);
    ParseGender(strDummy);
    m_ulFlags |= PLF_SYNCWEAPON;
    // setup light source
    SetupLightSource();
  };

  /* Get static light source information. */
  CLightSource *GetLightSource(void)
  {
    if (!IsPredictor()) {
      return &m_lsLightSource;
    } else {
      return NULL;
    }
  };

  // called by other entities to set time prediction parameter
  void SetPredictionTime(TIME tmAdvance)   // give time interval in advance to set
  {
    m_tmPredict = _pTimer->CurrentTick()+tmAdvance;
  }

  // called by engine to get the upper time limit 
  TIME GetPredictionTime(void)   // return moment in time up to which to predict this entity
  {
    return m_tmPredict;
  }

  // get maximum allowed range for predicting this entity
  FLOAT GetPredictionRange(void)
  {
    return cli_fPredictPlayersRange;
  }

  // add to prediction any entities that this entity depends on
  void AddDependentsToPrediction(void)
  {
    m_penWeapons->AddToPrediction();
    m_penAnimator->AddToPrediction();
    m_penView->AddToPrediction();
    m_pen3rdPersonView->AddToPrediction();
  }

  // get in-game time for statistics
  TIME GetStatsInGameTimeLevel(void)
  {
    if(m_bEndOfLevel) {
      return m_psLevelStats.ps_tmTime;
    } else {
      return _pNetwork->GetGameTime()-m_tmLevelStarted;
    }
  }
  TIME GetStatsInGameTimeGame(void)
  {
    if(m_bEndOfLevel) {
      return m_psGameStats.ps_tmTime;
    } else {
      return m_psGameStats.ps_tmTime + (_pNetwork->GetGameTime()-m_tmLevelStarted);
    }
  }

  FLOAT GetStatsRealWorldTime(void)
  {
    time_t timeNow;
    if(m_bEndOfLevel) { 
      timeNow = m_iEndTime; 
    } else {
      time(&timeNow);
    }
    return (FLOAT)difftime( timeNow, m_iStartTime);
  }

  CTString GetStatsRealWorldStarted(void)
  {
    struct tm *newtime;
    newtime = localtime((const time_t*)&m_iStartTime);

    setlocale(LC_ALL, "");
    CTString strTimeline;
    char achTimeLine[256]; 
    strftime( achTimeLine, sizeof(achTimeLine)-1, "%a %x %H:%M", newtime);
    strTimeline = achTimeLine;
    setlocale(LC_ALL, "C");
    return strTimeline;
  }

  // fill in player statistics
  export void GetStats( CTString &strStats, const CompStatType csType, INDEX ctCharsPerRow)
  {

    // get proper type of stats
    if( csType==CST_SHORT) {
      GetShortStats(strStats);
    } else {
      ASSERT(csType==CST_DETAIL);

      strStats = "\n";
      _ctAlignWidth = Min(ctCharsPerRow, INDEX(60));

      if (GetSP()->sp_bCooperative) {
        if (GetSP()->sp_bSinglePlayer) {
          GetDetailStatsSP(strStats, 0);
        } else {
          GetDetailStatsCoop(strStats);
        }
      } else {
        GetDetailStatsDM(strStats);
      }
    }
  }

  // get short one-line statistics - used for savegame descriptions and similar
  void GetShortStats(CTString &strStats)
  {
    strStats.PrintF( TRANS("%s %s Score: %d Kills: %d/%d"), 
                     GetDifficultyString(), TimeToString(GetStatsInGameTimeLevel()), 
                     m_psLevelStats.ps_iScore, m_psLevelStats.ps_iKills, m_psLevelTotal.ps_iKills);
  }

  // get detailed statistics for deathmatch game
  void GetDetailStatsDM(CTString &strStats)
  {
    extern INDEX SetAllPlayersStats( INDEX iSortKey);
    extern CPlayer *_apenPlayers[NET_MAXGAMEPLAYERS];
    // determine type of game
    const BOOL bFragMatch = GetSP()->sp_bUseFrags;

    // fill players table
    const INDEX ctPlayers = SetAllPlayersStats(bFragMatch?5:3); // sort by frags or by score

    // get time elapsed since the game start
    strStats+=AlignString(CTString(0, "^cFFFFFF%s:^r\n%s", TRANS("TIME"), TimeToString(_pNetwork->GetGameTime())));
    strStats+="\n";

    // find maximum frags/score that one player has
    INDEX iMaxFrags = LowerLimit(INDEX(0));
    INDEX iMaxScore = LowerLimit(INDEX(0));
    {for(INDEX iPlayer=0; iPlayer<ctPlayers; iPlayer++) {
      CPlayer *penPlayer = _apenPlayers[iPlayer];
      iMaxFrags = Max(iMaxFrags, penPlayer->m_psLevelStats.ps_iKills);
      iMaxScore = Max(iMaxScore, penPlayer->m_psLevelStats.ps_iScore);
    }}

    // print game limits
    const CSessionProperties &sp = *GetSP();
    if (sp.sp_iTimeLimit>0) {
      FLOAT fTimeLeft = ClampDn(sp.sp_iTimeLimit*60.0f - _pNetwork->GetGameTime(), 0.0f);
      strStats+=AlignString(CTString(0, "^cFFFFFF%s:^r\n%s", TRANS("TIME LEFT"), TimeToString(fTimeLeft)));
      strStats+="\n";
    }
    if (bFragMatch && sp.sp_iFragLimit>0) {
      INDEX iFragsLeft = ClampDn(sp.sp_iFragLimit-iMaxFrags, INDEX(0));
      strStats+=AlignString(CTString(0, "^cFFFFFF%s:^r\n%d", TRANS("FRAGS LEFT"), iFragsLeft));
      strStats+="\n";
    }
    if (!bFragMatch && sp.sp_iScoreLimit>0) {
      INDEX iScoreLeft = ClampDn(sp.sp_iScoreLimit-iMaxScore, INDEX(0));
      strStats+=AlignString(CTString(0, "^cFFFFFF%s:^r\n%d", TRANS("SCORE LEFT"), iScoreLeft));
      strStats+="\n";
    }
    strStats += "\n";

    CTString strRank = TRANS("NO.");
    CTString strFrag = bFragMatch ? TRANS("FRAGS"):TRANS("SCORE");
    CTString strPing = TRANS("PING");
    CTString strName = TRANS("PLAYER");
    INDEX ctRankChars = Max(strRank.Length(), INDEX(3)) ;
    INDEX ctFragChars = Max(strFrag.Length(), INDEX(7)) ;
    INDEX ctPingChars = Max(strPing.Length(), INDEX(5)) ;
    INDEX ctNameChars = Max(strName.Length(), INDEX(20));

    // header
    strStats += "^cFFFFFF";
    strStats += PadStringRight(strRank, ctRankChars)+" ";
    strStats += PadStringLeft (strFrag, ctFragChars)+" ";
    strStats += PadStringLeft (strPing, ctPingChars)+" ";
    strStats += PadStringRight(strName, ctNameChars)+" ";
    strStats += "^r";
    strStats += "\n\n";
    {for(INDEX iPlayer=0; iPlayer<ctPlayers; iPlayer++) {
      CTString strLine;
      CPlayer *penPlayer = _apenPlayers[iPlayer];
      INDEX iPing = ceil(penPlayer->en_tmPing*1000.0f);
      INDEX iScore = bFragMatch ? penPlayer->m_psLevelStats.ps_iKills : penPlayer->m_psLevelStats.ps_iScore;
      CTString strName = penPlayer->GetPlayerName();

      strStats += PadStringRight(CTString(0, "%d", iPlayer+1), ctRankChars)+" ";
      strStats += PadStringLeft (CTString(0, "%d", iScore),    ctFragChars)+" ";
      strStats += PadStringLeft (CTString(0, "%d", iPing),     ctPingChars)+" ";
      strStats += PadStringRight(strName,                      ctNameChars)+" ";
      strStats += "\n";
    }}
  }

  // get singleplayer statistics
  void GetDetailStatsCoop(CTString &strStats)
  {
    // first put in your full stats
    strStats += "^b"+CenterString(TRANS("YOUR STATS"))+"^r\n";
    strStats+="\n";
    GetDetailStatsSP(strStats, 1);

    // get stats from all players
    extern INDEX SetAllPlayersStats( INDEX iSortKey);
    extern CPlayer *_apenPlayers[NET_MAXGAMEPLAYERS];
    const INDEX ctPlayers = SetAllPlayersStats(3); // sort by score

    // for each player
    PlayerStats psSquadLevel = PlayerStats();
    PlayerStats psSquadGame  = PlayerStats();
    {for( INDEX iPlayer=0; iPlayer<ctPlayers; iPlayer++) {
      CPlayer *penPlayer = _apenPlayers[iPlayer];
      // add values to squad stats
      ASSERT( penPlayer!=NULL);
      PlayerStats psLevel = penPlayer->m_psLevelStats;
      PlayerStats psGame  = penPlayer->m_psGameStats ;
      psSquadLevel.ps_iScore   += psLevel.ps_iScore   ;
      psSquadLevel.ps_iKills   += psLevel.ps_iKills   ;
      psSquadLevel.ps_iDeaths  += psLevel.ps_iDeaths  ;
      psSquadLevel.ps_iSecrets += psLevel.ps_iSecrets ;
      psSquadGame.ps_iScore    += psGame.ps_iScore   ;
      psSquadGame.ps_iKills    += psGame.ps_iKills   ;
      psSquadGame.ps_iDeaths   += psGame.ps_iDeaths  ;
      psSquadGame.ps_iSecrets  += psGame.ps_iSecrets ;
    }}

    // add squad stats
    strStats+="\n";
    strStats += "^b"+CenterString(TRANS("SQUAD TOTAL"))+"^r\n";
    strStats+="\n";
    strStats+=CTString(0, "^cFFFFFF%s^r", TranslateConst(en_pwoWorld->GetName(), 0));
    strStats+="\n";
    strStats+=AlignString(CTString(0, "  %s:\n%d", TRANS("SCORE"), psSquadLevel.ps_iScore));
    strStats+="\n";
    strStats+=AlignString(CTString(0, "  %s:\n%d", TRANS("DEATHS"), psSquadLevel.ps_iDeaths));
    strStats+="\n";
    strStats+=AlignString(CTString(0, "  %s:\n%d/%d", TRANS("KILLS"), psSquadLevel.ps_iKills, m_psLevelTotal.ps_iKills));
    strStats+="\n";
    strStats+=AlignString(CTString(0, "  %s:\n%d/%d", TRANS("SECRETS"), psSquadLevel.ps_iSecrets, m_psLevelTotal.ps_iSecrets));
    strStats+="\n";
    strStats+="\n";
    strStats+=CTString("^cFFFFFF")+TRANS("TOTAL")+"^r\n";
    strStats+=AlignString(CTString(0, "  %s:\n%d", TRANS("SCORE"), psSquadGame.ps_iScore));
    strStats+="\n";
    strStats+=AlignString(CTString(0, "  %s:\n%d", TRANS("DEATHS"), psSquadGame.ps_iDeaths));
    strStats+="\n";
    strStats+=AlignString(CTString(0, "  %s:\n%d/%d", TRANS("KILLS"), psSquadGame.ps_iKills, m_psGameTotal.ps_iKills));
    strStats+="\n";
    strStats+=AlignString(CTString(0, "  %s:\n%d/%d", TRANS("SECRETS"), psSquadGame.ps_iSecrets, m_psGameTotal.ps_iSecrets));
    strStats+="\n";
    strStats+="\n";


    strStats+="\n";
    strStats += "^b"+CenterString(TRANS("OTHER PLAYERS"))+"^r\n";
    strStats+="\n";

    // for each player
    {for(INDEX iPlayer=0; iPlayer<ctPlayers; iPlayer++) {
      CPlayer *penPlayer = _apenPlayers[iPlayer];
      // if this one
      if (penPlayer==this) {
        // skip it
        continue;
      }
      // add his stats short
      strStats+="^cFFFFFF"+CenterString(penPlayer->GetPlayerName())+"^r\n\n";
      penPlayer->GetDetailStatsSP(strStats, 2);
      strStats+="\n";
    }}
  }

  // get singleplayer statistics
  void GetDetailStatsSP(CTString &strStats, INDEX iCoopType)
  {
    if (iCoopType<=1) {
      if (m_bEndOfGame) {
        if (GetSP()->sp_gdGameDifficulty==CSessionProperties::GD_EXTREME) {
          strStats+=TRANS("^f4SERIOUS GAME FINISHED,\nMENTAL MODE IS NOW ENABLED!^F\n\n");
        } else if (GetSP()->sp_bMental) {
          strStats+=TRANS("^f4YOU HAVE MASTERED THE GAME!^F\n\n");
        }
      }
    }

    if (iCoopType<=1) {
      // report total score info
      strStats+=AlignString(CTString(0, "^cFFFFFF%s:^r\n%d", TRANS("TOTAL SCORE"), m_psGameStats.ps_iScore));
      strStats+="\n";
      strStats+=AlignString(CTString(0, "^cFFFFFF%s:^r\n%s", TRANS("DIFFICULTY"), GetDifficultyString()));
      strStats+="\n";
      strStats+=AlignString(CTString(0, "^cFFFFFF%s:^r\n%s", TRANS("STARTED"), GetStatsRealWorldStarted()));
      strStats+="\n";
      strStats+=AlignString(CTString(0, "^cFFFFFF%s:^r\n%s", TRANS("PLAYING TIME"), TimeToString(GetStatsRealWorldTime())));
      strStats+="\n";
      if( m_psGameStats.ps_iScore<=plr_iHiScore) {
        strStats+=AlignString(CTString(0, "^cFFFFFF%s:^r\n%d", TRANS("HI-SCORE"), plr_iHiScore));
      } else {
        strStats+=TRANS("YOU BEAT THE HI-SCORE!");
      }
      strStats+="\n\n";
    }

    // report this level statistics
    strStats+=CTString(0, "^cFFFFFF%s^r", TranslateConst(en_pwoWorld->GetName(), 0));
    strStats+="\n";
    if (iCoopType<=1) {
      if( m_bEndOfLevel) {
        strStats+=AlignString(CTString(0, "  %s:\n%s", TRANS("ESTIMATED TIME"), TimeToString(m_tmEstTime)));
        strStats+="\n";
        strStats+=AlignString(CTString(0, "  %s:\n%d", TRANS("TIME BONUS"), m_iTimeScore));
        strStats+="\n";
        strStats+="\n";
      }
//    } else {
//      strStats+=CTString("^cFFFFFF")+TRANS("THIS LEVEL")+"^r\n";
    }
    strStats+=AlignString(CTString(0, "  %s:\n%d", TRANS("SCORE"), m_psLevelStats.ps_iScore));
    strStats+="\n";
    strStats+=AlignString(CTString(0, "  %s:\n%d/%d", TRANS("KILLS"), m_psLevelStats.ps_iKills, m_psLevelTotal.ps_iKills));
    strStats+="\n";
    if (iCoopType>=1) {
      strStats+=AlignString(CTString(0, "  %s:\n%d", TRANS("DEATHS"), m_psLevelStats.ps_iDeaths, m_psLevelTotal.ps_iDeaths));
      strStats+="\n";
    }
    strStats+=AlignString(CTString(0, "  %s:\n%d/%d", TRANS("SECRETS"), m_psLevelStats.ps_iSecrets, m_psLevelTotal.ps_iSecrets));
    strStats+="\n";
    if (iCoopType<=1) {
      strStats+=AlignString(CTString(0, "  %s:\n%s", TRANS("TIME"), TimeToString(GetStatsInGameTimeLevel())));
      strStats+="\n";
    }
    strStats+="\n";

    // report total game statistics
    strStats+=CTString("^cFFFFFF")+TRANS("TOTAL")+"^r";
    strStats+="\n";
    strStats+=AlignString(CTString(0, "  %s:\n%d", TRANS("SCORE"), m_psGameStats.ps_iScore));
    strStats+="\n";
    strStats+=AlignString(CTString(0, "  %s:\n%d/%d", TRANS("KILLS"), m_psGameStats.ps_iKills, m_psGameTotal.ps_iKills));
    strStats+="\n";
    if (iCoopType>=1) {
      strStats+=AlignString(CTString(0, "  %s:\n%d", TRANS("DEATHS"), m_psGameStats.ps_iDeaths, m_psGameTotal.ps_iDeaths));
      strStats+="\n";
    }
    strStats+=AlignString(CTString(0, "  %s:\n%d/%d", TRANS("SECRETS"), m_psGameStats.ps_iSecrets, m_psGameTotal.ps_iSecrets));
    strStats+="\n";
    if (iCoopType<=1) {
      strStats+=AlignString(CTString(0, "  %s:\n%s", TRANS("GAME TIME"), TimeToString(GetStatsInGameTimeGame())));
      strStats+="\n";
    }
    strStats+="\n";
    
    // set per level outputs
    if (iCoopType<1) {
      if(m_strLevelStats!="") {
        strStats += CTString("^cFFFFFF")+TRANS("Per level statistics") +"^r\n\n" + m_strLevelStats;
      }
    }
  }

  // provide info for GameAgent enumeration
  void GetGameAgentPlayerInfo( INDEX iPlayer, CTString &strOut) 
  {
    CTString strPlayerName = GetPlayerName();
    INDEX iLen = strlen(strPlayerName);
    for(INDEX i=0; i<iLen; i++) {
      if(strPlayerName[i] == '\r' || strPlayerName[i] == '\n') {
        // newline in name!
        strPlayerName = "\x11";
        break;
      } else if(strPlayerName[i] < 32) {
        // invalid character in name!
        strPlayerName = "\x12";
        break;
      }
    }

    CTString strKey;
    strKey.PrintF("player_%d\x02%s\x03", iPlayer, (const char*)strPlayerName);
    strOut+=strKey;
    if (GetSP()->sp_bUseFrags) {
      strKey.PrintF("frags_%d\x02%d\x03", iPlayer, m_psLevelStats.ps_iKills);
      strOut+=strKey;
    } else {
      strKey.PrintF("frags_%d\x02%d\x03", iPlayer, m_psLevelStats.ps_iScore);
      strOut+=strKey;
    }
    strKey.PrintF("ping_%d\x02%d\x03", iPlayer, INDEX(ceil(en_tmPing*1000.0f)));
    strOut+=strKey;
  };
  
  // provide info for MSLegacy enumeration
  void GetMSLegacyPlayerInf( INDEX iPlayer, CTString &strOut)
  {
    CTString strKey;
    strKey.PrintF("\\player_%d\\%s", iPlayer, (const char*)GetPlayerName());
	  strOut+=strKey;
    if (GetSP()->sp_bUseFrags) {
      strKey.PrintF("\\frags_%d\\%d", iPlayer, m_psLevelStats.ps_iKills);
	    strOut+=strKey;
    } else {
      strKey.PrintF("\\frags_%d\\%d", iPlayer, m_psLevelStats.ps_iScore);
	    strOut+=strKey;
    }
    strKey.PrintF("\\ping_%d\\%d", iPlayer, INDEX(ceil(en_tmPing*1000.0f)));
    strOut+=strKey;
  };

  void SayVoiceMessage(const CTFileName &fnmMessage)
  {
    if (GetSettings()->ps_ulFlags&PSF_NOQUOTES) {
      return;
    }
    SetSpeakMouthPitch();
    PlaySound( m_soSpeech, fnmMessage, SOF_3D|SOF_VOLUMETRIC);
  }

  // mark that an item was picked
  void ItemPicked(const CTString &strName, FLOAT fAmmount)
  {
    // if nothing picked too long
    if (_pTimer->CurrentTick() > m_tmLastPicked+PICKEDREPORT_TIME) {
      // kill the name
      m_strPickedName = "";
      // reset picked mana
      m_fPickedMana = 0;
    }
    // if different than last picked
    if (m_strPickedName!=strName) {
      // remember name
      m_strPickedName = strName;
      // reset picked ammount
      m_fPickedAmmount = 0;
    }
    // increase ammount
    m_fPickedAmmount+=fAmmount;
    m_tmLastPicked = _pTimer->CurrentTick();
  }

  // Setup light source
  void SetupLightSource(void)
  {
    // setup light source
    CLightSource lsNew;
    lsNew.ls_ulFlags = LSF_NONPERSISTENT|LSF_DYNAMIC;
    lsNew.ls_rHotSpot = 1.0f;
    lsNew.ls_colColor = C_WHITE;
    lsNew.ls_rFallOff = 2.5f;
    lsNew.ls_plftLensFlare = NULL;
    lsNew.ls_ubPolygonalMask = 0;
    lsNew.ls_paoLightAnimation = &m_aoLightAnimation;

    m_lsLightSource.ls_penEntity = this;
    m_lsLightSource.SetLightSource(lsNew);
  };

  // play light animation
  void PlayLightAnim(INDEX iAnim, ULONG ulFlags) {
    if (m_aoLightAnimation.GetData()!=NULL) {
      m_aoLightAnimation.PlayAnim(iAnim, ulFlags);
    }
  };


  BOOL AdjustShadingParameters(FLOAT3D &vLightDirection, COLOR &colLight, COLOR &colAmbient) 
  {
    if( cht_bDumpPlayerShading)
    {
      ANGLE3D a3dHPB;
      DirectionVectorToAngles(-vLightDirection, a3dHPB);
      UBYTE ubAR, ubAG, ubAB;
      UBYTE ubCR, ubCG, ubCB;
      ColorToRGB(colAmbient, ubAR, ubAG, ubAB);
      ColorToRGB(colLight, ubCR, ubCG, ubCB);
      CPrintF("Ambient: %d,%d,%d, Color: %d,%d,%d, Direction HPB (%g,%g,%g)\n",
        ubAR, ubAG, ubAB, ubCR, ubCG, ubCB, a3dHPB(1), a3dHPB(2), a3dHPB(3));
    }

    // make models at least a bit bright in deathmatch
    if (!GetSP()->sp_bCooperative) {
      UBYTE ubH, ubS, ubV;
      ColorToHSV(colAmbient, ubH, ubS, ubV);
      if (ubV<22) {
        ubV = 22;
        colAmbient = HSVToColor(ubH, ubS, ubV);
      }      
    }

    return CPlayerEntity::AdjustShadingParameters(vLightDirection, colLight, colAmbient);
  };

  // get a different model object for rendering
  CModelObject *GetModelForRendering(void)
  {
    // if not yet initialized
    if(!(m_ulFlags&PLF_INITIALIZED)) { 
      // return base model
      return GetModelObject();
    }

    // lerp player viewpoint
    CPlacement3D plView;
    plView.Lerp(en_plLastViewpoint, en_plViewpoint, _pTimer->GetLerpFactor());
    // body and head attachment animation
    ((CPlayerAnimator&)*m_penAnimator).BodyAndHeadOrientation(plView);
    ((CPlayerAnimator&)*m_penAnimator).OnPreRender();
    // synchronize your appearance with the default model
    m_moRender.Synchronize(*GetModelObject());
    if (m_ulFlags&PLF_SYNCWEAPON) {
      m_ulFlags &= ~PLF_SYNCWEAPON;
      GetPlayerAnimator()->SyncWeapon();
    }

    FLOAT tmNow = _pTimer->GetLerpedCurrentTick();

    FLOAT fFading = 1.0f;
    if (m_tmFadeStart!=0) {
      FLOAT fFactor = (tmNow-m_tmFadeStart)/5.0f;
      fFactor = Clamp(fFactor, 0.0f, 1.0f);
      fFading*=fFactor;
    }

    // if invunerable after spawning
    FLOAT tmSpawnInvulnerability = GetSP()->sp_tmSpawnInvulnerability;
    if (tmSpawnInvulnerability>0 && tmNow-m_tmSpawned<tmSpawnInvulnerability) {
      // blink fast
      FLOAT fDelta = tmNow-m_tmSpawned;
      fFading *= 0.75f+0.25f*Sin(fDelta/0.5f*360);
    }

    COLOR colAlpha = m_moRender.mo_colBlendColor;
    colAlpha = (colAlpha&0xffffff00) + (COLOR(fFading*0xff)&0xff);
    m_moRender.mo_colBlendColor = colAlpha;

    // if not connected
    if (m_ulFlags&PLF_NOTCONNECTED) {
      // pulse slowly
      fFading *= 0.25f+0.25f*Sin(tmNow/2.0f*360);
    // if invisible
    } else if (m_tmInvisibility>tmNow) {
      FLOAT fIntensity=0.0f;
      if((m_tmInvisibility-tmNow)<3.0f)
      {
        fIntensity = 0.5f-0.5f*cos((m_tmInvisibility-tmNow)*(6.0f*3.1415927f/3.0f));
      }
      if (_ulPlayerRenderingMask == 1<<GetMyPlayerIndex()) {
        colAlpha = (colAlpha&0xffffff00)|(INDEX)(INVISIBILITY_ALPHA_LOCAL+(FLOAT)(254-INVISIBILITY_ALPHA_LOCAL)*fIntensity);
      } else if (TRUE) {
        if ((m_tmInvisibility-tmNow)<1.28f) {
          colAlpha = (colAlpha&0xffffff00)|(INDEX)(INVISIBILITY_ALPHA_REMOTE+(FLOAT)(254-INVISIBILITY_ALPHA_REMOTE)*fIntensity);
        } else if (TRUE) {
          colAlpha = (colAlpha&0xffffff00)|INVISIBILITY_ALPHA_REMOTE;
        }
      }
      m_moRender.mo_colBlendColor = colAlpha;
    }

    // use the appearance for rendering
    return &m_moRender;
  }

  // wrapper for action marker getting
  class CPlayerActionMarker *GetActionMarker(void) {
    return (CPlayerActionMarker *)&*m_penActionMarker;
  }

  // find main music holder if not remembered
  void FindMusicHolder(void)
  {
    if (m_penMainMusicHolder==NULL) {
      m_penMainMusicHolder = _pNetwork->GetEntityWithName("MusicHolder", 0);
    }
  }

  // update per-level stats
  void UpdateLevelStats(void)
  {
    // clear stats for this level
    m_psLevelStats = PlayerStats();

    // get music holder
    if (m_penMainMusicHolder==NULL) {
      return;
    }
    CMusicHolder &mh = (CMusicHolder&)*m_penMainMusicHolder;

    // assure proper count enemies in current world
    if (mh.m_ctEnemiesInWorld==0) {
      mh.CountEnemies();
    }
    // set totals for level and increment for game
    m_psLevelTotal.ps_iKills = mh.m_ctEnemiesInWorld;
    m_psGameTotal.ps_iKills += mh.m_ctEnemiesInWorld;
    m_psLevelTotal.ps_iSecrets = mh.m_ctSecretsInWorld;
    m_psGameTotal.ps_iSecrets += mh.m_ctSecretsInWorld;
  }

  // check if there is fuss
  BOOL IsFuss(void)
  {
    // if no music holder
    if (m_penMainMusicHolder==NULL) {
      // no fuss
      return FALSE;
    }
    // if no enemies - no fuss
    return ((CMusicHolder*)&*m_penMainMusicHolder)->m_cenFussMakers.Count()>0;
  }

  void SetDefaultMouthPitch(void)
  {
    m_soMouth.Set3DParameters(50.0f, 10.0f, 1.0f, 1.0f);
  }
  void SetRandomMouthPitch(FLOAT fMin, FLOAT fMax)
  {
    m_soMouth.Set3DParameters(50.0f, 10.0f, 1.0f, Lerp(fMin, fMax, FRnd()));
  }
  void SetSpeakMouthPitch(void)
  {
    m_soSpeech.Set3DParameters(50.0f, 10.0f, 2.0f, 1.0f);
  }

  // added: also shake view because of chainsaw firing
  void ApplyShaking(CPlacement3D &plViewer)
  {
    // chainsaw shaking
    FLOAT fT = _pTimer->GetLerpedCurrentTick();
    if (fT<m_tmChainShakeEnd)
    {
      m_fChainsawShakeDX = 0.03f*m_fChainShakeStrength*SinFast(fT*m_fChainShakeFreqMod*3300.0f);
      m_fChainsawShakeDY = 0.03f*m_fChainShakeStrength*SinFast(fT*m_fChainShakeFreqMod*2900.0f);
      
      plViewer.pl_PositionVector(1) += m_fChainsawShakeDX;
      plViewer.pl_PositionVector(3) += m_fChainsawShakeDY;
    }

    CWorldSettingsController *pwsc = GetWSC(this);
    if (pwsc==NULL || pwsc->m_tmShakeStarted<0) {
      return;
    }

    TIME tm = _pTimer->GetLerpedCurrentTick()-pwsc->m_tmShakeStarted;
    if (tm<0) {
      return;
    }
    FLOAT fDistance = (plViewer.pl_PositionVector-pwsc->m_vShakePos).Length();
    FLOAT fIntensity = IntensityAtDistance(pwsc->m_fShakeFalloff, 0, fDistance);
    FLOAT fShakeY, fShakeB, fShakeZ;
    if (!pwsc->m_bShakeFadeIn) {
      fShakeY = SinFast(tm*pwsc->m_tmShakeFrequencyY*360.0f)*
        exp(-tm*(pwsc->m_fShakeFade))*
        fIntensity*pwsc->m_fShakeIntensityY;
      fShakeB = SinFast(tm*pwsc->m_tmShakeFrequencyB*360.0f)*
        exp(-tm*(pwsc->m_fShakeFade))*
        fIntensity*pwsc->m_fShakeIntensityB;
      fShakeZ = SinFast(tm*pwsc->m_tmShakeFrequencyZ*360.0f)*
        exp(-tm*(pwsc->m_fShakeFade))*
        fIntensity*pwsc->m_fShakeIntensityZ;
    } else {
      FLOAT ootm = 1.0f/tm;
      fShakeY = SinFast(tm*pwsc->m_tmShakeFrequencyY*360.0f)*
        exp((tm-2)*ootm*(pwsc->m_fShakeFade))*
        fIntensity*pwsc->m_fShakeIntensityY;
      fShakeB = SinFast(tm*pwsc->m_tmShakeFrequencyB*360.0f)*
        exp((tm-2)*ootm*(pwsc->m_fShakeFade))*
        fIntensity*pwsc->m_fShakeIntensityB;
      fShakeZ = SinFast(tm*pwsc->m_tmShakeFrequencyZ*360.0f)*
        exp((tm-2)*ootm*(pwsc->m_fShakeFade))*
        fIntensity*pwsc->m_fShakeIntensityZ;
    }
    plViewer.pl_PositionVector(2) += fShakeY;
    plViewer.pl_PositionVector(3) += fShakeZ;
    plViewer.pl_OrientationAngle(3) += fShakeB;
    
  }

  COLOR GetWorldGlaring(void)
  {
    CWorldSettingsController *pwsc = GetWSC(this);
    if (pwsc==NULL || pwsc->m_tmGlaringStarted<0) {
      return 0;
    }
    TIME tm = _pTimer->GetLerpedCurrentTick();
    FLOAT fRatio = CalculateRatio(tm, pwsc->m_tmGlaringStarted, pwsc->m_tmGlaringEnded,
      pwsc->m_fGlaringFadeInRatio,  pwsc->m_fGlaringFadeOutRatio);
    COLOR colResult = (pwsc->m_colGlade&0xFFFFFF00)|(UBYTE(fRatio*255.0f));
    return colResult;
  }

  void RenderScroll(CDrawPort *pdp)
  {
    CWorldSettingsController *pwsc = GetWSC(this);
    if( pwsc!=NULL && pwsc->m_penScrollHolder!=NULL)
    {
      CScrollHolder &sch = (CScrollHolder &) *pwsc->m_penScrollHolder;
      sch.Credits_Render(&sch, pdp);
    }
  }

  void RenderCredits(CDrawPort *pdp)
  {
    CWorldSettingsController *pwsc = GetWSC(this);
    if( pwsc!=NULL && pwsc->m_penCreditsHolder!=NULL)
    {
      CCreditsHolder &cch = (CCreditsHolder &) *pwsc->m_penCreditsHolder;
      cch.Credits_Render(&cch, pdp);
    }
  }
  
  void RenderTextFX(CDrawPort *pdp)
  {
    CWorldSettingsController *pwsc = GetWSC(this);
    if( pwsc!=NULL && pwsc->m_penTextFXHolder!=NULL)
    {
      CTextFXHolder &tfx = (CTextFXHolder &) *pwsc->m_penTextFXHolder;
      tfx.TextFX_Render(&tfx, pdp);
    }
  }

  void RenderHudPicFX(CDrawPort *pdp)
  {
    CWorldSettingsController *pwsc = GetWSC(this);
    if( pwsc!=NULL && pwsc->m_penHudPicFXHolder!=NULL)
    {
      CHudPicHolder &hpfx = (CHudPicHolder &) *pwsc->m_penHudPicFXHolder;
      hpfx.HudPic_Render(&hpfx, pdp);
    }
  }

  void RenderOverlay(CDrawPort *pdp)
  {
    CWorldSettingsController *pwsc = GetWSC(this);
    if( pwsc!=NULL && pwsc->m_penOverlayFXHolder!=NULL)
    {
      COverlayHolder &olfx = (COverlayHolder &) *pwsc->m_penOverlayFXHolder;
      olfx.Overlay_Render(&olfx, pdp);
    }
  }

/************************************************************
 *                    RENDER GAME VIEW                      *
 ************************************************************/

  // setup viewing parameters for viewing from player or camera
  void SetupView(CDrawPort *pdp, CAnyProjection3D &apr, CEntity *&penViewer, 
    CPlacement3D &plViewer, COLOR &colBlend, BOOL bCamera)
  {
    // read the exact placement of the view for this tick
    GetLerpedAbsoluteViewPlacement(plViewer);
    ASSERT(IsValidFloat(plViewer.pl_OrientationAngle(1))&&IsValidFloat(plViewer.pl_OrientationAngle(2))&&IsValidFloat(plViewer.pl_OrientationAngle(3)) );
    // get current entity that the player views from
    penViewer = GetViewEntity();

    INDEX iViewState = m_iViewState;
    
    if (m_penCamera!=NULL && bCamera) {
      iViewState = PVT_SCENECAMERA;
      plViewer = m_penCamera->GetLerpedPlacement();
      penViewer = m_penCamera;
    }

    // init projection parameters
    CPerspectiveProjection3D prPerspectiveProjection;
    plr_fFOV = Clamp( plr_fFOV, 1.0f, 160.0f);
    ANGLE aFOV = plr_fFOV;
    // disable zoom in deathmatch
    if (!GetSP()->sp_bCooperative) {
      aFOV = 90.0f;
    }

    if (m_pstState==PST_DIVE && iViewState == PVT_PLAYEREYES) {
      TIME tmNow = _pTimer->GetLerpedCurrentTick();
      aFOV+=sin(tmNow*0.79f)*2.0f;
    }
    ApplyShaking(plViewer);

    colBlend = 0;
    if (iViewState == PVT_SCENECAMERA) {
      CCamera *pcm = (CCamera*)&*m_penCamera;
      prPerspectiveProjection.FOVL() = 
        Lerp(pcm->m_fLastFOV, pcm->m_fFOV, _pTimer->GetLerpFactor());
      if (pcm->m_tmDelta>0.001f) {
        FLOAT fFactor = (_pTimer->GetLerpedCurrentTick()-pcm->m_tmAtMarker)/pcm->m_tmDelta;
        fFactor = Clamp( fFactor, 0.0f, 1.0f);
        colBlend = LerpColor( pcm->m_colFade0, pcm->m_colFade1, fFactor);
      } else {
        colBlend = pcm->m_colFade0;
      }
    } else {
      prPerspectiveProjection.FOVL() = aFOV;
    }
    prPerspectiveProjection.ScreenBBoxL() = FLOATaabbox2D(
      FLOAT2D(0.0f, 0.0f),
      FLOAT2D((FLOAT)pdp->GetWidth(), (FLOAT)pdp->GetHeight())
    );
    // determine front clip plane
    plr_fFrontClipDistance = Clamp( plr_fFrontClipDistance, 0.05f, 0.50f);
    FLOAT fFCD = plr_fFrontClipDistance;
    // adjust front clip plane if swimming
    if( m_pstState==PST_SWIM && iViewState==PVT_PLAYEREYES) { fFCD *= 0.6666f; }
    prPerspectiveProjection.FrontClipDistanceL() = fFCD;
    prPerspectiveProjection.AspectRatioL() = 1.0f;
    // set up viewer position
    apr = prPerspectiveProjection;
    apr->ViewerPlacementL() = plViewer;
    apr->ObjectPlacementL() = CPlacement3D(FLOAT3D(0,0,0), ANGLE3D(0,0,0));
    prPlayerProjection = apr;
    prPlayerProjection->Prepare();
  }

  // listen from a given viewer
  void ListenFromEntity(CEntity *penListener, const CPlacement3D &plSound)
  {
    FLOATmatrix3D mRotation;
    MakeRotationMatrixFast(mRotation, plSound.pl_OrientationAngle);
    sliSound.sli_vPosition = plSound.pl_PositionVector;
    sliSound.sli_mRotation = mRotation;
    sliSound.sli_fVolume = 1.0f;
    sliSound.sli_vSpeed = en_vCurrentTranslationAbsolute;
    sliSound.sli_penEntity = penListener;
    if (m_pstState == PST_DIVE) {
      sliSound.sli_fFilter = 20.0f;
    } else {
      sliSound.sli_fFilter = 0.0f;
    }
    INDEX iEnv = 0;

    CBrushSector *pbsc = penListener->GetSectorFromPoint(plSound.pl_PositionVector);

    // for each sector around listener
    if (pbsc!=NULL) {
      iEnv = pbsc->GetEnvironmentType();
    }

    // get the environment
    CEnvironmentType &et = GetWorld()->wo_aetEnvironmentTypes[iEnv];
    sliSound.sli_iEnvironmentType = et.et_iType;
    sliSound.sli_fEnvironmentSize = et.et_fSize;
    _pSound->Listen(sliSound);
  }

  // render dummy view (not connected yet)
  void RenderDummyView(CDrawPort *pdp)
  {
    // clear screen
    pdp->Fill( C_BLACK|CT_OPAQUE);
    
    // if not single player
    if (!GetSP()->sp_bSinglePlayer) {
      // print a message
      PIX pixDPWidth  = pdp->GetWidth();
      PIX pixDPHeight = pdp->GetHeight();
      FLOAT fScale = (FLOAT)pixDPWidth/640.0f;
      pdp->SetFont( _pfdDisplayFont);
      pdp->SetTextScaling( fScale);
      pdp->SetTextAspect( 1.0f);
      CTString strMsg;
      strMsg.PrintF(TRANS("%s connected"), GetPlayerName());
      pdp->PutTextCXY( strMsg, pixDPWidth*0.5f, pixDPHeight*0.5f, SE_COL_BLUE_NEUTRAL_LT|CT_OPAQUE);
    }
  }

  // render view from player
  void RenderPlayerView(CDrawPort *pdp, BOOL bShowExtras)
  {

    CAnyProjection3D apr;
    CEntity *penViewer;
    CPlacement3D plViewer;
    COLOR colBlend;

    // for each eye
    for (INDEX iEye=STEREO_LEFT; iEye<=(Stereo_IsEnabled()?STEREO_RIGHT:STEREO_LEFT); iEye++) {

      // setup view settings
      SetupView(pdp, apr, penViewer, plViewer, colBlend, FALSE);

      // setup stereo rendering
      Stereo_SetBuffer(iEye);
      Stereo_AdjustProjection(*apr, iEye, 1);

      // render the view
      ASSERT(IsValidFloat(plViewer.pl_OrientationAngle(1))&&IsValidFloat(plViewer.pl_OrientationAngle(2))&&IsValidFloat(plViewer.pl_OrientationAngle(3)));
      _ulPlayerRenderingMask = 1<<GetMyPlayerIndex();
      RenderView(*en_pwoWorld, *penViewer, apr, *pdp);
      _ulPlayerRenderingMask = 0;

      if (iEye==STEREO_LEFT) {
        // listen from here
        ListenFromEntity(this, plViewer);
      }

      RenderScroll(pdp);
      RenderTextFX(pdp);
      RenderCredits(pdp);
      RenderHudPicFX(pdp);

      if(hud_bShowAll && bShowExtras) {
        // let the player entity render its interface
        CPlacement3D plLight(_vViewerLightDirection, ANGLE3D(0,0,0));
        plLight.AbsoluteToRelative(plViewer);
        RenderHUD( *(CPerspectiveProjection3D *)(CProjection3D *)apr, pdp, 
          plLight.pl_PositionVector, _colViewerLight, _colViewerAmbient, 
          penViewer==this && (GetFlags()&ENF_ALIVE), iEye);
      }

      RenderOverlay(pdp);
    }
    Stereo_SetBuffer(STEREO_BOTH);

    // determine and cache main drawport, size and relative scale
    PIX pixDPWidth  = pdp->GetWidth();
    PIX pixDPHeight = pdp->GetHeight();
    FLOAT fScale = (FLOAT)pixDPWidth/640.0f;

    // print center message
    if (_pTimer->CurrentTick()<m_tmCenterMessageEnd) {
      if(m_mfFont == FNT_RUNIC)
      {
        pdp->SetFont( _pfdRunicFont);
      }
      else
      {
        pdp->SetFont( _pfdDisplayFont);
      }
      pdp->SetTextScaling( fScale);
      pdp->SetTextAspect( 1.0f);
      pdp->PutTextCXY( m_strCenterMessage, pixDPWidth*m_fMessagePosX, pixDPHeight*m_fMessagePosY, C_WHITE|0xDD);
    // print picked item
    } else if (_pTimer->CurrentTick()<m_tmLastPicked+PICKEDREPORT_TIME) {
      pdp->SetFont( _pfdDisplayFont);
      pdp->SetTextScaling( fScale);
      pdp->SetTextAspect( 1.0f);
      CTString strPicked;
      if (m_fPickedAmmount==0) {
        strPicked = m_strPickedName;
      } else {
        strPicked.PrintF("%s +%d", m_strPickedName, int(m_fPickedAmmount));
      }
      pdp->PutTextCXY( strPicked, pixDPWidth*0.5f, pixDPHeight*0.82f, C_WHITE|0xDD);
      if (!GetSP()->sp_bCooperative && !GetSP()->sp_bUseFrags && m_fPickedMana>=1) {
        CTString strValue;
        strValue.PrintF("%s +%d", TRANS("Value"), INDEX(m_fPickedMana));
        pdp->PutTextCXY( strValue, pixDPWidth*0.5f, pixDPHeight*0.85f, C_WHITE|0xDD);
      }
    }
  }

  // render view from camera
  void RenderCameraView(CDrawPort *pdp, BOOL bListen)
  {
    CDrawPort dpCamera;
    CDrawPort *pdpCamera = pdp;
    if (m_penCamera!=NULL && ((CCamera&)*m_penCamera).m_bWideScreen) {
      pdp->MakeWideScreen(&dpCamera);
      pdpCamera = &dpCamera;
    }

    pdp->Unlock();
    pdpCamera->Lock();

    CAnyProjection3D apr;
    CEntity *penViewer;
    CPlacement3D plViewer;
    COLOR colBlend;

    // for each eye
    for (INDEX iEye=STEREO_LEFT; iEye<=(Stereo_IsEnabled()?STEREO_RIGHT:STEREO_LEFT); iEye++) {

      // setup view settings
      SetupView(pdpCamera, apr, penViewer, plViewer, colBlend, TRUE);

      // setup stereo rendering
      Stereo_SetBuffer(iEye);
      Stereo_AdjustProjection(*apr, iEye, 1);

      // render the view
      ASSERT(IsValidFloat(plViewer.pl_OrientationAngle(1))&&IsValidFloat(plViewer.pl_OrientationAngle(2))&&IsValidFloat(plViewer.pl_OrientationAngle(3)));
      _ulPlayerRenderingMask = 1<<GetMyPlayerIndex();
      RenderView(*en_pwoWorld, *penViewer, apr, *pdpCamera);
      _ulPlayerRenderingMask = 0;

      // listen from there if needed
      if (bListen && iEye==STEREO_LEFT) {
        ListenFromEntity(penViewer, plViewer);
      }
    }
    Stereo_SetBuffer(STEREO_BOTH);

    RenderScroll(pdpCamera);
    RenderTextFX(pdpCamera);
    RenderCredits(pdpCamera);
    RenderHudPicFX(pdpCamera);
    RenderOverlay(pdpCamera);

    // add world glaring
    {
      COLOR colGlare = GetWorldGlaring();
      UBYTE ubR, ubG, ubB, ubA;
      ColorToRGBA(colGlare, ubR, ubG, ubB, ubA);
      if (ubA!=0) {
        pdpCamera->dp_ulBlendingRA += ULONG(ubR)*ULONG(ubA);
        pdpCamera->dp_ulBlendingGA += ULONG(ubG)*ULONG(ubA);
        pdpCamera->dp_ulBlendingBA += ULONG(ubB)*ULONG(ubA);
        pdpCamera->dp_ulBlendingA  += ULONG(ubA);
      }
      // do all queued screen blendings
      pdpCamera->BlendScreen();
    }

    pdpCamera->Unlock();
    pdp->Lock();

    // camera fading
    if ((colBlend&CT_AMASK)!=0) {
      pdp->Fill(colBlend);
    }

    // print center message
    if (_pTimer->CurrentTick()<m_tmCenterMessageEnd) {
      PIX pixDPWidth  = pdp->GetWidth();
      PIX pixDPHeight = pdp->GetHeight();
      FLOAT fScale = (FLOAT)pixDPWidth/640.0f;
      if(m_mfFont == FNT_RUNIC)
      {
        pdp->SetFont( _pfdRunicFont);
      }
      else
      {
        pdp->SetFont( _pfdDisplayFont);
      }
      pdp->SetTextScaling( fScale);
      pdp->SetTextAspect( 1.0f);
      pdp->PutTextCXY( m_strCenterMessage, pixDPWidth*m_fMessagePosX, pixDPHeight*m_fMessagePosY, C_WHITE|0xDD);
    }
  }


  void RenderGameView(CDrawPort *pdp, void *pvUserData)
  {
    BOOL bShowExtras = (ULONG(pvUserData)&GRV_SHOWEXTRAS);
    pdp->Unlock();

    // if not yet initialized
    if(!(m_ulFlags&PLF_INITIALIZED) || (m_ulFlags&PLF_DONTRENDER)) { 
      // render dummy view on the right drawport
      CDrawPort dpView(pdp, TRUE);
      if(dpView.Lock()) {
        RenderDummyView(&dpView);
        dpView.Unlock();
      }
      pdp->Lock();
      return; 
    }

    // if rendering real game view (not thumbnail, or similar)
    if (pvUserData!=0) {
      // if rendered a game view recently
      CTimerValue tvNow = _pTimer->GetHighPrecisionTimer();
      if ((tvNow-_tvProbingLast).GetSeconds()<0.1) {
        // allow probing
        _pGfx->gl_bAllowProbing = TRUE;
      }
      _tvProbingLast = tvNow;
    }

    //CPrintF("%s: render\n", GetPredictName());

    // check for dualhead
    BOOL bDualHead = 
      pdp->IsDualHead() && 
      GetSP()->sp_gmGameMode!=CSessionProperties::GM_FLYOVER &&
      m_penActionMarker==NULL;

    // if dualhead, or no camera active
    if (bDualHead||m_penCamera==NULL) {
      // make left player view
      CDrawPort dpView(pdp, TRUE);
      if(dpView.Lock()) {
        // draw it
        RenderPlayerView(&dpView, bShowExtras);
        dpView.Unlock();
      }
    }

    // if camera active
    if (m_penCamera!=NULL) {
      // make left or right camera view
      CDrawPort dpView(pdp, m_penActionMarker!=NULL);
      if(dpView.Lock()) {
        // draw it, listen if not dualhead
        RenderCameraView(&dpView, !bDualHead);
        dpView.Unlock();
      }
    }

    // all done - lock back the original drawport
    pdp->Lock();
  };




/************************************************************
 *                   PRE/DO/POST MOVING                     *
 ************************************************************/

  // premoving for soft player up-down movement
  void PreMoving(void) {
    /*CPrintF("pos(%s): %g,%g,%g\n", GetPredictName(), 
      GetPlacement().pl_PositionVector(1),
      GetPlacement().pl_PositionVector(2),
      GetPlacement().pl_PositionVector(3));
      */

    ((CPlayerAnimator&)*m_penAnimator).StoreLast();
    CPlayerEntity::PreMoving();
  };

  // do moving
  void DoMoving(void) {
    CPlayerEntity::DoMoving();
    ((CPlayerAnimator&)*m_penAnimator).AnimateBanking();

    if (m_penView!=NULL) {
      ((CPlayerView&)*m_penView).DoMoving();
    }
    if (m_pen3rdPersonView!=NULL) {
      ((CPlayerView&)*m_pen3rdPersonView).DoMoving();
    }
  };


  // postmoving for soft player up-down movement
  void PostMoving(void)
  {
    CPlayerEntity::PostMoving();
    // never allow a player to be removed from the list of movers
    en_ulFlags &= ~ENF_INRENDERING;

    ((CPlayerAnimator&)*m_penAnimator).AnimateSoftEyes();
    //((CPlayerAnimator&)*m_penAnimator).AnimateRecoilPitch();

    // slowly increase mana with time, faster if player is not moving; (only if alive)
    if (GetFlags()&ENF_ALIVE)
    {
      m_fManaFraction += 
        ClampDn( 1.0f-en_vCurrentTranslationAbsolute.Length()/20.0f, 0.0f) * 20.0f
        * _pTimer->TickQuantum;
      INDEX iNewMana = m_fManaFraction;
      m_iMana         += iNewMana;
      m_fManaFraction -= iNewMana;
    }

    // if in tourist mode
    if (GetSP()->sp_gdGameDifficulty==CSessionProperties::GD_TOURIST && GetFlags()&ENF_ALIVE) {
      // slowly increase health with time
      FLOAT fHealth = GetHealth();
      FLOAT fTopHealth = TopHealth();
      if (fHealth<fTopHealth) {
        SetHealth(ClampUp(fHealth+_pTimer->TickQuantum, fTopHealth));  // one unit per second
      }
    }

    // update ray hit for weapon target
    GetPlayerWeapons()->UpdateTargetingInfo();

    if (m_pen3rdPersonView!=NULL) {
      ((CPlayerView&)*m_pen3rdPersonView).PostMoving();
    }
    if (m_penView!=NULL) {
      ((CPlayerView&)*m_penView).PostMoving();
    }

    // if didn't have any action in this tick
    if (!(m_ulFlags&PLF_APPLIEDACTION)) {
      // means we are not connected
      SetUnconnected();
    }

    // clear action indicator
    m_ulFlags&=~PLF_APPLIEDACTION;
  }

  // set player parameters for unconnected state (between the server loads and player reconnects)
  void SetUnconnected(void)
  {
    if (m_ulFlags&PLF_NOTCONNECTED) {
      return;
    }
    m_ulFlags |= PLF_NOTCONNECTED;

    // reset to a dummy state
    ForceFullStop();
    SetPhysicsFlags(GetPhysicsFlags() & ~(EPF_TRANSLATEDBYGRAVITY|EPF_ORIENTEDBYGRAVITY));
    SetCollisionFlags(GetCollisionFlags() & ~((ECBI_BRUSH|ECBI_MODEL)<<ECB_TEST));
    en_plLastViewpoint.pl_OrientationAngle = en_plViewpoint.pl_OrientationAngle = ANGLE3D(0,0,0);

    StartModelAnim(PLAYER_ANIM_STAND, 0);
    GetPlayerAnimator()->BodyAnimationTemplate(
      BODY_ANIM_NORMALWALK, BODY_ANIM_COLT_STAND, BODY_ANIM_SHOTGUN_STAND, BODY_ANIM_MINIGUN_STAND, 
      AOF_LOOPING|AOF_NORESTART);
  }

  // set player parameters for connected state
  void SetConnected(void)
  {
    if (!(m_ulFlags&PLF_NOTCONNECTED)) {
      return;
    }
    m_ulFlags &= ~PLF_NOTCONNECTED;

    SetPhysicsFlags(GetPhysicsFlags() | (EPF_TRANSLATEDBYGRAVITY|EPF_ORIENTEDBYGRAVITY));
    SetCollisionFlags(GetCollisionFlags() | ((ECBI_BRUSH|ECBI_MODEL)<<ECB_TEST));
  }

  // check if player is connected or not
  BOOL IsConnected(void) const
  {
    return !(m_ulFlags&PLF_NOTCONNECTED);
  }

  // create a checksum value for sync-check
  void ChecksumForSync(ULONG &ulCRC, INDEX iExtensiveSyncCheck)
  {
    CPlayerEntity::ChecksumForSync(ulCRC, iExtensiveSyncCheck);
    CRC_AddLONG(ulCRC, m_psLevelStats.ps_iScore);
    CRC_AddLONG(ulCRC, m_iMana);
    if (iExtensiveSyncCheck>0) {
      CRC_AddFLOAT(ulCRC, m_fManaFraction);
    }
    CRC_AddFLOAT(ulCRC, m_fArmor);
  }


  // dump sync data to text file
  void DumpSync_t(CTStream &strm, INDEX iExtensiveSyncCheck)  // throw char *
  {
    CPlayerEntity::DumpSync_t(strm, iExtensiveSyncCheck);
    strm.FPrintF_t("Score: %d\n", m_psLevelStats.ps_iScore);
    strm.FPrintF_t("m_iMana:  %d\n", m_iMana);
    strm.FPrintF_t("m_fManaFraction: %g(%08x)\n", m_fManaFraction, (ULONG&)m_fManaFraction);
    strm.FPrintF_t("m_fArmor: %g(%08x)\n", m_fArmor, (ULONG&)m_fArmor);
  }

/************************************************************
 *         DAMAGE OVERRIDE (PLAYER HAS ARMOR)               *
 ************************************************************/


  // leave stain
  virtual void LeaveStain( BOOL bGrow)
  {
    ESpawnEffect ese;
    FLOAT3D vPoint;
    FLOATplane3D vPlaneNormal;
    FLOAT fDistanceToEdge;
    // get your size
    FLOATaabbox3D box;
    GetBoundingBox(box);
  
    // on plane
    if( GetNearestPolygon(vPoint, vPlaneNormal, fDistanceToEdge)) {
      // if near to polygon and away from last stain point
      if( (vPoint-GetPlacement().pl_PositionVector).Length()<0.5f
        && (m_vLastStain-vPoint).Length()>1.0f ) {
        m_vLastStain = vPoint;
        FLOAT fStretch = box.Size().Length();
        ese.colMuliplier = C_WHITE|CT_OPAQUE;
        // stain
        if (bGrow) {
          ese.betType    = BET_BLOODSTAINGROW;
          ese.vStretch   = FLOAT3D( fStretch*1.5f, fStretch*1.5f, 1.0f);
        } else {
          ese.betType    = BET_BLOODSTAIN;
          ese.vStretch   = FLOAT3D( fStretch*0.75f, fStretch*0.75f, 1.0f);
        }
        ese.vNormal    = FLOAT3D( vPlaneNormal);
        ese.vDirection = FLOAT3D( 0, 0, 0);
        FLOAT3D vPos = vPoint+ese.vNormal/50.0f*(FRnd()+0.5f);
        CEntityPointer penEffect = CreateEntity( CPlacement3D(vPos, ANGLE3D(0,0,0)), CLASS_BASIC_EFFECT);
        penEffect->Initialize(ese);
      }
    }
  };


  void DamageImpact(enum DamageType dmtType,
                  FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection)
  {
    // if exploded
    if (GetRenderType()!=RT_MODEL) {
      // do nothing
      return;
    }

    if (dmtType == DMT_ABYSS || dmtType == DMT_SPIKESTAB) {
      return;
    }

    fDamageAmmount = Clamp(fDamageAmmount, 0.0f, 5000.0f);

    FLOAT fKickDamage = fDamageAmmount;
    if( (dmtType == DMT_EXPLOSION) || (dmtType == DMT_IMPACT) || (dmtType == DMT_CANNONBALL_EXPLOSION) )
    {
      fKickDamage*=1.5;
    }
    if (dmtType==DMT_DROWNING || dmtType==DMT_CLOSERANGE || dmtType==DMT_AXE) {
      fKickDamage /= 10;
    }
    if (dmtType==DMT_CHAINSAW)
    {
      fKickDamage /= 10;
    }

    // get passed time since last damage
    TIME tmNow = _pTimer->CurrentTick();
    TIME tmDelta = tmNow-m_tmLastDamage;
    m_tmLastDamage = tmNow;

    // fade damage out
    if (tmDelta>=_pTimer->TickQuantum*3) {
      m_vDamage=FLOAT3D(0,0,0);
    }
    // add new damage
    FLOAT3D vDirectionFixed;
    if (vDirection.ManhattanNorm()>0.5f) {
      vDirectionFixed = vDirection;
    } else {
      vDirectionFixed = -en_vGravityDir;
    }
    FLOAT3D vDamageOld = m_vDamage;
    m_vDamage+=(vDirectionFixed/*-en_vGravityDir/2*/)*fKickDamage;
    
    FLOAT fOldLen = vDamageOld.Length();
    FLOAT fNewLen = m_vDamage.Length();
    FLOAT fOldRootLen = Sqrt(fOldLen);
    FLOAT fNewRootLen = Sqrt(fNewLen);

    FLOAT fMassFactor = 200.0f/((EntityInfo*)GetEntityInfo())->fMass;
    
    if( !(en_ulFlags & ENF_ALIVE))
    {
      fMassFactor /= 3;
    }

    switch( dmtType)
    {
    case DMT_CLOSERANGE:
    case DMT_CHAINSAW:
    case DMT_DROWNING:
    case DMT_IMPACT:
    case DMT_BRUSH:
    case DMT_BURNING:
    case DMT_AXE:
    case DMT_SHARP:
    case DMT_BLUNT:
      // do nothing
      break;
    default:
    {
      if(fOldLen != 0.0f)
      {
        // cancel last push
        GiveImpulseTranslationAbsolute( -vDamageOld/fOldRootLen*fMassFactor);
      }
      
      /*
      FLOAT3D vImpuls = m_vDamage/fNewRootLen*fMassFactor;
      CPrintF( "Applied absolute translation impuls: (%g%g%g)\n",
        vImpuls(1),vImpuls(2),vImpuls(3));*/

      // push it back
      GiveImpulseTranslationAbsolute( m_vDamage/fNewRootLen*fMassFactor);
    }
    }

    if( m_fMaxDamageAmmount<fDamageAmmount)
    {
      m_fMaxDamageAmmount = fDamageAmmount;
    }
    // if it has no spray, or if this damage overflows it
    if ((m_tmSpraySpawned<=_pTimer->CurrentTick()-_pTimer->TickQuantum*8 || 
      m_fSprayDamage+fDamageAmmount>50.0f)) {

      FLOAT3D vHitPointCorrect = vHitPoint;

      if (dmtType == DMT_CLOSERANGE || dmtType == DMT_AXE || dmtType == DMT_SHARP || dmtType == DMT_BLUNT)
      {
        const EntityInfo& info = *((EntityInfo*)GetEntityInfo());
        CPlacement3D plCenter(FLOAT3D(info.vTargetCenter[0], info.vTargetCenter[1], info.vTargetCenter[2]), ANGLE3D(0, 0, 0));
        plCenter.RelativeToAbsoluteSmooth(GetPlacement());
        vHitPointCorrect = plCenter.pl_PositionVector - vDirection;
      }

      // spawn blood spray
      CPlacement3D plSpray = CPlacement3D( vHitPointCorrect, ANGLE3D(0, 0, 0));
      m_penSpray = CreateEntity( plSpray, CLASS_BLOOD_SPRAY);
      m_penSpray->SetParent( this);
      ESpawnSpray eSpawnSpray;
      eSpawnSpray.colBurnColor=C_WHITE|CT_OPAQUE;
      
      if( m_fMaxDamageAmmount > 10.0f)
      {
        eSpawnSpray.fDamagePower = 1.25f;
      }
      else if(m_fSprayDamage+fDamageAmmount>50.0f)
      {
        eSpawnSpray.fDamagePower = 0.75f;
      }
      else
      {
        eSpawnSpray.fDamagePower = 0.45f;
      }

      eSpawnSpray.sptType = SPT_BLOOD;
      eSpawnSpray.fSizeMultiplier = 0.5f;

      // setup direction of spray
      FLOAT3D vHitPointRelative = vHitPointCorrect - GetPlacement().pl_PositionVector;
      FLOAT3D vReflectingNormal;
      GetNormalComponent( vHitPointRelative, en_vGravityDir, vReflectingNormal);
      vReflectingNormal.Normalize();
      
      vReflectingNormal(1)/=5.0f;
    
      FLOAT3D vProjectedComponent = vReflectingNormal*(vDirection%vReflectingNormal);
      FLOAT3D vSpilDirection = vDirection-vProjectedComponent*2.0f-en_vGravityDir*0.5f;

      eSpawnSpray.vDirection = vSpilDirection;
      eSpawnSpray.penOwner = this;

      // initialize spray
      m_penSpray->Initialize( eSpawnSpray);
      m_tmSpraySpawned = _pTimer->CurrentTick();
      m_fSprayDamage = 0.0f;
      m_fMaxDamageAmmount = 0.0f;
    }
    m_fSprayDamage+=fDamageAmmount;
  }


  // --------------------------------------------------------------------------------------
  // Get cos of angle in direction in current gravity plane.
  // --------------------------------------------------------------------------------------
  FLOAT GetPlaneFrustumAngle(const FLOAT3D &vDir)
  {
    FLOAT3D vPlaneDelta;
    // find vector from you to target in XZ plane
    GetNormalComponent(vDir, en_vGravityDir, vPlaneDelta);
    // find front vector
    FLOAT3D vFront = -GetRotationMatrix().GetColumn(3);
    FLOAT3D vPlaneFront;
    GetNormalComponent(vFront, en_vGravityDir, vPlaneFront);
    // make dot product to determine if you can see target (view angle)
    vPlaneDelta.SafeNormalize();
    vPlaneFront.SafeNormalize();
    return vPlaneDelta%vPlaneFront;
  }


  /* Receive damage */
  void ReceiveDamage( CEntity *penInflictor, enum DamageType dmtType,
                      FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection)
  {
    // don't harm yourself with knife or with rocket in easy/tourist mode
    if( penInflictor==this && (dmtType==DMT_CLOSERANGE || dmtType==DMT_AXE || dmtType==DMT_CHAINSAW ||
        ((dmtType==DMT_EXPLOSION||dmtType==DMT_CANNONBALL_EXPLOSION||dmtType==DMT_PROJECTILE) &&
          GetSP()->sp_gdGameDifficulty<=CSessionProperties::GD_EASY)) ) {
      return;
    }

    // if not connected
    if (m_ulFlags&PLF_NOTCONNECTED) {
      // noone can harm you
      return;
    }

    // god mode -> no one can harm you
    if( cht_bGod && CheatsEnabled() ) { return; }

    // if invulnerable, nothing can harm you except telefrag or abyss
    const TIME tmDelta = m_tmInvulnerability - _pTimer->CurrentTick();
    if( tmDelta>0 && dmtType!=DMT_ABYSS && dmtType!=DMT_TELEPORT) { return; }

    // if invunerable after spawning
    FLOAT tmSpawnInvulnerability = GetSP()->sp_tmSpawnInvulnerability;
    if (tmSpawnInvulnerability>0 && _pTimer->CurrentTick()-m_tmSpawned<tmSpawnInvulnerability) {
      // ignore damage
      return;
    }

    // check for friendly fire
    if (!GetSP()->sp_bFriendlyFire && GetSP()->sp_bCooperative) {
      if (IsOfClass(penInflictor, "Player") && penInflictor!=this) {
        return;
      }
    }

    // ignore heat damage if dead
    if (dmtType==DMT_HEAT && !(GetFlags()&ENF_ALIVE)) {
      return;
    }

    // adjust for difficulty
    FLOAT fDifficultyDamage = GetSP()->sp_fDamageStrength;
    if( fDifficultyDamage<=1.0f || penInflictor!=this) {
      fDamageAmmount *= fDifficultyDamage;
    }

    // ignore zero damages
    if (fDamageAmmount<=0) {
      return;
    }

    FLOAT3D vProperDamageDir = (vDirection.ManhattanNorm() > m_fBlockDirAmount) ? vDirection : -en_vGravityDir;
    vProperDamageDir = (vProperDamageDir - en_vGravityDir * m_fBlockDirAmount).Normalize();

    if(m_bIsBlocking) {
      if(IsOfClass(penInflictor, "Player") || IsDerivedFromClass(penInflictor, "Enemy Base")) {
        if (GetPlaneFrustumAngle(vProperDamageDir) < Cos(m_fBlockAmount)) {
        switch(dmtType) {
          case DMT_CLOSERANGE:
          case DMT_AXE:
          case DMT_BLUNT:
          case DMT_SHARP:
          return;
          break;

          default: 
          m_bIsBlocking = FALSE;
          break;
        }
        }
      }
    }

    FLOAT fSubHealth, fSubArmor;
    if( dmtType == DMT_DROWNING) {
      // drowning
      fSubHealth = fDamageAmmount;
    }
    else {
      // damage and armor
      fSubArmor  = fDamageAmmount;      // 2/3 on armor damage
      fSubHealth = 0;                   // 1/3 on health damage

      // make armor act as second health bar
      if(fSubArmor>0) {
        m_fArmor  -= fSubArmor;
      }

      if( m_fArmor<0) {                          // armor below zero -> add difference to health damage
        fSubHealth -= m_fArmor;
        m_fArmor    = 0.0f;
      }
    }

    if(dmtType == DMT_STING) {
      m_bIsStung = TRUE;
      m_tmStungTime = _pTimer->CurrentTick() + 5.0f;
    }

    // if any damage
    if( fSubHealth>0) { 
      // if camera is active
      if (m_penCamera!=NULL) {
        // if the camera has onbreak
        CEntity *penOnBreak = ((CCamera&)*m_penCamera).m_penOnBreak;
        if (penOnBreak!=NULL) {
          // trigger it
          SendToTarget(penOnBreak, EET_TRIGGER, this);
        // if it doesn't
        } else {
          // just deactivate camera
          m_penCamera = NULL; 
        }
      }

    }

    // if the player is doing autoactions
    if (m_penActionMarker!=NULL) {
      // ignore all damage
      return;
    }

    DamageImpact(dmtType, fSubHealth, vHitPoint, vDirection);

    // receive damage
    CPlayerEntity::ReceiveDamage( penInflictor, dmtType, fSubHealth, vHitPoint, vDirection);

    // red screen and hit translation
    if( fDamageAmmount>1.0f) {
// !!!! this is obsolete, DamageImpact is used instead!
      if( dmtType==DMT_EXPLOSION || dmtType==DMT_PROJECTILE || dmtType==DMT_BULLET
       || dmtType==DMT_IMPACT    || dmtType==DMT_CANNONBALL || dmtType==DMT_CANNONBALL_EXPLOSION
       || dmtType==DMT_PELLET) {
//        GiveImpulseTranslationAbsolute( vDirection*(fDamageAmmount/7.5f)
//                                        -en_vGravityDir*(fDamageAmmount/15.0f));
      }
      if( GetFlags()&ENF_ALIVE) {
        m_fDamageAmmount += fDamageAmmount;
        m_tmWoundedTime   = _pTimer->CurrentTick();
      }
    }

    // yell (this hurts)
    ESound eSound;
    eSound.EsndtSound = SNDT_PLAYER;
    eSound.penTarget  = this;
    SendEventInRange( eSound, FLOATaabbox3D( GetPlacement().pl_PositionVector, 10.0f));

    // play hurting sound
    if( dmtType==DMT_DROWNING) {
      SetRandomMouthPitch( 0.9f, 1.1f);
      if(_pNetwork->IsPlayerLocal(this)) {IFeel_PlayEffect("WoundWater");}
      m_tmMouthSoundLast = _pTimer->CurrentTick();
      PlaySound( m_soLocalAmbientOnce, SOUND_WATERBUBBLES, SOF_3D|SOF_VOLUMETRIC|SOF_LOCAL);
      m_soLocalAmbientOnce.Set3DParameters( 25.0f, 5.0f, 2.0f, Lerp(0.5f, 1.5f, FRnd()) );
      SpawnBubbles( 10+INDEX(FRnd()*10));
    } else if( m_fDamageAmmount>1.0f) {
      // if not dead
      if (GetFlags()&ENF_ALIVE) {
        // determine corresponding sound
        char *strIFeel = NULL;
        if( m_fDamageAmmount<5.0f) {
          strIFeel = "WoundWeak";
        }
        else if( m_fDamageAmmount<25.0f) {
          strIFeel = "WoundMedium";
        }
        else {
          strIFeel = "WoundStrong";
        }
        if( m_pstState==PST_DIVE) {
          strIFeel = "WoundWater";
        } // override for diving
        SetRandomMouthPitch( 0.9f, 1.1f);
        // give some pause inbetween screaming
        TIME tmNow = _pTimer->CurrentTick();
        if( (tmNow-m_tmScreamTime) > 1.0f) {
          m_tmScreamTime = tmNow;
          if(_pNetwork->IsPlayerLocal(this)) {IFeel_PlayEffect(strIFeel);}
        }
      }
    }
  };

  // should this player blow up (spawn debris)
  BOOL ShouldBlowUp(void) 
  {
    // blow up if
    return
      // allowed
      GetSP()->sp_bGibs && 
      // dead and
      (GetHealth()<=0) && 
      // has received large enough damage lately and
      (m_vDamage.Length() > _fBlowUpAmmount) &&
      // is not blown up already
      GetRenderType()==RT_MODEL;
  };

  // spawn body parts
  void BlowUp(void)
  {
    FLOAT3D vNormalizedDamage = m_vDamage-m_vDamage*(_fBlowUpAmmount/m_vDamage.Length());
    vNormalizedDamage /= Sqrt(vNormalizedDamage.Length());
    vNormalizedDamage *= 0.75f;

    FLOAT3D vBodySpeed = en_vCurrentTranslationAbsolute-en_vGravityDir*(en_vGravityDir%en_vCurrentTranslationAbsolute);
    const FLOAT fBlowUpSize = 2.0f;

    // readout blood type
    const INDEX iBloodType = GetSP()->sp_iBlood;
    // determine debris texture (color)
    ULONG ulFleshTexture = TEXTURE_FLESH_GREEN;
    ULONG ulFleshModel   = MODEL_FLESH;
    if( iBloodType==2) { ulFleshTexture = TEXTURE_FLESH_RED; }
    // spawn debris
    Debris_Begin( EIBT_FLESH, DPT_BLOODTRAIL, BET_BLOODSTAIN, fBlowUpSize, vNormalizedDamage, vBodySpeed, 1.0f, 0.0f);
    for( INDEX iDebris=0; iDebris<4; iDebris++) {
      Debris_Spawn( this, this, ulFleshModel, ulFleshTexture, 0, 0, 0, IRnd()%4, 0.5f,
                    FLOAT3D(FRnd()*0.6f+0.2f, FRnd()*0.6f+0.2f, FRnd()*0.6f+0.2f));
    }

    // leave a stain beneath
    LeaveStain(FALSE);

    PlaySound(m_soBody, SOUND_BLOWUP, SOF_3D);

    // hide yourself (must do this after spawning debris)
    SwitchToEditorModel();
    
    FLOAT fSpeedOrg = en_vCurrentTranslationAbsolute.Length();
    const FLOAT fSpeedMax = 30.0f;
    if (fSpeedOrg>fSpeedMax) {
      en_vCurrentTranslationAbsolute *= fSpeedMax/fSpeedOrg;
    }

//    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
//    SetCollisionFlags(ECF_IMMATERIAL);
  };

/************************************************************
 *                 OVERRIDEN FUNCTIONS                      *
 ************************************************************/
  /* Entity info */
  void *GetEntityInfo(void)
  {
    switch (m_pstState) {
      case PST_STAND: case PST_FALL:
        return &eiPlayerGround;
        break;
      case PST_CROUCH:
        return &eiPlayerCrouch;
        break;
      case PST_SWIM: case PST_DIVE:
        return &eiPlayerSwim;
        break;
    }
    return &eiPlayerGround;
  };


  /* Receive item */
  BOOL ReceiveItem(const CEntityEvent &ee)
  {
    // *********** HEALTH ***********
    if( ee.ee_slEvent == EVENTCODE_EHealth)
    {
      // determine old and new health values
      FLOAT fHealthOld = GetHealth();
      FLOAT fHealthNew = fHealthOld + ((EHealth&)ee).fHealth;
      if( ((EHealth&)ee).bOverTopHealth) {
        fHealthNew = ClampUp( fHealthNew, MaxHealth());
      } else {
        fHealthNew = ClampUp( fHealthNew, TopHealth());
      }

      // if value can be changed
      if( ceil(fHealthNew) > ceil(fHealthOld)) {
        // receive it
        SetHealth(fHealthNew);
        ItemPicked( TRANS("Health"), ((EHealth&)ee).fHealth);
        m_iMana += (INDEX)(((EHealth&)ee).fHealth);
        m_fPickedMana   += ((EHealth&)ee).fHealth;
        return TRUE;
      }
    } 

    // *********** ARMOR ***********
    else if( ee.ee_slEvent == EVENTCODE_EArmor)
    {
      // determine old and new health values
      FLOAT fArmorOld = m_fArmor;
      FLOAT fArmorNew = fArmorOld + ((EArmor&)ee).fArmor;
      if( ((EArmor&)ee).bOverTopArmor) {
        fArmorNew = ClampUp( fArmorNew, MaxArmor());
      } else {
        fArmorNew = ClampUp( fArmorNew, TopArmor());
      }
      // if value can be changed
      if( ceil(fArmorNew) > ceil(fArmorOld)) {
        // receive it
        m_fArmor = fArmorNew;
        ItemPicked( TRANS("Armor"), ((EArmor&)ee).fArmor);
        m_iMana += (INDEX)(((EArmor&)ee).fArmor);
        m_fPickedMana   += ((EArmor&)ee).fArmor;
        return TRUE;
      }
    }

    // *********** WEAPON ***********
    else if (ee.ee_slEvent == EVENTCODE_EWeaponItem) {
      return ((CPlayerWeapons&)*m_penWeapons).ReceiveWeapon(ee);
    }

    // *********** AMMO ***********
    else if (ee.ee_slEvent == EVENTCODE_EAmmoItem) {
      return ((CPlayerWeapons&)*m_penWeapons).ReceiveAmmo(ee);
    }

    // *********** KEYS ***********
    else if (ee.ee_slEvent == EVENTCODE_EKey) {
      // don't pick up key if in auto action mode
      if (m_penActionMarker!=NULL) {
        return FALSE;
      }
      // make key mask
      ULONG ulKey = 1<<INDEX(((EKey&)ee).kitType);
      EKey &eKey = (EKey&)ee;
      // if key is already in inventory
      if (m_ulKeys&ulKey) {
        // ignore it
        return FALSE;
      // if key is not in inventory
      } else {
        // pick it up
        m_ulKeys |= ulKey;
        CTString strKey = GetKeyName(((EKey&)ee).kitType);
        ItemPicked(strKey, 0);
        // if in cooperative
        if (GetSP()->sp_bCooperative && !GetSP()->sp_bSinglePlayer) {
          CPrintF(TRANS("^cFFFFFF%s - %s^r\n"), GetPlayerName(), strKey);
        }
        return TRUE;
      }
    }

    // *********** PUZZLE ITEMS ***********
    else if (ee.ee_slEvent == EVENTCODE_EPuzzleItem) {
      // don't pick up puzzle item if in auto action mode
      if (m_penActionMarker!=NULL) {
        return FALSE;
      }
      // make puzzle item mask
      ULONG ulPuzzleItem = 1<<INDEX(((EPuzzleItem&)ee).pitType);
      EPuzzleItem &ePuzzleItem = (EPuzzleItem&)ee;
      // if key is already in inventory
      if (m_ulPuzzleItems&ulPuzzleItem) {
        // ignore it
        return FALSE;
      // if puzzle item is not in inventory
      } else {
        // pick it up
        m_ulPuzzleItems |= ulPuzzleItem;
        CTString strPuzzleItem = GetPuzzleItemName(((EPuzzleItem&)ee).pitType);
        ItemPicked(strPuzzleItem, 0);
        // if in cooperative
        if (GetSP()->sp_bCooperative && !GetSP()->sp_bSinglePlayer) {
          CPrintF(TRANS("^cFFFFFF%s - %s^r\n"), GetPlayerName(), strPuzzleItem);
        }
        return TRUE;
      }
    }

    // *********** POWERUPS ***********
    else if( ee.ee_slEvent == EVENTCODE_EPowerUp) {
      const FLOAT tmNow = _pTimer->CurrentTick();
      switch( ((EPowerUp&)ee).puitType) {
      case PUIT_INVISIB :  m_tmInvisibility    = tmNow + m_tmInvisibilityMax;
        ItemPicked(TRANS("^cABE3FFInvisibility"), 0);
        return TRUE;
      case PUIT_INVULNER:  m_tmInvulnerability = tmNow + m_tmInvulnerabilityMax;
        ItemPicked(TRANS("^c00B440Invulnerability"), 0);
        return TRUE;
      case PUIT_DAMAGE  :  m_tmSeriousDamage   = tmNow + m_tmSeriousDamageMax;
        ItemPicked(TRANS("^cFF0000Serious Damage!"), 0);
        return TRUE;
      case PUIT_SPEED   :  m_tmSeriousSpeed    = tmNow + m_tmSeriousSpeedMax;
        ItemPicked(TRANS("^cFF9400Serious Speed"), 0);
        return TRUE;
      case PUIT_BOMB    :
        m_iSeriousBombCount++;
        ItemPicked(TRANS("^cFF0000Serious Bomb!"), 0);
        return TRUE;              
      }
    }

    // nothing picked
    return FALSE;
  };



  // Change Player view
  void ChangePlayerView()
  {
    // change from eyes to 3rd person
    if (m_iViewState == PVT_PLAYEREYES) {
      // spawn 3rd person view camera
      ASSERT(m_pen3rdPersonView == NULL);
      if (m_pen3rdPersonView == NULL) {
        m_pen3rdPersonView = CreateEntity(GetPlacement(), CLASS_PLAYER_VIEW);
        EViewInit eInit;
        eInit.penOwner = this;
        eInit.penCamera = NULL;
        eInit.vtView = VT_3RDPERSONVIEW;
        eInit.bDeathFixed = FALSE;
        m_pen3rdPersonView ->Initialize(eInit);
      }
      
      m_iViewState = PVT_3RDPERSONVIEW;

    // change from 3rd person to eyes
    } else if (m_iViewState == PVT_3RDPERSONVIEW) {
      m_iViewState = PVT_PLAYEREYES;

      // kill 3rd person view
      if (m_pen3rdPersonView != NULL) {
        ((CPlayerView&)*m_pen3rdPersonView).SendEvent(EEnd());
        m_pen3rdPersonView = NULL;
      }
    }
  };

  // if use is pressed
  void UsePressed()
  {
    // cast ray from weapon
    CPlayerWeapons *penWeapons = GetPlayerWeapons();
    CEntity *pen = penWeapons->m_penRayHit;
    BOOL bSomethingToUse = FALSE;

    // if hit
    if (pen!=NULL) {
      // check switch/messageholder relaying by moving brush
      if (IsOfClass( pen, "Moving Brush")) {
        CMovingBrush &enMovingBrush = (CMovingBrush&)*pen;

        if (enMovingBrush.m_penSwitch!=NULL) {
          pen = enMovingBrush.m_penSwitch;
        }
      }

      // if switch and near enough
      if (IsOfClass( pen, "Switch")) {
        CSwitch &enSwitch = (CSwitch&)*pen;
        // if switch is useable
        if (penWeapons->m_fRayHitDistance < enSwitch.GetDistance() && enSwitch.m_bUseable) {
          // send it a trigger event
          SendToTarget(pen, EET_TRIGGER, this);
          bSomethingToUse = TRUE;
        }
      }
    }
    
    if (!bSomethingToUse)
    {
      CPlayerWeapons *penWeapon = GetPlayerWeapons();
    }
  }

  
/************************************************************
 *                      PLAYER ACTIONS                      *
 ************************************************************/
  void SetGameEnd(void)
  {
    _pNetwork->SetGameFinished();
    // start console for first player possible
    for(INDEX iPlayer=0; iPlayer<GetMaxPlayers(); iPlayer++) {
      CEntity *pen = GetPlayerEntity(iPlayer);
    }
  }
  // check if game should be finished
  void CheckGameEnd(void)
  {
    BOOL bFinished = FALSE;
    // if time limit is out
    INDEX iTimeLimit = GetSP()->sp_iTimeLimit;
    if (iTimeLimit>0 && _pTimer->CurrentTick()>=iTimeLimit*60.0f) {
      bFinished = TRUE;
    }
    // if frag limit is out
    INDEX iFragLimit = GetSP()->sp_iFragLimit;
    if (iFragLimit>0 && m_psLevelStats.ps_iKills>=iFragLimit) {
      bFinished = TRUE;
    }
    // if score limit is out
    INDEX iScoreLimit = GetSP()->sp_iScoreLimit;
    if (iScoreLimit>0 && m_psLevelStats.ps_iScore>=iScoreLimit) {
      bFinished = TRUE;
    }

    if (bFinished) {
      SetGameEnd();
    }
  }

  // Preapply the action packet for local mouselag elimination
  void PreapplyAction( const CPlayerAction &paAction)
  {
  }

  // Called to apply player action to player entity each tick.
  void ApplyAction( const CPlayerAction &paOriginal, FLOAT tmLatency)
  {
    if(!(m_ulFlags&PLF_INITIALIZED)) { return; }
//    CPrintF("---APPLY: %g\n", paOriginal.pa_aRotation(1));
    
    // if was not connected
    if (m_ulFlags&PLF_NOTCONNECTED) {
      // set connected state
      SetConnected();
    }
    // mark that the player is connected
    m_ulFlags |= PLF_APPLIEDACTION;

    // make a copy of action for adjustments
    CPlayerAction paAction = paOriginal;
    //CPrintF("applying(%s-%08x): %g\n", GetPredictName(), int(paAction.pa_llCreated),
    //  paAction.pa_vTranslation(3));

    // calculate delta from last received actions
    ANGLE3D aDeltaRotation     = paAction.pa_aRotation    -m_aLastRotation;
    ANGLE3D aDeltaViewRotation = paAction.pa_aViewRotation-m_aLastViewRotation;
    
    //FLOAT3D vDeltaTranslation  = paAction.pa_vTranslation -m_vLastTranslation;
    m_aLastRotation     = paAction.pa_aRotation;
    m_aLastViewRotation = paAction.pa_aViewRotation;
    //m_vLastTranslation  = paAction.pa_vTranslation;
    paAction.pa_aRotation     = aDeltaRotation;
    paAction.pa_aViewRotation = aDeltaViewRotation;
    //paAction.pa_vTranslation  = vDeltaTranslation;

    // adjust rotations per tick
    paAction.pa_aRotation /= _pTimer->TickQuantum;
    paAction.pa_aViewRotation /= _pTimer->TickQuantum;

    // adjust prediction for remote players only
    CEntity *penMe = this;
    if (IsPredictor()) {
      penMe = penMe->GetPredicted();
    }
    SetPredictable(!_pNetwork->IsPlayerLocal(penMe));

    // check for end of game
    if (!IsPredictor()) {
      CheckGameEnd();
    }

    // limit speeds against abusing
    paAction.pa_vTranslation(1) = Clamp( paAction.pa_vTranslation(1), -plr_fSpeedSide,    plr_fSpeedSide);
    paAction.pa_vTranslation(2) = Clamp( paAction.pa_vTranslation(2), -plr_fSpeedUp,      plr_fSpeedUp);
    paAction.pa_vTranslation(3) = Clamp( paAction.pa_vTranslation(3), -plr_fSpeedForward, plr_fSpeedBackward);

    // allow falling even when walking
    en_fStepDnHeight = -1;

    // limit diagonal speed against abusing
    FLOAT3D &v = paAction.pa_vTranslation;
    FLOAT fDiag = Sqrt(v(1)*v(1)+v(3)*v(3));
    if (fDiag>0.01f) {
      FLOAT fDiagLimited = Min(fDiag, plr_fSpeedForward);
      FLOAT fFactor = fDiagLimited/fDiag;
      v(1)*=fFactor;
      v(3)*=fFactor;
    }

    ulButtonsNow = paAction.pa_ulButtons;
    ulButtonsBefore = m_ulLastButtons;
    ulNewButtons = ulButtonsNow&~ulButtonsBefore;
    ulReleasedButtons = (~ulButtonsNow)&(ulButtonsBefore);

    m_ulLastButtons = ulButtonsNow;         // remember last buttons
    en_plLastViewpoint = en_plViewpoint;    // remember last view point for lerping
    
    // if alive
    if (GetFlags() & ENF_ALIVE) {
      // if not in auto-action mode
      if (m_penActionMarker==NULL) {
        // apply actions
        AliveActions(paAction);
      // if in auto-action mode
      } else {
        // do automatic actions
        AutoActions(paAction);
      }
    // if not alive rotate camera view and rebirth on fire
    } else {
      DeathActions(paAction);
    }

    // wanna cheat a bit?
    if (CheatsEnabled()) {
      Cheats();
    }

    // if teleporting to marker (this cheat is enabled in all versions)
    if (cht_iGoToMarker>0 && (GetFlags()&ENF_ALIVE)) {
      // rebirth player, and it will teleport
      m_iLastViewState = m_iViewState;
      SendEvent(ERebirth());
    }

    // keep latency for eventual printout
    UpdateLatency(tmLatency);

    // check if highscore has changed
    CheckHighScore();
  };


  // Called when player is disconnected
  void Disconnect(void)
  {
    // remember name
    m_strName = GetPlayerName();
    // clear the character, so we don't get re-connected to same entity
    en_pcCharacter = CPlayerCharacter();
    // make main loop exit
    SendEvent(EDisconnected());
  };

  // Called when player character is changed
  void CharacterChanged(const CPlayerCharacter &pcNew) 
  {
    // remember original character
    CPlayerCharacter pcOrg = en_pcCharacter;

    // set the new character
    en_pcCharacter = pcNew;
    ValidateCharacter();

    // if the name has changed
    if (pcOrg.GetName()!=pcNew.GetName()) {
      // report that
      CPrintF(TRANS("%s is now known as %s\n"), 
        pcOrg.GetNameForPrinting(), pcNew.GetNameForPrinting());
    }

    // if the team has changed
    if (pcOrg.GetTeam()!=pcNew.GetTeam()) {
      // report that
      CPrintF(TRANS("%s switched to team %s\n"), 
        pcNew.GetNameForPrinting(), pcNew.GetTeamForPrinting());
    }

    // if appearance changed
    CPlayerSettings *ppsOrg = (CPlayerSettings *)pcOrg.pc_aubAppearance;
    CPlayerSettings *ppsNew = (CPlayerSettings *)pcNew.pc_aubAppearance;
    if (memcmp(ppsOrg->ps_achModelFile, ppsNew->ps_achModelFile, sizeof(ppsOrg->ps_achModelFile))!=0) {
      // update your real appearance if possible
      CTString strNewLook;
      BOOL bSuccess = SetPlayerAppearance(&m_moRender, &en_pcCharacter, strNewLook, /*bPreview=*/FALSE);
      // if succeeded
      if (bSuccess) {
        ParseGender(strNewLook);
        // report that
        CPrintF(TRANS("%s now appears as %s\n"), 
          pcNew.GetNameForPrinting(), strNewLook);
      // if failed
      } else {
        // report that
        CPrintF(TRANS("Cannot change appearance for %s: setting '%s' is unavailable\n"), 
          pcNew.GetNameForPrinting(), (const char*)ppsNew->GetModelFilename());
      }
      // attach weapon to new appearance
      GetPlayerAnimator()->SyncWeapon();
    }

    BOOL b3RDPersonOld = ppsOrg->ps_ulFlags&PSF_PREFER3RDPERSON;
    BOOL b3RDPersonNew = ppsNew->ps_ulFlags&PSF_PREFER3RDPERSON;
    if ((b3RDPersonOld && !b3RDPersonNew && m_iViewState==PVT_3RDPERSONVIEW)
      ||(b3RDPersonNew && !b3RDPersonOld && m_iViewState==PVT_PLAYEREYES) ) {
      ChangePlayerView();
    }
  };


  // Alive actions
  void AliveActions(const CPlayerAction &pa) 
  {
    CPlayerAction paAction = pa;

    // if camera is active
    if (m_penCamera!=NULL) {
      // ignore keyboard/mouse/joystick commands
      paAction.pa_vTranslation  = FLOAT3D(0,0,0);
      paAction.pa_aRotation     = ANGLE3D(0,0,0);
      paAction.pa_aViewRotation = ANGLE3D(0,0,0);
      // if fire or use is pressed
      if (ulNewButtons&(PLACT_FIRE|PLACT_ALTFIRE|PLACT_USE)) {
        // stop camera
        m_penCamera=NULL;
      }
    } else {
      ButtonsActions(paAction);
    }

    // do the actions
    ActiveActions(paAction);

    // if less than few seconds elapsed since last damage
    FLOAT tmSinceWounding = _pTimer->CurrentTick() - m_tmWoundedTime;
    if( tmSinceWounding<4.0f) {
      // decrease damage ammount
      m_fDamageAmmount *= 1.0f - tmSinceWounding/4.0f;
    } else {
      // reset damage ammount
      m_fDamageAmmount = 0.0f;
    }

    // if the sting time has passed
    FLOAT tmSinceStinging = m_tmStungTime - _pTimer->CurrentTick();
    if(tmSinceStinging<0.0f) {
      m_bIsStung = FALSE;
    }
  }

  // Auto-actions
  void AutoActions(const CPlayerAction &pa) 
  {
    // if fire, use or altfire is pressed
    if (ulNewButtons&(PLACT_FIRE|PLACT_ALTFIRE|PLACT_USE)) {
      if (m_penCamera!=NULL) {
        CEntity *penOnBreak = ((CCamera&)*m_penCamera).m_penOnBreak;
        if (penOnBreak!=NULL) {
          SendToTarget(penOnBreak, EET_TRIGGER, this);
        }
      }
    }

    CPlayerAction paAction = pa;
    // ignore keyboard/mouse/joystick commands
    paAction.pa_vTranslation  = FLOAT3D(0,0,0);
    paAction.pa_aRotation     = ANGLE3D(0,0,0);
    paAction.pa_aViewRotation = ANGLE3D(0,0,0);

    // if moving towards the marker is enabled
    if (m_fAutoSpeed>0) {
      FLOAT3D vDelta = 
        m_penActionMarker->GetPlacement().pl_PositionVector-
        GetPlacement().pl_PositionVector;
      FLOAT fDistance = vDelta.Length();
      if (fDistance>0.1f) {
        vDelta/=fDistance;
        ANGLE aDH = GetRelativeHeading(vDelta);

        // if should hit the marker exactly
        FLOAT fSpeed = m_fAutoSpeed;
        if (GetActionMarker()->m_paaAction==PAA_RUNANDSTOP) {
          // adjust speed
          fSpeed = Min(fSpeed, fDistance/_pTimer->TickQuantum);
        }
        // adjust rotation
        if (Abs(aDH)>5.0f) {
          if (fSpeed>m_fAutoSpeed-0.1f) {
            aDH = Clamp(aDH, -30.0f, 30.0f);
          }
          paAction.pa_aRotation = ANGLE3D(aDH/_pTimer->TickQuantum,0,0);
        }
        // set forward speed
        paAction.pa_vTranslation = FLOAT3D(0,0,-fSpeed);
      }
    } else {
      paAction.pa_vTranslation = m_vAutoSpeed;
    }

    CPlayerActionMarker *ppam = GetActionMarker();
    ASSERT( ppam != NULL);
    if( ppam->m_paaAction == PAA_LOGO_FIRE_MINIGUN || ppam->m_paaAction == PAA_LOGO_FIRE_INTROSE)
    {
      if( m_tmMinigunAutoFireStart != -1)
      {
        FLOAT tmDelta = _pTimer->CurrentTick()-m_tmMinigunAutoFireStart;
        FLOAT aDH=0.0f;
        FLOAT aDP=0.0f;
        if( tmDelta>=0.0f && tmDelta<=0.75f)
        {
          aDH = 0.0f;
        }
        else if( tmDelta>=0.75f)
        {
          FLOAT fDT = tmDelta-0.75f;
          aDH = 1.0f*cos(fDT+PI/2.0f);
          aDP = 0.5f*cos(fDT);
        }
        if(ppam->m_paaAction == PAA_LOGO_FIRE_INTROSE)
        {
          FLOAT fRatio=CalculateRatio(tmDelta,0.25,5,0.1f,0.1f);
          aDP=2.0f*sin(tmDelta*200.0f)*fRatio;
          if(tmDelta>2.5f)
          {
            aDP+=(tmDelta-2.5f)*4.0f;
          }
        }
        paAction.pa_aRotation = ANGLE3D(aDH/_pTimer->TickQuantum, aDP/_pTimer->TickQuantum,0);
      }
    }

    // do the actions
    if (!(m_ulFlags&PLF_AUTOMOVEMENTS)) {
      ActiveActions(paAction);
    }
  }

  void GetLerpedWeaponPosition( FLOAT3D vRel, CPlacement3D &pl)
  {
    pl = CPlacement3D( vRel, ANGLE3D(0,0,0));
    CPlacement3D plView;
    _bDiscard3rdView=GetViewEntity()!=this;
    GetLerpedAbsoluteViewPlacement(plView);
    pl.RelativeToAbsolute( plView);
  }

  void SpawnBubbles( INDEX ctBubbles)
  {
    for( INDEX iBouble=0; iBouble<ctBubbles; iBouble++)
    {
      FLOAT3D vRndRel = FLOAT3D( (FRnd()-0.5f)*0.25f, -0.25f, -0.5f+FRnd()/10.0f);
      ANGLE3D aDummy = ANGLE3D(0,0,0);
      CPlacement3D plMouth = CPlacement3D( vRndRel, aDummy);

      plMouth.RelativeToAbsolute( en_plViewpoint);
      plMouth.RelativeToAbsolute( GetPlacement());
      FLOAT3D vRndSpd = FLOAT3D( (FRnd()-0.5f)*0.25f, (FRnd()-0.5f)*0.25f, (FRnd()-0.5f)*0.25f);
      AddBouble( plMouth.pl_PositionVector, vRndSpd);
    }
  }

  void PlayPowerUpSound ( void ) {
    m_soPowerUpBeep.Set3DParameters(50.0f, 10.0f, 4.0f, 1.0f);
    PlaySound(m_soPowerUpBeep, SOUND_SECRET, SOF_3D|SOF_VOLUMETRIC|SOF_LOCAL);
  }

  void ActiveActions(const CPlayerAction &paAction)
  {
    // translation
    FLOAT3D vTranslation = paAction.pa_vTranslation;
    // turbo speed cheat
    if (cht_fTranslationMultiplier && CheatsEnabled()) { 
      vTranslation *= cht_fTranslationMultiplier;
    }

    // enable faster moving (but not higher jumping!) if having SerousSpeed powerup
    const TIME tmDelta = m_tmSeriousSpeed - _pTimer->CurrentTick();
    if( tmDelta>0 && m_fAutoSpeed==0.0f) { 
      vTranslation(1) *= 2.0f;
      vTranslation(3) *= 2.0f;
    }
    
    en_fAcceleration = plr_fAcceleration;
    en_fDeceleration = plr_fDeceleration;
    if( !GetSP()->sp_bCooperative)
    {
      vTranslation(1) *= 1.35f;
      vTranslation(3) *= 1.35f;
    //en_fDeceleration *= 0.8f;
    }

    CContentType &ctUp = GetWorld()->wo_actContentTypes[en_iUpContent];
    CContentType &ctDn = GetWorld()->wo_actContentTypes[en_iDnContent];
    PlayerState pstWanted = PST_STAND;
    BOOL bUpSwimable = (ctUp.ct_ulFlags&CTF_SWIMABLE) && en_fImmersionFactor<=0.99f;
    BOOL bDnSwimable = (ctDn.ct_ulFlags&CTF_SWIMABLE) && en_fImmersionFactor>=0.5f;

    // if considerably inside swimable content
    if (bUpSwimable || bDnSwimable) {
      // allow jumping
      m_ulFlags|=PLF_JUMPALLOWED;
      //CPrintF("swimable %f", en_fImmersionFactor);
      // if totaly inside
      if (en_fImmersionFactor>=0.99f || bUpSwimable) {
        // want to dive
        pstWanted = PST_DIVE;
      // if only partially inside
      } else {
        // want to swim
        pstWanted = PST_SWIM;
      }
    // if not in swimable content
    } else {
      // if has reference
      if (en_penReference!=NULL) {
        // reset fall timer
        m_fFallTime = 0.0f;

      // if no reference
      } else {
        // increase fall time
        m_fFallTime += _pTimer->TickQuantum;
      }
      // if not wanting to jump
      if (vTranslation(2)<0.1f) {
        // allow jumping
        m_ulFlags|=PLF_JUMPALLOWED;
      }

      // if falling
      if (m_fFallTime >= 0.5f) {
        // wants to fall
        pstWanted = PST_FALL;
      // if not falling
      } else {
        // if holding down and really not in air
        if (vTranslation(2)<-0.01f/* && m_fFallTime<0.5f*/) {
          // wants to crouch
          pstWanted = PST_CROUCH;
        // if not holding down
        } else {
          // wants to stand
          pstWanted = PST_STAND;
        }
      }
    }
    //CPrintF("c - %s w - %s", NameForState(m_pstState), NameForState(pstWanted));

    // flying mode - rotate whole player
    if (!(GetPhysicsFlags()&EPF_TRANSLATEDBYGRAVITY)) {
      SetDesiredRotation(paAction.pa_aRotation);
      StartModelAnim(PLAYER_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
      SetDesiredTranslation(vTranslation);
    // normal mode
    } else {
      PlayerState pstOld = m_pstState; 

      // if different state needed
      if (pstWanted!=m_pstState) {
        // check state wanted
        switch(pstWanted) {
        // if wanting to stand
        case PST_STAND: {
          // if can stand here
          if (ChangeCollisionBoxIndexNow(PLAYER_COLLISION_BOX_STAND)) {
            en_plViewpoint.pl_PositionVector(2) = plr_fViewHeightStand;
            if (m_pstState==PST_CROUCH) {
              ((CPlayerAnimator&)*m_penAnimator).Rise();
            } else {
              ((CPlayerAnimator&)*m_penAnimator).Stand();
            }
            m_pstState = PST_STAND;
          }
                        } break;
        // if wanting to crouch
        case PST_CROUCH: {
          // if can crouch here
          if (ChangeCollisionBoxIndexNow(PLAYER_COLLISION_BOX_CROUCH)) {
            m_pstState = PST_CROUCH;
            en_plViewpoint.pl_PositionVector(2) = plr_fViewHeightCrouch;
            ((CPlayerAnimator&)*m_penAnimator).Crouch();
          }
                        } break;
        // if wanting to swim
        case PST_SWIM: {
          // if can swim here
          if (ChangeCollisionBoxIndexNow(PLAYER_COLLISION_BOX_SWIMSMALL)) {
            ChangeCollisionBoxIndexWhenPossible(PLAYER_COLLISION_BOX_SWIM);
            m_pstState = PST_SWIM;
            en_plViewpoint.pl_PositionVector(2) = plr_fViewHeightSwim;
            ((CPlayerAnimator&)*m_penAnimator).Swim();                   
            m_fSwimTime = _pTimer->CurrentTick();
          }
                        } break;
        // if wanting to dive
        case PST_DIVE: {
          // if can dive here
          if (ChangeCollisionBoxIndexNow(PLAYER_COLLISION_BOX_SWIMSMALL)) {
            ChangeCollisionBoxIndexWhenPossible(PLAYER_COLLISION_BOX_SWIM);
            m_pstState = PST_DIVE;
            en_plViewpoint.pl_PositionVector(2) = plr_fViewHeightDive;
            ((CPlayerAnimator&)*m_penAnimator).Swim();
          }
                        } break;
        // if wanting to fall
        case PST_FALL: {
          // if can fall here
          if (ChangeCollisionBoxIndexNow(PLAYER_COLLISION_BOX_STAND)) {
            m_pstState = PST_FALL;
            en_plViewpoint.pl_PositionVector(2) = plr_fViewHeightStand;
            ((CPlayerAnimator&)*m_penAnimator).Fall();
          }
                        } break;
        }
      }

      // if state changed
      if (m_pstState!=pstOld) {
        // check water entering/leaving
        BOOL bWasInWater = (pstOld==PST_SWIM||pstOld==PST_DIVE);
        BOOL bIsInWater = (m_pstState==PST_SWIM||m_pstState==PST_DIVE);

        // if entered water
        if (bIsInWater && !bWasInWater) {
          PlaySound(m_soBody, SOUND_WATER_ENTER, SOF_3D);
        // if left water
        } else if (!bIsInWater && bWasInWater) {
          PlaySound(m_soBody, SOUND_WATER_LEAVE, SOF_3D);
          m_tmOutOfWater = _pTimer->CurrentTick();
          //CPrintF("gotout ");
        // if in water
        }

        // if just fell to ground
        if (pstOld==PST_FALL && (m_pstState==PST_STAND||m_pstState==PST_CROUCH)) {
          INDEX iSoundLand = SOUND_LAND;
          if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_SAND ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_SAND_NOIMPACT)) {
             iSoundLand = SOUND_LAND_SAND;
          } else if (en_pbpoStandOn!=NULL && 
           (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GRASS ||
            en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GRASS_SLIDING ||
            en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GRASS_NOIMPACT)) {
             iSoundLand = SOUND_LAND_GRASS;
          } else if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_WOOD ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_WOOD_NOIMPACT)) {
             iSoundLand = SOUND_LAND_WOOD;
          } else if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_SNOW ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_SNOW_NOIMPACT)) {
             iSoundLand = SOUND_LAND_SNOW;
          } else if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_METAL ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_METAL_NOIMPACT)) {
             iSoundLand = SOUND_LAND_METAL;
          } else if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_CARPET ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_CARPET_NOIMPACT)) {
             iSoundLand = SOUND_LAND_CARPET;
          } else if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GLASS ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GLASS_NOIMPACT)) {
             iSoundLand = SOUND_LAND_GLASS;
          } else if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_DIRT ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_DIRT_NOIMPACT)) {
             iSoundLand = SOUND_LAND_DIRT;
          } else if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_TILE ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_TILE_NOIMPACT)) {
             iSoundLand = SOUND_LAND_TILE;
          } else if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_CHAINLINK ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_CHAINLINK_NOIMPACT) ) {
             iSoundLand = SOUND_LAND_CHAINLINK;
          } else if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GRATE ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GRATE_NOIMPACT) ) {
             iSoundLand = SOUND_LAND_GRATE;
          } else if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_MUD ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_MUD_NOIMPACT) ) {
             iSoundLand = SOUND_LAND_MUD;
          } else if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_VENT ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_VENT_NOIMPACT) ) {
             iSoundLand = SOUND_LAND_VENT;
          } else if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_COMPUTER ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_COMPUTER_NOIMPACT) ) {
             iSoundLand = SOUND_LAND_COMPUTER;
          } else if (en_pbpoStandOn!=NULL && 
            (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_FUSEBOX ||
             en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_FUSEBOX_NOIMPACT) ) {
             iSoundLand = SOUND_LAND_FUSEBOX;
          }
          else {
          }

          PlaySound(m_soFootL, iSoundLand, SOF_3D);
          if(_pNetwork->IsPlayerLocal(this)) {IFeel_PlayEffect("Land");}
        }
        // change ambience sounds
        if (m_pstState==PST_DIVE) {
          m_soLocalAmbientLoop.Set3DParameters(50.0f, 10.0f, 0.25f, 1.0f);
          PlaySound(m_soLocalAmbientLoop, SOUND_WATERAMBIENT, 
            SOF_LOOP|SOF_3D|SOF_VOLUMETRIC|SOF_LOCAL);
        } else if (pstOld==PST_DIVE) {
          m_soLocalAmbientLoop.Stop();
        }
      }
      // if just jumped
      if (en_tmJumped+_pTimer->TickQuantum>=_pTimer->CurrentTick() &&
          en_tmJumped<=_pTimer->CurrentTick() && en_penReference==NULL) {
        // play jump sound
        SetDefaultMouthPitch();
        PlaySound(m_soMouth, SOUND_JUMP, SOF_3D);
        if(_pNetwork->IsPlayerLocal(this)) {IFeel_PlayEffect("Jump");}
        // disallow jumping
        m_ulFlags&=~PLF_JUMPALLOWED;
      }

      // set density
      if (m_pstState == PST_SWIM || pstWanted == PST_SWIM
        ||(pstWanted == PST_DIVE && m_pstState != pstWanted)) {
        en_fDensity = 500.0f;  // lower density than water
      } else {
        en_fDensity = 1000.0f; // same density as water
      }

      if (_pTimer->CurrentTick()>=m_tmNextAmbientOnce)
      {
        if (m_pstState == PST_DIVE)
        {
          PlaySound(m_soLocalAmbientOnce, SOUND_WATERBUBBLES, 
            SOF_3D|SOF_VOLUMETRIC|SOF_LOCAL);
          m_soLocalAmbientOnce.Set3DParameters(25.0f, 5.0f, 2.0f, Lerp(0.5f, 1.5f, FRnd()) );
          SpawnBubbles( 5+INDEX(FRnd()*5));
        }
        m_tmNextAmbientOnce = _pTimer->CurrentTick()+5.0f+FRnd();
      }


      // if crouching
      if (m_pstState == PST_CROUCH) {
        // go slower
        vTranslation /= 2.5f;
        // don't go down
        vTranslation(2) = 0.0f;
      }

      // if diving
      if (m_pstState == PST_DIVE) {
        // translate up/down with view pitch
        FLOATmatrix3D mPitch;
        MakeRotationMatrixFast(mPitch, FLOAT3D(0,en_plViewpoint.pl_OrientationAngle(2),0));
        FLOAT fZ = vTranslation(3);
        vTranslation(3) = 0.0f;
        vTranslation += FLOAT3D(0,0,fZ)*mPitch;
      // if swimming
      } else if (m_pstState == PST_SWIM) {
        // translate down with view pitch if large
        FLOATmatrix3D mPitch;
        FLOAT fPitch = en_plViewpoint.pl_OrientationAngle(2);
        if (fPitch>-30.0f) {
          fPitch = 0;
        }
        MakeRotationMatrixFast(mPitch, FLOAT3D(0,fPitch,0));
        FLOAT fZ = vTranslation(3);
        vTranslation(3) = 0.0f;
        vTranslation += FLOAT3D(0,0,fZ)*mPitch;
      }

      // if swimming or diving
      if (m_pstState == PST_SWIM || m_pstState == PST_DIVE) {
        // up/down is slower than on ground
        vTranslation(2)*=0.5f;
      }

      // if just started swimming
      if (m_pstState == PST_SWIM && _pTimer->CurrentTick()<m_fSwimTime+0.5f
        ||_pTimer->CurrentTick()<m_tmOutOfWater+0.5f) {
        // no up/down change
        vTranslation(2)=0;
        //CPrintF(" noup");
      }

      //CPrintF("\n");

      // disable consecutive jumps
      if (!(m_ulFlags&PLF_JUMPALLOWED) && vTranslation(2)>0) {
        vTranslation(2) = 0.0f;
      }

      // check for ladders
      if(en_ulPhysicsFlags&EPF_ONLADDER) {
        if(vTranslation(3)>0) {
          m_fClimbDir = vTranslation(3) / plr_fSpeedForward;
        } else if (vTranslation(3)<0) {
          m_fClimbDir = vTranslation(3) / plr_fSpeedBackward;
        }
      }

      // set translation
      SetDesiredTranslation(vTranslation);

      // set pitch and banking from the normal rotation into the view rotation
      en_plViewpoint.Rotate_HPB(ANGLE3D(
        (ANGLE)((FLOAT)paAction.pa_aRotation(1)*_pTimer->TickQuantum),
        (ANGLE)((FLOAT)paAction.pa_aRotation(2)*_pTimer->TickQuantum),
        (ANGLE)((FLOAT)paAction.pa_aRotation(3)*_pTimer->TickQuantum)));
      // pitch and banking boundaries
      RoundViewAngle(en_plViewpoint.pl_OrientationAngle(2), PITCH_MAX);
      RoundViewAngle(en_plViewpoint.pl_OrientationAngle(3), BANKING_MAX);

      // translation rotate player for heading
      if (vTranslation.Length() > 0.1f) {
        SetDesiredRotation(ANGLE3D(en_plViewpoint.pl_OrientationAngle(1)/_pTimer->TickQuantum, 0.0f, 0.0f));
        if (m_ulFlags&PLF_VIEWROTATIONCHANGED) {
          m_ulFlags&=~PLF_VIEWROTATIONCHANGED;
          FLOATmatrix3D mViewRot;
          MakeRotationMatrixFast(mViewRot, ANGLE3D(en_plViewpoint.pl_OrientationAngle(1),0,0));
          FLOAT3D vTransRel = vTranslation*mViewRot;
          SetDesiredTranslation(vTransRel);
        }
        en_plViewpoint.pl_OrientationAngle(1) = 0.0f;

      // rotate head, body and legs
      } else {
        m_ulFlags |= PLF_VIEWROTATIONCHANGED;
        SetDesiredRotation(ANGLE3D(0.0f, 0.0f, 0.0f));
        ANGLE aDiff = en_plViewpoint.pl_OrientationAngle(1) - HEADING_MAX;
        if (aDiff > 0.0f) {
          SetDesiredRotation(ANGLE3D(aDiff/_pTimer->TickQuantum, 0.0f, 0.0f));
        }
        aDiff = en_plViewpoint.pl_OrientationAngle(1) + HEADING_MAX;
        if (aDiff < 0.0f) {
          SetDesiredRotation(ANGLE3D(aDiff/_pTimer->TickQuantum, 0.0f, 0.0f));
        }
        RoundViewAngle(en_plViewpoint.pl_OrientationAngle(1), HEADING_MAX);
      }

      // play moving sounds
      FLOAT fWantSpeed = en_vDesiredTranslationRelative.Length();
      FLOAT fGoesSpeed = en_vCurrentTranslationAbsolute.Length();
      BOOL bOnGround = (m_pstState == PST_STAND)||(m_pstState == PST_CROUCH);
      BOOL bRunning = bOnGround && fWantSpeed>5.0f && fGoesSpeed>5.0f;
      BOOL bWalking = bOnGround && !bRunning && fWantSpeed>2.0f && fGoesSpeed>2.0f;
      BOOL bSwimming = (m_pstState == PST_SWIM) && fWantSpeed>2.0f && fGoesSpeed>2.0f;
      BOOL bDiving = (m_pstState == PST_DIVE) && fWantSpeed>2.0f && fGoesSpeed>2.0f;
      TIME tmNow = _pTimer->CurrentTick();
      INDEX iSoundWalkL = SOUND_WALK_L;
      INDEX iSoundWalkR = SOUND_WALK_R;
      if ((ctDn.ct_ulFlags&CTF_SWIMABLE) && en_fImmersionFactor>=0.1f) {
        iSoundWalkL = SOUND_WATERWALK_L;
        iSoundWalkR = SOUND_WATERWALK_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_SAND ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_SAND_NOIMPACT)) {
        iSoundWalkL = SOUND_WALK_SAND_L;
        iSoundWalkR = SOUND_WALK_SAND_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_RED_SAND ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_RED_SAND_NOIMPACT)) {
        iSoundWalkL = SOUND_WALK_SAND_L;
        iSoundWalkR = SOUND_WALK_SAND_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GRASS ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GRASS_SLIDING ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GRASS_NOIMPACT )) {
        iSoundWalkL = SOUND_WALK_GRASS_L;
        iSoundWalkR = SOUND_WALK_GRASS_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_WOOD ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_WOOD_NOIMPACT) ) {
        iSoundWalkL = SOUND_WALK_WOOD_L;
        iSoundWalkR = SOUND_WALK_WOOD_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_SNOW ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_SNOW_NOIMPACT)) {
        iSoundWalkL = SOUND_WALK_SNOW_L;
        iSoundWalkR = SOUND_WALK_SNOW_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_METAL ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_METAL_NOIMPACT) ) {
        iSoundWalkL = SOUND_WALK_METAL_L;
        iSoundWalkR = SOUND_WALK_METAL_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_CARPET ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_CARPET_NOIMPACT) ) {
        iSoundWalkL = SOUND_WALK_CARPET_L;
        iSoundWalkR = SOUND_WALK_CARPET_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GLASS ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GLASS_NOIMPACT) ) {
        iSoundWalkL = SOUND_WALK_GLASS_L;
        iSoundWalkR = SOUND_WALK_GLASS_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_DIRT ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_DIRT_NOIMPACT) ) {
        iSoundWalkL = SOUND_WALK_DIRT_L;
        iSoundWalkR = SOUND_WALK_DIRT_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_TILE ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_TILE_NOIMPACT) ) {
        iSoundWalkL = SOUND_WALK_TILE_L;
        iSoundWalkR = SOUND_WALK_TILE_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_CHAINLINK ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_CHAINLINK_NOIMPACT) ) {
        iSoundWalkL = SOUND_WALK_CHAINLINK_L;
        iSoundWalkR = SOUND_WALK_CHAINLINK_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GRATE ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_GRATE_NOIMPACT) ) {
        iSoundWalkL = SOUND_WALK_GRATE_L;
        iSoundWalkR = SOUND_WALK_GRATE_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_MUD ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_MUD_NOIMPACT) ) {
        iSoundWalkL = SOUND_WALK_MUD_L;
        iSoundWalkR = SOUND_WALK_MUD_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_VENT ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_VENT_NOIMPACT) ) {
        iSoundWalkL = SOUND_WALK_VENT_L;
        iSoundWalkR = SOUND_WALK_VENT_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_COMPUTER ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_COMPUTER_NOIMPACT) ) {
        iSoundWalkL = SOUND_WALK_COMPUTER_L;
        iSoundWalkR = SOUND_WALK_COMPUTER_R;
      } else if (en_pbpoStandOn!=NULL && 
        (en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_FUSEBOX ||
         en_pbpoStandOn->bpo_bppProperties.bpp_ubSurfaceType==SURFACE_FUSEBOX_NOIMPACT) ) {
        iSoundWalkL = SOUND_WALK_FUSEBOX_L;
        iSoundWalkR = SOUND_WALK_FUSEBOX_R;
      }
      else {
      }
      if (bRunning) {
        if (tmNow>m_tmMoveSound+plr_fRunSoundDelay) {
          m_tmMoveSound = tmNow;
          m_bMoveSoundLeft = !m_bMoveSoundLeft;
          if (m_bMoveSoundLeft) {
            PlaySound(m_soFootL, iSoundWalkL, SOF_3D);
          } else {
            PlaySound(m_soFootR, iSoundWalkR, SOF_3D);
          }
        }
      } else if (bWalking) {
        if (tmNow>m_tmMoveSound+plr_fWalkSoundDelay) {
          m_tmMoveSound = tmNow;
          m_bMoveSoundLeft = !m_bMoveSoundLeft;
          if (m_bMoveSoundLeft) {
            PlaySound(m_soFootL, iSoundWalkL, SOF_3D);
          } else {
            PlaySound(m_soFootR, iSoundWalkR, SOF_3D);
          }
        }
      } else if (bDiving) {
        if (tmNow>m_tmMoveSound+plr_fDiveSoundDelay) {
          m_tmMoveSound = tmNow;
          m_bMoveSoundLeft = !m_bMoveSoundLeft;
          if (m_bMoveSoundLeft) {
            PlaySound(m_soFootL, SOUND_DIVE_L, SOF_3D);
          } else {
            PlaySound(m_soFootR, SOUND_DIVE_R, SOF_3D);
          }
        }
      } else if (bSwimming) {
        if (tmNow>m_tmMoveSound+plr_fSwimSoundDelay) {
          m_tmMoveSound = tmNow;
          m_bMoveSoundLeft = !m_bMoveSoundLeft;
          if (m_bMoveSoundLeft) {
            PlaySound(m_soFootL, SOUND_SWIM_L, SOF_3D);
          } else {
            PlaySound(m_soFootR, SOUND_SWIM_R, SOF_3D);
          }
        }
      }
    
      // if player is almost out of air
      TIME tmBreathDelay = tmNow-en_tmLastBreathed;
      if (en_tmMaxHoldBreath-tmBreathDelay<20.0f) {
        // play drowning sound once in a while
        if (m_tmMouthSoundLast+2.0f<tmNow) {
          m_tmMouthSoundLast = tmNow;
          SetRandomMouthPitch(0.9f, 1.1f);
        }
      }

      // animate player
      ((CPlayerAnimator&)*m_penAnimator).AnimatePlayer();
    }
  };

  // Round view angle
  void RoundViewAngle(ANGLE &aViewAngle, ANGLE aRound) {
    if (aViewAngle > aRound) {
      aViewAngle = aRound;
    }
    if (aViewAngle < -aRound) {
      aViewAngle = -aRound;
    }
  };

  // Death actions
  void DeathActions(const CPlayerAction &paAction) {
    // set heading, pitch and banking from the normal rotation into the camera view rotation
    if (m_penView!=NULL) {
      ASSERT(IsPredicted()&&m_penView->IsPredicted()||IsPredictor()&&m_penView->IsPredictor()||!IsPredicted()&&!m_penView->IsPredicted()&&!IsPredictor()&&!m_penView->IsPredictor());
      en_plViewpoint.pl_PositionVector = FLOAT3D(0, 1, 0);
      en_plViewpoint.pl_OrientationAngle += (ANGLE3D(
        (ANGLE)((FLOAT)paAction.pa_aRotation(1)*_pTimer->TickQuantum),
        (ANGLE)((FLOAT)paAction.pa_aRotation(2)*_pTimer->TickQuantum),
        (ANGLE)((FLOAT)paAction.pa_aRotation(3)*_pTimer->TickQuantum)));
    }

    // if death is finished and fire just released again and this is not a predictor
    if (m_iMayRespawn==2 && (ulReleasedButtons&PLACT_FIRE) && !IsPredictor()) {
      // if singleplayer
      if( GetSP()->sp_bSinglePlayer) {
        // load quick savegame
        _pShell->Execute("gam_bQuickLoad=1;");
      // if deathmatch or similar
      } else if( !GetSP()->sp_bCooperative) {
        // rebirth
        SendEvent(EEnd());
      // if cooperative
      } else {
        // if holding down reload button
        if (m_ulLastButtons&PLACT_RELOAD) {
          // forbid respawning in-place
          m_ulFlags &= ~PLF_RESPAWNINPLACE;
        }
        // if playing on credits
        if (GetSP()->sp_ctCredits!=0) {
          // if playing on infinite credits or some credits left
          if (GetSP()->sp_ctCredits==-1 || GetSP()->sp_ctCreditsLeft!=0) {
            // decrement credits
            if (GetSP()->sp_ctCredits!=-1) {
              ((CSessionProperties*)GetSP())->sp_ctCreditsLeft--;
            }

            // initiate respawn
            CPrintF(TRANS("%s is riding the gun again\n"), GetPlayerName());
            SendEvent(EEnd());

            // report number of credits left
            if (GetSP()->sp_ctCredits>0) {
              if (GetSP()->sp_ctCreditsLeft==0) {
                CPrintF(TRANS("  no more credits left!\n"));
              } else {
                CPrintF(TRANS("  %d credits left\n"), GetSP()->sp_ctCreditsLeft);
              }
            }
          // if no more credits left
          } else {
            // report that you cannot respawn
            CPrintF(TRANS("%s rests in peace - out of credits\n"), GetPlayerName());
          }
        }
      }
    }
    // check fire released once after death
    if (m_iMayRespawn==1 && !(ulButtonsNow&PLACT_FIRE)) {
      m_iMayRespawn=2;
    }
  };


  // Buttons actions
  void ButtonsActions( CPlayerAction &paAction)
  {
    // if selecting a new weapon select it
    if((ulNewButtons&PLACT_SELECT_WEAPON_MASK)!=0) {
      ESelectWeapon eSelect;
      eSelect.iWeapon = (ulNewButtons&PLACT_SELECT_WEAPON_MASK)>>PLACT_SELECT_WEAPON_SHIFT;
      ((CPlayerWeapons&)*m_penWeapons).SendEvent(eSelect);
    }

    // next weapon zooms out when in sniping mode
    if(ulNewButtons&PLACT_WEAPON_NEXT) {
        ESelectWeapon eSelect;
        eSelect.iWeapon = -1;
        ((CPlayerWeapons&)*m_penWeapons).SendEvent(eSelect);
    }

    // previous weapon zooms in when in sniping mode
    if(ulNewButtons&PLACT_WEAPON_PREV) {
        ESelectWeapon eSelect;
        eSelect.iWeapon = -2;
        ((CPlayerWeapons&)*m_penWeapons).SendEvent(eSelect);
    }

    if(ulNewButtons&PLACT_WEAPON_FLIP) {
      ESelectWeapon eSelect;
      eSelect.iWeapon = -3;
      ((CPlayerWeapons&)*m_penWeapons).SendEvent(eSelect);
    }

    // if fire is pressed
    if (ulNewButtons&PLACT_FIRE) {
      ((CPlayerWeapons&)*m_penWeapons).SendEvent(EFireWeapon());
    }
    // if fire is released
    if (ulReleasedButtons&PLACT_FIRE) {
      ((CPlayerWeapons&)*m_penWeapons).SendEvent(EReleaseWeapon());
    }
    // if altfire is pressed
    if (ulNewButtons&PLACT_ALTFIRE) {
      ((CPlayerWeapons&)*m_penWeapons).SendEvent(EAltFireWeapon());
    }
    // if altfire is released
    if (ulReleasedButtons&PLACT_ALTFIRE) {
      ((CPlayerWeapons&)*m_penWeapons).SendEvent(EAltReleaseWeapon());
    }
    // if reload is pressed
    if (ulReleasedButtons&PLACT_RELOAD) {
      ((CPlayerWeapons&)*m_penWeapons).SendEvent(EReloadWeapon());
    }
    // if holster is pressed
    if (ulNewButtons&PLACT_HOLSTER) {
      ((CPlayerWeapons&)*m_penWeapons).SendEvent(EHolsterWeapon());
    }
    // if drop weapon is pressed
    if (ulNewButtons&PLACT_DROP_WEAPON) {
      ((CPlayerWeapons&)*m_penWeapons).SendEvent(EDropWeapon());
    }
    

    // if use is pressed
    if (ulNewButtons&PLACT_USE) {
        UsePressed();
    }
    
    // if use is being held
    if (ulNewButtons&PLACT_USE_HELD) {
      bUseButtonHeld = TRUE;
    }

    // if use is released
    if (ulReleasedButtons&PLACT_USE_HELD) {
      bUseButtonHeld = FALSE;  
    }

    // if 3rd person view is pressed
    if (ulNewButtons&PLACT_3RD_PERSON_VIEW) {
      ChangePlayerView();
    }

    // apply center view
    if( ulButtonsNow&PLACT_CENTER_VIEW) {
      // center view with speed of 45 degrees per 1/20 seconds
      paAction.pa_aRotation(2) += Clamp( -en_plViewpoint.pl_OrientationAngle(2)/_pTimer->TickQuantum, -900.0f, +900.0f);
    }
  };

  // check if cheats can be active
  BOOL CheatsEnabled(void)
  {
    return (GetSP()->sp_ctMaxPlayers==1||GetSP()->sp_bQuickTest) && m_penActionMarker==NULL && !_SE_DEMO;
  }

  // Cheats
  void Cheats(void)
  {
    BOOL bFlyOn = cht_bFly || cht_bGhost;
    // fly mode
    BOOL bIsFlying = !(GetPhysicsFlags() & EPF_TRANSLATEDBYGRAVITY);
    if (bFlyOn && !bIsFlying) {
      SetPhysicsFlags(GetPhysicsFlags() & ~(EPF_TRANSLATEDBYGRAVITY|EPF_ORIENTEDBYGRAVITY));
      en_plViewpoint.pl_OrientationAngle = ANGLE3D(0, 0, 0);
    } else if (!bFlyOn && bIsFlying) {
      SetPhysicsFlags(GetPhysicsFlags() | EPF_TRANSLATEDBYGRAVITY|EPF_ORIENTEDBYGRAVITY);
      en_plViewpoint.pl_OrientationAngle = ANGLE3D(0, 0, 0);
    }

    // ghost mode
    BOOL bIsGhost = !(GetCollisionFlags() & ((ECBI_BRUSH|ECBI_MODEL)<<ECB_TEST));
    if (cht_bGhost && !bIsGhost) {
      SetCollisionFlags(GetCollisionFlags() & ~((ECBI_BRUSH|ECBI_MODEL)<<ECB_TEST));
    } else if (!cht_bGhost && bIsGhost) {
      SetCollisionFlags(GetCollisionFlags() | ((ECBI_BRUSH|ECBI_MODEL)<<ECB_TEST));
    }

    // invisible mode
    const TIME tmDelta = m_tmInvisibility - _pTimer->CurrentTick();
    if (cht_bInvisible || tmDelta>0) {
      SetFlags(GetFlags() | ENF_INVISIBLE);
    } else {
      SetFlags(GetFlags() & ~ENF_INVISIBLE);
    }

    // cheat
    if (cht_bGiveAll) {
      cht_bGiveAll = FALSE;
      ((CPlayerWeapons&)*m_penWeapons).CheatGiveAll();
    }

    if (cht_bKillAll) {
      cht_bKillAll = FALSE;
      KillAllEnemies(this);
    }

    if (cht_bOpen) {
      cht_bOpen = FALSE;
      ((CPlayerWeapons&)*m_penWeapons).CheatOpen();
    }
    
    if (cht_bRefresh) {
      cht_bRefresh = FALSE;
      SetHealth(TopHealth());
    }
  };


/************************************************************
 *                 END OF PLAYER ACTIONS                    *
 ************************************************************/


  // Get current placement that the player views from in absolute space.
  void GetLerpedAbsoluteViewPlacement(CPlacement3D &plView) {
    if (!(m_ulFlags&PLF_INITIALIZED)) {
      plView = GetPlacement();
      _bDiscard3rdView=FALSE;
      return;
    }

    BOOL bSharpTurning = 
      (GetSettings()->ps_ulFlags&PSF_SHARPTURNING) &&
      _pNetwork->IsPlayerLocal((CPlayer*)GetPredictionTail());

    // lerp player viewpoint
    FLOAT fLerpFactor = _pTimer->GetLerpFactor();
    plView.Lerp(en_plLastViewpoint, en_plViewpoint, fLerpFactor);

    // moving banking and soft eyes
    ((CPlayerAnimator&)*m_penAnimator).ChangeView(plView);
    // body and head attachment animation
    ((CPlayerAnimator&)*m_penAnimator).BodyAndHeadOrientation(plView);

    // return player eyes view
    if (m_iViewState == PVT_PLAYEREYES || _bDiscard3rdView) {
      CPlacement3D plPosLerped = GetLerpedPlacement();
      if (bSharpTurning) {
        // get your prediction tail
        CPlayer *pen = (CPlayer*)GetPredictionTail();
        plView.pl_OrientationAngle = pen->en_plViewpoint.pl_OrientationAngle + (pen->m_aLocalRotation-pen->m_aLastRotation);

        // make sure it doesn't go out of limits
        RoundViewAngle(plView.pl_OrientationAngle(2), PITCH_MAX);
        RoundViewAngle(plView.pl_OrientationAngle(3), BANKING_MAX);

        // compensate for rotations that happen to the player without his/hers will
        // (rotating brushes, weird gravities...)
        // (these need to be lerped)
        ANGLE3D aCurr = pen->GetPlacement().pl_OrientationAngle;
        ANGLE3D aLast = pen->en_plLastPlacement.pl_OrientationAngle;
        ANGLE3D aDesired = pen->en_aDesiredRotationRelative*_pTimer->TickQuantum;
        FLOATmatrix3D mCurr;      MakeRotationMatrixFast(mCurr, aCurr);
        FLOATmatrix3D mLast;      MakeRotationMatrixFast(mLast, aLast);
        FLOATmatrix3D mDesired;   MakeRotationMatrixFast(mDesired, aDesired);
        mDesired = en_mRotation*(mDesired*!en_mRotation);
        FLOATmatrix3D mForced = !mDesired*mCurr*!mLast; // = aCurr-aLast-aDesired;
        ANGLE3D aForced; DecomposeRotationMatrixNoSnap(aForced, mForced);
        if (aForced.MaxNorm()<1E-2) {
          aForced = ANGLE3D(0,0,0);
        }
        FLOATquat3D qForced; qForced.FromEuler(aForced);
        FLOATquat3D qZero;   qZero.FromEuler(ANGLE3D(0,0,0));
        FLOATquat3D qLerped = Slerp(fLerpFactor, qZero, qForced);
        FLOATmatrix3D m;
        qLerped.ToMatrix(m);
        m=m*mDesired*mLast;
        DecomposeRotationMatrixNoSnap(plPosLerped.pl_OrientationAngle, m);
      }
      plView.RelativeToAbsoluteSmooth(plPosLerped);
    // 3rd person view
    } else if (m_iViewState == PVT_3RDPERSONVIEW) {
      plView = m_pen3rdPersonView->GetLerpedPlacement();
    // camera view for player auto actions
    } else if (m_iViewState == PVT_PLAYERAUTOVIEW) {
      plView = m_penView->GetLerpedPlacement();
    // camera view for stored sequences
    } else {
      ASSERTALWAYS("Unknown player view");
    }
    _bDiscard3rdView=FALSE;
  };

  // Get current entity that the player views from.
  CEntity *GetViewEntity(void) {
    // player eyes
    if (m_iViewState == PVT_PLAYEREYES) {
      return this;
    // 3rd person view
    } else if (m_iViewState == PVT_3RDPERSONVIEW) {
      if (m_ulFlags&PLF_ISZOOMING) {
        return this;
      }
      if (((CPlayerView&)*m_pen3rdPersonView).m_fDistance>2.0f) {
        return m_pen3rdPersonView;
      } else {
        return this;
      }
    // camera
    } else if (m_iViewState == PVT_PLAYERAUTOVIEW) {
      if (((CPlayerView&)*m_penView).m_fDistance>2.0f) {
        return m_penView;
      } else {
        return this;
      }
    // invalid view
    } else {
      ASSERTALWAYS("Unknown player view");
      return NULL;
    }
  };

  void RenderChainsawParticles(BOOL bThird)
  {
    FLOAT fStretch=1.0f;
    if( bThird)
    {
      fStretch=0.4f;
    }
    // render chainsaw cutting brush particles
    FLOAT tmNow = _pTimer->GetLerpedCurrentTick();
    for( INDEX iSpray=0; iSpray<MAX_BULLET_SPRAYS; iSpray++)
    {
      BulletSprayLaunchData &bsld = m_absldData[iSpray];
      FLOAT fLife=1.25f;
      if( tmNow > (bsld.bsld_tmLaunch+fLife)) { continue;}
      Particles_BulletSpray(bsld.bsld_iRndBase, bsld.bsld_vPos, bsld.bsld_vG,
        bsld.bsld_eptType, bsld.bsld_tmLaunch, bsld.bsld_vStretch*fStretch, 1.0f);
    }

    // render chainsaw cutting model particles
    for( INDEX iGore=0; iGore<MAX_GORE_SPRAYS; iGore++)
    {
      GoreSprayLaunchData &gsld = m_agsldData[iGore];
      FLOAT fLife=2.0f;
      if( tmNow > (gsld.gsld_tmLaunch+fLife)) { continue;}
      FLOAT3D vPos=gsld.gsld_vPos;
      if( bThird)
      {
        vPos=gsld.gsld_v3rdPos;
      }
      Particles_BloodSpray(gsld.gsld_sptType, vPos, gsld.gsld_vG, gsld.gsld_fGA,
        gsld.gsld_boxHitted, gsld.gsld_vSpilDirection,
        gsld.gsld_tmLaunch, gsld.gsld_fDamagePower*fStretch, gsld.gsld_colParticles);
    }
  }

  // Draw player interface on screen.
  void RenderHUD( CPerspectiveProjection3D &prProjection, CDrawPort *pdp,
                  FLOAT3D vViewerLightDirection, COLOR colViewerLight, COLOR colViewerAmbient,
                  BOOL bRenderWeapon, INDEX iEye)
  {
    CPlacement3D plViewOld = prProjection.ViewerPlacementR();
    // render weapon models if needed
    // do not render weapon if sniping
    BOOL bRenderModels = _pShell->GetINDEX("gfx_bRenderModels");
    if( hud_bShowWeapon && bRenderModels) {
      // render weapons only if view is from player eyes
      ((CPlayerWeapons&)*m_penWeapons).RenderWeaponModel(prProjection, pdp, 
       vViewerLightDirection, colViewerLight, colViewerAmbient, bRenderWeapon, iEye);
    }

    // if is first person
    if (m_iViewState == PVT_PLAYEREYES)
    {
      prProjection.ViewerPlacementL() = plViewOld;
      prProjection.Prepare();
      CAnyProjection3D apr;
      apr = prProjection;
      Stereo_AdjustProjection(*apr, iEye, 1);
      Particle_PrepareSystem(pdp, apr);
      Particle_PrepareEntity( 2.0f, FALSE, FALSE, this);
      RenderChainsawParticles(FALSE);
      Particle_EndSystem();
    }

    // render crosshair if sniper zoom not active
    CPlacement3D plView;
    if (m_iViewState == PVT_PLAYEREYES) {
      // player view
      plView = en_plViewpoint;
      plView.RelativeToAbsolute(GetPlacement());
    } else if (m_iViewState == PVT_3RDPERSONVIEW) {
      // camera view
      plView = ((CPlayerView&)*m_pen3rdPersonView).GetPlacement();
    }
    
    ((CPlayerWeapons&)*m_penWeapons).RenderCrosshair(prProjection, pdp, plView);

    // get your prediction tail
    CPlayer *pen = (CPlayer*)GetPredictionTail();
    // do screen blending
    ULONG ulR=255, ulG=0, ulB=0; // red for wounding
    ULONG ulA = pen->m_fDamageAmmount*5.0f;

    // if player got stung by an abomination
    if(m_bIsStung) {
      ulR=64, ulG=0, ulB=0; // dark red for stinging
      ulA=112;
    }
    
    // if less than few seconds elapsed since last damage
    FLOAT tmSinceWounding = _pTimer->CurrentTick() - pen->m_tmWoundedTime;
    if( tmSinceWounding<4.0f) {
      // decrease damage ammount
      if( tmSinceWounding<0.001f) { ulA = (ulA+64)/2; }
    }

    // add rest of blend ammount
    ulA = ClampUp( ulA, (ULONG)224);
    if (m_iViewState == PVT_PLAYEREYES) {
      pdp->dp_ulBlendingRA += ulR*ulA;
      pdp->dp_ulBlendingGA += ulG*ulA;
      pdp->dp_ulBlendingBA += ulB*ulA;
      pdp->dp_ulBlendingA  += ulA;
    }

    // add world glaring
    {
      COLOR colGlare = GetWorldGlaring();
      UBYTE ubR, ubG, ubB, ubA;
      ColorToRGBA(colGlare, ubR, ubG, ubB, ubA);
      if (ubA!=0) {
        pdp->dp_ulBlendingRA += ULONG(ubR)*ULONG(ubA);
        pdp->dp_ulBlendingGA += ULONG(ubG)*ULONG(ubA);
        pdp->dp_ulBlendingBA += ULONG(ubB)*ULONG(ubA);
        pdp->dp_ulBlendingA  += ULONG(ubA);
      }
    }

    // do all queued screen blendings
    pdp->BlendScreen();

    // render status info line (if needed)
    if( hud_bShowInfo) { 
      // get player or its predictor
      BOOL bSnooping = FALSE;
      CPlayer *penHUDPlayer = this;
      CPlayer *penHUDOwner  = this;

      if (penHUDPlayer->IsPredicted()) {
        penHUDPlayer = (CPlayer *)penHUDPlayer->GetPredictor();
      }

      // check if snooping is needed
      CPlayerWeapons *pen = (CPlayerWeapons*)&*penHUDPlayer->m_penWeapons;
      TIME tmDelta = _pTimer->CurrentTick() - pen->m_tmSnoopingStarted;
      if( tmDelta<plr_tmSnoopingTime) {
        ASSERT( pen->m_penTargeting!=NULL);
        penHUDPlayer = (CPlayer*)&*pen->m_penTargeting;
        bSnooping = TRUE;
      }
      DrawHUD( penHUDPlayer, pdp, bSnooping, penHUDOwner);
    }
  }


/************************************************************
 *                  SPECIAL FUNCTIONS                       *
 ************************************************************/
  // try to find start marker for deathmatch (re)spawning
  CEntity *GetDeathmatchStartMarker(void)
  {
    // get number of markers
    CTString strPlayerStart = "Player Start - ";
    INDEX ctMarkers = _pNetwork->GetNumberOfEntitiesWithName(strPlayerStart);
    // if none
    if (ctMarkers==0) {
      // fail
      return NULL;
    }
    // if only one
    if (ctMarkers==1) {
      // get that one
      return _pNetwork->GetEntityWithName(strPlayerStart, 0);
    }
    // if at least two markers found...

    // create tables of markers and their distances from players
    CStaticArray<MarkerDistance> amdMarkers;
    amdMarkers.New(ctMarkers);
    // for each marker
    {for(INDEX iMarker=0; iMarker<ctMarkers; iMarker++) {
      amdMarkers[iMarker].md_ppm = (CPlayerMarker*)_pNetwork->GetEntityWithName(strPlayerStart, iMarker);
      if (amdMarkers[iMarker].md_ppm==NULL) {
        return NULL;  // (if there is any invalidity, fail completely)
      }
      // get min distance from any player
      FLOAT fMinD = UpperLimit(0.0f);
      for (INDEX iPlayer=0; iPlayer<GetMaxPlayers(); iPlayer++) {
        CPlayer *ppl = (CPlayer *)&*GetPlayerEntity(iPlayer);
        if (ppl==NULL) { 
          continue;
        }
        FLOAT fD = 
          (amdMarkers[iMarker].md_ppm->GetPlacement().pl_PositionVector-
           ppl->GetPlacement().pl_PositionVector).Length();
        if (fD<fMinD) {
          fMinD = fD;
        }
      }
      amdMarkers[iMarker].md_fMinD = fMinD;
    }}

    // now sort the list
    qsort(&amdMarkers[0], ctMarkers, sizeof(amdMarkers[0]), &qsort_CompareMarkerDistance);
    ASSERT(amdMarkers[0].md_fMinD>=amdMarkers[ctMarkers-1].md_fMinD);
    // choose marker among one of the 50% farthest
    INDEX ctFarMarkers = ctMarkers/2;
    ASSERT(ctFarMarkers>0);
    INDEX iStartMarker = IRnd()%ctFarMarkers;
    // find first next marker that was not used lately
    INDEX iMarker=iStartMarker;
    FOREVER{
      if (_pTimer->CurrentTick()>amdMarkers[iMarker].md_ppm->m_tmLastSpawned+1.0f) {
        break;
      }
      iMarker = (iMarker+1)%ctMarkers;
      if (iMarker==iStartMarker) {
        break;
      }
    }
    // return that
    return amdMarkers[iMarker].md_ppm;
  }

/************************************************************
 *                  INITIALIZE PLAYER                       *
 ************************************************************/

  void InitializePlayer()
  {
    // set viewpoint position inside the entity
    en_plViewpoint.pl_OrientationAngle = ANGLE3D(0,0,0);
    en_plViewpoint.pl_PositionVector = FLOAT3D(0.0f, plr_fViewHeightStand, 0.0f);
    en_plLastViewpoint = en_plViewpoint;

    // clear properties
    m_ulFlags &= PLF_INITIALIZED|PLF_LEVELSTARTED|PLF_RESPAWNINPLACE;  // must not clear initialized flag
    m_fFallTime = 0.0f;
    m_pstState = PST_STAND;
    m_fDamageAmmount = 0.0f;
    m_tmWoundedTime  = 0.0f;
    m_tmInvisibility    = 0.0f, 
    m_tmInvulnerability = 0.0f, 
    m_tmSeriousDamage   = 0.0f, 
    m_tmSeriousSpeed    = 0.0f,
    m_tmStungTime       = 0.0f,

    // initialize animator
    ((CPlayerAnimator&)*m_penAnimator).Initialize();
    // restart weapons if needed
    GetPlayerWeapons()->SendEvent(EStart());

    // initialise last positions for particles
    Particles_AfterBurner_Prepare(this);

    // set flags
    SetPhysicsFlags(EPF_MODEL_WALKING|EPF_HASLUNGS);
    SetCollisionFlags(ECF_MODEL|((ECBI_PLAYER)<<ECB_IS));
    SetFlags(GetFlags()|ENF_ALIVE);
    // animation
    StartModelAnim(PLAYER_ANIM_STAND, AOF_LOOPING);
    TeleportPlayer(WLT_FIXED);
  };


  FLOAT3D GetTeleportingOffset(void)
  {
    // find player index
    INDEX iPlayer = GetMyPlayerIndex();

    // create offset from marker
    const FLOAT fOffsetY = 0.1f;  // how much to offset up (as precaution not to spawn in floor)
    FLOAT3D vOffsetRel = FLOAT3D(0,fOffsetY,0);
    if (GetSP()->sp_bCooperative && !GetSP()->sp_bSinglePlayer) {
      INDEX iRow = iPlayer/4;
      INDEX iCol = iPlayer%4;
      vOffsetRel = FLOAT3D(-3.0f+iCol*2.0f, fOffsetY, -3.0f+iRow*2.0f);
    }

    return vOffsetRel;
  }
  

  void RemapLevelNames(INDEX &iLevel)
  {
	  switch(iLevel) {
    case 10:
      iLevel = 1;
      break;
    case 11:
		  iLevel = 2;
		  break;
	  case 12:
		  iLevel = 3;
		  break;
	  case 13:
		  iLevel = 4;
		  break;
	  case 14:
		  iLevel = 5;
		  break;
	  case 15:
		  iLevel = 6;
		  break;
	  case 21:
		  iLevel = 7;
		  break;
	  case 22:
		  iLevel = 8;
		  break;
	  case 23:
		  iLevel = 9;
		  break;
	  case 24:
		  iLevel = 10;
		  break;
	  case 31:
		  iLevel = 11;
		  break;
	  case 32:
		  iLevel = 12;
		  break;
	  case 33:
		  iLevel = 13;
		  break;
	  default:
		  iLevel = -1;
		  break;
	  }
  }
  
  
  void TeleportPlayer(enum WorldLinkType EwltType) 
  {
    INDEX iLevel = -1;
    CTString strLevelName = GetWorld()->wo_fnmFileName.FileName();
    
    //strLevelName.ScanF("%02d_", &iLevel);
    INDEX u, v;
    u = v = -1;
    strLevelName.ScanF("%01d_%01d_", &u, &v);
    iLevel = u*10+v;
    
	  RemapLevelNames(iLevel);
            
    if (iLevel>0) {
      ((CSessionProperties*)GetSP())->sp_ulLevelsMask|=1<<(iLevel-1);
    }

    // find player index
    INDEX iPlayer = GetMyPlayerIndex();
    // player placement
    CPlacement3D plSet = GetPlacement();
    // teleport in dummy space to avoid auto teleport frag
    Teleport(CPlacement3D(FLOAT3D(32000.0f+100.0f*iPlayer, 32000.0f, 0), ANGLE3D(0, 0, 0)));
    // force yourself to standing state
    ForceCollisionBoxIndexChange(PLAYER_COLLISION_BOX_STAND);
    en_plViewpoint.pl_PositionVector(2) = plr_fViewHeightStand;
    ((CPlayerAnimator&)*m_penAnimator).m_bDisableAnimating = FALSE;
    ((CPlayerAnimator&)*m_penAnimator).Stand();
    m_pstState = PST_STAND;

    // create offset from marker
    FLOAT3D vOffsetRel = GetTeleportingOffset();

    // no player start initially
    BOOL bSetHealth = FALSE;      // for getting health from marker
    BOOL bAdjustHealth = FALSE;   // for getting adjusting health to 50-100 interval
    CEntity *pen = NULL;
    if (GetSP()->sp_bCooperative) {
      if (cht_iGoToMarker>=0) {
        // try to find fast go marker
        CTString strPlayerStart;
        strPlayerStart.PrintF("Player Start - %d", (INDEX)cht_iGoToMarker);
        pen = _pNetwork->GetEntityWithName(strPlayerStart, 0);
        pen->SendEvent(ETrigger());
        cht_iGoToMarker = -1;
        bSetHealth = TRUE;
        bAdjustHealth = FALSE;
      // if there is coop respawn marker
      } else if (m_penMainMusicHolder!=NULL && !(m_ulFlags&PLF_CHANGINGLEVEL)) {
        CMusicHolder *pmh = (CMusicHolder *)&*m_penMainMusicHolder;
        if (pmh->m_penRespawnMarker!=NULL) {
          // get it
          pen = pmh->m_penRespawnMarker;
          bSetHealth = TRUE;
          bAdjustHealth = FALSE;
        }
      }

      // if quick start is enabled (in wed)
      if (pen==NULL && GetSP()->sp_bQuickTest && m_strGroup=="") {
        // try to find quick start marker
        CTString strPlayerStart;
        strPlayerStart.PrintF("Player Quick Start");
        pen = _pNetwork->GetEntityWithName(strPlayerStart, 0);
        bSetHealth = TRUE;
        bAdjustHealth = FALSE;
      }
      // if no start position yet
      if (pen==NULL) {
        // try to find normal start marker
        CTString strPlayerStart;
        strPlayerStart.PrintF("Player Start - %s", m_strGroup);
        pen = _pNetwork->GetEntityWithName(strPlayerStart, 0);
        if (m_strGroup=="") {
          bSetHealth = TRUE;
          bAdjustHealth = FALSE;
        } else {
          if (EwltType==WLT_FIXED) {
            bSetHealth = FALSE;
            bAdjustHealth = TRUE;
          } else {
            bSetHealth = FALSE;
            bAdjustHealth = FALSE;
          }
        }
      }
      // if no start position yet
      if (pen==NULL) {
        // try to find normal start marker without group anyway
        CTString strPlayerStart;
        strPlayerStart.PrintF("Player Start - ");
        pen = _pNetwork->GetEntityWithName(strPlayerStart, 0);
        bSetHealth = TRUE;
        bAdjustHealth = FALSE;
      }
    } else {
      bSetHealth = TRUE;
      bAdjustHealth = FALSE;
      // try to find start marker by random
      pen = GetDeathmatchStartMarker();
      if (pen!=NULL) {
        ((CPlayerMarker&)*pen).m_tmLastSpawned = _pTimer->CurrentTick();
      }
    }

    // if respawning in place
    if ((m_ulFlags&PLF_RESPAWNINPLACE) && pen!=NULL && !((CPlayerMarker*)&*pen)->m_bNoRespawnInPlace) {
      m_ulFlags &= ~PLF_RESPAWNINPLACE;
      // set default params
      SetHealth(TopHealth());
      m_iMana  = GetSP()->sp_iInitialMana;
      m_fArmor = 0.0f;
      // teleport where you were when you were killed
      Teleport(CPlacement3D(m_vDied, m_aDied));

    // if start marker is found
    } else if (pen!=NULL) {
      // if there is no respawn marker yet
      if (m_penMainMusicHolder!=NULL) {
        CMusicHolder *pmh = (CMusicHolder *)&*m_penMainMusicHolder;
        if (pmh->m_penRespawnMarker==NULL) {
          // set it
          pmh->m_penRespawnMarker = pen;
        }
      }

      CPlayerMarker &CpmStart = (CPlayerMarker&)*pen;
      // set player characteristics
      if (bSetHealth) {
        SetHealth(CpmStart.m_fHealth/100.0f*TopHealth());
        m_iMana  = GetSP()->sp_iInitialMana;
        m_fArmor = CpmStart.m_fShield;
      } else if (bAdjustHealth) {
        FLOAT fHealth = GetHealth();
        FLOAT fTopHealth = TopHealth();
        if( fHealth < fTopHealth) {
          SetHealth(ClampUp(fHealth+fTopHealth/2.0f, fTopHealth));
        }
      }

      // set weapons
      if (!GetSP()->sp_bCooperative) {
        ((CPlayerWeapons&)*m_penWeapons).InitializeWeapons(CpmStart.m_iGiveWeapons, 0, 0,
          CpmStart.m_fMaxAmmoRatio);
      } else {
        ((CPlayerWeapons&)*m_penWeapons).InitializeWeapons(CpmStart.m_iGiveWeapons, CpmStart.m_iTakeWeapons,
          GetSP()->sp_bInfiniteAmmo?0:CpmStart.m_iTakeAmmo, CpmStart.m_fMaxAmmoRatio);
      }
      // start position relative to link
      if (EwltType == WLT_RELATIVE) {
        plSet.AbsoluteToRelative(_SwcWorldChange.plLink);   // relative to link position
        plSet.RelativeToAbsolute(CpmStart.GetPlacement());  // absolute to start marker position
        Teleport(plSet);
      // fixed start position
      } else if (EwltType == WLT_FIXED) {
        CPlacement3D plNew = CpmStart.GetPlacement();
        vOffsetRel*=CpmStart.en_mRotation;
        plNew.pl_PositionVector += vOffsetRel;
        Teleport(plNew);
      // error -> teleport to zero
      } else {
        ASSERTALWAYS("Unknown world link type");
        Teleport(CPlacement3D(FLOAT3D(0, 0, 0)+vOffsetRel, ANGLE3D(0, 0, 0)));
      }
      // if there is a start trigger target
      if(CpmStart.m_penTarget!=NULL) {
        SendToTarget(CpmStart.m_penTarget, EET_TRIGGER, this);
      }

    // default start position
    } else {
      // set player characteristics
      SetHealth(TopHealth());
      m_iMana = GetSP()->sp_iInitialMana;
      m_fArmor = 0.0f;
      // set weapons
      ((CPlayerWeapons&)*m_penWeapons).InitializeWeapons(0, 0, 0, 0);
      // start position
      Teleport(CPlacement3D(FLOAT3D(0, 0, 0)+vOffsetRel, ANGLE3D(0, 0, 0)));
    }
    // send teleport event to all entities in range
    SendEventInRange(ETeleport(), FLOATaabbox3D(GetPlacement().pl_PositionVector, 200.0f));
    // stop moving
    ForceFullStop();

    // remember maximum health
    m_fMaxHealth = TopHealth();

    // if in singleplayer mode
    if (GetSP()->sp_bSinglePlayer && GetSP()->sp_gmGameMode!=CSessionProperties::GM_FLYOVER) {
      CWorldSettingsController *pwsc = GetWSC(this);
      if (pwsc!=NULL && pwsc->m_bNoSaveGame) {
        NOTHING;
      } else {
        // save quick savegame
        _pShell->Execute("gam_bQuickSave=1;");
      }
    }
    // remember level start time
    if (!(m_ulFlags&PLF_LEVELSTARTED)) {
      m_ulFlags |= PLF_LEVELSTARTED;
      m_tmLevelStarted = _pNetwork->GetGameTime();
    }
    // reset model appearance
    CTString strDummy;
    SetPlayerAppearance(GetModelObject(), NULL, strDummy, /*bPreview=*/FALSE);
    ValidateCharacter();
    SetPlayerAppearance(&m_moRender, &en_pcCharacter, strDummy, /*bPreview=*/FALSE);
    ParseGender(strDummy);
    GetPlayerAnimator()->SetWeapon();
    m_ulFlags |= PLF_SYNCWEAPON;

    // spawn teleport effect
    SpawnTeleport();
    // return from editor model (if was fragged into pieces)
    SwitchToModel();
    m_tmSpawned = _pTimer->CurrentTick();

    en_tmLastBreathed = _pTimer->CurrentTick()+0.1f;  // do not take breath when spawned in air
  };

  // note: set estimated time in advance
  void RecordEndOfLevelData(void)
  {
    // must not be called multiple times
    ASSERT(!m_bEndOfLevel);
    m_bPendingMessage = FALSE;
    m_tmMessagePlay = 0;
    // mark end of level
    m_iMayRespawn = 0;
    m_bEndOfLevel = TRUE;
    // remember end time
    time((time_t*)&m_iEndTime);
    // add time score
    TIME tmLevelTime = _pTimer->CurrentTick()-m_tmLevelStarted;
    m_psLevelStats.ps_tmTime = tmLevelTime;
    m_psGameStats.ps_tmTime += tmLevelTime;
    FLOAT fTimeDelta = ClampDn((FLOAT)(floor(m_tmEstTime)-floor(tmLevelTime)), 0.0f);
    m_iTimeScore = floor(fTimeDelta*100.0f);
    m_psLevelStats.ps_iScore+=m_iTimeScore;
    m_psGameStats.ps_iScore+=m_iTimeScore;

    // record stats for this level and add to global table
    CTString strStats;
    strStats.PrintF(TRANS("%s\n  Time:   %s\n  Score: %9d\n  Kills:   %03d/%03d\n  Secrets:   %02d/%02d\n"), 
        TranslateConst(en_pwoWorld->GetName(), 0), TimeToString(tmLevelTime), 
        m_psLevelStats.ps_iScore,
        m_psLevelStats.ps_iKills, m_psLevelTotal.ps_iKills,
        m_psLevelStats.ps_iSecrets, m_psLevelTotal.ps_iSecrets);
    m_strLevelStats += strStats;
  }

  // spawn teleport effect
  void SpawnTeleport(void)
  {
    // if in singleplayer
    if (GetSP()->sp_bSinglePlayer) {
      // no spawn effects
      return;
    }
    ESpawnEffect ese;
    ese.colMuliplier = C_WHITE|CT_OPAQUE;
    ese.betType = BET_TELEPORT;
    ese.vNormal = FLOAT3D(0,1,0);
    FLOATaabbox3D box;
    GetBoundingBox(box);
    FLOAT fEntitySize = box.Size().MaxNorm()*2;
    ese.vStretch = FLOAT3D(fEntitySize, fEntitySize, fEntitySize);
    CEntityPointer penEffect = CreateEntity(GetPlacement(), CLASS_BASIC_EFFECT);
    penEffect->Initialize(ese);
  }



  // render particles
  void RenderParticles(void)
  {
    FLOAT tmNow = _pTimer->GetLerpedCurrentTick();
    
    // render empty shells
    Particles_EmptyShells( this, m_asldData);

    if (Particle_GetViewer()==this) {
      Particles_ViewerLocal(this);
    }
    else
    {
      // if is not first person
      RenderChainsawParticles(TRUE);
      // glowing powerups
      if (GetFlags()&ENF_ALIVE){
        if (m_tmSeriousDamage>tmNow && m_tmInvulnerability>tmNow) {
          Particles_ModelGlow(this, Max(m_tmSeriousDamage,m_tmInvulnerability),PT_STAR08, 0.15f, 2, 0.03f, 0xff00ff00);
        } else if (m_tmInvulnerability>tmNow) {
          Particles_ModelGlow(this, m_tmInvulnerability, PT_STAR05, 0.15f, 2, 0.03f, 0x3333ff00);
        } else if (m_tmSeriousDamage>tmNow) {
          Particles_ModelGlow(this, m_tmSeriousDamage, PT_STAR08, 0.15f, 2, 0.03f, 0xff777700);
        }
        if (m_tmSeriousSpeed>tmNow) {
          Particles_RunAfterBurner(this, m_tmSeriousSpeed, 0.3f, 0);
        }
        if (!GetSP()->sp_bCooperative) {
          CPlayerWeapons *wpn = GetPlayerWeapons();
        }
      }
    }
            
    // spirit particles
    if( m_tmSpiritStart != 0.0f)
    {
      Particles_Appearing(this, m_tmSpiritStart);
    }
  }

  void TeleportToAutoMarker(CPlayerActionMarker *ppam) 
  {
    // if we are in coop
    if (GetSP()->sp_bCooperative && !GetSP()->sp_bSinglePlayer) {
      // for each player
      for(INDEX iPlayer=0; iPlayer<GetMaxPlayers(); iPlayer++) {
        CPlayer *ppl = (CPlayer*)GetPlayerEntity(iPlayer);
        if (ppl!=NULL) {
          // put it at marker
          CPlacement3D pl = ppam->GetPlacement();
          FLOAT3D vOffsetRel = ppl->GetTeleportingOffset();
          pl.pl_PositionVector += vOffsetRel*ppam->en_mRotation;
          ppl->Teleport(pl, FALSE);
          // remember new respawn place
          ppl->m_vDied = pl.pl_PositionVector;
          ppl->m_aDied = pl.pl_OrientationAngle;
        }
      }

    // otherwise
    } else {
      // put yourself at marker
      CPlacement3D pl = ppam->GetPlacement();
      FLOAT3D vOffsetRel = GetTeleportingOffset();
      pl.pl_PositionVector += vOffsetRel*ppam->en_mRotation;
      Teleport(pl, FALSE);
    }
  }

  // check whether this time we respawn in place or on marker
  void CheckDeathForRespawnInPlace(EDeath eDeath)
  {
    // if respawning in place is not allowed
    if (!GetSP()->sp_bRespawnInPlace) {
      // skip further checks
      return;
    }
    // if killed by a player or enemy
    CEntity *penKiller = eDeath.eLastDamage.penInflictor;
    if (IsOfClass(penKiller, "Player") || IsDerivedFromClass(penKiller, "Enemy Base")) {
      // mark for respawning in place
      m_ulFlags |= PLF_RESPAWNINPLACE;
      m_vDied = GetPlacement().pl_PositionVector;
      m_aDied = GetPlacement().pl_OrientationAngle;
    }
  }

procedures:
/************************************************************
 *                       WOUNDED                            *
 ************************************************************/
  Wounded(EDamage eDamage) {
    return;
  };


/************************************************************
 *                     WORLD CHANGE                         *
 ************************************************************/
  WorldChange() {
    // if in single player
    if (GetSP()->sp_bSinglePlayer) {
      // mark world as visited
      CTString strDummy("1");
      SaveStringVar(GetWorld()->wo_fnmFileName.NoExt()+".vis", strDummy);
    }
    // find music holder on new world
    FindMusicHolder();
    // store group name
    m_strGroup = _SwcWorldChange.strGroup;
    TeleportPlayer((WorldLinkType)_SwcWorldChange.iType);
    // setup light source
    SetupLightSource();

    // make sure we discontinue zooming
    CPlayerWeapons *penWeapon = GetPlayerWeapons();
    m_ulFlags&=~PLF_ISZOOMING;

	// turn off possible chainsaw engine sound
	PlaySound(m_soWeaponAmbient, SOUND_SILENCE, SOF_3D);
	
    // update per-level stats
    UpdateLevelStats();
    m_ulFlags |= PLF_INITIALIZED;
    m_ulFlags &= ~PLF_CHANGINGLEVEL;
    return;
  };

  WorldChangeDead() 
  {
    // forbid respawning in-place when changing levels while dead
    m_ulFlags &= ~PLF_RESPAWNINPLACE;

    // if in single player
    if (GetSP()->sp_bSinglePlayer) {
      // mark world as visited
      CTString strDummy("1");
      SaveStringVar(GetWorld()->wo_fnmFileName.NoExt()+".vis", strDummy);
    }
    // find music holder on new world
    FindMusicHolder();
    // store group name

    autocall Rebirth() EReturn;

    // setup light source
    SetupLightSource();

    // update per-level stats
    UpdateLevelStats();
    m_ulFlags |= PLF_INITIALIZED;
    m_ulFlags &= ~PLF_CHANGINGLEVEL;
    return;
  }

/************************************************************
 *                       D E A T H                          *
 ************************************************************/

  Death(EDeath eDeath)
  {
    // stop firing when dead
    ((CPlayerWeapons&)*m_penWeapons).SendEvent(EReleaseWeapon());
    // stop all looping ifeel effects
    if(_pNetwork->IsPlayerLocal(this))
    {
      IFeel_StopEffect("ChainsawFire");
      IFeel_StopEffect("FlamethrowerFire");
      IFeel_StopEffect("ChainsawIdle");
      IFeel_StopEffect("SniperZoom");
      IFeel_StopEffect("Minigun_rotate");
    }
    
    // make sure sniper zoom is stopped 
    CPlayerWeapons *penWeapon = GetPlayerWeapons();
    m_ulFlags&=~PLF_ISZOOMING;
    
    // stop weapon sounds
    PlaySound(m_soWeaponAmbient, SOUND_SILENCE, SOF_3D);
    
    // if in single player, or if this is a predictor entity
    if (GetSP()->sp_bSinglePlayer || IsPredictor()) {
      // do not print anything
      NOTHING;
    // if in cooperative, but not single player
    } else if (GetSP()->sp_bCooperative) {
      // just print death message, no score updating
      PrintPlayerDeathMessage(this, eDeath);
      // check whether this time we respawn in place or on marker
      CheckDeathForRespawnInPlace(eDeath);
      // increase number of deaths
      m_psLevelStats.ps_iDeaths += 1;
      m_psGameStats.ps_iDeaths += 1;
    // if not in cooperative, and not single player
    } else {
      // print death message
      PrintPlayerDeathMessage(this, eDeath);
      // get the killer pointer
      CEntity *penKiller = eDeath.eLastDamage.penInflictor;
      // initially, not killed by a player
      CPlayer *pplKillerPlayer = NULL;

      // if killed by some entity
      if (penKiller!=NULL) {
        // if killed by player
        if (IsOfClass(penKiller, "Player")) {
          // if someone other then you
          if (penKiller!=this) {
            pplKillerPlayer = (CPlayer*)penKiller;
            EReceiveScore eScore;
            eScore.iPoints = m_iMana;
            eDeath.eLastDamage.penInflictor->SendEvent(eScore);
            eDeath.eLastDamage.penInflictor->SendEvent(EKilledEnemy());
          // if it was yourself
          } else {
            m_psLevelStats.ps_iScore -= m_iMana;
            m_psGameStats.ps_iScore -= m_iMana;
            m_psLevelStats.ps_iKills -= 1;
            m_psGameStats.ps_iKills -= 1;
          }
        // if killed by non-player
        } else {
          m_psLevelStats.ps_iScore -= m_iMana;
          m_psGameStats.ps_iScore -= m_iMana;
          m_psLevelStats.ps_iKills -= 1;
          m_psGameStats.ps_iKills -= 1;
        }
      // if killed by NULL (shouldn't happen, but anyway)
      } else {
        m_psLevelStats.ps_iScore -= m_iMana;
        m_psGameStats.ps_iScore -= m_iMana;
        m_psLevelStats.ps_iKills -= 1;
        m_psGameStats.ps_iKills -= 1;
      }

      // if playing scorematch
      if (!GetSP()->sp_bUseFrags) {
        // if killed by a player
        if (pplKillerPlayer!=NULL) {
          // print how much that player gained
          CPrintF(TRANS("  %s: +%d points\n"), pplKillerPlayer->GetPlayerName(), m_iMana);
        // if it was a suicide, or an accident
        } else {
          // print how much you lost
          CPrintF(TRANS("  %s: -%d points\n"), GetPlayerName(), m_iMana);
        }
      }

      // increase number of deaths
      m_psLevelStats.ps_iDeaths += 1;
      m_psGameStats.ps_iDeaths += 1;
    }

    // store last view
    m_iLastViewState = m_iViewState;

    // mark player as death
    SetFlags(GetFlags()&~ENF_ALIVE);
    // stop player
    SetDesiredTranslation(FLOAT3D(0.0f, 0.0f, 0.0f));
    SetDesiredRotation(ANGLE3D(0.0f, 0.0f, 0.0f));

    // remove weapon from hand
    ((CPlayerAnimator&)*m_penAnimator).RemoveWeapon();
    // kill weapon animations
    GetPlayerWeapons()->SendEvent(EStop());

    // if in deathmatch
    if (!GetSP()->sp_bCooperative) {
      // drop current weapon as item so others can pick it
      GetPlayerWeapons()->DropWeapon();
    }


    // play death
    INDEX iAnim1;
    INDEX iAnim2;
    if (m_pstState == PST_SWIM || m_pstState == PST_DIVE) {
      iAnim1 = PLAYER_ANIM_DEATH_UNDERWATER;
      iAnim2 = BODY_ANIM_DEATH_UNDERWATER;
    } else if (eDeath.eLastDamage.dmtType==DMT_SPIKESTAB) {
      iAnim1 = PLAYER_ANIM_DEATH_SPIKES;
      iAnim2 = BODY_ANIM_DEATH_SPIKES;
    } else if (eDeath.eLastDamage.dmtType==DMT_ABYSS) {
      iAnim1 = PLAYER_ANIM_ABYSSFALL;
      iAnim2 = BODY_ANIM_ABYSSFALL;
    } else {
      FLOAT3D vFront;
      GetHeadingDirection(0, vFront);
      FLOAT fDamageDir = m_vDamage%vFront;
      if (fDamageDir<0) {
        if (Abs(fDamageDir)<10.0f) {
          iAnim1 = PLAYER_ANIM_DEATH_EASYFALLBACK;
          iAnim2 = BODY_ANIM_DEATH_EASYFALLBACK;
        } else {
          iAnim1 = PLAYER_ANIM_DEATH_BACK;
          iAnim2 = BODY_ANIM_DEATH_BACK;
        }
      } else {
        if (Abs(fDamageDir)<10.0f) {
          iAnim1 = PLAYER_ANIM_DEATH_EASYFALLFORWARD;
          iAnim2 = BODY_ANIM_DEATH_EASYFALLFORWARD;
        } else {
          iAnim1 = PLAYER_ANIM_DEATH_FORWARD;
          iAnim2 = BODY_ANIM_DEATH_FORWARD;
        }
      }
    }
    en_plViewpoint.pl_OrientationAngle = ANGLE3D(0,0,0);
    StartModelAnim(iAnim1, 0);
    CModelObject &moBody = GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject;
    moBody.PlayAnim(iAnim2, 0);

    // set physic flags
    SetPhysicsFlags(EPF_MODEL_CORPSE);
    SetCollisionFlags(ECF_CORPSE);

    // set density to float out of water
    en_fDensity = 400.0f;

    // play sound
    if (m_pstState==PST_DIVE) {
      if(_pNetwork->IsPlayerLocal(this)) {IFeel_PlayEffect("DeathWater");}
    } else {
      if(_pNetwork->IsPlayerLocal(this)) {IFeel_PlayEffect("Death");}
    }

    // initialize death camera view
    ASSERT(m_penView == NULL);
    if (m_penView == NULL) {
      m_penView = CreateEntity(GetPlacement(), CLASS_PLAYER_VIEW);
      EViewInit eInit;
      eInit.penOwner = this;
      eInit.penCamera = NULL;
      eInit.vtView = VT_PLAYERDEATH;
      eInit.bDeathFixed = eDeath.eLastDamage.dmtType==DMT_ABYSS;
      m_penView->Initialize(eInit);
    }
                     
    if (ShouldBlowUp()) {
      BlowUp();
    } else {
      // leave a stain beneath
      LeaveStain(TRUE);
    }

    m_iMayRespawn = 0;
    // wait for anim of death
    wait (1.2f) {
      on (EBegin) : {
        // set new view status
        m_iViewState = PVT_PLAYERAUTOVIEW;
        resume;
      }
      // when anim is finished
      on (ETimer) : {
        // allow respawning
        m_iMayRespawn = 1;
        resume;
      }
      // when damaged
      on (EDamage eDamage) : { 
        if (eDamage.dmtType==DMT_ABYSS) {
          if (m_penView!=NULL) {
            ((CPlayerView*)&*m_penView)->m_bFixed = TRUE;
          }
        }
        // if should blow up now (and not already blown up)
        if (ShouldBlowUp()) {
          // do it
          BlowUp();
        }
        resume; 
      }
      on (EDeath) : { resume; }
      // if player pressed fire
      on (EEnd) : { 
        // NOTE: predictors must never respawn since player markers for respawning are not predicted
        // if this is not predictor
        if (!IsPredictor()) { 
          // stop waiting
          stop; 
        } 
      }
      // if autoaction is received
      on (EAutoAction eAutoAction) : {
        // if we are in coop
        if (GetSP()->sp_bCooperative && !GetSP()->sp_bSinglePlayer) {
          // if the marker is teleport marker
          if (eAutoAction.penFirstMarker!=NULL && 
            ((CPlayerActionMarker*)&*eAutoAction.penFirstMarker)->m_paaAction == PAA_TELEPORT) {
            // teleport there
            TeleportToAutoMarker((CPlayerActionMarker*)&*eAutoAction.penFirstMarker);
          }
        }
        // ignore the actions
        resume;
      }
      on (EDisconnected) : { pass; }
      on (EReceiveScore) : { pass; }
      on (EKilledEnemy) : { pass; }
      on (EPreLevelChange) : { pass; }
      on (EPostLevelChange) : { pass; }
      otherwise() : { resume; }
    }

    return ERebirth();
  };

  TheEnd() {
    // if not playing demo
    if (!_pNetwork->IsPlayingDemo()) {
      // record high score in single player only
      if (GetSP()->sp_bSinglePlayer) {
        _pShell->Execute("gam_iRecordHighScore=0;");
      }
    }
    // if current difficulty is serious
    if (GetSP()->sp_gdGameDifficulty==CSessionProperties::GD_EXTREME) {
      // activate the mental mode
      _pShell->Execute("sam_bMentalActivated=1;");
    }

    // stop firing when end
    ((CPlayerWeapons&)*m_penWeapons).SendEvent(EReleaseWeapon());

    // mark player as dead
    SetFlags(GetFlags()&~ENF_ALIVE);
    // stop player
    SetDesiredTranslation(FLOAT3D(0.0f, 0.0f, 0.0f));
    SetDesiredRotation(ANGLE3D(0.0f, 0.0f, 0.0f));

    // look straight
    StartModelAnim(PLAYER_ANIM_STAND, 0);
    ((CPlayerAnimator&)*m_penAnimator).BodyAnimationTemplate(
      BODY_ANIM_NORMALWALK, BODY_ANIM_COLT_STAND, BODY_ANIM_SHOTGUN_STAND, BODY_ANIM_MINIGUN_STAND, 
      AOF_LOOPING|AOF_NORESTART);

    en_plViewpoint.pl_OrientationAngle = ANGLE3D(0,0,0);

    // call computer
    m_bEndOfGame = TRUE;
    SetGameEnd();

    wait () {
      on (EBegin) : { resume; }
      on (EReceiveScore) : { pass; }
      on (EKilledEnemy) : { pass; }
      on (ECenterMessage) : { pass; }
      otherwise() : { resume; }
    }
  };

/************************************************************
 *                      R E B I R T H                       *
 ************************************************************/
  FirstInit() {
    // clear use button and zoom flag
    bUseButtonHeld = FALSE;
    
    // restore last view
    m_iViewState = m_iLastViewState;

    // stop and kill camera
    if (m_penView != NULL) {
      ((CPlayerView&)*m_penView).SendEvent(EEnd());
      m_penView = NULL;
    }

    FindMusicHolder();

    // update per-level stats
    UpdateLevelStats();

    // initialize player (from PlayerMarker)
    InitializePlayer();

    if (GetSettings()->ps_ulFlags&PSF_PREFER3RDPERSON) {
      ChangePlayerView();
    }

    return;
  };

  Rebirth() {
    
    bUseButtonHeld = FALSE;

    // restore last view
    m_iViewState = m_iLastViewState;
    // clear ammunition
    if (!(m_ulFlags&PLF_RESPAWNINPLACE)) {
      GetPlayerWeapons()->ClearWeapons();
    }

    // stop and kill camera
    if (m_penView != NULL) {
      ((CPlayerView&)*m_penView).SendEvent(EEnd());
      m_penView = NULL;
    }

    // stop and kill flame
    CEntityPointer penFlame = GetChildOfClass("Flame");
    if (penFlame!=NULL)
    {
      // send the event to stop burning
      EStopFlaming esf;
      esf.m_bNow=TRUE;
      penFlame->SendEvent(esf);
    }

    if (m_penView != NULL) {
      ((CPlayerView&)*m_penView).SendEvent(EEnd());
      m_penView = NULL;
    }

    FindMusicHolder();

    // initialize player (from PlayerMarker)
    InitializePlayer();

    return EReturn();
  };


  // auto action - go to current marker
  AutoGoToMarker(EVoid)
  {
    ULONG ulFlags = AOF_LOOPING|AOF_NORESTART;

    INDEX iAnim = GetModelObject()->GetAnim();
    if( iAnim!=PLAYER_ANIM_STAND)
    {
      ulFlags |= AOF_SMOOTHCHANGE;
    }

    CPlayerAnimator &plan = (CPlayerAnimator&)*m_penAnimator;
    plan.m_bAttacking = FALSE;
    plan.BodyWalkAnimation();
    if (m_fAutoSpeed>plr_fSpeedForward/2) {
      StartModelAnim(PLAYER_ANIM_RUN, ulFlags);
    } else {
      StartModelAnim(PLAYER_ANIM_NORMALWALK, ulFlags);
    }

    // while not at marker
    while (
      (m_penActionMarker->GetPlacement().pl_PositionVector-
       GetPlacement().pl_PositionVector).Length()>1.0f) {
      // wait a bit
      autowait(_pTimer->TickQuantum);
    }

    // return to auto-action loop
    return EReturn();
  }

  // auto action - go to current marker and stop there
  AutoGoToMarkerAndStop(EVoid)
  {
    ULONG ulFlags = AOF_LOOPING|AOF_NORESTART;

    INDEX iAnim = GetModelObject()->GetAnim();
    if( iAnim!=PLAYER_ANIM_STAND)
    {
      ulFlags |= AOF_SMOOTHCHANGE;
    }

    CPlayerAnimator &plan = (CPlayerAnimator&)*m_penAnimator;
    plan.BodyWalkAnimation();
    if (m_fAutoSpeed>plr_fSpeedForward/2) {
      StartModelAnim(PLAYER_ANIM_RUN, ulFlags);
    } else {
      StartModelAnim(PLAYER_ANIM_NORMALWALK, ulFlags);
    }

    // while not at marker
    while (
      (m_penActionMarker->GetPlacement().pl_PositionVector-
       GetPlacement().pl_PositionVector).Length()>m_fAutoSpeed*_pTimer->TickQuantum*2.00f) {
      // wait a bit
      autowait(_pTimer->TickQuantum);
    }
    // disable auto speed
    m_fAutoSpeed = 0.0f;

    CPlayerAnimator &plan = (CPlayerAnimator&)*m_penAnimator;
    plan.BodyStillAnimation();
    StartModelAnim(PLAYER_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);

    // stop moving
    ForceFullStop();

    // return to auto-action loop
    return EReturn();
  }

  // auto action - use an item
  AutoUseItem(EVoid)
  {

    // start pulling the item
    CPlayerAnimator &plan = (CPlayerAnimator&)*m_penAnimator;
    plan.BodyPullItemAnimation();
    //StartModelAnim(PLAYER_ANIM_STATUE_PULL, 0);

    autowait(0.2f);

    // item appears
    CPlayerActionMarker *ppam = GetActionMarker();
    if (IsOfClass(ppam->m_penItem, "KeyItem")) {
      CModelObject &moItem = ppam->m_penItem->GetModelObject()->GetAttachmentModel(0)->amo_moModelObject;
      GetPlayerAnimator()->SetItem(&moItem);
    }

    autowait(2.20f-0.2f);

    // the item is in place
    CPlayerAnimator &plan = (CPlayerAnimator&)*m_penAnimator;
    plan.BodyRemoveItem();
    // if marker points to a trigger
    if (GetActionMarker()->m_penTrigger!=NULL) {
      // trigger it
      SendToTarget(GetActionMarker()->m_penTrigger, EET_TRIGGER, this);
    }

    // fake that player has passed through the door controller
    if (GetActionMarker()->m_penDoorController!=NULL) {
      EPass ePass;
      ePass.penOther = this;
      GetActionMarker()->m_penDoorController->SendEvent(ePass);
    }
    
    autowait(3.25f-2.20f);

    CPlayerAnimator &plan = (CPlayerAnimator&)*m_penAnimator;
    plan.BodyRemoveItem();

    // return to auto-action loop
    return EReturn();
  }

  // auto action - pick an item
  AutoPickItem(EVoid)
  {

    // start pulling the item
    CPlayerAnimator &plan = (CPlayerAnimator&)*m_penAnimator;
    plan.BodyPickItemAnimation();
    StartModelAnim(PLAYER_ANIM_KEYLIFT, 0);

    autowait(1.2f);

    // if marker points to a trigger
    if (GetActionMarker()->m_penTrigger!=NULL) {
      // trigger it
      SendToTarget(GetActionMarker()->m_penTrigger, EET_TRIGGER, this);
    }

    // item appears
    CPlayerActionMarker *ppam = GetActionMarker();
    if (IsOfClass(ppam->m_penItem, "KeyItem")) {
      CModelObject &moItem = ppam->m_penItem->GetModelObject()->GetAttachmentModel(0)->amo_moModelObject;
      GetPlayerAnimator()->SetItem(&moItem);
      EPass ePass;
      ePass.penOther = this;
      ppam->m_penItem->SendEvent(ePass);
    }

    autowait(3.6f-1.2f+GetActionMarker()->m_tmWait);

    CPlayerAnimator &plan = (CPlayerAnimator&)*m_penAnimator;
    plan.BodyRemoveItem();

    // return to auto-action loop
    return EReturn();
  }

  AutoFallDown(EVoid)
  {
    StartModelAnim(PLAYER_ANIM_BRIDGEFALLPOSE, 0);
    CModelObject &moBody = GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject;
    moBody.PlayAnim(BODY_ANIM_BRIDGEFALLPOSE, 0);

    autowait(GetActionMarker()->m_tmWait);

    // return to auto-action loop
    return EReturn();
  }

  AutoFallToAbys(EVoid)
  {
    StartModelAnim(PLAYER_ANIM_ABYSSFALL, AOF_LOOPING);
    CModelObject &moBody = GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject;
    moBody.PlayAnim(BODY_ANIM_ABYSSFALL, AOF_LOOPING);

    autowait(GetActionMarker()->m_tmWait);

    // return to auto-action loop
    return EReturn();
  }

  // auto action - look around
  AutoLookAround(EVoid)
  {
    StartModelAnim(PLAYER_ANIM_BACKPEDAL, 0);
    m_vAutoSpeed = FLOAT3D(0,0,plr_fSpeedForward/4/0.75f);
    CModelObject &moBody = GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject;
    moBody.PlayAnim(BODY_ANIM_NORMALWALK, 0);

    autowait(GetModelObject()->GetCurrentAnimLength()/2);

    m_vAutoSpeed = FLOAT3D(0,0,0);
 
    // start looking around
    StartModelAnim(PLAYER_ANIM_STAND, 0);
    CModelObject &moBody = GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject;
    moBody.PlayAnim(BODY_ANIM_LOOKAROUND, 0);
    CPlayerAnimator &plan = (CPlayerAnimator&)*m_penAnimator;

    // wait given time
    autowait(moBody.GetCurrentAnimLength()+0.1f);

    // return to auto-action loop
    return EReturn();
  }

  AutoTeleport(EVoid)
  {
    // teleport there
    TeleportToAutoMarker(GetActionMarker());

    // return to auto-action loop
    return EReturn();
  }

  AutoAppear(EVoid)
  {
    // hide the model
    SwitchToEditorModel();

    // put it at marker
    Teleport(GetActionMarker()->GetPlacement());
    // make it rotate in spawnpose
    SetPhysicsFlags(GetPhysicsFlags() & ~(EPF_TRANSLATEDBYGRAVITY|EPF_ORIENTEDBYGRAVITY));
    m_ulFlags|=PLF_AUTOMOVEMENTS;
    SetDesiredRotation(ANGLE3D(60,0,0));
    StartModelAnim(PLAYER_ANIM_SPAWNPOSE, AOF_LOOPING);
    CModelObject &moBody = GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject;
    moBody.PlayAnim(BODY_ANIM_SPAWNPOSE, AOF_LOOPING);

    // start stardust appearing
    m_tmSpiritStart = _pTimer->CurrentTick();
    // wait till it appears
    autowait(5);

    // start model appearing
    SwitchToModel();
    m_tmFadeStart = _pTimer->CurrentTick();
    // wait till it appears
    autowait(5);
    // fixate full opacity
    COLOR colAlpha = GetModelObject()->mo_colBlendColor;
    GetModelObject()->mo_colBlendColor = colAlpha|0xFF;

    // put it to normal state
    SetPhysicsFlags(GetPhysicsFlags() | EPF_TRANSLATEDBYGRAVITY|EPF_ORIENTEDBYGRAVITY);
    SetDesiredRotation(ANGLE3D(0,0,0));
    m_ulFlags&=~PLF_AUTOMOVEMENTS;

    // play animation to fall down
    StartModelAnim(PLAYER_ANIM_SPAWN_FALLDOWN, 0);
    CModelObject &moBody = GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject;
    moBody.PlayAnim(BODY_ANIM_SPAWN_FALLDOWN, 0);

    autowait(GetModelObject()->GetCurrentAnimLength());

    // play animation to get up
    StartModelAnim(PLAYER_ANIM_SPAWN_GETUP, AOF_SMOOTHCHANGE);
    CModelObject &moBody = GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject;
    moBody.PlayAnim(BODY_ANIM_SPAWN_GETUP, AOF_SMOOTHCHANGE);

    autowait(GetModelObject()->GetCurrentAnimLength());

    // return to auto-action loop
    return EReturn();
  }

  TravellingInBeam()
  {
    // put it at marker
    Teleport(GetActionMarker()->GetPlacement());
    // make it rotate in spawnpose
    SetPhysicsFlags(GetPhysicsFlags() & ~(EPF_TRANSLATEDBYGRAVITY|EPF_ORIENTEDBYGRAVITY));
    m_ulFlags|=PLF_AUTOMOVEMENTS;
    SetDesiredRotation(ANGLE3D(60,0,0));
    SetDesiredTranslation(ANGLE3D(0,20.0f,0));
    StartModelAnim(PLAYER_ANIM_SPAWNPOSE, AOF_LOOPING);
    CModelObject &moBody = GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject;
    moBody.PlayAnim(BODY_ANIM_SPAWNPOSE, AOF_LOOPING);
    // wait till it appears
    autowait(8.0f);
    // switch to model
    SwitchToEditorModel();
    // return to auto-action loop
    return EReturn();
  }
  
  LogoFireMinigun(EVoid) 
  {
    // put it at marker
    CPlacement3D pl = GetActionMarker()->GetPlacement();
    pl.pl_PositionVector += FLOAT3D(0, 0.01f, 0)*GetActionMarker()->en_mRotation;
    Teleport(pl);
    en_plViewpoint.pl_OrientationAngle(1) = 20.0f;
    en_plLastViewpoint.pl_OrientationAngle = en_plViewpoint.pl_OrientationAngle;

    // stand in pose
    StartModelAnim(PLAYER_ANIM_INTRO, AOF_LOOPING);
    // remember time for rotating view start
    m_tmMinigunAutoFireStart = _pTimer->CurrentTick();
    // wait some time for fade in and to look from left to right with out firing
    //autowait(0.75f);
    ((CPlayerWeapons&)*m_penWeapons).SendEvent(EFireWeapon());
    autowait(2.5f);
    ((CPlayerWeapons&)*m_penWeapons).SendEvent(EReleaseWeapon());

    // stop minigun shaking
    CModelObject &moBody = GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject;
    moBody.PlayAnim(BODY_ANIM_MINIGUN_STAND, 0);

    autowait(0.5f);

    // ---------- Apply shake
    CWorldSettingsController *pwsc = NULL;
    // obtain bcg viewer
    CBackgroundViewer *penBcgViewer = (CBackgroundViewer *) GetWorld()->GetBackgroundViewer();
    if( penBcgViewer != NULL)
    {
      pwsc = (CWorldSettingsController *) &*penBcgViewer->m_penWorldSettingsController;
      pwsc->m_tmShakeStarted = _pTimer->CurrentTick();
      pwsc->m_vShakePos = GetPlacement().pl_PositionVector;
      pwsc->m_fShakeFalloff = 250.0f;
      pwsc->m_fShakeFade = 3.0f;

      pwsc->m_fShakeIntensityZ = 0.1f*2.0f;
      pwsc->m_tmShakeFrequencyZ = 5.0f;
      pwsc->m_fShakeIntensityY = 0.0f;
      pwsc->m_fShakeIntensityB = 0.0f;

      pwsc->m_bShakeFadeIn = FALSE;

      /*
      pwsc->m_fShakeIntensityY = 0.1f*2.0f;
      pwsc->m_tmShakeFrequencyY = 5.0f;
      pwsc->m_fShakeIntensityB = 2.5f*1.5f;
      pwsc->m_tmShakeFrequencyB = 7.2f;
      */
    }

    // stop rotating body
    m_tmMinigunAutoFireStart = -1;
    autowait(5.0f);
    IFeel_StopEffect(NULL);
    autowait(5.0f);

    return EReturn();
  }

  AutoStoreWeapon(EVoid) 
  {
    // store current weapon slowly
    CPlayerAnimator &plan = (CPlayerAnimator&)*m_penAnimator;
    plan.BodyAnimationTemplate(BODY_ANIM_WAIT, 
      BODY_ANIM_COLT_REDRAWSLOW, BODY_ANIM_SHOTGUN_REDRAWSLOW, BODY_ANIM_MINIGUN_REDRAWSLOW, 
      0);
    autowait(plan.m_fBodyAnimTime);

    m_iAutoOrgWeapon = ((CPlayerWeapons&)*m_penWeapons).m_iCurrentWeapon;  
    ((CPlayerWeapons&)*m_penWeapons).m_iCurrentWeapon = WEAPON_NONE;
    ((CPlayerWeapons&)*m_penWeapons).m_iWantedWeapon = WEAPON_NONE;
    m_soWeaponAmbient.Stop();

    // sync apperances
    GetPlayerAnimator()->SyncWeapon();
    // remove weapon attachment
    CPlayerAnimator &plan = (CPlayerAnimator&)*m_penAnimator;
    plan.m_iWeaponLast = m_iAutoOrgWeapon;
    plan.RemoveWeapon();
    GetPlayerAnimator()->SyncWeapon();

    ((CPlayerWeapons&)*m_penWeapons).m_iCurrentWeapon = (WeaponType) m_iAutoOrgWeapon;
    plan.BodyAnimationTemplate(BODY_ANIM_WAIT, BODY_ANIM_COLT_DEACTIVATETOWALK,
      BODY_ANIM_SHOTGUN_DEACTIVATETOWALK, BODY_ANIM_MINIGUN_DEACTIVATETOWALK, AOF_SMOOTHCHANGE);
    ((CPlayerWeapons&)*m_penWeapons).m_iCurrentWeapon = WEAPON_NONE;

    autowait(plan.m_fBodyAnimTime);

    // return to auto-action loop
    return EReturn();
  }

  // perform player auto actions
  DoAutoActions(EVoid)
  {
    // don't look up/down
    en_plViewpoint.pl_OrientationAngle = ANGLE3D(0,0,0);
    // disable playeranimator animating
    CPlayerAnimator &plan = (CPlayerAnimator&)*m_penAnimator;
    plan.m_bDisableAnimating = TRUE;

    // while there is some marker
    while (m_penActionMarker!=NULL && IsOfClass(m_penActionMarker, "PlayerActionMarker")) {

      // if should wait
      if (GetActionMarker()->m_paaAction==PAA_WAIT) {
        // play still anim
        CModelObject &moBody = GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject;
        moBody.PlayAnim(BODY_ANIM_WAIT, AOF_NORESTART|AOF_LOOPING);
        // wait given time
        autowait(GetActionMarker()->m_tmWait);
      } else if (GetActionMarker()->m_paaAction==PAA_STOPANDWAIT) {
        // play still anim
        StartModelAnim(PLAYER_ANIM_STAND, 0);
        CModelObject &moBody = GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject;
        moBody.PlayAnim(BODY_ANIM_WAIT, AOF_NORESTART|AOF_LOOPING);
        // wait given time
        autowait(GetActionMarker()->m_tmWait);

      // if should teleport here
      } else if (GetActionMarker()->m_paaAction==PAA_APPEARING) {
        autocall AutoAppear() EReturn;
      } else if (GetActionMarker()->m_paaAction==PAA_TRAVELING_IN_BEAM) {
        autocall TravellingInBeam() EReturn;
      } else if (GetActionMarker()->m_paaAction==PAA_INTROSE_SELECT_WEAPON) {
        // order playerweapons to select weapon
        ESelectWeapon eSelect;
        eSelect.iWeapon = 1;
        ((CPlayerWeapons&)*m_penWeapons).SendEvent(eSelect);
      } else if (GetActionMarker()->m_paaAction==PAA_LOGO_FIRE_INTROSE) {
        autocall LogoFireMinigun() EReturn;
      } else if (GetActionMarker()->m_paaAction==PAA_LOGO_FIRE_MINIGUN) {
        autocall LogoFireMinigun() EReturn;
      // if should appear here
      } else if (GetActionMarker()->m_paaAction==PAA_TELEPORT) {
        autocall AutoTeleport() EReturn;

      // if should wait for trigger
      } else if (GetActionMarker()->m_paaAction==PAA_WAITFOREVER) {
        // wait forever
        wait() {
          on (EBegin) : { resume; }
          otherwise() : { pass; }
        }
      // if should store weapon
      } else if (GetActionMarker()->m_paaAction==PAA_STOREWEAPON) {
        autocall AutoStoreWeapon() EReturn;
      
      // if should draw weapon
      } else if (GetActionMarker()->m_paaAction==PAA_DRAWWEAPON) {
        // order playerweapons to select best weapon
        ESelectWeapon eSelect;
        eSelect.iWeapon = -4;
        ((CPlayerWeapons&)*m_penWeapons).SendEvent(eSelect);

      // if should wait
      } else if (GetActionMarker()->m_paaAction==PAA_LOOKAROUND) {
        autocall AutoLookAround() EReturn;

      // if should use item
      } else if (GetActionMarker()->m_paaAction==PAA_USEITEM) {
        // use it
        autocall AutoUseItem() EReturn;

      // if should pick item
      } else if (GetActionMarker()->m_paaAction==PAA_PICKITEM) {
        // pick it
        autocall AutoPickItem() EReturn;

      // if falling from bridge
      } else if (GetActionMarker()->m_paaAction==PAA_FALLDOWN) {
        // fall
        autocall AutoFallDown() EReturn;

      // if releasing player
      } else if (GetActionMarker()->m_paaAction==PAA_RELEASEPLAYER) {
        if (m_penCamera!=NULL) {
          ((CCamera*)&*m_penCamera)->m_bStopMoving=TRUE;
        }
        m_penCamera = NULL;
        // if currently not having any weapon in hand
        if (GetPlayerWeapons()->m_iCurrentWeapon == WEAPON_NONE) {
          // order playerweapons to select best weapon
          ESelectWeapon eSelect;
          eSelect.iWeapon = -4;
          ((CPlayerWeapons&)*m_penWeapons).SendEvent(eSelect);
        }
        // sync weapon, just in case
        m_ulFlags |= PLF_SYNCWEAPON;
        m_tmSpiritStart = 0;

      // if start introscroll
      } else if (GetActionMarker()->m_paaAction==PAA_STARTINTROSCROLL) {
        _pShell->Execute("sam_iStartCredits=1;");

      // if start credits
      } else if (GetActionMarker()->m_paaAction==PAA_STARTCREDITS) {
        _pShell->Execute("sam_iStartCredits=2;");

      // if stop scroller
      } else if (GetActionMarker()->m_paaAction==PAA_STOPSCROLLER) {
        _pShell->Execute("sam_iStartCredits=-1;");

      // if should run to the marker
      } else if (GetActionMarker()->m_paaAction==PAA_RUN) {
        // go to it
        m_fAutoSpeed = plr_fSpeedForward*GetActionMarker()->m_fSpeed;                                             
        autocall AutoGoToMarker() EReturn;

      // if should run to the marker and stop exactly there
      } else if (GetActionMarker()->m_paaAction==PAA_RUNANDSTOP) {
        // go to it
        m_fAutoSpeed = plr_fSpeedForward*GetActionMarker()->m_fSpeed;                                             
        autocall AutoGoToMarkerAndStop() EReturn;

      // if end of entire game
      } else if (GetActionMarker()->m_paaAction==PAA_ENDOFGAME) {

        // record stats
        jump TheEnd();
      } else if (GetActionMarker()->m_paaAction==PAA_NOGRAVITY) {
        SetPhysicsFlags(GetPhysicsFlags() & ~(EPF_TRANSLATEDBYGRAVITY|EPF_ORIENTEDBYGRAVITY));
        if( GetActionMarker()->GetParent() != NULL)
        {
          SetParent(GetActionMarker()->GetParent());
        }
      } else if (GetActionMarker()->m_paaAction==PAA_TURNONGRAVITY) {
        SetPhysicsFlags(GetPhysicsFlags()|EPF_TRANSLATEDBYGRAVITY|EPF_ORIENTEDBYGRAVITY);
        SetParent(NULL);
      }
      else if (TRUE) {
        ASSERT(FALSE);
      }

      // if marker points to a trigger
      if (GetActionMarker()->m_penTrigger!=NULL &&
          GetActionMarker()->m_paaAction!=PAA_PICKITEM) {
        // trigger it
        SendToTarget(GetActionMarker()->m_penTrigger, EET_TRIGGER, this);
      }

      // get next marker
      m_penActionMarker = GetActionMarker()->m_penTarget;
    }
    
    // disable auto speed
    m_fAutoSpeed = 0.0f;

    // must clear marker, in case it was invalid
    m_penActionMarker = NULL;

    // enable playeranimator animating
    CPlayerAnimator &plan = (CPlayerAnimator&)*m_penAnimator;
    plan.m_bDisableAnimating = FALSE;

    // return to main loop
    return EVoid();
  }
/************************************************************
 *                        M  A  I  N                        *
 ************************************************************/
  Main(EVoid evoid)
  {
    // remember start time
    time((time_t*)&m_iStartTime);

    SetFlags(GetFlags()|ENF_CROSSESLEVELS|ENF_NOTIFYLEVELCHANGE);
    InitAsEditorModel();

    // set default model for physics etc
    CTString strDummy;
    SetPlayerAppearance(GetModelObject(), NULL, strDummy, /*bPreview=*/FALSE);
    // set your real appearance if possible
    ValidateCharacter();
    SetPlayerAppearance(&m_moRender, &en_pcCharacter, strDummy, /*bPreview=*/FALSE);
    ParseGender(strDummy);

    // if unsuccessful
    if (GetModelObject()->GetData()==NULL) {
      // never proceed with initialization - player cannot work
      return;
    }

    //const FLOAT fSize = 2.1f/1.85f;
    //GetModelObject()->StretchModel(FLOAT3D(fSize, fSize, fSize));
    ModelChangeNotify();

    // wait a bit to allow other entities to start
    wait(0.2f) { // this is 4 ticks, it has to be at least more than musicchanger for enemy counting
      on (EBegin) : { resume; }
      on (ETimer) : { stop; }
      on (EDisconnected) : { 
        Destroy(); 
        return;
      }
    }

    // do not use predictor if not yet initialized
    if (IsPredictor()) { // !!!!####
      Destroy();
      return;
    }

    // appear
    SwitchToModel();
    m_ulFlags|=PLF_INITIALIZED;

    // set initial vars
    en_tmMaxHoldBreath = 60.0f;
    en_fDensity = 1000.0f;    // same density as water - to be able to dive freely

    ModelChangeNotify();

    // spawn weapons
    m_penWeapons = CreateEntity(GetPlacement(), CLASS_PLAYER_WEAPONS);
    EWeaponsInit eInitWeapons;
    eInitWeapons.penOwner = this;
    m_penWeapons->Initialize(eInitWeapons);

    // spawn animator
    m_penAnimator = CreateEntity(GetPlacement(), CLASS_PLAYER_ANIMATOR);
    EAnimatorInit eInitAnimator;
    eInitAnimator.penPlayer = this;
    m_penAnimator->Initialize(eInitAnimator);

    // set sound default parameters
    m_soMouth.Set3DParameters(50.0f, 10.0f, 1.0f, 1.0f);
    m_soFootL.Set3DParameters(20.0f, 2.0f, 1.0f, 1.0f);
    m_soFootR.Set3DParameters(20.0f, 2.0f, 1.0f, 1.0f);
    m_soBody.Set3DParameters(25.0f, 5.0f, 1.0f, 1.0f);
    m_soMessage.Set3DParameters(25.0f, 5.0f, 1.0f, 1.0f);
    m_soSniperZoom.Set3DParameters(25.0f, 5.0f, 1.0f, 1.0f);
      
    // setup light source
    SetupLightSource();

    // set light animation if available
    try {
      m_aoLightAnimation.SetData_t(CTFILENAME("Animations\\BasicEffects.ani"));
    } catch (char *strError) {
      WarningMessage(TRANS("Cannot load Animations\\BasicEffects.ani: %s"), strError);
    }
    PlayLightAnim(LIGHT_ANIM_NONE, 0);

    wait() {
      on (EBegin) : { call FirstInit(); }
      on (ERebirth) : { call Rebirth(); }
      on (EDeath eDeath) : { call Death(eDeath); }
      on (EDamage eDamage) : { call Wounded(eDamage); }
      on (EPreLevelChange) : { 
        m_ulFlags&=~PLF_INITIALIZED; 
        m_ulFlags|=PLF_CHANGINGLEVEL;
        m_ulFlags &= ~PLF_LEVELSTARTED;
        resume; 
      }
      on (EPostLevelChange) : {
        if (GetSP()->sp_bSinglePlayer || (GetFlags()&ENF_ALIVE)) {
          call WorldChange(); 
        } else {
          call WorldChangeDead(); 
        }
      }
      on (ETakingBreath eTakingBreath ) : {
        SetDefaultMouthPitch();
        resume;
      }
      on (ECameraStart eStart) : {
        m_penCamera = eStart.penCamera;
        // stop player
        if (m_penActionMarker==NULL) {
          SetDesiredTranslation(FLOAT3D(0.0f, 0.0f, 0.0f));
          SetDesiredRotation(ANGLE3D(0.0f, 0.0f, 0.0f));
        }
        // stop firing
        ((CPlayerWeapons&)*m_penWeapons).SendEvent(EReleaseWeapon());
        resume;
      }
      on (ECameraStop eCameraStop) : {
        if (m_penCamera==eCameraStop.penCamera) {
          m_penCamera = NULL;
        }
        resume;
      }
      on (ECenterMessage eMsg) : {
        m_strCenterMessage = eMsg.strMessage;
        m_tmCenterMessageEnd = _pTimer->CurrentTick()+eMsg.tmLength;
        if (eMsg.mssSound==MSS_INFO) {
          m_soMessage.Set3DParameters(25.0f, 5.0f, 1.0f, 1.0f);
          PlaySound(m_soMessage, SOUND_INFO, SOF_3D|SOF_VOLUMETRIC|SOF_LOCAL);
        } else if (eMsg.mssSound==MSS_SECRET) {
          m_soMessage.Set3DParameters(25.0f, 5.0f, 1.0f, 1.0f);
          PlaySound(m_soMessage, SOUND_SECRET, SOF_3D|SOF_VOLUMETRIC|SOF_LOCAL);
        }
        m_mfFont = eMsg.mfFont;
        m_fMessagePosX = eMsg.fMessagePositionX;
        m_fMessagePosY = eMsg.fMessagePositionY;
        resume;
      }
      on (EVoiceMessage eMsg) : {
        SayVoiceMessage(eMsg.fnmMessage);
        resume;
      }
      on (EAutoAction eAutoAction) : {
        // remember first marker
        m_penActionMarker = eAutoAction.penFirstMarker;
        // do the actions
        call DoAutoActions();
      }
      on (EReceiveScore eScore) : {
        m_psLevelStats.ps_iScore += eScore.iPoints;
        m_psGameStats.ps_iScore += eScore.iPoints;
        m_iMana  += eScore.iPoints*GetSP()->sp_fManaTransferFactor;
        CheckHighScore();
        resume;
      }
      on (EKilledEnemy) : {
        m_psLevelStats.ps_iKills += 1;
        m_psGameStats.ps_iKills += 1;
        resume;
      }
      on (ESecretFound) : {
        m_psLevelStats.ps_iSecrets += 1;
        m_psGameStats.ps_iSecrets += 1;
        resume;
      }
      on (EWeaponChanged) : {
        // make sure we discontinue zooming (even if not changing from sniper)
        m_ulFlags&=~PLF_ISZOOMING;      
        if(_pNetwork->IsPlayerLocal(this)) {IFeel_StopEffect("SniperZoom");}
        resume;
      }
      // EEnd should not arrive here
      on (EEnd) : {
        ASSERT(FALSE);
        resume;
      }
      // if player is disconnected
      on (EDisconnected) : {
        // exit the loop
        stop;
      }
      // support for jumping using bouncers
      on (ETouch eTouch) : {
        if (IsOfClass(eTouch.penOther, "Bouncer")) {
          JumpFromBouncer(this, eTouch.penOther);
          // play jump sound
          SetDefaultMouthPitch();
          PlaySound(m_soMouth, SOUND_JUMP, SOF_3D);
          if(_pNetwork->IsPlayerLocal(this)) {IFeel_PlayEffect("Jump");}
        }
        resume;
      }
    }

    // we get here if the player is disconnected from the server

    // if we have some keys
    if (!IsPredictor() && m_ulKeys!=0) {
      // find first live player
      CPlayer *penNextPlayer = NULL;
      for(INDEX iPlayer=0; iPlayer<GetMaxPlayers(); iPlayer++) {
        CPlayer *pen = (CPlayer*)&*GetPlayerEntity(iPlayer);
        if (pen!=NULL && pen!=this && (pen->GetFlags()&ENF_ALIVE) && !(pen->GetFlags()&ENF_DELETED) ) {
          penNextPlayer = pen;
        }
      }

      // if any found
      if (penNextPlayer!=NULL) {
        // transfer keys to that player
        CPrintF(TRANS("%s leaving, all keys transfered to %s\n"), 
          (const char*)m_strName, (const char*)penNextPlayer->GetPlayerName());
        penNextPlayer->m_ulKeys |= m_ulKeys;
      }
    }

    // if we have some puzzle items
    if (!IsPredictor() && m_ulPuzzleItems!=0) {
      // find first live player
      CPlayer *penNextPlayer = NULL;
      for(INDEX iPlayer=0; iPlayer<GetMaxPlayers(); iPlayer++) {
        CPlayer *pen = (CPlayer*)&*GetPlayerEntity(iPlayer);
        if (pen!=NULL && pen!=this && (pen->GetFlags()&ENF_ALIVE) && !(pen->GetFlags()&ENF_DELETED) ) {
          penNextPlayer = pen;
        }
      }

      // if any found
      if (penNextPlayer!=NULL) {
        // transfer puzzle items to that player
        CPrintF(TRANS("%s leaving, all puzzle items transfered to %s\n"), 
          (const char*)m_strName, (const char*)penNextPlayer->GetPlayerName());
        penNextPlayer->m_ulPuzzleItems |= m_ulPuzzleItems;
      }
    }

    // spawn teleport effect
    SpawnTeleport();

    // cease to exist
    m_penWeapons->Destroy();
    m_penAnimator->Destroy();
    if (m_penView!=NULL) {
      m_penView->Destroy();
    }
    if (m_pen3rdPersonView!=NULL) {
      m_pen3rdPersonView->Destroy();
    }
    Destroy();
    return;
  };
};
