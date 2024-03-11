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

1020
%{
#include "StdH.h"
#include "EntitiesMP/WorldSettingsController.h"
#include "EntitiesMP/BackgroundViewer.h"
%}

// type of overlay
enum OverlayImageType {
  1 OIT_STATIC  "Static",
  2 OIT_SHAKE   "Shake",
};

%{
BOOL _bOverlayLoaded = FALSE;
BOOL _bOverlayError = FALSE;
CTextureObject _toOverlayTexture;
%}

class COverlayHolder: CRationalEntity {
name      "OverlayHolder";
thumbnail "Thumbnails\\OverlayHolder.tbn";
features  "IsTargetable", "HasName", "IsImportant";

properties:

  1 CTString m_strName "Name" 'N' = "Overlay holder",
  2 CTString m_strDescription = "",
  3 CTFileName m_fnmOverlay "Overlay file" 'P' = CTString(""),
  4 FLOAT m_fYRatio "Vertical position ratio" 'Y' = 0.5f,
  5 FLOAT m_fXRatio "Horizontal position ratio" 'X' = 0.5f,
  6 FLOAT m_fOverlayStretch "Overlay stretch" 'S' = 1.0f,
  7 COLOR m_colOverlay "Overlay color" 'C' = C_WHITE,
  8 enum OverlayImageType m_oiType "Overlay type" 'O' = OIT_STATIC,
  9 FLOAT m_fShakeAmount "Shake amount" = 1.0f,

components:
  1 model   MODEL_MARKER     "Models\\Editor\\MessageHolder.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\MessageHolder.tex"

functions:
  const CTString &GetDescription(void) const {
    ((CTString&)m_strDescription).PrintF("%s", m_fnmOverlay.FileName());
    return m_strDescription;
  }

  BOOL ReloadData(void)
  {
    _bOverlayError = FALSE;
    if (!Overlay_On(m_fnmOverlay))
    {
      Overlay_Off();
      return FALSE;
    }    
    return TRUE;
  }

  BOOL LoadOneFile(const CTFileName &fnm)
  {
    if(fnm=="") { return FALSE; }
    try 
    {
      _toOverlayTexture.SetData_t(fnm);
      return TRUE;
    }
    catch (char *strError)
    {
      CPrintF("%s\n", strError);
      return FALSE;
    }
  }

  // turn text on
  BOOL Overlay_On(CTFileName fnPic)
  {
    return LoadOneFile(fnPic);
  }

  // turn text off
  void Overlay_Off(void)
  {
    _toOverlayTexture.SetData(NULL);
  }

  // render credits to given drawport
  FLOAT Overlay_Render(COverlayHolder *penThis, CDrawPort *pdp)
  {
    if (_bOverlayError) { return 0; }
    
    if (!_bOverlayLoaded) {
      if (!ReloadData()) {
        _bOverlayError = TRUE;
        return 0;
      }
      _bOverlayLoaded = TRUE;
      return 1;
    }

    CDrawPort *pdpCurr=pdp;
    pdp->Unlock();
    pdpCurr->Lock();

    CTextureData *ptd=(CTextureData *)_toOverlayTexture.GetData();
    
    FLOAT fResScale = (FLOAT)pdpCurr->GetHeight() / 480.0f;
    const MEX mexTexW = ptd->GetWidth();
    const MEX mexTexH = ptd->GetHeight();
    FLOAT fPicRatioW, fPicRatioH;
    if( mexTexW > mexTexH) {
      fPicRatioW = mexTexW/mexTexH;
      fPicRatioH = 1.0f;
    } else {
      fPicRatioW = 1.0f;
      fPicRatioH = mexTexH/mexTexW;
    }
    PIX picW = 128*m_fOverlayStretch*fResScale*fPicRatioW;
    PIX picH = 128*m_fOverlayStretch*fResScale*fPicRatioH;

    FLOAT fXCenter = m_fXRatio * pdpCurr->GetWidth();
    FLOAT fYCenter = m_fYRatio * pdpCurr->GetHeight();
    PIXaabbox2D boxScr=PIXaabbox2D(
      PIX2D(fXCenter-picW/2, fYCenter-picH/2),
      PIX2D(fXCenter+picW/2, fYCenter+picH/2) );
    pdpCurr->PutTexture(&_toOverlayTexture, boxScr, m_colOverlay);

    pdpCurr->Unlock();
    pdp->Lock();

    return 1;
  }


procedures:

  Main()
  {
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    autowait(0.05f);

    if( !Overlay_On(m_fnmOverlay))
    {
      Overlay_Off();
      return;
    }
    _bOverlayError = FALSE;

    wait() {
      on (EBegin): 
      {
        resume;
      }
      on (EStart eStart): 
      {
        CWorldSettingsController *pwsc = GetWSC(this);
        if( pwsc!=NULL)
        {
          EOverlayFX eolx;
          eolx.bStart=TRUE;
          eolx.penSender=this;
          pwsc->SendEvent(eolx);
        }
        resume;
      }
      on (EStop eStop): 
      {
        CWorldSettingsController *pwsc = GetWSC(this);
        if( pwsc!=NULL)
        {
          EOverlayFX eolx;
          eolx.bStart=FALSE;
          eolx.penSender=this;
          pwsc->SendEvent(eolx);
        }
        resume;
      }
      on (EReturn): 
      {
        resume;
      }
    }
    Overlay_Off();
    return;
  }
};

