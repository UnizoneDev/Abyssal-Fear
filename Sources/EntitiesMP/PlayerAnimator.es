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

406
%{
#include "StdH.h"

#include "Models/Player/Uni/Player.h"
#include "Models/Player/Uni/Body.h"
#include "Models/Player/Uni/Head.h"

#include "Models/Weapons/Knife/KnifeWeapon.h"
#include "Models/Weapons/Axe/AxeWeapon.h"
#include "Models/Weapons/Pistol/PistolItem.h"
#include "Models/Weapons/Shotgun/ShotgunItem.h"
#include "Models/Weapons/SMG/SMGItem.h"
#include "Models/Weapons/MetalPipe/PipeWeapon.h"
#include "Models/Weapons/StrongPistol/StrongPistolItem.h"
%}

uses "EntitiesMP/Player";
uses "EntitiesMP/PlayerWeapons";

// input parameter for animator
event EAnimatorInit {
  CEntityPointer penPlayer,            // player owns it
};

%{
// animator action
enum AnimatorAction {
  AA_JUMPDOWN = 0,
  AA_CROUCH,
  AA_RISE,
  AA_PULLWEAPON,
  AA_ATTACK,
};

// fire flare specific
#define FLARE_NONE 0
#define FLARE_REMOVE 1
#define FLARE_ADD 2


extern FLOAT plr_fBreathingStrength;
extern FLOAT plr_fViewDampFactor;
extern FLOAT plr_fViewDampLimitGroundUp;
extern FLOAT plr_fViewDampLimitGroundDn;
extern FLOAT plr_fViewDampLimitWater;
extern FLOAT wpn_fRecoilSpeed[17];
extern FLOAT wpn_fRecoilLimit[17];
extern FLOAT wpn_fRecoilDampUp[17];
extern FLOAT wpn_fRecoilDampDn[17];
extern FLOAT wpn_fRecoilOffset[17];
extern FLOAT wpn_fRecoilFactorP[17];
extern FLOAT wpn_fRecoilFactorZ[17];


void CPlayerAnimator_Precache(ULONG ulAvailable)
{
  CDLLEntityClass *pdec = &CPlayerAnimator_DLLClass;

  pdec->PrecacheTexture(TEX_REFL_BWRIPLES01      );
  pdec->PrecacheTexture(TEX_REFL_BWRIPLES02      );
  pdec->PrecacheTexture(TEX_REFL_LIGHTMETAL01    );
  pdec->PrecacheTexture(TEX_REFL_LIGHTBLUEMETAL01);
  pdec->PrecacheTexture(TEX_REFL_DARKMETAL       );
  pdec->PrecacheTexture(TEX_REFL_PURPLE01        );
  pdec->PrecacheTexture(TEX_SPEC_WEAK            );
  pdec->PrecacheTexture(TEX_SPEC_MEDIUM          );
  pdec->PrecacheTexture(TEX_SPEC_STRONG          );
  pdec->PrecacheModel(MODEL_FLARE02);
  pdec->PrecacheTexture(TEXTURE_FLARE02);
  pdec->PrecacheModel(MODEL_GOLDSWASTIKA);
  pdec->PrecacheTexture(TEXTURE_GOLDSWASTIKA);
  pdec->PrecacheTexture(TEX_REFL_GOLD01);
  pdec->PrecacheClass(CLASS_REMINDER);

  // precache shells that drop when firing
  extern void CPlayerWeaponsEffects_Precache(void);
  CPlayerWeaponsEffects_Precache();

  // precache weapons player has
  if ( ulAvailable&(1<<(WEAPON_KNIFE-1)) ) {
    pdec->PrecacheModel(MODEL_KNIFE                 );
    pdec->PrecacheTexture(TEXTURE_KNIFE);
  }

  if ( ulAvailable&(1<<(WEAPON_AXE-1)) ) {
    pdec->PrecacheModel(MODEL_AXE                 );
  }

  if ( ulAvailable&(1<<(WEAPON_PISTOL-1)) ) {
    pdec->PrecacheModel(MODEL_PISTOLITEM                );
    pdec->PrecacheTexture(TEXTURE_PISTOLITEM            );
  }
  if ( ulAvailable&(1<<(WEAPON_SHOTGUN-1)) ) {
    pdec->PrecacheModel(MODEL_SHOTGUNITEM                );
    pdec->PrecacheTexture(TEXTURE_SHOTGUNITEM            );
  }
  if ( ulAvailable&(1<<(WEAPON_SMG-1)) ) {
    pdec->PrecacheModel(MODEL_SMGITEM                );
    pdec->PrecacheTexture(TEXTURE_SMGITEM            );
  }

  // precache weapons player has
  if ( ulAvailable&(1<<(WEAPON_PIPE-1)) ) {
    pdec->PrecacheModel(MODEL_PIPE                 );
    pdec->PrecacheTexture(TEXTURE_PIPE);
  }

  if ( ulAvailable&(1<<(WEAPON_STRONGPISTOL-1)) ) {
    pdec->PrecacheModel(MODEL_STRONGPISTOLITEM                );
    pdec->PrecacheTexture(TEXTURE_STRONGPISTOLITEM            );
  }
}
%}

class export CPlayerAnimator: CRationalEntity {
name      "Player Animator";
thumbnail "";
features "CanBePredictable";

properties:
  1 CEntityPointer m_penPlayer,               // player which owns it

  5 BOOL m_bReference=FALSE,                  // player has reference (floor)
  6 FLOAT m_fLastActionTime = 0.0f,           // last action time for boring weapon animations
  7 INDEX m_iContent = 0,                     // content type index
  8 BOOL m_bWaitJumpAnim = FALSE,             // wait legs anim (for jump end)
  9 BOOL m_bCrouch = FALSE,                   // player crouch state
 10 BOOL m_iCrouchDownWait = FALSE,           // wait for crouch down
 11 BOOL m_iRiseUpWait = FALSE,               // wait for rise up
 12 BOOL m_bChangeWeapon = FALSE,             // wait for weapon change
 13 BOOL m_bSwim = FALSE,                     // player in water
 14 INDEX m_iFlare = FLARE_REMOVE,            // 0-none, 1-remove, 2-add
 15 INDEX m_iSecondFlare = FLARE_REMOVE,      // 0-none, 1-remove, 2-add
 16 BOOL m_bAttacking = FALSE,                // currently firing weapon/swinging knife
 19 FLOAT m_tmAttackingDue = -1.0f,           // when firing animation is due
 17 FLOAT m_tmFlareAdded = -1.0f,             // for better flare add/remove
 18 BOOL m_bDisableAnimating = FALSE,

// player soft eyes on Y axis
 20 FLOAT3D m_vLastPlayerPosition = FLOAT3D(0,0,0), // last player position for eyes movement
 21 FLOAT m_fEyesYLastOffset = 0.0f,                 // eyes offset from player position
 22 FLOAT m_fEyesYOffset = 0.0f,
 23 FLOAT m_fEyesYSpeed = 0.0f,                      // eyes speed
 27 FLOAT m_fWeaponYLastOffset = 0.0f,                 // eyes offset from player position
 28 FLOAT m_fWeaponYOffset = 0.0f,
 29 FLOAT m_fWeaponYSpeed = 0.0f,                      // eyes speed
 // recoil pitch
// 24 FLOAT m_fRecoilLastOffset = 0.0f,   // eyes offset from player position
// 25 FLOAT m_fRecoilOffset = 0.0f,
// 26 FLOAT m_fRecoilSpeed = 0.0f,        // eyes speed

// player banking when moving
 30 BOOL m_bMoving = FALSE,
 31 FLOAT m_fMoveLastBanking = 0.0f,
 32 FLOAT m_fMoveBanking = 0.0f,
 33 BOOL m_iMovingSide = 0,
 34 BOOL m_bSidestepBankingLeft = FALSE,
 35 BOOL m_bSidestepBankingRight = FALSE,
 36 FLOAT m_fSidestepLastBanking = 0.0f,
 37 FLOAT m_fSidestepBanking = 0.0f,
 38 INDEX m_iWeaponLast = -1,
 39 FLOAT m_fBodyAnimTime = -1.0f,

{
  CModelObject *pmoModel;
}

components:
  1 class   CLASS_REMINDER              "Classes\\Reminder.ecl",
// ************** KNIFE AND AXE **************
 20 model   MODEL_KNIFE                 "Models\\Weapons\\Knife\\KnifeWeapon.mdl",
 21 texture TEXTURE_KNIFE               "Models\\Weapons\\Knife\\KnifeWeapon.tex",
 22 model   MODEL_AXE                   "Models\\Weapons\\Axe\\AxeWeapon.mdl",
 
// ************** COLT **************
 30 model   MODEL_PISTOLITEM            "Models\\Weapons\\Pistol\\PistolItem.mdl",
 31 texture TEXTURE_PISTOLITEM          "Models\\Weapons\\Pistol\\Pistol.tex",

// ************** SHOTGUN **************
 40 model   MODEL_SHOTGUNITEM            "Models\\Weapons\\Shotgun\\ShotgunItem.mdl",
 41 texture TEXTURE_SHOTGUNITEM          "Models\\Weapons\\Shotgun\\Shotgun.tex",

// ************** SMG **************
 50 model   MODEL_SMGITEM            "Models\\Weapons\\SMG\\SMGItem.mdl",
 51 texture TEXTURE_SMGITEM          "Models\\Weapons\\SMG\\SMG.tex",

// ************** PIPE **************
 60 model   MODEL_PIPE                 "Models\\Weapons\\MetalPipe\\PipeWeapon.mdl",
 61 texture TEXTURE_PIPE               "Models\\Weapons\\MetalPipe\\PipeWeapon.tex",

// ************** COLT **************
 70 model   MODEL_STRONGPISTOLITEM            "Models\\Weapons\\StrongPistol\\StrongPistolItem.mdl",
 71 texture TEXTURE_STRONGPISTOLITEM          "Models\\Weapons\\StrongPistol\\StrongPistol.tex",

// ************** GOLDEN SWASTIKA **************
180 model   MODEL_GOLDSWASTIKA                "Models\\Items\\Keys\\GoldenSwastika\\Swastika.mdl",
181 texture TEXTURE_GOLDSWASTIKA              "Models\\Items\\Keys\\GoldenSwastika\\gold1.tex",

// ************** REFLECTIONS **************
200 texture TEX_REFL_BWRIPLES01         "Models\\ReflectionTextures\\BWRiples01.tex",
201 texture TEX_REFL_BWRIPLES02         "Models\\ReflectionTextures\\BWRiples02.tex",
202 texture TEX_REFL_LIGHTMETAL01       "Models\\ReflectionTextures\\LightMetal01.tex",
203 texture TEX_REFL_LIGHTBLUEMETAL01   "Models\\ReflectionTextures\\LightBlueMetal01.tex",
204 texture TEX_REFL_DARKMETAL          "Models\\ReflectionTextures\\DarkMetal.tex",
205 texture TEX_REFL_PURPLE01           "Models\\ReflectionTextures\\Purple01.tex",
206 texture TEX_REFL_GOLD01               "Models\\ReflectionTextures\\Gold01.tex",

// ************** SPECULAR **************
210 texture TEX_SPEC_WEAK               "Models\\SpecularTextures\\Weak.tex",
211 texture TEX_SPEC_MEDIUM             "Models\\SpecularTextures\\Medium.tex",
212 texture TEX_SPEC_STRONG             "Models\\SpecularTextures\\Strong.tex",

// ************** FLARES **************
250 model   MODEL_FLARE02               "Models\\Effects\\Weapons\\Flare02\\Flare.mdl",
251 texture TEXTURE_FLARE02             "Models\\Effects\\Weapons\\Flare02\\Flare.tex",


functions:
  
  /* Read from stream. */
  void Read_t( CTStream *istr) // throw char *
  { 
    CRationalEntity::Read_t(istr);
  }

  void Precache(void)
  {
    INDEX iAvailableWeapons = ((CPlayerWeapons&)*(((CPlayer&)*m_penPlayer).m_penWeapons)).m_iAvailableWeapons;
    CPlayerAnimator_Precache(iAvailableWeapons);
  }
  
  CPlayer *GetPlayer(void)
  {
    return ((CPlayer*)&*m_penPlayer);
  }
  CModelObject *GetBody(void)
  {
    CAttachmentModelObject *pamoBody = GetPlayer()->GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO);
    if (pamoBody==NULL) {
      return NULL;
    }
    return &pamoBody->amo_moModelObject;
  }
  CModelObject *GetBodyRen(void)
  {
    CAttachmentModelObject *pamoBody = GetPlayer()->m_moRender.GetAttachmentModel(PLAYER_ATTACHMENT_TORSO);
    if (pamoBody==NULL) {
      return NULL;
    }
    return &pamoBody->amo_moModelObject;
  }

  // Set components
  void SetComponents(CModelObject *mo, ULONG ulIDModel, ULONG ulIDTexture,
                     ULONG ulIDReflectionTexture, ULONG ulIDSpecularTexture, ULONG ulIDBumpTexture) {
    // model data
    mo->SetData(GetModelDataForComponent(ulIDModel));
    // texture data
    mo->mo_toTexture.SetData(GetTextureDataForComponent(ulIDTexture));
    // reflection texture data
    if (ulIDReflectionTexture>0) {
      mo->mo_toReflection.SetData(GetTextureDataForComponent(ulIDReflectionTexture));
    } else {
      mo->mo_toReflection.SetData(NULL);
    }
    // specular texture data
    if (ulIDSpecularTexture>0) {
      mo->mo_toSpecular.SetData(GetTextureDataForComponent(ulIDSpecularTexture));
    } else {
      mo->mo_toSpecular.SetData(NULL);
    }
    // bump texture data
    if (ulIDBumpTexture>0) {
      mo->mo_toBump.SetData(GetTextureDataForComponent(ulIDBumpTexture));
    } else {
      mo->mo_toBump.SetData(NULL);
    }
    ModelChangeNotify();
  };

  // Add attachment model
  void AddAttachmentModel(CModelObject *mo, INDEX iAttachment, ULONG ulIDModel, ULONG ulIDTexture,
                          ULONG ulIDReflectionTexture, ULONG ulIDSpecularTexture, ULONG ulIDBumpTexture) {
    SetComponents(&mo->AddAttachmentModel(iAttachment)->amo_moModelObject, ulIDModel, 
                  ulIDTexture, ulIDReflectionTexture, ulIDSpecularTexture, ulIDBumpTexture);
  };

  // Add weapon attachment
  void AddWeaponAttachment(INDEX iAttachment, ULONG ulIDModel, ULONG ulIDTexture,
                           ULONG ulIDReflectionTexture, ULONG ulIDSpecularTexture, ULONG ulIDBumpTexture) {
    AddAttachmentModel(pmoModel, iAttachment, ulIDModel, ulIDTexture,
                       ulIDReflectionTexture, ulIDSpecularTexture, ulIDBumpTexture);
  };

  // set active attachment (model)
  void SetAttachment(INDEX iAttachment) {
    pmoModel = &(pmoModel->GetAttachmentModel(iAttachment)->amo_moModelObject);
  };

  // synchronize any possible weapon attachment(s) with default appearance
  void SyncWeapon(void)
  {
    CModelObject *pmoBodyRen = GetBodyRen();
    CModelObject *pmoBodyDef = GetBody();
    // for each weapon attachment
    for (INDEX iWeapon = BODY_ATTACHMENT_PISTOL; iWeapon<=BODY_ATTACHMENT_STRONGPISTOL; iWeapon++) {
      CAttachmentModelObject *pamoWeapDef = pmoBodyDef->GetAttachmentModel(iWeapon);
      CAttachmentModelObject *pamoWeapRen = pmoBodyRen->GetAttachmentModel(iWeapon);
      // if it doesn't exist in either
      if (pamoWeapRen==NULL && pamoWeapDef==NULL) {
        // just skip it
        NOTHING;

      // if exists only in rendering model
      } else if (pamoWeapRen!=NULL && pamoWeapDef==NULL) {
        // remove it from rendering
        pmoBodyRen->RemoveAttachmentModel(iWeapon);

      // if exists only in default
      } else if (pamoWeapRen==NULL && pamoWeapDef!=NULL) {
        // add it to rendering
        pamoWeapRen = pmoBodyRen->AddAttachmentModel(iWeapon);
        pamoWeapRen->amo_plRelative = pamoWeapDef->amo_plRelative;
        pamoWeapRen->amo_moModelObject.Copy(pamoWeapDef->amo_moModelObject);

      // if exists in both
      } else {
        // just synchronize
        pamoWeapRen->amo_plRelative = pamoWeapDef->amo_plRelative;
        pamoWeapRen->amo_moModelObject.Synchronize(pamoWeapDef->amo_moModelObject);
      }
    }
  }

  // set weapon
  void SetWeapon(void) {
    INDEX iWeapon = ((CPlayerWeapons&)*(((CPlayer&)*m_penPlayer).m_penWeapons)).m_iCurrentWeapon;
    m_iWeaponLast = iWeapon;
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    pmoModel = &(pl.GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject);
    switch (iWeapon) {
    // *********** KNIFE ***********
      case WEAPON_HOLSTERED:
        break;

      case WEAPON_KNIFE:
        AddWeaponAttachment(BODY_ATTACHMENT_KNIFE, MODEL_KNIFE, TEXTURE_KNIFE, 0, 0, 0);
        break;
 
    // *********** GLOCK ***********
      case WEAPON_PISTOL:
        AddWeaponAttachment(BODY_ATTACHMENT_PISTOL, MODEL_PISTOLITEM, TEXTURE_PISTOLITEM, 0, 0, 0);
        break;

    // *********** AXE ***********
      case WEAPON_AXE:
        AddWeaponAttachment(BODY_ATTACHMENT_AXE, MODEL_AXE, TEXTURE_KNIFE, 0, 0, 0);
        break;

    // *********** SHOTGUN ***********
      case WEAPON_SHOTGUN:
        AddWeaponAttachment(BODY_ATTACHMENT_SHOTGUN, MODEL_SHOTGUNITEM, TEXTURE_SHOTGUNITEM, 0, 0, 0);
        break;

    // *********** MP5 ***********
      case WEAPON_SMG:
        AddWeaponAttachment(BODY_ATTACHMENT_SMG, MODEL_SMGITEM, TEXTURE_SMGITEM, 0, 0, 0);
        break;

    // *********** PIPE ***********
      case WEAPON_PIPE:
        AddWeaponAttachment(BODY_ATTACHMENT_PIPE, MODEL_PIPE, TEXTURE_PIPE, TEX_REFL_LIGHTMETAL01, TEX_SPEC_MEDIUM, 0);
        break;

    // *********** DESERT EAGLE ***********
      case WEAPON_STRONGPISTOL:
        AddWeaponAttachment(BODY_ATTACHMENT_STRONGPISTOL, MODEL_STRONGPISTOLITEM, TEXTURE_STRONGPISTOLITEM, 0, 0, 0);
        break;
      
      default:
        ASSERTALWAYS("Unknown weapon.");
    }
    // sync apperances
    SyncWeapon();
  };

  // set item
  void SetItem(CModelObject *pmo) {
    pmoModel = &(GetPlayer()->GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject);
    AddWeaponAttachment(BODY_ATTACHMENT_ITEM, MODEL_GOLDSWASTIKA,
                        TEXTURE_GOLDSWASTIKA, TEX_REFL_GOLD01, TEX_SPEC_MEDIUM, 0);
    if (pmo!=NULL) {
      CPlayer &pl = (CPlayer&)*m_penPlayer;
      CAttachmentModelObject *pamo = pl.GetModelObject()->GetAttachmentModelList(PLAYER_ATTACHMENT_TORSO, BODY_ATTACHMENT_ITEM, -1);
      pmoModel = &(pamo->amo_moModelObject);
      pmoModel->Copy(*pmo);
      pmoModel->StretchModel(FLOAT3D(1,1,1));
      pamo->amo_plRelative = CPlacement3D(FLOAT3D(0,0,0), ANGLE3D(0,0,0));
    }
    // sync apperances
    SyncWeapon();
  }

  // set player body animation
  void SetBodyAnimation(INDEX iAnimation, ULONG ulFlags) {
    // on weapon change skip anim
    if (m_bChangeWeapon) { return; }
    // on firing skip anim
    if (m_bAttacking) { return; }
    // play body anim
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    CModelObject &moBody = pl.GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject;
    moBody.PlayAnim(iAnimation, ulFlags);
    m_fBodyAnimTime = moBody.GetAnimLength(iAnimation);     // anim length
  };


/************************************************************
 *                      INITIALIZE                          *
 ************************************************************/
  void Initialize(void) {
    // set internal properties
    m_bReference = TRUE;
    m_bWaitJumpAnim = FALSE;
    m_bCrouch = FALSE;
    m_iCrouchDownWait = 0;
    m_iRiseUpWait = 0;
    m_bChangeWeapon = FALSE;
    m_bSwim = FALSE;
    m_bAttacking = FALSE;

    // clear eyes offsets
    m_fEyesYLastOffset = 0.0f;
    m_fEyesYOffset = 0.0f;
    m_fEyesYSpeed = 0.0f;
    m_fWeaponYLastOffset = 0.0f;
    m_fWeaponYOffset = 0.0f;
    m_fWeaponYSpeed = 0.0f;
//    m_fRecoilLastOffset = 0.0f;
//    m_fRecoilOffset = 0.0f;
//    m_fRecoilSpeed = 0.0f;
    
    // clear moving banking
    m_bMoving = FALSE;
    m_fMoveLastBanking = 0.0f;
    m_fMoveBanking = 0.0f;
    m_iMovingSide = 0;
    m_bSidestepBankingLeft = FALSE;
    m_bSidestepBankingRight = FALSE;
    m_fSidestepLastBanking = 0.0f;
    m_fSidestepBanking = 0.0f;

    // weapon
    SetWeapon();
    SetBodyAnimation(BODY_ANIM_COLT_STAND, AOF_LOOPING|AOF_NORESTART);
  };


/************************************************************
 *                ANIMATE BANKING AND SOFT EYES             *
 ************************************************************/
  // store for lerping
  void StoreLast(void) {
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    m_vLastPlayerPosition = pl.GetPlacement().pl_PositionVector;  // store last player position
    m_fEyesYLastOffset = m_fEyesYOffset;                          // store last eyes offset
    m_fWeaponYLastOffset = m_fWeaponYOffset;
//    m_fRecoilLastOffset = m_fRecoilOffset;
    m_fMoveLastBanking = m_fMoveBanking;                          // store last banking for lerping
    m_fSidestepLastBanking = m_fSidestepBanking;
  };

  // animate banking
  void AnimateBanking(void) {
    // moving -> change banking
    if (m_bMoving) {
      // move banking left
      if (m_iMovingSide == 0) {
        m_fMoveBanking += 0.35f;
        if (m_fMoveBanking > 1.0f) { 
          m_fMoveBanking = 1.0f;
          m_iMovingSide = 1;
        }
      // move banking right
      } else {
        m_fMoveBanking -= 0.35f;
        if (m_fMoveBanking < -1.0f) {
          m_fMoveBanking = -1.0f;
          m_iMovingSide = 0;
        }
      }
      const FLOAT fBankingSpeed = 0.4f;

      // sidestep banking left
      if (m_bSidestepBankingLeft) {
        m_fSidestepBanking += fBankingSpeed;
        if (m_fSidestepBanking > 1.0f) { m_fSidestepBanking = 1.0f; }
      }
      // sidestep banking right
      if (m_bSidestepBankingRight) {
        m_fSidestepBanking -= fBankingSpeed;
        if (m_fSidestepBanking < -1.0f) { m_fSidestepBanking = -1.0f; }
      }

    // restore banking
    } else {
      // move banking
      if (m_fMoveBanking > 0.0f) {
        m_fMoveBanking -= 0.1f;
        if (m_fMoveBanking < 0.0f) { m_fMoveBanking = 0.0f; }
      } else if (m_fMoveBanking < 0.0f) {
        m_fMoveBanking += 0.1f;
        if (m_fMoveBanking > 0.0f) { m_fMoveBanking = 0.0f; }
      }
      // sidestep banking
      if (m_fSidestepBanking > 0.0f) {
        m_fSidestepBanking -= 0.4f;
        if (m_fSidestepBanking < 0.0f) { m_fSidestepBanking = 0.0f; }
      } else if (m_fSidestepBanking < 0.0f) {
        m_fSidestepBanking += 0.4f;
        if (m_fSidestepBanking > 0.0f) { m_fSidestepBanking = 0.0f; }
      }
    }

    if (GetPlayer()->GetSettings()->ps_ulFlags&PSF_NOBOBBING) {
      m_fSidestepBanking = m_fMoveBanking = 0.0f;
    }
  };

  // animate soft eyes
  void AnimateSoftEyes(void) {
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    // find eyes offset and speed (differential formula realized in numerical mathematics)
    FLOAT fRelY = (pl.GetPlacement().pl_PositionVector-m_vLastPlayerPosition) %
                  FLOAT3D(pl.en_mRotation(1, 2), pl.en_mRotation(2, 2), pl.en_mRotation(3, 2));

    // if just jumped
    if (pl.en_tmJumped>_pTimer->CurrentTick()-0.5f) {
      fRelY = ClampUp(fRelY, 0.0f);
    }
    m_fEyesYOffset -= fRelY;
    m_fWeaponYOffset -= ClampUp(fRelY, 0.0f);

    plr_fViewDampFactor      = Clamp(plr_fViewDampFactor      ,0.0f,1.0f);
    plr_fViewDampLimitGroundUp = Clamp(plr_fViewDampLimitGroundUp ,0.0f,2.0f);
    plr_fViewDampLimitGroundDn = Clamp(plr_fViewDampLimitGroundDn ,0.0f,2.0f);
    plr_fViewDampLimitWater  = Clamp(plr_fViewDampLimitWater  ,0.0f,2.0f);

    m_fEyesYSpeed = (m_fEyesYSpeed - m_fEyesYOffset*plr_fViewDampFactor) * (1.0f-plr_fViewDampFactor);
    m_fEyesYOffset += m_fEyesYSpeed;
    
    m_fWeaponYSpeed = (m_fWeaponYSpeed - m_fWeaponYOffset*plr_fViewDampFactor) * (1.0f-plr_fViewDampFactor);
    m_fWeaponYOffset += m_fWeaponYSpeed;

    if (m_bSwim) {
      m_fEyesYOffset = Clamp(m_fEyesYOffset, -plr_fViewDampLimitWater,  +plr_fViewDampLimitWater);
      m_fWeaponYOffset = Clamp(m_fWeaponYOffset, -plr_fViewDampLimitWater,  +plr_fViewDampLimitWater);
    } else {
      m_fEyesYOffset = Clamp(m_fEyesYOffset, -plr_fViewDampLimitGroundDn,  +plr_fViewDampLimitGroundUp);
      m_fWeaponYOffset = Clamp(m_fWeaponYOffset, -plr_fViewDampLimitGroundDn,  +plr_fViewDampLimitGroundUp);
    }
  };

  /*
  // animate view pitch (for recoil)
  void AnimateRecoilPitch(void)
  {
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    INDEX iWeapon = ((CPlayerWeapons&)*pl.m_penWeapons).m_iCurrentWeapon;

    wpn_fRecoilDampUp[iWeapon] = Clamp(wpn_fRecoilDampUp[iWeapon],0.0f,1.0f);
    wpn_fRecoilDampDn[iWeapon] = Clamp(wpn_fRecoilDampDn[iWeapon],0.0f,1.0f);

    FLOAT fDamp;
    if (m_fRecoilSpeed>0) {
      fDamp = wpn_fRecoilDampUp[iWeapon];
    } else {
      fDamp = wpn_fRecoilDampDn[iWeapon];
    }
    m_fRecoilSpeed = (m_fRecoilSpeed - m_fRecoilOffset*fDamp)* (1.0f-fDamp);

    m_fRecoilOffset += m_fRecoilSpeed;

    if (m_fRecoilOffset<0.0f) {
      m_fRecoilOffset = 0.0f;
    }
    if (m_fRecoilOffset>wpn_fRecoilLimit[iWeapon]) {
      m_fRecoilOffset = wpn_fRecoilLimit[iWeapon];
      m_fRecoilSpeed = 0.0f;
    }
  };
  */
  // change view
  void ChangeView(CPlacement3D &pl) {
    TIME tmNow = _pTimer->GetLerpedCurrentTick();

    if (!(GetPlayer()->GetSettings()->ps_ulFlags&PSF_NOBOBBING)) {
      // banking
      FLOAT fBanking = Lerp(m_fMoveLastBanking, m_fMoveBanking, _pTimer->GetLerpFactor());
      fBanking = fBanking * fBanking * Sgn(fBanking) * 0.25f;
      fBanking += Lerp(m_fSidestepLastBanking, m_fSidestepBanking, _pTimer->GetLerpFactor());
      fBanking = Clamp(fBanking, -5.0f, 5.0f);
      pl.pl_OrientationAngle(3) += fBanking;
    }

/*
    // recoil pitch
    INDEX iWeapon = ((CPlayerWeapons&)*((CPlayer&)*m_penPlayer).m_penWeapons).m_iCurrentWeapon;
    FLOAT fRecoil = Lerp(m_fRecoilLastOffset, m_fRecoilOffset, _pTimer->GetLerpFactor());
    FLOAT fRecoilP = wpn_fRecoilFactorP[iWeapon]*fRecoil;
    pl.pl_OrientationAngle(2) += fRecoilP;
    // adjust recoil pitch handle
    FLOAT fRecoilH = wpn_fRecoilOffset[iWeapon];
    FLOAT fDY = fRecoilH*(1.0f-Cos(fRecoilP));
    FLOAT fDZ = fRecoilH*Sin(fRecoilP);
    pl.pl_PositionVector(2)-=fDY;
    pl.pl_PositionVector(3)+=fDZ+wpn_fRecoilFactorZ[iWeapon]*fRecoil;
    */

    // swimming
    if (m_bSwim) {
      pl.pl_OrientationAngle(1) += sin(tmNow*0.9)*2.0f;
      pl.pl_OrientationAngle(2) += sin(tmNow*1.7)*2.0f;
      pl.pl_OrientationAngle(3) += sin(tmNow*2.5)*2.0f;
    }
    // eyes up/down for jumping and breathing
    FLOAT fEyesOffsetY = Lerp(m_fEyesYLastOffset, m_fEyesYOffset, _pTimer->GetLerpFactor());
    fEyesOffsetY+= sin(tmNow*1.5)*0.05f * plr_fBreathingStrength;
    fEyesOffsetY = Clamp(fEyesOffsetY, -1.0f, 1.0f);
    pl.pl_PositionVector(2) += fEyesOffsetY;
  }



/************************************************************
 *                     ANIMATE PLAYER                       *
 ************************************************************/
  // body and head animation
  void BodyAndHeadOrientation(CPlacement3D &plView) {
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    CAttachmentModelObject *pamoBody = pl.GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO);
    ANGLE3D a = plView.pl_OrientationAngle;
    if (!(pl.GetFlags()&ENF_ALIVE)) {
      a = ANGLE3D(0,0,0);
    }
    pamoBody->amo_plRelative.pl_OrientationAngle = a;
    pamoBody->amo_plRelative.pl_OrientationAngle(3) *= 4.0f;
    
    CAttachmentModelObject *pamoHead = (pamoBody->amo_moModelObject).GetAttachmentModel(BODY_ATTACHMENT_HEAD);
    pamoHead->amo_plRelative.pl_OrientationAngle = a;
    pamoHead->amo_plRelative.pl_OrientationAngle(1) = 0.0f;
    pamoHead->amo_plRelative.pl_OrientationAngle(2) = 0.0f;
    pamoHead->amo_plRelative.pl_OrientationAngle(3) *= 4.0f;

    // forbid players from cheating by kissing their @$$
    const FLOAT fMaxBanking = 5.0f;
    pamoBody->amo_plRelative.pl_OrientationAngle(3) = Clamp(pamoBody->amo_plRelative.pl_OrientationAngle(3), -fMaxBanking, fMaxBanking);
    pamoHead->amo_plRelative.pl_OrientationAngle(3) = Clamp(pamoHead->amo_plRelative.pl_OrientationAngle(3), -fMaxBanking, fMaxBanking);
  };

  // animate player
  void AnimatePlayer(void) {
    if (m_bDisableAnimating) {
      return;
    }
    CPlayer &pl = (CPlayer&)*m_penPlayer;

    FLOAT3D vDesiredTranslation = pl.en_vDesiredTranslationRelative;
    FLOAT3D vCurrentTranslation = pl.en_vCurrentTranslationAbsolute * !pl.en_mRotation;
    ANGLE3D aDesiredRotation = pl.en_aDesiredRotationRelative;
    ANGLE3D aCurrentRotation = pl.en_aCurrentRotationAbsolute;

    // if player is moving
    if (vDesiredTranslation.ManhattanNorm()>0.01f
      ||aDesiredRotation.ManhattanNorm()>0.01f) {
      // prevent idle weapon animations
      m_fLastActionTime = _pTimer->CurrentTick();
    }

    // swimming
    if (m_bSwim) {
      if (vDesiredTranslation.Length()>1.0f && vCurrentTranslation.Length()>1.0f) {
        pl.StartModelAnim(PLAYER_ANIM_SWIM, AOF_LOOPING|AOF_NORESTART);
      } else {
        pl.StartModelAnim(PLAYER_ANIM_SWIMIDLE, AOF_LOOPING|AOF_NORESTART);
      }
      BodyStillAnimation();

    // stand
    } else {
      // has reference (floor)
      if (m_bReference) {
        // jump
        if (pl.en_tmJumped+_pTimer->TickQuantum>=_pTimer->CurrentTick() &&
            pl.en_tmJumped<=_pTimer->CurrentTick()) {
          m_bReference = FALSE;
          pl.StartModelAnim(PLAYER_ANIM_JUMPSTART, AOF_NORESTART);
          BodyStillAnimation();
          m_fLastActionTime = _pTimer->CurrentTick();

        // not in jump anim and in stand mode change
        } else if (!m_bWaitJumpAnim && m_iCrouchDownWait==0 && m_iRiseUpWait==0) {
          // standing
          if (!m_bCrouch) {
            // running anim
            if (vDesiredTranslation.Length()>5.0f && vCurrentTranslation.Length()>5.0f) {
              if (vCurrentTranslation(3)<0) {
                pl.StartModelAnim(PLAYER_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
              } else {
                pl.StartModelAnim(PLAYER_ANIM_BACKPEDALRUN, AOF_LOOPING|AOF_NORESTART);
              }
              BodyRunAnimation();
              m_fLastActionTime = _pTimer->CurrentTick();
            // walking anim
            } else if (vDesiredTranslation.Length()>2.0f && vCurrentTranslation.Length()>2.0f) {
              if (vCurrentTranslation(3)<0) {
                pl.StartModelAnim(PLAYER_ANIM_NORMALWALK, AOF_LOOPING|AOF_NORESTART);
              } else {
                pl.StartModelAnim(PLAYER_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
              }
              BodyWalkAnimation();
              m_fLastActionTime = _pTimer->CurrentTick();
            // left rotation anim
            } else if (aDesiredRotation(1)>0.5f) {
              pl.StartModelAnim(PLAYER_ANIM_TURNLEFT, AOF_LOOPING|AOF_NORESTART);
              BodyStillAnimation();
              m_fLastActionTime = _pTimer->CurrentTick();
            // right rotation anim
            } else if (aDesiredRotation(1)<-0.5f) {
              pl.StartModelAnim(PLAYER_ANIM_TURNRIGHT, AOF_LOOPING|AOF_NORESTART);
              BodyStillAnimation();
              m_fLastActionTime = _pTimer->CurrentTick();
            // standing anim
            } else {
              pl.StartModelAnim(PLAYER_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
              BodyStillAnimation();
            }
          // crouch
          } else {
            // walking anim
            if (vDesiredTranslation.Length()>2.0f && vCurrentTranslation.Length()>2.0f) {
              if (vCurrentTranslation(3)<0) {
                pl.StartModelAnim(PLAYER_ANIM_CROUCH_WALK, AOF_LOOPING|AOF_NORESTART);
              } else {
                pl.StartModelAnim(PLAYER_ANIM_CROUCH_WALKBACK, AOF_LOOPING|AOF_NORESTART);
              }
              BodyWalkAnimation();
              m_fLastActionTime = _pTimer->CurrentTick();
            // left rotation anim
            } else if (aDesiredRotation(1)>0.5f) {
              pl.StartModelAnim(PLAYER_ANIM_CROUCH_TURNLEFT, AOF_LOOPING|AOF_NORESTART);
              BodyStillAnimation();
              m_fLastActionTime = _pTimer->CurrentTick();
            // right rotation anim
            } else if (aDesiredRotation(1)<-0.5f) {
              pl.StartModelAnim(PLAYER_ANIM_CROUCH_TURNRIGHT, AOF_LOOPING|AOF_NORESTART);
              BodyStillAnimation();
              m_fLastActionTime = _pTimer->CurrentTick();
            // standing anim
            } else {
              pl.StartModelAnim(PLAYER_ANIM_CROUCH_IDLE, AOF_LOOPING|AOF_NORESTART);
              BodyStillAnimation();
            }
          }

        }

      // no reference (in air)
      } else {                           
        // touched reference
        if (pl.en_penReference!=NULL) {
          m_bReference = TRUE;
          pl.StartModelAnim(PLAYER_ANIM_JUMPEND, AOF_NORESTART);
          BodyStillAnimation();
          SpawnReminder(this, pl.GetModelObject()->GetAnimLength(PLAYER_ANIM_JUMPEND), (INDEX) AA_JUMPDOWN);
          m_bWaitJumpAnim = TRUE;
        }
      }
    }

    // boring weapon animation
    if (_pTimer->CurrentTick()-m_fLastActionTime > 10.0f) {
      m_fLastActionTime = _pTimer->CurrentTick();
      ((CPlayerWeapons&)*pl.m_penWeapons).SendEvent(EBoringWeapon());
    }

    // moving view change
    // translating -> change banking
    if (m_bReference != NULL && vDesiredTranslation.Length()>1.0f && vCurrentTranslation.Length()>1.0f) {
      m_bMoving = TRUE;
      // sidestep banking
      FLOAT vSidestepSpeedDesired = vDesiredTranslation(1);
      FLOAT vSidestepSpeedCurrent = vCurrentTranslation(1);
      // right
      if (vSidestepSpeedDesired>1.0f && vSidestepSpeedCurrent>1.0f) {
        m_bSidestepBankingRight = TRUE;
        m_bSidestepBankingLeft = FALSE;
      // left
      } else if (vSidestepSpeedDesired<-1.0f && vSidestepSpeedCurrent<-1.0f) {
        m_bSidestepBankingLeft = TRUE;
        m_bSidestepBankingRight = FALSE;
      // none
      } else {
        m_bSidestepBankingLeft = FALSE;
        m_bSidestepBankingRight = FALSE;
      }
    // in air (space) or not moving
    } else {
      m_bMoving = FALSE;
      m_bSidestepBankingLeft = FALSE;
      m_bSidestepBankingRight = FALSE;
    }
  };

  // crouch
  void Crouch(void) {
    if (m_bDisableAnimating) {
      return;
    }
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    pl.StartModelAnim(PLAYER_ANIM_CROUCH, AOF_NORESTART);
    SpawnReminder(this, pl.GetModelObject()->GetAnimLength(PLAYER_ANIM_CROUCH), (INDEX) AA_CROUCH);
    m_iCrouchDownWait++;
    m_bCrouch = TRUE;
  };

  // rise
  void Rise(void) {
    if (m_bDisableAnimating) {
      return;
    }
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    pl.StartModelAnim(PLAYER_ANIM_RISE, AOF_NORESTART);
    SpawnReminder(this, pl.GetModelObject()->GetAnimLength(PLAYER_ANIM_RISE), (INDEX) AA_RISE);
    m_iRiseUpWait++;
    m_bCrouch = FALSE;
  };

  // fall
  void Fall(void) {
    if (m_bDisableAnimating) {
      return;
    }
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    pl.StartModelAnim(PLAYER_ANIM_JUMPSTART, AOF_NORESTART);
    if (_pNetwork->ga_ulDemoMinorVersion>6) { m_bCrouch = FALSE; }
    m_bReference = FALSE;
  };

  // swim
  void Swim(void) {
    if (m_bDisableAnimating) {
      return;
    }
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    pl.StartModelAnim(PLAYER_ANIM_SWIM, AOF_LOOPING|AOF_NORESTART);
    if (_pNetwork->ga_ulDemoMinorVersion>2) { m_bCrouch = FALSE; }
    m_bSwim = TRUE;
  };

  // stand
  void Stand(void) {
    if (m_bDisableAnimating) {
      return;
    }
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    pl.StartModelAnim(PLAYER_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    if (_pNetwork->ga_ulDemoMinorVersion>2) { m_bCrouch = FALSE; }
    m_bSwim = FALSE;
  };

  // fire/attack
  void FireAnimation(INDEX iAnim, ULONG ulFlags) {
    if (m_bSwim) {
      INDEX iWeapon = ((CPlayerWeapons&)*(((CPlayer&)*m_penPlayer).m_penWeapons)).m_iCurrentWeapon;
      switch (iWeapon) {
        case WEAPON_NONE: case WEAPON_HOLSTERED:
          break;
        case WEAPON_KNIFE: case WEAPON_AXE: case WEAPON_PISTOL: case WEAPON_PIPE: case WEAPON_STRONGPISTOL:
          iAnim += BODY_ANIM_COLT_SWIM_STAND-BODY_ANIM_COLT_STAND;
          break;
        case WEAPON_SHOTGUN: case WEAPON_SMG:
          iAnim += BODY_ANIM_SHOTGUN_SWIM_STAND-BODY_ANIM_SHOTGUN_STAND;
          break;
      }
    }
    m_bAttacking = FALSE;
    m_bChangeWeapon = FALSE;
    SetBodyAnimation(iAnim, ulFlags);
    if (!(ulFlags&AOF_LOOPING)) {
      SpawnReminder(this, m_fBodyAnimTime, (INDEX) AA_ATTACK);
      m_tmAttackingDue = _pTimer->CurrentTick()+m_fBodyAnimTime;
    }
    m_bAttacking = TRUE;
  };

  void FireAnimationOff(void) {
    m_bAttacking = FALSE;
  };


  
/************************************************************
 *                  CHANGE BODY ANIMATION                   *
 ************************************************************/
  // body animation template
  void BodyAnimationTemplate(INDEX iNone, INDEX iColt, INDEX iShotgun, INDEX iMinigun, ULONG ulFlags) {
    INDEX iWeapon = ((CPlayerWeapons&)*(((CPlayer&)*m_penPlayer).m_penWeapons)).m_iCurrentWeapon;
    switch (iWeapon) {
      case WEAPON_NONE: case WEAPON_HOLSTERED:
        SetBodyAnimation(iNone, ulFlags);
        break;
      case WEAPON_KNIFE: case WEAPON_AXE: case WEAPON_PISTOL: case WEAPON_PIPE: case WEAPON_STRONGPISTOL:
        if (m_bSwim) { iColt += BODY_ANIM_COLT_SWIM_STAND-BODY_ANIM_COLT_STAND; }
        SetBodyAnimation(iColt, ulFlags);
        break;
      case WEAPON_SHOTGUN: case WEAPON_SMG:
        if (m_bSwim) { iShotgun += BODY_ANIM_SHOTGUN_SWIM_STAND-BODY_ANIM_SHOTGUN_STAND; }
        SetBodyAnimation(iShotgun, ulFlags);
        break;
      default: ASSERTALWAYS("Player Animator - Unknown weapon");
    }
  };

  // run
  void BodyRunAnimation() {
    BodyAnimationTemplate(BODY_ANIM_NORMALRUN, 
      BODY_ANIM_COLT_STAND, BODY_ANIM_SHOTGUN_STAND, BODY_ANIM_MINIGUN_STAND, 
      AOF_LOOPING|AOF_NORESTART);
  };

  // walk
  void BodyWalkAnimation() {
    BodyAnimationTemplate(BODY_ANIM_NORMALWALK, 
      BODY_ANIM_COLT_STAND, BODY_ANIM_SHOTGUN_STAND, BODY_ANIM_MINIGUN_STAND, 
      AOF_LOOPING|AOF_NORESTART);
  };

  // stand
  void BodyStillAnimation() {
    BodyAnimationTemplate(BODY_ANIM_WAIT, 
      BODY_ANIM_COLT_STAND, BODY_ANIM_SHOTGUN_STAND, BODY_ANIM_MINIGUN_STAND, 
      AOF_LOOPING|AOF_NORESTART);
  };

  // push weapon
  void BodyPushAnimation() {
    m_bAttacking = FALSE;
    m_bChangeWeapon = FALSE;
    BodyAnimationTemplate(BODY_ANIM_WAIT, 
      BODY_ANIM_COLT_REDRAW, BODY_ANIM_SHOTGUN_REDRAW, BODY_ANIM_MINIGUN_REDRAW, 0);
    m_bChangeWeapon = TRUE;
  };

  // remove weapon attachment
  void RemoveWeapon(void) 
  {
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    pmoModel = &(pl.GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject);
    switch (m_iWeaponLast) {
      case WEAPON_NONE:
      case WEAPON_HOLSTERED:
      case WEAPON_KNIFE:
        pmoModel->RemoveAttachmentModel(BODY_ATTACHMENT_KNIFE);
        break;
      case WEAPON_AXE:
        pmoModel->RemoveAttachmentModel(BODY_ATTACHMENT_AXE);
        break;
      case WEAPON_PISTOL:
        pmoModel->RemoveAttachmentModel(BODY_ATTACHMENT_PISTOL);
        break;
      case WEAPON_SHOTGUN:
        pmoModel->RemoveAttachmentModel(BODY_ATTACHMENT_SHOTGUN);
        break;
      case WEAPON_SMG:
        pmoModel->RemoveAttachmentModel(BODY_ATTACHMENT_SMG);
        break;
      case WEAPON_PIPE:
        pmoModel->RemoveAttachmentModel(BODY_ATTACHMENT_PIPE);
        break;
      case WEAPON_STRONGPISTOL:
        pmoModel->RemoveAttachmentModel(BODY_ATTACHMENT_STRONGPISTOL);
        break;
      default:
        ASSERT(FALSE);
    }
    // sync apperances
    SyncWeapon();
  }

  // pull weapon
  void BodyPullAnimation() {
    // remove old weapon
    RemoveWeapon();

    // set new weapon
    SetWeapon();

    // pull weapon
    m_bChangeWeapon = FALSE;
    BodyAnimationTemplate(BODY_ANIM_WAIT, 
      BODY_ANIM_COLT_DRAW, BODY_ANIM_SHOTGUN_DRAW, BODY_ANIM_MINIGUN_DRAW, 0);
    INDEX iWeapon = ((CPlayerWeapons&)*(((CPlayer&)*m_penPlayer).m_penWeapons)).m_iCurrentWeapon;
    if (iWeapon!=WEAPON_NONE) {
      m_bChangeWeapon = TRUE;
      SpawnReminder(this, m_fBodyAnimTime, (INDEX) AA_PULLWEAPON);
    }
    // sync apperances
    SyncWeapon();
  };

  // pull item
  void BodyPullItemAnimation() {
    // remove old weapon
    RemoveWeapon();

    // pull item
    m_bChangeWeapon = FALSE;
    SetBodyAnimation(BODY_ANIM_STATUE_PULL, 0);
    m_bChangeWeapon = TRUE;
    SpawnReminder(this, m_fBodyAnimTime, (INDEX) AA_PULLWEAPON);
    // sync apperances
    SyncWeapon();
  };

  // pick item
  void BodyPickItemAnimation() {
    // remove old weapon
    RemoveWeapon();

    // pick item
    m_bChangeWeapon = FALSE;
    SetBodyAnimation(BODY_ANIM_KEYLIFT, 0);
    m_bChangeWeapon = TRUE;
    SpawnReminder(this, m_fBodyAnimTime, (INDEX) AA_PULLWEAPON);
    // sync apperances
    SyncWeapon();
  };

  // remove item
  void BodyRemoveItem() {
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    pmoModel = &(pl.GetModelObject()->GetAttachmentModel(PLAYER_ATTACHMENT_TORSO)->amo_moModelObject);
    pmoModel->RemoveAttachmentModel(BODY_ATTACHMENT_ITEM);
    // sync apperances
    SyncWeapon();
  };


/************************************************************
 *                      FIRE FLARE                          *
 ************************************************************/
  void OnPreRender(void) {
    ControlFlareAttachment();
  };

  // show flare
  void ShowFlare(INDEX iAttachWeapon, INDEX iAttachObject, INDEX iAttachFlare) {
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    CAttachmentModelObject *pamo = pl.GetModelObject()->GetAttachmentModelList(
      PLAYER_ATTACHMENT_TORSO, iAttachWeapon, iAttachObject, iAttachFlare, -1);
    if (pamo!=NULL) {
      pamo->amo_plRelative.pl_OrientationAngle(3) = (rand()*360.0f)/RAND_MAX;
      CModelObject &mo = pamo->amo_moModelObject;
      mo.StretchModel(FLOAT3D(1, 1, 1));
    }
  };

  // hide flare
  void HideFlare(INDEX iAttachWeapon, INDEX iAttachObject, INDEX iAttachFlare) {
    CPlayer &pl = (CPlayer&)*m_penPlayer;
    CAttachmentModelObject *pamo = pl.GetModelObject()->GetAttachmentModelList(
      PLAYER_ATTACHMENT_TORSO, iAttachWeapon, iAttachObject, iAttachFlare, -1);
    if (pamo!=NULL) {
      CModelObject &mo = pamo->amo_moModelObject;
      mo.StretchModel(FLOAT3D(0, 0, 0));
    }
  };

  // flare attachment
  void ControlFlareAttachment(void) 
  {
/*    if(!IsPredictionHead()) {
      return;
    }
    */

    // get your prediction tail
    CPlayerAnimator *pen = (CPlayerAnimator *)GetPredictionTail();

    INDEX iWeapon = ((CPlayerWeapons&)*(((CPlayer&)*pen->m_penPlayer).m_penWeapons)).m_iCurrentWeapon;

    // add flare
    if (pen->m_iFlare==FLARE_ADD) {
      pen->m_iFlare = FLARE_REMOVE;
      pen->m_tmFlareAdded = _pTimer->CurrentTick();
    // remove
    } else if (m_iFlare==FLARE_REMOVE &&
      _pTimer->CurrentTick()>pen->m_tmFlareAdded+_pTimer->TickQuantum) {
    }
  };



/************************************************************
 *                      PROCEDURES                          *
 ************************************************************/
procedures:
  ReminderAction(EReminder er) {
    switch (er.iValue) {
      case AA_JUMPDOWN: m_bWaitJumpAnim = FALSE; break;
      case AA_CROUCH: m_iCrouchDownWait--; ASSERT(m_iCrouchDownWait>=0); break;
      case AA_RISE: m_iRiseUpWait--; ASSERT(m_iRiseUpWait>=0); break;
      case AA_PULLWEAPON: m_bChangeWeapon = FALSE; break;
      case AA_ATTACK: if(m_tmAttackingDue<=_pTimer->CurrentTick()) { m_bAttacking = FALSE; } break;
      default: ASSERTALWAYS("Animator - unknown reminder action.");
    }
    return EBegin();
  };

  Main(EAnimatorInit eInit) {
    // remember the initial parameters
    ASSERT(eInit.penPlayer!=NULL);
    m_penPlayer = eInit.penPlayer;

    // declare yourself as a void
    InitAsVoid();
    SetFlags(GetFlags()|ENF_CROSSESLEVELS);
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // last action time for boring weapon animation
    m_fLastActionTime = _pTimer->CurrentTick();

    wait() {
      on (EBegin) : { resume; }
      on (EReminder er) : { call ReminderAction(er); }
      on (EEnd) : { stop; }
    }

    // cease to exist
    Destroy();

    return;
  };
};

