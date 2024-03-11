/* Copyright (c) 2021-2024 Uni Musuotankarep
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

1008
%{
#include "StdH.h"
#include "Models/Items/ItemHolder/ItemHolder.h"
%}

uses "EntitiesMP/Item";

// weapon type 
enum PuzzleItemType {
  0 PIT_LEVERHANDLE          "Lever Handle",
  1 PIT_LEVERMOUNT           "Lever Mount",
  2 PIT_SCREWDRIVER          "Red Screwdriver",
  3 PIT_SCREWDRIVER_ORANGE   "Orange Screwdriver",
  4 PIT_SCREWDRIVER_BLACK    "Black Screwdriver",
  5 PIT_SCREWDRIVER_HELLISH  "Hellish Screwdriver",
  6 PIT_HAMMER               "Hammer",
  7 PIT_HAMMER_HELLISH       "Hellish Hammer"
};

// event for sending through receive item
event EPuzzleItem {
  enum PuzzleItemType pitType,
};

%{

const char *GetPuzzleItemName(enum PuzzleItemType pit)
{
  switch(pit) {
  case PIT_LEVERHANDLE          :  return TRANS("Lever Handle"); break;
  case PIT_LEVERMOUNT           :  return TRANS("Lever Mount"); break;
  case PIT_SCREWDRIVER          :  return TRANS("Red Screwdriver"); break;
  case PIT_SCREWDRIVER_ORANGE   :  return TRANS("Orange Screwdriver"); break;
  case PIT_SCREWDRIVER_BLACK    :  return TRANS("Black Screwdriver"); break;
  case PIT_SCREWDRIVER_HELLISH  :  return TRANS("Hellish Screwdriver"); break;
  case PIT_HAMMER               :  return TRANS("Hammer"); break;
  case PIT_HAMMER_HELLISH       :  return TRANS("Hellish Hammer"); break;
  default: return TRANS("unknown item"); break;
  };
}

%}

class CPuzzleItem: CItem {
name      "PuzzleItem";
thumbnail "Thumbnails\\PuzzleItem.tbn";
features  "IsImportant";

properties:
  1 enum PuzzleItemType m_pitType    "Type" 'Y' = PIT_LEVERHANDLE,     // puzzle item
  3 INDEX m_iSoundComponent = 0,

components:
  0 class   CLASS_BASE        "Classes\\Item.ecl",

  // ********* LEVER PARTS *********
  1 model   MODEL_LEVERHANDLE          "Models\\Props\\Switch1Parts\\LeverHandle.mdl",
  2 texture TEXTURE_LEVER              "Models\\Props\\Switch1\\Switch1.tex",
  3 model   MODEL_LEVERMOUNT           "Models\\Props\\Switch1Parts\\LeverMount.mdl",

  // ********* SCREWDRIVERS *********
 10 model   MODEL_SCREWDRIVER             "Models\\Items\\Puzzle\\Tools\\Screwdriver.mdl",
 11 texture TEXTURE_SCREWDRIVER           "Models\\Items\\Puzzle\\Tools\\Screwdriver.tex",
 12 texture TEXTURE_SCREWDRIVER_ORANGE    "Models\\Items\\Puzzle\\Tools\\ScrewdriverOrange.tex",
 13 texture TEXTURE_SCREWDRIVER_BLACK     "Models\\Items\\Puzzle\\Tools\\ScrewdriverBlack.tex",
 14 texture TEXTURE_SCREWDRIVER_HELLISH   "Models\\Items\\Puzzle\\Tools\\ScrewdriverHellish.tex",

  // ********* HAMMERS *********
 20 model   MODEL_HAMMER                  "Models\\Items\\Puzzle\\Tools\\Hammer.mdl",
 21 texture TEXTURE_HAMMER                "Models\\Items\\Puzzle\\Tools\\Hammer.tex",
 22 texture TEXTURE_HAMMER_HELLISH        "Models\\Items\\Puzzle\\Tools\\HammerHellish.tex",

  // ********* MISC *********
  250 texture TEXTURE_FLARE       "ModelsMP\\Items\\Flares\\Flare.tex",
  251 model   MODEL_FLARE         "ModelsMP\\Items\\Flares\\Flare.mdl",
  252 texture TEX_REFL_GOLD01     "ModelsMP\\ReflectionTextures\\Gold01.tex",
  253 texture TEX_REFL_METAL01    "ModelsMP\\ReflectionTextures\\LightMetal01.tex",
  254 texture TEX_SPEC_MEDIUM     "ModelsMP\\SpecularTextures\\Medium.tex",
  255 texture TEX_SPEC_STRONG     "ModelsMP\\SpecularTextures\\Strong.tex",

  // ************** SOUNDS **************
  300 sound   SOUND_KEY         "Sounds\\Items\\KeyPickup.wav",

functions:
  void Precache(void) {
    PrecacheSound(SOUND_KEY);
  }
  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    pes->es_strName = GetPuzzleItemName(m_pitType);
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
    m_strDescription = GetPuzzleItemName(m_pitType);

    switch (m_pitType) {
      case PIT_LEVERHANDLE:
        // set appearance
        AddItem(MODEL_LEVERHANDLE, TEXTURE_LEVER, 0, 0, 0);
        StretchItem(FLOAT3D(1.0f, 1.0f, 1.0f));
        m_iSoundComponent = SOUND_KEY;
        break;
      case PIT_LEVERMOUNT:
        // set appearance
        AddItem(MODEL_LEVERMOUNT, TEXTURE_LEVER, 0, 0, 0);
        StretchItem(FLOAT3D(1.0f, 1.0f, 1.0f));
        m_iSoundComponent = SOUND_KEY;
        break;
      case PIT_SCREWDRIVER:
        // set appearance
        AddItem(MODEL_SCREWDRIVER, TEXTURE_SCREWDRIVER, 0, 0, 0);
        StretchItem(FLOAT3D(1.0f, 1.0f, 1.0f));
        m_iSoundComponent = SOUND_KEY;
        break;
      case PIT_SCREWDRIVER_ORANGE:
        // set appearance
        AddItem(MODEL_SCREWDRIVER, TEXTURE_SCREWDRIVER_ORANGE, 0, 0, 0);
        StretchItem(FLOAT3D(1.0f, 1.0f, 1.0f));
        m_iSoundComponent = SOUND_KEY;
        break;
      case PIT_SCREWDRIVER_BLACK:
        // set appearance
        AddItem(MODEL_SCREWDRIVER, TEXTURE_SCREWDRIVER_BLACK, 0, 0, 0);
        StretchItem(FLOAT3D(1.0f, 1.0f, 1.0f));
        m_iSoundComponent = SOUND_KEY;
        break;
      case PIT_SCREWDRIVER_HELLISH:
        // set appearance
        AddItem(MODEL_SCREWDRIVER, TEXTURE_SCREWDRIVER_HELLISH, 0, 0, 0);
        StretchItem(FLOAT3D(1.0f, 1.0f, 1.0f));
        m_iSoundComponent = SOUND_KEY;
        break;
      case PIT_HAMMER:
        // set appearance
        AddItem(MODEL_HAMMER, TEXTURE_HAMMER, 0, TEX_SPEC_STRONG, 0);
        StretchItem(FLOAT3D(1.0f, 1.0f, 1.0f));
        m_iSoundComponent = SOUND_KEY;
        break;
      case PIT_HAMMER_HELLISH:
        // set appearance
        AddItem(MODEL_HAMMER, TEXTURE_HAMMER_HELLISH, 0, 0, 0);
        StretchItem(FLOAT3D(1.0f, 1.0f, 1.0f));
        m_iSoundComponent = SOUND_KEY;
        break;
    }
  };

procedures:

  ItemCollected(EPass epass) : CItem::ItemCollected {
    ASSERT(epass.penOther!=NULL);

    // send key to entity
    EPuzzleItem ePuzzleItem;
    ePuzzleItem.pitType = m_pitType;
    // if health is received
    if (epass.penOther->ReceiveItem(ePuzzleItem)) {
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