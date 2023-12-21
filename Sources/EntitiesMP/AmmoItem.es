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

803
%{
#include "StdH.h"
#include "Models/Items/ItemHolder/ItemHolder.h"
#include "Models/Items/Ammo/PistolClip/PistolClip.h"
#include "Models/Items/Ammo/SMGClip/SMGAmmo.h"
#include "Models/Items/Ammo/ShotgunShells/ShotgunAmmo.h"
#include "Models/Items/Ammo/StrongPistolClip/StrongPistolClip.h"
%}

uses "EntitiesMP/Item";

// ammo type 
enum AmmoItemType {
  1 AIT_BULLETS         "Bullets",
  2 AIT_SHELLS          "Shells",
  3 AIT_MEDIUM_BULLETS  "Medium Bullets",
  4 AIT_STRONG_BULLETS  "Strong Bullets"
};

// event for sending through receive item
event EAmmoItem {
  enum AmmoItemType EaitType,     // ammo type
  INDEX iQuantity,                // ammo quantity
};

class CAmmoItem : CItem {
name      "Ammo Item";
thumbnail "Thumbnails\\AmmoItem.tbn";

properties:
  1 enum AmmoItemType  m_EaitType    "Type" 'Y' = AIT_BULLETS,     // health type

components:
  0 class   CLASS_BASE        "Classes\\Item.ecl",

// ********* BULLETS *********
  1 model   MODEL_BULLETS         "Models\\Items\\Ammo\\PistolClip\\PistolClip.mdl",
  2 texture TEXTURE_BULLETS       "Models\\Weapons\\Pistol\\Pistol.tex",

// ********* SHELLS *********
  3 model   MODEL_SHELLS         "Models\\Items\\Ammo\\ShotgunShells\\ShotgunAmmo.mdl",
  4 texture TEXTURE_SHELLS       "Models\\Items\\Ammo\\ShotgunShells\\ShotgunShell.tex",

  5 model   MODEL_MEDIUM_BULLETS         "Models\\Items\\Ammo\\SMGClip\\SMGAmmo.mdl",
  6 texture TEXTURE_MEDIUM_BULLETS       "Models\\Weapons\\SMG\\SMG.tex",

  7 model   MODEL_STRONG_BULLETS         "Models\\Items\\Ammo\\StrongPistolClip\\StrongPistolClip.mdl",
  8 texture TEXTURE_STRONG_BULLETS       "Models\\Weapons\\StrongPistol\\StrongPistol.tex",

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
213 sound SOUND_PICK             "Sounds\\Items\\AmmoPickup.wav",
214 sound SOUND_DEFAULT          "Sounds\\Default.wav",

functions:
  void Precache(void) {
    PrecacheSound(SOUND_PICK);
    PrecacheModel(MODEL_BULLETS);
    PrecacheTexture(TEXTURE_BULLETS);
    PrecacheModel(MODEL_SHELLS);
    PrecacheTexture(TEXTURE_SHELLS);
    PrecacheModel(MODEL_MEDIUM_BULLETS);
    PrecacheTexture(TEXTURE_MEDIUM_BULLETS);
    PrecacheTexture(TEX_REFL_BWRIPLES01);
    PrecacheTexture(TEX_REFL_BWRIPLES02);
    PrecacheTexture(TEX_REFL_LIGHTMETAL01);
    PrecacheTexture(TEX_REFL_LIGHTBLUEMETAL01);
    PrecacheTexture(TEX_REFL_DARKMETAL);
    PrecacheTexture(TEX_REFL_PURPLE01);
    PrecacheTexture(TEX_SPEC_WEAK);
    PrecacheTexture(TEX_SPEC_MEDIUM);
    PrecacheTexture(TEX_SPEC_STRONG);
  }

  // render particles
  void RenderParticles(void) {
    return;
  }

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    pes->es_ctCount = 1;
    pes->es_ctAmmount = m_fValue;
    switch (m_EaitType) {
      case AIT_BULLETS:     
        pes->es_strName = "Bullets"; 
        pes->es_fValue = m_fValue*AV_BULLETS;
        break;
      case AIT_SHELLS:     
        pes->es_strName = "Shells"; 
        pes->es_fValue = m_fValue*AV_SHELLS;
        break;
      case AIT_MEDIUM_BULLETS:
        pes->es_strName = "Medium Bullets"; 
        pes->es_fValue = m_fValue*AV_MEDIUM_BULLETS;
        break;
      case AIT_STRONG_BULLETS:
        pes->es_strName = "Strong Bullets"; 
        pes->es_fValue = m_fValue*AV_STRONG_BULLETS;
        break;
    }
    pes->es_iScore = 0;//m_iScore;
    return TRUE;
  }


  // set ammo properties depending on ammo type
  void SetProperties(void)
  {
    switch (m_EaitType) {
      case AIT_BULLETS:
        m_fValue = 17.0f;
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 30.0f; 
        m_strDescription.PrintF("Bullets: %d", (int) m_fValue);
        // set appearance
        AddItem(MODEL_BULLETS, TEXTURE_BULLETS, 0, 0, 0);
        StretchItem(FLOAT3D(4.5f, 4.5f, 4.5f));
        break;
      case AIT_SHELLS:
        m_fValue = 4.0f;
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 30.0f; 
        m_strDescription.PrintF("Shells: %d", (int) m_fValue);
        // set appearance
        AddItem(MODEL_SHELLS, TEXTURE_SHELLS, 0, 0, 0);
        StretchItem(FLOAT3D(4.5f, 4.5f, 4.5f));
        break;
      case AIT_MEDIUM_BULLETS:
        m_fValue = 30.0f;
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 30.0f; 
        m_strDescription.PrintF("Medium Bullets: %d", (int) m_fValue);
        // set appearance
        AddItem(MODEL_MEDIUM_BULLETS, TEXTURE_MEDIUM_BULLETS, 0, 0, 0);
        StretchItem(FLOAT3D(4.5f, 4.5f, 4.5f));
        break;
      case AIT_STRONG_BULLETS:
        m_fValue = 7.0f;
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 30.0f; 
        m_strDescription.PrintF("Strong Bullets: %d", (int) m_fValue);
        // set appearance
        AddItem(MODEL_STRONG_BULLETS, TEXTURE_STRONG_BULLETS, 0, 0, 0);
        StretchItem(FLOAT3D(4.5f, 4.5f, 4.5f));
        break;
      default: ASSERTALWAYS("Uknown ammo");
    }
  };

  void AdjustDifficulty(void)
  {
    m_fValue = ceil(m_fValue*GetSP()->sp_fAmmoQuantity);

    if (GetSP()->sp_bInfiniteAmmo && m_penTarget==NULL) {
      Destroy();
    }
  }

procedures:
  ItemCollected(EPass epass) : CItem::ItemCollected {
    ASSERT(epass.penOther!=NULL);

    // if ammo stays
    if (GetSP()->sp_bAmmoStays && !(m_bPickupOnce||m_bRespawn)) {
      // if already picked by this player
      BOOL bWasPicked = MarkPickedBy(epass.penOther);
      if (bWasPicked) {
        // don't pick again
        return;
      }
    }

    // send ammo to entity
    EAmmoItem eAmmo;
    eAmmo.EaitType = m_EaitType;
    eAmmo.iQuantity = (INDEX) m_fValue;
    // if health is received
    if (epass.penOther->ReceiveItem(eAmmo)) {
      // play the pickup sound
      m_soPick.Set3DParameters(50.0f, 1.0f, 1.0f, 1.0f);
      if(_pNetwork->IsPlayerLocal(epass.penOther)) {IFeel_PlayEffect("PU_Ammo");}
      
      PlaySound(m_soPick, SOUND_PICK, SOF_3D);
      m_fPickSoundLen = GetSoundLength(SOUND_PICK);
      if (!GetSP()->sp_bAmmoStays || (m_bPickupOnce||m_bRespawn)) {
        jump CItem::ItemReceived();
      }
    }
    return;
  };

  Main() {
    Initialize();     // initialize base class
    StartModelAnim(ITEMHOLDER_ANIM_DEFAULT_ANIMATION, AOF_LOOPING|AOF_NORESTART);
    ForceCollisionBoxIndexChange(ITEMHOLDER_COLLISION_BOX_MEDIUM);
    SetProperties();  // set properties

    jump CItem::ItemLoop();
  };
};
