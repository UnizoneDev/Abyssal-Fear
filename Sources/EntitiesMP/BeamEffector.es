/* Copyright (c) 2021-2023 Uni Musuotankarep
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

1030
%{
#include "StdH.h"
%}

class CBeamEffector: CMovableModelEntity {
name      "Beam Effector";
thumbnail "Thumbnails\\BeamEffector.tbn";
properties:

  1 CTString m_strName            "Name" 'N' = "Beam Effector",
  2 CTString m_strDescription = "",

  3 CTFileName m_fnmBeamTexture  "Beam Texture" 'T' = CTString(""),
  4 CEntityPointer m_penStartPos "Start Target" COLOR(C_GREEN|0xFF),
  5 CEntityPointer m_penEndPos "End Target" COLOR(C_RED|0xFF),
  6 INDEX m_iRays "Ray Amount" = 1,
  7 FLOAT m_fSize "Ray Size" = 1.0f,
  8 FLOAT m_fPower "Ray Power" = 1.0f,
  9 FLOAT m_fKneeDivider "Ray Knee Divider" = 5.0f,

{
  CTextureObject m_toBeam;
}

components:
  1 model   MODEL_MARKER              "Models\\Editor\\Axis.mdl",
  2 texture TEXTURE_MARKER            "Models\\Editor\\Vector.tex",

functions:

  const CTString &GetDescription(void) const {
    ((CTString&)m_strDescription).PrintF("-><none>");
    if (m_penStartPos!=NULL) {
      ((CTString&)m_strDescription).PrintF("->%s", m_penStartPos->GetName());
    }
    return m_strDescription;
  }

  // particles
  void RenderParticles(void)
  {
    if(m_penStartPos==NULL) { return; }
    if(m_penEndPos==NULL) { return; }

    // Passed by reference, do '&m_toBeam' to pass by pointer
    Particles_GenericBeam(&m_toBeam, m_penStartPos->GetPlacement().pl_PositionVector, m_penEndPos->GetPlacement().pl_PositionVector, 
    m_iRays, m_fSize, m_fPower, m_fKneeDivider);
  };

  /* Read from stream. */
  void Read_t( CTStream *istr) // throw char *
  {
    CMovableModelEntity::Read_t(istr);
    // setup beam texture
    m_toBeam.SetData_t(m_fnmBeamTexture);
  }

  void SetBeamTexture(void)
  {
    try {
      m_toBeam.SetData_t(m_fnmBeamTexture);
    } catch (char *strError) {
      WarningMessage(TRANS("Cannot load beam texture: %s"), strError);
    }
  }

/************************************************************
 *                          MAIN                            *
 ************************************************************/

procedures:

  Main(EVoid)
  {
    // set appearance
    InitAsEditorModel();

    SetPhysicsFlags(EPF_MODEL_IMMATERIAL|EPF_MOVABLE);
    SetCollisionFlags(ECF_IMMATERIAL);
    SetFlags( GetFlags()|ENF_SEETHROUGH);

    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    // setup texture
    SetBeamTexture();

    return;
  }
};