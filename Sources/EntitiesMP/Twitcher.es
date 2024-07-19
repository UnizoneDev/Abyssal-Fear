/* Copyright (c) 2021-2024 Uni Musuotankarep.
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

#include "EntitiesMP/Player.h"

#include "Models/NPCs/Twitcher/BaldTwitcherNew/TwitcherBald.h"
#include "Models/NPCs/Twitcher/FemaleTwitcherNew/TwitcherFemale.h"
#include "Models/NPCs/Twitcher/MaleTwitcherNew/TwitcherMale.h"
#include "Models/NPCs/Twitcher/StrongTwitcherNew/TwitcherStrong.h"
#include "Models/NPCs/Twitcher/BladedTwitcherNew/TwitcherBladed.h"
#include "Models/NPCs/Twitcher/MaleTwitcher2New/TwitcherMale2.h"
#include "Models/NPCs/Twitcher/FemaleTwitcher2New/TwitcherFemale2.h"
#include "Models/NPCs/Twitcher/BladedTwitcher2New/TwitcherBladed2.h"
#include "Models/NPCs/Twitcher/BladedTwitcher3/TwitcherBladed3.h"
#include "Models/NPCs/Twitcher/SkinnedTwitcherNew/TwitcherSkinned.h"
#include "Models/NPCs/Twitcher/BladedTwitcher4/TwitcherBladed4.h"
#include "Models/NPCs/Twitcher/ShadowTwitcher/TwitcherShadow.h"
#include "Models/NPCs/Twitcher/MaleTwitcher3/TwitcherMale3.h"
#include "Models/NPCs/Twitcher/PaleBladedTwitcher/TwitcherPaleBladed.h"
%}

uses "EntitiesMP/EnemyBase";
uses "EntitiesMP/Projectile";

enum TwitcherType {
  0 TWC_BALDWHITE        "Bald White",
  1 TWC_BALDBLACK        "Bald Black",
  2 TWC_FEMALEWHITE      "Female White",
  3 TWC_FEMALEBLONDE     "Female Blonde",
  4 TWC_MALEWHITE        "Male 1 White",
  5 TWC_MALEBLACK        "Male 1 Black",
  6 TWC_STRONGPALE       "Strong Pale",
  7 TWC_STRONGBLADED     "Bladed 1",
  8 TWC_MALE2WHITE       "Male 2 White",
  9 TWC_MALE2BLACK       "Male 2 Black",
 10 TWC_FEMALE2WHITE     "Female 2 White",
 11 TWC_STRONGCORPSE     "Strong Corpse",
 12 TWC_STRONGBLADED2    "Bladed 2",
 13 TWC_STRONGBLADED3    "Bladed 3",
 14 TWC_SKINNEDBLADED    "Skinned Bladed 1",
 15 TWC_STRONGBLADED4    "Bladed 4",
 16 TWC_NIGHTMARESHADOW  "Nightmare Shadow",
 17 TWC_MALE3WHITE       "Male 3 White",
 18 TWC_MALE3BLACK       "Male 3 Black",
 19 TWC_STRONGBLADEDPALE "Pale Bladed",
 20 TWC_NIGHTMAREBLADED  "Nightmare Bladed",
 21 TWC_STRONGNIGHTMARE  "Strong Nightmare",
 22 TWC_STRONGBLADEDNIGHTMARE  "Bladed 1 Nightmare",
 23 TWC_FEMALEPALE       "Female Pale",
 24 TWC_SKINNEDBLADED2   "Skinned Bladed 2",
 25 TWC_SKINNEDBLADED3   "Skinned Bladed 3",
 26 TWC_NIGHTMAREBLADED2 "Nightmare Bladed 2",
 27 TWC_NIGHTMAREBLADED3 "Nightmare Bladed 3",
 28 TWC_STRONGBLOODY     "Strong Bloody Corpse",
 29 TWC_FEMALE2PALE      "Female 2 Pale",
 30 TWC_DISEASED         "Diseased",
 31 TWC_DISEASEDBLOODY   "Diseased Bloody",
 32 TWC_DISEASEDFORSAKEN  "Diseased Forsaken 1",
 33 TWC_DISEASEDFORSAKEN2 "Diseased Forsaken 2",
 34 TWC_DISEASEDFORSAKEN3 "Diseased Forsaken 3",
 35 TWC_DISEASEDFORSAKEN4 "Diseased Forsaken 4",
 36 TWC_DISEASEDFORSAKEN5 "Diseased Forsaken 5",
 37 TWC_NIGHTMAREBLADEDELITE "Nightmare Bladed Elite",
 38 TWC_DISEASEDRESTRAINED "Restrained Diseased",
 39 TWC_DISEASEDRESTRAINEDBLOODY "Restrained Diseased Bloody"
};

enum TwitcherMoveSpeedType {
  0 TSPT_NORMAL      "Normal",
  1 TSPT_FAST        "Fast",
  2 TSPT_SLOW        "Slow"
};

%{

  static INDEX idTwitcherAnim_TPose = -1;
  static INDEX idTwitcherAnim_Stand = -1;
  static INDEX idTwitcherAnim_Stand2 = -1;
  static INDEX idTwitcherAnim_Walk  = -1;
  static INDEX idTwitcherAnim_Walk2  = -1;
  static INDEX idTwitcherAnim_Run   = -1;
  static INDEX idTwitcherAnim_Run2   = -1;
  static INDEX idTwitcherAnim_Backpedal   = -1;
  static INDEX idTwitcherAnim_StrafeLeft  = -1;
  static INDEX idTwitcherAnim_StrafeRight = -1;
  static INDEX idTwitcherAnim_Wound   = -1;
  static INDEX idTwitcherAnim_Jump    = -1;
  static INDEX idTwitcherAnim_Melee1  = -1;
  static INDEX idTwitcherAnim_Melee2  = -1;
  static INDEX idTwitcherAnim_Melee3  = -1;
  static INDEX idTwitcherAnim_Melee4  = -1;
  static INDEX idTwitcherAnim_Melee5  = -1;
  static INDEX idTwitcherAnim_Melee6  = -1;
  static INDEX idTwitcherAnim_Melee7  = -1;
  static INDEX idTwitcherAnim_LeapMelee1 = -1;
  static INDEX idTwitcherAnim_DeathFront = -1;
  static INDEX idTwitcherAnim_DeathBack  = -1;
  static INDEX idTwitcherAnim_SpinMelee1 = -1;
  static INDEX idTwitcherAnim_Block      = -1;
  static INDEX idTwitcherAnim_WritheFront = -1;
  static INDEX idTwitcherAnim_WritheBack  = -1;
  static INDEX idTwitcherAnim_Spit        = -1;
  static INDEX idTwitcherAnim_Cower       = -1;
  static INDEX idTwitcherAnim_CowerStop   = -1;
  static INDEX idTwitcherAnim_Rage1       = -1;
  static INDEX idTwitcherBox_Stand  = -1;
  static INDEX idTwitcherBox_DeathFront   = -1;
  static INDEX idTwitcherBox_DeathBack    = -1;
  static INDEX idTwitcherBox_Cower        = -1;

  static INDEX idTwitcherRestrainedAnim_TPose = -1;
  static INDEX idTwitcherRestrainedAnim_Idle = -1;
  static INDEX idTwitcherRestrainedAnim_IdleFight = -1;
  static INDEX idTwitcherRestrainedAnim_Melee1 = -1;
  static INDEX idTwitcherRestrainedAnim_Melee2 = -1;
  static INDEX idTwitcherRestrainedAnim_Wound = -1;
  static INDEX idTwitcherRestrainedAnim_Death = -1;
  static INDEX idTwitcherRestrainedBox_Default  = -1;

// info structure
static EntityInfo eiTwitcher = {
  EIBT_FLESH, 250.0f,
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
  3 enum TwitcherMoveSpeedType m_twSpeed "Move Speed" = TSPT_NORMAL,
  4 BOOL m_bJitterHead "Jitter Head" = FALSE,
  5 INDEX m_iRandomMovementChoice = 0,
  6 BOOL m_bStartHidden "Start Hidden" = FALSE,
  7 INDEX m_iRunAnim = 0,
  8 FLOAT m_fHeadJitterAmount "Head Jitter Amount" = 32.0f,
  9 INDEX m_iStandAnim = 0,
 10 INDEX m_iLeapThreshold = 0,
 11 INDEX m_iRandomBlockChoice = 0,
  
components:
  1 class   CLASS_BASE            "Classes\\EnemyBase.ecl",
  2 class   CLASS_PROJECTILE      "Classes\\Projectile.ecl",

 10 model   MODEL_TWITCHERBALD               "Models\\NPCs\\Twitcher\\BaldTwitcherNew\\TwitcherBald.mdl",
 11 texture TEXTURE_TWITCHERBALD_WHITE       "Models\\NPCs\\Twitcher\\BaldTwitcherNew\\TwitcherBald1.tex",
 12 texture TEXTURE_TWITCHERBALD_BLACK       "Models\\NPCs\\Twitcher\\BaldTwitcherNew\\TwitcherBald2.tex",
 13 model   MODEL_TWITCHERFEMALE             "Models\\NPCs\\Twitcher\\FemaleTwitcherNew\\TwitcherFemale.mdl",
 14 texture TEXTURE_TWITCHERFEMALE_WHITE     "Models\\NPCs\\Twitcher\\FemaleTwitcherNew\\TwitcherFemale1.tex",
 15 texture TEXTURE_TWITCHERFEMALE_BLONDE    "Models\\NPCs\\Twitcher\\FemaleTwitcherNew\\TwitcherFemale2.tex",
 16 model   MODEL_TWITCHERMALE               "Models\\NPCs\\Twitcher\\MaleTwitcherNew\\TwitcherMale.mdl",
 17 texture TEXTURE_TWITCHERMALE_WHITE       "Models\\NPCs\\Twitcher\\MaleTwitcherNew\\TwitcherMale1.tex",
 18 texture TEXTURE_TWITCHERMALE_BLACK       "Models\\NPCs\\Twitcher\\MaleTwitcherNew\\TwitcherMale2.tex",
 19 model   MODEL_TWITCHERSTRONG             "Models\\NPCs\\Twitcher\\StrongTwitcherNew\\TwitcherStrong.mdl",
 20 texture TEXTURE_TWITCHERSTRONG_PALE      "Models\\NPCs\\Twitcher\\StrongTwitcherNew\\TwitcherStrong1.tex",
 21 model   MODEL_TWITCHERBLADED             "Models\\NPCs\\Twitcher\\BladedTwitcherNew\\TwitcherBladed.mdl",
 22 texture TEXTURE_TWITCHERBLADED           "Models\\NPCs\\Twitcher\\BladedTwitcherNew\\TwitcherBladed1.tex",
 23 model   MODEL_TWITCHERMALE2              "Models\\NPCs\\Twitcher\\MaleTwitcher2New\\TwitcherMale2.mdl",
 24 texture TEXTURE_TWITCHERMALE2_WHITE      "Models\\NPCs\\Twitcher\\MaleTwitcher2New\\TwitcherMale3.tex",
 25 texture TEXTURE_TWITCHERMALE2_BLACK      "Models\\NPCs\\Twitcher\\MaleTwitcher2New\\TwitcherMale4.tex",
 26 model   MODEL_TWITCHERFEMALE2            "Models\\NPCs\\Twitcher\\FemaleTwitcher2New\\TwitcherFemale2.mdl",
 27 texture TEXTURE_TWITCHERFEMALE2_WHITE    "Models\\NPCs\\Twitcher\\FemaleTwitcher2New\\TwitcherFemale4.tex",
 28 texture TEXTURE_TWITCHERSTRONG_CORPSE    "Models\\NPCs\\Twitcher\\StrongTwitcherNew\\TwitcherStrong3.tex",
 60 model   MODEL_TWITCHERBLADED2            "Models\\NPCs\\Twitcher\\BladedTwitcher2New\\TwitcherBladed2.mdl",
 61 texture TEXTURE_TWITCHERBLADED2          "Models\\NPCs\\Twitcher\\BladedTwitcher2New\\TwitcherBladed3.tex",
 62 model   MODEL_TWITCHERBLADED3            "Models\\NPCs\\Twitcher\\BladedTwitcher3\\TwitcherBladed3.mdl",
 63 texture TEXTURE_TWITCHERBLADED3          "Models\\NPCs\\Twitcher\\BladedTwitcher3\\Twitcher1n.tex",
 64 model   MODEL_TWITCHERSKINNED            "Models\\NPCs\\Twitcher\\SkinnedTwitcherNew\\TwitcherSkinned.mdl",
 65 texture TEXTURE_TWITCHERSKINNED          "Models\\NPCs\\Twitcher\\SkinnedTwitcherNew\\TwitcherSkinned1.tex",
 66 model   MODEL_TWITCHERBLADED4            "Models\\NPCs\\Twitcher\\BladedTwitcher4\\TwitcherBladed4.mdl",
 67 texture TEXTURE_TWITCHERBLADED4          "Models\\NPCs\\Twitcher\\BladedTwitcher4\\Twitcher1q.tex",
 68 model   MODEL_TWITCHERSHADOW             "Models\\NPCs\\Twitcher\\ShadowTwitcher\\TwitcherShadow.mdl",
 69 texture TEXTURE_TWITCHERSHADOW           "Models\\NPCs\\Twitcher\\ShadowTwitcher\\Twitcher1r.tex",
 70 model   MODEL_TWITCHERMALE3              "Models\\NPCs\\Twitcher\\MaleTwitcher3\\TwitcherMale3.mdl",
 71 texture TEXTURE_TWITCHERMALE3_WHITE      "Models\\NPCs\\Twitcher\\MaleTwitcher3\\Twitcher1s.tex",
 72 texture TEXTURE_TWITCHERMALE3_BLACK      "Models\\NPCs\\Twitcher\\MaleTwitcher3\\Twitcher1t.tex",
 73 model   MODEL_TWITCHERBLADEDPALE         "Models\\NPCs\\Twitcher\\PaleBladedTwitcher\\TwitcherPaleBladed.mdl",
 74 texture TEXTURE_TWITCHERBLADEDPALE       "Models\\NPCs\\Twitcher\\PaleBladedTwitcher\\Twitcher1u.tex",
 76 skamodel MODEL_TWITCHERBLADEDNIGHTMARE   "Models\\NPCs\\TwitcherSKA\\NightmareBladedTwitcher\\TwitcherNightmareBladed.smc",
113 skamodel MODEL_TWITCHERBLADEDNIGHTMARE2  "Models\\NPCs\\TwitcherSKA\\NightmareBladedTwitcher\\TwitcherNightmareBladed2.smc",
114 skamodel MODEL_TWITCHERBLADEDNIGHTMARE3  "Models\\NPCs\\TwitcherSKA\\NightmareBladedTwitcher\\TwitcherNightmareBladed3.smc",
 92 texture TEXTURE_TWITCHERSTRONG_NIGHTMARE "Models\\NPCs\\Twitcher\\StrongTwitcherNew\\TwitcherStrong2.tex",
 93 texture TEXTURE_TWITCHERBLADED_NIGHTMARE "Models\\NPCs\\Twitcher\\BladedTwitcherNew\\TwitcherBladed2.tex",
 96 texture TEXTURE_TWITCHERFEMALE_PALE      "Models\\NPCs\\Twitcher\\FemaleTwitcherNew\\TwitcherFemale3.tex",
103 texture TEXTURE_TWITCHERSKINNED2         "Models\\NPCs\\Twitcher\\SkinnedTwitcherNew\\TwitcherSkinned2.tex",
104 texture TEXTURE_TWITCHERSKINNED3         "Models\\NPCs\\Twitcher\\SkinnedTwitcherNew\\TwitcherSkinned3.tex",
107 texture TEXTURE_TWITCHERSTRONG_BLOODY    "Models\\NPCs\\Twitcher\\StrongTwitcherNew\\TwitcherStrong4.tex",
112 texture TEXTURE_TWITCHERFEMALE2_PALE     "Models\\NPCs\\Twitcher\\FemaleTwitcher2New\\TwitcherFemale5.tex",
115 skamodel MODEL_TWITCHERDISEASED          "Models\\NPCs\\TwitcherSKA\\DiseasedTwitcher\\DiseasedTwitcher.smc",
116 skamodel MODEL_TWITCHERDISEASEDBLOODY    "Models\\NPCs\\TwitcherSKA\\DiseasedTwitcher\\DiseasedTwitcherBloody.smc",
117 skamodel MODEL_TWITCHERDISEASEDFORSAKEN  "Models\\NPCs\\TwitcherSKA\\DiseasedTwitcher\\DiseasedTwitcherForsaken.smc",
118 skamodel MODEL_TWITCHERDISEASEDFORSAKEN2 "Models\\NPCs\\TwitcherSKA\\DiseasedTwitcher\\DiseasedTwitcherForsaken2.smc",
119 skamodel MODEL_TWITCHERDISEASEDFORSAKEN3 "Models\\NPCs\\TwitcherSKA\\DiseasedTwitcher\\DiseasedTwitcherForsaken3.smc",
120 skamodel MODEL_TWITCHERDISEASEDFORSAKEN4 "Models\\NPCs\\TwitcherSKA\\DiseasedTwitcher\\DiseasedTwitcherForsaken4.smc",
121 skamodel MODEL_TWITCHERDISEASEDFORSAKEN5 "Models\\NPCs\\TwitcherSKA\\DiseasedTwitcher\\DiseasedTwitcherForsaken5.smc",
122 skamodel MODEL_TWITCHERBLADEDNIGHTMAREELITE  "Models\\NPCs\\TwitcherSKA\\NightmareBladedTwitcher\\TwitcherNightmareBladedElite.smc",
123 skamodel MODEL_RESTRAINEDTWITCHER  "Models\\NPCs\\TwitcherSKA\\RestrainedTwitcher\\RestrainedTwitcher.smc",
124 skamodel MODEL_RESTRAINEDTWITCHERBLOODY  "Models\\NPCs\\TwitcherSKA\\RestrainedTwitcher\\RestrainedTwitcherBloody.smc",

 30 sound   SOUND_HIT                  "Models\\NPCs\\Gunman\\Sounds\\Kick.wav",
108 sound   SOUND_PUNCH1               "Sounds\\Weapons\\Punch1.wav",
109 sound   SOUND_PUNCH2               "Sounds\\Weapons\\Punch2.wav",
110 sound   SOUND_PUNCH3               "Sounds\\Weapons\\Punch3.wav",
111 sound   SOUND_PUNCH4               "Sounds\\Weapons\\Punch4.wav",
 31 sound   SOUND_SWING                "Models\\Weapons\\Knife\\Sounds\\Swing.wav",
 75 sound   SOUND_SLICE1               "Sounds\\Weapons\\MetalBladeBigSlice1.wav",
 94 sound   SOUND_SLICE2               "Sounds\\Weapons\\MetalBladeBigSlice2.wav",
 95 sound   SOUND_SLICE3               "Sounds\\Weapons\\MetalBladeBigSlice3.wav",
 97 sound   SOUND_CLASH1               "Sounds\\Weapons\\MetalBladeClash1.wav",
101 sound   SOUND_CLASH2               "Sounds\\Weapons\\MetalBladeClash2.wav",
102 sound   SOUND_CLASH3               "Sounds\\Weapons\\MetalBladeClash3.wav",

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
 58 sound   SOUND_BRIDE_ACTIVE1       "Models\\NPCs\\Twitcher\\Sounds\\BrideActive1.wav",
 59 sound   SOUND_BRIDE_ACTIVE2       "Models\\NPCs\\Twitcher\\Sounds\\BrideActive2.wav",

 80 sound   SOUND_NIGHTMARE_SIGHT1        "Models\\NPCs\\Twitcher\\Sounds\\NightmareSight1.wav",
 81 sound   SOUND_NIGHTMARE_SIGHT2        "Models\\NPCs\\Twitcher\\Sounds\\NightmareSight2.wav",
 82 sound   SOUND_NIGHTMARE_SIGHT3        "Models\\NPCs\\Twitcher\\Sounds\\NightmareSight3.wav",
 83 sound   SOUND_NIGHTMARE_WOUND1        "Models\\NPCs\\Twitcher\\Sounds\\NightmareWound1.wav",
 84 sound   SOUND_NIGHTMARE_WOUND2        "Models\\NPCs\\Twitcher\\Sounds\\NightmareWound2.wav",
 85 sound   SOUND_NIGHTMARE_WOUND3        "Models\\NPCs\\Twitcher\\Sounds\\NightmareWound3.wav",
 86 sound   SOUND_NIGHTMARE_IDLE1         "Models\\NPCs\\Twitcher\\Sounds\\NightmareIdle1.wav",
 87 sound   SOUND_NIGHTMARE_IDLE2         "Models\\NPCs\\Twitcher\\Sounds\\NightmareIdle2.wav",
 88 sound   SOUND_NIGHTMARE_IDLE3         "Models\\NPCs\\Twitcher\\Sounds\\NightmareIdle3.wav",
 89 sound   SOUND_NIGHTMARE_DEATH1        "Models\\NPCs\\Twitcher\\Sounds\\NightmareDeath1.wav",
 90 sound   SOUND_NIGHTMARE_DEATH2        "Models\\NPCs\\Twitcher\\Sounds\\NightmareDeath2.wav",
 91 sound   SOUND_NIGHTMARE_DEATH3        "Models\\NPCs\\Twitcher\\Sounds\\NightmareDeath3.wav",
 98 sound   SOUND_NIGHTMARE_ATTACK1       "Models\\NPCs\\Twitcher\\Sounds\\NightmareAttack1.wav",
 99 sound   SOUND_NIGHTMARE_ATTACK2       "Models\\NPCs\\Twitcher\\Sounds\\NightmareAttack2.wav",
100 sound   SOUND_NIGHTMARE_ATTACK3       "Models\\NPCs\\Twitcher\\Sounds\\NightmareAttack3.wav",
150 sound   SOUND_NIGHTMARE_RAGE1         "Models\\NPCs\\Twitcher\\Sounds\\NightmareRage1.wav",
151 sound   SOUND_NIGHTMARE_RAGE2         "Models\\NPCs\\Twitcher\\Sounds\\NightmareRage2.wav",
152 sound   SOUND_NIGHTMARE_RAGELONG1     "Models\\NPCs\\Twitcher\\Sounds\\NightmareRageLong1.wav",
153 sound   SOUND_NIGHTMARE_RAGELONG2     "Models\\NPCs\\Twitcher\\Sounds\\NightmareRageLong2.wav",

functions:

  void CTwitcher(void) {
  // Get twitcher animation IDs
  idTwitcherAnim_TPose       = ska_GetIDFromStringTable("TPOSE");
  idTwitcherAnim_Stand       = ska_GetIDFromStringTable("STAND");
  idTwitcherAnim_Stand2      = ska_GetIDFromStringTable("STAND2");
  idTwitcherAnim_Walk        = ska_GetIDFromStringTable("WALK");
  idTwitcherAnim_Walk2       = ska_GetIDFromStringTable("WALK2");
  idTwitcherAnim_Run         = ska_GetIDFromStringTable("RUN");
  idTwitcherAnim_Run2        = ska_GetIDFromStringTable("RUN2");
  idTwitcherAnim_Backpedal   = ska_GetIDFromStringTable("BACKPEDAL");
  idTwitcherAnim_StrafeLeft  = ska_GetIDFromStringTable("STRAFELEFT");
  idTwitcherAnim_StrafeRight = ska_GetIDFromStringTable("STRAFERIGHT");
  idTwitcherAnim_Wound       = ska_GetIDFromStringTable("WOUND");
  idTwitcherAnim_Jump        = ska_GetIDFromStringTable("JUMP");
  idTwitcherAnim_Melee1      = ska_GetIDFromStringTable("MELEE1");
  idTwitcherAnim_Melee2      = ska_GetIDFromStringTable("MELEE2");
  idTwitcherAnim_Melee3      = ska_GetIDFromStringTable("MELEE3");
  idTwitcherAnim_Melee4      = ska_GetIDFromStringTable("MELEE4");
  idTwitcherAnim_Melee5      = ska_GetIDFromStringTable("MELEE5");
  idTwitcherAnim_Melee6      = ska_GetIDFromStringTable("MELEE6");
  idTwitcherAnim_Melee7      = ska_GetIDFromStringTable("MELEE7");
  idTwitcherAnim_LeapMelee1  = ska_GetIDFromStringTable("LEAPMELEE1");
  idTwitcherAnim_SpinMelee1  = ska_GetIDFromStringTable("SPINMELEE1");
  idTwitcherAnim_DeathFront  = ska_GetIDFromStringTable("DEATHFRONT");
  idTwitcherAnim_DeathBack   = ska_GetIDFromStringTable("DEATHBACK");
  idTwitcherAnim_Block       = ska_GetIDFromStringTable("BLOCK");
  idTwitcherAnim_WritheFront = ska_GetIDFromStringTable("WRITHEFRONT");
  idTwitcherAnim_WritheBack  = ska_GetIDFromStringTable("WRITHEBACK");
  idTwitcherAnim_Spit        = ska_GetIDFromStringTable("SPIT");
  idTwitcherAnim_Cower       = ska_GetIDFromStringTable("COWER");
  idTwitcherAnim_CowerStop   = ska_GetIDFromStringTable("COWERSTOP");
  idTwitcherAnim_Rage1       = ska_GetIDFromStringTable("RAGE1");

  // Get twitcher collision box IDs
  idTwitcherBox_Stand       = ska_GetIDFromStringTable("Stand");
  idTwitcherBox_DeathFront  = ska_GetIDFromStringTable("DeathFront");
  idTwitcherBox_DeathBack   = ska_GetIDFromStringTable("DeathBack");
  idTwitcherBox_Cower       = ska_GetIDFromStringTable("Cower");

  // Get restrained twitcher animation IDs
  idTwitcherRestrainedAnim_TPose   = ska_GetIDFromStringTable("TPOSE");
  idTwitcherRestrainedAnim_Idle    = ska_GetIDFromStringTable("IDLE");
  idTwitcherRestrainedAnim_IdleFight = ska_GetIDFromStringTable("IDLEFIGHT");
  idTwitcherRestrainedAnim_Melee1  = ska_GetIDFromStringTable("MELEE1");
  idTwitcherRestrainedAnim_Melee2  = ska_GetIDFromStringTable("MELEE2");
  idTwitcherRestrainedAnim_Wound   = ska_GetIDFromStringTable("WOUND");
  idTwitcherRestrainedAnim_Death   = ska_GetIDFromStringTable("DEATH");

  // Get restrained twitcher collision box IDs
  idTwitcherRestrainedBox_Default = ska_GetIDFromStringTable("DefaultIdle");
};
  
  void AdjustBones(void) {
    if(en_RenderType == RT_SKAMODEL) {
      if(m_bJitterHead && GetHealth() > 0) {
        // get head bone
        INDEX iBoneIDHead = ska_GetIDFromStringTable("Head");
        RenBone *rbHead = RM_FindRenBone(iBoneIDHead);

        if(rbHead != NULL) {
          // Set jittering rotation via quaternion
          FLOATquat3D quatRandomHead;
          FLOAT fHeadingRandom = FRnd() + 30.0f - 15.0f;
          FLOAT fPitchRandom = FRnd() + 15.0f - 15.0f;
          fHeadingRandom = Clamp(fHeadingRandom, -45.0f, 45.0f);
          fPitchRandom = Clamp(fPitchRandom, 15.0f, 30.0f);
          quatRandomHead.FromEuler(ANGLE3D(0.0f, -fPitchRandom + FRnd()*m_fHeadJitterAmount, -fHeadingRandom + FRnd()*m_fHeadJitterAmount));
          rbHead->rb_arRot.ar_qRot = quatRandomHead*rbHead->rb_arRot.ar_qRot;
        }
      }
    }
  }

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
    static DECLARE_CTFILENAME(fnmTwitcherDiseased, "Data\\Messages\\NPCs\\TwitcherDiseased.txt");
    switch(m_twChar) {
    default: ASSERT(FALSE);
    case TWC_BALDWHITE: case TWC_BALDBLACK: return fnmTwitcherBald;
    case TWC_FEMALEWHITE: case TWC_FEMALEBLONDE: case TWC_FEMALEPALE: return fnmTwitcherFemale;
    case TWC_MALEWHITE: case TWC_MALEBLACK: return fnmTwitcherMale;
    case TWC_STRONGPALE: case TWC_STRONGCORPSE: case TWC_STRONGNIGHTMARE: case TWC_STRONGBLOODY: return fnmTwitcherStrong;
    case TWC_STRONGBLADED: case TWC_STRONGBLADED2: case TWC_STRONGBLADED3: case TWC_STRONGBLADED4: case TWC_STRONGBLADEDPALE: 
    case TWC_STRONGBLADEDNIGHTMARE: return fnmTwitcherBladed;
    case TWC_MALE2WHITE: case TWC_MALE2BLACK: return fnmTwitcherMale2;
    case TWC_FEMALE2WHITE: case TWC_FEMALE2PALE: return fnmTwitcherFemale2;
    case TWC_SKINNEDBLADED: case TWC_SKINNEDBLADED2: case TWC_SKINNEDBLADED3: return fnmTwitcherSkinned;
    case TWC_NIGHTMARESHADOW: return fnmTwitcherShadow;
    case TWC_MALE3WHITE: case TWC_MALE3BLACK: return fnmTwitcherMale3;

    case TWC_NIGHTMAREBLADED:
    case TWC_NIGHTMAREBLADED2:
    case TWC_NIGHTMAREBLADED3:
    case TWC_NIGHTMAREBLADEDELITE: 
    return fnmTwitcherNightmareBladed;

    case TWC_DISEASED:
    case TWC_DISEASEDBLOODY:
    case TWC_DISEASEDFORSAKEN: 
    case TWC_DISEASEDFORSAKEN2:
    case TWC_DISEASEDFORSAKEN3:
    case TWC_DISEASEDFORSAKEN4:
    case TWC_DISEASEDFORSAKEN5:
    case TWC_DISEASEDRESTRAINED:
    case TWC_DISEASEDRESTRAINEDBLOODY:
    return fnmTwitcherDiseased;
    }
  };

  void Precache(void) {
    CEnemyBase::Precache();
    PrecacheSound(SOUND_HIT);
    PrecacheSound(SOUND_PUNCH1);
    PrecacheSound(SOUND_PUNCH2);
    PrecacheSound(SOUND_PUNCH3);
    PrecacheSound(SOUND_PUNCH4);
    PrecacheSound(SOUND_SWING);
    PrecacheSound(SOUND_SLICE1);
    PrecacheSound(SOUND_SLICE2);
    PrecacheSound(SOUND_SLICE3);
    PrecacheSound(SOUND_CLASH1);
    PrecacheSound(SOUND_CLASH2);
    PrecacheSound(SOUND_CLASH3);

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
    PrecacheSound(SOUND_BRIDE_ACTIVE1);
    PrecacheSound(SOUND_BRIDE_IDLE2);
    PrecacheSound(SOUND_BRIDE_SIGHT2);
    PrecacheSound(SOUND_BRIDE_WOUND2);
    PrecacheSound(SOUND_BRIDE_DEATH2);
    PrecacheSound(SOUND_BRIDE_ACTIVE2);

    PrecacheSound(SOUND_NIGHTMARE_IDLE1);
    PrecacheSound(SOUND_NIGHTMARE_SIGHT1);
    PrecacheSound(SOUND_NIGHTMARE_WOUND1);
    PrecacheSound(SOUND_NIGHTMARE_DEATH1);
    PrecacheSound(SOUND_NIGHTMARE_ATTACK1);
    PrecacheSound(SOUND_NIGHTMARE_IDLE2);
    PrecacheSound(SOUND_NIGHTMARE_SIGHT2);
    PrecacheSound(SOUND_NIGHTMARE_WOUND2);
    PrecacheSound(SOUND_NIGHTMARE_DEATH2);
    PrecacheSound(SOUND_NIGHTMARE_ATTACK2);
    PrecacheSound(SOUND_NIGHTMARE_IDLE3);
    PrecacheSound(SOUND_NIGHTMARE_SIGHT3);
    PrecacheSound(SOUND_NIGHTMARE_WOUND3);
    PrecacheSound(SOUND_NIGHTMARE_DEATH3);
    PrecacheSound(SOUND_NIGHTMARE_ATTACK3);
    PrecacheSound(SOUND_NIGHTMARE_RAGE1);
    PrecacheSound(SOUND_NIGHTMARE_RAGE2);
    PrecacheSound(SOUND_NIGHTMARE_RAGELONG1);
    PrecacheSound(SOUND_NIGHTMARE_RAGELONG2);

    PrecacheClass(CLASS_PROJECTILE, PRT_ABOMINATION_SPIT);
    PrecacheClass(CLASS_PROJECTILE, PRT_ELITE_SPIT);
  };

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    CEnemyBase::FillEntityStatistics(pes);
    switch(m_twChar) {
    case TWC_BALDWHITE: { pes->es_strName+=" Bald White"; } break;
    case TWC_BALDBLACK: { pes->es_strName+=" Bald Black"; } break;
    case TWC_FEMALEWHITE: { pes->es_strName+=" Female White"; } break;
    case TWC_FEMALEBLONDE: { pes->es_strName+=" Female Blonde"; } break;
    case TWC_FEMALEPALE: { pes->es_strName+=" Female Pale"; } break;
    case TWC_MALEWHITE: { pes->es_strName+=" Male 1 White"; } break;
    case TWC_MALEBLACK: { pes->es_strName+=" Male 1 Black"; } break;
    case TWC_STRONGPALE: { pes->es_strName+=" Strong Pale"; } break;
    case TWC_STRONGBLADED: { pes->es_strName+=" Bladed 1"; } break;
    case TWC_MALE2WHITE: { pes->es_strName+=" Male 2 White"; } break;
    case TWC_MALE2BLACK: { pes->es_strName+=" Male 2 Black"; } break;
    case TWC_FEMALE2WHITE: { pes->es_strName+=" Female 2 White"; } break;
    case TWC_STRONGCORPSE: { pes->es_strName+=" Strong Corpse"; } break;
    case TWC_STRONGBLADED2: { pes->es_strName+=" Bladed 2"; } break;
    case TWC_STRONGBLADED3: { pes->es_strName+=" Bladed 3"; } break;
    case TWC_SKINNEDBLADED: { pes->es_strName+=" Skinned Bladed 1"; } break;
    case TWC_SKINNEDBLADED2: { pes->es_strName+=" Skinned Bladed 2"; } break;
    case TWC_SKINNEDBLADED3: { pes->es_strName+=" Skinned Bladed 3"; } break;
    case TWC_STRONGBLADED4: { pes->es_strName+=" Bladed 4"; } break;
    case TWC_NIGHTMARESHADOW: { pes->es_strName+=" Nightmare Shadow"; } break;
    case TWC_MALE3WHITE: { pes->es_strName+=" Male 3 White"; } break;
    case TWC_MALE3BLACK: { pes->es_strName+=" Male 3 Black"; } break;
    case TWC_STRONGBLADEDPALE: { pes->es_strName+=" Bladed Pale"; } break;
    case TWC_NIGHTMAREBLADED: { pes->es_strName+=" Bladed Nightmare"; } break;
    case TWC_STRONGNIGHTMARE: { pes->es_strName+=" Strong Nightmare"; } break;
    case TWC_STRONGBLADEDNIGHTMARE: { pes->es_strName+=" Bladed 1 Nightmare"; } break;
    case TWC_NIGHTMAREBLADED2: { pes->es_strName+=" Bladed Nightmare 2"; } break;
    case TWC_NIGHTMAREBLADED3: { pes->es_strName+=" Bladed Nightmare 3"; } break;
    case TWC_STRONGBLOODY: { pes->es_strName+=" Strong Bloody"; } break;
    case TWC_FEMALE2PALE: { pes->es_strName+=" Female 2 Pale"; } break;
    case TWC_DISEASED: { pes->es_strName+=" Diseased"; } break;
    case TWC_DISEASEDBLOODY: { pes->es_strName+=" Diseased Bloody"; } break;
    case TWC_DISEASEDFORSAKEN: { pes->es_strName+=" Diseased Forsaken 1"; } break;
    case TWC_DISEASEDFORSAKEN2: { pes->es_strName+=" Diseased Forsaken 2"; } break;
    case TWC_DISEASEDFORSAKEN3: { pes->es_strName+=" Diseased Forsaken 3"; } break;
    case TWC_DISEASEDFORSAKEN4: { pes->es_strName+=" Diseased Forsaken 4"; } break;
    case TWC_DISEASEDFORSAKEN5: { pes->es_strName+=" Diseased Forsaken 5"; } break;
    case TWC_NIGHTMAREBLADEDELITE: { pes->es_strName+=" Bladed Nightmare Elite"; } break;
    case TWC_DISEASEDRESTRAINED: { pes->es_strName+=" Restrained Diseased"; } break;
    case TWC_DISEASEDRESTRAINEDBLOODY: { pes->es_strName+=" Restrained Diseased Bloody";} break;
    }
    return TRUE;
  }

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
    if(m_ibtBehavior != IBT_NONE) {
      CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
      if (IsOfClass(penInflictor, "Twitcher") || IsOfClass(penInflictor, "Stalker") 
       || IsOfClass(penInflictor, "Shambler")) {
        SetTargetHardForce(penInflictor);
      }
      // if died of chainsaw
      if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
        // must always blowup
        m_fBlowUpAmount = 0;
      }
    } else {
      // twitcher can't harm twitcher
      if (!IsOfClass(penInflictor, "Twitcher")) {
        CEnemyBase::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
        // if died of chainsaw
        if (dmtType==DMT_CHAINSAW && GetHealth()<=0) {
          // must always blowup
          m_fBlowUpAmount = 0;
        }
      }
    }
  };


  // damage anim
  INDEX AnimForDamage(FLOAT fDamage, enum DamageBodyPartType dbptType) {
    INDEX iAnim;

    if(m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
    {
      iAnim = idTwitcherRestrainedAnim_Wound;
    }
    else if(m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN ||
       m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
       m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5)
    {
      iAnim = idTwitcherAnim_Wound;
    }
    else if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 ||
            m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      iAnim = idTwitcherAnim_Wound;
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
    else if(m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3)
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
    else if(m_twChar == TWC_FEMALE2WHITE || m_twChar == TWC_FEMALE2PALE)
    {
      iAnim = TWITCHERFEMALE2_ANIM_WOUND;
    }
    else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
    {
      iAnim = TWITCHERMALE2_ANIM_WOUND;
    }
    else if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADEDNIGHTMARE)
    {
      iAnim = TWITCHERBLADED_ANIM_WOUND;
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGNIGHTMARE || m_twChar == TWC_STRONGBLOODY)
    {
      iAnim = TWITCHERSTRONG_ANIM_WOUND;
    }
    else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEBLONDE || m_twChar == TWC_FEMALEPALE)
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

    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 ||
       m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN ||
       m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
       m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 ||
       m_twChar == TWC_NIGHTMAREBLADEDELITE || m_twChar == TWC_DISEASEDRESTRAINED ||
       m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
    {
      StartSkaModelAnim(iAnim,AN_CLEAR,1,0);
    }
    else
    {
      StartModelAnim(iAnim, 0);
    }

    return iAnim;
  };

  // death
  INDEX AnimForDeath(void) {
      INDEX iAnim;
      FLOAT3D vFront;
      GetHeadingDirection(0, vFront);
      FLOAT fDamageDir = m_vDamage%vFront;

      if(m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
      {
        iAnim = idTwitcherRestrainedAnim_Death;
      }
      else if(m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN ||
         m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
         m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5)
      {
        if (fDamageDir<0) {
          iAnim = idTwitcherAnim_DeathFront;
        } else {
          iAnim = idTwitcherAnim_DeathBack;
        }
      }
      else if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 ||
              m_twChar == TWC_NIGHTMAREBLADEDELITE)
      {
        if (fDamageDir<0) {
          iAnim = idTwitcherAnim_DeathFront;
        } else {
          iAnim = idTwitcherAnim_DeathBack;
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
      else if(m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERSKINNED_ANIM_DEATHFRONT;
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
      else if(m_twChar == TWC_FEMALE2WHITE || m_twChar == TWC_FEMALE2PALE)
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
      else if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADEDNIGHTMARE)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERBLADED_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERBLADED_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGNIGHTMARE || m_twChar == TWC_STRONGBLOODY)
      {
        if (fDamageDir<0) {
          iAnim = TWITCHERSTRONG_ANIM_DEATHFRONT;
        } else {
          iAnim = TWITCHERSTRONG_ANIM_DEATHBACK;
        }
      }
      else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEBLONDE || m_twChar == TWC_FEMALEPALE)
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

    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 ||
       m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN ||
       m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
       m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 || m_twChar == TWC_NIGHTMAREBLADEDELITE
       || m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
    {
      StartSkaModelAnim(iAnim,AN_CLEAR,1,0);
    }
    else
    {
      StartModelAnim(iAnim, 0);
    }

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
    SendEventInRange(eSound, FLOATaabbox3D(GetPlacement().pl_PositionVector, 30.0f));

    if(m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
    {
      INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idTwitcherRestrainedBox_Default);
      ASSERT(iBoxIndex>=0);
      ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      SetSkaColisionInfo();
    }
    else if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3
       || m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN ||
       m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
       m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 || m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      if(GetModelInstance()->IsAnimationPlaying(idTwitcherAnim_DeathFront))
      {
        INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idTwitcherBox_DeathFront);
        ASSERT(iBoxIndex>=0);
        ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
        SetSkaColisionInfo();
      }
      else
      {
        INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idTwitcherBox_DeathBack);
        ASSERT(iBoxIndex>=0);
        ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
        SetSkaColisionInfo();
      }
    }
    else
    {
      if(GetModelObject()->GetAnim()==TWITCHERPALEBLADED_ANIM_DEATHFRONT)
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
        ChangeCollisionBoxIndexWhenPossible(TWITCHERSKINNED_COLLISION_BOX_DEATHBOX_FRONT);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERSKINNED_ANIM_DEATHBACK)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERSKINNED_COLLISION_BOX_DEATHBOX_BACK);
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
        ChangeCollisionBoxIndexWhenPossible(TWITCHERBLADED2_COLLISION_BOX_DEATHBOX_FRONT);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERBLADED2_ANIM_DEATHBACK)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERBLADED2_COLLISION_BOX_DEATHBOX_BACK);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERFEMALE2_ANIM_DEATHFRONT)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERFEMALE2_COLLISION_BOX_DEATHBOX_FRONT);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERFEMALE2_ANIM_DEATHBACK)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERFEMALE2_COLLISION_BOX_DEATHBOX_BACK);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERMALE2_ANIM_DEATHFRONT)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERMALE2_COLLISION_BOX_DEATHBOX_FRONT);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERMALE2_ANIM_DEATHBACK)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERMALE2_COLLISION_BOX_DEATHBOX_BACK);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERBLADED_ANIM_DEATHFRONT)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERBLADED_COLLISION_BOX_DEATHBOX_FRONT);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERBLADED_ANIM_DEATHBACK)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERBLADED_COLLISION_BOX_DEATHBOX_BACK);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERSTRONG_ANIM_DEATHFRONT)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERSTRONG_COLLISION_BOX_DEATHBOX_FRONT);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERSTRONG_ANIM_DEATHBACK)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERSTRONG_COLLISION_BOX_DEATHBOX_BACK);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERMALE_ANIM_DEATHFRONT)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERMALE_COLLISION_BOX_DEATHBOX_FRONT);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERMALE_ANIM_DEATHBACK)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERMALE_COLLISION_BOX_DEATHBOX_BACK);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERFEMALE_ANIM_DEATHFRONT)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERFEMALE_COLLISION_BOX_DEATHBOX_FRONT);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERFEMALE_ANIM_DEATHBACK)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERFEMALE_COLLISION_BOX_DEATHBOX_BACK);
      }
      else if(GetModelObject()->GetAnim()==TWITCHERBALD_ANIM_DEATHFRONT)
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERBALD_COLLISION_BOX_DEATHBOX_FRONT);
      }
      else
      {
        ChangeCollisionBoxIndexWhenPossible(TWITCHERBALD_COLLISION_BOX_DEATHBOX_BACK);
      }
    }
    
    en_fDensity = 500.0f;
  };

  // virtual anim functions
  void StandingAnim(void) {
    if(m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
    {
      StartSkaModelAnim(idTwitcherRestrainedAnim_Idle,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    }
    else if(m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN ||
       m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
       m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5)
    {
      switch(m_iStandAnim)
      {
        case 0: StartSkaModelAnim(idTwitcherAnim_Stand,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0); break;
        case 1: StartSkaModelAnim(idTwitcherAnim_Stand2,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0); break;
        default: ASSERTALWAYS("Twitcher unknown stand animation");
      }
    }
    else if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 ||
            m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      StartSkaModelAnim(idTwitcherAnim_Stand,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
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
    else if(m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3)
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
    else if(m_twChar == TWC_FEMALE2WHITE || m_twChar == TWC_FEMALE2PALE)
    {
      StartModelAnim(TWITCHERFEMALE2_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
    {
      StartModelAnim(TWITCHERMALE2_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADEDNIGHTMARE)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGNIGHTMARE || m_twChar == TWC_STRONGBLOODY)
    {
      StartModelAnim(TWITCHERSTRONG_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
    {
      StartModelAnim(TWITCHERMALE_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEBLONDE || m_twChar == TWC_FEMALEPALE)
    {
      StartModelAnim(TWITCHERFEMALE_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(TWITCHERBALD_ANIM_STAND, AOF_LOOPING|AOF_NORESTART);
    }
  };

  // virtual anim functions
  void StandingAnimFight(void) {
    if(m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
    {
      StartSkaModelAnim(idTwitcherRestrainedAnim_IdleFight,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    }
    else if(m_twChar == TWC_FEMALE2WHITE || m_twChar == TWC_FEMALE2PALE)
    {
      StartModelAnim(TWITCHERFEMALE2_ANIM_STAND2, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 ||
             m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      StartSkaModelAnim(idTwitcherAnim_Stand2,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    }
    else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
    {
      StartModelAnim(TWITCHERMALE2_ANIM_STAND2, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_STAND2, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
    {
      StartModelAnim(TWITCHERMALE_ANIM_STAND2, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEBLONDE || m_twChar == TWC_FEMALEPALE)
    {
      StartModelAnim(TWITCHERFEMALE_ANIM_STAND2, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADEDNIGHTMARE)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_STAND2, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGNIGHTMARE || m_twChar == TWC_STRONGBLOODY)
    {
      StartModelAnim(TWITCHERSTRONG_ANIM_STAND2, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_twChar == TWC_BALDWHITE || m_twChar == TWC_BALDBLACK)
    {
      StartModelAnim(TWITCHERBALD_ANIM_STAND2, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StandingAnim();
    }
  };

  void WalkingAnim(void) {
    if(m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
    {
      StartSkaModelAnim(idTwitcherRestrainedAnim_Idle,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    }
    else if(m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN ||
       m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
       m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5)
    {
      switch(m_iRunAnim)
      {
        case 0: StartSkaModelAnim(idTwitcherAnim_Walk,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0); break;
        case 1: StartSkaModelAnim(idTwitcherAnim_Walk2,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0); break;
        default: ASSERTALWAYS("Twitcher unknown run animation");
      }
    }
    else if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 ||
            m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      switch(m_iRunAnim)
      {
        case 0: StartSkaModelAnim(idTwitcherAnim_Walk,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0); break;
        case 1: StartSkaModelAnim(idTwitcherAnim_Walk2,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0); break;
        default: ASSERTALWAYS("Twitcher unknown run animation");
      }
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
    else if(m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3)
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
    else if(m_twChar == TWC_FEMALE2WHITE || m_twChar == TWC_FEMALE2PALE)
    {
      StartModelAnim(TWITCHERFEMALE2_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
    {
      StartModelAnim(TWITCHERMALE2_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADEDNIGHTMARE)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGNIGHTMARE || m_twChar == TWC_STRONGBLOODY)
    {
      StartModelAnim(TWITCHERSTRONG_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
    {
      StartModelAnim(TWITCHERMALE_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEBLONDE || m_twChar == TWC_FEMALEPALE)
    {
      StartModelAnim(TWITCHERFEMALE_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(TWITCHERBALD_ANIM_WALK, AOF_LOOPING|AOF_NORESTART);
    }
  };

  void RunningAnim(void) {
    if(m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
    {
      StartSkaModelAnim(idTwitcherRestrainedAnim_Idle,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    }
    else if(m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN ||
       m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
       m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5)
    {
      if(m_twSpeed != TSPT_FAST) {
        switch(m_iRunAnim)
        {
          case 0: StartSkaModelAnim(idTwitcherAnim_Walk,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0); break;
          case 1: StartSkaModelAnim(idTwitcherAnim_Walk2,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0); break;
          default: ASSERTALWAYS("Twitcher unknown run animation");
        }
      } else {
        StartSkaModelAnim(idTwitcherAnim_Run,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
      }
    }
    else if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 ||
            m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      if(m_twSpeed == TSPT_FAST) {
        StartSkaModelAnim(idTwitcherAnim_Run2,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
      } else {
        StartSkaModelAnim(idTwitcherAnim_Run,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
      }
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
    else if(m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3)
    {
      if(m_twSpeed == TSPT_FAST) {
        switch(m_iRunAnim)
        {
          case 0: StartModelAnim(TWITCHERSKINNED_ANIM_RUN2, AOF_LOOPING|AOF_NORESTART); break;
          case 1: StartModelAnim(TWITCHERSKINNED_ANIM_RUN3, AOF_LOOPING|AOF_NORESTART); break;
          case 2: StartModelAnim(TWITCHERSKINNED_ANIM_RUN4, AOF_LOOPING|AOF_NORESTART); break;
          default: ASSERTALWAYS("Twitcher unknown run animation");
        }
      } else {
        StartModelAnim(TWITCHERSKINNED_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
      }
    }
    else if(m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      if(m_twSpeed == TSPT_FAST) {
        StartModelAnim(TWITCHERBLADED2_ANIM_RUN2, AOF_LOOPING|AOF_NORESTART);
      } else {
        StartModelAnim(TWITCHERBLADED2_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
      }
    }
    else if(m_twChar == TWC_FEMALE2WHITE || m_twChar == TWC_FEMALE2PALE)
    {
      if(m_twSpeed == TSPT_FAST) {
        StartModelAnim(TWITCHERFEMALE2_ANIM_RUN2, AOF_LOOPING|AOF_NORESTART);
      } else {
        StartModelAnim(TWITCHERFEMALE2_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
      }
    }
    else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
    {
      if(m_twSpeed == TSPT_FAST) {
        StartModelAnim(TWITCHERMALE2_ANIM_RUN2, AOF_LOOPING|AOF_NORESTART);
      } else {
        StartModelAnim(TWITCHERMALE2_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
      }
    }
    else if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADEDNIGHTMARE)
    {
      if(m_twSpeed == TSPT_FAST) {
        StartModelAnim(TWITCHERBLADED_ANIM_RUN2, AOF_LOOPING|AOF_NORESTART);
      } else {
        StartModelAnim(TWITCHERBLADED_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
      }
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGNIGHTMARE || m_twChar == TWC_STRONGBLOODY)
    {
      if(m_twSpeed == TSPT_FAST) {
        StartModelAnim(TWITCHERSTRONG_ANIM_RUN2, AOF_LOOPING|AOF_NORESTART);
      } else {
        StartModelAnim(TWITCHERSTRONG_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
      }
    }
    else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
    {
      if(m_twSpeed == TSPT_FAST) {
        StartModelAnim(TWITCHERMALE_ANIM_RUN2, AOF_LOOPING|AOF_NORESTART);
      } else {
        StartModelAnim(TWITCHERMALE_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
      }
    }
    else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEBLONDE || m_twChar == TWC_FEMALEPALE)
    {
      if(m_twSpeed == TSPT_FAST) {
        StartModelAnim(TWITCHERFEMALE_ANIM_RUN2, AOF_LOOPING|AOF_NORESTART);
      } else {
        StartModelAnim(TWITCHERFEMALE_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
      }
    }
    else
    {
      if(m_twSpeed == TSPT_FAST) {
        StartModelAnim(TWITCHERBALD_ANIM_RUN2, AOF_LOOPING|AOF_NORESTART);
      } else {
        StartModelAnim(TWITCHERBALD_ANIM_RUN, AOF_LOOPING|AOF_NORESTART);
      }
    }
  };

  void RotatingAnim(void) {
    RunningAnim();
  };

  void BacksteppingAnim(void) {
    if(m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN ||
       m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
       m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5)
    {
      StartSkaModelAnim(idTwitcherAnim_Backpedal,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    }
    else if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 ||
            m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      StartSkaModelAnim(idTwitcherAnim_Backpedal,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    }
    else if(m_twChar == TWC_STRONGBLADEDPALE)
    {
      StartModelAnim(TWITCHERPALEBLADED_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3)
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
    else if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADEDNIGHTMARE)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGNIGHTMARE || m_twChar == TWC_STRONGBLOODY)
    {
      StartModelAnim(TWITCHERSTRONG_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEBLONDE || m_twChar == TWC_FEMALEPALE)
    {
      StartModelAnim(TWITCHERFEMALE_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
    {
      StartModelAnim(TWITCHERMALE_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_BALDWHITE || m_twChar == TWC_BALDBLACK)
    {
      StartModelAnim(TWITCHERBALD_ANIM_BACKPEDAL, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      WalkingAnim();
    }
  };

  void StrafeLeftAnim(void) {
    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 ||
       m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      StartSkaModelAnim(idTwitcherAnim_StrafeRight,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    }
    else if (m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_STRAFERIGHT, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_STRAFELEFT, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_STRAFELEFT, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      RunningAnim();
    }
  };

  void StrafeRightAnim(void) {
    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 ||
       m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      StartSkaModelAnim(idTwitcherAnim_StrafeLeft,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    }
    else if (m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_STRAFELEFT, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_STRAFERIGHT, AOF_LOOPING|AOF_NORESTART);
    }
    else if (m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_STRAFERIGHT, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      RunningAnim();
    }
  };

  void JumpingAnim(void) {
    if(m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
    {
      StartSkaModelAnim(idTwitcherRestrainedAnim_Idle,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    }
    else if(m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN ||
       m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
       m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5)
    {
      StartSkaModelAnim(idTwitcherAnim_Jump,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
    }
    else if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 ||
            m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      StartSkaModelAnim(idTwitcherAnim_Jump,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
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
    else if(m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_LEAP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_FEMALE2WHITE || m_twChar == TWC_FEMALE2PALE)
    {
      StartModelAnim(TWITCHERFEMALE2_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK)
    {
      StartModelAnim(TWITCHERMALE2_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADEDNIGHTMARE)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGNIGHTMARE || m_twChar == TWC_STRONGBLOODY)
    {
      StartModelAnim(TWITCHERSTRONG_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK)
    {
      StartModelAnim(TWITCHERMALE_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
    else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEBLONDE || m_twChar == TWC_FEMALEPALE)
    {
      StartModelAnim(TWITCHERFEMALE_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
    else
    {
      StartModelAnim(TWITCHERBALD_ANIM_JUMP, AOF_LOOPING|AOF_NORESTART);
    }
  };

  // virtual sound functions
  void IdleSound(void) {
    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 || m_twChar == TWC_STRONGNIGHTMARE
    || m_twChar == TWC_STRONGBLADEDNIGHTMARE || m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      switch(IRnd()%3)
      {
        case 0: PlaySound(m_soVoice, SOUND_NIGHTMARE_IDLE1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_NIGHTMARE_IDLE2, SOF_3D); break;
        case 2: PlaySound(m_soVoice, SOUND_NIGHTMARE_IDLE3, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown idle sound");
      }
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGBLADED3 
    || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_NIGHTMARESHADOW || m_twChar == TWC_STRONGBLADEDPALE
    || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3 || m_twChar == TWC_STRONGBLOODY || m_twChar == TWC_DISEASEDFORSAKEN
    || m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
    m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 || m_twChar == TWC_DISEASEDRESTRAINED ||
    m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soVoice, SOUND_STRONG_IDLE1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_STRONG_IDLE2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown idle sound");
      }
    }
    else
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soVoice, SOUND_IDLE1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_IDLE2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown idle sound");
      }
    }
  };

  void SightSound(void) {
    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 || m_twChar == TWC_STRONGNIGHTMARE
    || m_twChar == TWC_STRONGBLADEDNIGHTMARE || m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      switch(IRnd()%3)
      {
        case 0: PlaySound(m_soVoice, SOUND_NIGHTMARE_SIGHT1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_NIGHTMARE_SIGHT2, SOF_3D); break;
        case 2: PlaySound(m_soVoice, SOUND_NIGHTMARE_SIGHT3, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown sight sound");
      }
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGBLADED3
    || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_NIGHTMARESHADOW
    || m_twChar == TWC_STRONGBLADEDPALE || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3 || m_twChar == TWC_STRONGBLOODY 
    || m_twChar == TWC_DISEASEDFORSAKEN || m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
    m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 || m_twChar == TWC_DISEASEDRESTRAINED ||
    m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soVoice, SOUND_STRONG_SIGHT1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_STRONG_SIGHT2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown sight sound");
      }
    }
    else
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soVoice, SOUND_SIGHT1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_SIGHT2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown sight sound");
      }
    }
  };

  void WoundSound(void) {
    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 || m_twChar == TWC_STRONGNIGHTMARE
    || m_twChar == TWC_STRONGBLADEDNIGHTMARE || m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      switch(IRnd()%3)
      {
        case 0: PlaySound(m_soVoice, SOUND_NIGHTMARE_WOUND1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_NIGHTMARE_WOUND2, SOF_3D); break;
        case 2: PlaySound(m_soVoice, SOUND_NIGHTMARE_WOUND3, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown wound sound");
      }
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGBLADED3 
    || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_NIGHTMARESHADOW || m_twChar == TWC_STRONGBLADEDPALE
    || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3 || m_twChar == TWC_STRONGBLOODY || m_twChar == TWC_DISEASEDFORSAKEN
    || m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
    m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 || m_twChar == TWC_DISEASEDRESTRAINED ||
    m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soVoice, SOUND_STRONG_WOUND1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_STRONG_WOUND2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown wound sound");
      }
    }
    else
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soVoice, SOUND_WOUND1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_WOUND2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown wound sound");
      }
    }
  };

  void DeathSound(void) {
    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 || m_twChar == TWC_STRONGNIGHTMARE
    || m_twChar == TWC_STRONGBLADEDNIGHTMARE || m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      switch(IRnd()%3)
      {
        case 0: PlaySound(m_soVoice, SOUND_NIGHTMARE_DEATH1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_NIGHTMARE_DEATH2, SOF_3D); break;
        case 2: PlaySound(m_soVoice, SOUND_NIGHTMARE_DEATH3, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown death sound");
      }
    }
    else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGBLADED3 
    || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_NIGHTMARESHADOW || m_twChar == TWC_STRONGBLADEDPALE
    || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3 || m_twChar == TWC_STRONGBLOODY || m_twChar == TWC_DISEASEDFORSAKEN
    || m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3 ||
    m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 || m_twChar == TWC_DISEASEDRESTRAINED ||
    m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soVoice, SOUND_STRONG_DEATH1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_STRONG_DEATH2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown death sound");
      }
    }
    else
    {
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soVoice, SOUND_DEATH1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_DEATH2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown death sound");
      }
    }
  };


  procedures:


  BlockEnemyMelee(EVoid) {
    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 || m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      StartSkaModelAnim(idTwitcherAnim_Block,AN_CLEAR,1,0);
    }
    else if(m_twChar == TWC_STRONGBLADEDPALE)
    {
      StartModelAnim(TWITCHERPALEBLADED_ANIM_BLOCK1, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED4)
    {
      StartModelAnim(TWITCHERBLADED4_ANIM_BLOCK1, 0);
    }
    else if(m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3)
    {
      StartModelAnim(TWITCHERSKINNED_ANIM_BLOCK, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_BLOCK, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADEDNIGHTMARE)
    {
      StartModelAnim(TWITCHERBLADED_ANIM_BLOCK, 0);
    }

    autowait(0.25f);

    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_STRONGBLADEDPALE || m_twChar == TWC_NIGHTMAREBLADEDELITE)
    {
      m_bIsBlocking = TRUE;
      m_bBlockFirearms = TRUE;
    } else {
      m_bIsBlocking = TRUE;
    }

    autowait(1.35f);

    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_STRONGBLADEDPALE || m_twChar == TWC_NIGHTMAREBLADEDELITE) {
      m_bIsBlocking = FALSE;
      m_bBlockFirearms = FALSE;
    } else {
      m_bIsBlocking = FALSE;
    }

    autowait(0.45f);

    return EReturn();
  }


  Fire(EVoid) : CEnemyBase::Fire
  {
    if(m_twChar == TWC_NIGHTMAREBLADEDELITE) {
      if(!CanFireAtPlayer(2.35f, FALSE)) {
        return EReturn();
      }

      autocall NightmareTwitcherEliteSpitAttack() EEnd;
      return EReturn();
    } else if(m_twChar == TWC_STRONGBLADED2) {
      if(!CanFireAtPlayer(1.95f, FALSE)) {
        return EReturn();
      }

      autocall BladedTwitcher2SpitAttack() EEnd;
      return EReturn();
    } else {
      return EReturn();
    }
  };

  // Bladed Twitcher 2 blood spit attack
  BladedTwitcher2SpitAttack(EVoid) {
    autowait(0.25f + FRnd()/4);

    if(!CanFireAtPlayer(1.95f, FALSE)) {
      return EEnd();
    }

    StartModelAnim(TWITCHERBLADED2_ANIM_SPIT, 0);
    autowait(0.375f);
    ShootProjectile(PRT_ABOMINATION_SPIT, FLOAT3D(0.0f, 1.95f, 0.0f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_HIT, SOF_3D);

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();
    return EEnd();
  };

  // Nightmare Bladed Twitcher Elite blood spit attack
  NightmareTwitcherEliteSpitAttack(EVoid) {
    autowait(0.25f + FRnd()/4);

    if(!CanFireAtPlayer(2.35f, FALSE)) {
      return EEnd();
    }

    StartSkaModelAnim(idTwitcherAnim_Spit,AN_CLEAR,1,0);
    autowait(0.375f);
    ShootProjectile(PRT_ELITE_SPIT, FLOAT3D(0.0f, 2.35f, 0.0f), ANGLE3D(0, 0, 0));
    PlaySound(m_soSound, SOUND_HIT, SOF_3D);

    autowait(0.5f + FRnd()/3);
    MaybeSwitchToAnotherPlayer();
    return EEnd();
  };


  // melee attack enemy
  Hit(EVoid) : CEnemyBase::Hit {
    if(m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY) {
      jump TwitcherRestrainedMelee();
    } else if (m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN
     || m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3
     || m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5) {
      jump TwitcherDiseasedSlash();
    } else if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 ||
              m_twChar == TWC_NIGHTMAREBLADEDELITE) {
      m_iLeapThreshold--;
      if (CalcDist(m_penEnemy) < 3.0f) {
        if(GetSP()->sp_gdGameDifficulty>=CSessionProperties::GD_HARD) {
          switch(IRnd()%4)
          {
            case 0: jump TwitcherNightmareBladedSlash(); break;
            case 1: jump TwitcherNightmareBladedDoubleSlash(); break;
            case 2: jump TwitcherNightmareBladedSpinSlash(); break;
            case 3: jump TwitcherNightmareBladedDoubleSlash(); break;
            default: ASSERTALWAYS("Twitcher unknown melee attack");
          }
        } else {
          switch(IRnd()%3)
          {
            case 0: jump TwitcherNightmareBladedSlash(); break;
            case 1: jump TwitcherNightmareBladedDoubleSlash(); break;
            case 2: jump TwitcherNightmareBladedSpinSlash(); break;
            default: ASSERTALWAYS("Twitcher unknown melee attack");
          }
        }
      } else if (CalcDist(m_penEnemy) < 10.0f && IsInPlaneFrustum(m_penEnemy, CosFast(30.0f)) && m_iLeapThreshold <= 0) {
        if(m_twChar == TWC_NIGHTMAREBLADEDELITE) {
          m_iLeapThreshold = 5;
          if(GetSP()->sp_gdGameDifficulty>=CSessionProperties::GD_HARD) {
            m_iLeapThreshold = 4;
          }
        } else {
          m_iLeapThreshold = 6;
          if(GetSP()->sp_gdGameDifficulty>=CSessionProperties::GD_HARD) {
            m_iLeapThreshold = 5;
          }
        }
        jump TwitcherNightmareBladedLeap();
      }
    } else if (m_twChar == TWC_MALE2WHITE || m_twChar == TWC_MALE2BLACK) {
      jump TwitcherMale2Slash();
    } else if (m_twChar == TWC_FEMALE2WHITE || m_twChar == TWC_FEMALE2PALE) {
      jump TwitcherFemale2Slash();
    } else if(m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3) {
      jump TwitcherSkinnedSlash();
    } else if(m_twChar == TWC_STRONGBLADED2) {
      jump TwitcherBladed2Slash();
    } else if (m_twChar == TWC_MALEWHITE || m_twChar == TWC_MALEBLACK) {
      jump TwitcherMaleSlash();
    } else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEBLONDE || m_twChar == TWC_FEMALEPALE) {
      jump TwitcherFemaleSlash();
    } else if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADEDNIGHTMARE) {
      jump TwitcherBladedSlash();
    } else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGCORPSE || m_twChar == TWC_STRONGNIGHTMARE || m_twChar == TWC_STRONGBLOODY) {
      jump TwitcherStrongSlash();
    } else if(m_twChar == TWC_BALDWHITE || m_twChar == TWC_BALDBLACK) {
      jump TwitcherBaldSlash();
    } else {
      switch(IRnd()%4)
      {
        case 0: jump SlashEnemySingle(); break;
        case 1: jump SlashEnemyDouble(); break;
        case 2: jump SlashEnemySlam(); break;
        case 3: jump SlashEnemySingle2(); break;
        default: ASSERTALWAYS("Twitcher unknown melee attack");
      }
    }

    return EReturn();
  };

  TwitcherBaldSlash(EVoid) {

    switch(IRnd()%3)
    {
      case 0: StartModelAnim(TWITCHERBALD_ANIM_MELEE1, 0); break;
      case 1: StartModelAnim(TWITCHERBALD_ANIM_MELEE2, 0); break;
      case 2: StartModelAnim(TWITCHERBALD_ANIM_MELEE3, 0); break;
      default: ASSERTALWAYS("Bald Twitcher unknown melee attack");
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        switch(IRnd()%4)
        {
          case 0: PlaySound(m_soSound, SOUND_PUNCH1, SOF_3D); break;
          case 1: PlaySound(m_soSound, SOUND_PUNCH2, SOF_3D); break;
          case 2: PlaySound(m_soSound, SOUND_PUNCH3, SOF_3D); break;
          case 3: PlaySound(m_soSound, SOUND_PUNCH4, SOF_3D); break;
          default: ASSERTALWAYS("Twitcher unknown melee hit sound");
        }

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.25f, 0.0f);

        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 5.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  TwitcherStrongSlash(EVoid) {

    switch(IRnd()%3)
    {
      case 0: StartModelAnim(TWITCHERSTRONG_ANIM_MELEE1, 0); break;
      case 1: StartModelAnim(TWITCHERSTRONG_ANIM_MELEE2, 0); break;
      case 2: StartModelAnim(TWITCHERSTRONG_ANIM_MELEE3, 0); break;
      default: ASSERTALWAYS("Strong Twitcher unknown melee attack");
    }

    if(m_twChar == TWC_STRONGNIGHTMARE)
    {
      switch(IRnd()%3)
      {
        case 0: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK2, SOF_3D); break;
        case 2: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK3, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown attack sound");
      }
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        switch(IRnd()%4)
        {
          case 0: PlaySound(m_soSound, SOUND_PUNCH1, SOF_3D); break;
          case 1: PlaySound(m_soSound, SOUND_PUNCH2, SOF_3D); break;
          case 2: PlaySound(m_soSound, SOUND_PUNCH3, SOF_3D); break;
          case 3: PlaySound(m_soSound, SOUND_PUNCH4, SOF_3D); break;
          default: ASSERTALWAYS("Twitcher unknown melee hit sound");
        }

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.25f, 0.0f);

        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 10.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  TwitcherBladedSlash(EVoid) {

    INDEX iRandomChoice = IRnd()%4;
    CPlayer &enPL = (CPlayer&)*m_penEnemy;
    CPlayerWeapons *penWeapons = enPL.GetPlayerWeapons();

    if(IsOfClass(m_penEnemy, "Player")) {
      if(iRandomChoice == 1 && (penWeapons->m_iCurrentWeapon == WEAPON_KNIFE || penWeapons->m_iCurrentWeapon == WEAPON_AXE
                           || penWeapons->m_iCurrentWeapon == WEAPON_PIPE || penWeapons->m_iCurrentWeapon == WEAPON_PLANK)) {
        autocall BlockEnemyMelee() EReturn;
        return EReturn();
      }
    } else if(!IsOfClass(m_penEnemy, "Player")) {
      INDEX iRandomChoice = IRnd()%4;
      if(iRandomChoice == 1) {
        autocall BlockEnemyMelee() EReturn;
        return EReturn();
      }
    }

    switch(IRnd()%3)
    {
      case 0: StartModelAnim(TWITCHERBLADED_ANIM_MELEE1, 0); break;
      case 1: StartModelAnim(TWITCHERBLADED_ANIM_MELEE2, 0); break;
      case 2: StartModelAnim(TWITCHERBLADED_ANIM_MELEE3, 0); break;
      default: ASSERTALWAYS("Bladed Twitcher unknown melee attack");
    }

    if(m_twChar == TWC_STRONGBLADEDNIGHTMARE)
    {
      switch(IRnd()%3)
      {
        case 0: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK2, SOF_3D); break;
        case 2: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK3, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown attack sound");
      }
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.25f, 0.0f);

        FLOAT3D vProperDamageDir = (vDirection.ManhattanNorm() > m_fBlockDirAmount) ? vDirection : -en_vGravityDir;
        vProperDamageDir = (vProperDamageDir - en_vGravityDir * m_fBlockDirAmount).Normalize();

        if(IsOfClass(m_penEnemy, "Player")) {
          CPlayer &pl = (CPlayer&)*m_penEnemy;

          if(pl.m_bIsBlocking == TRUE) {
            if (pl.GetPlaneFrustumAngle(vProperDamageDir) < Cos(pl.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        } else if(IsDerivedFromClass(m_penEnemy, "Enemy Base")) {
          CEnemyBase &eb = (CEnemyBase&)*m_penEnemy;

          if(eb.m_bIsBlocking == TRUE) {
            if (eb.GetPlaneFrustumAngle(vProperDamageDir) < Cos(eb.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        }

        InflictDirectDamage(m_penEnemy, this, DMT_SHARP, 10.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();

    m_fLockOnEnemyTime = 1.0f;

    m_iRandomMovementChoice = IRnd()%4;

    if(m_iRandomMovementChoice == 1)
    {
      autocall CEnemyBase::StepBackwards() EReturn;
    }

    return EReturn();
  }

  TwitcherFemaleSlash(EVoid) {

    switch(IRnd()%3)
    {
      case 0: StartModelAnim(TWITCHERFEMALE_ANIM_MELEE1, 0); break;
      case 1: StartModelAnim(TWITCHERFEMALE_ANIM_MELEE2, 0); break;
      case 2: StartModelAnim(TWITCHERFEMALE_ANIM_MELEE3, 0); break;
      default: ASSERTALWAYS("Female Twitcher unknown melee attack");
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        switch(IRnd()%4)
        {
          case 0: PlaySound(m_soSound, SOUND_PUNCH1, SOF_3D); break;
          case 1: PlaySound(m_soSound, SOUND_PUNCH2, SOF_3D); break;
          case 2: PlaySound(m_soSound, SOUND_PUNCH3, SOF_3D); break;
          case 3: PlaySound(m_soSound, SOUND_PUNCH4, SOF_3D); break;
          default: ASSERTALWAYS("Twitcher unknown melee hit sound");
        }

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.25f, 0.0f);

        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 5.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  TwitcherMaleSlash(EVoid) {

    switch(IRnd()%3)
    {
      case 0: StartModelAnim(TWITCHERMALE_ANIM_MELEE1, 0); break;
      case 1: StartModelAnim(TWITCHERMALE_ANIM_MELEE2, 0); break;
      case 2: StartModelAnim(TWITCHERMALE_ANIM_MELEE3, 0); break;
      default: ASSERTALWAYS("Male Twitcher unknown melee attack");
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        switch(IRnd()%4)
        {
          case 0: PlaySound(m_soSound, SOUND_PUNCH1, SOF_3D); break;
          case 1: PlaySound(m_soSound, SOUND_PUNCH2, SOF_3D); break;
          case 2: PlaySound(m_soSound, SOUND_PUNCH3, SOF_3D); break;
          case 3: PlaySound(m_soSound, SOUND_PUNCH4, SOF_3D); break;
          default: ASSERTALWAYS("Twitcher unknown melee hit sound");
        }

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.25f, 0.0f);

        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 5.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  TwitcherBladed2Slash(EVoid) {

    INDEX iRandomChoice = IRnd()%4;
    CPlayer &enPL = (CPlayer&)*m_penEnemy;
    CPlayerWeapons *penWeapons = enPL.GetPlayerWeapons();

    if(IsOfClass(m_penEnemy, "Player")) {
      if(iRandomChoice == 1 && (penWeapons->m_iCurrentWeapon == WEAPON_KNIFE || penWeapons->m_iCurrentWeapon == WEAPON_AXE
                           || penWeapons->m_iCurrentWeapon == WEAPON_PIPE || penWeapons->m_iCurrentWeapon == WEAPON_PLANK)) {
        autocall BlockEnemyMelee() EReturn;
        return EReturn();
      }
    } else if(!IsOfClass(m_penEnemy, "Player")) {
      INDEX iRandomChoice = IRnd()%4;
      if(iRandomChoice == 1) {
        autocall BlockEnemyMelee() EReturn;
        return EReturn();
      }
    }

    switch(IRnd()%4)
    {
      case 0: StartModelAnim(TWITCHERBLADED2_ANIM_MELEE1, 0); break;
      case 1: StartModelAnim(TWITCHERBLADED2_ANIM_MELEE2, 0); break;
      case 2: StartModelAnim(TWITCHERBLADED2_ANIM_MELEE3, 0); break;
      case 3: StartModelAnim(TWITCHERBLADED2_ANIM_MELEE4, 0); break;
      default: ASSERTALWAYS("Bladed Twitcher unknown melee attack");
    }

    switch(IRnd()%3)
    {
        case 0: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK2, SOF_3D); break;
        case 2: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK3, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown attack sound");
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.25f, 0.0f);

        FLOAT3D vProperDamageDir = (vDirection.ManhattanNorm() > m_fBlockDirAmount) ? vDirection : -en_vGravityDir;
        vProperDamageDir = (vProperDamageDir - en_vGravityDir * m_fBlockDirAmount).Normalize();

        if(IsOfClass(m_penEnemy, "Player")) {
          CPlayer &pl = (CPlayer&)*m_penEnemy;

          if(pl.m_bIsBlocking == TRUE) {
            if (pl.GetPlaneFrustumAngle(vProperDamageDir) < Cos(pl.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        } else if(IsDerivedFromClass(m_penEnemy, "Enemy Base")) {
          CEnemyBase &eb = (CEnemyBase&)*m_penEnemy;

          if(eb.m_bIsBlocking == TRUE) {
            if (eb.GetPlaneFrustumAngle(vProperDamageDir) < Cos(eb.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        }

        InflictDirectDamage(m_penEnemy, this, DMT_SHARP, 10.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();

    m_fLockOnEnemyTime = 1.0f;

    m_iRandomMovementChoice = IRnd()%4;

    if(m_iRandomMovementChoice == 1)
    {
      autocall CEnemyBase::StepBackwards() EReturn;
    }

    return EReturn();
  }

  TwitcherSkinnedSlash(EVoid) {

    INDEX iRandomChoice = IRnd()%4;
    CPlayer &enPL = (CPlayer&)*m_penEnemy;
    CPlayerWeapons *penWeapons = enPL.GetPlayerWeapons();

    if(IsOfClass(m_penEnemy, "Player")) {
      if(iRandomChoice == 1 && (penWeapons->m_iCurrentWeapon == WEAPON_KNIFE || penWeapons->m_iCurrentWeapon == WEAPON_AXE
                           || penWeapons->m_iCurrentWeapon == WEAPON_PIPE || penWeapons->m_iCurrentWeapon == WEAPON_PLANK)) {
        autocall BlockEnemyMelee() EReturn;
        return EReturn();
      }
    } else if(!IsOfClass(m_penEnemy, "Player")) {
      INDEX iRandomChoice = IRnd()%4;
      if(iRandomChoice == 1) {
        autocall BlockEnemyMelee() EReturn;
        return EReturn();
      }
    }

    switch(IRnd()%4)
    {
      case 0: StartModelAnim(TWITCHERSKINNED_ANIM_MELEE1, 0); break;
      case 1: StartModelAnim(TWITCHERSKINNED_ANIM_MELEE2, 0); break;
      case 2: StartModelAnim(TWITCHERSKINNED_ANIM_MELEE3, 0); break;
      case 3: StartModelAnim(TWITCHERSKINNED_ANIM_MELEE4, 0); break;
      default: ASSERTALWAYS("Bladed Twitcher unknown melee attack");
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.25f, 0.0f);

        FLOAT3D vProperDamageDir = (vDirection.ManhattanNorm() > m_fBlockDirAmount) ? vDirection : -en_vGravityDir;
        vProperDamageDir = (vProperDamageDir - en_vGravityDir * m_fBlockDirAmount).Normalize();

        if(IsOfClass(m_penEnemy, "Player")) {
          CPlayer &pl = (CPlayer&)*m_penEnemy;

          if(pl.m_bIsBlocking == TRUE) {
            if (pl.GetPlaneFrustumAngle(vProperDamageDir) < Cos(pl.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        } else if(IsDerivedFromClass(m_penEnemy, "Enemy Base")) {
          CEnemyBase &eb = (CEnemyBase&)*m_penEnemy;

          if(eb.m_bIsBlocking == TRUE) {
            if (eb.GetPlaneFrustumAngle(vProperDamageDir) < Cos(eb.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        }

        InflictDirectDamage(m_penEnemy, this, DMT_SHARP, 10.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();

    m_fLockOnEnemyTime = 1.0f;

    m_iRandomMovementChoice = IRnd()%4;

    if(m_iRandomMovementChoice == 1) {
      autocall CEnemyBase::StrafeLeftOrRightRandom() EReturn;
    } else if (m_iRandomMovementChoice == 3) {
      autocall CEnemyBase::StepBackwards() EReturn;
    }


    return EReturn();
  }

  TwitcherMale2Slash(EVoid) {

    switch(IRnd()%3)
    {
      case 0: StartModelAnim(TWITCHERMALE2_ANIM_MELEE1, 0); break;
      case 1: StartModelAnim(TWITCHERMALE2_ANIM_MELEE2, 0); break;
      case 2: StartModelAnim(TWITCHERMALE2_ANIM_MELEE3, 0); break;
      default: ASSERTALWAYS("Male Twitcher unknown melee attack");
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        switch(IRnd()%4)
        {
          case 0: PlaySound(m_soSound, SOUND_PUNCH1, SOF_3D); break;
          case 1: PlaySound(m_soSound, SOUND_PUNCH2, SOF_3D); break;
          case 2: PlaySound(m_soSound, SOUND_PUNCH3, SOF_3D); break;
          case 3: PlaySound(m_soSound, SOUND_PUNCH4, SOF_3D); break;
          default: ASSERTALWAYS("Twitcher unknown melee hit sound");
        }

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.25f, 0.0f);

        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 5.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  TwitcherFemale2Slash(EVoid) {

    switch(IRnd()%3)
    {
      case 0: StartModelAnim(TWITCHERFEMALE2_ANIM_MELEE1, 0); break;
      case 1: StartModelAnim(TWITCHERFEMALE2_ANIM_MELEE2, 0); break;
      case 2: StartModelAnim(TWITCHERFEMALE2_ANIM_MELEE3, 0); break;
      default: ASSERTALWAYS("Female Twitcher unknown melee attack");
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        switch(IRnd()%4)
        {
          case 0: PlaySound(m_soSound, SOUND_PUNCH1, SOF_3D); break;
          case 1: PlaySound(m_soSound, SOUND_PUNCH2, SOF_3D); break;
          case 2: PlaySound(m_soSound, SOUND_PUNCH3, SOF_3D); break;
          case 3: PlaySound(m_soSound, SOUND_PUNCH4, SOF_3D); break;
          default: ASSERTALWAYS("Twitcher unknown melee hit sound");
        }

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.25f, 0.0f);

        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 5.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  TwitcherNightmareBladedSlash(EVoid) {

    m_iRandomBlockChoice = IRnd()%5;
    CPlayer &enPL = (CPlayer&)*m_penEnemy;
    CPlayerWeapons *penWeapons = enPL.GetPlayerWeapons();

    if(IsOfClass(m_penEnemy, "Player")) {
      if(m_iRandomBlockChoice == 1 && (penWeapons->m_iCurrentWeapon == WEAPON_KNIFE || penWeapons->m_iCurrentWeapon == WEAPON_AXE
                           || penWeapons->m_iCurrentWeapon == WEAPON_PIPE || penWeapons->m_iCurrentWeapon == WEAPON_PLANK) && enPL.m_bIsBlocking == FALSE) {
        autocall BlockEnemyMelee() EReturn;
        return EReturn();
      } else if(m_iRandomBlockChoice == 3) {
        m_fLockOnEnemyTime = 1.0f;
        autocall CEnemyBase::StepBackwards() EReturn;
        return EReturn();
      }
    } else if(!IsOfClass(m_penEnemy, "Player")) {
      if(m_iRandomBlockChoice == 1) {
        autocall BlockEnemyMelee() EReturn;
        return EReturn();
      } else if(m_iRandomBlockChoice == 3) {
        m_fLockOnEnemyTime = 1.0f;
        autocall CEnemyBase::StepBackwards() EReturn;
        return EReturn();
      }
    }
    
    switch(IRnd()%5)
    {
      case 0: StartSkaModelAnim(idTwitcherAnim_Melee1,AN_CLEAR,1,0); break;
      case 1: StartSkaModelAnim(idTwitcherAnim_Melee2,AN_CLEAR,1,0); break;
      case 2: StartSkaModelAnim(idTwitcherAnim_Melee3,AN_CLEAR,1,0); break;
      case 3: StartSkaModelAnim(idTwitcherAnim_Melee4,AN_CLEAR,1,0); break;
      case 4: StartSkaModelAnim(idTwitcherAnim_Melee7,AN_CLEAR,1,0); break;
      default: ASSERTALWAYS("Nightmare Bladed Twitcher unknown melee attack");
    }

    switch(IRnd()%3)
    {
        case 0: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK2, SOF_3D); break;
        case 2: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK3, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown attack sound");
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < 3.0f) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < 3.0f) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.5f, 0.0f);

        FLOAT3D vProperDamageDir = (vDirection.ManhattanNorm() > m_fBlockDirAmount) ? vDirection : -en_vGravityDir;
        vProperDamageDir = (vProperDamageDir - en_vGravityDir * m_fBlockDirAmount).Normalize();

        if(IsOfClass(m_penEnemy, "Player")) {
          CPlayer &pl = (CPlayer&)*m_penEnemy;

          if(pl.m_bIsBlocking == TRUE) {
            if (pl.GetPlaneFrustumAngle(vProperDamageDir) < Cos(pl.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        } else if(IsDerivedFromClass(m_penEnemy, "Enemy Base")) {
          CEnemyBase &eb = (CEnemyBase&)*m_penEnemy;

          if(eb.m_bIsBlocking == TRUE) {
            if (eb.GetPlaneFrustumAngle(vProperDamageDir) < Cos(eb.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        }

        if(GetModelInstance()->IsAnimationPlaying(idTwitcherAnim_Melee1) ||
           GetModelInstance()->IsAnimationPlaying(idTwitcherAnim_Melee4) ||
           GetModelInstance()->IsAnimationPlaying(idTwitcherAnim_Melee7)) {
          InflictDirectDamage(m_penEnemy, this, DMT_SHARP, 15.0f, vPosition, vDirection, DBPT_GENERIC);
        } else {
          InflictDirectDamage(m_penEnemy, this, DMT_SHARP, 10.0f, vPosition, vDirection, DBPT_GENERIC);
        }
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.75f);

    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  TwitcherNightmareBladedDoubleSlash(EVoid) {

    m_iRandomBlockChoice = IRnd()%5;
    CPlayer &enPL = (CPlayer&)*m_penEnemy;
    CPlayerWeapons *penWeapons = enPL.GetPlayerWeapons();

    if(IsOfClass(m_penEnemy, "Player")) {
      if(m_iRandomBlockChoice == 1 && (penWeapons->m_iCurrentWeapon == WEAPON_KNIFE || penWeapons->m_iCurrentWeapon == WEAPON_AXE
                           || penWeapons->m_iCurrentWeapon == WEAPON_PIPE || penWeapons->m_iCurrentWeapon == WEAPON_PLANK) && enPL.m_bIsBlocking == FALSE) {
        autocall BlockEnemyMelee() EReturn;
        return EReturn();
      } else if(m_iRandomBlockChoice == 3) {
        m_fLockOnEnemyTime = 1.0f;
        autocall CEnemyBase::StepBackwards() EReturn;
        return EReturn();
      }
    } else if(!IsOfClass(m_penEnemy, "Player")) {
      if(m_iRandomBlockChoice == 1) {
        autocall BlockEnemyMelee() EReturn;
        return EReturn();
      } else if(m_iRandomBlockChoice == 3) {
        m_fLockOnEnemyTime = 1.0f;
        autocall CEnemyBase::StepBackwards() EReturn;
        return EReturn();
      }
    }

    switch(IRnd()%2)
    {
      case 0: StartSkaModelAnim(idTwitcherAnim_Melee5,AN_CLEAR,1,0); break;
      case 1: StartSkaModelAnim(idTwitcherAnim_Melee6,AN_CLEAR,1,0); break;
      default: ASSERTALWAYS("Nightmare Bladed Twitcher unknown melee attack");
    }

    switch(IRnd()%3)
    {
        case 0: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK2, SOF_3D); break;
        case 2: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK3, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown attack sound");
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < 3.0f) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < 3.0f) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.5f, 0.0f);

        FLOAT3D vProperDamageDir = (vDirection.ManhattanNorm() > m_fBlockDirAmount) ? vDirection : -en_vGravityDir;
        vProperDamageDir = (vProperDamageDir - en_vGravityDir * m_fBlockDirAmount).Normalize();

        if(IsOfClass(m_penEnemy, "Player")) {
          CPlayer &pl = (CPlayer&)*m_penEnemy;

          if(pl.m_bIsBlocking == TRUE) {
            if (pl.GetPlaneFrustumAngle(vProperDamageDir) < Cos(pl.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        } else if(IsDerivedFromClass(m_penEnemy, "Enemy Base")) {
          CEnemyBase &eb = (CEnemyBase&)*m_penEnemy;

          if(eb.m_bIsBlocking == TRUE) {
            if (eb.GetPlaneFrustumAngle(vProperDamageDir) < Cos(eb.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        }

        InflictDirectDamage(m_penEnemy, this, DMT_SHARP, 12.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.65f);

    switch(IRnd()%3)
    {
        case 0: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK2, SOF_3D); break;
        case 2: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK3, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown attack sound");
    }

    m_bFistHit = FALSE;
    if (CalcDist(m_penEnemy) < 3.0f) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < 3.0f) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.5f, 0.0f);

        FLOAT3D vProperDamageDir = (vDirection.ManhattanNorm() > m_fBlockDirAmount) ? vDirection : -en_vGravityDir;
        vProperDamageDir = (vProperDamageDir - en_vGravityDir * m_fBlockDirAmount).Normalize();

        if(IsOfClass(m_penEnemy, "Player")) {
          CPlayer &pl = (CPlayer&)*m_penEnemy;

          if(pl.m_bIsBlocking == TRUE) {
            if (pl.GetPlaneFrustumAngle(vProperDamageDir) < Cos(pl.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        } else if(IsDerivedFromClass(m_penEnemy, "Enemy Base")) {
          CEnemyBase &eb = (CEnemyBase&)*m_penEnemy;

          if(eb.m_bIsBlocking == TRUE) {
            if (eb.GetPlaneFrustumAngle(vProperDamageDir) < Cos(eb.m_fBlockAmount)) {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_CLASH1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CLASH2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_CLASH3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            } else {
              switch(IRnd()%3)
              {
                case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
                case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
                default: ASSERTALWAYS("Twitcher unknown melee hit sound");
              }
            }
          } else {
            switch(IRnd()%3)
            {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
            }
          }
        }

        InflictDirectDamage(m_penEnemy, this, DMT_SHARP, 12.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.75f);

    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  TwitcherNightmareBladedSpinSlash(EVoid) {

    StartSkaModelAnim(idTwitcherAnim_SpinMelee1,AN_CLEAR,1,0);

    switch(IRnd()%3)
    {
        case 0: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK2, SOF_3D); break;
        case 2: PlaySound(m_soVoice, SOUND_NIGHTMARE_ATTACK3, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown attack sound");
    }

    m_bFistHit = FALSE;
    autowait(0.5f);
    if (CalcDist(m_penEnemy) < 3.0f) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < 3.0f) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.5f, 0.0f);

        switch(IRnd()%3)
        {
          case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
          case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
          case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
          default: ASSERTALWAYS("Twitcher unknown melee hit sound");
        }

        InflictDirectDamage(m_penEnemy, this, DMT_SHARPSTRONG, 10.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.25f);

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < 3.0f) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.5f, 0.0f);

        switch(IRnd()%3)
        {
          case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
          case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
          case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
          default: ASSERTALWAYS("Twitcher unknown melee hit sound");
        }

        InflictDirectDamage(m_penEnemy, this, DMT_SHARPSTRONG, 10.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.25f);

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < 3.0f) {

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.5f, 0.0f);

        switch(IRnd()%3)
        {
          case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
          case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
          case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
          default: ASSERTALWAYS("Twitcher unknown melee hit sound");
        }

        InflictDirectDamage(m_penEnemy, this, DMT_SHARPSTRONG, 10.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.75f);

    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  TwitcherDiseasedSlash(EVoid) {

    switch(IRnd()%3)
    {
      case 0: StartSkaModelAnim(idTwitcherAnim_Melee1,AN_CLEAR,1,0); break;
      case 1: StartSkaModelAnim(idTwitcherAnim_Melee2,AN_CLEAR,1,0); break;
      case 2: StartSkaModelAnim(idTwitcherAnim_Melee3,AN_CLEAR,1,0); break;
      default: ASSERTALWAYS("Diseased Twitcher unknown melee attack");
    }

    m_bFistHit = FALSE;
    autowait(0.35f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        switch(IRnd()%4)
        {
          case 0: PlaySound(m_soSound, SOUND_PUNCH1, SOF_3D); break;
          case 1: PlaySound(m_soSound, SOUND_PUNCH2, SOF_3D); break;
          case 2: PlaySound(m_soSound, SOUND_PUNCH3, SOF_3D); break;
          case 3: PlaySound(m_soSound, SOUND_PUNCH4, SOF_3D); break;
          default: ASSERTALWAYS("Twitcher unknown melee hit sound");
        }

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.25f, 0.0f);

        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 5.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.35f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  TwitcherRestrainedMelee(EVoid) {

    switch(IRnd()%2)
    {
      case 0: StartSkaModelAnim(idTwitcherRestrainedAnim_Melee1,AN_CLEAR,1,0); break;
      case 1: StartSkaModelAnim(idTwitcherRestrainedAnim_Melee2,AN_CLEAR,1,0); break;
      default: ASSERTALWAYS("Restrained Twitcher unknown melee attack");
    }

    m_bFistHit = FALSE;
    autowait(0.375f);
    if (CalcDist(m_penEnemy) < m_fCloseDistance) {
      m_bFistHit = TRUE;
    }

    if (m_bFistHit) {
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        switch(IRnd()%4)
        {
          case 0: PlaySound(m_soSound, SOUND_PUNCH1, SOF_3D); break;
          case 1: PlaySound(m_soSound, SOUND_PUNCH2, SOF_3D); break;
          case 2: PlaySound(m_soSound, SOUND_PUNCH3, SOF_3D); break;
          case 3: PlaySound(m_soSound, SOUND_PUNCH4, SOF_3D); break;
          default: ASSERTALWAYS("Twitcher unknown melee hit sound");
        }

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        FLOAT3D vPosition = m_penEnemy->GetPlacement().pl_PositionVector;
        vPosition + FLOAT3D(0.0f, 1.75f, 0.0f);

        InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 7.0f, vPosition, vDirection, DBPT_GENERIC);
      }
    } else {
      PlaySound(m_soSound, SOUND_SWING, SOF_3D);
    }

    autowait(0.325f);
    MaybeSwitchToAnotherPlayer();

    return EReturn();
  }

  TwitcherNightmareBladedLeap(EVoid) {

    StartSkaModelAnim(idTwitcherAnim_LeapMelee1,AN_CLEAR,1,0);

    // jump
    FLOAT3D vDir = (m_penEnemy->GetPlacement().pl_PositionVector -
                    GetPlacement().pl_PositionVector).Normalize();
    vDir *= !GetRotationMatrix();
    vDir *= m_fCloseRunSpeed*1.5f;
    vDir(2) = 4.25f;
    SetDesiredTranslation(vDir);
    PlaySound(m_soSound, SOUND_SWING, SOF_3D);

    // animation - IGNORE DAMAGE WOUND -
    SpawnReminder(this, 0.75f, 0);
    m_iChargeHitAnimation = idTwitcherAnim_LeapMelee1;
    m_fChargeHitDamage = 25.0f;
    m_fChargeHitAngle = 0.0f;
    m_fChargeHitSpeed = 18.0f;
    autocall ChargeHitEnemy() EReturn;
    autowait(0.75f);
    return EReturn();
  }

  // --------------------------------------------------------------------------------------
  // Call this to jump onto player - set charge properties before calling and spawn a reminder.
  // --------------------------------------------------------------------------------------
  ChargeHitEnemy(EVoid) : CEnemyBase::ChargeHitEnemy
  {
    m_tmChargeHitStarted = _pTimer->CurrentTick(); // Remember startup time.

    // wait for length of hit animation
    // TODO: Make it better!
    wait(ClampUp(GetAnimLength(m_iChargeHitAnimation), m_tmMaxChargeHitLength)) // [SSE] Charge Hit Restriction
    {
      on (EBegin) : { resume; }
      on (ETimer) : { stop; }
      // ignore damages
      on (EDamage) : { resume; }
      // if user-set reminder expired
      on (EReminder) : {
        // stop moving
        StopMoving();
        resume;
      }
      // if you touch some entity
      on (ETouch etouch) :
      {
        // if it is alive and in front
        if ((etouch.penOther->GetFlags()&ENF_ALIVE) && IsInPlaneFrustum(etouch.penOther, CosFast(60.0f))) {
          switch(IRnd()%3)
          {
              case 0: PlaySound(m_soSound, SOUND_SLICE1, SOF_3D); break;
              case 1: PlaySound(m_soSound, SOUND_SLICE2, SOF_3D); break;
              case 2: PlaySound(m_soSound, SOUND_SLICE3, SOF_3D); break;
              default: ASSERTALWAYS("Twitcher unknown melee hit sound");
          }
          // get your direction
          FLOAT3D vSpeed;
          GetHeadingDirection(m_fChargeHitAngle, vSpeed);
          // damage entity in that direction
          InflictDirectDamage(etouch.penOther, this, DMT_SHARPSTRONG, m_fChargeHitDamage, FLOAT3D(0, 1.5f, 0), vSpeed, DBPT_GENERIC);
          // push it away
          vSpeed = vSpeed * m_fChargeHitSpeed;
          KickEntity(etouch.penOther, vSpeed);
          // stop waiting
          stop;
        }
        pass;
      }
    }

    // if the anim is not yet finished
    if (!IsAnimFinished()) 
    {
      FLOAT tmDelta = _pTimer->CurrentTick() - m_tmChargeHitStarted;
  
      // wait the rest of time till the anim end
      wait(tmDelta <= m_tmMaxChargeHitLength ? ClampUp(GetCurrentAnimLength(), m_tmMaxChargeHitLength) - tmDelta : _pTimer->TickQuantum) // [SSE] Charge Hit Restriction
      {
        on (EBegin) : { resume; }
        on (ETimer) : { stop; }
        // if timer expired
        on (EReminder) : {
          // stop moving
          StopMoving();
          resume;
        }
      }
    }

    // return to caller
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
    if(m_twChar == TWC_STRONGBLADEDPALE)
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
    else if(m_twChar == TWC_FEMALE2WHITE)
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
    else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEBLONDE)
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
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4
         || m_twChar == TWC_STRONGBLADEDPALE || m_twChar == TWC_NIGHTMAREBLADED) {
          PlaySound(m_soSound, SOUND_SLICE1, SOF_3D);
        }
        else {
          PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        }
        
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        if(m_twChar == TWC_NIGHTMAREBLADED)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 20.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
        else if(m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4 
           || m_twChar == TWC_NIGHTMARESHADOW || m_twChar == TWC_STRONGBLADEDPALE)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
        else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_FEMALE2WHITE || m_twChar == TWC_STRONGCORPSE)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 10.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
        else
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 5.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
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
    if(m_twChar == TWC_MALE3WHITE || m_twChar == TWC_MALE3BLACK)
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
    else if(m_twChar == TWC_FEMALE2WHITE)
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
    else if(m_twChar == TWC_FEMALEWHITE || m_twChar == TWC_FEMALEBLONDE)
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
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4
         || m_twChar == TWC_STRONGBLADEDPALE || m_twChar == TWC_NIGHTMAREBLADED) {
          PlaySound(m_soSound, SOUND_SLICE1, SOF_3D);
        }
        else {
          PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        }
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        if(m_twChar == TWC_NIGHTMAREBLADED)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 20.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
        else if(m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_STRONGBLADED4 
           || m_twChar == TWC_NIGHTMARESHADOW || m_twChar == TWC_STRONGBLADEDPALE)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
        else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_FEMALE2WHITE || m_twChar == TWC_STRONGCORPSE)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 10.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
        else
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 5.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
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
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADED2) {
          PlaySound(m_soSound, SOUND_SLICE1, SOF_3D);
        }
        else {
          PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        }

        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        if(m_twChar == TWC_STRONGBLADED2)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
        else if(m_twChar == TWC_STRONGPALE || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_FEMALE2WHITE || m_twChar == TWC_STRONGCORPSE)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 10.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
        else
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 5.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
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
    if(m_twChar == TWC_STRONGBLADEDPALE)
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
    else if(m_twChar == TWC_FEMALE2WHITE)
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
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        if(m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_STRONGBLADEDPALE
         || m_twChar == TWC_NIGHTMAREBLADED) {
          PlaySound(m_soSound, SOUND_SLICE1, SOF_3D);
        }
        else {
          PlaySound(m_soSound, SOUND_HIT, SOF_3D);
        }
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();

        if(m_twChar == TWC_NIGHTMAREBLADED)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 25.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
        else if(m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_STRONGBLADEDPALE)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 20.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
        else if(m_twChar == TWC_STRONGBLADED)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 15.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
        else
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 10.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
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
    if (m_twChar == TWC_STRONGBLADED3)
    {
      StartModelAnim(TWITCHERBLADED3_ANIM_MELEE4, 0);
    }
    else if(m_twChar == TWC_STRONGBLADED2)
    {
      StartModelAnim(TWITCHERBLADED2_ANIM_MELEE1, 0);
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
      if (CalcDist(m_penEnemy) < m_fCloseDistance) {
        PlaySound(m_soSound, SOUND_SLICE1, SOF_3D);
        FLOAT3D vDirection = m_penEnemy->GetPlacement().pl_PositionVector-GetPlacement().pl_PositionVector;
        vDirection.Normalize();
        if(m_twChar == TWC_NIGHTMAREBLADED)
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 25.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
        }
        else
        {
          InflictDirectDamage(m_penEnemy, this, DMT_CLOSERANGE, 20.0f, m_penEnemy->GetPlacement().pl_PositionVector, vDirection, DBPT_GENERIC);
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

  // --------------------------------------------------------------------------------------
  // Play wounding animation.
  // --------------------------------------------------------------------------------------
  BeWounded(EDamage eDamage)
  { 
    m_bIsBlocking = FALSE;
    m_bBlockFirearms = FALSE;
    StopMoving();
    // determine damage anim and play the wounding
    autowait(GetAnimLength(AnimForDamage(eDamage.fAmount, eDamage.dbptType)));
    return EReturn();
  };


  Sleep(EVoid)
  {
    if(m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3) {
      StartModelAnim(TWITCHERSKINNED_ANIM_COWER, AOF_LOOPING);
      ChangeCollisionBoxIndexWhenPossible(TWITCHERSKINNED_COLLISION_BOX_COWER);
    } else if ( m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN
             || m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3
             || m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 ) {
      StartSkaModelAnim(idTwitcherAnim_Cower,AN_LOOPING|AN_NORESTART|AN_CLEAR,1,0);
      INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idTwitcherBox_Cower);
      ASSERT(iBoxIndex>=0);
      ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      SetSkaColisionInfo();
    }

    // start watching
    GetWatcher()->SendEvent(EStart());
    
    // repeat
    wait() {
      // if triggered
      on(ETrigger eTrigger) : {
        // remember enemy
        SetTargetSoft(eTrigger.penCaused);
        // wake up
        jump WakeUp();
      }
      on(ETouch eTouch) : {
        if(IsDerivedFromClass(eTouch.penOther, "Enemy Base") || IsOfClass(eTouch.penOther, "Player")) {
          jump WakeUp();
        }
      }
      on(ESound eSound) : {
        // if deaf then ignore the sound
        if (m_bDeaf) {
          resume;
        }

        // if the target is visible and can be set as new enemy
        if (SetTargetSoft(eSound.penTarget)) {
          // react to it
          jump WakeUp();
        }
      }
      // if damaged
      on(EDamage eDamage) : {
        // wake up
        jump WakeUp();
      }
      otherwise() : {
        resume;
      }
    }
  }

  WakeUp(EVoid)
  {
    SetTargetHardForce(m_penEnemy);

    // wakeup anim
    SightSound();

    if(m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3) {
      ChangeCollisionBoxIndexWhenPossible(TWITCHERSKINNED_COLLISION_BOX_DEFAULT);

      StartModelAnim(TWITCHERSKINNED_ANIM_COWERSTOP, 0);
      autowait(GetModelObject()->GetCurrentAnimLength());
    } else if ( m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN
             || m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3
             || m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 ) {
      INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idTwitcherBox_Stand);
      ASSERT(iBoxIndex>=0);
      ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
      SetSkaColisionInfo();

      StartSkaModelAnim(idTwitcherAnim_CowerStop,AN_CLEAR,1,0);
      autowait(GetAnimLength(idTwitcherAnim_CowerStop));
    }

    // proceed with normal functioning
    return EReturn();
  }


  // overridable called before main enemy loop actually begins
  PreMainLoop(EVoid) : CEnemyBase::PreMainLoop
  {
    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3
    || m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN
    || m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3
    || m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 || m_twChar == TWC_NIGHTMAREBLADEDELITE) {
      m_iRunAnim = IRnd()%2;
      m_iStandAnim = IRnd()%2;
    } else {
      m_iRunAnim = IRnd()%3;
      m_iStandAnim = IRnd()%2;
    }

    if(m_twChar == TWC_NIGHTMAREBLADEDELITE) {
      m_soVoice.Set3DParameters(80.0f, 5.0f, 1.0f, 0.75f);
    }

    if(m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3
    || m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN
    || m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3
    || m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 ) {
      // if sleeping
      if (m_bStartHidden) {
        m_bStartHidden = FALSE;
        // go to sleep until waken up
        wait() {
          on (EBegin) : {
            call Sleep();
          }
          on (EReturn) : {
            stop;
          };
          // if damaged
          on(EDamage eDamage) : {
            // wake up
            jump CEnemyBase::Active();
          }
          // if dead
          on(EDeath eDeath) : {
            // die
            jump CEnemyBase::Die(eDeath);
          }
        }
      }
    }

    return EReturn();
  }


  // rage Nightmare Twitcher action
  SpecialAction1(EVoid) : CEnemyBase::SpecialAction1 {
    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 ||
       m_twChar == TWC_NIGHTMAREBLADED3 || m_twChar == TWC_NIGHTMAREBLADEDELITE) {
      StopMoving();
      StartSkaModelAnim(idTwitcherAnim_Rage1,AN_CLEAR,1,0);
      autowait(0.375f);
      switch(IRnd()%2)
      {
        case 0: PlaySound(m_soVoice, SOUND_NIGHTMARE_RAGE1, SOF_3D); break;
        case 1: PlaySound(m_soVoice, SOUND_NIGHTMARE_RAGE2, SOF_3D); break;
        default: ASSERTALWAYS("Twitcher unknown rage sound");
      }
      autowait(1.25f);
    }

    return EReturn();
  };


/************************************************************
 *                       M  A  I  N                         *
 ************************************************************/
  Main(EVoid) {
    // declare yourself as a model
    if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3
       || m_twChar == TWC_DISEASED || m_twChar == TWC_DISEASEDBLOODY || m_twChar == TWC_DISEASEDFORSAKEN
       || m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3
       || m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 || m_twChar == TWC_NIGHTMAREBLADEDELITE
       || m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY) {
      InitAsSkaModel();
    } else {
      InitAsModel();
    }

    if (m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY) {
      SetPhysicsFlags(EPF_MODEL_FIXED|EPF_HASLUNGS);
    } else {
      SetPhysicsFlags(EPF_MODEL_WALKING|EPF_HASLUNGS);
    }
    SetCollisionFlags(ECF_MODEL);
    SetFlags(GetFlags()|ENF_ALIVE);
    m_ftFactionType = FT_TWITCHER;
    SetHealth(60.0f);
    m_fMaxHealth = 60.0f;
    m_fDamageWounded = 25.0f;
    m_iScore = 500;
    en_tmMaxHoldBreath = 30.0f;
    en_fDensity = 1000.0f;
    m_fBlowUpSize = 2.0f;

    // set your appearance and texture
    switch(m_twChar)
    {
      case TWC_BALDWHITE:
      {
        SetModel(MODEL_TWITCHERBALD);
        SetModelMainTexture(TEXTURE_TWITCHERBALD_WHITE);
        GetModelObject()->StretchModel(FLOAT3D(1.175f, 1.175f, 1.175f));
        ModelChangeNotify();
      } break;
      case TWC_BALDBLACK:
      {
        SetModel(MODEL_TWITCHERBALD);
        SetModelMainTexture(TEXTURE_TWITCHERBALD_BLACK);
        GetModelObject()->StretchModel(FLOAT3D(1.175f, 1.175f, 1.175f));
        ModelChangeNotify();
      } break;
      case TWC_FEMALEWHITE:
      {
        SetModel(MODEL_TWITCHERFEMALE);
        SetModelMainTexture(TEXTURE_TWITCHERFEMALE_WHITE);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_FEMALEBLONDE:
      {
        SetModel(MODEL_TWITCHERFEMALE);
        SetModelMainTexture(TEXTURE_TWITCHERFEMALE_BLONDE);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_MALEWHITE:
      {
        SetModel(MODEL_TWITCHERMALE);
        SetModelMainTexture(TEXTURE_TWITCHERMALE_WHITE);
        GetModelObject()->StretchModel(FLOAT3D(1.175f, 1.175f, 1.175f));
        ModelChangeNotify();
      } break;
      case TWC_MALEBLACK:
      {
        SetModel(MODEL_TWITCHERMALE);
        SetModelMainTexture(TEXTURE_TWITCHERMALE_BLACK);
        GetModelObject()->StretchModel(FLOAT3D(1.175f, 1.175f, 1.175f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGPALE:
      {
        SetHealth(100.0f);
        m_fMaxHealth = 100.0f;
        m_fDamageWounded = 60.0f;
        m_iScore = 1000;
        SetModel(MODEL_TWITCHERSTRONG);
        SetModelMainTexture(TEXTURE_TWITCHERSTRONG_PALE);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGBLADED:
      {
        SetHealth(130.0f);
        m_fMaxHealth = 130.0f;
        m_fDamageWounded = 70.0f;
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
        GetModelObject()->StretchModel(FLOAT3D(1.175f, 1.175f, 1.175f));
        ModelChangeNotify();
      } break;
      case TWC_MALE2BLACK:
      {
        SetModel(MODEL_TWITCHERMALE2);
        SetModelMainTexture(TEXTURE_TWITCHERMALE2_BLACK);
        GetModelObject()->StretchModel(FLOAT3D(1.175f, 1.175f, 1.175f));
        ModelChangeNotify();
      } break;
      case TWC_FEMALE2WHITE:
      {
        SetModel(MODEL_TWITCHERFEMALE2);
        SetModelMainTexture(TEXTURE_TWITCHERFEMALE2_WHITE);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGCORPSE:
      {
        SetHealth(90.0f);
        m_fMaxHealth = 90.0f;
        m_fDamageWounded = 60.0f;
        m_iScore = 2000;
        SetModel(MODEL_TWITCHERSTRONG);
        SetModelMainTexture(TEXTURE_TWITCHERSTRONG_CORPSE);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGNIGHTMARE:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 90.0f;
        m_iScore = 5000;
        SetModel(MODEL_TWITCHERSTRONG);
        SetModelMainTexture(TEXTURE_TWITCHERSTRONG_NIGHTMARE);
        GetModelObject()->StretchModel(FLOAT3D(1.375f, 1.375f, 1.375f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGBLADED2:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 110.0f;
        m_iScore = 5000;
        SetModel(MODEL_TWITCHERBLADED2);
        SetModelMainTexture(TEXTURE_TWITCHERBLADED2);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGBLADED3:
      {
        SetHealth(175.0f);
        m_fMaxHealth = 175.0f;
        m_fDamageWounded = 115.0f;
        m_iScore = 7500;
        SetModel(MODEL_TWITCHERBLADED3);
        SetModelMainTexture(TEXTURE_TWITCHERBLADED3);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_SKINNEDBLADED:
      {
        SetHealth(110.0f);
        m_fMaxHealth = 110.0f;
        m_fDamageWounded = 70.0f;
        m_iScore = 5000;
        SetModel(MODEL_TWITCHERSKINNED);
        SetModelMainTexture(TEXTURE_TWITCHERSKINNED);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGBLADED4:
      {
        SetHealth(200.0f);
        m_fMaxHealth = 200.0f;
        m_fDamageWounded = 110.0f;
        m_iScore = 10000;
        SetModel(MODEL_TWITCHERBLADED4);
        SetModelMainTexture(TEXTURE_TWITCHERBLADED4);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_NIGHTMARESHADOW:
      {
        SetHealth(175.0f);
        m_fMaxHealth = 175.0f;
        m_fDamageWounded = 70.0f;
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
        SetHealth(200.0f);
        m_fMaxHealth = 200.0f;
        m_fDamageWounded = 130.0f;
        m_iScore = 15000;
        SetModel(MODEL_TWITCHERBLADEDPALE);
        SetModelMainTexture(TEXTURE_TWITCHERBLADEDPALE);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_NIGHTMAREBLADED:
      {
        SetHealth(300.0f);
        m_fMaxHealth = 300.0f;
        m_fDamageWounded = 160.0f;
        m_ftFactionType = FT_LESSER;
        m_iScore = 20000;
        en_fDensity = 1500.0f;
        SetSkaModel(MODEL_TWITCHERBLADEDNIGHTMARE);
        GetModelInstance()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGBLADEDNIGHTMARE:
      {
        SetHealth(200.0f);
        m_fMaxHealth = 200.0f;
        m_fDamageWounded = 90.0f;
        m_iScore = 7500;
        SetModel(MODEL_TWITCHERBLADED);
        SetModelMainTexture(TEXTURE_TWITCHERBLADED_NIGHTMARE);
        GetModelObject()->StretchModel(FLOAT3D(1.375f, 1.375f, 1.375f));
        ModelChangeNotify();
      } break;
      case TWC_FEMALEPALE:
      {
        SetModel(MODEL_TWITCHERFEMALE);
        SetModelMainTexture(TEXTURE_TWITCHERFEMALE_PALE);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_SKINNEDBLADED2:
      {
        SetHealth(110.0f);
        m_fMaxHealth = 110.0f;
        m_fDamageWounded = 70.0f;
        m_iScore = 5000;
        SetModel(MODEL_TWITCHERSKINNED);
        SetModelMainTexture(TEXTURE_TWITCHERSKINNED2);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_SKINNEDBLADED3:
      {
        SetHealth(110.0f);
        m_fMaxHealth = 110.0f;
        m_fDamageWounded = 70.0f;
        m_iScore = 5000;
        SetModel(MODEL_TWITCHERSKINNED);
        SetModelMainTexture(TEXTURE_TWITCHERSKINNED3);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_NIGHTMAREBLADED2:
      {
        SetHealth(300.0f);
        m_fMaxHealth = 300.0f;
        m_fDamageWounded = 160.0f;
        m_ftFactionType = FT_LESSER;
        m_iScore = 20000;
        en_fDensity = 1500.0f;
        SetSkaModel(MODEL_TWITCHERBLADEDNIGHTMARE2);
        GetModelInstance()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_NIGHTMAREBLADED3:
      {
        SetHealth(300.0f);
        m_fMaxHealth = 300.0f;
        m_fDamageWounded = 160.0f;
        m_ftFactionType = FT_LESSER;
        m_iScore = 20000;
        en_fDensity = 1500.0f;
        SetSkaModel(MODEL_TWITCHERBLADEDNIGHTMARE3);
        GetModelInstance()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_STRONGBLOODY:
      {
        SetHealth(100.0f);
        m_fMaxHealth = 100.0f;
        m_fDamageWounded = 30.0f;
        m_iScore = 1000;
        SetModel(MODEL_TWITCHERSTRONG);
        SetModelMainTexture(TEXTURE_TWITCHERSTRONG_BLOODY);
        GetModelObject()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_FEMALE2PALE:
      {
        SetModel(MODEL_TWITCHERFEMALE2);
        SetModelMainTexture(TEXTURE_TWITCHERFEMALE2_PALE);
        GetModelObject()->StretchModel(FLOAT3D(1.125f, 1.125f, 1.125f));
        ModelChangeNotify();
      } break;
      case TWC_DISEASED:
      {
        SetHealth(125.0f);
        m_fMaxHealth = 125.0f;
        m_fDamageWounded = 55.0f;
        m_iScore = 1000;
        SetSkaModel(MODEL_TWITCHERDISEASED);
        GetModelInstance()->StretchModel(FLOAT3D(1.15f, 1.15f, 1.15f));
        ModelChangeNotify();
      } break;
      case TWC_DISEASEDBLOODY:
      {
        SetHealth(125.0f);
        m_fMaxHealth = 125.0f;
        m_fDamageWounded = 55.0f;
        m_iScore = 1000;
        SetSkaModel(MODEL_TWITCHERDISEASEDBLOODY);
        GetModelInstance()->StretchModel(FLOAT3D(1.15f, 1.15f, 1.15f));
        ModelChangeNotify();
      } break;
      case TWC_DISEASEDFORSAKEN:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 70.0f;
        m_iScore = 2000;
        SetSkaModel(MODEL_TWITCHERDISEASEDFORSAKEN);
        GetModelInstance()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_DISEASEDFORSAKEN2:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 70.0f;
        m_iScore = 2000;
        SetSkaModel(MODEL_TWITCHERDISEASEDFORSAKEN2);
        GetModelInstance()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_DISEASEDFORSAKEN3:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 70.0f;
        m_iScore = 2000;
        SetSkaModel(MODEL_TWITCHERDISEASEDFORSAKEN3);
        GetModelInstance()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_DISEASEDFORSAKEN4:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 70.0f;
        m_iScore = 2000;
        SetSkaModel(MODEL_TWITCHERDISEASEDFORSAKEN4);
        GetModelInstance()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_DISEASEDFORSAKEN5:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 70.0f;
        m_iScore = 2000;
        SetSkaModel(MODEL_TWITCHERDISEASEDFORSAKEN5);
        GetModelInstance()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_NIGHTMAREBLADEDELITE:
      {
        SetHealth(400.0f);
        m_fMaxHealth = 400.0f;
        m_fDamageWounded = 190.0f;
        m_ftFactionType = FT_LESSER;
        m_iScore = 30000;
        en_fDensity = 1500.0f;
        SetSkaModel(MODEL_TWITCHERBLADEDNIGHTMAREELITE);
        GetModelInstance()->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
        ModelChangeNotify();
      } break;
      case TWC_DISEASEDRESTRAINED:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 60.0f;
        m_iScore = 2500;
        en_fDensity = 1500.0f;
        SetSkaModel(MODEL_RESTRAINEDTWITCHER);
        GetModelInstance()->StretchModel(FLOAT3D(1.15f, 1.15f, 1.15f));
        ModelChangeNotify();
        m_bRestrained = TRUE;

        INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idTwitcherRestrainedBox_Default);
        ASSERT(iBoxIndex>=0);
        ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
        SetSkaColisionInfo();
      } break;
      case TWC_DISEASEDRESTRAINEDBLOODY:
      {
        SetHealth(150.0f);
        m_fMaxHealth = 150.0f;
        m_fDamageWounded = 60.0f;
        m_iScore = 2500;
        en_fDensity = 1500.0f;
        SetSkaModel(MODEL_RESTRAINEDTWITCHERBLOODY);
        GetModelInstance()->StretchModel(FLOAT3D(1.15f, 1.15f, 1.15f));
        ModelChangeNotify();
        m_bRestrained = TRUE;

        INDEX iBoxIndex = GetModelInstance()->GetColisionBoxIndex(idTwitcherRestrainedBox_Default);
        ASSERT(iBoxIndex>=0);
        ChangeCollisionBoxIndexWhenPossible(iBoxIndex);
        SetSkaColisionInfo();
      } break;
    }

        // setup moving speed
        if((m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3) && m_twSpeed == TSPT_FAST)
        {
          m_fWalkSpeed = FRnd() + 4.5f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*40.0f + 650.0f);
          m_fAttackRunSpeed = FRnd() + 8.0f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*65 + 325.0f);
          m_fCloseRunSpeed = FRnd() + 8.0f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*65 + 325.0f);
        }
        else if((m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3) && m_twSpeed != TSPT_FAST)
        {
          m_fWalkSpeed = FRnd() + 4.0f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*30.0f + 600.0f);
          m_fAttackRunSpeed = FRnd() + 7.0f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*60 + 300.0f);
          m_fCloseRunSpeed = FRnd() + 7.0f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*60 + 300.0f);
        }
        else if(m_twSpeed == TSPT_FAST || m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3 || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_STRONGBLADEDPALE
                || m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 || m_twChar == TWC_NIGHTMAREBLADEDELITE)
        {
          m_fWalkSpeed = FRnd() + 3.0f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*20.0f + 525.0f);
          m_fAttackRunSpeed = FRnd() + 6.0f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*60 + 275.0f);
          m_fCloseRunSpeed = FRnd() + 6.0f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*60 + 275.0f);
        }
        else if (m_twSpeed == TSPT_SLOW && (m_twChar == TWC_DISEASEDFORSAKEN || m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3
                 || m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 ))
        {
          m_fWalkSpeed = FRnd() + 1.0f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*8.0f + 450.0f);
          m_fAttackRunSpeed = FRnd() + 3.0f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*35 + 240.0f);
          m_fCloseRunSpeed = FRnd() + 3.0f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*35 + 240.0f);
        }
        else if (m_twSpeed == TSPT_NORMAL && (m_twChar == TWC_DISEASEDFORSAKEN || m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3
                 || m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 ))
        {
          m_fWalkSpeed = FRnd() + 1.5f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 450.0f);
          m_fAttackRunSpeed = FRnd() + 3.5f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*45 + 240.0f);
          m_fCloseRunSpeed = FRnd() + 3.5f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*45 + 240.0f);
        }
        else if (m_twSpeed == TSPT_FAST && (m_twChar == TWC_DISEASEDFORSAKEN || m_twChar == TWC_DISEASEDFORSAKEN2 || m_twChar == TWC_DISEASEDFORSAKEN3
                 || m_twChar == TWC_DISEASEDFORSAKEN4 || m_twChar == TWC_DISEASEDFORSAKEN5 ))
        {
          m_fWalkSpeed = FRnd() + 3.75f;
          m_aWalkRotateSpeed = AngleDeg(FRnd()*10.0f + 480.0f);
          m_fAttackRunSpeed = FRnd() + 6.75f;
          m_aAttackRotateSpeed = AngleDeg(FRnd()*55 + 275.0f);
          m_fCloseRunSpeed = FRnd() + 6.75f;
          m_aCloseRotateSpeed = AngleDeg(FRnd()*55 + 275.0f);
        }
        else if (m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY)
        {
          m_fWalkSpeed = 0.0f;
          m_aWalkRotateSpeed = AngleDeg(0.0f);
          m_fAttackRunSpeed = 0.0f;
          m_aAttackRotateSpeed = AngleDeg(0.0f);
          m_fCloseRunSpeed = 0.0f;
          m_aCloseRotateSpeed = AngleDeg(0.0f);
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
        if(m_twChar == TWC_NIGHTMAREBLADED || m_twChar == TWC_NIGHTMAREBLADED2 || m_twChar == TWC_NIGHTMAREBLADED3 || m_twChar == TWC_NIGHTMAREBLADEDELITE) {
          m_fCloseDistance = 15.0f;
        } else if(m_twChar == TWC_SKINNEDBLADED || m_twChar == TWC_SKINNEDBLADED2 || m_twChar == TWC_SKINNEDBLADED3
               || m_twChar == TWC_STRONGBLADED || m_twChar == TWC_STRONGBLADED2 || m_twChar == TWC_STRONGBLADED3
               || m_twChar == TWC_STRONGBLADED4 || m_twChar == TWC_STRONGBLADEDPALE || m_twChar == TWC_STRONGBLADEDNIGHTMARE) {
          m_fCloseDistance = 3.0f;
        } else if (m_twChar == TWC_DISEASEDRESTRAINED || m_twChar == TWC_DISEASEDRESTRAINEDBLOODY) {
          m_fCloseDistance = 2.25f;
        } else {
          m_fCloseDistance = 2.75f;
        }
        m_fStopDistance = 1.5f;
        m_fAttackFireTime = 0.5f;
        m_fCloseFireTime = 1.4f;
        m_fIgnoreRange = 200.0f;
        // damage/explode properties
        m_fBlowUpAmount = 100.0f;
        m_fBodyParts = 4;

    StandingAnim();

    // continue behavior in base class
    jump CEnemyBase::MainLoop();
  };
};