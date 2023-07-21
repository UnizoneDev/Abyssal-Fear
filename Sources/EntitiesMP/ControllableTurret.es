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

1039
%{
#include "StdH.h"
%}

uses "EntitiesMP/Player";
uses "EntitiesMP/Projectile";
uses "EntitiesMP/Bullet";

// turret events
event EFireTurret {};
event EReleaseTurret {};

enum ControllableTurretType {
  0 CTT_BULLETHITSCAN       "Hitscan Bullet",       // machine gun
  1 CTT_SHELL               "Shell",                // automatic shotgun
  2 CTT_BULLETPROJECTILE    "Projectile Bullet",    // dodgeable bullet
};

class CControllableTurret : CRationalEntity {
name      "ControllableTurret";
thumbnail "Thumbnails\\ControllableTurret.tbn";
features  "HasName", "IsTargetable";


properties:

  1 CTString m_strName          "Name" 'N' = "ControllableTurret",
  2 CEntityPointer m_penCaused,    // for checking who caused it
  3 enum ControllableTurretType m_ctType    "Type" 'Y' = CTT_BULLETHITSCAN,
  4 BOOL m_bUseable = FALSE,      // set while the switch can be triggered
  5 FLOAT m_fDistance "Distance" 'D' = 2.0f,
  6 CTString m_strMessage        "Message" 'M' = "",
  7 BOOL m_bFireTurret = FALSE,
  8 CSoundObject m_soTurret,

  {
    CEntity *penBullet;
  }

components:

  1 class   CLASS_PROJECTILE        "Classes\\Projectile.ecl",
  2 class   CLASS_BULLET            "Classes\\Bullet.ecl",

 10 model   MODEL_CONTROLLABLETURRET     "Models\\Props\\Turrets\\MachineTurret.mdl",
 11 texture TEXTURE_CONTROLLABLETURRET   "Models\\Props\\Turrets\\MachineTurret.tex",

 20 sound   SOUND_SILENCE               "Sounds\\Misc\\Silence.wav",
 21 sound   SOUND_TURRET_FIRE           "Sounds\\Weapons\\TurretBullet1.wav",
 22 sound   SOUND_TURRET_SHOTGUNFIRE    "Sounds\\Weapons\\TurretShotgun1.wav",

 // ************** REFLECTIONS **************
200 texture TEX_REFL_BWRIPLES02         "Models\\ReflectionTextures\\BWRiples01.tex",

 // ************** SPECULAR **************
210 texture TEX_SPEC_MEDIUM             "Models\\SpecularTextures\\Medium.tex",

 // ************** DETAIL **************
220 texture TEX_BUMP_METAL             "Textures\\overlay\\Detail3.tex",

functions:

  void Precache(void) {
    PrecacheClass(CLASS_BULLET);
    PrecacheClass(CLASS_PROJECTILE, PRT_GUNMAN_BULLET);
    PrecacheSound(SOUND_SILENCE);
    PrecacheSound(SOUND_TURRET_FIRE);
    PrecacheSound(SOUND_TURRET_SHOTGUNFIRE);
  }

  FLOAT GetDistance() const
  {
    return m_fDistance;
  }

  // test if this turret reacts on this entity
  BOOL CanReactOnEntity(CEntity *pen)
  {
    if (pen==NULL) {
      return FALSE;
    }
    // never react on non-live or dead entities
    if (!(pen->GetFlags()&ENF_ALIVE)) {
      return FALSE;
    }

    if(!IsDerivedFromClass(pen, "Player")) {
      return FALSE;
    }

    return TRUE;
  }

  // returns bytes of memory used by this object
  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CControllableTurret) - sizeof(CRationalEntity) + CRationalEntity::GetUsedMemory();
    // add some more
    slUsedMemory += m_strMessage.Length();
    return slUsedMemory;
  }

  // setup 3D sound parameters
  void Setup3DSoundParameters(void) {
    // initialize sound 3D parameters
    m_soTurret.Set3DParameters(80.0f, 10.0f, 1.0f, 1.0f);
  };

  void PrepareBullet(FLOAT fDamage, FLOAT fX, FLOAT fY, FLOAT fZ) {
    // bullet start position
    CPlacement3D plBullet;
    plBullet.pl_OrientationAngle = ANGLE3D(0,0,0);
    plBullet.pl_PositionVector = FLOAT3D(fX, fY, fZ);
    plBullet.RelativeToAbsolute(GetPlacement());
    // create bullet
    penBullet = CreateEntity(plBullet, CLASS_BULLET);
    // init bullet
    EBulletInit eInit;
    eInit.penOwner = this;
    eInit.fDamage = fDamage;
    penBullet->Initialize(eInit);
  };

  // fire one bullet
  void FireOneBullet(void) {
    // bullet
    PrepareBullet(10.0f, 0.0f, 0.275f, -1.95f);
    ((CBullet&)*penBullet).CalcTarget(250);
    ((CBullet&)*penBullet).CalcJitterTarget(10);
    ((CBullet&)*penBullet).LaunchBullet( TRUE, TRUE, TRUE);
    ((CBullet&)*penBullet).DestroyBullet();
  };

  // fire pellets
  void FirePellets(void) {
    // bullet
    PrepareBullet(16.0f, 0.0f, 0.275f, -1.95f);
    ((CBullet&)*penBullet).CalcTarget(250);

    INDEX iPellets;
    for(iPellets = 0; iPellets < 7; iPellets++) {
      ((CBullet&)*penBullet).CalcJitterTarget(50);
      ((CBullet&)*penBullet).LaunchBullet(iPellets<2, TRUE, TRUE);
    }
    ((CBullet&)*penBullet).DestroyBullet();
  };

procedures:

  /*
   *  >>>---   FIRE TURRET   ---<<<
   */
  Fire() {
    PlaySound(m_soTurret, SOUND_SILENCE, SOF_3D|SOF_VOLUMETRIC);      // stop possible sounds
    m_bFireTurret = TRUE;
    // setup 3D sound parameters
    Setup3DSoundParameters();

    while(m_bFireTurret) {
      wait() {
        on (EBegin) : {
          switch(m_ctType) {
            case CTT_BULLETHITSCAN:
            call FireTurretBullet();
            break;
            case CTT_SHELL:
            call FireTurretShotgun();
            break;
          }
          resume;
        }
        on (EEnd) : {
          stop;
        }
      }
    }
    jump Idle();
  }

  FireTurretBullet() {
    FireOneBullet();
    PlaySound(m_soTurret, SOUND_TURRET_FIRE, SOF_3D|SOF_VOLUMETRIC);
    autowait(0.125f);
    return EEnd();
  }

  FireTurretShotgun() {
    FirePellets();
    PlaySound(m_soTurret, SOUND_TURRET_SHOTGUNFIRE, SOF_3D|SOF_VOLUMETRIC);
    autowait(0.45f);
    return EEnd();
  }

  Idle() {
    m_bUseable = TRUE;

    //main loop
    wait() {
      on (EBegin) : {
        // fire pressed start firing
        if (m_bFireTurret) {
          jump Fire();
        }

        resume;
      }
      on (EFireTurret) : {
        jump Fire();
      }
    }
  };

  Main()
  {
    InitAsModel();
    SetPhysicsFlags(EPF_MODEL_FIXED);
    SetCollisionFlags(ECF_MODEL_HOLDER);

    // set appearance
    SetModel(MODEL_CONTROLLABLETURRET);
    SetModelMainTexture(TEXTURE_CONTROLLABLETURRET);
    SetModelSpecularTexture(TEX_SPEC_MEDIUM);
    SetModelReflectionTexture(TEX_REFL_BWRIPLES02);
    SetModelBumpTexture(TEX_BUMP_METAL);

    wait() {
      on (EBegin) : { call Idle(); }

      // trigger event -> change switch
      on (ETrigger eTrigger) : {
        if (CanReactOnEntity(eTrigger.penCaused) && m_bUseable) {
          if(IsDerivedFromClass(eTrigger.penCaused, "Player")) {
            CPlayer *penPlayer = (CPlayer*)&*eTrigger.penCaused;
            if(!penPlayer->m_bIsOnTurret) {
              penPlayer->m_bIsOnTurret = TRUE;
              penPlayer->m_penTurret = this;
            } else {
              penPlayer->m_bIsOnTurret = FALSE;
              penPlayer->m_penTurret = NULL;
            }
          }
        }
        resume;
      }

      on (EFireTurret) : {
        // start firing
        m_bFireTurret = TRUE;
        resume;
      }
      on (EReleaseTurret) : {
        // stop firing
        m_bFireTurret = FALSE;
        resume;
      }
      on (EEnd) : { stop; }
    }

    return;
  };
};
