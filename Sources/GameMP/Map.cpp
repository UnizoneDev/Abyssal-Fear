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

#include "stdafx.h"
#include "LCDDrawing.h"

static CTextureObject atoIconsUZ[26];

PIX aIconCoordsUZ[][2] =
{
  {0, 0},      // 00: Limbo Industrial District
  {0, 0},      // 01: Limbo Caves
  {0, 0},      // 02: Limbo Maze
  {0, 0},      // 03: Limbo Temple
  {0, 0},      // 04: Limbo Control Center
  {0, 0},      // 05: Lust Caves
  {0, 0},      // 06: Lust Sewers
  {0, 0},      // 07: Lust Hills
  {0, 0},      // 08: Lust Town
  {0, 0},      // 09: Gluttony Caves
  {0, 0},      // 10: Gluttony Valley
  {0, 0},      // 11: Gluttony Slaughterhouse
  {0, 0},      // 12: Greed Start
  {0, 0},      // 13: Greed End
  {0, 0},      // 14: Wrath Start
  {0, 0},      // 15: Wrath Dungeon
  {0, 0},      // 16: Wrath End
  {0, 0},      // 17: Heresy Start
  {0, 0},      // 18: Heresy End
  {0, 0},      // 19: Violence Start
  {0, 0},      // 20: Violence Traps
  {0, 0},      // 21: Violence End
  {0, 0},      // 22: Fraud Start
  {0, 0},      // 23: Fraud Caves
  {0, 0},      // 24: Fraud End
  {0, 0},      // 25: Treachery Start
  {0, 0},      // 26: Treachery Lair
};

#define LIMBO01_BIT 0
#define LIMBO02_BIT 1
#define LIMBO03_BIT 2
#define LIMBO04_BIT 3
#define LIMBO05_BIT 4
#define LUST01_BIT 5
#define LUST02_BIT 6
#define LUST03_BIT 7
#define LUST04_BIT 8
#define GLUTTONY01_BIT 9
#define GLUTTONY02_BIT 10
#define GLUTTONY03_BIT 11
#define GREED01_BIT 12
#define GREED02_BIT 13
#define WRATH01_BIT 14
#define WRATH02_BIT 15
#define WRATH03_BIT 16
#define HERESY01_BIT 17
#define HERESY02_BIT 18
#define VIOLENCE01_BIT 19
#define VIOLENCE02_BIT 20
#define VIOLENCE03_BIT 21
#define FRAUD01_BIT 22
#define FRAUD02_BIT 23
#define FRAUD03_BIT 24
#define TREACHERY01_BIT 25
#define TREACHERY02_BIT 26

INDEX  aPathPrevNextLevelsUZ[][2] =
{
  {LIMBO01_BIT, LIMBO02_BIT},      // 00
  {LIMBO02_BIT, LIMBO03_BIT},       // 01
  {LIMBO03_BIT, LIMBO04_BIT},   // 02
  {LIMBO04_BIT, LIMBO05_BIT},   // 03
  {LIMBO05_BIT, LUST01_BIT}, // 04
  {LUST01_BIT, LUST02_BIT}, // 05
  {LUST02_BIT, LUST03_BIT},      // 06
  {LUST03_BIT, LUST04_BIT},             // 07
  {LUST04_BIT, GLUTTONY01_BIT},            // 08
  {GLUTTONY01_BIT, GLUTTONY02_BIT},             // 09
  {GLUTTONY02_BIT, GLUTTONY03_BIT},               // 10
  {GLUTTONY03_BIT, GREED01_BIT},                 // 11
  {GREED01_BIT, GREED02_BIT},               // 12
  {GREED02_BIT, WRATH01_BIT}, // 13
  {WRATH01_BIT, WRATH02_BIT},      // 14
  {WRATH02_BIT, WRATH03_BIT},             // 15
  {WRATH03_BIT, HERESY01_BIT},                 // 16
  {HERESY01_BIT, HERESY02_BIT},                 // 17
  {HERESY02_BIT, VIOLENCE01_BIT},            // 18
  {VIOLENCE01_BIT, VIOLENCE02_BIT},             // 19
  {VIOLENCE02_BIT, VIOLENCE03_BIT},               // 20
  {VIOLENCE03_BIT, FRAUD01_BIT},                 // 21
  {FRAUD01_BIT, FRAUD02_BIT},            // 22
  {FRAUD02_BIT, FRAUD03_BIT},             // 23
  {FRAUD03_BIT, TREACHERY01_BIT},               // 24
  {TREACHERY01_BIT, TREACHERY02_BIT},                 // 25
};

BOOL ObtainMapData(void)
{
    try {
        // the second encounter
        atoIconsUZ[0].SetData_t(CTFILENAME("Levels\\LevelsMP\\LimboStart.tex"));
        atoIconsUZ[1].SetData_t(CTFILENAME("Levels\\LevelsMP\\LimboCave.tex"));
        atoIconsUZ[2].SetData_t(CTFILENAME("Levels\\LevelsMP\\LimboTemple.tex"));
        atoIconsUZ[3].SetData_t(CTFILENAME("Levels\\LevelsMP\\LimboNearEnd.tex"));
        atoIconsUZ[4].SetData_t(CTFILENAME("Levels\\LevelsMP\\LimboEnd.tex"));
        atoIconsUZ[5].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level05.tex"));
        atoIconsUZ[6].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level06.tex"));
        atoIconsUZ[7].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level07.tex"));
        atoIconsUZ[8].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level08.tex"));
        atoIconsUZ[9].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level09.tex"));
        atoIconsUZ[10].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level10.tex"));
        atoIconsUZ[11].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level11.tex"));
        atoIconsUZ[12].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level12.tex"));
        atoIconsUZ[13].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level13.tex"));
        atoIconsUZ[14].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level14.tex"));
        atoIconsUZ[15].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level15.tex"));
        atoIconsUZ[16].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level16.tex"));
        atoIconsUZ[17].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level17.tex"));
        atoIconsUZ[18].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level18.tex"));
        atoIconsUZ[19].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level19.tex"));
        atoIconsUZ[20].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level20.tex"));
        atoIconsUZ[21].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level21.tex"));
        atoIconsUZ[22].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level22.tex"));
        atoIconsUZ[23].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level23.tex"));
        atoIconsUZ[24].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level24.tex"));
        atoIconsUZ[25].SetData_t(CTFILENAME("TexturesMP\\Computer\\Map\\Level25.tex"));
        // force constant textures
        ((CTextureData*)atoIconsUZ[0].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[1].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[2].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[3].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[4].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[5].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[6].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[7].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[8].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[9].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[10].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[11].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[12].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[13].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[14].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[15].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[16].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[17].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[18].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[19].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[20].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[21].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[22].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[23].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[24].GetData())->Force(TEX_CONSTANT);
        ((CTextureData*)atoIconsUZ[25].GetData())->Force(TEX_CONSTANT);
    }
    catch (char* strError) {
        CPrintF("%s\n", strError);
        return FALSE;
    }
    return TRUE;
}

void ReleaseMapData(void)
{
    atoIconsUZ[0].SetData(NULL);
    atoIconsUZ[1].SetData(NULL);
    atoIconsUZ[2].SetData(NULL);
    atoIconsUZ[3].SetData(NULL);
    atoIconsUZ[4].SetData(NULL);
    atoIconsUZ[5].SetData(NULL);
    atoIconsUZ[6].SetData(NULL);
    atoIconsUZ[7].SetData(NULL);
    atoIconsUZ[8].SetData(NULL);
    atoIconsUZ[9].SetData(NULL);
    atoIconsUZ[10].SetData(NULL);
    atoIconsUZ[11].SetData(NULL);
    atoIconsUZ[12].SetData(NULL);
    atoIconsUZ[13].SetData(NULL);
    atoIconsUZ[14].SetData(NULL);
    atoIconsUZ[15].SetData(NULL);
    atoIconsUZ[16].SetData(NULL);
    atoIconsUZ[17].SetData(NULL);
    atoIconsUZ[18].SetData(NULL);
    atoIconsUZ[19].SetData(NULL);
    atoIconsUZ[20].SetData(NULL);
    atoIconsUZ[21].SetData(NULL);
    atoIconsUZ[22].SetData(NULL);
    atoIconsUZ[23].SetData(NULL);
    atoIconsUZ[24].SetData(NULL);
    atoIconsUZ[25].SetData(NULL);
}

void RenderMap(CDrawPort* pdp, ULONG ulLevelMask, CProgressHookInfo* pphi)
{
    if (!ObtainMapData())
    {
        ReleaseMapData();
        return;
    }

    PIX(*aIconCoords)[2] = aIconCoordsUZ;
    CTextureObject* atoIcons = atoIconsUZ;
    INDEX(*aPathPrevNextLevels)[2] = aPathPrevNextLevelsUZ;

    CTextureObject* atoUZIcons = atoIconsUZ;

    INDEX ctLevels = ARRAYCOUNT(aIconCoordsUZ);

    PIX pixdpw = pdp->GetWidth();
    PIX pixdph = pdp->GetHeight();
    PIX imgw = 512;
    PIX imgh = 480;
    FLOAT fStretch = 0.25f;

    // determine max available picture stretch
    if (pixdpw >= imgw * 2 && pixdph >= imgh * 2) {
        fStretch = 2.0f;
    }
    else if (pixdpw >= imgw && pixdph >= imgh) {
        fStretch = 1.0f;
    }
    else if (pixdpw >= imgw / 2 && pixdph >= imgh / 2) {
        fStretch = 0.5f;
    }

    // calculate LU offset so picture would be centerd in dp
    PIX pixSX = (pixdpw - imgw * fStretch) / 2;
    PIX pixSY = Max(PIX((pixdph - imgh * fStretch) / 2), PIX(0));

    PIX pixC1S = pixSX;                       // column 1 start pixel
    PIX pixR1S = pixSY;                       // raw 1 start pixel

    for (INDEX iIcon = 0; iIcon < ctLevels; iIcon++)
    {
        // if level's icon should be rendered
        if (ulLevelMask & (1UL << iIcon))
        {
            PIX pixX = aIconCoords[iIcon][0] * fStretch + pixC1S;
            PIX pixY = aIconCoords[iIcon][1] * fStretch + pixR1S;
            CTextureObject* pto = &atoIcons[iIcon];
            PIX pixImgW = ((CTextureData*)pto->GetData())->GetPixWidth() * fStretch;
            PIX pixImgH = ((CTextureData*)pto->GetData())->GetPixHeight() * fStretch;
            pdp->PutTexture(pto, PIXaabbox2D(PIX2D(pixX, pixY), PIX2D(pixX + pixImgW, pixY + pixImgH)), C_WHITE | 255);
        }
    }

    if (pphi != NULL)
    {
        // set font
        pdp->SetFont(_pfdDisplayFont);
        pdp->SetTextScaling(fStretch);
        pdp->SetTextAspect(1.0f);

        INDEX iPosX, iPosY;
        COLOR colText = RGBToColor(200, 128, 56) | CT_OPAQUE;

        iPosX = 200;
        iPosY = 330;

        PIX pixhtcx = pixC1S + iPosX * fStretch;
        PIX pixhtcy = pixR1S + iPosY * fStretch;

        pdp->PutTextC(pphi->phi_strDescription, pixhtcx, pixhtcy, colText);
    }

    // free textures used in map rendering
    ReleaseMapData();
}
