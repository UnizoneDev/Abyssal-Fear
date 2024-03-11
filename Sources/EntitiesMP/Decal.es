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

1006
%{
#include "StdH.h"
#include "Models/Effects/Decal/Decal.h"
#include "Models/Effects/Decal/Decal1x1.h"
%}

enum DecalSizeType {
  0 DST_05 "0.5 by 0.5",
  1 DST_10 "1.0 by 1.0",
};

class CDecal: CMovableModelEntity {
name      "Decal";
thumbnail "Thumbnails\\Decal.tbn";
features "HasName", "IsTargetable";

properties:
1 CTString m_strName            "Name" 'N' = "Decal",       // class name
2 FLOAT m_fDepthSortOffset = -0.1f,
3 CTFileName m_fnmDecalTexture  "Decal Texture" 'T' = CTFILENAME("Models\\Effects\\InvisiblePlane\\InvisiblePlane.tex"),
4 FLOAT m_fStretchX "Stretch X" 'X' = 1.0f,
5 FLOAT m_fStretchY "Stretch Y" 'Y' = 1.0f,
6 FLOAT m_fStretchZ "Stretch Z" 'Z' = 1.0f,
7 FLOAT m_fStretchAll "Stretch All" 'S' = 1.0f,
8 enum DecalSizeType m_dstType "Decal Size Type" = DST_05, // type of effect
9 COLOR m_colDecal            "Decal Color" 'O' = C_WHITE,

{
  CTextureObject m_toDecal;
}


components:

1 model   MODEL_DECAL       "Models\\Effects\\Decal\\Decal.mdl",
2 model   MODEL_DECAL1X1    "Models\\Effects\\Decal\\Decal1x1.mdl",


functions:

  void Precache(void)
  {
    PrecacheModel(MODEL_DECAL);
    PrecacheModel(MODEL_DECAL1X1);
  }

  // get offset for depth-sorting of alpha models (in meters, positive is nearer)
  FLOAT GetDepthSortOffset(void)
  {
    return m_fDepthSortOffset;
  }

  /* Read from stream. */
  void Read_t( CTStream *istr) // throw char *
  {
    CMovableModelEntity::Read_t(istr);
    // setup beam texture
    m_toDecal.SetData_t(m_fnmDecalTexture);
  }

  void SetDecalTexture(void)
  {
    try {
      m_toDecal.SetData_t(m_fnmDecalTexture);
    } catch (char *strError) {
      WarningMessage(TRANS("Cannot load decal texture: %s"), strError);
    }
  }

  // returns bytes of memory used by this object
  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CDecal) - sizeof(CMovableModelEntity) + CMovableModelEntity::GetUsedMemory();
    // add some more
    slUsedMemory += m_strName.Length();
    return slUsedMemory;
  }

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

  // parent the effect if needed and adjust size not to get out of the polygon
  void ParentToNearestPolygonAndStretch(void) 
  {
    // find nearest polygon
    FLOAT3D vPoint; 
    FLOATplane3D plPlaneNormal;
    FLOAT fDistanceToEdge;
    CBrushPolygon *pbpoNearBrush = GetNearestPolygon( vPoint, plPlaneNormal, fDistanceToEdge);

    // if there is none, or if it is portal, or it is not near enough
    if (pbpoNearBrush==NULL || (pbpoNearBrush->bpo_ulFlags&BPOF_PORTAL) 
      || (vPoint-GetPlacement().pl_PositionVector).ManhattanNorm()>0.1f*3) {
      // dissapear
      SwitchToEditorModel();
    // if polygon is found
    } else {
      CEntity *penNearBrush = pbpoNearBrush->bpo_pbscSector->bsc_pbmBrushMip->bm_pbrBrush->br_penEntity;
      FLOATaabbox3D box;
      en_pmoModelObject->GetCurrentFrameBBox( box);
      box.StretchByVector( en_pmoModelObject->mo_Stretch);
      FLOAT fOrgSize = box.Size().MaxNorm();
      FLOAT fMaxSize = fDistanceToEdge*2.0f;
      // if minimum distance from polygon edges is too small
      if( fMaxSize<fOrgSize*0.25f) {
        // dissapear
        SwitchToEditorModel();
      // if the distance is acceptable
        } else {
        // set your size to not get out of it
        StretchModel();
        ModelChangeNotify();
        // set parent to that brush
        SetParent( penNearBrush);
      }
    }
  }

/************************************************************
 *                          MAIN                            *
 ************************************************************/

procedures:

  Main(EVoid)
  {
    InitAsModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);
    SetFlags(GetFlags()|ENF_SEETHROUGH);

    switch(m_dstType)
    {
      case DST_05:
      SetModel(MODEL_DECAL);
      break;
      case DST_10:
      SetModel(MODEL_DECAL1X1);
      break;
      default:
      ASSERTALWAYS("Unknown decal texture size type");
      break;
    }

    SetModelColor(m_colDecal);
    SetDecalTexture();

    try {
      GetModelObject()->mo_toTexture.SetData_t(m_fnmDecalTexture);
    } catch (char *strError) {
      WarningMessage(strError);
    }

    ParentToNearestPolygonAndStretch();

    // spawn in world editor
    autowait(0.1f);

    return;
  }
};
