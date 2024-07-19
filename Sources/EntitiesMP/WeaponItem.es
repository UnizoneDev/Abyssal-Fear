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

802
%{
#include "StdH.h"
#include "Models/Items/ItemHolder/ItemHolder.h"
#include "Models/Weapons/Knife/KnifeWeapon.h"
#include "Models/Weapons/Axe/AxeWeapon.h"
#include "Models/Weapons/Pistol/PistolItem.h"
#include "Models/Weapons/Shotgun/ShotgunItem.h"
#include "Models/Weapons/SMG/SMGItem.h"
#include "Models/Weapons/MetalPipe/PipeWeapon.h"
#include "Models/Weapons/StrongPistol/StrongPistolItem.h"
#include "Models/Weapons/WoodenPlank/PlankWeapon.h"

#include "EntitiesMP/PlayerWeapons.h"

%}

uses "EntitiesMP/Item";

// weapon type 
enum WeaponItemType {
  0 WIT_KNIFE             "Knife",
  1 WIT_PISTOL            "Pistol",
  2 WIT_AXE               "Axe",
  3 WIT_SHOTGUN           "Shotgun",
  4 WIT_SMG               "Submachine Gun",
  5 WIT_PIPE              "Metal Pipe",
  6 WIT_STRONGPISTOL      "Strong Pistol",
  7 WIT_PLANK             "Wooden Plank"
};

// event for sending through receive item
event EWeaponItem {
  INDEX  iWeapon,   // weapon collected
  INDEX  iAmmo,     // weapon ammo (used only for leaving weapons, -1 for deafult ammount)
  BOOL bDropped,    // for dropped weapons (can be picked even if weapons stay)
};

%{
extern void CPlayerWeapons_Precache(ULONG ulAvailable);
%}


class CWeaponItem : CItem {
name      "Weapon Item";
thumbnail "Thumbnails\\WeaponItem.tbn";

properties:
  1 enum WeaponItemType m_EwitType    "Type" 'Y' = WIT_PISTOL,     // weapon

components:
  0 class   CLASS_BASE        "Classes\\Item.ecl",

// ************** PISTOL **************
 30 model   MODEL_PISTOLITEM               "Models\\Weapons\\Pistol\\PistolItem.mdl",
 31 texture TEXTURE_PISTOLITEM             "Models\\Weapons\\Pistol\\Pistol.tex",

// ************** AXE **************
 32 model   MODEL_AXEITEM               "Models\\Weapons\\Axe\\AxeWeapon.mdl",
 33 texture TEXTURE_AXEITEM             "Models\\Weapons\\Knife\\KnifeWeapon.tex",

// ************** SHOTGUN **************
 34 model   MODEL_SHOTGUNITEM               "Models\\Weapons\\Shotgun\\ShotgunItem.mdl",
 35 texture TEXTURE_SHOTGUNITEM             "Models\\Weapons\\Shotgun\\Shotgun.tex",

// ************** SMG **************
 36 model   MODEL_SMGITEM               "Models\\Weapons\\SMG\\SMGItem.mdl",
 37 texture TEXTURE_SMGITEM             "Models\\Weapons\\SMG\\SMG.tex",

// ************** KNIFE **************
 38 model   MODEL_KNIFEITEM             "Models\\Weapons\\Knife\\KnifeWeapon.mdl",
 39 texture TEXTURE_KNIFEITEM           "Models\\Weapons\\Knife\\KnifeItem.tex",

// ************** PIPE **************
 40 model   MODEL_PIPEITEM               "Models\\Weapons\\MetalPipe\\PipeWeapon.mdl",
 41 texture TEXTURE_PIPEITEM             "Models\\Weapons\\MetalPipe\\PipeWeapon.tex",

// ************** PISTOL **************
 42 model   MODEL_STRONGPISTOLITEM               "Models\\Weapons\\StrongPistol\\StrongPistolItem.mdl",
 43 texture TEXTURE_STRONGPISTOLITEM             "Models\\Weapons\\StrongPistol\\StrongPistol.tex",

// ************** PLANK **************
 44 model   MODEL_PLANKITEM               "Models\\Weapons\\WoodenPlank\\PlankWeapon.mdl",
 45 texture TEXTURE_PLANKITEM             "Models\\Weapons\\WoodenPlank\\WoodenPlank.tex",

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

// ************** SOUNDS **************
213 sound SOUND_PICK             "Sounds\\Items\\PistolPickup.wav",
214 sound SOUND_KNIFE_PICK       "Sounds\\Items\\KnifePickup.wav",
215 sound SOUND_SHOTGUN_PICK     "Models\\NPCs\\Gunman\\Sounds\\ShotgunPumpNew.wav",

functions:
  void Precache(void) {
    PrecacheSound(SOUND_PICK);
    PrecacheSound(SOUND_KNIFE_PICK);
    PrecacheSound(SOUND_SHOTGUN_PICK);
    switch (m_EwitType) {
      case WIT_KNIFE:           CPlayerWeapons_Precache(1<<(INDEX(WEAPON_KNIFE          )-1)); break;
      case WIT_PISTOL:          CPlayerWeapons_Precache(1<<(INDEX(WEAPON_PISTOL         )-1)); break;
      case WIT_AXE:             CPlayerWeapons_Precache(1<<(INDEX(WEAPON_AXE            )-1)); break;
      case WIT_SHOTGUN:         CPlayerWeapons_Precache(1<<(INDEX(WEAPON_SHOTGUN        )-1)); break;
      case WIT_SMG:             CPlayerWeapons_Precache(1<<(INDEX(WEAPON_SMG            )-1)); break;
      case WIT_PIPE:            CPlayerWeapons_Precache(1<<(INDEX(WEAPON_PIPE           )-1)); break;
      case WIT_STRONGPISTOL:    CPlayerWeapons_Precache(1<<(INDEX(WEAPON_STRONGPISTOL   )-1)); break;
      case WIT_PLANK:           CPlayerWeapons_Precache(1<<(INDEX(WEAPON_PLANK          )-1)); break;
    }
  }
  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    pes->es_strName = m_strDescription; 
    pes->es_ctCount = 1;
    pes->es_ctAmmount = 1;
    pes->es_fValue = 1;
    pes->es_iScore = 0;//m_iScore;
    return TRUE;
  }

  // render particles
  void RenderParticles(void) {
    return;
  }


  // set weapon properties depending on weapon type
  void SetProperties(void)
  {
    BOOL bDM = FALSE;//m_bRespawn || m_bDropped;
    FLOAT3D vDMStretch = FLOAT3D( 2.0f, 2.0f, 2.0f);
    
    switch (m_EwitType) {
    // *********** KNIFE ***********
      case WIT_KNIFE:
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 10.0f; 
        m_strDescription.PrintF("Knife");
        AddItem(MODEL_KNIFEITEM, TEXTURE_KNIFEITEM, 0, 0, 0);
        StretchItem( bDM ?  vDMStretch : FLOAT3D(2.0f, 2.0f, 2.0f));
        break;

    // *********** PISTOL ***********
      case WIT_PISTOL:
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 10.0f; 
        m_strDescription.PrintF("Pistol");
        AddItem(MODEL_PISTOLITEM, TEXTURE_PISTOLITEM, 0, 0, 0);
        StretchItem( bDM ?  vDMStretch : FLOAT3D(2.5f, 2.5f, 2.5f));
        break;

    // *********** AXE ***********
      case WIT_AXE:
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 10.0f; 
        m_strDescription.PrintF("Axe");
        AddItem(MODEL_AXEITEM, TEXTURE_AXEITEM, 0, 0, 0);
        StretchItem( bDM ?  vDMStretch : FLOAT3D(2.5f, 2.5f, 2.5f));
        break;

    // *********** SHOTGUN ***********
      case WIT_SHOTGUN:
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 10.0f; 
        m_strDescription.PrintF("Shotgun");
        AddItem(MODEL_SHOTGUNITEM, TEXTURE_SHOTGUNITEM, 0, 0, 0);
        StretchItem( bDM ?  vDMStretch : FLOAT3D(2.25f, 2.25f, 2.25f));
        break;

    // *********** SMG ***********
      case WIT_SMG:
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 10.0f; 
        m_strDescription.PrintF("Submachine Gun");
        AddItem(MODEL_SMGITEM, TEXTURE_SMGITEM, 0, 0, 0);
        StretchItem( bDM ?  vDMStretch : FLOAT3D(2.0f, 2.0f, 2.0f));
        break;

    // *********** PIPE ***********
      case WIT_PIPE:
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 10.0f; 
        m_strDescription.PrintF("Metal Pipe");
        AddItem(MODEL_PIPEITEM, TEXTURE_PIPEITEM, TEX_REFL_LIGHTMETAL01, TEX_SPEC_MEDIUM, 0);
        StretchItem( bDM ?  vDMStretch : FLOAT3D(2.0f, 2.0f, 2.0f));
        break;

    // *********** STRONG PISTOL ***********
      case WIT_STRONGPISTOL:
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 10.0f; 
        m_strDescription.PrintF("Strong Pistol");
        AddItem(MODEL_STRONGPISTOLITEM, TEXTURE_STRONGPISTOLITEM, 0, 0, 0);
        StretchItem( bDM ?  vDMStretch : FLOAT3D(2.5f, 2.5f, 2.5f));
        break;

    // *********** PIPE ***********
      case WIT_PLANK:
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 10.0f; 
        m_strDescription.PrintF("Wooden Plank");
        AddItem(MODEL_PLANKITEM, TEXTURE_PLANKITEM, 0, 0, 0);
        StretchItem( bDM ?  vDMStretch : FLOAT3D(2.0f, 2.0f, 2.0f));
        break;
    }
};

procedures:
  ItemCollected(EPass epass) : CItem::ItemCollected {
    ASSERT(epass.penOther!=NULL);

    // if weapons stays
    if (GetSP()->sp_bWeaponsStay && !(m_bPickupOnce||m_bRespawn)) {
      // if already picked by this player
      BOOL bWasPicked = MarkPickedBy(epass.penOther);
      if (bWasPicked) {
        // don't pick again
        return;
        }
    }

    // send weapon to entity
    EWeaponItem eWeapon;
    eWeapon.iWeapon = m_EwitType;
    eWeapon.iAmmo = -1; // use default ammo amount
    eWeapon.bDropped = m_bDropped;
    // if weapon is received
    if (epass.penOther->ReceiveItem(eWeapon)) {
      if(_pNetwork->IsPlayerLocal(epass.penOther)) {IFeel_PlayEffect("PU_Weapon");}
      // play the pickup sound
      m_soPick.Set3DParameters(50.0f, 1.0f, 1.0f, 1.0f);
      if(m_EwitType == WIT_KNIFE) {
        PlaySound(m_soPick, SOUND_KNIFE_PICK, SOF_3D);
        m_fPickSoundLen = GetSoundLength(SOUND_KNIFE_PICK);
      } else if (m_EwitType == WIT_SHOTGUN) {
        PlaySound(m_soPick, SOUND_SHOTGUN_PICK, SOF_3D);
        m_fPickSoundLen = GetSoundLength(SOUND_SHOTGUN_PICK);
      } else {
        PlaySound(m_soPick, SOUND_PICK, SOF_3D);
        m_fPickSoundLen = GetSoundLength(SOUND_PICK);
      }
      if (!GetSP()->sp_bWeaponsStay || m_bDropped || (m_bPickupOnce||m_bRespawn)) {
        jump CItem::ItemReceived();
      }
    }
    return;
  };

  Main()
  {
    Initialize();     // initialize base class
    StartModelAnim(ITEMHOLDER_ANIM_DEFAULT_ANIMATION, AOF_LOOPING|AOF_NORESTART);
    ForceCollisionBoxIndexChange(ITEMHOLDER_COLLISION_BOX_MEDIUM);
    SetProperties();  // set properties

    if (!m_bDropped) {
      jump CItem::ItemLoop();
    } else if (TRUE) {
      wait() {
        on (EBegin) : {
          SpawnReminder(this, m_fRespawnTime, 0);
          call CItem::ItemLoop();
        }
        on (EReminder) : {
          SendEvent(EEnd()); 
          resume;
        }
      }
    }
  };
};
