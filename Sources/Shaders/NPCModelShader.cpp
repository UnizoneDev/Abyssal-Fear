/* Copyright (c) 2021-2024 Uni Musuotankarep
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
#define UVMAPS_COUNT  1
#define COLOR_COUNT   2
#define FLOAT_COUNT   0
#define FLAGS_COUNT   3

#define BASE_TEXTURE 0
#define BASE_UVMAP   0
#define BASE_COLOR   0
#define OVERLAY_TEXTURE 1
#define OVERLAY_COLOR   1

SHADER_MAIN(NPCModel)
{
    shaSetTexture(BASE_TEXTURE);
    shaSetTextureWrapping(GFX_REPEAT, GFX_REPEAT);
    shaSetUVMap(BASE_UVMAP);
    shaSetColor(BASE_COLOR);
    shaEnableDepthTest();
    shaDepthFunc(GFX_LESS_EQUAL);

    COLOR colModelColor = MulColors(shaGetModelColor(), shaGetCurrentColor());
    BOOL bDoubleSided = shaGetFlags() & BASE_DOUBLE_SIDED;
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

    // do overlay pass
    shaBlendFunc(GFX_SRC_ALPHA, GFX_INV_SRC_ALPHA);
    shaSetTexture(OVERLAY_TEXTURE);
    shaSetColor(OVERLAY_COLOR);
    shaCalculateLight();

    shaEnableBlend();

    shaRender();
    shaDisableBlend();

    if (shaOverBrightningEnabled()) shaSetTextureModulation(1);
}

SHADER_DESC(NPCModel, ShaderDesc& shDesc)
{
    shDesc.sd_astrTextureNames.New(TEXTURE_COUNT);
    shDesc.sd_astrTexCoordNames.New(UVMAPS_COUNT);
    shDesc.sd_astrColorNames.New(COLOR_COUNT);
    shDesc.sd_astrFloatNames.New(FLOAT_COUNT);
    shDesc.sd_astrFlagNames.New(FLAGS_COUNT);

    shDesc.sd_astrTextureNames[0] = "Base texture";
    shDesc.sd_astrTextureNames[1] = "Overlay texture";
    shDesc.sd_astrTexCoordNames[0] = "Base uvmap";
    shDesc.sd_astrColorNames[0] = "Base color";
    shDesc.sd_astrColorNames[1] = "Overlay color";
    shDesc.sd_astrFlagNames[0] = "Double sided";
    shDesc.sd_astrFlagNames[1] = "Full bright";
    shDesc.sd_astrFlagNames[2] = "Flat shaded";
    shDesc.sd_strShaderInfo = "NPC Model shader";
}
