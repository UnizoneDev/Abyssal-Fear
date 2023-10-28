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

101
%{
#include "StdH.h"
%}

uses "EntitiesMP/MovingBrushMarker";
uses "EntitiesMP/SoundHolder";
uses "EntitiesMP\MirrorMarker";
uses "EntitiesMP/Debris";

event EHit {
};
event EBrushDestroyed { // sent to all children of a moving brush when it is destroyed
};

enum BlockAction {
  0 BA_NONE         "None",         // continue moving
  1 BA_BOUNCE       "Bounce",       // bounce when obstructed
  2 BA_SKIPMARKER   "Skip marker",  // skip moving to next marker
};

enum BrushDebrisType {
  0 BDT_STONE1       "Stone 1",
  1 BDT_STONE2       "Stone 2",
  2 BDT_STONE3       "Stone 3",
  3 BDT_WOOD1        "Tan Wood",
  4 BDT_WOOD2        "Brown Wood",
  5 BDT_WOOD3        "White Wood",
  6 BDT_WOOD4        "Grey Wood",
  7 BDT_METAL1       "Grey Metal",
  8 BDT_METAL2       "Grey Metal 2",
  9 BDT_METAL3       "Grey Metal 3",
 10 BDT_METAL4       "Grey Metal 4",
 11 BDT_GLASS1       "White Glass",
 12 BDT_GLASS2       "Turquoise Glass",
 13 BDT_CRETE1       "Grey Concrete",
 14 BDT_CRETE2       "Tan Concrete",
 15 BDT_CRETE3       "Green Concrete",
 16 BDT_CRETE4       "Grey Concrete 2",
 17 BDT_CRETE5       "Brown Concrete",
};

enum TouchOrDamageEvent {
  0 TDE_TOUCHONLY   "Touch Only", 
  1 TDE_DAMAGEONLY  "Damage Only", 
  2 TDE_BOTH        "Both", 
};

%{
static const float TRANSLATION_EPSILON=0.05f;
static const float ROTATION_EPSILON=0.05f;
extern void GetDefaultForce(INDEX iForce, const FLOAT3D &vPoint, 
    CForceStrength &fsGravity, CForceStrength &fsField);
%}

class CMovingBrush : CMovableBrushEntity {
name      "Moving Brush";
thumbnail "Thumbnails\\MovingBrush.tbn";
features  "HasName", "IsTargetable";

properties:

  1 CTString m_strName            "Name" 'N' = "Moving Brush",
  2 CTString m_strDescription = "",
  
  3 CEntityPointer m_penTarget    "Target" 'T' COLOR(C_BLUE|0xFF),
  4 BOOL m_bAutoStart             "Auto start" 'A' = FALSE,
  5 FLOAT m_fSpeed                "Speed" 'S' = 1.0f,
  6 FLOAT m_fWaitTime             "Wait time" 'W' = 0.0f,
  7 BOOL m_bMoveOnTouch           "Move on touch" 'M' = FALSE,
  8 enum BlockAction m_ebaAction  "Block action" 'B' = BA_NONE,
  9 FLOAT m_fBlockDamage          "Block damage" 'D' = 10.0f,
 10 BOOL m_bPlayersOnly           "Players Only" 'P' = TRUE,
 11 BOOL m_bDynamicShadows        "Dynamic shadows" = FALSE,
 12 BOOL m_bVeryBigBrush          "Very Big Brush" = FALSE,

 // send event on touch
 13 enum EventEType m_eetTouchEvent "Touch Event - Type" 'U' = EET_IGNORE,  // type of event to send
 14 CEntityPointer m_penTouchEvent  "Touch Event - Target" 'I' COLOR(C_dCYAN|0xFF),            // target to send event to
 19 enum TouchOrDamageEvent m_tdeSendEventOnDamage "Send touch event on damage" = TDE_TOUCHONLY,

 15 CEntityPointer m_penSwitch "Switch",  // for switch relaying

 // send event on marker
 16 enum EventEType m_eetMarkerEvent = EET_IGNORE,
 17 CEntityPointer m_penMarkerEvent,

 // rotation
 18 FLOAT m_tmBankingRotation "Banking rotation speed" = 0.0f, // set if only banking rotation
 102 FLOAT m_tmHeadingRotation "Heading rotation speed" = 0.0f, // set if only heading rotation
 103 FLOAT m_tmPitchRotation "Pitch rotation speed" = 0.0f, // set if only pitch rotation

 // class properties
 20 BOOL m_bMoving = FALSE,           // the brush is moving
 78 BOOL m_bRotating = FALSE,         // the brush is rotating
 79 BOOL m_bForceStop = FALSE,        // the brush should stop immediately
 80 BOOL m_bNoRotation = FALSE,       // don't rotate to marker orientation
 21 FLOAT3D m_vDesiredTranslation = FLOAT3D(0,0,0),    // desired translation
 22 ANGLE3D m_aDesiredRotation = FLOAT3D(0,0,0),       // desired rotation
 23 BOOL m_bInverseRotate = FALSE,    // use inverse rotation to target
 24 BOOL m_bStopMoving = FALSE,       // stop moving brush on next target
 25 BOOL m_bMoveToMarker = FALSE,     // PerMoving acknowledge od brush moving
 26 BOOL m_bSkipMarker = FALSE,       // when obstructed skip next marker (actually stop moving)
 27 BOOL m_bValidMarker = FALSE,      // internal for moving through valid markers
 
 // moving limits
 30 FLOAT m_fXLimitSign = 0.0f,
 31 FLOAT m_fYLimitSign = 0.0f,
 32 FLOAT m_fZLimitSign = 0.0f,
 33 ANGLE m_aHLimitSign = 0.0f,
 34 ANGLE m_aPLimitSign = 0.0f,
 35 ANGLE m_aBLimitSign = 0.0f,

 // continuous speed change
 40 FLOAT3D m_vStartTranslation = FLOAT3D(0,0,0),  // start translation
 41 ANGLE3D m_aStartRotation = ANGLE3D(0,0,0),     // start rotation
 42 FLOAT m_fCourseLength = 0.0f,        // course length
 43 ANGLE m_aHeadLenght = 0.0f,          // head lenght  
 44 ANGLE m_aPitchLenght = 0.0f,         // pitch lenght
 45 ANGLE m_aBankLenght = 0.0f,          // bank lenght

 // sound target
 50 CEntityPointer m_penSoundStart    "Sound start entity" 'Q',   // sound start entity
 51 CEntityPointer m_penSoundStop     "Sound stop entity" 'Z',    // sound stop entity
 52 CEntityPointer m_penSoundFollow   "Sound follow entity" 'F',  // sound follow entity
 53 CSoundObject m_soStart,
 54 CSoundObject m_soStop,
 55 CSoundObject m_soFollow,


 60 CEntityPointer m_penMirror0 "Mirror 0" 'M',
 61 CEntityPointer m_penMirror1 "Mirror 1",
 62 CEntityPointer m_penMirror2 "Mirror 2",
 63 CEntityPointer m_penMirror3 "Mirror 3",
 64 CEntityPointer m_penMirror4 "Mirror 4",

 65 FLOAT m_fHealth             "Health" 'H' = -1.0f,
 // send event on touch
 67 enum EventEType m_eetBlowupEvent "Blowup Event - Type" = EET_IGNORE,  // type of event to send
 68 CEntityPointer m_penBlowupEvent  "Blowup Event - Target" COLOR(C_BLACK|0xFF),            // target to send event to
 69 BOOL m_bZoning              "Zoning"     'Z' =FALSE,
 70 BOOL m_bMoveOnDamage "Move on damage" = FALSE,    // move when recive damage
 71 FLOAT m_fTouchDamage        "Touch damage" = 0.0f,
 72 COLOR m_colDebrises         "Color of debrises" = C_WHITE,
 74 INDEX m_ctDebrises          "Debris count" = 12,
 75 FLOAT m_fCandyEffect        "Debris blow power" = 0.0f,
 76 FLOAT m_fCubeFactor         "Cube factor" = 1.0f,
 77 BOOL m_bBlowupByDamager     "Blowup by Damager" = FALSE,   // if only damager can destroy brush

 81 flags ClasificationBits m_cbClassificationBits "Clasification bits" 'C' = 0,
 82 flags VisibilityBits m_vbVisibilityBits "Visibility bits" 'V' = 0,

 100 enum BrushDebrisType m_bdtDebrisType "Debris Type" = BDT_STONE1,
 101 BOOL m_bBlowupByAnything "Blowup by anything" = FALSE,


components:

// ************** DEBRIS PARTS **************
 14 model     MODEL_STONE        "Models\\Effects\\Debris\\StoneDebris.mdl",
 15 model     MODEL_WOOD         "Models\\Effects\\Debris\\WoodDebris.mdl",
 16 model     MODEL_METAL        "Models\\Effects\\Debris\\MetalDebris.mdl",
 17 model     MODEL_GLASS        "Models\\Effects\\Debris\\GlassDebris.mdl",

 20 texture   TEXTURE_STONE1     "Models\\Effects\\Debris\\StoneDebris.tex",
 21 texture   TEXTURE_STONE2     "Models\\Effects\\Debris\\StoneDebris2.tex",
 22 texture   TEXTURE_STONE3     "Models\\Effects\\Debris\\StoneDebris3.tex",
 23 texture   TEXTURE_CRETE1     "Models\\Effects\\Debris\\CreteDebris.tex",
 24 texture   TEXTURE_CRETE2     "Models\\Effects\\Debris\\CreteDebris2.tex",
 25 texture   TEXTURE_CRETE3     "Models\\Effects\\Debris\\CreteDebris3.tex",
 26 texture   TEXTURE_CRETE4     "Models\\Effects\\Debris\\CreteDebris4.tex",
 27 texture   TEXTURE_CRETE5     "Models\\Effects\\Debris\\CreteDebris5.tex",

 28 texture   TEXTURE_GLASS1     "Models\\Effects\\Debris\\GlassDebris.tex",
 29 texture   TEXTURE_GLASS2     "Models\\Effects\\Debris\\GlassDebris2.tex",

 30 texture   TEXTURE_WOOD1      "Models\\Effects\\Debris\\WoodDebris.tex",
 31 texture   TEXTURE_WOOD2      "Models\\Effects\\Debris\\WoodDebris2.tex",
 32 texture   TEXTURE_WOOD3      "Models\\Effects\\Debris\\WoodDebris3.tex",
 33 texture   TEXTURE_WOOD4      "Models\\Effects\\Debris\\WoodDebris4.tex",

 34 texture   TEXTURE_METAL1     "Models\\Effects\\Debris\\MetalDebris.tex",
 35 texture   TEXTURE_METAL2     "Models\\Effects\\Debris\\MetalDebris2.tex",
 36 texture   TEXTURE_METAL3     "Models\\Effects\\Debris\\MetalDebris3.tex",
 37 texture   TEXTURE_METAL4     "Models\\Effects\\Debris\\MetalDebris4.tex",

 50 class     CLASS_DEBRIS       "Classes\\Debris.ecl",
  4 class     CLASS_BASIC_EFFECT "Classes\\BasicEffect.ecl",


functions:

 // get visibility tweaking bits
  ULONG GetVisTweaks(void)
  {
    return m_cbClassificationBits|m_vbVisibilityBits;
  }
 
 void Precache(void)
  {
    PrecacheClass(CLASS_DEBRIS);
    PrecacheModel(MODEL_STONE);
    PrecacheModel(MODEL_WOOD);
    PrecacheModel(MODEL_METAL);
    PrecacheModel(MODEL_GLASS);
    PrecacheTexture(TEXTURE_STONE1);
    PrecacheTexture(TEXTURE_STONE2);
    PrecacheTexture(TEXTURE_STONE3);
    PrecacheTexture(TEXTURE_CRETE1);
    PrecacheTexture(TEXTURE_CRETE2);
    PrecacheTexture(TEXTURE_CRETE3);
    PrecacheTexture(TEXTURE_CRETE4);
    PrecacheTexture(TEXTURE_CRETE5);

    PrecacheTexture(TEXTURE_METAL1);
    PrecacheTexture(TEXTURE_METAL2);
    PrecacheTexture(TEXTURE_METAL3);
    PrecacheTexture(TEXTURE_METAL4);

    PrecacheTexture(TEXTURE_WOOD1);
    PrecacheTexture(TEXTURE_WOOD2);
    PrecacheTexture(TEXTURE_WOOD3);
    PrecacheTexture(TEXTURE_WOOD4);

    PrecacheTexture(TEXTURE_GLASS1);
    PrecacheTexture(TEXTURE_GLASS2);
  }
  /* Get force in given point. */
  void GetForce(INDEX iForce, const FLOAT3D &vPoint, 
    CForceStrength &fsGravity, CForceStrength &fsField)
  {
    GetDefaultForce(iForce, vPoint, fsGravity, fsField);
  }
  /* Receive damage */
  void ReceiveDamage(CEntity *penInflictor, enum DamageType dmtType,
    FLOAT fDamageAmmount, const FLOAT3D &vHitPoint, const FLOAT3D &vDirection, enum DamageBodyPartType dbptType) 
  {
    if( m_bMoveOnDamage)
    {
      EHit eHit;
      SendEvent( eHit);
      return;
    }

    // send event on damage
    if(m_tdeSendEventOnDamage!=TDE_TOUCHONLY && CanReactOnEntity(penInflictor)) {
      SendToTarget(m_penTouchEvent, m_eetTouchEvent, penInflictor);
    }

    // if not destroyable
    if(m_fHealth<0) {
      // ignore damages
      return;
    }

    // if special feature for damager entity
    if(m_bBlowupByDamager)
    {
      if( dmtType == DMT_DAMAGER)
      {
        CMovableBrushEntity::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
      }
    }
    else if(m_bBlowupByAnything)
    {
      // react to weapon damage
      if( (dmtType == DMT_EXPLOSION)  ||
          (dmtType == DMT_PROJECTILE) ||
          (dmtType == DMT_CANNONBALL) ||
          (dmtType == DMT_CLOSERANGE) ||
          (dmtType == DMT_BULLET) ||
          (dmtType == DMT_IMPACT) ||
          (dmtType == DMT_PELLET) ||
          (dmtType == DMT_AXE)    ||
          (dmtType == DMT_BLUNT)  ||
          (dmtType == DMT_SHARP)  ||
          (dmtType == DMT_RIFLE) )
      {
        CMovableBrushEntity::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
      }
    }
    else
    {
      // react only on explosions
      if( (dmtType == DMT_EXPLOSION) ||
          (dmtType == DMT_PROJECTILE) ||
          (dmtType == DMT_CANNONBALL) )
      {
        CMovableBrushEntity::ReceiveDamage(penInflictor, dmtType, fDamageAmmount, vHitPoint, vDirection, dbptType);
      }
    }
  };

  // adjust angle
  void AdjustAngle(ANGLE &a) {
    if (m_bInverseRotate) {
      if (a>0) { a = a - 360; }
      else if (a<0) { a = 360 + a; }
    }
  };


  /* Check if entity is moved on a route set up by its targets. */
  BOOL MovesByTargetedRoute(CTString &strTargetProperty) const {
    strTargetProperty = "Target";
    return TRUE;
  };
  /* Check if entity can drop marker for making linked route. */
  BOOL DropsMarker(CTFileName &fnmMarkerClass, CTString &strTargetProperty) const {
    fnmMarkerClass = CTFILENAME("Classes\\MovingBrushMarker.ecl");
    strTargetProperty = "Target";
    return TRUE;
  }
  const CTString &GetDescription(void) const {
    ((CTString&)m_strDescription).PrintF("-><none>");
    if (m_penTarget!=NULL) {
      ((CTString&)m_strDescription).PrintF("->%s", m_penTarget->GetName());
    }
    return m_strDescription;
  }
  /* Get mirror type name, return empty string if not used. */
  const CTString &GetMirrorName(INDEX iMirror)
  {
    static const CTString strDummyName("");
    static const CTString strMarkerUnused("Marker not set");
    if (iMirror==0) {
      return strDummyName;
    }

    switch (iMirror) {
    case 1: { static const CTString str("std mirror 1"); return str; }; break;
    case 2: { static const CTString str("std mirror 2"); return str; }; break;
    case 3: { static const CTString str("std mirror 3"); return str; }; break;
    case 4: { static const CTString str("std mirror 4"); return str; }; break;
    case 5: { static const CTString str("std mirror 5"); return str; }; break;
    case 6: { static const CTString str("std mirror 6"); return str; }; break;
    case 7: { static const CTString str("std mirror 7"); return str; }; break;
    case 8: { static const CTString str("std mirror 8"); return str; }; break;
    default: {
      iMirror-=9;
      INDEX ctMirrorMarkers = &m_penMirror4-&m_penMirror0;
      if (iMirror<ctMirrorMarkers){
        CMirrorMarker *pfm = (CMirrorMarker *)&*(&m_penMirror0)[iMirror];
        if (pfm != NULL) {
          return pfm->GetMirrorName();
        } else {
          return strMarkerUnused;
        }
      }
             }
    }
    return strDummyName;
  }

  /* Get mirror, return FALSE for none. */
  BOOL GetMirror(INDEX iMirror, class CMirrorParameters &mpMirror)
  {
    if (iMirror==0) {
      return FALSE;
    }
    if (iMirror>=1 && iMirror<=8) {
      mpMirror.mp_ulFlags = 0;
      return TRUE;
    }
    iMirror-=9;
    INDEX ctMirrorMarkers = &m_penMirror4-&m_penMirror0;
    if (iMirror<ctMirrorMarkers){
      CMirrorMarker *pmm = (CMirrorMarker *)&*(&m_penMirror0)[iMirror];
      if (pmm != NULL) {
        pmm->GetMirror(mpMirror);
        return TRUE;
      }
    }
    return FALSE;
  }

  // pre moving
  void PreMoving() {
    if (m_bMoveToMarker) {
      const FLOAT3D &vTarget = m_penTarget->GetPlacement().pl_PositionVector;
      const ANGLE3D &aTarget = m_penTarget->GetPlacement().pl_OrientationAngle;
      const FLOAT3D &vSource = GetPlacement().pl_PositionVector;
      const ANGLE3D &aSource = GetPlacement().pl_OrientationAngle;

      // translation
      FLOAT3D vSpeed = (vTarget-vSource)/_pTimer->TickQuantum;
      // X axis
      if (Abs(vSpeed(1))<TRANSLATION_EPSILON) {
        vSpeed(1) = 0.0f;
      } else if ((vSpeed(1)-m_vDesiredTranslation(1))*m_fXLimitSign>0) {
        vSpeed(1) = m_vDesiredTranslation(1);
      }
      // Y axis
      if (Abs(vSpeed(2))<TRANSLATION_EPSILON) {
        vSpeed(2) = 0.0f;
      } else if ((vSpeed(2)-m_vDesiredTranslation(2))*m_fYLimitSign>0) {
        vSpeed(2) = m_vDesiredTranslation(2);
      }
      // Z axis
      if (Abs(vSpeed(3))<TRANSLATION_EPSILON) {
        vSpeed(3) = 0.0f;
      } else if ((vSpeed(3)-m_vDesiredTranslation(3))*m_fZLimitSign>0) {
        vSpeed(3) = m_vDesiredTranslation(3);
      }

      // rotation
      ANGLE3D aSpeed;
      aSpeed(1) = NormalizeAngle(aTarget(1)-aSource(1));      // normalize angle
      AdjustAngle(aSpeed(1));                                 // adjust angle (inverse rotation)
      aSpeed(1) = Abs(aSpeed(1)) * m_aHLimitSign;             // set sign (direction)
      aSpeed(1) /= _pTimer->TickQuantum;                      // transform to tick speed
      aSpeed(2) = NormalizeAngle(aTarget(2)-aSource(2));
      AdjustAngle(aSpeed(2));
      aSpeed(2) = Abs(aSpeed(2)) * m_aPLimitSign;
      aSpeed(2) /= _pTimer->TickQuantum;
      aSpeed(3) = NormalizeAngle(aTarget(3)-aSource(3));
      AdjustAngle(aSpeed(3));
      aSpeed(3) = Abs(aSpeed(3)) * m_aBLimitSign;
      aSpeed(3) /= _pTimer->TickQuantum;
      // Heading
      if (Abs(aSpeed(1))<ROTATION_EPSILON) {
        aSpeed(1) = 0.0f;
      } else if ((aSpeed(1)-m_aDesiredRotation(1))*m_aHLimitSign>0) {
        aSpeed(1) = m_aDesiredRotation(1);
      }
      // Pitch
      if (Abs(aSpeed(2))<ROTATION_EPSILON) {
        aSpeed(2) = 0.0f;
      } else if ((aSpeed(2)-m_aDesiredRotation(2))*m_aPLimitSign>0) {
        aSpeed(2) = m_aDesiredRotation(2);
      }
      // Banking
      if (Abs(aSpeed(3))<ROTATION_EPSILON) {
        aSpeed(3) = 0.0f;
      } else if ((aSpeed(3)-m_aDesiredRotation(3))*m_aBLimitSign>0) {
        aSpeed(3) = m_aDesiredRotation(3);
      }

      // stop moving ?
      if (vSpeed(1)==0.0f && vSpeed(2)==0.0f && vSpeed(3)==0.0f
       && ((m_tmBankingRotation!=0 || m_tmPitchRotation!=0 || m_tmHeadingRotation!=0 || m_bNoRotation)||
          (aSpeed(1)==0.0f && aSpeed(2)==0.0f && aSpeed(3)==0.0f)) ) 
      {
        // stop brush
        ForceFullStop();
        // stop PreMoving check
        m_bMoveToMarker = FALSE;
        // this EEnd event will end MoveToMarker autowait() and return to MoveBrush
        SendEvent(EEnd());

      // move brush
      } else {
        SetDesiredTranslation(vSpeed);
        if (m_bRotating) {
          MaybeActivateRotation();
        } else if ((!m_tmBankingRotation || !m_tmPitchRotation || !m_tmHeadingRotation) && !m_bNoRotation) {
          SetDesiredRotation(aSpeed);
        } else {
          SetDesiredRotation(ANGLE3D(0,0,0));
        }
      }

    }
    CMovableBrushEntity::PreMoving();
  };


  // load marker parameters
  BOOL LoadMarkerParameters() {
    if (m_penTarget==NULL) {
      return FALSE;
    }

    if (!IsOfClass(m_penTarget, "Moving Brush Marker")) {
      WarningMessage("Entity '%s' is not of Moving Brush Marker class!", m_penTarget->GetName());
      return FALSE;
    }

    CMovingBrushMarker &mbm = (CMovingBrushMarker&) *m_penTarget;
    if (mbm.m_penTarget==NULL) {
      return FALSE;
    }

    // speed
    if (mbm.m_fSpeed > 0.0f) { m_fSpeed = mbm.m_fSpeed; }

    // wait time
    if (mbm.m_fWaitTime >= 0.0f) { m_fWaitTime = mbm.m_fWaitTime; }

    // inverse rotate
    m_bInverseRotate = mbm.m_bInverseRotate;
    
    // move on touch
    SetBoolFromBoolEType(m_bMoveOnTouch, mbm.m_betMoveOnTouch);

    // stop moving
    m_bStopMoving = mbm.m_bStopMoving;

    // block damage
    if (mbm.m_fBlockDamage >= 0.0f) {
      m_fBlockDamage = mbm.m_fBlockDamage;
    }

    // touch event
    if (mbm.m_penTouchEvent != NULL) {
      m_penTouchEvent = mbm.m_penTouchEvent;
      m_eetTouchEvent = mbm.m_eetTouchEvent;
    }

    // marker event -> SEND ALWAYS (if target is valid) !!!
    SendToTarget(mbm.m_penMarkerEvent, mbm.m_eetMarkerEvent);

    // sound entity
    if (mbm.m_penSoundStart!=NULL) {
      m_penSoundStart = mbm.m_penSoundStart;
    }
    if (mbm.m_penSoundStop!=NULL) {
      m_penSoundStop = mbm.m_penSoundStop;
    }
    if (mbm.m_penSoundFollow!=NULL) {
      m_penSoundFollow = mbm.m_penSoundFollow;
    }

    m_bNoRotation = mbm.m_bNoRotation;

    if (mbm.m_tmBankingRotation>=0.0f) {
      m_tmBankingRotation = mbm.m_tmBankingRotation;
      if (!mbm.m_bBankingClockwise) {
        m_tmBankingRotation *= -1;
      }
    }

    if (mbm.m_tmHeadingRotation>=0.0f) {
      m_tmHeadingRotation = mbm.m_tmHeadingRotation;
      if (!mbm.m_bHeadingClockwise) {
        m_tmHeadingRotation *= -1;
      }
    }

    if (mbm.m_tmPitchRotation>=0.0f) {
      m_tmPitchRotation = mbm.m_tmPitchRotation;
      if (!mbm.m_bPitchClockwise) {
        m_tmPitchRotation *= -1;
      }
    }

    return TRUE;
  };


  // test if this door reacts on this entity
  BOOL CanReactOnEntity(CEntity *pen)
  {
    if (pen==NULL) {
      return FALSE;
    }
    // never react on non-live or dead entities
    if (!(pen->GetFlags()&ENF_ALIVE)) {
      return FALSE;
    }

    if (m_bPlayersOnly && !IsDerivedFromClass(pen, "Player")) {
      return FALSE;
    }

    return TRUE;
  }

  // play start sound
  void PlayStartSound(void) {
    // if sound entity exists
    if (m_penSoundStart!=NULL) {
      CSoundHolder &sh = (CSoundHolder&)*m_penSoundStart;
      m_soStart.Set3DParameters(FLOAT(sh.m_rFallOffRange), FLOAT(sh.m_rHotSpotRange), sh.m_fVolume, sh.m_fPitch);
      PlaySound(m_soStart, sh.m_fnSound, sh.m_iPlayType);
    }
  };

  // play stop sound
  void PlayStopSound(void) {
    // if sound entity exists
    if (m_penSoundStop!=NULL) {
      CSoundHolder &sh = (CSoundHolder&)*m_penSoundStop;
      m_soStop.Set3DParameters(FLOAT(sh.m_rFallOffRange), FLOAT(sh.m_rHotSpotRange), sh.m_fVolume, sh.m_fPitch);
      PlaySound(m_soStop, sh.m_fnSound, sh.m_iPlayType);
    }
  };

  // play follow sound
  void PlayFollowSound(void) {
    // if sound entity exists
    if (m_penSoundFollow!=NULL) {
      CSoundHolder &sh = (CSoundHolder&)*m_penSoundFollow;
      m_soFollow.Set3DParameters(FLOAT(sh.m_rFallOffRange), FLOAT(sh.m_rHotSpotRange), sh.m_fVolume, sh.m_fPitch);
      PlaySound(m_soFollow, sh.m_fnSound, sh.m_iPlayType);
    }
  };

  // stop follow sound
  void StopFollowSound(void) {
    m_soFollow.Stop();
  };

  // stop start sound
  void StopStartSound(void) {
    m_soStart.Stop();
  };

  // stop stop sound
  void StopStopSound(void) {
    m_soStop.Stop();
  };


  void MovingOn(void)
  {
    if (m_bMoving) {
      return;
    }
    if (m_bVeryBigBrush) {
      SetCollisionFlags(ECF_BRUSH|ECF_IGNOREMODELS);
    }
    m_bMoving = TRUE;
  }
  void MovingOff(void)
  {
    if (!m_bMoving) {
      return;
    }
    if (m_bVeryBigBrush) {
      SetCollisionFlags(ECF_BRUSH);
    }
    m_bMoving = FALSE;
  }

  void MaybeActivateRotation(void)
  {
    if (m_tmHeadingRotation!=0 || m_tmPitchRotation!=0 || m_tmBankingRotation!=0) {
      m_bRotating = TRUE;
      SetDesiredRotation(ANGLE3D(360.0f/m_tmHeadingRotation,360.0f/m_tmPitchRotation,360.0f/m_tmBankingRotation));
    }
    else {
      m_bRotating = FALSE;
    }
  }

  void DeactivateRotation(void)
  {
    m_bRotating = FALSE;
    SetDesiredRotation(ANGLE3D(0.0f,0.0f,0.0f));  
  }

  void SetCombinedRotation(ANGLE3D aRotAngle, ANGLE3D aAddAngle)
  {
    aRotAngle(1) += aAddAngle(1);
    aRotAngle(2) += aAddAngle(2);
    aRotAngle(3) += aAddAngle(3);
  }


  // returns bytes of memory used by this object
  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CMovingBrush) - sizeof(CMovableBrushEntity) + CMovableBrushEntity::GetUsedMemory();
    // add some more
    slUsedMemory += m_strName.Length();
    slUsedMemory += m_strDescription.Length();
    slUsedMemory += 3* sizeof(CSoundObject); // 3 of them
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

procedures:


  MoveToMarker() {
    // move to target
    const FLOAT3D &vTarget = m_penTarget->GetPlacement().pl_PositionVector;
    const ANGLE3D &aTarget = m_penTarget->GetPlacement().pl_OrientationAngle;
    const FLOAT3D &vSource = GetPlacement().pl_PositionVector;
    const ANGLE3D &aSource = GetPlacement().pl_OrientationAngle;

    // set new translation
    m_vDesiredTranslation = (vTarget-vSource)/m_fSpeed;
    m_fXLimitSign = Sgn(vTarget(1)-vSource(1));
    m_fYLimitSign = Sgn(vTarget(2)-vSource(2));
    m_fZLimitSign = Sgn(vTarget(3)-vSource(3));

    // set new rotation
    // heading
    ANGLE aDelta = NormalizeAngle(aTarget(1)-aSource(1));
    AdjustAngle(aDelta);
    m_aDesiredRotation(1) = aDelta/m_fSpeed;
    m_aHLimitSign = Sgn(aDelta);
    // pitch
    aDelta = NormalizeAngle(aTarget(2)-aSource(2));
    AdjustAngle(aDelta);
    m_aDesiredRotation(2) = aDelta/m_fSpeed;
    m_aPLimitSign = Sgn(aDelta);
    // banking
    aDelta = NormalizeAngle(aTarget(3)-aSource(3));
    AdjustAngle(aDelta);
    m_aDesiredRotation(3) = aDelta/m_fSpeed;
    m_aBLimitSign = Sgn(aDelta);

    // start moving
    m_bMoveToMarker = TRUE;
    SetDesiredTranslation(m_vDesiredTranslation);
    if (m_bRotating) {
      MaybeActivateRotation();
    } else if (!m_tmBankingRotation || !m_tmPitchRotation || !m_tmHeadingRotation) {
      SetDesiredRotation(m_aDesiredRotation);
    }

    // PreMoving will send EEnd event to end
    wait() {
      on (EBegin) : { resume; }
      on (EStop) : {
        //SetCollisionFlags(ECF_IMMATERIAL);
        SetDesiredTranslation(FLOAT3D(0.0f, 0.0f, 0.0f));
        if (m_tmBankingRotation==0 || m_tmPitchRotation==0 || m_tmHeadingRotation==0) {
          SetDesiredRotation(ANGLE3D(0.0f, 0.0f, 0.0f));
        }
        m_bForceStop = TRUE;
        // stop PreMoving check
        m_bMoveToMarker = FALSE;
        m_bStopMoving = TRUE;

        return EEnd();
      }
      // move is obstructed
      on (EBlock eBlock) : {
        // inflict damage to entity that block brush
        InflictDirectDamage(eBlock.penOther, this, DMT_BRUSH, m_fBlockDamage,
          FLOAT3D(0.0f,0.0f,0.0f), (FLOAT3D &)eBlock.plCollision, DBPT_GENERIC);
        if (m_ebaAction == BA_BOUNCE) {
          // change direction for two ticks
          SetDesiredTranslation(-m_vDesiredTranslation);
          if (m_bRotating) {
              MaybeActivateRotation();
            } else if (!m_tmBankingRotation || !m_tmPitchRotation || !m_tmHeadingRotation) {
              SetDesiredRotation(-m_aDesiredRotation);
          }
          // wait for two ticks and reset direction
          call BounceObstructed();
        } else if (m_ebaAction == BA_SKIPMARKER) {
          // stop moving brush
          ForceFullStop();
          // stop PreMoving check
          m_bMoveToMarker = FALSE;
          // skip this marker and move to next one
          m_bSkipMarker = TRUE;
          return EEnd();
        }
        resume;
      }
    }
  }

  BounceObstructed() {
    autowait(0.2f);
    // return to standard direction
    SetDesiredTranslation(m_vDesiredTranslation);
    if (m_bRotating) {
      SetDesiredRotation(ANGLE3D(360.0f/m_tmHeadingRotation, 360.0f/m_tmPitchRotation, 360.0f/m_tmBankingRotation));
    } else if (!m_tmBankingRotation || !m_tmPitchRotation || !m_tmHeadingRotation) {
      SetDesiredRotation(m_aDesiredRotation);
    }
    return;
  }

  /*Rotating()
  {
    if (m_bAutoStart) {
      jump RotActive();
    } else {
      jump RotInactive();
    }
  }

  RotInactive()
  {
    SetDesiredRotation(ANGLE3D(0,0,0));
    wait() {
      on (EActivate) : {
        jump RotActive();
      }
      otherwise() : {
        resume;
      }
    };
  }

  RotActive()
  {
    SetDesiredRotation(ANGLE3D(360.0f/m_tmHeadingRotation,360.0f/m_tmPitchRotation,360.0f/m_tmBankingRotation));

    wait() {
      on (EDeactivate) : {
        jump RotInactive();
      }
      otherwise() : {
        resume;
      }
    };
  }*/

  // move brush
  MoveBrush() 
  {
    if (m_penTarget==NULL) {
      MovingOff();
      return;
    }

    MovingOn();

    // move through markers
    do {
      
      if (m_bForceStop==FALSE)
      {
        // new moving target
        m_penTarget = m_penTarget->GetTarget();
      }
      else {
        m_bForceStop=FALSE;
      }

      if (m_penTarget==NULL) {
        MovingOff();
        return EVoid();
      }

      // skip this marker / ignore wait time
      if (m_bSkipMarker) {
        m_bSkipMarker = FALSE;
      // wait for a while
      } else if (m_fWaitTime > 0.0f) { 
        //autowait(m_fWaitTime);
        wait(m_fWaitTime) {
          on (EBegin) : { resume; }
          on (EStop) : {
            //SetCollisionFlags(ECF_IMMATERIAL);
            SetDesiredTranslation(FLOAT3D(0.0f, 0.0f, 0.0f));
            if (m_tmBankingRotation==0 || m_tmPitchRotation==0 || m_tmHeadingRotation==0) {
              SetDesiredRotation(ANGLE3D(0.0f, 0.0f, 0.0f));
            }
            m_bForceStop = TRUE;
            // stop PreMoving check
            m_bMoveToMarker = FALSE;
            m_bStopMoving = TRUE;
            
            resume; }//return; }
          on (ETimer) : { stop; }
        }          
      }

      if (!m_bForceStop) {
      MaybeActivateRotation();

      PlayStartSound();
      PlayFollowSound();
      autocall MoveToMarker() EEnd;
      StopFollowSound();
      PlayStopSound();
      }

      // load marker parameters or stop moving if there is no marker
      if (!m_bForceStop) {
        m_bValidMarker = LoadMarkerParameters();
      }
      
      // skip this marker / ignore stop moving
      if (m_bSkipMarker) {
        m_bStopMoving = FALSE;
      }
    } while (!m_bStopMoving && m_bValidMarker && !m_bForceStop);
    MovingOff();
    return;
  }

  TeleportToStopMarker()
  {
    MovingOn();

    INDEX ctMarkers=0;
    // new moving target
    CMovingBrushMarker *pmbm = (CMovingBrushMarker *) &*m_penTarget;
    while( pmbm!=NULL && IsOfClass(pmbm->m_penTarget, "Moving Brush Marker") && !pmbm->m_bStopMoving && ctMarkers<50)
    {      
      pmbm = (CMovingBrushMarker *) &*pmbm->m_penTarget;
      ctMarkers++;
    }

    if( pmbm!=NULL && IsOfClass(pmbm, "Moving Brush Marker") && ctMarkers<50)
    {
      SetPlacement(pmbm->GetPlacement());
      en_plLastPlacement=pmbm->GetPlacement();
      ForceFullStop();
      m_soStart.Stop();
      m_soStop.Stop();
      m_soFollow.Stop();
    }

    // stop PreMoving check
    m_bMoveToMarker = FALSE;
    MovingOff();
    return EReturn();
  }

  Main() {
    // declare yourself as a brush
    InitAsBrush();
    SetPhysicsFlags(EPF_BRUSH_MOVING);
    SetCollisionFlags(ECF_BRUSH);
    SetHealth(m_fHealth);

    // set zoning flag
    if (m_bZoning) {
      SetFlags(GetFlags()|ENF_ZONING);
    } else {
      SetFlags(GetFlags()&~ENF_ZONING);
    }


    // set dynamic shadows as needed
    if (m_bDynamicShadows) {
      SetFlags(GetFlags()|ENF_DYNAMICSHADOWS);
    } else {
      SetFlags(GetFlags()&~ENF_DYNAMICSHADOWS);
    }

    // stop moving brush
    ForceFullStop();

    autowait(0.1f);

    // load marker parameters
    m_bValidMarker = LoadMarkerParameters();

    /*if (m_tmBankingRotation!=0) {
      jump Rotating();
    }*/

    // start moving
    wait() {
      on (EBegin) : {
        if (m_bAutoStart) {
          // if not already moving and have target
          MaybeActivateRotation();
          if(!m_bMoving && m_bValidMarker) {
            call MoveBrush();
          }
        }
        resume;
      }
      on (EHit eHit) : {
        if (!m_bMoving) {
          MaybeActivateRotation();
          call MoveBrush();
        }
        resume;
      }
      // move on touch
      on (ETouch eTouch) : {
        // inflict damage if required
        if( m_fTouchDamage != 0.0f)
        {
          InflictDirectDamage( eTouch.penOther, this, DMT_SPIKESTAB, m_fTouchDamage,
                     eTouch.penOther->GetPlacement().pl_PositionVector, eTouch.plCollision, DBPT_GENERIC);
        }
        // send event on touch
        if(m_tdeSendEventOnDamage!=TDE_DAMAGEONLY && CanReactOnEntity(eTouch.penOther)) {
          SendToTarget(m_penTouchEvent, m_eetTouchEvent);
        }
        // if not already moving
        if(!m_bMoving) {
          // move brush
          if (m_bMoveOnTouch && CanReactOnEntity(eTouch.penOther) && m_bValidMarker) {
            MaybeActivateRotation();
            call MoveBrush();
          }
        }
        resume;
      }
      on (EBlock eBlock) : {
        // inflict damage to entity that block brush
        InflictDirectDamage(eBlock.penOther, this, DMT_BRUSH, m_fBlockDamage,
          FLOAT3D(0.0f,0.0f,0.0f), (FLOAT3D &)eBlock.plCollision, DBPT_GENERIC);
        if (m_ebaAction == BA_BOUNCE) {
          // change direction for two ticks
          SetDesiredTranslation(-m_vDesiredTranslation);
          if (m_bRotating) {
              SetDesiredRotation(-ANGLE3D(360.0f/m_tmHeadingRotation, 360.0f/m_tmPitchRotation, 360.0f/m_tmBankingRotation));
            } else if (!m_tmBankingRotation || !m_tmPitchRotation || !m_tmHeadingRotation) {
              SetDesiredRotation(-m_aDesiredRotation);
          }

          // wait for two ticks and reset direction
          call BounceObstructed();
        }
        resume;
      }
      // move on start (usually trigger)
      on (EStart) : {
        // if not already moving and have target
        if(!m_bMoving && m_bValidMarker) {
          call MoveBrush();
        }
        resume;
      }
      on (EStop) : {
        //SetCollisionFlags(ECF_IMMATERIAL);
        resume;
      }
      on (ETeleportMovingBrush) : {
        call TeleportToStopMarker();
        resume;
      }
      on (ETrigger) : {
        // if not already moving and have target
        if(!m_bMoving && m_bValidMarker) {
          call MoveBrush();
        }
        resume;
      }
      on (EActivate) : {
        if (!m_bRotating) {
          MaybeActivateRotation();
        }
        resume;
      }
      on (EDeactivate) : {
        DeactivateRotation();
        resume;
      }
      on (EDeath eDeath) : {
        // get your size
        FLOATaabbox3D box;
        GetSize(box);
        if( m_ctDebrises>0)
        {
          FLOAT fEntitySize = pow(box.Size()(1)*box.Size()(2)*box.Size()(3)/m_ctDebrises, 1.0f/3.0f)*m_fCubeFactor;
            switch(m_bdtDebrisType) {

            default:
            break;
            case BDT_STONE1:
                DebrisInitialize(EIBT_ROCK, MODEL_STONE, TEXTURE_STONE1, fEntitySize, box);
            break;

            case BDT_STONE2:
                DebrisInitialize(EIBT_ROCK, MODEL_STONE, TEXTURE_STONE2, fEntitySize, box);
            break;

            case BDT_STONE3:
                DebrisInitialize(EIBT_ROCK, MODEL_STONE, TEXTURE_STONE3, fEntitySize, box);
            break;

            case BDT_WOOD1:
                DebrisInitialize(EIBT_WOOD, MODEL_WOOD, TEXTURE_WOOD1, fEntitySize, box);
            break;

            case BDT_WOOD2:
                DebrisInitialize(EIBT_WOOD, MODEL_WOOD, TEXTURE_WOOD2, fEntitySize, box);
            break;

            case BDT_WOOD3:
                DebrisInitialize(EIBT_WOOD, MODEL_WOOD, TEXTURE_WOOD3, fEntitySize, box);
            break;

            case BDT_WOOD4:
                DebrisInitialize(EIBT_WOOD, MODEL_WOOD, TEXTURE_WOOD4, fEntitySize, box);
            break;

            case BDT_METAL1:
                DebrisInitialize(EIBT_METAL, MODEL_METAL, TEXTURE_METAL1, fEntitySize, box);
            break;

            case BDT_METAL2:
                DebrisInitialize(EIBT_METAL, MODEL_METAL, TEXTURE_METAL2, fEntitySize, box);
            break;

            case BDT_METAL3:
                DebrisInitialize(EIBT_METAL, MODEL_METAL, TEXTURE_METAL3, fEntitySize, box);
            break;

            case BDT_METAL4:
                DebrisInitialize(EIBT_METAL, MODEL_METAL, TEXTURE_METAL4, fEntitySize, box);
            break;

            case BDT_GLASS1:
                DebrisInitialize(EIBT_GLASS, MODEL_GLASS, TEXTURE_GLASS1, fEntitySize, box);
            break;

            case BDT_GLASS2:
                DebrisInitialize(EIBT_GLASS, MODEL_GLASS, TEXTURE_GLASS2, fEntitySize, box);
            break;

            case BDT_CRETE1:
                DebrisInitialize(EIBT_ROCK, MODEL_STONE, TEXTURE_CRETE1, fEntitySize, box);
            break;

            case BDT_CRETE2:
                DebrisInitialize(EIBT_ROCK, MODEL_STONE, TEXTURE_CRETE2, fEntitySize, box);
            break;

            case BDT_CRETE3:
                DebrisInitialize(EIBT_ROCK, MODEL_STONE, TEXTURE_CRETE3, fEntitySize, box);
            break;

            case BDT_CRETE4:
                DebrisInitialize(EIBT_ROCK, MODEL_STONE, TEXTURE_CRETE4, fEntitySize, box);
            break;

            case BDT_CRETE5:
                DebrisInitialize(EIBT_ROCK, MODEL_STONE, TEXTURE_CRETE5, fEntitySize, box);
            break;
          }
        }

        // notify children
        FOREACHINLIST( CEntity, en_lnInParent, en_lhChildren, iten) {
          iten->SendEvent( EBrushDestroyed());
        }
        // send event to blowup target
        SendToTarget(m_penBlowupEvent, m_eetBlowupEvent, eDeath.eLastDamage.penInflictor);

        // make sure it doesn't loop with destroying itself
        m_tdeSendEventOnDamage = TDE_TOUCHONLY;
        m_fHealth = -1;
        m_bMoveOnDamage = FALSE;
        ForceFullStop();
        SetDefaultProperties();

        // notify engine to kickstart entities that are cached in stationary position,
        // before we turn off, so they can fall
        NotifyCollisionChanged();

        SetFlags( GetFlags()|ENF_HIDDEN);
        SetCollisionFlags(ECF_IMMATERIAL);

        // for each child of this entity
        {FOREACHINLIST(CEntity, en_lnInParent, en_lhChildren, itenChild) {
          // send it destruction event
          itenChild->SendEvent(ERangeModelDestruction());
        }}

        stop;
      }
    }
    return;
  }
};
