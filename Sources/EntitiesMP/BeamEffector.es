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

1030
%{
#include "StdH.h"
%}

class CBeamEffector: CMovableModelEntity {
name      "Beam Effector";
thumbnail "Thumbnails\\BeamEffector.tbn";
features  "HasName", "HasDescription", "IsTargetable";
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
 10 BOOL m_bActive                "Active" 'V' = TRUE,

{
  CTextureObject m_toBeam;
}

components:
  1 model   MODEL_MARKER              "Models\\Editor\\Axis.mdl",
  2 texture TEXTURE_MARKER            "Models\\Editor\\Vector.tex",

functions:

  // particles
  void RenderParticles(void)
  {
    if(m_penStartPos==NULL) { return; }
    if(m_penEndPos==NULL) { return; }
    if(m_fnmBeamTexture=="") { return; }

    if(!m_bActive)
    {
      return;
    }

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

  // returns bytes of memory used by this object
  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CBeamEffector) - sizeof(CMovableModelEntity) + CMovableModelEntity::GetUsedMemory();
    // add some more
    slUsedMemory += m_strName.Length();
    slUsedMemory += m_strDescription.Length();
    slUsedMemory += m_fnmBeamTexture.Length();
    return slUsedMemory;
  }

/************************************************************
 *                          MAIN                            *
 ************************************************************/

procedures:

  Active() {
    ASSERT(m_bActive);

    //main loop
    wait() {
      on (EBegin) : { 
        resume;
      }
      // if deactivated
      on (EDeactivate) : {
        // go to inactive state
        m_bActive = FALSE;
        jump Inactive();
      }
    }
  };

  Inactive() {
    ASSERT(!m_bActive);
    while (TRUE) {
      // wait 
      wait() {
        // if activated
        on (EActivate) : {
          // go to active state
          m_bActive = TRUE;
          jump Active();
        }
        otherwise() : {
          resume;
        };
      };
      
      // wait a bit to recover
      autowait(0.1f);
    }
  }

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

    // go into active or inactive state
    if (m_bActive) {
      jump Active();
    } else {
      jump Inactive();
    }

    return;
  }
};