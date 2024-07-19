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

1045
%{
#include "StdH.h"
#include "EntitiesMP/WorldSettingsController.h"
#include "Models/Items/ItemHolder/ItemHolder.h"
#include "Models/Items/Ammo/PistolClip/PistolClip.h"
#include "Models/Items/Ammo/SMGClip/SMGAmmo.h"
#include "Models/Items/Ammo/ShotgunShells/ShotgunAmmo.h"
#include "Models/Items/Ammo/StrongPistolClip/StrongPistolClip.h"
#include "Models/Items/Inventory/Painkillers/Painkillers.h"
%}

uses "EntitiesMP/AnimationChanger";
uses "EntitiesMP/ModelHolder2";
uses "EntitiesMP/BloodUni";
uses "EntitiesMP/Debris";
uses "EntitiesMP/AmmoItem";
uses "EntitiesMP/InventoryItem";
uses "EntitiesMP/UZSkaModelHolder";
uses "EntitiesMP/ExplosiveBarrel";
uses "EntitiesMP/BasicEffects";


enum PushableModelWeightType {
  0 PMWT_SMALL     "Small",
  1 PMWT_MEDIUM    "Medium",
  2 PMWT_BIG       "Big",
  3 PMWT_HUGE      "Huge",
};

enum PushableModelMaterialType {
  0 PMMT_WOOD       "Wood",
  1 PMMT_METAL      "Metal",
  2 PMMT_STONE      "Stone",
  3 PMMT_GLASS      "Glass",
  4 PMMT_CONCRETE   "Concrete",
  5 PMMT_LEAVES     "Leaves",
  6 PMMT_FLESH      "Flesh",
  7 PMMT_WOODGLASS  "Wood and Glass",
};

enum PushableModelItemType {
  0 PMIT_NONE       "None",
  1 PMIT_AMMO       "Ammo",
  2 PMIT_INVENTORY  "Inventory Item",
};

enum PushableModelReflectionType {
  0 PMRT_NONE          "None",
  1 PMRT_ONLYINMIRRORS "Only In Mirrors",
  2 PMRT_NOTINMIRRORS  "Not In Mirrors",
};

enum PushableModelDeathType {
  0 PMDT_NONE       "None",
  1 PMDT_EXPLODE    "Explode",
};

enum PushableModelDebrisTextureType {
  0 PMDTT_WHITEGLASS "White Glass",
  1 PMDTT_TEALGLASS  "Teal Glass",
};


%{
#define MIPRATIO 0.003125f //(2*tan(90/2))/640
%}


class CUZModelHolder : CMovableModelEntity {
name      "UZModelHolder";
thumbnail "Thumbnails\\UZModelHolder.tbn";
features "HasName", "HasDescription";
properties:
  1 CTFileName m_fnModel      "Model" 'M' =CTFILENAME("Models\\Editor\\Axis.mdl"),
  2 CTFileName m_fnTexture    "Texture" 'T' =CTFILENAME("Models\\Editor\\Vector.tex"),
 22 CTFileName m_fnReflection "Reflection" =CTString(""),
 23 CTFileName m_fnSpecular   "Specular" =CTString(""),
 24 CTFileName m_fnBump       "Bump" =CTString(""),
  3 FLOAT m_fStretchAll       "StretchAll" 'S' = 1.0f,
  4 FLOAT m_fStretchX         "StretchX"   'X' = 1.0f,
  5 FLOAT m_fStretchY         "StretchY"   'Y' = 1.0f,
  6 FLOAT m_fStretchZ         "StretchZ"   'Z' = 1.0f,
  7 CTString m_strName        "Name" 'N' ="",
 12 CTString m_strDescription = "",
  8 BOOL m_bColliding       "Colliding" 'L' = FALSE,    // set if model is not immatierial
  9 ANIMATION m_iModelAnimation   "Model animation" = 0,
 10 ANIMATION m_iTextureAnimation "Texture animation" = 0,

 11 enum ShadowType m_stClusterShadows "Shadows" 'W' = ST_CLUSTER,   // set if model uses cluster shadows
 13 BOOL m_bBackground     "Background" 'B' = FALSE,   // set if model is rendered in background
 21 BOOL m_bTargetable     "Targetable" = FALSE, // st if model should be targetable

 // parameters for custom shading of a model (overrides automatic shading calculation)
 14 enum CustomShadingType m_cstCustomShading "Custom shading" 'H' = CST_NONE,
 15 ANGLE3D m_aShadingDirection "Light direction" 'D' = ANGLE3D( AngleDeg(45.0f),AngleDeg(45.0f),AngleDeg(45.0f)),
 16 COLOR m_colLight            "Light color" 'O' = C_WHITE,
 17 COLOR m_colAmbient          "Ambient color" 'A' = C_BLACK,
 18 CTFileName m_fnmLightAnimation "Light animation file" = CTString(""),
 19 ANIMATION m_iLightAnimation "Light animation" = 0,
 20 CAnimObject m_aoLightAnimation,
 25 BOOL m_bAttachments      "Attachments" = TRUE, // set if model should auto load attachments
 26 BOOL m_bActive "Active" = TRUE,

 30 INDEX m_iCollisionBox "Collision box" = 0,
 31 BOOL m_bPushable "Pushable" = FALSE,
 32 enum PushableModelWeightType m_pmwType "Weight type" = PMWT_SMALL,   // weight type for pulling
 33 FLOAT m_fClassificationStretch  "Classification stretch" = 1.0f, // classification box multiplier
 34 FLOAT m_fMipAdd "Mip Add" = 0.0f,
 35 FLOAT m_fMipMul "Mip Mul" = 1.0f,
 36 FLOAT m_fMipFadeDist = 0.0f,
 37 FLOAT m_fMipFadeLen  = 0.0f,
 38 RANGE m_rMipFadeDistMetric "Mip Fade Dist (Metric)" = -1.0f,
 39 FLOAT m_fMipFadeLenMetric  "Mip Fade Len (Metric)" = -1.0f,

 40 BOOL m_bDestroyable "Destroyable" = FALSE,
 41 FLOAT m_fHealth "Model Health" = 10.0f,
 42 CSoundObject m_soSound,        // sound channel
 43 enum PushableModelMaterialType m_pmmType "Material type" = PMMT_METAL,   // material type for resistances and debris
 44 INDEX m_ctDebrises          "Debris count" = 12,
 45 FLOAT m_fCandyEffect        "Debris blow power" = 0.0f,
 46 FLOAT m_fCubeFactor         "Cube factor" = 1.0f,
 47 COLOR m_colDebrises         "Color of debrises" = C_WHITE,

 48 enum AmmoItemType m_EaitType "Ammo Type" = AIT_BULLETS,
 49 FLOAT m_fCustomAmmoValue "Ammo Value Override" = 0.0f,
 50 enum InventoryItemType m_iitType "Inventory Item Type" = IIT_PAINKILLERS,
 51 enum PushableModelItemType m_pmitType "Drop Item Type" = PMIT_NONE,
 52 enum PushableModelReflectionType m_pmrtReflectionType "Reflection Type" = PMRT_NONE,   // set if model uses rendering effects
 53 FLOAT m_fItemSpawnX "Item Spawn X" = 0.0f,
 54 FLOAT m_fItemSpawnY "Item Spawn Y" = 1.0f,
 55 FLOAT m_fItemSpawnZ "Item Spawn Z" = 0.0f,
 56 CTFileName m_fnmConfig "Model Config" = CTString(""),
 57 enum PushableModelDeathType m_pmdType "Death type" = PMDT_NONE,    // whether to break, explode, or be gibbed
 58 FLOAT m_fExplosionDamage  "Explosion Damage"  = 100.0f,
 59 FLOAT m_fExplosionFalloff "Explosion Falloff" = 8.0f,
 60 FLOAT m_fExplosionHotSpot "Explosion Hotspot" = 4.0f,
 61 FLOAT m_fExplosionHeight  "Explosion Height"  = 1.0f,

 62 COLOR m_colBurning = COLOR(C_WHITE|CT_OPAQUE), // color applied when burning
 63 enum PushableModelDebrisTextureType m_pmdtType "Debris type" = PMDTT_WHITEGLASS,   // debris type

{
  CTFileName m_fnOldModel;  // used for remembering last selected model (not saved at all)
}

components:
  1 class   CLASS_AMMO            "Classes\\AmmoItem.ecl",
  2 class   CLASS_INVENTORY_ITEM  "Classes\\InventoryItem.ecl",
  3 class   CLASS_BASIC_EFFECT    "Classes\\BasicEffect.ecl",

 // ************** DEBRIS PARTS **************
 50 model     MODEL_WOOD         "Models\\Effects\\Debris\\WoodDebris.mdl",
 51 model     MODEL_METAL        "Models\\Effects\\Debris\\MetalDebris.mdl",
 52 texture   TEXTURE_WOOD       "Models\\Effects\\Debris\\WoodDebris5.tex",
 53 texture   TEXTURE_METAL      "Models\\Effects\\Debris\\MetalDebris5.tex",
 54 model     MODEL_GLASS        "Models\\Effects\\Debris\\GlassDebris.mdl",
 55 model     MODEL_STONE        "Models\\Effects\\Debris\\StoneDebris.mdl",
 56 texture   TEXTURE_GLASS      "Models\\Effects\\Debris\\GlassDebris.tex",
 57 texture   TEXTURE_STONE      "Models\\Effects\\Debris\\CreteDebris.tex",
 58 model     MODEL_FLESH        "Models\\Effects\\Debris\\FleshDebris.mdl",
 59 texture   TEXTURE_FLESH_RED  "Models\\Effects\\Debris\\FleshDebrisRed.tex",
 60 texture   TEXTURE_GLASS2     "Models\\Effects\\Debris\\GlassDebris2.tex",

 // ********** BULLET RICOCHETS **********
 100 sound   SOUND_METAL_BULLET1    "Sounds\\Materials\\Metal\\BulletMetal1.wav",
 101 sound   SOUND_METAL_BULLET2    "Sounds\\Materials\\Metal\\BulletMetal2.wav",
 102 sound   SOUND_METAL_BULLET3    "Sounds\\Materials\\Metal\\BulletMetal3.wav",
 103 sound   SOUND_METAL_BULLET4    "Sounds\\Materials\\Metal\\BulletMetal4.wav",
 104 sound   SOUND_METAL_BULLET5    "Sounds\\Materials\\Metal\\BulletMetal5.wav",

 105 sound   SOUND_WOOD_BULLET1     "Sounds\\Materials\\Wood\\BulletWood1.wav",
 106 sound   SOUND_WOOD_BULLET2     "Sounds\\Materials\\Wood\\BulletWood2.wav",
 107 sound   SOUND_WOOD_BULLET3     "Sounds\\Materials\\Wood\\BulletWood3.wav",
 108 sound   SOUND_WOOD_BULLET4     "Sounds\\Materials\\Wood\\BulletWood4.wav",
 109 sound   SOUND_WOOD_BULLET5     "Sounds\\Materials\\Wood\\BulletWood5.wav",

 110 sound   SOUND_GLASS_BULLET1    "Sounds\\Materials\\Glass\\BulletGlass1.wav",
 111 sound   SOUND_GLASS_BULLET2    "Sounds\\Materials\\Glass\\BulletGlass2.wav",
 112 sound   SOUND_GLASS_BULLET3    "Sounds\\Materials\\Glass\\BulletGlass3.wav",
 113 sound   SOUND_GLASS_BULLET4    "Sounds\\Materials\\Glass\\BulletGlass4.wav",
 114 sound   SOUND_GLASS_BULLET5    "Sounds\\Materials\\Glass\\BulletGlass5.wav",

 115 sound   SOUND_CONCRETE_BULLET1    "Sounds\\Materials\\Concrete\\BulletConcrete1.wav",
 116 sound   SOUND_CONCRETE_BULLET2    "Sounds\\Materials\\Concrete\\BulletConcrete2.wav",
 117 sound   SOUND_CONCRETE_BULLET3    "Sounds\\Materials\\Concrete\\BulletConcrete3.wav",
 118 sound   SOUND_CONCRETE_BULLET4    "Sounds\\Materials\\Concrete\\BulletConcrete4.wav",

 119 sound   SOUND_DIRT_BULLET1    "Sounds\\Materials\\Dirt\\BulletDirt1.wav",
 120 sound   SOUND_DIRT_BULLET2    "Sounds\\Materials\\Dirt\\BulletDirt2.wav",
 121 sound   SOUND_DIRT_BULLET3    "Sounds\\Materials\\Dirt\\BulletDirt3.wav",
 122 sound   SOUND_DIRT_BULLET4    "Sounds\\Materials\\Dirt\\BulletDirt4.wav",

  // ********** DESTROYED SOUNDS **********
 150 sound   SOUND_METAL_DESTROY1     "Sounds\\Breakables\\MetalBreak3.wav",
 151 sound   SOUND_METAL_DESTROY2     "Sounds\\Breakables\\MetalBreak4.wav",
 152 sound   SOUND_WOOD_DESTROY1      "Sounds\\Breakables\\WoodBreak2.wav",
 153 sound   SOUND_WOOD_DESTROY2      "Sounds\\Breakables\\WoodBreak3.wav",
 154 sound   SOUND_GLASS_DESTROY1     "Sounds\\Breakables\\GlassBreak1.wav",
 155 sound   SOUND_GLASS_DESTROY2     "Sounds\\Breakables\\GlassBreak2.wav",
 156 sound   SOUND_CONCRETE_DESTROY1  "Sounds\\Breakables\\ConcreteBreak1.wav",
 157 sound   SOUND_METAL_DESTROY3     "Sounds\\Breakables\\MetalBreak5.wav",
 158 sound   SOUND_METAL_DESTROY4     "Sounds\\Breakables\\MetalBreak6.wav",
 159 sound   SOUND_METAL_DESTROY5     "Sounds\\Breakables\\MetalBreak7.wav",
 160 sound   SOUND_GLASS_DESTROY3     "Sounds\\Breakables\\GlassPaneBreak1.wav",
 161 sound   SOUND_GLASS_DESTROY4     "Sounds\\Breakables\\GlassPaneBreak2.wav",
 162 sound   SOUND_CONCRETE_DESTROY2  "Sounds\\Breakables\\ConcreteBreak2.wav",
 163 sound   SOUND_CONCRETE_DESTROY3  "Sounds\\Breakables\\ConcreteBreak3.wav",
 164 sound   SOUND_WOOD_DESTROY3      "Sounds\\Breakables\\WoodBreak1.wav",
 165 sound   SOUND_FLESH_DESTROY1     "Sounds\\GoreBlood\\GoreBlowUp.wav",

  // ********* AMMO *********
 200 model   MODEL_BULLETS         "Models\\Items\\Ammo\\PistolClip\\PistolClip.mdl",
 201 texture TEXTURE_BULLETS       "Models\\Weapons\\Pistol\\Pistol.tex",

 202 model   MODEL_SHELLS         "Models\\Items\\Ammo\\ShotgunShells\\ShotgunAmmo.mdl",
 203 texture TEXTURE_SHELLS       "Models\\Items\\Ammo\\ShotgunShells\\ShotgunShell.tex",

 204 model   MODEL_MEDIUM_BULLETS         "Models\\Items\\Ammo\\SMGClip\\SMGAmmo.mdl",
 205 texture TEXTURE_MEDIUM_BULLETS       "Models\\Weapons\\SMG\\SMG.tex",

 206 model   MODEL_STRONG_BULLETS         "Models\\Items\\Ammo\\StrongPistolClip\\StrongPistolClip.mdl",
 207 texture TEXTURE_STRONG_BULLETS       "Models\\Weapons\\StrongPistol\\StrongPistol.tex",

 208 model   MODEL_PAINKILLERS   "Models\\Items\\Inventory\\Painkillers\\Painkillers.mdl",
 209 texture TEXTURE_PAINKILLERS "Models\\Items\\Inventory\\Painkillers\\Painkillers.tex"

functions:

  // --------------------------------------------------------------------------------------
  // The config checkers
  // --------------------------------------------------------------------------------------

  // Set boolean properties
  virtual void SetBoolProperty(const CTString &strProp, const BOOL bValue) {
       if (strProp == "bDestroyable")      { m_bDestroyable = bValue; }
       else if (strProp == "bPushable")    { m_bPushable = bValue; }
       else if (strProp == "bAttachments") { m_bAttachments = bValue; }
       else if (strProp == "bColliding")   { m_bColliding = bValue; }
       else if (strProp == "bActive")      { m_bActive = bValue; }
       else if (strProp == "bTargetable")  { m_bTargetable = bValue; }
       else if (strProp == "bBackground")  { m_bBackground = bValue; }
  };

  // Set string properties
  virtual void SetStringProperty(const CTString &strProp, const CTString &strValue) {
       if (strProp == "name")       { m_strName = strValue; }
       else if (strProp == "description") { m_strDescription = strValue; }
  };

  // Set number properties
  virtual void SetNumberProperty(const CTString &strProp, const FLOAT fValue) {
       if (strProp == "fHealth")               { m_fHealth = fValue; }
       else if (strProp == "fCubeFactor")      { m_fCubeFactor = fValue; }
       else if (strProp == "fCandyEffect")     { m_fCandyEffect = fValue; }
       else if (strProp == "fStretchAll")      { m_fStretchAll = fValue; }
       else if (strProp == "fStretchX")        { m_fStretchX = fValue; }
       else if (strProp == "fStretchY")        { m_fStretchY = fValue; }
       else if (strProp == "fStretchZ")        { m_fStretchZ = fValue; }
       else if (strProp == "fCustomAmmoValue") { m_fCustomAmmoValue = fValue; }
       else if (strProp == "fItemSpawnX")      { m_fItemSpawnX = fValue; }
       else if (strProp == "fItemSpawnY")      { m_fItemSpawnY = fValue; }
       else if (strProp == "fItemSpawnZ")      { m_fItemSpawnZ = fValue; }
  };

  // Set index properties
  virtual void SetIndexProperty(const CTString &strProp, const INDEX iValue) {
       if (strProp == "colDebrises")        { m_colDebrises = iValue; }
       else if (strProp == "colLight")      { m_colLight = iValue; }
       else if (strProp == "colAmbient")    { m_colAmbient = iValue; }
       else if (strProp == "ctDebrises")    { m_ctDebrises = iValue; }
       else if (strProp == "iCollisionBox") { m_iCollisionBox = iValue; }
  };

  void LoadModelConfig(void) {
    if (m_fnmConfig == "") {
      return;
    }

    // Load variables into this stack
    CConfigPairs aConfig;
    LoadConfigFile(m_fnmConfig, aConfig);

    // Iterate through it
    for (INDEX i = 0; i < aConfig.Count(); i++) {
        const ConfigPair &pair = aConfig[i];
  
        // Set string or number value
        if (pair.val.bBool) {
            SetBoolProperty(pair.key, pair.val.bValue);
        } else if (pair.val.bString) {
            SetStringProperty(pair.key, pair.val.strValue);
        } else if (pair.val.bFloat) {
            SetNumberProperty(pair.key, pair.val.fValue);
        } else {
            SetIndexProperty(pair.key, pair.val.iValue);
        }
    }
  };

  CEntityPointer SpawnAmmo(void) {
    CPlacement3D plSpawn = GetPlacement();
    plSpawn.pl_PositionVector += FLOAT3D(m_fItemSpawnX, m_fItemSpawnY, m_fItemSpawnZ) * GetRotationMatrix();
    plSpawn.pl_OrientationAngle(1) = FRnd() * 360.0f;

    return CreateEntity(plSpawn, CLASS_AMMO);
  };

  CEntityPointer SpawnInventoryItem(void) {
    CPlacement3D plSpawn = GetPlacement();
    plSpawn.pl_PositionVector += FLOAT3D(m_fItemSpawnX, m_fItemSpawnY, m_fItemSpawnZ) * GetRotationMatrix();
    plSpawn.pl_OrientationAngle(1) = FRnd() * 360.0f;

    return CreateEntity(plSpawn, CLASS_INVENTORY_ITEM);
  };

  /* Drop item */
  void DropItem(void) {
    if(m_pmitType == PMIT_AMMO) {
      CEntityPointer pen = SpawnAmmo();
      pen->Initialize();

      CAmmoItem *penAmmo = (CAmmoItem*)&*pen;
      penAmmo->m_bDropped = TRUE;
      penAmmo->m_bPickupOnce = TRUE;
      penAmmo->m_EaitType = m_EaitType;
      if(m_fCustomAmmoValue > 0) {
        penAmmo->m_fValue = m_fCustomAmmoValue;
      }

      pen->Reinitialize();
    } else if (m_pmitType == PMIT_INVENTORY) {
      CEntityPointer pen = SpawnInventoryItem();
      pen->Initialize();

      CInventoryItem *penInventory = (CInventoryItem*)&*pen;
      penInventory->m_bDropped = TRUE;
      penInventory->m_bPickupOnce = TRUE;
      penInventory->m_iitType = m_iitType;

      pen->Reinitialize();
    }
  }

  void Precache(void) {
    PrecacheModel(MODEL_WOOD);
    PrecacheModel(MODEL_METAL);
    PrecacheModel(MODEL_GLASS);
    PrecacheModel(MODEL_STONE);
    PrecacheModel(MODEL_FLESH);
    
    PrecacheTexture(TEXTURE_METAL);
    PrecacheTexture(TEXTURE_WOOD);
    PrecacheTexture(TEXTURE_GLASS);
    PrecacheTexture(TEXTURE_GLASS2);
    PrecacheTexture(TEXTURE_STONE);
    PrecacheTexture(TEXTURE_FLESH_RED);

    PrecacheSound(SOUND_METAL_DESTROY1);
    PrecacheSound(SOUND_METAL_DESTROY2);
    PrecacheSound(SOUND_METAL_DESTROY3);
    PrecacheSound(SOUND_METAL_DESTROY4);
    PrecacheSound(SOUND_METAL_DESTROY5);
    PrecacheSound(SOUND_WOOD_DESTROY1);
    PrecacheSound(SOUND_WOOD_DESTROY2);
    PrecacheSound(SOUND_WOOD_DESTROY3);
    PrecacheSound(SOUND_GLASS_DESTROY1);
    PrecacheSound(SOUND_GLASS_DESTROY2);
    PrecacheSound(SOUND_GLASS_DESTROY3);
    PrecacheSound(SOUND_GLASS_DESTROY4);
    PrecacheSound(SOUND_CONCRETE_DESTROY1);
    PrecacheSound(SOUND_CONCRETE_DESTROY2);
    PrecacheSound(SOUND_CONCRETE_DESTROY3);
    PrecacheSound(SOUND_FLESH_DESTROY1);

    PrecacheSound(SOUND_METAL_BULLET1);
    PrecacheSound(SOUND_METAL_BULLET2);
    PrecacheSound(SOUND_METAL_BULLET3);
    PrecacheSound(SOUND_METAL_BULLET4);
    PrecacheSound(SOUND_METAL_BULLET5);

    PrecacheSound(SOUND_WOOD_BULLET1);
    PrecacheSound(SOUND_WOOD_BULLET2);
    PrecacheSound(SOUND_WOOD_BULLET3);
    PrecacheSound(SOUND_WOOD_BULLET4);
    PrecacheSound(SOUND_WOOD_BULLET5);

    PrecacheSound(SOUND_GLASS_BULLET1);
    PrecacheSound(SOUND_GLASS_BULLET2);
    PrecacheSound(SOUND_GLASS_BULLET3);
    PrecacheSound(SOUND_GLASS_BULLET4);
    PrecacheSound(SOUND_GLASS_BULLET5);

    PrecacheSound(SOUND_CONCRETE_BULLET1);
    PrecacheSound(SOUND_CONCRETE_BULLET2);
    PrecacheSound(SOUND_CONCRETE_BULLET3);
    PrecacheSound(SOUND_CONCRETE_BULLET4);

    PrecacheSound(SOUND_DIRT_BULLET1);
    PrecacheSound(SOUND_DIRT_BULLET2);
    PrecacheSound(SOUND_DIRT_BULLET3);
    PrecacheSound(SOUND_DIRT_BULLET4);

    PrecacheClass(CLASS_AMMO);
    PrecacheClass(CLASS_INVENTORY_ITEM);

    PrecacheModel(MODEL_BULLETS);
    PrecacheTexture(TEXTURE_BULLETS);
    PrecacheModel(MODEL_SHELLS);
    PrecacheTexture(TEXTURE_SHELLS);
    PrecacheModel(MODEL_MEDIUM_BULLETS);
    PrecacheTexture(TEXTURE_MEDIUM_BULLETS);
    PrecacheModel(MODEL_STRONG_BULLETS);
    PrecacheTexture(TEXTURE_STRONG_BULLETS);

    PrecacheModel(MODEL_PAINKILLERS);
    PrecacheTexture(TEXTURE_PAINKILLERS);

    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSIVEBARREL);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSION_DEBRIS);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSION_SMOKE);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSIONSTAIN);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_SHOCKWAVE);
    PrecacheClass(CLASS_BASIC_EFFECT, BET_EXPLOSIVEBARREL_PLANE);
  };

  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
    if(!m_bDestroyable) {
      return;
    }

    if( dmtType==DMT_BURNING)
    {
      UBYTE ubR, ubG, ubB, ubA;
      ColorToRGBA(m_colBurning, ubR, ubG, ubB, ubA);
      ubR=ClampDn(ubR-4, 32);
      m_colBurning=RGBAToColor(ubR, ubR, ubR, ubA);
    }

    CMovableModelEntity::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
  };

  // Entity info
  void *GetEntityInfo(void) {
    return CEntity::GetEntityInfo();
  };

  BOOL IsTargetable(void) const
  {
    return m_bTargetable;
  }

  /* Get anim data for given animation property - return NULL for none. */
  CAnimData *GetAnimData(SLONG slPropertyOffset) 
  {
    if (slPropertyOffset==offsetof(CUZModelHolder, m_iModelAnimation)) {
      return GetModelObject()->GetData();
    } else if (slPropertyOffset==offsetof(CUZModelHolder, m_iTextureAnimation)) {
      return GetModelObject()->mo_toTexture.GetData();
    } else if (slPropertyOffset==offsetof(CUZModelHolder, m_iLightAnimation)) {
      return m_aoLightAnimation.GetData();
    } else {
      return CEntity::GetAnimData(slPropertyOffset);
    }
  };

  /* Adjust model mip factor if needed. */
  void AdjustMipFactor(FLOAT &fMipFactor)
  {
    // if should fade last mip
    if (m_fMipFadeDist>0) {
      CModelObject *pmo = GetModelObject();
      if(pmo==NULL) {
        return;
      }
      // adjust for stretch
      FLOAT fMipForFade = fMipFactor;
      // TODO: comment the next 3 lines for mip factors conversion
      /*if (pmo->mo_Stretch != FLOAT3D(1,1,1)) {
        fMipForFade -= Log2( Max(pmo->mo_Stretch(1),Max(pmo->mo_Stretch(2),pmo->mo_Stretch(3))));
      }*/

      // if not visible
      if (fMipForFade>m_fMipFadeDist) {
        // set mip factor so that model is never rendered
        fMipFactor = UpperLimit(0.0f);
        return;
      }

      // adjust fading
      FLOAT fFade = (m_fMipFadeDist-fMipForFade);
      if (m_fMipFadeLen>0) {
        fFade/=m_fMipFadeLen;
      } else {
        if (fFade>0) {
          fFade = 1.0f;
        }
      }
      
      fFade = Clamp(fFade, 0.0f, 1.0f);
      // make it invisible
      pmo->mo_colBlendColor = (pmo->mo_colBlendColor&~255)|UBYTE(255*fFade);
    }

    fMipFactor = fMipFactor*m_fMipMul+m_fMipAdd;
  }

  /* Adjust model shading parameters if needed. */
  BOOL AdjustShadingParameters(FLOAT3D &vLightDirection, COLOR &colLight, COLOR &colAmbient)
  {
    switch( m_cstCustomShading)
    {
    case CST_FULL_CUSTOMIZED:
      {
        // if there is color animation
        if (m_aoLightAnimation.GetData()!=NULL) {
          // get lerping info
          SLONG colFrame0, colFrame1; FLOAT fRatio;
          m_aoLightAnimation.GetFrame( colFrame0, colFrame1, fRatio);
          UBYTE ubAnimR0, ubAnimG0, ubAnimB0;
          UBYTE ubAnimR1, ubAnimG1, ubAnimB1;
          ColorToRGB( colFrame0, ubAnimR0, ubAnimG0, ubAnimB0);
          ColorToRGB( colFrame1, ubAnimR1, ubAnimG1, ubAnimB1);

          // calculate current animation color
          FLOAT fAnimR = NormByteToFloat( Lerp( ubAnimR0, ubAnimR1, fRatio));
          FLOAT fAnimG = NormByteToFloat( Lerp( ubAnimG0, ubAnimG1, fRatio));
          FLOAT fAnimB = NormByteToFloat( Lerp( ubAnimB0, ubAnimB1, fRatio));
          
          // decompose constant colors
          UBYTE ubLightR,   ubLightG,   ubLightB;
          UBYTE ubAmbientR, ubAmbientG, ubAmbientB;
          ColorToRGB( m_colLight,   ubLightR,   ubLightG,   ubLightB);
          ColorToRGB( m_colAmbient, ubAmbientR, ubAmbientG, ubAmbientB);
          colLight   = RGBToColor( ubLightR  *fAnimR, ubLightG  *fAnimG, ubLightB  *fAnimB);
          colAmbient = RGBToColor( ubAmbientR*fAnimR, ubAmbientG*fAnimG, ubAmbientB*fAnimB);

        // if there is no color animation
        } else {
          colLight   = m_colLight;
          colAmbient = m_colAmbient;
        }

        // obtain world settings controller
        CWorldSettingsController *pwsc = GetWSC(this);
        if( pwsc!=NULL && pwsc->m_bApplyShadingToModels)
        {
          // apply animating shading
          COLOR colShade = GetWorld()->wo_atbTextureBlendings[9].tb_colMultiply;
          colLight=MulColors(colLight, colShade);
          colAmbient=MulColors(colAmbient, colShade);
        }

        AnglesToDirectionVector(m_aShadingDirection, vLightDirection);
        vLightDirection = -vLightDirection;
        break;
      }
    case CST_CONSTANT_SHADING:
      {
        // combine colors with clamp
        UBYTE lR,lG,lB,aR,aG,aB,rR,rG,rB;
        ColorToRGB( colLight,   lR, lG, lB);
        ColorToRGB( colAmbient, aR, aG, aB);
        colLight = 0;
        rR = (UBYTE) Clamp( (ULONG)lR+aR, (ULONG)0, (ULONG)255);
        rG = (UBYTE) Clamp( (ULONG)lG+aG, (ULONG)0, (ULONG)255);
        rB = (UBYTE) Clamp( (ULONG)lB+aB, (ULONG)0, (ULONG)255);
        colAmbient = RGBToColor( rR, rG, rB);
        break;
      }
    case CST_NONE:
      {
        // do nothing
        break;
      }
    }

    if(m_colBurning!=COLOR(C_WHITE|CT_OPAQUE))
    {
      colAmbient = MulColors( colAmbient, m_colBurning);
      colLight = MulColors( colLight, m_colBurning);
      return TRUE;
    }

    return m_stClusterShadows!=ST_NONE;
  };

  // apply mirror and stretch to the entity
  void MirrorAndStretch(FLOAT fStretch, BOOL bMirrorX)
  {
    m_fStretchAll*=fStretch;
    if (bMirrorX) {
      m_fStretchX = -m_fStretchX;
    }
  }

  // Stretch model
  void StretchModel(void) {
    // stretch factors must not have extreme values
    if (Abs(m_fStretchX)  < 0.01f) { m_fStretchX   = 0.01f;  }
    if (Abs(m_fStretchY)  < 0.01f) { m_fStretchY   = 0.01f;  }
    if (Abs(m_fStretchZ)  < 0.01f) { m_fStretchZ   = 0.01f;  }
    if (m_fStretchAll< 0.01f) { m_fStretchAll = 0.01f;  }

    if (Abs(m_fStretchX)  >1000.0f) { m_fStretchX   = 1000.0f*Sgn(m_fStretchX); }
    if (Abs(m_fStretchY)  >1000.0f) { m_fStretchY   = 1000.0f*Sgn(m_fStretchY); }
    if (Abs(m_fStretchZ)  >1000.0f) { m_fStretchZ   = 1000.0f*Sgn(m_fStretchZ); }
    if (m_fStretchAll>1000.0f) { m_fStretchAll = 1000.0f; }

    GetModelObject()->StretchModel( FLOAT3D(
      m_fStretchAll*m_fStretchX,
      m_fStretchAll*m_fStretchY,
      m_fStretchAll*m_fStretchZ) );
    ModelChangeNotify();
  };

  // classification box multiplier
  FLOAT3D GetClassificationBoxStretch(void)
  {
    return FLOAT3D( m_fClassificationStretch, m_fClassificationStretch, m_fClassificationStretch);
  }

  /* Init model holder*/
  void InitModelHolder(void) {

    // must not crash when model is removed
    if (m_fnModel=="") {
      m_fnModel=CTFILENAME("Models\\Editor\\Axis.mdl");
    }

    if( m_fnReflection == CTString("Models\\Editor\\Vector.tex")) {
      m_fnReflection = CTString("");
    }
    if( m_fnSpecular == CTString("Models\\Editor\\Vector.tex")) {
      m_fnSpecular = CTString("");
    }
    if( m_fnBump == CTString("Models\\Editor\\Vector.tex")) {
      m_fnBump = CTString("");
    }

    if (m_bActive) {
      InitAsModel();
    } else {
      InitAsEditorModel();
    }
    // set appearance
    SetModel(m_fnModel);
    INDEX iAnim=m_iModelAnimation;

    GetModelObject()->PlayAnim(iAnim, AOF_LOOPING);

    // if initialized for the first time
    if (m_fnOldModel=="") {
      // just remember the model filename
      m_fnOldModel = m_fnModel;
    // if re-initialized
    } else {
      // if the model filename has changed
      if (m_fnOldModel != m_fnModel) {
        m_fnOldModel = m_fnModel;
        GetModelObject()->AutoSetTextures();
        m_fnTexture = GetModelObject()->mo_toTexture.GetName();
        m_fnReflection = GetModelObject()->mo_toReflection.GetName();
        m_fnSpecular = GetModelObject()->mo_toSpecular.GetName();
        m_fnBump = GetModelObject()->mo_toBump.GetName();
      }
    }
    
    if( m_bAttachments)
    {
      GetModelObject()->AutoSetAttachments();
    }
    else
    {
      GetModelObject()->RemoveAllAttachmentModels();
    }

    try
    {
      GetModelObject()->mo_toTexture.SetData_t(m_fnTexture);
      GetModelObject()->mo_toTexture.PlayAnim(m_iTextureAnimation, AOF_LOOPING);
      GetModelObject()->mo_toReflection.SetData_t(m_fnReflection);
      GetModelObject()->mo_toSpecular.SetData_t(m_fnSpecular);
      GetModelObject()->mo_toBump.SetData_t(m_fnBump);
    } catch (char *strError) {
      WarningMessage(strError);
    }

    ForceCollisionBoxIndexChange(m_iCollisionBox);

    // set model stretch
    StretchModel();
    ModelChangeNotify();

    if (m_bColliding) {
      if(m_bPushable) {
        SetPhysicsFlags(EPF_MODEL_PUSHAROUND);
        SetCollisionFlags(ECF_MODEL);
      } else {
        SetPhysicsFlags(EPF_MODEL_FIXED);
        SetCollisionFlags(ECF_MODEL);
      }
    } else {
      SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
      SetCollisionFlags(ECF_IMMATERIAL);
    }

    switch(m_stClusterShadows) {
    case ST_NONE:
      {
        SetFlags(GetFlags()&~ENF_CLUSTERSHADOWS);
        SetFlags(GetFlags()&~ENF_POLYGONALSHADOWS);
        break;
      }
    case ST_CLUSTER:
      {
        SetFlags(GetFlags()|ENF_CLUSTERSHADOWS);
        SetFlags(GetFlags()&~ENF_POLYGONALSHADOWS);
        break;
      }
    case ST_POLYGONAL:
      {
        SetFlags(GetFlags()|ENF_POLYGONALSHADOWS);
        SetFlags(GetFlags()&~ENF_CLUSTERSHADOWS);
        break;
      }
    }

    switch(m_pmrtReflectionType) {
    case PMRT_NONE:
      {
        SetRenderingFlags(GetRenderingFlags()&~ERF_DONTRENDERINMIRROR);
        SetRenderingFlags(GetRenderingFlags()&~ERF_ONLYRENDERINMIRROR);
        break;
      }
    case PMRT_ONLYINMIRRORS:
      {
        SetRenderingFlags(GetRenderingFlags()|ERF_ONLYRENDERINMIRROR);
        SetRenderingFlags(GetRenderingFlags()&~ERF_DONTRENDERINMIRROR);
        break;
      }
    case PMRT_NOTINMIRRORS:
      {
        SetRenderingFlags(GetRenderingFlags()|ERF_DONTRENDERINMIRROR);
        SetRenderingFlags(GetRenderingFlags()&~ERF_ONLYRENDERINMIRROR);
        break;
      }
    }

    if (m_bBackground) {
      SetFlags(GetFlags()|ENF_BACKGROUND);
    } else {
      SetFlags(GetFlags()&~ENF_BACKGROUND);
    }

    if(m_bDestroyable) {
      SetFlags(GetFlags()|ENF_ALIVE);
    } else {
      SetFlags(GetFlags()&~ENF_ALIVE);
    }

    try {
      m_aoLightAnimation.SetData_t(m_fnmLightAnimation);
    } catch (char *strError) {
      WarningMessage(TRANS("Cannot load '%s': %s"), (CTString&)m_fnmLightAnimation, strError);
      m_fnmLightAnimation = "";
    }
    if (m_aoLightAnimation.GetData()!=NULL) {
      m_aoLightAnimation.PlayAnim(m_iLightAnimation, AOF_LOOPING);
    }

    m_strDescription.PrintF("%s,%s", (CTString&)m_fnModel.FileName(), (CTString&)m_fnTexture.FileName());

    return;
  }


  // returns bytes of memory used by this object
  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CUZModelHolder) - sizeof(CMovableModelEntity) + CMovableModelEntity::GetUsedMemory();
    // add some more
    slUsedMemory += m_fnModel.Length();
    slUsedMemory += m_fnTexture.Length();
    slUsedMemory += m_fnReflection.Length();
    slUsedMemory += m_fnSpecular.Length();
    slUsedMemory += m_fnBump.Length();
    slUsedMemory += m_strName.Length();
    slUsedMemory += m_strDescription.Length();
    slUsedMemory += m_fnmLightAnimation.Length();
    slUsedMemory += 1* sizeof(CAnimObject); // only 1
    slUsedMemory += 1* sizeof(CSoundObject); // only 1
    return slUsedMemory;
  }

  void DebrisInitialize(EntityInfoBodyType eibtMaterialType, SLONG sModelID, SLONG sTextureID, FLOAT fEntSize, FLOATaabbox3D fBox)
  {
    FLOAT fEntitySize = pow(fBox.Size()(1)*fBox.Size()(2)*fBox.Size()(3)/m_ctDebrises, 1.0f/3.0f)*m_fCubeFactor;
    Debris_Begin(eibtMaterialType, DPT_NONE, BET_NONE, fEntitySize, FLOAT3D(1.0f,2.0f,3.0f),
    FLOAT3D(0,0,0), 1.0f+m_fCandyEffect/2.0f, m_fCandyEffect, m_colDebrises);
                    for(INDEX iDebris = 0; iDebris<m_ctDebrises; iDebris++) {
                        Debris_Spawn(this, this, sModelID, sTextureID, 0, 0, 0, IRnd()%4, 1.0f,
                        FLOAT3D(FRnd()*0.8f+0.1f, FRnd()*0.8f+0.1f, FRnd()*0.8f+0.1f));
                    }
  }

  // spawn effect
  void SpawnEffect(const CPlacement3D &plEffect, const class ESpawnEffect &eSpawnEffect)
  {
    CEntityPointer penEffect = CreateEntity(plEffect, CLASS_BASIC_EFFECT);
    penEffect->Initialize(eSpawnEffect);
  };

  void BarrelExplosion(void) {
  ESpawnEffect ese;
  FLOAT3D vPoint;
  FLOATplane3D vPlaneNormal;
  FLOAT fDistanceToEdge;

  // explosion
  ese.colMuliplier = C_WHITE|CT_OPAQUE;
  ese.betType = BET_EXPLOSIVEBARREL;
  ese.vStretch = FLOAT3D(1,1,1);
  SpawnEffect(GetPlacement(), ese);

  // explosion debris
  ese.betType = BET_EXPLOSION_DEBRIS;
  SpawnEffect(GetPlacement(), ese);

  // explosion smoke
  ese.betType = BET_EXPLOSION_SMOKE;
  SpawnEffect(GetPlacement(), ese);

  // on plane
  if (GetNearestPolygon(vPoint, vPlaneNormal, fDistanceToEdge)) {
    if ((vPoint-GetPlacement().pl_PositionVector).Length() < 3.5f) {
      // stain
      ese.betType = BET_EXPLOSIONSTAIN;
      ese.vNormal = FLOAT3D(vPlaneNormal);
      SpawnEffect(CPlacement3D(vPoint, ANGLE3D(0, 0, 0)), ese);
      // shock wave
      ese.betType = BET_SHOCKWAVE;
      ese.vNormal = FLOAT3D(vPlaneNormal);
      SpawnEffect(CPlacement3D(vPoint, ANGLE3D(0, 0, 0)), ese);
      // second explosion on plane
      ese.betType = BET_EXPLOSIVEBARREL_PLANE;
      ese.vNormal = FLOAT3D(vPlaneNormal);
      SpawnEffect(CPlacement3D(vPoint+ese.vNormal/50.0f, ANGLE3D(0, 0, 0)), ese);
    }
  }
};

procedures:


  Main()
  {
    // fall off and hot spot must be positive values
    if (m_fExplosionFalloff<0) {
      m_fExplosionFalloff = 0.0f;
    }
    if (m_fExplosionHotSpot<0) {
      m_fExplosionHotSpot = 0.0f;
    }
    // hot spot must be less or equal falloff
    if (m_fExplosionHotSpot>m_fExplosionFalloff) {
      m_fExplosionHotSpot = m_fExplosionFalloff;
    }

    // initialize the model
    InitModelHolder();
    // set health for this model
    SetHealth(m_fHealth);

    if(m_bPushable) {
      AddToMovers();
    }

    // TODO: decomment this AFTER mip factors conversion
    if (m_fMipFadeLenMetric>m_rMipFadeDistMetric) { m_fMipFadeLenMetric = m_rMipFadeDistMetric; }
    // TODO: decomment this for mip factors conversion
    /*if (m_fMipFadeLen<0.0f) { m_fMipFadeLen = 0.0f; }
    if (m_fMipFadeDist<0.0f) { m_fMipFadeDist = 0.0f; }
    if (m_fMipFadeLen>m_fMipFadeDist) { m_fMipFadeLen = m_fMipFadeDist; }

    // if metric mip values are not initialized, get values from old mip factors
    if ( m_fMipFadeDist>0.0f ) {
      CModelObject *pmo = GetModelObject();
      if (pmo!=NULL) {
        FLOAT fMipSizeFact = Log2( Max(pmo->mo_Stretch(1),Max(pmo->mo_Stretch(2),pmo->mo_Stretch(3))));
        m_rMipFadeDistMetric = pow(2.0f, m_fMipFadeDist+fMipSizeFact)/(1024.0f*MIPRATIO);
        m_fMipFadeLenMetric  = m_rMipFadeDistMetric - pow(2.0f, m_fMipFadeDist+fMipSizeFact-m_fMipFadeLen)/(1024.0f*MIPRATIO);
      } else {
        m_rMipFadeDistMetric = 0.0f;
        m_fMipFadeLenMetric  = 0.0f;
      }      
    } else {
      m_rMipFadeDistMetric = 0.0f;
      m_fMipFadeLenMetric  = 0.0f;     
    }*/
    
    // convert metric factors to mip factors
    if (m_rMipFadeDistMetric>0.0f) {
      m_fMipFadeDist = Log2(m_rMipFadeDistMetric*1024.0f*MIPRATIO);
      m_fMipFadeLen  = Log2((m_rMipFadeDistMetric+m_fMipFadeLenMetric)*1024.0f*MIPRATIO) - m_fMipFadeDist;
    } else {
      m_fMipFadeDist = 0.0f;
      m_fMipFadeLen  = 0.0f;
    }

    // check for configuration file
    LoadModelConfig();

    // wait forever
    wait() {
      // on the beginning
      on(EBegin): {
        m_soSound.Set3DParameters(20.0f, 10.0f, 1.0f, 1.0f+FRnd()*0.2f);
        resume;
      }
      // activate/deactivate shows/hides model
      on (EActivate): {
        SwitchToModel();
        m_bActive = TRUE;
        if (m_bColliding) {
          if(m_bPushable) {
            SetPhysicsFlags(EPF_MODEL_PUSHAROUND);
            SetCollisionFlags(ECF_MODEL);
          } else {
            SetPhysicsFlags(EPF_MODEL_FIXED);
            SetCollisionFlags(ECF_MODEL);
          }
        }
        resume;
      }
      on (EDeactivate): {
        SwitchToEditorModel();
        SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
        SetCollisionFlags(ECF_IMMATERIAL);
        m_bActive = FALSE;
        SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
        SetCollisionFlags(ECF_IMMATERIAL);
        resume;
      }
      // when animation should be changed
      on(EChangeAnim eChange): {
        m_iModelAnimation   = eChange.iModelAnim;
        m_iTextureAnimation = eChange.iTextureAnim;
        m_iLightAnimation   = eChange.iLightAnim;
        if (m_aoLightAnimation.GetData()!=NULL) {
          m_aoLightAnimation.PlayAnim(m_iLightAnimation, eChange.bLightLoop?AOF_LOOPING:0);
        }
        if (GetModelObject()->GetData()!=NULL) {
          GetModelObject()->PlayAnim(m_iModelAnimation, eChange.bModelLoop?AOF_LOOPING:0);
        }
        if (GetModelObject()->mo_toTexture.GetData()!=NULL) {
          GetModelObject()->mo_toTexture.PlayAnim(m_iTextureAnimation, eChange.bTextureLoop?AOF_LOOPING:0);
        }
        resume;
      }
      on (ETouch eTouch) : {
        if(IsOfClass(eTouch.penOther, "UZModelHolder")) {
          FLOAT3D vPush = eTouch.penOther->GetPlacement().pl_PositionVector - GetPlacement().pl_PositionVector;
          switch(m_pmwType)
          {
            case PMWT_SMALL: vPush *= 2.0f; break;
            case PMWT_MEDIUM: vPush *= 1.65f; break;
            case PMWT_BIG: vPush *= 1.35f; break;
            case PMWT_HUGE: vPush *= 1.1f; break;
            default: break;
          }
          CUZModelHolder *penPushable = (CUZModelHolder*)&*eTouch.penOther;
          if(penPushable->m_bPushable) {
            penPushable->GiveImpulseTranslationAbsolute(FLOAT3D(vPush(1), 0.0f, vPush(3)));
          }
        }

        if(IsOfClass(eTouch.penOther, "UZSkaModelHolder")) {
          FLOAT3D vPush = eTouch.penOther->GetPlacement().pl_PositionVector - GetPlacement().pl_PositionVector;
          switch(m_pmwType)
          {
            case PMWT_SMALL: vPush *= 2.0f; break;
            case PMWT_MEDIUM: vPush *= 1.65f; break;
            case PMWT_BIG: vPush *= 1.35f; break;
            case PMWT_HUGE: vPush *= 1.1f; break;
            default: break;
          }
          CUZSkaModelHolder *penPushable = (CUZSkaModelHolder*)&*eTouch.penOther;
          if(penPushable->m_bPushable) {
            penPushable->GiveImpulseTranslationAbsolute(FLOAT3D(vPush(1), 0.0f, vPush(3)));
          }
        }

        if(IsOfClass(eTouch.penOther, "ExplosiveBarrel")) {
          FLOAT3D vPush = eTouch.penOther->GetPlacement().pl_PositionVector - GetPlacement().pl_PositionVector;
          switch(m_pmwType)
          {
            case PMWT_SMALL: vPush *= 2.0f; break;
            case PMWT_MEDIUM: vPush *= 1.65f; break;
            case PMWT_BIG: vPush *= 1.35f; break;
            case PMWT_HUGE: vPush *= 1.1f; break;
            default: break;
          }
          CExplosiveBarrel *penPushable = (CExplosiveBarrel*)&*eTouch.penOther;
          penPushable->GiveImpulseTranslationAbsolute(FLOAT3D(vPush(1), 0.0f, vPush(3)));
        }
        resume;
      }
      on (EDamage eDamage) : {
        switch(m_pmmType) {
          case PMMT_METAL: {
            switch(IRnd()%5) {
              case 0: { PlaySound(m_soSound, SOUND_METAL_BULLET1, SOF_3D); } break;
              case 1: { PlaySound(m_soSound, SOUND_METAL_BULLET2, SOF_3D); } break;
              case 2: { PlaySound(m_soSound, SOUND_METAL_BULLET3, SOF_3D); } break;
              case 3: { PlaySound(m_soSound, SOUND_METAL_BULLET4, SOF_3D); } break;
              case 4: { PlaySound(m_soSound, SOUND_METAL_BULLET5, SOF_3D); } break;
              default: break;
            }
          } break;
          case PMMT_WOOD:
          case PMMT_WOODGLASS: {
            switch(IRnd()%5) {
              case 0: { PlaySound(m_soSound, SOUND_WOOD_BULLET1, SOF_3D); } break;
              case 1: { PlaySound(m_soSound, SOUND_WOOD_BULLET2, SOF_3D); } break;
              case 2: { PlaySound(m_soSound, SOUND_WOOD_BULLET3, SOF_3D); } break;
              case 3: { PlaySound(m_soSound, SOUND_WOOD_BULLET4, SOF_3D); } break;
              case 4: { PlaySound(m_soSound, SOUND_WOOD_BULLET5, SOF_3D); } break;
              default: break;
            }
          } break;
          case PMMT_GLASS: {
            switch(IRnd()%5) {
              case 0: { PlaySound(m_soSound, SOUND_GLASS_BULLET1, SOF_3D); } break;
              case 1: { PlaySound(m_soSound, SOUND_GLASS_BULLET2, SOF_3D); } break;
              case 2: { PlaySound(m_soSound, SOUND_GLASS_BULLET3, SOF_3D); } break;
              case 3: { PlaySound(m_soSound, SOUND_GLASS_BULLET4, SOF_3D); } break;
              case 4: { PlaySound(m_soSound, SOUND_GLASS_BULLET5, SOF_3D); } break;
              default: break;
            }
          } break;
          case PMMT_STONE:
          case PMMT_CONCRETE: {
            switch(IRnd()%4) {
              case 0: { PlaySound(m_soSound, SOUND_CONCRETE_BULLET1, SOF_3D); } break;
              case 1: { PlaySound(m_soSound, SOUND_CONCRETE_BULLET2, SOF_3D); } break;
              case 2: { PlaySound(m_soSound, SOUND_CONCRETE_BULLET3, SOF_3D); } break;
              case 3: { PlaySound(m_soSound, SOUND_CONCRETE_BULLET4, SOF_3D); } break;
              default: break;
            }
          } break;
          case PMMT_LEAVES: {
            switch(IRnd()%4) {
              case 0: { PlaySound(m_soSound, SOUND_DIRT_BULLET1, SOF_3D); } break;
              case 1: { PlaySound(m_soSound, SOUND_DIRT_BULLET2, SOF_3D); } break;
              case 2: { PlaySound(m_soSound, SOUND_DIRT_BULLET3, SOF_3D); } break;
              case 3: { PlaySound(m_soSound, SOUND_DIRT_BULLET4, SOF_3D); } break;
              default: break;
            }
          } break;
          default: break;
        }
        resume;
      }
      on (EDeath) : {
        switch(m_pmdType) {
          case PMDT_NONE:
          break;
          case PMDT_EXPLODE:
          InflictRangeDamage(this, DMT_EXPLOSION, m_fExplosionDamage, GetPlacement().pl_PositionVector + FLOAT3D(0.0f, m_fExplosionHeight, 0.0f), m_fExplosionHotSpot, m_fExplosionFalloff, DBPT_GENERIC);
          BarrelExplosion();
          break;
        }

        // not alive anymore
        if(m_bDestroyable) {
          SetFlags(GetFlags()&~ENF_ALIVE);
        }

        DropItem();

        // get your size
        FLOATaabbox3D box;
        GetSize(box);
        FLOAT fEntitySize = pow(box.Size()(1)*box.Size()(2)*box.Size()(3)/m_ctDebrises, 1.0f/3.0f)*m_fCubeFactor;

        switch(m_pmmType) {
          case PMMT_WOOD:
          case PMMT_WOODGLASS: {
            if(m_pmwType != PMWT_SMALL) {
              switch(IRnd()%2) {
                case 0: PlaySound(m_soSound, SOUND_WOOD_DESTROY1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_WOOD_DESTROY2, SOF_3D); break;
                default: ASSERTALWAYS("UZModelHolder unknown break sound");
              }
            } else {
              PlaySound(m_soSound, SOUND_WOOD_DESTROY3, SOF_3D);
            }
            if( m_ctDebrises>0) {
              if(m_pmmType == PMMT_WOODGLASS) {
                DebrisInitialize(EIBT_WOOD, MODEL_WOOD, TEXTURE_WOOD, fEntitySize, box);
                if(m_pmdtType == PMDTT_WHITEGLASS) {
                  DebrisInitialize(EIBT_GLASS, MODEL_GLASS, TEXTURE_GLASS, fEntitySize, box);
                } else {
                  DebrisInitialize(EIBT_GLASS, MODEL_GLASS, TEXTURE_GLASS2, fEntitySize, box);
                }
              } else {
                DebrisInitialize(EIBT_WOOD, MODEL_WOOD, TEXTURE_WOOD, fEntitySize, box);
              }
            }
          } break;
          case PMMT_METAL: {
            if(m_pmwType == PMWT_SMALL) {
              switch(IRnd()%2) {
                case 0: PlaySound(m_soSound, SOUND_METAL_DESTROY1, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_METAL_DESTROY2, SOF_3D); break;
                default: ASSERTALWAYS("UZModelHolder unknown break sound");
              }
            } else {
              switch(IRnd()%2) {
                case 0: PlaySound(m_soSound, SOUND_METAL_DESTROY4, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_METAL_DESTROY5, SOF_3D); break;
                default: ASSERTALWAYS("UZModelHolder unknown break sound");
              }
            }
            if( m_ctDebrises>0) {
              DebrisInitialize(EIBT_METAL, MODEL_METAL, TEXTURE_METAL, fEntitySize, box);
            }
          } break;
          case PMMT_STONE:
          case PMMT_CONCRETE: {
            if(m_pmwType == PMWT_BIG || m_pmwType == PMWT_HUGE) {
              switch(IRnd()%2) {
                case 0: PlaySound(m_soSound, SOUND_CONCRETE_DESTROY2, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_CONCRETE_DESTROY3, SOF_3D); break;
                default: ASSERTALWAYS("UZModelHolder unknown break sound");
              }
            } else {
              PlaySound(m_soSound, SOUND_CONCRETE_DESTROY1, SOF_3D);
            }
            if( m_ctDebrises>0) {
              DebrisInitialize(EIBT_ROCK, MODEL_STONE, TEXTURE_STONE, fEntitySize, box);
            }
          } break;
          case PMMT_GLASS: {
            if(m_pmwType == PMWT_SMALL) {
              PlaySound(m_soSound, SOUND_GLASS_DESTROY1, SOF_3D);
            } else if(m_pmwType == PMWT_BIG || m_pmwType == PMWT_HUGE) {
              switch(IRnd()%2) {
                case 0: PlaySound(m_soSound, SOUND_GLASS_DESTROY3, SOF_3D); break;
                case 1: PlaySound(m_soSound, SOUND_GLASS_DESTROY4, SOF_3D); break;
                default: ASSERTALWAYS("UZModelHolder unknown break sound");
              }
            } else {
              PlaySound(m_soSound, SOUND_GLASS_DESTROY2, SOF_3D);
            }
            if( m_ctDebrises>0) {
              if(m_pmdtType == PMDTT_WHITEGLASS) {
                DebrisInitialize(EIBT_GLASS, MODEL_GLASS, TEXTURE_GLASS, fEntitySize, box);
              } else {
                DebrisInitialize(EIBT_GLASS, MODEL_GLASS, TEXTURE_GLASS2, fEntitySize, box);
              }
            }
          } break;
          case PMMT_FLESH: {
            PlaySound(m_soSound, SOUND_FLESH_DESTROY1, SOF_3D);
            if( m_ctDebrises>0) {
              DebrisInitialize(EIBT_FLESH, MODEL_FLESH, TEXTURE_FLESH_RED, fEntitySize, box);
            }
          } break;
          default: break;
        }

        SwitchToEditorModel();
        SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
        SetCollisionFlags(ECF_IMMATERIAL);

        stop;
      }
      on (ETimer) : { stop; }
      otherwise(): {
        resume;
      }
    };

    autowait(2.0f);

    Destroy();
    return;
  }
};
