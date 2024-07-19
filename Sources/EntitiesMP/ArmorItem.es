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

804
%{
#include "StdH.h"
#include "Models/Items/ItemHolder/ItemHolder.h"
%}

uses "EntitiesMP/Item";

// health type 
enum ArmorItemType {
  0 ARIT_VEST         "Vest",     // normal armor
};

// event for sending through receive item
event EArmor {
  FLOAT fArmor,         // armor to receive
  BOOL bOverTopArmor,   // can be received over top armor
};

class CArmorItem : CItem {
name      "Armor Item";
thumbnail "Thumbnails\\ArmorItem.tbn";

properties:
  1 enum ArmorItemType m_EaitType     "Type" 'Y' = ARIT_VEST,    // armor type
  2 BOOL m_bOverTopArmor  = FALSE,   // can be received over top armor
  3 INDEX m_iSoundComponent = 0,
  4 FLOAT m_fCustomValue "Value Override" = 0.0f,                  // editable value

components:
  0 class   CLASS_BASE        "Classes\\Item.ecl",

// ********* SHARD *********
  1 model   MODEL_VEST        "Models\\Items\\Armor\\VestArmor.mdl",
  2 texture TEXTURE_VEST      "Models\\Items\\Armor\\VestArmor.tex",

// ************** REFLECTIONS **************
200 texture TEX_REFL_LIGHTMETAL01       "Models\\ReflectionTextures\\LightMetal01.tex",

// ************** SPECULAR **************
210 texture TEX_SPEC_MEDIUM             "Models\\SpecularTextures\\Medium.tex",

// ************** SOUNDS **************
301 sound   SOUND_VEST        "Sounds\\Items\\ArmorPickup.wav",

functions:
  void Precache(void) {
    switch (m_EaitType) {
      case ARIT_VEST:   PrecacheSound(SOUND_VEST ); break;
    }
  }
  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    pes->es_strName = "Armor"; 
    pes->es_ctCount = 1;
    pes->es_ctAmmount = m_fValue;
    pes->es_fValue = m_fValue*2;
    pes->es_iScore = 0;//m_iScore;
    switch (m_EaitType) {
      case ARIT_VEST:  pes->es_strName+=" vest";  break;
    }
    return TRUE;
  }

  // render particles
  void RenderParticles(void) {
    return;
  }

  // set health properties depending on health type
  void SetProperties(void) {
    switch (m_EaitType) {
      case ARIT_VEST:
        ForceCollisionBoxIndexChange(ITEMHOLDER_COLLISION_BOX_MEDIUM);
        m_fValue = 100.0f;
        if(m_fCustomValue > 0) {
          m_fValue = m_fCustomValue;
        }
        m_bOverTopArmor = FALSE;
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 60.0f; 
        m_strDescription.PrintF("Vest - H:%g  T:%g", m_fValue, m_fRespawnTime);
        // set appearance
        AddItem(MODEL_VEST, TEXTURE_VEST, 0, 0, 0);
        StretchItem(FLOAT3D(2.0f, 2.0f, 2.0f));
        m_iSoundComponent = SOUND_VEST;
        break;
    }
  };

  void AdjustDifficulty(void)
  {
    if (!GetSP()->sp_bAllowArmor && m_penTarget==NULL) {
      Destroy();
    }
  }

procedures:
  ItemCollected(EPass epass) : CItem::ItemCollected {
    ASSERT(epass.penOther!=NULL);

    // if armor stays
    if (GetSP()->sp_bHealthArmorStays && !(m_bPickupOnce||m_bRespawn)) {
      // if already picked by this player
      BOOL bWasPicked = MarkPickedBy(epass.penOther);
      if (bWasPicked) {
        // don't pick again
        return;
      }
    }

    // send health to entity
    EArmor eArmor;
    eArmor.fArmor = m_fValue;
    eArmor.bOverTopArmor = m_bOverTopArmor;
    // if health is received
    if (epass.penOther->ReceiveItem(eArmor)) {

      if(_pNetwork->IsPlayerLocal(epass.penOther))
      {
        switch (m_EaitType)
        {
          case ARIT_VEST: IFeel_PlayEffect("PU_ArmourStrong"); break;
        }
      }

      // play the pickup sound
      m_soPick.Set3DParameters(50.0f, 1.0f, 1.0f, 1.0f);
      PlaySound(m_soPick, m_iSoundComponent, SOF_3D);
      m_fPickSoundLen = GetSoundLength(m_iSoundComponent);

      if (!GetSP()->sp_bHealthArmorStays || (m_bPickupOnce||m_bRespawn)) {
        jump CItem::ItemReceived();
      }
    }
    return;
  };

  Main() {
    Initialize();     // initialize base class
    StartModelAnim(ITEMHOLDER_ANIM_DEFAULT_ANIMATION, AOF_LOOPING|AOF_NORESTART);
    SetProperties();  // set properties

    jump CItem::ItemLoop();
  };
};
