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

1018
%{
#include "StdH.h"
#include "Models/NPCs/Twitcher/BaldTwitcher/TwitcherBald.h"
#include "Models/NPCs/Twitcher/FemaleTwitcher/TwitcherFemale.h"
#include "Models/NPCs/Twitcher/MaleTwitcher/TwitcherMale.h"
#include "Models/NPCs/Twitcher/StrongTwitcher/TwitcherStrong.h"
#include "Models/NPCs/Twitcher/BladedTwitcher/TwitcherBladed.h"
#include "Models/NPCs/Twitcher/MaleTwitcher2/TwitcherMale2.h"
#include "Models/NPCs/Twitcher/FemaleTwitcher2/TwitcherFemale2.h"
#include "Models/NPCs/Twitcher/BladedTwitcher2/TwitcherBladed2.h"
#include "Models/NPCs/Twitcher/BladedTwitcher3/TwitcherBladed3.h"
#include "Models/NPCs/Twitcher/SkinnedTwitcher/TwitcherSkinned.h"
#include "Models/NPCs/Twitcher/BladedTwitcher4/TwitcherBladed4.h"
#include "Models/NPCs/Twitcher/ShadowTwitcher/TwitcherShadow.h"
#include "Models/NPCs/Twitcher/MaleTwitcher3/TwitcherMale3.h"
#include "Models/NPCs/Twitcher/PaleBladedTwitcher/TwitcherPaleBladed.h"
#include "Models/NPCs/Twitcher/NightmareBladedTwitcher/TwitcherNightmareBladed.h"
%}

uses "EntitiesMP/EnemyBase";
uses "EntitiesMP/Projectile";

enum TwitcherType {
  0 TWC_BALDWHITE        "Bald White",
  1 TWC_BALDBLACK        "Bald Black",
  2 TWC_FEMALEWHITE      "Female White",
  3 TWC_FEMALEPALE       "Female Pale",
  4 TWC_MALEWHITE        "Male 1 White",
  5 TWC_MALEBLACK        "Male 1 Black",
  6 TWC_STRONGPALE       "Strong Pale",
  7 TWC_STRONGBLADED     "Bladed 1",
  8 TWC_MALE2WHITE       "Male 2 White",
  9 TWC_MALE2BLACK       "Male 2 Black",
 10 TWC_FEMALE2PALE      "Bride Pale",
 11 TWC_STRONGCORPSE     "Strong Corpse",
 12 TWC_STRONGBLADED2    "Bladed 2",
 13 TWC_STRONGBLADED3    "Bladed 3",
 14 TWC_SKINNEDBLADED    "Skinned Bladed",
 15 TWC_STRONGBLADED4    "Bladed 4",
 16 TWC_NIGHTMARESHADOW  "Nightmare Shadow",
 17 TWC_MALE3WHITE       "Male 3 White",
 18 TWC_MALE3BLACK       "Male 3 Black",
 19 TWC_STRONGBLADEDPALE "Pale Bladed",
 20 TWC_NIGHTMAREBLADED  "Nightmare Bladed",
};

%{

// info structure
static EntityInfo eiTwitcher = {
  EIBT_FLESH, 200.0f,
  0.0f, 1.75f, 0.0f,     // source (eyes)
  0.0f, 1.0f, 0.0f,     // target (body)
};

%}


class CTwitcher: CEnemyBase {
name      "Twitcher";
thumbnail "Thumbnails\\Twitcher.tbn";

properties:
  1 BOOL m_bFistHit = FALSE,
  2 enum TwitcherType m_twChar "Character" 'C' = TWC_BALDWHITE,   // character
  3 BOOL m_bMoveFast "Move Fast" = FALSE,
  4 BOOL m_bAllowInfighting "Allow Infighting" = FALSE,
  
components:
  1 class   CLASS_BASE            "Classes\\EnemyBase.ecl",
  2 class   CLASS_PROJECTILE      "Classes\\Projectile.ecl",

 10 model   MODEL_TWITCHERBALD               "Models\\NPCs\\Twitcher\\BaldTwitcher\\TwitcherBald.mdl",
 11 texture TEXTURE_TWITCHERBALD_WHITE       "Models\\NPCs\\Twitcher\\BaldTwitcher\\Twitcher1.tex",
 12 texture TEXTURE_TWITCHERBALD_BLACK       "Models\\NPCs\\Twitcher\\BaldTwitcher\\Twitcher1b.tex",
 13 model   MODEL_TWITCHERFEMALE             "Models\\NPCs\\Twitcher\\FemaleTwitcher\\TwitcherFemale.mdl",
 14 texture TEXTURE_TWITCHERFEMALE_WHITE     "Models\\NPCs\\Twitcher\\FemaleTwitcher\\Twitcher1c.tex",
 15 texture TEXTURE_TWITCHERFEMALE_PALE      "Models\\NPCs\\Twitcher\\FemaleTwitcher\\Twitcher1d.tex",
 16 model   MODEL_TWITCHERMALE               "Models\\NPCs\\Twitcher\\MaleTwitcher\\TwitcherMale.mdl",
 17 texture TEXTURE_TWITCHERMALE_WHITE       "Models\\NPCs\\Twitcher\\MaleTwitcher\\Twitcher1e.tex",
 18 texture TEXTURE_TWITCHERMALE_BLACK       "Models\\NPCs\\Twitcher\\MaleTwitcher\\Twitcher1f.tex",
 19 model   MODEL_TWITCHERSTRONG             "Models\\NPCs\\Twitcher\\StrongTwitcher\\TwitcherStrong.mdl",
 20 texture TEXTURE_TWITCHERSTRONG_PALE      "Models\\NPCs\\Twitcher\\StrongTwitcher\\Twitcher1g.tex",
 21 model   MODEL_TWITCHERBLADED             "Models\\NPCs\\Twitcher\\BladedTwitcher\\TwitcherBladed.mdl",
 22 texture TEXTURE_TWITCHERBLADED           "Models\\NPCs\\Twitcher\\BladedTwitcher\\Twitcher1h.tex",
 23 model   MODEL_TWITCHERMALE2              "Models\\NPCs\\Twitcher\\MaleTwitcher2\\TwitcherMale2.mdl",
 24 texture TEXTURE_TWITCHERMALE2_WHITE      "Models\\NPCs\\Twitcher\\MaleTwitcher2\\Twitcher1i.tex",
 25 texture TEXTURE_TWITCHERMALE2_BLACK      "Models\\NPCs\\Twitcher\\MaleTwitcher2\\Twitcher1j.tex",
 26 model   MODEL_TWITCHERFEMALE2            "Models\\NPCs\\Twitcher\\FemaleTwitcher2\\TwitcherFemale2.mdl",
 27 texture TEXTURE_TWITCHERFEMALE2_PALE     "Models\\NPCs\\Twitcher\\FemaleTwitcher2\\Twitcher1k.tex",
 28 texture TEXTURE_TWITCHERSTRONG_CORPSE    "Models\\NPCs\\Twitcher\\StrongTwitcher\\Twitcher1l.tex",
 60 model   MODEL_TWITCHERBLADED2            "Models\\NPCs\\Twitcher\\BladedTwitcher2\\TwitcherBladed2.mdl",
 61 texture TEXTURE_TWITCHERBLADED2          "Models\\NPCs\\Twitcher\\BladedTwitcher2\\Twitcher1m.tex",
 62 model   MODEL_TWITCHERBLADED3            "Models\\NPCs\\Twitcher\\BladedTwitcher3\\TwitcherBladed3.mdl",
 63 texture TEXTURE_TWITCHERBLADED3          "Models\\NPCs\\Twitcher\\BladedTwitcher3\\Twitcher1n.tex",
 64 model   MODEL_TWITCHERSKINNED            "Models\\NPCs\\Twitcher\\SkinnedTwitcher\\TwitcherSkinned.mdl",
 65 texture TEXTURE_TWITCHERSKINNED          "Models\\NPCs\\Twitcher\\SkinnedTwitcher\\Twitcher1p.tex",
 66 model   MODEL_TWITCHERBLADED4            "Models\\NPCs\\Twitcher\\BladedTwitcher4\\TwitcherBladed4.mdl",
 67 texture TEXTURE_TWITCHERBLADED4          "Models\\NPCs\\Twitcher\\BladedTwitcher4\\Twitcher1q.tex",
 68 model   MODEL_TWITCHERSHADOW             "Models\\NPCs\\Twitcher\\ShadowTwitcher\\TwitcherShadow.mdl",
 69 texture TEXTURE_TWITCHERSHADOW           "Models\\NPCs\\Twitcher\\ShadowTwitcher\\Twitcher1r.tex",
 70 model   MODEL_TWITCHERMALE3              "Models\\NPCs\\Twitcher\\MaleTwitcher3\\TwitcherMale3.mdl",
 71 texture TEXTURE_TWITCHERMALE3_WHITE      "Models\\NPCs\\Twitcher\\MaleTwitcher3\\Twitcher1s.tex",
 72 texture TEXTURE_TWITCHERMALE3_BLACK      "Models\\NPCs\\Twitcher\\MaleTwitcher3\\Twitcher1t.tex",
 73 model   MODEL_TWITCHERBLADEDPALE         "Models\\NPCs\\Twitcher\\PaleBladedTwitcher\\TwitcherPaleBladed.mdl",
 74 texture TEXTURE_TWITCHERBLADEDPALE       "Models\\NPCs\\Twitcher\\PaleBladedTwitcher\\Twitcher1u.tex",
 76 model   MODEL_TWITCHERBLADEDNIGHTMARE    "Models\\NPCs\\Twitcher\\NightmareBladedTwitcher\\TwitcherNightmareBladed.mdl",
 77 texture TEXTURE_TWITCHERBLADEDNIGHTMARE  "Models\\NPCs\\Twitcher\\NightmareBladedTwitcher\\Twitcher1v.tex",

 30 sound   SOUND_HIT                  "Models\\NPCs\\Gunman\\Sounds\\Kick.wav",
 31 sound   SOUND_SWING                "Models\\Weapons\\Knife\\Sounds\\Swing.wav",
 75 sound   SOUND_SLICE                "Models\\NPCs\\Twitcher\\Sounds\\Slice.wav",

 32 sound   SOUND_SIGHT1               "Models\\NPCs\\Twitcher\\Sounds\\Sight1.wav",
 33 sound   SOUND_SIGHT2               "Models\\NPCs\\Twitcher\\Sounds\\Sight2.wav",
 34 sound   SOUND_WOUND1               "Models\\NPCs\\Twitcher\\Sounds\\Wound1.wav",
 35 sound   SOUND_WOUND2               "Models\\NPCs\\Twitcher\\Sounds\\Wound2.wav",
 36 sound   SOUND_IDLE1                "Models\\NPCs\\Twitcher\\Sounds\\Idle1.wav",
 37 sound   SOUND_IDLE2                "Models\\NPCs\\Twitcher\\Sounds\\Idle2.wav",
 38 sound   SOUND_DEATH1               "Models\\NPCs\\Twitcher\\Sounds\\Death1.wav",
 39 sound   SOUND_DEATH2               "Models\\NPCs\\Twitcher\\Sounds\\Death2.wav",

 40 sound   SOUND_STRONG_SIGHT1        "Models\\NPCs\\Twitcher\\Sounds\\StrongSight1.wav",
 41 sound   SOUND_STRONG_SIGHT2        "Models\\NPCs\\Twitcher\\Sounds\\StrongSight2.wav",
 42 sound   SOUND_STRONG_WOUND1        "Models\\NPCs\\Twitcher\\Sounds\\StrongWound1.wav",
 43 sound   SOUND_STRONG_WOUND2        "Models\\NPCs\\Twitcher\\Sounds\\StrongWound2.wav",
 44 sound   SOUND_STRONG_IDLE1         "Models\\NPCs\\Twitcher\\Sounds\\StrongIdle1.wav",
 45 sound   SOUND_STRONG_IDLE2         "Models\\NPCs\\Twitcher\\Sounds\\StrongIdle2.wav",
 46 sound   SOUND_STRONG_DEATH1        "Models\\NPCs\\Twitcher\\Sounds\\StrongDeath1.wav",
 47 sound   SOUND_STRONG_DEATH2        "Models\\NPCs\\Twitcher\\Sounds\\StrongDeath2.wav",

 50 sound   SOUND_BRIDE_SIGHT1        "Models\\NPCs\\Twitcher\\Sounds\\BrideSight1.wav",
 51 sound   SOUND_BRIDE_SIGHT2        "Models\\NPCs\\Twitcher\\Sounds\\BrideSight2.wav",
 52 sound   SOUND_BRIDE_WOUND1        "Models\\NPCs\\Twitcher\\Sounds\\BrideWound1.wav",
 53 sound   SOUND_BRIDE_WOUND2        "Models\\NPCs\\Twitcher\\Sounds\\BrideWound2.wav",
 54 sound   SOUND_BRIDE_IDLE1         "Models\\NPCs\\Twitcher\\Sounds\\BrideIdle1.wav",
 55 sound   SOUND_BRIDE_IDLE2         "Models\\NPCs\\Twitcher\\Sounds\\BrideIdle2.wav",
 56 sound   SOUND_BRIDE_DEATH1        "Models\\NPCs\\Twitcher\\Sounds\\BrideDeath1.wav",
 57 sound   SOUND_BRIDE_DEATH2        "Models\\NPCs\\Twitcher\\Sounds\\BrideDeath2.wav",

functions:
  // describe how this enemy killed player
  virtual CTString GetPlayerKillDescription(const CTString &strPlayerName, const EDeath &eDeath)
  {
    CTString str;
      str.PrintF(TRANS("A Twitcher slashed %s"), strPlayerName);
    return str;
  }

  /* Entity info */
  void *GetEntityInfo(void) {
    return &eiTwitcher;
  };

  virtual const CTFileName &GetComputerMessageName(void) const {
    static DECLARE_CTFILENAME(fnmTwitcherBald, "Data\\Messages\\NPCs\\TwitcherBald.txt");
    static DECLARE_CTFILENAME(fnmTwitcherFemale, "Data\\Messages\\NPCs\\TwitcherFemale.txt");
    static DECLARE_CTFILENAME(fnmTwitcherMale, "Data\\Messages\\NPCs\\TwitcherMale.txt");
    static DECLARE_CTFILENAME(fnmTwitcherStrong, "Data\\Messages\\NPCs\\TwitcherStrong.txt");
    static DECLARE_CTFILENAME(fnmTwitcherBladed, "Data\\Messages\\NPCs\\TwitcherBladed.txt");
    static DECLARE_CTFILENAME(fnmTwitcherMale2, "Data\\Messages\\NPCs\\TwitcherMale2.txt");
    static DECLARE_CTFILENAME(fnmTwitcherFemale2, "Data\\Messages\\NPCs\\TwitcherFemale2.txt");
    static DECLARE_CTFILENAME(fnmTwitcherSkinned, "Data\\Messages\\NPCs\\TwitcherSkinned.txt");
    static DECLARE_CTFILENAME(fnmTwitcherShadow, "Data\\Messages\\NPCs\\TwitcherShadow.txt");
    static DECLARE_CTFILENAME(fnmTwitcherMale3, "Data\\Messages\\NPCs\\TwitcherMale3.txt");
    static DECLARE_CTFILENAME(fnmTwitcherNightmareBladed, "Data\\Messages\\NPCs\\TwitcherNightmareBladed.txt");
    switch(m_twChar) {
    default: ASSERT(FALSE);
    case TWC_BALDWHITE: case TWC_BALDBLACK: return fnmTwitcherBald;
    case TWC_FEMALEWHITE: case TWC_FEMALEPALE: return fnmTwitcherFemale;
    case TWC_MALEWHITE: case TWC_MALEBLACK: return fnmTwitcherMale;
    case TWC_STRONGPALE: case TWC_STRONGCORPSE: return fnmTwitcherStrong;
    case TWC_STRONGBLADED: case TWC_STRONGBLADED2: case TWC_STRONGBLADED3: case TWC_STRONGBLADED4: case TWC_STRONGBLADEDPALE: return fnmTwitcherBladed;
    case TWC_MALE2WHITE: case TWC_MALE2BLACK: return fnmTwitcherMale2;
    case TWC_FEMALE2PALE: return fnmTwitcherFemale2;
    case TWC_SKINNEDBLADED: return fnmTwitcherSkinned;
    case TWC_NIGHTMARESHADOW: return fnmTwitcherShadow;
    case TWC_MALE3WHITE: case TWC_MALE3BLACK: return fnmTwitcherMale3;
    case TWC_NIGHTMAREBLADED: return fnmTwitcherNightmareBladed;
    }
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_HIT);
    PrecacheSound(SOUND_SWING);
    PrecacheSound(SOUND_SLICE);

    PrecacheSound(SOUND_IDLE1);
    PrecacheSound(SOUND_SIGHT1);
    PrecacheSound(SOUND_WOUND1);
    PrecacheSound(SOUND_DEATH1);
    PrecacheSound(SOUND_IDLE2);
    PrecacheSound(SOUND_SIGHT2);
    PrecacheSound(SOUND_WOUND2);
    PrecacheSound(SOUND_DEATH2);

    PrecacheSound(SOUND_STRONG_IDLE1);
    PrecacheSound(SOUND_STRONG_SIGHT1);
    PrecacheSound(SOUND_STRONG_WOUND1);
    PrecacheSound(SOUND_STRONG_DEATH1);
    PrecacheSound(SOUND_STRONG_IDLE2);
    PrecacheSound(SOUND_STRONG_SIGHT2);
    PrecacheSound(SOUND_STRONG_WOUND2);
    PrecacheSound(SOUND_STRONG_DEATH2);

    PrecacheSound(SOUND_BRIDE_IDLE1);
    PrecacheSound(SOUND_BRIDE_SIGHT1);
    PrecacheSound(SOUND_BRIDE_WOUND1);
    PrecacheSound(SOUND_BRIDE_DEATH1);
    PrecacheSound(SOUND_BRIDE_IDLE2);
    PrecacheSound(SOUND_BRIDE_SIGHT2);
    PrecacheSound(SOUND_BRIDE_WOUND2);
    PrecacheSound(SOUND_BRIDE_DEATH2);

    PrecacheClass(CLASS_PROJECTILE, PRT_MUTANT_SPIT);
  };

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    CEnemyBase::FillEntityStatistics(pes);
    switch(m_twChar) {
    case TWC_BALDWHITE: { pes->es_strName+=" Bald White"; } break;
    case TWC_BALDBLACK: { pes->es_strName+=" Bald Black"; } break;
    case TWC_FEMALEWHITE: { pes->es_strName+=" Female White"; } break;
    case TWC_FEMALEPALE: { pes->es_strName+=" Female Pale"; } break;
    case TWC_MALEWHITE: { pes->es_strName+=" Male 1 White"; } break;
    case TWC_MALEBLACK: { pes->es_strName+=" Male 1 Black"; } break;
    case TWC_STRONGPALE: { pes->es_strName+=" Strong Pale"; } break;
    case TWC_STRONGBLADED: { pes->es_strName+=" Bladed 1"; } break;
    case TWC_MALE2WHITE: { pes->es_strName+=" Male 2 White"; } break;
    case TWC_MALE2BLACK: { pes->es_strName+=" Male 2 Black"; } break;
    case TWC_FEMALE2PALE: { pes->es_strName+=" Bride Pale"; } break;
    case TWC_STRONGCORPSE: { pes->es_strName+=" Strong Corpse"; } break;
    case TWC_STRONGBLADED2: { pes->es_strName+=" Bladed 2"; } break;
    case TWC_STRONGBLADED3: { pes->es_strName+=" Bladed 3"; } break;
    case TWC_SKINNEDBLADED: { pes->es_strName+=" Skinned Bladed"; } break;
    case TWC_STRONGBLADED4: { pes->es_strName+=" Bladed 4"; } break;
    case TWC_NIGHTMARESHADOW: { pes->es_strName+=" Nightmare Shadow"; } break;
    case TWC_MALE3WHITE: { pes->es_strName+=" Male 3 White"; } break;
    case TWC_MALE3BLACK: { pes->es_strName+=" Male 3 Black"; } break;
    case TWC_STRONGBLADEDPALE: { pes->es_strName+=" Bladed Pale"; } break;
    case TWC_NIGHTMAREBLADED: { pes->es_strName+=" Bladed Nightmare"; } break;
    }
    return TRUE;
  }

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection) 
  {
    if(m_bAllowInfighting) {
      CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection);
      if(IsOfClass(penInflictor, "Twitcher")) {
        CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection);
        SetTargetHardForce(penInflictor);
        // if died of chainsaw
        if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
          // must always blowup
          m_fBlowUpAmount = 0;
        }
      }

      
    } else {
      // twitcher can't harm twitcher
      if (!IsOfClass(penInflictor, "Twitcher")) {
        CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection);
        // if died of chainsaw
        if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
          // must always blowup
          m_fBlowUpAmount = 0;
        }
      }
    }
  };


  // damage anim
  INDEX AnimForDamage(FLOAT fDamage) {
    INDEX iAnim;

    if(m_twChar == TWC_NIGHTMAREBLADED)
    {
      iAnim = TWITCHERNIGHTMAREBLADED_ANIM_WOUND;
    }
    else if(m_twChar == TWC_STRONGBLADEDPALE)
    {
      iAnim = TWITCHERPALEBLADED_ANIM_WOUND;
    }
    else if(m_twChar == TWC_MALE3WHITE || m_twChar == TWC_MALE3BLACK)
    {
      iAnim = TWITCHERMALE3_ANIM_WOUND;
    }
    else if(m_twChar == TWC_NIGHTMARESHADOW)
    {
      iAnim = TWITCHERSHADOW_ANIM_WOUND;
    }
    else if(m_twChar == TWC_STRONGBLADED4)
    {
      iAnim = TWITCHERBLADED4_ANIM_WOUND;
    }
    else if(m_twChar == TWC_SKINNEDBLADED)
    {
      iAnim = TWITCHERSKINNED_ANIM_WOUND;
    }
    else if(m_twChar == TWC_STRONGBLADED3)
    {
      iAnim = TWITCHERBLADED3_ANIM_WOUND;
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      iAnim = TWITCHERBLADED2_ANIM_WOUND;
    }
    else if(m_twChar == TWC_FEMALE2PALE)
    {
      iAnim = TWITCHERFEMALE2_ANIM_WOUND;
    }
    else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
    {
      iAnim = TWITCHERMALE2_ANIM_WOUND;
    }
    else if(m_twChar == TWC_STRONGBLADED)
    {
      iAnim = TWITCHERBLADED_ANIM_WOUND;
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE)
    {
      iAnim = TWITCHERSTRONG_ANIM_WOUND;
    }
    else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEPALE)
    {
      iAnim = TWITCHERFEMALE_ANIM_WOUND;
    }
    else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
    {
      iAnim = TWITCHERMALE_ANIM_WOUND;
    }
    else
    {
      iAnim = TWITCHERBALD_ANIM_WOUND;
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

      if(m_twChar == TWC_NIGHTMAREBLADED)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERNIGHTMAREBLADED_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERNIGHTMAREBLADED_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_STRONGBLADEDPALE)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERPALEBLADED_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERPALEBLADED_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_MALE3WHITE || m_twChar == TWC_MALE3BLACK)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERMALE3_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERMALE3_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_NIGHTMARESHADOW)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERSHADOW_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERSHADOW_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_STRONGBLADED4)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERBLADED4_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERBLADED4_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_SKINNEDBLADED)
      {
        if (fDamageDir<0) {
          switch(IRnd()%2)
          {
            case 0: iAnim = TWITCHERSKINNED_ANIM_DEATHFRONT; break;
            case 1: iAnim = TWITCHERSKINNED_ANIM_DEATHFRONT2; break;
            default: ASSERTALWAYS("Twitcher unknown death animation");
          }
        } else {
          iAnim = TWITCHERSKINNED_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_STRONGBLADED3)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERBLADED3_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERBLADED3_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_STRONGBLADED2)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERBLADED2_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERBLADED2_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_FEMALE2PALE)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERFEMALE2_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERFEMALE2_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERMALE2_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERMALE2_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_STRONGBLADED)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERBLADED_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERBLADED_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERSTRONG_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERSTRONG_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEPALE)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERFEMALE_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERFEMALE_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERMALE_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERMALE_ANIM_DEATHBACK;
        }
      }
      else
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERBALD_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERBALD_ANIM_DEATHBACK;
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
    // yell
    ESound eSound;
    eSound.EsndtSound = SNDT_SHOUT;
    eSound.penTarget = m_penEnemy;
    SendEventInRange(eSound, FLOATaabbox3D(GetPlacement().pl_PositionVector, 50.0f));

    if(GetModelObject()->GetAnim()==TWITCHERNIGHTMAREBLADED_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERNIGHTMAREBLADED_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERNIGHTMAREBLADED_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERNIGHTMAREBLADED_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERPALEBLADED_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERPALEBLADED_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERPALEBLADED_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERPALEBLADED_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERMALE3_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERMALE3_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERMALE3_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERMALE3_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERSHADOW_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERSHADOW_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERSHADOW_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERSHADOW_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERBLADED4_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERBLADED4_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERBLADED4_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERBLADED4_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERSKINNED_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERSKINNED_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERSKINNED_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERSKINNED_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERBLADED3_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERBLADED3_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERBLADED3_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERBLADED3_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERBLADED2_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERBLADED2_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERBLADED2_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERBLADED2_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERFEMALE2_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERFEMALE2_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERFEMALE2_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERFEMALE2_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERMALE2_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERMALE2_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERMALE2_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERMALE2_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERBLADED_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERBLADED_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERBLADED_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERBLADED_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERSTRONG_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERSTRONG_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERSTRONG_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERSTRONG_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERMALE_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERMALE_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERMALE_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERMALE_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERFEMALE_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERFEMALE_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERFEMALE_ANIM_DEATHBACK)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERFEMALE_COLLISION_BOX_BACKDEATH_BOX);
    }
    else if(GetModelObject()->GetAnim()==TWITCHERBALD_ANIM_DEATHFRONT)
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERBALD_COLLISION_BOX_FRONTDEATH_BOX);
    }
    else
    {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERBALD_COLLISION_BOX_BACKDEATH_BOX);
    }
    
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {

    if(m_twChar == TWC_NIGHTMAREBLADED)
    {
      StartModelAnim(TWITCHERNIGHTMAREBLADED_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADEDPALE)
    {
      StartModelAnim(TWITCHERPALEBLADED_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALE3WHITE || m_twChar == TWC_MALE3BLACK)
    {
      StartModelAnim(TWITCHERMALE3_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_NIGHTMARESHADOW)
    {
      StartModelAnim(TWITCHERSHADOW_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED4)
    {
      StartModelAnim(TWITCHERBLADED4_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_SKINNEDBLADED)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_FEMALE2PALE)
    {
      StartModelAnim(TWITCHERFEMALE2_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
    {
      StartModelAnim(TWITCHERMALE2_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE)
    {
      StartModelAnim(TWITCHERSTRONG_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
    {
      StartModelAnim(TWITCHERMALE_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEPALE)
    {
      StartModelAnim(TWITCHERFEMALE_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(TWITCHERBALD_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void WalkingAnim(void) {
    
    if(m_twChar == TWC_NIGHTMAREBLADED)
    {
      StartModelAnim(TWITCHERNIGHTMAREBLADED_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADEDPALE)
    {
      StartModelAnim(TWITCHERPALEBLADED_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALE3WHITE || m_twChar == TWC_MALE3BLACK)
    {
      StartModelAnim(TWITCHERMALE3_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_NIGHTMARESHADOW)
    {
      StartModelAnim(TWITCHERSHADOW_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED4)
    {
      StartModelAnim(TWITCHERBLADED4_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_SKINNEDBLADED)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_FEMALE2PALE)
    {
      StartModelAnim(TWITCHERFEMALE2_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
    {
      StartModelAnim(TWITCHERMALE2_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE)
    {
      StartModelAnim(TWITCHERSTRONG_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
    {
      StartModelAnim(TWITCHERMALE_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEPALE)
    {
      StartModelAnim(TWITCHERFEMALE_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(TWITCHERBALD_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void RunningAnim(void) {

    if(m_twChar == TWC_NIGHTMAREBLADED)
    {
      StartModelAnim(TWITCHERNIGHTMAREBLADED_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADEDPALE)
    {
      StartModelAnim(TWITCHERPALEBLADED_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALE3WHITE || m_twChar == TWC_MALE3BLACK)
    {
      StartModelAnim(TWITCHERMALE3_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_NIGHTMARESHADOW)
    {
      StartModelAnim(TWITCHERSHADOW_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED4)
    {
      StartModelAnim(TWITCHERBLADED4_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_SKINNEDBLADED)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_FEMALE2PALE)
    {
      StartModelAnim(TWITCHERFEMALE2_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
    {
      StartModelAnim(TWITCHERMALE2_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE)
    {
      StartModelAnim(TWITCHERSTRONG_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
    {
      StartModelAnim(TWITCHERMALE_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEPALE)
    {
      StartModelAnim(TWITCHERFEMALE_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(TWITCHERBALD_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void BacksteppingAnim(void) {
    if(m_twChar == TWC_NIGHTMAREBLADED)
    {
      StartModelAnim(TWITCHERNIGHTMAREBLADED_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADEDPALE)
    {
      StartModelAnim(TWITCHERPALEBLADED_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_SKINNEDBLADED)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      WalkingAnim();
    }
  };

  void StrafeLeftAnim(void) {
    if (m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_STRAFERIGHT, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_twChar == TWC_SKINNEDBLADED)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_STRAFELEFT, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      RunningAnim();
    }
  };

  void StrafeRightAnim(void) {
    if (m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_STRAFELEFT, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_twChar == TWC_SKINNEDBLADED)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_STRAFERIGHT, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      RunningAnim();
    }
  };

  void JumpingAnim(void) {

    if(m_twChar == TWC_NIGHTMAREBLADED)
    {
      StartModelAnim(TWITCHERNIGHTMAREBLADED_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADEDPALE)
    {
      StartModelAnim(TWITCHERPALEBLADED_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALE3WHITE || m_twChar == TWC_MALE3BLACK)
    {
      StartModelAnim(TWITCHERMALE3_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_NIGHTMARESHADOW)
    {
      StartModelAnim(TWITCHERSHADOW_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED4)
    {
      StartModelAnim(TWITCHERBLADED4_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_SKINNEDBLADED)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_FEMALE2PALE)
    {
      StartModelAnim(TWITCHERFEMALE2_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
    {
      StartModelAnim(TWITCHERMALE2_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE)
    {
      StartModelAnim(TWITCHERSTRONG_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
    {
      StartModelAnim(TWITCHERMALE_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEPALE)
    {
      StartModelAnim(TWITCHERFEMALE_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(TWITCHERBALD_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
    }
  };

  // virtual sound functions
  void IdleSound(void) {
    if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGBLADED2
    || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_NIGHTMARESHADOW
    || m_twChar == TWC_STRONGBLADEDPALE || m_twChar == TWC_NIGHTMAREBLADED)
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soSound, SOUND_STRONG_IDLE1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_STRONG_IDLE2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown idle sound");
      }
    }
    else if(m_twChar == TWC_FEMALE2PALE)
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soSound, SOUND_BRIDE_IDLE1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_BRIDE_IDLE2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown idle sound");
      }
    }
    else
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soSound, SOUND_IDLE1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_IDLE2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown idle sound");
      }
    }
  };

  void SightSound(void) {
    if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGBLADED2
    || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_NIGHTMARESHADOW
    || m_twChar == TWC_STRONGBLADEDPALE || m_twChar == TWC_NIGHTMAREBLADED)
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soSound, SOUND_STRONG_SIGHT1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_STRONG_SIGHT2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown sight sound");
      }
    }
    else if(m_twChar == TWC_FEMALE2PALE)
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soSound, SOUND_BRIDE_SIGHT1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_BRIDE_SIGHT2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown sight sound");
      }
    }
    else
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soSound, SOUND_SIGHT1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_SIGHT2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown sight sound");
      }
    }
  };

  void WoundSound(void) {
    if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGBLADED2
    || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_NIGHTMARESHADOW
    || m_twChar == TWC_STRONGBLADEDPALE || m_twChar == TWC_NIGHTMAREBLADED)
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soSound, SOUND_STRONG_WOUND1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_STRONG_WOUND2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown wound sound");
      }
    }
    else if(m_twChar == TWC_FEMALE2PALE)
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soSound, SOUND_BRIDE_WOUND1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_BRIDE_WOUND2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown wound sound");
      }
    }
    else
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soSound, SOUND_WOUND1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_WOUND2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown wound sound");
      }
    }
  };

  void DeathSound(void) {
    if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGBLADED2
    || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_NIGHTMARESHADOW
    || m_twChar == TWC_STRONGBLADEDPALE || m_twChar == TWC_NIGHTMAREBLADED)
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soSound, SOUND_STRONG_DEATH1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_STRONG_DEATH2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown death sound");
      }
    }
    else if(m_twChar == TWC_FEMALE2PALE)
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soSound, SOUND_BRIDE_DEATH1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_BRIDE_DEATH2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown death sound");
      }
    }
    else
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soSound, SOUND_DEATH1, SOF_3D); break;
        case 1: PlaySound(m_soSound, SOUND_DEATH2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown death sound");
      }
    }
  };


  // --------------------------------------------------------------------------------------
  // Check if an entity is valid for being your new enemy.
  // --------------------------------------------------------------------------------------
  BOOL IsValidForEnemy(CEntity *penNewTarget)
  {
    // nothing is not allowed
    if (penNewTarget == NULL)
    {
      return FALSE;
    }

    // don't target the dead
    if (!(penNewTarget->GetFlags()&ENF_ALIVE))
    {
      return FALSE;
    }

    if (IsOfClass(penNewTarget, "Player"))
    {
      if((this->GetFaction() == FT_ALLY) || (this->GetFaction() == FT_VICTIM))
      {
        return FALSE;
      }

      return TRUE;
    }

    if (IsDerivedFromClass(penNewTarget, "Enemy Base")) {
      CEnemyBase &enEB = (CEnemyBase&)*penNewTarget;

      // don't target templates
      if (enEB.m_bTemplate) {
        return FALSE;
      }

      // don't target if the faction is not valid
      if(!enEB.IsFactionValid())
      {
        return FALSE;
      }

      // don't target your allies
      if(enEB.GetFaction() == this->GetFaction())
      {
        if(m_bAllowInfighting && IsOfClass(penNewTarget, "Twitcher")) {
          return TRUE;
        }
        return FALSE;
      }

      // make exceptions for targets
      if((enEB.GetFaction() == FT_SHADOW) || (enEB.GetFaction() == FT_WILDLIFE))
      {
        return FALSE;
      }

      if((this->GetFaction() == FT_WILDLIFE || this->GetFaction() == FT_SHADOW) && (enEB.GetFaction() == FT_LESSER || enEB.GetFaction() == FT_GREATER))
      {
        return FALSE;
      }

      return TRUE;
    }

    return FALSE;
  }


  procedures:


  BlockEnemyMelee(EVoid) {
    if(m_twChar == TWC_NIGHTMAREBLADED)
    {
      StartModelAnim(TWITCHERNIGHTMAREBLADED_ANIM_BLOCK1, 0);
    }
    else if(m_twChar == TWC_STRONGBLADEDPALE)
    {
      StartModelAnim(TWITCHERPALEBLADED_ANIM_BLOCK1, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED4)
    {
      StartModelAnim(TWITCHERBLADED4_ANIM_BLOCK1, 0);
    }
    else if(m_twChar == TWC_SKINNEDBLADED)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_BLOCK1, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_BLOCK1, 0);
    }

    autowait(0.25f);

    m_bIsBlocking = TRUE;

    autowait(1.0f);

    m_bIsBlocking = FALSE;

    return EReturn();
  }


  Fire(EVoid) : CEnemyBase::Fire
  {
    if(m_twChar == TWC_STRONGBLADED2)
    {
      autocall BladedTwitcher2SpitAttack() EEnd;
      return EReturn();
    }
    else
    {
      return EReturn();
    }
  };

  // Bladed Twitcher 2 Blood Spit attack
  BladedTwitcher2SpitAttack(EVoid) {
    autowait(0.25f + FRnd()/4);

    StartModelAnim(TWITCHERBLADED2_ANIM_SPIT, 0);
    autowait(0.375f);
    ShootProjectile(PRT_MUTANT_SPIT, FLOAT3D(0.0f, 1.5f, 0.0f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_HIT, SOF_3D);

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();
    return EEnd();
  };


  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    switch(IRnd()%4)
    {
      case 0: jump SlashEnemySingle(); break;
      case 1: jump SlashEnemyDouble(); break;
      case 2: jump SlashEnemySlam(); break;
      case 3: jump SlashEnemySingle2(); break;
      default: ASSERTALWAYS("Twitcher unknown melee attack");
    }

    return EReturn();
  };

  SlashEnemySingle(EVoid) {

    INDEX iRandomChoice = IRnd()%2;

    if(iRandomChoice == 1)
    {
      if(m_twChar == TWC_STRONGBLADED || TWC_SKINNEDBLADED || TWC_STRONGBLADED4 || TWC_STRONGBLADEDPALE || TWC_NIGHTMAREBLADED)
      {
        autocall BlockEnemyMelee() EReturn;
        return EReturn();
      }
    }

    // close attack
    if(m_twChar == TWC_NIGHTMAREBLADED)
    {
      StartModelAnim(TWITCHERNIGHTMAREBLADED_ANIM_MELEE1, 0);
    }
    else if(m_twChar == TWC_STRONGBLADEDPALE)
    {
      StartModelAnim(TWITCHERPALEBLADED_ANIM_MELEE1, 0);
    }
    else if(m_twChar == TWC_MALE3WHITE || m_twChar == TWC_MALE3BLACK)
    {
      StartModelAnim(TWITCHERMALE3_ANIM_MELEE1, 0);
    }
    else if(m_twChar == TWC_NIGHTMARESHADOW)
    {
      StartModelAnim(TWITCHERSHADOW_ANIM_MELEE1, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED4)
    {
      StartModelAnim(TWITCHERBLADED4_ANIM_MELEE1, 0);
    }
    else if(m_twChar == TWC_SKINNEDBLADED)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_MELEE1, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_MELEE1, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_MELEE1, 0);
    }
    else if(m_twChar == TWC_FEMALE2PALE)
    {
      StartModelAnim(TWITCHERFEMALE2_ANIM_MELEE1, 0);
    }
    else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
    {
      StartModelAnim(TWITCHERMALE2_ANIM_MELEE1, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_MELEE1, 0);
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE)
    {
      StartModelAnim(TWITCHERSTRONG_ANIM_MELEE1, 0);
    }
    else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
    {
      StartModelAnim(TWITCHERMALE_ANIM_MELEE1, 0);
    }
    else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEPALE)
    {
      StartModelAnim(TWITCHERFEMALE_ANIM_MELEE1, 0);
    }
    else
    {
      StartModelAnim(TWITCHERBALD_ANIM_MELEE1, 0);
    }
    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4
         || m_twChar == TWC_STRONGBLADEDPALE || TWC_NIGHTMAREBLADED) {
        PlaySound(m_soSound, SOUND_SLICE, SOF_3D);
      }
      else {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
      }
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        if(m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4 
           || m_twChar == TWC_NIGHTMARESHADOW || m_twChar == TWC_STRONGBLADEDPALE || TWC_NIGHTMAREBLADED)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
        }
        else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_FEMALE2PALE || m_twChar == TWC_STRONGCORPSE)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 10.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
        }
        else
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 5.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  SlashEnemyDouble(EVoid) {
    INDEX iRandomChoice = IRnd()%2;

    if(iRandomChoice == 1)
    {
      if(m_twChar == TWC_STRONGBLADED || TWC_SKINNEDBLADED || TWC_STRONGBLADED4 || TWC_STRONGBLADEDPALE || TWC_NIGHTMAREBLADED)
      {
        autocall BlockEnemyMelee() EReturn;
        return EReturn();
      }
    }

    // close attack
    if(m_twChar == TWC_NIGHTMAREBLADED)
    {
      StartModelAnim(TWITCHERNIGHTMAREBLADED_ANIM_MELEE2, 0);
    }
    else if(m_twChar == TWC_MALE3WHITE || m_twChar == TWC_MALE3BLACK)
    {
      StartModelAnim(TWITCHERMALE3_ANIM_MELEE2, 0);
    }
    else if(m_twChar == TWC_SKINNEDBLADED)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_MELEE2, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_MELEE2, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_MELEE2, 0);
    }
    else if(m_twChar == TWC_FEMALE2PALE)
    {
      StartModelAnim(TWITCHERFEMALE2_ANIM_MELEE2, 0);
    }
    else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
    {
      StartModelAnim(TWITCHERMALE2_ANIM_MELEE2, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_MELEE2, 0);
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE)
    {
      StartModelAnim(TWITCHERSTRONG_ANIM_MELEE2, 0);
    }
    else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
    {
      StartModelAnim(TWITCHERMALE_ANIM_MELEE2, 0);
    }
    else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEPALE)
    {
      StartModelAnim(TWITCHERFEMALE_ANIM_MELEE2, 0);
    }
    else
    {
      StartModelAnim(TWITCHERBALD_ANIM_MELEE2, 0);
    }
    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4
         || m_twChar == TWC_STRONGBLADEDPALE || TWC_NIGHTMAREBLADED) {
        PlaySound(m_soSound, SOUND_SLICE, SOF_3D);
      }
      else {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
      }
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        if(m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4 
           || m_twChar == TWC_NIGHTMARESHADOW || m_twChar == TWC_STRONGBLADEDPALE || TWC_NIGHTMAREBLADED)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
        }
        else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_FEMALE2PALE || m_twChar == TWC_STRONGCORPSE)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 10.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
        }
        else
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 5.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }
    
    if(m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_NIGHTMARESHADOW
       || m_twChar == TWC_STRONGBLADEDPALE || m_twChar == TWC_NIGHTMAREBLADED)
    {
      autowait(0.3f);
      MaybeSwitchToAnotherPlayer();
      return EReturn();
    }

    autowait(0.35f);

    m_bFistHit = FALSE;
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADED2) {
        PlaySound(m_soSound, SOUND_SLICE, SOF_3D);
      }
      else {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
      }
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        if(m_twChar == TWC_STRONGBLADED2)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
        }
        else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_FEMALE2PALE || m_twChar == TWC_STRONGCORPSE)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 10.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
        }
        else
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 5.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  SlashEnemySlam(EVoid) {
    // close attack
    if(m_twChar == TWC_NIGHTMAREBLADED)
    {
      StartModelAnim(TWITCHERNIGHTMAREBLADED_ANIM_MELEE3, 0);
    }
    else if(m_twChar == TWC_STRONGBLADEDPALE)
    {
      StartModelAnim(TWITCHERPALEBLADED_ANIM_MELEE3, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED4)
    {
      StartModelAnim(TWITCHERBLADED4_ANIM_MELEE3, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_MELEE3, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_MELEE3, 0);
    }
    else if(m_twChar == TWC_FEMALE2PALE)
    {
      StartModelAnim(TWITCHERFEMALE2_ANIM_MELEE3, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_MELEE3, 0);
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE)
    {
      StartModelAnim(TWITCHERSTRONG_ANIM_MELEE3, 0);
    }
    else
    {
      return EReturn();
    }
    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_STRONGBLADEDPALE
         || m_twChar == TWC_NIGHTMAREBLADED) {
        PlaySound(m_soSound, SOUND_SLICE, SOF_3D);
      }
      else {
        PlaySound(m_soSound, SOUND_HIT, SOF_3D);
      }
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        if(m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_STRONGBLADEDPALE
           || m_twChar == TWC_NIGHTMAREBLADED)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 20.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
        }
        else if(m_twChar == TWC_STRONGBLADED)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
        }
        else
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 10.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();

    if(m_twChar == TWC_NIGHTMAREBLADED)
    {
      m_fLockOnEnemyTime = 1.0f;
      autocall CEnemyBase::StepBackwards() EReturn;
    }
    else if(m_twChar == TWC_STRONGBLADEDPALE)
    {
      m_fLockOnEnemyTime = 1.0f;
      autocall CEnemyBase::StepBackwards() EReturn;
    }
    else if(m_twChar == TWC_STRONGBLADED4)
    {
      m_fLockOnEnemyTime = 1.0f;
      autocall CEnemyBase::StepBackwards() EReturn;
    }
    else if(m_twChar == TWC_STRONGBLADED3)
    {
      m_fLockOnEnemyTime = 1.0f;
      autocall CEnemyBase::StepBackwards() EReturn;
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      m_fLockOnEnemyTime = 1.0f;
      autocall CEnemyBase::StepBackwards() EReturn;
    }
    else if(m_twChar == TWC_STRONGBLADED)
    {
      m_fLockOnEnemyTime = 1.0f;
      autocall CEnemyBase::StepBackwards() EReturn;
    }

    return EReturn();
  }

  SlashEnemySingle2(EVoid) {
    // close attack
    if (m_twChar == TWC_NIGHTMAREBLADED)
    {
      StartModelAnim(TWITCHERNIGHTMAREBLADED_ANIM_MELEE4, 0);
    }
    else if (m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_MELEE4, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_MELEE4, 0);
    }
    else
    {
      return EReturn();
    }
    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }
    
    if (m_bFistHit) {
      PlaySound(m_soSound, SOUND_SLICE, SOF_3D);
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 20.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.3f);
    MaybeSwitchToAnotherPlayer();

    if(m_twChar == TWC_NIGHTMAREBLADED)
    {
      m_fLockOnEnemyTime = 1.0f;
      autocall CEnemyBase::StepBackwards() EReturn;
    }
    else if(m_twChar == TWC_STRONGBLADED3)
    {
      m_fLockOnEnemyTime = 1.0f;
      autocall CEnemyBase::StepBackwards() EReturn;
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      m_fLockOnEnemyTime = 1.0f;
      autocall CEnemyBase::StepBackwards() EReturn;
    }

    return EReturn();
  }


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
    SetHealth(80.0f);
    m_fMaxHealth = 80.0f;
    m_fDamageWounded = 50.0f;
    m_iScore = 500;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 2000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    switch(m_twChar)
    {
      case TWC_BALDWHITE:
      {
        SetModel(MODEL_TWITCHERBALD);
        SetModelMainTexture(TEXTURE_TWITCHERBALD_WHITE);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_BALDBLACK:
      {
        SetModel(MODEL_TWITCHERBALD);
        SetModelMainTexture(TEXTURE_TWITCHERBALD_BLACK);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_FEMALEWHITE:
      {
        SetModel(MODEL_TWITCHERFEMALE);
        SetModelMainTexture(TEXTURE_TWITCHERFEMALE_WHITE);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_FEMALEPALE:
      {
        SetModel(MODEL_TWITCHERFEMALE);
        SetModelMainTexture(TEXTURE_TWITCHERFEMALE_PALE);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_MALEWHITE:
      {
        SetModel(MODEL_TWITCHERMALE);
        SetModelMainTexture(TEXTURE_TWITCHERMALE_WHITE);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_MALEBLACK:
      {
        SetModel(MODEL_TWITCHERMALE);
        SetModelMainTexture(TEXTURE_TWITCHERMALE_BLACK);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGPALE:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 90.0f;
        m_iScore = 1000;
        SetModel(MODEL_TWITCHERSTRONG);
        SetModelMainTexture(TEXTURE_TWITCHERSTRONG_PALE);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGBLADED:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 60.0f;
        m_iScore = 2000;
        SetModel(MODEL_TWITCHERBLADED);
        SetModelMainTexture(TEXTURE_TWITCHERBLADED);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_MALE2WHITE:
      {
        SetModel(MODEL_TWITCHERMALE2);
        SetModelMainTexture(TEXTURE_TWITCHERMALE2_WHITE);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_MALE2BLACK:
      {
        SetModel(MODEL_TWITCHERMALE2);
        SetModelMainTexture(TEXTURE_TWITCHERMALE2_BLACK);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_FEMALE2PALE:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 130.0f;
        m_iScore = 1000;
        SetModel(MODEL_TWITCHERFEMALE2);
        SetModelMainTexture(TEXTURE_TWITCHERFEMALE2_PALE);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGCORPSE:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 110.0f;
        m_iScore = 2000;
        SetModel(MODEL_TWITCHERSTRONG);
        SetModelMainTexture(TEXTURE_TWITCHERSTRONG_CORPSE);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGBLADED2:
      {
        SetHealth(200.0f);
        m_fMaxHealth = 200.0f;
        m_fDamageWounded = 120.0f;
        m_iScore = 5000;
        SetModel(MODEL_TWITCHERBLADED2);
        SetModelMainTexture(TEXTURE_TWITCHERBLADED2);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGBLADED3:
      {
        SetHealth(200.0f);
        m_fMaxHealth = 200.0f;
        m_fDamageWounded = 170.0f;
        m_iScore = 7500;
        SetModel(MODEL_TWITCHERBLADED3);
        SetModelMainTexture(TEXTURE_TWITCHERBLADED3);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_SKINNEDBLADED:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 60.0f;
        m_iScore = 5000;
        SetModel(MODEL_TWITCHERSKINNED);
        SetModelMainTexture(TEXTURE_TWITCHERSKINNED);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGBLADED4:
      {
        SetHealth(250.0f);
        m_fMaxHealth = 250.0f;
        m_fDamageWounded = 140.0f;
        m_iScore = 10000;
        SetModel(MODEL_TWITCHERBLADED4);
        SetModelMainTexture(TEXTURE_TWITCHERBLADED4);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_NIGHTMARESHADOW:
      {
        SetHealth(200.0f);
        m_fMaxHealth = 200.0f;
        m_fDamageWounded = 80.0f;
        m_iScore = 10000;
        SetModel(MODEL_TWITCHERSHADOW);
        SetModelMainTexture(TEXTURE_TWITCHERSHADOW);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_MALE3WHITE:
      {
        SetModel(MODEL_TWITCHERMALE3);
        SetModelMainTexture(TEXTURE_TWITCHERMALE3_WHITE);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_MALE3BLACK:
      {
        SetModel(MODEL_TWITCHERMALE3);
        SetModelMainTexture(TEXTURE_TWITCHERMALE3_BLACK);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGBLADEDPALE:
      {
        SetHealth(250.0f);
        m_fMaxHealth = 250.0f;
        m_fDamageWounded = 140.0f;
        m_iScore = 15000;
        SetModel(MODEL_TWITCHERBLADEDPALE);
        SetModelMainTexture(TEXTURE_TWITCHERBLADEDPALE);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_NIGHTMAREBLADED:
      {
        SetHealth(350.0f);
        m_fMaxHealth = 350.0f;
        m_fDamageWounded = 190.0f;
        m_iScore = 25000;
        SetModel(MODEL_TWITCHERBLADEDNIGHTMARE);
        SetModelMainTexture(TEXTURE_TWITCHERBLADEDNIGHTMARE);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
    }

        // setup moving speed
        if(m_twChar == TWC_SKINNEDBLADED && m_bMoveFast)
        {
          m_fWalkSpeed = FRnd() + 4.5f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*40.0f + 650.0f);
          m_fAttackRunSpeed = FRnd() + 8.0f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*65 + 325.0f);
          m_fCloseRunSpeed = FRnd() + 8.0f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*65 + 325.0f);
        }
        else if(m_twChar == TWC_SKINNEDBLADED && !m_bMoveFast)
        {
          m_fWalkSpeed = FRnd() + 4.0f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*30.0f + 600.0f);
          m_fAttackRunSpeed = FRnd() + 7.0f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*60 + 300.0f);
          m_fCloseRunSpeed = FRnd() + 7.0f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*60 + 300.0f);
        }
        else if(m_bMoveFast || m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_STRONGBLADEDPALE
                || m_twChar == TWC_NIGHTMAREBLADED)
        {
          m_fWalkSpeed = FRnd() + 3.0f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*20.0f + 525.0f);
          m_fAttackRunSpeed = FRnd() + 6.0f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*60 + 275.0f);
          m_fCloseRunSpeed = FRnd() + 6.0f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*60 + 275.0f);
        }
        else
        {
          m_fWalkSpeed = FRnd() + 2.0f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 500.0f);
          m_fAttackRunSpeed = FRnd() + 4.0f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*50 + 245.0f);
          m_fCloseRunSpeed = FRnd() + 4.0f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*50 + 245.0f);
        }
        
        // setup attack distances
        m_fAttackDistance = 100.0f;
        m_fCloseDistance = 2.75f;
        m_fStopDistance = 1.75f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 1.0f;
        m_fIgnoreRange = 200.0f;
        // damage/explode properties
        m_fBlowUpAmount = 100.0f;
        m_fBodyParts = 4;

    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};