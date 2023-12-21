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

808
%{
#include "StdH.h"
#include "Models/Items/ItemHolder/ItemHolder.h"
%}

uses "EntitiesMP/Item";
uses "EntitiesMP/Player";

// health type 
enum InventoryItemType {
  0 IIT_PAINKILLERS  "Painkillers",
};

// event for sending through receive item
event EInventoryItem {
  enum InventoryItemType iitType,
};

class CInventoryItem : CItem 
{
name      "Inventory Item";
thumbnail "Thumbnails\\InventoryItem.tbn";

properties:
  1 enum InventoryItemType m_iitType  "Type" 'Y' = IIT_PAINKILLERS,
//  3 INDEX m_iSoundComponent = 0,

components:
  0 class   CLASS_BASE      "Classes\\Item.ecl",

// ********* INVISIBILITY *********
  1 model   MODEL_PAINKILLERS   "Models\\Items\\Inventory\\Painkillers\\Painkillers.mdl",
  2 texture TEXTURE_PAINKILLERS "Models\\Items\\Inventory\\Painkillers\\Painkillers.tex",

// ************** SOUNDS **************
30 sound   SOUND_PAINKILLERS   "Sounds\\Items\\Painkillers.wav",

functions:

  void Precache(void)
  {
    switch( m_iitType) {
    case IIT_PAINKILLERS    :  PrecacheSound(SOUND_PAINKILLERS    );  break;
    }
  }

  /* Fill in entity statistics - for AI purposes only */
  BOOL FillEntityStatistics(EntityStats *pes)
  {
    pes->es_strName = "Inventory Item"; 
    pes->es_ctCount = 1;
    pes->es_ctAmmount = 1;  // !!!!
    pes->es_fValue = 0;     // !!!!
    pes->es_iScore = 0;//m_iScore;
    
    switch( m_iitType) {
    case IIT_PAINKILLERS : pes->es_strName += "Painkillers"; break;
    }
    return TRUE;
  }

  // render particles
  void RenderParticles(void)
  {
    return;
  }

  // set health properties depending on health type
  void SetProperties(void)
  {
    switch( m_iitType)
    {
      case IIT_PAINKILLERS:
        StartModelAnim( ITEMHOLDER_ANIM_DEFAULT_ANIMATION, AOF_LOOPING|AOF_NORESTART);
        ForceCollisionBoxIndexChange( ITEMHOLDER_COLLISION_BOX_MEDIUM);
        m_fRespawnTime = (m_fCustomRespawnTime>0) ? m_fCustomRespawnTime : 40.0f; 
        m_strDescription.PrintF("Painkillers");
        AddItem(  MODEL_PAINKILLERS, TEXTURE_PAINKILLERS, 0, 0, 0);  // set appearance
        StretchItem( FLOAT3D(1.0f, 1.0f, 1.0f));
        break;
    }
  };

 
procedures:

  ItemCollected( EPass epass) : CItem::ItemCollected
  {
    ASSERT( epass.penOther!=NULL);
 
    // don't pick up more bombs then you can carry
    if (m_iitType == IIT_PAINKILLERS) {
      if (IsOfClass(epass.penOther, "Player")) {
        if (((CPlayer &)*epass.penOther).m_iPainkillerCount>=9) {
          return;
        }
      }
    }

    if( !(m_bPickupOnce||m_bRespawn)) {
      // if already picked by this player
      BOOL bWasPicked = MarkPickedBy(epass.penOther);
      if( bWasPicked) {
        // don't pick again
        return;
      }
    }

    // send inventory item to entity
    EInventoryItem eInventoryItem;
    eInventoryItem.iitType = m_iitType;
    // if inventory item is received
    if( epass.penOther->ReceiveItem(eInventoryItem)) {

      if(_pNetwork->IsPlayerLocal(epass.penOther))
      {
        switch (m_iitType)
        {
          case IIT_PAINKILLERS:     IFeel_PlayEffect("PU_Painkillers"); break; 
        }
      }
      
      // play the pickup sound
      m_soPick.Set3DParameters( 50.0f, 1.0f, 2.0f, 1.0f);
      if (m_iitType == IIT_PAINKILLERS) {
        PlaySound(m_soPick, SOUND_PAINKILLERS, SOF_3D);
        m_fPickSoundLen = GetSoundLength(SOUND_PAINKILLERS);
      }
      if( (m_bPickupOnce||m_bRespawn)) { jump CItem::ItemReceived(); }
    }
    return;
  };


  Main()
  {
    Initialize();     // initialize base class
    SetProperties();  // set properties
    jump CItem::ItemLoop();
  };
};
