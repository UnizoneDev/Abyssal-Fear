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

805
%{
#include "StdH.h"
#include "Models/Items/ItemHolder/ItemHolder.h"
%}

uses "EntitiesMP/Item";

// key type 
enum KeyItemType {
  0 KIT_CROSSWOODEN       "Wooden cross",
  1 KIT_SWASTIKAGOLDEN    "Golden swastika",
  2 KIT_CROSSGOLDEN       "Golden cross",
  3 KIT_KEYRUSTED         "Rusted key",
  4 KIT_KEYSILVER         "Silver key",
  5 KIT_KEYGOLDEN         "Golden key",
};

// event for sending through receive item
event EKey {
  enum KeyItemType kitType,
};

%{

const char *GetKeyName(enum KeyItemType kit)
{
  switch(kit) {
  case KIT_CROSSWOODEN         :  return TRANS("Wooden Cross"); break;
  case KIT_SWASTIKAGOLDEN      :  return TRANS("Golden Swastika"); break;
  case KIT_CROSSGOLDEN         :  return TRANS("Golden Cross"); break;
  case KIT_KEYRUSTED           :  return TRANS("Rusted Key"); break;
  case KIT_KEYSILVER           :  return TRANS("Silver Key"); break;
  case KIT_KEYGOLDEN           :  return TRANS("Golden Key"); break;
  default: return TRANS("unknown item"); break;
  };
}

%}

class CKeyItem : CItem {
name      "KeyItem";
thumbnail "Thumbnails\\KeyItem.tbn";
features  "IsImportant";

properties:
  1 enum KeyItemType m_kitType    "Type" 'Y' = KIT_CROSSWOODEN, // key type
  3 INDEX m_iSoundComponent = 0,
  5 FLOAT m_fSize "Size" = 1.0f,

components:
  0 class   CLASS_BASE        "Classes\\Item.ecl",

// ********* ANKH KEY *********
  1 model   MODEL_CROSSWOODEN          "Models\\Items\\Keys\\WoodenCross\\WoodenCross.mdl",
  2 texture TEXTURE_CROSSWOODEN        "Models\\Items\\Keys\\WoodenCross\\wood1.tex",
  3 model   MODEL_SWASTIKAGOLDEN       "Models\\Items\\Keys\\GoldenSwastika\\Swastika.mdl",
  4 texture TEXTURE_SWASTIKAGOLDEN     "Models\\Items\\Keys\\GoldenSwastika\\gold1.tex",
  5 model   MODEL_CROSSGOLDEN          "Models\\Items\\Keys\\GoldenCross\\GoldenCross.mdl",
  6 model   MODEL_KEYRUSTED            "Models\\Items\\Keys\\RustedKey\\RustedKey.mdl",
  7 texture TEXTURE_KEYRUSTED          "Models\\Items\\Keys\\RustedKey\\rust1.tex",
  8 model   MODEL_KEYSILVER            "Models\\Items\\Keys\\SilverKey\\SilverKey.mdl",
  9 texture TEXTURE_KEYSILVER          "Models\\Items\\Keys\\SilverKey\\metal11.tex",
 10 model   MODEL_KEYGOLDEN            "Models\\Items\\Keys\\GoldenKey\\GoldenKey.mdl",

 // ********* MISC *********
250 texture TEX_REFL_GOLD01     "ModelsMP\\ReflectionTextures\\Gold01.tex",
251 texture TEX_REFL_METAL01    "ModelsMP\\ReflectionTextures\\LightMetal01.tex",
252 texture TEX_SPEC_MEDIUM     "ModelsMP\\SpecularTextures\\Medium.tex",
253 texture TEX_SPEC_STRONG     "ModelsMP\\SpecularTextures\\Strong.tex",

// ************** SOUNDS **************
300 sound   SOUND_KEY         "Sounds\\Items\\KeyPickup.wav",

functions:
  void Precache(void) {
    PrecacheSound(SOUND_KEY);
  }
  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    pes->es_strName = GetKeyName(m_kitType);
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
  


  // set health properties depending on type
  void SetProperties(void)
  {
    m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 10.0f; 
    m_strDescription = GetKeyName(m_kitType);

    switch (m_kitType) {
      case KIT_CROSSWOODEN:
        // set appearance
        AddItem(MODEL_CROSSWOODEN, TEXTURE_CROSSWOODEN, 0, 0, 0);
        StretchItem(FLOAT3D(1.0f, 1.0f, 1.0f));
        m_iSoundComponent = SOUND_KEY;
        break;
      case KIT_SWASTIKAGOLDEN:
        // set appearance
        AddItem(MODEL_SWASTIKAGOLDEN, TEXTURE_SWASTIKAGOLDEN, TEX_REFL_GOLD01, TEX_SPEC_STRONG, 0);
        StretchItem(FLOAT3D(1.0f, 1.0f, 1.0f));
        m_iSoundComponent = SOUND_KEY;
        break;
      case KIT_CROSSGOLDEN:
        // set appearance
        AddItem(MODEL_CROSSGOLDEN, TEXTURE_SWASTIKAGOLDEN, TEX_REFL_GOLD01, TEX_SPEC_STRONG, 0);
        StretchItem(FLOAT3D(1.0f, 1.0f, 1.0f));
        m_iSoundComponent = SOUND_KEY;
        break;
      case KIT_KEYRUSTED:
        // set appearance
        AddItem(MODEL_KEYRUSTED, TEXTURE_KEYRUSTED, 0, 0, 0);
        StretchItem(FLOAT3D(1.25f, 1.25f, 1.25f));
        m_iSoundComponent = SOUND_KEY;
        break;
      case KIT_KEYSILVER:
        // set appearance
        AddItem(MODEL_KEYSILVER, TEXTURE_KEYSILVER, TEX_REFL_METAL01, TEX_SPEC_STRONG, 0);
        StretchItem(FLOAT3D(1.25f, 1.25f, 1.25f));
        m_iSoundComponent = SOUND_KEY;
        break;
      case KIT_KEYGOLDEN:
        // set appearance
        AddItem(MODEL_KEYGOLDEN, TEXTURE_SWASTIKAGOLDEN, TEX_REFL_GOLD01, TEX_SPEC_STRONG, 0);
        StretchItem(FLOAT3D(1.25f, 1.25f, 1.25f));
        m_iSoundComponent = SOUND_KEY;
        break;
    }
    GetModelObject()->StretchModel(FLOAT3D(m_fSize, m_fSize, m_fSize));
  };

procedures:
  ItemCollected(EPass epass) : CItem::ItemCollected {
    ASSERT(epass.penOther!=NULL);

    // send key to entity
    EKey eKey;
    eKey.kitType = m_kitType;
    // if health is received
    if (epass.penOther->ReceiveItem(eKey)) {
      if(_pNetwork->IsPlayerLocal(epass.penOther)) {IFeel_PlayEffect("PU_Key");}
      // play the pickup sound
      m_soPick.Set3DParameters(50.0f, 1.0f, 1.0f, 1.0f);
      PlaySound(m_soPick, m_iSoundComponent, SOF_3D);
      m_fPickSoundLen = GetSoundLength(m_iSoundComponent);
      jump CItem::ItemReceived();
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
