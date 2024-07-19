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

209
%{
#include "StdH.h"
%}

uses "EntitiesMP/ModelHolder2";
uses "EntitiesMP/KeyItem";
uses "EntitiesMP/PuzzleItem";
uses "EntitiesMP/Player";

enum SwitchType {
  0 SWT_ONCE    "Once",
  1 SWT_ONOFF   "On/Off",
};

enum SwitchPosition {
  0 SWP_UP     "Up",
  1 SWP_DOWN   "Down",
};

enum SwitchLockType {
  0 SWLT_KEY      "Key",
  1 SWLT_PUZZLE   "Puzzle Item",
};

class CSwitch: CModelHolder2 {
name      "Switch";
thumbnail "Thumbnails\\Switch.tbn";
features  "HasName", "HasTarget", "IsTargetable";


properties:

  4 ANIMATION m_iModelONAnimation     "Model ON animation" 'D' = 0,
  5 ANIMATION m_iTextureONAnimation   "Texture ON animation" = 0,
  6 ANIMATION m_iModelOFFAnimation    "Model OFF animation" 'G' = 0,
  7 ANIMATION m_iTextureOFFAnimation  "Texture OFF animation" = 0,

 10 CEntityPointer m_penTarget      "ON-OFF Target" 'T' COLOR(C_dBLUE|0xFF),                      // send event to entity
 11 enum EventEType m_eetEvent      "ON  Event type" 'U' = EET_START,  // type of event to send
 12 enum EventEType m_eetOffEvent   "OFF Event type" 'I' = EET_IGNORE, // type of event to send
 13 CEntityPointer m_penOffTarget   "OFF Target" COLOR(C_dBLUE|0xFF),  // off target, if not null recives off event

 18 enum SwitchType m_swtType   "Type" 'Y' = SWT_ONOFF,
 19 CTString m_strMessage       "Message" 'M' = "",

 // internal -> do not use
 20 BOOL m_bSwitchON = FALSE,
 21 CEntityPointer m_penCaused,   // who triggered it last time
 22 BOOL m_bUseable = FALSE,      // set while the switch can be triggered
 23 BOOL m_bInvisible "Invisible" = FALSE,    // make it editor model

 // for lever and switch puzzles
 30 enum SwitchPosition m_swpPosition "Handle Position" = SWP_UP,
 110 ANIMATION m_iModelReverseAnimation     "Model Reverse animation" = 0,
 111 ANIMATION m_iTextureReverseAnimation   "Texture Reverse animation" = 0,
 112 FLOAT m_fDistance "Distance" 'D' = 2.0f,

 // sound target
120 CEntityPointer m_penSoundON    "Sound ON entity",     // sound on entity
121 CEntityPointer m_penSoundOFF   "Sound OFF entity",    // sound off entity
122 CSoundObject m_soON,
123 CSoundObject m_soOFF,

 // for locked doors without a DoorController
124 BOOL m_bSwitchLocked "Locked" = FALSE,
125 CTStringTrans m_strLockedMessage "Locked message" = "",
126 CEntityPointer m_penLockedTarget  "Locked target" COLOR(C_dMAGENTA|0xFF),   // target to trigger when locked
127 enum KeyItemType m_kitKey  "Key" 'K' = KIT_CROSSWOODEN,  // key type (for locked door)

128 CEntityPointer m_penSoundLocked    "Sound Locked entity",     // sound locked entity
129 CEntityPointer m_penSoundUnlocked  "Sound Unlocked entity",    // sound unlocked entity
130 CSoundObject m_soLocked,
131 CSoundObject m_soUnlocked,

132 CTStringTrans m_strUnlockedMessage "Unlocked message" = "",
133 CEntityPointer m_penUnlockedTarget  "Unlocked target" COLOR(C_dMAGENTA|0xFF),   // target to trigger when unlocked

134 CEntityPointer m_penSoundUse    "Sound Use entity",     // sound use entity (doorknob jiggle)
135 CSoundObject m_soUse,
136 CTStringTrans m_strUseMessage "Use message" = "",
137 CEntityPointer m_penUseTarget  "Use target" COLOR(C_dMAGENTA|0xFF),   // target to trigger when used
138 enum PuzzleItemType m_pitItem  "Puzzle Item" = PIT_LEVERHANDLE,  // puzzle item type (for locked door)
139 enum SwitchLockType m_swltItem "Lock Type" = SWLT_KEY,


components:


functions:                                        

  FLOAT GetDistance() const
  {
    return m_fDistance;
  }

  /* Get anim data for given animation property - return NULL for none. */
  CAnimData *GetAnimData(SLONG slPropertyOffset) 
  {
    if (slPropertyOffset==offsetof(CSwitch, m_iModelONAnimation) ||
        slPropertyOffset==offsetof(CSwitch, m_iModelOFFAnimation) ||
        slPropertyOffset==offsetof(CSwitch, m_iModelReverseAnimation)) {
      return GetModelObject()->GetData();
    } else if (slPropertyOffset==offsetof(CSwitch, m_iTextureONAnimation) ||
               slPropertyOffset==offsetof(CSwitch, m_iTextureOFFAnimation)  ||
               slPropertyOffset==offsetof(CSwitch, m_iTextureReverseAnimation)) {
      return GetModelObject()->mo_toTexture.GetData();
    } else {
      return CModelHolder2::GetAnimData(slPropertyOffset);
    }
  }

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

    return TRUE;
  }


  // returns bytes of memory used by this object
  SLONG GetUsedMemory(void)
  {
    // initial
    SLONG slUsedMemory = sizeof(CSwitch) - sizeof(CModelHolder2) + CModelHolder2::GetUsedMemory();
    // add some more
    slUsedMemory += m_strMessage.Length();
    slUsedMemory += m_strLockedMessage.Length();
    slUsedMemory += m_strUnlockedMessage.Length();
    slUsedMemory += m_strUseMessage.Length();
    slUsedMemory += 5* sizeof(CSoundObject); // only 5
    return slUsedMemory;
  }


  // play start sound
  void PlayONSound(void) {
    // if sound entity exists
    if (m_penSoundON!=NULL) {
      CSoundHolder &sh = (CSoundHolder&)*m_penSoundON;
      m_soON.Set3DParameters(FLOAT(sh.m_rFallOffRange), FLOAT(sh.m_rHotSpotRange), sh.m_fVolume, sh.m_fPitch);
      PlaySound(m_soON, sh.m_fnSound, sh.m_iPlayType);
    }
  };

  // play stop sound
  void PlayOFFSound(void) {
    // if sound entity exists
    if (m_penSoundOFF!=NULL) {
      CSoundHolder &sh = (CSoundHolder&)*m_penSoundOFF;
      m_soOFF.Set3DParameters(FLOAT(sh.m_rFallOffRange), FLOAT(sh.m_rHotSpotRange), sh.m_fVolume, sh.m_fPitch);
      PlaySound(m_soOFF, sh.m_fnSound, sh.m_iPlayType);
    }
  };

  // play locked sound
  void PlayLockedSound(void) {
    // if sound entity exists
    if (m_penSoundLocked!=NULL) {
      CSoundHolder &sh = (CSoundHolder&)*m_penSoundLocked;
      m_soLocked.Set3DParameters(FLOAT(sh.m_rFallOffRange), FLOAT(sh.m_rHotSpotRange), sh.m_fVolume, sh.m_fPitch);
      PlaySound(m_soLocked, sh.m_fnSound, sh.m_iPlayType);
    }
  };

  // play unlocked sound
  void PlayUnlockedSound(void) {
    // if sound entity exists
    if (m_penSoundUnlocked!=NULL) {
      CSoundHolder &sh = (CSoundHolder&)*m_penSoundUnlocked;
      m_soUnlocked.Set3DParameters(FLOAT(sh.m_rFallOffRange), FLOAT(sh.m_rHotSpotRange), sh.m_fVolume, sh.m_fPitch);
      PlaySound(m_soUnlocked, sh.m_fnSound, sh.m_iPlayType);
    }
  };

  // play use sound
  void PlayUseSound(void) {
    // if sound entity exists
    if (m_penSoundUse!=NULL) {
      CSoundHolder &sh = (CSoundHolder&)*m_penSoundUse;
      m_soUse.Set3DParameters(FLOAT(sh.m_rFallOffRange), FLOAT(sh.m_rHotSpotRange), sh.m_fVolume, sh.m_fPitch);
      PlaySound(m_soUse, sh.m_fnSound, sh.m_iPlayType);
    }
  };


procedures:


  // turn the switch on
  SwitchON() {
    // if already on
    if (m_bSwitchON) {
      // do nothing
      return;
    }
    
    PlayONSound();

    if(m_swpPosition == SWP_UP)
    {
      GetModelObject()->PlayAnim(m_iModelONAnimation, 0);
      GetModelObject()->mo_toTexture.PlayAnim(m_iTextureONAnimation, 0);
      m_swpPosition = SWP_DOWN;
    }
    else
    {
      GetModelObject()->PlayAnim(m_iModelOFFAnimation, 0);
      GetModelObject()->mo_toTexture.PlayAnim(m_iTextureOFFAnimation, 0);
      m_swpPosition = SWP_UP;
    }
    // switch ON
    
    m_bSwitchON = TRUE;
    // send event to target
    SendToTarget(m_penTarget, m_eetEvent, m_penCaused);
    // wait for anim end
    wait(GetModelObject()->GetAnimLength(m_iModelONAnimation)) {
      on (EBegin) : { resume; } on (ETimer) : { stop; } on (EDeath) : { pass; } otherwise(): { resume; }
    }

    return EReturn();  // to notify that can be usable
  };

  // turn the switch off
  SwitchOFF() {
    // if already off
    if (!m_bSwitchON) {
      // do nothing
      return;
    }

    PlayOFFSound();
    
    if(m_swpPosition == SWP_DOWN)
    {
      GetModelObject()->PlayAnim(m_iModelOFFAnimation, 0);
      GetModelObject()->mo_toTexture.PlayAnim(m_iTextureOFFAnimation, 0);
      m_swpPosition = SWP_UP;
    }
    else
    {
      GetModelObject()->PlayAnim(m_iModelONAnimation, 0);
      GetModelObject()->mo_toTexture.PlayAnim(m_iTextureONAnimation, 0);
      m_swpPosition = SWP_DOWN;
    }
    m_bSwitchON = FALSE;
    // if exists off target
    if(m_penOffTarget!=NULL)
    {
      SendToTarget(m_penOffTarget, m_eetOffEvent, m_penCaused);
    }
    else
    {
      // send off event to target
      SendToTarget(m_penTarget, m_eetOffEvent, m_penCaused);
    }
    // wait for anim end
    wait(GetModelObject()->GetAnimLength(m_iModelOFFAnimation)) {
      on (EBegin) : { resume; } on (ETimer) : { stop; } on (EDeath) : { pass; } otherwise(): { resume; }
    }

    return EReturn();  // to notify that can be usable
  };


  MainLoop_Once() {
    m_bUseable = TRUE;

    if(m_swpPosition == SWP_DOWN)
    {
      GetModelObject()->PlayAnim(m_iModelReverseAnimation, 0);
      GetModelObject()->mo_toTexture.PlayAnim(m_iTextureReverseAnimation, 0);
    }
    else
    {
      GetModelObject()->PlayAnim(m_iModelAnimation, 0);
      GetModelObject()->mo_toTexture.PlayAnim(m_iTextureAnimation, 0);
    }

    //main loop
    wait() {
      // trigger event -> change switch
      on (ETrigger eTrigger) : {
        if (CanReactOnEntity(eTrigger.penCaused) && m_bUseable) {
          if (m_bSwitchLocked) {
            if (IsDerivedFromClass(eTrigger.penCaused, "Player")) {
              CPlayer *penPlayer = (CPlayer*)&*eTrigger.penCaused;
              // if he has the key
              ULONG ulKey = (1<<INDEX(m_kitKey));
              ULONG ulPuzzle = (1<<INDEX(m_pitItem));

              if(m_swltItem == SWLT_KEY) {
                if (penPlayer->m_ulKeys&ulKey) {
                  // use the key
                  SendToTarget(this, EET_UNLOCK, eTrigger.penCaused);
                  } else {
                  PlayUseSound();
                  if (m_strUseMessage!="") {
                    PrintCenterMessage(this, eTrigger.penCaused, TranslateConst(m_strUseMessage), 3.0f, MSS_NONE, FNT_NORMAL, 0.5f, 0.85f, POS_CENTER);
                  }
                  if(m_penUseTarget != NULL) {
                    SendToTarget(m_penUseTarget, m_eetEvent, eTrigger.penCaused);
                  }
                }
              } else {
                if (penPlayer->m_ulPuzzleItems&ulPuzzle) {
                  // use the key
                  penPlayer->m_ulPuzzleItems&=~ulPuzzle;
                  SendToTarget(this, EET_UNLOCK, eTrigger.penCaused);
                  } else {
                  PlayUseSound();
                  if (m_strUseMessage!="") {
                    PrintCenterMessage(this, eTrigger.penCaused, TranslateConst(m_strUseMessage), 3.0f, MSS_NONE, FNT_NORMAL, 0.5f, 0.85f, POS_CENTER);
                  }
                  if(m_penUseTarget != NULL) {
                    SendToTarget(m_penUseTarget, m_eetEvent, eTrigger.penCaused);
                  }
                }
              }
            }
            resume;
          }

          m_bUseable = FALSE;
          m_penCaused = eTrigger.penCaused;
          call SwitchON();
        }
      }
      // start -> switch ON
      on (EStart) : {
        m_bUseable = FALSE;
        call SwitchON();
      }
      // stop -> switch OFF
      on (EStop) : {
        m_bUseable = FALSE;
        call SwitchOFF();
      }
      on (ELock eLock) : {
        m_bSwitchLocked = TRUE;
        PlayLockedSound();

        if (CanReactOnEntity(eLock.penCaused) && m_bUseable) {
          if (m_strLockedMessage!="") {
            PrintCenterMessage(this, eLock.penCaused, TranslateConst(m_strLockedMessage), 3.0f, MSS_NONE, FNT_NORMAL, 0.5f, 0.85f, POS_CENTER);
          }
          if(m_penLockedTarget != NULL) {
            SendToTarget(m_penLockedTarget, m_eetEvent, eLock.penCaused);
          }
        }

        resume;
      }
      on (EUnlock eUnlock) : {
        m_bSwitchLocked = FALSE;
        PlayUnlockedSound();

        if (CanReactOnEntity(eUnlock.penCaused) && m_bUseable) {
          if (m_strUnlockedMessage!="") {
            PrintCenterMessage(this, eUnlock.penCaused, TranslateConst(m_strUnlockedMessage), 3.0f, MSS_NONE, FNT_NORMAL, 0.5f, 0.85f, POS_CENTER);
          }
          if(m_penUnlockedTarget != NULL) {
            SendToTarget(m_penUnlockedTarget, m_eetEvent, eUnlock.penCaused);
          }
        }

        resume;
      }
      on (EReturn) : {
        m_bUseable = !m_bSwitchON;
        resume;
      }
    }
  };


  MainLoop_OnOff() {
    m_bUseable = TRUE;

    if(m_swpPosition == SWP_DOWN)
    {
      GetModelObject()->PlayAnim(m_iModelReverseAnimation, 0);
      GetModelObject()->mo_toTexture.PlayAnim(m_iTextureReverseAnimation, 0);
    }
    else
    {
      GetModelObject()->PlayAnim(m_iModelAnimation, 0);
      GetModelObject()->mo_toTexture.PlayAnim(m_iTextureAnimation, 0);
    }

    //main loop
    wait() {
      // trigger event -> change switch
      on (ETrigger eTrigger) : {
        if (CanReactOnEntity(eTrigger.penCaused) && m_bUseable) {
          if (m_bSwitchLocked) {
            if (IsDerivedFromClass(eTrigger.penCaused, "Player")) {
              CPlayer *penPlayer = (CPlayer*)&*eTrigger.penCaused;
              // if he has the key
              ULONG ulKey = (1<<INDEX(m_kitKey));
              ULONG ulPuzzle = (1<<INDEX(m_pitItem));
              
              if(m_swltItem == SWLT_KEY) {
                if (penPlayer->m_ulKeys&ulKey) {
                  // use the key
                  SendToTarget(this, EET_UNLOCK, eTrigger.penCaused);
                  } else {
                  PlayUseSound();
                  if (m_strUseMessage!="") {
                    PrintCenterMessage(this, eTrigger.penCaused, TranslateConst(m_strUseMessage), 3.0f, MSS_NONE, FNT_NORMAL, 0.5f, 0.85f, POS_CENTER);
                  }
                  if(m_penUseTarget != NULL) {
                    SendToTarget(m_penUseTarget, m_eetEvent, eTrigger.penCaused);
                  }
                }
              } else {
                if (penPlayer->m_ulPuzzleItems&ulPuzzle) {
                  // use the key
                  penPlayer->m_ulPuzzleItems&=~ulPuzzle;
                  SendToTarget(this, EET_UNLOCK, eTrigger.penCaused);
                  } else {
                  PlayUseSound();
                  if (m_strUseMessage!="") {
                    PrintCenterMessage(this, eTrigger.penCaused, TranslateConst(m_strUseMessage), 3.0f, MSS_NONE, FNT_NORMAL, 0.5f, 0.85f, POS_CENTER);
                  }
                  if(m_penUseTarget != NULL) {
                    SendToTarget(m_penUseTarget, m_eetEvent, eTrigger.penCaused);
                  }
                }
              }
            }
            resume;
          }

          m_bUseable = FALSE;
          m_penCaused = eTrigger.penCaused;
          // if switch is ON make it OFF
          if (m_bSwitchON) {
            call SwitchOFF();
          // else if switch is OFF make it ON
          } else {
            call SwitchON();
          }
        }
      }
      // start -> switch ON
      on (EStart) : {
        m_bUseable = FALSE;
        call SwitchON();
      }
      // stop -> switch OFF
      on (EStop) : {
        m_bUseable = FALSE;
        call SwitchOFF();
      }
      // when dead
      on(EDeath): {
        if (m_penDestruction!=NULL) {
          jump CModelHolder2::Die();
        }
        resume;
      }
      on (ELock eLock) : {
        m_bSwitchLocked = TRUE;
        PlayLockedSound();

        if (CanReactOnEntity(eLock.penCaused) && m_bUseable) {
          if (m_strLockedMessage!="") {
            PrintCenterMessage(this, eLock.penCaused, TranslateConst(m_strLockedMessage), 3.0f, MSS_NONE, FNT_NORMAL, 0.5f, 0.85f, POS_CENTER);
          }
          if(m_penLockedTarget != NULL) {
            SendToTarget(m_penLockedTarget, m_eetEvent, eLock.penCaused);
          }
        }

        resume;
      }
      on (EUnlock eUnlock) : {
        m_bSwitchLocked = FALSE;
        PlayUnlockedSound();

        if (CanReactOnEntity(eUnlock.penCaused) && m_bUseable) {
          if (m_strUnlockedMessage!="") {
            PrintCenterMessage(this, eUnlock.penCaused, TranslateConst(m_strUnlockedMessage), 3.0f, MSS_NONE, FNT_NORMAL, 0.5f, 0.85f, POS_CENTER);
          }
          if(m_penUnlockedTarget != NULL) {
            SendToTarget(m_penUnlockedTarget, m_eetEvent, eUnlock.penCaused);
          }
        }

        resume;
      }
      on (EReturn) : {
        m_bUseable = TRUE;
        resume;
      }
    }
  };

  Main() {
    // init as model
    CModelHolder2::InitModelHolder();

    if (m_bInvisible) {
      SwitchToEditorModel();
    }

    if (m_swtType==SWT_ONCE) {
      jump MainLoop_Once();
    } else {
      jump MainLoop_OnOff();
    }

    return;
  };
};
