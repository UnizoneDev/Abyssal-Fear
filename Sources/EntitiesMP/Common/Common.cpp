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

#include "StdH.h"
#include <Engine/Base/Shell.h>
#include "EntitiesMP/Reminder.h"
#include "EntitiesMP/Flame.h"
#include "EntitiesMP/Debris.h"
#include "EntitiesMP/Player.h"
#include "EntitiesMP/Bullet.h"
#include "EntitiesMP/BackgroundViewer.h"
#include "EntitiesMP/SoundHolder.h"
#include "GameMP/PlayerSettings.h"
#include "Models/Player/Uni/Player.h"
#include "Models/Player/Uni/Body.h"
#include "Models/Player/Uni/Head.h"
extern INDEX ent_bReportBrokenChains;

void CCompMessageID::Clear(void)
{
  cmi_fnmFileName.Clear();
  cmi_ulHash = 0;
}

void CCompMessageID::Read_t(CTStream &strm)    // throw char *
{
  strm>>cmi_fnmFileName;
  strm>>(INDEX&)cmi_cmtType;
  strm>>(INDEX&)cmi_bRead;
  cmi_ulHash = cmi_fnmFileName.GetHash();
}

void CCompMessageID::Write_t(CTStream &strm)   // throw char *
{
  strm<<cmi_fnmFileName;
  strm<<(INDEX&)cmi_cmtType;
  strm<<(INDEX&)cmi_bRead;
}

void CCompMessageID::NewMessage(const CTFileName &fnm)
{
  // remember filename
  cmi_fnmFileName = fnm;
  cmi_ulHash = cmi_fnmFileName.GetHash();

  // decode type from filename
  CTString strName = fnm;

  if (strName.Matches("*messages\\information*")) {
    cmi_cmtType = CMT_INFORMATION;
  } else if (strName.Matches("*messages\\weapons*")) {
    cmi_cmtType = CMT_WEAPONS;
  } else if (strName.Matches("*messages\\enemies*")) {
    cmi_cmtType = CMT_ENEMIES;
  } else if (strName.Matches("*messages\\background*")) {
    cmi_cmtType = CMT_BACKGROUND;
  } else if (strName.Matches("*messages\\statistics*")) {
    cmi_cmtType = CMT_STATISTICS;
  } else {
    CPrintF("Unknown message type: %s\n", (const CTString&) fnm);
    cmi_cmtType = CMT_INFORMATION;
  }
  // mark as unread
  cmi_bRead = FALSE;
}


/************************************************************
 *          COMMON FUNCTIONS FOR ENTITY CLASSES             *
 ************************************************************/
// world change
struct WorldChange _SwcWorldChange;

// get info position for entity
void GetEntityInfoPosition(CEntity *pen, FLOAT *pf, FLOAT3D &vPos) {
  ASSERT(pen!=NULL);

  vPos = pen->GetPlacement().pl_PositionVector;
  if (pf != NULL) {
    FLOATmatrix3D mRotation;
    MakeRotationMatrixFast(mRotation, pen->GetPlacement().pl_OrientationAngle);
    vPos += FLOAT3D(pf[0], pf[1], pf[2])*mRotation;
  }
};

// get source and target positions for ray cast
void GetPositionCastRay(CEntity *penSource, CEntity *penTarget, FLOAT3D &vSource, FLOAT3D &vTarget) {
  EntityInfo *peiSource = (EntityInfo*) (penSource->GetEntityInfo());
  EntityInfo *peiTarget = (EntityInfo*) (penTarget->GetEntityInfo());

  ASSERT(peiSource!=NULL && peiTarget!=NULL);

  // source
  if (peiSource!=NULL) {
    GetEntityInfoPosition(penSource, peiSource->vSourceCenter, vSource);
  } else {
    vSource = penSource->GetPlacement().pl_PositionVector;
  }
  // target
  if (peiTarget!=NULL) {
    GetEntityInfoPosition(penTarget, peiTarget->vTargetCenter, vTarget);
  } else {
    vTarget = penTarget->GetPlacement().pl_PositionVector;
  }
};

// set bool from bool enum type
void SetBoolFromBoolEType(BOOL &bSet, BoolEType bet) {
  switch (bet) {
    case BET_TRUE:
      bSet = TRUE;
      break;
    case BET_FALSE:
      bSet = FALSE;
      break;
    //case BET_IGNORE:
      //bSet = bSet;
      // break
  }
};

// send event to target
void SendToTarget(CEntity *penSendEvent, EventEType eetEventType, CEntity *penCaused) {
  // if target is valid
  if (penSendEvent != NULL) {
    switch (eetEventType) {
      // send START event
      case EET_START: {
        EStart eStart;
        eStart.penCaused = penCaused;
        penSendEvent->SendEvent(eStart);
                      } break;
      // send STOP event
      case EET_STOP:
        penSendEvent->SendEvent(EStop());
        break;
      // send TRIGGER event
      case EET_TRIGGER: {
        ETrigger eTrigger;
        eTrigger.penCaused = penCaused;
        penSendEvent->SendEvent(eTrigger);
                        } break;
      // don't send event (IGNORE)
      case EET_IGNORE:
        break;
      // send ACTIVATE event
      case EET_ACTIVATE:
        penSendEvent->SendEvent(EActivate());
        break;
      // send DEACTIVATE event
      case EET_DEACTIVATE:
        penSendEvent->SendEvent(EDeactivate());
        break;
      // send ENVIRONMENTSTART event
      case EET_ENVIRONMENTSTART:
        penSendEvent->SendEvent(EEnvironmentStart());
        break;
      // send ENVIRONMENTSTOP event
      case EET_ENVIRONMENTSTOP:
        penSendEvent->SendEvent(EEnvironmentStop());
        break;
      // send STARTATTACK event
      case EET_STARTATTACK:
        penSendEvent->SendEvent(EStartAttack());
        break;
      // send STOPATTACK event
      case EET_STOPATTACK:
        penSendEvent->SendEvent(EStopAttack());
        break;
      case EET_STOPBLINDNESS:
        penSendEvent->SendEvent(EStopBlindness());
        break;
      case EET_STOPDEAFNESS:
        penSendEvent->SendEvent(EStopDeafness());
        break;
      case EET_TELEPORTMOVINGBRUSH:
        penSendEvent->SendEvent(ETeleportMovingBrush());
        break;
      case EET_STOPDORMANCY:
          penSendEvent->SendEvent(EStopDormancy());
          break;
      case EET_STOPANOSMIA:
          penSendEvent->SendEvent(EStopAnosmia());
          break;
      case EET_LOCK: {
          ELock eLock;
          eLock.penCaused = penCaused;
          penSendEvent->SendEvent(eLock);
        } break;
      case EET_UNLOCK: {
          EUnlock eUnlock;
          eUnlock.penCaused = penCaused;
          penSendEvent->SendEvent(eUnlock);
      } break;
    }
  }
};

// send event in range
void SendInRange(CEntity *penSource, EventEType eetEventType, const FLOATaabbox3D &boxRange) {
  switch (eetEventType) {
    // send START event
    case EET_START:
      penSource->SendEventInRange(EStart(), boxRange);
      break;
    // send STOP event
    case EET_STOP:
      penSource->SendEventInRange(EStop(), boxRange);
      break;
    // send TRIGGER event
    case EET_TRIGGER:
      penSource->SendEventInRange(ETrigger(), boxRange);
      break;
    // don't send event (IGNORE)
    case EET_IGNORE:
      break;
    // send ACTIVATE event
    case EET_ACTIVATE:
      penSource->SendEventInRange(EActivate(), boxRange);
      break;
    // send DEACTIVATE event
    case EET_DEACTIVATE:
      penSource->SendEventInRange(EDeactivate(), boxRange);
      break;
    // send ENVIRONMENTSTART event
    case EET_ENVIRONMENTSTART:
      penSource->SendEventInRange(EEnvironmentStart(), boxRange);
      break;
    // send ENVIRONMENTSTOP event
    case EET_ENVIRONMENTSTOP:
      penSource->SendEventInRange(EEnvironmentStop(), boxRange);
      break;
    // send STARTATTACK event
    case EET_STARTATTACK:
      penSource->SendEventInRange(EStartAttack(), boxRange);
      break;
    // send STOPATTACK event
    case EET_STOPATTACK:
      penSource->SendEventInRange(EStopAttack(), boxRange);
      break;
    case EET_STOPBLINDNESS:
      penSource->SendEventInRange(EStopBlindness(), boxRange);
      break;
    case EET_STOPDEAFNESS:
      penSource->SendEventInRange(EStopDeafness(), boxRange);
      break;
    case EET_STOPDORMANCY:
      penSource->SendEventInRange(EStopDormancy(), boxRange);
      break;
    case EET_STOPANOSMIA:
      penSource->SendEventInRange(EStopAnosmia(), boxRange);
      break;
    case EET_LOCK:
      penSource->SendEventInRange(ELock(), boxRange);
      break;
    case EET_UNLOCK:
      penSource->SendEventInRange(EUnlock(), boxRange);
      break;
  }
};

// spawn reminder
CEntityPointer SpawnReminder(CEntity *penOwner, FLOAT fWaitTime, INDEX iValue, BOOL bLooped) {
  CEntityPointer penReminder;
  try {
    penReminder = penOwner->GetWorld()->CreateEntity_t
      (penOwner->GetPlacement(), CTFILENAME("Classes\\Reminder.ecl"));
  } catch (char *strError) {
    FatalError(TRANS("Cannot create reminder entity class: %s"), strError);
  }
  EReminderInit eri;
  eri.penOwner = penOwner;
  eri.fWaitTime = fWaitTime;
  eri.iValue = iValue;
  eri.bLooped = bLooped; // [Cecil]
  penReminder->Initialize(eri);

  return penReminder;
};

EffectParticlesType GetParticleEffectTypeForSurface(INDEX iSurfaceType)
{
  EffectParticlesType eptType = EPT_BULLET_STONE;
  switch( iSurfaceType)
  {
    case SURFACE_SAND:
    case SURFACE_SAND_NOIMPACT:
      {eptType=EPT_BULLET_SAND; break;}
    case SURFACE_RED_SAND:
    case SURFACE_RED_SAND_NOIMPACT:
    {eptType=EPT_BULLET_RED_SAND; break;}
    case SURFACE_WATER:    {eptType=EPT_BULLET_WATER; break;}
    case SURFACE_GRASS:
    case SURFACE_GRASS_SLIDING:
    case SURFACE_GRASS_NOIMPACT:
      {eptType=EPT_BULLET_GRASS; break;}
    case SURFACE_WOOD:
    case SURFACE_WOOD_NOIMPACT:
      {eptType=EPT_BULLET_WOOD; break;}
    case SURFACE_SNOW:     
    case SURFACE_SNOW_NOIMPACT:
      {eptType=EPT_BULLET_SNOW; break;}
    case SURFACE_METAL:
    case SURFACE_METAL_NOIMPACT:
      {eptType = EPT_BULLET_METAL; break; }
    case SURFACE_CARPET:
    case SURFACE_CARPET_NOIMPACT:
      {eptType = EPT_BULLET_CARPET; break; }
    case SURFACE_BLOOD: {eptType = EPT_BULLET_BLOOD; break; }
    case SURFACE_GLASS:
    case SURFACE_GLASS_NOIMPACT:
      {eptType = EPT_BULLET_GLASS; break; }
    case SURFACE_DIRT:
    case SURFACE_DIRT_NOIMPACT:
    {eptType = EPT_BULLET_DIRT; break; }
    case SURFACE_TILE:
    case SURFACE_TILE_NOIMPACT:
    {eptType = EPT_BULLET_TILE; break; }
    case SURFACE_CHAINLINK:
    case SURFACE_CHAINLINK_NOIMPACT:
    {eptType = EPT_BULLET_CHAINLINK; break; }
    case SURFACE_ACID: {eptType = EPT_BULLET_ACID; break; }
    case SURFACE_GRATE:
    case SURFACE_GRATE_NOIMPACT:
    {eptType = EPT_BULLET_GRATE; break; }
    case SURFACE_MUD:
    case SURFACE_MUD_NOIMPACT:
    {eptType = EPT_BULLET_MUD; break; }
    case SURFACE_VENT:
    case SURFACE_VENT_NOIMPACT:
    {eptType = EPT_BULLET_VENT; break; }
    case SURFACE_COMPUTER:
    case SURFACE_COMPUTER_NOIMPACT:
    {eptType = EPT_BULLET_COMPUTER; break; }
    case SURFACE_FUSEBOX:
    case SURFACE_FUSEBOX_NOIMPACT:
    {eptType = EPT_BULLET_FUSEBOX; break; }
    case SURFACE_GRAVEL:
    case SURFACE_GRAVEL_NOIMPACT:
    {eptType = EPT_BULLET_GRAVEL; break; }
    case SURFACE_GLITCH:
    case SURFACE_GLITCH_NOIMPACT:
    {eptType = EPT_BULLET_GLITCH; break; }
    case SURFACE_ICE:
    {eptType = EPT_BULLET_ICE; break; }
    case SURFACE_LAVA:
    {eptType = EPT_BULLET_LAVA; break; }
    case SURFACE_CEMENT:
    case SURFACE_CEMENT_NOIMPACT:
    {eptType = EPT_BULLET_CEMENT; break; }
  }
  return eptType;
}

BulletHitType GetBulletHitTypeForSurface(INDEX iSurfaceType)
{
  BulletHitType bhtType = BHT_BRUSH_STONE;
  switch( iSurfaceType)
  {
    case SURFACE_SAND:   
    case SURFACE_SAND_NOIMPACT:
      {bhtType=BHT_BRUSH_SAND; break;}
    case SURFACE_RED_SAND: 
    case SURFACE_RED_SAND_NOIMPACT:
      {bhtType=BHT_BRUSH_RED_SAND; break;}
    case SURFACE_WATER:    {bhtType=BHT_BRUSH_WATER; break;}
    case SURFACE_GRASS:
    case SURFACE_GRASS_SLIDING:
    case SURFACE_GRASS_NOIMPACT:
      {bhtType=BHT_BRUSH_GRASS; break;}
    case SURFACE_WOOD:
    case SURFACE_WOOD_NOIMPACT:
    {bhtType=BHT_BRUSH_WOOD; break;}
    case SURFACE_SNOW:   
    case SURFACE_SNOW_NOIMPACT:
      {bhtType=BHT_BRUSH_SNOW; break;}
    case SURFACE_METAL:
    case SURFACE_METAL_NOIMPACT:
    {bhtType = BHT_BRUSH_METAL; break; }
    case SURFACE_CARPET: 
    case SURFACE_CARPET_NOIMPACT:
    {bhtType = BHT_BRUSH_CARPET; break; }
    case SURFACE_BLOOD: {bhtType = BHT_BRUSH_BLOOD; break; }
    case SURFACE_GLASS:
    case SURFACE_GLASS_NOIMPACT:
    {bhtType = BHT_BRUSH_GLASS; break; }
    case SURFACE_DIRT:
    case SURFACE_DIRT_NOIMPACT:
    {bhtType = BHT_BRUSH_DIRT; break; }
    case SURFACE_TILE:
    case SURFACE_TILE_NOIMPACT:
    {bhtType = BHT_BRUSH_TILE; break; }
    case SURFACE_CHAINLINK:
    case SURFACE_CHAINLINK_NOIMPACT:
    {bhtType = BHT_BRUSH_CHAINLINK; break; }
    case SURFACE_ACID: {bhtType = BHT_BRUSH_ACID; break; }
    case SURFACE_GRATE:
    case SURFACE_GRATE_NOIMPACT:
    {bhtType = BHT_BRUSH_GRATE; break; }
    case SURFACE_MUD:
    case SURFACE_MUD_NOIMPACT:
    {bhtType = BHT_BRUSH_MUD; break; }
    case SURFACE_VENT:
    case SURFACE_VENT_NOIMPACT:
    {bhtType = BHT_BRUSH_VENT; break; }
    case SURFACE_COMPUTER:
    case SURFACE_COMPUTER_NOIMPACT:
    {bhtType = BHT_BRUSH_COMPUTER; break; }
    case SURFACE_FUSEBOX:
    case SURFACE_FUSEBOX_NOIMPACT:
    {bhtType = BHT_BRUSH_FUSEBOX; break; }
    case SURFACE_GRAVEL:
    case SURFACE_GRAVEL_NOIMPACT:
    {bhtType = BHT_BRUSH_GRAVEL; break; }
    case SURFACE_GLITCH:
    case SURFACE_GLITCH_NOIMPACT:
    {bhtType = BHT_BRUSH_GLITCH; break; }
    case SURFACE_ICE:
    {bhtType = BHT_BRUSH_ICE; break; }
    case SURFACE_LAVA:
    {bhtType = BHT_BRUSH_LAVA; break; }
    case SURFACE_CEMENT:
    case SURFACE_CEMENT_NOIMPACT:
    {bhtType = BHT_BRUSH_CEMENT; break; }
  }
  return bhtType;
}

// spawn effect from hit type
void SpawnHitTypeEffect(CEntity *pen, enum BulletHitType bhtType, BOOL bSound, FLOAT3D vHitNormal, FLOAT3D vHitPoint,
  FLOAT3D vIncommingBulletDir, FLOAT3D vDistance)
{
  switch (bhtType)
  {
    case BHT_BRUSH_STONE:
    case BHT_BRUSH_SAND:
    case BHT_BRUSH_RED_SAND:
    case BHT_BRUSH_WATER:
    case BHT_BRUSH_UNDER_WATER:
    case BHT_BRUSH_GRASS:
    case BHT_BRUSH_WOOD:
    case BHT_BRUSH_SNOW:
    case BHT_BRUSH_METAL:
    case BHT_BRUSH_CARPET:
    case BHT_BRUSH_BLOOD:
    case BHT_BRUSH_UNDER_BLOOD:
    case BHT_BRUSH_GLASS:
    case BHT_BRUSH_DIRT:
    case BHT_BRUSH_TILE:
    case BHT_BRUSH_CHAINLINK:
    case BHT_BRUSH_ACID:
    case BHT_BRUSH_GRATE:
    case BHT_BRUSH_MUD:
    case BHT_BRUSH_VENT:
    case BHT_BRUSH_COMPUTER:
    case BHT_BRUSH_FUSEBOX:
    case BHT_BRUSH_GRAVEL:
    case BHT_BRUSH_GLITCH:
    case BHT_BRUSH_ICE:
    case BHT_BRUSH_LAVA:
    case BHT_BRUSH_CEMENT:
    {
      // bullet stain
      ESpawnEffect ese;
      if( bSound)
      {
        if( bhtType == BHT_BRUSH_STONE)         {ese.betType = BET_BULLETSTAINSTONE;};
        if( bhtType == BHT_BRUSH_SAND)          {ese.betType = BET_BULLETSTAINSAND;};
        if( bhtType == BHT_BRUSH_RED_SAND)      {ese.betType = BET_BULLETSTAINREDSAND;};
        if( bhtType == BHT_BRUSH_WATER)         {ese.betType = BET_BULLETSTAINWATER;};
        if( bhtType == BHT_BRUSH_UNDER_WATER)   { ese.betType = BET_BULLETSTAINUNDERWATER; };
        if( bhtType == BHT_BRUSH_GRASS)         {ese.betType = BET_BULLETSTAINGRASS;};
        if( bhtType == BHT_BRUSH_WOOD)          {ese.betType = BET_BULLETSTAINWOOD;};
        if( bhtType == BHT_BRUSH_SNOW)          {ese.betType = BET_BULLETSTAINSNOW;};
        if (bhtType == BHT_BRUSH_METAL)         { ese.betType = BET_BULLETSTAINMETAL; };
        if (bhtType == BHT_BRUSH_CARPET)        { ese.betType = BET_BULLETSTAINCARPET; };
        if (bhtType == BHT_BRUSH_BLOOD)         { ese.betType = BET_BULLETSTAINBLOOD; };
        if (bhtType == BHT_BRUSH_UNDER_BLOOD)   { ese.betType = BET_BULLETSTAINUNDERBLOOD; };
        if (bhtType == BHT_BRUSH_GLASS)         { ese.betType = BET_BULLETSTAINGLASS; };
        if (bhtType == BHT_BRUSH_DIRT)          { ese.betType = BET_BULLETSTAINDIRT; };
        if (bhtType == BHT_BRUSH_TILE)          { ese.betType = BET_BULLETSTAINTILE; };
        if (bhtType == BHT_BRUSH_CHAINLINK)     { ese.betType = BET_BULLETSTAINCHAINLINK; };
        if (bhtType == BHT_BRUSH_ACID)          { ese.betType = BET_BULLETSTAINACID; };
        if (bhtType == BHT_BRUSH_UNDER_ACID)    { ese.betType = BET_BULLETSTAINUNDERACID; };
        if (bhtType == BHT_BRUSH_GRATE)         { ese.betType = BET_BULLETSTAINGRATE; };
        if (bhtType == BHT_BRUSH_MUD)           { ese.betType = BET_BULLETSTAINMUD; };
        if (bhtType == BHT_BRUSH_VENT)          { ese.betType = BET_BULLETSTAINVENT; };
        if (bhtType == BHT_BRUSH_COMPUTER)      { ese.betType = BET_BULLETSTAINCOMPUTER; };
        if (bhtType == BHT_BRUSH_FUSEBOX)       { ese.betType = BET_BULLETSTAINFUSEBOX; };
        if (bhtType == BHT_BRUSH_GRAVEL)        { ese.betType = BET_BULLETSTAINGRAVEL; };
        if (bhtType == BHT_BRUSH_GLITCH)        { ese.betType = BET_BULLETSTAINGLITCH; };
        if (bhtType == BHT_BRUSH_ICE)           { ese.betType = BET_BULLETSTAINICE; };
        if (bhtType == BHT_BRUSH_LAVA)          { ese.betType = BET_BULLETSTAINLAVA; };
        if (bhtType == BHT_BRUSH_CEMENT)        { ese.betType = BET_BULLETSTAINCEMENT; };
      }
      else
      {
        if( bhtType == BHT_BRUSH_STONE)         {ese.betType = BET_BULLETSTAINSTONENOSOUND;};
        if( bhtType == BHT_BRUSH_SAND)          {ese.betType = BET_BULLETSTAINSANDNOSOUND;};
        if( bhtType == BHT_BRUSH_RED_SAND)      {ese.betType = BET_BULLETSTAINREDSANDNOSOUND;};
        if( bhtType == BHT_BRUSH_WATER)         {ese.betType = BET_BULLETSTAINWATERNOSOUND;};
        if (bhtType == BHT_BRUSH_UNDER_WATER)   { ese.betType = BET_BULLETSTAINUNDERWATERNOSOUND; };
        if( bhtType == BHT_BRUSH_GRASS)         {ese.betType = BET_BULLETSTAINGRASSNOSOUND;};
        if( bhtType == BHT_BRUSH_WOOD)          {ese.betType = BET_BULLETSTAINWOODNOSOUND;};
        if( bhtType == BHT_BRUSH_SNOW)          {ese.betType = BET_BULLETSTAINSNOWNOSOUND;};
        if (bhtType == BHT_BRUSH_METAL)         { ese.betType = BET_BULLETSTAINMETALNOSOUND; };
        if (bhtType == BHT_BRUSH_CARPET)        { ese.betType = BET_BULLETSTAINCARPETNOSOUND; };
        if (bhtType == BHT_BRUSH_BLOOD)         { ese.betType = BET_BULLETSTAINBLOODNOSOUND; };
        if (bhtType == BHT_BRUSH_UNDER_BLOOD)   { ese.betType = BET_BULLETSTAINUNDERBLOODNOSOUND; };
        if (bhtType == BHT_BRUSH_GLASS)         { ese.betType = BET_BULLETSTAINGLASSNOSOUND; };
        if (bhtType == BHT_BRUSH_DIRT)          { ese.betType = BET_BULLETSTAINDIRTNOSOUND; };
        if (bhtType == BHT_BRUSH_TILE)          { ese.betType = BET_BULLETSTAINTILENOSOUND; };
        if (bhtType == BHT_BRUSH_CHAINLINK)     { ese.betType = BET_BULLETSTAINCHAINLINKNOSOUND; };
        if (bhtType == BHT_BRUSH_ACID)          { ese.betType = BET_BULLETSTAINACIDNOSOUND; };
        if (bhtType == BHT_BRUSH_UNDER_ACID)    { ese.betType = BET_BULLETSTAINUNDERACIDNOSOUND; };
        if (bhtType == BHT_BRUSH_GRATE)         { ese.betType = BET_BULLETSTAINGRATENOSOUND; };
        if (bhtType == BHT_BRUSH_MUD)           { ese.betType = BET_BULLETSTAINMUDNOSOUND; };
        if (bhtType == BHT_BRUSH_VENT)          { ese.betType = BET_BULLETSTAINVENTNOSOUND; };
        if (bhtType == BHT_BRUSH_COMPUTER)      { ese.betType = BET_BULLETSTAINCOMPUTERNOSOUND; };
        if (bhtType == BHT_BRUSH_FUSEBOX)       { ese.betType = BET_BULLETSTAINFUSEBOXNOSOUND; };
        if (bhtType == BHT_BRUSH_GRAVEL)        { ese.betType = BET_BULLETSTAINGRAVELNOSOUND; };
        if (bhtType == BHT_BRUSH_GLITCH)        { ese.betType = BET_BULLETSTAINGLITCHNOSOUND; };
        if (bhtType == BHT_BRUSH_ICE)           { ese.betType = BET_BULLETSTAINICENOSOUND; };
        if (bhtType == BHT_BRUSH_LAVA)          { ese.betType = BET_BULLETSTAINLAVANOSOUND; };
        if (bhtType == BHT_BRUSH_CEMENT)        { ese.betType = BET_BULLETSTAINCEMENTNOSOUND; };
      }

      ese.vNormal = vHitNormal;
      ese.colMuliplier = C_WHITE|CT_OPAQUE;
      // reflect direction arround normal
      FLOAT fNx = vHitNormal(1);
      FLOAT fNy = vHitNormal(2);
      FLOAT fNz = vHitNormal(3);
      FLOAT fNV  = fNx*vIncommingBulletDir(1) + fNy*vIncommingBulletDir(2) + fNz*vIncommingBulletDir(3);
      FLOAT fRVx = vIncommingBulletDir(1) - 2*fNx*fNV;
      FLOAT fRVy = vIncommingBulletDir(2) - 2*fNy*fNV;
      FLOAT fRVz = vIncommingBulletDir(3) - 2*fNz*fNV;
      ese.vStretch = FLOAT3D( fRVx, fRVy, fRVz);

      try
      {
        // spawn effect
        CPlacement3D plHit = CPlacement3D(vHitPoint-vIncommingBulletDir*0.1f, pen->GetPlacement().pl_OrientationAngle);
        CEntityPointer penHit = pen->GetWorld()->CreateEntity_t(plHit , CTFILENAME("Classes\\BasicEffect.ecl"));
        penHit->Initialize(ese);
      }
      catch (char *strError)
      {
        FatalError(TRANS("Cannot create basic effect class: %s"), strError);
      }
      break;
    }
    case BHT_FLESH:
    case BHT_ACID:
    case BHT_ORANGEFLESH:
    case BHT_YELLOWFLESH:
    case BHT_BLACKFLESH:
    {
      // spawn bullet entry wound
      ESpawnEffect ese;
      ese.colMuliplier = C_WHITE|CT_OPAQUE;
      // if there is exit wound blood spill place
      FLOAT fDistance = vDistance.Length();
      if( fDistance>0.01f && !(pen->IRnd()%2) )
      {
        // spawn bullet exit wound blood patch
        ese.betType = BET_BLOODSPILL;
        if( bhtType == BHT_ACID)
        {
          ese.colMuliplier = BLOOD_SPILL_GREEN;
        }
        else if (bhtType == BHT_ORANGEFLESH)
        {
            ese.colMuliplier = BLOOD_SPILL_ORANGE;
        }
        else if (bhtType == BHT_YELLOWFLESH)
        {
            ese.colMuliplier = BLOOD_SPILL_YELLOW;
        }
        else if (bhtType == BHT_BLACKFLESH)
        {
            ese.colMuliplier = BLOOD_SPILL_BLACK;
        }
        else
        {
          ese.colMuliplier = BLOOD_SPILL_RED;
        }
        ese.vNormal = vHitNormal;
        if (fDistance<25.0f)
        {
          GetNormalComponent( vDistance/fDistance, vHitNormal, ese.vDirection);
          FLOAT fLength = ese.vDirection.Length();
          fLength   = Clamp( fLength*3.0f, 1.0f, 3.0f);
          fDistance = Clamp( (FLOAT)log10(fDistance), 0.5f, 2.0f);
          ese.vStretch = FLOAT3D( fDistance, fLength*fDistance, 1.0f);
          try
          {
            // spawn effect
            CPlacement3D plHit = CPlacement3D(vHitPoint-vIncommingBulletDir*0.1f, pen->GetPlacement().pl_OrientationAngle);
            CEntityPointer penHit = pen->GetWorld()->CreateEntity_t(plHit , CTFILENAME("Classes\\BasicEffect.ecl"));
            penHit->Initialize(ese);
          }
          catch (char *strError)
          {
            FatalError(TRANS("Cannot create basic effect class: %s"), strError);
          }
        }
      }
      break;
    }
  }
}

// spawn flame
CEntityPointer SpawnFlame(CEntity *penOwner, CEntity *penAttach, const FLOAT3D &vSource)
{
  // owner can't flame himself
  if( penOwner==penAttach) return NULL;
  FLOAT3D vPos = vSource;
  // prepare flame event
  EFlame ef;
  ef.penOwner = penOwner;
  ef.penAttach = penAttach;

  CEntityPointer penFlame;

  // if the target entity is model
  if (penAttach->GetRenderType()==CEntity::RT_MODEL || 
      penAttach->GetRenderType()==CEntity::RT_SKAMODEL) {

    vPos = penAttach->GetPlacement().pl_PositionVector;
    // if the entity already has a flame attached
    penFlame = penAttach->GetChildOfClass("Flame");
    if (penFlame!=NULL) {
      // just send it the event
      penFlame->SendEvent(ef);
      return penFlame;
    }
  }

  // create new flame
  try {
    CPlacement3D plFlame(vPos, ANGLE3D(0, 0, 0));
    penFlame = penAttach->GetWorld()->CreateEntity_t(plFlame, CTFILENAME("Classes\\Flame.ecl"));
  } catch (char *strError) {
    FatalError(TRANS("Cannot create flame entity class: %s"), strError);
  }
  penFlame->Initialize(ef);

  return penFlame;
};

// Kick entity
void KickEntity(CEntity *penTarget, FLOAT3D vSpeed) {
  // if the entity is not allowed to execute now
  if (!penTarget->IsAllowedForPrediction()) {
    // do nothing
    return;
  }
  EntityInfo *peiTarget = (EntityInfo*) (penTarget->GetEntityInfo());
  if (penTarget->GetPhysicsFlags()&EPF_MOVABLE && peiTarget!=NULL) {
    // calc new speed acording to target mass
    vSpeed *= 100.0f/peiTarget->fMass;
    ((CMovableEntity&)*penTarget).en_vCurrentTranslationAbsolute = vSpeed;
    ((CMovableEntity&)*penTarget).AddToMovers();
  }
};



/************************************************************
 *                   SET MODEL AND ATTACHMENT               *
 ************************************************************/
  // Set components
  void SetComponents(CEntity *pen, CModelObject &mo, ULONG ulIDModel, ULONG ulIDTexture,
                     ULONG ulIDReflectionTexture, ULONG ulIDSpecularTexture, ULONG ulIDBumpTexture) {
    // model data
    mo.SetData(pen->GetModelDataForComponent(ulIDModel));
    // texture data
    mo.mo_toTexture.SetData(pen->GetTextureDataForComponent(ulIDTexture));
    // reflection texture data
    if (ulIDReflectionTexture>0) {
      mo.mo_toReflection.SetData(pen->GetTextureDataForComponent(ulIDReflectionTexture));
    } else {
      mo.mo_toReflection.SetData(NULL);
    }
    // specular texture data
    if (ulIDSpecularTexture>0) {
      mo.mo_toSpecular.SetData(pen->GetTextureDataForComponent(ulIDSpecularTexture));
    } else {
      mo.mo_toSpecular.SetData(NULL);
    }
    // bump texture data
    if (ulIDBumpTexture>0) {
      mo.mo_toBump.SetData(pen->GetTextureDataForComponent(ulIDBumpTexture));
    } else {
      mo.mo_toBump.SetData(NULL);
    }
  };

  // Add attachment to model
  void AddAttachmentToModel(CEntity *pen, CModelObject &mo, INDEX iAttachment, ULONG ulIDModel, ULONG ulIDTexture,
                            ULONG ulIDReflectionTexture, ULONG ulIDSpecularTexture, ULONG ulIDBumpTexture) {
    SetComponents(pen, mo.AddAttachmentModel(iAttachment)->amo_moModelObject, ulIDModel,
                  ulIDTexture, ulIDReflectionTexture, ulIDSpecularTexture, ulIDBumpTexture);
  };

  // Remove attachment from model
  void RemoveAttachmentFromModel(CModelObject &mo, INDEX iAttachment) {
    mo.RemoveAttachmentModel(iAttachment);
  };



/************************************************************
 *                          FLARES                          *
 ************************************************************/
// lens flare variables
CLensFlareType _lftOrange;
CLensFlareType _lftBlue;
CLensFlareType _lftWhite;
CLensFlareType _lftRed;
static BOOL _bLensFlaresLoaded = FALSE;

#define FLARE_CREATE(type,noof,tex,pos,rot,i,j,flags,amp,des,falloff)\
  type.lft_aolfFlares.New(noof);\
  type.lft_aolfFlares[0].olf_toTexture.SetData_t(CTFILENAME("Textures\\Effects\\Flares\\" tex));\
  type.lft_aolfFlares[0].olf_fReflectionPosition = pos;\
  type.lft_aolfFlares[0].olf_aRotationFactor = AngleDeg(rot);\
  type.lft_aolfFlares[0].olf_fSizeIOverScreenSizeI = i;\
  type.lft_aolfFlares[0].olf_fSizeJOverScreenSizeI = j;\
  type.lft_aolfFlares[0].olf_ulFlags = flags;\
  type.lft_aolfFlares[0].olf_fLightAmplification = amp;\
  type.lft_aolfFlares[0].olf_fLightDesaturation = des;\
  type.lft_aolfFlares[0].oft_fFallOffFactor = falloff;
#define FLARE_GLARE(type,compression,intensity,des,falloff)\
  type.lft_fGlareCompression = compression;\
  type.lft_fGlareIntensity = intensity;\
  type.lft_fGlareDesaturation = des;\
  type.lft_fGlareFallOffFactor = falloff;
#define REFLECTION(type,i,fnm,pos,size) \
  type.lft_aolfFlares[i].olf_toTexture.SetData_t(CTFILENAME("Textures\\Effects\\Flares\\" fnm));\
  type.lft_aolfFlares[i].olf_fReflectionPosition = pos;\
  type.lft_aolfFlares[i].olf_aRotationFactor = AngleDeg(0.0f);\
  type.lft_aolfFlares[i].olf_fSizeIOverScreenSizeI = size;\
  type.lft_aolfFlares[i].olf_fSizeJOverScreenSizeI = size;\
  type.lft_aolfFlares[i].olf_ulFlags = OLF_FADEINTENSITY|OLF_FADEOFCENTER;\
  type.lft_aolfFlares[i].olf_fLightAmplification = 7.0f;\
  type.lft_aolfFlares[i].olf_fLightDesaturation = 0.5f;\
  type.lft_aolfFlares[i].oft_fFallOffFactor = 5.0f;

// init lens flare effects
void InitLensFlares(void) {
  if (_bLensFlaresLoaded) {
    return; // Player class is not auto-freed, so the engine may attempt to access this function several times
  }

  // Orange Flare 1
  FLARE_CREATE(_lftOrange, 1, "Orange01\\OrangeFlare01.tex", 0.0f, 180.0f, 1/5.0f, 1/5.0f, OLF_FADESIZE, 7.0f, 0.5f, 5.0f);
  FLARE_GLARE(_lftOrange, 20.0f, 0.3f, 0.8f, 1.0f);

  // Blue Flare 1
  FLARE_CREATE(_lftBlue, 1, "Blue01\\BlueFlare01.tex", 0.0f, 180.0f, 1 / 5.0f, 1 / 5.0f, OLF_FADESIZE, 7.0f, 0.5f, 5.0f);
  FLARE_GLARE(_lftBlue, 20.0f, 0.3f, 0.8f, 1.0f);

  // White Flare 1
  FLARE_CREATE(_lftWhite, 1, "White01\\WhiteFlare01.tex", 0.0f, 180.0f, 1 / 5.0f, 1 / 5.0f, OLF_FADESIZE, 7.0f, 0.5f, 5.0f);
  FLARE_GLARE(_lftWhite, 20.0f, 0.3f, 0.8f, 1.0f);

  // Red Flare 1
  FLARE_CREATE(_lftRed, 1, "Red01\\RedFlare01.tex", 0.0f, 180.0f, 1 / 5.0f, 1 / 5.0f, OLF_FADESIZE, 7.0f, 0.5f, 5.0f);
  FLARE_GLARE(_lftRed, 20.0f, 0.3f, 0.8f, 1.0f);

  _bLensFlaresLoaded = TRUE;
};

// close lens flares effects
void CloseLensFlares(void) {
  _lftOrange.lft_aolfFlares.Clear();
  _lftBlue.lft_aolfFlares.Clear();
  _lftWhite.lft_aolfFlares.Clear();
  _lftRed.lft_aolfFlares.Clear();
  _bLensFlaresLoaded = FALSE;
};

static BOOL _bFatalChecks = FALSE;


/************************************************************
 *                      PLAYER APPEARANCE                   *
 ************************************************************/
/* Set the model data */
void SetModelData_t(CModelObject *pmo, const CTFileName &fnmModel) {
  ASSERT(pmo != NULL);
  pmo->SetData_t(fnmModel);   // load the new model data
};

/* Set the texture data */
void SetTextureData_t(CModelObject *pmo, const CTFileName &fnmTexture) {
  ASSERT(pmo != NULL);
  pmo->mo_toTexture.SetData_t(fnmTexture);    // load the texture data
};

/* Set model */
void SetModel_t(CModelObject *pmo, const CTFileName &fnmModel, const CTFileName &fnmTexture) {
  SetModelData_t(pmo, fnmModel);
  SetTextureData_t(pmo, fnmTexture);
};

/* Add attachment to model */
void ModelAddAttachment_t(CModelObject *pmo, INDEX iAttachment, 
                        const CTFileName &fnmModel, const CTFileName &fnmTexture) {
  ASSERT(pmo != NULL);
  if (fnmModel==CTString("")) return;
  if (pmo==NULL) return;
  
  CAttachmentModelObject *pamo = pmo->AddAttachmentModel(iAttachment);
  SetModel_t(&(pamo->amo_moModelObject), fnmModel, fnmTexture);
};

CTString _strFile;
INDEX _ctLines;

CTString GetNonEmptyLine_t(CTStream &strm)
{
  FOREVER {
   if(strm.AtEOF()) {
     ThrowF_t(TRANS("Unexpected end of file"));
   }
   CTString str;
   _ctLines++;
   strm.GetLine_t(str);
   str.TrimSpacesLeft();
   if (str.RemovePrefix("//")) {  // skip comments
     continue;
   }
   if (str!="") {
     str.TrimSpacesRight();
     return str;
   }
  }
}

void FixupFileName_t(CTString &strFnm)
{
  strFnm.TrimSpacesLeft();
  if (!strFnm.RemovePrefix(CTString("TF") +"NM ")) {  // must not directly have ids in code
    ThrowF_t(TRANS("Expected %s%s before filename"), "TF", "NM");
  }
}

// skip one block in pmc
void SkipBlock_t(CTStream &strm)
{
  CTString strLine;
  // expect to begin with an open bracket
  strLine = GetNonEmptyLine_t(strm);
  if (strLine!="{") {
    ThrowF_t(TRANS("Expected '{'"));
  }
  // start at level one
  INDEX ctLevel = 1;
  // repeat
  do {
    strLine = GetNonEmptyLine_t(strm);
    // count brackets
    if (strLine=="{") {
      ctLevel++;
    } else if (strLine=="}") {
      ctLevel--;
    }
  // until we close down all brackets
  } while(ctLevel>0);
}

void ParseAMC_t(CModelObject *pmo, CTStream &strm, BOOL bPreview)
{
  CTString strLine;
  // expect to begin with an open bracket
  strLine = GetNonEmptyLine_t(strm);
  if (strLine!="{") {
    ThrowF_t(TRANS("Expected '{'"));
  }

  // repeat
  FOREVER {
    // read one line
    strLine = GetNonEmptyLine_t(strm);
    
    // if closed bracket
    if (strLine == "}") {
      // finish parsing
      return;
    }


    // if a preview-only block
    if (strLine.RemovePrefix("PreviewOnly")) {
      // if this is a preview
      if (bPreview) {
        // keep parsing it
        ParseAMC_t(pmo, strm, bPreview);
      // if this is not a preview
      } else {
        // skip that block
        SkipBlock_t(strm);
      }
    // if include block
    } else if (strLine.RemovePrefix("Include:")) {
      // open the new file
      FixupFileName_t(strLine);
      CTFileStream strmIncluded;
      strmIncluded.Open_t(strLine);

      // include it
      INDEX ctLinesOld = _ctLines;
      CTString strFileOld = _strFile;
      _ctLines = 0;
      _strFile = strLine;
      ParseAMC_t(pmo, strmIncluded, bPreview);
      strmIncluded.Close();
      _ctLines = ctLinesOld;
      _strFile = strFileOld;

    // if setting the model
    } else if (strLine.RemovePrefix("Model:")) {
      // set the model
      FixupFileName_t(strLine);
      pmo->SetData_t(strLine);

    // if setting an anim for the model
    } else if (strLine.RemovePrefix("Animation:")) {
      // get animation number
      INDEX iAnim = -1;
      strLine.ScanF("%d", &iAnim);
      if (iAnim<0) {
        ThrowF_t(TRANS("Invalid animation number"));
      }
      // check it
      if (iAnim>=pmo->GetAnimsCt()) {
        ThrowF_t(TRANS("Animation %d does not exist in that model"), iAnim);
      };
      // set it
      pmo->PlayAnim(iAnim, AOF_LOOPING);

    // if texture
    } else if (strLine.RemovePrefix("Texture:")) {
      // set texture
      FixupFileName_t(strLine);
      pmo->mo_toTexture.SetData_t(strLine);

    // if specular
    } else if (strLine.RemovePrefix("Specular:")) {
      // set texture
      FixupFileName_t(strLine);
      pmo->mo_toSpecular.SetData_t(strLine);

    // if reflection
    } else if (strLine.RemovePrefix("Reflection:")) {
      // set texture
      FixupFileName_t(strLine);
      pmo->mo_toReflection.SetData_t(strLine);

    // if bump
    } else if (strLine.RemovePrefix("Bump:")) {
      // set texture
      FixupFileName_t(strLine);
      pmo->mo_toBump.SetData_t(strLine);

    // if attachment
    } else if (strLine.RemovePrefix("Attachment:")) {
      // get attachment number
      INDEX iAtt = -1;
      strLine.ScanF("%d", &iAtt);
      if (iAtt<0) {
        ThrowF_t(TRANS("Invalid attachment number"));
      }
      // create attachment
      CModelData *pmd = (CModelData*)pmo->GetData();
      if (iAtt>=pmd->md_aampAttachedPosition.Count()) {
        ThrowF_t(TRANS("Attachment %d does not exist in that model"), iAtt);
      };
      CAttachmentModelObject *pamo = pmo->AddAttachmentModel(iAtt);
      
      // recursively parse it
      ParseAMC_t(&pamo->amo_moModelObject, strm, bPreview);
    } else {
      ThrowF_t(TRANS("Expected texture or attachment"));
    }
  }
}

/* Set player appearance */
BOOL SetPlayerAppearance_internal(CModelObject *pmo, const CTFileName &fnmAMC, CTString &strName, BOOL bPreview)
{
  // try to
  try {
    // open the config file
    CTFileStream strm;
    strm.Open_t(fnmAMC);

    _ctLines = 0;
    _strFile = fnmAMC;

    // read the name
    CTString strLine = GetNonEmptyLine_t(strm);
    if (!strLine.RemovePrefix("Name: ")) {
      ThrowF_t(TRANS("Expected name"));
    }
    strName = strLine;
    strName.TrimSpacesLeft();

    // parse the file recursively starting at root model object and add everything
    ParseAMC_t(pmo, strm, bPreview);
    return TRUE;

  // if anything failed
  } catch (char *strError) {
    // report error
    CPrintF(TRANS("Cannot load player model:\n%s (%d) : %s\n"), 
      (const char*)_strFile, _ctLines, strError);
    return FALSE;
  }
}

BOOL SetPlayerAppearance(CModelObject *pmo, CPlayerCharacter *ppc, CTString &strName, BOOL bPreview)
{
  // first kill any existing model
  pmo->SetData(NULL);
  pmo->mo_toTexture.SetData(NULL);
  pmo->mo_toSpecular.SetData(NULL);
  pmo->mo_toReflection.SetData(NULL);
  pmo->mo_toBump.SetData(NULL);
  pmo->RemoveAllAttachmentModels();

  DECLARE_CTFILENAME(fnmDefault, "Models\\Player\\Uni.amc");

  // if no character, or player models are disabled
  if (ppc==NULL) {
    // set default appearance
    BOOL bSucceeded = SetPlayerAppearance_internal(pmo, fnmDefault, strName, bPreview);
    if (!bSucceeded) {
      FatalError(TRANS("Cannot load default player model!"));
    }
    return FALSE;
  }

  // get filename from the settings
  CPlayerSettings *pps = (CPlayerSettings *)ppc->pc_aubAppearance;
  CTFileName fnmModelFile = pps->GetModelFilename();
  // if dummy (empty settings)
  if (fnmModelFile.FileName()=="") {
    // use default
    fnmModelFile = fnmDefault;
  }

  extern INDEX plr_bOnlySam;
  if (!plr_bOnlySam && SetPlayerAppearance_internal(pmo, fnmModelFile, strName, bPreview)) {
    return TRUE;
  } else if (SetPlayerAppearance_internal(pmo, fnmDefault, strName, bPreview)) {  // HAVE TO SET DEFAULT HERE!
    return TRUE;
  } else {
    return FALSE;
  }
}


/************************************************************
 *                    DEBUGGING FUNCTIONS                   *
 ************************************************************/
// debugging functions
const char *PrintConsole(void)
{
  _RPT1(_CRT_WARN, "%s", CON_GetBuffer());
  return NULL;
}

const char *PrintStack(CEntity *pen)
{
  return pen->PrintStackDebug();
}



/************************************************************
 *                          DEBRIS                          *
 ************************************************************/
EntityInfoBodyType _Eeibt;
enum DebrisParticlesType _dptParticles;
enum BasicEffectType  _betStain;
FLOAT3D _vSpeed;
FLOAT3D _vSpawnerSpeed;
FLOAT _fEntitySize;
FLOAT _fConeSize;
FLOAT _fSpeedUp;
COLOR _colDebris;

// debris spawning
void Debris_Begin(
  EntityInfoBodyType Eeibt, 
  enum DebrisParticlesType dptParticles,
  enum BasicEffectType  betStain,
  FLOAT fEntitySize,                  // entity size in meters
  const FLOAT3D &vSpeed,
  const FLOAT3D &vSpawnerSpeed,       // how fast was the entity moving
  const FLOAT fConeSize,              // size multiplier for debris cone
  const FLOAT fSpeedUp,               // size multiplier for debris catapulting up (0-no multiply)
  const COLOR colDebris /*=C_WHITE*/  // multiply color
)
{
  _Eeibt          = Eeibt       ;
  _dptParticles   = dptParticles;
  _betStain       = betStain    ;
  _vSpeed         = vSpeed      ;
  _vSpawnerSpeed  = vSpawnerSpeed;
  _fEntitySize    = fEntitySize ;
  _fConeSize      = fConeSize   ;
  _fSpeedUp       = fSpeedUp    ;
  _colDebris      = colDebris   ;
}

CEntityPointer Debris_Spawn(
  CEntity *penSpawner,
  CEntity *penComponents,
  SLONG idModelComponent,
  SLONG idTextureComponent,
  SLONG idReflectionTextureComponent,
  SLONG idSpecularTextureComponent,
  SLONG idBumpTextureComponent,
  INDEX iModelAnim,
  FLOAT fSize,
  const FLOAT3D &vPosRatio)
{
  // create debris at same world as spawner
  FLOAT3D vPos;
  FLOAT3D vStretch=FLOAT3D(1,1,1);
  if( (penSpawner->en_RenderType==CEntity::RT_MODEL ||
       penSpawner->en_RenderType==CEntity::RT_EDITORMODEL) &&
       penSpawner->GetModelObject()!=NULL)
  {
    vStretch=penSpawner->GetModelObject()->mo_Stretch;
  }
  penSpawner->GetEntityPointRatio(vPosRatio, vPos);
  CEntityPointer penDebris = penSpawner->GetWorld()->CreateEntity_t(
    CPlacement3D(vPos, ANGLE3D(0,0,0)), CTFILENAME("Classes\\Debris.ecl"));
  // prepare parameters
  ESpawnDebris eSpawn;
  eSpawn.bImmaterialASAP=FALSE;
  eSpawn.bCustomShading=FALSE;
  eSpawn.Eeibt = _Eeibt;
  eSpawn.dptParticles = _dptParticles;
  eSpawn.betStain = _betStain;
  eSpawn.pmd = penComponents->GetModelDataForComponent(idModelComponent);
  eSpawn.ptd = penComponents->GetTextureDataForComponent(idTextureComponent);
  eSpawn.ptdRefl = penComponents->GetTextureDataForComponent(idReflectionTextureComponent);
  eSpawn.ptdSpec = penComponents->GetTextureDataForComponent(idSpecularTextureComponent);
  eSpawn.ptdBump = penComponents->GetTextureDataForComponent(idBumpTextureComponent);
  eSpawn.iModelAnim = iModelAnim;
  eSpawn.colDebris = _colDebris;
  eSpawn.vStretch = FLOAT3D(1,1,1);
  if (fSize==0) {
    eSpawn.fSize = 1.0f;
  } else {
    eSpawn.fSize = _fEntitySize*fSize;
  }
  // initialize it
  penDebris->Initialize(eSpawn);

  FLOAT fCone = _fEntitySize*1.0f;
  if (_vSpeed.Length()==0) {
    fCone = 0;
  }
  FLOAT fRndX = (penSpawner->FRnd()*2-1)*fCone*_fConeSize;
  FLOAT fRndY = (penSpawner->FRnd()*2-1)*fCone*_fConeSize;
  FLOAT fRndZ = (penSpawner->FRnd()*2-1)*fCone*_fConeSize;

  FLOAT fRndH = penSpawner->FRnd();
  FLOAT fRndP = penSpawner->FRnd();
  FLOAT fRndB = penSpawner->FRnd();

  FLOAT3D vUp;
  const FLOATmatrix3D &m = penSpawner->GetRotationMatrix();
  vUp(1) = m(1,2);
  vUp(2) = m(2,2);
  vUp(3) = m(3,2);

  //FLOAT fStrength = _vSpeed.Length();

  // speed it up
  ((CMovableEntity&)*penDebris).LaunchAsFreeProjectile(
    _vSpawnerSpeed+_vSpeed+FLOAT3D(fRndX, fRndY, fRndZ)+vUp*_fSpeedUp, (CMovableEntity*)penSpawner);
  ((CMovableEntity&)*penDebris).SetDesiredRotation(
    ANGLE3D(fRndH*360.0f-180.0f, fRndP*360.0f-180.0f, fRndB*360.0f-180.0f));

  return penDebris;
}

CEntityPointer Debris_Spawn_Independent(
  CEntity *penSpawner,
  CEntity *penComponents,
  SLONG idModelComponent,
  SLONG idTextureComponent,
  SLONG idReflectionTextureComponent,
  SLONG idSpecularTextureComponent,
  SLONG idBumpTextureComponent,
  INDEX iModelAnim,
  FLOAT fSize,
  CPlacement3D plAbsolutePlacement,
  FLOAT3D vTranslation,
  ANGLE3D aRotation)
{
  // create debris at same world as spawner
  CEntityPointer penDebris = penSpawner->GetWorld()->CreateEntity_t(
    plAbsolutePlacement, CTFILENAME("Classes\\Debris.ecl"));
  // prepare parameters
  ESpawnDebris eSpawn;
  eSpawn.bImmaterialASAP=FALSE;
  eSpawn.bCustomShading=FALSE;
  eSpawn.Eeibt = _Eeibt;
  eSpawn.dptParticles = _dptParticles;
  eSpawn.betStain = _betStain;
  eSpawn.pmd = penComponents->GetModelDataForComponent(idModelComponent);
  eSpawn.ptd = penComponents->GetTextureDataForComponent(idTextureComponent);
  eSpawn.ptdRefl = penComponents->GetTextureDataForComponent(idReflectionTextureComponent);
  eSpawn.ptdSpec = penComponents->GetTextureDataForComponent(idSpecularTextureComponent);
  eSpawn.ptdBump = penComponents->GetTextureDataForComponent(idBumpTextureComponent);
  eSpawn.iModelAnim = iModelAnim;
  eSpawn.colDebris = _colDebris;
  eSpawn.fSize = fSize;
  eSpawn.vStretch = FLOAT3D(1,1,1);
  
  // initialize it
  penDebris->Initialize(eSpawn);

  // move it 
  ((CMovableEntity&)*penDebris).LaunchAsFreeProjectile(
    vTranslation, (CMovableEntity*)penSpawner);
  ((CMovableEntity&)*penDebris).SetDesiredRotation(aRotation);

  return penDebris;
}

CEntityPointer Debris_Spawn_Template(
  EntityInfoBodyType eibt,
  enum DebrisParticlesType dptParticles,
  enum BasicEffectType betStain,
  CModelHolder2 *penmhDestroyed,
  CEntity *penComponents,
  CModelHolder2 *penmhTemplate,
  FLOAT3D vStretch,
  FLOAT fSize,
  CPlacement3D plAbsolutePlacement,
  FLOAT3D vLaunchSpeed,
  ANGLE3D aRotSpeed,
  BOOL bDebrisImmaterialASAP,
  FLOAT fDustStretch,
  COLOR colBurning)
{
  if(penmhTemplate==NULL || penmhTemplate->GetModelObject()==NULL)
  {
    return NULL;
  }
  // create debris at same world as spawner
  CEntityPointer penDebris = penmhDestroyed->GetWorld()->CreateEntity_t(
    plAbsolutePlacement, CTFILENAME("Classes\\Debris.ecl"));
  // prepare parameters
  ESpawnDebris eSpawn;
  eSpawn.bImmaterialASAP=bDebrisImmaterialASAP;
  eSpawn.fDustStretch=fDustStretch;
  eSpawn.Eeibt = eibt;
  eSpawn.dptParticles = dptParticles;
  eSpawn.betStain = betStain;
  CModelObject &mo=*penmhTemplate->GetModelObject();
  eSpawn.pmd = mo.GetData();
  eSpawn.ptd = (CTextureData*)mo.mo_toTexture.GetData();
  eSpawn.ptdRefl = (CTextureData*)mo.mo_toReflection.GetData();
  eSpawn.ptdSpec = (CTextureData*)mo.mo_toSpecular.GetData();
  eSpawn.ptdBump = (CTextureData*)mo.mo_toBump.GetData();
  eSpawn.iModelAnim = mo.GetAnim();
  eSpawn.colDebris = colBurning;
  eSpawn.fSize = 1.0f;
  eSpawn.vStretch = vStretch;
  eSpawn.bCustomShading=FALSE;
  eSpawn.penFallFXPapa=penmhTemplate;
  if( penmhDestroyed->m_cstCustomShading==CST_FULL_CUSTOMIZED)
  {
    eSpawn.bCustomShading=TRUE;
    eSpawn.aShadingDirection=penmhDestroyed->m_aShadingDirection;
    eSpawn.colCustomDiffuse=penmhDestroyed->m_colLight;
    eSpawn.colCustomAmbient=penmhDestroyed->m_colAmbient;
  }
  
  // initialize it
  penDebris->Initialize(eSpawn);

  // move it 
  const FLOATmatrix3D &m = penDebris->GetRotationMatrix();
  ((CMovableEntity&)*penDebris).LaunchAsFreeProjectile( vLaunchSpeed*!m, (CMovableEntity*)penmhDestroyed);
  ((CMovableEntity&)*penDebris).SetDesiredRotation(aRotSpeed);

  return penDebris;
}

// info structure
static EntityInfo eiFlesh = {EIBT_FLESH};
static EntityInfo eiWater = {EIBT_WATER};
static EntityInfo eiRock  = {EIBT_ROCK };
static EntityInfo eiFire  = {EIBT_FIRE };
static EntityInfo eiAir   = {EIBT_AIR  };
static EntityInfo eiBones = {EIBT_BONES};
static EntityInfo eiWood  = {EIBT_WOOD };
static EntityInfo eiMetal = {EIBT_METAL};
static EntityInfo eiRobot = {EIBT_ROBOT};
static EntityInfo eiIce   = {EIBT_ICE  };
static EntityInfo eiGlass = {EIBT_GLASS};
static EntityInfo eiShadow = {EIBT_SHADOW};
static EntityInfo eiSmoke = {EIBT_SMOKE};

// get default entity info for given body type
EntityInfo *GetStdEntityInfo(EntityInfoBodyType eibt)
{
  switch(eibt) {
  case EIBT_FLESH: {return &eiFlesh; } break;
  case EIBT_WATER: {return &eiWater; } break;
  case EIBT_ROCK : {return &eiRock ; } break;
  case EIBT_FIRE : {return &eiFire ; } break;
  case EIBT_AIR  : {return &eiAir  ; } break;
  case EIBT_BONES: {return &eiBones; } break;
  case EIBT_WOOD : {return &eiWood ; } break;
  case EIBT_METAL: {return &eiMetal; } break;
  case EIBT_ROBOT: {return &eiRobot; } break;
  case EIBT_ICE  : {return &eiIce  ; } break;
  case EIBT_GLASS: {return &eiGlass; } break;
  case EIBT_SHADOW: {return &eiShadow; } break;
  case EIBT_SMOKE: {return &eiSmoke; } break;
  default:    {return NULL;} break;
  };
}



/************************************************************
 *                 DAMAGE CONTROL FUNCTIONS                 *
 ************************************************************/
// damage control functions
FLOAT DamageStrength(EntityInfoBodyType eibtBody, enum DamageType dtDamage)
{
  switch(eibtBody) {
  case EIBT_FLESH:
    return 1.0f;
  case EIBT_WATER:
    switch(dtDamage) {
    case DMT_CLOSERANGE:  return 0.0f;
    case DMT_BURNING:  return 0.0f;
    case DMT_DROWNING: return 0.0f;
    case DMT_SHARP:  return 0.0f;
    case DMT_BLUNT:  return 0.0f;
    case DMT_AXE:    return 0.0f;
    case DMT_STING:  return 0.0f;
    case DMT_PUNCH:  return 0.0f;
    }
    return 1.0f;
  case EIBT_ROCK :
    switch(dtDamage) {
    case DMT_CLOSERANGE:  return 0.0f;
    case DMT_BURNING:   return 0.0f;
    case DMT_FREEZING:  return 0.0f;
    case DMT_SHARP:  return 0.0f;
    case DMT_BLUNT:  return 0.0f;
    case DMT_AXE:    return 0.0f;
    case DMT_STING:  return 0.0f;
    case DMT_PUNCH:  return 0.0f;
    }
    return 1.0f;
  case EIBT_ICE :
    switch(dtDamage) {
    case DMT_CLOSERANGE:  return 0.5f;
    case DMT_BURNING:  return 3.0f;
    case DMT_FREEZING:  return 0.0f;
    case DMT_SHARP:  return 1.0f;
    case DMT_BLUNT:  return 0.5f;
    case DMT_AXE:    return 1.0f;
    case DMT_STING:  return 0.5f;
    case DMT_PUNCH:  return 0.75f;
    }
    return 1.0f;
  case EIBT_FIRE :
    switch(dtDamage) {
    case DMT_CLOSERANGE:  return 0.5f;
    case DMT_BURNING:   return 0.0f;
    case DMT_SHARP:  return 0.5f;
    case DMT_BLUNT:  return 0.5f;
    case DMT_AXE:    return 0.5f;
    case DMT_STING:  return 0.5f;
    case DMT_PUNCH:  return 0.5f;
    }
    return 1.0f;
  case EIBT_AIR  :
    switch(dtDamage) {
    case DMT_CLOSERANGE:  return 0.0f;
    case DMT_BURNING:   return 0.5f;
    }
    return 1.0f;
  case EIBT_BONES:
    switch(dtDamage) {
    case DMT_FREEZING:  return 0.0f;
    }
    return 1.0f;
  case EIBT_WOOD :
    switch(dtDamage) {
    case DMT_FREEZING:  return 0.0f;
    }
    return 1.0f;
  case EIBT_METAL:
    switch(dtDamage) {
    case DMT_CLOSERANGE:  return 0.0f;
    case DMT_BURNING:   return 0.0f;
    case DMT_FREEZING:  return 0.0f;
    }
    return 1.0f;
  case EIBT_ROBOT:
    switch(dtDamage) {
    case DMT_CLOSERANGE:return 0.5f;
    case DMT_BURNING:   return 0.5f;
    case DMT_FREEZING:  return 0.5f;
    }
    return 1.0f;
  case EIBT_GLASS:
    switch (dtDamage) {
    case DMT_CLOSERANGE: return 1.5f;
    case DMT_SHARP:  return 1.5f;
    case DMT_BLUNT:  return 1.5f;
    case DMT_AXE:    return 1.5f;
    }
    return 1.0f;
  case EIBT_SHADOW:
      switch (dtDamage) {
      case DMT_BURNING: return 1.5f;
      case DMT_SHARP:  return 0.0f;
      case DMT_BLUNT:  return 0.0f;
      case DMT_CLOSERANGE:  return 0.0f;
      case DMT_BULLET:  return 0.0f;
      case DMT_DROWNING:  return 0.0f;
      case DMT_FREEZING:  return 0.0f;
      case DMT_HEAT:  return 0.0f;
      case DMT_STING:  return 0.0f;
      case DMT_AXE:    return 0.0f;
      case DMT_CHAINSAW: return 0.0f;
      case DMT_PUNCH:  return 0.0f;
      }
      return 1.0f;
  case EIBT_SMOKE:
      switch (dtDamage) {
      case DMT_BURNING: return 0.5f;
      case DMT_SHARP:  return 0.0f;
      case DMT_BLUNT:  return 0.0f;
      case DMT_CLOSERANGE:  return 0.0f;
      case DMT_BULLET:  return 0.0f;
      case DMT_HEAT:  return 0.0f;
      case DMT_STING:  return 0.0f;
      case DMT_AXE:    return 0.0f;
      case DMT_CHAINSAW: return 0.0f;
      case DMT_PUNCH:  return 0.0f;
      }
      return 1.0f;
  default:
    ASSERT(FALSE);
    return 1.0f;
  }
}

// Print center screen message
void PrintCenterMessage(CEntity *penThis, CEntity *penCaused, 
  const CTString &strMessage, TIME tmLength, enum MessageSound mssSound, enum MessageFont mfFont, FLOAT fMsgPosX, FLOAT fMsgPosY)
{
  penCaused = FixupCausedToPlayer(penThis, penCaused);

  ECenterMessage eMsg;
  eMsg.strMessage = strMessage;
  eMsg.tmLength = tmLength;
  eMsg.mssSound = mssSound;
  eMsg.mfFont = mfFont;
  eMsg.fMessagePositionX = fMsgPosX;
  eMsg.fMessagePositionY = fMsgPosY;
  penCaused->SendEvent(eMsg);
}


// i.e. weapon sound when fireing or exploding
void SpawnRangeSound( CEntity *penPlayer, CEntity *penPos, enum SoundType st, FLOAT fRange)
{
  // if not really player
  if (!IsDerivedFromClass(penPlayer, "Player")) {
    // do nothing
    return;
  }
  // sound event
  ESound eSound;
  eSound.EsndtSound = st;
  eSound.penTarget = penPlayer;
  penPos->SendEventInRange( eSound, FLOATaabbox3D(penPos->GetPlacement().pl_PositionVector, fRange));
}

// get some player for trigger source if any is existing
CEntity *FixupCausedToPlayer(CEntity *penThis, CEntity *penCaused, BOOL bWarning/*=TRUE*/)
{
  if (penCaused!=NULL && IsOfClass(penCaused, "Player")) {
    return penCaused;
  }

  if (bWarning && (ent_bReportBrokenChains || GetSP()->sp_bQuickTest)) {
    CPrintF(TRANS("WARNING: Triggering chain broken, entity: %s-%s(%s)\n"), 
      (const char*)penThis->GetName(),
      (const char*)penThis->GetDescription(),
      (const char*)penThis->GetClass()->GetName());
  }

  INDEX ctPlayers = penThis->GetMaxPlayers();
  if (ctPlayers==0) {
    return NULL;
  }

  CEntity *penClosestPlayer = NULL;
  FLOAT fClosestPlayer = UpperLimit(0.0f);

  // for all players
  for (INDEX iPlayer=0; iPlayer<penThis->GetMaxPlayers(); iPlayer++) {
    CEntity *penPlayer = penThis->GetPlayerEntity(iPlayer);
    // if player exists
    if (penPlayer!=NULL) {
      // calculate distance to player
      FLOAT fDistance = 
        (penPlayer->GetPlacement().pl_PositionVector-penThis->GetPlacement().pl_PositionVector).Length();
      // update if closer
      if (fDistance<fClosestPlayer) {
        fClosestPlayer = fDistance;
        penClosestPlayer = penPlayer;
      }
    }
  }
  return penClosestPlayer;
}

// precisely lerp between two placement using quaternions
CPlacement3D LerpPlacementsPrecise(const CPlacement3D &pl0, const CPlacement3D &pl1, FLOAT fRatio)
{
  CPlacement3D pl;

  FLOATquat3D q0; q0.FromEuler(pl0.pl_OrientationAngle);
  FLOATquat3D q1; q1.FromEuler(pl1.pl_OrientationAngle);
  FLOAT3D v0 = pl0.pl_PositionVector;
  FLOAT3D v1 = pl1.pl_PositionVector;

  FLOATquat3D q = Slerp<FLOAT>(fRatio, q0, q1);
  FLOAT3D v = Lerp(v0, v1, fRatio);

  pl.pl_PositionVector = v;

  FLOATmatrix3D m;
  q.ToMatrix(m);
  DecomposeRotationMatrixNoSnap(pl.pl_OrientationAngle, m);

  return pl;
}

FLOAT GetGameDamageMultiplier(void)
{
  FLOAT fGameDamageMultiplier = 1.0f;
  FLOAT fExtraStrength = GetSP()->sp_fExtraEnemyStrength;
  if (fExtraStrength>0) {
    fGameDamageMultiplier*=1.0f/(1+fExtraStrength);
  }
  FLOAT fExtraStrengthPerPlayer = GetSP()->sp_fExtraEnemyStrengthPerPlayer;
  if (fExtraStrengthPerPlayer>0) {
    INDEX ctPlayers = _pNetwork->ga_sesSessionState.GetPlayersCount();
    fGameDamageMultiplier*=1.0f/(1+fExtraStrengthPerPlayer*ClampDn(ctPlayers-1.0f, 0.0f));
  }
  if (GetSP()->sp_gdGameDifficulty==CSessionProperties::GD_TOURIST) {
    fGameDamageMultiplier *= 2.0f;
  }
  return fGameDamageMultiplier;
}


// get entity's serious damage multiplier
FLOAT GetSeriousDamageMultiplier( CEntity *pen)
{
  if( !IsOfClass(pen,"Player")) return 1.0f;
  return 1.0f;
}

class CWorldSettingsController *GetWSC(CEntity *pen)
{
  CWorldSettingsController *pwsc = NULL;
  // obtain bcg viewer
  class CBackgroundViewer *penBcgViewer = (CBackgroundViewer *) pen->GetWorld()->GetBackgroundViewer();
  if( penBcgViewer != NULL) {
    // obtain world settings controller 
    pwsc = (CWorldSettingsController *) &*penBcgViewer->m_penWorldSettingsController;
  }
  return pwsc;
}
