/* Copyright (c) 2021-2023 Uni Musuotankarep
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
#include <Shaders/Common.h>

#define TEXTURE_COUNT 2
#define UVMAPS_COUNT  2
#define COLOR_COUNT   2
#define FLOAT_COUNT   2
#define FLAGS_COUNT   2

#define BASE_TEXTURE  0
#define BASE_UVMAP    0
#define BASE_COLOR    0
#define FLOAT_WARP_AMOUNT 0
#define FLOAT_WARP_FREQUENCY 1

#define DETAIL_TEXTURE  1
#define DETAIL_UVMAP    1
#define DETAIL_COLOR    1

SHADER_MAIN(ShadowWarp)
{
    shaSetTexture(BASE_TEXTURE);
    shaSetTextureWrapping(GFX_REPEAT, GFX_REPEAT);
    shaSetUVMap(BASE_UVMAP);
    shaSetColor(BASE_COLOR);
    shaEnableDepthTest();
    shaDepthFunc(GFX_LESS_EQUAL);

    COLOR colModelColor = MulColors(shaGetModelColor(), shaGetCurrentColor());
    BOOL bDoubleSided = shaGetFlags() & BASE_DOUBLE_SIDED;
    BOOL bFullBright = shaGetFlags() & BASE_FULL_BRIGHT;
    BOOL bOpaque = (colModelColor & 0xFF) == 0xFF;

    if (bDoubleSided) {
        shaCullFace(GFX_NONE);
    } else {
        shaCullFace(GFX_BACK);
    }

    shaCalculateLight();

    if (shaOverBrightningEnabled()) shaSetTextureModulation(2);

    // if fully opaque
    if (bOpaque) {
        shaDisableBlend();
        shaEnableDepthWrite();
        // if translucent
    } else {
        shaEnableBlend();
        shaBlendFunc(GFX_SRC_ALPHA, GFX_INV_SRC_ALPHA);
        shaDisableDepthWrite();
        shaModifyColorForFog();
    }

    // displace geometry
    GFXVertex* paVertices = shaGetVertexArray();
    GFXVertex* paNewVertices = shaGetNewVertexArray();
    INDEX ctVertices = shaGetVertexCount();
    FLOAT fWarpAmount = shaGetFloat(FLOAT_WARP_AMOUNT);
    FLOAT fWarpFrequency = shaGetFloat(FLOAT_WARP_FREQUENCY);
    Matrix12& mInvAbsToViewer = *shaGetObjToAbsMatrix();
    Matrix12 mAbsToView;
    MatrixTranspose(mAbsToView, mInvAbsToViewer);

    // for each vertex
    for (INDEX ivx = 0; ivx < ctVertices; ivx++) {
        paNewVertices[ivx] = paVertices[ivx];

        TransformVertex(paNewVertices[ivx], mInvAbsToViewer);
        paNewVertices[ivx].x *= 1.0f + fWarpAmount * sin((paNewVertices[ivx].y + (_pTimer->GetLerpedCurrentTick() * fWarpFrequency)));
        paNewVertices[ivx].z *= 1.0f + fWarpAmount * sin((paNewVertices[ivx].y + (_pTimer->GetLerpedCurrentTick() * fWarpFrequency)));
        paNewVertices[ivx].y *= 1.0f + fWarpAmount * sin((paNewVertices[ivx].x + (_pTimer->GetLerpedCurrentTick() * fWarpFrequency)));
        paNewVertices[ivx].y *= 1.0f + fWarpAmount * sin((paNewVertices[ivx].z + (_pTimer->GetLerpedCurrentTick() * fWarpFrequency)));
        TransformVertex(paNewVertices[ivx], mAbsToView);
    }

    shaSetVertexArray(paNewVertices, ctVertices);

    shaRender();

    if (bOpaque) {
        shaDoFogPass();
    }

    shaBlendFunc(GFX_DST_COLOR, GFX_SRC_COLOR);
    shaSetTexture(DETAIL_TEXTURE);
    shaSetUVMap(DETAIL_UVMAP);
    shaSetColor(DETAIL_COLOR);
    shaCalculateLight();

    shaEnableBlend();

    GFXTexCoord *ptxcOld = shaGetUVMap(0);
    GFXTexCoord *ptxcNew = shaGetNewTexCoordArray();
    INDEX ctTexCoords = shaGetVertexCount();

    if (ctTexCoords > 0)
    {
        for (INDEX itxc = 0; itxc < ctTexCoords; itxc++)
        {
            ptxcNew[itxc].u = ptxcOld[itxc].u * fWarpAmount * sin((ptxcNew[itxc].u + (_pTimer->GetLerpedCurrentTick() * fWarpFrequency)));
            ptxcNew[itxc].v = ptxcOld[itxc].v * fWarpAmount * sin((ptxcNew[itxc].v + (_pTimer->GetLerpedCurrentTick() * fWarpFrequency)));
        }

        shaSetTexCoords(ptxcNew);
    }

    shaRender();
    shaDisableBlend();

    if (shaOverBrightningEnabled()) shaSetTextureModulation(1);
}

SHADER_DESC(ShadowWarp, ShaderDesc& shDesc)
{
    shDesc.sd_astrTextureNames.New(TEXTURE_COUNT);
    shDesc.sd_astrTexCoordNames.New(UVMAPS_COUNT);
    shDesc.sd_astrColorNames.New(COLOR_COUNT);
    shDesc.sd_astrFloatNames.New(FLOAT_COUNT);
    shDesc.sd_astrFlagNames.New(FLAGS_COUNT);

    shDesc.sd_astrTextureNames[0] = "Base texture";
    shDesc.sd_astrTextureNames[1] = "Detail texture";
    shDesc.sd_astrTexCoordNames[0] = "Base uvmap";
    shDesc.sd_astrTexCoordNames[1] = "Detail uvmap";
    shDesc.sd_astrColorNames[0] = "Base color";
    shDesc.sd_astrColorNames[1] = "Detail color";
    shDesc.sd_astrFloatNames[0] = "Warp amount";
    shDesc.sd_astrFloatNames[1] = "Warp frequency";
    shDesc.sd_astrFlagNames[0] = "Double sided";
    shDesc.sd_astrFlagNames[1] = "Full bright";
    shDesc.sd_strShaderInfo = "Shadow warp shader";
}