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

#define TEXTURE_COUNT 3
#define UVMAPS_COUNT  3
#define COLOR_COUNT   3
#define FLOAT_COUNT   3
#define FLAGS_COUNT   2

#define BASE_TEXTURE 0
#define BASE_UVMAP   0
#define BASE_COLOR   0
#define BASE_FLOAT   0
#define DETAIL_TEXTURE 1
#define DETAIL_UVMAP   1
#define DETAIL_COLOR   1
#define DETAIL_TILING  0
#define DISTORTION_TEXTURE 2
#define DISTORTION_UVMAP   2
#define DISTORTION_COLOR   2
#define DISTORTION_TILING  1
#define DISTORTION_AMOUNT  2

SHADER_MAIN(Distortion)
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
    }
    else {
        shaCullFace(GFX_BACK);
    }

    shaCalculateLight();

    // if fully opaque
    if (bOpaque) {
        shaDisableBlend();
        shaEnableDepthWrite();
        // if translucent
    }
    else {
        shaEnableBlend();
        shaBlendFunc(GFX_SRC_ALPHA, GFX_INV_SRC_ALPHA);
        shaDisableDepthWrite();
        shaModifyColorForFog();
    }

    if (shaOverBrightningEnabled()) shaSetTextureModulation(2);

    shaRender();

    if (bOpaque) {
        shaDoFogPass();
    }

    // do detail pass
    FLOAT fMulDetail = shaGetFloat(DETAIL_TILING);
    shaBlendFunc(GFX_DST_COLOR, GFX_SRC_COLOR);
    shaSetTexture(DETAIL_TEXTURE);
    shaSetUVMap(DETAIL_UVMAP);
    shaSetColor(DETAIL_COLOR);
    shaCalculateLight();
    shaEnableBlend();

    GFXTexCoord* ptxcOld = shaGetUVMap(0);
    GFXTexCoord* ptxcNew = shaGetNewTexCoordArray();
    INDEX ctTexCoords = shaGetVertexCount();

    if (ctTexCoords > 0)
    {
        for (INDEX itxc = 0; itxc < ctTexCoords; itxc++)
        {
            ptxcNew[itxc].u = ptxcOld[itxc].u * fMulDetail;
            ptxcNew[itxc].v = ptxcOld[itxc].v * fMulDetail;
        }

        shaSetTexCoords(ptxcNew);
    }

    shaRender();
    shaDisableBlend();

    // do distortion pass
    FLOAT fMulDistortion = shaGetFloat(DISTORTION_TILING);
    FLOAT fDistortionAmount = shaGetFloat(DISTORTION_AMOUNT);
    shaBlendFunc(GFX_INV_DST_COLOR, GFX_INV_SRC_COLOR);
    shaSetTexture(DISTORTION_TEXTURE);
    shaSetUVMap(DISTORTION_UVMAP);
    shaSetColor(DISTORTION_COLOR);
    shaCalculateLight();
    shaEnableBlend();

    if (ctTexCoords > 0)
    {
        for (INDEX itxc = 0; itxc < ctTexCoords; itxc++)
        {
            ptxcNew[itxc].u = ptxcOld[itxc].v * fMulDistortion * sin((ptxcNew[itxc].u + (_pTimer->GetLerpedCurrentTick() * fDistortionAmount)));
            ptxcNew[itxc].v = ptxcOld[itxc].u * fMulDistortion * sin((ptxcNew[itxc].v + (_pTimer->GetLerpedCurrentTick() * fDistortionAmount)));
        }

        shaSetTexCoords(ptxcNew);
    }

    shaRender();
    shaDisableBlend();

    if (shaOverBrightningEnabled()) shaSetTextureModulation(1);
}

SHADER_DESC(Distortion, ShaderDesc& shDesc)
{
    shDesc.sd_astrTextureNames.New(TEXTURE_COUNT);
    shDesc.sd_astrTexCoordNames.New(UVMAPS_COUNT);
    shDesc.sd_astrColorNames.New(COLOR_COUNT);
    shDesc.sd_astrFloatNames.New(FLOAT_COUNT);
    shDesc.sd_astrFlagNames.New(FLAGS_COUNT);

    shDesc.sd_astrTextureNames[0] = "Base texture";
    shDesc.sd_astrTextureNames[1] = "Detail texture";
    shDesc.sd_astrTextureNames[2] = "Distortion texture";
    shDesc.sd_astrTexCoordNames[0] = "Base uvmap";
    shDesc.sd_astrTexCoordNames[1] = "Detail uvmap";
    shDesc.sd_astrTexCoordNames[2] = "Distortion uvmap";
    shDesc.sd_astrColorNames[0] = "Base color";
    shDesc.sd_astrColorNames[1] = "Detail color";
    shDesc.sd_astrColorNames[2] = "Distortion color";
    shDesc.sd_astrFloatNames[0] = "Detail UVMap factor";
    shDesc.sd_astrFloatNames[1] = "Distortion UVMap factor";
    shDesc.sd_astrFloatNames[2] = "Distortion warp amount";
    shDesc.sd_astrFlagNames[0] = "Double sided";
    shDesc.sd_astrFlagNames[1] = "Full bright";
    shDesc.sd_strShaderInfo = "Distortion shader";
}
