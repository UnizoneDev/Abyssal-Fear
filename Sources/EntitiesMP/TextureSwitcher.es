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

1031
%{
#include "StdH.h"
%}

enum BlendModeType {
  0 BMT_OPAQUE     "Opaque",
  1 BMT_SHADE      "Shade",
  2 BMT_BLEND      "Blend",
  3 BMT_ADD        "Add",
  4 BMT_MULTIPLY   "Multiply",
  5 BMT_INVERT     "Invert",
};

class CTextureSwitcher: CRationalEntity {
name      "TextureSwitcher";
thumbnail "Thumbnails\\TextureSwitcher.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName           "Name" 'N' = "Texture Switcher",                // class name
  2 BOOL m_bActive               "Active" 'A' = TRUE,                            // is checker active
  3 CTFileName m_fnmNewTexture1  "New Texture 1" 'T' = CTString(""),
  4 CTFileName m_fnmNewTexture2  "New Texture 2" = CTString(""),
  5 CTFileName m_fnmNewTexture3  "New Texture 3" = CTString(""),
  6 COLOR m_colTexture1 "Texture Color 1" = COLOR(C_WHITE|CT_OPAQUE),
  7 COLOR m_colTexture2 "Texture Color 2" = COLOR(C_WHITE|CT_OPAQUE),
  8 COLOR m_colTexture3 "Texture Color 3" = COLOR(C_WHITE|CT_OPAQUE),
  9 enum BlendModeType m_bmtType1 "Blend Mode 1" 'Y' = BMT_OPAQUE,
 10 enum BlendModeType m_bmtType2 "Blend Mode 2" = BMT_SHADE,
 11 enum BlendModeType m_bmtType3 "Blend Mode 3" = BMT_SHADE,

  {
    CTextureObject m_toNewTexture1;
    CTextureObject m_toNewTexture2;
    CTextureObject m_toNewTexture3;
  }

components:

  1 model   MODEL_MARKER     "Models\\Editor\\Axis.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\Vector.tex"


functions:

  /* Read from stream. */
  void Read_t( CTStream *istr) // throw char *
  {
    CRationalEntity::Read_t(istr);
    // setup new texture
    m_toNewTexture1.SetData_t(m_fnmNewTexture1);
    m_toNewTexture2.SetData_t(m_fnmNewTexture2);
    m_toNewTexture3.SetData_t(m_fnmNewTexture3);
  }

  void SetNewTexture(void)
  {
    try {
      m_toNewTexture1.SetData_t(m_fnmNewTexture1);
      m_toNewTexture2.SetData_t(m_fnmNewTexture2);
      m_toNewTexture3.SetData_t(m_fnmNewTexture3);
    } catch (char *strError) {
      WarningMessage(TRANS("Cannot load new texture: %s"), strError);
    }
  }

  void CastTextureRay(void)
  {
    CCastRay crRay(this, GetPlacement());
    crRay.cr_bHitPortals = FALSE;
    crRay.cr_bHitTranslucentPortals = TRUE;
    crRay.cr_bHitBlockSightPortals = FALSE;
    crRay.cr_bHitBlockMeleePortals = FALSE;
    crRay.cr_bHitBlockHitscanPortals = FALSE;
    crRay.cr_bPhysical = FALSE;
    crRay.cr_ttHitModels = CCastRay::TT_NONE;
    GetWorld()->CastRay(crRay);

    if (crRay.cr_penHit->GetRenderType()==RT_BRUSH) {
      CBrushPolygon *pbpo = crRay.cr_pbpoBrushPolygon;
      if(m_fnmNewTexture1 != "")
      {
        pbpo->bpo_abptTextures[0].bpt_toTexture.SetData_t(m_fnmNewTexture1);
        pbpo->bpo_abptTextures[0].s.bpt_colColor = m_colTexture1;
        switch(m_bmtType1)
        {
          default:
          pbpo->bpo_abptTextures[0].s.bpt_ubBlend = BPT_BLEND_OPAQUE;
          break;

          case BMT_OPAQUE:
          pbpo->bpo_abptTextures[0].s.bpt_ubBlend = BPT_BLEND_OPAQUE;
          break;

          case BMT_SHADE:
          pbpo->bpo_abptTextures[0].s.bpt_ubBlend = BPT_BLEND_SHADE;
          break;

          case BMT_BLEND:
          pbpo->bpo_abptTextures[0].s.bpt_ubBlend = BPT_BLEND_BLEND;
          break;

          case BMT_ADD:
          pbpo->bpo_abptTextures[0].s.bpt_ubBlend = BPT_BLEND_ADD;
          break;

          case BMT_MULTIPLY:
          pbpo->bpo_abptTextures[0].s.bpt_ubBlend = BPT_BLEND_MULTIPLY;
          break;

          case BMT_INVERT:
          pbpo->bpo_abptTextures[0].s.bpt_ubBlend = BPT_BLEND_INVERT;
          break;
        }
      }
      if(m_fnmNewTexture2 != "")
      {
        pbpo->bpo_abptTextures[1].bpt_toTexture.SetData_t(m_fnmNewTexture2);
        pbpo->bpo_abptTextures[1].s.bpt_colColor = m_colTexture2;
        switch(m_bmtType2)
        {
          default:
          pbpo->bpo_abptTextures[1].s.bpt_ubBlend = BPT_BLEND_OPAQUE;
          break;

          case BMT_OPAQUE:
          pbpo->bpo_abptTextures[1].s.bpt_ubBlend = BPT_BLEND_OPAQUE;
          break;

          case BMT_SHADE:
          pbpo->bpo_abptTextures[1].s.bpt_ubBlend = BPT_BLEND_SHADE;
          break;

          case BMT_BLEND:
          pbpo->bpo_abptTextures[1].s.bpt_ubBlend = BPT_BLEND_BLEND;
          break;

          case BMT_ADD:
          pbpo->bpo_abptTextures[1].s.bpt_ubBlend = BPT_BLEND_ADD;
          break;

          case BMT_MULTIPLY:
          pbpo->bpo_abptTextures[1].s.bpt_ubBlend = BPT_BLEND_MULTIPLY;
          break;

          case BMT_INVERT:
          pbpo->bpo_abptTextures[1].s.bpt_ubBlend = BPT_BLEND_INVERT;
          break;
        }
      }
      if(m_fnmNewTexture3 != "")
      {
        pbpo->bpo_abptTextures[2].bpt_toTexture.SetData_t(m_fnmNewTexture3);
        pbpo->bpo_abptTextures[2].s.bpt_colColor = m_colTexture3;
        switch(m_bmtType3)
        {
          default:
          pbpo->bpo_abptTextures[2].s.bpt_ubBlend = BPT_BLEND_OPAQUE;
          break;

          case BMT_OPAQUE:
          pbpo->bpo_abptTextures[2].s.bpt_ubBlend = BPT_BLEND_OPAQUE;
          break;

          case BMT_SHADE:
          pbpo->bpo_abptTextures[2].s.bpt_ubBlend = BPT_BLEND_SHADE;
          break;

          case BMT_BLEND:
          pbpo->bpo_abptTextures[2].s.bpt_ubBlend = BPT_BLEND_BLEND;
          break;

          case BMT_ADD:
          pbpo->bpo_abptTextures[2].s.bpt_ubBlend = BPT_BLEND_ADD;
          break;

          case BMT_MULTIPLY:
          pbpo->bpo_abptTextures[2].s.bpt_ubBlend = BPT_BLEND_MULTIPLY;
          break;

          case BMT_INVERT:
          pbpo->bpo_abptTextures[2].s.bpt_ubBlend = BPT_BLEND_INVERT;
          break;
        }
      }
    } else {
      return;
    }
  };

procedures:
  
  Active() {
    m_bActive = TRUE;
    wait() {
      on (EBegin) : { resume; }
      on (ETrigger eTrigger) : { 
        CastTextureRay();
        resume;
      }
      on (EDeactivate) : { jump Inactive(); }
    }
  };

  // I don't want to check your stuff now, leave me alone!
  Inactive() {
    m_bActive = FALSE;
    wait() {
      on (EBegin) : { resume; }
      on (EActivate) : { jump Active(); }
    }
  };

  Main() {
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    // setup texture
    SetNewTexture();

    // spawn in world editor
    autowait(0.1f);

    if (m_bActive) {
      jump Active();
    } else {
      jump Inactive();
    }

    return;
  };

};