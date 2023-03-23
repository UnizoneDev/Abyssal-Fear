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

#include "StdAfx.h"
#include "LCDDrawing.h"
#define DECL_DLL
#include "EntitiesMP/Common/Particles.h"

#include "Models/NPCs/Gunman/Gunman.h"
#include "Models/NPCs/Abomination/Abomination.h"
#include "Models/NPCs/BlackStickman/BlackStickman.h"

#include "Models/Weapons/Knife/KnifeWeapon.h"
#include "Models/Weapons/Pistol/PistolItem.h"
#include "Models/Weapons/Axe/AxeWeapon.h"

#define PARTICLES_NONE            (0L)
#define PARTICLES_AIR_ELEMENTAL   (1L<<1)
#define PARTICLES_LAVA_ELEMENTAL  (1L<<2)

// model's data
static CModelObject _moModel;
static CModelObject _moFloor;
static CPlacement3D _plModel;
static ANGLE3D _aRotation;
static BOOL _bHasFloor = FALSE;
static FLOAT _fFloorY = 0.0f;
static FLOAT _fFOV = 90.0f;
static FLOAT3D _vLightDir = FLOAT3D( -0.2f, -0.2f, -0.2f);
static COLOR _colLight = C_GRAY;
static COLOR _colAmbient = C_vdGRAY;
static COLOR _iParticleType = PARTICLES_NONE;


// model setting values
static CTString _strLastModel = "";
static BOOL _bModelOK = FALSE;

extern FLOAT _fMsgAppearFade;

CModelObject *AddAttachment_t(CModelObject *pmoParent, INDEX iPosition,
   const CTFileName &fnmModel, INDEX iAnim,
   const CTFileName &fnmTexture,
   const CTFileName &fnmReflection=CTFILENAME(""),
   const CTFileName &fnmSpecular=CTFILENAME(""))
{
  CAttachmentModelObject *pamo = pmoParent->AddAttachmentModel(iPosition);
  ASSERT(pamo!=NULL);
  pamo->amo_moModelObject.SetData_t(fnmModel);
  pamo->amo_moModelObject.PlayAnim(iAnim, AOF_LOOPING);
  pamo->amo_moModelObject.mo_toTexture.SetData_t(fnmTexture);
  pamo->amo_moModelObject.mo_toReflection.SetData_t(fnmReflection);
  pamo->amo_moModelObject.mo_toSpecular.SetData_t(fnmSpecular);
  return &pamo->amo_moModelObject;
}

extern void SetupCompModel_t(const CTString &strName)
{
  CModelObject *pmo = &_moModel;
  _aRotation = ANGLE3D(0,0,0);
  _bHasFloor = FALSE;
  _fFloorY = 0.0f;
  _fFOV = 90.0f;
  _vLightDir = FLOAT3D( -0.2f, -0.2f, -0.2f);
  _colLight = C_GRAY;
  _colAmbient = C_vdGRAY;
  _iParticleType = PARTICLES_NONE;
  _moFloor.SetData_t(CTFILENAME("ModelsMP\\Computer\\Floor.mdl"));
  _moFloor.mo_toTexture.SetData_t(CTFILENAME("Models\\Computer\\Floor.tex"));
  pmo->mo_colBlendColor = 0xFFFFFFFF;
  if (strName=="Gunman") {
    pmo->SetData_t(CTFILENAME("Models\\NPCs\\Gunman\\Gunman.mdl"));
    pmo->PlayAnim(GUNMAN_ANIM_WALK, AOF_LOOPING);
    pmo->mo_toTexture.SetData_t(CTFILENAME("Models\\NPCs\\Gunman\\Gunman.tex"));
    _plModel = CPlacement3D(FLOAT3D(0,-1.0,-1.75), ANGLE3D(210,0,0));

    AddAttachment_t(pmo, GUNMAN_ATTACHMENT_PISTOL,
      CTFILENAME("Models\\Weapons\\Pistol\\PistolItem.mdl"), 0,
      CTFILENAME("Models\\Weapons\\Pistol\\Pistol.tex"));
    pmo->StretchModel(FLOAT3D(1.25f,1.25f,1.25f));
    _bHasFloor = TRUE;

  } else if (strName=="Abomination") {
    pmo->SetData_t(CTFILENAME("Models\\NPCs\\Abomination\\Abomination.mdl"));
    pmo->PlayAnim(ABOMINATION_ANIM_WALK, AOF_LOOPING);
    pmo->mo_toTexture.SetData_t(CTFILENAME("Models\\NPCs\\Abomination\\Abomination.tex"));
    _plModel = CPlacement3D(FLOAT3D(0,-1.0,-1.75), ANGLE3D(210,0,0));

    pmo->StretchModel(FLOAT3D(1.25f,1.25f,1.25f));
    _bHasFloor = TRUE;

  } else if (strName=="AbominationGlutton") {
    pmo->SetData_t(CTFILENAME("Models\\NPCs\\Abomination\\Abomination.mdl"));
    pmo->PlayAnim(ABOMINATION_ANIM_WALK, AOF_LOOPING);
    pmo->mo_toTexture.SetData_t(CTFILENAME("Models\\NPCs\\Abomination\\AbominationStrong.tex"));
    _plModel = CPlacement3D(FLOAT3D(0, -1.0, -1.75), ANGLE3D(210, 0, 0));

    pmo->StretchModel(FLOAT3D(1.25f, 1.25f, 1.25f));
    _bHasFloor = TRUE;

  } else if (strName=="Knife") {
    pmo->SetData_t(CTFILENAME("Models\\Weapons\\Knife\\KnifeWeapon.mdl"));
    pmo->mo_toTexture.SetData_t(CTFILENAME("Models\\Weapons\\Knife\\KnifeWeapon.tex"));
    pmo->PlayAnim(KNIFEWEAPON_ANIM_DEFAULT, AOF_LOOPING);
    _plModel = CPlacement3D(FLOAT3D(0,-0.5f,-2.0), ANGLE3D(0,10,0));
    _aRotation = ANGLE3D(100,0,0);

    pmo->StretchModel(FLOAT3D(4,4,4));
    _bHasFloor = TRUE;
    _fFloorY = -1.0f;

  } else if (strName=="Pistol") {
    pmo->SetData_t(CTFILENAME("Models\\Weapons\\Pistol\\PistolItem.mdl"));
    pmo->mo_toTexture.SetData_t(CTFILENAME("Models\\Weapons\\Pistol\\Pistol.tex"));
    pmo->PlayAnim(PISTOLITEM_ANIM_DEFAULT, AOF_LOOPING);
    _plModel = CPlacement3D(FLOAT3D(0,-0.5f,-2.0), ANGLE3D(0,10,0));
    _aRotation = ANGLE3D(100,0,0);

    pmo->StretchModel(FLOAT3D(4,4,4));
    _bHasFloor = TRUE;
    _fFloorY = -1.0f;

  } else if (strName == "Axe") {
     pmo->SetData_t(CTFILENAME("Models\\Weapons\\Axe\\AxeWeapon.mdl"));
     pmo->mo_toTexture.SetData_t(CTFILENAME("Models\\Weapons\\Knife\\KnifeWeapon.tex"));
     pmo->PlayAnim(AXEWEAPON_ANIM_DEFAULT, AOF_LOOPING);
     _plModel = CPlacement3D(FLOAT3D(0, -0.5f, -2.0), ANGLE3D(0, 10, 0));
     _aRotation = ANGLE3D(100, 0, 0);

     pmo->StretchModel(FLOAT3D(4, 4, 4));
     _bHasFloor = TRUE;
     _fFloorY = -1.0f;

  } else {
    ThrowF_t(TRANS("Unknown model '%s'"), strName);
  }
}

void RenderMessageModel(CDrawPort *pdp, const CTString &strModel)
{
  // if new model
  if (_strLastModel!=strModel) {
    _strLastModel=strModel;
    _bModelOK = FALSE;
    // try to
    try {
      // load model
      SetupCompModel_t(strModel);
      _bModelOK = TRUE;
    // if failed
    } catch(char *strError) {
      // report error
      CPrintF("Cannot setup model '%s':\n%s\n", strModel, strError);
      // do nothing
      return;
    }
  }

  // if model is not loaded ok
  if (!_bModelOK) {
    // do nothing
    return;
  }

  // for each eye
  for (INDEX iEye=STEREO_LEFT; iEye<=(Stereo_IsEnabled()?STEREO_RIGHT:STEREO_LEFT); iEye++) {
    // prepare projection
    CRenderModel rm;
    CPerspectiveProjection3D pr;
    pr.FOVL() = AngleDeg(_fFOV);
    pr.ScreenBBoxL() = FLOATaabbox2D(
      FLOAT2D(0.0f, 0.0f),
      FLOAT2D((float)pdp->GetWidth(), (float)pdp->GetHeight())
    );
    pr.AspectRatioL() = 1.0f;
    pr.FrontClipDistanceL() = 0.3f;
    pr.ViewerPlacementL() = CPlacement3D(FLOAT3D(0,0,0), ANGLE3D(0,0,0));
  
    // setup stereo rendering
    Stereo_SetBuffer(iEye);
    Stereo_AdjustProjection(pr, iEye, 0.16f);

    pdp->FillZBuffer(1.0f);

    // initialize rendering
    CAnyProjection3D apr;
    apr = pr;
    BeginModelRenderingView(apr, pdp);
    rm.rm_vLightDirection = _vLightDir;
    const FLOAT fDistance = 1+ 10*(1/(_fMsgAppearFade+0.01) - 1/(1+0.01));

    // if model needs floor
    if( _bHasFloor) {
      // set floor's position
      CPlacement3D pl = _plModel;
      pl.pl_OrientationAngle = ANGLE3D(0,0,0);
      pl.pl_PositionVector   = _plModel.pl_PositionVector;
      pl.pl_PositionVector(2) += _fFloorY;
      pl.pl_PositionVector(3) *= fDistance;
      rm.SetObjectPlacement(pl);
      // render the floor
      rm.rm_colLight   = C_WHITE;
      rm.rm_colAmbient = C_WHITE;
      rm.rm_fDistanceFactor = -999;
      _moFloor.SetupModelRendering(rm);
      _moFloor.RenderModel(rm);
    }

    // set model's position
    CPlacement3D pl;
    pl.pl_OrientationAngle   = _plModel.pl_OrientationAngle + _aRotation*_pTimer->GetLerpedCurrentTick();
    pl.pl_PositionVector     = _plModel.pl_PositionVector;
    pl.pl_PositionVector(3) *= fDistance / pdp->dp_fWideAdjustment;
    rm.SetObjectPlacement(pl);

    // render the model
    rm.rm_colLight   = _colLight;
    rm.rm_colAmbient = _colAmbient;
    rm.rm_fDistanceFactor = -999; // force highest mip disregarding stretch factors
    _moModel.SetupModelRendering(rm);
    FLOATplane3D plFloorPlane = FLOATplane3D( FLOAT3D( 0.0f, 1.0f, 0.0f), _plModel.pl_PositionVector(2)+_fFloorY);
    CPlacement3D plLightPlacement = CPlacement3D( _plModel.pl_PositionVector
                                  + rm.rm_vLightDirection * _plModel.pl_PositionVector(3) *5, ANGLE3D(0,0,0));
    _moModel.RenderShadow( rm, plLightPlacement, 200.0f, 200.0f, 1.0f, plFloorPlane);
    _moModel.RenderModel(rm);

    // render particles
    if (_iParticleType!=PARTICLES_NONE) {
      Particle_PrepareSystem(pdp, apr);
      Particle_PrepareEntity( 1, 0, 0, NULL);
      switch(_iParticleType) {
      case PARTICLES_AIR_ELEMENTAL:
        Particles_AirElemental_Comp(&_moModel, 1.0f, 1.0f, pl);
        break;
      case PARTICLES_LAVA_ELEMENTAL:
        Particles_Burning_Comp(&_moModel, 0.25f, pl);
        break;
      }
      Particle_EndSystem();
    }

    EndModelRenderingView();
  }
  Stereo_SetBuffer(STEREO_BOTH);
}
