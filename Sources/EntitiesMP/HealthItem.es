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

801
%{
#include "StdH.h"
#include "Models/Items/ItemHolder/ItemHolder.h"
%}

uses "EntitiesMP/Item";

// health type 
enum HealthItemType {
  0 HIT_MEDKIT      "Medkit",       // large health
};

// event for sending through receive item
event EHealth {
  FLOAT fHealth,        // health to receive
  BOOL bOverTopHealth,  // can be received over top health
};

class CHealthItem : CItem {
name      "Health Item";
thumbnail "Thumbnails\\HealthItem.tbn";

properties:
  1 enum HealthItemType m_EhitType    "Type" 'Y' = HIT_MEDKIT,     // health type
  2 BOOL m_bOverTopHealth             = FALSE,  // can be received over top health
  3 INDEX m_iSoundComponent = 0,

components:
  0 class   CLASS_BASE        "Classes\\Item.ecl",

// ********* PILL HEALTH *********
  1 model   MODEL_MEDKIT        "Models\\Items\\Health\\Medkit.mdl",
  2 texture TEXTURE_MEDKIT      "Models\\Items\\Health\\LargeHealth.tex",

// ********* MISC *********
 50 texture TEXTURE_SPECULAR_STRONG "Models\\SpecularTextures\\Strong.tex",
 51 texture TEXTURE_SPECULAR_MEDIUM "Models\\SpecularTextures\\Medium.tex",
 52 texture TEXTURE_REFLECTION_LIGHTMETAL01 "Models\\ReflectionTextures\\LightMetal01.tex",
 53 texture TEXTURE_REFLECTION_GOLD01 "Models\\ReflectionTextures\\Gold01.tex",
 54 texture TEXTURE_REFLECTION_PUPLE01 "Models\\ReflectionTextures\\Purple01.tex",
 55 texture TEX_REFL_BWRIPLES02         "Models\\ReflectionTextures\\BWRiples02.tex",

// ************** SOUNDS **************
301 sound   SOUND_MEDKIT       "Sounds\\Items\\HealthPickup.wav",

functions:
  void Precache(void) {
    switch (m_EhitType) {
      case HIT_MEDKIT:   PrecacheSound(SOUND_MEDKIT  ); break;
    }
  }
  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    pes->es_strName = "Health"; 
    pes->es_ctCount = 1;
    pes->es_ctAmmount = m_fValue;
    pes->es_fValue = m_fValue;
    pes->es_iScore = 0;//m_iScore;
    
    switch (m_EhitType) {
      case HIT_MEDKIT:  pes->es_strName+=" medkit";   break;
    }

    return TRUE;
  }

  // render particles
  void RenderParticles(void) {
    return;
  }

  // set health properties depending on health type
  void SetProperties(void) {
    switch (m_EhitType) {
      case HIT_MEDKIT:
        StartModelAnim(ITEMHOLDER_ANIM_DEFAULT_ANIMATION, AOF_LOOPING|AOF_NORESTART);
        ForceCollisionBoxIndexChange(ITEMHOLDER_COLLISION_BOX_MEDIUM);
        m_fValue = 25.0f;
        m_bOverTopHealth = FALSE;
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 10.0f; 
        m_strDescription.PrintF("Medkit - H:%g  T:%g", m_fValue, m_fRespawnTime);
        // set appearance
        AddItem(MODEL_MEDKIT, TEXTURE_MEDKIT, TEX_REFL_BWRIPLES02, TEXTURE_SPECULAR_STRONG, 0);
        StretchItem(FLOAT3D(4.5f, 4.5f, 4.5f));
        m_iSoundComponent = SOUND_MEDKIT;
        break;
    }
  };

  void AdjustDifficulty(void)
  {
    if (!GetSP()->sp_bAllowHealth && m_penTarget==NULL) {
      Destroy();
    }
  }
procedures:
  ItemCollected(EPass epass) : CItem::ItemCollected {
    ASSERT(epass.penOther!=NULL);

    // if health stays
    if (GetSP()->sp_bHealthArmorStays && !(m_bPickupOnce||m_bRespawn)) {
      // if already picked by this player
      BOOL bWasPicked = MarkPickedBy(epass.penOther);
      if (bWasPicked) {
        // don't pick again
        return;
      }
    }

    // send health to entity
    EHealth eHealth;
    eHealth.fHealth = m_fValue;
    eHealth.bOverTopHealth = m_bOverTopHealth;
    // if health is received
    if (epass.penOther->ReceiveItem(eHealth)) {

      if(_pNetwork->IsPlayerLocal(epass.penOther))
      {
        switch (m_EhitType)
        {
          case HIT_MEDKIT:  IFeel_PlayEffect("PU_HealthMedkit"); break;
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
    SetProperties();  // set properties

    jump CItem::ItemLoop();
  };
};
