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

/*
 *  Sound Holder.
 */
1015
%{
#include "StdH.h"

#define SL_PITCH_MIN (0.01F)
#define SL_PITCH_MAX (100.0F)
%}

uses "EntitiesMP/ModelDestruction";

class CRandomSoundHolder : CRationalEntity {
name      "RandomSoundHolder";
thumbnail "Thumbnails\\RandomSoundHolder.tbn";
features "HasName", "HasDescription", "IsTargetable";


properties:

  1 CTFileName m_fnSound1  "Sound 1"    'S' = CTFILENAME("Sounds\\Default.wav"),    // sound 1
 16 CTFileName m_fnSound2  "Sound 2"        = CTFILENAME("Sounds\\Default.wav"),    // sound 2
 17 CTFileName m_fnSound3  "Sound 3"        = CTFILENAME("Sounds\\Default.wav"),    // sound 3
 18 CTFileName m_fnSound4  "Sound 4"        = CTFILENAME("Sounds\\Default.wav"),    // sound 4
 20 CTFileName m_fnSound5  "Sound 5"        = CTFILENAME("Sounds\\Default.wav"),    // sound 5
 21 CTFileName m_fnSound6  "Sound 6"        = CTFILENAME("Sounds\\Default.wav"),    // sound 6
 22 CTFileName m_fnSound7  "Sound 7"        = CTFILENAME("Sounds\\Default.wav"),    // sound 7
 23 CTFileName m_fnSound8  "Sound 8"        = CTFILENAME("Sounds\\Default.wav"),    // sound 8
  2 RANGE m_rFallOffRange  "Fall-off" 'F' = 100.0f,
  3 RANGE m_rHotSpotRange  "Hot-spot" 'H' =  50.0f,
  4 FLOAT m_fVolume        "Volume"   'V' = 1.0f,
  6 BOOL m_bLoop           "Looping"  'L' = TRUE,
  7 BOOL m_bSurround       "Surround" 'R' = FALSE,
  8 BOOL m_bVolumetric     "Volumetric" 'O' = TRUE,
  9 CTString m_strName     "Name" 'N' = "",
 10 CTString m_strDescription = "",
 11 BOOL m_bAutoStart      "Auto start" 'A' = FALSE,    // auto start (environment sounds)
 12 INDEX m_iPlayType = 0,
 13 CSoundObject m_soSound,         // sound channel
 14 BOOL m_bDestroyable     "Destroyable" 'Q' = FALSE,
 15 FLOAT m_fPitch         "Pitch" = 1.0F,
 19 INDEX m_iRandomCheck = 0,
 24 BOOL m_b3D             "3D" = TRUE,

  {
    CAutoPrecacheSound m_aps;
  }


components:

  1 model   MODEL_MARKER     "Models\\Editor\\SoundHolder.mdl",
  2 texture TEXTURE_MARKER   "Models\\Editor\\SoundHolder.tex"


functions:

  void Precache(void)
  {
    m_aps.Precache(m_fnSound1);
    m_aps.Precache(m_fnSound2);
    m_aps.Precache(m_fnSound3);
    m_aps.Precache(m_fnSound4);
    m_aps.Precache(m_fnSound5);
    m_aps.Precache(m_fnSound6);
    m_aps.Precache(m_fnSound7);
    m_aps.Precache(m_fnSound8);
  }

  // apply mirror and stretch to the entity
  void MirrorAndStretch(FLOAT fStretch, BOOL bMirrorX)
  {
    // stretch its ranges
    m_rFallOffRange*=fStretch;
    m_rHotSpotRange*=fStretch;
    //(void)bMirrorX;  // no mirror for sounds
  }


  // returns bytes of memory used by this object
  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CSoundHolder) - sizeof(CRationalEntity) + CRationalEntity::GetUsedMemory();
    // add some more
    slUsedMemory += m_strName.Length();
    slUsedMemory += m_strDescription.Length();
    slUsedMemory += m_fnSound1.Length();
    slUsedMemory += m_fnSound2.Length();
    slUsedMemory += m_fnSound3.Length();
    slUsedMemory += m_fnSound4.Length();
    slUsedMemory += m_fnSound5.Length();
    slUsedMemory += m_fnSound6.Length();
    slUsedMemory += m_fnSound7.Length();
    slUsedMemory += m_fnSound8.Length();
    slUsedMemory += 1* sizeof(CSoundObject);
    return slUsedMemory;
  }



procedures:

  Main(EVoid)
  {
    m_iRandomCheck = IRnd()%8;

    // validate range
    if (m_rHotSpotRange<0.0f) { m_rHotSpotRange = 0.0f; }
    if (m_rFallOffRange<m_rHotSpotRange) { m_rFallOffRange = m_rHotSpotRange; }
    // validate volume
    if (m_fVolume<FLOAT(SL_VOLUME_MIN)) { m_fVolume = FLOAT(SL_VOLUME_MIN); }
    if (m_fVolume>FLOAT(SL_VOLUME_MAX)) { m_fVolume = FLOAT(SL_VOLUME_MAX); }
    // validate pitch
    if (m_fPitch < FLOAT(SL_PITCH_MIN)) { m_fPitch = FLOAT(SL_PITCH_MIN); }
    if (m_fPitch > FLOAT(SL_PITCH_MAX)) { m_fPitch = FLOAT(SL_PITCH_MAX); }

    // determine play type
    m_iPlayType = 0;
    if (m_b3D) { m_iPlayType |= SOF_3D; }
    if (m_bLoop) { m_iPlayType |= SOF_LOOP; }
    if (m_bSurround) { m_iPlayType |= SOF_SURROUND; }
    if (m_bVolumetric) { m_iPlayType |= SOF_VOLUMETRIC; }

    // init as model
    InitAsEditorModel();
    SetPhysicsFlags(EPF_MODEL_IMMATERIAL);
    SetCollisionFlags(ECF_IMMATERIAL);

    // set stretch factors - MUST BE DONE BEFORE SETTING MODEL!
    const float SOUND_MINSIZE=1.0f;
    FLOAT fFactor = Log2(m_rFallOffRange)*SOUND_MINSIZE;
    if (fFactor<SOUND_MINSIZE) {
      fFactor=SOUND_MINSIZE;
    }
    GetModelObject()->mo_Stretch = FLOAT3D( fFactor, fFactor, fFactor);

    // set appearance
    SetModel(MODEL_MARKER);
    SetModelMainTexture(TEXTURE_MARKER);

    m_strDescription.PrintF("%s %s %s %s", (CTString&)m_fnSound1.FileName(), (CTString&)m_fnSound2.FileName(),
    (CTString&)m_fnSound3.FileName(), (CTString&)m_fnSound4.FileName());

    // wait for a while to play sound -> Sound Can Be Spawned 
    if( _pTimer->CurrentTick()<=0.1f)
    {
      autowait(0.5f);
    }

    wait() {
      // auto play sound
      on (EBegin) : {
        if (m_bAutoStart) {
            m_soSound.Set3DParameters(FLOAT(m_rFallOffRange), FLOAT(m_rHotSpotRange), m_fVolume, m_fPitch);
            
          switch(m_iRandomCheck)
          {
            default:
            {
             PlaySound(m_soSound, m_fnSound1, m_iPlayType);
             break;
            }
            case 1:
            {
             PlaySound(m_soSound, m_fnSound2, m_iPlayType);
             break;
            }
            case 2:
            {
             PlaySound(m_soSound, m_fnSound3, m_iPlayType);
             break;
            }
            case 3:
            {
             PlaySound(m_soSound, m_fnSound4, m_iPlayType);
             break;
            }
            case 4:
            {
             PlaySound(m_soSound, m_fnSound5, m_iPlayType);
             break;
            }
            case 5:
            {
             PlaySound(m_soSound, m_fnSound6, m_iPlayType);
             break;
            }
            case 6:
            {
             PlaySound(m_soSound, m_fnSound7, m_iPlayType);
             break;
            }
            case 7:
            {
             PlaySound(m_soSound, m_fnSound8, m_iPlayType);
             break;
            }
          }
        }
        resume;
      }
      // play sound
      on (EStart) : {
          m_soSound.Set3DParameters(FLOAT(m_rFallOffRange), FLOAT(m_rHotSpotRange), m_fVolume, m_fPitch);
          
          switch(m_iRandomCheck)
          {
            default:
            {
             PlaySound(m_soSound, m_fnSound1, m_iPlayType);
             break;
            }
            case 1:
            {
             PlaySound(m_soSound, m_fnSound2, m_iPlayType);
             break;
            }
            case 2:
            {
             PlaySound(m_soSound, m_fnSound3, m_iPlayType);
             break;
            }
            case 3:
            {
             PlaySound(m_soSound, m_fnSound4, m_iPlayType);
             break;
            }
            case 4:
            {
             PlaySound(m_soSound, m_fnSound5, m_iPlayType);
             break;
            }
            case 5:
            {
             PlaySound(m_soSound, m_fnSound6, m_iPlayType);
             break;
            }
            case 6:
            {
             PlaySound(m_soSound, m_fnSound7, m_iPlayType);
             break;
            }
            case 7:
            {
             PlaySound(m_soSound, m_fnSound8, m_iPlayType);
             break;
            }
          }

        resume;
      }
      // stop playing sound
      on (EStop) : {
        m_soSound.Stop();
        m_iRandomCheck = IRnd()%8;
        resume;
      }
      // when someone in range is destroyed
      on (ERangeModelDestruction) : {
        // if range destruction is enabled
        if (m_bDestroyable) {
          // stop playing
          m_soSound.Stop();
        }
        return TRUE;
      }
      on (EEnd) : { stop; }
    }

    // cease to exist
    Destroy();
    return;
  }
};
