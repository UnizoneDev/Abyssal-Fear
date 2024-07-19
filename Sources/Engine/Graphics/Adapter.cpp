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

#include "stdh.h"

#include <Engine/Graphics/Adapter.h>
#include <Engine/Graphics/GfxLibrary.h>
#include <Engine/Base/Translation.h>
#include <Engine/Base/Console.h>


extern BOOL _bDedicatedServer;

// list of all modes avaliable through CDS
static CListHead _lhCDSModes;

class CResolution {
public:
  PIX   re_pixSizeI;
  PIX   re_pixSizeJ;
};

static CResolution _areResolutions[] =
{
  {  320,  240 },
  {  400,  300 },
  {  480,  360 },
  {  512,  384 },
  {  640,  480 },
  {  720,  540 },
  {  720,  576 },
  {  800,  600 },
  {  960,  720 },
  { 1024,  768 },
  { 1152,  864 },
  { 1280,  960 },
  { 1280, 1024 },
  { 1600, 1200 },
  { 1792, 1344 },
  { 1856, 1392 },
  { 1920, 1440 },
  { 2048, 1536 },

  // matrox dualhead modes
  { 1280,  480 },
  { 1600,  600 },
  { 2048,  768 },

  // NTSC HDTV widescreen
  {  848,  480 },
  {  856,  480 },
  {  1280, 720 },
  {  1920, 1080 },
  {  2560, 1440 },
};
// THIS NUMBER MUST NOT BE OVER 26! (otherwise change it in adapter.h)
static const INDEX MAX_RESOLUTIONS = sizeof(_areResolutions)/sizeof(_areResolutions[0]);



// initialize CDS support (enumerate modes at startup)
void CGfxLibrary::InitAPIs(void)
{
  // no need for gfx when dedicated server is on
  if( _bDedicatedServer) return;

  CDisplayAdapter *pda;
  INDEX iResolution;

  // detect current mode and print to console
  DEVMODE devmode;
  memset( &devmode, 0, sizeof(devmode));
  devmode.dmSize = sizeof(devmode);
  LONG lRes = EnumDisplaySettings(NULL, ENUM_CURRENT_SETTINGS, &devmode);
  CPrintF( TRANS("Current display: '%s' version %d - %dx%dx%d\n\n"), 
           devmode.dmDeviceName, devmode.dmDriverVersion,
           devmode.dmPelsWidth, devmode.dmPelsHeight, devmode.dmBitsPerPel);

  // fill OpenGL adapter info
  gl_gaAPI[GAT_OGL].ga_ctAdapters = 1;
  gl_gaAPI[GAT_OGL].ga_iCurrentAdapter = 0;
  pda = &gl_gaAPI[GAT_OGL].ga_adaAdapter[0];
  pda->da_ulFlags = DAF_USEGDIFUNCTIONS;
  pda->da_strVendor   = TRANS( "unknown");
  pda->da_strRenderer = TRANS( "Default ICD");
  pda->da_strVersion  = "1.1+";

  // detect modes for OpenGL ICD
  pda->da_ctDisplayModes = 0;
  pda->da_iCurrentDisplayMode = -1;

  // enumerate modes thru resolution list
  for( iResolution=0; iResolution<MAX_RESOLUTIONS; iResolution++)
  {
    DEVMODE devmode;
    memset( &devmode, 0, sizeof(devmode));
    CResolution &re = _areResolutions[iResolution];

    // ask windows if they could set the mode
    devmode.dmSize = sizeof(devmode);
    devmode.dmPelsWidth  = re.re_pixSizeI;
    devmode.dmPelsHeight = re.re_pixSizeJ;
    devmode.dmDisplayFlags = CDS_FULLSCREEN;
    devmode.dmFields = DM_PELSWIDTH|DM_PELSHEIGHT|DM_DISPLAYFLAGS;
    LONG lRes = ChangeDisplaySettings( &devmode, CDS_TEST|CDS_FULLSCREEN);
    // skip if not successfull
    if( lRes!=DISP_CHANGE_SUCCESSFUL) continue;

    // make a new display mode
    CDisplayMode &dm = pda->da_admDisplayModes[pda->da_ctDisplayModes];
    dm.dm_pixSizeI = re.re_pixSizeI;
    dm.dm_pixSizeJ = re.re_pixSizeJ;
    dm.dm_ddDepth  = DD_DEFAULT;
    pda->da_ctDisplayModes++;
  }

  // detect presence of 3Dfx standalone OpenGL driver (for Voodoo1/2)
  char *strDummy;
  char  strBuffer[_MAX_PATH+1];
  int iRes = SearchPathA( NULL, "3DFXVGL.DLL", NULL, _MAX_PATH, strBuffer, &strDummy);
  // if present
  if(iRes) {
    // set adapter and force some enumeration of voodoo1/2 display modes
    gl_gaAPI[GAT_OGL].ga_ctAdapters++;
    pda = &gl_gaAPI[GAT_OGL].ga_adaAdapter[1];
    pda->da_ctDisplayModes = 4; // voodoos have only 4 display modes
    pda->da_ulFlags = DAF_ONEWINDOW | DAF_FULLSCREENONLY | DAF_16BITONLY;
    pda->da_strVendor   = "3Dfx";
    pda->da_strRenderer = "3Dfx Voodoo2";
    pda->da_strVersion  = "1.1+";
    CDisplayMode *adm = &pda->da_admDisplayModes[0];
    adm[0].dm_pixSizeI =  512;  adm[0].dm_pixSizeJ = 384;  adm[0].dm_ddDepth = DD_16BIT;
    adm[1].dm_pixSizeI =  640;  adm[1].dm_pixSizeJ = 480;  adm[1].dm_ddDepth = DD_16BIT;
    adm[2].dm_pixSizeI =  800;  adm[2].dm_pixSizeJ = 600;  adm[2].dm_ddDepth = DD_16BIT;
    adm[3].dm_pixSizeI = 1024;  adm[3].dm_pixSizeJ = 768;  adm[3].dm_ddDepth = DD_16BIT;
  }
}

// get list of all modes avaliable through CDS -- do not modify/free the returned list
CListHead &CDS_GetModes(void)
{
  return _lhCDSModes;
}


// set given display mode
BOOL CDS_SetMode( PIX pixSizeI, PIX pixSizeJ, enum DisplayDepth dd)
{
  // no need for gfx when dedicated server is on
  if( _bDedicatedServer) return FALSE;

  // prepare general mode parameters
  DEVMODE devmode;
  memset(&devmode, 0, sizeof(devmode));
  devmode.dmSize = sizeof(devmode);
  devmode.dmPelsWidth  = pixSizeI;
  devmode.dmPelsHeight = pixSizeJ;
  devmode.dmDisplayFlags = CDS_FULLSCREEN;
  devmode.dmFields = DM_PELSWIDTH|DM_PELSHEIGHT|DM_DISPLAYFLAGS;
  extern INDEX gap_iRefreshRate;
  if( gap_iRefreshRate>0) {
    devmode.dmFields |= DM_DISPLAYFREQUENCY;
    devmode.dmDisplayFrequency = gap_iRefreshRate;
  }
  // determine bits per pixel to try to set
  SLONG slBPP2 = 0;
  switch(dd) {
  case DD_16BIT:
    devmode.dmBitsPerPel = 16;
    slBPP2 = 15;
    devmode.dmFields |= DM_BITSPERPEL;
    break;
  case DD_32BIT:
    devmode.dmBitsPerPel = 32;
    slBPP2 = 24;
    devmode.dmFields |= DM_BITSPERPEL;
    break;
  case DD_DEFAULT:
    NOTHING;
    break;
  default:
    ASSERT(FALSE);
    NOTHING;
  }

  // try to set primary depth
  LONG lRes = ChangeDisplaySettings(&devmode, CDS_FULLSCREEN);

  // if failed
  if( lRes!=DISP_CHANGE_SUCCESSFUL) {
    // try to set secondary depth
    devmode.dmBitsPerPel = slBPP2;
    LONG lRes2 = ChangeDisplaySettings(&devmode, CDS_FULLSCREEN);
    // if failed
    if( lRes2!=DISP_CHANGE_SUCCESSFUL) {
      CTString strError;
      switch(lRes) {
      case DISP_CHANGE_SUCCESSFUL:  strError = "DISP_CHANGE_SUCCESSFUL"; break;
      case DISP_CHANGE_RESTART:     strError = "DISP_CHANGE_RESTART"; break;
      case DISP_CHANGE_BADFLAGS:    strError = "DISP_CHANGE_BADFLAGS"; break;
      case DISP_CHANGE_BADPARAM:    strError = "DISP_CHANGE_BADPARAM"; break;
      case DISP_CHANGE_FAILED:      strError = "DISP_CHANGE_FAILED"; break;
      case DISP_CHANGE_BADMODE:     strError = "DISP_CHANGE_BADMODE"; break;
      case DISP_CHANGE_NOTUPDATED:  strError = "DISP_CHANGE_NOTUPDATED"; break;
      default: strError.PrintF("%d", lRes); break;
      }
      CPrintF(TRANS("CDS error: %s\n"), strError);
      return FALSE;
    }
  }
  // report
  CPrintF(TRANS("  CDS: mode set to %dx%dx%d\n"), pixSizeI, pixSizeJ, devmode.dmBitsPerPel);
  return TRUE;
}


// reset windows to mode chosen by user within windows diplay properties
void CDS_ResetMode(void)
{
  // no need for gfx when dedicated server is on
  if( _bDedicatedServer) return;

  LONG lRes = ChangeDisplaySettings( NULL, 0);
  ASSERT(lRes==DISP_CHANGE_SUCCESSFUL);
  CPrintF(TRANS("  CDS: mode reset to original desktop settings\n"));
}
